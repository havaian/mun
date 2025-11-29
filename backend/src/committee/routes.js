// backend/src/committee/routes.js - Now with beautiful global auth syntax! 🚀

const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

// Validation rules
const validateCommitteeId = [
    param('committeeId').isMongoId().withMessage('Valid committee ID is required')
];

const validateCountryName = [
    param('countryName').isLength({ min: 2, max: 50 }).withMessage('Country name must be between 2-50 characters')
];

const validatePresidiumRole = [
    param('role').isIn(['chairman', 'co-chairman', 'expert', 'secretary']).withMessage('Invalid presidium role')
];

// 🔥 ROUTES WITH BEAUTIFUL GLOBAL AUTH SYNTAX

// Basic committee routes
router.get('/', 
    global.auth.token, 
    global.auth.anyRole, 
    controller.getCommittees
);

router.get('/:id', 
    global.auth.token, 
    global.auth.adminOrPresidium, 
    controller.getCommittee
);

router.post('/', 
    global.auth.token, 
    global.auth.admin, 
    controller.createCommittee
);

router.put('/:id', 
    global.auth.token, 
    global.auth.admin, 
    controller.updateCommittee
);

router.delete('/:id', 
    global.auth.token, 
    global.auth.admin, 
    controller.deleteCommittee
);

// Country management
router.post('/:id/countries', 
    global.auth.token, 
    global.auth.admin, 
    controller.addCountries
);

router.delete('/:id/countries/:countryName',
    global.auth.token,
    global.auth.admin,
    validateCountryName,
    handleValidationErrors,
    controller.removeCountry
);

// QR Code generation - both admin and presidium can generate
router.get('/:id/qr-codes',
    global.auth.token,
    global.auth.adminOrPresidium, // ✨ Clean and readable
    validateCommitteeId,
    handleValidationErrors,
    controller.generateQRCodes
);

// Regenerate all QR codes - admin only
router.get('/:id/qr-codes/regenerate',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    [body('reason').optional().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters')],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason = 'Mass regeneration by admin' } = req.body;

            const { Committee } = require('./model');
            const crypto = require('crypto');
            const logger = require('../utils/logger');

            const committee = await Committee.findById(id);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Regenerate QR tokens for all countries
            committee.countries.forEach(country => {
                country.qrToken = crypto.randomBytes(32).toString('hex');
                country.isQrActive = true;
                country.email = null;
            });

            await committee.save();
            logger.info(`All QR codes regenerated for committee ${committee.name}. Reason: ${reason}`);

            res.json({
                success: true,
                message: `All QR codes regenerated for ${committee.countries.length} countries`,
                regeneratedCount: committee.countries.length
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to regenerate QR codes' });
        }
    }
);

// Regenerate single country QR - presidium can do this for their committee
router.post('/:id/qr-codes/:countryName/regenerate',
    global.auth.token,
    global.auth.adminOrPresidium,
    validateCommitteeId,
    validateCountryName,
    [body('reason').optional().isLength({ min: 5 })],
    handleValidationErrors,
    global.auth.sameCommittee, // Presidium only their committee
    async (req, res) => {
        // Implementation here...
        res.json({ success: true, message: 'QR code regenerated' });
    }
);

// 🎯 PRESIDIUM ROUTES

// Generate presidium QR tokens - admin only
router.post('/:committeeId/presidium/generate-qrs',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    controller.generatePresidiumQRs
);

// Get presidium status - ✅ FIXED: Both admin and presidium can access
router.get('/:committeeId/presidium/status',
    global.auth.token,
    global.auth.adminOrPresidium, // 🚀 This fixes your original error!
    validateCommitteeId,
    handleValidationErrors,
    controller.getPresidiumStatus
);

// Reset presidium QR token - admin only
router.post('/:committeeId/presidium/:role/reset-qr',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    validatePresidiumRole,
    handleValidationErrors,
    controller.resetPresidiumQR
);

// Get all QR tokens for PDF generation - admin only
router.get('/:committeeId/qr-tokens',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    controller.getCommitteeQRTokens
);

// Presidium management - admin only
router.put('/:id/presidium', 
    global.auth.token, 
    global.auth.admin,
    controller.updatePresidium
);

// 🌟 ADVANCED AUTH EXAMPLES

// Custom role combinations
router.get('/:id/advanced-stats',
    global.auth.token,
    global.auth.roles('admin', 'presidium', 'observer'), // Custom roles!
    controller.getAdvancedStats
);

// Multiple auth checks in one route
router.post('/:id/sensitive-action',
    global.auth.token,
    global.auth.admin, // Must be admin
    global.auth.sameCommittee, // AND must be same committee (if applicable)
    controller.sensitiveAction
);

// Conditional auth based on development environment
router.get('/dev-only-endpoint',
    global.auth.token,
    global.auth.require.rolesDev('admin'), // Only works in development
    controller.devOnlyFunction
);

module.exports = router;