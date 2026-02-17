const { RegistrationApplication } = require('./model');
const { RegistrationForm } = require('../form/model');
const { Event } = require('../../event/model');
const { EventParticipant } = require('../../participant/model');
const { Notification } = require('../../notification/model');

// =============================================
// APPLICANT-FACING ENDPOINTS
// =============================================

// Submit a new application (applicant)
const submitApplication = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { committeePreferences, customFieldResponses } = req.body;

        // Check event exists and registration is open
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.status !== 'registration_open') {
            return res.status(400).json({ error: 'Registration is not currently open for this event' });
        }

        // Get the form
        const form = await RegistrationForm.findOne({ event: eventId, status: 'active' });
        if (!form) {
            return res.status(400).json({ error: 'Registration form is not active' });
        }

        // Check for existing application
        const existing = await RegistrationApplication.findOne({
            event: eventId,
            applicant: req.user.userId
        });

        if (existing && !existing.isTerminal() && existing.currentStage !== 'returned_for_revision') {
            return res.status(409).json({
                error: 'You already have an active application for this event',
                currentStage: existing.currentStage
            });
        }

        // Validate committee preferences
        if (!committeePreferences || committeePreferences.length === 0) {
            return res.status(400).json({ error: 'At least one committee preference is required' });
        }

        if (committeePreferences.length > form.committeePreferenceCount) {
            return res.status(400).json({
                error: `Maximum ${form.committeePreferenceCount} committee preferences allowed`
            });
        }

        // Validate required custom fields
        const requiredFields = form.customFields.filter(f => f.required);
        for (const field of requiredFields) {
            const value = customFieldResponses?.[field.fieldId];
            if (value === undefined || value === null || value === '') {
                return res.status(400).json({
                    error: `Required field "${field.label}" is missing`
                });
            }
        }

        // Determine first review stage
        const firstStage = form.getFirstReviewStage();

        if (existing && existing.currentStage === 'returned_for_revision') {
            // Re-submission — update existing application
            existing.committeePreferences = committeePreferences;
            existing.customFieldResponses = new Map(Object.entries(customFieldResponses || {}));
            existing.moveToStage(firstStage, null, 'Re-submitted after revision');

            await existing.save();

            global.logger.info(`Application re-submitted: ${req.user.email} for event ${eventId}`);

            return res.json({
                success: true,
                application: existing,
                message: 'Application re-submitted successfully'
            });
        }

        // Create new application
        const application = new RegistrationApplication({
            event: eventId,
            applicant: req.user.userId,
            form: form._id,
            currentStage: firstStage,
            committeePreferences,
            customFieldResponses: new Map(Object.entries(customFieldResponses || {})),
            statusHistory: [{
                fromStage: null,
                toStage: firstStage,
                changedBy: null,
                comment: 'Application submitted',
                timestamp: new Date()
            }]
        });

        await application.save();

        // Update event stats
        try {
            event.statistics.totalApplications = (event.statistics.totalApplications || 0) + 1;
            await event.save();
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application submitted: ${req.user.email} for event ${event.name}`);

        res.status(201).json({
            success: true,
            application,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        global.logger.error('Submit application error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'You already have an application for this event' });
        }

        res.status(500).json({ error: 'Failed to submit application' });
    }
};

// Get my application status (applicant)
const getMyApplication = async (req, res) => {
    try {
        const { eventId } = req.params;

        const application = await RegistrationApplication.findOne({
            event: eventId,
            applicant: req.user.userId
        })
            .populate('committeePreferences.committee', 'name acronym')
            .populate('assignedCommittee', 'name acronym')
            .select('-moderatorNotes')  // hide internal notes from applicant
            .lean();

        if (!application) {
            return res.status(404).json({ error: 'No application found' });
        }

        res.json({ success: true, application });
    } catch (error) {
        global.logger.error('Get my application error:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
};

// Withdraw application (applicant)
const withdrawApplication = async (req, res) => {
    try {
        const { eventId } = req.params;

        const application = await RegistrationApplication.findOne({
            event: eventId,
            applicant: req.user.userId
        });

        if (!application) {
            return res.status(404).json({ error: 'No application found' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Cannot withdraw a finalized application' });
        }

        application.moveToStage('withdrawn', req.user.userId, 'Withdrawn by applicant');
        await application.save();

        global.logger.info(`Application withdrawn: ${req.user.email} for event ${eventId}`);

        res.json({ success: true, message: 'Application withdrawn' });
    } catch (error) {
        global.logger.error('Withdraw application error:', error);
        res.status(500).json({ error: 'Failed to withdraw application' });
    }
};

// =============================================
// MODERATOR-FACING ENDPOINTS
// =============================================

// Get all applications for an event (filterable)
const getApplications = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { stage, page = 1, limit = 50, sort = '-submittedAt' } = req.query;

        const filter = { event: eventId };
        if (stage) filter.currentStage = stage;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [applications, total] = await Promise.all([
            RegistrationApplication.find(filter)
                .populate('applicant', 'firstName lastName email institution phone avatar')
                .populate('committeePreferences.committee', 'name acronym')
                .populate('assignedCommittee', 'name acronym')
                .populate('decidedBy', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            RegistrationApplication.countDocuments(filter)
        ]);

        // Also get stage counts for sidebar/filters
        const stageCounts = await RegistrationApplication.aggregate([
            { $match: { event: new (require('mongoose').Types.ObjectId)(eventId) } },
            { $group: { _id: '$currentStage', count: { $sum: 1 } } }
        ]);

        const stageCountMap = {};
        stageCounts.forEach(s => { stageCountMap[s._id] = s.count; });

        res.json({
            success: true,
            applications,
            stageCounts: stageCountMap,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// Get single application details
const getApplication = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        })
            .populate('applicant', 'firstName lastName email institution phone avatar dateOfBirth languageProficiency')
            .populate('committeePreferences.committee', 'name acronym type')
            .populate('assignedCommittee', 'name acronym')
            .populate('form')
            .populate('statusHistory.changedBy', 'firstName lastName')
            .populate('moderatorNotes.author', 'firstName lastName')
            .populate('decidedBy', 'firstName lastName email')
            .populate('eventParticipant');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ success: true, application });
    } catch (error) {
        global.logger.error('Get application error:', error);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
};

// Move application to next stage
const moveToStage = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { stage, comment } = req.body;

        if (!stage) {
            return res.status(400).json({ error: 'Target stage is required' });
        }

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Cannot change stage of a finalized application' });
        }

        application.moveToStage(stage, req.user.userId, comment || null);
        await application.save();

        // Send notification to applicant
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: `Application status updated`,
                message: `Your application has moved to: ${stage.replace(/_/g, ' ')}`,
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application ${applicationId} moved to ${stage} by ${req.user.userId}`);

        res.json({ success: true, application, message: `Application moved to ${stage}` });
    } catch (error) {
        global.logger.error('Move to stage error:', error);
        res.status(500).json({ error: 'Failed to update application stage' });
    }
};

// Return application for revision
const returnForRevision = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ error: 'A comment explaining what needs revision is required' });
        }

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Cannot return a finalized application' });
        }

        application.moveToStage('returned_for_revision', req.user.userId, comment);
        await application.save();

        // Notify applicant
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Revision requested for your application',
                message: comment,
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application ${applicationId} returned for revision by ${req.user.userId}`);

        res.json({ success: true, application, message: 'Application returned for revision' });
    } catch (error) {
        global.logger.error('Return for revision error:', error);
        res.status(500).json({ error: 'Failed to return application' });
    }
};

// Accept application — creates EventParticipant
const acceptApplication = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { committeeId, country, role = 'delegate', comment } = req.body;

        if (!committeeId) {
            return res.status(400).json({ error: 'Committee assignment is required for acceptance' });
        }

        if (role === 'delegate' && (!country || !country.name || !country.code)) {
            return res.status(400).json({ error: 'Country assignment is required for delegates' });
        }

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Application is already finalized' });
        }

        // Check for duplicate country assignment
        if (role === 'delegate' && country?.code) {
            const existingCountry = await EventParticipant.findOne({
                event: eventId,
                committee: committeeId,
                'country.code': country.code.toLowerCase(),
                status: 'active'
            });

            if (existingCountry) {
                return res.status(409).json({
                    error: `Country ${country.name} is already assigned in this committee`
                });
            }
        }

        // Create EventParticipant
        const participant = new EventParticipant({
            user: application.applicant,
            event: eventId,
            committee: committeeId,
            role,
            country: role === 'delegate' ? {
                name: country.name,
                code: country.code.toLowerCase(),
                flag: country.flag || null
            } : { name: null, code: null, flag: null },
            source: 'registration_pipeline',
            registrationApplication: application._id,
            assignedBy: req.user.userId
        });

        await participant.save();

        // Update application
        application.assignedCommittee = committeeId;
        application.assignedRole = role;
        if (role === 'delegate' && country) {
            application.assignedCountry = {
                name: country.name,
                code: country.code.toLowerCase()
            };
        }
        application.eventParticipant = participant._id;
        application.moveToStage('accepted', req.user.userId, comment || 'Application accepted');
        await application.save();

        // Update event stats
        try {
            const event = await Event.findById(eventId);
            if (event) await event.updateStatistics();
        } catch (e) { /* non-fatal */ }

        // Notify applicant
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Your application has been accepted!',
                message: `You have been assigned as ${role} in the event.`,
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application accepted: ${applicationId} → committee ${committeeId} by ${req.user.userId}`);

        res.json({
            success: true,
            application,
            participant,
            message: 'Application accepted and participant created'
        });
    } catch (error) {
        global.logger.error('Accept application error:', error);
        res.status(500).json({ error: 'Failed to accept application' });
    }
};

// Reject application
const rejectApplication = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { comment } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Application is already finalized' });
        }

        application.moveToStage('rejected', req.user.userId, comment || 'Application rejected');
        await application.save();

        // Notify applicant
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Application update',
                message: comment || 'Your application was not accepted at this time.',
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application rejected: ${applicationId} by ${req.user.userId}`);

        res.json({ success: true, application, message: 'Application rejected' });
    } catch (error) {
        global.logger.error('Reject application error:', error);
        res.status(500).json({ error: 'Failed to reject application' });
    }
};

// Add moderator note to application
const addNote = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Note text is required' });
        }

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        application.moderatorNotes.push({
            author: req.user.userId,
            text,
            timestamp: new Date()
        });

        await application.save();

        res.json({ success: true, message: 'Note added' });
    } catch (error) {
        global.logger.error('Add note error:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
};

// Update interview data
const updateInterview = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { scheduledAt, completedAt, notes, score } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (scheduledAt !== undefined) application.interview.scheduledAt = scheduledAt;
        if (completedAt !== undefined) application.interview.completedAt = completedAt;
        if (notes !== undefined) application.interview.notes = notes;
        if (score !== undefined) application.interview.score = score;

        await application.save();

        // Notify applicant if interview is scheduled
        if (scheduledAt) {
            try {
                await Notification.send({
                    recipient: application.applicant,
                    type: 'registration_status_change',
                    title: 'Interview scheduled',
                    message: `Your interview has been scheduled for ${new Date(scheduledAt).toLocaleString()}`,
                    relatedEntity: { entityType: 'registration', entityId: application._id },
                    link: `/events/${eventId}/my-application`
                });
            } catch (e) { /* non-fatal */ }
        }

        res.json({ success: true, application, message: 'Interview data updated' });
    } catch (error) {
        global.logger.error('Update interview error:', error);
        res.status(500).json({ error: 'Failed to update interview data' });
    }
};

// Verify payment
const verifyPayment = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { amount, currency, paidAt } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        application.payment.amount = amount || application.payment.amount;
        application.payment.currency = currency || application.payment.currency;
        application.payment.paidAt = paidAt || new Date();
        application.payment.verifiedBy = req.user.userId;

        await application.save();

        res.json({ success: true, application, message: 'Payment verified' });
    } catch (error) {
        global.logger.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};

module.exports = {
    submitApplication,
    getMyApplication,
    withdrawApplication,
    getApplications,
    getApplication,
    moveToStage,
    returnForRevision,
    acceptApplication,
    rejectApplication,
    addNote,
    updateInterview,
    verifyPayment
};