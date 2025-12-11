const Session = require('./model') // Adjust path as needed
const Committee = require('../committee/model') // Adjust path as needed

/**
 * Create new session
 */
exports.createSession = async (req, res) => {
    try {
        const { committeeId, sessionNumber, currentMode, modeSettings } = req.body

        // Validate committee exists
        const committee = await Committee.findById(committeeId)
        if (!committee) {
            return res.status(404).json({
                success: false,
                error: 'Committee not found'
            })
        }

        // Check for existing active session
        const existingActive = await Session.findOne({
            committeeId,
            status: 'active'
        })

        if (existingActive) {
            return res.status(400).json({
                success: false,
                error: 'Committee already has an active session'
            })
        }

        // Get next session number if not provided
        let nextSessionNumber = sessionNumber
        if (!nextSessionNumber) {
            const lastSession = await Session.findOne({ committeeId })
                .sort('-sessionNumber')
            nextSessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1
        }

        // Create session
        const session = await Session.createSession({
            committeeId,
            sessionNumber: nextSessionNumber,
            currentMode: currentMode || 'formal',
            modeSettings: modeSettings || {},
            status: 'active',
            createdBy: req.user?._id
        })

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`committee-${committeeId}`).emit('session-created', {
                session: session.toObject()
            })
        }

        res.status(201).json({
            success: true,
            session: session.toObject()
        })

    } catch (error) {
        console.error('Create session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create session'
        })
    }
}

/**
 * Get all sessions for committee
 */
exports.getSessions = async (req, res) => {
    try {
        const { committeeId } = req.params
        const { status, page, limit, sort } = req.query

        const sessions = await Session.getCommitteeSessions(committeeId, {
            status,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            sort: sort || '-sessionNumber'
        })

        const total = await Session.countDocuments({
            committeeId,
            ...(status && { status })
        })

        res.json({
            success: true,
            sessions,
            pagination: {
                total,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20
            }
        })

    } catch (error) {
        console.error('Get sessions error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch sessions'
        })
    }
}

/**
 * Get session by ID
 */
exports.getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params

        const session = await Session.findById(sessionId)
            .populate('committeeId', 'name countries')

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        // Get real-time timer states
        const sessionObj = session.toObject()
        sessionObj.timers = session.getAllTimerStates()

        res.json({
            success: true,
            session: sessionObj
        })

    } catch (error) {
        console.error('Get session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch session'
        })
    }
}

/**
 * End session
 */
exports.endSession = async (req, res) => {
    try {
        const { sessionId } = req.params

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.status = 'completed'
        session.endedAt = new Date()

        // Stop all active timers
        if (session.timers) {
            ['session', 'speaker', 'debate', 'qa'].forEach(timerType => {
                if (session.timers[timerType]) {
                    session.timers[timerType].isActive = false
                    session.timers[timerType].isPaused = false
                }
            })

            if (session.timers.additional) {
                session.timers.additional.forEach(timer => {
                    timer.isActive = false
                    timer.isPaused = false
                })
            }
        }

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`committee-${session.committeeId}`).emit('session-ended', {
                sessionId: session._id.toString()
            })
        }

        res.json({
            success: true,
            session: session.toObject()
        })

    } catch (error) {
        console.error('End session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to end session'
        })
    }
}

/**
 * Change session mode
 */
exports.changeMode = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { mode, settings } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.currentMode = mode
        session.modeSettings = settings || {}

        // Reinitialize timers for new mode
        session.initializeTimers(mode)

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('mode-changed', {
                sessionId: sessionId,
                mode: mode,
                timers: session.getAllTimerStates()
            })
        }

        res.json({
            success: true,
            currentMode: session.currentMode,
            timers: session.getAllTimerStates()
        })

    } catch (error) {
        console.error('Change mode error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to change mode'
        })
    }
}

/**
 * Start roll call
 */
exports.startRollCall = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { timeLimit } = req.body

        const session = await Session.findById(sessionId)
            .populate('committeeId', 'countries')

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.rollCall = {
            isActive: true,
            startedAt: new Date(),
            responses: []
        }

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('roll-call-started', {
                sessionId: sessionId,
                timeLimit: timeLimit || 10
            })
        }

        res.json({
            success: true,
            rollCall: session.rollCall
        })

    } catch (error) {
        console.error('Start roll call error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start roll call'
        })
    }
}

/**
 * Submit roll call response (delegates call this)
 */
exports.submitRollCallResponse = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { country, status } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        if (!session.rollCall?.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Roll call is not active'
            })
        }

        // Check if already responded
        const existing = session.rollCall.responses.find(r => r.country === country)
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Country has already responded'
            })
        }

        // Add response
        session.rollCall.responses.push({
            country,
            status,
            respondedAt: new Date()
        })

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('roll-call-response', {
                sessionId: sessionId,
                country,
                status,
                totalResponses: session.rollCall.responses.length
            })
        }

        res.json({
            success: true,
            response: { country, status }
        })

    } catch (error) {
        console.error('Submit roll call response error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to submit response'
        })
    }
}

/**
 * End roll call and initialize speaker lists
 */
exports.endRollCall = async (req, res) => {
    try {
        const { sessionId } = req.params

        const session = await Session.findById(sessionId)
            .populate('committeeId', 'countries')

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        if (!session.rollCall?.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Roll call is not active'
            })
        }

        session.rollCall.isActive = false
        session.rollCall.endedAt = new Date()

        // Initialize speaker lists based on responses
        const allCountries = session.committeeId.countries || []
        const presentCountries = session.rollCall.responses
            .filter(r => r.status === 'present' || r.status === 'present-voting')
            .map(r => r.country)

        const absentCountries = allCountries.filter(c => !presentCountries.includes(c))

        session.speakerLists = {
            present: presentCountries.map((country, idx) => ({
                country,
                position: idx + 1,
                hasSpoken: false,
                hasMovedToEnd: false,
                arrivedLate: false
            })),
            absent: absentCountries.map((country, idx) => ({
                country,
                position: idx + 1,
                hasSpoken: false,
                hasMovedToEnd: false,
                arrivedLate: false
            }))
        }

        // Calculate quorum
        session.calculateQuorum()

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('roll-call-ended', {
                sessionId: sessionId,
                speakerLists: session.speakerLists,
                quorum: session.quorum
            })
        }

        res.json({
            success: true,
            speakerLists: session.speakerLists,
            quorum: session.quorum
        })

    } catch (error) {
        console.error('End roll call error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to end roll call'
        })
    }
}

/**
 * Set current speaker
 */
exports.setCurrentSpeaker = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { country } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        // Verify speaker is in present list
        const speaker = session.speakerLists?.present?.find(s => s.country === country)
        if (!speaker) {
            return res.status(400).json({
                success: false,
                error: 'Speaker not found in present list'
            })
        }

        // Mark previous speaker as spoken
        if (session.currentSpeaker?.country) {
            session.markSpeakerAsSpoken(session.currentSpeaker.country)
        }

        // Set new current speaker
        session.currentSpeaker = {
            country,
            startedAt: new Date()
        }

        // Start speaker timer based on mode
        const mode = session.currentMode
        if (mode === 'formal' || mode === 'moderated' || mode === 'informal') {
            const speakerTimer = session.timers.speaker

            speakerTimer.country = country
            speakerTimer.isActive = true
            speakerTimer.isPaused = false
            speakerTimer.startedAt = new Date()
            speakerTimer.pausedAt = null
            speakerTimer.accumulatedPause = 0
            speakerTimer.remainingTime = speakerTimer.totalDuration
        }

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('current-speaker-set', {
                sessionId: sessionId,
                currentSpeaker: session.currentSpeaker,
                speakerLists: session.speakerLists,
                speakerTimer: session.getCurrentTimerState(session.timers.speaker)
            })
        }

        res.json({
            success: true,
            currentSpeaker: session.currentSpeaker,
            speakerLists: session.speakerLists,
            speakerTimer: session.getCurrentTimerState(session.timers.speaker)
        })

    } catch (error) {
        console.error('Set current speaker error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to set speaker'
        })
    }
}

/**
 * Move speaker to end
 */
exports.moveSpeakerToEnd = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { country } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        // Move speaker to end
        session.moveSpeakerToEnd(country)
        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('speaker-moved', {
                sessionId: sessionId,
                country,
                speakerLists: session.speakerLists
            })
        }

        res.json({
            success: true,
            speakerLists: session.speakerLists
        })

    } catch (error) {
        console.error('Move speaker error:', error)
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to move speaker'
        })
    }
}

/**
 * Toggle timer (start/pause/resume)
 */
exports.toggleTimer = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { timerType, timerId } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        let timer
        if (timerType === 'additional') {
            timer = session.timers.additional.find(t => t._id.toString() === timerId)
        } else {
            timer = session.timers[timerType]
        }

        if (!timer) {
            return res.status(404).json({
                success: false,
                error: 'Timer not found'
            })
        }

        const now = new Date()

        if (!timer.isActive) {
            // Start timer
            timer.isActive = true
            timer.isPaused = false
            timer.startedAt = now
            timer.pausedAt = null
            timer.accumulatedPause = 0
            timer.remainingTime = timer.totalDuration
        } else if (timer.isPaused) {
            // Resume timer
            timer.isPaused = false

            // Calculate pause duration
            const pauseDuration = Math.floor((now - new Date(timer.pausedAt)) / 1000)
            timer.accumulatedPause += pauseDuration
            timer.pausedAt = null
        } else {
            // Pause timer
            timer.isPaused = true
            timer.pausedAt = now

            // Update remaining time
            timer.remainingTime = session.getCurrentTimerState(timer).remainingTime
        }

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('timer-toggled', {
                sessionId: sessionId,
                timerType,
                timer: session.getCurrentTimerState(timer)
            })
        }

        res.json({
            success: true,
            timer: session.getCurrentTimerState(timer)
        })

    } catch (error) {
        console.error('Toggle timer error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to toggle timer'
        })
    }
}

/**
 * Adjust timer duration
 */
exports.adjustTimer = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { timerType, timerId, newTime } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        let timer
        if (timerType === 'additional') {
            timer = session.timers.additional.find(t => t._id.toString() === timerId)
        } else {
            timer = session.timers[timerType]
        }

        if (!timer) {
            return res.status(404).json({
                success: false,
                error: 'Timer not found'
            })
        }

        const now = new Date()

        if (timer.isActive && !timer.isPaused) {
            // Timer is running - adjust startedAt to match new duration
            const elapsedFromNewDuration = timer.totalDuration - newTime
            timer.startedAt = new Date(now - (elapsedFromNewDuration * 1000) + (timer.accumulatedPause * 1000))
        } else {
            // Timer is paused or inactive - directly set remaining time
            timer.remainingTime = newTime
        }

        timer.totalDuration = newTime

        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('timer-adjusted', {
                sessionId: sessionId,
                timerType,
                timer: session.getCurrentTimerState(timer)
            })
        }

        res.json({
            success: true,
            timer: session.getCurrentTimerState(timer)
        })

    } catch (error) {
        console.error('Adjust timer error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to adjust timer'
        })
    }
}

/**
 * Add additional timer
 */
exports.addAdditionalTimer = async (req, res) => {
    try {
        const { sessionId } = req.params
        const { name, duration } = req.body

        const session = await Session.findById(sessionId)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        if (!session.timers.additional) {
            session.timers.additional = []
        }

        const newTimer = {
            name: name || 'Custom Timer',
            totalDuration: duration || 300,
            remainingTime: duration || 300,
            isActive: false,
            isPaused: false,
            startedAt: null,
            pausedAt: null,
            accumulatedPause: 0
        }

        session.timers.additional.push(newTimer)
        await session.save()

        // Emit WebSocket event
        if (req.io) {
            req.io.to(`session-${sessionId}`).emit('additional-timer-created', {
                sessionId: sessionId,
                timers: session.getAllTimerStates()
            })
        }

        res.json({
            success: true,
            timers: session.getAllTimerStates()
        })

    } catch (error) {
        console.error('Add additional timer error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add timer'
        })
    }
}

module.exports = exports