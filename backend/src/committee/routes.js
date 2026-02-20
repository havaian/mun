// backend/src/committee/routes.js
// 
// MIGRATED from legacy flat routes (/api/committees)
// to org-scoped routes (/api/organizations/:orgId/events/:eventId/committees)
//
// Auth middleware chain:
//   global.auth.token                           — verify JWT
//   global.auth.eventContext('orgId', 'eventId') — resolve org + event, set req.isOrgAdmin
//   global.auth.participant('committeeId')       — resolve EventParticipant (where needed)
//   global.auth.presidium / .delegate / etc.     — role check
//
// OrgAdmin and SuperAdmin always pass participant + role checks.
// OrgMembership members with manage_event_content or similar permissions
// also pass participant checks (they manage events but aren't participants).

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router({ mergeParams: true }); // access :orgId, :eventId from parent

const controller = require('./controller');

// ============================================
// Validation helpers
// ============================================

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

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required')
];

const validateCommitteeCreation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Committee name is required')
        .isLength({ max: 200 })
        .withMessage('Committee name cannot exceed 200 characters'),
    body('acronym')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Acronym cannot exceed 20 characters'),
    body('type')
        .optional()
        .isIn(['general_assembly', 'security_council', 'ecosoc', 'specialized', 'crisis', 'other'])
        .withMessage('Invalid committee type')
];

const validateCommitteeUpdate = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Committee name cannot be empty')
        .isLength({ max: 200 })
        .withMessage('Committee name cannot exceed 200 characters'),
    body('acronym')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Acronym cannot exceed 20 characters')
];

const validateCountryAddition = [
    body('countries')
        .isArray({ min: 1 })
        .withMessage('Countries array is required with at least one entry'),
    body('countries.*.name')
        .trim()
        .notEmpty()
        .withMessage('Country name is required'),
    body('countries.*.code')
        .trim()
        .notEmpty()
        .withMessage('Country code is required')
];

const validateCountryName = [
    param('countryName')
        .trim()
        .notEmpty()
        .withMessage('Country name is required')
];

// ============================================
// Shared middleware — resolves org + event context
// Applied to ALL routes in this router
// ============================================
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId')
);

// ============================================
// Committee CRUD
// ============================================

// List committees for event
// Access: OrgAdmin, or any event participant, or org members with relevant permissions
router.get('/',
    // eventContext already resolved above
    // No participant check needed — anyone with event access can list committees
    controller.getCommittees
);

// Create committee
// Access: OrgAdmin only (committee creation is an admin action)
router.post('/',
    global.auth.orgPermission('manage_event_content', 'orgId'),
    validateCommitteeCreation,
    handleValidationErrors,
    controller.createCommittee
);

// Get single committee
// Access: OrgAdmin, or participant in this committee
router.get('/:committeeId',
    validateCommitteeId,
    handleValidationErrors,
    global.auth.participant('committeeId'),
    controller.getCommittee
);

// Update committee settings
// Access: OrgAdmin, or presidium in this committee
router.put('/:committeeId',
    validateCommitteeId,
    validateCommitteeUpdate,
    handleValidationErrors,
    global.auth.participant('committeeId'),
    global.auth.presidium,
    controller.updateCommittee
);

// Delete committee
// Access: OrgAdmin only
router.delete('/:committeeId',
    validateCommitteeId,
    handleValidationErrors,
    global.auth.orgAdmin('orgId'),
    controller.deleteCommittee
);

// ============================================
// Country management within a committee
// ============================================

// Add countries to committee
// Access: OrgAdmin, or presidium in this committee
router.put('/:committeeId/countries',
    validateCommitteeId,
    validateCountryAddition,
    handleValidationErrors,
    global.auth.participant('committeeId'),
    global.auth.presidium,
    controller.addCountries
);

// Get countries list
// Access: OrgAdmin, or any participant in this committee
router.get('/:committeeId/countries',
    validateCommitteeId,
    handleValidationErrors,
    global.auth.participant('committeeId'),
    controller.getCountries
);

// Remove country from committee
// Access: OrgAdmin, or presidium in this committee
router.delete('/:committeeId/countries/:countryName',
    validateCommitteeId,
    validateCountryName,
    handleValidationErrors,
    global.auth.participant('committeeId'),
    global.auth.presidium,
    controller.removeCountry
);

// Update country status
// Access: OrgAdmin, or presidium in this committee
router.put('/:committeeId/countries/:countryName/status',
    validateCommitteeId,
    validateCountryName,
    handleValidationErrors,
    global.auth.participant('committeeId'),
    global.auth.presidium,
    (req, res, next) => {
        // Inline validation for status field
        const { status } = req.body;
        if (!status || !['present', 'absent', 'excused'].includes(status)) {
            return res.status(400).json({ error: 'Status must be present, absent, or excused' });
        }
        next();
    },
    controller.updateCountryStatus
);

module.exports = router;