const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const { authenticateToken, requireAdmin, authRateLimit } = require('./middleware');

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

// QR login validation
const validateQrLogin = [
    body('token')
        .notEmpty()
        .withMessage('QR token is required')
        .isLength({ min: 10 })
        .withMessage('Invalid QR token format')
];

// Email binding validation
const validateEmailBinding = [
    body('token')
        .notEmpty()
        .withMessage('QR token is required'),
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
        .normalizeEmail()
];

// Routes

// Admin authentication (unchanged)
router.post('/admin-login',
    authRateLimit,
    validateAdminLogin,
    handleValidationErrors,
    controller.adminLogin
);

// QR code authentication (for both delegates AND presidium)
router.post('/qr-login',
    authRateLimit,
    validateQrLogin,
    handleValidationErrors,
    controller.qrLogin
);

// Email binding after QR verification (for both delegates AND presidium)
router.post('/bind-email',
    authRateLimit,
    validateEmailBinding,
    handleValidationErrors,
    controller.bindEmail
);

// Email login for delegates AND presidium (after email binding)
router.post('/email-login',
    authRateLimit,
    validateEmailLogin,
    handleValidationErrors,
    controller.emailLogin
);

// Logout (requires authentication)
router.post('/logout',
    authenticateToken,
    controller.logout
);

// Session validation
router.get('/validate-session',
    authenticateToken,
    controller.validateSession
);

// Check QR token status
router.get('/qr-status/:token',
    controller.checkQrStatus
);

// QR token reactivation (admin only)
router.post('/reactivate-qr',
    authenticateToken,
    requireAdmin, // Only admin can reactivate QR codes
    [
        body('userId')
            .isMongoId()
            .withMessage('Valid user ID is required')
    ],
    handleValidationErrors,
    controller.reactivateQr
);

module.exports = router;