const { Session } = require('./model');
const { Committee } = require('../committee/model');
const { emitToCommittee } = require('../websocket/socketManager');

// ==================== SESSION LIFECYCLE ====================

// Create session with initial mode selection
const createSession = async (req, res) => {
    try {
        const {
            committeeId,
            initialMode = 'formal',
            speechTime = 120,
            questionsAllowed = false,
            autoStart = false
        } = req.body;

        // Verify committee and access
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (req.user.committeeId.toString() !== committeeId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check for active session
        const activeSession = await Session.findOne({
            committeeId,
            status: { $in: ['active', 'paused'] }
        });

        if (activeSession) {
            return res.status(400).json({
                error: 'Active session already exists',
                activeSessionId: activeSession._id
            });
        }

        // Get next session number
        const lastSession = await Session.findOne({ committeeId })
            .sort({ number: -1 });
        const sessionNumber = (lastSession?.number || 0) + 1;

        // Create session
        const session = new Session({
            committeeId,
            number: sessionNumber,
            title: `Session ${sessionNumber}`,
            status: autoStart ? 'active' : 'inactive',
            startedAt: autoStart ? new Date() : null,
            currentMode: initialMode,
            modeSettings: {
                speechTime: speechTime,
                questionsAllowed: questionsAllowed
            }
        });

        // Initialize with committee countries
        await session.initialize();

        global.logger.info(`Session ${sessionNumber} created for committee ${committee.name}`);

        res.status(201).json({
            success: true,
            session: session,
            message: 'Session created successfully'
        });

    } catch (error) {
        global.logger.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
};

// Start session
const startSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status === 'active') {
            return res.status(400).json({ error: 'Session already active' });
        }

        session.status = 'active';
        session.startedAt = new Date();
        await session.save();

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'session-started', {
                sessionId: session._id,
                sessionNumber: session.number
            });
        }

        res.json({ success: true, session });

    } catch (error) {
        global.logger.error('Start session error:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
};

// End session
const endSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        session.status = 'completed';
        session.endedAt = new Date();

        // Stop all timers
        session.timers.session.isActive = false;
        session.timers.debate.isActive = false;
        session.timers.speaker.isActive = false;
        session.timers.additional.forEach(t => t.isActive = false);

        await session.save();

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'session-ended', {
                sessionId: session._id,
                duration: session.endedAt - session.startedAt
            });
        }

        res.json({ success: true, session });

    } catch (error) {
        global.logger.error('End session error:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
};

// Get session
const getSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ success: true, session });

    } catch (error) {
        global.logger.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
};

// ==================== ROLL CALL ====================

// Start roll call
const startRollCall = async (req, res) => {
    try {
        const { timeLimit } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.rollCall.isActive) {
            return res.status(400).json({ error: 'Roll call already in progress' });
        }

        const timeLimitSeconds = timeLimit ? timeLimit * 60 : null;
        await session.startRollCall(req.user.userId, timeLimitSeconds);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'roll-call-started', {
                sessionId: session._id,
                timeLimit: timeLimitSeconds
            });
        }

        res.json({
            success: true,
            rollCall: session.rollCall,
            message: 'Roll call started'
        });

    } catch (error) {
        global.logger.error('Start roll call error:', error);
        res.status(500).json({ error: 'Failed to start roll call' });
    }
};

// End roll call - This initializes the speaker lists!
const endRollCall = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (!session.rollCall.isActive) {
            return res.status(400).json({ error: 'No active roll call' });
        }

        // End roll call and initialize speaker lists
        await session.endRollCall();

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'roll-call-ended', {
                sessionId: session._id,
                quorum: session.quorum,
                speakerLists: session.speakerLists
            });
        }

        res.json({
            success: true,
            rollCall: session.rollCall,
            quorum: session.quorum,
            speakerLists: session.speakerLists,
            message: 'Roll call ended, speaker lists initialized'
        });

    } catch (error) {
        global.logger.error('End roll call error:', error);
        res.status(500).json({ error: 'Failed to end roll call' });
    }
};

// Mark attendance
const markAttendance = async (req, res) => {
    try {
        const { country, status } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check permission (delegates can only mark themselves)
        if (req.user.role === 'delegate' && country !== req.user.countryName) {
            return res.status(403).json({ error: 'Can only mark your own attendance' });
        }

        await session.markAttendance(country, status);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'attendance-updated', {
                sessionId: session._id,
                country,
                status,
                quorum: session.quorum,
                speakerLists: session.speakerLists
            });
        }

        res.json({
            success: true,
            attendance: session.attendance,
            quorum: session.quorum,
            speakerLists: session.speakerLists
        });

    } catch (error) {
        global.logger.error('Mark attendance error:', error);
        res.status(500).json({ error: error.message || 'Failed to mark attendance' });
    }
};

// ==================== MODE MANAGEMENT ====================

// Change debate mode
const changeMode = async (req, res) => {
    try {
        const { mode, settings = {} } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const startedBy = {
            email: req.user.email,
            name: req.user.name || 'Presidium',
            userId: req.user.userId
        };

        await session.changeMode(mode, settings, startedBy);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'mode-changed', {
                sessionId: session._id,
                mode: session.currentMode,
                modeSettings: session.modeSettings,
                timers: session.timers
            });
        }

        res.json({
            success: true,
            currentMode: session.currentMode,
            modeSettings: session.modeSettings,
            timers: session.timers,
            message: `Mode changed to ${mode}`
        });

    } catch (error) {
        global.logger.error('Change mode error:', error);
        res.status(500).json({ error: 'Failed to change mode' });
    }
};

// ==================== TIMER MANAGEMENT ====================

// Start session timer
const startSessionTimer = async (req, res) => {
    try {
        const { duration, purpose } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.startSessionTimer(duration, purpose);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'timer-started', {
                sessionId: session._id,
                timerType: 'session',
                timer: session.timers.session
            });
        }

        res.json({
            success: true,
            timer: session.timers.session
        });

    } catch (error) {
        global.logger.error('Start session timer error:', error);
        res.status(500).json({ error: 'Failed to start timer' });
    }
};

// Start debate timer (after mode change)
const startDebateTimer = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.startDebateTimer();

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'timer-started', {
                sessionId: session._id,
                timerType: 'debate',
                timer: session.timers.debate
            });
        }

        res.json({
            success: true,
            timer: session.timers.debate
        });

    } catch (error) {
        global.logger.error('Start debate timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to start timer' });
    }
};

// Toggle timer (pause/resume)
const toggleTimer = async (req, res) => {
    try {
        const { timerType } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const timer = session.timers[timerType];
        if (!timer) {
            return res.status(400).json({ error: 'Invalid timer type' });
        }

        if (timer.isPaused) {
            await session.resumeTimer(timerType);
        } else {
            await session.pauseTimer(timerType);
        }

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'timer-toggled', {
                sessionId: session._id,
                timerType,
                timer: session.timers[timerType]
            });
        }

        res.json({
            success: true,
            timer: session.timers[timerType]
        });

    } catch (error) {
        global.logger.error('Toggle timer error:', error);
        res.status(500).json({ error: 'Failed to toggle timer' });
    }
};

// Adjust timer
const adjustTimer = async (req, res) => {
    try {
        const { timerType, newTime } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.adjustTimer(timerType, newTime);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'timer-adjusted', {
                sessionId: session._id,
                timerType,
                timer: session.timers[timerType]
            });
        }

        res.json({
            success: true,
            timer: session.timers[timerType]
        });

    } catch (error) {
        global.logger.error('Adjust timer error:', error);
        res.status(500).json({ error: 'Failed to adjust timer' });
    }
};

// Add additional timer
const addAdditionalTimer = async (req, res) => {
    try {
        const { name, purpose, duration } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.addAdditionalTimer(name, purpose, duration);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'additional-timer-added', {
                sessionId: session._id,
                timers: session.timers
            });
        }

        res.json({
            success: true,
            timers: session.timers
        });

    } catch (error) {
        global.logger.error('Add additional timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to add timer' });
    }
};

// ==================== SPEAKER MANAGEMENT ====================

// Set current speaker (and start their timer)
const setCurrentSpeaker = async (req, res) => {
    try {
        const { country } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.setCurrentSpeaker(country);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'current-speaker-set', {
                sessionId: session._id,
                currentSpeaker: session.currentSpeaker,
                speakerTimer: session.timers.speaker,
                speakerLists: session.speakerLists
            });
        }

        res.json({
            success: true,
            currentSpeaker: session.currentSpeaker,
            speakerTimer: session.timers.speaker,
            speakerLists: session.speakerLists
        });

    } catch (error) {
        global.logger.error('Set current speaker error:', error);
        res.status(500).json({ error: error.message || 'Failed to set speaker' });
    }
};

// Move speaker to end (can only do once)
const moveToEnd = async (req, res) => {
    try {
        const { country } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Delegates can only move themselves
        if (req.user.role === 'delegate' && country !== req.user.countryName) {
            return res.status(403).json({ error: 'Can only move yourself' });
        }

        await session.moveToEndOfQueue(country);

        // Emit to committee
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'speaker-moved', {
                sessionId: session._id,
                country,
                speakerLists: session.speakerLists
            });
        }

        res.json({
            success: true,
            speakerLists: session.speakerLists,
            message: `${country} moved to end of queue`
        });

    } catch (error) {
        global.logger.error('Move to end error:', error);
        res.status(400).json({ error: error.message || 'Failed to move speaker' });
    }
};

// Get next speaker
const getNextSpeaker = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const nextSpeaker = session.getNextSpeaker();

        res.json({
            success: true,
            nextSpeaker
        });

    } catch (error) {
        global.logger.error('Get next speaker error:', error);
        res.status(500).json({ error: 'Failed to get next speaker' });
    }
};

// Get committee sessions
const getCommitteeSessions = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;

        const filter = { committeeId };
        if (status) filter.status = status;

        const sessions = await Session.find(filter)
            .select('number title status startedAt endedAt currentMode quorum')
            .sort({ number: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Session.countDocuments(filter);

        res.json({
            success: true,
            sessions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });

    } catch (error) {
        global.logger.error('Get committee sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
};

module.exports = {
    createSession,
    startSession,
    endSession,
    getSession,
    startRollCall,
    endRollCall,
    markAttendance,
    changeMode,
    startSessionTimer,
    startDebateTimer,
    toggleTimer,
    adjustTimer,
    addAdditionalTimer,
    setCurrentSpeaker,
    moveToEnd,
    getNextSpeaker,
    getCommitteeSessions
};