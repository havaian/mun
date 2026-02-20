// backend/src/messaging/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/messages
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

const validateMessage = [
    body('content').isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters').trim(),
    body('replyTo').optional().isMongoId().withMessage('Reply-to must be a valid message ID')
];

const validateMessageEdit = [
    body('content').isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters').trim()
];

const validateBilateralConversation = [
    body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
    body('recipientCountry').isLength({ min: 2, max: 50 }).withMessage('Recipient country must be between 2 and 50 characters')
];

const validateGroupConversation = [
    body('title').isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters').trim(),
    body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters').trim(),
    body('participants').optional().isArray().withMessage('Participants must be an array'),
    body('participants.*.email').optional().isEmail().withMessage('Valid email required'),
    body('participants.*.country').optional().isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters')
];

const validateMarkRead = [
    body('messageIds').optional().isArray().withMessage('Message IDs must be an array'),
    body('messageIds.*').optional().isMongoId().withMessage('Each message ID must be valid')
];

const validateAddParticipant = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('country').isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters')
];

// Shared: token + event context + participant
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== CONVERSATION MANAGEMENT ====================

// Create bilateral conversation (delegates only)
router.post('/bilateral',
    global.auth.delegate,
    validateBilateralConversation,
    handleValidationErrors,
    controller.createBilateralConversation
);

// Create group conversation (delegates only)
router.post('/group',
    global.auth.delegate,
    validateGroupConversation,
    handleValidationErrors,
    controller.createGroupConversation
);

// Get user conversations for this committee (any participant)
router.get('/',
    query('type').optional().isIn(['bilateral', 'group', 'coalition', 'committee_wide', 'all']).withMessage('Invalid conversation type'),
    query('includeArchived').optional().isBoolean().withMessage('Include archived must be boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    handleValidationErrors,
    controller.getUserConversations
);

// ==================== COMMITTEE-WIDE CHANNELS ====================

// Get or create committee channel (any participant)
router.get('/channel/:channelType',
    param('channelType').isIn(['general', 'announcements', 'gossip']).withMessage('Invalid channel type'),
    handleValidationErrors,
    controller.getOrCreateCommitteeConversation
);

// Send message to committee channel (any participant, announcements require presidium — checked in controller)
router.post('/channel/:channelType',
    param('channelType').isIn(['general', 'announcements', 'gossip']).withMessage('Invalid channel type'),
    validateMessage,
    handleValidationErrors,
    controller.sendCommitteeMessage
);

// ==================== SINGLE CONVERSATION ====================

// Get conversation (access checked in controller via canUserAccess)
router.get('/conversation/:id',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isMongoId().withMessage('Before must be valid message ID'),
    handleValidationErrors,
    controller.getConversation
);

// ==================== MESSAGE OPERATIONS ====================

// Send message
router.post('/conversation/:id/messages',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    validateMessage,
    handleValidationErrors,
    controller.sendMessage
);

// Edit message
router.put('/conversation/:id/messages/:messageId',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    param('messageId').isMongoId().withMessage('Valid message ID is required'),
    validateMessageEdit,
    handleValidationErrors,
    controller.editMessage
);

// Mark messages as read
router.post('/conversation/:id/read',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    validateMarkRead,
    handleValidationErrors,
    controller.markAsRead
);

// ==================== PARTICIPANT MANAGEMENT ====================

// Add participant to group
router.post('/conversation/:id/participants',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    validateAddParticipant,
    handleValidationErrors,
    controller.addParticipant
);

// Leave conversation
router.delete('/conversation/:id/leave',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    handleValidationErrors,
    controller.leaveConversation
);

// Archive/unarchive conversation
router.put('/conversation/:id/archive',
    param('id').isMongoId().withMessage('Valid conversation ID is required'),
    body('archived').isBoolean().withMessage('Archived must be boolean'),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Conversation } = require('./model');
            const { id } = req.params;
            const { archived } = req.body;

            const conversation = await Conversation.findById(id);
            if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
            if (!conversation.canUserAccess(req.user.email)) return res.status(403).json({ error: 'Access denied' });

            if (conversation.conversationType === 'group' && !conversation.isUserAdmin(req.user.email)) {
                return res.status(403).json({ error: 'Only conversation admins can archive group conversations' });
            }

            conversation.settings.isArchived = archived;
            await conversation.save();

            res.json({ success: true, message: `Conversation ${archived ? 'archived' : 'unarchived'} successfully` });
        } catch (error) {
            res.status(500).json({ error: 'Failed to archive conversation' });
        }
    }
);

module.exports = router;