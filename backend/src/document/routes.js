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
const validateDocumentReview = [
    body('decision')
        .isIn(['approve', 'reject', 'needs_revision'])
        .withMessage('Decision must be approve, reject, or needs_revision'),
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

const validateDocumentId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid document ID')
];

const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Invalid committee ID')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isIn(['position_paper', 'public_document', 'resolution_draft', 'all'])
        .withMessage('Type must be position_paper, public_document, resolution_draft, or all'),
    query('status')
        .optional()
        .isIn(['uploaded', 'under_review', 'approved', 'rejected', 'needs_revision'])
        .withMessage('Status must be uploaded, under_review, approved, rejected, or needs_revision')
];

// Get all documents (admin only) - for document management page
router.get('/',
    authenticateToken,
    requireAdmin, // Only admins can see all documents across committees
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 20, 
                type, 
                status, 
                search, 
                committeeId,
                dateRange 
            } = req.query;

            const { Document } = require('./model');
            
            // Build filter
            const filter = {};

            // Type filter
            if (type && ['position_paper', 'public_document', 'resolution_draft', 'all'].includes(type) && type !== 'all') {
                filter.type = type;
            }

            // Status filter  
            if (status && ['uploaded', 'under_review', 'approved', 'rejected', 'needs_revision', 'pending'].includes(status)) {
                // Map 'pending' to actual backend status
                if (status === 'pending') {
                    filter.status = { $in: ['uploaded', 'under_review'] };
                } else {
                    filter.status = status;
                }
            }

            // Committee filter
            if (committeeId) {
                filter.committeeId = committeeId;
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { originalName: { $regex: search, $options: 'i' } },
                    { publicTitle: { $regex: search, $options: 'i' } },
                    { 'content.extractedText': { $regex: search, $options: 'i' } }
                ];
            }

            // Date range filter
            if (dateRange) {
                const now = new Date();
                let startDate;

                switch (dateRange) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    case '3months':
                        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                }

                if (startDate) {
                    filter.createdAt = { $gte: startDate };
                }
            }

            // Only show parent documents (not versions)
            filter.parentDocumentId = null;

            const skip = (page - 1) * limit;
            const limitNum = parseInt(limit);

            // Execute query with population
            const documents = await Document.find(filter)
                .select('type authorEmail countryName originalName filename fileSize status createdAt updatedAt content.wordCount content.pageCount publicTitle')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('committeeId', 'name')
                .populate('uploadedBy', 'username presidiumRole');

            const total = await Document.countDocuments(filter);

            // Calculate stats for the current filter
            const stats = {
                total: total,
                pending: await Document.countDocuments({ ...filter, status: { $in: ['uploaded', 'under_review'] } }),
                approved: await Document.countDocuments({ ...filter, status: 'approved' }),
                rejected: await Document.countDocuments({ ...filter, status: 'rejected' })
            };

            res.json({
                success: true,
                documents,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limitNum),
                    total: total,
                    hasNext: skip + documents.length < total,
                    hasPrev: page > 1
                }
            });

        } catch (error) {
            logger.error('Get all documents error:', error);
            res.status(500).json({ error: 'Failed to fetch documents' });
        }
    }
);

// Position Papers Routes

// Upload position paper (delegates only)
router.post('/position-papers',
    authenticateToken,
    requireDelegate,
    // Handle file upload with validation
    (req, res, next) => {
        controller.upload.single('document')(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
                    }
                }
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    },
    [
        body('committeeId')
            .isMongoId()
            .withMessage('Valid committee ID is required')
    ],
    handleValidationErrors,
    requireSameCommittee,
    controller.uploadPositionPaper
);

// Get position papers for committee
router.get('/position-papers/:committeeId',
    authenticateToken,
    validateCommitteeId,
    validatePagination,
    handleValidationErrors,
    requireSameCommittee,
    (req, res, next) => {
        req.query.type = 'position_paper';
        next();
    },
    controller.getDocuments
);

// Review position paper (presidium only)
router.put('/position-papers/:id/review',
    authenticateToken,
    requirePresidium,
    validateDocumentId,
    validateDocumentReview,
    handleValidationErrors,
    controller.reviewDocument
);

// Public Documents Routes (presidium only)

// Upload public document
router.post('/public',
    authenticateToken,
    requirePresidium,
    controller.upload.single('document'),
    [
        body('committeeId')
            .isMongoId()
            .withMessage('Valid committee ID is required'),
        body('publicTitle')
            .isLength({ min: 3, max: 200 })
            .withMessage('Public title must be between 3 and 200 characters')
            .trim(),
        body('publicDescription')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters')
            .trim()
    ],
    handleValidationErrors,
    requireSameCommittee,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'File is required' });
            }

            const { Document } = require('./model');
            const { committeeId, publicTitle, publicDescription } = req.body;

            // Extract text content (using the same function from controller)
            const contentData = await controller.extractTextFromFile ?
                await controller.extractTextFromFile(req.file.path, req.file.mimetype) :
                { extractedText: '', pageCount: 0, wordCount: 0 };

            const document = new Document({
                type: 'public_document',
                committeeId,
                uploadedBy: req.user.userId,
                filename: req.file.filename,
                originalName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                filePath: req.file.path,
                publicTitle: publicTitle.trim(),
                publicDescription: publicDescription?.trim(),
                status: 'approved', // Public documents are auto-approved
                content: contentData
            });

            await document.save();

            res.status(201).json({
                success: true,
                document: {
                    _id: document._id,
                    type: document.type,
                    publicTitle: document.publicTitle,
                    originalName: document.originalName,
                    fileSize: document.fileSize,
                    status: document.status,
                    createdAt: document.createdAt
                },
                message: 'Public document uploaded successfully'
            });

        } catch (error) {
            logger.error('Upload public document error:', error);

            // Clean up file on error
            if (req.file) {
                try {
                    await require('fs').promises.unlink(req.file.path);
                } catch (unlinkError) {
                    logger.error('File cleanup error:', unlinkError);
                }
            }

            res.status(500).json({ error: 'Failed to upload public document' });
        }
    }
);

// Get public documents for committee
router.get('/public/:committeeId',
    authenticateToken,
    validateCommitteeId,
    validatePagination,
    handleValidationErrors,
    requireSameCommittee,
    (req, res, next) => {
        req.query.type = 'public_document';
        next();
    },
    controller.getDocuments
);

// Update public document (presidium only)
router.put('/public/:id',
    authenticateToken,
    requirePresidium,
    validateDocumentId,
    [
        body('publicTitle')
            .optional()
            .isLength({ min: 3, max: 200 })
            .withMessage('Public title must be between 3 and 200 characters')
            .trim(),
        body('publicDescription')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters')
            .trim()
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { publicTitle, publicDescription } = req.body;

            const { Document } = require('./model');
            const document = await Document.findById(id);

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            if (document.type !== 'public_document') {
                return res.status(400).json({ error: 'Document is not a public document' });
            }

            // Check committee access
            if (req.user.committeeId?.toString() !== document.committeeId.toString()) {
                return res.status(403).json({ error: 'Access denied to this document' });
            }

            // Update fields
            if (publicTitle) document.publicTitle = publicTitle.trim();
            if (publicDescription !== undefined) document.publicDescription = publicDescription?.trim();

            await document.save();

            res.json({
                success: true,
                document: {
                    _id: document._id,
                    publicTitle: document.publicTitle,
                    publicDescription: document.publicDescription,
                    updatedAt: document.updatedAt
                },
                message: 'Public document updated successfully'
            });

        } catch (error) {
            logger.error('Update public document error:', error);
            res.status(500).json({ error: 'Failed to update public document' });
        }
    }
);

// Delete public document (presidium only)
router.delete('/public/:id',
    authenticateToken,
    requirePresidium,
    validateDocumentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;

            const { Document } = require('./model');
            const document = await Document.findById(id);

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            if (document.type !== 'public_document') {
                return res.status(400).json({ error: 'Document is not a public document' });
            }

            // Check committee access
            if (req.user.committeeId?.toString() !== document.committeeId.toString()) {
                return res.status(403).json({ error: 'Access denied to this document' });
            }

            // Delete file from filesystem
            try {
                await require('fs').promises.unlink(document.filePath);

                // Delete version files
                for (const version of document.versions) {
                    try {
                        await require('fs').promises.unlink(version.filePath);
                    } catch (versionError) {
                        logger.warn('Failed to delete version file:', versionError);
                    }
                }
            } catch (fileError) {
                logger.warn('Failed to delete document file:', fileError);
            }

            await Document.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Public document deleted successfully'
            });

        } catch (error) {
            logger.error('Delete public document error:', error);
            res.status(500).json({ error: 'Failed to delete public document' });
        }
    }
);

// General Document Routes

// Get single document
router.get('/:id',
    authenticateToken,
    validateDocumentId,
    handleValidationErrors,
    controller.getDocument
);

// Download document file
router.get('/:id/download',
    authenticateToken,
    validateDocumentId,
    [
        query('version')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Version must be a positive integer')
    ],
    handleValidationErrors,
    controller.downloadDocument
);

// Get document preview (extracted text)
router.get('/:id/preview',
    authenticateToken,
    validateDocumentId,
    [
        query('version')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Version must be a positive integer')
    ],
    handleValidationErrors,
    controller.getDocumentPreview
);

// Get document versions
router.get('/:id/versions',
    authenticateToken,
    validateDocumentId,
    handleValidationErrors,
    controller.getDocumentVersions
);

module.exports = router;