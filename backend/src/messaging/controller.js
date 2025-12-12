const { Conversation } = require('./model');
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const { emitToUser, emitToRoom } = require('../websocket/socketManager');

// Create bilateral conversation
const createBilateralConversation = async (req, res) => {
    try {
        const { committeeId, targetEmail, targetCountry } = req.body;

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check if target user exists and is in same committee
        const targetUser = await User.findOne({ email: targetEmail });
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        if (targetUser.committeeId.toString() !== committeeId) {
            return res.status(400).json({ error: 'Target user is not in the same committee' });
        }

        // Check if bilateral conversation already exists
        const existingConversation = await Conversation.findOne({
            committeeId,
            conversationType: 'bilateral',
            'participants.email': { $all: [req.user.email, targetEmail] },
            'settings.isArchived': false
        });

        if (existingConversation) {
            return res.status(400).json({
                error: 'Bilateral conversation already exists',
                conversationId: existingConversation._id
            });
        }

        // Create bilateral conversation
        const conversation = Conversation.createBilateral(
            committeeId,
            req.user.email,
            req.user.countryName,
            targetEmail,
            targetCountry,
            req.user.email
        );

        await conversation.save();

        // Emit notification to target user
        if (req.app.locals.io) {
            emitToUser(req.app.locals.io, targetEmail, 'conversation-created', {
                conversationId: conversation._id,
                type: 'bilateral',
                initiatedBy: req.user.countryName
            });
        }

        global.logger.info(`Bilateral conversation created between ${req.user.countryName} and ${targetCountry}`);

        res.status(201).json({
            success: true,
            conversation: formatConversationResponse(conversation, req.user.email),
            message: 'Bilateral conversation created successfully'
        });

    } catch (error) {
        global.logger.error('Create bilateral conversation error:', error);
        res.status(500).json({ error: 'Failed to create bilateral conversation' });
    }
};

// Create group conversation
const createGroupConversation = async (req, res) => {
    try {
        const { committeeId, title, description, participants } = req.body;

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Validate participants
        if (participants && participants.length > 0) {
            for (const participant of participants) {
                const user = await User.findOne({ email: participant.email });
                if (!user) {
                    return res.status(400).json({
                        error: `User ${participant.email} not found`
                    });
                }

                if (user.committeeId.toString() !== committeeId) {
                    return res.status(400).json({
                        error: `User ${participant.email} is not in the same committee`
                    });
                }
            }
        }

        // Create group conversation
        const conversation = Conversation.createGroup(
            committeeId,
            title,
            description,
            req.user.email,
            req.user.countryName,
            participants || []
        );

        await conversation.save();

        // Emit notifications to all participants
        if (req.app.locals.io && participants) {
            for (const participant of participants) {
                emitToUser(req.app.locals.io, participant.email, 'conversation-invited', {
                    conversationId: conversation._id,
                    type: 'group',
                    title: conversation.title,
                    invitedBy: req.user.countryName
                });
            }
        }

        global.logger.info(`Group conversation created: "${title}" by ${req.user.countryName}`);

        res.status(201).json({
            success: true,
            conversation: formatConversationResponse(conversation, req.user.email),
            message: 'Group conversation created successfully'
        });

    } catch (error) {
        global.logger.error('Create group conversation error:', error);
        res.status(500).json({ error: 'Failed to create group conversation' });
    }
};

// Send message
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, replyTo } = req.body;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user can access conversation
        if (!conversation.canUserAccess(req.user.email)) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Add message
        const message = conversation.addMessage(
            req.user.email,
            req.user.countryName,
            content,
            'text',
            replyTo
        );

        await conversation.save();

        // Emit to all participants
        if (req.app.locals.io) {
            conversation.participants
                .filter(p => p.isActive && p.email !== req.user.email)
                .forEach(participant => {
                    emitToUser(req.app.locals.io, participant.email, 'message-received', {
                        conversationId: conversation._id,
                        messageId: message._id,
                        senderCountry: req.user.countryName,
                        content: message.content,
                        timestamp: message.timestamp,
                        replyTo: message.replyTo
                    });
                });
        }

        global.logger.info(`Message sent in conversation ${id} by ${req.user.countryName}`);

        res.status(201).json({
            success: true,
            message: formatMessageResponse(message),
            conversationId: conversation._id
        });

    } catch (error) {
        global.logger.error('Send message error:', error);
        res.status(500).json({ error: error.message || 'Failed to send message' });
    }
};

// Edit message
const editMessage = async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const { content } = req.body;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user can access conversation
        if (!conversation.canUserAccess(req.user.email)) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Edit message
        const message = conversation.editMessage(messageId, content, req.user.email);
        await conversation.save();

        // Emit to all participants
        if (req.app.locals.io) {
            conversation.participants
                .filter(p => p.isActive)
                .forEach(participant => {
                    emitToUser(req.app.locals.io, participant.email, 'message-edited', {
                        conversationId: conversation._id,
                        messageId: message._id,
                        newContent: message.content,
                        editedAt: message.editedAt
                    });
                });
        }

        global.logger.info(`Message edited in conversation ${id} by ${req.user.countryName}`);

        res.json({
            success: true,
            message: formatMessageResponse(message)
        });

    } catch (error) {
        global.logger.error('Edit message error:', error);
        res.status(500).json({ error: error.message || 'Failed to edit message' });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { messageIds } = req.body;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user can access conversation
        if (!conversation.canUserAccess(req.user.email)) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        let markedCount = 0;

        // Mark specific messages as read or all unread messages
        if (messageIds && messageIds.length > 0) {
            for (const messageId of messageIds) {
                try {
                    conversation.markAsRead(messageId, req.user.email);
                    markedCount++;
                } catch (error) {
                    // Continue with other messages if one fails
                    global.logger.warn(`Failed to mark message ${messageId} as read: ${error.message}`);
                }
            }
        } else {
            // Mark all unread messages as read
            for (const message of conversation.messages) {
                if (message.senderEmail !== req.user.email) {
                    const hasRead = message.readBy.find(r => r.email === req.user.email);
                    if (!hasRead) {
                        message.readBy.push({
                            email: req.user.email,
                            readAt: new Date()
                        });
                        markedCount++;
                    }
                }
            }
        }

        await conversation.save();

        res.json({
            success: true,
            markedCount,
            message: `${markedCount} messages marked as read`
        });

    } catch (error) {
        global.logger.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

// Get user conversations
const getUserConversations = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const {
            type = 'all',
            includeArchived = false,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {
            committeeId,
            'participants.email': req.user.email,
            'participants.isActive': true
        };

        if (type !== 'all') {
            filter.conversationType = type;
        }

        if (!includeArchived) {
            filter['settings.isArchived'] = false;
        }

        const skip = (page - 1) * limit;

        const conversations = await Conversation.find(filter)
            .sort({ lastActivity: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Conversation.countDocuments(filter);

        const conversationsData = conversations.map(conversation => {
            const formatted = formatConversationResponse(conversation, req.user.email);
            formatted.unreadCount = conversation.getUnreadCount(req.user.email);
            return formatted;
        });

        res.json({
            success: true,
            conversations: conversationsData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        global.logger.error('Get user conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

// Get conversation details
const getConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            page = 1,
            limit = 50,
            before = null // Get messages before this message ID
        } = req.query;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user can access conversation
        if (!conversation.canUserAccess(req.user.email)) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Paginate messages
        let messages = conversation.messages;

        if (before) {
            const beforeIndex = messages.findIndex(m => m._id.toString() === before);
            if (beforeIndex > 0) {
                messages = messages.slice(0, beforeIndex);
            }
        }

        const totalMessages = messages.length;
        const skip = Math.max(0, totalMessages - (page * limit));
        const paginatedMessages = messages.slice(skip, skip + parseInt(limit));

        const messagesData = paginatedMessages.map(message => formatMessageResponse(message));

        const conversationData = formatConversationResponse(conversation, req.user.email);
        conversationData.messages = messagesData;
        conversationData.unreadCount = conversation.getUnreadCount(req.user.email);
        conversationData.totalMessages = totalMessages;

        res.json({
            success: true,
            conversation: conversationData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMessages / limit),
                totalItems: totalMessages,
                hasNextPage: skip > 0,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        global.logger.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to get conversation details' });
    }
};

// Add participant to group conversation
const addParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, country } = req.body;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user is admin of the conversation
        if (!conversation.isUserAdmin(req.user.email)) {
            return res.status(403).json({ error: 'Only conversation admins can add participants' });
        }

        // Verify target user exists
        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        if (targetUser.committeeId.toString() !== conversation.committeeId.toString()) {
            return res.status(400).json({ error: 'Target user is not in the same committee' });
        }

        // Add participant
        conversation.addParticipant(email, country);
        await conversation.save();

        // Emit notification to new participant
        if (req.app.locals.io) {
            emitToUser(req.app.locals.io, email, 'conversation-joined', {
                conversationId: conversation._id,
                title: conversation.title,
                addedBy: req.user.countryName
            });

            // Notify other participants
            conversation.participants
                .filter(p => p.isActive && p.email !== email && p.email !== req.user.email)
                .forEach(participant => {
                    emitToUser(req.app.locals.io, participant.email, 'participant-added', {
                        conversationId: conversation._id,
                        newParticipant: country,
                        addedBy: req.user.countryName
                    });
                });
        }

        global.logger.info(`Participant ${country} added to conversation ${id} by ${req.user.countryName}`);

        res.json({
            success: true,
            conversation: formatConversationResponse(conversation, req.user.email),
            message: 'Participant added successfully'
        });

    } catch (error) {
        global.logger.error('Add participant error:', error);
        res.status(500).json({ error: error.message || 'Failed to add participant' });
    }
};

// Leave conversation
const leaveConversation = async (req, res) => {
    try {
        const { id } = req.params;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Check if user can access conversation
        if (!conversation.canUserAccess(req.user.email)) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        // Cannot leave bilateral conversations
        if (conversation.conversationType === 'bilateral') {
            return res.status(400).json({ error: 'Cannot leave bilateral conversations' });
        }

        // Remove participant
        conversation.removeParticipant(req.user.email);
        await conversation.save();

        // Emit notification to remaining participants
        if (req.app.locals.io) {
            conversation.participants
                .filter(p => p.isActive)
                .forEach(participant => {
                    emitToUser(req.app.locals.io, participant.email, 'participant-left', {
                        conversationId: conversation._id,
                        leftParticipant: req.user.countryName
                    });
                });
        }

        global.logger.info(`${req.user.countryName} left conversation ${id}`);

        res.json({
            success: true,
            message: 'Left conversation successfully'
        });

    } catch (error) {
        global.logger.error('Leave conversation error:', error);
        res.status(500).json({ error: error.message || 'Failed to leave conversation' });
    }
};

// Helper functions
const formatConversationResponse = (conversation, userEmail) => {
    const participant = conversation.participants.find(p => p.email === userEmail);

    return {
        _id: conversation._id,
        conversationType: conversation.conversationType,
        title: conversation.title,
        description: conversation.description,
        participants: conversation.participants
            .filter(p => p.isActive)
            .map(p => ({
                email: p.email,
                country: p.country,
                role: p.role,
                joinedAt: p.joinedAt
            })),
        activeParticipantsCount: conversation.activeParticipantsCount,
        messageCount: conversation.messageCount,
        lastActivity: conversation.lastActivity,
        settings: conversation.settings,
        userRole: participant ? participant.role : null,
        coalitionId: conversation.coalitionId,
        resolutionId: conversation.resolutionId,
        createdAt: conversation.createdAt
    };
};

const formatMessageResponse = (message) => {
    return {
        _id: message._id,
        senderEmail: message.senderEmail,
        senderCountry: message.senderCountry,
        content: message.content,
        messageType: message.messageType,
        replyTo: message.replyTo,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        readBy: message.readBy,
        timestamp: message.timestamp
    };
};

// Get or create committee-wide conversation
const getOrCreateCommitteeConversation = async (req, res) => {
    try {
        const { committeeId, channelType } = req.params;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (req.user.committeeId.toString() !== committeeId) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        const channelConfig = {
            'general': { title: 'General Assembly', description: 'Global floor discussion' },
            'announcements': { title: 'Announcements', description: 'Official Presidium updates' },
            'gossip': { title: 'Gossip Box', description: 'Anonymous chatter' }
        };

        const config = channelConfig[channelType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid channel type' });
        }

        let conversation = await Conversation.findOne({
            committeeId,
            conversationType: 'committee_wide',
            title: config.title
        });

        if (!conversation) {
            const participants = committee.countries
                .filter(country => country.email && country.isActive)
                .map(country => ({
                    email: country.email,
                    country: country.name,
                    role: 'member'
                }));

            if (committee.presidium) {
                ['chairperson', 'viceChairperson', 'rapporteur'].forEach(role => {
                    if (committee.presidium[role] && committee.presidium[role].email) {
                        participants.push({
                            email: committee.presidium[role].email,
                            country: committee.presidium[role].country || committee.presidium[role].countryName || `Presidium (${role})`,
                            role: 'admin'
                        });
                    }
                });
            }

            conversation = new Conversation({
                committeeId,
                conversationType: 'committee_wide',
                title: config.title,
                description: config.description,
                participants,
                settings: {
                    allowNewMembers: true,
                    maxParticipants: 200,
                    isAnonymous: channelType === 'gossip'
                },
                createdBy: req.user.email
            });

            await conversation.save();
        } else {
            const isParticipant = conversation.participants.find(p => 
                p.email === req.user.email && p.isActive
            );

            if (!isParticipant) {
                conversation.participants.push({
                    email: req.user.email,
                    country: req.user.countryName || `Presidium (${req.user.presidiumRole || 'member'})`,
                    role: req.user.role === 'presidium' ? 'admin' : 'member'
                });
                await conversation.save();
            }
        }
        
        res.json({
            success: true,
            conversation: {
                ...formatConversationResponse(conversation, req.user.email),
                messages: conversation.messages.map(message => formatMessageResponse(message))
            }
        });

    } catch (error) {
        global.logger.error('Get/create committee conversation error:', error);
        res.status(500).json({ error: 'Failed to get committee conversation' });
    }
};

// Send message to committee-wide conversation
const sendCommitteeMessage = async (req, res) => {
    try {
        const { committeeId, channelType } = req.params;
        const { content } = req.body;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (req.user.committeeId.toString() !== committeeId) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        const channelConfig = {
            'general': { title: 'General Assembly', description: 'Global floor discussion' },
            'announcements': { title: 'Announcements', description: 'Official Presidium updates' },
            'gossip': { title: 'Gossip Box', description: 'Anonymous chatter' }
        };

        const config = channelConfig[channelType];
        if (!config) {
            return res.status(400).json({ error: 'Invalid channel type' });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            committeeId,
            conversationType: 'committee_wide',
            title: config.title
        });

        if (!conversation) {
            // Create the conversation if it doesn't exist
            const participants = committee.countries
                .filter(country => country.email && country.isActive)
                .map(country => ({
                    email: country.email,
                    country: country.name,
                    role: 'member',
                    isActive: true
                }));

            if (committee.presidium) {
                ['chairperson', 'viceChairperson', 'rapporteur'].forEach(role => {
                    if (committee.presidium[role] && committee.presidium[role].email) {
                        participants.push({
                            email: committee.presidium[role].email,
                            country: committee.presidium[role].country || committee.presidium[role].countryName || `Presidium (${role})`,
                            role: 'admin',
                            isActive: true
                        });
                    }
                });
            }

            // Ensure current user is always included
            const currentUserExists = participants.find(p => p.email === req.user.email);
            if (!currentUserExists) {
                participants.push({
                    email: req.user.email,
                    country: req.user.countryName || `Presidium (${req.user.presidiumRole || 'member'})`,
                    role: req.user.role === 'presidium' ? 'admin' : 'member',
                    isActive: true
                });
            }

            conversation = new Conversation({
                committeeId,
                conversationType: 'committee_wide',
                title: config.title,
                description: config.description,
                participants,
                settings: {
                    allowNewMembers: true,
                    maxParticipants: 200,
                    isAnonymous: channelType === 'gossip'
                },
                createdBy: req.user.email
            });

            await conversation.save();
        } else {
            // Ensure current user is a participant
            const isParticipant = conversation.participants.find(p => 
                p.email === req.user.email && p.isActive
            );

            if (!isParticipant) {
                conversation.participants.push({
                    email: req.user.email,
                    country: req.user.countryName || `Presidium (${req.user.presidiumRole || 'member'})`,
                    role: req.user.role === 'presidium' ? 'admin' : 'member',
                    isActive: true
                });
                await conversation.save();
            }
        }

        if (channelType === 'announcements' && req.user.role !== 'presidium') {
            return res.status(403).json({ error: 'Only presidium can post announcements' });
        }

        let senderCountry = req.user.countryName || `Presidium (${req.user.presidiumRole || 'member'})`;
        let messageType = 'text';

        if (channelType === 'gossip') {
            senderCountry = 'Anonymous';
        } else if (channelType === 'announcements') {
            messageType = 'announcement';
        }

        const message = conversation.addMessage(
            req.user.email,
            senderCountry,
            content,
            messageType
        );

        await conversation.save();

        if (req.app.locals.io) {
            req.app.locals.io.to(`committee-${committeeId}`).emit('committee-message-received', {
                conversationId: conversation._id,
                messageId: message._id,
                channelType,
                senderEmail: message.senderEmail,
                senderCountry,
                content: message.content,
                timestamp: message.timestamp,
                messageType: message.messageType
            });
        }

        res.status(201).json({
            success: true,
            message: formatMessageResponse(message),
            conversationId: conversation._id
        });

    } catch (error) {
        global.logger.error('Send committee message error:', error);
        res.status(500).json({ error: error.message || 'Failed to send message' });
    }
};

module.exports = {
    createBilateralConversation,
    createGroupConversation,
    sendMessage,
    editMessage,
    markAsRead,
    getUserConversations,
    getConversation,
    addParticipant,
    leaveConversation,
    getOrCreateCommitteeConversation,
    sendCommitteeMessage
};