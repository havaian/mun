const { Committee } = require('./model');
const { Event } = require('../event/model');
const { User } = require('../auth/model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

// Create new committee (admin only)
const createCommittee = async (req, res) => {
    try {
        const {
            eventId,
            name,
            type,
            description,
            language = 'english'
        } = req.body;

        // Validate event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if event is still in draft/active status
        if (event.status === 'completed') {
            return res.status(400).json({
                error: 'Cannot create committee for completed event'
            });
        }

        // Check committee limit
        const existingCommittees = await Committee.countDocuments({ eventId });
        if (existingCommittees >= event.settings.maxCommittees) {
            return res.status(400).json({
                error: `Maximum number of committees (${event.settings.maxCommittees}) reached for this event`
            });
        }

        const committee = new Committee({
            eventId,
            name: name.trim(),
            type,
            description: description?.trim(),
            language
        });

        await committee.save();

        // Automatically create presidium users with credentials
        const presidiumRoles = ['chairman', 'co-chairman', 'expert', 'secretary'];
        const presidiumUsers = [];

        for (const role of presidiumRoles) {
            try {
                // Create presidium user WITHOUT email (will be bound during login)
                const presidiumUser = new User({
                    role: 'presidium',
                    presidiumRole: role,
                    committeeId: committee._id,
                    isActive: true,             // Use isActive instead of isQrActive
                    isActive: true
                    // No username, password, or email needed
                });

                await presidiumUser.save();

                // Manually add presidium member with correct schema structure
                committee.presidium.push({
                    userId: presidiumUser._id,
                    role: role,
                    appointedBy: req.user.userId,
                    appointedAt: new Date()
                });

                // Store info for response
                presidiumUsers.push({
                    role: role,
                    userId: presidiumUser._id
                });

                global.logger.info(`✅ Created and added presidium user: ${role} for committee ${committee.name}`);

            } catch (error) {
                global.logger.error(`❌ Failed to create presidium user for role ${role}:`, error);
                // Continue with other roles even if one fails
            }
        }

        // Save committee with presidium members added
        await committee.save();

        // Update event statistics
        await event.updateStatistics();

        global.logger.info(`Committee created: ${committee.name} with ${presidiumUsers.length} presidium members`);

        // Include presidium info in response
        res.status(201).json({
            success: true,
            committee,
            presidiumUsers,  // Include the created presidium users
            message: 'Committee created successfully'
        });

    } catch (error) {
        global.logger.error('Create committee error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.message
            });
        }

        res.status(500).json({ error: 'Failed to create committee' });
    }
};

// Get all committees
const getCommittees = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            eventId,
            search
        } = req.query;

        const { Committee } = require('./model');

        // Build filter based on user role
        const filter = {};

        // Admin can see all committees
        // Presidium/delegates can only see committees they're part of
        if (req.user.role !== 'admin') {
            if (req.user.committeeId) {
                filter._id = req.user.committeeId;
            } else {
                // User not assigned to any committee
                return res.json({
                    success: true,
                    committees: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        total: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                });
            }
        }

        // Apply filters
        if (status) {
            filter.status = status;
        }

        if (eventId) {
            filter.eventId = eventId;
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit);

        // Execute query with population
        const committees = await Committee.find(filter)
            .select('name description type status language eventId countries presidium createdAt updatedAt')
            .populate('eventId', 'name status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Committee.countDocuments(filter);

        // Add computed fields
        const committeesWithCounts = committees.map(committee => {
            const committeeObj = committee.toObject();
            return {
                ...committeeObj,
                countriesCount: committeeObj.countries?.length || 0
            };
        });

        res.json({
            success: true,
            committees: committeesWithCounts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limitNum),
                total: total,
                hasNext: skip + committees.length < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        global.logger.error('Get all committees error:', error);
        res.status(500).json({ error: 'Failed to fetch committees' });
    }
};

// Get committee by ID
const getCommittee = async (req, res) => {
    try {
        const { id } = req.params;

        const committee = await Committee.findById(id)
            .populate('eventId', 'name status startDate endDate')
            .populate('presidium.userId', 'username email')
            .populate('presidium.appointedBy', 'username');

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check access permissions
        if (req.user.role !== 'admin' &&
            req.user.committeeId?.toString() !== id) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        res.json({
            success: true,
            committee
        });

    } catch (error) {
        global.logger.error('Get committee error:', error);
        res.status(500).json({ error: 'Failed to fetch committee' });
    }
};

// Update committee (admin/presidium)
const updateCommittee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const committee = await Committee.findById(id);

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check permissions
        if (req.user.role !== 'admin' && req.user.committeeId?.toString() !== id) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        // Prevent completed committees from being updated
        if (committee.status === 'completed') {
            return res.status(400).json({
                error: 'Cannot update completed committee'
            });
        }

        // Handle nested settings updates
        if (updates.settings) {
            committee.settings = { ...committee.settings.toObject(), ...updates.settings };
            delete updates.settings;
        }

        // Apply other updates (exclude sensitive fields)
        const allowedFields = ['name', 'description', 'language', 'status', 'countries'];
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                committee[key] = updates[key];
            }
        });

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

// Add countries to committee (presidium only)
const addCountries = async (req, res) => {
    try {
        const { id } = req.params;
        const { countries } = req.body; // Array of country objects

        if (!Array.isArray(countries) || countries.length === 0) {
            return res.status(400).json({
                error: 'Countries array is required and must not be empty'
            });
        }

        const committee = await Committee.findById(id);

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check permissions - only presidium can add countries
        if (req.user.role !== 'admin' &&
            (req.user.role !== 'presidium' || req.user.committeeId?.toString() !== id)) {
            return res.status(403).json({ error: 'Only presidium can add countries' });
        }

        const addedCountries = [];
        const errors = [];

        for (const countryData of countries) {
            try {
                const country = committee.addCountry(countryData);
                addedCountries.push(country);
            } catch (error) {
                errors.push({
                    country: countryData.name,
                    error: error.message
                });
            }
        }

        if (addedCountries.length > 0) {
            await committee.save();

            // Create User records for each country
            for (const country of addedCountries) {
                const user = new User({
                    role: 'delegate',
                    countryName: country.name,
                    specialRole: country.specialRole || 'observer',
                    qrToken: country.qrToken,
                    isQrActive: true,
                    committeeId: committee._id
                });

                await user.save();
            }

            // Update event statistics
            const event = await Event.findById(committee.eventId);
            if (event) {
                await event.updateStatistics();
            }
        }

        global.logger.info(`Countries added to ${committee.name}: ${addedCountries.length} successful, ${errors.length} failed`);

        res.json({
            success: true,
            added: addedCountries,
            errors: errors,
            message: `${addedCountries.length} countries added successfully`
        });

    } catch (error) {
        global.logger.error('Add countries error:', error);
        res.status(500).json({ error: 'Failed to add countries' });
    }
};

// Remove country from committee (presidium only)
const removeCountry = async (req, res) => {
    try {
        const { id, countryName } = req.params;

        const committee = await Committee.findById(id);

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check permissions
        if (req.user.role !== 'admin' &&
            (req.user.role !== 'presidium' || req.user.committeeId?.toString() !== id)) {
            return res.status(403).json({ error: 'Only presidium can remove countries' });
        }

        committee.removeCountry(countryName);
        await committee.save();

        // Remove corresponding User record
        await User.findOneAndDelete({
            countryName: countryName,
            committeeId: id,
            role: 'delegate'
        });

        global.logger.info(`Country removed from ${committee.name}: ${countryName}`);

        res.json({
            success: true,
            message: `Country "${countryName}" removed successfully`
        });

    } catch (error) {
        global.logger.error('Remove country error:', error);

        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to remove country' });
    }
};

// Get countries list for committee
const getCountries = async (req, res) => {
    try {
        const { id } = req.params;

        const committee = await Committee.findById(id).select('countries');

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check access permissions
        if (req.user.role !== 'admin' &&
            req.user.committeeId?.toString() !== id) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        res.json({
            success: true,
            countries: committee.countries
        });

    } catch (error) {
        global.logger.error('Get countries error:', error);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};

// Update presidium (admin only)
const updatePresidium = async (req, res) => {
    try {
        const { id } = req.params;
        const { presidium } = req.body; // Array of { userId, role }

        if (!Array.isArray(presidium)) {
            return res.status(400).json({
                error: 'Presidium must be an array'
            });
        }

        const committee = await Committee.findById(id);

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Validate all user IDs exist and are valid
        const userIds = presidium.map(p => p.userId);
        const users = await User.find({
            _id: { $in: userIds },
            role: { $in: ['admin', 'presidium'] }
        });

        if (users.length !== userIds.length) {
            return res.status(400).json({
                error: 'One or more invalid user IDs provided'
            });
        }

        // Clear existing presidium
        committee.presidium = [];

        // Add new presidium members
        for (const member of presidium) {
            try {
                committee.addPresidiumMember(member.userId, member.role, req.user.userId);
            } catch (error) {
                return res.status(400).json({
                    error: error.message
                });
            }
        }

        await committee.save();

        // Update User records to reflect presidium assignment
        await User.updateMany(
            { _id: { $in: userIds } },
            {
                committeeId: committee._id,
                $unset: { presidiumRole: '' }
            }
        );

        for (const member of presidium) {
            await User.findByIdAndUpdate(member.userId, {
                presidiumRole: member.role,
                committeeId: committee._id
            });
        }

        await committee.populate('presidium.userId', 'username email');

        global.logger.info(`Presidium updated for committee ${committee.name}`);

        res.json({
            success: true,
            presidium: committee.presidium,
            message: 'Presidium updated successfully'
        });

    } catch (error) {
        global.logger.error('Update presidium error:', error);
        res.status(500).json({ error: 'Failed to update presidium' });
    }
};

// Delete committee (admin only)
const deleteCommittee = async (req, res) => {
    try {
        const { id } = req.params;

        const committee = await Committee.findById(id);

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Soft delete the committee
        await committee.softDelete(req.user.userId);

        // Update event statistics
        const event = await Event.findById(committee.eventId);
        if (event) {
            await event.updateStatistics();
        }

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

// Restore committee (admin only)
const restoreCommittee = async (req, res) => {
    try {
        const { id } = req.params;

        // Find including soft-deleted committees
        const committee = await Committee.findOneDeleted({ _id: id });

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (!committee.deletedAt) {
            return res.status(400).json({ error: 'Committee is not deleted' });
        }

        // Restore the committee
        await committee.restore();

        // Update event statistics
        const event = await Event.findById(committee.eventId);
        if (event) {
            await event.updateStatistics();
        }

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

// Get presidium status for committee
const getPresidiumStatus = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // Find all presidium members for this committee
        const presidiumMembers = await User.find({
            committeeId: committeeId,
            role: 'presidium'
        }).select('presidiumRole email qrToken isQrActive createdAt');

        const presidiumRoles = ['chairman', 'co-chairman', 'expert', 'secretary'];
        const statusMap = {};

        // Initialize all roles as missing
        presidiumRoles.forEach(role => {
            statusMap[role] = {
                role: role,
                status: 'missing',
                hasQR: false,
                isRegistered: false
            };
        });

        // Update with actual data
        presidiumMembers.forEach(member => {
            statusMap[member.presidiumRole] = {
                role: member.presidiumRole,
                status: 'created',
                hasQR: !!member.qrToken,
                isQRActive: member.isQrActive,
                isRegistered: !!member.email,
                email: member.email,
                registeredAt: member.email ? member.createdAt : null
            };
        });

        res.json({
            success: true,
            presidiumStatus: Object.values(statusMap),
            summary: {
                totalRoles: presidiumRoles.length,
                createdRoles: presidiumMembers.length,
                registeredRoles: presidiumMembers.filter(m => m.email).length,
                activeQRs: presidiumMembers.filter(m => m.isQrActive).length
            }
        });

    } catch (error) {
        global.logger.error('Get presidium status error:', error);
        res.status(500).json({
            error: 'Failed to get presidium status'
        });
    }
};

const updateCountryStatus = async (req, res) => {
    try {
        const { id, countryName } = req.params;
        const { status, specialRole } = req.body;

        const { Committee } = require('./model');
        const committee = await Committee.findById(id);

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
}

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