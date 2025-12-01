// backend/src/event/automationService.js
const { Event } = require('./model');
const { Committee } = require('../committee/model');
const logger = require('../utils/logger');

class EventAutomationService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        // Check every 5 minutes
        this.checkInterval = 5 * 60 * 1000;
    }

    /**
     * Start the automation service
     */
    start() {
        if (this.isRunning) {
            logger.warn('Event automation service is already running');
            return;
        }

        this.isRunning = true;

        // Run initial check
        this.checkEventStatuses();

        // Set up interval for periodic checks
        this.intervalId = setInterval(() => {
            this.checkEventStatuses();
        }, this.checkInterval);

        logger.info('Event automation service started - checking every 5 minutes');
    }

    /**
     * Stop the automation service
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        logger.info('Event automation service stopped');
    }

    /**
     * Check and update event statuses based on current time
     */
    async checkEventStatuses() {
        try {
            const now = new Date();
            let updatedCount = 0;

            logger.debug('Starting automated event status check');

            // Find events that need status updates
            const events = await Event.find({
                status: { $in: ['draft', 'active'] },
                $or: [
                    // Draft events that should become active
                    {
                        status: 'draft',
                        startDate: { $lte: now }
                    },
                    // Active events that should become completed
                    {
                        status: 'active',
                        endDate: { $lte: now }
                    }
                ]
            });

            for (const event of events) {
                const updated = await this.updateEventStatus(event, now);
                if (updated) {
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                logger.info(`Automated status update completed: ${updatedCount} events updated`);
            }

        } catch (error) {
            logger.error('Error in automated event status check:', error);
        }
    }

    /**
     * Update individual event status
     */
    async updateEventStatus(event, currentTime = new Date()) {
        try {
            let newStatus = null;
            let shouldUpdateCommittees = false;

            // Task 5: Draft event should automatically transition to active
            if (event.status === 'draft' && currentTime >= new Date(event.startDate)) {
                newStatus = 'active';
                shouldUpdateCommittees = true;
                logger.info(`Auto-activating event: ${event.name} (ID: ${event._id})`);
            }

            // Task 6: Active event should automatically end
            if (event.status === 'active' && currentTime > new Date(event.endDate)) {
                newStatus = 'completed';
                shouldUpdateCommittees = true;
                logger.info(`Auto-completing event: ${event.name} (ID: ${event._id})`);
            }

            if (newStatus) {
                const oldStatus = event.status;
                event.status = newStatus;
                event.updatedAt = currentTime;

                await event.save();

                // Update associated committee statuses
                if (shouldUpdateCommittees) {
                    await this.updateCommitteeStatuses(event._id, newStatus);
                }

                // Emit WebSocket event for real-time updates
                if (global.io) {
                    global.io.emit('event-status-changed', {
                        eventId: event._id,
                        eventName: event.name,
                        oldStatus,
                        newStatus,
                        timestamp: currentTime
                    });
                }

                logger.info(`Event status auto-updated: ${event.name} from ${oldStatus} to ${newStatus}`);
                return true;
            }

            return false;

        } catch (error) {
            logger.error(`Error updating event status for ${event.name}:`, error);
            return false;
        }
    }

    /**
     * Update committee statuses based on parent event status
     * Task 10: Committee statuses should change according to event status
     */
    async updateCommitteeStatuses(eventId, eventStatus) {
        try {
            let committeeStatus;

            // Map event status to appropriate committee status
            switch (eventStatus) {
                case 'active':
                    committeeStatus = 'active';
                    break;
                case 'completed':
                    committeeStatus = 'completed';
                    break;
                default:
                    return; // Don't update for other statuses
            }

            const result = await Committee.updateMany(
                {
                    eventId: eventId,
                    status: { $nin: ['completed'] } // Don't override already completed committees
                },
                {
                    status: committeeStatus,
                    updatedAt: new Date()
                }
            );

            if (result.modifiedCount > 0) {
                logger.info(`Updated ${result.modifiedCount} committee(s) to status: ${committeeStatus} for event: ${eventId}`);

                // Emit WebSocket event for committee status changes
                if (global.io) {
                    global.io.emit('committees-status-changed', {
                        eventId,
                        newStatus: committeeStatus,
                        affectedCount: result.modifiedCount,
                        timestamp: new Date()
                    });
                }
            }

        } catch (error) {
            logger.error(`Error updating committee statuses for event ${eventId}:`, error);
        }
    }

    /**
     * Manual trigger for event status check (useful for testing or immediate execution)
     */
    async runManualCheck() {
        logger.info('Manual event status check triggered');
        await this.checkEventStatuses();
    }

    /**
     * Check if an event is blocking operations (Task 7)
     */
    static isEventBlocked(event, userRole) {
        if (!event) return false;

        // Task 7: Finished event should block all CRUD except admin reports
        if (event.status === 'completed') {
            // Allow admin access for reports
            if (userRole === 'admin') {
                return false;
            }
            // Block all other operations
            return true;
        }

        return false;
    }

    /**
     * Get automation service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            checkInterval: this.checkInterval,
            nextCheck: this.intervalId ? new Date(Date.now() + this.checkInterval) : null
        };
    }

    /**
     * Force check all events and update statuses
     */
    async forceCheckAllEvents() {
        try {
            logger.info('Force checking all events for status updates');

            const now = new Date();
            const allEvents = await Event.find({
                status: { $in: ['draft', 'active'] }
            });

            let updatedCount = 0;
            for (const event of allEvents) {
                const updated = await this.updateEventStatus(event, now);
                if (updated) {
                    updatedCount++;
                }
            }

            logger.info(`Force check completed: ${updatedCount} events updated`);
            return { success: true, updatedCount, totalChecked: allEvents.length };

        } catch (error) {
            logger.error('Error in force check all events:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const eventAutomationService = new EventAutomationService();

module.exports = {
    eventAutomationService,
    EventAutomationService
};