const { Voting } = require('./model');
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const Session = require('../session/model');
const { emitToRoom, emitToUser } = require('../websocket/socketManager');

// Create new voting (presidium only)
const createVoting = async (req, res) => {
    try {
        const {
            committeeId,
            sessionId,
            votingType,
            subjectType,
            subjectId,
            title,
            description,
            fullText,
            majorityRequired = 'simple',
            timeLimit
        } = req.body;

        // Verify committee and session exist
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if session has quorum
        if (!session.quorum.hasMet) {
            return res.status(400).json({
                error: 'Cannot start voting without quorum',
                required: session.quorum.required,
                present: session.quorum.presentVoting
            });
        }   

        // Get eligible voters from session roll call
        const eligibleVoters = session.speakerLists.present
            .filter(entry => entry.status === 'present_and_voting')
            .map(entry => {
                const countryData = committee.countries.find(c => c.name === entry.country);
                return {
                    country: entry.country,
                    email: entry.email,
                    hasVetoRight: countryData ? countryData.hasVetoRight : false,
                    canVote: true,
                    attendanceStatus: entry.status
                };
            });

        // Create roll call order (alphabetical)
        const rollCallOrder = eligibleVoters
            .map(voter => voter.country)
            .sort();

        // Create voting
        const voting = new Voting({
            committeeId,
            sessionId,
            votingType,
            subjectType,
            subjectId,
            title: title.trim(),
            description: description?.trim(),
            fullText: fullText.trim(),
            majorityRequired,
            eligibleVoters,
            rollCallOrder: votingType === 'rollCall' ? rollCallOrder : [],
            timeLimit,
            createdBy: req.user.userId
        });

        // Calculate majority threshold
        voting.majorityThreshold = voting.calculateMajorityThreshold();

        await voting.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'voting-created', {
                votingId: voting._id,
                title: voting.title,
                votingType: voting.votingType,
                subjectType: voting.subjectType,
                majorityRequired: voting.majorityRequired,
                eligibleVoters: voting.eligibleVoters.length,
                timeLimit: voting.timeLimit
            });
        }

        global.logger.info(`Voting created: "${title}" by ${req.user.email} for committee ${committeeId}`);

        res.status(201).json({
            success: true,
            voting: {
                _id: voting._id,
                title: voting.title,
                votingType: voting.votingType,
                subjectType: voting.subjectType,
                majorityRequired: voting.majorityRequired,
                majorityThreshold: voting.majorityThreshold,
                eligibleVoters: voting.eligibleVoters.length,
                status: voting.status,
                createdAt: voting.createdAt
            },
            message: 'Voting created successfully'
        });

    } catch (error) {
        global.logger.error('Create voting error:', error);
        res.status(500).json({ error: 'Failed to create voting' });
    }
};

// Start voting (presidium only)
const startVoting = async (req, res) => {
    try {
        const { id } = req.params;

        const voting = await Voting.findById(id);
        if (!voting) {
            return res.status(404).json({ error: 'Voting not found' });
        }

        if (voting.status !== 'pending') {
            return res.status(400).json({
                error: 'Voting already started or completed',
                currentStatus: voting.status
            });
        }

        // Start the voting
        voting.status = 'active';
        voting.startedAt = new Date();

        // For roll call, set first voter
        if (voting.votingType === 'rollCall') {
            voting.currentlyVoting = voting.getNextRollCallVoter();
        }

        await voting.save();

        // Emit to all participants
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${voting.committeeId}`, 'voting-started', {
                votingId: voting._id,
                title: voting.title,
                votingType: voting.votingType,
                currentlyVoting: voting.currentlyVoting,
                timeLimit: voting.timeLimit,
                startedAt: voting.startedAt
            });

            // Send individual notifications to eligible voters
            voting.eligibleVoters.forEach(voter => {
                emitToUser(req.app.locals.io, voter.email, 'voting-notification', {
                    votingId: voting._id,
                    title: voting.title,
                    yourTurn: voting.votingType === 'rollCall' ?
                        voter.country === voting.currentlyVoting : true,
                    canVote: voter.canVote,
                    hasVetoRight: voter.hasVetoRight
                });
            });
        }

        global.logger.info(`Voting started: ${voting.title} (${voting._id})`);

        res.json({
            success: true,
            voting: {
                _id: voting._id,
                status: voting.status,
                startedAt: voting.startedAt,
                currentlyVoting: voting.currentlyVoting
            },
            message: 'Voting started successfully'
        });

    } catch (error) {
        global.logger.error('Start voting error:', error);
        res.status(500).json({ error: 'Failed to start voting' });
    }
};

// Cast vote (delegates only)
const castVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { vote, vetoJustification } = req.body;

        const voting = await Voting.findById(id);
        if (!voting) {
            return res.status(404).json({ error: 'Voting not found' });
        }

        if (voting.status !== 'active') {
            return res.status(400).json({
                error: 'Voting is not active',
                currentStatus: voting.status
            });
        }

        // Check if user can vote
        if (!voting.canVote(req.user.email)) {
            return res.status(400).json({ error: 'You are not eligible to vote or have already voted' });
        }

        const voter = voting.eligibleVoters.find(v => v.email === req.user.email);

        // For roll call voting, check if it's the user's turn
        if (voting.votingType === 'rollCall') {
            if (voting.currentlyVoting !== voter.country) {
                return res.status(400).json({
                    error: 'Not your turn to vote',
                    currentlyVoting: voting.currentlyVoting
                });
            }
        }

        // For skipped countries, check allowed votes
        if (voting.votingType === 'rollCall' && voting.skippedCountries.includes(voter.country)) {
            const allowedVotes = voting.getAllowedVotesForSkipped(voter.country);
            if (!allowedVotes.includes(vote)) {
                return res.status(400).json({
                    error: `Skipped countries can only vote: ${allowedVotes.join(', ')}`,
                    allowedVotes
                });
            }
        }

        // Handle veto (Security Council only)
        const isVeto = vote === 'against' &&
            voter.hasVetoRight &&
            vetoJustification &&
            vetoJustification.trim().length > 0;

        // Create vote record
        const voteRecord = {
            country: voter.country,
            email: req.user.email,
            vote,
            timestamp: new Date(),
            isVeto,
            vetoJustification: isVeto ? vetoJustification.trim() : null
        };

        // For roll call, add position
        if (voting.votingType === 'rollCall') {
            voteRecord.rollCallPosition = voting.rollCallOrder.indexOf(voter.country) + 1;
        }

        voting.votes.push(voteRecord);

        // For roll call, move to next voter
        if (voting.votingType === 'rollCall') {
            voting.currentlyVoting = voting.getNextRollCallVoter();
        }

        await voting.save();

        // Emit vote notification
        if (req.app.locals.io) {
            const voteNotification = {
                votingId: voting._id,
                country: voter.country,
                vote,
                isVeto,
                nextVoter: voting.currentlyVoting,
                totalVotes: voting.votes.length,
                remainingVoters: voting.eligibleVoters.length - voting.votes.length
            };

            // For simple voting, don't reveal vote details
            if (voting.votingType === 'simple') {
                delete voteNotification.vote;
                delete voteNotification.country;
                delete voteNotification.isVeto;
            }

            emitToRoom(req.app.locals.io, `committee-${voting.committeeId}`, 'vote-cast', voteNotification);

            // Notify next voter in roll call
            if (voting.votingType === 'rollCall' && voting.currentlyVoting) {
                const nextVoter = voting.eligibleVoters.find(v => v.country === voting.currentlyVoting);
                if (nextVoter) {
                    emitToUser(req.app.locals.io, nextVoter.email, 'your-turn-to-vote', {
                        votingId: voting._id,
                        title: voting.title
                    });
                }
            }
        }

        global.logger.info(`Vote cast: ${voter.country} voted "${vote}" in voting ${voting._id}${isVeto ? ' (VETO)' : ''}`);

        res.json({
            success: true,
            vote: {
                country: voter.country,
                vote,
                isVeto,
                timestamp: voteRecord.timestamp
            },
            nextVoter: voting.currentlyVoting,
            message: `Vote cast successfully${isVeto ? ' with veto' : ''}`
        });

    } catch (error) {
        global.logger.error('Cast vote error:', error);
        res.status(500).json({ error: 'Failed to cast vote' });
    }
};

// Skip turn in roll call voting
const skipVote = async (req, res) => {
    try {
        const { id } = req.params;

        const voting = await Voting.findById(id);
        if (!voting) {
            return res.status(404).json({ error: 'Voting not found' });
        }

        if (voting.votingType !== 'rollCall') {
            return res.status(400).json({ error: 'Can only skip in roll call voting' });
        }

        if (voting.status !== 'active') {
            return res.status(400).json({ error: 'Voting is not active' });
        }

        const voter = voting.eligibleVoters.find(v => v.email === req.user.email);
        if (!voter) {
            return res.status(400).json({ error: 'You are not eligible to vote' });
        }

        if (voting.currentlyVoting !== voter.country) {
            return res.status(400).json({
                error: 'Not your turn to vote',
                currentlyVoting: voting.currentlyVoting
            });
        }

        if (!voting.canSkipInRollCall(voter.country)) {
            return res.status(400).json({ error: 'You have already skipped or voted' });
        }

        // Add to skipped countries
        voting.skippedCountries.push(voter.country);

        // Move to next voter
        voting.currentlyVoting = voting.getNextRollCallVoter();

        await voting.save();

        // Emit skip notification
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${voting.committeeId}`, 'vote-skipped', {
                votingId: voting._id,
                country: voter.country,
                nextVoter: voting.currentlyVoting,
                skippedCount: voting.skippedCountries.length
            });

            // Notify next voter
            if (voting.currentlyVoting) {
                const nextVoter = voting.eligibleVoters.find(v => v.country === voting.currentlyVoting);
                if (nextVoter) {
                    emitToUser(req.app.locals.io, nextVoter.email, 'your-turn-to-vote', {
                        votingId: voting._id,
                        title: voting.title
                    });
                }
            }
        }

        global.logger.info(`Vote skipped: ${voter.country} in voting ${voting._id}`);

        res.json({
            success: true,
            nextVoter: voting.currentlyVoting,
            skippedCount: voting.skippedCountries.length,
            message: 'Vote skipped successfully'
        });

    } catch (error) {
        global.logger.error('Skip vote error:', error);
        res.status(500).json({ error: 'Failed to skip vote' });
    }
};

// Complete voting (automatic or manual)
const completeVoting = async (req, res) => {
    try {
        const { id } = req.params;

        const voting = await Voting.findById(id);
        if (!voting) {
            return res.status(404).json({ error: 'Voting not found' });
        }

        if (voting.status !== 'active') {
            return res.status(400).json({ error: 'Voting is not active' });
        }

        // Check if all eligible voters have voted or it's forced completion
        const remainingVoters = voting.eligibleVoters.filter(voter =>
            !voting.votes.find(v => v.email === voter.email)
        ).length;

        if (remainingVoters > 0 && !req.body.forceComplete) {
            return res.status(400).json({
                error: 'Not all eligible voters have voted',
                remainingVoters,
                hint: 'Set forceComplete: true to complete anyway'
            });
        }

        // Calculate final results
        voting.calculateResults();
        voting.status = 'completed';
        voting.completedAt = new Date();

        await voting.save();

        // Emit completion notification
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${voting.committeeId}`, 'voting-completed', {
                votingId: voting._id,
                title: voting.title,
                results: voting.results,
                completedAt: voting.completedAt
            });
        }

        global.logger.info(`Voting completed: ${voting.title} (${voting._id}) - ${voting.results.passed ? 'PASSED' : 'FAILED'}`);

        res.json({
            success: true,
            voting: {
                _id: voting._id,
                title: voting.title,
                status: voting.status,
                results: voting.results,
                completedAt: voting.completedAt
            },
            message: `Voting completed - ${voting.results.passed ? 'PASSED' : 'FAILED'}`
        });

    } catch (error) {
        global.logger.error('Complete voting error:', error);
        res.status(500).json({ error: 'Failed to complete voting' });
    }
};

// Get voting details
const getVoting = async (req, res) => {
    try {
        const { id } = req.params;

        const voting = await Voting.findById(id)
            .populate('createdBy', 'username countryName');

        if (!voting) {
            return res.status(404).json({ error: 'Voting not found' });
        }

        // Filter vote details based on voting type and user role
        let responseData = {
            _id: voting._id,
            title: voting.title,
            description: voting.description,
            votingType: voting.votingType,
            subjectType: voting.subjectType,
            majorityRequired: voting.majorityRequired,
            majorityThreshold: voting.majorityThreshold,
            status: voting.status,
            startedAt: voting.startedAt,
            completedAt: voting.completedAt,
            timeLimit: voting.timeLimit,
            eligibleVoters: voting.eligibleVoters.length,
            totalVotes: voting.votes.length,
            createdBy: voting.createdBy,
            createdAt: voting.createdAt
        };

        // Add results if completed
        if (voting.status === 'completed') {
            responseData.results = voting.results;
        }

        // Add roll call specific data
        if (voting.votingType === 'rollCall') {
            responseData.rollCallOrder = voting.rollCallOrder;
            responseData.currentlyVoting = voting.currentlyVoting;
            responseData.skippedCountries = voting.skippedCountries;

            // Show individual votes for roll call (or if completed)
            if (voting.status === 'completed') {
                responseData.votes = voting.votes.map(vote => ({
                    country: vote.country,
                    vote: vote.vote,
                    isVeto: vote.isVeto,
                    rollCallPosition: vote.rollCallPosition,
                    timestamp: vote.timestamp
                }));
            }
        }

        // Add user-specific data
        const userVote = voting.votes.find(v => v.email === req.user.email);
        if (userVote) {
            responseData.userVote = {
                vote: userVote.vote,
                isVeto: userVote.isVeto,
                timestamp: userVote.timestamp
            };
        }

        const userEligible = voting.eligibleVoters.find(v => v.email === req.user.email);
        if (userEligible) {
            responseData.canVote = voting.canVote(req.user.email);
            responseData.hasVetoRight = userEligible.hasVetoRight;
            responseData.isYourTurn = voting.votingType === 'rollCall' ?
                userEligible.country === voting.currentlyVoting : false;

            if (voting.votingType === 'rollCall' && voting.skippedCountries.includes(userEligible.country)) {
                responseData.allowedVotes = voting.getAllowedVotesForSkipped(userEligible.country);
            }
        }

        res.json({
            success: true,
            voting: responseData
        });

    } catch (error) {
        global.logger.error('Get voting error:', error);
        res.status(500).json({ error: 'Failed to get voting details' });
    }
};

// Get committee votings
const getCommitteeVotings = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const {
            status = 'all',
            page = 1,
            limit = 20,
            subjectType = 'all'
        } = req.query;

        const filter = { committeeId };

        if (status !== 'all') {
            filter.status = status;
        }

        if (subjectType !== 'all') {
            filter.subjectType = subjectType;
        }

        const skip = (page - 1) * limit;

        const votings = await Voting.find(filter)
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Voting.countDocuments(filter);

        // Map response data
        const votingsData = votings.map(voting => ({
            _id: voting._id,
            title: voting.title,
            votingType: voting.votingType,
            subjectType: voting.subjectType,
            majorityRequired: voting.majorityRequired,
            status: voting.status,
            totalVotes: voting.votes.length,
            eligibleVoters: voting.eligibleVoters.length,
            results: voting.status === 'completed' ? voting.results : null,
            startedAt: voting.startedAt,
            completedAt: voting.completedAt,
            createdBy: voting.createdBy,
            createdAt: voting.createdAt
        }));

        res.json({
            success: true,
            votings: votingsData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        global.logger.error('Get committee votings error:', error);
        res.status(500).json({ error: 'Failed to get committee votings' });
    }
};

module.exports = {
    createVoting,
    startVoting,
    castVote,
    skipVote,
    completeVoting,
    getVoting,
    getCommitteeVotings
};