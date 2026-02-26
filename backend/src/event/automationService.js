// backend/src/event/automationService.js
// =============================================
// FULL LIFECYCLE AUTOMATION with ADMIN OVERRIDE
// =============================================
// Checks every 5 minutes and transitions events:
//   published  → registration_open   (when registrationStartDate reached)
//   registration_open → registration_closed (when registrationEndDate reached)
//   registration_closed → active      (when startDate reached)
//   active     → completed            (when endDate reached)
//
// Admin override: If event.automationOverrides.<transition> === true,
// that specific transition is skipped (admin will do it manually).
// =============================================

const { Event } = require('./model');
const { Committee } = require('../committee/model');

// Maps: fromStatus → { toStatus, dateField, logVerb }
const TRANSITION_RULES = [
    {
        from: 'published',
        to: 'registration_open',
        dateField: 'settings.registrationStartDate',
        overrideKey: 'skipOpenRegistration',
        logVerb: 'Opening registration for'
    },
    {
        from: 'registration_open',
        to: 'registration_closed',
        dateField: 'settings.registrationEndDate',
        overrideKey: 'skipCloseRegistration',
        logVerb: 'Closing registration for'
    },
    {
        from: 'registration_closed',
        to: 'active',
        dateField: 'startDate',
        overrideKey: 'skipActivate',
        logVerb: 'Activating'
    },
    {
        from: 'active',
        to: 'completed',
        dateField: 'endDate',
        overrideKey: 'skipComplete',
        logVerb: 'Completing'
    }
];

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
            global.logger.warn('Event automation service is already running');
            return;
        }

        this.isRunning = true;

        // Run initial check
        this.checkEventStatuses();

        // Set up interval for periodic checks
        this.intervalId = setInterval(() => {
            this.checkEventStatuses();
        }, this.checkInterval);

        global.logger.info('Event automation service started — checking every 5 minutes');
    }

    /**
     * Stop the automation service
     */
    stop() {
        if (!this.isRunning) return;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        global.logger.info('Event automation service stopped');
    }

    /**
     * Resolve a nested field like 'settings.registrationStartDate' from an event doc
     */
    _getNestedField(event, fieldPath) {
        return fieldPath.split('.').reduce((obj, key) => obj?.[key], event);
    }

    /**
     * Check and update event statuses based on current time
     */
    async checkEventStatuses() {
        try {
            const now = new Date();
            let updatedCount = 0;

            global.logger.debug('Starting automated event status check');

            // Find events in any automatable status (not draft, not completed)
            const candidateStatuses = TRANSITION_RULES.map(r => r.from);
            const events = await Event.find({
                status: { $in: candidateStatuses }
            });

            for (const event of events) {
                const updated = await this.processEventTransition(event, now);
                if (updated) updatedCount++;
            }

            if (updatedCount > 0) {
                global.logger.info(`Automated status update completed: ${updatedCount} event(s) updated`);
            }

        } catch (error) {
            global.logger.error('Error in automated event status check:', error);
        }
    }

    /**
     * Process a single event — find the matching rule and apply if conditions met
     */
    async processEventTransition(event, currentTime = new Date()) {
        try {
            // Find the rule that matches this event's current status
            const rule = TRANSITION_RULES.find(r => r.from === event.status);
            if (!rule) return false;

            // Check admin override
            const overrides = event.automationOverrides || {};
            if (overrides[rule.overrideKey]) {
                // Admin has disabled this automatic transition
                global.logger.debug(`Skipping auto-transition ${rule.from}→${rule.to} for "${event.name}" (admin override: ${rule.overrideKey})`);
                return false;
            }

            // Get the trigger date
            const triggerDate = this._getNestedField(event, rule.dateField);
            if (!triggerDate) {
                // No date configured — can't auto-transition
                return false;
            }

            // Check if the trigger time has passed
            if (currentTime < new Date(triggerDate)) {
                return false;
            }

            // ── Execute transition ──
            const oldStatus = event.status;
            event.status = rule.to;
            event.updatedAt = currentTime;

            await event.save();

            global.logger.info(`${rule.logVerb} event: "${event.name}" (${oldStatus} → ${rule.to})`);

            // Update committee statuses for activate/complete transitions
            if (rule.to === 'active' || rule.to === 'completed') {
                await this.updateCommitteeStatuses(event._id, rule.to);
            }

            // Emit WebSocket event for real-time updates
            if (global.io) {
                global.io.emit('event-status-changed', {
                    eventId: event._id,
                    eventName: event.name,
                    oldStatus,
                    newStatus: rule.to,
                    automated: true,
                    timestamp: currentTime
                });
            }

            return true;

        } catch (error) {
            global.logger.error(`Error processing transition for "${event.name}":`, error);
            return false;
        }
    }

    /**
     * Update committee statuses based on parent event status
     */
    async updateCommitteeStatuses(eventId, eventStatus) {
        try {
            let committeeStatus;

            switch (eventStatus) {
                case 'active':
                    committeeStatus = 'active';
                    break;
                case 'completed':
                    committeeStatus = 'completed';
                    break;
                default:
                    return;
            }

            const result = await Committee.updateMany(
                {
                    event: eventId,
                    status: { $nin: ['completed'] }
                },
                {
                    status: committeeStatus,
                    updatedAt: new Date(),
                    ...(committeeStatus === 'completed' ? { completedAt: new Date() } : {})
                }
            );

            if (result.modifiedCount > 0) {
                global.logger.info(`Updated ${result.modifiedCount} committee(s) to "${committeeStatus}" for event ${eventId}`);

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
            global.logger.error(`Error updating committee statuses for event ${eventId}:`, error);
        }
    }

    /**
     * Manual trigger for event status check
     */
    async runManualCheck() {
        global.logger.info('Manual event status check triggered');
        await this.checkEventStatuses();
    }

    /**
     * Force check all events and update statuses
     */
    async forceCheckAllEvents() {
        try {
            global.logger.info('Force checking all events for status updates');

            const now = new Date();
            const candidateStatuses = TRANSITION_RULES.map(r => r.from);
            const allEvents = await Event.find({
                status: { $in: candidateStatuses }
            });

            let updatedCount = 0;
            for (const event of allEvents) {
                const updated = await this.processEventTransition(event, now);
                if (updated) updatedCount++;
            }

            global.logger.info(`Force check completed: ${updatedCount} event(s) updated out of ${allEvents.length} checked`);
            return { success: true, updatedCount, totalChecked: allEvents.length };

        } catch (error) {
            global.logger.error('Error in force check all events:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if an event is blocking operations
     */
    static isEventBlocked(event, userRole) {
        if (!event) return false;
        if (event.status === 'completed') {
            if (userRole === 'admin') return false;
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
            transitionRules: TRANSITION_RULES.map(r => `${r.from} → ${r.to} (${r.dateField})`),
            nextCheck: this.intervalId ? new Date(Date.now() + this.checkInterval) : null
        };
    }
}

// Create singleton instance
const eventAutomationService = new EventAutomationService();

module.exports = {
    eventAutomationService,
    EventAutomationService,
    TRANSITION_RULES
};