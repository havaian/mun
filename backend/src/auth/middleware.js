const jwt = require('jsonwebtoken');
const { User } = require('./model');

// Core authentication — verifies JWT, loads user
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .select('-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordTokenExpires')
            .lean();

        if (!user) {
            return res.status(401).json({
                error: 'Access denied. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                error: 'Access denied. Account is suspended.',
                code: 'ACCOUNT_SUSPENDED'
            });
        }

        // Set req.user with user data from DB
        req.user = {
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isSuperAdmin: user.isSuperAdmin || false,
            status: user.status
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access denied. Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Access denied. Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        global.logger.error('Token authentication error:', error);
        return res.status(401).json({
            error: 'Access denied. Token verification failed.',
            code: 'VERIFICATION_FAILED'
        });
    }
};

// Require SuperAdmin
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!req.user.isSuperAdmin) {
        return res.status(403).json({
            error: 'Access denied. SuperAdmin privileges required.'
        });
    }

    next();
};

// Require Org Admin for a specific organization
// Expects req.params.id or req.params.orgId to contain the organization ID
const requireOrgAdmin = (orgIdParam = 'id') => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        // SuperAdmin bypasses org admin check
        if (req.user.isSuperAdmin) {
            return next();
        }

        const orgId = req.params[orgIdParam] || req.params.id || req.body.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID required.' });
        }

        // Lazy-load to avoid circular dependency
        const { Organization } = require('../organization/model');
        const org = await Organization.findById(orgId).lean();

        if (!org) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        if (org.admin?.toString() !== req.user.userId) {
            return res.status(403).json({
                error: 'Access denied. Organization admin privileges required.'
            });
        }

        // Attach org to request for downstream use
        req.organization = org;
        next();
    };
};

// Require specific org-level permission
// Checks OrgMembership for the given permission
const requireOrgPermission = (permission, orgIdParam = 'id') => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        // SuperAdmin bypasses all permission checks
        if (req.user.isSuperAdmin) {
            return next();
        }

        const orgId = req.params[orgIdParam] || req.params.id || req.body.organizationId;
        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID required.' });
        }

        // Lazy-load to avoid circular dependency
        const { Organization } = require('../organization/model');
        const org = await Organization.findById(orgId).lean();

        if (!org) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        // Org admin has all permissions implicitly
        if (org.admin?.toString() === req.user.userId) {
            req.organization = org;
            return next();
        }

        // Check OrgMembership for specific permission
        // OrgMembership model will be created in Phase 2
        // For now, this will be a forward-compatible stub
        try {
            const { OrgMembership } = require('../org-membership/model');
            const membership = await OrgMembership.findOne({
                user: req.user.userId,
                organization: orgId,
                status: 'active'
            }).lean();

            if (!membership) {
                return res.status(403).json({
                    error: 'Access denied. Not a member of this organization.'
                });
            }

            if (!membership.permissions.includes(permission)) {
                return res.status(403).json({
                    error: `Access denied. Missing permission: ${permission}`
                });
            }

            req.organization = org;
            req.orgMembership = membership;
            next();
        } catch (e) {
            // OrgMembership module not yet created — only org admin and superadmin pass
            return res.status(403).json({
                error: 'Access denied. Organization admin privileges required.'
            });
        }
    };
};

// Optional auth — sets req.user if token present, continues either way
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
            .select('-password')
            .lean();

        if (user && user.status === 'active') {
            req.user = {
                userId: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isSuperAdmin: user.isSuperAdmin || false,
                status: user.status
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

// Rate limiting middleware for auth endpoints
const authRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

module.exports = {
    authenticateToken,
    requireSuperAdmin,
    requireOrgAdmin,
    requireOrgPermission,
    optionalAuth,
    authRateLimit
};