const mongoose = require('mongoose');

// Support schema for procedural motions
const supportSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true
    },

    supportedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Presidium decision schema
const presidiumDecisionSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ['accept', 'reject', 'modify_order'],
        required: true
    },

    comments: {
        type: String,
        maxlength: 1000
    },

    decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    decidedAt: {
        type: Date,
        default: Date.now
    },

    newPriority: {
        type: Number,
        default: null
    }
}, { _id: false });

// Voting result schema for motions
const votingResultSchema = new mongoose.Schema({
    votingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voting'
    },

    passed: {
        type: Boolean,
        required: true
    },

    implementedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Procedural Motion schema
const proceduralMotionSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Authorship
    authorEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    authorCountry: {
        type: String,
        required: true
    },

    submittedBy: {
        type: String,
        enum: ['delegate', 'presidium'],
        default: 'delegate'
    },

    presidiumAuthor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Motion content
    motionType: {
        type: String,
        enum: [
            'close_debate', 'suspension', 'moderated_caucus', 'unmoderated_caucus',
            'informal_consultation', 'extend_debate', 'voting_procedure',
            'disciplinary_action', 'technical_break', 'change_speaking_time',
            'reopen_speakers_list', 'limit_speakers', 'change_agenda'
        ],
        required: true
    },

    priority: {
        type: String,
        enum: ['highest', 'procedural', 'debate'],
        required: true
    },

    text: {
        type: String,
        required: true,
        maxlength: 1000
    },

    justification: {
        type: String,
        maxlength: 500
    },

    purpose: {
        type: String,
        maxlength: 300
    },

    // Motion parameters
    parameters: {
        duration: {
            type: Number, // For time-limited modes (seconds)
            default: null
        },
        speechTime: {
            type: Number, // For moderated caucus (seconds)
            default: null
        },
        topic: {
            type: String, // For topic-specific debates
            maxlength: 200,
            default: null
        },
        targetDelegate: {
            type: String, // For disciplinary actions
            default: null
        }
    },

    // Support tracking
    support: [supportSchema],

    requiredSupport: {
        type: Number,
        required: true
    },

    hasRequiredSupport: {
        type: Boolean,
        default: false
    },

    // Status and processing
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'accepted', 'rejected', 'voted', 'implemented'],
        default: 'submitted'
    },

    presidiumDecision: presidiumDecisionSchema,

    // Voting results
    votingResult: votingResultSchema,

    submittedAt: {
        type: Date,
        default: Date.now
    },

    processedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'proceduralMotions'
});

// Response schema for questions
const responseSchema = new mongoose.Schema({
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    responseText: {
        type: String,
        required: true,
        maxlength: 2000
    },

    responseType: {
        type: String,
        enum: ['oral', 'written'],
        default: 'oral'
    },

    respondedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Right of reply schema
const rightOfReplySchema = new mongoose.Schema({
    targetStatement: {
        type: String,
        required: true,
        maxlength: 500
    },

    targetSpeaker: {
        type: String,
        required: true
    },

    timeAllocated: {
        type: Number, // seconds
        default: 60
    }
}, { _id: false });

// Question schema
const questionSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Authorship and targeting
    authorEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    authorCountry: {
        type: String,
        required: true
    },

    targetRole: {
        type: String,
        enum: ['chairman', 'expert', 'speaker'],
        required: true
    },

    targetCountry: {
        type: String, // For questions to speakers
        default: null
    },

    // Question content
    questionType: {
        type: String,
        enum: [
            'personal_privilege', 'voting_procedure', 'to_speaker', 
            'procedure', 'to_chairman', 'to_expert', 'right_of_reply'
        ],
        required: true
    },

    priority: {
        type: Number,
        required: true // Auto-assigned based on type
    },

    text: {
        type: String,
        required: true,
        maxlength: 1000
    },

    context: {
        type: String, // Context or justification
        maxlength: 500
    },

    // Status and processing
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'answered', 'rejected'],
        default: 'submitted'
    },

    response: responseSchema,

    // For right of reply
    rightOfReply: rightOfReplySchema,

    submittedAt: {
        type: Date,
        default: Date.now
    },

    processedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'questions'
});

// Indexes for procedural motions
proceduralMotionSchema.index({ sessionId: 1, status: 1 });
proceduralMotionSchema.index({ committeeId: 1, submittedAt: -1 });
proceduralMotionSchema.index({ authorEmail: 1 });
proceduralMotionSchema.index({ priority: 1, submittedAt: 1 });
proceduralMotionSchema.index({ motionType: 1, status: 1 });

// Indexes for questions
questionSchema.index({ sessionId: 1, status: 1 });
questionSchema.index({ committeeId: 1, submittedAt: -1 });
questionSchema.index({ authorEmail: 1 });
questionSchema.index({ priority: 1, submittedAt: 1 });
questionSchema.index({ questionType: 1, status: 1 });

// Methods for procedural motions
proceduralMotionSchema.methods.checkSupportRequirement = function() {
    this.hasRequiredSupport = this.support.length >= this.requiredSupport;
    return this.hasRequiredSupport;
};

proceduralMotionSchema.methods.addSupport = function(country, email) {
    // Check if already supported
    const existingSupport = this.support.find(s => s.email === email);
    if (existingSupport) {
        throw new Error('Already supported by this delegate');
    }

    this.support.push({ country, email });
    this.checkSupportRequirement();
    return this;
};

proceduralMotionSchema.methods.removeSupport = function(email) {
    const supportIndex = this.support.findIndex(s => s.email === email);
    if (supportIndex === -1) {
        throw new Error('Support not found');
    }

    this.support.splice(supportIndex, 1);
    this.checkSupportRequirement();
    return this;
};

proceduralMotionSchema.methods.canBeVotedOn = function() {
    return this.status === 'accepted' && this.hasRequiredSupport;
};

// Static method to get priority number by question type
questionSchema.statics.getPriorityByType = function(questionType) {
    const priorities = {
        'personal_privilege': 1, // Highest priority
        'voting_procedure': 2,
        'procedure': 3,
        'to_chairman': 4,
        'to_expert': 5,
        'to_speaker': 6,
        'right_of_reply': 7 // Lowest priority
    };
    
    return priorities[questionType] || 5;
};

// Static method to get required support by motion type
proceduralMotionSchema.statics.getRequiredSupport = function(motionType, committeeSize) {
    // High priority motions require more support
    const highPriorityMotions = ['close_debate', 'suspension', 'change_agenda'];
    const proceduralMotions = ['voting_procedure', 'technical_break'];
    
    if (highPriorityMotions.includes(motionType)) {
        return Math.ceil(committeeSize * 0.25); // 25% support required
    } else if (proceduralMotions.includes(motionType)) {
        return 1; // Only proposer needed
    } else {
        return Math.ceil(committeeSize * 0.15); // 15% support required
    }
};

// Pre-save middleware to set required support and priority
proceduralMotionSchema.pre('save', async function(next) {
    if (this.isNew) {
        // Set priority based on motion type
        const priorityMap = {
            'suspension': 'highest',
            'close_debate': 'highest',
            'voting_procedure': 'procedural',
            'technical_break': 'procedural',
            'disciplinary_action': 'procedural',
            'moderated_caucus': 'debate',
            'unmoderated_caucus': 'debate',
            'informal_consultation': 'debate',
            'extend_debate': 'debate',
            'change_speaking_time': 'debate',
            'reopen_speakers_list': 'debate',
            'limit_speakers': 'debate',
            'change_agenda': 'highest'
        };
        
        if (!this.priority) {
            this.priority = priorityMap[this.motionType] || 'debate';
        }
        
        // Set required support if not already set
        if (!this.requiredSupport && this.committeeId) {
            try {
                const Committee = require('../committee/model').Committee;
                const committee = await Committee.findById(this.committeeId);
                if (committee) {
                    this.requiredSupport = this.constructor.getRequiredSupport(
                        this.motionType, 
                        committee.countries.length
                    );
                }
            } catch (error) {
                // Fallback to default
                this.requiredSupport = 1;
            }
        }
        
        this.checkSupportRequirement();
    }
    
    next();
});

// Pre-save middleware for questions to set priority
questionSchema.pre('save', function(next) {
    if (this.isNew && !this.priority) {
        this.priority = this.constructor.getPriorityByType(this.questionType);
    }
    next();
});

const ProceduralMotion = mongoose.model('ProceduralMotion', proceduralMotionSchema);
const Question = mongoose.model('Question', questionSchema);

module.exports = { ProceduralMotion, Question };