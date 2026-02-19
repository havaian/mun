const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // Organization reference — events always belong to an org
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    // URL-friendly slug, unique within organization
    slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        default: null,
        trim: true,
        maxlength: 5000
    },

    location: {
        type: String,
        default: null,
        trim: true,
        maxlength: 300
    },

    logo: {
        type: String,
        default: null
    },

    photos: {
        type: [String],
        default: []
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

    timezone: {
        type: String,
        default: 'UTC'
    },

    settings: {
        registrationStartDate: {
            type: Date,
            default: null
        },
        registrationEndDate: {
            type: Date,
            default: null
        },
        positionPaperDeadline: {
            type: Date,
            default: null
        },
        allowLateRegistration: {
            type: Boolean,
            default: false
        },
        allowLatePositionPapers: {
            type: Boolean,
            default: true
        }
    },

    // Expanded status flow
    status: {
        type: String,
        enum: [
            'draft',                // just created, not visible publicly
            'published',            // visible, registration not yet open
            'registration_open',    // accepting applications
            'registration_closed',  // no more applications
            'active',               // event is happening
            'completed'             // event is over
        ],
        default: 'draft'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Denormalized stats (updated on changes)
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
        totalApplications: {
            type: Number,
            default: 0
        },
        positionPapers: {
            total: { type: Number, default: 0 },
            submitted: { type: Number, default: 0 },
            approved: { type: Number, default: 0 },
            rejected: { type: Number, default: 0 },
            underReview: { type: Number, default: 0 }
        }
    }
}, {
    timestamps: true,
    collection: 'events'
});

// Indexes
eventSchema.index({ organization: 1, slug: 1 }, { unique: true });
eventSchema.index({ organization: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ createdBy: 1 });

// Generate slug from name, unique within organization
eventSchema.statics.generateSlug = async function (name, organizationId, excludeId = null) {
    let slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    let finalSlug = slug;
    let counter = 1;
    const query = { organization: organizationId, slug: finalSlug };
    if (excludeId) query._id = { $ne: excludeId };

    while (await this.findOne(query)) {
        finalSlug = `${slug}-${counter}`;
        query.slug = finalSlug;
        counter++;
    }

    return finalSlug;
};

// Update denormalized statistics
eventSchema.methods.updateStatistics = async function () {
    const Committee = mongoose.model('Committee');
    const EventParticipant = mongoose.model('EventParticipant');

    const [committeeCount, participantCount] = await Promise.all([
        Committee.countDocuments({ event: this._id }),
        EventParticipant.countDocuments({ event: this._id, status: 'active' })
    ]);

    // Count unique countries across all participants
    const countryAgg = await EventParticipant.aggregate([
        { $match: { event: this._id, status: 'active', 'country.code': { $ne: null } } },
        { $group: { _id: '$country.code' } },
        { $count: 'total' }
    ]);

    this.statistics.totalCommittees = committeeCount;
    this.statistics.totalParticipants = participantCount;
    this.statistics.totalCountries = countryAgg[0]?.total || 0;

    await this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = { Event };