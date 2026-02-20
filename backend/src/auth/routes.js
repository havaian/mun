const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authRateLimit } = require('./middleware');

// Public routes (no auth required)
router.post('/register',
    authRateLimit,
    controller.register
);
router.post('/login',
    authRateLimit,
    controller.login
);
router.post('/password-reset/request',
    authRateLimit,
    controller.requestPasswordReset
);
router.post('/password-reset/confirm',
    authRateLimit,
    controller.resetPassword
);

// Protected routes (auth required)
router.get('/me',
    global.auth.token,
    controller.getMe
);
router.put('/profile',
    global.auth.token,
    controller.updateProfile
);
router.put('/change-password',
    global.auth.token,
    controller.changePassword
);

module.exports = router;