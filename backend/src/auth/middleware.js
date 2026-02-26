const jwt = require('jsonwebtoken');
const { User } = require('./model');

// ============================================
// CORE AUTHENTICATION
// ============================================

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

// ============================================
// PLATFORM LEVEL — SuperAdmin
// ============================================

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

// ============================================
// ORGANIZATION LEVEL — OrgAdmin + OrgPermission
// ============================================

// Require Org Admin for a specific organization
// Checks Organization.admin field (the single org owner)
// SuperAdmin always passes
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
// Org admin (Organization.admin) and SuperAdmin always pass
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
            return res.status(403).json({
                error: 'Access denied. Organization admin privileges required.'
            });
        }
    };
};

// ============================================
// EVENT + COMMITTEE LEVEL — EventParticipant
// ============================================

/**
 * Resolve event context from URL params.
 * Validates that org exists, event belongs to org.
 * Determines whether the user is an OrgAdmin (implicit full access).
 * 
 * Attaches to req:
 *   - req.organization  (lean Organization doc)
 *   - req.event         (lean Event doc)
 *   - req.isOrgAdmin    (boolean — SuperAdmin or Organization.admin)
 *   - req.orgMembership (lean OrgMembership doc, if user is a member but not admin)
 * 
 * Usage:
 *   router.get('/', global.auth.token, global.auth.eventContext('orgId', 'eventId'), ...)
 */
const resolveEventContext = (orgIdParam = 'orgId', eventIdParam = 'eventId') => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const orgId = req.params[orgIdParam];
        const eventId = req.params[eventIdParam];

        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID required in URL.' });
        }
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID required in URL.' });
        }

        try {
            // Lazy-load models
            const { Organization } = require('../organization/model');
            const { Event } = require('../event/model');

            const org = await Organization.findById(orgId).lean();
            if (!org) {
                return res.status(404).json({ error: 'Organization not found.' });
            }

            const event = await Event.findById(eventId).lean();
            if (!event) {
                return res.status(404).json({ error: 'Event not found.' });
            }

            // Verify event belongs to this org
            if (event.organization.toString() !== orgId) {
                return res.status(404).json({ error: 'Event not found in this organization.' });
            }

            req.organization = org;
            req.event = event;

            // Determine org-level access
            const isSuperAdmin = req.user.isSuperAdmin;
            const isOrgOwner = org.admin?.toString() === req.user.userId;
            req.isOrgAdmin = isSuperAdmin || isOrgOwner;

            // If not org admin, look up OrgMembership (for permission-based access)
            if (!req.isOrgAdmin) {
                try {
                    const { OrgMembership } = require('../org-membership/model');
                    const membership = await OrgMembership.findOne({
                        user: req.user.userId,
                        organization: orgId,
                        status: 'active'
                    }).lean();
                    req.orgMembership = membership || null;
                } catch (e) {
                    req.orgMembership = null;
                }
            }

            next();
        } catch (error) {
            global.logger.error('resolveEventContext error:', error);
            return res.status(500).json({ error: 'Failed to resolve event context.' });
        }
    };
};

/**
 * Resolve EventParticipant for the current user in this event/committee.
 * Must be called AFTER resolveEventContext.
 * 
 * OrgAdmin and SuperAdmin pass without needing an EventParticipant record.
 * 
 * Attaches to req:
 *   - req.participant (lean EventParticipant doc, null for org admins)
 * 
 * Usage:
 *   router.get('/:committeeId/sessions',
 *     global.auth.token,
 *     global.auth.eventContext('orgId', 'eventId'),
 *     global.auth.participant('committeeId'),
 *     ...
 *   )
 */
const resolveParticipant = (committeeIdParam = 'committeeId') => {
    return async (req, res, next) => {
        // OrgAdmin / SuperAdmin — bypass, they have implicit access
        if (req.isOrgAdmin) {
            req.participant = null; // no EventParticipant needed
            return next();
        }

        // OrgMembership members with relevant permissions also get access
        // (they're not event participants, but they manage events for the org)
        if (req.orgMembership) {
            const hasRelevantPermission = req.orgMembership.permissions.some(p =>
                ['manage_event_content', 'manage_event_status', 'manage_registration', 'review_applicants'].includes(p)
            );
            if (hasRelevantPermission) {
                req.participant = null;
                return next();
            }
        }

        const eventId = req.event?._id;
        if (!eventId) {
            return res.status(500).json({ error: 'Event context not resolved. Use eventContext middleware first.' });
        }

        const committeeId = req.params[committeeIdParam] || null;

        try {
            const { EventParticipant } = require('../participant/model');

            const filter = {
                user: req.user.userId,
                event: eventId,
                status: 'active'
            };

            // If a specific committee is requested, scope to it
            if (committeeId) {
                filter.committee = committeeId;
            }

            const participant = await EventParticipant.findOne(filter).lean();

            if (!participant) {
                return res.status(403).json({
                    error: committeeId
                        ? 'Access denied. Not a participant in this committee.'
                        : 'Access denied. Not a participant in this event.'
                });
            }

            req.participant = participant;
            next();
        } catch (error) {
            global.logger.error('resolveParticipant error:', error);
            return res.status(500).json({ error: 'Failed to resolve participant context.' });
        }
    };
};

/**
 * Require the user to have one of the specified event-level roles.
 * Must be called AFTER resolveParticipant.
 * 
 * OrgAdmin / SuperAdmin always pass (req.isOrgAdmin === true).
 * 
 * Usage:
 *   global.auth.eventRole('presidium_chair', 'presidium_cochair')
 *   global.auth.eventRole('delegate')
 */
const requireEventRole = (...roles) => {
    const flatRoles = roles.flat();

    return (req, res, next) => {
        // OrgAdmin / SuperAdmin bypass role checks
        if (req.isOrgAdmin) {
            return next();
        }

        if (!req.participant) {
            return res.status(403).json({
                error: 'Access denied. Participant context not resolved.'
            });
        }

        if (!flatRoles.includes(req.participant.role)) {
            return res.status(403).json({
                error: `Access denied. Required role(s): ${flatRoles.join(', ')}.`,
                currentRole: req.participant.role,
                requiredRoles: flatRoles
            });
        }

        next();
    };
};

/**
 * Convenience: require any presidium role.
 * Must be called AFTER resolveParticipant.
 */
const requirePresidium = (req, res, next) => {
    if (req.isOrgAdmin) return next();

    if (!req.participant) {
        return res.status(403).json({ error: 'Access denied. Participant context not resolved.' });
    }

    // Lazy-load to get PRESIDIUM_ROLES constant
    const { PRESIDIUM_ROLES } = require('../participant/model');

    if (!PRESIDIUM_ROLES.includes(req.participant.role)) {
        return res.status(403).json({
            error: 'Access denied. Presidium privileges required.',
            currentRole: req.participant.role
        });
    }

    next();
};

/**
 * Convenience: require delegate role.
 * Must be called AFTER resolveParticipant.
 */
const requireDelegate = (req, res, next) => {
    if (req.isOrgAdmin) return next();

    if (!req.participant) {
        return res.status(403).json({ error: 'Access denied. Participant context not resolved.' });
    }

    if (req.participant.role !== 'delegate') {
        return res.status(403).json({
            error: 'Access denied. Delegate role required.',
            currentRole: req.participant.role
        });
    }

    next();
};

/**
 * Require any active participant (any role).
 * Must be called AFTER resolveParticipant.
 */
const requireAnyParticipant = (req, res, next) => {
    if (req.isOrgAdmin) return next();

    if (!req.participant) {
        return res.status(403).json({ error: 'Access denied. Must be an event participant.' });
    }

    next();
};

/**
 * Require voting rights.
 * Only active delegates can vote (not observers, not presidium).
 * Must be called AFTER resolveParticipant.
 */
const requireVotingRights = (req, res, next) => {
    // OrgAdmin / SuperAdmin — pass (for managing votes)
    if (req.isOrgAdmin) return next();

    // Presidium can manage votes (start, complete, etc.) but not cast them
    // This middleware is for CASTING votes — if presidium needs to manage,
    // use requirePresidium instead on those routes
    if (!req.participant) {
        return res.status(403).json({ error: 'Access denied. Participant context not resolved.' });
    }

    if (req.participant.role !== 'delegate' || req.participant.status !== 'active') {
        return res.status(403).json({
            error: 'No voting rights.',
            reason: 'Only active delegates can vote.'
        });
    }

    next();
};

/**
 * Require presidium OR delegate (any active committee member).
 * Must be called AFTER resolveParticipant.
 * Useful for routes where both presidium and delegates can act.
 */
const requirePresidiumOrDelegate = (req, res, next) => {
    if (req.isOrgAdmin) return next();

    if (!req.participant) {
        return res.status(403).json({ error: 'Access denied. Participant context not resolved.' });
    }

    const { PRESIDIUM_ROLES } = require('../participant/model');
    const allowed = [...PRESIDIUM_ROLES, 'delegate'];

    if (!allowed.includes(req.participant.role)) {
        return res.status(403).json({
            error: 'Access denied. Presidium or delegate role required.',
            currentRole: req.participant.role
        });
    }

    next();
};

/**
 * Resolve event context from just an eventId (no orgId in URL).
 * For participant-scoped routes where user accesses via EventParticipant,
 * not via OrgMembership.
 *
 * Attaches to req:
 *   - req.organization (lean doc)
 *   - req.event (lean doc)
 *   - req.isOrgAdmin (boolean — checks superAdmin or org.admin)
 *   - req.orgMembership (OrgMembership if exists, else null)
 *
 * Usage:
 *   router.use(
 *     global.auth.token,
 *     global.auth.eventById('eventId'),
 *     global.auth.participant('committeeId')
 *   );
 */
const resolveEventById = (eventIdParam = 'eventId') => {
    return async (req, res, next) => {
        const eventId = req.params[eventIdParam];

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID required in URL.' });
        }

        try {
            const { Event } = require('../event/model');
            const { Organization } = require('../organization/model');

            const event = await Event.findById(eventId).lean();
            if (!event) {
                return res.status(404).json({ error: 'Event not found.' });
            }

            const org = await Organization.findById(event.organization).lean();
            if (!org) {
                return res.status(404).json({ error: 'Organization not found.' });
            }

            req.organization = org;
            req.event = event;

            // Inject orgId/eventId into params so downstream middleware works
            // (resolveParticipant, controllers that read req.params.orgId, etc.)
            req.params.orgId = org._id.toString();
            req.params.eventId = event._id.toString();

            // Determine org-level access
            const isSuperAdmin = req.user.isSuperAdmin;
            const isOrgOwner = org.admin?.toString() === req.user.userId;
            req.isOrgAdmin = isSuperAdmin || isOrgOwner;

            // Lookup OrgMembership for permission-based access
            if (!req.isOrgAdmin) {
                try {
                    const { OrgMembership } = require('../org-membership/model');
                    const membership = await OrgMembership.findOne({
                        user: req.user.userId,
                        organization: org._id,
                        status: 'active'
                    }).lean();
                    req.orgMembership = membership || null;
                } catch (e) {
                    req.orgMembership = null;
                }
            }

            next();
        } catch (error) {
            global.logger.error('resolveEventById error:', error);
            return res.status(500).json({ error: 'Failed to resolve event context.' });
        }
    };
};

module.exports = {
    // Core
    authenticateToken,
    optionalAuth,
    authRateLimit,

    // Platform level
    requireSuperAdmin,

    // Org level
    requireOrgAdmin,
    requireOrgPermission,

    // Event + Committee level
    resolveEventContext,
    resolveParticipant,
    requireEventRole,
    requirePresidium,
    requireDelegate,
    requireAnyParticipant,
    requireVotingRights,
    requirePresidiumOrDelegate,
    resolveEventById,
};