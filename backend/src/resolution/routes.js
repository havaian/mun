const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const {
    authenticateToken,
    requirePresidium,
    requireDelegate,
    requireSameCommittee
} = require('../auth/middleware');

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
const validateCoalitionCreation = [
    body('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required'),
    body('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Coalition name must be between 3 and 100 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    body('invitedCountries')
        .optional()
        .isArray()
        .withMessage('Invited countries must be an array'),
    body('invitedCountries.*')
        .isLength({ min: 2, max: 50 })
        .withMessage('Country names must be between 2 and 50 characters')
];

const validateInvitationResponse = [
    body('response')
        .isIn(['accepted', 'declined'])
        .withMessage('Response must be "accepted" or "declined"')
];

const validateResolutionSubmission = [
    body('coalitionId')
        .isMongoId()
        .withMessage('Valid coalition ID is required'),
    body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .trim(),
    body('content')
        .isLength({ min: 50, max: 50000 })
        .withMessage('Content must be between 50 and 50,000 characters')
        .trim(),
    body('documentType')
        .optional()
        .isIn(['resolution', 'declaration', 'decision'])
        .withMessage('Document type must be resolution, declaration, or decision')
];

const validateResolutionReview = [
    body('decision')
        .isIn(['accept', 'reject_with_deadline', 'reject_with_extension'])
        .withMessage('Invalid decision type'),
    body('comments')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Comments cannot exceed 2000 characters'),
    body('allowResubmission')
        .optional()
        .isBoolean()
        .withMessage('Allow resubmission must be boolean'),
    body('extendedDeadline')
        .optional()
        .isISO8601()
        .withMessage('Extended deadline must be valid date')
];

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validateId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('status')
        .optional()
        .isIn(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'working_document', 'all'])
        .withMessage('Invalid status filter')
];

// Coalition Routes

// Create coalition (delegates only)
router.post('/coalitions',
    authenticateToken,
    requireDelegate,
    validateCoalitionCreation,
    handleValidationErrors,
    requireSameCommittee,
    controller.createCoalition
);

// Get coalitions for committee
router.get('/coalitions/:committeeId',
    authenticateToken,
    validateCommitteeId,
    validatePagination,
    handleValidationErrors,
    requireSameCommittee,
    controller.getCoalitions
);

// Get single coalition
router.get('/coalitions/detail/:id',
    authenticateToken,
    validateId,
    handleValidationErrors,
    controller.getCoalition
);

// Respond to coalition invitation
router.put('/coalitions/:id/respond',
    authenticateToken,
    requireDelegate,
    validateId,
    validateInvitationResponse,
    handleValidationErrors,
    controller.respondToInvitation
);

// Activate coalition (head only)
router.put('/coalitions/:id/activate',
    authenticateToken,
    requireDelegate,
    validateId,
    handleValidationErrors,
    controller.activateCoalition
);

// Leave coalition
router.delete('/coalitions/:id/leave',
    authenticateToken,
    requireDelegate,
    validateId,
    handleValidationErrors,
    controller.leaveCoalition
);

// Resolution Routes

// Submit resolution (coalition head only)
router.post('/',
    authenticateToken,
    requireDelegate,
    validateResolutionSubmission,
    handleValidationErrors,
    controller.submitResolution
);

// Get resolutions for committee
router.get('/:committeeId',
    authenticateToken,
    validateCommitteeId,
    validatePagination,
    handleValidationErrors,
    requireSameCommittee,
    controller.getResolutions
);

// Get single resolution
router.get('/detail/:id',
    authenticateToken,
    validateId,
    handleValidationErrors,
    controller.getResolution
);

// Review resolution (presidium only)
router.put('/:id/review',
    authenticateToken,
    requirePresidium,
    validateId,
    validateResolutionReview,
    handleValidationErrors,
    controller.reviewResolution
);

// Submit new version of resolution (coalition head only)
router.post('/:id/new-version',
    authenticateToken,
    requireDelegate,
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

            const { Resolution } = require('./model');
            const { Coalition } = require('./model');

            const resolution = await Resolution.findById(id);

            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            // Check if user is coalition head
            const coalition = await Coalition.findById(resolution.coalitionId);
            if (coalition.headEmail !== req.user.email) {
                return res.status(403).json({
                    error: 'Only coalition head can submit new version'
                });
            }

            // Check if resubmission is allowed
            if (!resolution.canResubmit()) {
                return res.status(400).json({
                    error: 'Resubmission not allowed for this resolution'
                });
            }

            // Create new version
            const newVersion = resolution.createNewVersion(content.trim());
            await resolution.save();

            res.json({
                success: true,
                resolution: {
                    _id: resolution._id,
                    version: resolution.version,
                    status: resolution.status,
                    wordCount: resolution.wordCount
                },
                message: `New version (v${newVersion}) submitted successfully`
            });

        } catch (error) {
            logger.error('Submit new version error:', error);
            res.status(500).json({ error: 'Failed to submit new version' });
        }
    }
);

// Get resolution versions
router.get('/:id/versions',
    authenticateToken,
    validateId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            const { Resolution } = require('./model');
            const resolution = await Resolution.findById(id);

            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            // Check access permissions
            if (req.user.role !== 'admin' &&
                req.user.committeeId?.toString() !== resolution.committeeId.toString()) {
                return res.status(403).json({ error: 'Access denied to this resolution' });
            }

            const versions = [
                {
                    version: resolution.version,
                    content: resolution.content,
                    submittedAt: resolution.lastModifiedAt,
                    status: resolution.status,
                    wordCount: resolution.wordCount,
                    isCurrent: true
                },
                ...resolution.versionHistory.map(v => ({
                    ...v.toObject(),
                    isCurrent: false
                }))
            ].sort((a, b) => b.version - a.version);

            res.json({
                success: true,
                versions,
                currentVersion: resolution.version
            });

        } catch (error) {
            logger.error('Get resolution versions error:', error);
            res.status(500).json({ error: 'Failed to fetch resolution versions' });
        }
    }
);

// Submit presidium resolution (presidium only)
router.post('/presidium-draft',
    authenticateToken,
    requirePresidium,
    [
        body('committeeId')
            .isMongoId()
            .withMessage('Valid committee ID is required'),
        body('title')
            .isLength({ min: 5, max: 200 })
            .withMessage('Title must be between 5 and 200 characters')
            .trim(),
        body('content')
            .isLength({ min: 50, max: 50000 })
            .withMessage('Content must be between 50 and 50,000 characters')
            .trim(),
        body('designatedAuthors')
            .optional()
            .isArray()
            .withMessage('Designated authors must be an array'),
        body('designatedAuthors.*')
            .isLength({ min: 2, max: 50 })
            .withMessage('Country names must be between 2 and 50 characters')
    ],
    handleValidationErrors,
    requireSameCommittee,
    async (req, res) => {
        try {
            const { committeeId, title, content, designatedAuthors = [] } = req.body;

            const { Resolution } = require('./model');
            const logger = require('../utils/logger');

            // Create presidium resolution
            const resolution = new Resolution({
                coalitionId: null, // No coalition for presidium drafts
                committeeId,
                title: title.trim(),
                content: content.trim(),
                documentType: 'resolution',
                authors: designatedAuthors,
                authorEmails: [],
                coAuthors: [],
                coAuthorEmails: [],
                status: 'approved', // Presidium drafts are auto-approved
                isPresidiumDraft: true,
                submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                submittedAt: new Date()
            });

            await resolution.save();

            logger.info(`Presidium resolution submitted: "${title}" by ${req.user.presidiumRole}`);

            res.status(201).json({
                success: true,
                resolution: {
                    _id: resolution._id,
                    title: resolution.title,
                    authors: resolution.authors,
                    status: resolution.status,
                    isPresidiumDraft: resolution.isPresidiumDraft,
                    submittedAt: resolution.submittedAt
                },
                message: 'Presidium resolution submitted successfully'
            });

        } catch (error) {
            logger.error('Submit presidium resolution error:', error);
            res.status(500).json({ error: 'Failed to submit presidium resolution' });
        }
    }
);

module.exports = router;