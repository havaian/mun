const { Committee } = require('../committee/model');
const { Event } = require('../event/model');
const { DelegateStats, CommitteeStats, Activity } = require('../statistics/model');
const { Voting } = require('../voting/model');
const { Resolution, Coalition } = require('../resolution/model');
const { Document } = require('../document/model');
const logger = require('../utils/logger');

// Export committee summary report
const exportCommitteeSummary = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json' } = req.query;

        const committee = await Committee.findById(committeeId)
            .populate('eventId', 'name startDate endDate');

        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Get committee statistics
        const stats = await CommitteeStats.findOne({ committeeId });

        // Get delegate statistics
        const delegateStats = await DelegateStats.find({ committeeId })
            .sort({ 'scores.totalScore': -1 });

        // Get voting results
        const votings = await Voting.find({ committeeId, status: 'completed' });

        // Get resolutions
        const resolutions = await Resolution.find({ committeeId });

        // Compile summary data
        const summaryData = {
            committee: {
                name: committee.name,
                type: committee.type,
                event: committee.eventId.name,
                eventDates: {
                    start: committee.eventId.startDate,
                    end: committee.eventId.endDate
                },
                countries: committee.countries.map(c => ({
                    name: c.name,
                    hasVetoRight: c.hasVetoRight,
                    specialRole: c.specialRole
                }))
            },
            overview: stats ? {
                totalDelegates: stats.general.totalDelegates,
                activeDelegates: stats.general.activeDelegates,
                averageAttendance: Math.round(stats.general.averageAttendance * 100) / 100,
                totalSessions: stats.general.totalSessions,
                totalSessionTime: Math.round(stats.general.totalSessionTime / 60 * 100) / 100 // hours
            } : null,
            performance: {
                debate: stats ? {
                    totalSpeeches: stats.debate.totalSpeeches,
                    averageSpeechLength: Math.round(stats.debate.averageSpeechLength),
                    mostActiveDelegate: stats.debate.mostActiveDelegate
                } : null,
                voting: {
                    totalVotings: votings.length,
                    resolutionsPassed: votings.filter(v => v.results.passed && v.subjectType === 'resolution').length,
                    resolutionsFailed: votings.filter(v => !v.results.passed && v.subjectType === 'resolution').length,
                    vetoesUsed: votings.reduce((sum, v) => sum + (v.results.vetoUsed ? 1 : 0), 0)
                },
                documentation: {
                    resolutionsSubmitted: resolutions.length,
                    resolutionsApproved: resolutions.filter(r => r.status === 'approved').length,
                    coalitionsFormed: resolutions.filter(r => r.coalitionId).length
                }
            },
            rankings: delegateStats.slice(0, 10).map((delegate, index) => ({
                rank: index + 1,
                country: delegate.countryName,
                totalScore: delegate.scores.totalScore,
                participationScore: delegate.scores.participationScore,
                leadershipScore: delegate.scores.leadershipScore,
                collaborationScore: delegate.scores.collaborationScore,
                achievements: delegate.achievements.length
            })),
            awards: delegateStats
                .filter(d => d.achievements.length > 0)
                .map(delegate => ({
                    country: delegate.countryName,
                    achievements: delegate.achievements.map(a => ({
                        award: a.awardName,
                        type: a.awardType,
                        earnedAt: a.earnedAt
                    }))
                }))
        };

        // Return data based on format
        if (format === 'csv') {
            const csv = generateCSVReport(summaryData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=committee-${committee.name}-summary.csv`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                summary: summaryData,
                generatedAt: new Date()
            });
        }

        logger.info(`Committee summary exported for ${committee.name} by ${req.user.email}`);

    } catch (error) {
        logger.error('Export committee summary error:', error);
        res.status(500).json({ error: 'Failed to export committee summary' });
    }
};

// Export voting results
const exportVotingResults = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json', includeDetails = false } = req.query;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const votings = await Voting.find({ committeeId })
            .sort({ startedAt: 1 })
            .populate('createdBy', 'username');

        const votingResults = votings.map(voting => {
            const result = {
                votingId: voting._id,
                title: voting.title,
                subjectType: voting.subjectType,
                votingType: voting.votingType,
                majorityRequired: voting.majorityRequired,
                majorityThreshold: voting.majorityThreshold,
                status: voting.status,
                results: voting.results,
                startedAt: voting.startedAt,
                completedAt: voting.completedAt,
                createdBy: voting.createdBy?.username
            };

            // Include detailed votes for roll call or if requested
            if (includeDetails === 'true' || voting.votingType === 'rollCall') {
                result.detailedVotes = voting.votes.map(vote => ({
                    country: vote.country,
                    vote: vote.vote,
                    isVeto: vote.isVeto,
                    timestamp: vote.timestamp,
                    rollCallPosition: vote.rollCallPosition
                }));
            }

            return result;
        });

        if (format === 'csv') {
            const csv = generateVotingCSV(votingResults);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=committee-${committeeId}-voting-results.csv`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                votingResults,
                totalVotings: votings.length,
                generatedAt: new Date()
            });
        }

        logger.info(`Voting results exported for committee ${committeeId} by ${req.user.email}`);

    } catch (error) {
        logger.error('Export voting results error:', error);
        res.status(500).json({ error: 'Failed to export voting results' });
    }
};

// Export delegate participation report
const exportParticipationReport = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json' } = req.query;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const delegateStats = await DelegateStats.find({ committeeId })
            .sort({ countryName: 1 });

        const participationData = delegateStats.map(delegate => ({
            country: delegate.countryName,
            email: delegate.userEmail,
            participation: {
                attendanceRate: Math.round(delegate.participation.attendanceRate * 100) / 100,
                totalTimeActive: Math.round(delegate.participation.totalTimeActive / 60 * 100) / 100, // hours
                attendedSessions: delegate.participation.attendedSessions,
                totalSessions: delegate.participation.totalSessions
            },
            activity: {
                totalSpeeches: delegate.debate.totalSpeeches,
                totalSpeechTime: Math.round(delegate.debate.totalSpeechTime / 60 * 100) / 100, // minutes
                totalVotes: delegate.voting.totalVotes,
                votingRate: Math.round(delegate.voting.votingRate * 100) / 100,
                motionsSubmitted: delegate.procedural.motionsSubmitted,
                questionsAsked: delegate.procedural.questionsAsked,
                messagesSent: delegate.communication.messagesSent
            },
            scores: delegate.scores,
            achievements: delegate.achievements.length
        }));

        if (format === 'csv') {
            const csv = generateParticipationCSV(participationData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=committee-${committeeId}-participation.csv`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                participationData,
                totalDelegates: participationData.length,
                generatedAt: new Date()
            });
        }

        logger.info(`Participation report exported for committee ${committeeId} by ${req.user.email}`);

    } catch (error) {
        logger.error('Export participation report error:', error);
        res.status(500).json({ error: 'Failed to export participation report' });
    }
};

// Export resolution summary
const exportResolutionSummary = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json' } = req.query;

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const resolutions = await Resolution.find({ committeeId })
            .populate('coalitionId')
            .sort({ submittedAt: 1 });

        const resolutionData = resolutions.map(resolution => ({
            title: resolution.title,
            documentType: resolution.documentType,
            authors: resolution.authors,
            coAuthors: resolution.coAuthors,
            status: resolution.status,
            coalition: resolution.coalitionId ? {
                name: resolution.coalitionId.name,
                memberCount: resolution.coalitionId.members.length
            } : null,
            presidiumReview: resolution.presidiumReview ? {
                decision: resolution.presidiumReview.decision,
                comments: resolution.presidiumReview.comments
            } : null,
            votingResults: resolution.votingResults,
            submittedAt: resolution.submittedAt,
            version: resolution.version
        }));

        if (format === 'csv') {
            const csv = generateResolutionCSV(resolutionData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=committee-${committeeId}-resolutions.csv`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                resolutions: resolutionData,
                totalResolutions: resolutions.length,
                generatedAt: new Date()
            });
        }

        logger.info(`Resolution summary exported for committee ${committeeId} by ${req.user.email}`);

    } catch (error) {
        logger.error('Export resolution summary error:', error);
        res.status(500).json({ error: 'Failed to export resolution summary' });
    }
};

// Helper function to generate CSV for committee summary
const generateCSVReport = (data) => {
    const rankings = data.rankings;

    const headers = [
        'Rank', 'Country', 'Total Score', 'Participation Score',
        'Leadership Score', 'Collaboration Score', 'Achievements'
    ];

    const rows = rankings.map(r => [
        r.rank, r.country, r.totalScore, r.participationScore,
        r.leadershipScore, r.collaborationScore, r.achievements
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Helper function to generate CSV for voting results
const generateVotingCSV = (votings) => {
    const headers = [
        'Title', 'Subject Type', 'Voting Type', 'Status', 'Votes For',
        'Votes Against', 'Abstentions', 'Passed', 'Veto Used', 'Started At'
    ];

    const rows = votings.map(v => [
        `"${v.title}"`, v.subjectType, v.votingType, v.status,
        v.results?.votesFor || 0, v.results?.votesAgainst || 0,
        v.results?.abstentions || 0, v.results?.passed || false,
        v.results?.vetoUsed || false, v.startedAt
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Helper function to generate CSV for participation
const generateParticipationCSV = (data) => {
    const headers = [
        'Country', 'Email', 'Attendance Rate', 'Total Time (hours)',
        'Total Speeches', 'Speech Time (min)', 'Total Votes', 'Voting Rate',
        'Motions Submitted', 'Questions Asked', 'Messages Sent',
        'Total Score', 'Achievements'
    ];

    const rows = data.map(d => [
        d.country, d.email, d.participation.attendanceRate,
        d.participation.totalTimeActive, d.activity.totalSpeeches,
        d.activity.totalSpeechTime, d.activity.totalVotes,
        d.activity.votingRate, d.activity.motionsSubmitted,
        d.activity.questionsAsked, d.activity.messagesSent,
        d.scores.totalScore, d.achievements
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Helper function to generate CSV for resolutions
const generateResolutionCSV = (data) => {
    const headers = [
        'Title', 'Document Type', 'Authors', 'Co-Authors', 'Status',
        'Coalition', 'Presidium Decision', 'Voting Result', 'Submitted At'
    ];

    const rows = data.map(r => [
        `"${r.title}"`, r.documentType, r.authors.join(';'),
        r.coAuthors.join(';'), r.status,
        r.coalition?.name || 'None',
        r.presidiumReview?.decision || 'Pending',
        r.votingResults?.passed ? 'Passed' : 'Failed',
        r.submittedAt
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

module.exports = {
    exportCommitteeSummary,
    exportVotingResults,
    exportParticipationReport,
    exportResolutionSummary
};