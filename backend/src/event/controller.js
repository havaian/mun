const { Event } = require('./model');
const logger = require('../utils/logger');

// Get all events (admin only)
const getAllEvents = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status && ['draft', 'active', 'completed'].includes(status)) {
            filter.status = status;
        }

        const events = await Event.find(filter)
            .populate('createdBy', 'username role')
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalEvents = await Event.countDocuments(filter);

        res.json({
            success: true,
            events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalEvents / limit),
                totalEvents,
                hasNext: skip + events.length < totalEvents,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error('Get all events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Get single event by ID
const getEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id)
            .populate('createdBy', 'username role');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Update statistics before returning
        await event.updateStatistics();

        res.json({
            success: true,
            event
        });

    } catch (error) {
        logger.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

// Create new event (admin only)
const createEvent = async (req, res) => {
    try {
        const {
            name,
            description,
            startDate,
            endDate,
            settings = {}
        } = req.body;

        // Validate required fields
        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Name, start date, and end date are required'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start >= end) {
            return res.status(400).json({
                error: 'End date must be after start date'
            });
        }

        // Default registration deadline to 24 hours before start
        const defaultRegistrationDeadline = new Date(start.getTime() - 24 * 60 * 60 * 1000);

        const eventData = {
            name: name.trim(),
            description: description?.trim(),
            startDate: start,
            endDate: end,
            settings: {
                registrationDeadline: settings.registrationDeadline ?
                    new Date(settings.registrationDeadline) : defaultRegistrationDeadline,
                allowLateRegistration: settings.allowLateRegistration || false,
                timezone: settings.timezone || 'UTC'
            },
            createdBy: req.user.userId
        };

        const event = new Event(eventData);
        await event.save();

        await event.populate('createdBy', 'username role');

        logger.info(`Event created: ${name} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            event,
            message: 'Event created successfully'
        });

    } catch (error) {
        logger.error('Create event error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.message
            });
        }

        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Update event (admin only)
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Prevent updating completed events
        if (event.status === 'completed') {
            return res.status(400).json({
                error: 'Cannot update completed events'
            });
        }

        // Handle nested settings updates
        if (updates.settings) {
            event.settings = { ...event.settings.toObject(), ...updates.settings };
            delete updates.settings;
        }

        // Apply other updates
        Object.keys(updates).forEach(key => {
            if (key !== 'createdBy' && key !== '_id') {
                event[key] = updates[key];
            }
        });

        await event.save();
        await event.populate('createdBy', 'username role');

        logger.info(`Event updated: ${event.name} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: 'Event updated successfully'
        });

    } catch (error) {
        logger.error('Update event error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.message
            });
        }

        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Update event status
const updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['draft', 'active', 'completed'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be draft, active, or completed'
            });
        }

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const oldStatus = event.status;
        event.status = status;
        await event.save();

        logger.info(`Event status changed: ${event.name} from ${oldStatus} to ${status} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: `Event status updated to ${status}`
        });

    } catch (error) {
        logger.error('Update event status error:', error);
        res.status(500).json({ error: 'Failed to update event status' });
    }
};

// Delete event (admin only)
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if event has committees
        const Committee = require('../committee/model').Committee;
        const committeeCount = await Committee.countDocuments({ eventId: id });

        if (committeeCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete event with existing committees',
                details: `Event has ${committeeCount} committee(s). Delete committees first.`
            });
        }

        await Event.findByIdAndDelete(id);

        logger.info(`Event deleted: ${event.name} by ${req.user.userId}`);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });

    } catch (error) {
        logger.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// Get event statistics
const getEventStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Update and get fresh statistics
        await event.updateStatistics();

        // Get additional committee-level statistics
        const Committee = require('../committee/model').Committee;
        const committees = await Committee.find({ eventId: id })
            .select('name status countries statistics');

        const committeeStats = committees.map(committee => ({
            name: committee.name,
            status: committee.status,
            participantCount: committee.countries.length,
            statistics: committee.statistics
        }));

        res.json({
            success: true,
            statistics: {
                event: event.statistics,
                committees: committeeStats,
                summary: {
                    totalCommittees: event.statistics.totalCommittees,
                    totalParticipants: event.statistics.totalParticipants,
                    totalCountries: event.statistics.totalCountries,
                    eventDuration: event.duration,
                    registrationOpen: event.registrationOpen,
                    isActive: event.isActive()
                }
            }
        });

    } catch (error) {
        logger.error('Get event statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
};

module.exports = {
    getAllEvents,
    getEvent,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    getEventStatistics
};