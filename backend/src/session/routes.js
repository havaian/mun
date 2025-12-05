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
const validateSessionCreation = [
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('title')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters')
        .trim()
];

const validateStatusUpdate = [
    body('status')
        .isIn(['active', 'paused', 'completed'])
        .withMessage('Status must be active, paused, or completed')
];

const validateModeChange = [
    body('mode')
        .isIn(['formal', 'moderated', 'unmoderated', 'informal', 'voting', 'closed'])
        .withMessage('Invalid debate mode'),
    body('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object'),
    body('settings.topic')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('Topic must be between 5 and 200 characters'),
    body('settings.totalTime')
        .optional()
        .isInt({ min: 60, max: 7200 })
        .withMessage('Total time must be between 60 and 7200 seconds'),
    body('settings.speechTime')
        .optional()
        .isInt({ min: 30, max: 300 })
        .withMessage('Speech time must be between 30 and 300 seconds'),
    body('settings.allowQuestions')
        .optional()
        .isBoolean()
        .withMessage('Allow questions must be boolean')
];

const validateAttendanceUpdate = [
    body('attendance')
        .isArray({ min: 1 })
        .withMessage('Attendance must be a non-empty array'),
    body('attendance.*.country')
        .isLength({ min: 2, max: 50 })
        .withMessage('Country name must be between 2 and 50 characters')
        .trim(),
    body('attendance.*.status')
        .isIn(['present_and_voting', 'present', 'absent'])
        .withMessage('Status must be present_and_voting, present, or absent')
];

const validateSpeakerListUpdate = [
    body('action')
        .isIn(['add', 'remove', 'move-to-end', 'replace'])
        .withMessage('Action must be add, remove, move-to-end, or replace'),
    body('country')
        .if(body('action').isIn(['add', 'remove', 'move-to-end']))
        .isLength({ min: 2, max: 50 })
        .withMessage('Country name is required for this action')
        .trim(),
    body('speakerList')
        .if(body('action').equals('replace'))
        .isArray()
        .withMessage('Speaker list is required for replace action')
];

const validateCurrentSpeaker = [
    body('country')
        .isLength({ min: 2, max: 50 })
        .withMessage('Country name is required')
        .trim()
];

const validateSessionId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid session ID')
];

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('status')
        .optional()
        .isIn(['active', 'paused', 'completed'])
        .withMessage('Status filter must be active, paused, or completed')
];

// Routes

// Create new session (presidium only)
router.post('/',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateSessionCreation,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.createSession
);

// Get sessions for committee
router.get('/:committeeId',
    global.auth.token,
    validateCommitteeId,
    validatePagination,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.getCommitteeSessions
);

// Get single session
router.get('/detail/:id',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    controller.getSession
);

// Update session status (presidium only)
router.put('/:id/status',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateStatusUpdate,
    handleValidationErrors,
    controller.updateSessionStatus
);

// Change debate mode (presidium only)
router.put('/:id/mode',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateModeChange,
    handleValidationErrors,
    controller.changeDebateMode
);

// Attendance management

// Update attendance (presidium only)
router.put('/:id/attendance',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateAttendanceUpdate,
    handleValidationErrors,
    controller.updateAttendance
);

// Get current attendance
router.get('/:id/attendance',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    controller.getCurrentAttendance
);

// Get quorum status
router.get('/:id/quorum',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('quorum attendance');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                quorum: session.quorum,
                presentCount: session.attendance.filter(a =>
                    a.status === 'present_and_voting'
                ).length
            });

        } catch (error) {
            logger.error('Get quorum error:', error);
            res.status(500).json({ error: 'Failed to fetch quorum status' });
        }
    }
);

// Speaker list management

// Update speaker list (presidium only)
router.put('/:id/speaker-list',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateSpeakerListUpdate,
    handleValidationErrors,
    controller.updateSpeakerList
);

// Get current speaker list
router.get('/:id/speaker-list',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('speakerList currentSpeaker');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                speakerList: session.speakerList,
                currentSpeaker: session.currentSpeaker
            });

        } catch (error) {
            logger.error('Get speaker list error:', error);
            res.status(500).json({ error: 'Failed to fetch speaker list' });
        }
    }
);

// Set current speaker (presidium only)
router.put('/:id/current-speaker',
    global.auth.token,
    global.auth.presidium,
    validateSessionId,
    validateCurrentSpeaker,
    handleValidationErrors,
    controller.setCurrentSpeaker
);

// Add delegate to speaker list (delegate can add themselves)
router.post('/:id/speaker-list/add',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            // Only delegates can add themselves, presidium can add anyone
            if (req.user.role === 'delegate') {
                req.body = {
                    action: 'add',
                    country: req.user.countryName
                };
            } else if (req.user.role === 'presidium') {
                if (!req.body.country) {
                    return res.status(400).json({ error: 'Country name is required' });
                }
                req.body.action = 'add';
            } else {
                return res.status(403).json({ error: 'Only delegates and presidium can manage speaker list' });
            }

            // Redirect to main speaker list update controller
            req.params.id = id;
            return controller.updateSpeakerList(req, res);

        } catch (error) {
            logger.error('Add to speaker list error:', error);
            res.status(500).json({ error: 'Failed to add to speaker list' });
        }
    }
);

// Move delegate to end of speaker list (delegate can move themselves)
router.put('/:id/speaker-list/move',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            // Only delegates can move themselves, presidium can move anyone
            if (req.user.role === 'delegate') {
                req.body = {
                    action: 'move-to-end',
                    country: req.user.countryName
                };
            } else if (req.user.role === 'presidium') {
                if (!req.body.country) {
                    return res.status(400).json({ error: 'Country name is required' });
                }
                req.body.action = 'move-to-end';
            } else {
                return res.status(403).json({ error: 'Only delegates and presidium can manage speaker list' });
            }

            // Redirect to main speaker list update controller
            req.params.id = id;
            return controller.updateSpeakerList(req, res);

        } catch (error) {
            logger.error('Move in speaker list error:', error);
            res.status(500).json({ error: 'Failed to move in speaker list' });
        }
    }
);

// Get current mode and settings
router.get('/:id/current-mode',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('currentMode modeSettings modeStartedAt');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                currentMode: session.currentMode,
                modeSettings: session.modeSettings,
                modeStartedAt: session.modeStartedAt
            });

        } catch (error) {
            logger.error('Get current mode error:', error);
            res.status(500).json({ error: 'Failed to fetch current mode' });
        }
    }
);

// Get mode history
router.get('/:id/mode-history',
    global.auth.token,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');

            const session = await Session.findById(req.params.id)
                .select('modeHistory')
                .populate('modeHistory.startedBy', 'presidiumRole username');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                modeHistory: session.modeHistory
            });

        } catch (error) {
            logger.error('Get mode history error:', error);
            res.status(500).json({ error: 'Failed to fetch mode history' });
        }
    }
);

// Delete session (admin only)
router.delete('/:id',
    global.auth.token,
    global.auth.admin,
    validateSessionId,
    handleValidationErrors,
    controller.deleteSession
);

module.exports = router;