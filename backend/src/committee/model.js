const mongoose = require('mongoose');
const crypto = require('crypto');

// Country participant schema
const countrySchema = new mongoose.Schema({
    name: {
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

    qrToken: {
        type: String,
        unique: true,
        sparse: true
    },

    isQrActive: {
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

// Committee schema
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
        enum: ['GA', 'SC', 'other'],
        required: true
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    language: {
        type: String,
        enum: ['english', 'russian', 'uzbek'],
        default: 'english'
    },

    status: {
        type: String,
        enum: ['setup', 'active', 'completed'],
        default: 'setup'
    },

    // Countries participating in this committee
    countries: [countrySchema],

    // Presidium members
    presidium: [presidiumSchema],

    // Committee working settings
    settings: {
        minCoalitionSize: {
            type: Number,
            default: 3,
            min: 2,
            max: 10
        },

        documentDeadlines: {
            positionPapers: {
                type: Date,
                default: null
            },
            resolutions: {
                type: Date,
                default: null
            },
            amendments: {
                type: Date,
                default: null
            }
        },

        votingRules: {
            defaultMajority: {
                type: String,
                enum: ['simple', 'qualified'],
                default: 'simple'
            },
            allowConsensus: {
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
    }
}, {
    timestamps: true,
    collection: 'committees'
});

// Indexes for performance
committeeSchema.index({ eventId: 1, status: 1 });
committeeSchema.index({ type: 1 });
committeeSchema.index({ 'countries.name': 1 });
committeeSchema.index({ 'countries.qrToken': 1 }, { sparse: true });
committeeSchema.index({ 'presidium.userId': 1 });

// Ensure unique country names within committee
committeeSchema.index({ _id: 1, 'countries.name': 1 }, { unique: true });

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

// Method to generate QR tokens for all countries
committeeSchema.methods.generateQRTokens = function () {
    this.countries.forEach(country => {
        if (!country.qrToken) {
            country.qrToken = crypto.randomBytes(32).toString('hex');
            country.isQrActive = true;
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

// Method to add country
committeeSchema.methods.addCountry = function (countryData) {
    if (!this.isCountryNameUnique(countryData.name)) {
        throw new Error(`Country "${countryData.name}" already exists in this committee`);
    }

    const country = {
        ...countryData,
        qrToken: crypto.randomBytes(32).toString('hex'),
        isQrActive: true
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
    // TODO: Add checks for active coalitions, resolutions, etc. when those modules are ready

    this.countries.splice(countryIndex, 1);
    return true;
};

// Method to get country by name
committeeSchema.methods.getCountry = function (countryName) {
    return this.countries.find(
        country => country.name.toLowerCase() === countryName.toLowerCase()
    );
};

// Method to update country information
committeeSchema.methods.updateCountry = function (countryName, updates) {
    const country = this.getCountry(countryName);
    if (!country) {
        throw new Error(`Country "${countryName}" not found`);
    }

    Object.keys(updates).forEach(key => {
        if (key !== '_id' && key !== 'qrToken') {
            country[key] = updates[key];
        }
    });

    return country;
};

// Method to check presidium completeness
committeeSchema.methods.hasCompletePresidium = function () {
    const requiredRoles = ['chairman', 'co-chairman', 'expert', 'secretary'];
    const assignedRoles = this.presidium.map(p => p.role);
    return requiredRoles.every(role => assignedRoles.includes(role));
};

// Method to add presidium member
committeeSchema.methods.addPresidiumMember = function (userId, role, appointedBy) {
    // Check if role is already taken
    const existingMember = this.presidium.find(p => p.role === role);
    if (existingMember) {
        throw new Error(`Role "${role}" is already assigned`);
    }

    // Check if user is already in presidium
    const existingUser = this.presidium.find(p => p.userId.toString() === userId.toString());
    if (existingUser) {
        throw new Error('User is already assigned to this committee presidium');
    }

    this.presidium.push({
        userId,
        role,
        appointedBy
    });

    return this.presidium[this.presidium.length - 1];
};

// Method to remove presidium member
committeeSchema.methods.removePresidiumMember = function (userId) {
    const memberIndex = this.presidium.findIndex(p => p.userId.toString() === userId.toString());
    if (memberIndex === -1) {
        throw new Error('Presidium member not found');
    }

    this.presidium.splice(memberIndex, 1);
    return true;
};

// Pre-save middleware to ensure data integrity
committeeSchema.pre('save', function (next) {
    // Ensure Security Council permanent members have veto rights
    if (this.type === 'SC') {
        this.countries.forEach(country => {
            if (country.isPermanentMember) {
                country.hasVetoRight = true;
            }
        });
    }

    next();
});

const Committee = mongoose.model('Committee', committeeSchema);

module.exports = { Committee };