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
 */
const setupGlobalAuth = () => {
    global.auth = {
        // Core middleware
        token: middleware.authenticateToken,

        // Platform-level
        admin: middleware.requireSuperAdmin,
        superAdmin: middleware.requireSuperAdmin,

        // Organization-level (dynamic — checks org ownership/membership)
        orgAdmin: middleware.requireOrgAdmin,               // requireOrgAdmin('id') or requireOrgAdmin('orgId')
        orgPermission: middleware.requireOrgPermission,     // requireOrgPermission('manage_members', 'orgId')

        // Optional auth
        optionalAuth: middleware.optionalAuth,

        // Rate limiting
        authRateLimit: middleware.authRateLimit,

        // Utility helpers
        utils: {
            isSuperAdmin: (user) => user?.isSuperAdmin === true
        }
    };

    global.logger.info('Global authentication middleware initialized (v2 — org-based)');

    return global.auth;
};

/**
 * Usage examples:
 * 
 * // SuperAdmin only
 * router.get('/orgs', global.auth.token, global.auth.superAdmin, controller.list);
 * 
 * // Org admin (SuperAdmin also passes)
 * router.put('/orgs/:id', global.auth.token, global.auth.orgAdmin(), controller.update);
 * 
 * // Specific org permission
 * router.post('/orgs/:orgId/events', global.auth.token, global.auth.orgPermission('manage_registration', 'orgId'), controller.create);
 * 
 * // Any authenticated user
 * router.get('/profile', global.auth.token, controller.getProfile);
 * 
 * // Optional auth (public endpoints that benefit from knowing the user)
 * router.get('/orgs/:slug', global.auth.optionalAuth, controller.getPublic);
 */

module.exports = {
    setupGlobalAuth,
    ...middleware
};