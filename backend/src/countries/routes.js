const express = require('express');
const { param, query, validationResult } = require('express-validator');

const controller = require('./controller');
const { authenticateToken, requireAdmin } = require('../auth/middleware');

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

const router = express.Router();

// Validation middleware
const validateCountryCode = [
    param('code')
        .isLength({ min: 2, max: 2 })
        .matches(/^[a-zA-Z]{2}$/)
        .withMessage('Country code must be exactly 2 letters')
        .toLowerCase()
];

const validateLanguage = [
    query('lang')
        .optional()
        .isIn(['en', 'ru', 'uz_lat', 'uz_cyr', 'all'])
        .withMessage('Language must be one of: en, ru, uz_lat, uz_cyr, all')
];

const validateCountryType = [
    query('type')
        .optional()
        .isIn(['all', 'members', 'observers', 'p5'])
        .withMessage('Type must be one of: all, members, observers, p5')
];

// Public routes (no authentication required)

// Get all countries with optional filtering and language support
router.get('/',
    authenticateToken,
    validateLanguage,
    validateCountryType,
    handleValidationErrors,
    controller.getCountries
);

// Get single country by code
router.get('/:code',
    authenticateToken,
    validateCountryCode,
    validateLanguage,
    handleValidationErrors,
    controller.getCountry
);

// Get single flag by country code
router.get('/flags/:code',
    authenticateToken,
    validateCountryCode,
    handleValidationErrors,
    controller.getSingleFlag
);

// Get flag metadata (available flags, counts, etc.)
router.get('/flags/meta/info',
    authenticateToken,
    controller.getFlagMetadata
);

// Health check for countries service
router.get('/meta/health',
    authenticateToken,
    controller.getServiceHealth
);

// Authenticated routes (authentication required)

// Get all flags in batch - requires authentication
router.get('/flags/all/batch',
    authenticateToken,
    controller.getAllFlags
);

// Admin routes (admin authentication required)

// Refresh flag cache (admin only)
router.post('/admin/refresh-flags',
    authenticateToken,
    requireAdmin,
    controller.refreshFlagCache
);

module.exports = router;