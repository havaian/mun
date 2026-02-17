const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: [
            'registration_status_change',  // applicant's registration moved stages
            'registration_new',            // for moderators: new application received
            'event_update',                // event details changed
            'org_invitation',              // invited to join an org
            'admin_assignment',            // assigned as org admin
            'country_assignment',          // assigned a country in committee
            'member_added',                // added as org member
            'general'                      // catch-all
        ],
        required: true
    },

    title: {
        type: String,
        required: true,
        maxlength: 200
    },

    message: {
        type: String,
        default: null,
        maxlength: 1000
    },

    // Polymorphic reference to related entity
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['event', 'organization', 'registration', 'committee', 'invitation'],
            default: null
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    },

    // Optional link for the notification (frontend route)
    link: {
        type: String,
        default: null
    },

    read: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date,
        default: null
    },

    emailSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'notifications'
});

// Indexes
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 });

// Static: create and optionally emit via websocket
notificationSchema.statics.send = async function (data) {
    const notification = new this(data);
    await notification.save();

    // Emit via WebSocket if available
    if (global.io) {
        global.io.to(`user:${data.recipient}`).emit('notification:new', {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            createdAt: notification.createdAt
        });
    }

    return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };