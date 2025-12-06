const mongoose = require('mongoose');

// Event schema for managing MUN events
const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },

    status: {
        type: String,
        enum: ['draft', 'active', 'completed'],
        default: 'draft'
    },

    // Event settings
    settings: {
        registrationDeadline: {
            type: Date,
            required: true
        },

        // Position paper submission deadline
        positionPaperDeadline: {
            type: Date,
            default: null
        },

        qrExpirationPeriod: {
            type: Date,
        },

        allowLateRegistration: {
            type: Boolean,
            default: false
        },

        // Allow position paper submissions after deadline if approved by presidium
        allowLatePositionPapers: {
            type: Boolean,
            default: true
        },

        maxCommittees: {
            type: Number,
            default: 20,
            required: false
        },

        timezone: {
            type: String,
            default: 'UTC'
        }
    },

    // Event statistics
    statistics: {
        totalCommittees: {
            type: Number,
            default: 0
        },

        totalParticipants: {
            type: Number,
            default: 0
        },

        totalCountries: {
            type: Number,
            default: 0
        },

        // Position paper statistics
        positionPapers: {
            total: {
                type: Number,
                default: 0
            },
            submitted: {
                type: Number,
                default: 0
            },
            approved: {
                type: Number,
                default: 0
            },
            rejected: {
                type: Number,
                default: 0
            },
            underReview: {
                type: Number,
                default: 0
            },
            lateSubmissions: {
                type: Number,
                default: 0
            }
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Soft delete fields
    deletedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    collection: 'events'
});

// Indexes for performance
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ 'settings.registrationDeadline': 1 });
eventSchema.index({ 'settings.positionPaperDeadline': 1 }); 
eventSchema.index({ deletedAt: 1 });

// Query middleware to exclude soft deleted events
eventSchema.pre(/^find/, function () {
    this.where({ deletedAt: null });
});

eventSchema.pre('aggregate', function () {
    this.pipeline().unshift({ $match: { deletedAt: null } });
});

eventSchema.pre('countDocuments', function () {
    this.where({ deletedAt: null });
});

// Virtual for event duration
eventSchema.virtual('duration').get(function () {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for registration status
eventSchema.virtual('registrationOpen').get(function () {
    const now = new Date();
    return now <= this.settings.registrationDeadline || this.settings.allowLateRegistration;
});

// Virtual for position paper submission status
eventSchema.virtual('positionPaperSubmissionOpen').get(function () {
    if (!this.settings.positionPaperDeadline) return true; // No deadline set

    // Get current time in event timezone
    const now = this.getCurrentTimeInEventTimezone();
    const deadline = this.getDateInEventTimezone(this.settings.positionPaperDeadline);

    return now <= deadline || this.settings.allowLatePositionPapers;
});

// Method to check if event is currently active
eventSchema.methods.isActive = function () {
    const now = new Date();
    return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

// Method to get current time in event timezone
eventSchema.methods.getCurrentTimeInEventTimezone = function () {
    const timezone = this.settings.timezone || 'UTC';
    return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
};

// Method to convert UTC date to event timezone
eventSchema.methods.getDateInEventTimezone = function (utcDate) {
    if (!utcDate) return null;
    const timezone = this.settings.timezone || 'UTC';
    return new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
};

// Method to check if position paper deadline has passed
eventSchema.methods.isPositionPaperDeadlinePassed = function () {
    if (!this.settings.positionPaperDeadline) return false;

    const now = this.getCurrentTimeInEventTimezone();
    const deadline = this.getDateInEventTimezone(this.settings.positionPaperDeadline);

    return now > deadline;
};

// Method to check if position paper submissions are allowed
eventSchema.methods.canSubmitPositionPaper = function () {
    if (!this.settings.positionPaperDeadline) return true; // No deadline set

    const deadlinePassed = this.isPositionPaperDeadlinePassed();
    return !deadlinePassed || this.settings.allowLatePositionPapers;
};

// Method to update statistics
eventSchema.methods.updateStatistics = async function () {
    const Committee = mongoose.model('Committee');
    const Document = mongoose.model('Document');

    const committees = await Committee.find({ eventId: this._id });

    this.statistics.totalCommittees = committees.length;

    // Calculate total participants and countries
    let totalParticipants = 0;
    const uniqueCountries = new Set();

    committees.forEach(committee => {
        totalParticipants += committee.countries.length;
        committee.countries.forEach(country => {
            uniqueCountries.add(country.name);
        });
    });

    this.statistics.totalParticipants = totalParticipants;
    this.statistics.totalCountries = uniqueCountries.size;

    // Update position paper statistics
    const committeeIds = committees.map(c => c._id);

    if (committeeIds.length > 0) {
        const positionPaperStats = await Document.aggregate([
            {
                $match: {
                    committeeId: { $in: committeeIds },
                    type: 'position_paper'
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    lateCount: {
                        $sum: {
                            $cond: ['$isLateSubmission', 1, 0]
                        }
                    }
                }
            }
        ]);

        // Reset statistics
        this.statistics.positionPapers = {
            total: totalParticipants, // Total expected (one per participant)
            submitted: 0,
            approved: 0,
            rejected: 0,
            underReview: 0,
            lateSubmissions: 0
        };

        // Calculate statistics from aggregation
        positionPaperStats.forEach(stat => {
            switch (stat._id) {
                case 'uploaded':
                case 'under_review':
                    this.statistics.positionPapers.submitted += stat.count;
                    this.statistics.positionPapers.underReview += stat.count;
                    break;
                case 'approved':
                    this.statistics.positionPapers.submitted += stat.count;
                    this.statistics.positionPapers.approved += stat.count;
                    break;
                case 'rejected':
                case 'needs_revision':
                    this.statistics.positionPapers.submitted += stat.count;
                    this.statistics.positionPapers.rejected += stat.count;
                    break;
            }
            this.statistics.positionPapers.lateSubmissions += stat.lateCount;
        });
    } else {
        // No committees yet
        this.statistics.positionPapers = {
            total: 0,
            submitted: 0,
            approved: 0,
            rejected: 0,
            underReview: 0,
            lateSubmissions: 0
        };
    }

    await this.save();
};

// Soft delete method
eventSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    return this.save();
};

// Restore method
eventSchema.methods.restore = function () {
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

// Static method to find deleted events
eventSchema.statics.findOneDeleted = function (filter) {
    return this.findOne({ ...filter, deletedAt: { $ne: null } });
};

// Pre-save middleware to set qrExpirationPeriod default
eventSchema.pre('save', function (next) {
    // Check if the qrExpirationPeriod has NOT been set by the user (is new or modified)
    if (this.isNew || this.isModified('settings.qrExpirationPeriod')) {
        // Skip if a value has been explicitly provided
        return next();
    }

    // Set qrExpirationPeriod equal to endDate if it hasn't been set
    if (!this.settings.qrExpirationPeriod) {
        this.settings.qrExpirationPeriod = this.endDate;
    }

    next();
});

// Pre-save middleware to set position paper deadline default
eventSchema.pre('save', function (next) {
    // Set default position paper deadline to 48 hours before event start if not provided
    if (this.isNew && !this.settings.positionPaperDeadline) {
        const defaultDeadline = new Date(this.startDate.getTime() - 48 * 60 * 60 * 1000);
        this.settings.positionPaperDeadline = defaultDeadline;
    }

    next();
});

// Pre-save middleware to validate dates
eventSchema.pre('save', function (next) {
    if (this.settings.registrationDeadline > this.startDate) {
        return next(new Error('Registration deadline must be before event start date'));
    }

    // Validate position paper deadline 
    if (this.settings.positionPaperDeadline && this.settings.positionPaperDeadline > this.startDate) {
        return next(new Error('Position paper deadline must be before event start date'));
    }

    next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = { Event };