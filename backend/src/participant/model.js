const mongoose = require('mongoose');

// Valid event-level roles
const EVENT_ROLES = [
    'presidium_chair',
    'presidium_cochair',
    'presidium_expert',
    'presidium_secretary',
    'delegate',
    'observer',
    'expert'
];

// Presidium roles subset
const PRESIDIUM_ROLES = [
    'presidium_chair',
    'presidium_cochair',
    'presidium_expert',
    'presidium_secretary'
];

const eventParticipantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    // Committee assignment (nullable — observers/experts may not be in a committee)
    committee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        default: null
    },

    role: {
        type: String,
        enum: EVENT_ROLES,
        required: true
    },

    // Country info (for delegates only)
    country: {
        name: {
            type: String,
            default: null
        },
        code: {
            type: String,
            default: null,
            lowercase: true
        },
        flag: {
            type: String,
            default: null
        }
    },

    // Link back to org membership if this participant is an org member
    orgMembership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrgMembership',
        default: null
    },

    // How this participant was added
    source: {
        type: String,
        enum: [
            'direct_assignment',      // manually added by admin/org
            'registration_pipeline',  // went through registration form
            'invitation'              // invited externally
        ],
        default: 'direct_assignment'
    },

    // Reference to the registration application (if from pipeline)
    registrationApplication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RegistrationApplication',
        default: null
    },

    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'removed'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'eventParticipants'
});

// Indexes
// A user can have multiple roles in DIFFERENT committees of the same event
// (e.g., observer in one, expert in another — though unusual)
// But a user should not have duplicate roles in the same committee
eventParticipantSchema.index({ user: 1, event: 1, committee: 1, role: 1 }, { unique: true });
eventParticipantSchema.index({ event: 1, committee: 1, role: 1 });
eventParticipantSchema.index({ event: 1, status: 1 });
eventParticipantSchema.index({ user: 1, status: 1 });

// Unique country per committee (one country = one delegate per committee)
// Sparse because not all participants have countries
eventParticipantSchema.index(
    { event: 1, committee: 1, 'country.code': 1 },
    { unique: true, sparse: true, partialFilterExpression: { 'country.code': { $ne: null } } }
);

// Virtuals
eventParticipantSchema.virtual('isPresidium').get(function () {
    return PRESIDIUM_ROLES.includes(this.role);
});

eventParticipantSchema.virtual('isDelegate').get(function () {
    return this.role === 'delegate';
});

eventParticipantSchema.virtual('displayName').get(function () {
    if (this.role === 'delegate' && this.country?.name) {
        return this.country.name;
    }
    // For presidium, show role
    const roleLabels = {
        'presidium_chair': 'Chair',
        'presidium_cochair': 'Co-Chair',
        'presidium_expert': 'Expert',
        'presidium_secretary': 'Secretary',
        'observer': 'Observer',
        'expert': 'Expert'
    };
    return roleLabels[this.role] || this.role;
});

// Ensure virtuals are included in JSON/Object output
eventParticipantSchema.set('toJSON', { virtuals: true });
eventParticipantSchema.set('toObject', { virtuals: true });

// Instance methods
eventParticipantSchema.methods.canVote = function () {
    // Only delegates can vote (not observers, not special roles)
    return this.role === 'delegate' && this.status === 'active';
};

eventParticipantSchema.methods.canSubmitDocuments = function () {
    return this.role === 'delegate' && this.status === 'active';
};

eventParticipantSchema.methods.canModerate = function () {
    return PRESIDIUM_ROLES.includes(this.role) && this.status === 'active';
};

const EventParticipant = mongoose.model('EventParticipant', eventParticipantSchema);

module.exports = { EventParticipant, EVENT_ROLES, PRESIDIUM_ROLES };