const mongoose = require('mongoose');

// Country definition schema (available countries for this committee)
// This defines WHICH countries are available, NOT who represents them.
// The actual delegate ↔ country assignment lives in EventParticipant.
const countryDefinitionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    flagUrl: {
        type: String,
        default: null
    },

    // Special properties for different committee types
    isPermanentMember: {
        type: Boolean,
        default: false // For Security Council
    },

    hasVetoRight: {
        type: Boolean,
        default: false // For Security Council permanent members
    },

    isObserver: {
        type: Boolean,
        default: false
    },

    specialRole: {
        type: String,
        enum: ['observer', 'special', null],
        default: null
    }
}, { _id: false });

// Committee main schema
const committeeSchema = new mongoose.Schema({
    // Changed from eventId to event for consistency
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    acronym: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },

    type: {
        type: String,
        enum: ['GA', 'SC', 'ECOSOC', 'HRC', 'other'],
        required: true
    },

    topic: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500
    },

    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },

    language: {
        type: String,
        enum: ['en', 'ru', 'uz'],
        default: 'en'
    },

    status: {
        type: String,
        enum: ['setup', 'active', 'suspended', 'completed'],
        default: 'setup'
    },

    completedAt: {
        type: Date,
        default: null
    },

    // Available countries for this committee
    // This is the POOL of countries — assignment to delegates is via EventParticipant
    countries: [countryDefinitionSchema],

    // Committee settings
    settings: {
        votingSettings: {
            requireMajority: { type: Boolean, default: true },
            allowAbstentions: { type: Boolean, default: true },
            vetoEnabled: { type: Boolean, default: false },
            secretBallot: { type: Boolean, default: false }
        },

        debateSettings: {
            speakersList: { type: Boolean, default: true },
            pointsOfOrder: { type: Boolean, default: true },
            rightOfReply: { type: Boolean, default: true }
        },

        speechSettings: {
            defaultSpeechTime: { type: Number, default: 90, min: 30, max: 300 },
            allowExtensions: { type: Boolean, default: true },
            maxExtensions: { type: Number, default: 1 },
            extensionTime: { type: Number, default: 30, min: 15, max: 120 }
        },

        coalitionSettings: {
            minCoalitionMembers: { type: Number, default: 3 },
            resolutionDeadline: { type: Date, default: null }
        },

        positionPaperDeadline: { type: Date, default: null }
    }
}, {
    timestamps: true,
    collection: 'committees'
});

// Indexes
committeeSchema.index({ event: 1 });
committeeSchema.index({ event: 1, acronym: 1 }, { unique: true });
committeeSchema.index({ status: 1 });

const Committee = mongoose.model('Committee', committeeSchema);

module.exports = { Committee };