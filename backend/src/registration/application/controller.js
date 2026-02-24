const { RegistrationApplication } = require('./model');
const { RegistrationForm } = require('../form/model');
const { Event } = require('../../event/model');
const { EventParticipant } = require('../../participant/model');
const { Notification } = require('../../notification/model');
const appEmails = require('../../email/applicationEmails');

// =============================================
// APPLICANT-FACING ENDPOINTS
// =============================================

// Submit a new application (applicant)
// UPDATED: Routes to first-priority committee on submit
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

            // Re-initialize committee routing
            existing.currentPriorityIndex = 0;
            existing.committeeReviews = [];
            existing.initFirstReview();

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

        // Initialize committee routing — route to first-priority committee
        application.initFirstReview();

        await application.save();

        // Update event stats
        try {
            event.statistics.totalApplications = (event.statistics.totalApplications || 0) + 1;
            await event.save();
        } catch (e) { /* non-fatal */ }

        appEmails.onSubmitted(application, event);

        global.logger.info(`Application submitted: ${req.user.email} for event ${event.name} → committee ${application.currentReviewingCommittee}`);

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
// UPDATED: hide committee review internals, show applicant-friendly status
const getMyApplication = async (req, res) => {
    try {
        const { eventId } = req.params;

        const application = await RegistrationApplication.findOne({
            event: eventId,
            applicant: req.user.userId
        })
            .populate('committeePreferences.committee', 'name acronym')
            .populate('acceptance.committee', 'name acronym')
            // DEPRECATED field, keep populated for backward compat
            .populate('assignedCommittee', 'name acronym')
            // Hide internal data from applicant
            .select('-moderatorNotes -committeeReviews')
            .lean();

        if (!application) {
            return res.status(404).json({ error: 'No application found' });
        }

        // Map internal stage to applicant-friendly stage
        // Applicant should not see individual pass decisions or committee routing
        const applicantStage = getApplicantFacingStage(application.currentStage);

        res.json({
            success: true,
            application: {
                ...application,
                applicantStage  // readable stage for the applicant UI
            }
        });
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
// ORG ADMIN / MODERATOR ENDPOINTS
// =============================================

// Get all applications for an event (filterable)
// UPDATED: populate new fields
const getApplications = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { stage, committee, page = 1, limit = 50, sort = '-submittedAt' } = req.query;

        const filter = { event: eventId };
        if (stage) filter.currentStage = stage;
        if (committee) filter.currentReviewingCommittee = committee;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [applications, total] = await Promise.all([
            RegistrationApplication.find(filter)
                .populate('applicant', 'firstName lastName email institution phone avatar')
                .populate('committeePreferences.committee', 'name acronym')
                .populate('currentReviewingCommittee', 'name acronym')
                .populate('acceptance.committee', 'name acronym')
                // DEPRECATED fields, keep populated for backward compat
                .populate('assignedCommittee', 'name acronym')
                .populate('decidedBy', 'firstName lastName email')
                .populate('committeeReviews.committee', 'name acronym')
                .populate('committeeReviews.decidedBy', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            RegistrationApplication.countDocuments(filter)
        ]);

        // Stage counts for sidebar/filters
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
// UPDATED: populate new fields
const getApplication = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        })
            .populate('applicant', 'firstName lastName email institution phone avatar dateOfBirth languageProficiency')
            .populate('committeePreferences.committee', 'name acronym type')
            .populate('currentReviewingCommittee', 'name acronym')
            .populate('acceptance.committee', 'name acronym')
            .populate('acceptance.acceptedBy', 'firstName lastName')
            // DEPRECATED fields, keep populated for backward compat
            .populate('assignedCommittee', 'name acronym')
            .populate('form')
            .populate('statusHistory.changedBy', 'firstName lastName')
            .populate('moderatorNotes.author', 'firstName lastName')
            .populate('committeeReviews.committee', 'name acronym')
            .populate('committeeReviews.decidedBy', 'firstName lastName')
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

// Move application to next stage (org admin generic stage move)
// KEPT: for org admin manual overrides, but committee-scoped advance is preferred
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

        const event = await Event.findById(eventId);
        appEmails.onReturnedForRevision(application, event, comment);

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

// Accept application — LEGACY org admin endpoint
// UPDATED: Now uses acceptance{} and routes to payment_pending instead of creating EventParticipant immediately
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

        // Use the new acceptance method
        application.acceptByCommittee(req.user.userId, {
            committee: committeeId,
            role,
            country: role === 'delegate' ? {
                name: country.name,
                code: country.code.toLowerCase(),
                flag: country.flag || null
            } : { name: null, code: null, flag: null }
        });

        // Check if event has registration fee configured
        const event = await Event.findById(eventId);
        const feeEnabled = event?.registrationFee?.enabled;

        if (!feeEnabled) {
            // No fee required — skip payment, create EventParticipant immediately
            const participant = await createEventParticipant(application, eventId, req.user.userId);
            application.eventParticipant = participant._id;
            application.moveToStage('joined', req.user.userId, 'Accepted — no payment required');

            appEmails.onAccepted(application, event, 'the committee');

            await application.save();

            // Update event stats
            try {
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

            global.logger.info(`Application accepted (no fee): ${applicationId} → committee ${committeeId} by ${req.user.userId}`);

            return res.json({
                success: true,
                application,
                participant,
                message: 'Application accepted and participant created'
            });
        }

        // Fee required — stay at payment_pending (set by acceptByCommittee)
        // Set payment details from event defaults
        if (event.registrationFee.defaultAmount) {
            application.payment.amount = event.registrationFee.defaultAmount;
            application.payment.currency = event.registrationFee.currency || 'USD';
        }
        if (event.registrationFee.defaultDeadlineDays) {
            application.payment.deadline = new Date(
                Date.now() + event.registrationFee.defaultDeadlineDays * 24 * 60 * 60 * 1000
            );
        }

        await application.save();

        appEmails.onAccepted(application, event, 'the committee');
        appEmails.onPaymentRequired(application, event);

        // Notify applicant about acceptance + payment
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Your application has been accepted!',
                message: `You've been accepted. Please complete payment to finalize your participation.`,
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application accepted (payment pending): ${applicationId} → committee ${committeeId} by ${req.user.userId}`);

        res.json({
            success: true,
            application,
            message: 'Application accepted — payment pending'
        });
    } catch (error) {
        global.logger.error('Accept application error:', error);
        res.status(500).json({ error: 'Failed to accept application' });
    }
};

// Reject application (org admin force-reject from any stage)
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

        const event = await Event.findById(eventId);
        appEmails.onRejected(application, event);

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

// Update interview data — LEGACY (updates flat interview field)
// For committee-scoped interview updates, use updateCommitteeInterview
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

        const event = await Event.findById(eventId);
        appEmails.onInterviewScheduled(application, event, scheduledAt);

        res.json({ success: true, application, message: 'Interview data updated' });
    } catch (error) {
        global.logger.error('Update interview error:', error);
        res.status(500).json({ error: 'Failed to update interview data' });
    }
};

// Verify payment — UPDATED: creates EventParticipant on verification
const verifyPayment = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { amount, currency, paidAt, receiptPath } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.currentStage !== 'payment_pending') {
            return res.status(400).json({ error: 'Application is not in payment_pending stage' });
        }

        // Update payment data
        application.payment.paidAmount = amount || application.payment.amount;
        application.payment.currency = currency || application.payment.currency;
        application.payment.paidAt = paidAt || new Date();
        application.payment.receiptPath = receiptPath || null;
        application.payment.verifiedBy = req.user.userId;
        application.payment.verifiedAt = new Date();

        // Create EventParticipant
        const participant = await createEventParticipant(application, eventId, req.user.userId);
        application.eventParticipant = participant._id;
        application.moveToStage('joined', req.user.userId, 'Payment verified — participant created');

        await application.save();

        // Update event stats
        try {
            const event = await Event.findById(eventId);
            if (event) await event.updateStatistics();

            appEmails.onPaymentVerified(application, event);
        } catch (e) { /* non-fatal */ }

        // Notify applicant
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Payment confirmed — welcome!',
                message: 'Your payment has been verified. Welcome to the event!',
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Payment verified: ${applicationId} by ${req.user.userId}`);

        res.json({
            success: true,
            application,
            participant,
            message: 'Payment verified and participant created'
        });
    } catch (error) {
        global.logger.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};

// =============================================
// NEW: COMMITTEE-SCOPED ENDPOINTS (Presidium)
// =============================================

// Get applications routed to a specific committee
const getCommitteeApplications = async (req, res) => {
    try {
        const { eventId, committeeId } = req.params;
        const { stage, page = 1, limit = 50, sort = '-submittedAt' } = req.query;

        const filter = {
            event: eventId,
            currentReviewingCommittee: committeeId
        };
        // Only show applications that are in reviewable stages
        if (stage) {
            filter.currentStage = stage;
        } else {
            filter.currentStage = { $in: ['form_review', 'interview'] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [applications, total] = await Promise.all([
            RegistrationApplication.find(filter)
                .populate('applicant', 'firstName lastName email institution phone avatar')
                .populate('committeePreferences.committee', 'name acronym')
                .populate('committeeReviews.committee', 'name acronym')
                .populate('committeeReviews.decidedBy', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            RegistrationApplication.countDocuments(filter)
        ]);

        // Enrich: for each application, attach previous committee notes
        const enriched = applications.map(app => ({
            ...app,
            previousReviews: (app.committeeReviews || []).filter(r => r.decision !== 'pending'),
            currentPriority: app.currentPriorityIndex + 1,
            totalPreferences: app.committeePreferences?.length || 0
        }));

        // Stage counts for this committee
        const stageCounts = await RegistrationApplication.aggregate([
            { $match: { event: new (require('mongoose').Types.ObjectId)(eventId), currentReviewingCommittee: new (require('mongoose').Types.ObjectId)(committeeId) } },
            { $group: { _id: '$currentStage', count: { $sum: 1 } } }
        ]);

        const stageCountMap = {};
        stageCounts.forEach(s => { stageCountMap[s._id] = s.count; });

        res.json({
            success: true,
            applications: enriched,
            stageCounts: stageCountMap,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get committee applications error:', error);
        res.status(500).json({ error: 'Failed to fetch committee applications' });
    }
};

// Advance application stage within committee review (form_review → interview)
const advanceApplicationStage = async (req, res) => {
    try {
        const { eventId, committeeId, applicationId } = req.params;
        const { comment } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId,
            currentReviewingCommittee: committeeId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found or not assigned to this committee' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Application is already finalized' });
        }

        // Get the form to check available pipeline stages
        const form = await RegistrationForm.findById(application.form);
        if (!form) {
            return res.status(400).json({ error: 'Registration form not found' });
        }

        const activeStages = form.getActiveStages().map(s => s.stage);
        const currentIdx = activeStages.indexOf(application.currentStage);

        if (currentIdx === -1 || currentIdx >= activeStages.length - 1) {
            return res.status(400).json({
                error: 'Cannot advance — application is at the last review stage. Use accept/pass instead.'
            });
        }

        const nextStage = activeStages[currentIdx + 1];
        application.moveToStage(nextStage, req.user.userId, comment || `Advanced to ${nextStage}`);
        await application.save();

        // Notify applicant about stage change (generic)
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Application status updated',
                message: 'Your application is progressing through review.',
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Application ${applicationId} advanced to ${nextStage} in committee ${committeeId} by ${req.user.userId}`);

        res.json({ success: true, application, message: `Application advanced to ${nextStage}` });
    } catch (error) {
        global.logger.error('Advance application stage error:', error);
        res.status(500).json({ error: 'Failed to advance application stage' });
    }
};

// Committee presidium reviews application: accept or pass
const reviewApplication = async (req, res) => {
    try {
        const { eventId, committeeId, applicationId } = req.params;
        const { decision, note, country, role } = req.body;

        if (!decision || !['accepted', 'passed'].includes(decision)) {
            return res.status(400).json({ error: 'Decision must be "accepted" or "passed"' });
        }

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId,
            currentReviewingCommittee: committeeId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found or not assigned to this committee' });
        }

        if (application.isTerminal()) {
            return res.status(400).json({ error: 'Application is already finalized' });
        }

        if (!['form_review', 'interview'].includes(application.currentStage)) {
            return res.status(400).json({ error: `Cannot review from stage: ${application.currentStage}` });
        }

        if (decision === 'accepted') {
            const { Committee } = require('../../committee/model');
            const committeeDoc = await Committee.findById(committeeId).select('name').lean();
            const committeeName = committeeDoc?.name || 'the committee';
            
            // Validate country for delegates
            if ((role === 'delegate' || !role) && (!country || !country.name || !country.code)) {
                return res.status(400).json({ error: 'Country assignment is required for delegates' });
            }

            // Check for duplicate country
            if ((role === 'delegate' || !role) && country?.code) {
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

            // Accept
            application.acceptByCommittee(req.user.userId, {
                committee: committeeId,
                role: role || 'delegate',
                country: country ? {
                    name: country.name,
                    code: country.code.toLowerCase(),
                    flag: country.flag || null
                } : { name: null, code: null, flag: null }
            });

            // Update internal note on the review entry
            const currentReview = application.committeeReviews.find(
                r => r.committee.toString() === committeeId && r.decision === 'accepted'
            );
            if (currentReview && note) {
                currentReview.internalNote = note;
            }

            // Check if event has fee configured
            const event = await Event.findById(eventId);
            const feeEnabled = event?.registrationFee?.enabled;

            if (!feeEnabled) {
                // No fee — create participant immediately
                const participant = await createEventParticipant(application, eventId, req.user.userId);
                application.eventParticipant = participant._id;
                application.moveToStage('joined', req.user.userId, 'Accepted — no payment required');

                appEmails.onAccepted(application, event, committeeName);

                await application.save();

                try {
                    if (event) await event.updateStatistics();
                } catch (e) { /* non-fatal */ }

                // Notify
                try {
                    await Notification.send({
                        recipient: application.applicant,
                        type: 'registration_status_change',
                        title: 'Congratulations! You\'ve been accepted!',
                        message: `You have been assigned as ${role || 'delegate'} in the event. Welcome!`,
                        relatedEntity: { entityType: 'registration', entityId: application._id },
                        link: `/events/${eventId}/my-application`
                    });
                } catch (e) { /* non-fatal */ }

                global.logger.info(`Application accepted (no fee) by committee ${committeeId}: ${applicationId}`);

                return res.json({
                    success: true,
                    application,
                    participant,
                    message: 'Application accepted and participant created'
                });
            }

            // Fee required — set payment details
            if (event.registrationFee.defaultAmount) {
                application.payment.amount = event.registrationFee.defaultAmount;
                application.payment.currency = event.registrationFee.currency || 'USD';
            }
            if (event.registrationFee.defaultDeadlineDays) {
                application.payment.deadline = new Date(
                    Date.now() + event.registrationFee.defaultDeadlineDays * 24 * 60 * 60 * 1000
                );
            }

            await application.save();

            appEmails.onAccepted(application, event, committeeName);
            appEmails.onPaymentRequired(application, event);

            // Notify
            try {
                await Notification.send({
                    recipient: application.applicant,
                    type: 'registration_status_change',
                    title: 'Congratulations! You\'ve been accepted!',
                    message: 'Please complete payment to finalize your participation.',
                    relatedEntity: { entityType: 'registration', entityId: application._id },
                    link: `/events/${eventId}/my-application`
                });
            } catch (e) { /* non-fatal */ }

            global.logger.info(`Application accepted (payment pending) by committee ${committeeId}: ${applicationId}`);

            return res.json({
                success: true,
                application,
                message: 'Application accepted — payment pending'
            });
        }

        // PASSED — route to next committee
        const hasNext = application.passToNextCommittee(
            req.user.userId,
            note || null,
            application.currentStage
        );

        await application.save();

        appEmails.onRejected(application, event);

        if (hasNext) {
            global.logger.info(`Application ${applicationId} passed by committee ${committeeId} → routed to next committee`);

            res.json({
                success: true,
                application,
                message: 'Application passed to next committee in preference chain'
            });
        } else {
            // All committees passed — fully rejected
            // Notify applicant
            try {
                await Notification.send({
                    recipient: application.applicant,
                    type: 'registration_status_change',
                    title: 'Application update',
                    message: 'We regret to inform you that your application was not accepted at this time.',
                    relatedEntity: { entityType: 'registration', entityId: application._id },
                    link: `/events/${eventId}/my-application`
                });
            } catch (e) { /* non-fatal */ }

            global.logger.info(`Application ${applicationId} rejected — all committees passed`);

            res.json({
                success: true,
                application,
                message: 'All committees have passed — application rejected'
            });
        }
    } catch (error) {
        global.logger.error('Review application error:', error);
        res.status(500).json({ error: 'Failed to review application' });
    }
};

// Update interview data for a specific committee review
const updateCommitteeInterview = async (req, res) => {
    try {
        const { eventId, committeeId, applicationId } = req.params;
        const { scheduledAt, completedAt, notes, score } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId,
            currentReviewingCommittee: committeeId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found or not assigned to this committee' });
        }

        // Find the current (pending) review for this committee
        const review = application.committeeReviews.find(
            r => r.committee.toString() === committeeId && r.decision === 'pending'
        );

        if (!review) {
            return res.status(400).json({ error: 'No pending review found for this committee' });
        }

        if (scheduledAt !== undefined) review.interviewData.scheduledAt = scheduledAt;
        if (completedAt !== undefined) review.interviewData.completedAt = completedAt;
        if (notes !== undefined) review.interviewData.notes = notes;
        if (score !== undefined) review.interviewData.score = score;

        // Also update the legacy flat interview field for backward compat
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

        const event = await Event.findById(eventId);
        appEmails.onInterviewScheduled(application, event, scheduledAt);

        global.logger.info(`Committee interview updated: ${applicationId} in committee ${committeeId} by ${req.user.userId}`);

        res.json({ success: true, application, message: 'Interview data updated' });
    } catch (error) {
        global.logger.error('Update committee interview error:', error);
        res.status(500).json({ error: 'Failed to update interview data' });
    }
};

// =============================================
// HELPERS
// =============================================

// Create EventParticipant from an accepted application
async function createEventParticipant(application, eventId, assignedBy) {
    const acceptance = application.acceptance;

    const participant = new EventParticipant({
        user: application.applicant,
        event: eventId,
        committee: acceptance.committee,
        role: acceptance.role || 'delegate',
        country: acceptance.country?.name ? {
            name: acceptance.country.name,
            code: acceptance.country.code,
            flag: acceptance.country.flag || null
        } : { name: null, code: null, flag: null },
        source: 'registration_pipeline',
        registrationApplication: application._id,
        assignedBy
    });

    await participant.save();
    return participant;
}

// Map internal stages to applicant-facing stages
// Applicant should not see individual pass decisions or committee routing details
function getApplicantFacingStage(internalStage) {
    const mapping = {
        'form_review': 'under_review',
        'interview': 'under_review',
        'passed': 'under_review',           // applicant sees "under review" while being routed
        'returned_for_revision': 'returned_for_revision',
        'accepted': 'accepted',
        'payment_pending': 'payment_pending',
        'payment_verified': 'payment_verified',
        'joined': 'joined',
        'rejected': 'rejected',
        'withdrawn': 'withdrawn'
    };
    return mapping[internalStage] || internalStage;
}

// Configure payment for an individual application
// Sets amount, deadline, and instructions per-applicant (overrides event defaults)
const configurePayment = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { amount, currency, deadline, instructions } = req.body;

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.currentStage !== 'payment_pending') {
            return res.status(400).json({ error: 'Application is not in payment_pending stage' });
        }

        // Update individual payment config
        if (amount !== undefined) application.payment.amount = amount;
        if (currency !== undefined) application.payment.currency = currency;
        if (deadline !== undefined) application.payment.deadline = new Date(deadline);
        if (instructions !== undefined) {
            // Store instructions at application level (event-level instructions are in Event model)
            // For now, add as a status history comment for visibility
            application.statusHistory.push({
                fromStage: 'payment_pending',
                toStage: 'payment_pending',
                changedBy: req.user.userId,
                comment: `Payment configured: ${amount ? `${currency || 'USD'} ${amount}` : ''} ${deadline ? `deadline: ${new Date(deadline).toLocaleDateString()}` : ''}`.trim(),
                timestamp: new Date()
            });
        }

        await application.save();

        global.logger.info(`Payment configured for application ${applicationId} by ${req.user.userId}`);

        res.json({
            success: true,
            application,
            message: 'Payment configuration updated'
        });
    } catch (error) {
        global.logger.error('Configure payment error:', error);
        res.status(500).json({ error: 'Failed to configure payment' });
    }
};

// Grant fee waiver (partial or full)
// Full waiver: auto-advance to joined → create EventParticipant
const grantWaiver = async (req, res) => {
    try {
        const { eventId, applicationId } = req.params;
        const { type, discountAmount, reason } = req.body;

        if (!type || !['partial', 'full'].includes(type)) {
            return res.status(400).json({ error: 'Waiver type must be "partial" or "full"' });
        }

        if (type === 'partial' && (discountAmount === undefined || discountAmount === null)) {
            return res.status(400).json({ error: 'Discount amount is required for partial waiver' });
        }

        const application = await RegistrationApplication.findOne({
            _id: applicationId,
            event: eventId
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.currentStage !== 'payment_pending') {
            return res.status(400).json({ error: 'Application is not in payment_pending stage' });
        }

        // Set waiver details
        application.payment.waiver = {
            type,
            discountAmount: type === 'partial' ? discountAmount : application.payment.amount,
            reason: reason || null,
            grantedBy: req.user.userId,
            grantedAt: new Date()
        };

        if (type === 'full') {
            // Full waiver — skip payment entirely, create EventParticipant
            application.payment.paidAmount = 0;
            application.payment.paidAt = new Date();
            application.payment.verifiedBy = req.user.userId;
            application.payment.verifiedAt = new Date();

            const participant = await createEventParticipant(application, eventId, req.user.userId);
            application.eventParticipant = participant._id;
            application.moveToStage('joined', req.user.userId, `Full fee waiver granted${reason ? ': ' + reason : ''}`);

            await application.save();

            appEmails.onPaymentVerified(application, event);

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
                    title: 'Fee waiver granted — welcome!',
                    message: 'Your registration fee has been waived. Welcome to the event!',
                    relatedEntity: { entityType: 'registration', entityId: application._id },
                    link: `/events/${eventId}/my-application`
                });
            } catch (e) { /* non-fatal */ }

            global.logger.info(`Full waiver granted for application ${applicationId} by ${req.user.userId} — participant created`);

            return res.json({
                success: true,
                application,
                participant,
                message: 'Full waiver granted — participant created'
            });
        }

        // Partial waiver — update the effective amount, stay at payment_pending
        const originalAmount = application.payment.amount || 0;
        const effectiveAmount = Math.max(0, originalAmount - discountAmount);
        application.payment.amount = effectiveAmount;

        application.statusHistory.push({
            fromStage: 'payment_pending',
            toStage: 'payment_pending',
            changedBy: req.user.userId,
            comment: `Partial waiver: ${application.payment.currency || 'USD'} ${discountAmount} off (was ${originalAmount}, now ${effectiveAmount})${reason ? ' — ' + reason : ''}`,
            timestamp: new Date()
        });

        await application.save();

        // Notify applicant about reduced fee
        try {
            await Notification.send({
                recipient: application.applicant,
                type: 'registration_status_change',
                title: 'Fee discount applied',
                message: `A partial fee waiver has been applied to your registration. Your updated amount is ${application.payment.currency || 'USD'} ${effectiveAmount}.`,
                relatedEntity: { entityType: 'registration', entityId: application._id },
                link: `/events/${eventId}/my-application`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Partial waiver granted for application ${applicationId} by ${req.user.userId}: ${discountAmount} off`);

        res.json({
            success: true,
            application,
            message: `Partial waiver granted — new amount: ${application.payment.currency || 'USD'} ${effectiveAmount}`
        });
    } catch (error) {
        global.logger.error('Grant waiver error:', error);
        res.status(500).json({ error: 'Failed to grant waiver' });
    }
};

const { User } = require('../../auth/model');

// Direct assignment: assign a user to a committee by userId or email
// Org admin only — bypasses the application pipeline
//
// If fee required and skipPayment !== true:
//   Creates a RegistrationApplication in payment_pending with acceptance pre-filled
// Otherwise:
//   Creates EventParticipant immediately
const directAssign = async (req, res) => {
    try {
        const { eventId, committeeId } = req.params;
        const { userId, email, role, country, skipPayment = false } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        // Resolve user by userId or email
        let user;
        if (userId) {
            user = await User.findById(userId);
        } else if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
        } else {
            return res.status(400).json({ error: 'Either userId or email is required' });
        }

        if (!user) {
            return res.status(404).json({
                error: userId
                    ? 'User not found'
                    : `No user found with email: ${email}. They must register an account first.`
            });
        }

        // Check if user is already a participant in this committee with this role
        const existingParticipant = await EventParticipant.findOne({
            user: user._id,
            event: eventId,
            committee: committeeId,
            role,
            status: 'active'
        });

        if (existingParticipant) {
            return res.status(409).json({
                error: 'This user already has this role in this committee'
            });
        }

        // Check for duplicate country
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

        // Check if event has registration fee and payment is not skipped
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const feeRequired = event.registrationFee?.enabled && !skipPayment;

        if (feeRequired) {
            // Fee required — create a RegistrationApplication in payment_pending
            // with acceptance pre-filled (so it goes through the payment flow)

            // Check if user already has an application for this event
            let application = await RegistrationApplication.findOne({
                event: eventId,
                applicant: user._id
            });

            if (application && !application.isTerminal()) {
                return res.status(409).json({
                    error: 'This user already has an active application for this event. Review it through the normal pipeline or reject it first.'
                });
            }

            // Get or create a form reference (direct assignments still need a form link)
            const form = await RegistrationForm.findOne({ event: eventId });

            if (application && application.isTerminal()) {
                // Re-use the existing application document (reset it)
                application.currentStage = 'payment_pending';
                application.currentPriorityIndex = 0;
                application.currentReviewingCommittee = committeeId;
                application.committeeReviews = [{
                    committee: committeeId,
                    priorityIndex: 0,
                    decision: 'accepted',
                    decidedBy: req.user.userId,
                    decidedAt: new Date(),
                    internalNote: 'Direct assignment by org admin'
                }];
                application.acceptance = {
                    committee: committeeId,
                    role: role,
                    country: country ? {
                        name: country.name,
                        code: country.code.toLowerCase(),
                        flag: country.flag || null
                    } : { name: null, code: null, flag: null },
                    acceptedBy: req.user.userId,
                    acceptedAt: new Date()
                };
                // DEPRECATED fields sync
                application.assignedCommittee = committeeId;
                application.assignedRole = role;
                if (country) {
                    application.assignedCountry = { name: country.name, code: country.code.toLowerCase() };
                }
                // Set payment from event defaults
                application.payment = {
                    amount: event.registrationFee.defaultAmount || null,
                    currency: event.registrationFee.currency || 'USD',
                    deadline: event.registrationFee.defaultDeadlineDays
                        ? new Date(Date.now() + event.registrationFee.defaultDeadlineDays * 24 * 60 * 60 * 1000)
                        : null,
                    waiver: { type: 'none' }
                };
                application.moveToStage('payment_pending', req.user.userId, 'Direct assignment — payment required');
            } else {
                // Create new application
                application = new RegistrationApplication({
                    event: eventId,
                    applicant: user._id,
                    form: form?._id || null,
                    currentStage: 'payment_pending',
                    committeePreferences: [{ committee: committeeId, priority: 1 }],
                    currentPriorityIndex: 0,
                    currentReviewingCommittee: committeeId,
                    committeeReviews: [{
                        committee: committeeId,
                        priorityIndex: 0,
                        decision: 'accepted',
                        decidedBy: req.user.userId,
                        decidedAt: new Date(),
                        internalNote: 'Direct assignment by org admin'
                    }],
                    acceptance: {
                        committee: committeeId,
                        role,
                        country: country ? {
                            name: country.name,
                            code: country.code.toLowerCase(),
                            flag: country.flag || null
                        } : { name: null, code: null, flag: null },
                        acceptedBy: req.user.userId,
                        acceptedAt: new Date()
                    },
                    // DEPRECATED fields sync
                    assignedCommittee: committeeId,
                    assignedRole: role,
                    assignedCountry: country ? { name: country.name, code: country.code.toLowerCase() } : {},
                    payment: {
                        amount: event.registrationFee.defaultAmount || null,
                        currency: event.registrationFee.currency || 'USD',
                        deadline: event.registrationFee.defaultDeadlineDays
                            ? new Date(Date.now() + event.registrationFee.defaultDeadlineDays * 24 * 60 * 60 * 1000)
                            : null,
                        waiver: { type: 'none' }
                    },
                    statusHistory: [{
                        fromStage: null,
                        toStage: 'payment_pending',
                        changedBy: req.user.userId,
                        comment: 'Direct assignment — payment required',
                        timestamp: new Date()
                    }]
                });
            }

            await application.save();

            // Notify user about payment
            try {
                await Notification.send({
                    recipient: user._id,
                    type: 'registration_status_change',
                    title: 'You\'ve been assigned to an event!',
                    message: `You have been assigned as ${role} in the event. Please complete payment to finalize.`,
                    relatedEntity: { entityType: 'registration', entityId: application._id },
                    link: `/events/${eventId}/my-application`
                });
            } catch (e) { /* non-fatal */ }

            global.logger.info(`Direct assignment (payment pending): ${user.email} as ${role} in committee ${committeeId} by ${req.user.userId}`);

            return res.status(201).json({
                success: true,
                application,
                paymentRequired: true,
                message: 'User assigned — payment pending'
            });
        }

        // No fee or skipPayment — create EventParticipant immediately
        const participant = new EventParticipant({
            user: user._id,
            event: eventId,
            committee: committeeId,
            role,
            country: country ? {
                name: country.name,
                code: country.code.toLowerCase(),
                flag: country.flag || null
            } : { name: null, code: null, flag: null },
            source: 'direct_assignment',
            assignedBy: req.user.userId
        });

        await participant.save();
        await participant.populate('user', 'firstName lastName email avatar');
        await participant.populate('committee', 'name acronym');

        // Update event statistics
        try { await event.updateStatistics(); } catch (e) { /* non-fatal */ }

        // Notify user
        try {
            await Notification.send({
                recipient: user._id,
                type: 'registration_status_change',
                title: 'You\'ve been assigned to an event!',
                message: `You have been assigned as ${role} in the event.`,
                link: `/events/${eventId}`
            });
        } catch (e) { /* non-fatal */ }

        global.logger.info(`Direct assignment: ${user.email} as ${role} in committee ${committeeId} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            participant,
            paymentRequired: false,
            message: 'Participant assigned successfully'
        });
    } catch (error) {
        global.logger.error('Direct assign error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                error: 'This participant already has this role in this committee'
            });
        }

        res.status(500).json({ error: 'Failed to assign participant' });
    }
};

module.exports = {
    // Applicant endpoints
    submitApplication,
    getMyApplication,
    withdrawApplication,
    // Org admin / moderator endpoints
    getApplications,
    getApplication,
    moveToStage,
    returnForRevision,
    acceptApplication,
    rejectApplication,
    addNote,
    updateInterview,
    verifyPayment,
    // Committee-scoped endpoints (presidium)
    getCommitteeApplications,
    advanceApplicationStage,
    reviewApplication,
    updateCommitteeInterview,
    configurePayment,
    grantWaiver,
    directAssign
};