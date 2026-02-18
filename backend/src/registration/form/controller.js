const { RegistrationForm, PIPELINE_STAGES, FIELD_TYPES } = require('./model');
const { Event } = require('../../event/model');

// Get registration form for an event
const getForm = async (req, res) => {
    try {
        const { eventId } = req.params;

        const form = await RegistrationForm.findOne({ event: eventId })
            .populate('createdBy', 'firstName lastName email')
            .lean();

        if (!form) {
            return res.status(404).json({ error: 'Registration form not found for this event' });
        }

        res.json({ success: true, form });
    } catch (error) {
        global.logger.error('Get registration form error:', error);
        res.status(500).json({ error: 'Failed to fetch registration form' });
    }
};

// Create or update registration form for an event
const upsertForm = async (req, res) => {
    try {
        const { eventId } = req.params;
        const {
            committeePreferenceCount,
            pipelineStages,
            customFields,
            autoFilledFields,
            deadline,
            status
        } = req.body;

        // Validate event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Validate custom fields if provided
        if (customFields) {
            for (const field of customFields) {
                if (!field.fieldId || !field.label || !field.type) {
                    return res.status(400).json({
                        error: 'Each custom field requires fieldId, label, and type'
                    });
                }
                if (!FIELD_TYPES.includes(field.type)) {
                    return res.status(400).json({
                        error: `Invalid field type: ${field.type}. Must be one of: ${FIELD_TYPES.join(', ')}`
                    });
                }
                if (field.type === 'select' && (!field.options || field.options.length < 2)) {
                    return res.status(400).json({
                        error: `Select field "${field.label}" must have at least 2 options`
                    });
                }
            }
        }

        // Validate pipeline stages if provided
        if (pipelineStages) {
            for (const stage of pipelineStages) {
                if (!PIPELINE_STAGES.includes(stag)) {
                    return res.status(400).json({
                        error: `Invalid pipeline stage: ${stage.stage}. Must be one of: ${PIPELINE_STAGES.join(', ')}`
                    });
                }
            }
        }

        let form = await RegistrationForm.findOne({ event: eventId });

        if (form) {
            // Update existing
            if (committeePreferenceCount !== undefined) form.committeePreferenceCount = committeePreferenceCount;
            if (pipelineStages !== undefined) form.pipelineStages = pipelineStages;
            if (customFields !== undefined) form.customFields = customFields;
            if (autoFilledFields !== undefined) form.autoFilledFields = autoFilledFields;
            if (status !== undefined) form.status = status;

            await form.save();

            global.logger.info(`Registration form updated for event ${eventId}`);
        } else {
            // Create new
            form = new RegistrationForm({
                event: eventId,
                committeePreferenceCount: committeePreferenceCount || 3,
                pipelineStages: pipelineStages || [
                    { stage: 'form_review', order: 1, isActive: true },
                    { stage: 'final_decision', order: 2, isActive: true }
                ],
                customFields: customFields || [],
                autoFilledFields: autoFilledFields || ['firstName', 'lastName', 'dateOfBirth', 'email', 'institution', 'phone'],
                deadline: deadline,
                createdBy: req.user.userId,
                status: status || 'draft'
            });

            await form.save();

            global.logger.info(`Registration form created for event ${eventId}`);
        }

        await form.populate('createdBy', 'firstName lastName email');

        res.json({
            success: true,
            form,
            message: form.isNew ? 'Form created' : 'Form updated'
        });
    } catch (error) {
        global.logger.error('Upsert registration form error:', error);
        res.status(500).json({ error: 'Failed to save registration form' });
    }
};

// Get public form info (for applicants — only when form is active)
const getPublicForm = async (req, res) => {
    try {
        const { eventId } = req.params;

        const form = await RegistrationForm.findOne({ event: eventId, status: 'active' })
            .select('committeePreferenceCount customFields autoFilledFields')
            .lean();

        if (!form) {
            return res.status(404).json({ error: 'Registration is not currently open for this event' });
        }

        // Also fetch available committees for preference selection
        const { Committee } = require('../committee/model');
        const committees = await Committee.find({ event: eventId })
            .select('name acronym type topic language')
            .lean();

        res.json({
            success: true,
            form,
            committees
        });
    } catch (error) {
        global.logger.error('Get public form error:', error);
        res.status(500).json({ error: 'Failed to fetch registration form' });
    }
};

// Get available field types and pipeline stages (utility for form builder)
const getFormOptions = (req, res) => {
    res.json({
        success: true,
        fieldTypes: FIELD_TYPES,
        pipelineStages: PIPELINE_STAGES.map(key => ({
            key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        }))
    });
};

module.exports = {
    getForm,
    upsertForm,
    getPublicForm,
    getFormOptions
};