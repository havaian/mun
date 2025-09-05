const { ProceduralMotion, Question } = require('./model');
const { Committee } = require('../committee/model');
const { Session } = require('../session/model');
const { User } = require('../auth/model');
const logger = require('../utils/logger');
const { emitToRoom, emitToUser } = require('../websocket/socketManager');

// Procedural Motion Controllers

// Submit procedural motion (delegates)
const submitMotion = async (req, res) => {
    try {
        const {
            sessionId,
            committeeId,
            motionType,
            text,
            justification,
            purpose,
            parameters
        } = req.body;

        // Verify session and committee
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        // Check if session is active
        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is not active' });
        }

        // Create motion
        const motion = new ProceduralMotion({
            sessionId,
            committeeId,
            authorEmail: req.user.email,
            authorCountry: req.user.countryName,
            motionType,
            text: text.trim(),
            justification: justification?.trim(),
            purpose: purpose?.trim(),
            parameters: {
                duration: parameters?.duration,
                speechTime: parameters?.speechTime,
                topic: parameters?.topic?.trim(),
                targetDelegate: parameters?.targetDelegate?.trim()
            }
        });

        // Auto-add author as first supporter
        motion.addSupport(req.user.countryName, req.user.email);

        await motion.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'motion-submitted', {
                motionId: motion._id,
                motionType: motion.motionType,
                authorCountry: motion.authorCountry,
                priority: motion.priority,
                text: motion.text,
                requiredSupport: motion.requiredSupport,
                currentSupport: motion.support.length,
                hasRequiredSupport: motion.hasRequiredSupport
            });

            // Notify presidium
            emitToRoom(req.app.locals.io, `presidium-${committeeId}`, 'motion-pending-review', {
                motionId: motion._id,
                motionType: motion.motionType,
                authorCountry: motion.authorCountry,
                submittedAt: motion.submittedAt
            });
        }

        logger.info(`Procedural motion submitted: ${motionType} by ${req.user.countryName} (${req.user.email})`);

        res.status(201).json({
            success: true,
            motion: formatMotionResponse(motion),
            message: 'Procedural motion submitted successfully'
        });

    } catch (error) {
        logger.error('Submit motion error:', error);
        res.status(500).json({ error: 'Failed to submit procedural motion' });
    }
};

// Submit motion by presidium
const submitPresidiumMotion = async (req, res) => {
    try {
        const {
            sessionId,
            committeeId,
            motionType,
            text,
            justification,
            purpose,
            parameters,
            priority
        } = req.body;

        // Verify session and committee
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Create presidium motion
        const motion = new ProceduralMotion({
            sessionId,
            committeeId,
            authorEmail: req.user.email,
            authorCountry: 'Presidium',
            submittedBy: 'presidium',
            presidiumAuthor: req.user.userId,
            motionType,
            priority: priority || 'highest', // Presidium motions typically high priority
            text: text.trim(),
            justification: justification?.trim(),
            purpose: purpose?.trim(),
            parameters: {
                duration: parameters?.duration,
                speechTime: parameters?.speechTime,
                topic: parameters?.topic?.trim(),
                targetDelegate: parameters?.targetDelegate?.trim()
            },
            requiredSupport: 0, // Presidium motions don't need support
            hasRequiredSupport: true,
            status: 'accepted' // Auto-accepted
        });

        await motion.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'presidium-motion-submitted', {
                motionId: motion._id,
                motionType: motion.motionType,
                priority: motion.priority,
                text: motion.text,
                submittedBy: req.user.username,
                autoAccepted: true
            });
        }

        logger.info(`Presidium motion submitted: ${motionType} by ${req.user.username} (${req.user.email})`);

        res.status(201).json({
            success: true,
            motion: formatMotionResponse(motion),
            message: 'Presidium motion submitted and auto-accepted'
        });

    } catch (error) {
        logger.error('Submit presidium motion error:', error);
        res.status(500).json({ error: 'Failed to submit presidium motion' });
    }
};

// Support motion (delegates)
const supportMotion = async (req, res) => {
    try {
        const { id } = req.params;

        const motion = await ProceduralMotion.findById(id);
        if (!motion) {
            return res.status(404).json({ error: 'Motion not found' });
        }

        if (motion.status !== 'submitted') {
            return res.status(400).json({ error: 'Motion is no longer accepting support' });
        }

        // Check if already supported
        const existingSupport = motion.support.find(s => s.email === req.user.email);
        if (existingSupport) {
            return res.status(400).json({ error: 'You have already supported this motion' });
        }

        // Add support
        motion.addSupport(req.user.countryName, req.user.email);
        await motion.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${motion.committeeId}`, 'motion-supported', {
                motionId: motion._id,
                supporterCountry: req.user.countryName,
                currentSupport: motion.support.length,
                requiredSupport: motion.requiredSupport,
                hasRequiredSupport: motion.hasRequiredSupport
            });

            // If now has required support, notify presidium
            if (motion.hasRequiredSupport) {
                emitToRoom(req.app.locals.io, `presidium-${motion.committeeId}`, 'motion-ready-for-review', {
                    motionId: motion._id,
                    motionType: motion.motionType,
                    authorCountry: motion.authorCountry
                });
            }
        }

        logger.info(`Motion supported: ${motion._id} by ${req.user.countryName}`);

        res.json({
            success: true,
            motion: formatMotionResponse(motion),
            message: 'Motion supported successfully'
        });

    } catch (error) {
        logger.error('Support motion error:', error);
        res.status(500).json({ error: error.message || 'Failed to support motion' });
    }
};

// Review motion (presidium)
const reviewMotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, comments, newPriority } = req.body;

        const motion = await ProceduralMotion.findById(id);
        if (!motion) {
            return res.status(404).json({ error: 'Motion not found' });
        }

        if (motion.status !== 'submitted') {
            return res.status(400).json({ error: 'Motion has already been reviewed' });
        }

        // Check if motion has required support (for delegate motions)
        if (motion.submittedBy === 'delegate' && !motion.hasRequiredSupport) {
            return res.status(400).json({
                error: 'Motion does not have required support',
                currentSupport: motion.support.length,
                requiredSupport: motion.requiredSupport
            });
        }

        // Update motion status
        motion.status = action === 'accept' ? 'accepted' : 'rejected';
        motion.presidiumDecision = {
            action,
            comments: comments?.trim(),
            decidedBy: req.user.userId,
            newPriority
        };

        if (newPriority && action === 'modify_order') {
            motion.priority = newPriority;
        }

        motion.processedAt = new Date();
        await motion.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${motion.committeeId}`, 'motion-reviewed', {
                motionId: motion._id,
                decision: action,
                comments,
                reviewedBy: req.user.username,
                motionType: motion.motionType,
                authorCountry: motion.authorCountry
            });

            // Notify motion author
            emitToUser(req.app.locals.io, motion.authorEmail, 'motion-decision', {
                motionId: motion._id,
                decision: action,
                comments,
                motionType: motion.motionType
            });
        }

        logger.info(`Motion reviewed: ${motion._id} - ${action.toUpperCase()} by ${req.user.username}`);

        res.json({
            success: true,
            motion: formatMotionResponse(motion),
            message: `Motion ${action}ed successfully`
        });

    } catch (error) {
        logger.error('Review motion error:', error);
        res.status(500).json({ error: 'Failed to review motion' });
    }
};

// Get motions for session
const getSessionMotions = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const {
            status = 'all',
            priority = 'all',
            page = 1,
            limit = 20
        } = req.query;

        const filter = { sessionId };

        if (status !== 'all') {
            filter.status = status;
        }

        if (priority !== 'all') {
            filter.priority = priority;
        }

        const skip = (page - 1) * limit;

        // Sort by priority then by submission time
        const priorityOrder = { 'highest': 1, 'procedural': 2, 'debate': 3 };

        const motions = await ProceduralMotion.find(filter)
            .populate('presidiumDecision.decidedBy', 'username')
            .sort({
                status: 1, // Pending first
                priority: 1, // Higher priority first (based on enum order)
                submittedAt: 1 // Earlier submissions first
            })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ProceduralMotion.countDocuments(filter);

        const motionsData = motions.map(motion => formatMotionResponse(motion));

        res.json({
            success: true,
            motions: motionsData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        logger.error('Get session motions error:', error);
        res.status(500).json({ error: 'Failed to get session motions' });
    }
};

// Question Controllers

// Submit question (delegates)
const submitQuestion = async (req, res) => {
    try {
        const {
            sessionId,
            committeeId,
            questionType,
            targetRole,
            targetCountry,
            text,
            context,
            rightOfReply
        } = req.body;

        // Verify session
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is not active' });
        }

        // Create question
        const question = new Question({
            sessionId,
            committeeId,
            authorEmail: req.user.email,
            authorCountry: req.user.countryName,
            questionType,
            targetRole,
            targetCountry,
            text: text.trim(),
            context: context?.trim(),
            rightOfReply: rightOfReply ? {
                targetStatement: rightOfReply.targetStatement?.trim(),
                targetSpeaker: rightOfReply.targetSpeaker?.trim(),
                timeAllocated: rightOfReply.timeAllocated || 60
            } : undefined
        });

        await question.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'question-submitted', {
                questionId: question._id,
                questionType: question.questionType,
                authorCountry: question.authorCountry,
                targetRole: question.targetRole,
                targetCountry: question.targetCountry,
                priority: question.priority
            });

            // Notify presidium for review
            emitToRoom(req.app.locals.io, `presidium-${committeeId}`, 'question-pending-review', {
                questionId: question._id,
                questionType: question.questionType,
                authorCountry: question.authorCountry,
                submittedAt: question.submittedAt
            });
        }

        logger.info(`Question submitted: ${questionType} by ${req.user.countryName} (${req.user.email})`);

        res.status(201).json({
            success: true,
            question: formatQuestionResponse(question),
            message: 'Question submitted successfully'
        });

    } catch (error) {
        logger.error('Submit question error:', error);
        res.status(500).json({ error: 'Failed to submit question' });
    }
};

// Answer question (presidium or target)
const answerQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseText, responseType = 'oral' } = req.body;

        const question = await Question.findById(id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        if (question.status !== 'under_review' && question.status !== 'submitted') {
            return res.status(400).json({ error: 'Question cannot be answered in current status' });
        }

        // Update question with response
        question.response = {
            respondedBy: req.user.userId,
            responseText: responseText.trim(),
            responseType
        };
        question.status = 'answered';
        question.processedAt = new Date();

        await question.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${question.committeeId}`, 'question-answered', {
                questionId: question._id,
                questionType: question.questionType,
                authorCountry: question.authorCountry,
                respondedBy: req.user.username || req.user.countryName,
                responseType
            });

            // Notify question author
            emitToUser(req.app.locals.io, question.authorEmail, 'question-response', {
                questionId: question._id,
                responseText,
                responseType,
                respondedBy: req.user.username || req.user.countryName
            });
        }

        logger.info(`Question answered: ${question._id} by ${req.user.email}`);

        res.json({
            success: true,
            question: formatQuestionResponse(question),
            message: 'Question answered successfully'
        });

    } catch (error) {
        logger.error('Answer question error:', error);
        res.status(500).json({ error: 'Failed to answer question' });
    }
};

// Get questions for session
const getSessionQuestions = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const {
            status = 'all',
            questionType = 'all',
            page = 1,
            limit = 20
        } = req.query;

        const filter = { sessionId };

        if (status !== 'all') {
            filter.status = status;
        }

        if (questionType !== 'all') {
            filter.questionType = questionType;
        }

        const skip = (page - 1) * limit;

        const questions = await Question.find(filter)
            .populate('response.respondedBy', 'username')
            .sort({
                status: 1, // Pending first
                priority: 1, // Higher priority first
                submittedAt: 1 // Earlier submissions first
            })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Question.countDocuments(filter);

        const questionsData = questions.map(question => formatQuestionResponse(question));

        res.json({
            success: true,
            questions: questionsData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        logger.error('Get session questions error:', error);
        res.status(500).json({ error: 'Failed to get session questions' });
    }
};

// Helper functions
const formatMotionResponse = (motion) => {
    return {
        _id: motion._id,
        motionType: motion.motionType,
        priority: motion.priority,
        text: motion.text,
        justification: motion.justification,
        purpose: motion.purpose,
        parameters: motion.parameters,
        authorCountry: motion.authorCountry,
        submittedBy: motion.submittedBy,
        support: motion.support.map(s => ({
            country: s.country,
            supportedAt: s.supportedAt
        })),
        requiredSupport: motion.requiredSupport,
        hasRequiredSupport: motion.hasRequiredSupport,
        status: motion.status,
        presidiumDecision: motion.presidiumDecision,
        votingResult: motion.votingResult,
        submittedAt: motion.submittedAt,
        processedAt: motion.processedAt
    };
};

const formatQuestionResponse = (question) => {
    return {
        _id: question._id,
        questionType: question.questionType,
        priority: question.priority,
        text: question.text,
        context: question.context,
        authorCountry: question.authorCountry,
        targetRole: question.targetRole,
        targetCountry: question.targetCountry,
        rightOfReply: question.rightOfReply,
        status: question.status,
        response: question.response,
        submittedAt: question.submittedAt,
        processedAt: question.processedAt
    };
};

module.exports = {
    submitMotion,
    submitPresidiumMotion,
    supportMotion,
    reviewMotion,
    getSessionMotions,
    submitQuestion,
    answerQuestion,
    getSessionQuestions
};