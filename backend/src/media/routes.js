const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// =============================================
// MULTER CONFIG — media uploads (images)
// =============================================
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/media');
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${uniqueId}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF, SVG)'));
        }
    }
});

// =============================================
// UPLOAD ENDPOINTS
// =============================================

// POST /api/media/upload — general single image upload
// Accessible by any authenticated user (permission checks at the caller level)
router.post('/upload',
    global.auth.token,
    upload.single('file'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const url = `/uploads/media/${req.file.filename}`;

            global.logger.info(`Media uploaded: ${req.file.originalname} → ${url} by ${req.user.userId}`);

            res.json({
                success: true,
                url,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            });
        } catch (error) {
            global.logger.error('Media upload error:', error);
            res.status(500).json({ error: 'Failed to upload file' });
        }
    }
);

// POST /api/media/upload-multiple — up to 10 images at once
router.post('/upload-multiple',
    global.auth.token,
    upload.array('files', 10),
    (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const uploaded = req.files.map(file => ({
                url: `/uploads/media/${file.filename}`,
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            }));

            global.logger.info(`${uploaded.length} media files uploaded by ${req.user.userId}`);

            res.json({ success: true, files: uploaded });
        } catch (error) {
            global.logger.error('Multi media upload error:', error);
            res.status(500).json({ error: 'Failed to upload files' });
        }
    }
);

// DELETE /api/media/:filename — delete an uploaded file
router.delete('/:filename',
    global.auth.token,
    async (req, res) => {
        try {
            const { filename } = req.params;

            // Sanitize filename to prevent path traversal
            if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
                return res.status(400).json({ error: 'Invalid filename' });
            }

            const filePath = path.join(__dirname, '../../uploads/media', filename);

            try {
                await fs.access(filePath);
                await fs.unlink(filePath);
                global.logger.info(`Media deleted: ${filename} by ${req.user.userId}`);
                res.json({ success: true, message: 'File deleted' });
            } catch {
                return res.status(404).json({ error: 'File not found' });
            }
        } catch (error) {
            global.logger.error('Media delete error:', error);
            res.status(500).json({ error: 'Failed to delete file' });
        }
    }
);

// Error handling for multer errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10.' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err.message?.includes('Only image files')) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

module.exports = router;