const jwt = require('jsonwebtoken');
const { User, ActiveSession } = require('./model');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

// Main authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        // Check if session is still valid
        if (decoded.sessionId) {
            const activeSession = await ActiveSession.findOne({
                sessionToken: decoded.sessionId,
                userId: decoded.userId,
                isActive: true
            });

            if (!activeSession) {
                return res.status(401).json({ error: 'Session expired or invalid' });
            }

            // Update last activity
            activeSession.lastActivity = new Date();
            await activeSession.save();
        }

        // Add user info to request
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

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Invalid token provided');
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            logger.warn('Token expired');
            return res.status(401).json({ error: 'Token expired' });
        } else {
            logger.error('Token verification error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    }
};

// Role-based authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];

        if (!userRoles.includes(req.user.role)) {
            logger.warn(`Access denied for role ${req.user.role} to endpoint requiring ${userRoles.join(', ')}`);
            return res.status(403).json({
                error: 'Insufficient privileges',
                required: userRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// Admin-only access
const requireAdmin = requireRole('admin');

// Presidium access (for committee management)
const requirePresidium = requireRole(['admin', 'presidium']);

// Delegate access (for participation)
const requireDelegate = requireRole(['admin', 'presidium', 'delegate']);

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

    logger.warn(`Voting access denied for user: ${req.user.countryName || req.user.userId} (${req.user.role}/${req.user.specialRole})`);
    return res.status(403).json({
        error: 'No voting rights',
        reason: 'Only regular country delegates can vote'
    });
};

// Committee-specific access (must belong to the same committee)
const requireSameCommittee = (req, res, next) => {
    // Extract committee ID from various sources
    let targetCommitteeId = req.params.committeeId ||
        req.body.committeeId ||
        req.query.committeeId;

    // Admin can access any committee
    if (req.user.role === 'admin') {
        return next();
    }

    // Check if user belongs to the target committee
    if (!req.user.committeeId || req.user.committeeId.toString() !== targetCommitteeId) {
        logger.warn(`Committee access denied: User ${req.user.userId} tried to access committee ${targetCommitteeId}`);
        return res.status(403).json({
            error: 'Access denied to this committee',
            userCommittee: req.user.committeeId,
            targetCommittee: targetCommitteeId
        });
    }

    next();
};

// Optional authentication (allows both authenticated and non-authenticated access)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        // Token provided, try to authenticate
        const decoded = jwt.verify(token, JWT_SECRET);

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
    authenticateToken,
    requireRole,
    requireAdmin,
    requirePresidium,
    requireDelegate,
    requireVotingRights,
    requireSameCommittee,
    optionalAuth,
    authRateLimit
};