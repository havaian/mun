const middleware = require('./middleware');

/**
 * Setup global authentication methods
 * Call this early in app startup (in index.js)
 * 
 * New permission model:
 *   - SuperAdmin: platform-level god account
 *   - Org Admin: per-organization admin (checked dynamically)
 *   - Org Permissions: per-membership permissions (checked dynamically)
 *   - Event roles: per-EventParticipant (Phase 3)
 * 
 * Legacy compat:
 *   Old route files still reference global.auth.admin, .presidium, .delegate,
 *   .adminOrPresidium, .sameCommittee, .roles(), etc.
 *   These shims keep the server bootable until those routes are migrated.
 */

// ============================================
// Legacy role-based middleware shims
// ============================================
// The old User model had a `role` field (admin/presidium/delegate).
// The new model uses isSuperAdmin + OrgMembership + EventParticipant.
// These shims let old route files load without crashing.
// They check isSuperAdmin as a stand-in for the old "admin" role.
// Presidium/delegate routes will need proper EventParticipant checks later.

const _legacyRequireRoles = (...allowedRoles) => {
    const roles = allowedRoles.flat();

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required.'
            });
        }

        // SuperAdmin passes any legacy admin check
        if (roles.includes('admin') && req.user.isSuperAdmin) {
            return next();
        }

        // If user has a legacy role field (e.g. from old JWT), check it
        if (req.user.role && roles.includes(req.user.role)) {
            return next();
        }

        // If user has eventParticipant data attached (future Phase 3 middleware)
        if (req.user.eventRole && roles.includes(req.user.eventRole)) {
            return next();
        }

        return res.status(403).json({
            error: `Access denied. Required role(s): ${roles.join(' or ')}.`,
            requiredRoles: roles,
        });
    };
};

const _legacyRequireAdmin = _legacyRequireRoles('admin');
const _legacyRequirePresidium = _legacyRequireRoles('presidium');
const _legacyRequireDelegate = _legacyRequireRoles('delegate');
const _legacyRequireAdminOrPresidium = _legacyRequireRoles('admin', 'presidium');
const _legacyRequireAdminOrDelegate = _legacyRequireRoles('admin', 'delegate');
const _legacyRequireAnyRole = _legacyRequireRoles('admin', 'presidium', 'delegate');

const _legacyRequireSameCommittee = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    // SuperAdmin can access any committee
    if (req.user.isSuperAdmin) {
        return next();
    }

    // Legacy: admin role can access any committee
    if (req.user.role === 'admin') {
        return next();
    }

    // Check committee match
    const requestedCommitteeId = req.params.committeeId || req.params.id || req.body.committeeId;
    const userCommitteeId = req.user.committeeId?.toString();

    if (!userCommitteeId) {
        return res.status(403).json({
            error: 'Access denied. User not assigned to any committee.'
        });
    }

    if (requestedCommitteeId !== userCommitteeId) {
        return res.status(403).json({
            error: 'Access denied. You can only access your assigned committee.'
        });
    }

    next();
};

const _legacyRequireVotingRights = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // SuperAdmin and admin/presidium always pass
    if (req.user.isSuperAdmin || req.user.role === 'admin' || req.user.role === 'presidium') {
        return next();
    }

    // Delegates must not be observers
    if (req.user.role === 'delegate' &&
        req.user.specialRole !== 'observer' &&
        req.user.specialRole !== 'special') {
        return next();
    }

    return res.status(403).json({
        error: 'No voting rights',
        reason: 'Only regular country delegates can vote'
    });
};


const setupGlobalAuth = () => {
    global.auth = {
        // ============================================
        // New org-based middleware (Phase 1+)
        // ============================================
        token: middleware.authenticateToken,
        superAdmin: middleware.requireSuperAdmin,
        orgAdmin: middleware.requireOrgAdmin,
        orgPermission: middleware.requireOrgPermission,
        optionalAuth: middleware.optionalAuth,
        authRateLimit: middleware.authRateLimit,

        // ============================================
        // Legacy shims — referenced by old route files
        // (admin, committee, session, document, resolution,
        //  voting, messaging, statistics, presentation,
        //  timer, procedure, export, countries, auth/routes)
        // ============================================
        admin: _legacyRequireAdmin,
        presidium: _legacyRequirePresidium,
        delegate: _legacyRequireDelegate,
        adminOrPresidium: _legacyRequireAdminOrPresidium,
        adminOrDelegate: _legacyRequireAdminOrDelegate,
        anyRole: _legacyRequireAnyRole,
        sameCommittee: _legacyRequireSameCommittee,

        // global.auth.roles('admin', 'presidium') — used in some old routes
        roles: (...roles) => _legacyRequireRoles(...roles),

        // global.auth.require.admin etc — nested form used by some routes
        require: {
            admin: _legacyRequireAdmin,
            presidium: _legacyRequirePresidium,
            delegate: _legacyRequireDelegate,
            adminOrPresidium: _legacyRequireAdminOrPresidium,
            adminOrDelegate: _legacyRequireAdminOrDelegate,
            anyRole: _legacyRequireAnyRole,
            roles: _legacyRequireRoles,
        },

        // Utility helpers — old routes reference global.auth.utils.authRateLimit etc
        utils: {
            isSuperAdmin: (user) => user?.isSuperAdmin === true,
            authRateLimit: middleware.authRateLimit,
            requireVotingRights: _legacyRequireVotingRights,
            hasRole: (user, ...allowedRoles) => {
                if (!user) return false;
                if (user.isSuperAdmin && allowedRoles.flat().includes('admin')) return true;
                return user.role ? allowedRoles.flat().includes(user.role) : false;
            },
            canAccessCommittee: (user, committeeId) => {
                if (!user) return false;
                if (user.isSuperAdmin || user.role === 'admin') return true;
                return user.committeeId?.toString() === committeeId;
            },
            getRoleDisplayName: (role) => {
                const map = { admin: 'Administrator', presidium: 'Presidium Member', delegate: 'Delegate' };
                return map[role] || role;
            },
        },
    };

    global.logger.info('Global authentication middleware initialized (v2 — org-based, with legacy compat)');

    return global.auth;
};

/**
 * Usage — new routes:
 * 
 * router.get('/orgs', global.auth.token, global.auth.superAdmin, controller.list);
 * router.put('/orgs/:id', global.auth.token, global.auth.orgAdmin(), controller.update);
 * router.post('/orgs/:orgId/events', global.auth.token, global.auth.orgPermission('manage_registration', 'orgId'), controller.create);
 * 
 * Legacy routes (still works):
 * 
 * router.get('/admin-only', global.auth.token, global.auth.admin, controller.func);
 * router.get('/flexible', global.auth.token, global.auth.adminOrPresidium, controller.func);
 * router.get('/committee', global.auth.token, global.auth.sameCommittee, controller.func);
 */

module.exports = {
    setupGlobalAuth,
    ...middleware
};