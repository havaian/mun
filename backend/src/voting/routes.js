// backend/src/voting/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/voting
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router({ mergeParams: true });

const controller = require('./controller');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateVotingCreation = [
    body('title').isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters').trim(),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters').trim(),
    body('votingType').isIn(['simple', 'roll_call', 'secret_ballot']).withMessage('Voting type must be simple, roll_call, or secret_ballot'),
    body('subjectType').isIn(['resolution', 'amendment', 'procedural_motion', 'question']).withMessage('Invalid subject type'),
    body('subjectId').optional().isMongoId().withMessage('Subject ID must be a valid MongoDB ObjectId'),
    body('majorityRequired').optional().isIn(['simple', 'qualified', 'consensus']).withMessage('Majority required must be simple, qualified, or consensus'),
    body('timeLimit').optional().isInt({ min: 60, max: 3600 }).withMessage('Time limit must be between 60 and 3600 seconds')
];

const validateVoteCast = [
    body('vote').isIn(['for', 'against', 'abstain']).withMessage('Vote must be for, against, or abstain'),
    body('vetoJustification').optional().isLength({ min: 10, max: 500 }).withMessage('Veto justification must be between 10 and 500 characters').trim()
];

const validateVotingId = [param('id').isMongoId().withMessage('Invalid voting ID')];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'active', 'completed', 'cancelled', 'all']).withMessage('Invalid status filter'),
    query('subjectType').optional().isIn(['resolution', 'amendment', 'procedural_motion', 'question', 'all']).withMessage('Invalid subject type filter')
];

// Shared: token + event context + participant
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== VOTING MANAGEMENT (Presidium) ====================

// Create new voting (presidium only)
router.post('/',
    global.auth.presidium,
    validateVotingCreation,
    handleValidationErrors,
    controller.createVoting
);

// Start voting (presidium only)
router.put('/:id/start',
    global.auth.presidium,
    validateVotingId,
    handleValidationErrors,
    controller.startVoting
);

// Complete voting (presidium only)
router.put('/:id/complete',
    global.auth.presidium,
    validateVotingId,
    body('forceComplete').optional().isBoolean().withMessage('Force complete must be boolean'),
    handleValidationErrors,
    controller.completeVoting
);

// Cancel voting (presidium only)
router.delete('/:id',
    global.auth.presidium,
    validateVotingId,
    body('reason').isLength({ min: 10, max: 500 }).withMessage('Cancellation reason must be between 10 and 500 characters').trim(),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Voting } = require('./model');
            const { reason } = req.body;

            const voting = await Voting.findById(req.params.id);
            if (!voting) return res.status(404).json({ error: 'Voting not found' });
            if (voting.status === 'completed') return res.status(400).json({ error: 'Cannot cancel completed voting' });

            voting.status = 'cancelled';
            voting.completedAt = new Date();
            voting.cancellationReason = reason;
            voting.cancelledBy = req.user.userId;
            await voting.save();

            if (req.app.locals.io) {
                const { emitToRoom } = require('../websocket/socketManager');
                emitToRoom(req.app.locals.io, `committee-${voting.committeeId}`, 'voting-cancelled', {
                    votingId: voting._id, title: voting.title, reason, cancelledBy: req.user.email
                });
            }

            global.logger.info(`Voting cancelled: ${voting.title} (${voting._id}) by ${req.user.email}. Reason: ${reason}`);
            res.json({ success: true, message: 'Voting cancelled successfully' });
        } catch (error) {
            global.logger.error('Cancel voting error:', error);
            res.status(500).json({ error: 'Failed to cancel voting' });
        }
    }
);

// ==================== VOTING READ (any participant) ====================

// Get single voting details
router.get('/:id',
    validateVotingId,
    handleValidationErrors,
    controller.getVoting
);

// Get committee votings
router.get('/',
    validatePagination,
    handleValidationErrors,
    controller.getCommitteeVotings
);

// Get voting status (REST backup for WebSocket)
router.get('/:id/status',
    validateVotingId,
    handleValidationErrors,
    (req, res) => { controller.getVoting(req, res); }
);

// Get roll call order
router.get('/:id/roll-call-order',
    validateVotingId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Voting } = require('./model');
            const voting = await Voting.findById(req.params.id);
            if (!voting) return res.status(404).json({ error: 'Voting not found' });

            res.json({
                success: true,
                rollCallOrder: voting.rollCallOrder || [],
                currentIndex: voting.currentRollCallIndex || 0,
                votingType: voting.votingType
            });
        } catch (error) {
            global.logger.error('Get roll call order error:', error);
            res.status(500).json({ error: 'Failed to get roll call order' });
        }
    }
);

// Get eligible voters
router.get('/:id/eligible-voters',
    validateVotingId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Voting } = require('./model');
            const voting = await Voting.findById(req.params.id);
            if (!voting) return res.status(404).json({ error: 'Voting not found' });

            let eligibleVoters = voting.eligibleVoters.map(voter => ({
                ...voter.toObject(),
                hasVoted: !!voting.votes.find(v => v.email === voter.email),
                canVote: !voting.votes.find(v => v.email === voter.email)
            }));

            if (voting.votingType === 'simple' && voting.status !== 'completed') {
                eligibleVoters = eligibleVoters.map(voter => ({
                    country: voter.country, canVote: voter.canVote, hasVoted: voter.hasVoted
                }));
            }

            res.json({
                success: true, eligibleVoters,
                totalEligible: voting.eligibleVoters.length,
                totalVoted: voting.votes.length,
                votingType: voting.votingType
            });
        } catch (error) {
            global.logger.error('Get eligible voters error:', error);
            res.status(500).json({ error: 'Failed to get eligible voters' });
        }
    }
);

// ==================== VOTING PARTICIPATION (Delegates) ====================

// Cast vote (voting rights required — active delegates only)
router.post('/:id/vote',
    global.auth.votingRights,
    validateVotingId,
    validateVoteCast,
    handleValidationErrors,
    controller.castVote
);

// Skip turn in roll call voting
router.post('/:id/skip',
    global.auth.votingRights,
    validateVotingId,
    handleValidationErrors,
    controller.skipVote
);

module.exports = router;