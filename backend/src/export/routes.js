// backend/src/export/routes.js - Updated with link-based export
const express = require('express');
const { param, query, validationResult } = require('express-validator');
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

// Committee ID validation
const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required')
];

// Format validation for export
const validateFormat = [
    query('format')
        .optional()
        .isIn(['json', 'plain', 'pdf'])
        .withMessage('Format must be json, plain, or pdf')
];

// Generate login links for committee delegates (admin only) - replaces QR codes
router.get('/delegate-links/:committeeId',
    global.auth.token,
    global.auth.admin, // Only admin can generate links
    validateCommitteeId,
    validateFormat,
    handleValidationErrors,
    controller.generateCommitteeLinks
);

// Generate presidium-only login links (admin only) - replaces QR codes
router.get('/presidium-links/:committeeId',
    global.auth.token,
    global.auth.admin, // Only admin can generate links
    validateCommitteeId,
    validateFormat,
    handleValidationErrors,
    controller.generatePresidiumLinks
);

// Generate complete login links (presidium + delegates) (admin only) - replaces QR codes
router.get('/complete-links/:committeeId',
    global.auth.token,
    global.auth.admin, // Only admin can generate links
    validateCommitteeId,
    validateFormat,
    handleValidationErrors,
    controller.generateCompleteLinks
);

// LEGACY ROUTES: Keep QR routes for backward compatibility during transition
// These will return deprecation notices

router.get('/qr-codes/:committeeId',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    (req, res) => {
        res.status(410).json({
            error: 'QR code export is deprecated. Please use link-based authentication.',
            newEndpoint: `/export/delegate-links/${req.params.committeeId}?format=plain`,
            migration: {
                'QR codes': 'Login links',
                'PDF export': 'Plain text or JSON export',
                'Scanning': 'Direct link access'
            }
        });
    }
);

router.get('/presidium-qr-codes/:committeeId',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    (req, res) => {
        res.status(410).json({
            error: 'Presidium QR code export is deprecated. Please use link-based authentication.',
            newEndpoint: `/export/presidium-links/${req.params.committeeId}?format=plain`
        });
    }
);

router.get('/complete-qr-codes/:committeeId',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    (req, res) => {
        res.status(410).json({
            error: 'Complete QR code export is deprecated. Please use link-based authentication.',
            newEndpoint: `/export/complete-links/${req.params.committeeId}?format=plain`
        });
    }
);

// UNCHANGED: Other export routes remain the same
// Export committee statistics (presidium + admin)
router.get('/statistics/:committeeId',
    global.auth.token,
    global.auth.presidium,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportStatistics
);

// Export voting results (presidium + admin)
router.get('/voting-results/:committeeId',
    global.auth.token,
    global.auth.presidium,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportVotingResults
);

// Export resolutions (presidium + admin)
router.get('/resolutions/:committeeId',
    global.auth.token,
    global.auth.presidium,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportResolutions
);

// Export complete committee report (admin only)
router.get('/committee-report/:committeeId',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportCompleteReport
);

module.exports = router;