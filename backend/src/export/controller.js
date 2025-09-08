// backend/src/export/controller.js - Updated with PDF generation
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const PDFGenerator = require('../utils/pdfGenerator');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Generate QR codes PDF for committee
const generateCommitteeQRPDF = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // Find committee with all data
        const committee = await Committee.findById(committeeId)
            .populate('eventId', 'name')
            .lean();

        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        // Ensure all countries have QR tokens
        let needsUpdate = false;
        for (let country of committee.countries) {
            if (!country.qrToken) {
                country.qrToken = crypto.randomBytes(32).toString('hex');
                needsUpdate = true;
            }
        }

        // Ensure presidium members have QR tokens
        const presidiumRoles = ['chairman', 'co-chairman', 'expert', 'secretary'];

        // Check existing presidium members in the committee
        const existingPresidium = await User.find({
            committeeId: committeeId,
            role: 'presidium'
        }).lean();

        // Create missing presidium users with QR tokens
        const missingRoles = presidiumRoles.filter(role =>
            !existingPresidium.find(p => p.presidiumRole === role)
        );

        for (const role of missingRoles) {
            const presidiumUser = new User({
                role: 'presidium',
                presidiumRole: role,
                committeeId: committeeId,
                qrToken: crypto.randomBytes(32).toString('hex'),
                isQrActive: true,
                isActive: true
            });
            await presidiumUser.save();
            logger.info(`Created presidium user: ${role} for committee ${committee.name}`);
        }

        // Update committee if needed
        if (needsUpdate) {
            await Committee.findByIdAndUpdate(committeeId, {
                $set: { countries: committee.countries }
            });
        }

        // Generate PDF
        const pdfGenerator = new PDFGenerator();
        const baseUrl = process.env.FRONTEND_URL || 'https://mun.uz';
        const pdfBuffer = await pdfGenerator.generateCommitteeQRPDF(committee, baseUrl);

        // Set response headers
        const filename = `QR_Codes_${committee.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        logger.info(`Generated QR codes PDF for committee: ${committee.name} (${pdfBuffer.length} bytes)`);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        logger.error('PDF generation error:', error);
        res.status(500).json({
            error: 'Failed to generate QR codes PDF',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Export committee statistics
const exportStatistics = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // Find committee
        const committee = await Committee.findById(committeeId)
            .populate('eventId', 'name startDate endDate')
            .lean();

        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        // Gather statistics
        const stats = {
            committee: {
                name: committee.name,
                type: committee.type,
                event: committee.eventId.name
            },
            participation: {
                totalCountries: committee.countries.length,
                registeredCountries: committee.countries.filter(c => c.email).length,
                observerCountries: committee.countries.filter(c => c.isObserver).length,
                specialRoles: committee.countries.filter(c => c.specialRole).length
            },
            activities: {
                totalSessions: committee.statistics?.totalSessions || 0,
                totalVotings: committee.statistics?.totalVotings || 0,
                resolutionsPassed: committee.statistics?.resolutionsPassed || 0,
                amendmentsPassed: committee.statistics?.amendmentsPassed || 0
            },
            exportedAt: new Date().toISOString(),
            exportedBy: req.user.email || req.user.userId
        };

        res.json({
            success: true,
            statistics: stats
        });

    } catch (error) {
        logger.error('Statistics export error:', error);
        res.status(500).json({
            error: 'Failed to export statistics'
        });
    }
};

// Export voting results
const exportVotingResults = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // This would integrate with your voting system
        // For now, return placeholder
        res.json({
            success: true,
            message: 'Voting results export - Implementation pending',
            committeeId
        });

    } catch (error) {
        logger.error('Voting results export error:', error);
        res.status(500).json({
            error: 'Failed to export voting results'
        });
    }
};

// Export resolutions
const exportResolutions = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // This would integrate with your resolution system
        // For now, return placeholder
        res.json({
            success: true,
            message: 'Resolutions export - Implementation pending',
            committeeId
        });

    } catch (error) {
        logger.error('Resolutions export error:', error);
        res.status(500).json({
            error: 'Failed to export resolutions'
        });
    }
};

// Export complete committee report
const exportCompleteReport = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // This would generate a comprehensive report
        // For now, return placeholder
        res.json({
            success: true,
            message: 'Complete committee report - Implementation pending',
            committeeId
        });

    } catch (error) {
        logger.error('Complete report export error:', error);
        res.status(500).json({
            error: 'Failed to export complete report'
        });
    }
};

module.exports = {
    generateCommitteeQRPDF,
    exportStatistics,
    exportVotingResults,
    exportResolutions,
    exportCompleteReport
};