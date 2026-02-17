const express = require('express');
const router = express.Router({ mergeParams: true }); // access :orgId from parent
const controller = require('./controller');

// List events for org (any org member or org admin can view)
router.get('/',
    global.auth.token,
    controller.getEvents
);

// Get single event by ID or slug
router.get('/:eventIdentifier',
    global.auth.token,
    controller.getEvent
);

// Create event (Org Admin only — create_events is NOT delegatable)
router.post('/',
    global.auth.token,
    global.auth.orgAdmin('orgId'),
    controller.createEvent
);

// Update event (Org Admin or manage_event_content permission)
router.put('/:eventId',
    global.auth.token,
    global.auth.orgPermission('manage_event_content', 'orgId'),
    controller.updateEvent
);

// Update event status (Org Admin only)
router.put('/:eventId/status',
    global.auth.token,
    global.auth.orgAdmin('orgId'),
    controller.updateEventStatus
);

// Delete event (Org Admin only)
router.delete('/:eventId',
    global.auth.token,
    global.auth.orgAdmin('orgId'),
    controller.deleteEvent
);

// Get event statistics
router.get('/:eventId/statistics',
    global.auth.token,
    controller.getEventStatistics
);

module.exports = router;