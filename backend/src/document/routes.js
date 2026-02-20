// backend/src/document/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/documents
const express = require('express');
const multer = require('multer');
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

const validateDocumentId = [
    param('id').isMongoId().withMessage('Valid document ID is required')
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional()
        .isIn(['position_paper', 'public_document', 'resolution_draft', 'all'])
        .withMessage('Type must be position_paper, public_document, resolution_draft, or all'),
    query('status').optional()
        .isIn(['uploaded', 'under_review', 'approved', 'rejected', 'needs_revision'])
        .withMessage('Status must be uploaded, under_review, approved, rejected, or needs_revision')
];

// Shared: token + event context + participant for all routes
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// ==================== DOCUMENT LISTING ====================

// Get all documents for this committee (OrgAdmin sees all, participants see their committee's)
router.get('/',
    validatePagination,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { committeeId } = req.params;
            const { page = 1, limit = 20, type, status, search, dateRange } = req.query;

            const { Document } = require('./model');
            const filter = { committeeId };

            if (type && type !== 'all') filter.type = type;
            if (status) {
                if (status === 'pending') {
                    filter.status = { $in: ['uploaded', 'under_review'] };
                } else {
                    filter.status = status;
                }
            }
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { publicTitle: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = parseInt(limit);

            const [documents, total, stats] = await Promise.all([
                Document.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .populate('committeeId', 'name')
                    .lean(),
                Document.countDocuments(filter),
                Promise.all([
                    Document.countDocuments({ ...filter, status: { $in: ['uploaded', 'under_review'] } }),
                    Document.countDocuments({ ...filter, status: 'approved' }),
                    Document.countDocuments({ ...filter, status: 'rejected' })
                ])
            ]);

            res.json({
                success: true,
                documents,
                stats: { total, pending: stats[0], approved: stats[1], rejected: stats[2] },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limitNum),
                    total,
                    hasNext: skip + documents.length < total,
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            global.logger.error('Get documents error:', error);
            res.status(500).json({ error: 'Failed to fetch documents' });
        }
    }
);

// ==================== POSITION PAPERS (delegates) ====================

// Upload position paper (delegates only)
router.post('/position-papers',
    global.auth.delegate,
    (req, res, next) => {
        controller.upload.single('document')(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
                    }
                    return res.status(400).json({ error: `Upload error: ${err.message}` });
                }
                return res.status(400).json({ error: err.message || 'File upload failed' });
            }
            next();
        });
    },
    handleValidationErrors,
    controller.uploadPositionPaper
);

// Get position paper for a country
router.get('/position-papers/:countryName',
    [param('countryName').trim().notEmpty().withMessage('Country name is required')],
    handleValidationErrors,
    controller.getPositionPaper
);

// ==================== PUBLIC DOCUMENTS (presidium) ====================

// Upload public document (presidium only)
router.post('/public',
    global.auth.presidium,
    controller.upload.single('document'),
    [
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
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'File is required' });
            }

            const { Document } = require('./model');
            const { committeeId } = req.params;
            const { publicTitle, publicDescription } = req.body;

            const contentData = await controller.extractTextFromFile
                ? controller.extractTextFromFile(req.file.path)
                : { text: '', pages: 0 };

            const document = new Document({
                committeeId,
                type: 'public_document',
                publicTitle: publicTitle.trim(),
                publicDescription: publicDescription?.trim(),
                filePath: req.file.path,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                extractedText: contentData.text,
                pageCount: contentData.pages,
                status: 'approved',
                uploadedBy: req.user.userId
            });

            await document.save();

            res.status(201).json({
                success: true,
                document: {
                    _id: document._id,
                    publicTitle: document.publicTitle,
                    publicDescription: document.publicDescription,
                    fileName: document.fileName,
                    fileSize: document.fileSize,
                    status: document.status
                },
                message: 'Public document uploaded successfully'
            });
        } catch (error) {
            global.logger.error('Upload public document error:', error);
            res.status(500).json({ error: 'Failed to upload public document' });
        }
    }
);

// Update public document (presidium only)
router.put('/public/:id',
    global.auth.presidium,
    validateDocumentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { publicTitle, publicDescription } = req.body;

            const { Document } = require('./model');
            const document = await Document.findById(id);

            if (!document) return res.status(404).json({ error: 'Document not found' });
            if (document.type !== 'public_document') return res.status(400).json({ error: 'Not a public document' });

            if (publicTitle !== undefined) document.publicTitle = publicTitle?.trim();
            if (publicDescription !== undefined) document.publicDescription = publicDescription?.trim();

            await document.save();

            res.json({
                success: true,
                document: { _id: document._id, publicTitle: document.publicTitle, publicDescription: document.publicDescription, updatedAt: document.updatedAt },
                message: 'Public document updated successfully'
            });
        } catch (error) {
            global.logger.error('Update public document error:', error);
            res.status(500).json({ error: 'Failed to update public document' });
        }
    }
);

// Delete public document (presidium only)
router.delete('/public/:id',
    global.auth.presidium,
    validateDocumentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { Document } = require('./model');
            const document = await Document.findById(req.params.id);

            if (!document) return res.status(404).json({ error: 'Document not found' });
            if (document.type !== 'public_document') return res.status(400).json({ error: 'Not a public document' });

            try {
                await require('fs').promises.unlink(document.filePath);
                for (const version of document.versions) {
                    if (version.filePath) await require('fs').promises.unlink(version.filePath).catch(() => { });
                }
            } catch (e) { /* file cleanup best-effort */ }

            await Document.findByIdAndDelete(req.params.id);

            res.json({ success: true, message: 'Public document deleted successfully' });
        } catch (error) {
            global.logger.error('Delete public document error:', error);
            res.status(500).json({ error: 'Failed to delete public document' });
        }
    }
);

module.exports = router;