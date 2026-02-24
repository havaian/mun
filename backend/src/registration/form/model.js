const mongoose = require('mongoose');

// Valid pipeline stage keys
// UPDATED: Removed 'payment' and 'final_decision'
// Payment is always post-acceptance (handled on RegistrationApplication)
// Final decision is replaced by per-committee accept/pass
const PIPELINE_STAGES = [
    'form_review',       // committee presidium reviews submitted form
    'interview',         // video/audio interview (optional, toggled per event)
];

// Custom field types
const FIELD_TYPES = ['text', 'textarea', 'select', 'file'];

// Custom field definition schema
const customFieldSchema = new mongoose.Schema({
    fieldId: {
        type: String,
        required: true  // unique within form, e.g. 'telegram_username'
    },

    label: {
        type: String,
        required: true,
        maxlength: 200
    },

    type: {
        type: String,
        enum: FIELD_TYPES,
        required: true
    },

    required: {
        type: Boolean,
        default: false
    },

    placeholder: {
        type: String,
        default: null,
        maxlength: 200
    },

    // For 'select' type only
    options: {
        type: [String],
        default: []
    },

    order: {
        type: Number,
        default: 0
    },

    // For text/textarea
    maxLength: {
        type: Number,
        default: null
    },

    // For file type
    allowedFileTypes: {
        type: [String],
        default: []  // e.g. ['.pdf', '.docx']
    },

    maxFileSize: {
        type: Number,
        default: null  // in bytes
    }
}, { _id: false });

// Pipeline stage configuration
const pipelineStageSchema = new mongoose.Schema({
    stage: {
        type: String,
        enum: PIPELINE_STAGES,
        required: true
    },

    order: {
        type: Number,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Flexible config per stage type
    config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // For 'interview': { jitsiRoomTemplate: String, durationMinutes: Number }
    }
}, { _id: false });

// Main registration form schema
const registrationFormSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        unique: true  // one form per event
    },

    // How many committee preferences the applicant must rank (1-5)
    committeePreferenceCount: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },

    // Pipeline stages configuration
    // UPDATED: default only includes form_review (interview is optional)
    pipelineStages: {
        type: [pipelineStageSchema],
        default: [
            { stage: 'form_review', order: 1, isActive: true }
        ]
    },

    // Auto-filled fields from User profile (read-only in the form)
    autoFilledFields: {
        type: [String],
        default: ['firstName', 'lastName', 'dateOfBirth', 'email', 'institution', 'phone']
    },

    // Custom fields defined by the moderator
    customFields: {
        type: [customFieldSchema],
        default: []
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft'
    }
}, {
    timestamps: true,
    collection: 'registrationForms'
});

// Indexes
registrationFormSchema.index({ event: 1 }, { unique: true });

// Get only active pipeline stages, sorted by order
registrationFormSchema.methods.getActiveStages = function () {
    return this.pipelineStages
        .filter(s => s.isActive)
        .sort((a, b) => a.order - b.order);
};

// Get the first active stage key (what stage an application starts at after submission)
// UPDATED: fallback to 'form_review' instead of 'final_decision'
registrationFormSchema.methods.getFirstReviewStage = function () {
    const activeStages = this.getActiveStages();
    return activeStages.length > 0 ? activeStages[0].stage : 'form_review';
};

// Validate custom field IDs are unique within the form
registrationFormSchema.pre('save', function (next) {
    if (this.customFields && this.customFields.length > 0) {
        const ids = this.customFields.map(f => f.fieldId);
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (duplicates.length > 0) {
            return next(new Error(`Duplicate custom field IDs: ${duplicates.join(', ')}`));
        }
    }
    next();
});

const RegistrationForm = mongoose.model('RegistrationForm', registrationFormSchema);

module.exports = { RegistrationForm, PIPELINE_STAGES, FIELD_TYPES };