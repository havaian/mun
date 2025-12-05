const { Activity, DelegateStats, CommitteeStats } = require('./model');
const { Committee } = require('../committee/model');
const { Event } = require('../event/model');
const { User } = require('../auth/model');

// Record activity
const recordActivity = async (activityData) => {
    try {
        const activity = new Activity(activityData);
        await activity.save();

        // Update delegate statistics asynchronously
        updateDelegateStats(activity);

        return activity;
    } catch (error) {
        global.logger.error('Record activity error:', error);
        throw error;
    }
};

// Update delegate statistics based on activity
const updateDelegateStats = async (activity) => {
    try {
        let stats = await DelegateStats.findOne({
            eventId: activity.eventId,
            userEmail: activity.userEmail
        });

        if (!stats) {
            stats = new DelegateStats({
                eventId: activity.eventId,
                committeeId: activity.committeeId,
                userEmail: activity.userEmail,
                countryName: activity.countryName
            });
        }

        // Update stats based on activity type
        switch (activity.actionType) {
            case 'speech':
                stats.debate.totalSpeeches += 1;
                if (activity.details.duration) {
                    stats.debate.totalSpeechTime += activity.details.duration;
                    stats.debate.averageSpeechLength = stats.debate.totalSpeechTime / stats.debate.totalSpeeches;
                }
                if (activity.details.mode === 'formal') {
                    stats.debate.formalSpeeches += 1;
                } else {
                    stats.debate.caucusSpeeches += 1;
                }
                break;

            case 'vote':
                stats.voting.totalVotes += 1;
                if (activity.details.result === 'for') {
                    stats.voting.votesFor += 1;
                } else if (activity.details.result === 'against') {
                    stats.voting.votesAgainst += 1;
                } else if (activity.details.result === 'abstain') {
                    stats.voting.abstentions += 1;
                }
                if (activity.details.isVeto) {
                    stats.voting.vetoesUsed += 1;
                }
                break;

            case 'document_upload':
                if (activity.details.documentType === 'position_paper') {
                    stats.documentation.positionPapersSubmitted += 1;
                } else if (activity.details.documentType === 'resolution') {
                    stats.documentation.resolutionsSubmitted += 1;
                }
                if (activity.details.wordCount) {
                    stats.documentation.totalWordsWritten += activity.details.wordCount;
                }
                if (activity.details.result === 'approved') {
                    stats.documentation.documentsApproved += 1;
                } else if (activity.details.result === 'rejected') {
                    stats.documentation.documentsRejected += 1;
                }
                break;

            case 'amendment':
                stats.documentation.amendmentsSubmitted += 1;
                break;

            case 'motion':
                stats.procedural.motionsSubmitted += 1;
                break;

            case 'question':
                stats.procedural.questionsAsked += 1;
                break;

            case 'message':
                stats.communication.messagesSent += 1;
                break;

            case 'coalition_join':
                stats.coalitions.coalitionsJoined += 1;
                break;

            case 'coalition_create':
                stats.coalitions.coalitionsLed += 1;
                break;

            case 'session_attend':
                stats.participation.attendedSessions += 1;
                if (activity.details.duration) {
                    stats.participation.totalTimeActive += activity.details.duration;
                }
                break;

            case 'login':
                if (!stats.participation.firstLogin) {
                    stats.participation.firstLogin = activity.timestamp;
                }
                stats.participation.lastActivity = activity.timestamp;
                break;
        }

        // Recalculate scores
        stats.calculateScores();
        await stats.save();

    } catch (error) {
        global.logger.error('Update delegate stats error:', error);
    }
};

// Get delegate statistics
const getDelegateStats = async (req, res) => {
    try {
        const { email } = req.params;
        const { eventId, committeeId } = req.query;

        const filter = { userEmail: email };
        if (eventId) filter.eventId = eventId;
        if (committeeId) filter.committeeId = committeeId;

        const stats = await DelegateStats.findOne(filter);
        if (!stats) {
            return res.status(404).json({ error: 'Statistics not found for this delegate' });
        }

        res.json({
            success: true,
            stats: {
                delegate: {
                    email: stats.userEmail,
                    country: stats.countryName
                },
                participation: stats.participation,
                debate: stats.debate,
                voting: stats.voting,
                documentation: stats.documentation,
                procedural: stats.procedural,
                communication: stats.communication,
                coalitions: stats.coalitions,
                scores: stats.scores,
                achievements: stats.achievements,
                lastCalculated: stats.lastCalculated
            }
        });

    } catch (error) {
        global.logger.error('Get delegate stats error:', error);
        res.status(500).json({ error: 'Failed to get delegate statistics' });
    }
};

// Get committee statistics
const getCommitteeStats = async (req, res) => {
    try {
        const { id } = req.params;

        let stats = await CommitteeStats.findOne({ committeeId: id });

        if (!stats) {
            // Create initial stats if not found
            const committee = await Committee.findById(id);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            stats = new CommitteeStats({
                eventId: committee.eventId,
                committeeId: id
            });
            await stats.save();
        }

        // Check if stats need updating (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (stats.lastCalculated < oneHourAgo) {
            await calculateCommitteeStats(id);
            stats = await CommitteeStats.findOne({ committeeId: id });
        }

        res.json({
            success: true,
            stats: {
                general: stats.general,
                debate: stats.debate,
                voting: stats.voting,
                documentation: stats.documentation,
                procedural: stats.procedural,
                communication: stats.communication,
                coalitions: stats.coalitions,
                rankings: stats.rankings,
                lastCalculated: stats.lastCalculated
            }
        });

    } catch (error) {
        global.logger.error('Get committee stats error:', error);
        res.status(500).json({ error: 'Failed to get committee statistics' });
    }
};

// Calculate committee statistics
const calculateCommitteeStats = async (committeeId) => {
    try {
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            throw new Error('Committee not found');
        }

        let stats = await CommitteeStats.findOne({ committeeId });
        if (!stats) {
            stats = new CommitteeStats({
                eventId: committee.eventId,
                committeeId
            });
        }

        // Get all delegate stats for this committee
        const delegateStats = await DelegateStats.find({ committeeId });

        // Calculate general statistics
        stats.general.totalDelegates = committee.countries.length;
        stats.general.activeDelegates = delegateStats.length;

        if (delegateStats.length > 0) {
            const totalAttendance = delegateStats.reduce((sum, d) => sum + d.participation.attendanceRate, 0);
            stats.general.averageAttendance = totalAttendance / delegateStats.length;

            const totalSessionTime = delegateStats.reduce((sum, d) => sum + d.participation.totalTimeActive, 0);
            stats.general.totalSessionTime = totalSessionTime;
        }

        // Calculate debate statistics
        const totalSpeeches = delegateStats.reduce((sum, d) => sum + d.debate.totalSpeeches, 0);
        const totalSpeechTime = delegateStats.reduce((sum, d) => sum + d.debate.totalSpeechTime, 0);

        stats.debate.totalSpeeches = totalSpeeches;
        stats.debate.averageSpeechLength = totalSpeeches > 0 ? totalSpeechTime / totalSpeeches : 0;

        // Find most active delegate
        const mostActive = delegateStats.reduce((max, current) =>
            current.debate.totalSpeeches > (max?.debate.totalSpeeches || 0) ? current : max, null);

        if (mostActive) {
            stats.debate.mostActiveDelegate = {
                country: mostActive.countryName,
                speechCount: mostActive.debate.totalSpeeches
            };
        }

        // Calculate voting statistics
        stats.voting.totalVotings = delegateStats.reduce((sum, d) => sum + d.voting.totalVotes, 0);
        stats.voting.vetoesUsed = delegateStats.reduce((sum, d) => sum + d.voting.vetoesUsed, 0);

        if (delegateStats.length > 0) {
            const totalVotingRate = delegateStats.reduce((sum, d) => sum + d.voting.votingRate, 0);
            stats.voting.averageVotingParticipation = totalVotingRate / delegateStats.length;
        }

        // Calculate documentation statistics
        stats.documentation.positionPapersSubmitted = delegateStats.reduce((sum, d) => sum + d.documentation.positionPapersSubmitted, 0);
        stats.documentation.resolutionsSubmitted = delegateStats.reduce((sum, d) => sum + d.documentation.resolutionsSubmitted, 0);
        stats.documentation.amendmentsSubmitted = delegateStats.reduce((sum, d) => sum + d.documentation.amendmentsSubmitted, 0);

        // Calculate procedural statistics
        stats.procedural.motionsSubmitted = delegateStats.reduce((sum, d) => sum + d.procedural.motionsSubmitted, 0);
        stats.procedural.questionsAsked = delegateStats.reduce((sum, d) => sum + d.procedural.questionsAsked, 0);

        // Calculate communication statistics
        stats.communication.totalMessages = delegateStats.reduce((sum, d) => sum + d.communication.messagesSent, 0);

        // Calculate coalition statistics
        stats.coalitions.totalCoalitions = delegateStats.reduce((sum, d) => sum + d.coalitions.coalitionsLed, 0);

        // Calculate rankings
        const sortedByScore = delegateStats
            .sort((a, b) => b.scores.totalScore - a.scores.totalScore)
            .slice(0, 10);

        stats.rankings.topDelegates = sortedByScore.map((delegate, index) => ({
            country: delegate.countryName,
            email: delegate.userEmail,
            score: delegate.scores.totalScore,
            rank: index + 1
        }));

        const sortedByActivity = delegateStats
            .sort((a, b) => b.scores.participationScore - a.scores.participationScore)
            .slice(0, 5);

        stats.rankings.mostActive = sortedByActivity.map(delegate => ({
            country: delegate.countryName,
            activityScore: delegate.scores.participationScore
        }));

        const sortedByCollaboration = delegateStats
            .sort((a, b) => b.scores.collaborationScore - a.scores.collaborationScore)
            .slice(0, 5);

        stats.rankings.bestCollaborators = sortedByCollaboration.map(delegate => ({
            country: delegate.countryName,
            collaborationScore: delegate.scores.collaborationScore
        }));

        stats.lastCalculated = new Date();
        await stats.save();

        return stats;

    } catch (error) {
        global.logger.error('Calculate committee stats error:', error);
        throw error;
    }
};

// Get delegate rankings
const getDelegateRankings = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { sortBy = 'totalScore', limit = 20 } = req.query;

        const sortField = `scores.${sortBy}`;
        const delegateStats = await DelegateStats.find({ committeeId })
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit));

        const rankings = delegateStats.map((stats, index) => ({
            rank: index + 1,
            country: stats.countryName,
            email: stats.userEmail,
            scores: stats.scores,
            achievements: stats.achievements.length
        }));

        res.json({
            success: true,
            rankings,
            sortedBy: sortBy,
            totalDelegates: delegateStats.length
        });

    } catch (error) {
        global.logger.error('Get delegate rankings error:', error);
        res.status(500).json({ error: 'Failed to get delegate rankings' });
    }
};

// Get activity feed
const getActivityFeed = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const {
            actionType = 'all',
            userEmail = null,
            page = 1,
            limit = 50,
            timeRange = '24h'
        } = req.query;

        const filter = { committeeId };

        if (actionType !== 'all') {
            filter.actionType = actionType;
        }

        if (userEmail) {
            filter.userEmail = userEmail;
        }

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

        const skip = (page - 1) * limit;

        const activities = await Activity.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(filter);

        const activityData = activities.map(activity => ({
            _id: activity._id,
            actionType: activity.actionType,
            category: activity.category,
            countryName: activity.countryName,
            details: activity.details,
            scoreImpact: activity.scoreImpact,
            timestamp: activity.timestamp
        }));

        res.json({
            success: true,
            activities: activityData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            },
            timeRange
        });

    } catch (error) {
        global.logger.error('Get activity feed error:', error);
        res.status(500).json({ error: 'Failed to get activity feed' });
    }
};

// Award achievement to delegate
const awardAchievement = async (req, res) => {
    try {
        const { email } = req.params;
        const { awardType, awardName, description, criteria } = req.body;

        const stats = await DelegateStats.findOne({ userEmail: email });
        if (!stats) {
            return res.status(404).json({ error: 'Delegate statistics not found' });
        }

        stats.addAchievement(awardType, awardName, description, criteria);
        await stats.save();

        global.logger.info(`Achievement awarded: ${awardName} to ${stats.countryName}`);

        res.json({
            success: true,
            achievement: stats.achievements[stats.achievements.length - 1],
            message: 'Achievement awarded successfully'
        });

    } catch (error) {
        global.logger.error('Award achievement error:', error);
        res.status(500).json({ error: 'Failed to award achievement' });
    }
};

module.exports = {
    recordActivity,
    updateDelegateStats,
    getDelegateStats,
    getCommitteeStats,
    calculateCommitteeStats,
    getDelegateRankings,
    getActivityFeed,
    awardAchievement
};