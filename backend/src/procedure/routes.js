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

// Validation schemas for procedural motions
const validateMotionSubmission = [
    body('sessionId')
        .isMongoId()
        .withMessage('Valid session ID is required'),
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('motionType')
        .isIn([
            'close_debate', 'suspension', 'moderated_caucus', 'unmoderated_caucus',
            'informal_consultation', 'extend_debate', 'voting_procedure',
            'disciplinary_action', 'technical_break', 'change_speaking_time',
            'reopen_speakers_list', 'limit_speakers', 'change_agenda'
        ])
        .withMessage('Invalid motion type'),
    body('text')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Motion text must be between 10 and 1000 characters')
        .trim(),
    body('justification')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Justification cannot exceed 500 characters')
        .trim(),
    body('purpose')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Purpose cannot exceed 300 characters')
        .trim(),
    body('parameters.duration')
        .optional()
        .isInt({ min: 30, max: 3600 })
        .withMessage('Duration must be between 30 and 3600 seconds'),
    body('parameters.speechTime')
        .optional()
        .isInt({ min: 15, max: 300 })
        .withMessage('Speech time must be between 15 and 300 seconds'),
    body('parameters.topic')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Topic cannot exceed 200 characters')
        .trim(),
    body('parameters.targetDelegate')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Target delegate cannot exceed 100 characters')
        .trim()
];

const validatePresidiumMotion = [
    ...validateMotionSubmission,
    body('priority')
        .optional()
        .isIn(['highest', 'procedural', 'debate'])
        .withMessage('Priority must be highest, procedural, or debate')
];

const validateMotionReview = [
    body('action')
        .isIn(['accept', 'reject', 'modify_order'])
        .withMessage('Action must be accept, reject, or modify_order'),
    body('comments')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Comments cannot exceed 1000 characters')
        .trim(),
    body('newPriority')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('New priority must be between 1 and 10')
];

// Validation schemas for questions
const validateQuestionSubmission = [
    body('sessionId')
        .isMongoId()
        .withMessage('Valid session ID is required'),
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('questionType')
        .isIn([
            'personal_privilege', 'voting_procedure', 'to_speaker',
            'procedure', 'to_chairman', 'to_expert', 'right_of_reply'
        ])
        .withMessage('Invalid question type'),
    body('targetRole')
        .isIn(['chairman', 'expert', 'speaker'])
        .withMessage('Target role must be chairman, expert, or speaker'),
    body('targetCountry')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Target country must be between 2 and 50 characters'),
    body('text')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Question text must be between 10 and 1000 characters')
        .trim(),
    body('context')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Context cannot exceed 500 characters')
        .trim(),
    body('rightOfReply.targetStatement')
        .optional()
        .isLength({ min: 10, max: 500 })
        .withMessage('Target statement must be between 10 and 500 characters'),
    body('rightOfReply.targetSpeaker')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Target speaker must be between 2 and 50 characters'),
    body('rightOfReply.timeAllocated')
        .optional()
        .isInt({ min: 30, max: 180 })
        .withMessage('Time allocated must be between 30 and 180 seconds')
];

const validateQuestionResponse = [
    body('responseText')
        .isLength({ min: 5, max: 2000 })
        .withMessage('Response text must be between 5 and 2000 characters')
        .trim(),
    body('responseType')
        .optional()
        .isIn(['oral', 'written'])
        .withMessage('Response type must be oral or written')
];

const validateIdParam = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID')
];

const validateSessionId = [
    param('sessionId')
        .isMongoId()
        .withMessage('Invalid session ID')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

// PROCEDURAL MOTIONS ROUTES

// Submit procedural motion (delegates)
router.post('/motions',
    authenticateToken,
    requireDelegate,
    validateMotionSubmission,
    handleValidationErrors,
    requireSameCommittee,
    controller.submitMotion
);

// Submit presidium motion (presidium only)
router.post('/motions/presidium',
    authenticateToken,
    requirePresidium,
    validatePresidiumMotion,
    handleValidationErrors,
    requireSameCommittee,
    controller.submitPresidiumMotion
);

// Support motion (delegates)
router.post('/motions/:id/support',
    authenticateToken,
    requireDelegate,
    validateIdParam,
    handleValidationErrors,
    controller.supportMotion
);

// Review motion (presidium only)
router.put('/motions/:id/review',
    authenticateToken,
    requirePresidium,
    validateIdParam,
    validateMotionReview,
    handleValidationErrors,
    controller.reviewMotion
);

// Get motions for session
router.get('/motions/session/:sessionId',
    authenticateToken,
    validateSessionId,
    [
        query('status')
            .optional()
            .isIn(['submitted', 'under_review', 'accepted', 'rejected', 'voted', 'implemented', 'all'])
            .withMessage('Status must be submitted, under_review, accepted, rejected, voted, implemented, or all'),
        query('priority')
            .optional()
            .isIn(['highest', 'procedural', 'debate', 'all'])
            .withMessage('Priority must be highest, procedural, debate, or all'),
        ...validatePagination
    ],
    handleValidationErrors,
    controller.getSessionMotions
);

// Get single motion details
router.get('/motions/:id',
    authenticateToken,
    validateIdParam,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { ProceduralMotion } = require('./model');

            const motion = await ProceduralMotion.findById(req.params.id)
                .populate('presidiumDecision.decidedBy', 'username')
                .populate('presidiumAuthor', 'username');

            if (!motion) {
                return res.status(404).json({ error: 'Motion not found' });
            }

            // Format response
            const motionData = {
                _id: motion._id,
                motionType: motion.motionType,
                priority: motion.priority,
                text: motion.text,
                justification: motion.justification,
                purpose: motion.purpose,
                parameters: motion.parameters,
                authorCountry: motion.authorCountry,
                submittedBy: motion.submittedBy,
                presidiumAuthor: motion.presidiumAuthor,
                support: motion.support.map(s => ({
                    country: s.country,
                    supportedAt: s.supportedAt
                })),
                requiredSupport: motion.requiredSupport,
                hasRequiredSupport: motion.hasRequiredSupport,
                status: motion.status,
                presidiumDecision: motion.presidiumDecision,
                votingResult: motion.votingResult,
                submittedAt: motion.submittedAt,
                processedAt: motion.processedAt,
                createdAt: motion.createdAt,
                updatedAt: motion.updatedAt
            };

            res.json({
                success: true,
                motion: motionData
            });

        } catch (error) {
            logger.error('Get motion error:', error);
            res.status(500).json({ error: 'Failed to get motion details' });
        }
    }
);

// QUESTIONS ROUTES

// Submit question (delegates)
router.post('/questions',
    authenticateToken,
    requireDelegate,
    validateQuestionSubmission,
    handleValidationErrors,
    requireSameCommittee,
    controller.submitQuestion
);

// Answer question (presidium or authorized users)
router.put('/questions/:id/answer',
    authenticateToken,
    validateIdParam,
    validateQuestionResponse,
    handleValidationErrors,
    controller.answerQuestion
);

// Get questions for session
router.get('/questions/session/:sessionId',
    authenticateToken,
    validateSessionId,
    [
        query('status')
            .optional()
            .isIn(['submitted', 'under_review', 'answered', 'rejected', 'all'])
            .withMessage('Status must be submitted, under_review, answered, rejected, or all'),
        query('questionType')
            .optional()
            .isIn([
                'personal_privilege', 'voting_procedure', 'to_speaker',
                'procedure', 'to_chairman', 'to_expert', 'right_of_reply', 'all'
            ])
            .withMessage('Invalid question type filter'),
        ...validatePagination
    ],
    handleValidationErrors,
    controller.getSessionQuestions
);

// Get single question details
router.get('/questions/:id',
    authenticateToken,
    validateIdParam,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Question } = require('./model');

            const question = await Question.findById(req.params.id)
                .populate('response.respondedBy', 'username');

            if (!question) {
                return res.status(404).json({ error: 'Question not found' });
            }

            const questionData = {
                _id: question._id,
                questionType: question.questionType,
                priority: question.priority,
                text: question.text,
                context: question.context,
                authorCountry: question.authorCountry,
                targetRole: question.targetRole,
                targetCountry: question.targetCountry,
                rightOfReply: question.rightOfReply,
                status: question.status,
                response: question.response,
                submittedAt: question.submittedAt,
                processedAt: question.processedAt,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt
            };

            res.json({
                success: true,
                question: questionData
            });

        } catch (error) {
            logger.error('Get question error:', error);
            res.status(500).json({ error: 'Failed to get question details' });
        }
    }
);

// Bulk operations (presidium only)

// Mark multiple questions as reviewed
router.post('/questions/bulk/review',
    authenticateToken,
    requirePresidium,
    [
        body('questionIds')
            .isArray({ min: 1 })
            .withMessage('Question IDs array is required'),
        body('questionIds.*')
            .isMongoId()
            .withMessage('Each question ID must be valid'),
        body('action')
            .isIn(['accept', 'reject'])
            .withMessage('Action must be accept or reject'),
        body('comments')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Comments cannot exceed 500 characters')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Question } = require('./model');
            const { questionIds, action, comments } = req.body;

            const newStatus = action === 'accept' ? 'under_review' : 'rejected';

            const result = await Question.updateMany(
                {
                    _id: { $in: questionIds },
                    status: 'submitted'
                },
                {
                    status: newStatus,
                    processedAt: new Date()
                }
            );

            // Emit notifications
            if (req.app.locals.io) {
                const { emitToRoom } = require('../websocket/socketManager');
                emitToRoom(req.app.locals.io, `committee-${req.user.committeeId}`, 'questions-bulk-reviewed', {
                    action,
                    count: result.modifiedCount,
                    reviewedBy: req.user.username
                });
            }

            res.json({
                success: true,
                modifiedCount: result.modifiedCount,
                message: `${result.modifiedCount} questions ${action}ed`
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to bulk review questions' });
        }
    }
);

// Get motion queue (ordered by priority and time)
router.get('/motions/session/:sessionId/queue',
    authenticateToken,
    validateSessionId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { ProceduralMotion } = require('./model');

            const motions = await ProceduralMotion.find({
                sessionId: req.params.sessionId,
                status: { $in: ['submitted', 'accepted'] }
            })
                .sort({
                    priority: 1, // Highest priority first
                    submittedAt: 1 // Earlier submissions first within same priority
                })
                .limit(10) // Show next 10 motions in queue
                .populate('presidiumDecision.decidedBy', 'username');

            const queueData = motions.map(motion => ({
                _id: motion._id,
                motionType: motion.motionType,
                priority: motion.priority,
                text: motion.text.substring(0, 100) + (motion.text.length > 100 ? '...' : ''),
                authorCountry: motion.authorCountry,
                hasRequiredSupport: motion.hasRequiredSupport,
                supportCount: motion.support.length,
                status: motion.status,
                submittedAt: motion.submittedAt
            }));

            res.json({
                success: true,
                queue: queueData,
                count: queueData.length
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to get motion queue' });
        }
    }
);

module.exports = router;