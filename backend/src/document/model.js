const mongoose = require('mongoose');

// Document version schema for tracking revisions
const versionSchema = new mongoose.Schema({
    version: {
        type: Number,
        required: true
    },

    filename: {
        type: String,
        required: true
    },

    filePath: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        required: true
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: ['uploaded', 'under_review', 'approved', 'rejected'],
        default: 'uploaded'
    },

    extractedText: {
        type: String,
        default: ''
    },

    pageCount: {
        type: Number,
        default: 0
    },

    wordCount: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Presidium review schema
const reviewSchema = new mongoose.Schema({
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    decision: {
        type: String,
        enum: ['approve', 'reject', 'needs_revision'],
        required: true
    },

    comments: {
        type: String,
        maxlength: 2000
    },

    reviewedAt: {
        type: Date,
        default: Date.now
    },

    allowResubmission: {
        type: Boolean,
        default: false
    },

    extendedDeadline: {
        type: Date,
        default: null
    }
}, { _id: false });

// Main document schema
const documentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['position_paper', 'public_document', 'resolution_draft'],
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Author information (for position papers and resolutions)
    authorEmail: {
        type: String,
        lowercase: true,
        required: function () { return this.type !== 'public_document'; }
    },

    authorCountry: {
        type: String,
        required: function () { return this.type !== 'public_document'; }
    },

    // Uploader information (for public documents - presidium member)
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return this.type === 'public_document'; }
    },

    // File information for current version
    filename: {
        type: String,
        required: true
    },

    originalName: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        required: true,
        max: 10485760 // 10MB
    },

    mimeType: {
        type: String,
        required: true,
        enum: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/rtf'
        ]
    },

    filePath: {
        type: String,
        required: true
    },

    // Content analysis
    content: {
        extractedText: {
            type: String,
            default: ''
        },

        pageCount: {
            type: Number,
            default: 0
        },

        wordCount: {
            type: Number,
            default: 0
        },

        lastAnalyzed: {
            type: Date,
            default: Date.now
        }
    },

    // Status and moderation
    status: {
        type: String,
        enum: ['uploaded', 'under_review', 'approved', 'rejected', 'needs_revision'],
        default: 'uploaded'
    },

    presidiumReview: reviewSchema,

    // Version management
    version: {
        type: Number,
        default: 1
    },

    parentDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        default: null
    },

    versions: [versionSchema],

    // Public document specific fields
    isPublic: {
        type: Boolean,
        default: function () { return this.type === 'public_document'; }
    },

    publicTitle: {
        type: String,
        required: function () { return this.type === 'public_document'; },
        maxlength: 200
    },

    publicDescription: {
        type: String,
        maxlength: 1000
    },

    // Submission deadline tracking
    submissionDeadline: {
        type: Date,
        default: null
    },

    isLateSubmission: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'documents'
});

// Indexes for performance
documentSchema.index({ type: 1, committeeId: 1 });
documentSchema.index({ authorEmail: 1, type: 1 });
documentSchema.index({ status: 1, type: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ parentDocumentId: 1 });
documentSchema.index({ createdAt: -1 });

// Compound index for unique position papers per author per committee
documentSchema.index(
    { authorEmail: 1, committeeId: 1, type: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: 'position_paper',
            parentDocumentId: null
        }
    }
);

// Virtual for file extension
documentSchema.virtual('fileExtension').get(function () {
    return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for current version info
documentSchema.virtual('currentVersion').get(function () {
    return {
        version: this.version,
        filename: this.filename,
        filePath: this.filePath,
        fileSize: this.fileSize,
        uploadedAt: this.createdAt,
        status: this.status
    };
});

// Virtual for checking if document is overdue
documentSchema.virtual('isOverdue').get(function () {
    if (!this.submissionDeadline || this.status === 'approved') {
        return false;
    }
    return new Date() > this.submissionDeadline;
});

// Method to create new version
documentSchema.methods.createNewVersion = function (fileData) {
    // Store current version in versions array
    this.versions.push({
        version: this.version,
        filename: this.filename,
        filePath: this.filePath,
        fileSize: this.fileSize,
        uploadedAt: this.updatedAt || this.createdAt,
        status: this.status,
        extractedText: this.content.extractedText,
        pageCount: this.content.pageCount,
        wordCount: this.content.wordCount
    });

    // Update current version
    this.version += 1;
    this.filename = fileData.filename;
    this.originalName = fileData.originalName;
    this.fileSize = fileData.fileSize;
    this.mimeType = fileData.mimeType;
    this.filePath = fileData.filePath;
    this.status = 'uploaded';

    // Clear previous review
    this.presidiumReview = undefined;

    return this.version;
};

// Method to add presidium review
documentSchema.methods.addPresidiumReview = function (reviewData) {
    this.presidiumReview = {
        reviewedBy: reviewData.reviewedBy,
        decision: reviewData.decision,
        comments: reviewData.comments || '',
        allowResubmission: reviewData.allowResubmission || false,
        extendedDeadline: reviewData.extendedDeadline || null
    };

    // Update document status based on review decision
    switch (reviewData.decision) {
        case 'approve':
            this.status = 'approved';
            break;
        case 'reject':
            this.status = 'rejected';
            break;
        case 'needs_revision':
            this.status = 'needs_revision';
            break;
    }

    return this.presidiumReview;
};

// Method to check if resubmission is allowed
documentSchema.methods.canResubmit = function () {
    if (this.status === 'approved') {
        return false;
    }

    // If rejected with no resubmission allowed
    if (this.status === 'rejected' &&
        this.presidiumReview &&
        !this.presidiumReview.allowResubmission) {
        return false;
    }

    // Check deadlines
    if (this.submissionDeadline && !this.presidiumReview?.extendedDeadline) {
        return new Date() <= this.submissionDeadline;
    }

    // Check extended deadline
    if (this.presidiumReview?.extendedDeadline) {
        return new Date() <= this.presidiumReview.extendedDeadline;
    }

    return true;
};

// Method to update content analysis
documentSchema.methods.updateContent = function (contentData) {
    this.content = {
        extractedText: contentData.extractedText || '',
        pageCount: contentData.pageCount || 0,
        wordCount: contentData.wordCount || 0,
        lastAnalyzed: new Date()
    };
};

// Method to get all versions (including current)
documentSchema.methods.getAllVersions = function () {
    const allVersions = [...this.versions];

    // Add current version
    allVersions.push({
        version: this.version,
        filename: this.filename,
        filePath: this.filePath,
        fileSize: this.fileSize,
        uploadedAt: this.updatedAt || this.createdAt,
        status: this.status,
        extractedText: this.content.extractedText,
        pageCount: this.content.pageCount,
        wordCount: this.content.wordCount
    });

    return allVersions.sort((a, b) => b.version - a.version);
};

// Pre-save middleware to set submission deadline
documentSchema.pre('save', async function (next) {
    if (this.isNew && this.type === 'position_paper') {
        try {
            const Committee = mongoose.model('Committee');
            const committee = await Committee.findById(this.committeeId);

            if (committee && committee.settings.documentDeadlines.positionPapers) {
                this.submissionDeadline = committee.settings.documentDeadlines.positionPapers;
                this.isLateSubmission = new Date() > this.submissionDeadline;
            }
        } catch (error) {
            // Continue without deadline if committee not found
        }
    }

    next();
});

// Pre-save middleware to update status
documentSchema.pre('save', function (next) {
    if (this.isModified('presidiumReview')) {
        this.status = 'under_review';
    }
    next();
});

const Document = mongoose.model('Document', documentSchema);

module.exports = { Document };