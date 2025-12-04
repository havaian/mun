const { Committee } = require('./model');
const { Event } = require('../event/model');
const { User } = require('../auth/model');
const logger = require('../utils/logger');
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
                // Generate unique tokens
                const loginToken = crypto.randomBytes(32).toString('hex');

                // Create presidium user WITHOUT email (will be bound during login)
                const presidiumUser = new User({
                    role: 'presidium',
                    presidiumRole: role,
                    committeeId: committee._id,
                    loginToken: loginToken,          // Add loginToken (required)
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
                    userId: presidiumUser._id,
                    loginToken: presidiumUser.loginToken  // Return loginToken instead of qrToken
                });

                logger.info(`✅ Created and added presidium user: ${role} for committee ${committee.name}`);

            } catch (error) {
                logger.error(`❌ Failed to create presidium user for role ${role}:`, error);
                // Continue with other roles even if one fails
            }
        }

        // Save committee with presidium members added
        await committee.save();

        // Update event statistics
        await event.updateStatistics();

        logger.info(`Committee created: ${committee.name} with ${presidiumUsers.length} presidium members`);

        // Include presidium info in response
        res.status(201).json({
            success: true,
            committee,
            presidiumUsers,  // Include the created presidium users
            message: `Committee created successfully with ${presidiumUsers.length} presidium QR tokens`
        });

    } catch (error) {
        logger.error('Create committee error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.message
            });
        }

        res.status(500).json({ error: 'Failed to create committee' });
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
        logger.error('Get committee error:', error);
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

        logger.info(`Committee updated: ${committee.name} by ${req.user.userId}`);

        res.json({
            success: true,
            committee,
            message: 'Committee updated successfully'
        });

    } catch (error) {
        logger.error('Update committee error:', error);
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

        logger.info(`Countries added to ${committee.name}: ${addedCountries.length} successful, ${errors.length} failed`);

        res.json({
            success: true,
            added: addedCountries,
            errors: errors,
            message: `${addedCountries.length} countries added successfully`
        });

    } catch (error) {
        logger.error('Add countries error:', error);
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

        logger.info(`Country removed from ${committee.name}: ${countryName}`);

        res.json({
            success: true,
            message: `Country "${countryName}" removed successfully`
        });

    } catch (error) {
        logger.error('Remove country error:', error);

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
        logger.error('Get countries error:', error);
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
};

// Generate QR codes PDF for committee (presidium only)
const generateQRCodes = async (req, res) => {
    try {
        const { id } = req.params;

        const committee = await Committee.findById(id)
            .populate('eventId', 'name');

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check permissions
        if (req.user.role !== 'admin' &&
            (req.user.role !== 'presidium' || req.user.committeeId?.toString() !== id)) {
            return res.status(403).json({ error: 'Only presidium can generate QR codes' });
        }

        if (committee.countries.length === 0) {
            return res.status(400).json({
                error: 'No countries added to committee yet'
            });
        }

        // Generate QR tokens if not already generated
        committee.generateQRTokens();
        await committee.save();

        // Create QR codes directory if it doesn't exist
        const qrDir = path.join(__dirname, '../../uploads/qr');
        await fs.mkdir(qrDir, { recursive: true });

        // Generate QR codes for each country
        const qrCodes = [];

        for (const country of committee.countries) {
            const qrData = {
                token: country.qrToken,
                committee: committee.name,
                country: country.name,
                event: committee.eventId.name
            };

            const qrString = await QRCode.toString(JSON.stringify(qrData), {
                type: 'svg',
                width: 200,
                margin: 2
            });

            qrCodes.push({
                country: country.name,
                qrString,
                token: country.qrToken,
                isObserver: country.isObserver,
                specialRole: country.specialRole
            });
        }

        // For now, return QR data as JSON (frontend can generate PDF)
        // In production, you might want to generate PDF server-side
        res.json({
            success: true,
            committee: {
                name: committee.name,
                event: committee.eventId.name
            },
            qrCodes,
            message: 'QR codes generated successfully'
        });

        logger.info(`QR codes generated for committee ${committee.name} (${qrCodes.length} codes)`);

    } catch (error) {
        logger.error('Generate QR codes error:', error);
        res.status(500).json({ error: 'Failed to generate QR codes' });
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

        logger.info(`Presidium updated for committee ${committee.name}`);

        res.json({
            success: true,
            presidium: committee.presidium,
            message: 'Presidium updated successfully'
        });

    } catch (error) {
        logger.error('Update presidium error:', error);
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

        // Check if committee has active sessions, resolutions, etc.
        // TODO: Add checks for related data when those modules are implemented

        // Remove all User records associated with this committee
        await User.deleteMany({ committeeId: id });

        // Delete the committee
        await Committee.findByIdAndDelete(id);

        // Update event statistics
        const event = await Event.findById(committee.eventId);
        if (event) {
            await event.updateStatistics();
        }

        logger.info(`Committee deleted: ${committee.name}`);

        res.json({
            success: true,
            message: 'Committee deleted successfully'
        });

    } catch (error) {
        logger.error('Delete committee error:', error);
        res.status(500).json({ error: 'Failed to delete committee' });
    }
};

// Generate presidium QR tokens for committee
const generatePresidiumQRs = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // Find committee
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        const presidiumRoles = ['chairman', 'co-chairman', 'expert', 'secretary'];
        const createdUsers = [];
        const errors = [];

        for (const role of presidiumRoles) {
            try {
                // Check if presidium member already exists
                const existingUser = await User.findOne({
                    committeeId: committeeId,
                    role: 'presidium',
                    presidiumRole: role
                });

                if (existingUser) {
                    // Update existing user to ensure QR token exists
                    if (!existingUser.qrToken) {
                        existingUser.qrToken = crypto.randomBytes(32).toString('hex');
                        existingUser.isQrActive = true;
                        await existingUser.save();
                    }
                    createdUsers.push({
                        role: role,
                        qrToken: existingUser.qrToken,
                        status: 'updated'
                    });
                } else {
                    // Create new presidium user
                    const presidiumUser = new User({
                        role: 'presidium',
                        presidiumRole: role,
                        committeeId: committeeId,
                        qrToken: crypto.randomBytes(32).toString('hex'),
                        isQrActive: true,
                        isActive: true
                    });

                    await presidiumUser.save();
                    createdUsers.push({
                        role: role,
                        qrToken: presidiumUser.qrToken,
                        status: 'created'
                    });
                }

                logger.info(`Presidium QR ${createdUsers[createdUsers.length - 1].status}: ${role} for committee ${committee.name}`);

            } catch (error) {
                logger.error(`Error creating presidium QR for ${role}:`, error);
                errors.push({
                    role: role,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Presidium QR tokens generated successfully',
            presidiumUsers: createdUsers,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        logger.error('Generate presidium QRs error:', error);
        res.status(500).json({
            error: 'Failed to generate presidium QR tokens'
        });
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
        logger.error('Get presidium status error:', error);
        res.status(500).json({
            error: 'Failed to get presidium status'
        });
    }
};

// Reset presidium QR token (admin only)
const resetPresidiumQR = async (req, res) => {
    try {
        const { committeeId, role } = req.params;

        // Validate role
        if (!['chairman', 'co-chairman', 'expert', 'secretary'].includes(role)) {
            return res.status(400).json({
                error: 'Invalid presidium role'
            });
        }

        // Find presidium member
        const presidiumUser = await User.findOne({
            committeeId: committeeId,
            role: 'presidium',
            presidiumRole: role
        });

        if (!presidiumUser) {
            return res.status(404).json({
                error: `${role} not found for this committee`
            });
        }

        // Reset user data
        presidiumUser.qrToken = crypto.randomBytes(32).toString('hex');
        presidiumUser.isQrActive = true;
        presidiumUser.email = null;
        presidiumUser.sessionId = null;

        // Deactivate all sessions for this user
        await ActiveSession.updateMany(
            { userId: presidiumUser._id },
            { $set: { isActive: false } }
        );

        await presidiumUser.save();

        logger.info(`Reset QR for presidium ${role} in committee ${committeeId} by admin ${req.user.userId}`);

        res.json({
            success: true,
            message: `QR code reset successfully for ${role}`,
            newQRToken: presidiumUser.qrToken
        });

    } catch (error) {
        logger.error('Reset presidium QR error:', error);
        res.status(500).json({
            error: 'Failed to reset presidium QR'
        });
    }
};

// Get QR tokens for PDF generation (admin only)
const getCommitteeQRTokens = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // Get committee with countries
        const committee = await Committee.findById(committeeId)
            .select('name type countries')
            .lean();

        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        // Get presidium members
        const presidiumMembers = await User.find({
            committeeId: committeeId,
            role: 'presidium'
        }).select('presidiumRole qrToken').lean();

        // Format response
        const qrTokens = {
            committee: {
                id: committee._id,
                name: committee.name,
                type: committee.type
            },
            presidium: presidiumMembers.map(member => ({
                role: member.presidiumRole,
                qrToken: member.qrToken
            })),
            delegates: committee.countries.map(country => ({
                name: country.name,
                qrToken: country.qrToken,
                isObserver: country.isObserver,
                specialRole: country.specialRole
            }))
        };

        res.json({
            success: true,
            qrTokens
        });

    } catch (error) {
        logger.error('Get committee QR tokens error:', error);
        res.status(500).json({
            error: 'Failed to get QR tokens'
        });
    }
};

module.exports = {
    createCommittee,
    getCommittee,
    updateCommittee,
    addCountries,
    removeCountry,
    getCountries,
    generateQRCodes,
    updatePresidium,
    deleteCommittee,
    generatePresidiumQRs,
    getPresidiumStatus,
    resetPresidiumQR,
    getCommitteeQRTokens
};