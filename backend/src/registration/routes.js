const express = require('express');
const router = express.Router({ mergeParams: true }); // access :orgId, :eventId from parent
const formController = require('./form/controller');
const appController = require('./application/controller');

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
// APPLICATION — MODERATOR ENDPOINTS
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

// Move application to a stage
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

// Accept application (creates EventParticipant)
router.post('/applications/:applicationId/accept',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.acceptApplication
);

// Reject application
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

// Update interview data
router.put('/applications/:applicationId/interview',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.updateInterview
);

// Verify payment
router.post('/applications/:applicationId/payment/verify',
    global.auth.token,
    global.auth.orgPermission('review_applicants', 'orgId'),
    appController.verifyPayment
);

module.exports = router;