const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const { authenticateToken, requirePresidium, authRateLimit } = require('./middleware');

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

// Presidium login validation  
const validatePresidiumLogin = [
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

// Admin authentication
router.post('/admin-login',
    authRateLimit,
    validateAdminLogin,
    handleValidationErrors,
    controller.adminLogin
);

// Presidium authentication
router.post('/presidium-login',
    authRateLimit,
    validatePresidiumLogin,
    handleValidationErrors,
    controller.presidiumLogin
);

// QR code authentication (initial delegate access)
router.post('/qr-login',
    authRateLimit,
    validateQrLogin,
    handleValidationErrors,
    controller.qrLogin
);

// Email binding after QR verification
router.post('/bind-email',
    authRateLimit,
    validateEmailBinding,
    handleValidationErrors,
    controller.bindEmail
);

// Email login for delegates (after email binding)
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

// QR token reactivation (presidium only)
router.post('/reactivate-qr',
    authenticateToken,
    requirePresidium,
    [
        body('countryName')
            .notEmpty()
            .withMessage('Country name is required'),
        body('reason')
            .optional()
            .isLength({ min: 5 })
            .withMessage('Reason must be at least 5 characters if provided')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { countryName, reason = 'Manual reactivation by presidium' } = req.body;
            const { User } = require('./model');
            const logger = require('../utils/logger');

            // Find the delegate for the country in the same committee
            const delegate = await User.findOne({
                countryName: countryName,
                committeeId: req.user.committeeId,
                role: 'delegate'
            });

            if (!delegate) {
                return res.status(404).json({
                    error: 'Delegate not found for this country in your committee'
                });
            }

            // Reactivate QR and clear email binding
            delegate.isQrActive = true;
            delegate.email = null;
            delegate.sessionId = null;
            await delegate.save();

            // Deactivate any active sessions for this user
            const { ActiveSession } = require('./model');
            await ActiveSession.updateMany(
                { userId: delegate._id },
                { isActive: false }
            );

            logger.info(`QR reactivated for ${countryName} by ${req.user.presidiumRole} (${req.user.userId}). Reason: ${reason}`);

            res.json({
                success: true,
                message: `QR code reactivated for ${countryName}`,
                country: countryName,
                qrToken: delegate.qrToken
            });

        } catch (error) {
            logger.error('QR reactivation error:', error);
            res.status(500).json({ error: 'QR reactivation failed' });
        }
    }
);

// Terminate specific session (admin only)
router.delete('/terminate-session/:sessionId',
    authenticateToken,
    [
        body('reason')
            .optional()
            .isLength({ min: 5 })
            .withMessage('Reason must be at least 5 characters if provided')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            // Only admin can terminate other users' sessions
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            const { sessionId } = req.params;
            const { reason = 'Terminated by administrator' } = req.body;
            const { ActiveSession } = require('./model');
            const logger = require('../utils/logger');

            // Find and deactivate the session
            const session = await ActiveSession.findOne({
                sessionToken: sessionId,
                isActive: true
            }).populate('userId');

            if (!session) {
                return res.status(404).json({ error: 'Session not found or already terminated' });
            }

            session.isActive = false;
            await session.save();

            // Clear sessionId from user
            await User.findByIdAndUpdate(session.userId, { sessionId: null });

            logger.info(`Session terminated by admin: ${sessionId} (User: ${session.userId}). Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Session terminated successfully'
            });

        } catch (error) {
            logger.error('Session termination error:', error);
            res.status(500).json({ error: 'Session termination failed' });
        }
    }
);

module.exports = router;