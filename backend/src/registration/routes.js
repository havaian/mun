const express = require('express');
const router = express.Router({ mergeParams: true }); // access :orgId, :eventId from parent
const formController = require('./form/controller');
const appController = require('./application/controller');
const { requireVerifiedEmail } = require('../email/middleware');

// =============================================
// FORM MANAGEMENT (moderators/admin)
// =============================================

// Get form options (field types, pipeline stages)
router.get('/form/options',
    global.auth.token,
    formController.getFormOptions
);

// Get registration form for event (moderator)
router.get('/form',
    global.auth.token,
    global.auth.orgPermission('manage_registration', 'orgId'),
    formController.getForm
);

// Create or update registration form
router.put('/form',
    global.auth.token,
    global.auth.orgPermission('manage_registration', 'orgId'),
    formController.upsertForm
);

// Get public form info (applicants — no org permission needed, just auth)
router.get('/form/public',
    global.auth.token,
    formController.getPublicForm
);

// =============================================
// APPLICATION — APPLICANT ENDPOINTS
// =============================================

// Submit application
router.post('/applications',
    global.auth.token,
    requireVerifiedEmail,
    appController.submitApplication
);

// Get my application
router.get('/applications/me',
    global.auth.token,
    appController.getMyApplication
);

// Withdraw my application
router.post('/applications/me/withdraw',
    global.auth.token,
    appController.withdrawApplication
);

// =============================================
// APPLICATION — ORG ADMIN / MODERATOR ENDPOINTS
// =============================================

// Get all applications (with filters)
router.get('/applications',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.getApplications
);

// Get single application details
router.get('/applications/:applicationId',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.getApplication
);

// Move application to a stage (org admin generic override)
router.post('/applications/:applicationId/move',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.moveToStage
);

// Return application for revision
router.post('/applications/:applicationId/return',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.returnForRevision
);

// Accept application (org admin — legacy endpoint, now routes through payment)
router.post('/applications/:applicationId/accept',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.acceptApplication
);

// Reject application (org admin force-reject)
router.post('/applications/:applicationId/reject',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.rejectApplication
);

// Add moderator note
router.post('/applications/:applicationId/notes',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.addNote
);

// Update interview data (legacy — flat interview field)
router.put('/applications/:applicationId/interview',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.updateInterview
);

// Verify payment (creates EventParticipant)
router.post('/applications/:applicationId/payment/verify',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.verifyPayment
);

// Configure payment for individual application (amount, deadline)
router.post('/applications/:applicationId/payment/configure',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.configurePayment
);

// Grant fee waiver (partial or full — full waiver auto-joins)
router.post('/applications/:applicationId/payment/waiver',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.grantWaiver
);

// =============================================
// APPLICATION — COMMITTEE-SCOPED ENDPOINTS (Presidium)
//
// These routes are used by committee presidium members to review
// applications routed to their committee in the preference chain.
//
// Auth: presidium of the specific committee, OR org admin.
// The auth middleware resolves the participant context and checks
// that the user is presidium in the given committee.
// =============================================

// Get applications routed to this committee
router.get('/committees/:committeeId/applications',
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId'),
    global.auth.presidium,
    appController.getCommitteeApplications
);

// Advance application to next review stage within this committee (form_review → interview)
router.post('/committees/:committeeId/applications/:applicationId/advance',
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId'),
    global.auth.presidium,
    appController.advanceApplicationStage
);

// Review application: accept or pass
router.post('/committees/:committeeId/applications/:applicationId/review',
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId'),
    global.auth.presidium,
    appController.reviewApplication
);

// Update interview data for this committee's review
router.put('/committees/:committeeId/applications/:applicationId/interview',
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId'),
    global.auth.presidium,
    appController.updateCommitteeInterview
);

// Direct assignment: assign user to committee (org admin only)
router.post('/committees/:committeeId/assign',
    global.auth.token,
    global.auth.orgAdmin('orgId'),
    appController.directAssign
);

module.exports = router;