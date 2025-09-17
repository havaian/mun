const express = require('express');
const router = express.Router();

const controller = require('./controller');
const { authenticateToken, requireAdmin } = require('../auth/middleware');

// Get admin dashboard statistics
router.get('/dashboard/stats',
    authenticateToken,
    requireAdmin,
    controller.getDashboardStats
);

// Get recent system-wide activity
router.get('/dashboard/activity',
    authenticateToken,
    requireAdmin,
    controller.getRecentActivity
);

// Bulk QR generation for multiple committees
router.post('/committees/bulk-qr',
    authenticateToken,
    requireAdmin,
    controller.bulkGenerateQR
);

module.exports = router;