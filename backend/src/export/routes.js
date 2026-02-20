// backend/src/export/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/export
const express = require('express');
const { param, query, validationResult } = require('express-validator');
const router = express.Router({ mergeParams: true });

const controller = require('./controller');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateFormat = [
    query('format').optional().isIn(['json', 'plain', 'pdf']).withMessage('Format must be json, plain, or pdf')
];

// Shared: token + event context
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId')
);

module.exports = router;