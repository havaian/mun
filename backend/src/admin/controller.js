const logger = require('../utils/logger');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const { Event } = require('../event/model');
        const { Committee } = require('../committee/model');
        const { User } = require('../auth/model');
        const { Document } = require('../document/model');

        // Get counts in parallel
        const [
            totalEvents,
            activeEvents,
            totalCommittees,
            activeCommittees,
            totalUsers,
            activeUsers,
            totalDocuments
        ] = await Promise.all([
            Event.countDocuments(),
            Event.countDocuments({ status: 'active' }),
            Committee.countDocuments(),
            Committee.countDocuments({ status: 'active' }),
            User.countDocuments({ role: { $in: ['delegate', 'presidium'] } }),
            User.countDocuments({
                role: { $in: ['delegate', 'presidium'] },
                isActive: true
            }),
            Document.countDocuments()
        ]);

        res.json({
            success: true,
            stats: {
                totalEvents,
                activeEvents,
                totalCommittees,
                activeCommittees,
                registeredUsers: totalUsers,
                activeUsers,
                documentsUploaded: totalDocuments
            }
        });

        logger.info('Dashboard stats requested by admin');

    } catch (error) {
        logger.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
};

// Get recent system activity
const getRecentActivity = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const { ActivityLog } = require('../statistics/model');

        // Get recent activities from different areas
        const activities = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'username email')
            .populate('committeeId', 'name')
            .populate('eventId', 'name')
            .lean();

        // Format activities for display
        const formattedActivities = activities.map(activity => ({
            id: activity._id,
            description: formatActivityDescription(activity),
            timestamp: activity.createdAt,
            user: activity.userId?.username || 'System',
            committee: activity.committeeId?.name,
            event: activity.eventId?.name,
            type: activity.actionType
        }));

        res.json({
            success: true,
            activities: formattedActivities,
            total: formattedActivities.length
        });

    } catch (error) {
        logger.error('Get recent activity error:', error);
        res.status(500).json({ error: 'Failed to get recent activity' });
    }
};

// Format activity descriptions for display
const formatActivityDescription = (activity) => {
    const user = activity.userId?.username || 'Someone';
    const committee = activity.committeeId?.name || 'a committee';

    switch (activity.actionType) {
        case 'login':
            return `${user} logged in`;
        case 'document_upload':
            return `${user} uploaded a document in ${committee}`;
        case 'vote':
            return `${user} cast a vote in ${committee}`;
        case 'speech':
            return `${user} gave a speech in ${committee}`;
        case 'motion':
            return `${user} submitted a motion in ${committee}`;
        case 'resolution_submit':
            return `${user} submitted a resolution in ${committee}`;
        case 'coalition_create':
            return `${user} created a coalition in ${committee}`;
        case 'coalition_join':
            return `${user} joined a coalition in ${committee}`;
        case 'session_start':
            return `Session started in ${committee}`;
        case 'session_end':
            return `Session ended in ${committee}`;
        default:
            return activity.description || `${user} performed an action`;
    }
};

// Bulk QR generation for multiple committees
const bulkGenerateQR = async (req, res) => {
    try {
        const { committeeIds = [] } = req.body;

        if (!Array.isArray(committeeIds) || committeeIds.length === 0) {
            return res.status(400).json({
                error: 'Committee IDs array is required'
            });
        }

        const { Committee } = require('../committee/model');
        const results = [];
        let totalGenerated = 0;

        // Process each committee
        for (const committeeId of committeeIds) {
            try {
                const committee = await Committee.findById(committeeId);

                if (!committee) {
                    results.push({
                        committeeId,
                        success: false,
                        error: 'Committee not found'
                    });
                    continue;
                }

                if (committee.countries.length === 0) {
                    results.push({
                        committeeId,
                        success: false,
                        error: 'No countries in committee'
                    });
                    continue;
                }

                // Generate QR tokens if not already generated
                committee.generateQRTokens();
                await committee.save();

                results.push({
                    committeeId,
                    committeeName: committee.name,
                    success: true,
                    qrCodesGenerated: committee.countries.length
                });

                totalGenerated += committee.countries.length;

            } catch (error) {
                logger.error(`Bulk QR error for committee ${committeeId}:`, error);
                results.push({
                    committeeId,
                    success: false,
                    error: error.message
                });
            }
        }

        logger.info(`Bulk QR generation completed. Total QR codes generated: ${totalGenerated}`);

        res.json({
            success: true,
            message: `Bulk QR generation completed for ${committeeIds.length} committees`,
            totalQRGenerated: totalGenerated,
            results
        });

    } catch (error) {
        logger.error('Bulk generate QR error:', error);
        res.status(500).json({ error: 'Failed to bulk generate QR codes' });
    }
};

module.exports = {
    getDashboardStats,
    getRecentActivity,
    bulkGenerateQR
};