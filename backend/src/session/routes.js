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

// ==================== SESSION LIFECYCLE ====================

// Create session with initial mode
router.post('/',
    global.auth.token,
    global.auth.presidium,
    [
        body('committeeId').isMongoId().withMessage('Valid committee ID required'),
        body('initialMode').optional().isIn(['formal', 'moderated', 'unmoderated', 'informal']),
        body('speechTime').optional().isInt({ min: 30, max: 600 }),
        body('questionsAllowed').optional().isBoolean(),
        body('autoStart').optional().isBoolean()
    ],
    handleValidationErrors,
    controller.createSession
);

// Start session
router.put('/:id/start',
    global.auth.token,
    global.auth.presidium,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.startSession
);

// End session
router.put('/:id/end',
    global.auth.token,
    global.auth.presidium,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.endSession
);

// Get session details - Frontend uses /sessions/detail/:id
router.get('/detail/:id',
    global.auth.token,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.getSession
);

// Get committee sessions - Frontend uses /sessions/:committeeId
router.get('/:committeeId',
    global.auth.token,
    [
        param('committeeId').isMongoId(),
        query('status').optional().isIn(['inactive', 'active', 'paused', 'completed']),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    handleValidationErrors,
    controller.getCommitteeSessions
);

// ==================== ROLL CALL ====================

// Start roll call
router.post('/:id/roll-call/start',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('timeLimit').optional().isInt({ min: 1, max: 60 })
    ],
    handleValidationErrors,
    controller.startRollCall
);

// End roll call (initializes speaker lists)
router.post('/:id/roll-call/end',
    global.auth.token,
    global.auth.presidium,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.endRollCall
);

// Mark attendance
router.put('/:id/attendance',
    global.auth.token,
    [
        param('id').isMongoId(),
        body('country').isString().trim().notEmpty(),
        body('status').isIn(['absent', 'present'])
    ],
    handleValidationErrors,
    controller.markAttendance
);

// ==================== MODE MANAGEMENT ====================

// Change debate mode - Frontend calls PUT /sessions/:id/mode
router.put('/:id/mode',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('mode').isIn(['formal', 'moderated', 'unmoderated', 'informal']),
        body('settings').optional().isObject(),
        body('settings.speechTime').optional().isInt({ min: 30, max: 600 }),
        body('settings.totalTime').optional().isInt({ min: 60, max: 1200 }),
        body('settings.topic').optional().isString(),
        body('settings.questionsAllowed').optional().isBoolean()
    ],
    handleValidationErrors,
    controller.changeMode
);

// ==================== TIMER MANAGEMENT ====================

// Start session timer
router.post('/:id/timers/session/start',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('duration').isInt({ min: 300, max: 14400 }),
        body('purpose').optional().isString()
    ],
    handleValidationErrors,
    controller.startSessionTimer
);

// Start debate timer (after mode change to moderated/unmoderated)
router.post('/:id/timers/debate/start',
    global.auth.token,
    global.auth.presidium,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.startDebateTimer
);

// Toggle timer (pause/resume)
router.put('/:id/timers/toggle',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('timerType').isIn(['session', 'debate', 'speaker'])
    ],
    handleValidationErrors,
    controller.toggleTimer
);

// Adjust timer
router.put('/:id/timers/adjust',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('timerType').isIn(['session', 'debate', 'speaker']),
        body('newTime').isInt({ min: 0, max: 7200 })
    ],
    handleValidationErrors,
    controller.adjustTimer
);

// Add additional timer
router.post('/:id/timers/additional',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('name').isString().trim().isLength({ min: 1, max: 100 }),
        body('purpose').isString().trim().isLength({ min: 1, max: 200 }),
        body('duration').isInt({ min: 30, max: 7200 })
    ],
    handleValidationErrors,
    controller.addAdditionalTimer
);

// ==================== SPEAKER MANAGEMENT ====================

// Add speaker to queue (for formal mode manual additions)
router.post('/:id/speakers/add',
    global.auth.token,
    [
        param('id').isMongoId(),
        body('country').isString().trim().notEmpty(),
        body('email').isEmail()
    ],
    handleValidationErrors,
    async (req, res) => {
        // This is just for manual additions in formal mode
        // The main speaker list is initialized automatically after roll call
        res.status(501).json({
            error: 'Manual speaker addition not implemented',
            message: 'Speaker lists are automatically initialized after roll call'
        });
    }
);

// Remove speaker from queue (presidium only)
router.delete('/:id/speakers/:country',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        param('country').isString().trim().notEmpty()
    ],
    handleValidationErrors,
    async (req, res) => {
        // You could implement this if needed
        res.status(501).json({
            error: 'Speaker removal not implemented',
            message: 'Speaker lists are managed automatically'
        });
    }
);

// Set current speaker (and start their timer)
router.put('/:id/speakers/current',
    global.auth.token,
    global.auth.presidium,
    [
        param('id').isMongoId(),
        body('country').isString().trim().notEmpty()
    ],
    handleValidationErrors,
    controller.setCurrentSpeaker
);

// Move speaker to end of queue (delegates can move themselves once)
router.put('/:id/speakers/move-to-end',
    global.auth.token,
    [
        param('id').isMongoId(),
        body('country').isString().trim().notEmpty()
    ],
    handleValidationErrors,
    controller.moveToEnd
);

// Get next speaker
router.get('/:id/speakers/next',
    global.auth.token,
    [param('id').isMongoId()],
    handleValidationErrors,
    controller.getNextSpeaker
);

// Get speakers (just return the session data)
router.get('/:id/speakers',
    global.auth.token,
    [param('id').isMongoId()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Session } = require('./model');
            const session = await Session.findById(req.params.id)
                .select('speakerLists currentSpeaker');

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            res.json({
                success: true,
                speakerLists: session.speakerLists,
                currentSpeaker: session.currentSpeaker
            });
        } catch (error) {
            global.logger.error('Get speakers error:', error);
            res.status(500).json({ error: 'Failed to get speakers' });
        }
    }
);

module.exports = router;