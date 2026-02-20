// backend/src/resolution/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/resolutions
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

const validateId = [param('id').isMongoId().withMessage('Valid ID is required')];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional()
        .isIn(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'working_document', 'all'])
        .withMessage('Invalid status filter')
];

const validateCoalitionCreation = [
    body('name').isLength({ min: 3, max: 100 }).withMessage('Coalition name must be between 3 and 100 characters').trim(),
    body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters').trim(),
    body('members').optional().isArray().withMessage('Members must be an array'),
    body('members.*.email').optional().isEmail().withMessage('Each member must have a valid email'),
    body('members.*.country').optional().isLength({ min: 2, max: 50 }).withMessage('Country name must be between 2 and 50 characters')
];

const validateInvitationResponse = [
    body('accept').isBoolean().withMessage('Accept must be a boolean value')
];

const validateResolutionSubmission = [
    body('coalitionId').isMongoId().withMessage('Valid coalition ID is required'),
    body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters').trim(),
    body('content').isLength({ min: 50, max: 50000 }).withMessage('Content must be between 50 and 50,000 characters').trim(),
    body('documentType').optional().isIn(['resolution', 'declaration', 'decision']).withMessage('Invalid document type')
];

const validateResolutionReview = [
    body('decision').isIn(['accept', 'reject_with_deadline', 'reject_with_extension']).withMessage('Invalid decision'),
    body('comments').optional().isLength({ max: 1000 }).withMessage('Comments cannot exceed 1000 characters').trim(),
    body('allowResubmission').optional().isBoolean().withMessage('allowResubmission must be boolean'),
    body('extendedDeadline').optional().isISO8601().withMessage('Extended deadline must be a valid date')
];

// Shared: token + event context + participant for all routes
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== COALITION ROUTES ====================

// Create coalition (delegates only)
router.post('/coalitions',
    global.auth.delegate,
    validateCoalitionCreation,
    handleValidationErrors,
    controller.createCoalition
);

// Get coalitions for this committee (any participant)
router.get('/coalitions',
    validatePagination,
    handleValidationErrors,
    controller.getCoalitions
);

// Get single coalition (any participant)
router.get('/coalitions/:id',
    validateId,
    handleValidationErrors,
    controller.getCoalition
);

// Respond to coalition invitation (delegates only)
router.put('/coalitions/:id/respond',
    global.auth.delegate,
    validateId,
    validateInvitationResponse,
    handleValidationErrors,
    controller.respondToInvitation
);

// Activate coalition (delegates — head only, checked in controller)
router.put('/coalitions/:id/activate',
    global.auth.delegate,
    validateId,
    handleValidationErrors,
    controller.activateCoalition
);

// Leave coalition (delegates only)
router.delete('/coalitions/:id/leave',
    global.auth.delegate,
    validateId,
    handleValidationErrors,
    controller.leaveCoalition
);

// ==================== RESOLUTION ROUTES ====================

// Submit resolution (delegates — coalition head only, checked in controller)
router.post('/',
    global.auth.delegate,
    validateResolutionSubmission,
    handleValidationErrors,
    controller.submitResolution
);

// Get resolutions for this committee (any participant)
router.get('/',
    validatePagination,
    handleValidationErrors,
    controller.getResolutions
);

// Get single resolution (any participant)
router.get('/detail/:id',
    validateId,
    handleValidationErrors,
    controller.getResolution
);

// Review resolution (presidium only)
router.put('/:id/review',
    global.auth.presidium,
    validateId,
    validateResolutionReview,
    handleValidationErrors,
    controller.reviewResolution
);

// Submit new version (delegates — coalition head only, checked in controller)
router.post('/:id/new-version',
    global.auth.delegate,
    validateId,
    [
        body('content')
            .isLength({ min: 50, max: 50000 })
            .withMessage('Content must be between 50 and 50,000 characters')
            .trim()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { content } = req.body;

            const { Resolution, Coalition } = require('./model');

            const resolution = await Resolution.findById(id);
            if (!resolution) return res.status(404).json({ error: 'Resolution not found' });

            const coalition = await Coalition.findById(resolution.coalitionId);
            if (coalition.headEmail !== req.user.email) {
                return res.status(403).json({ error: 'Only coalition head can submit new version' });
            }

            if (!resolution.canResubmit()) {
                return res.status(400).json({ error: 'Resubmission not allowed for this resolution' });
            }

            const newVersion = resolution.createNewVersion(content.trim());
            await resolution.save();

            res.json({
                success: true,
                resolution: { _id: resolution._id, version: resolution.version, status: resolution.status, wordCount: resolution.wordCount },
                message: `New version (v${newVersion}) submitted successfully`
            });
        } catch (error) {
            global.logger.error('Submit new version error:', error);
            res.status(500).json({ error: 'Failed to submit new version' });
        }
    }
);

// Get resolution versions (any participant)
router.get('/:id/versions',
    validateId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Resolution } = require('./model');
            const resolution = await Resolution.findById(req.params.id);
            if (!resolution) return res.status(404).json({ error: 'Resolution not found' });

            const versions = [
                { version: resolution.version, content: resolution.content, submittedAt: resolution.lastModifiedAt, status: resolution.status, wordCount: resolution.wordCount, isCurrent: true },
                ...resolution.versionHistory.map(v => ({ ...v.toObject(), isCurrent: false }))
            ].sort((a, b) => b.version - a.version);

            res.json({ success: true, versions, currentVersion: resolution.version });
        } catch (error) {
            global.logger.error('Get resolution versions error:', error);
            res.status(500).json({ error: 'Failed to fetch resolution versions' });
        }
    }
);

// Submit presidium resolution (presidium only)
router.post('/presidium-draft',
    global.auth.presidium,
    [
        body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters').trim(),
        body('content').isLength({ min: 50, max: 50000 }).withMessage('Content must be between 50 and 50,000 characters').trim(),
        body('designatedAuthors').optional().isArray().withMessage('Designated authors must be an array'),
        body('designatedAuthors.*').optional().isLength({ min: 2, max: 50 }).withMessage('Country names must be between 2 and 50 characters')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;
            const { title, content, designatedAuthors = [] } = req.body;

            const { Resolution } = require('./model');

            const resolution = new Resolution({
                coalitionId: null,
                committeeId,
                title: title.trim(),
                content: content.trim(),
                documentType: 'resolution',
                authors: designatedAuthors,
                authorEmails: [],
                coAuthors: [],
                coAuthorEmails: [],
                status: 'approved',
                isPresidiumDraft: true,
                submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                submittedAt: new Date()
            });

            await resolution.save();

            res.status(201).json({
                success: true,
                resolution: { _id: resolution._id, title: resolution.title, authors: resolution.authors, status: resolution.status, isPresidiumDraft: resolution.isPresidiumDraft, submittedAt: resolution.submittedAt },
                message: 'Presidium resolution submitted successfully'
            });
        } catch (error) {
            global.logger.error('Submit presidium resolution error:', error);
            res.status(500).json({ error: 'Failed to submit presidium resolution' });
        }
    }
);

module.exports = router;