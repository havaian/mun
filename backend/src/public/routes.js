const express = require('express');
const router = express.Router();
const { Event } = require('../event/model');
const { Organization } = require('../organization/model');

// =============================================
// PUBLIC EVENT ENDPOINT — no auth required
// GET /api/public/events/:orgSlug/:eventSlug
// =============================================
router.get('/events/:orgSlug/:eventSlug', async (req, res) => {
    try {
        const { orgSlug, eventSlug } = req.params;

        // Find org by slug
        const org = await Organization.findOne({ slug: orgSlug }).select('_id name slug logo').lean();
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Find event by slug within that org — only return non-draft events
        const event = await Event.findOne({
            slug: eventSlug,
            organization: org._id,
            status: { $nin: ['draft'] }
        })
            .select('name slug description startDate endDate location status statistics organization')
            .populate('organization', 'name slug logo')
            .lean();

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ success: true, event });
    } catch (error) {
        global.logger.error('Public event lookup error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

module.exports = router;