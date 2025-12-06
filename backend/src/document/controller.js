const { Document } = require('./model');
const { Committee } = require('../committee/model');
const { Event } = require('../event/model');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/documents');
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/rtf'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Word, and RTF files are allowed.'));
        }
    }
});

// Extract text content from uploaded file
const extractTextFromFile = async (filePath, mimeType) => {
    try {
        let extractedText = '';
        let pageCount = 0;

        if (mimeType === 'application/pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
            pageCount = pdfData.numpages;
        } else if (mimeType.includes('word') || mimeType.includes('document')) {
            const result = await mammoth.extractRawText({ path: filePath });
            extractedText = result.value;
            pageCount = Math.ceil(extractedText.length / 3000); // Rough estimate
        } else if (mimeType === 'application/rtf') {
            // For RTF, just read as text (basic extraction)
            const buffer = await fs.readFile(filePath);
            extractedText = buffer.toString('utf8');
            pageCount = Math.ceil(extractedText.length / 3000);
        }

        const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

        return {
            extractedText: extractedText.substring(0, 50000), // Limit to 50k chars
            pageCount,
            wordCount
        };

    } catch (error) {
        global.logger.error('Text extraction error:', error);
        return {
            extractedText: '',
            pageCount: 0,
            wordCount: 0
        };
    }
};

// Check position paper submission eligibility
const checkPositionPaperEligibility = async (committeeId, authorEmail) => {
    try {
        // Get committee and event information
        const committee = await Committee.findById(committeeId).populate('eventId');
        if (!committee || !committee.eventId) {
            return {
                canSubmit: false,
                reason: 'Committee or event not found'
            };
        }

        const event = committee.eventId;

        // Check if position paper submissions are allowed for this event
        if (!event.canSubmitPositionPaper()) {
            const deadlinePassed = event.isPositionPaperDeadlinePassed();
            const allowLateSubmissions = event.settings.allowLatePositionPapers;

            if (deadlinePassed && !allowLateSubmissions) {
                return {
                    canSubmit: false,
                    reason: 'Position paper deadline has passed and late submissions are not allowed',
                    deadline: event.settings.positionPaperDeadline,
                    deadlinePassed: true
                };
            }
        }

        // Check if delegate has already submitted an approved position paper
        const existingDocument = await Document.findOne({
            authorEmail,
            committeeId,
            type: 'position_paper',
            parentDocumentId: null,
            status: 'approved'
        });

        if (existingDocument) {
            return {
                canSubmit: false,
                reason: 'Position paper already approved',
                existingDocument
            };
        }

        return {
            canSubmit: true,
            event,
            isLateSubmission: event.isPositionPaperDeadlinePassed()
        };

    } catch (error) {
        global.logger.error('Position paper eligibility check error:', error);
        return {
            canSubmit: false,
            reason: 'Error checking eligibility'
        };
    }
};

// Upload position paper (delegate only)
const uploadPositionPaper = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const { committeeId } = req.body;

        // Verify committee exists and delegate belongs to it
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        if (req.user.committeeId?.toString() !== committeeId) {
            return res.status(403).json({ error: 'Access denied to this committee' });
        }

        // Check if position paper already exists (for new uploads)
        const existingDocument = await Document.findOne({
            authorEmail: req.user.email,
            committeeId,
            type: 'position_paper',
            parentDocumentId: null
        });

        if (existingDocument) {
            // This is a new version
            return uploadNewVersion(req, res, existingDocument);
        }

        // Extract text content
        const contentData = await extractTextFromFile(req.file.path, req.file.mimetype);

        // Create new position paper
        const document = new Document({
            type: 'position_paper',
            committeeId,
            authorEmail: req.user.email,
            authorCountry: req.user.countryName,
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            filePath: req.file.path,
            content: contentData
        });

        await document.save();

        global.logger.info(`Position paper uploaded: ${req.user.countryName} (${req.user.email})`);

        res.status(201).json({
            success: true,
            document: {
                _id: document._id,
                type: document.type,
                authorCountry: document.authorCountry,
                originalName: document.originalName,
                fileSize: document.fileSize,
                version: document.version,
                status: document.status,
                createdAt: document.createdAt,
                wordCount: document.content.wordCount,
                pageCount: document.content.pageCount
            },
            message: 'Position paper uploaded successfully'
        });

    } catch (error) {
        global.logger.error('Upload position paper error:', error);

        // Clean up uploaded file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                global.logger.error('File cleanup error:', unlinkError);
            }
        }

        res.status(500).json({ error: 'Failed to upload position paper' });
    }
};

// Submit position paper as text (alternative to file upload)
const submitPositionPaperText = async (req, res) => {
    try {
        const { committeeId, title, content } = req.body;

        // Validate input
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        if (content.length < 100) {
            return res.status(400).json({ error: 'Position paper content must be at least 100 characters' });
        }

        if (content.length > 50000) {
            return res.status(400).json({ error: 'Position paper content cannot exceed 50,000 characters' });
        }

        // Verify committee exists
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check position paper submission eligibility
        const eligibility = await checkPositionPaperEligibility(committeeId, req.user.email);
        
        if (!eligibility.canSubmit) {
            return res.status(400).json({ 
                error: eligibility.reason,
                deadline: eligibility.deadline,
                deadlinePassed: eligibility.deadlinePassed
            });
        }

        // Check if position paper already exists
        const existingDocument = await Document.findOne({
            authorEmail: req.user.email,
            committeeId,
            type: 'position_paper',
            parentDocumentId: null
        });

        if (existingDocument) {
            // Update existing document with new text content
            return updatePositionPaperText(req, res, existingDocument, eligibility);
        }

        // Calculate content statistics
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        const pageCount = Math.ceil(content.length / 3000);

        // Create new text-based position paper
        const document = new Document({
            type: 'position_paper',
            committeeId,
            authorEmail: req.user.email,
            authorCountry: req.user.countryName,
            filename: `${req.user.countryName}_position_paper.txt`,
            originalName: `${title}.txt`,
            fileSize: Buffer.byteLength(content, 'utf8'),
            mimeType: 'text/plain',
            filePath: null, // No physical file for text submissions
            content: {
                extractedText: content,
                pageCount,
                wordCount
            },
            isLateSubmission: eligibility.isLateSubmission,
            // Text-specific fields
            textContent: content,
            textTitle: title
        });

        await document.save();

        global.logger.info(`Position paper text submitted: ${req.user.countryName} (${req.user.email})${eligibility.isLateSubmission ? ' [LATE]' : ''}`);

        res.status(201).json({
            success: true,
            document: {
                _id: document._id,
                type: document.type,
                authorCountry: document.authorCountry,
                originalName: document.originalName,
                version: document.version,
                status: document.status,
                createdAt: document.createdAt,
                isLateSubmission: document.isLateSubmission,
                wordCount: document.content.wordCount,
                pageCount: document.content.pageCount,
                isTextSubmission: true
            },
            message: `Position paper submitted successfully${eligibility.isLateSubmission ? ' (late submission)' : ''}`
        });

    } catch (error) {
        global.logger.error('Submit position paper text error:', error);
        res.status(500).json({ error: 'Failed to submit position paper' });
    }
};

// Add this method to your backend/src/document/controller.js

// Get position paper by delegate email and committee
const getPositionPaper = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { email } = req.query;

        // Use requesting user's email if not provided (for delegates accessing their own)
        const authorEmail = email || req.user.email;

        // Check if user can access this position paper
        if (req.user.role === 'delegate' && authorEmail !== req.user.email) {
            return res.status(403).json({ error: 'Cannot access other delegates\' position papers' });
        }

        const document = await Document.findOne({
            authorEmail,
            committeeId,
            type: 'position_paper',
            parentDocumentId: null
        }).populate('committeeId', 'name');

        if (!document) {
            return res.status(404).json({ 
                success: false,
                error: 'Position paper not found' 
            });
        }

        // Return full document data for the user
        const documentData = {
            _id: document._id,
            type: document.type,
            authorEmail: document.authorEmail,
            authorCountry: document.authorCountry,
            originalName: document.originalName,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            version: document.version,
            status: document.status,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            isLateSubmission: document.isLateSubmission,
            content: {
                wordCount: document.content.wordCount,
                pageCount: document.content.pageCount,
                extractedText: document.content.extractedText
            },
            presidiumReview: document.presidiumReview,
            versions: document.versions,
            // Text submission fields
            textContent: document.textContent,
            textTitle: document.textTitle,
            // Committee info
            committee: document.committeeId
        };

        res.json({
            success: true,
            document: documentData
        });

    } catch (error) {
        global.logger.error('Get position paper error:', error);
        res.status(500).json({ error: 'Failed to fetch position paper' });
    }
};

// Upload new version of existing document
const uploadNewVersion = async (req, res, existingDocument) => {
    try {
        // Check if resubmission is allowed
        if (!existingDocument.canResubmit()) {
            // Clean up uploaded file
            await fs.unlink(req.file.path);
            return res.status(400).json({
                error: 'Resubmission not allowed',
                reason: existingDocument.status === 'approved' ? 'Document already approved' : 'Deadline passed'
            });
        }

        // Extract text content
        const contentData = await extractTextFromFile(req.file.path, req.file.mimetype);

        // Create new version
        const newVersion = existingDocument.createNewVersion({
            filename: req.file.filename,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            filePath: req.file.path
        });

        existingDocument.updateContent(contentData);
        await existingDocument.save();

        global.logger.info(`New version uploaded: ${existingDocument.authorCountry} v${newVersion}`);

        res.json({
            success: true,
            document: {
                _id: existingDocument._id,
                type: existingDocument.type,
                authorCountry: existingDocument.authorCountry,
                originalName: existingDocument.originalName,
                fileSize: existingDocument.fileSize,
                version: existingDocument.version,
                status: existingDocument.status,
                updatedAt: existingDocument.updatedAt,
                wordCount: existingDocument.content.wordCount,
                pageCount: existingDocument.content.pageCount
            },
            message: `New version (v${newVersion}) uploaded successfully`
        });

    } catch (error) {
        global.logger.error('Upload new version error:', error);

        // Clean up uploaded file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                global.logger.error('File cleanup error:', unlinkError);
            }
        }

        throw error;
    }
};

// Update position paper text content
const updatePositionPaperText = async (req, res, existingDocument, eligibility) => {
    try {
        const { title, content } = req.body;

        // Check if updates are allowed
        if (existingDocument.status === 'approved') {
            return res.status(400).json({
                error: 'Cannot update approved position paper'
            });
        }

        // Calculate content statistics
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        const pageCount = Math.ceil(content.length / 3000);

        // Create new version
        const newVersionNumber = existingDocument.version + 1;
        
        // Add current version to history
        existingDocument.versions.push({
            version: existingDocument.version,
            filename: existingDocument.filename,
            uploadedAt: existingDocument.updatedAt || existingDocument.createdAt,
            status: existingDocument.status,
            extractedText: existingDocument.content.extractedText,
            pageCount: existingDocument.content.pageCount,
            wordCount: existingDocument.content.wordCount
        });

        // Update with new content
        existingDocument.originalName = `${title}.txt`;
        existingDocument.fileSize = Buffer.byteLength(content, 'utf8');
        existingDocument.content = {
            extractedText: content,
            pageCount,
            wordCount
        };
        existingDocument.textContent = content;
        existingDocument.textTitle = title;
        existingDocument.version = newVersionNumber;
        existingDocument.status = 'uploaded';
        existingDocument.presidiumReview = undefined;
        existingDocument.isLateSubmission = eligibility.isLateSubmission;

        await existingDocument.save();

        global.logger.info(`Position paper text updated: ${existingDocument.authorCountry} v${newVersionNumber}${eligibility.isLateSubmission ? ' [LATE]' : ''}`);

        res.json({
            success: true,
            document: {
                _id: existingDocument._id,
                type: existingDocument.type,
                authorCountry: existingDocument.authorCountry,
                originalName: existingDocument.originalName,
                version: existingDocument.version,
                status: existingDocument.status,
                updatedAt: existingDocument.updatedAt,
                isLateSubmission: existingDocument.isLateSubmission,
                wordCount: existingDocument.content.wordCount,
                pageCount: existingDocument.content.pageCount,
                isTextSubmission: true
            },
            message: `Position paper updated to version ${newVersionNumber}${eligibility.isLateSubmission ? ' (late submission)' : ''}`
        });

    } catch (error) {
        global.logger.error('Update position paper text error:', error);
        res.status(500).json({ error: 'Failed to update position paper' });
    }
};

// Get documents for committee
const getDocuments = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { type = 'all', status, page = 1, limit = 20 } = req.query;

        // Build filter
        const filter = { committeeId };

        if (type !== 'all') {
            filter.type = type;
        }

        if (status && ['uploaded', 'under_review', 'approved', 'rejected', 'needs_revision'].includes(status)) {
            filter.status = status;
        }

        // Only show parent documents (not versions)
        filter.parentDocumentId = null;

        const skip = (page - 1) * limit;

        const documents = await Document.find(filter)
            .select('type authorCountry originalName fileSize version status createdAt updatedAt content.wordCount content.pageCount presidiumReview.decision')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('presidiumReview.reviewedBy', 'presidiumRole username');

        const totalDocuments = await Document.countDocuments(filter);

        res.json({
            success: true,
            documents,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalDocuments / limit),
                totalDocuments,
                hasNext: skip + documents.length < totalDocuments,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        global.logger.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// Get single document
const getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findById(id)
            .populate('committeeId', 'name')
            .populate('uploadedBy', 'username presidiumRole')
            .populate('presidiumReview.reviewedBy', 'username presidiumRole');

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check access permissions
        const hasAccess = req.user.role === 'admin' ||
            req.user.committeeId?.toString() === document.committeeId._id.toString() ||
            (req.user.role === 'delegate' && req.user.email === document.authorEmail);

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this document' });
        }

        res.json({
            success: true,
            document
        });

    } catch (error) {
        global.logger.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
};

// Download document file
const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { version } = req.query;

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check access permissions
        const hasAccess = req.user.role === 'admin' ||
            req.user.committeeId?.toString() === document.committeeId.toString() ||
            (req.user.role === 'delegate' && req.user.email === document.authorEmail);

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this document' });
        }

        let filePath = document.filePath;
        let originalName = document.originalName;

        // If specific version requested
        if (version && parseInt(version) !== document.version) {
            const versionData = document.versions.find(v => v.version === parseInt(version));
            if (!versionData) {
                return res.status(404).json({ error: 'Version not found' });
            }
            filePath = versionData.filePath;
            originalName = `v${version}_${document.originalName}`;
        }

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(filePath, originalName);

    } catch (error) {
        global.logger.error('Download document error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
};

// Review document (presidium only)
const reviewDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, comments, allowResubmission = false, extendedDeadline } = req.body;

        if (!['approve', 'reject', 'needs_revision'].includes(decision)) {
            return res.status(400).json({
                error: 'Invalid decision. Must be approve, reject, or needs_revision'
            });
        }

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check if document belongs to presidium's committee
        if (req.user.committeeId?.toString() !== document.committeeId.toString()) {
            return res.status(403).json({ error: 'Access denied to this document' });
        }

        if (document.status === 'approved') {
            return res.status(400).json({
                error: 'Cannot review already approved document'
            });
        }

        // Add presidium review
        document.addPresidiumReview({
            reviewedBy: req.user.userId,
            decision,
            comments: comments || '',
            allowResubmission: decision === 'reject' ? allowResubmission : true,
            extendedDeadline: extendedDeadline ? new Date(extendedDeadline) : null
        });

        await document.save();

        global.logger.info(`Document reviewed: ${document.authorCountry} - ${decision} by ${req.user.presidiumRole}`);

        res.json({
            success: true,
            review: document.presidiumReview,
            status: document.status,
            message: `Document ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'marked for revision'}`
        });

    } catch (error) {
        global.logger.error('Review document error:', error);
        res.status(500).json({ error: 'Failed to review document' });
    }
};

// Get document versions
const getDocumentVersions = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check access permissions
        const hasAccess = req.user.role === 'admin' ||
            req.user.committeeId?.toString() === document.committeeId.toString() ||
            (req.user.role === 'delegate' && req.user.email === document.authorEmail);

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this document' });
        }

        const allVersions = document.getAllVersions();

        res.json({
            success: true,
            versions: allVersions,
            currentVersion: document.version
        });

    } catch (error) {
        global.logger.error('Get document versions error:', error);
        res.status(500).json({ error: 'Failed to fetch document versions' });
    }
};

// Get document preview (extracted text)
const getDocumentPreview = async (req, res) => {
    try {
        const { id } = req.params;
        const { version } = req.query;

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check access permissions
        const hasAccess = req.user.role === 'admin' ||
            req.user.committeeId?.toString() === document.committeeId.toString();

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to this document' });
        }

        let extractedText = document.content.extractedText;
        let wordCount = document.content.wordCount;
        let pageCount = document.content.pageCount;

        // If specific version requested
        if (version && parseInt(version) !== document.version) {
            const versionData = document.versions.find(v => v.version === parseInt(version));
            if (!versionData) {
                return res.status(404).json({ error: 'Version not found' });
            }
            extractedText = versionData.extractedText || '';
            wordCount = versionData.wordCount || 0;
            pageCount = versionData.pageCount || 0;
        }

        res.json({
            success: true,
            preview: {
                extractedText: extractedText.substring(0, 5000), // First 5000 chars for preview
                wordCount,
                pageCount,
                version: parseInt(version) || document.version
            }
        });

    } catch (error) {
        global.logger.error('Get document preview error:', error);
        res.status(500).json({ error: 'Failed to fetch document preview' });
    }
};

module.exports = {
    upload,
    uploadPositionPaper,
    extractTextFromFile,
    checkPositionPaperEligibility,
    uploadPositionPaper,
    submitPositionPaperText,
    getPositionPaper,
    getDocuments,
    getDocument,
    downloadDocument,
    reviewDocument,
    getDocumentVersions,
    getDocumentPreview
};