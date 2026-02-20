const { Event } = require('./model');
const { Organization } = require('../organization/model');

// Get all events for an organization
const getEvents = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;

        const filter = { organization: orgId };
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [events, total] = await Promise.all([
            Event.find(filter)
                .populate('createdBy', 'firstName lastName email')
                .sort({ startDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Event.countDocuments(filter)
        ]);

        res.json({
            success: true,
            events,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Get single event by ID or slug
const getEvent = async (req, res) => {
    try {
        const { orgId, eventIdentifier } = req.params;

        let event;
        if (eventIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
            event = await Event.findOne({ _id: eventIdentifier, organization: orgId })
                .populate('createdBy', 'firstName lastName email')
                .populate('organization', 'name slug logo');
        }
        if (!event) {
            event = await Event.findOne({ slug: eventIdentifier, organization: orgId })
                .populate('createdBy', 'firstName lastName email')
                .populate('organization', 'name slug logo');
        }

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true, event });
    } catch (error) {
        global.logger.error('Get event error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

// Create event (Org Admin only — enforced by route middleware)
const createEvent = async (req, res) => {
    try {
        const { orgId } = req.params;
        const {
            name,
            description,
            location,
            startDate,
            endDate,
            timezone,
            settings = {},
            logo,
            photos
        } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Name, start date, and end date are required'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        // Verify org exists
        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Generate slug
        const slug = await Event.generateSlug(name, orgId);

        // Default deadlines relative to start
        const defaultRegEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        const defaultPPDeadline = new Date(start.getTime() - 48 * 60 * 60 * 1000);

        const event = new Event({
            organization: orgId,
            name: name.trim(),
            slug,
            description: description?.trim() || null,
            location: location?.trim() || null,
            logo: logo || null,
            photos: photos || [],
            startDate: start,
            endDate: end,
            timezone: timezone || 'UTC',
            settings: {
                registrationStartDate: settings.registrationStartDate
                    ? new Date(settings.registrationStartDate) : null,
                registrationEndDate: settings.registrationEndDate
                    ? new Date(settings.registrationEndDate) : defaultRegEnd,
                positionPaperDeadline: settings.positionPaperDeadline
                    ? new Date(settings.positionPaperDeadline) : defaultPPDeadline,
                allowLateRegistration: settings.allowLateRegistration || false,
                allowLatePositionPapers: settings.allowLatePositionPapers !== undefined
                    ? settings.allowLatePositionPapers : true
            },
            createdBy: req.user.userId,
            statistics: {
                totalCommittees: 0,
                totalParticipants: 0,
                totalCountries: 0,
                totalApplications: 0
            }
        });

        await event.save();
        await event.populate('createdBy', 'firstName lastName email');
        await event.populate('organization', 'name slug');

        global.logger.info(`Event created: ${name} (${slug}) in org ${orgId} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            event,
            message: 'Event created successfully'
        });
    } catch (error) {
        global.logger.error('Create event error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'An event with this slug already exists in this organization' });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation error', details: error.message });
        }

        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Update event
const updateEvent = async (req, res) => {
    try {
        const { orgId, eventId } = req.params;
        const updates = req.body;

        const event = await Event.findOne({ _id: eventId, organization: orgId });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.status === 'completed') {
            return res.status(400).json({ error: 'Cannot update completed events' });
        }

        // Allowed fields
        const allowedFields = [
            'name', 'description', 'location', 'startDate', 'endDate',
            'timezone', 'logo', 'heroImage', 'photos', 'sponsors'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                event[field] = updates[field];
            }
        });

        // Handle nested settings
        if (updates.settings) {
            event.settings = { ...event.settings.toObject(), ...updates.settings };
        }

        // Re-generate slug if name changed
        if (updates.name && updates.name !== event.name) {
            event.slug = await Event.generateSlug(updates.name, orgId, event._id);
        }

        await event.save();
        await event.populate('createdBy', 'firstName lastName email');

        global.logger.info(`Event updated: ${event.name} by ${req.user.userId}`);

        res.json({ success: true, event, message: 'Event updated successfully' });
    } catch (error) {
        global.logger.error('Update event error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Update event status
const updateEventStatus = async (req, res) => {
    try {
        const { orgId, eventId } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'published', 'registration_open', 'registration_closed', 'active', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const event = await Event.findOne({ _id: eventId, organization: orgId });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Flexible status transitions — everything reversible except completed
        const STATUS_FLOW = {
            draft: ['published'],
            published: ['registration_open', 'draft'],
            registration_open: ['registration_closed', 'published'],
            registration_closed: ['active', 'registration_open'],
            active: ['completed', 'registration_open'],
            completed: [],
        };

        const allowed = STATUS_FLOW[event.status] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                error: `Cannot move from "${event.status}" to "${status}". Allowed transitions: ${allowed.join(', ') || 'none (event is completed)'}`
            });
        }

        const oldStatus = event.status;
        event.status = status;
        await event.save();
        await event.populate('createdBy', 'firstName lastName email');
        await event.populate('organization', 'name slug');

        // Emit WebSocket event for real-time updates
        if (global.io) {
            global.io.emit('event-status-changed', {
                eventId: event._id,
                eventName: event.name,
                oldStatus,
                newStatus: status,
                timestamp: new Date()
            });
        }

        global.logger.info(`Event status changed: ${event.name} from ${oldStatus} to ${status} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: `Event moved from ${oldStatus} to ${status}`
        });
    } catch (error) {
        global.logger.error('Update event status error:', error);
        res.status(500).json({ error: 'Failed to update event status' });
    }
};

// Delete event (Org Admin only)
const deleteEvent = async (req, res) => {
    try {
        const { orgId, eventId } = req.params;

        const event = await Event.findOne({ _id: eventId, organization: orgId });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.status === 'active') {
            return res.status(400).json({ error: 'Cannot delete an active event. Complete it first.' });
        }

        // TODO: cascade delete committees, participants, etc.
        await Event.findByIdAndDelete(eventId);

        global.logger.info(`Event deleted: ${event.name} by ${req.user.userId}`);

        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        global.logger.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// Get event statistics
const getEventStatistics = async (req, res) => {
    try {
        const { orgId, eventId } = req.params;

        const event = await Event.findOne({ _id: eventId, organization: orgId })
            .select('statistics name slug status')
            .lean();

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true, statistics: event.statistics, event: { name: event.name, slug: event.slug, status: event.status } });
    } catch (error) {
        global.logger.error('Get event statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    getEventStatistics
};