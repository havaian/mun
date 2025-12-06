// backend/src/auth/middleware.js
const jwt = require('jsonwebtoken');
const { User } = require('./model');

// Existing authenticateToken middleware - FIXED VERSION
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            global.logger.warn('No token provided in Authorization header');
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // Debug log for JWT verification
        global.logger.debug(`Attempting JWT verification with token: ${token.substring(0, 20)}...`);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Debug log for successful JWT decode
        global.logger.debug(`JWT decoded successfully. User ID: ${decoded.userId}, Role: ${decoded.role}`);

        // Get fresh user data to ensure current permissions
        const user = await User.findById(decoded.userId)
            .select('-password')
            .lean();

        if (!user) {
            global.logger.warn(`User not found for ID: ${decoded.userId}`);
            return res.status(401).json({
                error: 'Access denied. User not found.'
            });
        }

        if (!user.isActive) {
            global.logger.warn(`User is inactive: ${decoded.userId}`);
            return res.status(401).json({
                error: 'Access denied. User account is inactive.'
            });
        }

        // Set req.user with both decoded token data AND fresh user data
        req.user = {
            userId: decoded.userId || user._id,
            role: decoded.role || user.role,
            email: decoded.email || user.email,
            committeeId: decoded.committeeId || user.committeeId,
            sessionId: decoded.sessionId || user.sessionId,
            // Add fields that might be in token but not in user
            countryName: decoded.countryName || user.countryName,
            presidiumRole: decoded.presidiumRole || user.presidiumRole,
            specialRole: decoded.specialRole || user.specialRole,
            // Include fresh user data
            ...user
        };

        global.logger.debug(`Authentication successful for user: ${req.user.email || req.user.userId}`);
        next();

    } catch (error) {
        global.logger.error('Token authentication error:', {
            error: error.message,
            name: error.name,
            stack: error.stack
        });

        if (error.name === 'TokenExpiredError') {
            global.logger.warn('Token expired');
            return res.status(401).json({
                error: 'Access denied. Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.name === 'JsonWebTokenError') {
            global.logger.warn('Invalid JWT token');
            return res.status(401).json({
                error: 'Access denied. Invalid token.',
                code: 'INVALID_TOKEN'
            });
        } else if (error.name === 'NotBeforeError') {
            global.logger.warn('Token not active yet');
            return res.status(401).json({
                error: 'Access denied. Token not active.',
                code: 'TOKEN_NOT_ACTIVE'
            });
        }

        return res.status(401).json({
            error: 'Access denied. Token verification failed.',
            code: 'VERIFICATION_FAILED'
        });
    }
};

//  Flexible role-based authorization middleware
const requireRoles = (...allowedRoles) => {
    // Flatten the roles array in case arrays are passed
    const roles = allowedRoles.flat();

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required. User not found in request.'
            });
        }

        // Check if user has any of the required roles
        const userRole = req.user.role;
        const hasRequiredRole = roles.includes(userRole);

        if (!hasRequiredRole) {
            global.logger.warn(`Access denied for user ${req.user.email || req.user._id}. Required roles: [${roles.join(', ')}], User role: ${userRole}`);

            return res.status(403).json({
                error: `Access denied. Required role(s): ${roles.join(' or ')}.`,
                requiredRoles: roles,
                userRole: userRole
            });
        }

        // Log successful role authorization for audit
        global.logger.info(`Role authorization successful: ${userRole} (${req.user.email || req.user._id}) accessing ${req.method} ${req.path}`);

        next();
    };
};

// Convenience middlewares for common role combinations
const requireAdmin = requireRoles('admin');
const requirePresidium = requireRoles('presidium');
const requireAdminOrPresidium = requireRoles('admin', 'presidium');
const requireDelegate = requireRoles('delegate');
const requireAdminOrDelegate = requireRoles('admin', 'delegate');
const requireAnyRole = requireRoles('admin', 'presidium', 'delegate');

// Special middleware for committee-specific authorization
const requireSameCommittee = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required.'
        });
    }

    // Admin can access any committee
    if (req.user.role === 'admin') {
        return next();
    }

    // For presidium and delegates, check if they belong to the same committee
    const requestedCommitteeId = req.params.committeeId || req.params.id;
    const userCommitteeId = req.user.committeeId?.toString();

    if (!userCommitteeId) {
        return res.status(403).json({
            error: 'Access denied. User not assigned to any committee.'
        });
    }

    if (requestedCommitteeId !== userCommitteeId) {
        global.logger.warn(`Committee access denied for user ${req.user.email || req.user._id}. Requested: ${requestedCommitteeId}, Assigned: ${userCommitteeId}`);

        return res.status(403).json({
            error: 'Access denied. You can only access your assigned committee.',
            assignedCommittee: userCommitteeId
        });
    }

    next();
};

// Check if user can vote (excludes observers and special roles)
const requireVotingRights = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin and presidium always have access for testing/management
    if (req.user.role === 'admin' || req.user.role === 'presidium') {
        return next();
    }

    // Delegates must be regular countries (not observers or special roles)
    if (req.user.role === 'delegate' &&
        req.user.specialRole !== 'observer' &&
        req.user.specialRole !== 'special') {
        return next();
    }

    global.logger.warn(`Voting access denied for user: ${req.user.countryName || req.user.userId} (${req.user.role}/${req.user.specialRole})`);
    return res.status(403).json({
        error: 'No voting rights',
        reason: 'Only regular country delegates can vote'
    });
};

// Optional authentication (allows both authenticated and non-authenticated access)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        // Token provided, try to authenticate
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
            req.user = {
                userId: decoded.userId,
                role: decoded.role,
                email: decoded.email,
                countryName: decoded.countryName,
                committeeId: decoded.committeeId,
                presidiumRole: decoded.presidiumRole,
                specialRole: decoded.specialRole,
                sessionId: decoded.sessionId
            };
        }

        next();

    } catch (error) {
        // Token invalid or expired, continue without authentication
        req.user = null;
        next();
    }
};

// Rate limiting middleware for auth endpoints
const authRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Only count failed requests
    skipSuccessfulRequests: true
});

module.exports = {
    // Core middleware
    authenticateToken,
    requireRoles,
    requireSameCommittee,

    // Convenience middlewares
    requireAdmin,
    requirePresidium,
    requireAdminOrPresidium,
    requireDelegate,
    requireAdminOrDelegate,
    requireAnyRole,

    // Rate limit
    authRateLimit,

    // Require voting rights
    requireVotingRights,

    // Optional auth
    optionalAuth
};