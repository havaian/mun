const mongoose = require('mongoose');
const crypto = require('crypto');

// Country participant schema
const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        trim: true
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
    },

    // Participant information (filled during registration)
    email: {
        type: String,
        sparse: true,
        lowercase: true
    },

    // Login token for authentication - replaces qrToken
    loginToken: {
        type: String,
        unique: true,
        sparse: true
    },

    // Track if login token is active - replaces isQrActive
    isActive: {
        type: Boolean,
        default: true
    },

    registeredAt: {
        type: Date,
        default: null
    },

    lastActivity: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Presidium member schema  
const presidiumSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    role: {
        type: String,
        enum: ['chairman', 'co-chairman', 'expert', 'secretary'],
        required: true
    },

    appointedAt: {
        type: Date,
        default: Date.now
    },

    appointedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { _id: false });

// Committee main schema
const committeeSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    type: {
        type: String,
        enum: ['GA', 'SC', 'ECOSOC', 'HRC', 'other'],
        required: true
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500
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

    // Committee participants
    countries: [countrySchema],

    // Presidium composition
    presidium: [presidiumSchema],

    // Session settings
    settings: {
        votingSettings: {
            requireMajority: {
                type: Boolean,
                default: true
            },

            allowAbstentions: {
                type: Boolean,
                default: true
            },

            vetoEnabled: {
                type: Boolean,
                default: false // Only for SC
            },

            secretBallot: {
                type: Boolean,
                default: false
            }
        },

        debateSettings: {
            speakersList: {
                type: Boolean,
                default: true
            },

            pointsOfOrder: {
                type: Boolean,
                default: true
            },

            rightOfReply: {
                type: Boolean,
                default: true
            }
        },

        speechSettings: {
            defaultSpeechTime: {
                type: Number, // seconds
                default: 90,
                min: 30,
                max: 300
            },
            allowExtensions: {
                type: Boolean,
                default: true
            },
            extensionTime: {
                type: Number, // seconds
                default: 30,
                min: 15,
                max: 60
            }
        }
    },

    // Committee statistics
    statistics: {
        totalSessions: {
            type: Number,
            default: 0
        },
        totalVotings: {
            type: Number,
            default: 0
        },
        resolutionsPassed: {
            type: Number,
            default: 0
        },
        amendmentsPassed: {
            type: Number,
            default: 0
        }
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
    collection: 'committees'
});

// Indexes for performance
committeeSchema.index({ eventId: 1, status: 1 });
committeeSchema.index({ type: 1 });
committeeSchema.index({ 'countries.name': 1 });
committeeSchema.index({ 'countries.loginToken': 1 }, { sparse: true }); // was qrToken
committeeSchema.index({ 'presidium.userId': 1 });
committeeSchema.index({ deletedAt: 1 });

// Ensure unique country names within committee
committeeSchema.index({ _id: 1, 'countries.name': 1 }, { unique: true });

// Query middleware to exclude soft deleted committees
committeeSchema.pre(/^find/, function () {
    this.where({ deletedAt: null });
});

committeeSchema.pre('aggregate', function () {
    this.pipeline().unshift({ $match: { deletedAt: null } });
});

committeeSchema.pre('countDocuments', function () {
    this.where({ deletedAt: null });
});

// Virtual for active country count
committeeSchema.virtual('activeCountryCount').get(function () {
    return this.countries.filter(country => !country.isObserver && !country.specialRole).length;
});

// Virtual for total participant count
committeeSchema.virtual('totalParticipants').get(function () {
    return this.countries.length;
});

// Virtual for registered participant count
committeeSchema.virtual('registeredParticipants').get(function () {
    return this.countries.filter(country => country.email).length;
});

// Method to generate login tokens for all countries - replaces generateQRTokens
committeeSchema.methods.generateLoginTokens = function () {
    this.countries.forEach(country => {
        if (!country.loginToken) {
            country.loginToken = crypto.randomBytes(32).toString('hex');
            country.isActive = true;
        }
    });
};

// Method to check if country name is unique in committee
committeeSchema.methods.isCountryNameUnique = function (countryName, excludeId = null) {
    return !this.countries.some(country =>
        country.name.toLowerCase() === countryName.toLowerCase() &&
        (!excludeId || country._id.toString() !== excludeId)
    );
};

// Method to add country - updated to use loginToken
committeeSchema.methods.addCountry = function (countryData) {
    if (!this.isCountryNameUnique(countryData.name)) {
        throw new Error(`Country "${countryData.name}" already exists in this committee`);
    }

    const country = {
        ...countryData,
        loginToken: crypto.randomBytes(32).toString('hex'),
        isActive: true
    };

    this.countries.push(country);
    return country;
};

// Method to remove country
committeeSchema.methods.removeCountry = function (countryName) {
    const countryIndex = this.countries.findIndex(
        country => country.name.toLowerCase() === countryName.toLowerCase()
    );

    if (countryIndex === -1) {
        throw new Error(`Country "${countryName}" not found in this committee`);
    }

    // Check if country has any active participations
    // TODO: Add checks for active coalitions, resolutions, etc.

    this.countries.splice(countryIndex, 1);
    return this.countries;
};

// Method to get country by name
committeeSchema.methods.getCountry = function (countryName) {
    return this.countries.find(
        country => country.name.toLowerCase() === countryName.toLowerCase()
    );
};

// Method to update country
committeeSchema.methods.updateCountry = function (countryName, updateData) {
    const country = this.getCountry(countryName);
    if (!country) {
        throw new Error(`Country "${countryName}" not found in this committee`);
    }

    Object.assign(country, updateData);
    return country;
};

// Method to regenerate login token for country - replaces regenerateQRToken
committeeSchema.methods.regenerateLoginToken = function (countryName) {
    const country = this.getCountry(countryName);
    if (!country) {
        throw new Error(`Country "${countryName}" not found in this committee`);
    }

    country.loginToken = crypto.randomBytes(32).toString('hex');
    country.isActive = true;
    country.email = null; // Reset email binding
    country.registeredAt = null;

    return country;
};

// Method to add presidium member
committeeSchema.methods.addPresidiumMember = function (memberData) {
    // Check if role is already assigned
    const existingMember = this.presidium.find(
        member => member.role === memberData.role
    );

    if (existingMember) {
        throw new Error(`Presidium role "${memberData.role}" is already assigned`);
    }

    this.presidium.push(memberData);
    return memberData;
};

// Method to remove presidium member
committeeSchema.methods.removePresidiumMember = function (role) {
    const memberIndex = this.presidium.findIndex(
        member => member.role === role
    );

    if (memberIndex === -1) {
        throw new Error(`Presidium member with role "${role}" not found`);
    }

    this.presidium.splice(memberIndex, 1);
    return this.presidium;
};

// Method to get presidium member by role
committeeSchema.methods.getPresidiumMember = function (role) {
    return this.presidium.find(member => member.role === role);
};

// Soft delete method
committeeSchema.methods.softDelete = function (deletedByUserId) {
    this.deletedAt = new Date();
    this.deletedBy = deletedByUserId;
    return this.save();
};

// Restore method
committeeSchema.methods.restore = function () {
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

// Static method to find deleted committees
committeeSchema.statics.findOneDeleted = function (filter) {
    return this.findOne({ ...filter, deletedAt: { $ne: null } });
};

const Committee = mongoose.model('Committee', committeeSchema);

module.exports = { Committee };