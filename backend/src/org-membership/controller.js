const { OrgMembership, ORG_PERMISSIONS } = require('./model');
const { Organization } = require('../organization/model');
const { User } = require('../auth/model');
const { OrgInvitation } = require('../invitation/model');

// Get all members of an organization
const getMembers = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { status = 'active', page = 1, limit = 50 } = req.query;

        const filter = { organization: orgId };
        if (status !== 'all') filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [members, total] = await Promise.all([
            OrgMembership.find(filter)
                .populate('user', 'firstName lastName email avatar institution')
                .populate('addedBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            OrgMembership.countDocuments(filter)
        ]);

        res.json({
            success: true,
            members,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get org members error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

// Add a member to the organization (by existing user ID)
const addMember = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { userId, permissions = [] } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Validate permissions
        const invalidPerms = permissions.filter(p => !ORG_PERMISSIONS.includes(p));
        if (invalidPerms.length > 0) {
            return res.status(400).json({
                error: `Invalid permissions: ${invalidPerms.join(', ')}`,
                validPermissions: ORG_PERMISSIONS
            });
        }

        // Check user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check org exists
        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Don't add the org admin as a member (they have implicit full access)
        if (org.admin?.toString() === userId) {
            return res.status(400).json({
                error: 'Organization admin already has full access and cannot be added as a member'
            });
        }

        // Check if already a member
        const existing = await OrgMembership.findOne({ user: userId, organization: orgId });
        if (existing) {
            if (existing.status === 'inactive') {
                // Reactivate
                existing.status = 'active';
                existing.permissions = permissions;
                existing.addedBy = req.user.userId;
                await existing.save();
                await existing.populate('user', 'firstName lastName email avatar institution');

                return res.json({
                    success: true,
                    membership: existing,
                    message: 'Member reactivated'
                });
            }
            return res.status(409).json({ error: 'User is already a member of this organization' });
        }

        const membership = new OrgMembership({
            user: userId,
            organization: orgId,
            permissions,
            addedBy: req.user.userId
        });

        await membership.save();
        await membership.populate('user', 'firstName lastName email avatar institution');

        global.logger.info(`Member added to org ${org.name}: ${user.email} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            membership,
            message: 'Member added successfully'
        });
    } catch (error) {
        global.logger.error('Add org member error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'User is already a member of this organization' });
        }

        res.status(500).json({ error: 'Failed to add member' });
    }
};

// Invite a member by email (may not have an account yet)
const inviteMember = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { email, permissions = [] } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Validate permissions
        const invalidPerms = permissions.filter(p => !ORG_PERMISSIONS.includes(p));
        if (invalidPerms.length > 0) {
            return res.status(400).json({
                error: `Invalid permissions: ${invalidPerms.join(', ')}`,
                validPermissions: ORG_PERMISSIONS
            });
        }

        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Check if user already exists and is already a member
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            const existingMembership = await OrgMembership.findOne({
                user: existingUser._id,
                organization: orgId,
                status: 'active'
            });

            if (existingMembership) {
                return res.status(409).json({ error: 'User is already a member of this organization' });
            }

            // User exists but not a member — add directly instead of invitation
            const membership = new OrgMembership({
                user: existingUser._id,
                organization: orgId,
                permissions,
                addedBy: req.user.userId
            });

            await membership.save();
            await membership.populate('user', 'firstName lastName email avatar institution');

            global.logger.info(`Existing user added to org ${org.name}: ${email} by ${req.user.userId}`);

            return res.status(201).json({
                success: true,
                membership,
                invited: false,
                message: 'User already has an account — added directly as member'
            });
        }

        // Check for existing pending invitation
        const existingInvite = await OrgInvitation.findOne({
            organization: orgId,
            email: email.toLowerCase(),
            status: 'pending'
        });

        if (existingInvite) {
            return res.status(409).json({ error: 'An invitation is already pending for this email' });
        }

        // Create invitation
        const invitation = new OrgInvitation({
            organization: orgId,
            email: email.toLowerCase(),
            permissions,
            invitedBy: req.user.userId
        });

        invitation.generateToken();
        await invitation.save();

        // TODO: Send invitation email

        global.logger.info(`Org invitation sent: ${email} → ${org.name} by ${req.user.userId}`);

        res.status(201).json({
            success: true,
            invitation: {
                _id: invitation._id,
                email: invitation.email,
                permissions: invitation.permissions,
                expiresAt: invitation.expiresAt,
                status: invitation.status
            },
            invited: true,
            message: 'Invitation created (user does not have an account yet)'
        });
    } catch (error) {
        global.logger.error('Invite org member error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
};

// Update member permissions
const updateMemberPermissions = async (req, res) => {
    try {
        const { orgId, membershipId } = req.params;
        const { permissions } = req.body;

        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({ error: 'Permissions array is required' });
        }

        // Validate permissions
        const invalidPerms = permissions.filter(p => !ORG_PERMISSIONS.includes(p));
        if (invalidPerms.length > 0) {
            return res.status(400).json({
                error: `Invalid permissions: ${invalidPerms.join(', ')}`,
                validPermissions: ORG_PERMISSIONS
            });
        }

        const membership = await OrgMembership.findOne({
            _id: membershipId,
            organization: orgId
        });

        if (!membership) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        membership.permissions = permissions;
        await membership.save();
        await membership.populate('user', 'firstName lastName email avatar institution');

        global.logger.info(`Member permissions updated: ${membershipId} in org ${orgId}`);

        res.json({
            success: true,
            membership,
            message: 'Permissions updated'
        });
    } catch (error) {
        global.logger.error('Update member permissions error:', error);
        res.status(500).json({ error: 'Failed to update permissions' });
    }
};

// Remove (deactivate) a member
const removeMember = async (req, res) => {
    try {
        const { orgId, membershipId } = req.params;

        const membership = await OrgMembership.findOne({
            _id: membershipId,
            organization: orgId
        });

        if (!membership) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        membership.status = 'inactive';
        await membership.save();

        global.logger.info(`Member removed from org ${orgId}: ${membership.user} by ${req.user.userId}`);

        res.json({
            success: true,
            message: 'Member removed from organization'
        });
    } catch (error) {
        global.logger.error('Remove org member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

// Get pending invitations for an organization
const getPendingInvitations = async (req, res) => {
    try {
        const { orgId } = req.params;

        const invitations = await OrgInvitation.find({
            organization: orgId,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .populate('invitedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, invitations });
    } catch (error) {
        global.logger.error('Get pending invitations error:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
};

// Cancel a pending invitation
const cancelInvitation = async (req, res) => {
    try {
        const { orgId, invitationId } = req.params;

        const invitation = await OrgInvitation.findOne({
            _id: invitationId,
            organization: orgId,
            status: 'pending'
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        invitation.status = 'cancelled';
        await invitation.save();

        global.logger.info(`Invitation cancelled: ${invitation.email} for org ${orgId}`);

        res.json({ success: true, message: 'Invitation cancelled' });
    } catch (error) {
        global.logger.error('Cancel invitation error:', error);
        res.status(500).json({ error: 'Failed to cancel invitation' });
    }
};

// Get available permissions list (utility endpoint)
const getAvailablePermissions = (req, res) => {
    res.json({
        success: true,
        permissions: ORG_PERMISSIONS.map(p => ({
            key: p,
            label: p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: getPermissionDescription(p)
        }))
    });
};

// Helper: permission descriptions
const getPermissionDescription = (permission) => {
    const descriptions = {
        'manage_members': 'Add/remove organization members and assign their permissions',
        'manage_content': 'Edit organization page, logo, description, and news',
        'manage_event_content': 'Edit event pages, photos, and descriptions',
        'manage_event_status': 'Change event status (publish, open/close registration, activate, complete)',
        'manage_registration': 'Create and edit registration forms for events',
        'review_applicants': 'Review registration applications and move them through pipeline stages'
    };
    return descriptions[permission] || '';
};

module.exports = {
    getMembers,
    addMember,
    inviteMember,
    updateMemberPermissions,
    removeMember,
    getPendingInvitations,
    cancelInvitation,
    getAvailablePermissions
};