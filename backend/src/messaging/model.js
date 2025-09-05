const mongoose = require('mongoose');

// Individual message schema
const messageSchema = new mongoose.Schema({
    senderEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    senderCountry: {
        type: String,
        required: true
    },

    content: {
        type: String,
        required: true,
        maxlength: 2000
    },

    messageType: {
        type: String,
        enum: ['text', 'system', 'announcement'],
        default: 'text'
    },

    // For replies and threading
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    // Message status
    isEdited: {
        type: Boolean,
        default: false
    },

    editedAt: {
        type: Date,
        default: null
    },

    originalContent: {
        type: String,
        default: null
    },

    // Read receipts
    readBy: [{
        email: String,
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

// Conversation schema for diplomatic messaging
const conversationSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Conversation type and participants
    conversationType: {
        type: String,
        enum: ['bilateral', 'group', 'coalition', 'committee_wide', 'presidium_broadcast'],
        required: true
    },

    participants: [{
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        country: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        leftAt: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // Conversation metadata
    title: {
        type: String,
        maxlength: 100,
        default: null
    },

    description: {
        type: String,
        maxlength: 300,
        default: null
    },

    // Messages in this conversation
    messages: [messageSchema],

    // Conversation settings
    settings: {
        allowNewMembers: {
            type: Boolean,
            default: true
        },
        isArchived: {
            type: Boolean,
            default: false
        },
        isLocked: {
            type: Boolean,
            default: false
        },
        isAnonymous: {
            type: Boolean,
            default: false
        },
        maxParticipants: {
            type: Number,
            default: 50
        }
    },

    // Auto-moderation
    moderation: {
        requireApproval: {
            type: Boolean,
            default: false
        },
        bannedWords: [String],
        flaggedMessages: [{
            messageId: mongoose.Schema.Types.ObjectId,
            reason: String,
            flaggedBy: String,
            flaggedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },

    // Associated entities
    coalitionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coalition',
        default: null
    },

    resolutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resolution',
        default: null
    },

    // Activity tracking
    lastActivity: {
        type: Date,
        default: Date.now
    },

    messageCount: {
        type: Number,
        default: 0
    },

    // Created by
    createdBy: {
        type: String,
        required: true,
        lowercase: true
    }
}, {
    timestamps: true,
    collection: 'conversations'
});

// Indexes for performance
conversationSchema.index({ committeeId: 1, conversationType: 1 });
conversationSchema.index({ 'participants.email': 1 });
conversationSchema.index({ coalitionId: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ createdAt: -1 });

// Compound index for active conversations
conversationSchema.index({
    'participants.email': 1,
    'settings.isArchived': 1,
    lastActivity: -1
});

// Methods for conversation management
conversationSchema.methods.addParticipant = function (email, country, role = 'member') {
    // Check if participant already exists
    const existingParticipant = this.participants.find(p => p.email === email && p.isActive);
    if (existingParticipant) {
        throw new Error('Participant already in conversation');
    }

    // Check max participants limit
    const activeParticipants = this.participants.filter(p => p.isActive).length;
    if (activeParticipants >= this.settings.maxParticipants) {
        throw new Error('Maximum participants limit reached');
    }

    this.participants.push({
        email,
        country,
        role,
        joinedAt: new Date(),
        isActive: true
    });

    return this;
};

conversationSchema.methods.removeParticipant = function (email) {
    const participant = this.participants.find(p => p.email === email && p.isActive);
    if (!participant) {
        throw new Error('Participant not found in conversation');
    }

    participant.isActive = false;
    participant.leftAt = new Date();

    return this;
};

conversationSchema.methods.addMessage = function (senderEmail, senderCountry, content, messageType = 'text', replyTo = null) {
    // Check if sender is participant
    const sender = this.participants.find(p => p.email === senderEmail && p.isActive);
    if (!sender) {
        throw new Error('Sender is not a participant in this conversation');
    }

    // Check if conversation is locked
    if (this.settings.isLocked) {
        throw new Error('Conversation is locked');
    }

    const message = {
        senderEmail,
        senderCountry,
        content: content.trim(),
        messageType,
        replyTo,
        timestamp: new Date()
    };

    this.messages.push(message);
    this.messageCount += 1;
    this.lastActivity = new Date();

    return this.messages[this.messages.length - 1];
};

conversationSchema.methods.editMessage = function (messageId, newContent, editorEmail) {
    const message = this.messages.id(messageId);
    if (!message) {
        throw new Error('Message not found');
    }

    // Only sender can edit their own messages
    if (message.senderEmail !== editorEmail) {
        throw new Error('Can only edit your own messages');
    }

    // Can't edit messages older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (message.timestamp < tenMinutesAgo) {
        throw new Error('Cannot edit messages older than 10 minutes');
    }

    if (!message.isEdited) {
        message.originalContent = message.content;
    }

    message.content = newContent.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    return message;
};

conversationSchema.methods.markAsRead = function (messageId, readerEmail) {
    const message = this.messages.id(messageId);
    if (!message) {
        throw new Error('Message not found');
    }

    // Don't mark own messages as read
    if (message.senderEmail === readerEmail) {
        return message;
    }

    // Check if already marked as read
    const existingRead = message.readBy.find(r => r.email === readerEmail);
    if (existingRead) {
        return message;
    }

    message.readBy.push({
        email: readerEmail,
        readAt: new Date()
    });

    return message;
};

conversationSchema.methods.getUnreadCount = function (userEmail) {
    let unreadCount = 0;

    for (const message of this.messages) {
        // Skip own messages
        if (message.senderEmail === userEmail) continue;

        // Check if marked as read
        const hasRead = message.readBy.find(r => r.email === userEmail);
        if (!hasRead) {
            unreadCount++;
        }
    }

    return unreadCount;
};

conversationSchema.methods.canUserAccess = function (userEmail) {
    // Check if user is an active participant
    const participant = this.participants.find(p => p.email === userEmail && p.isActive);
    return !!participant;
};

conversationSchema.methods.isUserAdmin = function (userEmail) {
    const participant = this.participants.find(p => p.email === userEmail && p.isActive);
    return participant && participant.role === 'admin';
};

// Virtual for active participants count
conversationSchema.virtual('activeParticipantsCount').get(function () {
    return this.participants.filter(p => p.isActive).length;
});

// Virtual for recent messages (last 50)
conversationSchema.virtual('recentMessages').get(function () {
    return this.messages.slice(-50);
});

// Pre-save middleware to update lastActivity
conversationSchema.pre('save', function (next) {
    if (this.isModified('messages')) {
        this.lastActivity = new Date();
    }
    next();
});

// Static method to create bilateral conversation
conversationSchema.statics.createBilateral = function (committeeId, user1Email, user1Country, user2Email, user2Country, createdBy) {
    return new this({
        committeeId,
        conversationType: 'bilateral',
        participants: [
            {
                email: user1Email,
                country: user1Country,
                role: 'admin'
            },
            {
                email: user2Email,
                country: user2Country,
                role: 'admin'
            }
        ],
        settings: {
            allowNewMembers: false,
            maxParticipants: 2
        },
        createdBy
    });
};

// Static method to create group conversation
conversationSchema.statics.createGroup = function (committeeId, title, description, creatorEmail, creatorCountry, initialParticipants = []) {
    const participants = [
        {
            email: creatorEmail,
            country: creatorCountry,
            role: 'admin'
        }
    ];

    // Add initial participants
    for (const participant of initialParticipants) {
        participants.push({
            email: participant.email,
            country: participant.country,
            role: 'member'
        });
    }

    return new this({
        committeeId,
        conversationType: 'group',
        title: title.trim(),
        description: description?.trim(),
        participants,
        createdBy: creatorEmail
    });
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Conversation };