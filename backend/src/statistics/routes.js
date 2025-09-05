const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const {
    authenticateToken,
    requirePresidium,
    requireDelegate,
    requireSameCommittee
} = require('../auth/middleware');

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

// Validation schemas
const validateEmail = [
    param('email')
        .isEmail()
        .withMessage('Valid email is required')
];

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required')
];

const validateAchievement = [
    body('awardType')
        .isIn([
            'best_delegate', 'outstanding_delegate', 'honorable_mention',
            'best_position_paper', 'best_speaker', 'most_collaborative',
            'most_innovative', 'rising_star', 'diplomat_award',
            'leadership_award', 'research_award'
        ])
        .withMessage('Invalid award type'),
    body('awardName')
        .isLength({ min: 3, max: 100 })
        .withMessage('Award name must be between 3 and 100 characters')
        .trim(),
    body('description')
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters')
        .trim(),
    body('criteria')
        .optional()
        .isObject()
        .withMessage('Criteria must be an object')
];

const validateActivityQuery = [
    query('actionType')
        .optional()
        .isIn([
            'speech', 'vote', 'document_upload', 'amendment', 'motion', 
            'question', 'message', 'coalition_join', 'coalition_create',
            'resolution_submit', 'session_attend', 'login', 'logout', 'all'
        ])
        .withMessage('Invalid action type'),
    query('userEmail')
        .optional()
        .isEmail()
        .withMessage('User email must be valid'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('timeRange')
        .optional()
        .isIn(['1h', '24h', '7d', '30d'])
        .withMessage('Time range must be 1h, 24h, 7d, or 30d')
];

const validateRankingsQuery = [
    query('sortBy')
        .optional()
        .isIn(['totalScore', 'participationScore', 'leadershipScore', 'collaborationScore', 'innovationScore'])
        .withMessage('Invalid sort field'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

const validateStatsQuery = [
    query('eventId')
        .optional()
        .isMongoId()
        .withMessage('Event ID must be valid'),
    query('committeeId')
        .optional()
        .isMongoId()
        .withMessage('Committee ID must be valid')
];

// Delegate Statistics Routes

// Get delegate statistics
router.get('/delegate/:email',
    authenticateToken,
    validateEmail,
    validateStatsQuery,
    handleValidationErrors,
    controller.getDelegateStats
);

// Get current user's statistics
router.get('/my-stats',
    authenticateToken,
    query('eventId').optional().isMongoId().withMessage('Event ID must be valid'),
    query('committeeId').optional().isMongoId().withMessage('Committee ID must be valid'),
    handleValidationErrors,
    (req, res) => {
        req.params.email = req.user.email;
        controller.getDelegateStats(req, res);
    }
);

// Committee Statistics Routes

// Get committee statistics
router.get('/committee/:committeeId',
    authenticateToken,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
    controller.getCommitteeStats
);

// Get delegate rankings for committee
router.get('/committee/:committeeId/rankings',
    authenticateToken,
    validateCommitteeId,
    validateRankingsQuery,
    handleValidationErrors,
    requireSameCommittee,
    controller.getDelegateRankings
);

// Get activity feed for committee
router.get('/committee/:committeeId/activity',
    authenticateToken,
    validateCommitteeId,
    validateActivityQuery,
    handleValidationErrors,
    requireSameCommittee,
    controller.getActivityFeed
);

// Recalculate committee statistics (presidium only)
router.post('/committee/:committeeId/recalculate',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;
            
            await controller.calculateCommitteeStats(committeeId);
            
            res.json({
                success: true,
                message: 'Committee statistics recalculated successfully'
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to recalculate statistics' });
        }
    }
);

// Achievement Management Routes (Presidium only)

// Award achievement to delegate
router.post('/delegate/:email/achievement',
    authenticateToken,
    requirePresidium,
    validateEmail,
    validateAchievement,
    handleValidationErrors,
    controller.awardAchievement
);

// Get all achievements for committee
router.get('/committee/:committeeId/achievements',
    authenticateToken,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
    async (req, res) => {
        try {
            const { DelegateStats } = require('./model');
            const { committeeId } = req.params;

            const delegateStats = await DelegateStats.find({ 
                committeeId,
                'achievements.0': { $exists: true } // Only delegates with achievements
            }, 'userEmail countryName achievements');

            const achievements = delegateStats.flatMap(delegate => 
                delegate.achievements.map(achievement => ({
                    delegate: {
                        email: delegate.userEmail,
                        country: delegate.countryName
                    },
                    achievement: {
                        awardType: achievement.awardType,
                        awardName: achievement.awardName,
                        description: achievement.description,
                        earnedAt: achievement.earnedAt
                    }
                }))
            ).sort((a, b) => new Date(b.achievement.earnedAt) - new Date(a.achievement.earnedAt));

            res.json({
                success: true,
                achievements,
                totalAchievements: achievements.length
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to get achievements' });
        }
    }
);

// Analytics and Reports Routes

// Get participation analytics
router.get('/committee/:committeeId/analytics/participation',
    authenticateToken,
    validateCommitteeId,
    handleValidationErrors,
    requireSameCommittee,
    async (req, res) => {
        try {
            const { DelegateStats } = require('./model');
            const { committeeId } = req.params;

            const stats = await DelegateStats.find({ committeeId });
            
            const analytics = {
                averageAttendance: stats.reduce((sum, s) => sum + s.participation.attendanceRate, 0) / stats.length || 0,
                totalSessions: Math.max(...stats.map(s => s.participation.totalSessions), 0),
                activeParticipants: stats.filter(s => s.participation.attendanceRate > 75).length,
                engagementLevels: {
                    high: stats.filter(s => s.scores.participationScore > 70).length,
                    medium: stats.filter(s => s.scores.participationScore > 40 && s.scores.participationScore <= 70).length,
                    low: stats.filter(s => s.scores.participationScore <= 40).length
                },
                timeDistribution: {
                    total: stats.reduce((sum, s) => sum + s.participation.totalTimeActive, 0),
                    average: stats.reduce((sum, s) => sum + s.participation.totalTimeActive, 0) / stats.length || 0
                }
            };

            res.json({
                success: true,
                analytics,
                participantCount: stats.length
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to get participation analytics' });
        }
    }
);

// Export committee statistics (CSV format)
router.get('/committee/:committeeId/export',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { DelegateStats } = require('./model');
            const { committeeId } = req.params;

            const stats = await DelegateStats.find({ committeeId })
                .sort({ 'scores.totalScore': -1 });

            // Create CSV data
            const csvData = stats.map((delegate, index) => ({
                rank: index + 1,
                country: delegate.countryName,
                email: delegate.userEmail,
                totalScore: delegate.scores.totalScore,
                participationScore: delegate.scores.participationScore,
                leadershipScore: delegate.scores.leadershipScore,
                collaborationScore: delegate.scores.collaborationScore,
                innovationScore: delegate.scores.innovationScore,
                totalSpeeches: delegate.debate.totalSpeeches,
                totalVotes: delegate.voting.totalVotes,
                motionsSubmitted: delegate.procedural.motionsSubmitted,
                resolutionsSubmitted: delegate.documentation.resolutionsSubmitted,
                coalitionsJoined: delegate.coalitions.coalitionsJoined,
                achievements: delegate.achievements.length,
                attendanceRate: delegate.participation.attendanceRate
            }));

            // Convert to CSV format
            const csvHeader = Object.keys(csvData[0] || {}).join(',');
            const csvRows = csvData.map(row => Object.values(row).join(','));
            const csv = [csvHeader, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=committee-${committeeId}-statistics.csv`);
            res.send(csv);

        } catch (error) {
            res.status(500).json({ error: 'Failed to export statistics' });
        }
    }
);

module.exports = router;