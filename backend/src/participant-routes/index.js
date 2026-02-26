// backend/src/participant-routes/index.js
// =============================================
// Participant-scoped API routes
// Mounted at: /api/p
//
// These routes mirror the org-scoped committee routes but
// use eventId only (no orgId in URL). Designed for users
// who have an EventParticipant record but are NOT org members.
//
// The resolveEventById middleware resolves the org from the event,
// then resolveParticipant checks the user's EventParticipant record.
// =============================================

const express = require('express');
const router = express.Router({ mergeParams: true });

// =============================================
// EVENT INFO — /api/p/events/:eventId
// Basic event info for participant context
// =============================================
router.get('/events/:eventId',
    global.auth.token,
    global.auth.eventById('eventId'),
    async (req, res) => {
        try {
            const { Event } = require('../event/model');
            const event = await Event.findById(req.params.eventId)
                .select('name slug description location startDate endDate timezone status organization')
                .populate('organization', 'name slug logo')
                .lean();

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.json({ success: true, event });
        } catch (error) {
            global.logger.error('Participant event fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch event' });
        }
    }
);

// =============================================
// MY PARTICIPATION — /api/p/events/:eventId/me
// Get the current user's participation info for this event
// =============================================
router.get('/events/:eventId/me',
    global.auth.token,
    global.auth.eventById('eventId'),
    async (req, res) => {
        try {
            const { EventParticipant } = require('../participant/model');

            const participations = await EventParticipant.find({
                user: req.user.userId,
                event: req.params.eventId,
                status: 'active'
            })
                .populate('committee', 'name acronym type topic countries')
                .lean();

            res.json({ success: true, participations });
        } catch (error) {
            global.logger.error('Participant me fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch participation' });
        }
    }
);

// =============================================
// COMMITTEE INFO — /api/p/events/:eventId/committees/:committeeId
// Get committee details (any participant in that committee)
// =============================================
router.get('/events/:eventId/committees/:committeeId',
    global.auth.token,
    global.auth.eventById('eventId'),
    global.auth.participant('committeeId'),
    async (req, res) => {
        try {
            const { Committee } = require('../committee/model');
            const committee = await Committee.findById(req.params.committeeId)
                .lean();

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            res.json({ success: true, committee });
        } catch (error) {
            global.logger.error('Participant committee fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch committee' });
        }
    }
);

// =============================================
// COMMITTEE PARTICIPANTS — /api/p/events/:eventId/committees/:committeeId/participants
// List participants in this committee (any participant can see)
// =============================================
router.get('/events/:eventId/committees/:committeeId/participants',
    global.auth.token,
    global.auth.eventById('eventId'),
    global.auth.participant('committeeId'),
    async (req, res) => {
        try {
            const { EventParticipant } = require('../participant/model');
            const participants = await EventParticipant.find({
                event: req.params.eventId,
                committee: req.params.committeeId,
                status: 'active'
            })
                .populate('user', 'firstName lastName email institution avatar')
                .select('user role country status')
                .lean();

            res.json({ success: true, participants });
        } catch (error) {
            global.logger.error('Participant list fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch participants' });
        }
    }
);

// =============================================
// COMMITTEE-SCOPED MODULE PROXIES
// Mount existing route handlers with participant-scoped middleware
// =============================================

const committeeBase = '/events/:eventId/committees/:committeeId';

// Sessions
router.use(`${committeeBase}/sessions`, require('../session/routes'));

// Documents
router.use(`${committeeBase}/documents`, require('../document/routes'));

// Resolutions
router.use(`${committeeBase}/resolutions`, require('../resolution/routes'));

// Voting
router.use(`${committeeBase}/voting`, require('../voting/routes'));

// Messaging
router.use(`${committeeBase}/messages`, require('../messaging/routes'));

// Statistics
router.use(`${committeeBase}/statistics`, require('../statistics/routes'));

// Presentation
router.use(`${committeeBase}/presentation`, require('../presentation/routes'));

// Timers
router.use(`${committeeBase}/timers`, require('../timer/routes'));

// Procedure (motions, speakers list)
router.use(`${committeeBase}/procedure`, require('../procedure/routes'));

// Export
router.use(`${committeeBase}/export`, require('../export/routes'));

// Registration — committee-scoped application review (presidium)
router.use(`${committeeBase}/registration`, require('../registration/routes'));

module.exports = router;