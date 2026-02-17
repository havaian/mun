const mongoose = require('mongoose');

// Valid org-level permissions
const ORG_PERMISSIONS = [
    'manage_members',        // Add/remove org members, assign their permissions
    'manage_content',        // Edit org page info, logo, description, news
    'manage_event_content',  // Edit event pages, photos, descriptions
    'manage_registration',   // Create/edit registration forms for events
    'review_applicants'      // Review registration applications, move through stages
];

const orgMembershipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    permissions: {
        type: [String],
        default: [],
        validate: {
            validator: function (perms) {
                return perms.every(p => ORG_PERMISSIONS.includes(p));
            },
            message: props => `Invalid permission(s): ${props.value.filter(p => !ORG_PERMISSIONS.includes(p)).join(', ')}`
        }
    },

    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'orgMemberships'
});

// Unique compound index — one membership per user per org
orgMembershipSchema.index({ user: 1, organization: 1 }, { unique: true });
orgMembershipSchema.index({ organization: 1, status: 1 });
orgMembershipSchema.index({ user: 1, status: 1 });

// Check if this membership has a specific permission
orgMembershipSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission);
};

// Check if this membership has ANY of the given permissions
orgMembershipSchema.methods.hasAnyPermission = function (permissions) {
    return permissions.some(p => this.permissions.includes(p));
};

const OrgMembership = mongoose.model('OrgMembership', orgMembershipSchema);

module.exports = { OrgMembership, ORG_PERMISSIONS };