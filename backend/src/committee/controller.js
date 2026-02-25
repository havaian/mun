const { Committee } = require('./model');
const { Event } = require('../event/model');
const { EventParticipant, PRESIDIUM_ROLES } = require('../participant/model');

// =============================================
// NOTE: All permission checks (orgAdmin, orgPermission, participant, presidium)
// are handled by route middleware. Controllers only validate business logic.
//
// Available on req from middleware:
//   req.params.orgId, req.params.eventId, req.params.committeeId
//   req.organization, req.event (from eventContext)
//   req.isOrgAdmin, req.isSuperAdmin
//   req.participant (from participant middleware, when applied)
//   req.user.userId, req.user.email
// =============================================

// =============================================
// COMMITTEE CRUD
// =============================================

// Create new committee
// Route auth: orgPermission('manage_event_content') or orgAdmin
const createCommittee = async (req, res) => {
    try {
        const { eventId } = req.params;
        const {
            name,
            acronym,
            type,
            topic,
            description,
            language = 'en'
        } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.status === 'completed') {
            return res.status(400).json({ error: 'Cannot create committee for completed event' });
        }

        // Check committee limit
        const existingCount = await Committee.countDocuments({ event: eventId });
        const maxCommittees = event.settings?.maxCommittees || 50;
        if (existingCount >= maxCommittees) {
            return res.status(400).json({
                error: `Maximum number of committees (${maxCommittees}) reached`
            });
        }

        const committee = new Committee({
            event: eventId,
            name: name.trim(),
            acronym: acronym?.trim(),
            type,
            topic: topic?.trim() || null,
            description: description?.trim(),
            language
        });

        await committee.save();

        // Update event statistics
        try {
            await event.updateStatistics();
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Committee created: ${committee.name} (${committee.acronym}) for event ${eventId}`);

        res.status(201).json({
            success: true,
            committee,
            message: 'Committee created successfully'
        });

    } catch (error) {
        global.logger.error('Create committee error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation error', details: error.message });
        }

        res.status(500).json({ error: 'Failed to create committee' });
    }
};

// Get all committees for an event
// Route auth: token + eventContext
const getCommittees = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 50, status, search } = req.query;

        const filter = { event: eventId };
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { acronym: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const [committees, total] = await Promise.all([
            Committee.find(filter)
                .select('name acronym description type topic status language event countries presidium createdAt updatedAt')
                .populate('event', 'name status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Committee.countDocuments(filter)
        ]);

        // Enrich with participant counts from EventParticipant
        const committeeIds = committees.map(c => c._id);
        const participantCounts = await EventParticipant.aggregate([
            {
                $match: {
                    event: committees[0]?.event?._id || null,
                    committee: { $in: committeeIds },
                    status: 'active'
                }
            },
            {
                $group: {
                    _id: { committee: '$committee', isPresidium: { $cond: [{ $in: ['$role', PRESIDIUM_ROLES] }, true, false] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap = {};
        participantCounts.forEach(p => {
            const cId = p._id.committee.toString();
            if (!countMap[cId]) countMap[cId] = { delegates: 0, presidium: 0 };
            if (p._id.isPresidium) {
                countMap[cId].presidium = p.count;
            } else {
                countMap[cId].delegates = p.count;
            }
        });

        const enriched = committees.map(c => ({
            ...c,
            countriesCount: c.countries?.length || 0,
            presidiumCount: countMap[c._id.toString()]?.presidium || 0,
            delegatesCount: countMap[c._id.toString()]?.delegates || 0,
        }));

        res.json({
            success: true,
            committees: enriched,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limitNum),
                total,
                hasNext: skip + committees.length < total,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        global.logger.error('Get committees error:', error);
        res.status(500).json({ error: 'Failed to fetch committees' });
    }
};

// Get committee by ID
// Route auth: participant('committeeId') — org admins auto-pass
const getCommittee = async (req, res) => {
    try {
        const { committeeId, eventId } = req.params;

        const committee = await Committee.findById(committeeId)
            .populate('event', 'name status startDate endDate organization');

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Fetch presidium from EventParticipant
        const presidiumParticipants = await EventParticipant.find({
            committee: committeeId,
            role: { $in: PRESIDIUM_ROLES },
            status: 'active'
        })
            .populate('user', 'firstName lastName email')
            .populate('assignedBy', 'firstName lastName')
            .lean();

        const committeeObj = committee.toObject();
        committeeObj.presidiumParticipants = presidiumParticipants;

        res.json({
            success: true,
            committee: committeeObj
        });

    } catch (error) {
        global.logger.error('Get committee error:', error);
        res.status(500).json({ error: 'Failed to fetch committee' });
    }
};

// Update committee settings
// Route auth: presidium (in this committee) or orgAdmin/orgPermission
const updateCommittee = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const updates = req.body;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (committee.status === 'completed') {
            return res.status(400).json({ error: 'Cannot update completed committee' });
        }

        // Handle nested settings updates
        if (updates.settings) {
            committee.settings = { ...committee.settings?.toObject?.(), ...updates.settings };
            delete updates.settings;
        }

        // Apply whitelisted field updates
        const allowedFields = ['name', 'acronym', 'description', 'language', 'status', 'countries', 'type', 'topic'];
        for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key)) {
                committee[key] = updates[key];
            }
        }

        await committee.save();

        global.logger.info(`Committee updated: ${committee.name} by ${req.user.userId}`);

        res.json({
            success: true,
            committee,
            message: 'Committee updated successfully'
        });

    } catch (error) {
        global.logger.error('Update committee error:', error);
        res.status(500).json({ error: 'Failed to update committee' });
    }
};

// Delete committee (soft delete)
// Route auth: orgAdmin only
const deleteCommittee = async (req, res) => {
    try {
        const { committeeId } = req.params;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        await committee.softDelete(req.user.userId);

        // Deactivate all participants in this committee
        await EventParticipant.updateMany(
            { committee: committeeId, status: 'active' },
            { status: 'inactive' }
        );

        // Update event statistics
        try {
            const event = await Event.findById(committee.event);
            if (event) await event.updateStatistics();
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Committee soft deleted: ${committee.name} by ${req.user.userId}`);

        res.json({
            success: true,
            message: 'Committee deleted successfully'
        });

    } catch (error) {
        global.logger.error('Delete committee error:', error);
        res.status(500).json({ error: 'Failed to delete committee' });
    }
};

// Restore committee
// Route auth: orgAdmin only
const restoreCommittee = async (req, res) => {
    try {
        const { committeeId } = req.params;

        const committee = await Committee.findOneDeleted({ _id: committeeId });
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (!committee.deletedAt) {
            return res.status(400).json({ error: 'Committee is not deleted' });
        }

        await committee.restore();

        // Reactivate participants
        await EventParticipant.updateMany(
            { committee: committeeId, status: 'inactive' },
            { status: 'active' }
        );

        try {
            const event = await Event.findById(committee.event);
            if (event) await event.updateStatistics();
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Committee restored: ${committee.name} by ${req.user.userId}`);

        res.json({
            success: true,
            committee,
            message: 'Committee restored successfully'
        });

    } catch (error) {
        global.logger.error('Restore committee error:', error);
        res.status(500).json({ error: 'Failed to restore committee' });
    }
};

// =============================================
// COUNTRY MANAGEMENT
// =============================================

// Add countries to committee's available pool
// Route auth: presidium or orgAdmin/orgPermission
const addCountries = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { countries } = req.body;

        if (!Array.isArray(countries) || countries.length === 0) {
            return res.status(400).json({ error: 'Countries array is required and must not be empty' });
        }

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const addedCountries = [];
        const errors = [];

        for (const countryData of countries) {
            try {
                const country = committee.addCountry(countryData);
                addedCountries.push(country);
            } catch (error) {
                errors.push({ country: countryData.name, error: error.message });
            }
        }

        if (addedCountries.length > 0) {
            await committee.save();

            // Update event statistics
            try {
                const event = await Event.findById(committee.event);
                if (event) await event.updateStatistics();
            } catch (e) { /* non-fatal */ }
        }

        global.logger.info(`Countries added to ${committee.name}: ${addedCountries.length} ok, ${errors.length} failed`);

        res.json({
            success: true,
            added: addedCountries,
            errors,
            message: `${addedCountries.length} countries added successfully`
        });

    } catch (error) {
        global.logger.error('Add countries error:', error);
        res.status(500).json({ error: 'Failed to add countries' });
    }
};

// Remove country from committee's available pool
// Route auth: presidium or orgAdmin/orgPermission
const removeCountry = async (req, res) => {
    try {
        const { committeeId, countryName } = req.params;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Find the country code before removing (for participant cleanup)
        const countryDef = committee.countries.find(c => c.name === countryName);
        const countryCode = countryDef?.code;

        committee.removeCountry(countryName);
        await committee.save();

        // Deactivate any delegate assigned to this country in this committee
        if (countryCode) {
            const removed = await EventParticipant.updateMany(
                {
                    committee: committeeId,
                    'country.code': countryCode,
                    role: 'delegate',
                    status: 'active'
                },
                { status: 'removed' }
            );

            if (removed.modifiedCount > 0) {
                global.logger.info(`Deactivated ${removed.modifiedCount} delegate(s) for removed country ${countryName}`);
            }
        }

        global.logger.info(`Country removed from ${committee.name}: ${countryName}`);

        res.json({
            success: true,
            message: `Country "${countryName}" removed successfully`
        });

    } catch (error) {
        global.logger.error('Remove country error:', error);

        if (error.message?.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to remove country' });
    }
};

// Get countries for committee
// Route auth: participant('committeeId') — any participant or orgAdmin
const getCountries = async (req, res) => {
    try {
        const { committeeId, eventId } = req.params;

        const committee = await Committee.findById(committeeId).select('countries').lean();
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Enrich with assignment info from EventParticipant
        const assignments = await EventParticipant.find({
            committee: committeeId,
            role: 'delegate',
            status: 'active',
            'country.code': { $ne: null }
        })
            .populate('user', 'firstName lastName email')
            .select('country user')
            .lean();

        const assignmentMap = {};
        assignments.forEach(a => {
            if (a.country?.code) assignmentMap[a.country.code] = a;
        });

        const enrichedCountries = (committee.countries || []).map(c => ({
            ...c,
            assignedTo: assignmentMap[c.code] ? {
                userId: assignmentMap[c.code].user?._id,
                name: `${assignmentMap[c.code].user?.firstName || ''} ${assignmentMap[c.code].user?.lastName || ''}`.trim(),
                email: assignmentMap[c.code].user?.email
            } : null
        }));

        res.json({
            success: true,
            countries: enrichedCountries
        });

    } catch (error) {
        global.logger.error('Get countries error:', error);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};

// Update country status within a committee
// Route auth: presidium or orgAdmin/orgPermission
const updateCountryStatus = async (req, res) => {
    try {
        const { committeeId, countryName } = req.params;
        const { status, specialRole } = req.body;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const updates = {};
        if (status !== undefined) updates.isActive = status === 'active';
        if (specialRole !== undefined) updates.specialRole = specialRole;

        const country = committee.updateCountry(countryName, updates);
        await committee.save();

        res.json({
            success: true,
            country,
            message: 'Country status updated successfully'
        });

    } catch (error) {
        global.logger.error('Update country status error:', error);
        res.status(500).json({ error: 'Failed to update country status' });
    }
};

// =============================================
// PRESIDIUM MANAGEMENT (via EventParticipant)
// =============================================

// Assign presidium members to a committee
// Route auth: orgAdmin only
//
// Expects: { members: [{ userId, role }] }
// where role is one of: presidium_chair, presidium_cochair, presidium_expert, presidium_secretary
const updatePresidium = async (req, res) => {
    try {
        const { committeeId, eventId } = req.params;
        const { members } = req.body;

        if (!Array.isArray(members)) {
            return res.status(400).json({ error: 'members must be an array of { userId, role }' });
        }

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Validate roles
        for (const m of members) {
            if (!m.userId || !m.role) {
                return res.status(400).json({ error: 'Each member must have userId and role' });
            }
            if (!PRESIDIUM_ROLES.includes(m.role)) {
                return res.status(400).json({
                    error: `Invalid presidium role: ${m.role}. Valid: ${PRESIDIUM_ROLES.join(', ')}`
                });
            }
        }

        // Remove existing presidium participants for this committee
        await EventParticipant.updateMany(
            {
                committee: committeeId,
                role: { $in: PRESIDIUM_ROLES },
                status: 'active'
            },
            { status: 'removed' }
        );

        // Create new presidium participants
        const created = [];
        const errors = [];

        for (const m of members) {
            try {
                const participant = new EventParticipant({
                    user: m.userId,
                    event: eventId,
                    committee: committeeId,
                    role: m.role,
                    source: 'direct_assignment',
                    assignedBy: req.user.userId,
                    status: 'active'
                });
                await participant.save();
                created.push(participant);
            } catch (e) {
                if (e.code === 11000) {
                    errors.push({ userId: m.userId, role: m.role, error: 'Duplicate assignment' });
                } else {
                    errors.push({ userId: m.userId, role: m.role, error: e.message });
                }
            }
        }

        // Populate for response
        const presidium = await EventParticipant.find({
            committee: committeeId,
            role: { $in: PRESIDIUM_ROLES },
            status: 'active'
        })
            .populate('user', 'firstName lastName email')
            .lean();

        global.logger.info(`Presidium updated for ${committee.name}: ${created.length} assigned, ${errors.length} failed`);

        res.json({
            success: true,
            presidium,
            errors: errors.length > 0 ? errors : undefined,
            message: `${created.length} presidium member(s) assigned`
        });

    } catch (error) {
        global.logger.error('Update presidium error:', error);
        res.status(500).json({ error: 'Failed to update presidium' });
    }
};

// Get presidium status for committee
// Route auth: presidium in this committee or orgAdmin
const getPresidiumStatus = async (req, res) => {
    try {
        const { committeeId } = req.params;

        const presidium = await EventParticipant.find({
            committee: committeeId,
            role: { $in: PRESIDIUM_ROLES },
            status: 'active'
        })
            .populate('user', 'firstName lastName email emailVerified lastLogin')
            .populate('assignedBy', 'firstName lastName')
            .lean();

        // Build status per role
        const roleLabels = {
            presidium_chair: 'Chair',
            presidium_cochair: 'Co-Chair',
            presidium_expert: 'Expert',
            presidium_secretary: 'Secretary'
        };

        const statusByRole = PRESIDIUM_ROLES.map(role => {
            const member = presidium.find(p => p.role === role);
            return {
                role,
                label: roleLabels[role],
                assigned: !!member,
                user: member ? {
                    _id: member.user?._id,
                    name: `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim(),
                    email: member.user?.email,
                    emailVerified: member.user?.emailVerified || false,
                    lastLogin: member.user?.lastLogin || null
                } : null,
                assignedBy: member?.assignedBy ? {
                    name: `${member.assignedBy.firstName || ''} ${member.assignedBy.lastName || ''}`.trim()
                } : null,
                assignedAt: member?.createdAt || null
            };
        });

        res.json({
            success: true,
            presidiumStatus: statusByRole,
            summary: {
                totalRoles: PRESIDIUM_ROLES.length,
                assignedRoles: presidium.length,
                verifiedRoles: presidium.filter(p => p.user?.emailVerified).length
            }
        });

    } catch (error) {
        global.logger.error('Get presidium status error:', error);
        res.status(500).json({ error: 'Failed to get presidium status' });
    }
};

module.exports = {
    createCommittee,
    getCommittees,
    getCommittee,
    updateCommittee,
    addCountries,
    removeCountry,
    getCountries,
    updatePresidium,
    deleteCommittee,
    restoreCommittee,
    getPresidiumStatus,
    updateCountryStatus
};