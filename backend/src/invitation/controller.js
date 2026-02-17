const { OrgInvitation } = require('./model');
const { OrgMembership } = require('../org-membership/model');
const { Organization } = require('../organization/model');

// Accept an invitation by token (authenticated user)
const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await OrgInvitation.findOne({
            token,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('organization', 'name slug');

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found, expired, or already used' });
        }

        // Verify the authenticated user's email matches the invitation
        if (invitation.email !== req.user.email) {
            return res.status(403).json({
                error: 'This invitation was sent to a different email address'
            });
        }

        // Check if already a member
        const existingMembership = await OrgMembership.findOne({
            user: req.user.userId,
            organization: invitation.organization._id
        });

        if (existingMembership) {
            if (existingMembership.status === 'active') {
                invitation.claim(req.user.userId);
                await invitation.save();
                return res.json({
                    success: true,
                    message: 'You are already a member of this organization',
                    alreadyMember: true
                });
            }

            // Reactivate inactive membership
            existingMembership.status = 'active';
            existingMembership.permissions = invitation.permissions;
            await existingMembership.save();
        } else {
            // Create new membership
            const membership = new OrgMembership({
                user: req.user.userId,
                organization: invitation.organization._id,
                permissions: invitation.permissions,
                addedBy: invitation.invitedBy
            });
            await membership.save();
        }

        // Mark invitation as accepted
        invitation.claim(req.user.userId);
        await invitation.save();

        global.logger.info(`Invitation accepted: ${req.user.email} → ${invitation.organization.name}`);

        res.json({
            success: true,
            organization: invitation.organization,
            permissions: invitation.permissions,
            message: `You have joined ${invitation.organization.name}`
        });
    } catch (error) {
        global.logger.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
};

// Get invitation details by token (can be used before login to show what the invitation is for)
const getInvitationInfo = async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await OrgInvitation.findOne({
            token,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .populate('organization', 'name slug logo description')
            .populate('invitedBy', 'firstName lastName')
            .lean();

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found, expired, or already used' });
        }

        // Return only safe info — don't expose internal IDs
        res.json({
            success: true,
            invitation: {
                organization: invitation.organization,
                invitedBy: invitation.invitedBy,
                email: invitation.email,
                permissions: invitation.permissions,
                expiresAt: invitation.expiresAt
            }
        });
    } catch (error) {
        global.logger.error('Get invitation info error:', error);
        res.status(500).json({ error: 'Failed to fetch invitation info' });
    }
};

// Get all pending invitations for the current user
const getMyInvitations = async (req, res) => {
    try {
        const invitations = await OrgInvitation.find({
            email: req.user.email,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .populate('organization', 'name slug logo')
            .populate('invitedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, invitations });
    } catch (error) {
        global.logger.error('Get my invitations error:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
};

/**
 * Auto-claim pending org member invitations for a user.
 * Called during registration (from auth controller).
 * This handles OrgInvitation (member invitations),
 * NOT Organization.adminInvitation (admin assignment — handled separately).
 */
const claimPendingMemberInvitations = async (user) => {
    try {
        const pendingInvitations = await OrgInvitation.find({
            email: user.email,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        let claimedCount = 0;

        for (const invitation of pendingInvitations) {
            // Create membership
            const existingMembership = await OrgMembership.findOne({
                user: user._id,
                organization: invitation.organization
            });

            if (!existingMembership) {
                const membership = new OrgMembership({
                    user: user._id,
                    organization: invitation.organization,
                    permissions: invitation.permissions,
                    addedBy: invitation.invitedBy
                });
                await membership.save();
            }

            // Mark claimed
            invitation.claim(user._id);
            await invitation.save();
            claimedCount++;
        }

        if (claimedCount > 0) {
            global.logger.info(`${claimedCount} member invitation(s) auto-claimed for ${user.email}`);
        }

        return claimedCount;
    } catch (error) {
        global.logger.error(`Failed to auto-claim member invitations for ${user.email}:`, error);
        return 0;
    }
};

module.exports = {
    acceptInvitation,
    getInvitationInfo,
    getMyInvitations,
    claimPendingMemberInvitations
};