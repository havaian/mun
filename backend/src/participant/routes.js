const express = require('express');
const router = express.Router({ mergeParams: true }); // access :orgId, :eventId from parent
const controller = require('./controller');

// Get all participants for an event
router.get('/',
    global.auth.token,
    controller.getParticipants
);

// Get participants grouped by committee (summary view)
router.get('/by-committee',
    global.auth.token,
    controller.getParticipantsByCommittee
);

// Get current user's participation in this event
router.get('/me',
    global.auth.token,
    controller.getMyParticipation
);

// Get single participant
router.get('/:participantId',
    global.auth.token,
    controller.getParticipant
);

// Add participant (Org Admin or manage_event_content)
router.post('/',
    global.auth.token,
    global.auth.orgPermission('manage_event_content', 'orgId'),
    controller.addParticipant
);

// Update participant
router.put('/:participantId',
    global.auth.token,
    global.auth.orgPermission('manage_event_content', 'orgId'),
    controller.updateParticipant
);

// Remove participant
router.delete('/:participantId',
    global.auth.token,
    global.auth.orgPermission('manage_event_content', 'orgId'),
    controller.removeParticipant
);

module.exports = router;