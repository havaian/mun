const { Session } = require('./model');
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const logger = require('../utils/logger');
const { emitToCommittee, emitToPresidium } = require('../websocket/socketManager');

// Create new session (presidium only)
const createSession = async (req, res) => {
    try {
        const { committeeId, title } = req.body;

        // Verify committee exists and user has access
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check if there's already an active session
        const activeSession = await Session.findOne({
            committeeId,
            status: 'active'
        });

        if (activeSession) {
            return res.status(400).json({
                error: 'An active session already exists for this committee',
                activeSessionId: activeSession._id
            });
        }

        // Get next session number
        const lastSession = await Session.findOne({ committeeId })
            .sort({ number: -1 })
            .select('number');

        const sessionNumber = (lastSession?.number || 0) + 1;

        // Initialize session with basic attendance from committee
        const attendance = committee.countries.map(country => ({
            country: country.name,
            email: country.email || '',
            status: 'absent',
            markedAt: new Date(),
            markedBy: req.user.userId
        }));

        const session = new Session({
            committeeId,
            number: sessionNumber,
            title: title || `Session ${sessionNumber}`,
            attendance,
            currentMode: 'formal',
            modeStartedAt: new Date(),
            modeSettings: {
                speechTime: committee.settings.speechSettings.defaultSpeechTime,
                allowQuestions: false
            }
        });

        // Initialize session timer (default 3 hours)
        session.initializeTimer('session', 3 * 60 * 60, 'Session time limit');

        await session.save();

        // Update committee statistics
        committee.statistics.totalSessions += 1;
        await committee.save();

        // Emit to all committee members
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, committeeId, 'session-started', {
                sessionId: session._id,
                sessionNumber: session.number,
                title: session.title,
                startedAt: session.startedAt
            });
        }

        logger.info(`Session ${sessionNumber} created for committee ${committee.name}`);

        res.status(201).json({
            success: true,
            session,
            message: 'Session created successfully'
        });

    } catch (error) {
        logger.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
};

// Get session details
const getSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id)
            .populate('committeeId', 'name type settings')
            .populate('attendance.markedBy', 'presidiumRole username')
            .populate('modeHistory.startedBy', 'presidiumRole username');

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check access permissions
        if (req.user.role !== 'admin' &&
            req.user.committeeId?.toString() !== session.committeeId._id.toString()) {
            return res.status(403).json({ error: 'Access denied to this session' });
        }

        res.json({
            success: true,
            session
        });

    } catch (error) {
        logger.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
};

// Get sessions for committee
const getCommitteeSessions = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { committeeId };
        if (status && ['active', 'paused', 'completed'].includes(status)) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const sessions = await Session.find(filter)
            .select('number title status startedAt endedAt currentMode duration')
            .sort({ number: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalSessions = await Session.countDocuments(filter);

        res.json({
            success: true,
            sessions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSessions / limit),
                totalSessions,
                hasNext: skip + sessions.length < totalSessions,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error('Get committee sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

// Update session status (presidium only)
const updateSessionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'paused', 'completed'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be active, paused, or completed'
            });
        }

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const oldStatus = session.status;
        session.status = status;

        if (status === 'completed' && !session.endedAt) {
            session.endedAt = new Date();

            // Complete current mode in history
            if (session.modeHistory.length > 0) {
                const lastMode = session.modeHistory[session.modeHistory.length - 1];
                if (!lastMode.endedAt) {
                    lastMode.endedAt = new Date();
                }
            }
        }

        await session.save();

        // Emit status change
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'session-status-changed', {
                sessionId: session._id,
                oldStatus,
                newStatus: status,
                endedAt: session.endedAt
            });
        }

        logger.info(`Session ${session.number} status changed from ${oldStatus} to ${status}`);

        res.json({
            success: true,
            session,
            message: `Session status updated to ${status}`
        });

    } catch (error) {
        logger.error('Update session status error:', error);
        res.status(500).json({ error: 'Failed to update session status' });
    }
};

// Change debate mode (presidium only)
const changeDebateMode = async (req, res) => {
    try {
        const { id } = req.params;
        const { mode, settings = {} } = req.body;

        const validModes = ['formal', 'moderated', 'unmoderated', 'informal', 'voting', 'closed'];
        if (!validModes.includes(mode)) {
            return res.status(400).json({
                error: `Invalid mode. Must be one of: ${validModes.join(', ')}`
            });
        }

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({
                error: 'Cannot change mode of inactive session'
            });
        }

        const oldMode = session.currentMode;
        session.changeMode(mode, settings, req.user.userId);

        await session.save();

        // Emit mode change
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'session-mode-changed', {
                sessionId: session._id,
                oldMode,
                newMode: mode,
                settings: session.modeSettings,
                changedBy: req.user.presidiumRole || req.user.role
            });
        }

        logger.info(`Session ${session.number} mode changed from ${oldMode} to ${mode}`);

        res.json({
            success: true,
            session: {
                currentMode: session.currentMode,
                modeSettings: session.modeSettings,
                modeStartedAt: session.modeStartedAt
            },
            message: `Debate mode changed to ${mode}`
        });

    } catch (error) {
        logger.error('Change debate mode error:', error);
        res.status(500).json({ error: 'Failed to change debate mode' });
    }
};

// Update attendance (presidium only)
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { attendance } = req.body; // Array of { country, status }

        if (!Array.isArray(attendance)) {
            return res.status(400).json({
                error: 'Attendance must be an array'
            });
        }

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Update attendance records
        for (const record of attendance) {
            const { country, status } = record;

            if (!['present_and_voting', 'present', 'absent'].includes(status)) {
                continue; // Skip invalid statuses
            }

            session.updateAttendance(country, status, req.user.userId);
        }

        await session.save();

        // Emit attendance update
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'attendance-updated', {
                sessionId: session._id,
                quorum: session.quorum,
                presentCount: session.quorum.present,
                hasQuorum: session.quorum.hasQuorum
            });
        }

        logger.info(`Attendance updated for session ${session.number}: ${session.quorum.present} present`);

        res.json({
            success: true,
            attendance: session.attendance,
            quorum: session.quorum,
            message: 'Attendance updated successfully'
        });

    } catch (error) {
        logger.error('Update attendance error:', error);
        res.status(500).json({ error: 'Failed to update attendance' });
    }
};

// Get current attendance
const getCurrentAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id)
            .select('attendance quorum')
            .populate('attendance.markedBy', 'presidiumRole username');

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            success: true,
            attendance: session.attendance,
            quorum: session.quorum
        });

    } catch (error) {
        logger.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

// Manage speaker list (presidium only)
const updateSpeakerList = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, country, speakerList } = req.body;

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        let result;

        switch (action) {
            case 'add':
                if (!country) {
                    return res.status(400).json({ error: 'Country is required for add action' });
                }

                // Get country email from committee
                const committee = await Committee.findById(session.committeeId);
                const countryData = committee.countries.find(c => c.name === country);

                if (!countryData) {
                    return res.status(404).json({ error: 'Country not found in committee' });
                }

                result = session.addSpeaker(country, countryData.email || '');
                break;

            case 'remove':
                if (!country) {
                    return res.status(400).json({ error: 'Country is required for remove action' });
                }
                session.removeSpeaker(country);
                result = { message: `${country} removed from speaker list` };
                break;

            case 'move-to-end':
                if (!country) {
                    return res.status(400).json({ error: 'Country is required for move action' });
                }
                session.moveSpeakerToEnd(country);
                result = { message: `${country} moved to end of speaker list` };
                break;

            case 'replace':
                if (!Array.isArray(speakerList)) {
                    return res.status(400).json({ error: 'Speaker list array is required for replace action' });
                }
                session.speakerList = speakerList.map((speaker, index) => ({
                    ...speaker,
                    position: index + 1
                }));
                result = { message: 'Speaker list replaced' };
                break;

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        await session.save();

        // Emit speaker list update
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'speaker-list-updated', {
                sessionId: session._id,
                speakerList: session.speakerList,
                action,
                country
            });
        }

        res.json({
            success: true,
            speakerList: session.speakerList,
            result,
            message: 'Speaker list updated successfully'
        });

    } catch (error) {
        logger.error('Update speaker list error:', error);

        if (error.message.includes('already in the speaker list') ||
            error.message.includes('not found in speaker list')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to update speaker list' });
    }
};

// Set current speaker (presidium only)
const setCurrentSpeaker = async (req, res) => {
    try {
        const { id } = req.params;
        const { country } = req.body;

        if (!country) {
            return res.status(400).json({ error: 'Country is required' });
        }

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const speaker = session.setCurrentSpeaker(country);
        await session.save();

        // Initialize/restart speaker timer
        const speechTime = session.modeSettings.speechTime || 90;
        session.initializeTimer('speaker', speechTime, `Speech by ${country}`);
        session.startTimer('speaker');
        await session.save();

        // Emit current speaker change
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, session.committeeId, 'current-speaker-changed', {
                sessionId: session._id,
                currentSpeaker: session.currentSpeaker,
                speechTimeLimit: speechTime
            });
        }

        logger.info(`Current speaker set to ${country} in session ${session.number}`);

        res.json({
            success: true,
            currentSpeaker: session.currentSpeaker,
            speakerInList: speaker,
            speechTimeLimit: speechTime,
            message: `Current speaker set to ${country}`
        });

    } catch (error) {
        logger.error('Set current speaker error:', error);

        if (error.message.includes('not found in speaker list')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to set current speaker' });
    }
};

// Delete session (admin only)
const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Can only delete completed sessions
        if (session.status !== 'completed') {
            return res.status(400).json({
                error: 'Can only delete completed sessions'
            });
        }

        // Check for related data (votings, resolutions, etc.)
        // TODO: Add checks when those modules are implemented

        await Session.findByIdAndDelete(id);

        logger.info(`Session ${session.number} deleted`);

        res.json({
            success: true,
            message: 'Session deleted successfully'
        });

    } catch (error) {
        logger.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
};

module.exports = {
    createSession,
    getSession,
    getCommitteeSessions,
    updateSessionStatus,
    changeDebateMode,
    updateAttendance,
    getCurrentAttendance,
    updateSpeakerList,
    setCurrentSpeaker,
    deleteSession
};