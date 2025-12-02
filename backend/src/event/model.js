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

        qrExpirationPeriod: {
            type: Date,
        },

        allowLateRegistration: {
            type: Boolean,
            default: false
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
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    collection: 'events'
});

// Indexes for performance
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ 'settings.registrationDeadline': 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function () {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for registration status
eventSchema.virtual('registrationOpen').get(function () {
    const now = new Date();
    return now <= this.settings.registrationDeadline || this.settings.allowLateRegistration;
});

// Method to check if event is currently active
eventSchema.methods.isActive = function () {
    const now = new Date();
    return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

// Method to update statistics
eventSchema.methods.updateStatistics = async function () {
    const Committee = mongoose.model('Committee');

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

    await this.save();
};

// New Pre-save middleware to set qrExpirationPeriod default
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

// Pre-save middleware to validate dates
eventSchema.pre('save', function (next) {
    if (this.settings.registrationDeadline > this.startDate) {
        return next(new Error('Registration deadline must be before event start date'));
    }
    next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = { Event };