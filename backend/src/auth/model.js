const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema — platform-level account
// Roles are NOT stored here. They are contextual:
//   - Org-level: defined in OrgMembership
//   - Event-level: defined in EventParticipant
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    dateOfBirth: {
        type: Date,
        default: null
    },

    phone: {
        type: String,
        default: null,
        trim: true
    },

    institution: {
        type: String,
        default: null,
        trim: true,
        maxlength: 200
    },

    languageProficiency: {
        type: [String],
        default: []  // e.g. ['en', 'ru', 'uz']
    },

    avatar: {
        type: String,
        default: null
    },

    // Platform-level superadmin flag (single god account)
    isSuperAdmin: {
        type: Boolean,
        default: false
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    // For email verification / password reset
    verificationToken: {
        type: String,
        default: null
    },

    verificationTokenExpires: {
        type: Date,
        default: null
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordTokenExpires: {
        type: Date,
        default: null
    },

    lastLogin: {
        type: Date,
        default: null
    },

    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isSuperAdmin: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
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

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Transform output to hide sensitive data
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.verificationToken;
    delete user.verificationTokenExpires;
    delete user.resetPasswordToken;
    delete user.resetPasswordTokenExpires;
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

// TTL index to auto-delete inactive sessions after 24 hours
activeSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });
activeSessionSchema.index({ userId: 1 });
activeSessionSchema.index({ sessionToken: 1 });

const User = mongoose.model('User', userSchema);
const ActiveSession = mongoose.model('ActiveSession', activeSessionSchema);

module.exports = { User, ActiveSession };