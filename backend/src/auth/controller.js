const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('./model');
const { Organization } = require('../organization/model');
const { sendEmail } = require('../email/service');
const templates = require('../email/templates');
const authEmails = require('../email/authEmails');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            isSuperAdmin: user.isSuperAdmin || false
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
};

// Register new user — UPDATED: sends verification email
const register = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            phone,
            institution,
            languageProficiency
        } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Email, password, first name, and last name are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: dateOfBirth || null,
            phone: phone || null,
            institution: institution?.trim() || null,
            languageProficiency: languageProficiency || [],
            emailVerified: false,
            verificationToken,
            verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await user.save();

        // Check if this user has any pending org admin invitations
        await claimPendingInvitations(user);

        // Check if this user has any pending org member invitations
        try {
            const { claimPendingMemberInvitations } = require('../invitation/controller');
            await claimPendingMemberInvitations(user);
        } catch (e) {
            // Invitation module may not be loaded yet — non-fatal
            global.logger.debug('Member invitation claim skipped:', e.message);
        }

        // Send verification email
        try {
            const { subject, html } = templates.emailVerification({
                firstName: user.firstName,
                token: verificationToken
            });
            await sendEmail({ to: user.email, subject, html });
        } catch (e) {
            global.logger.error('Failed to send verification email:', e.message);
            // Non-fatal — user can request resend
        }

        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        await user.save();
        authEmails.sendVerificationEmail(user);

        // Generate token
        const token = generateToken(user);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        global.logger.info(`New user registered: ${email} (verification pending)`);

        res.status(201).json({
            success: true,
            token,
            user: user.toJSON(),
            emailVerified: false,
            message: 'Registration successful. Please check your email to verify your account.'
        });
    } catch (error) {
        global.logger.error('Registration error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.message
            });
        }

        res.status(500).json({ error: 'Registration failed' });
    }
};

// Verify email address
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        user.emailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();

        global.logger.info(`Email verified: ${user.email}`);

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        global.logger.error('Verify email error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
};

// Resend verification email
const resendVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.emailVerified) {
            return res.json({ success: true, message: 'Email is already verified' });
        }

        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        authEmails.sendVerificationEmail(user);

        res.json({ success: true, message: 'Verification email sent' });
    } catch (error) {
        global.logger.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
};

// Login with email + password
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email (include password for comparison)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ error: 'Account is suspended' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        global.logger.info(`User logged in: ${email}`);

        res.json({
            success: true,
            token,
            user: user.toJSON()
        });
    } catch (error) {
        global.logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get current user profile
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive fields
        delete user.password;
        delete user.verificationToken;
        delete user.verificationTokenExpires;
        delete user.resetPasswordToken;
        delete user.resetPasswordTokenExpires;
        delete user.__v;

        // Fetch organizations where user is admin
        const adminOrgs = await Organization.find({ admin: user._id })
            .select('name slug logo status')
            .lean();

        // Fetch org memberships
        let memberOrgs = [];
        try {
            const { OrgMembership } = require('../org-membership/model');
            const memberships = await OrgMembership.find({ user: user._id, status: 'active' })
                .populate('organization', 'name slug logo status')
                .lean();
            memberOrgs = memberships.map(m => ({
                ...m.organization,
                permissions: m.permissions,
                membershipId: m._id
            }));
        } catch (e) {
            // OrgMembership module may not exist yet
        }

        // Fetch pending invitations
        let pendingInvitations = [];
        try {
            const { OrgInvitation } = require('../invitation/model');
            pendingInvitations = await OrgInvitation.find({
                email: user.email,
                status: 'pending',
                expiresAt: { $gt: new Date() }
            })
                .populate('organization', 'name slug logo')
                .lean();
        } catch (e) {
            // Invitation module may not exist yet
        }

        res.json({
            success: true,
            user,
            organizations: {
                admin: adminOrgs,
                member: memberOrgs
            },
            pendingInvitations
        });
    } catch (error) {
        global.logger.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update current user profile
const updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fields that can be updated by the user themselves
        const allowedFields = [
            'firstName', 'lastName', 'dateOfBirth', 'phone',
            'institution', 'languageProficiency', 'avatar'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                user[field] = updates[field];
            }
        });

        await user.save();

        global.logger.info(`Profile updated: ${user.email}`);

        res.json({
            success: true,
            user: user.toJSON()
        });
    } catch (error) {
        global.logger.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters long'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        global.logger.info(`Password changed: ${user.email}`);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        global.logger.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account with that email exists, a reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Send password reset email
        try {
            authEmails.sendPasswordResetEmail(user);
        } catch (e) {
            global.logger.error('Failed to send password reset email:', e.message);
        }

        global.logger.info(`Password reset requested for ${email}`);

        res.json({
            success: true,
            message: 'If an account with that email exists, a reset link has been sent'
        });
    } catch (error) {
        global.logger.error('Request password reset error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters long'
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordTokenExpires = null;
        await user.save();

        global.logger.info(`Password reset completed for ${user.email}`);

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        global.logger.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

// Helper: Check and claim pending org admin invitations for a newly registered user
const claimPendingInvitations = async (user) => {
    try {
        const pendingOrgs = await Organization.find({
            'adminInvitation.email': user.email,
            'adminInvitation.expiresAt': { $gt: new Date() }
        });

        for (const org of pendingOrgs) {
            org.claimAdmin(user._id);
            await org.save();
            global.logger.info(`Pending org admin invitation claimed: ${user.email} → ${org.name}`);
        }

        if (pendingOrgs.length > 0) {
            global.logger.info(`${pendingOrgs.length} pending invitation(s) claimed for ${user.email}`);
        }
    } catch (error) {
        global.logger.error(`Failed to claim pending invitations for ${user.email}:`, error);
        // Don't throw — registration should still succeed
    }
};

module.exports = {
    register,
    verifyEmail,
    resendVerification,
    login,
    getMe,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    claimPendingInvitations
};