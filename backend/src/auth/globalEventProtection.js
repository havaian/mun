// // backend/src/auth/eventProtectionMiddleware.js
// const { Event } = require('../event/model');
// const { Committee } = require('../committee/model');
// const { Session } = require('../session/model');
// const { Document } = require('../document/model');
// const { Voting } = require('../voting/model');
// const { Message } = require('../messaging/model');
// const { Timer } = require('../timer/model');
// const { ProceduralMotion, Question } = require('../procedure/model');
// const { Resolution } = require('../resolution/model');\

// /**
//  * Simple and robust event protection middleware
//  * Blocks modification operations on completed events
//  */
// class EventProtectionMiddleware {
//     constructor() {
//         // Cache for event statuses to avoid repeated database queries
//         this.eventStatusCache = new Map();
//         this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

//         // Routes that should be completely exempt from protection
//         this.exemptRoutes = [
//             '/api/auth/',
//             '/api/admin/',
//             '/api/countries/',
//             '/api/health',
//             '/api/statistics/', // Statistics are read-only reports
//             '/api/presentation/' // Presentation display is read-only
//         ];

//         // QR routes that should be blocked even for admins on completed events
//         this.qrRoutes = [
//             '/generate-qr',
//             '/reset-qr',
//             '/regenerate-qr',
//             '/qr-login'
//         ];
//     }

//     /**
//      * Check if route should be exempt from protection
//      */
//     isExemptRoute(path) {
//         return this.exemptRoutes.some(route => path.startsWith(route));
//     }

//     /**
//      * Check if route is a QR operation
//      */
//     isQROperation(path) {
//         return this.qrRoutes.some(qrRoute => path.includes(qrRoute));
//     }

//     /**
//      * Check if this is a read-only operation
//      */
//     isReadOnlyOperation(method, path) {
//         // GET requests are generally read-only, except for QR operations
//         if (method === 'GET' && !this.isQROperation(path)) {
//             return true;
//         }

//         // Export endpoints are read-only regardless of method
//         if (path.includes('/export/')) {
//             return true;
//         }

//         // Download endpoints are read-only
//         if (path.includes('/download')) {
//             return true;
//         }

//         return false;
//     }

//     /**
//      * Get event status from cache or database
//      */
//     async getEventStatus(eventId) {
//         const cacheKey = eventId.toString();
//         const cached = this.eventStatusCache.get(cacheKey);

//         // Return cached status if still valid
//         if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
//             return cached.status;
//         }

//         try {
//             const event = await Event.findById(eventId).select('status name');
//             if (!event) {
//                 return null;
//             }

//             // Cache the result
//             this.eventStatusCache.set(cacheKey, {
//                 status: event.status,
//                 name: event.name,
//                 timestamp: Date.now()
//             });

//             return {
//                 status: event.status,
//                 name: event.name
//             };
//         } catch (error) {
//             global.logger.error('Error fetching event status:', error);
//             return null;
//         }
//     }

//     /**
//      * Extract event ID from request using multiple strategies
//      */
//     async extractEventId(req) {
//         try {
//             // Strategy 1: Direct event ID in params or body
//             let eventId = req.params.eventId || req.params.id || req.body.eventId;

//             if (eventId) {
//                 return eventId;
//             }

//             // Strategy 2: Committee ID -> Event ID
//             const committeeId = req.params.committeeId || req.body.committeeId;
//             if (committeeId) {
//                 const committee = await Committee.findById(committeeId).select('eventId');
//                 if (committee?.eventId) {
//                     return committee.eventId;
//                 }
//             }

//             // Strategy 3: Other resource IDs -> Committee ID -> Event ID
//             const resourceId = req.params.sessionId || req.params.documentId ||
//                 req.params.votingId || req.params.messageId ||
//                 req.params.timerId || req.params.motionId ||
//                 req.params.questionId || req.params.resolutionId ||
//                 req.params.coalitionId;

//             if (resourceId) {
//                 const eventId = await this.getEventFromResource(resourceId, req.path);
//                 if (eventId) {
//                     return eventId;
//                 }
//             }

//             return null;
//         } catch (error) {
//             global.logger.error('Error extracting event ID:', error);
//             return null;
//         }
//     }

//     /**
//      * Get event ID from various resource types
//      */
//     async getEventFromResource(resourceId, path) {
//         try {
//             // Determine resource type based on path
//             let query;

//             if (path.includes('/sessions/')) {
//                 const session = await Session.findById(resourceId).populate('committeeId', 'eventId');
//                 return session?.committeeId?.eventId;
//             }

//             if (path.includes('/documents/')) {
//                 const document = await Document.findById(resourceId).populate('committeeId', 'eventId');
//                 return document?.committeeId?.eventId;
//             }

//             if (path.includes('/voting/')) {
//                 const voting = await Voting.findById(resourceId).populate('committeeId', 'eventId');
//                 return voting?.committeeId?.eventId;
//             }

//             if (path.includes('/messages/')) {
//                 const message = await Message.findById(resourceId).populate('committeeId', 'eventId');
//                 return message?.committeeId?.eventId;
//             }

//             if (path.includes('/timers/')) {
//                 const timer = await Timer.findById(resourceId).populate('committeeId', 'eventId');
//                 return timer?.committeeId?.eventId;
//             }

//             if (path.includes('/procedure/')) {
//                 // Handle both motions and questions
//                 let procedure = await ProceduralMotion.findById(resourceId).populate('committeeId', 'eventId');
//                 if (!procedure) {
//                     procedure = await Question.findById(resourceId).populate('committeeId', 'eventId');
//                 }
//                 return procedure?.committeeId?.eventId;
//             }

//             if (path.includes('/resolutions/')) {
//                 const resolution = await Resolution.findById(resourceId).populate('committeeId', 'eventId');
//                 return resolution?.committeeId?.eventId;
//             }

//             return null;
//         } catch (error) {
//             global.logger.error('Error getting event from resource:', error);
//             return null;
//         }
//     }

//     /**
//      * Main middleware function
//      */
//     async protect(req, res, next) {
//         try {
//             const { path, method, user } = req;

//             // Skip exempt routes
//             if (this.isExemptRoute(path)) {
//                 return next();
//             }

//             // Allow all read-only operations except QR
//             if (this.isReadOnlyOperation(method, path)) {
//                 return next();
//             }

//             // Extract event ID
//             const eventId = await this.extractEventId(req);

//             if (!eventId) {
//                 // No event context found, allow request
//                 return next();
//             }

//             // Get event status
//             const eventInfo = await this.getEventStatus(eventId);

//             if (!eventInfo) {
//                 global.logger.warn(`Event not found for ID: ${eventId}`);
//                 return next();
//             }

//             // Check if event is completed
//             if (eventInfo.status === 'completed') {
//                 const isQR = this.isQROperation(path);

//                 // Block QR operations completely (even for admins)
//                 if (isQR) {
//                     global.logger.warn(`Blocked QR operation on completed event: ${eventInfo.name} - Path: ${path} - User: ${user?.email}`);

//                     return res.status(403).json({
//                         success: false,
//                         error: `QR code operations are not allowed. The event "${eventInfo.name}" has ended.`,
//                         code: 'EVENT_COMPLETED_QR_BLOCKED',
//                         eventStatus: eventInfo.status,
//                         eventName: eventInfo.name
//                     });
//                 }

//                 // Block other modification operations for all users
//                 global.logger.warn(`Blocked ${method} operation on completed event: ${eventInfo.name} - Path: ${path} - User: ${user?.email} - Role: ${user?.role}`);

//                 return res.status(405).json({
//                     success: false,
//                     error: `This operation is not allowed. The event "${eventInfo.name}" has ended.`,
//                     code: 'EVENT_COMPLETED',
//                     eventStatus: eventInfo.status,
//                     eventName: eventInfo.name,
//                     hint: 'Contact the event administrator if you need to access this data.'
//                 });
//             }

//             // Add event info to request for controllers to use
//             req.eventContext = {
//                 eventId: eventId,
//                 eventStatus: eventInfo.status,
//                 eventName: eventInfo.name
//             };

//             next();

//         } catch (error) {
//             global.logger.error('Error in event protection middleware:', error);
//             res.status(500).json({
//                 success: false,
//                 error: 'Failed to verify event access permissions'
//             });
//         }
//     }

//     /**
//      * Clear cache (useful for testing or manual refresh)
//      */
//     clearCache() {
//         this.eventStatusCache.clear();
//         global.logger.info('Event protection cache cleared');
//     }

//     /**
//      * Get middleware function bound to this instance
//      */
//     getMiddleware() {
//         return this.protect.bind(this);
//     }

//     /**
//      * Get cache statistics for monitoring
//      */
//     getCacheStats() {
//         return {
//             size: this.eventStatusCache.size,
//             timeout: this.cacheTimeout,
//             entries: Array.from(this.eventStatusCache.entries()).map(([key, value]) => ({
//                 eventId: key,
//                 status: value.status,
//                 name: value.name,
//                 age: Date.now() - value.timestamp
//             }))
//         };
//     }
// }

// // Create singleton instance
// const eventProtectionMiddleware = new EventProtectionMiddleware();

// // Export both the instance and the middleware function
// module.exports = {
//     eventProtectionMiddleware,
//     middleware: eventProtectionMiddleware.getMiddleware(),
//     clearCache: () => eventProtectionMiddleware.clearCache(),
//     getCacheStats: () => eventProtectionMiddleware.getCacheStats()
// };