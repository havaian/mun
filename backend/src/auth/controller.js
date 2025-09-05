const jwt = require('jsonwebtoken');
const { User, ActiveSession } = require('./model');
const logger = require('../utils/logger');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Terminate existing sessions for user (except admin)
const terminateExistingSessions = async (userId, currentSessionToken = null) => {
    try {
        const user = await User.findById(userId);

        // Admins can have multiple sessions, others cannot
        if (user && user.role !== 'admin') {
            await ActiveSession.updateMany(
                {
                    userId,
                    sessionToken: { $ne: currentSessionToken },
                    isActive: true
                },
                { isActive: false }
            );

            // Clear sessionId from user document
            await User.findByIdAndUpdate(userId, { sessionId: null });
        }
    } catch (error) {
        logger.error('Error terminating existing sessions:', error);
    }
};

// Create active session record
const createActiveSession = async (userId, sessionToken, req) => {
    try {
        const session = new ActiveSession({
            userId,
            sessionToken,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            lastActivity: new Date()
        });

        await session.save();
        return session;
    } catch (error) {
        logger.error('Error creating active session:', error);
        throw error;
    }
};

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Find admin user
        const admin = await User.findOne({
            username: username.toLowerCase().trim(),
            role: 'admin'
        });

        if (!admin || !await admin.comparePassword(password)) {
            logger.warn(`Failed admin login attempt for username: ${username}`);
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Generate session
        const sessionToken = admin.generateSessionId();
        await admin.save();

        // Create active session
        await createActiveSession(admin._id, sessionToken, req);

        // Generate JWT
        const token = generateToken({
            userId: admin._id,
            role: admin.role,
            sessionId: sessionToken
        });

        // Update last login
        admin.lastLogin = new Date();
        admin.lastActivity = new Date();
        await admin.save();

        logger.info(`Admin login successful: ${username}`);

        res.json({
            success: true,
            token,
            user: admin.toJSON(),
            expiresIn: JWT_EXPIRES_IN
        });

    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Presidium login
const presidiumLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Find presidium member
        const presidium = await User.findOne({
            username: username.toLowerCase().trim(),
            role: 'presidium'
        }).populate('committeeId');

        if (!presidium || !await presidium.comparePassword(password)) {
            logger.warn(`Failed presidium login attempt for username: ${username}`);
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Terminate existing sessions
        const sessionToken = presidium.generateSessionId();
        await terminateExistingSessions(presidium._id, sessionToken);
        await presidium.save();

        // Create active session
        await createActiveSession(presidium._id, sessionToken, req);

        // Generate JWT
        const token = generateToken({
            userId: presidium._id,
            role: presidium.role,
            committeeId: presidium.committeeId,
            presidiumRole: presidium.presidiumRole,
            sessionId: sessionToken
        });

        // Update last login
        presidium.lastLogin = new Date();
        presidium.lastActivity = new Date();
        await presidium.save();

        logger.info(`Presidium login successful: ${username} (${presidium.presidiumRole})`);

        res.json({
            success: true,
            token,
            user: presidium.toJSON(),
            expiresIn: JWT_EXPIRES_IN
        });

    } catch (error) {
        logger.error('Presidium login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// QR code login (initial access for delegates)
const qrLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'QR token is required'
            });
        }

        // Find user by QR token
        const user = await User.findOne({
            qrToken: token,
            isQrActive: true,
            role: 'delegate'
        }).populate('committeeId');

        if (!user) {
            logger.warn(`Invalid or expired QR token attempt: ${token.substring(0, 10)}...`);
            return res.status(401).json({
                error: 'Invalid or expired QR code'
            });
        }

        logger.info(`QR login initiated for country: ${user.countryName}`);

        res.json({
            success: true,
            country: user.countryName,
            committee: user.committeeId.name,
            qrToken: token,
            message: 'QR code verified. Please provide your email address to complete registration.'
        });

    } catch (error) {
        logger.error('QR login error:', error);
        res.status(500).json({ error: 'QR verification failed' });
    }
};

// Email binding after QR verification
const bindEmail = async (req, res) => {
    try {
        const { token, email } = req.body;

        if (!token || !email) {
            return res.status(400).json({
                error: 'QR token and email are required'
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

        // Find user by QR token
        const user = await User.findOne({
            qrToken: token,
            isQrActive: true,
            role: 'delegate'
        }).populate('committeeId');

        if (!user) {
            return res.status(401).json({
                error: 'Invalid or expired QR code'
            });
        }

        // Bind email and deactivate QR
        user.email = email.toLowerCase();
        user.isQrActive = false; // QR can no longer be used
        user.lastLogin = new Date();
        user.lastActivity = new Date();

        // Generate session
        const sessionToken = user.generateSessionId();
        await user.save();

        // Create active session
        await createActiveSession(user._id, sessionToken, req);

        // Generate JWT
        const token_jwt = generateToken({
            userId: user._id,
            role: user.role,
            email: user.email,
            countryName: user.countryName,
            committeeId: user.committeeId,
            specialRole: user.specialRole,
            sessionId: sessionToken
        });

        logger.info(`Email binding successful: ${user.countryName} -> ${email}`);

        res.json({
            success: true,
            token: token_jwt,
            user: user.toJSON(),
            expiresIn: JWT_EXPIRES_IN,
            message: 'Registration completed successfully'
        });

    } catch (error) {
        logger.error('Email binding error:', error);
        res.status(500).json({ error: 'Email binding failed' });
    }
};

// Email login for delegates (after email binding)
const emailLogin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        // Find delegate by email
        const user = await User.findOne({
            email: email.toLowerCase(),
            role: 'delegate'
        }).populate('committeeId');

        if (!user) {
            logger.warn(`Failed delegate login attempt for email: ${email}`);
            return res.status(401).json({
                error: 'Email not found or not registered'
            });
        }

        // Terminate existing sessions
        const sessionToken = user.generateSessionId();
        await terminateExistingSessions(user._id, sessionToken);

        // Update activity
        user.lastLogin = new Date();
        user.lastActivity = new Date();
        await user.save();

        // Create active session
        await createActiveSession(user._id, sessionToken, req);

        // Generate JWT
        const token = generateToken({
            userId: user._id,
            role: user.role,
            email: user.email,
            countryName: user.countryName,
            committeeId: user.committeeId,
            specialRole: user.specialRole,
            sessionId: sessionToken
        });

        logger.info(`Delegate login successful: ${user.countryName} (${email})`);

        res.json({
            success: true,
            token,
            user: user.toJSON(),
            expiresIn: JWT_EXPIRES_IN
        });

    } catch (error) {
        logger.error('Email login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { sessionId } = req.user;

        // Deactivate the session
        await ActiveSession.findOneAndUpdate(
            { sessionToken: sessionId, isActive: true },
            { isActive: false }
        );

        // Clear sessionId from user
        await User.findByIdAndUpdate(req.user.userId, { sessionId: null });

        logger.info(`User logged out: ${req.user.userId}`);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

// Validate session
const validateSession = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate('committeeId')
            .select('-password -qrToken');

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Update last activity
        user.lastActivity = new Date();
        await user.save();

        // Update session activity
        await ActiveSession.findOneAndUpdate(
            { sessionToken: req.user.sessionId, isActive: true },
            { lastActivity: new Date() }
        );

        res.json({
            success: true,
            user: user.toJSON(),
            sessionValid: true
        });

    } catch (error) {
        logger.error('Session validation error:', error);
        res.status(500).json({ error: 'Session validation failed' });
    }
};

// Check QR token status
const checkQrStatus = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            qrToken: token,
            role: 'delegate'
        }).populate('committeeId');

        if (!user) {
            return res.status(404).json({
                error: 'QR token not found'
            });
        }

        res.json({
            success: true,
            isActive: user.isQrActive,
            country: user.countryName,
            committee: user.committeeId.name,
            emailBound: !!user.email
        });

    } catch (error) {
        logger.error('QR status check error:', error);
        res.status(500).json({ error: 'Status check failed' });
    }
};

module.exports = {
    adminLogin,
    presidiumLogin,
    qrLogin,
    bindEmail,
    emailLogin,
    logout,
    validateSession,
    checkQrStatus
};