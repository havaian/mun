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
const validateBilateralConversation = [
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('targetEmail')
        .isEmail()
        .withMessage('Valid target email is required'),
    body('targetCountry')
        .isLength({ min: 2, max: 50 })
        .withMessage('Target country must be between 2 and 50 characters')
];

const validateGroupConversation = [
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('title')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Description cannot exceed 300 characters')
        .trim(),
    body('participants')
        .optional()
        .isArray()
        .withMessage('Participants must be an array'),
    body('participants.*.email')
        .optional()
        .isEmail()
        .withMessage('Participant email must be valid'),
    body('participants.*.country')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Participant country must be between 2 and 50 characters')
];

const validateMessage = [
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message content must be between 1 and 2000 characters')
        .trim(),
    body('replyTo')
        .optional()
        .isMongoId()
        .withMessage('Reply to must be valid message ID')
];

const validateMessageEdit = [
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message content must be between 1 and 2000 characters')
        .trim()
];

const validateMarkRead = [
    body('messageIds')
        .optional()
        .isArray()
        .withMessage('Message IDs must be an array'),
    body('messageIds.*')
        .optional()
        .isMongoId()
        .withMessage('Each message ID must be valid')
];

const validateAddParticipant = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
    body('country')
        .isLength({ min: 2, max: 50 })
        .withMessage('Country must be between 2 and 50 characters')
];

// Conversation management routes

// Create bilateral conversation
router.post('/bilateral',
    global.auth.token,
    global.auth.delegate,
    validateBilateralConversation,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.createBilateralConversation
);

// Create group conversation
router.post('/group',
    global.auth.token,
    global.auth.delegate,
    validateGroupConversation,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.createGroupConversation
);

// Get user conversations
router.get('/committee/:committeeId',
    global.auth.token,
    param('committeeId').isMongoId().withMessage('Valid committee ID is required'),
    query('type').optional().isIn(['bilateral', 'group', 'coalition', 'committee_wide', 'all']).withMessage('Invalid conversation type'),
    query('includeArchived').optional().isBoolean().withMessage('Include archived must be boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.getUserConversations
);

router.all('/committee/:committeeId/channel/:channelType', (req, res, next) => {
    console.log('Route hit:', req.method, req.path, req.params);
    next();
});

// Committee-wide/public channel routes
router.get('/committee/:committeeId/channel/:channelType',
    global.auth.token,
    param('committeeId').isMongoId().withMessage('Valid committee ID is required'),
    param('channelType').isIn(['general', 'announcements', 'gossip']).withMessage('Invalid channel type'),
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.getOrCreateCommitteeConversation
);

router.post('/committee/:committeeId/channel/:channelType',
    global.auth.token,
    param('committeeId').isMongoId().withMessage('Valid committee ID is required'),
    param('channelType').isIn(['general', 'announcements', 'gossip']).withMessage('Invalid channel type'),
    validateMessage,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.sendCommitteeMessage
);

// Get single conversation
router.get('/:id',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isMongoId().withMessage('Before must be valid message ID'),
    handleValidationErrors,
    controller.getConversation
);

// Message operations

// Send message
router.post('/:id/messages',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    validateMessage,
    handleValidationErrors,
    controller.sendMessage
);

// Edit message
router.put('/:id/messages/:messageId',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    param('messageId').isMongoId().withMessage('Valid message ID is required'),
    validateMessageEdit,
    handleValidationErrors,
    controller.editMessage
);

// Mark messages as read
router.post('/:id/read',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    validateMarkRead,
    handleValidationErrors,
    controller.markAsRead
);

// Participant management

// Add participant to group
router.post('/:id/participants',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    validateAddParticipant,
    handleValidationErrors,
    controller.addParticipant
);

// Leave conversation
router.delete('/:id/leave',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    handleValidationErrors,
    controller.leaveConversation
);

// Archive/unarchive conversation
router.put('/:id/archive',
    global.auth.token,
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    body('archived').isBoolean().withMessage('Archived must be boolean'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Conversation } = require('./model');
            const { id } = req.params;
            const { archived } = req.body;

            const conversation = await Conversation.findById(id);
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }

            // Check if user can access conversation
            if (!conversation.canUserAccess(req.user.email)) {
                return res.status(403).json({ error: 'Access denied to this conversation' });
            }

            // Only admins can archive group conversations
            if (conversation.conversationType === 'group' && !conversation.isUserAdmin(req.user.email)) {
                return res.status(403).json({ error: 'Only conversation admins can archive group conversations' });
            }

            conversation.settings.isArchived = archived;
            await conversation.save();

            res.json({
                success: true,
                message: `Conversation ${archived ? 'archived' : 'unarchived'} successfully`
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to archive conversation' });
        }
    }
);

module.exports = router;