// backend/src/auth/globalAuth.js
const middleware = require('./middleware');

/**
 * Setup global authentication methods
 * Call this early in your app startup (in app.js or server.js)
 */
const setupGlobalAuth = () => {
    // Create the global auth object
    global.auth = {
        // Core middleware
        token: middleware.authenticateToken,
        sameCommittee: middleware.requireSameCommittee,

        // Role requirements
        require: {
            // Single roles
            admin: middleware.requireAdmin,
            presidium: middleware.requirePresidium,
            delegate: middleware.requireDelegate,

            // Multiple role combinations
            adminOrPresidium: middleware.requireAdminOrPresidium,
            adminOrDelegate: middleware.requireAdminOrDelegate,
            anyRole: middleware.requireAnyRole,

            // Flexible role checker
            roles: middleware.requireRoles,
        },

        // Convenience methods with cleaner syntax
        admin: middleware.requireAdmin,
        presidium: middleware.requirePresidium,
        delegate: middleware.requireDelegate,

        // Common combinations with short names
        adminOrPresidium: middleware.requireAdminOrPresidium,
        adminOrDelegate: middleware.requireAdminOrDelegate,
        anyRole: middleware.requireAnyRole,

        // Helper for custom role combinations
        roles: (...roles) => middleware.requireRoles(...roles)
    };

    // Add some helpful utilities
    global.auth.utils = {
        // Check if user has specific role (for use in controllers)
        hasRole: (user, ...allowedRoles) => {
            if (!user || !user.role) return false;
            return allowedRoles.flat().includes(user.role);
        },

        // Check if user can access committee
        canAccessCommittee: (user, committeeId) => {
            if (!user) return false;
            if (user.role === 'admin') return true;
            return user.committeeId?.toString() === committeeId;
        },

        // Get user role display name
        getRoleDisplayName: (role) => {
            const roleMap = {
                'admin': 'Administrator',
                'presidium': 'Presidium Member',
                'delegate': 'Delegate'
            };
            return roleMap[role] || role;
        },

        authRateLimit: middleware.authRateLimit,
        requireVotingRights: middleware.requireVotingRights,
        optionalAuth: middleware.optionalAuth
    };

    global.logger.info('Global authentication middleware initialized');

    // Return the global auth object for convenience
    return global.auth;
};

/**
 * TypeScript-style documentation for better IDE support
 * 
 * Usage examples:
 * 
 * // Basic usage
 * router.get('/admin-only', global.auth.token, global.auth.admin, controller.func);
 * 
 * // Multiple roles
 * router.get('/flexible', global.auth.token, global.auth.adminOrPresidium, controller.func);
 * 
 * // Custom role combinations
 * router.get('/custom', global.auth.token, global.auth.roles('admin', 'moderator'), controller.func);
 * 
 * // In controllers
 * if (global.auth.utils.hasRole(req.user, 'admin', 'presidium')) {
 *     // User has admin or presidium role
 * }
 */

module.exports = {
    setupGlobalAuth,

    // Export middleware directly as well for flexibility
    ...middleware
};