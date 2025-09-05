const mongoose = require('mongoose');

// Coalition member schema
const coalitionMemberSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true
    },

    status: {
        type: String,
        enum: ['invited', 'accepted', 'declined'],
        default: 'invited'
    },

    role: {
        type: String,
        enum: ['head', 'co-author'],
        required: true
    },

    invitedAt: {
        type: Date,
        default: Date.now
    },

    respondedAt: {
        type: Date,
        default: null
    }
}, { _id: false });

// Coalition schema
const coalitionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Coalition head (initiator)
    headCountry: {
        type: String,
        required: true
    },

    headEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    // All members including head
    members: [coalitionMemberSchema],

    // Coalition status
    isActive: {
        type: Boolean,
        default: false
    },

    minMembersReached: {
        type: Boolean,
        default: false
    },

    // Associated resolution
    resolutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resolution',
        default: null
    }
}, {
    timestamps: true,
    collection: 'coalitions'
});

// Voting results schema
const votingResultsSchema = new mongoose.Schema({
    votesFor: {
        type: Number,
        default: 0
    },

    votesAgainst: {
        type: Number,
        default: 0
    },

    abstentions: {
        type: Number,
        default: 0
    },

    totalVotes: {
        type: Number,
        default: 0
    },

    passed: {
        type: Boolean,
        default: false
    },

    votingType: {
        type: String,
        enum: ['simple', 'rollCall'],
        default: 'simple'
    },

    votes: [{
        country: String,
        vote: {
            type: String,
            enum: ['for', 'against', 'abstain']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    vetoUsed: {
        type: Boolean,
        default: false
    },

    vetoCountry: {
        type: String,
        default: null
    }
}, { _id: false });

// Presidium review schema
const presidiumReviewSchema = new mongoose.Schema({
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    decision: {
        type: String,
        enum: ['accept', 'reject_with_deadline', 'reject_with_extension'],
        required: true
    },

    comments: {
        type: String,
        maxlength: 2000
    },

    allowResubmission: {
        type: Boolean,
        default: false
    },

    extendedDeadline: {
        type: Date,
        default: null
    },

    reviewedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Version history schema
const versionHistorySchema = new mongoose.Schema({
    version: {
        type: Number,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    submittedAt: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
        default: 'submitted'
    }
}, { _id: false });

// Main resolution schema
const resolutionSchema = new mongoose.Schema({
    coalitionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coalition',
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Basic information
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    content: {
        type: String,
        required: true,
        maxlength: 50000 // 50k characters max
    },

    documentType: {
        type: String,
        enum: ['resolution', 'declaration', 'decision'],
        default: 'resolution'
    },

    // Authorship
    authors: [String], // Country names
    authorEmails: [String],
    coAuthors: [String], // Co-author country names
    coAuthorEmails: [String],

    // Status and workflow
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'working_document'],
        default: 'draft'
    },

    submissionDeadline: {
        type: Date,
        required: true
    },

    // Presidium review
    presidiumReview: presidiumReviewSchema,

    // Voting results
    votingResults: votingResultsSchema,

    // Version management
    version: {
        type: Number,
        default: 1
    },

    versionHistory: [versionHistorySchema],

    // Special designations
    isPresidiumDraft: {
        type: Boolean,
        default: false
    },

    isWorkingDocument: {
        type: Boolean,
        default: false
    },

    // Submission tracking
    submittedAt: {
        type: Date,
        default: null
    },

    lastModifiedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'resolutions'
});

// Indexes for performance
coalitionSchema.index({ committeeId: 1, isActive: 1 });
coalitionSchema.index({ headEmail: 1, committeeId: 1 });
coalitionSchema.index({ 'members.email': 1 });

resolutionSchema.index({ committeeId: 1, status: 1 });
resolutionSchema.index({ coalitionId: 1 });
resolutionSchema.index({ submittedAt: 1 });
resolutionSchema.index({ 'authors': 1 });

// Ensure one active coalition per head per committee
coalitionSchema.index(
    { headEmail: 1, committeeId: 1 },
    {
        unique: true,
        partialFilterExpression: { isActive: true }
    }
);

// Ensure one coalition member can only be in one active coalition per committee
coalitionSchema.index(
    { 'members.email': 1, committeeId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isActive: true,
            'members.status': 'accepted'
        }
    }
);

// Coalition virtuals and methods
coalitionSchema.virtual('acceptedMembers').get(function () {
    return this.members.filter(member => member.status === 'accepted');
});

coalitionSchema.virtual('pendingInvitations').get(function () {
    return this.members.filter(member => member.status === 'invited');
});

coalitionSchema.virtual('memberCount').get(function () {
    return this.acceptedMembers.length;
});

// Method to invite member to coalition
coalitionSchema.methods.inviteMember = function (country, email) {
    // Check if already invited
    const existingMember = this.members.find(m => m.email === email);
    if (existingMember) {
        throw new Error(`${country} is already invited to this coalition`);
    }

    this.members.push({
        country,
        email,
        status: 'invited',
        role: 'co-author'
    });

    return this.members[this.members.length - 1];
};

// Method to respond to coalition invitation
coalitionSchema.methods.respondToInvitation = function (email, response) {
    const member = this.members.find(m => m.email === email && m.status === 'invited');
    if (!member) {
        throw new Error('No pending invitation found for this member');
    }

    member.status = response; // 'accepted' or 'declined'
    member.respondedAt = new Date();

    this.checkActivationStatus();

    return member;
};

// Method to check if coalition can be activated
coalitionSchema.methods.checkActivationStatus = async function () {
    const Committee = mongoose.model('Committee');
    const committee = await Committee.findById(this.committeeId);

    const acceptedCount = this.acceptedMembers.length;
    this.minMembersReached = acceptedCount >= committee.settings.minCoalitionSize;

    return this.minMembersReached;
};

// Method to activate coalition
coalitionSchema.methods.activate = function () {
    if (!this.minMembersReached) {
        throw new Error('Minimum coalition size not reached');
    }

    this.isActive = true;
    return true;
};

// Resolution virtuals and methods
resolutionSchema.virtual('isOverdue').get(function () {
    if (this.status === 'approved' || this.status === 'working_document') {
        return false;
    }
    return new Date() > this.submissionDeadline;
});

resolutionSchema.virtual('wordCount').get(function () {
    return this.content ? this.content.split(/\s+/).filter(word => word.length > 0).length : 0;
});

// Method to create new version
resolutionSchema.methods.createNewVersion = function (newContent) {
    // Store current version in history
    this.versionHistory.push({
        version: this.version,
        content: this.content,
        submittedAt: this.lastModifiedAt || this.createdAt,
        status: this.status
    });

    // Update to new version
    this.version += 1;
    this.content = newContent;
    this.status = 'submitted';
    this.lastModifiedAt = new Date();

    // Clear previous review
    this.presidiumReview = undefined;

    return this.version;
};

// Method to add presidium review
resolutionSchema.methods.addPresidiumReview = function (reviewData) {
    this.presidiumReview = {
        reviewedBy: reviewData.reviewedBy,
        decision: reviewData.decision,
        comments: reviewData.comments || '',
        allowResubmission: reviewData.allowResubmission || false,
        extendedDeadline: reviewData.extendedDeadline || null
    };

    // Update status based on decision
    switch (reviewData.decision) {
        case 'accept':
            this.status = 'approved';
            break;
        case 'reject_with_deadline':
        case 'reject_with_extension':
            this.status = 'rejected';
            break;
    }

    return this.presidiumReview;
};

// Method to check if resubmission is allowed
resolutionSchema.methods.canResubmit = function () {
    if (this.status === 'approved' || this.status === 'working_document') {
        return false;
    }

    // If rejected without resubmission
    if (this.status === 'rejected' &&
        this.presidiumReview &&
        !this.presidiumReview.allowResubmission) {
        return false;
    }

    // Check deadlines
    if (this.presidiumReview?.extendedDeadline) {
        return new Date() <= this.presidiumReview.extendedDeadline;
    }

    return new Date() <= this.submissionDeadline;
};

// Method to set voting results
resolutionSchema.methods.setVotingResults = function (results) {
    this.votingResults = {
        votesFor: results.votesFor || 0,
        votesAgainst: results.votesAgainst || 0,
        abstentions: results.abstentions || 0,
        totalVotes: results.totalVotes || 0,
        passed: results.passed || false,
        votingType: results.votingType || 'simple',
        votes: results.votes || [],
        vetoUsed: results.vetoUsed || false,
        vetoCountry: results.vetoCountry || null
    };

    if (this.votingResults.passed) {
        this.status = 'working_document';
        this.isWorkingDocument = true;
    }

    return this.votingResults;
};

// Pre-save middleware
coalitionSchema.pre('save', function (next) {
    // Ensure head is always in members list
    const headInMembers = this.members.find(m => m.email === this.headEmail);
    if (!headInMembers) {
        this.members.unshift({
            country: this.headCountry,
            email: this.headEmail,
            status: 'accepted',
            role: 'head',
            invitedAt: this.createdAt || new Date(),
            respondedAt: this.createdAt || new Date()
        });
    }

    next();
});

resolutionSchema.pre('save', function (next) {
    this.lastModifiedAt = new Date();
    next();
});

const Coalition = mongoose.model('Coalition', coalitionSchema);
const Resolution = mongoose.model('Resolution', resolutionSchema);

module.exports = { Coalition, Resolution };