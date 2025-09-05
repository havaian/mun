const { Coalition, Resolution } = require('./model');
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const logger = require('../utils/logger');
const { emitToCommittee, emitToPresidium, emitToUser } = require('../websocket/socketManager');

// Create coalition (delegate only)
const createCoalition = async (req, res) => {
    try {
        const { committeeId, name, description, invitedCountries = [] } = req.body;

        // Verify committee exists and delegate belongs to it
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (req.user.committeeId?.toString() !== committeeId) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        // Check if delegate is already head of an active coalition
        const existingCoalition = await Coalition.findOne({
            headEmail: req.user.email,
            committeeId,
            isActive: true
        });

        if (existingCoalition) {
            return res.status(400).json({
                error: 'You are already head of an active coalition',
                coalitionId: existingCoalition._id
            });
        }

        // Check if delegate is member of another coalition
        const memberOfCoalition = await Coalition.findOne({
            committeeId,
            isActive: true,
            'members.email': req.user.email,
            'members.status': 'accepted'
        });

        if (memberOfCoalition) {
            return res.status(400).json({
                error: 'You are already a member of another coalition',
                coalitionId: memberOfCoalition._id
            });
        }

        // Validate invited countries
        const invitationErrors = [];
        for (const countryName of invitedCountries) {
            const country = committee.countries.find(c => c.name === countryName);
            if (!country) {
                invitationErrors.push(`Country "${countryName}" not found in committee`);
                continue;
            }

            if (!country.email) {
                invitationErrors.push(`Country "${countryName}" has no registered delegate`);
                continue;
            }

            // Check if country is already in another coalition
            const alreadyInCoalition = await Coalition.findOne({
                committeeId,
                isActive: true,
                'members.email': country.email,
                'members.status': 'accepted'
            });

            if (alreadyInCoalition) {
                invitationErrors.push(`Country "${countryName}" is already in another coalition`);
            }
        }

        if (invitationErrors.length > 0) {
            return res.status(400).json({
                error: 'Invitation validation failed',
                details: invitationErrors
            });
        }

        // Create coalition
        const coalition = new Coalition({
            committeeId,
            name: name.trim(),
            description: description?.trim(),
            headCountry: req.user.countryName,
            headEmail: req.user.email
        });

        // Invite countries
        for (const countryName of invitedCountries) {
            const country = committee.countries.find(c => c.name === countryName);
            coalition.inviteMember(countryName, country.email);
        }

        await coalition.save();

        // Send invitations via WebSocket
        if (req.app.locals.io) {
            for (const member of coalition.members.filter(m => m.status === 'invited')) {
                emitToUser(req.app.locals.io, member.email, 'coalition-invitation', {
                    coalitionId: coalition._id,
                    coalitionName: coalition.name,
                    fromCountry: req.user.countryName,
                    description: coalition.description
                });
            }
        }

        logger.info(`Coalition created: "${name}" by ${req.user.countryName}`);

        res.status(201).json({
            success: true,
            coalition: {
                _id: coalition._id,
                name: coalition.name,
                description: coalition.description,
                headCountry: coalition.headCountry,
                members: coalition.members,
                isActive: coalition.isActive,
                minMembersReached: coalition.minMembersReached
            },
            message: 'Coalition created successfully'
        });

    } catch (error) {
        logger.error('Create coalition error:', error);
        res.status(500).json({ error: 'Failed to create coalition' });
    }
};

// Get coalitions for committee
const getCoalitions = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { status = 'all', page = 1, limit = 20 } = req.query;

        const filter = { committeeId };

        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }

        const skip = (page - 1) * limit;

        const coalitions = await Coalition.find(filter)
            .populate('resolutionId', 'title status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCoalitions = await Coalition.countDocuments(filter);

        res.json({
            success: true,
            coalitions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCoalitions / limit),
                totalCoalitions,
                hasNext: skip + coalitions.length < totalCoalitions,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error('Get coalitions error:', error);
        res.status(500).json({ error: 'Failed to fetch coalitions' });
    }
};

// Get single coalition details
const getCoalition = async (req, res) => {
    try {
        const { id } = req.params;

        const coalition = await Coalition.findById(id)
            .populate('committeeId', 'name settings')
            .populate('resolutionId');

        if (!coalition) {
            return res.status(404).json({ error: 'Coalition not found' });
        }

        // Check access permissions
        if (req.user.role !== 'admin' &&
            req.user.committeeId?.toString() !== coalition.committeeId._id.toString()) {
            return res.status(403).json({ error: 'Access denied to this coalition' });
        }

        res.json({
            success: true,
            coalition
        });

    } catch (error) {
        logger.error('Get coalition error:', error);
        res.status(500).json({ error: 'Failed to fetch coalition' });
    }
};

// Respond to coalition invitation
const respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(response)) {
            return res.status(400).json({
                error: 'Response must be "accepted" or "declined"'
            });
        }

        const coalition = await Coalition.findById(id);

        if (!coalition) {
            return res.status(404).json({ error: 'Coalition not found' });
        }

        // Check if user has pending invitation
        const member = coalition.members.find(m =>
            m.email === req.user.email && m.status === 'invited'
        );

        if (!member) {
            return res.status(400).json({
                error: 'No pending invitation found'
            });
        }

        // Check if already member of another coalition
        if (response === 'accepted') {
            const otherCoalition = await Coalition.findOne({
                committeeId: coalition.committeeId,
                isActive: true,
                'members.email': req.user.email,
                'members.status': 'accepted',
                _id: { $ne: coalition._id }
            });

            if (otherCoalition) {
                return res.status(400).json({
                    error: 'You are already a member of another coalition'
                });
            }
        }

        // Update response
        coalition.respondToInvitation(req.user.email, response);
        await coalition.checkActivationStatus();
        await coalition.save();

        // Notify coalition head
        if (req.app.locals.io) {
            emitToUser(req.app.locals.io, coalition.headEmail, 'coalition-invitation-response', {
                coalitionId: coalition._id,
                country: req.user.countryName,
                response,
                minMembersReached: coalition.minMembersReached
            });
        }

        logger.info(`Coalition invitation ${response}: ${req.user.countryName} -> "${coalition.name}"`);

        res.json({
            success: true,
            response,
            coalition: {
                _id: coalition._id,
                name: coalition.name,
                members: coalition.members,
                minMembersReached: coalition.minMembersReached,
                isActive: coalition.isActive
            },
            message: `Invitation ${response} successfully`
        });

    } catch (error) {
        logger.error('Respond to invitation error:', error);
        res.status(500).json({ error: 'Failed to respond to invitation' });
    }
};

// Activate coalition (head only)
const activateCoalition = async (req, res) => {
    try {
        const { id } = req.params;

        const coalition = await Coalition.findById(id);

        if (!coalition) {
            return res.status(404).json({ error: 'Coalition not found' });
        }

        // Check if user is coalition head
        if (coalition.headEmail !== req.user.email) {
            return res.status(403).json({
                error: 'Only coalition head can activate coalition'
            });
        }

        if (coalition.isActive) {
            return res.status(400).json({
                error: 'Coalition is already active'
            });
        }

        // Check minimum members
        await coalition.checkActivationStatus();

        if (!coalition.minMembersReached) {
            return res.status(400).json({
                error: 'Minimum coalition size not reached',
                currentMembers: coalition.acceptedMembers.length,
                requiredMembers: await Committee.findById(coalition.committeeId).then(c => c.settings.minCoalitionSize)
            });
        }

        // Activate coalition
        coalition.activate();
        await coalition.save();

        // Notify all members
        if (req.app.locals.io) {
            emitToCommittee(req.app.locals.io, coalition.committeeId, 'coalition-activated', {
                coalitionId: coalition._id,
                name: coalition.name,
                headCountry: coalition.headCountry,
                memberCount: coalition.acceptedMembers.length
            });
        }

        logger.info(`Coalition activated: "${coalition.name}" with ${coalition.acceptedMembers.length} members`);

        res.json({
            success: true,
            coalition,
            message: 'Coalition activated successfully'
        });

    } catch (error) {
        logger.error('Activate coalition error:', error);
        res.status(500).json({ error: 'Failed to activate coalition' });
    }
};

// Leave coalition
const leaveCoalition = async (req, res) => {
    try {
        const { id } = req.params;

        const coalition = await Coalition.findById(id);

        if (!coalition) {
            return res.status(404).json({ error: 'Coalition not found' });
        }

        // Coalition head cannot leave
        if (coalition.headEmail === req.user.email) {
            return res.status(400).json({
                error: 'Coalition head cannot leave. Transfer leadership or delete coalition instead.'
            });
        }

        // Find member
        const memberIndex = coalition.members.findIndex(m => m.email === req.user.email);

        if (memberIndex === -1) {
            return res.status(400).json({
                error: 'You are not a member of this coalition'
            });
        }

        // Check if coalition has submitted resolution
        if (coalition.resolutionId) {
            return res.status(400).json({
                error: 'Cannot leave coalition after resolution submission'
            });
        }

        // Remove member
        coalition.members.splice(memberIndex, 1);

        // Check if still meets minimum requirements
        await coalition.checkActivationStatus();
        if (!coalition.minMembersReached && coalition.isActive) {
            coalition.isActive = false;
        }

        await coalition.save();

        // Notify coalition head
        if (req.app.locals.io) {
            emitToUser(req.app.locals.io, coalition.headEmail, 'coalition-member-left', {
                coalitionId: coalition._id,
                country: req.user.countryName,
                remainingMembers: coalition.acceptedMembers.length,
                minMembersReached: coalition.minMembersReached
            });
        }

        logger.info(`Left coalition: ${req.user.countryName} left "${coalition.name}"`);

        res.json({
            success: true,
            message: 'Left coalition successfully'
        });

    } catch (error) {
        logger.error('Leave coalition error:', error);
        res.status(500).json({ error: 'Failed to leave coalition' });
    }
};

// Submit resolution draft (coalition head only)
const submitResolution = async (req, res) => {
    try {
        const { coalitionId, title, content, documentType = 'resolution' } = req.body;

        // Verify coalition exists and user is head
        const coalition = await Coalition.findById(coalitionId)
            .populate('committeeId');

        if (!coalition) {
            return res.status(404).json({ error: 'Coalition not found' });
        }

        if (coalition.headEmail !== req.user.email) {
            return res.status(403).json({
                error: 'Only coalition head can submit resolution'
            });
        }

        if (!coalition.isActive) {
            return res.status(400).json({
                error: 'Coalition must be active to submit resolution'
            });
        }

        // Check if coalition already has resolution
        if (coalition.resolutionId) {
            return res.status(400).json({
                error: 'Coalition already has a submitted resolution',
                resolutionId: coalition.resolutionId
            });
        }

        // Check submission deadline
        const committee = coalition.committeeId;
        const deadline = committee.settings.documentDeadlines.resolutions;

        if (deadline && new Date() > deadline) {
            return res.status(400).json({
                error: 'Resolution submission deadline has passed',
                deadline: deadline
            });
        }

        // Create resolution
        const authors = [coalition.headCountry];
        const authorEmails = [coalition.headEmail];
        const coAuthors = [];
        const coAuthorEmails = [];

        // Add co-authors
        coalition.acceptedMembers.forEach(member => {
            if (member.role === 'co-author') {
                coAuthors.push(member.country);
                coAuthorEmails.push(member.email);
            }
        });

        const resolution = new Resolution({
            coalitionId: coalition._id,
            committeeId: coalition.committeeId._id,
            title: title.trim(),
            content: content.trim(),
            documentType,
            authors,
            authorEmails,
            coAuthors,
            coAuthorEmails,
            status: 'submitted',
            submissionDeadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
            submittedAt: new Date()
        });

        await resolution.save();

        // Update coalition
        coalition.resolutionId = resolution._id;
        await coalition.save();

        // Notify presidium
        if (req.app.locals.io) {
            emitToPresidium(req.app.locals.io, coalition.committeeId._id, 'resolution-submitted', {
                resolutionId: resolution._id,
                coalitionName: coalition.name,
                title: resolution.title,
                authors: resolution.authors,
                submittedAt: resolution.submittedAt
            });
        }

        logger.info(`Resolution submitted: "${title}" by coalition "${coalition.name}"`);

        res.status(201).json({
            success: true,
            resolution: {
                _id: resolution._id,
                title: resolution.title,
                documentType: resolution.documentType,
                authors: resolution.authors,
                coAuthors: resolution.coAuthors,
                status: resolution.status,
                version: resolution.version,
                submittedAt: resolution.submittedAt,
                wordCount: resolution.wordCount
            },
            message: 'Resolution submitted successfully'
        });

    } catch (error) {
        logger.error('Submit resolution error:', error);
        res.status(500).json({ error: 'Failed to submit resolution' });
    }
};

// Get resolutions for committee
const getResolutions = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { status = 'all', page = 1, limit = 20 } = req.query;

        const filter = { committeeId };

        if (status !== 'all') {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const resolutions = await Resolution.find(filter)
            .populate('coalitionId', 'name headCountry')
            .populate('presidiumReview.reviewedBy', 'presidiumRole username')
            .sort({ submittedAt: 1 }) // Order by submission time (first submitted first)
            .skip(skip)
            .limit(parseInt(limit));

        const totalResolutions = await Resolution.countDocuments(filter);

        res.json({
            success: true,
            resolutions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalResolutions / limit),
                totalResolutions,
                hasNext: skip + resolutions.length < totalResolutions,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error('Get resolutions error:', error);
        res.status(500).json({ error: 'Failed to fetch resolutions' });
    }
};

// Get single resolution
const getResolution = async (req, res) => {
    try {
        const { id } = req.params;

        const resolution = await Resolution.findById(id)
            .populate('coalitionId')
            .populate('committeeId', 'name')
            .populate('presidiumReview.reviewedBy', 'presidiumRole username');

        if (!resolution) {
            return res.status(404).json({ error: 'Resolution not found' });
        }

        // Check access permissions
        if (req.user.role !== 'admin' &&
            req.user.committeeId?.toString() !== resolution.committeeId._id.toString()) {
            return res.status(403).json({ error: 'Access denied to this resolution' });
        }

        res.json({
            success: true,
            resolution
        });

    } catch (error) {
        logger.error('Get resolution error:', error);
        res.status(500).json({ error: 'Failed to fetch resolution' });
    }
};

// Review resolution (presidium only)
const reviewResolution = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            decision,
            comments,
            allowResubmission = false,
            extendedDeadline
        } = req.body;

        if (!['accept', 'reject_with_deadline', 'reject_with_extension'].includes(decision)) {
            return res.status(400).json({
                error: 'Invalid decision'
            });
        }

        const resolution = await Resolution.findById(id);

        if (!resolution) {
            return res.status(404).json({ error: 'Resolution not found' });
        }

        // Check committee access
        if (req.user.committeeId?.toString() !== resolution.committeeId.toString()) {
            return res.status(403).json({ error: 'Access denied to this resolution' });
        }

        if (resolution.status === 'approved' || resolution.status === 'working_document') {
            return res.status(400).json({
                error: 'Cannot review already approved resolution'
            });
        }

        // Add review
        resolution.addPresidiumReview({
            reviewedBy: req.user.userId,
            decision,
            comments: comments || '',
            allowResubmission: decision.includes('reject') ? allowResubmission : true,
            extendedDeadline: extendedDeadline ? new Date(extendedDeadline) : null
        });

        await resolution.save();

        // Notify coalition head
        if (req.app.locals.io) {
            const coalition = await Coalition.findById(resolution.coalitionId);
            emitToUser(req.app.locals.io, coalition.headEmail, 'resolution-reviewed', {
                resolutionId: resolution._id,
                decision,
                comments: comments || '',
                canResubmit: resolution.canResubmit()
            });
        }

        logger.info(`Resolution reviewed: "${resolution.title}" - ${decision}`);

        res.json({
            success: true,
            review: resolution.presidiumReview,
            status: resolution.status,
            canResubmit: resolution.canResubmit(),
            message: `Resolution ${decision.replace('_', ' ')}`
        });

    } catch (error) {
        logger.error('Review resolution error:', error);
        res.status(500).json({ error: 'Failed to review resolution' });
    }
};

module.exports = {
    createCoalition,
    getCoalitions,
    getCoalition,
    respondToInvitation,
    activateCoalition,
    leaveCoalition,
    submitResolution,
    getResolutions,
    getResolution,
    reviewResolution
};