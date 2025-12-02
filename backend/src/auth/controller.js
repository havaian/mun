const jwt = require('jsonwebtoken');
const { User, ActiveSession } = require('./model');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Helper function to generate JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to create active session
const createActiveSession = async (userId, sessionToken, req) => {
    const session = new ActiveSession({
        userId,
        sessionToken,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
    });
    
    await session.save();
    return session;
};

// Helper function to terminate existing sessions
const terminateExistingSessions = async (userId, currentSessionToken) => {
    await ActiveSession.updateMany(
        { userId, sessionToken: { $ne: currentSessionToken } },
        { $set: { isActive: false } }
    );
};

// Admin login (unchanged - still uses username/password)
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

        // Terminate existing sessions
        const sessionToken = admin.generateSessionId();
        await terminateExistingSessions(admin._id, sessionToken);
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

// QR code login (for both delegates AND presidium)
const qrLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'QR token is required'
            });
        }

        // 1. Find user and populate Event's absolute QR Expiration Date
        const user = await User.findOne({
            qrToken: token,
            isQrActive: true,
            role: { $in: ['delegate', 'presidium'] }
        })
        .populate('committeeId')
        .populate({
            // NEW: We now rely directly on the Event's defined settings.qrExpirationPeriod (which is a Date)
            path: 'eventId',
            select: 'settings.qrExpirationPeriod' 
        });


        if (!user) {
            logger.warn(`Invalid or expired QR token attempt: ${token.substring(0, 10)}...`);
            return res.status(401).json({
                error: 'Invalid or expired QR code'
            });
        }

        // --- 🔒 FIXED QR Token Expiration Check Logic ---
        const eventQrExpirationDate = user.eventId?.settings?.qrExpirationPeriod;
        const now = new Date();

        // Check 1: Event-level QR Expiration (Date)
        if (eventQrExpirationDate && now > eventQrExpirationDate) {
             // Optionally, deactivate the QR code upon expiration check failure
            user.isQrActive = false;
            await user.save();
            
            logger.warn(`Expired QR token attempt for user: ${user._id}. Event Expiration: ${eventQrExpirationDate.toISOString()}`);
            return res.status(401).json({
                error: 'QR code has expired due to event deadline'
            });
        }
        
        // Note: The logic for checking `user.qrGenerationTime` (token age) is removed 
        // because your Event model is now defining a hard end date for all QR usage.
        // If you need *both* (Event deadline AND max 7 days token validity), we'd need to re-add it.
        // For now, we align with the Event model's absolute date.
        // --- 🔓 END FIXED QR Token Expiration Check Logic ---


        // Different response based on role
        if (user.role === 'delegate') {
            logger.info(`QR login initiated for delegate: ${user.countryName}`);
            res.json({
                success: true,
                userType: 'delegate',
                country: user.countryName,
                committee: user.committeeId.name,
                qrToken: token,
                message: 'QR code verified. Please provide your email address to complete registration.'
            });
        } else if (user.role === 'presidium') {
            logger.info(`QR login initiated for presidium: ${user.presidiumRole}`);
            res.json({
                success: true,
                userType: 'presidium',
                presidiumRole: user.presidiumRole,
                committee: user.committeeId.name,
                qrToken: token,
                message: 'QR code verified. Please provide your email address to complete registration.'
            });
        }

    } catch (error) {
        logger.error('QR login error:', error);
        res.status(500).json({ error: 'QR verification failed' });
    }
};

// Email binding after QR verification (for both delegates AND presidium)
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

        // Find user by QR token (delegate OR presidium)
        const user = await User.findOne({
            qrToken: token,
            isQrActive: true,
            role: { $in: ['delegate', 'presidium'] } // CHANGED: Now includes presidium
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

        const userType = user.role === 'delegate' ? user.countryName : user.presidiumRole;
        logger.info(`Email binding successful: ${userType} -> ${email}`);

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

// Email login for delegates AND presidium (after email binding)
const emailLogin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email address is required'
            });
        }

        // Find user by email (delegate OR presidium)
        const user = await User.findOne({
            email: email.toLowerCase(),
            role: { $in: ['delegate', 'presidium'] }, // CHANGED: Now includes presidium
            isActive: true
        }).populate('committeeId');

        if (!user) {
            logger.warn(`Failed email login attempt for: ${email}`);
            return res.status(401).json({
                error: 'No account found with this email address'
            });
        }

        // Check if QR is still active (shouldn't be after binding)
        if (user.isQrActive) {
            return res.status(400).json({
                error: 'Account setup not completed. Please scan QR code and bind email first.'
            });
        }

        // Terminate existing sessions
        const sessionToken = user.generateSessionId();
        await terminateExistingSessions(user._id, sessionToken);
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

        const token = generateToken(tokenData);

        // Update last login
        user.lastLogin = new Date();
        user.lastActivity = new Date();
        await user.save();

        const userType = user.role === 'delegate' ? user.countryName : user.presidiumRole;
        logger.info(`Email login successful: ${userType} (${email})`);

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

// Logout (requires authentication)
const logout = async (req, res) => {
    try {
        if (req.user && req.user.sessionId) {
            // Deactivate current session
            await ActiveSession.updateOne(
                { sessionToken: req.user.sessionId },
                { $set: { isActive: false } }
            );

            // Clear session ID from user
            await User.updateOne(
                { _id: req.user.userId },
                { $unset: { sessionId: 1 } }
            );
        }

        logger.info(`User logged out: ${req.user?.email || req.user?.userId}`);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

// Session validation
const validateSession = async (req, res) => {
    try {
        logger.debug(`Session validation for user: ${req.user?.userId || 'unknown'}`);

        // User is already validated by authenticateToken middleware
        if (!req.user || !req.user.userId) {
            logger.warn('No user found in request during session validation');
            return res.status(401).json({
                error: 'Session invalid - no user data',
                code: 'NO_USER_DATA'
            });
        }

        // Get fresh user data with populated relationships
        const user = await User.findById(req.user.userId)
            .populate('committeeId', 'name type status')
            .select('-password');

        if (!user) {
            logger.warn(`User not found in database: ${req.user.userId}`);
            return res.status(401).json({
                error: 'Session invalid - user not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            logger.warn(`User account is inactive: ${req.user.userId}`);
            return res.status(401).json({
                error: 'Session invalid - account inactive',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        logger.info(`Session validation successful for: ${user.email || user.username || user.countryName || user.presidiumRole} (${user.role})`);

        res.json({
            success: true,
            user: user.toJSON(),
            valid: true,
            sessionInfo: {
                userId: req.user.userId,
                role: req.user.role,
                authenticatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Session validation error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId
        });
        
        res.status(500).json({ 
            error: 'Session validation failed',
            code: 'VALIDATION_ERROR'
        });
    }
};

// Check QR token status
const checkQrStatus = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            qrToken: token,
            role: { $in: ['delegate', 'presidium'] } // CHANGED: Now includes presidium
        }).populate('committeeId');

        if (!user) {
            return res.status(404).json({
                error: 'QR token not found'
            });
        }

        res.json({
            success: true,
            isActive: user.isQrActive,
            isUsed: !user.isQrActive,
            userType: user.role,
            committeeId: user.committeeId._id,
            committeeName: user.committeeId.name,
            ...(user.role === 'delegate' && { countryName: user.countryName }),
            ...(user.role === 'presidium' && { presidiumRole: user.presidiumRole })
        });

    } catch (error) {
        logger.error('QR status check error:', error);
        res.status(500).json({ error: 'Failed to check QR status' });
    }
};

// QR token reactivation (admin only)
const reactivateQr = async (req, res) => {
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
                error: 'QR reactivation only available for delegates and presidium members'
            });
        }

        // Reactivate QR and clear email
        user.isQrActive = true;
        user.email = null;
        user.sessionId = null;

        // Deactivate all sessions
        await ActiveSession.updateMany(
            { userId: user._id },
            { $set: { isActive: false } }
        );

        await user.save();

        const userType = user.role === 'delegate' ? user.countryName : user.presidiumRole;
        logger.info(`QR reactivated for: ${userType} by admin ${req.user.userId}`);

        res.json({
            success: true,
            message: `QR code reactivated for ${userType}`,
            qrToken: user.qrToken
        });

    } catch (error) {
        logger.error('QR reactivation error:', error);
        res.status(500).json({ error: 'QR reactivation failed' });
    }
};

module.exports = {
    adminLogin,
    // presidiumLogin removed - now uses QR flow
    qrLogin,
    bindEmail,
    emailLogin,
    logout,
    validateSession,
    checkQrStatus,
    reactivateQr
};