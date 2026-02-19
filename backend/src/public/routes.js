const express = require('express');
const router = express.Router();
const { Event } = require('../event/model');
const { Organization } = require('../organization/model');
const { RegistrationForm } = require('../registration/form/model');
const { Committee } = require('../committee/model');

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
            .select('name slug description location logo startDate endDate status statistics organization')
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

// =============================================
// PUBLIC REGISTRATION FORM — no auth required
// GET /api/public/events/:orgSlug/:eventSlug/registration
// Returns form structure + committees for the registration page
// =============================================
router.get('/events/:orgSlug/:eventSlug/registration', async (req, res) => {
    try {
        const { orgSlug, eventSlug } = req.params;

        // Find org by slug
        const org = await Organization.findOne({ slug: orgSlug }).select('_id').lean();
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Find event — must be in registration_open status
        const event = await Event.findOne({
            slug: eventSlug,
            organization: org._id,
            status: 'registration_open'
        }).select('_id name').lean();

        if (!event) {
            return res.status(404).json({ error: 'Registration is not currently open for this event' });
        }

        // Get active form
        const form = await RegistrationForm.findOne({ event: event._id, status: 'active' })
            .select('committeePreferenceCount customFields autoFilledFields')
            .lean();

        if (!form) {
            return res.status(404).json({ error: 'Registration form is not available' });
        }

        // Get committees for preference selection
        const committees = await Committee.find({ event: event._id })
            .select('name acronym type topic language')
            .lean();

        res.json({
            success: true,
            form,
            committees,
            event: { _id: event._id, name: event.name }
        });
    } catch (error) {
        global.logger.error('Public registration form error:', error);
        res.status(500).json({ error: 'Failed to fetch registration form' });
    }
});

module.exports = router;