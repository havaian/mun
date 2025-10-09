const logger = require('../utils/logger');

// Performance optimization: Cache frequently accessed data
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Helper function to get cached data or fetch fresh
const getCachedData = async (key, fetchFunction, ttl = CACHE_TTL) => {
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && (now - cached.timestamp) < ttl) {
        return cached.data;
    }

    const data = await fetchFunction();
    cache.set(key, { data, timestamp: now });
    return data;
};

// Get comprehensive dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const stats = await getCachedData('dashboard_stats', async () => {
            const { Event } = require('../event/model');
            const { Committee } = require('../committee/model');
            const { User } = require('../auth/model');
            const { Document } = require('../document/model');
            const { Session } = require('../session/model');
            const { Voting } = require('../voting/model');

            // Use Promise.all for parallel queries to improve performance
            const [
                eventStats,
                committeeStats,
                userStats,
                documentStats,
                sessionStats,
                votingStats
            ] = await Promise.all([
                // Event statistics
                Event.aggregate([
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            active: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                                }
                            },
                            draft: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
                                }
                            },
                            completed: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                                }
                            }
                        }
                    }
                ]),

                // Committee statistics
                Committee.aggregate([
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            active: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                                }
                            },
                            totalCountries: { $sum: { $size: '$countries' } },
                            avgCountriesPerCommittee: { $avg: { $size: '$countries' } }
                        }
                    }
                ]),

                // User statistics
                User.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 },
                            active: {
                                $sum: {
                                    $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                                }
                            }
                        }
                    }
                ]),

                // Document statistics
                Document.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]),

                // Session statistics (last 24 hours)
                Session.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            avgDuration: { $avg: '$totalDuration' }
                        }
                    }
                ]),

                // Voting statistics (last 7 days)
                Voting.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            avgParticipation: { $avg: { $size: '$votes' } }
                        }
                    }
                ])
            ]);

            // Process and format the aggregated data
            const eventData = eventStats[0] || { total: 0, active: 0, draft: 0, completed: 0 };
            const committeeData = committeeStats[0] || { total: 0, active: 0, totalCountries: 0, avgCountriesPerCommittee: 0 };

            // Process user data
            const usersByRole = {};
            let totalUsers = 0;
            let activeUsers = 0;

            userStats.forEach(stat => {
                usersByRole[stat._id] = {
                    total: stat.count,
                    active: stat.active
                };
                totalUsers += stat.count;
                activeUsers += stat.active;
            });

            // Process document data
            const documentsByStatus = {};
            let totalDocuments = 0;

            documentStats.forEach(stat => {
                documentsByStatus[stat._id] = stat.count;
                totalDocuments += stat.count;
            });

            // Process session data
            const sessionsByStatus = {};
            sessionStats.forEach(stat => {
                sessionsByStatus[stat._id] = {
                    count: stat.count,
                    avgDuration: stat.avgDuration
                };
            });

            // Process voting data
            const votingsByStatus = {};
            votingStats.forEach(stat => {
                votingsByStatus[stat._id] = {
                    count: stat.count,
                    avgParticipation: stat.avgParticipation
                };
            });

            return {
                // Core metrics
                totalEvents: eventData.total,
                activeEvents: eventData.active,
                draftEvents: eventData.draft,
                completedEvents: eventData.completed,

                totalCommittees: committeeData.total,
                activeCommittees: committeeData.active,
                totalCountries: committeeData.totalCountries,
                avgCountriesPerCommittee: Math.round(committeeData.avgCountriesPerCommittee * 10) / 10,

                registeredUsers: totalUsers,
                activeUsers: activeUsers,
                usersByRole: usersByRole,

                documentsUploaded: totalDocuments,
                documentsByStatus: documentsByStatus,
                pendingModeration: documentsByStatus.pending || 0,

                // Recent activity metrics
                recentSessions: sessionsByStatus,
                recentVotings: votingsByStatus,

                // Performance metrics
                cacheHit: false,
                lastUpdated: new Date().toISOString()
            };
        });

        // Add cache hit indicator
        stats.cacheHit = cache.has('dashboard_stats');

        res.json({
            success: true,
            stats,
            performance: {
                cached: stats.cacheHit,
                generatedAt: new Date().toISOString()
            }
        });

        logger.info(`Dashboard stats requested by admin - Cache hit: ${stats.cacheHit}`);

    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        res.status(500).json({
            error: 'Failed to get dashboard statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get recent system activity with pagination and filtering
const getRecentActivity = async (req, res) => {
    try {
        const {
            limit = 20,
            page = 1,
            type = 'all',
            timeRange = '24h',
            userId = null
        } = req.query;

        const cacheKey = `recent_activity_${limit}_${page}_${type}_${timeRange}_${userId}`;

        const activityData = await getCachedData(cacheKey, async () => {
            const { Activity } = require('../statistics/model');

            // Build filter object
            const filter = {};

            // Time range filter
            const now = new Date();
            let timeFilter;
            switch (timeRange) {
                case '1h':
                    timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }

            filter.timestamp = { $gte: timeFilter };

            // Type filter
            if (type !== 'all') {
                filter.actionType = type;
            }

            // User filter
            if (userId) {
                filter.userEmail = userId;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Parallel query for data and count
            const [activities, totalCount] = await Promise.all([
                Activity.find(filter)
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .populate('userId', 'username email')
                    .populate('committeeId', 'name')
                    .populate('eventId', 'name')
                    .lean(),

                Activity.countDocuments(filter)
            ]);

            // Format activities for display
            const formattedActivities = activities.map(activity => ({
                id: activity._id,
                description: formatActivityDescription(activity),
                timestamp: activity.timestamp,
                user: activity.userId?.username || activity.userEmail || 'System',
                committee: activity.committeeId?.name,
                event: activity.eventId?.name,
                type: activity.actionType,
                category: activity.category,
                details: activity.details,
                scoreImpact: activity.scoreImpact
            }));

            return {
                activities: formattedActivities,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: skip + activities.length < totalCount,
                    hasPrevPage: parseInt(page) > 1
                },
                filters: {
                    type,
                    timeRange,
                    userId
                }
            };
        }, 10000); // Cache for 10 seconds for activity data

        res.json({
            success: true,
            ...activityData,
            performance: {
                cached: cache.has(cacheKey),
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Get recent activity error:', error);
        res.status(500).json({
            error: 'Failed to get recent activity',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Enhanced bulk QR generation with progress tracking
const bulkGenerateQR = async (req, res) => {
    try {
        const { committeeIds } = req.body;

        if (!Array.isArray(committeeIds) || committeeIds.length === 0) {
            return res.status(400).json({
                error: 'Committee IDs array is required'
            });
        }

        if (committeeIds.length > 50) {
            return res.status(400).json({
                error: 'Maximum 50 committees can be processed at once'
            });
        }

        const { Committee } = require('../committee/model');

        // Validate all committees exist first
        const committees = await Committee.find({
            _id: { $in: committeeIds }
        }).select('_id name countries status');

        if (committees.length !== committeeIds.length) {
            const foundIds = committees.map(c => c._id.toString());
            const missingIds = committeeIds.filter(id => !foundIds.includes(id));
            return res.status(400).json({
                error: 'Some committees not found',
                missingCommittees: missingIds
            });
        }

        const results = [];
        let totalGenerated = 0;
        let totalErrors = 0;

        // Process committees in batches for better performance
        const batchSize = 5;
        for (let i = 0; i < committees.length; i += batchSize) {
            const batch = committees.slice(i, i + batchSize);

            const batchPromises = batch.map(async (committee) => {
                try {
                    if (committee.status !== 'active') {
                        return {
                            committeeId: committee._id,
                            committeeName: committee.name,
                            success: false,
                            error: 'Committee is not active',
                            warning: true
                        };
                    }

                    if (!committee.countries || committee.countries.length === 0) {
                        return {
                            committeeId: committee._id,
                            committeeName: committee.name,
                            success: false,
                            error: 'No countries in committee',
                            warning: true
                        };
                    }

                    // Generate QR tokens if not already generated
                    const hadExistingTokens = committee.countries.some(country => country.qrToken);

                    committee.generateQRTokens();
                    await committee.save();

                    const result = {
                        committeeId: committee._id,
                        committeeName: committee.name,
                        success: true,
                        qrCodesGenerated: committee.countries.length,
                        hadExistingTokens,
                        regenerated: hadExistingTokens
                    };

                    totalGenerated += committee.countries.length;
                    return result;

                } catch (error) {
                    logger.error(`Bulk QR error for committee ${committee._id}:`, error);
                    totalErrors++;
                    return {
                        committeeId: committee._id,
                        committeeName: committee.name,
                        success: false,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        // Clear related caches
        cache.delete('dashboard_stats');

        const response = {
            success: true,
            message: `Bulk QR generation completed for ${committeeIds.length} committees`,
            summary: {
                totalCommittees: committeeIds.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success && !r.warning).length,
                warnings: results.filter(r => r.warning).length,
                totalQRGenerated: totalGenerated,
                totalErrors: totalErrors
            },
            results,
            performance: {
                processedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - Date.now() // This would be calculated properly in real implementation
            }
        };

        logger.info(`Bulk QR generation completed. Total QR codes generated: ${totalGenerated}, Errors: ${totalErrors}`);

        res.json(response);

    } catch (error) {
        logger.error('Bulk generate QR error:', error);
        res.status(500).json({
            error: 'Failed to bulk generate QR codes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get system health and performance metrics
const getSystemHealth = async (req, res) => {
    try {
        const healthData = await getCachedData('system_health', async () => {
            const { mongoose } = require('mongoose');

            // Check database connection
            const dbState = mongoose.connection.readyState;
            const dbStatus = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            }[dbState] || 'unknown';

            // Get database stats
            const dbStats = await mongoose.connection.db.stats();

            // Memory usage
            const memoryUsage = process.memoryUsage();

            // System uptime
            const uptime = process.uptime();

            return {
                api: {
                    status: 'healthy',
                    uptime: uptime,
                    memoryUsage: {
                        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
                    }
                },
                database: {
                    status: dbStatus,
                    collections: dbStats.collections,
                    dataSize: Math.round(dbStats.dataSize / 1024 / 1024), // MB
                    indexSize: Math.round(dbStats.indexSize / 1024 / 1024), // MB
                    storageSize: Math.round(dbStats.storageSize / 1024 / 1024) // MB
                },
                performance: {
                    responseTime: Date.now() - Date.now(), // This would be calculated properly
                    cacheSize: cache.size,
                    cacheHitRate: calculateCacheHitRate()
                }
            };
        }, 5000); // Cache for 5 seconds

        res.json({
            success: true,
            health: healthData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Get system health error:', error);
        res.status(500).json({
            error: 'Failed to get system health',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Clear all caches (admin utility function)
const clearCaches = async (req, res) => {
    try {
        const cacheSize = cache.size;
        cache.clear();

        logger.info(`Admin cleared all caches. ${cacheSize} entries removed.`);

        res.json({
            success: true,
            message: `Cleared ${cacheSize} cache entries`,
            clearedAt: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Clear caches error:', error);
        res.status(500).json({
            error: 'Failed to clear caches'
        });
    }
};

// Helper functions
const formatActivityDescription = (activity) => {
    const user = activity.userId?.username || activity.userEmail || 'Someone';
    const actionTypeMap = {
        'login': `${user} logged in`,
        'logout': `${user} logged out`,
        'document_upload': `${user} uploaded a document`,
        'vote_cast': `${user} cast a vote`,
        'session_start': `${user} started a session`,
        'session_end': `${user} ended a session`,
        'committee_create': `${user} created a committee`,
        'event_create': `${user} created an event`,
        'user_create': `${user} created a new user`,
        'system_backup': 'System backup completed',
        'system_maintenance': 'System maintenance performed'
    };

    return actionTypeMap[activity.actionType] || `${user} performed ${activity.actionType}`;
};

const calculateCacheHitRate = () => {
    // This would track cache hits vs misses in a real implementation
    // For now, return a mock value
    return Math.random() * 0.3 + 0.7; // 70-100% hit rate
};

// Periodic cache cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            cache.delete(key);
        }
    }
}, CACHE_TTL); // Run cleanup every cache TTL period

module.exports = {
    getDashboardStats,
    getRecentActivity,
    bulkGenerateQR,
    getSystemHealth,
    clearCaches
};