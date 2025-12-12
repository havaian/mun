const Session = require('./model')
const { Committee } = require('../committee/model')

/**
 * Helper to save session with partial validation
 */
const saveSession = (session) => session.save({ validateModifiedOnly: true })

/**
 * Create new session
 */
exports.createSession = async (req, res) => {
    try {
        const { committeeId, initialMode, speechTime, questionsAllowed, autoStart } = req.body

        const committee = await Committee.findById(committeeId)
        if (!committee) {
            return res.status(404).json({
                success: false,
                error: 'Committee not found'
            })
        }

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

        const lastSession = await Session.findOne({ committeeId }).sort('-sessionNumber')
        const nextSessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1

        const session = new Session({
            committeeId,
            sessionNumber: nextSessionNumber,
            currentMode: initialMode || 'formal',
            modeSettings: {
                speechTime: speechTime || 180,
                questionsAllowed: questionsAllowed !== undefined ? questionsAllowed : true
            },
            status: autoStart ? 'active' : 'inactive',
            createdBy: req.user?._id
        })

        session.initializeTimers(session.currentMode)
        await saveSession(session)

        if (req.io) {
            req.io.to(`committee-${committeeId}`).emit('session-created', {
                session: session.toObject(),
                timestamp: new Date()
            })
        }

        res.status(201).json({
            success: true,
            session: session.toObject()
        })

    } catch (error) {
        global.logger.error('Create session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create session'
        })
    }
}

/**
 * Start session
 */
exports.startSession = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.status = 'active'
        session.startedAt = new Date()
        await saveSession(session)

        if (req.io) {
            req.io.to(`committee-${session.committeeId}`).emit('session-started', {
                sessionId: session._id.toString(),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            session: session.toObject()
        })

    } catch (error) {
        global.logger.error('Start session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start session'
        })
    }
}

/**
 * End session
 */
exports.endSession = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.status = 'completed'
        session.endedAt = new Date()

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

        await saveSession(session)

        if (req.io) {
            req.io.to(`committee-${session.committeeId}`).emit('session-ended', {
                sessionId: session._id.toString(),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            session: session.toObject()
        })

    } catch (error) {
        global.logger.error('End session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to end session'
        })
    }
}

/**
 * Get session by ID
 */
exports.getSession = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)
            .populate('committeeId', 'name countries')

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        const sessionObj = session.toObject()
        sessionObj.timers = session.getAllTimerStates()

        res.json({
            success: true,
            session: sessionObj
        })

    } catch (error) {
        global.logger.error('Get session error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch session'
        })
    }
}

/**
 * Get all sessions for committee
 */
exports.getCommitteeSessions = async (req, res) => {
    try {
        const { committeeId } = req.params
        const { status, page, limit } = req.query

        const query = { committeeId }
        if (status) query.status = status

        const sessions = await Session.find(query)
            .sort('-sessionNumber')
            .skip((parseInt(page) - 1 || 0) * (parseInt(limit) || 20))
            .limit(parseInt(limit) || 20)
            .populate('committeeId', 'name')

        const total = await Session.countDocuments(query)

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
        global.logger.error('Get sessions error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch sessions'
        })
    }
}

/**
 * Change session mode
 */
exports.changeMode = async (req, res) => {
    try {
        const { id } = req.params
        const { mode, settings } = req.body

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.currentMode = mode
        session.modeSettings = settings || {}
        session.initializeTimers(mode)

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('mode-changed', {
                sessionId: id,
                mode: mode,
                timers: session.getAllTimerStates(),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('mode-changed', {
                sessionId: id,
                mode: mode,
                timers: session.getAllTimerStates(),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            currentMode: session.currentMode,
            timers: session.getAllTimerStates()
        })

    } catch (error) {
        global.logger.error('Change mode error:', error)
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
        const { id } = req.params
        const { timeLimit } = req.body

        const session = await Session.findById(id).populate('committeeId', 'countries')

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

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('roll-call-started', {
                sessionId: id,
                timeLimit: timeLimit || 10,
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('roll-call-started', {
                sessionId: id,
                timeLimit: timeLimit || 10,
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            rollCall: session.rollCall
        })

    } catch (error) {
        global.logger.error('Start roll call error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start roll call'
        })
    }
}

/**
 * Mark attendance - handles both roll call and late arrivals
 */
exports.markAttendance = async (req, res) => {
    try {
        const { id } = req.params
        const { country, status } = req.body

        const session = await Session.findById(id).populate('committeeId', 'countries')
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        // Check if presidium is marking attendance
        const isPresidium = req.user?.role === 'presidium' || req.user?.role === 'admin'
        
        // CASE 1: Roll call is active - standard attendance marking (delegates + presidium)
        if (session.rollCall?.isActive) {
            const existing = session.rollCall.responses.find(r => r.country === country)
            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Country has already responded to roll call'
                })
            }

            session.rollCall.responses.push({
                country,
                status,
                respondedAt: new Date()
            })

            await saveSession(session)

            if (req.io) {
                req.io.to(`session-${id}`).emit('attendance-updated', {
                    sessionId: id,
                    country,
                    status,
                    totalResponses: session.rollCall.responses.length,
                    timestamp: new Date()
                })

                req.io.to(`committee-${session.committeeId}`).emit('attendance-updated', {
                    sessionId: id,
                    country,
                    status,
                    totalResponses: session.rollCall.responses.length,
                    timestamp: new Date()
                })
            }

            global.logger.info(`Attendance marked during roll call: ${country} - ${status}`)

            return res.json({
                success: true,
                response: { country, status },
                message: 'Attendance marked during roll call'
            })
        }

        // CASE 2: Roll call is not active - late arrival (presidium only)
        if (!isPresidium) {
            return res.status(403).json({
                success: false,
                error: 'Only presidium can mark attendance when roll call is not active'
            })
        }

        // Verify speaker lists are initialized
        if (!session.speakerLists?.present || !session.speakerLists?.absent) {
            return res.status(400).json({
                success: false,
                error: 'Speaker lists not initialized. Please complete roll call first.'
            })
        }

        // Check if country is already present
        const alreadyPresent = session.speakerLists.present.find(s => s.country === country)
        if (alreadyPresent) {
            return res.status(400).json({
                success: false,
                error: 'Country is already marked as present'
            })
        }

        // Find and remove from absent list
        const absentIndex = session.speakerLists.absent.findIndex(s => s.country === country)
        if (absentIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Country not found in absent list'
            })
        }

        const absentSpeaker = session.speakerLists.absent[absentIndex]
        session.speakerLists.absent.splice(absentIndex, 1)

        // Add to END of present list with arrivedLate flag
        const newPosition = session.speakerLists.present.length + 1
        session.speakerLists.present.push({
            country,
            position: newPosition,
            hasSpoken: false,
            hasMovedToEnd: false,
            arrivedLate: true,
            canVote: status === 'present_and_voting' // Track voting rights
        })

        // Update quorum
        if (status === 'present_and_voting') {
            const votingCount = session.speakerLists.present.filter(s => s.canVote).length
            const totalDelegates = session.quorum.total
            const requiredForQuorum = Math.floor(totalDelegates / 2) + 1

            session.quorum = {
                total: totalDelegates,
                present: session.speakerLists.present.length,
                voting: votingCount,
                required: requiredForQuorum,
                hasMet: votingCount >= requiredForQuorum
            }
        }

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('late-arrival-marked', {
                sessionId: id,
                country,
                status,
                speakerLists: session.speakerLists,
                quorum: session.quorum,
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('late-arrival-marked', {
                sessionId: id,
                country,
                status,
                speakerLists: session.speakerLists,
                quorum: session.quorum,
                timestamp: new Date()
            })
        }

        global.logger.info(`Late arrival marked: ${country} - ${status}`)

        return res.json({
            success: true,
            country,
            status,
            arrivedLate: true,
            speakerLists: session.speakerLists,
            quorum: session.quorum,
            message: 'Late arrival marked successfully. Country added to end of speaker list.'
        })

    } catch (error) {
        global.logger.error('Mark attendance error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to mark attendance'
        })
    }
}

/**
 * End roll call - creates alphabetically sorted speaker lists
 */
exports.endRollCall = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id).populate('committeeId', 'countries')

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

        // Get all country names from committee
        const allCountries = session.committeeId.countries?.map(c => c.name) || []
        
        // Build map of present countries with their voting status
        const presentCountriesMap = new Map()
        session.rollCall.responses
            .filter(r => r.status === 'present' || r.status === 'present_and_voting')
            .forEach(r => {
                presentCountriesMap.set(r.country, r.status === 'present_and_voting')
            })

        const presentCountries = Array.from(presentCountriesMap.keys())
        const absentCountries = allCountries.filter(c => !presentCountries.includes(c))

        // Sort ALPHABETICALLY for initial speaker list order
        presentCountries.sort((a, b) => a.localeCompare(b))
        absentCountries.sort((a, b) => a.localeCompare(b))

        // Create speaker lists with voting rights tracking
        session.speakerLists = {
            present: presentCountries.map((country, idx) => ({
                country,
                position: idx + 1,
                hasSpoken: false,
                hasMovedToEnd: false,
                arrivedLate: false,
                canVote: presentCountriesMap.get(country) // true if present_and_voting, false if just present
            })),
            absent: absentCountries.map((country, idx) => ({
                country,
                position: idx + 1,
                hasSpoken: false,
                hasMovedToEnd: false,
                arrivedLate: false,
                canVote: false // Absent delegates cannot vote
            }))
        }

        // Calculate quorum based ONLY on voting delegates (present_and_voting)
        const votingCount = session.speakerLists.present.filter(s => s.canVote).length
        const totalDelegates = allCountries.length
        const requiredForQuorum = Math.floor(totalDelegates / 2) + 1

        session.quorum = {
            total: totalDelegates,
            present: presentCountries.length,
            voting: votingCount, // Only present_and_voting count
            required: requiredForQuorum,
            hasMet: votingCount >= requiredForQuorum
        }

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('roll-call-ended', {
                sessionId: id,
                speakerLists: session.speakerLists,
                quorum: session.quorum,
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('roll-call-ended', {
                sessionId: id,
                speakerLists: session.speakerLists,
                quorum: session.quorum,
                timestamp: new Date()
            })
        }

        global.logger.info(`Roll call ended for session ${id}. Present: ${presentCountries.length}, Voting: ${votingCount}, Quorum: ${session.quorum.hasMet ? 'MET' : 'NOT MET'}`)

        res.json({
            success: true,
            speakerLists: session.speakerLists,
            quorum: session.quorum,
            message: `Roll call completed. ${presentCountries.length} present (${votingCount} voting). Quorum ${session.quorum.hasMet ? 'achieved' : 'not met'}.`
        })

    } catch (error) {
        global.logger.error('End roll call error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to end roll call'
        })
    }
}

/**
 * Start session timer
 */
exports.startSessionTimer = async (req, res) => {
    try {
        const { id } = req.params
        const { duration, purpose } = req.body

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        const timer = session.timers.session
        timer.totalDuration = duration
        timer.remainingTime = duration
        timer.isActive = true
        timer.isPaused = false
        timer.startedAt = new Date()
        timer.pausedAt = null
        timer.accumulatedPause = 0 // SECONDS
        timer.purpose = purpose || ''

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('timer-started', {
                sessionId: id,
                timerType: 'session',
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('timer-started', {
                sessionId: id,
                timerType: 'session',
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            timer: session.getCurrentTimerState(timer)
        })

    } catch (error) {
        global.logger.error('Start session timer error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start timer'
        })
    }
}

/**
 * Start debate timer
 */
exports.startDebateTimer = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        const timer = session.timers.debate
        timer.isActive = true
        timer.isPaused = false
        timer.startedAt = new Date()
        timer.pausedAt = null
        timer.accumulatedPause = 0 // SECONDS
        timer.remainingTime = timer.totalDuration

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('timer-started', {
                sessionId: id,
                timerType: 'debate',
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('timer-started', {
                sessionId: id,
                timerType: 'debate',
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            timer: session.getCurrentTimerState(timer)
        })

    } catch (error) {
        global.logger.error('Start debate timer error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start debate timer'
        })
    }
}

/**
 * Toggle timer (start/pause/resume) - FIXED pause calculation
 */
exports.toggleTimer = async (req, res) => {
    try {
        const { id } = req.params
        const { timerType, timerId } = req.body

        const session = await Session.findById(id)
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
            timer.accumulatedPause = 0 // SECONDS
            timer.remainingTime = timer.totalDuration
        } else if (timer.isPaused) {
            // Resume timer - ADD pause duration to accumulated
            timer.isPaused = false

            // CRITICAL FIX: Calculate pause duration in SECONDS
            const pauseDurationMs = now - new Date(timer.pausedAt)
            const pauseDurationSeconds = Math.floor(pauseDurationMs / 1000)
            timer.accumulatedPause += pauseDurationSeconds // Add to accumulated SECONDS

            timer.pausedAt = null
        } else {
            // Pause timer
            timer.isPaused = true
            timer.pausedAt = now

            // Update remaining time
            timer.remainingTime = session.getCurrentTimerState(timer).remainingTime
        }

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('timer-toggled', {
                sessionId: id,
                timerType,
                timerId,
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('timer-toggled', {
                sessionId: id,
                timerType,
                timerId,
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            timer: session.getCurrentTimerState(timer)
        })

    } catch (error) {
        global.logger.error('Toggle timer error:', error)
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
        const { id } = req.params
        const { timerType, timerId, newTime } = req.body

        const session = await Session.findById(id)
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
            const newStartTime = now.getTime() - (elapsedFromNewDuration * 1000) + (timer.accumulatedPause * 1000)
            timer.startedAt = new Date(newStartTime)
        } else {
            // Timer is paused or inactive - directly set remaining time
            timer.remainingTime = newTime
        }

        timer.totalDuration = newTime

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('timer-adjusted', {
                sessionId: id,
                timerType,
                timerId,
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('timer-adjusted', {
                sessionId: id,
                timerType,
                timerId,
                timer: session.getCurrentTimerState(timer),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            timer: session.getCurrentTimerState(timer)
        })

    } catch (error) {
        global.logger.error('Adjust timer error:', error)
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
        const { id } = req.params
        const { name, duration } = req.body

        const session = await Session.findById(id)
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
            accumulatedPause: 0 // SECONDS
        }

        session.timers.additional.push(newTimer)
        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('additional-timer-created', {
                sessionId: id,
                timers: session.getAllTimerStates(),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('additional-timer-created', {
                sessionId: id,
                timers: session.getAllTimerStates(),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            timers: session.getAllTimerStates()
        })

    } catch (error) {
        global.logger.error('Add additional timer error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add timer'
        })
    }
}

/**
 * Set current speaker
 */
exports.setCurrentSpeaker = async (req, res) => {
    try {
        const { id } = req.params
        const { country } = req.body

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        const speaker = session.speakerLists?.present?.find(s => s.country === country)
        if (!speaker) {
            return res.status(400).json({
                success: false,
                error: 'Speaker not found in present list'
            })
        }

        if (session.currentSpeaker?.country) {
            session.markSpeakerAsSpoken(session.currentSpeaker.country)
        }

        session.currentSpeaker = {
            country,
            startedAt: new Date()
        }

        const mode = session.currentMode
        if (mode === 'formal' || mode === 'moderated' || mode === 'informal') {
            const speakerTimer = session.timers.speaker

            speakerTimer.country = country
            speakerTimer.isActive = true
            speakerTimer.isPaused = false
            speakerTimer.startedAt = new Date()
            speakerTimer.pausedAt = null
            speakerTimer.accumulatedPause = 0 // SECONDS
            speakerTimer.remainingTime = speakerTimer.totalDuration
        }

        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('current-speaker-set', {
                sessionId: id,
                currentSpeaker: session.currentSpeaker,
                speakerLists: session.speakerLists,
                speakerTimer: session.getCurrentTimerState(session.timers.speaker),
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('current-speaker-set', {
                sessionId: id,
                currentSpeaker: session.currentSpeaker,
                speakerLists: session.speakerLists,
                speakerTimer: session.getCurrentTimerState(session.timers.speaker),
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            currentSpeaker: session.currentSpeaker,
            speakerLists: session.speakerLists,
            speakerTimer: session.getCurrentTimerState(session.timers.speaker)
        })

    } catch (error) {
        global.logger.error('Set current speaker error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to set speaker'
        })
    }
}

/**
 * Move speaker to end
 */
exports.moveToEnd = async (req, res) => {
    try {
        const { id } = req.params
        const { country } = req.body

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        session.moveSpeakerToEnd(country)
        await saveSession(session)

        if (req.io) {
            req.io.to(`session-${id}`).emit('speaker-moved', {
                sessionId: id,
                country,
                speakerLists: session.speakerLists,
                timestamp: new Date()
            })

            req.io.to(`committee-${session.committeeId}`).emit('speaker-moved', {
                sessionId: id,
                country,
                speakerLists: session.speakerLists,
                timestamp: new Date()
            })
        }

        res.json({
            success: true,
            speakerLists: session.speakerLists
        })

    } catch (error) {
        global.logger.error('Move speaker error:', error)
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to move speaker'
        })
    }
}

/**
 * Get next speaker
 */
exports.getNextSpeaker = async (req, res) => {
    try {
        const { id } = req.params

        const session = await Session.findById(id)
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            })
        }

        const nextSpeaker = session.getNextSpeaker()

        res.json({
            success: true,
            nextSpeaker
        })

    } catch (error) {
        global.logger.error('Get next speaker error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get next speaker'
        })
    }
}