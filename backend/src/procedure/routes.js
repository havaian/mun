// backend/src/procedure/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/procedure
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

const validateIdParam = [param('id').isMongoId().withMessage('Valid ID is required')];
const validateSessionId = [param('sessionId').isMongoId().withMessage('Valid session ID is required')];

const validateMotionSubmission = [
    body('sessionId').isMongoId().withMessage('Valid session ID is required'),
    body('committeeId').isMongoId().withMessage('Valid committee ID is required'),
    body('motionType').isIn([
        'close_debate', 'suspension', 'moderated_caucus', 'unmoderated_caucus',
        'informal_consultation', 'extend_debate', 'voting_procedure',
        'disciplinary_action', 'technical_break', 'change_speaking_time',
        'reopen_speakers_list', 'limit_speakers', 'change_agenda'
    ]).withMessage('Invalid motion type'),
    body('text').isLength({ min: 10, max: 1000 }).withMessage('Motion text must be between 10 and 1000 characters').trim(),
    body('justification').optional().isLength({ max: 500 }).withMessage('Justification cannot exceed 500 characters').trim(),
    body('purpose').optional().isLength({ max: 300 }).withMessage('Purpose cannot exceed 300 characters').trim(),
    body('parameters.duration').optional().isInt({ min: 30, max: 3600 }).withMessage('Duration must be between 30 and 3600 seconds'),
    body('parameters.speechTime').optional().isInt({ min: 15, max: 300 }).withMessage('Speech time must be between 15 and 300 seconds'),
    body('parameters.topic').optional().isLength({ max: 200 }).withMessage('Topic cannot exceed 200 characters').trim()
];

const validateMotionReview = [
    body('decision').isIn(['accept', 'reject', 'defer', 'put_to_vote']).withMessage('Invalid decision'),
    body('reasoning').optional().isLength({ max: 500 }).withMessage('Reasoning cannot exceed 500 characters').trim()
];

const validateQuestionSubmission = [
    body('sessionId').isMongoId().withMessage('Valid session ID is required'),
    body('committeeId').isMongoId().withMessage('Valid committee ID is required'),
    body('questionType').isIn([
        'personal_privilege', 'voting_procedure', 'to_speaker',
        'procedure', 'to_chairman', 'to_expert', 'right_of_reply', 'general'
    ]).withMessage('Invalid question type'),
    body('text').isLength({ min: 5, max: 500 }).withMessage('Question text must be between 5 and 500 characters').trim()
];

const validateQuestionResponse = [
    body('answer').isLength({ min: 5, max: 2000 }).withMessage('Answer must be between 5 and 2000 characters').trim(),
    body('status').isIn(['answered', 'rejected']).withMessage('Status must be answered or rejected')
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Shared: token + event context + participant
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== MOTION ROUTES ====================

// Submit motion (delegates only)
router.post('/motions',
    global.auth.delegate,
    validateMotionSubmission,
    handleValidationErrors,
    controller.submitMotion
);

// Support motion (delegates only)
router.post('/motions/:id/support',
    global.auth.delegate,
    validateIdParam,
    handleValidationErrors,
    controller.supportMotion
);

// Review motion (presidium only)
router.put('/motions/:id/review',
    global.auth.presidium,
    validateIdParam,
    validateMotionReview,
    handleValidationErrors,
    controller.reviewMotion
);

// Get motions for session (any participant)
router.get('/motions/session/:sessionId',
    validateSessionId,
    [
        query('status').optional().isIn(['submitted', 'under_review', 'accepted', 'rejected', 'voted', 'implemented', 'all']).withMessage('Invalid status filter'),
        query('priority').optional().isIn(['highest', 'procedural', 'debate', 'all']).withMessage('Invalid priority filter'),
        ...validatePagination
    ],
    handleValidationErrors,
    controller.getSessionMotions
);

// Get single motion (any participant)
router.get('/motions/:id',
    validateIdParam,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { ProceduralMotion } = require('./model');
            const motion = await ProceduralMotion.findById(req.params.id)
                .populate('presidiumDecision.decidedBy', 'firstName lastName')
                .populate('presidiumAuthor', 'firstName lastName');

            if (!motion) return res.status(404).json({ error: 'Motion not found' });

            res.json({ success: true, motion });
        } catch (error) {
            global.logger.error('Get motion error:', error);
            res.status(500).json({ error: 'Failed to get motion details' });
        }
    }
);

// Get motion queue (any participant)
router.get('/motions/session/:sessionId/queue',
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { ProceduralMotion } = require('./model');
            const motions = await ProceduralMotion.find({
                sessionId: req.params.sessionId,
                status: { $in: ['submitted', 'accepted'] }
            })
                .sort({ priority: 1, submittedAt: 1 })
                .limit(10)
                .populate('presidiumDecision.decidedBy', 'firstName lastName');

            const queueData = motions.map(motion => ({
                _id: motion._id, motionType: motion.motionType, priority: motion.priority,
                text: motion.text.substring(0, 100) + (motion.text.length > 100 ? '...' : ''),
                authorCountry: motion.authorCountry, hasRequiredSupport: motion.hasRequiredSupport,
                supportCount: motion.support.length, status: motion.status, submittedAt: motion.submittedAt
            }));

            res.json({ success: true, queue: queueData, count: queueData.length });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get motion queue' });
        }
    }
);

// ==================== QUESTION ROUTES ====================

// Submit question (delegates only)
router.post('/questions',
    global.auth.delegate,
    validateQuestionSubmission,
    handleValidationErrors,
    controller.submitQuestion
);

// Answer question (presidium)
router.put('/questions/:id/answer',
    global.auth.presidium,
    validateIdParam,
    validateQuestionResponse,
    handleValidationErrors,
    controller.answerQuestion
);

// Get questions for session (any participant)
router.get('/questions/session/:sessionId',
    validateSessionId,
    [
        query('status').optional().isIn(['submitted', 'under_review', 'answered', 'rejected', 'all']).withMessage('Invalid status filter'),
        query('questionType').optional().isIn([
            'personal_privilege', 'voting_procedure', 'to_speaker',
            'procedure', 'to_chairman', 'to_expert', 'right_of_reply', 'general', 'all'
        ]).withMessage('Invalid question type filter'),
        ...validatePagination
    ],
    handleValidationErrors,
    controller.getSessionQuestions
);

// Bulk review questions (presidium only)
router.post('/questions/bulk-review',
    global.auth.presidium,
    [
        body('questionIds').isArray({ min: 1 }).withMessage('Question IDs array required'),
        body('questionIds.*').isMongoId().withMessage('Each question ID must be valid'),
        body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Question } = require('./model');
            const { questionIds, action } = req.body;
            const newStatus = action === 'approve' ? 'under_review' : 'rejected';

            const result = await Question.updateMany(
                { _id: { $in: questionIds }, status: 'submitted' },
                { status: newStatus, processedAt: new Date() }
            );

            if (req.app.locals.io) {
                const { committeeId } = req.params;
                const { emitToRoom } = require('../websocket/socketManager');
                emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'questions-bulk-reviewed', {
                    action, count: result.modifiedCount, reviewedBy: req.user.email
                });
            }

            res.json({ success: true, modifiedCount: result.modifiedCount, message: `${result.modifiedCount} questions ${action}ed` });
        } catch (error) {
            res.status(500).json({ error: 'Failed to bulk review questions' });
        }
    }
);

module.exports = router;