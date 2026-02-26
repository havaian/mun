const { EventParticipant, EVENT_ROLES, PRESIDIUM_ROLES } = require('./model');
const { Event } = require('../event/model');
const { User } = require('../auth/model');

// Get all participants for an event (optionally filtered by committee)
const getParticipants = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { committee, role, status = 'active', page = 1, limit = 100 } = req.query;

        const filter = { event: eventId };
        if (committee) filter.committee = committee;
        if (role) filter.role = role;
        if (status !== 'all') filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [participants, total] = await Promise.all([
            EventParticipant.find(filter)
                .populate('user', 'firstName lastName email avatar institution')
                .populate('committee', 'name acronym')
                .populate('assignedBy', 'firstName lastName email')
                .populate('registrationApplication', 'payment currentStage')
                .sort({ role: 1, 'country.name': 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            EventParticipant.countDocuments(filter)
        ]);

        res.json({
            success: true,
            participants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get participants error:', error);
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
};

// Get a single participant
const getParticipant = async (req, res) => {
    try {
        const { eventId, participantId } = req.params;

        const participant = await EventParticipant.findOne({ _id: participantId, event: eventId })
            .populate('user', 'firstName lastName email avatar institution phone dateOfBirth languageProficiency')
            .populate('committee', 'name acronym type')
            .populate('assignedBy', 'firstName lastName email')
            .populate('registrationApplication', 'payment currentStage');

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        res.json({ success: true, participant });
    } catch (error) {
        global.logger.error('Get participant error:', error);
        res.status(500).json({ error: 'Failed to fetch participant' });
    }
};

// Add participant to event (direct assignment)
const addParticipant = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { userId, committeeId, role, country } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ error: 'User ID and role are required' });
        }

        if (!EVENT_ROLES.includes(role)) {
            return res.status(400).json({
                error: `Invalid role. Must be one of: ${EVENT_ROLES.join(', ')}`
            });
        }

        // Validate user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Delegates must have a committee
        if (role === 'delegate' && !committeeId) {
            return res.status(400).json({ error: 'Delegates must be assigned to a committee' });
        }

        // Delegates must have a country
        if (role === 'delegate' && (!country || !country.name || !country.code)) {
            return res.status(400).json({ error: 'Delegates must be assigned a country (name and code required)' });
        }

        // Presidium must have a committee
        if (PRESIDIUM_ROLES.includes(role) && !committeeId) {
            return res.status(400).json({ error: 'Presidium members must be assigned to a committee' });
        }

        // Check for duplicate country in the same committee
        if (role === 'delegate' && country?.code && committeeId) {
            const existingCountry = await EventParticipant.findOne({
                event: eventId,
                committee: committeeId,
                'country.code': country.code.toLowerCase(),
                status: 'active'
            });

            if (existingCountry) {
                return res.status(409).json({
                    error: `Country ${country.name} is already assigned in this committee`
                });
            }
        }

        const participant = new EventParticipant({
            user: userId,
            event: eventId,
            committee: committeeId || null,
            role,
            country: role === 'delegate' ? {
                name: country.name,
                code: country.code.toLowerCase(),
                flag: country.flag || null
            } : { name: null, code: null, flag: null },
            source: 'direct_assignment',
            assignedBy: req.user.userId
        });

        await participant.save();
        await participant.populate('user', 'firstName lastName email avatar');
        await participant.populate('committee', 'name acronym');

        // Update event statistics
        try { await event.updateStatistics(); } catch (e) { /* non-fatal */ }

        global.logger.info(`Participant added: ${user.email} as ${role} to event ${event.name}`);

        res.status(201).json({
            success: true,
            participant,
            message: 'Participant added successfully'
        });
    } catch (error) {
        global.logger.error('Add participant error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                error: 'This participant already has this role in this committee'
            });
        }

        res.status(500).json({ error: 'Failed to add participant' });
    }
};

// Update participant (change role, committee, country, status, user profile)
const updateParticipant = async (req, res) => {
    try {
        const { eventId, participantId } = req.params;
        const updates = req.body;

        const participant = await EventParticipant.findOne({ _id: participantId, event: eventId });
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // ── Status update ──
        if (updates.status) {
            const validStatuses = ['active', 'inactive', 'removed'];
            if (!validStatuses.includes(updates.status)) {
                return res.status(400).json({
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }
            participant.status = updates.status;
        }

        // Don't allow editing other fields on removed participants (unless reactivating)
        if (participant.status === 'removed' && updates.status !== 'active') {
            // Only allow status change for removed participants
            if (updates.role || updates.committeeId !== undefined || updates.country || updates.userProfile) {
                return res.status(400).json({
                    error: 'Cannot edit a removed participant. Reactivate first by setting status to active.'
                });
            }
        }

        // ── Role update ──
        if (updates.role) {
            if (!EVENT_ROLES.includes(updates.role)) {
                return res.status(400).json({
                    error: `Invalid role. Must be one of: ${EVENT_ROLES.join(', ')}`
                });
            }
            participant.role = updates.role;
        }

        // ── Committee update ──
        const committeeChanged = updates.committeeId !== undefined &&
            (updates.committeeId || null)?.toString() !== (participant.committee || null)?.toString();

        if (updates.committeeId !== undefined) {
            participant.committee = updates.committeeId || null;

            // If committee changed and no new country provided, clear country
            // (the frontend should send a new country along with the committee change for delegates)
            if (committeeChanged && !updates.country) {
                participant.country = { name: null, code: null, flag: null };
            }
        }

        // ── Country update (for delegates) ──
        if (updates.country) {
            const targetCommittee = participant.committee;

            // Check duplicate country if changing
            if (updates.country.code && targetCommittee) {
                const existingCountry = await EventParticipant.findOne({
                    _id: { $ne: participantId },
                    event: eventId,
                    committee: targetCommittee,
                    'country.code': updates.country.code.toLowerCase(),
                    status: 'active'
                });

                if (existingCountry) {
                    return res.status(409).json({
                        error: `Country ${updates.country.name} is already assigned in this committee`
                    });
                }
            }

            participant.country = {
                name: updates.country.name || null,
                code: updates.country.code?.toLowerCase() || null,
                flag: updates.country.flag || null
            };
        }

        // Clear country for non-delegate roles
        const currentRole = updates.role || participant.role;
        if (currentRole !== 'delegate') {
            participant.country = { name: null, code: null, flag: null };
        }

        await participant.save();

        // ── User profile update (admin editing another user) ──
        if (updates.userProfile && typeof updates.userProfile === 'object') {
            const user = await User.findById(participant.user);
            if (user) {
                const allowedUserFields = ['firstName', 'lastName', 'phone', 'institution'];
                let userChanged = false;

                allowedUserFields.forEach(field => {
                    if (updates.userProfile[field] !== undefined) {
                        user[field] = updates.userProfile[field];
                        userChanged = true;
                    }
                });

                if (userChanged) {
                    await user.save();
                    global.logger.info(`User profile updated by admin: ${user.email} (by ${req.user.userId})`);
                }
            }
        }

        // Re-populate with full fields for the response
        await participant.populate('user', 'firstName lastName email avatar institution phone');
        await participant.populate('committee', 'name acronym');
        await participant.populate('assignedBy', 'firstName lastName email');

        // Update event statistics if status changed
        if (updates.status) {
            try {
                const event = await Event.findById(eventId);
                if (event) await event.updateStatistics();
            } catch (e) { /* non-fatal */ }
        }

        global.logger.info(`Participant updated: ${participantId} in event ${eventId} by ${req.user.userId}`);

        res.json({ success: true, participant, message: 'Participant updated' });
    } catch (error) {
        global.logger.error('Update participant error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Duplicate assignment conflict. This user may already have this role in this committee.'
            });
        }

        res.status(500).json({ error: 'Failed to update participant' });
    }
};

// Remove participant (set inactive)
const removeParticipant = async (req, res) => {
    try {
        const { eventId, participantId } = req.params;

        const participant = await EventParticipant.findOne({ _id: participantId, event: eventId });
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        participant.status = 'removed';
        await participant.save();

        // Update event statistics
        try {
            const event = await Event.findById(eventId);
            if (event) await event.updateStatistics();
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Participant removed: ${participantId} from event ${eventId} by ${req.user.userId}`);

        res.json({ success: true, message: 'Participant removed' });
    } catch (error) {
        global.logger.error('Remove participant error:', error);
        res.status(500).json({ error: 'Failed to remove participant' });
    }
};

// Get participants grouped by committee (useful for overview/dashboard)
const getParticipantsByCommittee = async (req, res) => {
    try {
        const { eventId } = req.params;

        const grouped = await EventParticipant.aggregate([
            { $match: { event: new (require('mongoose').Types.ObjectId)(eventId), status: 'active' } },
            {
                $group: {
                    _id: { committee: '$committee', role: '$role' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.committee',
                    roles: {
                        $push: {
                            role: '$_id.role',
                            count: '$count'
                        }
                    },
                    totalParticipants: { $sum: '$count' }
                }
            }
        ]);

        // Populate committee names
        const { Committee } = require('../committee/model');
        const committeeIds = grouped.map(g => g._id).filter(Boolean);
        const committees = await Committee.find({ _id: { $in: committeeIds } })
            .select('name acronym')
            .lean();

        const committeeMap = {};
        committees.forEach(c => { committeeMap[c._id.toString()] = c; });

        const result = grouped.map(g => ({
            committee: g._id ? committeeMap[g._id.toString()] || { _id: g._id } : { name: 'Unassigned' },
            roles: g.roles,
            totalParticipants: g.totalParticipants
        }));

        res.json({ success: true, committees: result });
    } catch (error) {
        global.logger.error('Get participants by committee error:', error);
        res.status(500).json({ error: 'Failed to fetch participant summary' });
    }
};

// Get the current user's participation in an event
const getMyParticipation = async (req, res) => {
    try {
        const { eventId } = req.params;

        const participations = await EventParticipant.find({
            user: req.user.userId,
            event: eventId,
            status: 'active'
        })
            .populate('committee', 'name acronym type status')
            .populate('event', 'name slug status organization')
            .lean();

        res.json({ success: true, participations });
    } catch (error) {
        global.logger.error('Get my participation error:', error);
        res.status(500).json({ error: 'Failed to fetch participation info' });
    }
};

// Search users for participant assignment (Org Admin only)
// GET /api/organizations/:orgId/events/:eventId/participants/search-users?q=email_or_name
const searchUsers = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const query = q.trim();
        const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const users = await User.find({
            status: 'active',
            $or: [
                { email: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex },
                { institution: searchRegex }
            ]
        })
            .select('firstName lastName email phone institution avatar dateOfBirth languageProficiency')
            .limit(20)
            .lean();

        // For each user, check if they're already a participant in this event
        const existingParticipants = await EventParticipant.find({
            event: eventId,
            user: { $in: users.map(u => u._id) },
            status: 'active'
        })
            .select('user role committee')
            .populate('committee', 'name acronym')
            .lean();

        const participantMap = {};
        existingParticipants.forEach(p => {
            const uid = p.user.toString();
            if (!participantMap[uid]) participantMap[uid] = [];
            participantMap[uid].push({
                role: p.role,
                committee: p.committee?.acronym || p.committee?.name || null
            });
        });

        const enriched = users.map(u => ({
            ...u,
            existingRoles: participantMap[u._id.toString()] || []
        }));

        res.json({ success: true, users: enriched });
    } catch (error) {
        global.logger.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
};

module.exports = {
    getParticipants,
    getParticipant,
    addParticipant,
    updateParticipant,
    removeParticipant,
    getParticipantsByCommittee,
    getMyParticipation,
    searchUsers,
};