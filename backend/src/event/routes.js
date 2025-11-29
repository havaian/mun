const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');

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
const validateEventCreation = [
    body('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Event name must be between 3 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
        .trim(),
    body('startDate')
        .isISO8601()
        .withMessage('Valid start date is required')
        .custom((value) => {
            const startDate = new Date(value);
            const now = new Date();
            if (startDate <= now) {
                throw new Error('Start date must be in the future');
            }
            return true;
        }),
    body('endDate')
        .isISO8601()
        .withMessage('Valid end date is required'),
    body('settings.registrationDeadline')
        .optional()
        .isISO8601()
        .withMessage('Valid registration deadline is required'),
    body('settings.qrExpirationPeriod')
        .optional()
        .isInt({ min: 1, max: 720 })
        .withMessage('QR expiration period must be between 1 and 720 hours'),
    body('settings.allowLateRegistration')
        .optional()
        .isBoolean()
        .withMessage('Allow late registration must be boolean'),
    body('settings.maxCommittees')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Max committees must be between 1 and 50')
];

const validateEventUpdate = [
    body('name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Event name must be between 3 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
        .trim(),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Valid start date is required'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Valid end date is required'),
    body('settings.registrationDeadline')
        .optional()
        .isISO8601()
        .withMessage('Valid registration deadline is required'),
    body('settings.qrExpirationPeriod')
        .optional()
        .isInt({ min: 1, max: 720 })
        .withMessage('QR expiration period must be between 1 and 720 hours'),
    body('settings.allowLateRegistration')
        .optional()
        .isBoolean()
        .withMessage('Allow late registration must be boolean'),
    body('settings.maxCommittees')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Max committees must be between 1 and 50')
];

const validateStatusUpdate = [
    body('status')
        .isIn(['draft', 'active', 'completed'])
        .withMessage('Status must be draft, active, or completed')
];

const validateEventId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid event ID')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['draft', 'active', 'completed'])
        .withMessage('Status filter must be draft, active, or completed')
];

// Routes - all require admin authentication

// Get all events
router.get('/',
    global.auth.token,
    global.auth.admin,
    validatePagination,
    handleValidationErrors,
    controller.getAllEvents
);

// Create new event
router.post('/',
    global.auth.token,
    global.auth.admin,
    validateEventCreation,
    handleValidationErrors,
    controller.createEvent
);

// Get single event
router.get('/:id',
    global.auth.token,
    global.auth.admin,
    validateEventId,
    handleValidationErrors,
    controller.getEvent
);

// Update event
router.put('/:id',
    global.auth.token,
    global.auth.admin,
    validateEventId,
    validateEventUpdate,
    handleValidationErrors,
    controller.updateEvent
);

// Update event status
router.put('/:id/status',
    global.auth.token,
    global.auth.admin,
    validateEventId,
    validateStatusUpdate,
    handleValidationErrors,
    controller.updateEventStatus
);

// Delete event
router.delete('/:id',
    global.auth.token,
    global.auth.admin,
    validateEventId,
    handleValidationErrors,
    controller.deleteEvent
);

// Get event statistics
router.get('/:id/statistics',
    global.auth.token,
    global.auth.admin,
    validateEventId,
    handleValidationErrors,
    controller.getEventStatistics
);

module.exports = router;