const express = require('express');
const router = express.Router();
const controller = require('./controller');

// All routes require authentication
router.get('/', 
    global.auth.token, 
    controller.getMyNotifications
);
router.get('/unread-count', 
    global.auth.token, 
    controller.getUnreadCount
);
router.put('/:id/read', 
    global.auth.token, 
    controller.markAsRead
);
router.put('/read-all', 
    global.auth.token, 
    controller.markAllAsRead
);

module.exports = router;