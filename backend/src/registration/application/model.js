const mongoose = require('mongoose');

// Status change history entry
const statusChangeSchema = new mongoose.Schema({
    fromStage: {
        type: String,
        default: null
    },

    toStage: {
        type: String,
        required: true
    },

    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null  // null = system/auto
    },

    comment: {
        type: String,
        default: null,
        maxlength: 2000
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Moderator note schema
const moderatorNoteSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    text: {
        type: String,
        required: true,
        maxlength: 2000
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Committee preference schema
const committeePreferenceSchema = new mongoose.Schema({
    committee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    rank: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, { _id: false });

// Main registration application schema
const registrationApplicationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RegistrationForm',
        required: true
    },

    // Current pipeline stage
    currentStage: {
        type: String,
        required: true,
        default: 'form_submitted'
        // Possible values:
        //   'form_submitted' — initial state after submission
        //   'form_review' — under moderator review
        //   'returned_for_revision' — sent back to applicant
        //   'interview' — interview stage
        //   'payment' — payment pending
        //   'final_decision' — final accept/reject stage
        //   'accepted' — terminal: accepted
        //   'rejected' — terminal: rejected
        //   'withdrawn' — terminal: applicant withdrew
    },

    // Committee preferences ranked by applicant
    committeePreferences: [committeePreferenceSchema],

    // Custom field responses (key = fieldId from RegistrationForm.customFields)
    customFieldResponses: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    },

    // File uploads from custom fields
    fileUploads: [{
        fieldId: String,
        filename: String,
        filePath: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Pipeline tracking
    statusHistory: [statusChangeSchema],

    // Moderator notes (internal, not visible to applicant)
    moderatorNotes: [moderatorNoteSchema],

    // Assigned committee & country (filled on acceptance)
    assignedCommittee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        default: null
    },

    assignedCountry: {
        name: { type: String, default: null },
        code: { type: String, default: null, lowercase: true }
    },

    // Assigned role (filled on acceptance)
    assignedRole: {
        type: String,
        enum: ['delegate', 'observer', 'expert', 'presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary', null],
        default: null
    },

    // Reference to EventParticipant created on acceptance
    eventParticipant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventParticipant',
        default: null
    },

    // Interview tracking
    interview: {
        scheduledAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        notes: { type: String, default: null, maxlength: 2000 },
        score: { type: Number, default: null, min: 0, max: 10 }
    },

    // Payment tracking
    payment: {
        amount: { type: Number, default: null },
        currency: { type: String, default: null },
        paidAt: { type: Date, default: null },
        receiptPath: { type: String, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },

    submittedAt: {
        type: Date,
        default: Date.now
    },

    decidedAt: {
        type: Date,
        default: null
    },

    decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    collection: 'registrationApplications'
});

// Indexes
registrationApplicationSchema.index({ event: 1, applicant: 1 }, { unique: true }); // one application per user per event
registrationApplicationSchema.index({ event: 1, currentStage: 1 });
registrationApplicationSchema.index({ applicant: 1 });
registrationApplicationSchema.index({ event: 1, submittedAt: -1 });

// Terminal stages — application is done
registrationApplicationSchema.methods.isTerminal = function () {
    return ['accepted', 'rejected', 'withdrawn'].includes(this.currentStage);
};

// Move to a new stage with history tracking
registrationApplicationSchema.methods.moveToStage = function (newStage, changedBy, comment = null) {
    const fromStage = this.currentStage;

    this.statusHistory.push({
        fromStage,
        toStage: newStage,
        changedBy,
        comment,
        timestamp: new Date()
    });

    this.currentStage = newStage;

    if (['accepted', 'rejected'].includes(newStage)) {
        this.decidedAt = new Date();
        this.decidedBy = changedBy;
    }
};

const RegistrationApplication = mongoose.model('RegistrationApplication', registrationApplicationSchema);

module.exports = { RegistrationApplication };