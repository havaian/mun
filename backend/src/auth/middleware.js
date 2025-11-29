// backend/src/auth/middleware.js
const jwt = require('jsonwebtoken');
const { User } = require('./model');
const logger = require('../utils/logger');

// Existing authenticateToken middleware (keep as is)
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get fresh user data to ensure current permissions
        const user = await User.findById(decoded.userId)
            .select('-password')
            .lean();

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Access denied. User not found or inactive.'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        logger.error('Token authentication error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access denied. Token expired.'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Access denied. Invalid token.'
            });
        }

        return res.status(401).json({
            error: 'Access denied. Token verification failed.'
        });
    }
};

// NEW: Flexible role-based authorization middleware
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
            logger.warn(`Access denied for user ${req.user.email || req.user._id}. Required roles: [${roles.join(', ')}], User role: ${userRole}`);

            return res.status(403).json({
                error: `Access denied. Required role(s): ${roles.join(' or ')}.`,
                requiredRoles: roles,
                userRole: userRole
            });
        }

        // Log successful role authorization for audit
        logger.info(`Role authorization successful: ${userRole} (${req.user.email || req.user._id}) accessing ${req.method} ${req.path}`);

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
        logger.warn(`Committee access denied for user ${req.user.email || req.user._id}. Requested: ${requestedCommitteeId}, Assigned: ${userCommitteeId}`);

        return res.status(403).json({
            error: 'Access denied. You can only access your assigned committee.',
            assignedCommittee: userCommitteeId
        });
    }

    next();
};

// Optional: Middleware for development/testing (allows any role when NODE_ENV is development)
const requireRolesDev = (...allowedRoles) => {
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_ROLE_CHECK === 'true') {
        return (req, res, next) => {
            logger.warn('DEVELOPMENT MODE: Skipping role authorization check');
            next();
        };
    }

    return requireRoles(...allowedRoles);
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

    // Development helper
    requireRolesDev,
    
    // Rate limit
    authRateLimit
};