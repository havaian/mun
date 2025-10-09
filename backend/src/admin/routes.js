const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const router = express.Router();

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

// Validation rules
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

const validateActivityQuery = [
    ...validatePagination,
    query('type')
        .optional()
        .isIn(['all', 'login', 'logout', 'document_upload', 'vote_cast', 'session_start', 'session_end', 'committee_create', 'event_create', 'user_create'])
        .withMessage('Invalid activity type'),
    query('timeRange')
        .optional()
        .isIn(['1h', '24h', '7d', '30d'])
        .withMessage('Time range must be one of: 1h, 24h, 7d, 30d'),
    query('userId')
        .optional()
        .isEmail()
        .withMessage('User ID must be a valid email')
];

const validateBulkQR = [
    body('committeeIds')
        .isArray({ min: 1, max: 50 })
        .withMessage('Committee IDs must be an array with 1-50 items'),
    body('committeeIds.*')
        .isMongoId()
        .withMessage('Each committee ID must be a valid MongoDB ObjectId')
];

// ====================
// DASHBOARD ROUTES
// ====================

// Get comprehensive dashboard statistics
router.get('/dashboard/stats',
    authenticateToken,
    requireAdmin,
    controller.getDashboardStats
);

// Get recent system-wide activity with advanced filtering
router.get('/dashboard/activity',
    authenticateToken,
    requireAdmin,
    validateActivityQuery,
    handleValidationErrors,
    controller.getRecentActivity
);

// ====================
// SYSTEM MANAGEMENT ROUTES
// ====================

// Get system health and performance metrics
router.get('/system/health',
    authenticateToken,
    requireAdmin,
    controller.getSystemHealth
);

// Clear all system caches (emergency/maintenance function)
router.post('/system/clear-cache',
    authenticateToken,
    requireAdmin,
    controller.clearCaches
);

// ====================
// BULK OPERATIONS ROUTES
// ====================

// Bulk QR generation for multiple committees with enhanced error handling
router.post('/committees/bulk-qr',
    authenticateToken,
    requireAdmin,
    validateBulkQR,
    handleValidationErrors,
    controller.bulkGenerateQR
);

// ====================
// PERFORMANCE MONITORING ROUTES
// ====================

// Get detailed performance metrics
router.get('/performance/metrics',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const metrics = {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                cpuUsage: process.cpuUsage(),
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                metrics
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get performance metrics' });
        }
    }
);

// Get API response time statistics
router.get('/performance/response-times',
    authenticateToken,
    requireAdmin,
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
        try {
            // This would integrate with a monitoring system in production
            // For now, return mock data
            const { limit = 100 } = req.query;

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
router.get('/export/config',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const config = {
                version: process.env.npm_package_version || '1.0.0',
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development',
                exportedAt: new Date().toISOString(),
                exportedBy: req.user.email || req.user.userId
            };

            res.json({
                success: true,
                config
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to export configuration' });
        }
    }
);

// Export audit logs
router.get('/export/audit-logs',
    authenticateToken,
    requireAdmin,
    [
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be a valid ISO8601 date'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be a valid ISO8601 date'),
        query('format')
            .optional()
            .isIn(['json', 'csv'])
            .withMessage('Format must be json or csv')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { startDate, endDate, format = 'json' } = req.query;

            // This would integrate with your audit logging system
            // For now, return mock data
            const auditLogs = [
                {
                    id: '1',
                    action: 'USER_LOGIN',
                    userId: 'admin@example.com',
                    timestamp: new Date().toISOString(),
                    details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
                }
            ];

            if (format === 'csv') {
                // Convert to CSV format
                const csv = auditLogs.map(log =>
                    `${log.id},${log.action},${log.userId},${log.timestamp}`
                ).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
                res.send(`id,action,userId,timestamp\n${csv}`);
            } else {
                res.json({
                    success: true,
                    auditLogs,
                    exportParameters: { startDate, endDate, format }
                });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to export audit logs' });
        }
    }
);

// ====================
// MAINTENANCE ROUTES
// ====================

// Database maintenance operations
router.post('/maintenance/database',
    authenticateToken,
    requireAdmin,
    [
        body('operation')
            .isIn(['optimize', 'reindex', 'cleanup', 'backup'])
            .withMessage('Operation must be one of: optimize, reindex, cleanup, backup'),
        body('dryRun')
            .optional()
            .isBoolean()
            .withMessage('Dry run must be a boolean')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { operation, dryRun = false } = req.body;

            // This would implement actual database maintenance operations
            // For now, return mock response
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

            res.json({
                success: true,
                maintenance: result
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to execute maintenance operation' });
        }
    }
);

// System backup operations
router.post('/maintenance/backup',
    authenticateToken,
    requireAdmin,
    [
        body('includeFiles')
            .optional()
            .isBoolean()
            .withMessage('Include files must be a boolean'),
        body('compress')
            .optional()
            .isBoolean()
            .withMessage('Compress must be a boolean')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { includeFiles = true, compress = true } = req.body;

            // This would implement actual backup functionality
            // For now, return mock response
            const backup = {
                id: `backup_${Date.now()}`,
                status: 'initiated',
                includeFiles,
                compress,
                estimatedSize: Math.floor(Math.random() * 1000) + 'MB',
                initiatedAt: new Date().toISOString(),
                initiatedBy: req.user.email || req.user.userId
            };

            res.json({
                success: true,
                message: 'Backup initiated successfully',
                backup
            });
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
    authenticateToken,
    requireAdmin,
    [
        query('period')
            .optional()
            .isIn(['24h', '7d', '30d', '90d'])
            .withMessage('Period must be one of: 24h, 7d, 30d, 90d')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { period = '7d' } = req.query;

            // This would implement actual analytics
            // For now, return mock data
            const analytics = {
                period,
                totalUsers: Math.floor(Math.random() * 1000) + 500,
                activeUsers: Math.floor(Math.random() * 500) + 200,
                averageSessionDuration: Math.floor(Math.random() * 3600) + 300, // seconds
                topActivities: [
                    { activity: 'document_view', count: Math.floor(Math.random() * 1000) },
                    { activity: 'vote_cast', count: Math.floor(Math.random() * 500) },
                    { activity: 'message_sent', count: Math.floor(Math.random() * 800) }
                ],
                generatedAt: new Date().toISOString()
            };

            res.json({
                success: true,
                analytics
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get user engagement analytics' });
        }
    }
);

// Get system usage patterns
router.get('/analytics/usage-patterns',
    authenticateToken,
    requireAdmin,
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
        try {
            // This would implement actual usage pattern analysis
            // For now, return mock data
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

            res.json({
                success: true,
                patterns
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get usage patterns' });
        }
    }
);

// ====================
// ERROR HANDLING
// ====================

// Global error handler for admin routes
router.use((error, req, res, next) => {
    console.error('Admin route error:', error);

    res.status(500).json({
        error: 'Internal server error in admin module',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

module.exports = router;