// backend/src/presentation/routes.js
// Mounted at: /api/organizations/:orgId/events/:eventId/committees/:committeeId/presentation
const express = require('express');
const router = express.Router({ mergeParams: true });

// Shared: token + event context + participant
router.use(
    global.auth.token,
    global.auth.eventContext('orgId', 'eventId'),
    global.auth.participant('committeeId')
);

// Placeholder routes for presentation display
// TODO: Implement full presentation system

// Get presentation display data (any participant)
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Presentation display - Coming soon',
        displayData: {
            currentMode: 'formal',
            currentSpeaker: null,
            timers: {},
            quorum: { hasQuorum: false, present: 0, required: 0 }
        }
    });
});

// Post announcement (presidium only)
router.post('/announce',
    global.auth.presidium,
    (req, res) => {
        res.json({
            success: true,
            message: 'Announcement system - Coming soon'
        });
    }
);

module.exports = router;