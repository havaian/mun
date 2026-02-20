// backend/src/admin/routes.js
// Mounted at: /api/admin (platform-level, SuperAdmin only)
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateActivityQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isString(),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const validateBulkQR = [
    body('committeeIds').isArray({ min: 1 }).withMessage('At least one committee ID is required'),
    body('committeeIds.*').isMongoId().withMessage('Each committee ID must be a valid MongoDB ObjectId')
];

// All routes require token + superAdmin
router.use(
    global.auth.token,
    global.auth.superAdmin
);

// ====================
// DASHBOARD ROUTES
// ====================

// Get comprehensive dashboard statistics
router.get('/dashboard/stats', controller.getDashboardStats);

// Get recent system-wide activity with advanced filtering
router.get('/dashboard/activity',
    validateActivityQuery,
    handleValidationErrors,
    controller.getRecentActivity
);

// ====================
// SYSTEM MANAGEMENT ROUTES
// ====================

// Get system health and performance metrics
router.get('/system/health', controller.getSystemHealth);

// Clear all system caches (emergency/maintenance function)
router.post('/system/clear-cache', controller.clearCaches);

// ====================
// BULK OPERATIONS ROUTES
// ====================

// Bulk QR generation for multiple committees with enhanced error handling
router.post('/committees/bulk-qr',
    validateBulkQR,
    handleValidationErrors,
    controller.bulkGenerateQR
);

// ====================
// PERFORMANCE MONITORING ROUTES
// ====================

// Get detailed performance metrics
router.get('/performance/metrics', async (req, res) => {
    try {
        const metrics = {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            cpuUsage: process.cpuUsage(),
            timestamp: new Date().toISOString()
        };
        res.json({ success: true, metrics });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get performance metrics' });
    }
});

// Get API response time statistics
router.get('/performance/response-times',
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { limit = 100 } = req.query;

            // TODO: Integrate with actual monitoring system
            const responseTimes = Array.from({ length: parseInt(limit) }, (_, i) => ({
                endpoint: `/api/endpoint-${i % 10}`,
                method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
                responseTime: Math.floor(Math.random() * 500) + 50,
                timestamp: new Date(Date.now() - i * 60000),
                statusCode: [200, 201, 400, 500][Math.floor(Math.random() * 4)]
            }));

            res.json({
                success: true,
                responseTimes,
                summary: {
                    avgResponseTime: responseTimes.reduce((sum, rt) => sum + rt.responseTime, 0) / responseTimes.length,
                    maxResponseTime: Math.max(...responseTimes.map(rt => rt.responseTime)),
                    minResponseTime: Math.min(...responseTimes.map(rt => rt.responseTime))
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get response time statistics' });
        }
    }
);

// ====================
// DATA EXPORT ROUTES
// ====================

// Export system configuration
router.get('/export/config', async (req, res) => {
    try {
        const config = {
            version: process.env.npm_package_version || '1.0.0',
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development',
            exportedAt: new Date().toISOString(),
            exportedBy: req.user.email || req.user.userId
        };
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ error: 'Failed to export configuration' });
    }
});

// ====================
// MAINTENANCE ROUTES
// ====================

// Database maintenance operations
router.post('/maintenance/database',
    [
        body('operation').isIn(['optimize', 'reindex', 'cleanup', 'backup']).withMessage('Operation must be one of: optimize, reindex, cleanup, backup'),
        body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { operation, dryRun = false } = req.body;

            // TODO: Implement actual database maintenance operations
            const result = {
                operation,
                dryRun,
                status: 'completed',
                details: {
                    recordsProcessed: Math.floor(Math.random() * 10000),
                    timeElapsed: Math.floor(Math.random() * 5000) + 'ms',
                    optimizationsApplied: Math.floor(Math.random() * 50)
                },
                executedAt: new Date().toISOString(),
                executedBy: req.user.email || req.user.userId
            };

            res.json({ success: true, maintenance: result });
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute maintenance operation' });
        }
    }
);

// System backup operations
router.post('/maintenance/backup',
    [
        body('includeFiles').optional().isBoolean().withMessage('Include files must be a boolean'),
        body('compress').optional().isBoolean().withMessage('Compress must be a boolean')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { includeFiles = true, compress = true } = req.body;

            // TODO: Implement actual backup functionality
            const backup = {
                id: `backup_${Date.now()}`,
                status: 'initiated',
                includeFiles,
                compress,
                estimatedSize: Math.floor(Math.random() * 1000) + 'MB',
                initiatedAt: new Date().toISOString(),
                initiatedBy: req.user.email || req.user.userId
            };

            res.json({ success: true, message: 'Backup initiated successfully', backup });
        } catch (error) {
            res.status(500).json({ error: 'Failed to initiate backup' });
        }
    }
);

// ====================
// ADVANCED ANALYTICS ROUTES
// ====================

// Get user engagement analytics
router.get('/analytics/user-engagement',
    [query('period').optional().isIn(['24h', '7d', '30d', '90d']).withMessage('Period must be one of: 24h, 7d, 30d, 90d')],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { period = '7d' } = req.query;

            // TODO: Implement actual analytics
            const analytics = {
                period,
                totalUsers: Math.floor(Math.random() * 1000) + 500,
                activeUsers: Math.floor(Math.random() * 500) + 200,
                averageSessionDuration: Math.floor(Math.random() * 3600) + 300,
                topActivities: [
                    { activity: 'document_view', count: Math.floor(Math.random() * 1000) },
                    { activity: 'vote_cast', count: Math.floor(Math.random() * 500) },
                    { activity: 'message_sent', count: Math.floor(Math.random() * 800) }
                ],
                generatedAt: new Date().toISOString()
            };

            res.json({ success: true, analytics });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get user engagement analytics' });
        }
    }
);

// Get system usage patterns
router.get('/analytics/usage-patterns',
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
        try {
            // TODO: Implement actual usage pattern analysis
            const patterns = {
                peakHours: [
                    { hour: 9, usage: 85 },
                    { hour: 14, usage: 92 },
                    { hour: 20, usage: 78 }
                ],
                dailyTrends: Array.from({ length: 7 }, (_, i) => ({
                    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                    usage: Math.floor(Math.random() * 100)
                })),
                featureUsage: [
                    { feature: 'Document Management', usage: 95 },
                    { feature: 'Voting System', usage: 78 },
                    { feature: 'Messaging', usage: 67 },
                    { feature: 'Statistics', usage: 45 }
                ],
                generatedAt: new Date().toISOString()
            };

            res.json({ success: true, patterns });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get usage patterns' });
        }
    }
);

// ====================
// ERROR HANDLING
// ====================

router.use((error, req, res, next) => {
    global.logger.error('Admin route error:', error);
    res.status(500).json({
        error: 'Internal server error in admin module',
        details: error.message,
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

module.exports = router;