/**
 * Application email hooks.
 *
 * All functions are fire-and-forget — they never throw.
 * They resolve the applicant user, build template data, and send via email service.
 *
 * Imported by the application controller as:
 *   const appEmails = require('../../email/applicationEmails');
 */

const emailService = require('./service');
const templates = require('./templates');
const { User } = require('../auth/model');

/**
 * Resolve applicant user from application document.
 * Handles both populated and unpopulated applicant field.
 */
async function resolveApplicant(application) {
    if (application.applicant && typeof application.applicant === 'object' && application.applicant.email) {
        return application.applicant;
    }
    const userId = application.applicant?._id || application.applicant;
    if (!userId) return null;
    return User.findById(userId).select('firstName lastName email').lean();
}

/**
 * Build the "view my application" link
 */
function appLink(application, event) {
    const base = emailService.getClientUrl();
    const eventId = event?._id || application.event;
    return `${base}/events/${eventId}/my-application`;
}

/**
 * Get a display name for the applicant
 */
function getName(user) {
    if (!user) return 'Applicant';
    return user.firstName || user.email?.split('@')[0] || 'Applicant';
}

// =============================================
// HOOKS
// =============================================

/**
 * Application submitted
 * Called as: appEmails.onSubmitted(application, event)
 */
async function onSubmitted(application, event) {
    try {
        const user = await resolveApplicant(application);
        if (!user?.email) return;

        await emailService.send({
            to: user.email,
            subject: `Application received — ${event?.name || 'Event'}`,
            html: templates.applicationSubmitted({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onSubmitted failed:', e.message);
    }
}

/**
 * Application returned for revision
 * Called as: appEmails.onReturnedForRevision(application, event, comment)
 */
async function onReturnedForRevision(application, event, comment) {
    try {
        const user = await resolveApplicant(application);
        if (!user?.email) return;

        await emailService.send({
            to: user.email,
            subject: `Revision requested — ${event?.name || 'Event'}`,
            html: templates.applicationReturnedForRevision({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                comment: comment || 'Please review and update your application.',
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onReturnedForRevision failed:', e.message);
    }
}

/**
 * Application accepted
 * Called as: appEmails.onAccepted(application, event, committeeName)
 */
async function onAccepted(application, event, committeeName) {
    try {
        const user = await resolveApplicant(application);
        if (!user?.email) return;

        const role = application.acceptance?.role || application.assignedRole || 'delegate';

        await emailService.send({
            to: user.email,
            subject: `Accepted — ${event?.name || 'Event'}`,
            html: templates.applicationAccepted({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                committeeName: committeeName || 'your assigned committee',
                role,
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onAccepted failed:', e.message);
    }
}

/**
 * Application rejected
 * Called as: appEmails.onRejected(application, event)
 */
async function onRejected(application, event) {
    try {
        const user = await resolveApplicant(application);
        if (!user?.email) return;

        await emailService.send({
            to: user.email,
            subject: `Application update — ${event?.name || 'Event'}`,
            html: templates.applicationRejected({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onRejected failed:', e.message);
    }
}

/**
 * Payment required after acceptance
 * Called as: appEmails.onPaymentRequired(application, event)
 */
async function onPaymentRequired(application, event) {
    try {
        const user = await resolveApplicant(application);
        if (!user?.email) return;

        await emailService.send({
            to: user.email,
            subject: `Payment required — ${event?.name || 'Event'}`,
            html: templates.paymentRequired({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                amount: application.payment?.amount,
                currency: application.payment?.currency || 'USD',
                deadline: application.payment?.deadline,
                instructions: event?.registrationFee?.instructions || null,
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onPaymentRequired failed:', e.message);
    }
}

/**
 * Payment verified — participant confirmed
 * Called as: appEmails.onPaymentVerified(application, event)
 */
async function onPaymentVerified(application, event) {
    try {
        const user = await resolveApplicant(application);
        if (!user?.email) return;

        await emailService.send({
            to: user.email,
            subject: `Payment confirmed — welcome to ${event?.name || 'the event'}!`,
            html: templates.paymentVerified({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onPaymentVerified failed:', e.message);
    }
}

/**
 * Interview scheduled
 * Called as: appEmails.onInterviewScheduled(application, event, scheduledAt)
 */
async function onInterviewScheduled(application, event, scheduledAt) {
    try {
        if (!scheduledAt) return;

        const user = await resolveApplicant(application);
        if (!user?.email) return;

        await emailService.send({
            to: user.email,
            subject: `Interview scheduled — ${event?.name || 'Event'}`,
            html: templates.interviewScheduled({
                eventName: event?.name || 'the event',
                applicantName: getName(user),
                scheduledAt,
                appLink: appLink(application, event)
            })
        });
    } catch (e) {
        global.logger.error('Email hook onInterviewScheduled failed:', e.message);
    }
}

module.exports = {
    onSubmitted,
    onReturnedForRevision,
    onAccepted,
    onRejected,
    onPaymentRequired,
    onPaymentVerified,
    onInterviewScheduled
};