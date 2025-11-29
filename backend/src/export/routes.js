// backend/src/export/routes.js - Updated with PDF generation
const express = require('express');
const { param, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');

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

// Committee ID validation
const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required')
];

// Generate QR codes PDF for committee delegates (admin only)
router.get('/qr-codes/:committeeId',
    global.auth.token,
    global.auth.admin, // Only admin can generate QR PDFs
    validateCommitteeId,
    handleValidationErrors,
    controller.generateCommitteeQRPDF
);

// NEW: Generate presidium-only QR codes PDF (admin only)
router.get('/presidium-qr-codes/:committeeId',
    global.auth.token,
    global.auth.admin, // Only admin can generate QR PDFs
    validateCommitteeId,
    handleValidationErrors,
    controller.generatePresidiumQRPDF
);

// NEW: Generate complete QR codes PDF (presidium + delegates) (admin only)
router.get('/complete-qr-codes/:committeeId',
    global.auth.token,
    global.auth.admin, // Only admin can generate QR PDFs
    validateCommitteeId,
    handleValidationErrors,
    controller.generateCompleteQRPDF
);

// Export committee statistics (presidium + admin)
router.get('/statistics/:committeeId',
    global.auth.token,
    global.auth.presidium,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportStatistics
);

// Export voting results (presidium + admin)
router.get('/voting-results/:committeeId',
    global.auth.token,
    global.auth.presidium,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportVotingResults
);

// Export resolutions (presidium + admin)
router.get('/resolutions/:committeeId',
    global.auth.token,
    global.auth.presidium,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportResolutions
);

// Export complete committee report (admin only)
router.get('/committee-report/:committeeId',
    global.auth.token,
    global.auth.admin,
    validateCommitteeId,
    handleValidationErrors,
    controller.exportCompleteReport
);

module.exports = router;