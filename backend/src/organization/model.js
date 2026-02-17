const mongoose = require('mongoose');
const crypto = require('crypto');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000
    },

    logo: {
        type: String,
        default: null  // file path or URL
    },

    foundingDate: {
        type: Date,
        default: null
    },

    email: {
        type: String,
        default: null,
        lowercase: true,
        trim: true
    },

    website: {
        type: String,
        default: null,
        trim: true
    },

    location: {
        city: {
            type: String,
            default: null,
            trim: true
        },
        country: {
            type: String,
            default: null,
            trim: true
        }
    },

    socialLinks: {
        telegram: { type: String, default: null },
        instagram: { type: String, default: null },
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null }
    },

    // Admin assignment — exactly 1 admin per org
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Pending admin invitation (for users who haven't registered yet)
    adminInvitation: {
        email: {
            type: String,
            default: null,
            lowercase: true,
            trim: true
        },
        token: {
            type: String,
            default: null
        },
        expiresAt: {
            type: Date,
            default: null
        },
        invitedAt: {
            type: Date,
            default: null
        }
    },

    // SuperAdmin who created this org
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true,
    collection: 'organizations'
});

// Indexes
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ admin: 1 });
organizationSchema.index({ 'adminInvitation.email': 1 }, { sparse: true });
organizationSchema.index({ status: 1 });
organizationSchema.index({ createdBy: 1 });

// Generate slug from name
organizationSchema.statics.generateSlug = async function (name) {
    let slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // remove non-word chars
        .replace(/\s+/g, '-')      // spaces to hyphens
        .replace(/-+/g, '-')       // collapse multiple hyphens
        .trim();

    // Check uniqueness, append number if needed
    let finalSlug = slug;
    let counter = 1;
    while (await this.findOne({ slug: finalSlug })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
    }

    return finalSlug;
};

// Generate invitation token
organizationSchema.methods.generateAdminInvitation = function (email) {
    const token = crypto.randomBytes(32).toString('hex');
    this.adminInvitation = {
        email: email.toLowerCase(),
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        invitedAt: new Date()
    };
    return token;
};

// Clear invitation after it's been claimed
organizationSchema.methods.claimAdmin = function (userId) {
    this.admin = userId;
    this.adminInvitation = {
        email: null,
        token: null,
        expiresAt: null,
        invitedAt: null
    };
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = { Organization };