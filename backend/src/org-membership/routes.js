const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :orgId from parent
const controller = require('./controller');

// All routes require auth + org admin or manage_members permission
// The orgAdmin/orgPermission middleware checks req.params.orgId

// Get all members
router.get('/',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.getMembers
);

// Add member by user ID
router.post('/',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.addMember
);

// Invite member by email
router.post('/invite',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.inviteMember
);

// Get pending invitations
router.get('/invitations',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.getPendingInvitations
);

// Cancel invitation
router.delete('/invitations/:invitationId',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.cancelInvitation
);

// Update member permissions
router.put('/:membershipId/permissions',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.updateMemberPermissions
);

// Remove member
router.delete('/:membershipId',
    global.auth.token,
    global.auth.orgPermission('manage_members', 'orgId'),
    controller.removeMember
);

// Utility: get available permissions list
router.get('/permissions-list',
    global.auth.token,
    controller.getAvailablePermissions
);

module.exports = router;