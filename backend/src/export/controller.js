// backend/src/export/controller.js - Updated with Link-Based Export
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const logger = require('../utils/logger');
const crypto = require('crypto');

// CHANGED: Generate login links for committee delegates (replaces QR PDF)
const generateCommitteeLinks = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json' } = req.query; // json, plain, or pdf

        // Find committee with all data
        const committee = await Committee.findById(committeeId)
            .populate('eventId', 'name')
            .lean();

        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        // Ensure all countries have login tokens
        let needsUpdate = false;
        for (let country of committee.countries) {
            if (!country.loginToken) {
                country.loginToken = crypto.randomBytes(32).toString('hex');
                needsUpdate = true;
            }
        }

        // Update committee if needed
        if (needsUpdate) {
            await Committee.findByIdAndUpdate(committeeId, {
                $set: { countries: committee.countries }
            });
        }

        const baseUrl = process.env.FRONTEND_URL || 'https://mun.uz';

        // Generate delegate links
        const delegateLinks = committee.countries.map(country => ({
            country: country.name,
            link: `${baseUrl}/login/${country.loginToken}`,
            loginToken: country.loginToken,
            isObserver: country.isObserver,
            specialRole: country.specialRole,
            isActive: country.isLoginActive
        }));

        if (format === 'plain') {
            // Return plain text format for easy copying
            const plainText = delegateLinks
                .map(link => `${link.country}: ${link.link}`)
                .join('\n');

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="delegate_links_${committee.name.replace(/\s+/g, '_')}.txt"`);
            res.send(plainText);
        } else {
            // Return JSON format
            res.json({
                success: true,
                committee: {
                    id: committee._id,
                    name: committee.name,
                    type: committee.type,
                    event: committee.eventId.name
                },
                delegateLinks,
                totalCount: delegateLinks.length,
                activeCount: delegateLinks.filter(link => link.isActive).length
            });
        }

        logger.info(`Generated delegate links for committee: ${committee.name} (${delegateLinks.length} links)`);

    } catch (error) {
        logger.error('Delegate links generation error:', error);
        res.status(500).json({
            error: 'Failed to generate delegate links',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// CHANGED: Generate presidium login links (replaces presidium QR PDF)
const generatePresidiumLinks = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json' } = req.query;

        // Find committee
        const committee = await Committee.findById(committeeId)
            .populate('eventId', 'name')
            .lean();

        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        // Get presidium members
        const presidiumMembers = await User.find({
            committeeId: committeeId,
            role: 'presidium'
        }).select('presidiumRole loginToken isLoginActive').lean();

        // Ensure all presidium members have login tokens
        let needsUpdate = false;
        for (let member of presidiumMembers) {
            if (!member.loginToken) {
                member.loginToken = crypto.randomBytes(32).toString('hex');
                needsUpdate = true;
            }
        }

        // Update presidium members if needed
        if (needsUpdate) {
            for (let member of presidiumMembers) {
                await User.findByIdAndUpdate(member._id, {
                    loginToken: member.loginToken
                });
            }
        }

        const baseUrl = process.env.FRONTEND_URL || 'https://mun.uz';

        // Generate presidium links
        const presidiumLinks = presidiumMembers.map(member => ({
            role: member.presidiumRole,
            link: `${baseUrl}/login/${member.loginToken}`,
            loginToken: member.loginToken,
            isActive: member.isLoginActive
        }));

        if (format === 'plain') {
            // Return plain text format
            const plainText = presidiumLinks
                .map(link => `${link.role}: ${link.link}`)
                .join('\n');

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="presidium_links_${committee.name.replace(/\s+/g, '_')}.txt"`);
            res.send(plainText);
        } else {
            // Return JSON format
            res.json({
                success: true,
                committee: {
                    id: committee._id,
                    name: committee.name,
                    type: committee.type,
                    event: committee.eventId.name
                },
                presidiumLinks,
                totalCount: presidiumLinks.length,
                activeCount: presidiumLinks.filter(link => link.isActive).length
            });
        }

        logger.info(`Generated presidium links for committee: ${committee.name} (${presidiumLinks.length} links)`);

    } catch (error) {
        logger.error('Presidium links generation error:', error);
        res.status(500).json({
            error: 'Failed to generate presidium links',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// CHANGED: Generate complete login links (both presidium and delegates) 
const generateCompleteLinks = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { format = 'json' } = req.query;

        // Find committee
        const committee = await Committee.findById(committeeId)
            .populate('eventId', 'name')
            .lean();

        if (!committee) {
            return res.status(404).json({
                error: 'Committee not found'
            });
        }

        // Ensure all countries have login tokens
        let needsCommitteeUpdate = false;
        for (let country of committee.countries) {
            if (!country.loginToken) {
                country.loginToken = crypto.randomBytes(32).toString('hex');
                needsCommitteeUpdate = true;
            }
        }

        if (needsCommitteeUpdate) {
            await Committee.findByIdAndUpdate(committeeId, {
                $set: { countries: committee.countries }
            });
        }

        // Get presidium members
        const presidiumMembers = await User.find({
            committeeId: committeeId,
            role: 'presidium'
        }).select('presidiumRole loginToken isLoginActive').lean();

        // Ensure presidium members have login tokens
        let needsPresidiumUpdate = false;
        for (let member of presidiumMembers) {
            if (!member.loginToken) {
                member.loginToken = crypto.randomBytes(32).toString('hex');
                needsPresidiumUpdate = true;
            }
        }

        if (needsPresidiumUpdate) {
            for (let member of presidiumMembers) {
                await User.findByIdAndUpdate(member._id, {
                    loginToken: member.loginToken
                });
            }
        }

        const baseUrl = process.env.FRONTEND_URL || 'https://mun.uz';

        // Generate all links
        const presidiumLinks = presidiumMembers.map(member => ({
            type: 'presidium',
            role: member.presidiumRole,
            name: member.presidiumRole,
            link: `${baseUrl}/login/${member.loginToken}`,
            loginToken: member.loginToken,
            isActive: member.isLoginActive
        }));

        const delegateLinks = committee.countries.map(country => ({
            type: 'delegate',
            role: 'delegate',
            name: country.name,
            link: `${baseUrl}/login/${country.loginToken}`,
            loginToken: country.loginToken,
            isObserver: country.isObserver,
            specialRole: country.specialRole,
            isActive: country.isLoginActive
        }));

        const allLinks = [...presidiumLinks, ...delegateLinks];

        if (format === 'plain') {
            // Return plain text format
            let plainText = `PRESIDIUM:\n`;
            plainText += presidiumLinks
                .map(link => `${link.name}: ${link.link}`)
                .join('\n');
            plainText += `\n\nDELEGATES:\n`;
            plainText += delegateLinks
                .map(link => `${link.name}: ${link.link}`)
                .join('\n');

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="complete_links_${committee.name.replace(/\s+/g, '_')}.txt"`);
            res.send(plainText);
        } else {
            // Return JSON format
            res.json({
                success: true,
                committee: {
                    id: committee._id,
                    name: committee.name,
                    type: committee.type,
                    event: committee.eventId.name
                },
                presidiumLinks,
                delegateLinks,
                allLinks,
                counts: {
                    total: allLinks.length,
                    presidium: presidiumLinks.length,
                    delegates: delegateLinks.length,
                    active: allLinks.filter(link => link.isActive).length
                }
            });
        }

        logger.info(`Generated complete links for committee: ${committee.name} (${allLinks.length} total links)`);

    } catch (error) {
        logger.error('Complete links generation error:', error);
        res.status(500).json({
            error: 'Failed to generate complete links',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// UNCHANGED: Export committee statistics
const exportStatistics = async (req, res) => {
    try {
        const { committeeId } = req.params;

        // Implementation for statistics export remains the same
        // This is not related to QR/link authentication

        res.json({
            success: true,
            message: 'Statistics export not yet implemented'
        });

    } catch (error) {
        logger.error('Statistics export error:', error);
        res.status(500).json({
            error: 'Failed to export statistics'
        });
    }
};

// UNCHANGED: Other export methods remain the same
const exportVotingResults = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Voting results export not yet implemented'
        });
    } catch (error) {
        logger.error('Voting results export error:', error);
        res.status(500).json({
            error: 'Failed to export voting results'
        });
    }
};

const exportResolutions = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Resolutions export not yet implemented'
        });
    } catch (error) {
        logger.error('Resolutions export error:', error);
        res.status(500).json({
            error: 'Failed to export resolutions'
        });
    }
};

const exportCompleteReport = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Complete report export not yet implemented'
        });
    } catch (error) {
        logger.error('Complete report export error:', error);
        res.status(500).json({
            error: 'Failed to export complete report'
        });
    }
};

module.exports = {
    generateCommitteeLinks, // CHANGED: was generateCommitteeQRPDF
    generatePresidiumLinks, // CHANGED: was generatePresidiumQRPDF  
    generateCompleteLinks,  // CHANGED: was generateCompleteQRPDF
    exportStatistics,
    exportVotingResults,
    exportResolutions,
    exportCompleteReport
};