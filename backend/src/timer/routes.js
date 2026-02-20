// backend/src/timer/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/timers
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router({ mergeParams: true });

const controller = require('./controller');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateTimerId = [param('id').isMongoId().withMessage('Valid timer ID is required')];

const validateTimerCreation = [
    body('timerType').isIn(['session', 'speaker', 'caucus', 'additional_1', 'additional_2', 'additional_3', 'additional_4', 'additional_5', 'additional_6']).withMessage('Invalid timer type'),
    body('duration').isInt({ min: 1, max: 36000 }).withMessage('Duration must be between 1 and 36000 seconds'),
    body('label').optional().isLength({ max: 100 }).withMessage('Label cannot exceed 100 characters').trim(),
    body('sessionId').optional().isMongoId().withMessage('Session ID must be valid')
];

const validateTimerExtension = [
    body('additionalTime').isInt({ min: 1, max: 3600 }).withMessage('Additional time must be between 1 and 3600 seconds'),
    body('reason').optional().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters').trim()
];

const validateTimerCancellation = [
    body('reason').optional().isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters').trim()
];

const validateTimerFilters = [
    query('status').optional().isIn(['created', 'running', 'paused', 'completed', 'expired', 'cancelled', 'all']).withMessage('Invalid status filter'),
    query('timerType').optional().isIn(['session', 'speaker', 'caucus', 'additional_1', 'additional_2', 'additional_3', 'additional_4', 'additional_5', 'additional_6', 'all']).withMessage('Invalid timer type filter'),
    query('includeCompleted').optional().isBoolean().withMessage('Include completed must be boolean')
];

// Shared: token + event context + participant
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== TIMER MANAGEMENT (Presidium) ====================

// Create new timer (presidium only)
router.post('/',
    global.auth.presidium,
    validateTimerCreation,
    handleValidationErrors,
    controller.createTimer
);

// Extend timer (presidium only)
router.put('/:id/extend',
    global.auth.presidium,
    validateTimerId,
    validateTimerExtension,
    handleValidationErrors,
    controller.extendTimer
);

// Cancel timer (presidium only)
router.delete('/:id',
    global.auth.presidium,
    validateTimerId,
    validateTimerCancellation,
    handleValidationErrors,
    controller.cancelTimer
);

// ==================== TIMER CONTROLS (any participant) ====================

// Start timer
router.put('/:id/start',
    validateTimerId,
    handleValidationErrors,
    controller.startTimer
);

// Pause timer
router.put('/:id/pause',
    validateTimerId,
    handleValidationErrors,
    controller.pauseTimer
);

// Resume timer
router.put('/:id/resume',
    validateTimerId,
    handleValidationErrors,
    controller.resumeTimer
);

// Complete timer
router.put('/:id/complete',
    validateTimerId,
    handleValidationErrors,
    controller.completeTimer
);

// ==================== TIMER READ ====================

// Get timers for this committee
router.get('/',
    validateTimerFilters,
    handleValidationErrors,
    controller.getCommitteeTimers
);

// Get single timer
router.get('/:id',
    validateTimerId,
    handleValidationErrors,
    controller.getTimer
);

module.exports = router;