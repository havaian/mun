// =============================================
// EMAIL VERIFICATION GATE — Phase 4
//
// Hard-blocks unverified users from submitting applications.
//
// USAGE: Add to backend/src/registration/routes.js
//   on the POST /applications route:
//
//   BEFORE (Phase 1):
//     router.post('/applications',
//         global.auth.token,
//         appController.submitApplication
//     );
//
//   AFTER:
//     const { requireVerifiedEmail } = require('../email/middleware');
//
//     router.post('/applications',
//         global.auth.token,
//         requireVerifiedEmail,
//         appController.submitApplication
//     );
//
// File location: backend/src/email/middleware.js
// =============================================

const { User } = require('../auth/model');

/**
 * Middleware: require email-verified user
 * Returns 403 if user's emailVerified !== true
 */
const requireVerifiedEmail = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.user.userId).select('emailVerified').lean();

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Email verification required',
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Please verify your email address before submitting an application. Check your inbox or request a new verification link.'
            });
        }

        next();
    } catch (error) {
        global.logger.error('Email verification check error:', error);
        res.status(500).json({ error: 'Failed to verify email status' });
    }
};

module.exports = { requireVerifiedEmail };