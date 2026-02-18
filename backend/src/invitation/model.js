const mongoose = require('mongoose');
const crypto = require('crypto');

const orgInvitationSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    // Pre-assigned permissions for when they join
    permissions: {
        type: [String],
        default: []
    },

    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    token: {
        type: String,
        unique: true,
        sparse: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'cancelled'],
        default: 'pending'
    },

    // Set when the invitation is accepted
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    claimedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'orgInvitations'
});

// Indexes
orgInvitationSchema.index({ token: 1 }, { unique: true, sparse: true });
orgInvitationSchema.index({ organization: 1, email: 1 });
orgInvitationSchema.index({ email: 1, status: 1 });
orgInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL — auto-delete expired

// Generate a unique invitation token
orgInvitationSchema.methods.generateToken = function () {
    this.token = crypto.randomBytes(32).toString('hex');
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return this.token;
};

// Claim the invitation
orgInvitationSchema.methods.claim = function (userId) {
    this.status = 'accepted';
    this.claimedBy = userId;
    this.claimedAt = new Date();
};

const OrgInvitation = mongoose.model('OrgInvitation', orgInvitationSchema);

module.exports = { OrgInvitation };