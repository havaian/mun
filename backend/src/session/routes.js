const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Validation middleware
const validateSessionId = [
    param('id').isMongoId().withMessage('Invalid session ID')
];

const validateSessionCreation = [
    body('committeeId').isMongoId().withMessage('Valid committee ID is required'),
    body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('sessionNumber').optional().isInt({ min: 1 }).withMessage('Session number must be positive integer'),
    body('sessionDuration').optional().isInt({ min: 600, max: 14400 }).withMessage('Session duration must be between 10 minutes and 4 hours')
];

const validateRollCall = [
    body('timeLimit').optional().isInt({ min: 1, max: 60 }).withMessage('Time limit must be between 1-60 minutes')
];

const validateAttendance = [
    body('country').isLength({ min: 1, max: 100 }).withMessage('Country name is required'),
    body('status').isIn(['absent', 'present', 'present_and_voting']).withMessage('Invalid attendance status')
];

const validateTimerAction = [
    body('timerType').isIn(['session', 'debate', 'speaker']).withMessage('Invalid timer type'),
    body('action').optional().isIn(['pause', 'resume']).withMessage('Invalid timer action'),
    body('duration').optional().isInt({ min: 30, max: 7200 }).withMessage('Duration must be between 30 seconds and 2 hours'),
    body('newTime').optional().isInt({ min: 0, max: 7200 }).withMessage('New time must be between 0 seconds and 2 hours')
];

const validateDebateMode = [
    body('mode').isIn(['formal', 'moderated', 'unmoderated', 'informal']).withMessage('Invalid debate mode'),
    body('settings').optional().isObject().withMessage('Settings must be an object'),
    body('settings.topic').optional().isLength({ min: 1, max: 200 }).withMessage('Topic must be 1-200 characters'),
    body('settings.totalTime').optional().isInt({ min: 60, max: 1200 }).withMessage('Total time must be between 1-20 minutes'),
    body('settings.individualSpeechTime').optional().isInt({ min: 30, max: 600 }).withMessage('Individual speech time must be between 30 seconds and 10 minutes'),
    body('settings.speechTime').optional().isInt({ min: 30, max: 600 }).withMessage('Speech time must be between 30 seconds and 10 minutes'),
    body('settings.questionsAllowed').optional().isBoolean().withMessage('Questions allowed must be boolean'),
    body('settings.questionTime').optional().isInt({ min: 15, max: 300 }).withMessage('Question time must be between 15 seconds and 5 minutes')
];

const validateSpeakerAction = [
    body('country').isLength({ min: 1, max: 100 }).withMessage('Country name is required')
];

// Session Management Routes

// Create new session (presidium only)
router.post('/',
    global.auth.token,
    global.auth.presidium,
    validateSessionCreation,
    handleValidationErrors,
    controller.createSession
);

// Start session (presidium only)
router.put('/:id/start',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    handleValidationErrors,
    controller.startSession
);

// Get session details
router.get('/:id',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    controller.getSession
);

// Get session timers
router.get('/:id/timers',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    controller.getSessionTimers
);

// Roll Call Management Routes

// Start roll call (presidium only)
router.post('/:id/roll-call/start',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateRollCall,
    handleValidationErrors,
    controller.startRollCall
);

// End roll call (presidium only)
router.post('/:id/roll-call/end',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    handleValidationErrors,
    controller.endRollCall
);

// Mark attendance (presidium can mark anyone, delegates can mark themselves during roll call)
router.put('/:id/attendance',
    global.auth.token,
    validateSessionId,
    validateAttendance,
    handleValidationErrors,
    controller.markAttendance
);

// Get current attendance
router.get('/:id/attendance',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('attendance rollCall quorum');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                attendance: session.attendance,
                rollCall: session.rollCall,
                quorum: session.quorum
            });

        } catch (error) {
            global.logger.error('Get attendance error:', error);
            res.status(500).json({ error: 'Failed to get attendance' });
        }
    }
);

// Timer Management Routes

// Start debate timer (presidium only)
router.post('/:id/timers/debate/start',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    [
        body('duration').isInt({ min: 60, max: 7200 }).withMessage('Duration must be between 1 minute and 2 hours'),
        body('debateType').isIn(['formal', 'moderated', 'unmoderated', 'informal']).withMessage('Invalid debate type'),
        body('purpose').optional().isLength({ min: 1, max: 200 }).withMessage('Purpose must be 1-200 characters')
    ],
    handleValidationErrors,
    controller.startDebateTimer
);

// Start speaker timer (presidium only)
router.post('/:id/timers/speaker/start',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    [
        body('duration').isInt({ min: 30, max: 600 }).withMessage('Duration must be between 30 seconds and 10 minutes'),
        body('country').isLength({ min: 1, max: 100 }).withMessage('Country name is required'),
        body('canBeExtended').optional().isBoolean().withMessage('Can be extended must be boolean')
    ],
    handleValidationErrors,
    controller.startSpeakerTimer
);

// Toggle timer (pause/resume) (presidium only)
router.put('/:id/timers/toggle',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    [
        body('timerType').isIn(['session', 'debate', 'speaker']).withMessage('Invalid timer type'),
        body('action').isIn(['pause', 'resume']).withMessage('Invalid action')
    ],
    handleValidationErrors,
    controller.toggleTimer
);

// Adjust timer (real-time manual adjustment) (presidium only)
router.put('/:id/timers/adjust',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    [
        body('timerType').isIn(['session', 'debate', 'speaker']).withMessage('Invalid timer type'),
        body('newTime').isInt({ min: 0, max: 7200 }).withMessage('New time must be between 0 seconds and 2 hours'),
        body('reason').optional().isLength({ min: 1, max: 200 }).withMessage('Reason must be 1-200 characters')
    ],
    handleValidationErrors,
    controller.adjustTimer
);

// Debate Mode Management Routes

// Change debate mode (presidium only)
router.put('/:id/mode',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateDebateMode,
    handleValidationErrors,
    controller.changeDebateMode
);

// Get current mode and settings
router.get('/:id/mode',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('currentMode modeSettings modeStartedAt timers.debate');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                currentMode: session.currentMode,
                modeSettings: session.modeSettings,
                modeStartedAt: session.modeStartedAt,
                debateTimer: session.timers.debate
            });

        } catch (error) {
            global.logger.error('Get current mode error:', error);
            res.status(500).json({ error: 'Failed to get current mode' });
        }
    }
);

// Speaker Queue Management Routes

// Get speaker queues
router.get('/:id/speakers',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('speakerQueues currentSpeaker');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                speakerQueues: session.speakerQueues,
                currentSpeaker: session.currentSpeaker
            });

        } catch (error) {
            global.logger.error('Get speakers error:', error);
            res.status(500).json({ error: 'Failed to get speakers' });
        }
    }
);

// Move to end of queue (delegates can move themselves once, presidium can move anyone)
router.put('/:id/speakers/move-to-end',
    global.auth.token,
    validateSessionId,
    validateSpeakerAction,
    handleValidationErrors,
    controller.moveToEndOfQueue
);

// Set current speaker (presidium only)
router.put('/:id/speakers/current',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateSpeakerAction,
    handleValidationErrors,
    controller.setCurrentSpeaker
);

// Additional Timer Management Routes

// Add additional timer (presidium only)
router.post('/:id/timers/additional',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    [
        body('name').isLength({ min: 1, max: 100 }).withMessage('Timer name is required (1-100 characters)'),
        body('purpose').isLength({ min: 1, max: 200 }).withMessage('Timer purpose is required (1-200 characters)'),
        body('duration').isInt({ min: 30, max: 7200 }).withMessage('Duration must be between 30 seconds and 2 hours')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, purpose, duration } = req.body;

            const { Session } = require('./model');
            const session = await Session.findById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Check if we've reached the limit (6 additional timers)
            if (session.timers.additional.length >= 6) {
                return res.status(400).json({ error: 'Maximum of 6 additional timers allowed' });
            }

            await session.addAdditionalTimer(name, purpose, duration);

            // Emit to committee
            if (req.app.locals.io) {
                const { emitToCommittee } = require('../websocket/socketManager');
                emitToCommittee(req.app.locals.io, session.committeeId, 'additional-timer-added', {
                    sessionId: session._id,
                    timers: session.timers
                });
            }

            res.json({
                success: true,
                timers: session.timers,
                message: 'Additional timer added successfully'
            });

        } catch (error) {
            global.logger.error('Add additional timer error:', error);
            res.status(500).json({ error: 'Failed to add additional timer' });
        }
    }
);

// Start additional timer (presidium only)
router.put('/:id/timers/additional/:timerId/start',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    param('timerId').notEmpty().withMessage('Timer ID is required'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id, timerId } = req.params;

            const { Session } = require('./model');
            const session = await Session.findById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const timer = session.timers.additional.find(t => t.id === timerId);
            if (!timer) {
                return res.status(404).json({ error: 'Additional timer not found' });
            }

            timer.isActive = true;
            timer.isPaused = false;
            timer.startedAt = new Date();

            await session.save();

            // Emit to committee
            if (req.app.locals.io) {
                const { emitToCommittee } = require('../websocket/socketManager');
                emitToCommittee(req.app.locals.io, session.committeeId, 'additional-timer-started', {
                    sessionId: session._id,
                    timerId,
                    timer
                });
            }

            res.json({
                success: true,
                timer,
                message: 'Additional timer started'
            });

        } catch (error) {
            global.logger.error('Start additional timer error:', error);
            res.status(500).json({ error: 'Failed to start additional timer' });
        }
    }
);

// Committee Sessions List
router.get('/committee/:committeeId',
    global.auth.token,
    param('committeeId').isMongoId().withMessage('Invalid committee ID'),
    query('status').optional().isIn(['inactive', 'active', 'paused', 'completed']).withMessage('Invalid status filter'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;

            // Check committee access
            if (req.user.committeeId.toString() !== committeeId.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied to this committee' });
            }

            const filter = { committeeId };
            if (status) {
                filter.status = status;
            }

            const { Session } = require('./model');
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
                    totalItems: total,
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            });

        } catch (error) {
            global.logger.error('Get committee sessions error:', error);
            res.status(500).json({ error: 'Failed to get committee sessions' });
        }
    }
);

// Session Statistics
router.get('/:id/statistics',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('statistics attendance speakerQueues modeHistory timers');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Calculate additional statistics
            const presentCount = session.attendance.filter(a =>
                a.status === 'present' || a.status === 'present_and_voting'
            ).length;

            const spokesCount = session.speakerQueues.present?.filter(s => s.hasSpoken).length || 0;

            const totalSessionTime = session.timers.session.totalDuration - session.timers.session.remainingTime;

            res.json({
                success: true,
                statistics: {
                    ...session.statistics,
                    presentCount,
                    spokesCount,
                    totalSessionTime,
                    modeChanges: session.modeHistory.length
                }
            });

        } catch (error) {
            global.logger.error('Get session statistics error:', error);
            res.status(500).json({ error: 'Failed to get session statistics' });
        }
    }
);

module.exports = router;