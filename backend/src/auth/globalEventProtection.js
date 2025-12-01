// backend/src/auth/globalEventProtection.js
const { Event } = require('../event/model');
const { Committee } = require('../committee/model');
const logger = require('../utils/logger');

/**
 * Global Event Protection Middleware
 * Automatically detects and protects routes that involve completed events
 */
class GlobalEventProtection {
    constructor() {
        this.protectedPaths = new Set();
        this.exemptPaths = new Set();
        this.setupPathMatchers();
    }

    /**
     * Setup which paths should be protected and which should be exempt
     */
    setupPathMatchers() {
        // Routes that should be automatically protected (pattern matching)
        this.protectedPathPatterns = [
            /^\/api\/committees\/[^\/]+\/(?!qr-tokens$)/, // Committee operations except reading QR tokens
            /^\/api\/sessions\//, // All session operations
            /^\/api\/voting\//, // All voting operations  
            /^\/api\/documents\/(?!.*\/download$)/, // Document operations except downloads
            /^\/api\/resolutions\//, // All resolution operations
            /^\/api\/messages\//, // All messaging operations
            /^\/api\/procedure\//, // All procedure operations
            /^\/api\/timers\//, // All timer operations
        ];

        // Routes that should be explicitly exempt from protection
        this.exemptPathPatterns = [
            /^\/api\/auth\//, // Authentication routes
            /^\/api\/admin\//, // Admin routes (handled separately)
            /^\/api\/countries\//, // Country data routes
            /^\/api\/export\/.*\/statistics$/, // Export statistics (reports)
            /^\/api\/committees\/[^\/]+\/qr-tokens$/, // Reading QR tokens (archival)
            /^\/api\/presentation\//, // Presentation display routes
            /^\/api\/health$/, // Health check
        ];

        // QR-specific routes that should be completely blocked on completed events
        this.qrBlockedPatterns = [
            /^\/api\/committees\/[^\/]+\/generate-qrs$/,
            /^\/api\/committees\/[^\/]+\/presidium\/generate-qrs$/,
            /^\/api\/committees\/[^\/]+\/.*\/reset-qr$/,
            /^\/api\/committees\/[^\/]+\/.*\/regenerate-qr$/,
            /^\/api\/auth\/qr-login$/, // QR login for completed events
        ];
    }

    /**
     * Check if a path should be protected
     */
    shouldProtectPath(path, method) {
        // Always allow GET requests for reading data
        if (method === 'GET') {
            // Exception: Block QR operations even on GET
            return this.qrBlockedPatterns.some(pattern => pattern.test(path));
        }

        // Check if path is explicitly exempt
        if (this.exemptPathPatterns.some(pattern => pattern.test(path))) {
            return false;
        }

        // Check if path should be protected
        return this.protectedPathPatterns.some(pattern => pattern.test(path));
    }

    /**
     * Check if a path involves QR operations
     */
    isQROperation(path) {
        return this.qrBlockedPatterns.some(pattern => pattern.test(path));
    }

    /**
     * Extract identifiers from request to determine associated event
     */
    async extractEventContext(req) {
        let eventId = null;
        let eventInfo = null;

        try {
            // Method 1: Direct event ID in params or body
            eventId = req.params.eventId || req.params.id || req.body.eventId;

            if (eventId) {
                const event = await Event.findById(eventId);
                if (event) {
                    return {
                        eventId: event._id,
                        eventStatus: event.status,
                        eventName: event.name,
                        startDate: event.startDate,
                        endDate: event.endDate
                    };
                }
            }

            // Method 2: Committee ID - get event through committee
            const committeeId = req.params.committeeId || req.body.committeeId;
            if (committeeId) {
                const committee = await Committee.findById(committeeId)
                    .populate('eventId', 'status name startDate endDate');

                if (committee?.eventId) {
                    return {
                        eventId: committee.eventId._id,
                        eventStatus: committee.eventId.status,
                        eventName: committee.eventId.name,
                        startDate: committee.eventId.startDate,
                        endDate: committee.eventId.endDate,
                        committeeId: committee._id,
                        committeeName: committee.name
                    };
                }
            }

            // Method 3: Session/Document/etc. ID - trace back to committee then event
            const resourceId = req.params.sessionId || req.params.documentId || req.params.votingId;
            if (resourceId) {
                // This would require more complex lookups depending on the resource type
                // For now, we'll implement the basic cases above
            }

            return null;

        } catch (error) {
            logger.error('Error extracting event context:', error);
            return null;
        }
    }

    /**
     * Main protection middleware
     */
    async protect(req, res, next) {
        try {
            const { path, method } = req;
            const userRole = req.user?.role;

            // Skip protection if path is not in scope
            if (!this.shouldProtectPath(path, method)) {
                return next();
            }

            // Extract event context
            const eventContext = await this.extractEventContext(req);

            if (!eventContext) {
                // No event context found, allow request to proceed
                return next();
            }

            const { eventStatus, eventName } = eventContext;

            // Check if event is completed and operation should be blocked
            if (eventStatus === 'completed') {

                // QR operations are always blocked on completed events (even for admins)
                if (this.isQROperation(path)) {
                    logger.warn(`Blocked QR operation on completed event: ${eventName} - Path: ${path}`);

                    return res.status(403).json({
                        success: false,
                        error: `QR code operations are not allowed. The event "${eventName}" has ended.`,
                        code: 'EVENT_COMPLETED_QR_BLOCKED',
                        eventStatus: eventStatus
                    });
                }

                // // Other operations blocked for non-admin users
                // if (userRole !== 'admin') {
                    logger.warn(`Blocked ${method} operation on completed event: ${eventName} by user role: ${userRole} - Path: ${path}`);

                    return res.status(405).json({
                        success: false,
                        error: `This operation is not allowed. The event "${eventName}" has ended.`,
                        code: 'EVENT_COMPLETED',
                        eventStatus: eventStatus,
                        eventName: eventName,
                        hint: 'Only administrators can perform operations on completed events.'
                    });
                // }
            }

            // Add event context to request for use in controllers
            req.eventContext = eventContext;

            next();

        } catch (error) {
            logger.error('Error in global event protection middleware:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify event access permissions'
            });
        }
    }

    /**
     * Create middleware function bound to this instance
     */
    getMiddleware() {
        return this.protect.bind(this);
    }
}

// Create singleton instance
const globalEventProtection = new GlobalEventProtection();

module.exports = {
    globalEventProtection,
    eventProtectionMiddleware: globalEventProtection.getMiddleware()
};