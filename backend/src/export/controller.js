// backend/src/export/controller.js - Updated with Link-Based Export
const { Committee } = require('../committee/model');
const { User } = require('../auth/model');
const crypto = require('crypto');

// Helper function to sanitize filenames for HTTP headers
const sanitizeFilename = (name) => {
    const sanitized = name
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, '') // Remove leading/trailing underscores
        .substring(0, 50); // Limit length
        
    // Return the sanitized name or 'untitled' if it's empty after processing
    return sanitized || 'untitled'; 
};

const createExportFilename = (eventName, committeeName, type) => {
    // Fallback to a default name if either is missing, so it's not omitted
    const fallbackEventName = eventName || 'event';
    const fallbackCommitteeName = committeeName || 'committee';
    
    const safeEventName = sanitizeFilename(fallbackEventName);
    const safeCommitteeName = sanitizeFilename(fallbackCommitteeName);
    
    // Ensure we don't end up with event_committee_delegate_links.txt if both are valid
    if (safeEventName === safeCommitteeName) {
         return `${safeEventName}_${type}`;
    }

    return `${safeEventName}_${safeCommitteeName}_${type}`;
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
        global.logger.error('Statistics export error:', error);
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
        global.logger.error('Voting results export error:', error);
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
        global.logger.error('Resolutions export error:', error);
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
        global.logger.error('Complete report export error:', error);
        res.status(500).json({
            error: 'Failed to export complete report'
        });
    }
};

module.exports = {
    exportStatistics,
    exportVotingResults,
    exportResolutions,
    exportCompleteReport
};