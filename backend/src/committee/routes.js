const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const {
    authenticateToken,
    requireAdmin,
    requirePresidium,
    requireSameCommittee
} = require('../auth/middleware');

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
        .isIn(['english', 'russian', 'uzbek'])
        .withMessage('Language must be english, russian, or uzbek')
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
        .isIn(['english', 'russian', 'uzbek'])
        .withMessage('Language must be english, russian, or uzbek'),
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

// Routes

// Create new committee (admin only)
router.post('/',
    authenticateToken,
    requireAdmin,
    validateCommitteeCreation,
    handleValidationErrors,
    controller.createCommittee
);

// Get committee by ID
router.get('/:id',
    authenticateToken,
    validateCommitteeId,
    handleValidationErrors,
    controller.getCommittee
);

// Update committee settings
router.put('/:id',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateCommitteeUpdate,
    handleValidationErrors,
    requireSameCommittee,
    controller.updateCommittee
);

// Delete committee (admin only)
router.delete('/:id',
    authenticateToken,
    requireAdmin,
    validateCommitteeId,
    handleValidationErrors,
    controller.deleteCommittee
);

// Country management

// Add countries to committee (presidium only)
router.put('/:id/countries',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateCountryAddition,
    handleValidationErrors,
    requireSameCommittee,
    controller.addCountries
);

// Get countries list
router.get('/:id/countries',
    authenticateToken,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
    controller.getCountries
);

// Remove country from committee (presidium only)
router.delete('/:id/countries/:countryName',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateCountryName,
    handleValidationErrors,
    requireSameCommittee,
    controller.removeCountry
);

// Update country status (presidium only)
router.put('/:id/countries/:countryName/status',
    authenticateToken,
    requirePresidium,
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
    requireSameCommittee,
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
            logger.error('Update country status error:', error);
            res.status(500).json({ error: 'Failed to update country status' });
        }
    }
);

// Presidium management

// Update presidium (admin only)
router.put('/:id/presidium',
    authenticateToken,
    requireAdmin,
    validateCommitteeId,
    validatePresidiumUpdate,
    handleValidationErrors,
    controller.updatePresidium
);

// Get presidium information
router.get('/:id/presidium',
    authenticateToken,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
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
            logger.error('Get presidium error:', error);
            res.status(500).json({ error: 'Failed to fetch presidium' });
        }
    }
);

// QR Code management

// Generate QR codes PDF (presidium only)
router.get('/:id/qr-codes',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
    controller.generateQRCodes
);

// Regenerate all QR codes (presidium only)
router.post('/:id/qr-codes/regenerate',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason = 'Manual regeneration by presidium' } = req.body;

            const { Committee } = require('./model');
            const { User } = require('../auth/model');
            const crypto = require('crypto');
            const logger = require('../utils/logger');

            const committee = await Committee.findById(id);

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Generate new QR tokens for all countries
            committee.countries.forEach(country => {
                country.qrToken = crypto.randomBytes(32).toString('hex');
                country.isQrActive = true;
                country.email = null; // Reset email binding
            });

            await committee.save();

            // Update User records
            for (const country of committee.countries) {
                await User.findOneAndUpdate(
                    { countryName: country.name, committeeId: id },
                    {
                        qrToken: country.qrToken,
                        isQrActive: true,
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

            logger.info(`All QR codes regenerated for committee ${committee.name}. Reason: ${reason}`);

            res.json({
                success: true,
                message: `All QR codes regenerated for ${committee.countries.length} countries`,
                regeneratedCount: committee.countries.length
            });

        } catch (error) {
            logger.error('Regenerate QR codes error:', error);
            res.status(500).json({ error: 'Failed to regenerate QR codes' });
        }
    }
);

// Regenerate QR code for specific country (presidium only)
router.post('/:id/qr-codes/:countryName/regenerate',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateCountryName,
    [
        body('reason')
            .optional()
            .isLength({ min: 5 })
            .withMessage('Reason must be at least 5 characters if provided')
    ],
    handleValidationErrors,
    requireSameCommittee,
    async (req, res) => {
        try {
            const { id, countryName } = req.params;
            const { reason = 'Manual regeneration by presidium' } = req.body;

            const { Committee } = require('./model');
            const { User, ActiveSession } = require('../auth/model');
            const crypto = require('crypto');
            const logger = require('../utils/logger');

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

            // Generate new QR token
            country.qrToken = crypto.randomBytes(32).toString('hex');
            country.isQrActive = true;
            country.email = null; // Reset email binding

            await committee.save();

            // Update User record
            const user = await User.findOneAndUpdate(
                { countryName, committeeId: id },
                {
                    qrToken: country.qrToken,
                    isQrActive: true,
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

            logger.info(`QR code regenerated for ${countryName} in committee ${committee.name}. Reason: ${reason}`);

            res.json({
                success: true,
                message: `QR code regenerated for ${countryName}`,
                qrToken: country.qrToken
            });

        } catch (error) {
            logger.error('Regenerate country QR code error:', error);
            res.status(500).json({ error: 'Failed to regenerate QR code' });
        }
    }
);

// Generate presidium QR tokens for committee (admin only)
router.post('/:committeeId/presidium/generate-qrs',
    authenticateToken,
    requireAdmin,
    validateCommitteeId,
    handleValidationErrors,
    controller.generatePresidiumQRs
);

// Get presidium status for committee
router.get('/:committeeId/presidium/status',
    authenticateToken,
    requirePresidium, // Presidium can view their own status
    validateCommitteeId,
    handleValidationErrors,
    controller.getPresidiumStatus
);

// Reset specific presidium QR token (admin only)
router.post('/:committeeId/presidium/:role/reset-qr',
    authenticateToken,
    requireAdmin,
    validateCommitteeId,
    validatePresidiumRole,
    handleValidationErrors,
    controller.resetPresidiumQR
);

// Get all QR tokens for committee (for PDF generation - admin only)
router.get('/:committeeId/qr-tokens',
    authenticateToken,
    requireAdmin,
    validateCommitteeId,
    handleValidationErrors,
    controller.getCommitteeQRTokens
);

module.exports = router;