const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const {
    authenticateToken,
    requirePresidium,
    requireDelegate,
    requireSameCommittee
} = require('../auth/middleware');

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

// Validation schemas
const validateTimerCreation = [
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('sessionId')
        .isMongoId()
        .withMessage('Valid session ID is required'),
    body('timerType')
        .isIn(['session', 'speaker', 'caucus', 'additional_1', 'additional_2', 'additional_3', 'additional_4', 'additional_5', 'additional_6'])
        .withMessage('Invalid timer type'),
    body('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Timer name must be between 3 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Description cannot exceed 300 characters')
        .trim(),
    body('totalDuration')
        .isInt({ min: 1, max: 86400 }) // Max 24 hours
        .withMessage('Total duration must be between 1 and 86400 seconds'),
    body('countDown')
        .optional()
        .isBoolean()
        .withMessage('Count down must be boolean'),
    body('autoStart')
        .optional()
        .isBoolean()
        .withMessage('Auto start must be boolean'),
    body('warningTimes')
        .optional()
        .isArray()
        .withMessage('Warning times must be an array'),
    body('warningTimes.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Warning times must be positive integers'),
    body('controllableBy')
        .optional()
        .isArray()
        .withMessage('Controllable by must be an array'),
    body('controllableBy.*')
        .optional()
        .isIn(['presidium', 'delegates', 'speaker'])
        .withMessage('Invalid role in controllable by'),
    body('priority')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Priority must be between 0 and 10'),
    body('associatedSpeaker.country')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Associated speaker country must be between 2 and 50 characters'),
    body('associatedSpeaker.email')
        .optional()
        .isEmail()
        .withMessage('Associated speaker email must be valid'),
    body('associatedMotion')
        .optional()
        .isMongoId()
        .withMessage('Associated motion must be valid ID')
];

const validateTimerExtension = [
    body('additionalSeconds')
        .isInt({ min: 1, max: 3600 }) // Max 1 hour extension
        .withMessage('Additional seconds must be between 1 and 3600'),
    body('reason')
        .isLength({ min: 5, max: 200 })
        .withMessage('Extension reason must be between 5 and 200 characters')
        .trim()
];

const validateTimerCancellation = [
    body('reason')
        .isLength({ min: 5, max: 200 })
        .withMessage('Cancellation reason must be between 5 and 200 characters')
        .trim()
];

const validateTimerId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid timer ID')
];

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validateSessionId = [
    param('sessionId')
        .isMongoId()
        .withMessage('Invalid session ID')
];

const validateTimerQuery = [
    query('status')
        .optional()
        .isIn(['created', 'running', 'paused', 'completed', 'expired', 'cancelled', 'all'])
        .withMessage('Status filter must be created, running, paused, completed, expired, cancelled, or all'),
    query('timerType')
        .optional()
        .isIn(['session', 'speaker', 'caucus', 'additional_1', 'additional_2', 'additional_3', 'additional_4', 'additional_5', 'additional_6', 'all'])
        .withMessage('Timer type filter must be valid timer type or all'),
    query('includeCompleted')
        .optional()
        .isBoolean()
        .withMessage('Include completed must be boolean')
];

// Timer Management Routes (Presidium)

// Create new timer
router.post('/',
    authenticateToken,
    requirePresidium,
    validateTimerCreation,
    handleValidationErrors,
    requireSameCommittee,
    controller.createTimer
);

// Start timer
router.put('/:id/start',
    authenticateToken,
    validateTimerId,
    handleValidationErrors,
    controller.startTimer
);

// Pause timer
router.put('/:id/pause',
    authenticateToken,
    validateTimerId,
    handleValidationErrors,
    controller.pauseTimer
);

// Resume timer
router.put('/:id/resume',
    authenticateToken,
    validateTimerId,
    handleValidationErrors,
    controller.resumeTimer
);

// Extend timer (presidium only)
router.put('/:id/extend',
    authenticateToken,
    requirePresidium,
    validateTimerId,
    validateTimerExtension,
    handleValidationErrors,
    controller.extendTimer
);

// Complete timer
router.put('/:id/complete',
    authenticateToken,
    validateTimerId,
    handleValidationErrors,
    controller.completeTimer
);

// Cancel timer (presidium only)
router.delete('/:id',
    authenticateToken,
    requirePresidium,
    validateTimerId,
    validateTimerCancellation,
    handleValidationErrors,
    controller.cancelTimer
);

// Timer Information Routes

// Get single timer details
router.get('/:id',
    authenticateToken,
    validateTimerId,
    handleValidationErrors,
    controller.getTimer
);

// Get committee timers
router.get('/committee/:committeeId',
    authenticateToken,
    validateCommitteeId,
    validateTimerQuery,
    handleValidationErrors,
    requireSameCommittee,
    controller.getCommitteeTimers
);

// Get active timers for session
router.get('/session/:sessionId/active',
    authenticateToken,
    validateSessionId,
    handleValidationErrors,
    controller.getActiveTimers
);

// Quick timer creation shortcuts (presidium only)

// Create and start speaker timer
router.post('/speaker/quick',
    authenticateToken,
    requirePresidium,
    [
        body('committeeId').isMongoId().withMessage('Valid committee ID is required'),
        body('sessionId').isMongoId().withMessage('Valid session ID is required'),
        body('speakerCountry').isLength({ min: 2, max: 50 }).withMessage('Speaker country is required'),
        body('speakerEmail').isEmail().withMessage('Speaker email is required'),
        body('duration').isInt({ min: 30, max: 600 }).withMessage('Duration must be between 30 and 600 seconds'),
        body('autoStart').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId, sessionId, speakerCountry, speakerEmail, duration, autoStart = true } = req.body;

            // Create speaker timer with predefined settings
            const timerData = {
                committeeId,
                sessionId,
                timerType: 'speaker',
                name: `${speakerCountry} Speech`,
                description: `Speech timer for ${speakerCountry}`,
                totalDuration: duration,
                countDown: true,
                autoStart,
                warningTimes: [30, 10],
                controllableBy: ['presidium', 'speaker'],
                priority: 5,
                associatedSpeaker: {
                    country: speakerCountry,
                    email: speakerEmail
                }
            };

            req.body = timerData;
            controller.createTimer(req, res);

        } catch (error) {
            res.status(500).json({ error: 'Failed to create speaker timer' });
        }
    }
);

// Create and start caucus timer
router.post('/caucus/quick',
    authenticateToken,
    requirePresidium,
    [
        body('committeeId').isMongoId().withMessage('Valid committee ID is required'),
        body('sessionId').isMongoId().withMessage('Valid session ID is required'),
        body('caucusType').isIn(['moderated', 'unmoderated']).withMessage('Caucus type must be moderated or unmoderated'),
        body('duration').isInt({ min: 60, max: 1800 }).withMessage('Duration must be between 60 and 1800 seconds'),
        body('topic').optional().isLength({ max: 100 }).withMessage('Topic cannot exceed 100 characters'),
        body('autoStart').optional().isBoolean()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId, sessionId, caucusType, duration, topic, autoStart = true } = req.body;

            const timerData = {
                committeeId,
                sessionId,
                timerType: 'caucus',
                name: `${caucusType.charAt(0).toUpperCase() + caucusType.slice(1)} Caucus`,
                description: topic ? `${caucusType} caucus on: ${topic}` : `${caucusType} caucus`,
                totalDuration: duration,
                countDown: true,
                autoStart,
                warningTimes: caucusType === 'moderated' ? [60, 30] : [120, 60],
                controllableBy: ['presidium'],
                priority: 7
            };

            req.body = timerData;
            controller.createTimer(req, res);

        } catch (error) {
            res.status(500).json({ error: 'Failed to create caucus timer' });
        }
    }
);

// Bulk timer operations (presidium only)

// Stop all active timers
router.post('/bulk/stop-all',
    authenticateToken,
    requirePresidium,
    [
        body('committeeId').isMongoId().withMessage('Valid committee ID is required'),
        body('reason').optional().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Timer } = require('./model');
            const { committeeId, reason = 'Bulk stop by presidium' } = req.body;

            const activeTimers = await Timer.find({
                committeeId,
                status: { $in: ['running', 'paused'] }
            });

            const results = [];
            for (const timer of activeTimers) {
                try {
                    timer.complete(req.user.userId);
                    await timer.save();
                    controller.stopTimerInterval(timer._id);
                    results.push({ timerId: timer._id, name: timer.name, status: 'stopped' });
                } catch (error) {
                    results.push({ timerId: timer._id, name: timer.name, status: 'error', error: error.message });
                }
            }

            // Emit bulk stop notification
            if (req.app.locals.io) {
                const { emitToRoom } = require('../websocket/socketManager');
                emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'bulk-timers-stopped', {
                    reason,
                    stoppedCount: results.filter(r => r.status === 'stopped').length,
                    stoppedBy: req.user.countryName || req.user.username
                });
            }

            res.json({
                success: true,
                results,
                stoppedCount: results.filter(r => r.status === 'stopped').length,
                errorCount: results.filter(r => r.status === 'error').length,
                message: `Stopped ${results.filter(r => r.status === 'stopped').length} timers`
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to stop timers' });
        }
    }
);

module.exports = router;