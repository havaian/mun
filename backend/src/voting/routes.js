const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');

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
const validateVotingCreation = [
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('sessionId')
        .isMongoId()
        .withMessage('Valid session ID is required'),
    body('votingType')
        .isIn(['simple', 'rollCall'])
        .withMessage('Voting type must be simple or rollCall'),
    body('subjectType')
        .isIn(['resolution', 'amendment', 'procedural_motion', 'question'])
        .withMessage('Subject type must be resolution, amendment, procedural_motion, or question'),
    body('subjectId')
        .isMongoId()
        .withMessage('Valid subject ID is required'),
    body('title')
        .isLength({ min: 5, max: 300 })
        .withMessage('Title must be between 5 and 300 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
        .trim(),
    body('fullText')
        .isLength({ min: 10 })
        .withMessage('Full text is required and must be at least 10 characters')
        .trim(),
    body('majorityRequired')
        .optional()
        .isIn(['simple', 'qualified', 'consensus'])
        .withMessage('Majority required must be simple, qualified, or consensus'),
    body('timeLimit')
        .optional()
        .isInt({ min: 60, max: 3600 })
        .withMessage('Time limit must be between 60 and 3600 seconds')
];

const validateVoteCast = [
    body('vote')
        .isIn(['for', 'against', 'abstain'])
        .withMessage('Vote must be for, against, or abstain'),
    body('vetoJustification')
        .optional()
        .isLength({ min: 10, max: 500 })
        .withMessage('Veto justification must be between 10 and 500 characters')
        .trim()
];

const validateVotingId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid voting ID')
];

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['pending', 'active', 'completed', 'cancelled', 'all'])
        .withMessage('Status filter must be pending, active, completed, cancelled, or all'),
    query('subjectType')
        .optional()
        .isIn(['resolution', 'amendment', 'procedural_motion', 'question', 'all'])
        .withMessage('Subject type filter must be resolution, amendment, procedural_motion, question, or all')
];

// Voting Management Routes (Presidium)

// Create new voting
router.post('/',
    global.auth.token,
    global.auth.presidium,
    validateVotingCreation,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.createVoting
);

// Start voting
router.put('/:id/start',
    global.auth.token,
    global.auth.presidium,
    validateVotingId,
    handleValidationErrors,
    controller.startVoting
);

// Complete voting (force complete if needed)
router.put('/:id/complete',
    global.auth.token,
    global.auth.presidium,
    validateVotingId,
    body('forceComplete')
        .optional()
        .isBoolean()
        .withMessage('Force complete must be boolean'),
    handleValidationErrors,
    controller.completeVoting
);

// Get single voting details
router.get('/:id',
    global.auth.token,
    validateVotingId,
    handleValidationErrors,
    controller.getVoting
);

// Get committee votings
router.get('/committee/:committeeId',
    global.auth.token,
    validateCommitteeId,
    validatePagination,
    handleValidationErrors,
    global.auth.sameCommittee,
    controller.getCommitteeVotings
);

// Voting Participation Routes (Delegates)

// Cast vote
router.post('/:id/vote',
    global.auth.token,
    requireVotingRights,
    validateVotingId,
    validateVoteCast,
    handleValidationErrors,
    controller.castVote
);

// Skip turn in roll call voting
router.post('/:id/skip',
    global.auth.token,
    requireVotingRights,
    validateVotingId,
    handleValidationErrors,
    controller.skipVote
);

// Get voting status (for real-time updates)
router.get('/:id/status',
    global.auth.token,
    validateVotingId,
    handleValidationErrors,
    (req, res) => {
        // This will be handled by WebSocket primarily
        // but provide REST endpoint for backup
        controller.getVoting(req, res);
    }
);

// Get roll call order for roll call voting
router.get('/:id/roll-call-order',
    global.auth.token,
    validateVotingId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Voting } = require('./model');
            const voting = await Voting.findById(req.params.id);

            if (!voting) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            if (voting.votingType !== 'rollCall') {
                return res.status(400).json({ error: 'Not a roll call voting' });
            }

            res.json({
                success: true,
                rollCallOrder: voting.rollCallOrder,
                currentlyVoting: voting.currentlyVoting,
                skippedCountries: voting.skippedCountries,
                completedVotes: voting.votes.length
            });

        } catch (error) {
            logger.error('Get roll call order error:', error);
            res.status(500).json({ error: 'Failed to get roll call order' });
        }
    }
);

// Get eligible voters for voting
router.get('/:id/eligible-voters',
    global.auth.token,
    validateVotingId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Voting } = require('./model');
            const voting = await Voting.findById(req.params.id);

            if (!voting) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            // Filter based on user role
            let eligibleVoters = voting.eligibleVoters.map(voter => ({
                country: voter.country,
                canVote: voter.canVote,
                hasVetoRight: voter.hasVetoRight,
                attendanceStatus: voter.attendanceStatus,
                hasVoted: !!voting.votes.find(v => v.email === voter.email)
            }));

            // For simple voting, hide some details until completed
            if (voting.votingType === 'simple' && voting.status !== 'completed') {
                eligibleVoters = eligibleVoters.map(voter => ({
                    country: voter.country,
                    canVote: voter.canVote,
                    hasVoted: voter.hasVoted
                }));
            }

            res.json({
                success: true,
                eligibleVoters,
                totalEligible: voting.eligibleVoters.length,
                totalVoted: voting.votes.length,
                votingType: voting.votingType
            });

        } catch (error) {
            logger.error('Get eligible voters error:', error);
            res.status(500).json({ error: 'Failed to get eligible voters' });
        }
    }
);

// Cancel voting (presidium only)
router.delete('/:id',
    global.auth.token,
    global.auth.presidium,
    validateVotingId,
    body('reason')
        .isLength({ min: 10, max: 500 })
        .withMessage('Cancellation reason must be between 10 and 500 characters')
        .trim(),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Voting } = require('./model');
            const { reason } = req.body;

            const voting = await Voting.findById(req.params.id);
            if (!voting) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            if (voting.status === 'completed') {
                return res.status(400).json({ error: 'Cannot cancel completed voting' });
            }

            voting.status = 'cancelled';
            voting.completedAt = new Date();

            // Add cancellation reason to voting
            voting.cancellationReason = reason;
            voting.cancelledBy = req.user.userId;

            await voting.save();

            // Emit cancellation notification
            if (req.app.locals.io) {
                const { emitToRoom } = require('../websocket/socketManager');
                emitToRoom(req.app.locals.io, `committee-${voting.committeeId}`, 'voting-cancelled', {
                    votingId: voting._id,
                    title: voting.title,
                    reason,
                    cancelledBy: req.user.countryName || req.user.username
                });
            }

            logger.info(`Voting cancelled: ${voting.title} (${voting._id}) by ${req.user.email}. Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Voting cancelled successfully'
            });

        } catch (error) {
            logger.error('Cancel voting error:', error);
            res.status(500).json({ error: 'Failed to cancel voting' });
        }
    }
);

module.exports = router;