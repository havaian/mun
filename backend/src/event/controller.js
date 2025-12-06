const { Event } = require('./model');

// Get all events (admin only) - UPDATED to include committee statistics
const getAllEvents = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status && ['draft', 'active', 'completed'].includes(status)) {
            filter.status = status;
        }

        // Use aggregation to efficiently get events with committee counts
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'committees',
                    localField: '_id',
                    foreignField: 'eventId',
                    as: 'committees'
                }
            },
            {
                $addFields: {
                    'statistics.totalCommittees': { $size: '$committees' },
                    'statistics.totalParticipants': {
                        $sum: {
                            $map: {
                                input: '$committees',
                                as: 'committee',
                                in: { $size: '$$committee.countries' }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy',
                    pipeline: [{ $project: { username: 1, role: 1 } }]
                }
            },
            {
                $addFields: {
                    createdBy: { $arrayElemAt: ['$createdBy', 0] }
                }
            },
            { $project: { committees: 0 } }, // Remove the committees array to keep response clean
            { $sort: { startDate: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];

        const events = await Event.aggregate(pipeline);

        // Get total count for pagination
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
        global.logger.error('Get all events error:', error);
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
        global.logger.error('Get event error:', error);
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

        // Default position paper deadline to 48 hours before start
        const defaultPositionPaperDeadline = new Date(start.getTime() - 48 * 60 * 60 * 1000);

        const eventData = {
            name: name.trim(),
            description: description?.trim(),
            startDate: start,
            endDate: end,
            settings: {
                registrationDeadline: settings.registrationDeadline ?
                    new Date(settings.registrationDeadline) : defaultRegistrationDeadline,
                positionPaperDeadline: settings.positionPaperDeadline ?
                    new Date(settings.positionPaperDeadline) : defaultPositionPaperDeadline,
                allowLateRegistration: settings.allowLateRegistration || false,
                allowLatePositionPapers: settings.allowLatePositionPapers !== undefined ?
                    settings.allowLatePositionPapers : true,
                timezone: settings.timezone || 'UTC'
            },
            createdBy: req.user.userId,
            // Initialize statistics
            statistics: {
                totalCommittees: 0,
                totalParticipants: 0,
                totalCountries: 0,
                positionPapers: {
                    total: 0,
                    submitted: 0,
                    approved: 0,
                    rejected: 0,
                    underReview: 0,
                    lateSubmissions: 0
                }
            }
        };

        const event = new Event(eventData);
        await event.save();

        await event.populate('createdBy', 'username role');

        global.logger.info(`Event created: ${name} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            event,
            message: 'Event created successfully'
        });

    } catch (error) {
        global.logger.error('Create event error:', error);

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

        // Update statistics after saving
        await event.updateStatistics();

        global.logger.info(`Event updated: ${event.name} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: 'Event updated successfully'
        });

    } catch (error) {
        global.logger.error('Update event error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.message
            });
        }

        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Update event status with active session prevention
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

        // 🚨 PREVENTION: Check for active sessions before completing event
        if (status === 'completed') {
            const Committee = require('../committee/model').Committee;
            const Session = require('../session/model').Session;

            // Get all committees for this event
            const committees = await Committee.find({ eventId: id }).select('_id name');
            const committeeIds = committees.map(c => c._id);

            // Check for active or paused sessions
            const activeSessions = await Session.find({
                committeeId: { $in: committeeIds },
                status: { $in: ['active', 'paused'] }
            }).populate('committeeId', 'name');

            if (activeSessions.length > 0) {
                // Prevent completion and return detailed info about active sessions
                const sessionDetails = activeSessions.map(session => ({
                    sessionId: session._id,
                    sessionNumber: session.number,
                    committeeName: session.committeeId.name,
                    status: session.status,
                    startedAt: session.startedAt
                }));

                return res.status(400).json({
                    error: 'Cannot complete event while sessions are still active',
                    details: `Found ${activeSessions.length} active/paused session(s). Please complete all sessions first.`,
                    activeSessions: sessionDetails,
                    message: 'Complete all sessions before marking the event as completed'
                });
            }
        }

        const oldStatus = event.status;
        event.status = status;
        await event.save();

        // ✅ SAFE COMPLETION: Only complete committees after session check passes
        if (status === 'completed') {
            try {
                const Committee = require('../committee/model').Committee;

                // Complete all committees (now safe since no active sessions)
                const updateResult = await Committee.updateMany(
                    {
                        eventId: id,
                        status: { $ne: 'completed' }
                    },
                    {
                        status: 'completed',
                        completedAt: new Date()
                    }
                );

                global.logger.info(`Event completed: ${event.name}. Completed ${updateResult.modifiedCount} committees.`);

                // Emit WebSocket events to notify committees
                if (req.app.locals.io) {
                    const committees = await Committee.find({ eventId: id });
                    committees.forEach(committee => {
                        const { emitToCommittee } = require('../websocket/socketManager');
                        emitToCommittee(req.app.locals.io, committee._id.toString(), 'committee-completed', {
                            committeeId: committee._id,
                            eventId: id,
                            reason: 'Event completed',
                            completedAt: new Date()
                        });
                    });
                }

            } catch (cascadeError) {
                global.logger.error('Error completing committees:', cascadeError);

                return res.json({
                    success: true,
                    event,
                    message: `Event status updated to ${status}`,
                    warning: 'Event completed but some committees may not have been updated. Please check committee statuses manually.'
                });
            }
        }

        global.logger.info(`Event status changed: ${event.name} from ${oldStatus} to ${status} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: `Event status updated to ${status}`,
            info: status === 'completed' ? 'All associated committees have been completed' : null
        });

    } catch (error) {
        global.logger.error('Update event status error:', error);
        res.status(500).json({ error: 'Failed to update event status' });
    }
};

// Get completion readiness info
const getEventCompletionReadiness = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const Committee = require('../committee/model').Committee;
        const Session = require('../session/model').Session;

        // Get all committees for this event
        const committees = await Committee.find({ eventId: id }).select('_id name status');
        const committeeIds = committees.map(c => c._id);

        // Check for active sessions
        const activeSessions = await Session.find({
            committeeId: { $in: committeeIds },
            status: { $in: ['active', 'paused'] }
        }).populate('committeeId', 'name').select('number title status startedAt committeeId');

        // Check for non-completed committees
        const activeCommittees = committees.filter(c => c.status !== 'completed');

        const readiness = {
            eventId: id,
            eventName: event.name,
            currentStatus: event.status,
            canComplete: activeSessions.length === 0,
            blockers: {
                activeSessions: activeSessions.length,
                activeCommittees: activeCommittees.length
            },
            details: {
                activeSessions: activeSessions.map(session => ({
                    sessionId: session._id,
                    sessionNumber: session.number,
                    title: session.title,
                    status: session.status,
                    committeeName: session.committeeId.name,
                    startedAt: session.startedAt
                })),
                activeCommittees: activeCommittees.map(committee => ({
                    committeeId: committee._id,
                    name: committee.name,
                    status: committee.status
                }))
            }
        };

        res.json({
            success: true,
            readiness
        });

    } catch (error) {
        global.logger.error('Get completion readiness error:', error);
        res.status(500).json({ error: 'Failed to get completion readiness' });
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
        const committeesCount = await Committee.countDocuments({ eventId: id });

        if (committeesCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete event with existing committees',
                details: 'Please delete all committees first before deleting the event'
            });
        }

        // Prevent deletion of active events
        if (event.status === 'active') {
            return res.status(400).json({
                error: 'Cannot delete active events',
                details: 'Please change event status before deletion'
            });
        }

        // Soft delete the event
        await event.softDelete(req.user.userId);

        global.logger.info(`Event soft deleted: ${event.name} by ${req.user.userId}`);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });

    } catch (error) {
        global.logger.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// Restore event (admin only)
const restoreEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Find including soft-deleted events by skipping middleware
        const event = await Event.findOneDeleted({ _id: id });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!event.deletedAt) {
            return res.status(400).json({ error: 'Event is not deleted' });
        }

        // Restore the event
        await event.restore();

        global.logger.info(`Event restored: ${event.name} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: 'Event restored successfully'
        });

    } catch (error) {
        global.logger.error('Restore event error:', error);
        res.status(500).json({ error: 'Failed to restore event' });
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
                    positionPaperSubmissionOpen: event.positionPaperSubmissionOpen,
                    isActive: event.isActive()
                }
            }
        });

    } catch (error) {
        global.logger.error('Get event statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
};

// Check position paper submission status for event
const getPositionPaperStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const status = {
            eventId: id,
            eventName: event.name,
            deadline: event.settings.positionPaperDeadline,
            deadlinePassed: event.isPositionPaperDeadlinePassed(),
            submissionsOpen: event.canSubmitPositionPaper(),
            allowLateSubmissions: event.settings.allowLatePositionPapers,
            timezone: event.settings.timezone,
            currentTimeInTimezone: event.getCurrentTimeInEventTimezone(),
            timeRemaining: null
        };

        // Calculate time remaining if deadline exists and hasn't passed
        if (event.settings.positionPaperDeadline && !status.deadlinePassed) {
            const now = event.getCurrentTimeInEventTimezone();
            const deadline = event.getDateInEventTimezone(event.settings.positionPaperDeadline);
            status.timeRemaining = Math.max(0, deadline.getTime() - now.getTime());
        }

        res.json({
            success: true,
            positionPaperStatus: status
        });

    } catch (error) {
        global.logger.error('Get position paper status error:', error);
        res.status(500).json({ error: 'Failed to fetch position paper status' });
    }
};

// Update position paper deadline for event (admin only)
const updatePositionPaperDeadline = async (req, res) => {
    try {
        const { id } = req.params;
        const { positionPaperDeadline, allowLatePositionPapers } = req.body;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Validate new deadline
        if (positionPaperDeadline) {
            const newDeadline = new Date(positionPaperDeadline);
            if (newDeadline >= event.startDate) {
                return res.status(400).json({
                    error: 'Position paper deadline must be before event start date'
                });
            }
            event.settings.positionPaperDeadline = newDeadline;
        }

        if (allowLatePositionPapers !== undefined) {
            event.settings.allowLatePositionPapers = allowLatePositionPapers;
        }

        await event.save();

        global.logger.info(`Position paper deadline updated for event: ${event.name} by ${req.user.userId}`);

        res.json({
            success: true,
            event,
            message: 'Position paper deadline updated successfully'
        });

    } catch (error) {
        global.logger.error('Update position paper deadline error:', error);
        res.status(500).json({ error: 'Failed to update position paper deadline' });
    }
};

module.exports = {
    getAllEvents,
    getEvent,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    restoreEvent,
    getEventStatistics,
    getPositionPaperStatus,
    updatePositionPaperDeadline,
    getEventCompletionReadiness
};