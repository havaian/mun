const { Session } = require('./model');
const { Committee } = require('../committee/model');
const { emitToCommittee } = require('../websocket/socketManager');

// Session Management Controllers

// Create new session
const createSession = async (req, res) => {
    try {
        const {
            committeeId,
            title,
            sessionNumber,
            sessionDuration = 7200 // default 2 hours
        } = req.body;

        // Verify committee exists and user has access
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check if user can create sessions for this committee
        if (req.user.committeeId.toString() !== committeeId.toString()) {
            return res.status(403).json({
                error: 'Access denied. You can only create sessions for your assigned committee.'
            });
        }

        // Check if there's already an active session
        const activeSession = await Session.findOne({
            committeeId,
            status: { $in: ['active', 'paused'] }
        });

        if (activeSession) {
            return res.status(400).json({
                error: 'An active session already exists for this committee',
                activeSessionId: activeSession._id
            });
        }

        // Calculate session number
        let finalSessionNumber;
        if (sessionNumber) {
            const existingSession = await Session.findOne({
                committeeId,
                number: sessionNumber
            });
            if (existingSession) {
                return res.status(400).json({
                    error: `Session number ${sessionNumber} already exists`
                });
            }
            finalSessionNumber = sessionNumber;
        } else {
            const lastSession = await Session.findOne({ committeeId })
                .sort({ number: -1 })
                .select('number');
            finalSessionNumber = (lastSession?.number || 0) + 1;
        }

        // Initialize attendance from committee countries
        const attendance = committee.countries.map(country => ({
            country: country.name,
            email: country.email || '',
            status: 'absent',
            markedAt: new Date(),
            markedBy: req.user.userId
        }));

        // Create session
        const session = new Session({
            committeeId,
            number: finalSessionNumber,
            title: title || `Session ${finalSessionNumber}`,
            status: 'inactive',
            attendance,
            // Initialize with session timer ready but not started
            timers: {
                session: {
                    totalDuration: sessionDuration,
                    remainingTime: sessionDuration,
                    isActive: false,
                    isPaused: false,
                    startedAt: null,
                    pausedTime: 0,
                    extensions: []
                },
                debate: {
                    totalDuration: 0,
                    remainingTime: 0,
                    isActive: false,
                    isPaused: false
                },
                speaker: {
                    totalDuration: 90,
                    remainingTime: 90,
                    isActive: false,
                    isPaused: false,
                    canBeExtended: false
                },
                additional: []
            },
            currentMode: 'formal',
            modeSettings: {
                speechTime: 90,
                questionsAllowed: false
            }
        });

        // Calculate initial quorum
        session.calculateQuorum();

        await session.save();

        global.logger.info(`Session ${finalSessionNumber} created for committee ${committee.name}`);

        res.status(201).json({
            success: true,
            session: session,
            message: `Session ${finalSessionNumber} created successfully`
        });

    } catch (error) {
        global.logger.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
};

// Start session
const startSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status === 'active') {
            return res.status(400).json({ error: 'Session is already active' });
        }

        // Start session
        session.status = 'active';
        session.startedAt = new Date();

        // Start session timer
        await session.startSessionTimer(session.timers.session.totalDuration);

        await session.save();

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'session-started', {
                sessionId: session._id,
                sessionNumber: session.number,
                startedAt: session.startedAt
            });
        }

        global.logger.info(`Session ${session.number} started`);

        res.json({
            success: true,
            session: session,
            message: 'Session started successfully'
        });

    } catch (error) {
        global.logger.error('Start session error:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
};

// Timer Management Controllers

// Start roll call
const startRollCall = async (req, res) => {
    try {
        const { id } = req.params;
        const { timeLimit } = req.body; // optional time limit in minutes

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.rollCall.isActive) {
            return res.status(400).json({ error: 'Roll call is already in progress' });
        }

        // Start roll call
        const timeLimitSeconds = timeLimit ? timeLimit * 60 : null;
        await session.startRollCall(req.user.userId, timeLimitSeconds);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'roll-call-started', {
                sessionId: session._id,
                timeLimit: timeLimitSeconds,
                totalCountries: session.attendance.length
            });
        }

        global.logger.info(`Roll call started for session ${session.number}`);

        res.json({
            success: true,
            rollCall: session.rollCall,
            attendance: session.attendance,
            message: 'Roll call started successfully'
        });

    } catch (error) {
        global.logger.error('Start roll call error:', error);
        res.status(500).json({ error: 'Failed to start roll call' });
    }
};

// End roll call
const endRollCall = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (!session.rollCall.isActive) {
            return res.status(400).json({ error: 'No active roll call to end' });
        }

        // End roll call and calculate quorum
        await session.endRollCall();

        // Initialize speaker queues based on attendance
        await session.initializeSpeakerQueues();

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'roll-call-ended', {
                sessionId: session._id,
                quorum: session.quorum,
                presentCount: session.attendance.filter(a => a.status === 'present_and_voting').length
            });
        }

        global.logger.info(`Roll call ended for session ${session.number}. Quorum: ${session.quorum.hasQuorum}`);

        res.json({
            success: true,
            rollCall: session.rollCall,
            quorum: session.quorum,
            attendance: session.attendance,
            speakerQueues: session.speakerQueues,
            message: 'Roll call ended successfully'
        });

    } catch (error) {
        global.logger.error('End roll call error:', error);
        res.status(500).json({ error: 'Failed to end roll call' });
    }
};

// Mark attendance (presidium can mark anyone, delegates can mark themselves during roll call)
const markAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { country, status } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Validate status
        const validStatuses = ['absent', 'present', 'present_and_voting'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid attendance status' });
        }

        // Check permissions
        if (req.user.role === 'delegate') {
            // Delegates can only mark themselves during active roll call
            if (!session.rollCall.isActive) {
                return res.status(400).json({ error: 'Roll call is not active' });
            }

            if (country !== req.user.countryName) {
                return res.status(403).json({ error: 'You can only mark your own attendance' });
            }
        }

        // Mark attendance
        await session.markAttendance(country, status, req.user.userId);

        // Emit real-time update
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'attendance-updated', {
                sessionId: session._id,
                country,
                status,
                quorum: session.quorum
            });
        }

        res.json({
            success: true,
            attendance: session.attendance.find(a => a.country === country),
            quorum: session.quorum,
            message: `Attendance marked for ${country}: ${status}`
        });

    } catch (error) {
        global.logger.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

// Timer Control Methods

// Start debate timer
const startDebateTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, debateType, purpose } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.startDebateTimer(duration, debateType, purpose);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'debate-timer-started', {
                sessionId: session._id,
                timer: session.timers.debate
            });
        }

        res.json({
            success: true,
            timer: session.timers.debate,
            message: 'Debate timer started'
        });

    } catch (error) {
        global.logger.error('Start debate timer error:', error);
        res.status(500).json({ error: 'Failed to start debate timer' });
    }
};

// Start speaker timer
const startSpeakerTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, country, canBeExtended } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.startSpeakerTimer(duration, country, canBeExtended);

        // Set current speaker if specified
        if (country) {
            await session.setCurrentSpeaker(country);
        }

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'speaker-timer-started', {
                sessionId: session._id,
                timer: session.timers.speaker,
                currentSpeaker: session.currentSpeaker
            });
        }

        res.json({
            success: true,
            timer: session.timers.speaker,
            currentSpeaker: session.currentSpeaker,
            message: 'Speaker timer started'
        });

    } catch (error) {
        global.logger.error('Start speaker timer error:', error);
        res.status(500).json({ error: 'Failed to start speaker timer' });
    }
};

// Pause/Resume timer
const toggleTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { timerType, action } = req.body; // action: 'pause' or 'resume'

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (action === 'pause') {
            await session.pauseTimer(timerType);
        } else if (action === 'resume') {
            await session.resumeTimer(timerType);
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "pause" or "resume"' });
        }

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'timer-toggled', {
                sessionId: session._id,
                timerType,
                action,
                timer: session.timers[timerType]
            });
        }

        res.json({
            success: true,
            timer: session.timers[timerType],
            message: `Timer ${action}d successfully`
        });

    } catch (error) {
        global.logger.error('Toggle timer error:', error);
        res.status(500).json({ error: 'Failed to toggle timer' });
    }
};

// Adjust timer (real-time manual adjustment)
const adjustTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { timerType, newTime, reason } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const oldTime = session.timers[timerType]?.remainingTime;
        await session.adjustTimer(timerType, newTime);

        // Log the adjustment
        global.logger.info(`Timer adjusted for session ${session.number}: ${timerType} from ${oldTime}s to ${newTime}s. Reason: ${reason || 'None provided'}`);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'timer-adjusted', {
                sessionId: session._id,
                timerType,
                oldTime,
                newTime,
                reason,
                timer: session.timers[timerType]
            });
        }

        res.json({
            success: true,
            timer: session.timers[timerType],
            message: 'Timer adjusted successfully'
        });

    } catch (error) {
        global.logger.error('Adjust timer error:', error);
        res.status(500).json({ error: 'Failed to adjust timer' });
    }
};

// Change debate mode
const changeDebateMode = async (req, res) => {
    try {
        const { id } = req.params;
        const { mode, settings } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Validate mode
        const validModes = ['formal', 'moderated', 'unmoderated', 'informal'];
        if (!validModes.includes(mode)) {
            return res.status(400).json({ error: 'Invalid debate mode' });
        }

        // Change mode with settings
        await session.changeMode(mode, settings, req.user.userId);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'debate-mode-changed', {
                sessionId: session._id,
                newMode: mode,
                settings,
                speakerQueues: session.speakerQueues,
                timers: session.timers
            });
        }

        global.logger.info(`Debate mode changed to ${mode} for session ${session.number}`);

        res.json({
            success: true,
            currentMode: session.currentMode,
            modeSettings: session.modeSettings,
            speakerQueues: session.speakerQueues,
            timers: session.timers,
            message: `Debate mode changed to ${mode}`
        });

    } catch (error) {
        global.logger.error('Change debate mode error:', error);
        res.status(500).json({ error: 'Failed to change debate mode' });
    }
};

// Speaker Queue Management

// Move delegate to end of queue (delegates can move themselves once)
const moveToEndOfQueue = async (req, res) => {
    try {
        const { id } = req.params;
        const { country } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check permissions
        if (req.user.role === 'delegate' && country !== req.user.countryName) {
            return res.status(403).json({ error: 'You can only move yourself in the queue' });
        }

        await session.moveToEndOfQueue(country);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'speaker-queue-updated', {
                sessionId: session._id,
                action: 'moved_to_end',
                country,
                speakerQueues: session.speakerQueues
            });
        }

        res.json({
            success: true,
            speakerQueues: session.speakerQueues,
            message: `${country} moved to end of speakers queue`
        });

    } catch (error) {
        global.logger.error('Move to end of queue error:', error);

        if (error.message.includes('already moved to end') ||
            error.message.includes('not found') ||
            error.message.includes('while they are speaking')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to move to end of queue' });
    }
};

// Set current speaker
const setCurrentSpeaker = async (req, res) => {
    try {
        const { id } = req.params;
        const { country } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.setCurrentSpeaker(country);

        // Start speaker timer with appropriate duration
        const speechTime = session.modeSettings.individualSpeechTime ||
            session.modeSettings.speechTime || 90;

        await session.startSpeakerTimer(speechTime, country, session.modeSettings.questionsAllowed);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'current-speaker-changed', {
                sessionId: session._id,
                currentSpeaker: session.currentSpeaker,
                speakerTimer: session.timers.speaker,
                speakerQueues: session.speakerQueues
            });
        }

        res.json({
            success: true,
            currentSpeaker: session.currentSpeaker,
            speakerTimer: session.timers.speaker,
            speakerQueues: session.speakerQueues,
            message: `Current speaker set to ${country}`
        });

    } catch (error) {
        global.logger.error('Set current speaker error:', error);

        if (error.message.includes('not found')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to set current speaker' });
    }
};

// Get session details
const getSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id)
            .populate('modeHistory.startedBy', 'presidiumRole username')
            .populate('attendance.markedBy', 'presidiumRole username');

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            success: true,
            session
        });

    } catch (error) {
        global.logger.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to get session details' });
    }
};

// Get all session timers
const getSessionTimers = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id).select('timers');
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            success: true,
            timers: session.timers
        });

    } catch (error) {
        global.logger.error('Get session timers error:', error);
        res.status(500).json({ error: 'Failed to get session timers' });
    }
};

module.exports = {
    createSession,
    startSession,
    startRollCall,
    endRollCall,
    markAttendance,
    startDebateTimer,
    startSpeakerTimer,
    toggleTimer,
    adjustTimer,
    changeDebateMode,
    moveToEndOfQueue,
    setCurrentSpeaker,
    getSession,
    getSessionTimers
};