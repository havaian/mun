const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Validation schemas
const validateCommitteeCreation = [
    body('eventId')
        .isMongoId()
        .withMessage('Valid event ID is required'),
    body('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Committee name must be between 3 and 100 characters')
        .trim(),
    body('type')
        .isIn(['GA', 'SC', 'other'])
        .withMessage('Committee type must be GA, SC, or other'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    body('language')
        .optional()
        .isIn(['en', 'ru', 'uzbuzek'])
        .withMessage('Language must be en, ru, or uz')
];

const validateCommitteeUpdate = [
    body('name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Committee name must be between 3 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    body('language')
        .optional()
        .isIn(['en', 'ru', 'uz'])
        .withMessage('Language must be en, ru, or uz'),
    body('status')
        .optional()
        .isIn(['setup', 'active', 'completed'])
        .withMessage('Status must be setup, active, or completed'),
    body('settings.minCoalitionSize')
        .optional()
        .isInt({ min: 2, max: 10 })
        .withMessage('Min coalition size must be between 2 and 10'),
    body('settings.votingRules.defaultMajority')
        .optional()
        .isIn(['simple', 'qualified'])
        .withMessage('Default majority must be simple or qualified'),
    body('settings.speechSettings.defaultSpeechTime')
        .optional()
        .isInt({ min: 30, max: 300 })
        .withMessage('Default speech time must be between 30 and 300 seconds')
];

const validateCountryAddition = [
    body('countries')
        .isArray({ min: 1 })
        .withMessage('Countries array is required and must not be empty'),
    body('countries.*.name')
        .isLength({ min: 2, max: 50 })
        .withMessage('Country name must be between 2 and 50 characters')
        .trim(),
    body('countries.*.specialRole')
        .optional()
        .isIn(['observer', 'special'])
        .withMessage('Special role must be observer or special'),
    body('countries.*.isPermanentMember')
        .optional()
        .isBoolean()
        .withMessage('isPermanentMember must be boolean'),
    body('countries.*.hasVetoRight')
        .optional()
        .isBoolean()
        .withMessage('hasVetoRight must be boolean'),
    body('countries.*.flagUrl')
        .optional()
        .isURL()
        .withMessage('Flag URL must be a valid URL')
];

const validatePresidiumUpdate = [
    body('presidium')
        .isArray({ min: 1, max: 4 })
        .withMessage('Presidium must be an array with 1-4 members'),
    body('presidium.*.userId')
        .isMongoId()
        .withMessage('Valid user ID is required'),
    body('presidium.*.role')
        .isIn(['chairman', 'co-chairman', 'expert', 'secretary'])
        .withMessage('Role must be chairman, co-chairman, expert, or secretary')
];

const validateCommitteeId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validateCommitteeIdParam = [
    param('committeeId')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validateCountryName = [
    param('countryName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Invalid country name')
        .trim()
];

const validatePresidiumRole = [
    param('role')
        .isIn(['chairman', 'co-chairman', 'expert', 'secretary'])
        .withMessage('Invalid presidium role')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['setup', 'active', 'completed'])
        .withMessage('Status must be setup, active, or completed'),
    query('eventId')
        .optional()
        .isMongoId()
        .withMessage('Event ID must be valid')
];

// Routes

// Get all committees (admin can see all, presidium/delegates see their own)
router.get('/',
    global.auth.token,
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
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
                    countriesCount: committeeObj.countries?.length || 0,
                    // Check for login tokens instead of QR tokens
                    linksGenerated: committeeObj.countries?.some(country => country.loginToken) || false
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
    }
);

// Create new committee (admin only)
router.post('/',
    global.auth.token,
    global.auth.admin,
    validateCommitteeCreation,
    handleValidationErrors,
    controller.createCommittee
);

// Get committee by ID
router.get('/:id',
    global.auth.token,
    validateCommitteeId,
    handleValidationErrors,
    controller.getCommittee
);

// Update committee settings
router.put('/:id',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    validateCommitteeUpdate,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.updateCommittee
);

// Delete committee (admin only)
router.delete('/:id',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    controller.deleteCommittee
);

// Country management

// Add countries to committee (presidium only)
router.put('/:id/countries',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    validateCountryAddition,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.addCountries
);

// Get countries list
router.get('/:id/countries',
    global.auth.token,
    validateCommitteeId,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.getCountries
);

// Remove country from committee (presidium only)
router.delete('/:id/countries/:countryName',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    validateCountryName,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.removeCountry
);

// Update country status (presidium only)
router.put('/:id/countries/:countryName/status',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    validateCountryName,
    [
        body('status')
            .optional()
            .isIn(['active', 'inactive'])
            .withMessage('Status must be active or inactive'),
        body('specialRole')
            .optional()
            .isIn(['observer', 'special'])
            .withMessage('Special role must be observer or special')
    ],
    handleValidationErrors,
    global.auth.sameCommittee,
    async (req, res) => {
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
);

// Presidium management

// Update presidium (admin only)
router.put('/:id/presidium',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    validatePresidiumUpdate,
    handleValidationErrors,
    controller.updatePresidium
);

// Get presidium information
router.get('/:id/presidium',
    global.auth.token,
    validateCommitteeId,
    handleValidationErrors,
    global.auth.sameCommittee,
    async (req, res) => {
        try {
            const { id } = req.params;

            const { Committee } = require('./model');
            const committee = await Committee.findById(id)
                .select('presidium')
                .populate('presidium.userId', 'username email')
                .populate('presidium.appointedBy', 'username');

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            res.json({
                success: true,
                presidium: committee.presidium
            });

        } catch (error) {
            global.logger.error('Get presidium error:', error);
            res.status(500).json({ error: 'Failed to fetch presidium' });
        }
    }
);

// Login Links management (replaces QR Code management)

// Generate login links for delegates (presidium only)
router.get('/:id/login-links',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    handleValidationErrors,
    global.auth.sameCommittee,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { format = 'json' } = req.query;

            const { Committee } = require('./model');
            const crypto = require('crypto');

            const committee = await Committee.findById(id);

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Generate login tokens for countries that don't have them
            let needsUpdate = false;
            committee.countries.forEach(country => {
                if (!country.loginToken) {
                    country.loginToken = crypto.randomBytes(32).toString('hex');
                    country.isActive = true;
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                await committee.save();
            }

            const baseUrl = process.env.PROJECT_URL || 'https://mun.uz';

            // Generate delegate links
            const delegateLinks = committee.countries.map(country => ({
                country: country.name,
                link: `${baseUrl}/login/${country.loginToken}`,
                loginToken: country.loginToken,
                isObserver: country.isObserver,
                specialRole: country.specialRole,
                isActive: country.isActive
            }));

            global.logger.info(`Generated ${delegateLinks.length} delegate login links for committee: ${committee.name}`);

            if (format === 'plain') {
                const plainText = delegateLinks
                    .map(link => `${link.country}: ${link.link}`)
                    .join('\n');

                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Disposition', `attachment; filename="delegate_links_${committee.name.replace(/\s+/g, '_')}.txt"`);
                res.send(plainText);
            } else {
                res.json({
                    success: true,
                    message: `Generated login links for ${delegateLinks.length} countries`,
                    delegateLinks,
                    totalCount: delegateLinks.length,
                    activeCount: delegateLinks.filter(link => link.isActive).length
                });
            }

        } catch (error) {
            global.logger.error('Generate delegate login links error:', error);
            res.status(500).json({ error: 'Failed to generate delegate login links' });
        }
    }
);

// Regenerate all login links (presidium only)
router.post('/:id/login-links/regenerate',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    handleValidationErrors,
    global.auth.sameCommittee,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason = 'Manual regeneration by presidium' } = req.body;

            const { Committee } = require('./model');
            const { User } = require('../auth/model');
            const crypto = require('crypto');

            const committee = await Committee.findById(id);

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Generate new login tokens for all countries
            committee.countries.forEach(country => {
                country.loginToken = crypto.randomBytes(32).toString('hex');
                country.isActive = true;
                country.email = null; // Reset email binding
            });

            await committee.save();

            // Update User records
            for (const country of committee.countries) {
                await User.findOneAndUpdate(
                    { countryName: country.name, committeeId: id },
                    {
                        loginToken: country.loginToken,
                        isActive: true,
                        email: null,
                        sessionId: null
                    }
                );
            }

            // Deactivate all active sessions for this committee
            const { ActiveSession } = require('../auth/model');
            const users = await User.find({ committeeId: id });
            const userIds = users.map(u => u._id);

            await ActiveSession.updateMany(
                { userId: { $in: userIds } },
                { isActive: false }
            );

            global.logger.info(`All login links regenerated for committee ${committee.name}. Reason: ${reason}`);

            res.json({
                success: true,
                message: `All login links regenerated for ${committee.countries.length} countries`,
                regeneratedCount: committee.countries.length
            });

        } catch (error) {
            global.logger.error('Regenerate login links error:', error);
            res.status(500).json({ error: 'Failed to regenerate login links' });
        }
    }
);

// Regenerate login link for specific country (presidium only)
router.post('/:id/login-links/:countryName/regenerate',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    validateCountryName,
    [
        body('reason')
            .optional()
            .isLength({ min: 5 })
            .withMessage('Reason must be at least 5 characters if provided')
    ],
    handleValidationErrors,
    global.auth.sameCommittee,
    async (req, res) => {
        try {
            const { id, countryName } = req.params;
            const { reason = 'Manual regeneration by presidium' } = req.body;

            const { Committee } = require('./model');
            const { User, ActiveSession } = require('../auth/model');
            const crypto = require('crypto');

            const committee = await Committee.findById(id);

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            const country = committee.getCountry(countryName);
            if (!country) {
                return res.status(404).json({
                    error: `Country "${countryName}" not found in this committee`
                });
            }

            // Generate new login token
            country.loginToken = crypto.randomBytes(32).toString('hex');
            country.isActive = true;
            country.email = null; // Reset email binding

            await committee.save();

            // Update User record
            const user = await User.findOneAndUpdate(
                { countryName, committeeId: id },
                {
                    loginToken: country.loginToken,
                    isActive: true,
                    email: null,
                    sessionId: null
                }
            );

            // Deactivate any active sessions for this user
            if (user) {
                await ActiveSession.updateMany(
                    { userId: user._id },
                    { isActive: false }
                );
            }

            global.logger.info(`Login link regenerated for ${countryName} in committee ${committee.name}. Reason: ${reason}`);

            res.json({
                success: true,
                message: `Login link regenerated for ${countryName}`,
                loginToken: country.loginToken
            });

        } catch (error) {
            global.logger.error('Regenerate country login link error:', error);
            res.status(500).json({ error: 'Failed to regenerate login link' });
        }
    }
);

// Generate presidium login links for committee (admin only)
router.post('/:committeeId/presidium/generate-links',
    global.auth.token,
    global.auth.admin,
    validateCommitteeIdParam,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;
            const { format = 'json' } = req.query;

            const { User } = require('../auth/model');
            const crypto = require('crypto');

            // Find presidium members for this committee
            const presidiumMembers = await User.find({
                committeeId: committeeId,
                role: 'presidium'
            });

            if (presidiumMembers.length === 0) {
                return res.status(404).json({
                    error: 'No presidium members found for this committee'
                });
            }

            // Generate login tokens for presidium members who don't have them
            let updatedCount = 0;
            for (const member of presidiumMembers) {
                if (!member.loginToken) {
                    member.loginToken = crypto.randomBytes(32).toString('hex');
                    member.isActive = true;
                    await member.save();
                    updatedCount++;
                }
            }

            const baseUrl = process.env.PROJECT_URL || 'https://mun.uz';

            const presidiumLinks = presidiumMembers.map(member => ({
                role: member.presidiumRole,
                link: `${baseUrl}/login/${member.loginToken}`,
                loginToken: member.loginToken,
                isActive: member.isActive
            }));

            global.logger.info(`Generated login links for ${presidiumMembers.length} presidium members in committee ${committeeId}`);

            if (format === 'plain') {
                const plainText = presidiumLinks
                    .map(link => `${link.role}: ${link.link}`)
                    .join('\n');

                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Content-Disposition', `attachment; filename="presidium_links_${committeeId}.txt"`);
                res.send(plainText);
            } else {
                res.json({
                    success: true,
                    message: `Login links generated for ${presidiumMembers.length} presidium members (${updatedCount} new)`,
                    presidiumLinks,
                    totalCount: presidiumLinks.length,
                    activeCount: presidiumLinks.filter(link => link.isActive).length
                });
            }

        } catch (error) {
            global.logger.error('Generate presidium login links error:', error);
            res.status(500).json({ error: 'Failed to generate presidium login links' });
        }
    }
);

// Get presidium status for committee
router.get('/:committeeId/presidium/status',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeIdParam,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;

            const { User } = require('../auth/model');

            const presidiumMembers = await User.find({
                committeeId: committeeId,
                role: 'presidium'
            }).select('presidiumRole loginToken isActive email');

            const presidiumStatus = presidiumMembers.map(member => ({
                role: member.presidiumRole,
                hasLoginLink: !!member.loginToken,
                isActive: member.isActive,
                hasEmail: !!member.email
            }));

            res.json({
                success: true,
                presidiumStatus
            });

        } catch (error) {
            global.logger.error('Get presidium status error:', error);
            res.status(500).json({ error: 'Failed to get presidium status' });
        }
    }
);

// Reset specific presidium login link (admin only)
router.post('/:committeeId/presidium/:role/reset-link',
    global.auth.token,
    global.auth.admin,
    validateCommitteeIdParam,
    validatePresidiumRole,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId, role } = req.params;

            const { User } = require('../auth/model');
            const crypto = require('crypto');

            const presidiumUser = await User.findOne({
                committeeId: committeeId,
                role: 'presidium',
                presidiumRole: role
            });

            if (!presidiumUser) {
                return res.status(404).json({
                    error: `Presidium member with role '${role}' not found in this committee`
                });
            }

            // Generate new login token
            presidiumUser.loginToken = crypto.randomBytes(32).toString('hex');
            presidiumUser.isActive = true;
            presidiumUser.email = null; // Reset email binding
            presidiumUser.sessionId = null;

            await presidiumUser.save();

            // Deactivate any active sessions for this user
            const { ActiveSession } = require('../auth/model');
            await ActiveSession.updateMany(
                { userId: presidiumUser._id },
                { isActive: false }
            );

            global.logger.info(`Login link reset for presidium role '${role}' in committee ${committeeId}`);

            res.json({
                success: true,
                message: `Login link reset successfully for ${role}`,
                newLoginToken: presidiumUser.loginToken
            });

        } catch (error) {
            global.logger.error('Reset presidium login link error:', error);
            res.status(500).json({
                error: 'Failed to reset presidium login link'
            });
        }
    }
);

// Get all login tokens for committee (for export - admin only)
router.get('/:committeeId/login-tokens',
    global.auth.token,
    global.auth.admin,
    validateCommitteeIdParam,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;

            // Get committee with countries
            const { Committee } = require('./model');
            const committee = await Committee.findById(committeeId)
                .select('name type countries')
                .lean();

            if (!committee) {
                return res.status(404).json({
                    error: 'Committee not found'
                });
            }

            // Get presidium members
            const { User } = require('../auth/model');
            const presidiumMembers = await User.find({
                committeeId: committeeId,
                role: 'presidium'
            }).select('presidiumRole loginToken').lean();

            // Format response
            const loginTokens = {
                committee: {
                    id: committee._id,
                    name: committee.name,
                    type: committee.type
                },
                presidium: presidiumMembers.map(member => ({
                    role: member.presidiumRole,
                    loginToken: member.loginToken
                })),
                delegates: committee.countries.map(country => ({
                    name: country.name,
                    loginToken: country.loginToken,
                    isObserver: country.isObserver,
                    specialRole: country.specialRole
                }))
            };

            res.json({
                success: true,
                loginTokens
            });

        } catch (error) {
            global.logger.error('Get committee login tokens error:', error);
            res.status(500).json({
                error: 'Failed to get login tokens'
            });
        }
    }
);

// LEGACY ROUTES: Deprecated QR routes that return migration notices
router.get('/:id/qr-codes', (req, res) => {
    res.status(410).json({
        error: 'QR code generation is deprecated. Please use link-based authentication.',
        newEndpoint: `/committees/${req.params.id}/login-links`,
        migration: 'QR codes have been replaced with direct login links for better user experience.'
    });
});

router.post('/:id/qr-codes/regenerate', (req, res) => {
    res.status(410).json({
        error: 'QR code regeneration is deprecated. Please use link-based authentication.',
        newEndpoint: `/committees/${req.params.id}/login-links/regenerate`
    });
});

router.post('/:committeeId/presidium/generate-qrs', (req, res) => {
    res.status(410).json({
        error: 'Presidium QR generation is deprecated. Please use link-based authentication.',
        newEndpoint: `/committees/${req.params.committeeId}/presidium/generate-links`
    });
});

module.exports = router;