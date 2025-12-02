const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ActiveSession } = require('./model');
const logger = require('../utils/logger');

// Helper function to generate JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Helper function to create active session
const createActiveSession = async (userId, sessionToken, req) => {
    // Deactivate other sessions for this user (single session per user)
    await ActiveSession.updateMany(
        { userId },
        { $set: { isActive: false } }
    );

    // Create new session
    const session = new ActiveSession({
        userId,
        sessionToken,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown'
    });

    await session.save();
    return session;
};

// Admin login (unchanged)
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Find admin user
        const user = await User.findOne({
            username: username.toLowerCase(),
            role: 'admin'
        });

        if (!user) {
            logger.warn(`Failed admin login attempt for username: ${username}`);
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger.warn(`Invalid password for admin: ${username}`);
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate session
        const sessionToken = user.generateSessionId();
        user.lastLogin = new Date();
        user.lastActivity = new Date();
        await user.save();

        // Create active session
        await createActiveSession(user._id, sessionToken, req);

        // Generate JWT
        const tokenPayload = {
            userId: user._id,
            role: user.role,
            username: user.username,
            sessionId: sessionToken
        };

        const token = generateToken(tokenPayload);

        logger.info(`Admin login successful: ${username}`);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// CHANGED: Link login (replaces qrLogin)
const linkLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'Login token is required'
            });
        }

        // Find user by login token (delegate OR presidium)
        const user = await User.findOne({
            loginToken: token,
            isLoginActive: true,
            role: { $in: ['delegate', 'presidium'] }
        }).populate('committeeId');

        if (!user) {
            return res.status(401).json({
                error: 'Invalid or expired login link'
            });
        }

        // Check if email is already bound (user has used this link before)
        if (user.email) {
            return res.status(200).json({
                success: true,
                requiresEmail: true,
                message: 'Please enter your registered email to continue',
                userType: user.role,
                ...(user.role === 'delegate' && { countryName: user.countryName }),
                ...(user.role === 'presidium' && { presidiumRole: user.presidiumRole }),
                committee: {
                    id: user.committeeId._id,
                    name: user.committeeId.name
                }
            });
        }

        // If no email bound yet, allow email binding
        return res.status(200).json({
            success: true,
            requiresEmail: true,
            firstTime: true,
            message: 'Welcome! Please enter your email address to complete registration',
            loginToken: token,
            userType: user.role,
            ...(user.role === 'delegate' && { countryName: user.countryName }),
            ...(user.role === 'presidium' && { presidiumRole: user.presidiumRole }),
            committee: {
                id: user.committeeId._id,
                name: user.committeeId.name
            }
        });

    } catch (error) {
        logger.error('Link login error:', error);
        res.status(500).json({ error: 'Link verification failed' });
    }
};

// CHANGED: Email binding after link verification (for both delegates AND presidium)
const bindEmail = async (req, res) => {
    try {
        const { token, email } = req.body;

        if (!token || !email) {
            return res.status(400).json({
                error: 'Login token and email are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Check if email is already used
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                error: 'Email address is already registered to another account'
            });
        }

        // Find user by login token (delegate OR presidium)
        const user = await User.findOne({
            loginToken: token,
            isLoginActive: true,
            role: { $in: ['delegate', 'presidium'] }
        }).populate('committeeId');

        if (!user) {
            return res.status(401).json({
                error: 'Invalid or expired login link'
            });
        }

        // Bind email and deactivate login link
        user.email = email.toLowerCase();
        user.isLoginActive = false; // Link can no longer be used for first-time registration
        user.lastLogin = new Date();
        user.lastActivity = new Date();

        // Generate session
        const sessionToken = user.generateSessionId();
        await user.save();

        // Create active session
        await createActiveSession(user._id, sessionToken, req);

        // Generate JWT with role-specific data
        const tokenData = {
            userId: user._id,
            role: user.role,
            email: user.email,
            committeeId: user.committeeId,
            sessionId: sessionToken
        };

        // Add role-specific data
        if (user.role === 'delegate') {
            tokenData.countryName = user.countryName;
            tokenData.specialRole = user.specialRole;
        } else if (user.role === 'presidium') {
            tokenData.presidiumRole = user.presidiumRole;
        }

        const token_jwt = generateToken(tokenData);

        const userType = user.role === 'delegate' ?
            user.countryName :
            `${user.presidiumRole} (Presidium)`;

        logger.info(`Email bound and login successful: ${userType} - ${email}`);

        res.json({
            success: true,
            token: token_jwt,
            user: {
                id: user._id,
                role: user.role,
                email: user.email,
                committeeId: user.committeeId,
                ...(user.role === 'delegate' && {
                    countryName: user.countryName,
                    specialRole: user.specialRole
                }),
                ...(user.role === 'presidium' && {
                    presidiumRole: user.presidiumRole
                })
            },
            message: `Welcome, ${userType}!`
        });

    } catch (error) {
        logger.error('Email binding error:', error);
        res.status(500).json({ error: 'Email binding failed' });
    }
};

// Email login for returning users (delegates AND presidium)
const emailLogin = async (req, res) => {
    try {
        const { email, loginToken } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email address is required'
            });
        }

        // Find user by email (delegate OR presidium)
        const user = await User.findOne({
            email: email.toLowerCase(),
            role: { $in: ['delegate', 'presidium'] }
        }).populate('committeeId');

        if (!user) {
            return res.status(401).json({
                error: 'No account found with this email address'
            });
        }

        // If loginToken provided, verify it matches this user
        if (loginToken && user.loginToken !== loginToken) {
            return res.status(401).json({
                error: 'This email is not associated with this login link'
            });
        }

        // Generate session
        const sessionToken = user.generateSessionId();
        user.lastLogin = new Date();
        user.lastActivity = new Date();
        await user.save();

        // Create active session
        await createActiveSession(user._id, sessionToken, req);

        // Generate JWT
        const tokenData = {
            userId: user._id,
            role: user.role,
            email: user.email,
            committeeId: user.committeeId,
            sessionId: sessionToken
        };

        // Add role-specific data
        if (user.role === 'delegate') {
            tokenData.countryName = user.countryName;
            tokenData.specialRole = user.specialRole;
        } else if (user.role === 'presidium') {
            tokenData.presidiumRole = user.presidiumRole;
        }

        const token = generateToken(tokenData);

        const userType = user.role === 'delegate' ?
            user.countryName :
            `${user.presidiumRole} (Presidium)`;

        logger.info(`Email login successful: ${userType} - ${email}`);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                role: user.role,
                email: user.email,
                committeeId: user.committeeId,
                ...(user.role === 'delegate' && {
                    countryName: user.countryName,
                    specialRole: user.specialRole
                }),
                ...(user.role === 'presidium' && {
                    presidiumRole: user.presidiumRole
                })
            }
        });

    } catch (error) {
        logger.error('Email login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Logout (unchanged)
const logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sessionId = req.user.sessionId;

        // Deactivate the current session
        await ActiveSession.updateOne(
            { userId, sessionToken: sessionId },
            { $set: { isActive: false } }
        );

        logger.info(`User logged out: ${userId}`);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

// Session validation (unchanged)
const validateSession = async (req, res) => {
    try {
        // User data is already attached by auth middleware
        const user = await User.findById(req.user.userId)
            .populate('committeeId')
            .select('-password -loginToken'); // CHANGED: was -qrToken

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'User account is inactive'
            });
        }

        // Check if session is still active
        const activeSession = await ActiveSession.findOne({
            userId: user._id,
            sessionToken: req.user.sessionId,
            isActive: true
        });

        if (!activeSession) {
            return res.status(401).json({
                error: 'Session has expired'
            });
        }

        // Update last activity
        user.lastActivity = new Date();
        activeSession.lastActivity = new Date();

        await Promise.all([user.save(), activeSession.save()]);

        res.json({
            success: true,
            user: {
                id: user._id,
                role: user.role,
                email: user.email,
                username: user.username,
                committeeId: user.committeeId,
                countryName: user.countryName,
                presidiumRole: user.presidiumRole,
                specialRole: user.specialRole,
                lastActivity: user.lastActivity
            }
        });

    } catch (error) {
        logger.error('Session validation error:', error);
        res.status(500).json({
            error: 'VALIDATION_ERROR'
        });
    }
};

// CHANGED: Check login link status (replaces checkQrStatus)
const checkLinkStatus = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            loginToken: token,
            role: { $in: ['delegate', 'presidium'] }
        }).populate('committeeId');

        if (!user) {
            return res.status(404).json({
                error: 'Login link not found'
            });
        }

        res.json({
            success: true,
            isActive: user.isLoginActive,
            isUsed: !user.isLoginActive,
            userType: user.role,
            committeeId: user.committeeId._id,
            committeeName: user.committeeId.name,
            ...(user.role === 'delegate' && { countryName: user.countryName }),
            ...(user.role === 'presidium' && { presidiumRole: user.presidiumRole })
        });

    } catch (error) {
        logger.error('Link status check error:', error);
        res.status(500).json({ error: 'Failed to check link status' });
    }
};

// CHANGED: Login link reactivation (replaces reactivateQr) - admin only
const reactivateLink = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Only allow reactivation for delegate and presidium users
        if (!['delegate', 'presidium'].includes(user.role)) {
            return res.status(400).json({
                error: 'Link reactivation only available for delegates and presidium members'
            });
        }

        // Reactivate login link and clear email
        user.isLoginActive = true;
        user.email = null;
        user.sessionId = null;

        // Deactivate all sessions
        await ActiveSession.updateMany(
            { userId: user._id },
            { $set: { isActive: false } }
        );

        await user.save();

        const userType = user.role === 'delegate' ? user.countryName : user.presidiumRole;
        logger.info(`Login link reactivated for: ${userType} by admin ${req.user.userId}`);

        res.json({
            success: true,
            message: `Login link reactivated for ${userType}`,
            loginToken: user.loginToken
        });

    } catch (error) {
        logger.error('Link reactivation error:', error);
        res.status(500).json({ error: 'Link reactivation failed' });
    }
};

module.exports = {
    adminLogin,
    linkLogin, // CHANGED: was qrLogin
    bindEmail,
    emailLogin,
    logout,
    validateSession,
    checkLinkStatus, // CHANGED: was checkQrStatus
    reactivateLink // CHANGED: was reactivateQr
};