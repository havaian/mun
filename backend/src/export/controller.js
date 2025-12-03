// backend/src/export/controller.js - Updated with Link-Based Export
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Helper function to sanitize filenames for HTTP headers
const sanitizeFilename = (name) => {
    return name
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, '') // Remove leading/trailing underscores
        .substring(0, 50) // Limit length
        || 'committee'; // Fallback if empty
};

// Generate login links for committee delegates
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
            link: `${baseUrl}/auth/login?token=${country.loginToken}`, // FIXED: Use proper login route
            loginToken: country.loginToken,
            isObserver: country.isObserver,
            specialRole: country.specialRole,
            isActive: country.isLoginActive !== false // Default to true if not set
        }));

        if (format === 'plain') {
            // Return plain text format for easy copying
            const plainText = delegateLinks
                .map(link => `${link.country}: ${link.link}`)
                .join('\n');

            // FIXED: Properly sanitize filename for HTTP header
            const safeFilename = sanitizeFilename(committee.name);
            
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_delegate_links.txt"`);
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
            details: error.message
        });
    }
};

// Generate presidium login
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
        const updates = [];
        for (let member of presidiumMembers) {
            if (!member.loginToken) {
                member.loginToken = crypto.randomBytes(32).toString('hex');
                updates.push(
                    User.findByIdAndUpdate(member._id, {
                        loginToken: member.loginToken,
                        isLoginActive: true
                    })
                );
            }
        }

        // Execute all updates
        if (updates.length > 0) {
            await Promise.all(updates);
        }

        const baseUrl = process.env.FRONTEND_URL || 'https://mun.uz';

        // Generate presidium links
        const presidiumLinks = presidiumMembers.map(member => ({
            role: member.presidiumRole,
            link: `${baseUrl}/auth/login?token=${member.loginToken}`, // FIXED: Use proper login route
            loginToken: member.loginToken,
            isActive: member.isLoginActive !== false // Default to true if not set
        }));

        if (format === 'plain') {
            // Return plain text format
            const plainText = presidiumLinks
                .map(link => `${formatPresidiumRole(link.role)}: ${link.link}`)
                .join('\n');

            // FIXED: Properly sanitize filename for HTTP header
            const safeFilename = sanitizeFilename(committee.name);
            
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_presidium_links.txt"`);
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

// Generate complete login links (both presidium and delegates) 
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
        const updates = [];
        for (let member of presidiumMembers) {
            if (!member.loginToken) {
                member.loginToken = crypto.randomBytes(32).toString('hex');
                updates.push(
                    User.findByIdAndUpdate(member._id, {
                        loginToken: member.loginToken,
                        isLoginActive: true
                    })
                );
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        const baseUrl = process.env.FRONTEND_URL || 'https://mun.uz';

        // Generate all links
        const presidiumLinks = presidiumMembers.map(member => ({
            type: 'presidium',
            role: member.presidiumRole,
            name: formatPresidiumRole(member.presidiumRole),
            link: `${baseUrl}/auth/login?token=${member.loginToken}`, // FIXED: Use proper login route
            loginToken: member.loginToken,
            isActive: member.isLoginActive !== false
        }));

        const delegateLinks = committee.countries.map(country => ({
            type: 'delegate',
            role: 'delegate',
            name: country.name,
            link: `${baseUrl}/auth/login?token=${country.loginToken}`, // FIXED: Use proper login route
            loginToken: country.loginToken,
            isObserver: country.isObserver,
            specialRole: country.specialRole,
            isActive: country.isLoginActive !== false
        }));

        const allLinks = [...presidiumLinks, ...delegateLinks];

        if (format === 'plain') {
            // Return plain text format
            let plainText = `PRESIDIUM MEMBERS:\n`;
            plainText += presidiumLinks
                .map(link => `${link.name}: ${link.link}`)
                .join('\n');
            plainText += `\n\nDELEGATE COUNTRIES:\n`;
            plainText += delegateLinks
                .map(link => `${link.name}: ${link.link}`)
                .join('\n');

            // FIXED: Properly sanitize filename for HTTP header
            const safeFilename = sanitizeFilename(committee.name);
            
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_complete_links.txt"`);
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

// Helper function to format presidium roles
const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

// Export committee statistics
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

// Other export methods remain the same
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
    generateCommitteeLinks,
    generatePresidiumLinks,  
    generateCompleteLinks,
    exportStatistics,
    exportVotingResults,
    exportResolutions,
    exportCompleteReport
};