// backend/src/session/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/sessions
const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./controller');
const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

// Shared: token + event context + participant for all routes
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== SESSION LIFECYCLE ====================

// Create session with initial mode (presidium only)
router.post('/',
    global.auth.presidium,
    [
        body('initialMode').optional().isIn(['formal', 'moderated', 'unmoderated', 'informal']),
        body('speechTime').optional().isInt({ min: 30, max: 600 }),
        body('questionsAllowed').optional().isBoolean(),
        body('autoStart').optional().isBoolean()
    ],
    handleValidationErrors,
    controller.createSession
);

// Start session (presidium only)
router.put('/:id/start',
    global.auth.presidium,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.startSession
);

// End session (presidium only)
router.put('/:id/end',
    global.auth.presidium,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.endSession
);

// List sessions for this committee (any participant)
router.get('/',
    query('status').optional().isIn(['inactive', 'active', 'paused', 'completed']).withMessage('Invalid status filter'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;

            const Session = require('./model');
            const filter = { committeeId };
            if (status) filter.status = status;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            const [sessions, total] = await Promise.all([
                Session.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Session.countDocuments(filter)
            ]);

            res.json({
                success: true,
                sessions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limitNum),
                    total,
                    hasNext: skip + sessions.length < total,
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            global.logger.error('Get committee sessions error:', error);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }
);

module.exports = router;