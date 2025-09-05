const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema for all types of users
const userSchema = new mongoose.Schema({
    // Role-based authentication
    role: {
        type: String,
        enum: ['admin', 'presidium', 'delegate'],
        required: true
    },

    // For admin and presidium - traditional login
    username: {
        type: String,
        sparse: true, // Allows multiple null values
        unique: true,
        required: function () { return this.role === 'admin' || this.role === 'presidium'; }
    },

    password: {
        type: String,
        required: function () { return this.role === 'admin' || this.role === 'presidium'; }
    },

    // For delegates - email binding after QR scan
    email: {
        type: String,
        sparse: true, // Allows multiple null values but ensures uniqueness when set
        unique: true,
        lowercase: true,
        trim: true
    },

    // QR token for initial access (delegates only)
    qrToken: {
        type: String,
        sparse: true,
        unique: true
    },

    isQrActive: {
        type: Boolean,
        default: true
    },

    // Committee association
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: function () { return this.role !== 'admin'; }
    },

    // Country information for delegates
    countryName: {
        type: String,
        required: function () { return this.role === 'delegate'; }
    },

    // Special roles for observers/special participants
    specialRole: {
        type: String,
        enum: ['observer', 'special'],
        required: function () { return this.role === 'delegate'; }
    },

    // Presidium role specification
    presidiumRole: {
        type: String,
        enum: ['chairman', 'co-chairman', 'expert', 'secretary'],
        required: function () { return this.role === 'presidium'; }
    },

    // Session management
    sessionId: {
        type: String,
        default: null
    },

    lastLogin: {
        type: Date,
        default: Date.now
    },

    // Activity tracking
    isActive: {
        type: Boolean,
        default: true
    },

    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes for performance
userSchema.index({ role: 1, committeeId: 1 });
userSchema.index({ qrToken: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ sessionId: 1 }, { sparse: true });

// Hash password before saving (for admin/presidium)
userSchema.pre('save', async function (next) {
    // Only hash password if it's being modified and exists
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate session ID
userSchema.methods.generateSessionId = function () {
    this.sessionId = require('crypto').randomBytes(32).toString('hex');
    return this.sessionId;
};

// Method to check if user can vote
userSchema.methods.canVote = function () {
    return this.role === 'delegate' && this.specialRole !== 'observer' && this.specialRole !== 'special';
};

// Virtual for full name (country + role)
userSchema.virtual('displayName').get(function () {
    if (this.role === 'delegate') {
        return this.countryName;
    } else if (this.role === 'presidium') {
        return `${this.presidiumRole} (Presidium)`;
    } else {
        return this.username;
    }
});

// Transform output to hide sensitive data
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.qrToken;
    delete user.__v;
    return user;
};

// Active sessions collection for session management
const activeSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    sessionToken: {
        type: String,
        required: true,
        unique: true
    },

    ipAddress: {
        type: String,
        required: true
    },

    userAgent: {
        type: String,
        required: true
    },

    lastActivity: {
        type: Date,
        default: Date.now
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'activeSessions'
});

// TTL index to automatically delete inactive sessions after 24 hours
activeSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });
activeSessionSchema.index({ userId: 1 });
activeSessionSchema.index({ sessionToken: 1 });

const User = mongoose.model('User', userSchema);
const ActiveSession = mongoose.model('ActiveSession', activeSessionSchema);

module.exports = { User, ActiveSession };