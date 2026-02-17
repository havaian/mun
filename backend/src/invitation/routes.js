const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Public: Get invitation info by token (no auth needed — for showing org info before login)
router.get('/:token/info', controller.getInvitationInfo);

// Protected: Get all my pending invitations
router.get('/my', global.auth.token, controller.getMyInvitations);

// Protected: Accept an invitation by token
router.post('/:token/accept', global.auth.token, controller.acceptInvitation);

module.exports = router;