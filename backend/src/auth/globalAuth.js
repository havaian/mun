// backend/src/auth/globalAuth.js
// Global auth middleware setup — v3: All legacy shims removed
// All routes now use org-scoped event-context middleware.

const middleware = require('./middleware');

/**
 * Sets up global.auth with all available middleware.
 *
 * Usage examples:
 *
 *   // Require authenticated user
 *   router.get('/me', global.auth.token, controller.getMe);
 *
 *   // Platform-level SuperAdmin
 *   router.get('/admin/stats', global.auth.token, global.auth.superAdmin, controller.stats);
 *
 *   // Org Admin (SuperAdmin OR Organization.admin)
 *   router.post('/orgs/:orgId/events', global.auth.token, global.auth.orgAdmin('orgId'), controller.create);
 *
 *   // Org permission (OrgAdmin OR member with specific permission)
 *   router.put('/orgs/:orgId/events/:eventId', global.auth.token, global.auth.orgPermission('manage_event_content', 'orgId'), controller.update);
 *
 *   // Event context + participant (committee-scoped routes):
 *   router.use(
 *       global.auth.token,
 *       global.auth.eventContext('orgId', 'eventId'),
 *       global.auth.participant('committeeId')
 *   );
 *   router.post('/sessions', global.auth.presidium, controller.createSession);
 *   router.post('/vote', global.auth.votingRights, controller.castVote);
 */
const setupGlobalAuth = () => {
    global.auth = {
        // ============================================
        // Core authentication
        // ============================================
        token: middleware.authenticateToken,
        optionalAuth: middleware.optionalAuth,
        authRateLimit: middleware.authRateLimit,

        // ============================================
        // Platform-level: SuperAdmin
        // ============================================
        superAdmin: middleware.requireSuperAdmin,

        // ============================================
        // Organization-level
        // ============================================
        // SuperAdmin OR Organization.admin for the given org
        orgAdmin: middleware.requireOrgAdmin,

        // OrgAdmin OR OrgMembership with specific permission
        orgPermission: middleware.requireOrgPermission,

        // ============================================
        // Event-level: resolve context from URL params
        // ============================================
        // Validates org exists, event belongs to org
        // Attaches: req.organization, req.event, req.isOrgAdmin, req.orgMembership
        eventContext: middleware.resolveEventContext,

        // ============================================
        // Committee-level: resolve participant from URL params
        // ============================================
        // Looks up EventParticipant for user in event/committee
        // OrgAdmin/SuperAdmin bypass. Attaches: req.participant
        participant: middleware.resolveParticipant,

        // ============================================
        // Role checks (require participant resolved first)
        // ============================================
        // Any presidium_* role (chair, vice_chair, rapporteur, etc.)
        presidium: middleware.requirePresidium,

        // Delegate role only
        delegate: middleware.requireDelegate,

        // Any active participant
        anyParticipant: middleware.requireAnyParticipant,

        // Active delegate with voting rights (not observer/special)
        votingRights: middleware.requireVotingRights,

        // Presidium OR delegate
        presidiumOrDelegate: middleware.requirePresidiumOrDelegate,

        // Specific event roles
        eventRole: middleware.requireEventRole,
    };

    global.logger.info('Global authentication middleware initialized (v3 — org-scoped, no legacy shims)');

    return global.auth;
};

module.exports = {
    setupGlobalAuth,
    ...middleware
};