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

// Moderator note schema (org-level internal notes, separate from committee review notes)
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

    priority: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, { _id: false });

// NEW: Per-committee review trail
const committeeReviewSchema = new mongoose.Schema({
    committee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Which priority slot this committee occupies (0-indexed)
    priorityIndex: {
        type: Number,
        required: true
    },

    decision: {
        type: String,
        enum: ['pending', 'accepted', 'passed'],
        default: 'pending'
    },

    decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    decidedAt: {
        type: Date,
        default: null
    },

    // Internal note visible to the NEXT committee in the chain, NOT to applicant
    internalNote: {
        type: String,
        default: null,
        maxlength: 2000
    },

    // So the next committee knows where to start reviewing
    // e.g. if committee A passed at 'interview', committee B starts at 'interview'
    stageReachedBeforePass: {
        type: String,
        default: null
    },

    // Per-committee interview data
    interviewData: {
        scheduledAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        notes: { type: String, default: null, maxlength: 2000 },
        score: { type: Number, default: null, min: 0, max: 10 }
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
    // UPDATED: new stage values for committee-chain review model
    currentStage: {
        type: String,
        required: true,
        default: 'form_review'
        // Possible values:
        //   'form_review'            — committee presidium reviews application
        //   'interview'              — interview stage (if enabled)
        //   'returned_for_revision'  — sent back to applicant
        //   'accepted'               — accepted by a committee (triggers payment flow)
        //   'passed'                 — current committee passed, routing to next
        //   'payment_pending'        — awaiting payment after acceptance
        //   'payment_verified'       — payment confirmed
        //   'joined'                 — terminal: EventParticipant created
        //   'rejected'               — terminal: all committees passed, or force-rejected
        //   'withdrawn'              — terminal: applicant withdrew
    },

    // Committee preferences ranked by applicant
    committeePreferences: [committeePreferenceSchema],

    // NEW: Which committee in the preference chain is currently reviewing (0-indexed)
    currentPriorityIndex: {
        type: Number,
        default: 0  // 0 = 1st choice, 1 = 2nd choice, etc.
    },

    // NEW: Which committee is currently reviewing
    // Derived from committeePreferences[currentPriorityIndex]
    currentReviewingCommittee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        default: null
    },

    // NEW: Per-committee review trail
    committeeReviews: [committeeReviewSchema],

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

    // Moderator notes (org-level internal, not visible to applicant)
    moderatorNotes: [moderatorNoteSchema],

    // DEPRECATED — kept temporarily for backward compatibility
    // Use acceptance.committee instead
    assignedCommittee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        default: null
    },

    // DEPRECATED — kept temporarily for backward compatibility
    // Use acceptance.country instead
    assignedCountry: {
        name: { type: String, default: null },
        code: { type: String, default: null, lowercase: true }
    },

    // DEPRECATED — kept temporarily for backward compatibility
    // Use acceptance.role instead
    assignedRole: {
        type: String,
        enum: ['delegate', 'observer', 'expert', 'presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary', null],
        default: null
    },

    // NEW: Acceptance details (set when a committee accepts the applicant)
    acceptance: {
        committee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Committee',
            default: null
        },
        role: {
            type: String,
            enum: ['delegate', 'observer', 'expert', null],
            default: null
        },
        country: {
            name: { type: String, default: null },
            code: { type: String, default: null, lowercase: true },
            flag: { type: String, default: null }
        },
        acceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        acceptedAt: {
            type: Date,
            default: null
        }
    },

    // Reference to EventParticipant created on payment verification (or fee waiver)
    eventParticipant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventParticipant',
        default: null
    },

    // DEPRECATED — interview data moved to committeeReviews[].interviewData
    // Kept temporarily for backward compatibility
    interview: {
        scheduledAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        notes: { type: String, default: null, maxlength: 2000 },
        score: { type: Number, default: null, min: 0, max: 10 }
    },

    // UPDATED: Payment tracking — expanded for post-acceptance flow
    payment: {
        amount: { type: Number, default: null },
        currency: { type: String, default: 'USD' },
        deadline: { type: Date, default: null },           // per-applicant deadline
        waiver: {
            type: {
                type: String,
                enum: ['none', 'partial', 'full'],
                default: 'none'
            },
            discountAmount: { type: Number, default: null },  // for partial waiver
            reason: { type: String, default: null },
            grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            grantedAt: { type: Date, default: null }
        },
        paidAt: { type: Date, default: null },
        paidAmount: { type: Number, default: null },        // actual amount after waiver
        receiptPath: { type: String, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        verifiedAt: { type: Date, default: null }
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
// NEW: for committee-scoped queries (presidium viewing their applications)
registrationApplicationSchema.index({ event: 1, currentReviewingCommittee: 1, currentStage: 1 });

// Terminal stages — application is done
// UPDATED: 'accepted' is no longer terminal (triggers payment), 'joined' is terminal
registrationApplicationSchema.methods.isTerminal = function () {
    return ['joined', 'rejected', 'withdrawn'].includes(this.currentStage);
};

// Move to a new stage with history tracking
// UPDATED: terminal detection for new stage values
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

    // Set decidedAt/decidedBy on actual terminal states
    if (['joined', 'rejected'].includes(newStage)) {
        this.decidedAt = new Date();
        this.decidedBy = changedBy;
    }
};

// NEW: Initialize the first committee review entry
registrationApplicationSchema.methods.initFirstReview = function () {
    if (this.committeePreferences.length === 0) return;

    // Sort preferences by priority (1 = highest)
    const sorted = [...this.committeePreferences].sort((a, b) => a.priority - b.priority);

    this.currentPriorityIndex = 0;
    this.currentReviewingCommittee = sorted[0].committee;

    // Create the first committee review entry
    this.committeeReviews.push({
        committee: sorted[0].committee,
        priorityIndex: 0,
        decision: 'pending'
    });
};

// NEW: Pass to the next committee in the preference chain
// Returns true if routed to next committee, false if no more committees (fully rejected)
registrationApplicationSchema.methods.passToNextCommittee = function (decidedBy, note, currentStageName) {
    const sorted = [...this.committeePreferences].sort((a, b) => a.priority - b.priority);
    const nextIndex = this.currentPriorityIndex + 1;

    // Update current committee review entry
    const currentReview = this.committeeReviews.find(
        r => r.committee.toString() === this.currentReviewingCommittee.toString() && r.decision === 'pending'
    );
    if (currentReview) {
        currentReview.decision = 'passed';
        currentReview.decidedBy = decidedBy;
        currentReview.decidedAt = new Date();
        currentReview.internalNote = note || null;
        currentReview.stageReachedBeforePass = currentStageName;
    }

    if (nextIndex >= sorted.length) {
        // No more committees — fully rejected
        this.moveToStage('rejected', decidedBy, 'All preferred committees have passed on this application');
        return false;
    }

    // Route to next committee
    this.currentPriorityIndex = nextIndex;
    this.currentReviewingCommittee = sorted[nextIndex].committee;

    // Create new review entry for the next committee
    this.committeeReviews.push({
        committee: sorted[nextIndex].committee,
        priorityIndex: nextIndex,
        decision: 'pending'
    });

    // Determine what stage to start the next committee at:
    // If current committee passed at 'interview', next committee starts at 'interview'
    // If current committee passed at 'form_review', next committee starts at 'form_review'
    const startStage = currentStageName || 'form_review';
    this.moveToStage(startStage, null, `Routed to priority ${nextIndex + 1} committee`);

    return true;
};

// NEW: Accept the application by the current reviewing committee
registrationApplicationSchema.methods.acceptByCommittee = function (decidedBy, { committee, role, country }) {
    // Update current committee review entry
    const currentReview = this.committeeReviews.find(
        r => r.committee.toString() === this.currentReviewingCommittee.toString() && r.decision === 'pending'
    );
    if (currentReview) {
        currentReview.decision = 'accepted';
        currentReview.decidedBy = decidedBy;
        currentReview.decidedAt = new Date();
    }

    // Fill acceptance details
    this.acceptance = {
        committee: committee,
        role: role || 'delegate',
        country: country || { name: null, code: null, flag: null },
        acceptedBy: decidedBy,
        acceptedAt: new Date()
    };

    // DEPRECATED fields — keep in sync for backward compatibility
    this.assignedCommittee = committee;
    this.assignedRole = role || 'delegate';
    if (country) {
        this.assignedCountry = {
            name: country.name,
            code: country.code ? country.code.toLowerCase() : null
        };
    }

    // Move to payment_pending (payment is always post-acceptance)
    this.moveToStage('payment_pending', decidedBy, `Accepted into committee`);
};

// NEW: Get the current committee review entry
registrationApplicationSchema.methods.getCurrentReview = function () {
    if (!this.currentReviewingCommittee) return null;
    return this.committeeReviews.find(
        r => r.committee.toString() === this.currentReviewingCommittee.toString() && r.decision === 'pending'
    ) || null;
};

// NEW: Get previous committee reviews (for displaying notes to next committee)
registrationApplicationSchema.methods.getPreviousReviews = function () {
    return this.committeeReviews.filter(r => r.decision !== 'pending');
};

const RegistrationApplication = mongoose.model('RegistrationApplication', registrationApplicationSchema);

module.exports = { RegistrationApplication };