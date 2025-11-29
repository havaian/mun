const express = require('express');
const { param, query, validationResult } = require('express-validator');

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
    global.auth.token,
    validateLanguage,
    validateCountryType,
    handleValidationErrors,
    controller.getCountries
);

// Get single country by code
router.get('/:code',
    global.auth.token,
    validateCountryCode,
    validateLanguage,
    handleValidationErrors,
    controller.getCountry
);

// Get single flag by country code
router.get('/flags/:code',
    global.auth.token,
    validateCountryCode,
    handleValidationErrors,
    controller.getSingleFlag
);

// Get flag metadata (available flags, counts, etc.)
router.get('/flags/meta/info',
    global.auth.token,
    controller.getFlagMetadata
);

// Health check for countries service
router.get('/meta/health',
    global.auth.token,
    controller.getServiceHealth
);

// Authenticated routes (authentication required)

// Get all flags in batch - requires authentication
router.get('/flags/all/batch',
    global.auth.token,
    controller.getAllFlags
);

// Admin routes (admin authentication required)

// Refresh flag cache (admin only)
router.post('/admin/refresh-flags',
    global.auth.token,
    global.auth.admin,
    controller.refreshFlagCache
);

module.exports = router;