const express = require('express');
const { body, validationResult } = require('express-validator');
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

// Admin login validation
const validateAdminLogin = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters')
        .trim()
        .toLowerCase(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

// Link login validation (replaces QR validation)
const validateLinkLogin = [
    body('token')
        .notEmpty()
        .withMessage('Login token is required')
        .withMessage('Invalid login token format')
];

// Email binding validation
const validateEmailBinding = [
    body('token')
        .notEmpty()
        .withMessage('Login token is required'),
    body('email')
        .isEmail()
        .withMessage('Valid email address is required')
        .normalizeEmail()
];

// Email login validation
const validateEmailLogin = [
    body('email')
        .isEmail()
        .withMessage('Valid email address is required')
        .normalizeEmail(),
    body('loginToken')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Invalid login token format')
];

// Routes

// Admin authentication (unchanged)
router.post('/admin-login',
    global.auth.utils.authRateLimit,
    validateAdminLogin,
    handleValidationErrors,
    controller.adminLogin
);

router.post('/refresh-token',
    global.auth.token,
    controller.refreshToken
);

// Link authentication (for both delegates AND presidium) - replaces qr-login
router.post('/link-login',
    global.auth.utils.authRateLimit,
    validateLinkLogin,
    handleValidationErrors,
    controller.linkLogin
);

// Email binding after link verification (for both delegates AND presidium)
router.post('/bind-email',
    global.auth.utils.authRateLimit,
    validateEmailBinding,
    handleValidationErrors,
    controller.bindEmail
);

// Email login for delegates AND presidium (after email binding)
router.post('/email-login',
    global.auth.utils.authRateLimit,
    validateEmailLogin,
    handleValidationErrors,
    controller.emailLogin
);

// Logout (requires authentication)
router.post('/logout',
    global.auth.token,
    controller.logout
);

// Session validation
router.get('/validate-session',
    global.auth.token,
    controller.validateSession
);

// Check login link status - replaces qr-status
router.get('/link-status/:token',
    controller.checkLinkStatus
);

// Login link reactivation (admin only) - replaces reactivate-qr
router.post('/reactivate-link',
    global.auth.token,
    global.auth.admin, // Only admin can reactivate login links
    [
        body('userId')
            .isMongoId()
            .withMessage('Valid user ID is required')
    ],
    handleValidationErrors,
    controller.reactivateLink
);

// LEGACY ROUTES: Keep these for backward compatibility during transition
// TODO: Remove these after frontend is updated

// Redirect old QR routes to new link routes
router.post('/qr-login', (req, res) => {
    res.status(410).json({
        error: 'QR login is deprecated. Please use link-based authentication.',
        newEndpoint: '/auth/link-login'
    });
});

router.get('/qr-status/:token', (req, res) => {
    res.status(410).json({
        error: 'QR status check is deprecated. Please use link-based authentication.',
        newEndpoint: '/auth/link-status/:token'
    });
});

router.post('/reactivate-qr', (req, res) => {
    res.status(410).json({
        error: 'QR reactivation is deprecated. Please use link-based authentication.',
        newEndpoint: '/auth/reactivate-link'
    });
});

module.exports = router;