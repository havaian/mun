const { Organization } = require('./model');
const { User } = require('../auth/model');

// Get all organizations (SuperAdmin only)
const getAllOrganizations = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [organizations, total] = await Promise.all([
            Organization.find(filter)
                .populate('admin', 'firstName lastName email')
                .populate('createdBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Organization.countDocuments(filter)
        ]);

        res.json({
            success: true,
            organizations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get all organizations error:', error);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
};

// Get single organization by ID or slug
const getOrganization = async (req, res) => {
    try {
        const { identifier } = req.params;

        // Try to find by ID first, then by slug
        let organization;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            organization = await Organization.findById(identifier)
                .populate('admin', 'firstName lastName email')
                .populate('createdBy', 'firstName lastName email');
        }
        if (!organization) {
            organization = await Organization.findOne({ slug: identifier })
                .populate('admin', 'firstName lastName email')
                .populate('createdBy', 'firstName lastName email');
        }

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json({ success: true, organization });
    } catch (error) {
        global.logger.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to fetch organization' });
    }
};

// Create organization (SuperAdmin only)
const createOrganization = async (req, res) => {
    try {
        const {
            name,
            description,
            foundingDate,
            email,
            website,
            location,
            socialLinks,
            adminEmail  // email of the person to assign as org admin
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        // Generate unique slug
        const slug = await Organization.generateSlug(name);

        const orgData = {
            name: name.trim(),
            slug,
            description: description?.trim() || null,
            foundingDate: foundingDate || null,
            email: email || null,
            website: website || null,
            location: location || {},
            socialLinks: socialLinks || {},
            createdBy: req.user.userId
        };

        const organization = new Organization(orgData);

        // Handle admin assignment
        if (adminEmail) {
            const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });

            if (existingUser) {
                // User already exists — assign immediately
                organization.admin = existingUser._id;
                global.logger.info(`Org admin assigned immediately: ${adminEmail} → ${name}`);
            } else {
                // User doesn't exist yet — create pending invitation
                organization.generateAdminInvitation(adminEmail);
                global.logger.info(`Org admin invitation created: ${adminEmail} → ${name}`);
            }
        }

        await organization.save();
        await organization.populate('admin', 'firstName lastName email');
        await organization.populate('createdBy', 'firstName lastName email');

        global.logger.info(`Organization created: ${name} (${slug}) by SuperAdmin ${req.user.userId}`);

        const adminAssigned = !!organization.admin;
        res.status(201).json({
            success: true,
            organization,
            message: adminAssigned
                ? 'Organization created and admin assigned'
                : adminEmail
                    ? 'Organization created with pending admin invitation'
                    : 'Organization created without admin'
        });
    } catch (error) {
        global.logger.error('Create organization error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ error: 'Organization with this slug already exists' });
        }

        res.status(500).json({ error: 'Failed to create organization' });
    }
};

// Update organization (SuperAdmin or Org Admin)
const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Check permissions: SuperAdmin can update any org, Org Admin can update their own
        const isSuperAdmin = req.user.isSuperAdmin;
        const isOrgAdmin = organization.admin?.toString() === req.user.userId;

        if (!isSuperAdmin && !isOrgAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fields that can be updated
        const allowedFields = [
            'name', 'description', 'foundingDate', 'email',
            'website', 'location', 'socialLinks', 'logo'
        ];

        // SuperAdmin-only fields
        const superAdminFields = ['status'];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                organization[field] = updates[field];
            }
        });

        if (isSuperAdmin) {
            superAdminFields.forEach(field => {
                if (updates[field] !== undefined) {
                    organization[field] = updates[field];
                }
            });
        }

        // Handle slug update if name changed
        if (updates.name && updates.name !== organization.name) {
            organization.slug = await Organization.generateSlug(updates.name);
        }

        await organization.save();
        await organization.populate('admin', 'firstName lastName email');

        global.logger.info(`Organization updated: ${organization.name} by ${req.user.userId}`);

        res.json({ success: true, organization });
    } catch (error) {
        global.logger.error('Update organization error:', error);
        res.status(500).json({ error: 'Failed to update organization' });
    }
};

// Assign or reassign org admin (SuperAdmin only)
const assignAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminEmail } = req.body;

        if (!adminEmail) {
            return res.status(400).json({ error: 'Admin email is required' });
        }

        const organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });

        if (existingUser) {
            organization.claimAdmin(existingUser._id);
            global.logger.info(`Org admin reassigned: ${adminEmail} → ${organization.name}`);
        } else {
            organization.generateAdminInvitation(adminEmail);
            global.logger.info(`Org admin invitation sent: ${adminEmail} → ${organization.name}`);
        }

        await organization.save();
        await organization.populate('admin', 'firstName lastName email');

        res.json({
            success: true,
            organization,
            message: existingUser
                ? 'Admin assigned successfully'
                : 'Admin invitation created (pending registration)'
        });
    } catch (error) {
        global.logger.error('Assign admin error:', error);
        res.status(500).json({ error: 'Failed to assign admin' });
    }
};

// Delete organization (SuperAdmin only)
const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;

        const organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // TODO: Check for active events before deleting
        // For now, just delete
        await Organization.findByIdAndDelete(id);

        global.logger.info(`Organization deleted: ${organization.name} by SuperAdmin ${req.user.userId}`);

        res.json({ success: true, message: 'Organization deleted' });
    } catch (error) {
        global.logger.error('Delete organization error:', error);
        res.status(500).json({ error: 'Failed to delete organization' });
    }
};

module.exports = {
    getAllOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    assignAdmin,
    deleteOrganization
};