const express = require('express');
const { param, query, validationResult } = require('express-validator');
const router = express.Router();

const controller = require('./controller');
const {
    authenticateToken,
    requirePresidium,
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
const validateCommitteeId = [
    param('committeeId')
        .isMongoId()
        .withMessage('Valid committee ID is required')
];

const validateExportFormat = [
    query('format')
        .optional()
        .isIn(['json', 'csv'])
        .withMessage('Format must be json or csv')
];

const validateIncludeDetails = [
    query('includeDetails')
        .optional()
        .isBoolean()
        .withMessage('Include details must be boolean')
];

// Export Routes (Presidium only)

// Export committee summary report
router.get('/committee/:committeeId/summary',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateExportFormat,
    handleValidationErrors,
    requireSameCommittee,
    controller.exportCommitteeSummary
);

// Export voting results
router.get('/committee/:committeeId/voting-results',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateExportFormat,
    validateIncludeDetails,
    handleValidationErrors,
    requireSameCommittee,
    controller.exportVotingResults
);

// Export participation report
router.get('/committee/:committeeId/participation',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateExportFormat,
    handleValidationErrors,
    requireSameCommittee,
    controller.exportParticipationReport
);

// Export resolution summary
router.get('/committee/:committeeId/resolutions',
    authenticateToken,
    requirePresidium,
    validateCommitteeId,
    validateExportFormat,
    handleValidationErrors,
    requireSameCommittee,
    controller.exportResolutionSummary
);

// Export full event report (admin only)
router.get('/event/:eventId/full-report',
    authenticateToken,
    param('eventId').isMongoId().withMessage('Valid event ID is required'),
    validateExportFormat,
    handleValidationErrors,
    async (req, res) => {
        try {
            // Only admins can export full event reports
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }

            const { Event } = require('../event/model');
            const { Committee } = require('../committee/model');
            const { eventId } = req.params;
            const { format = 'json' } = req.query;

            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const committees = await Committee.find({ eventId });

            const fullReport = {
                event: {
                    name: event.name,
                    description: event.description,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    status: event.status,
                    totalCommittees: committees.length
                },
                committees: committees.map(committee => ({
                    id: committee._id,
                    name: committee.name,
                    type: committee.type,
                    totalCountries: committee.countries.length,
                    status: committee.status
                })),
                generatedAt: new Date(),
                generatedBy: req.user.email
            };

            if (format === 'csv') {
                const csv = generateEventCSV(fullReport);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=event-${event.name}-report.csv`);
                res.send(csv);
            } else {
                res.json({
                    success: true,
                    report: fullReport
                });
            }

        } catch (error) {
            res.status(500).json({ error: 'Failed to export event report' });
        }
    }
);

// Helper function for event CSV
const generateEventCSV = (report) => {
    const headers = ['Committee Name', 'Committee Type', 'Total Countries', 'Status'];
    const rows = report.committees.map(c => [c.name, c.type, c.totalCountries, c.status]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

module.exports = router;