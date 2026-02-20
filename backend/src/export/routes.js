// backend/src/export/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/export
const express = require('express');
const { param, query, validationResult } = require('express-validator');
const router = express.Router({ mergeParams: true });

const controller = require('./controller');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateFormat = [
    query('format').optional().isIn(['json', 'plain', 'pdf']).withMessage('Format must be json, plain, or pdf')
];

// Shared: token + event context
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId')
);

// ==================== LOGIN LINK GENERATION (OrgAdmin only) ====================
// committeeId comes from the URL params (mergeParams)

// Generate login links for committee delegates (OrgAdmin only)
router.get('/delegate-links',
    global.auth.orgAdmin('orgId'),
    validateFormat,
    handleValidationErrors,
    (req, res) => {
        // Pass committeeId from URL params to controller
        req.params.committeeId = req.params.committeeId;
        controller.generateDelegateLinks(req, res);
    }
);

// Generate presidium-only login links (OrgAdmin only)
router.get('/presidium-links',
    global.auth.orgAdmin('orgId'),
    validateFormat,
    handleValidationErrors,
    (req, res) => {
        req.params.committeeId = req.params.committeeId;
        controller.generatePresidiumLinks(req, res);
    }
);

// Generate complete login links (presidium + delegates) (OrgAdmin only)
router.get('/complete-links',
    global.auth.orgAdmin('orgId'),
    validateFormat,
    handleValidationErrors,
    (req, res) => {
        req.params.committeeId = req.params.committeeId;
        controller.generateCompleteLinks(req, res);
    }
);

// ==================== LEGACY QR ROUTES (deprecated) ====================

router.get('/qr-codes',
    global.auth.orgAdmin('orgId'),
    handleValidationErrors,
    (req, res) => {
        res.status(410).json({
            error: 'QR code export is deprecated. Please use link-based authentication.',
            newEndpoint: `delegate-links?format=plain`,
            migration: { 'QR codes': 'Login links', 'PDF export': 'Plain text or JSON export', 'Scanning': 'Direct link access' }
        });
    }
);

router.get('/presidium-qr-codes',
    global.auth.orgAdmin('orgId'),
    handleValidationErrors,
    (req, res) => {
        res.status(410).json({
            error: 'Presidium QR code export is deprecated. Please use link-based authentication.',
            newEndpoint: `presidium-links?format=plain`
        });
    }
);

module.exports = router;