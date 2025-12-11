const mongoose = require('mongoose')

// Timer Schema with timestamp fields
const timerSchema = new mongoose.Schema({
    totalDuration: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingTime: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isPaused: {
        type: Boolean,
        default: false
    },
    startedAt: {
        type: Date,
        default: null
    },
    pausedAt: {
        type: Date,
        default: null
    },
    accumulatedPause: {
        type: Number,
        default: 0
    },
    country: {
        type: String,
        default: ''
    },
    topic: {
        type: String,
        default: ''
    },
    purpose: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    }
}, { _id: false })

// Speaker Schema
const speakerSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },
    position: {
        type: Number,
        required: true
    },
    hasSpoken: {
        type: Boolean,
        default: false
    },
    hasMovedToEnd: {
        type: Boolean,
        default: false
    },
    arrivedLate: {
        type: Boolean,
        default: false
    }
}, { _id: false })

// Main Session Schema
const sessionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true,
        index: true
    },
    sessionNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed'],
        default: 'draft',
        index: true
    },
    currentMode: {
        type: String,
        enum: ['formal', 'moderated', 'unmoderated', 'informal'],
        default: 'formal'
    },
    modeSettings: {
        speechTime: Number,
        totalTime: Number,
        topic: String,
        questionsAllowed: Boolean,
        allowPassToNext: Boolean
    },

    // Timers
    timers: {
        session: timerSchema,
        speaker: timerSchema,
        debate: timerSchema,
        qa: timerSchema,
        additional: [timerSchema]
    },

    // Speaker Lists
    speakerLists: {
        present: [speakerSchema],
        absent: [speakerSchema]
    },

    // Current Speaker
    currentSpeaker: {
        country: String,
        startedAt: Date
    },

    // Roll Call
    rollCall: {
        isActive: {
            type: Boolean,
            default: false
        },
        startedAt: Date,
        endedAt: Date,
        responses: [{
            country: String,
            status: {
                type: String,
                enum: ['present', 'absent', 'present-voting']
            },
            respondedAt: Date
        }]
    },

    // Quorum
    quorum: {
        required: {
            type: Number,
            default: 0
        },
        present: {
            type: Number,
            default: 0
        },
        hasQuorum: {
            type: Boolean,
            default: false
        }
    },

    // Metadata
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: Date,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    notes: String
}, {
    timestamps: true
})

// Indexes
sessionSchema.index({ committeeId: 1, sessionNumber: 1 }, { unique: true })
sessionSchema.index({ status: 1, committeeId: 1 })
sessionSchema.index({ createdAt: -1 })

// Methods

/**
 * Get current state of a timer with real-time calculation
 */
sessionSchema.methods.getCurrentTimerState = function (timer) {
    if (!timer) return null

    // If timer is not active or is paused, return as-is
    if (!timer.isActive || timer.isPaused) {
        return timer.toObject ? timer.toObject() : timer
    }

    // Calculate real remaining time based on timestamp
    const now = new Date()
    const startedAt = new Date(timer.startedAt)
    const elapsedMs = now - startedAt
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    // Subtract accumulated pause time
    const pauseTime = timer.accumulatedPause || 0
    const actualElapsed = elapsedSeconds - pauseTime

    // Calculate remaining time
    const remainingTime = Math.max(0, timer.totalDuration - actualElapsed)

    const timerObj = timer.toObject ? timer.toObject() : { ...timer }
    timerObj.remainingTime = remainingTime

    return timerObj
}

/**
 * Get all timer states with real-time calculation
 */
sessionSchema.methods.getAllTimerStates = function () {
    return {
        session: this.getCurrentTimerState(this.timers?.session),
        speaker: this.getCurrentTimerState(this.timers?.speaker),
        debate: this.getCurrentTimerState(this.timers?.debate),
        qa: this.getCurrentTimerState(this.timers?.qa),
        additional: (this.timers?.additional || []).map(t => this.getCurrentTimerState(t))
    }
}

/**
 * Initialize default timers based on mode
 */
sessionSchema.methods.initializeTimers = function (mode) {
    const timers = {
        session: {
            totalDuration: 0,
            remainingTime: 0,
            isActive: false,
            isPaused: false,
            startedAt: null,
            pausedAt: null,
            accumulatedPause: 0
        },
        speaker: {
            totalDuration: 0,
            remainingTime: 0,
            isActive: false,
            isPaused: false,
            startedAt: null,
            pausedAt: null,
            accumulatedPause: 0,
            country: ''
        },
        debate: {
            totalDuration: 0,
            remainingTime: 0,
            isActive: false,
            isPaused: false,
            startedAt: null,
            pausedAt: null,
            accumulatedPause: 0
        },
        qa: {
            totalDuration: 0,
            remainingTime: 0,
            isActive: false,
            isPaused: false,
            startedAt: null,
            pausedAt: null,
            accumulatedPause: 0
        },
        additional: []
    }

    // Set default durations based on mode
    if (mode === 'formal') {
        timers.session.totalDuration = 3600 // 1 hour
        timers.session.remainingTime = 3600
        timers.speaker.totalDuration = 180 // 3 minutes
        timers.speaker.remainingTime = 180
        timers.qa.totalDuration = 120 // 2 minutes
        timers.qa.remainingTime = 120
    } else if (mode === 'moderated') {
        timers.debate.totalDuration = 600 // 10 minutes
        timers.debate.remainingTime = 600
        timers.speaker.totalDuration = 90 // 1.5 minutes
        timers.speaker.remainingTime = 90
    } else if (mode === 'unmoderated') {
        timers.debate.totalDuration = 600 // 10 minutes
        timers.debate.remainingTime = 600
    } else if (mode === 'informal') {
        timers.session.totalDuration = 3600 // 1 hour
        timers.session.remainingTime = 3600
        timers.speaker.totalDuration = 120 // 2 minutes
        timers.speaker.remainingTime = 120
        timers.qa.totalDuration = 60 // 1 minute
        timers.qa.remainingTime = 60
    }

    this.timers = timers
}

/**
 * Calculate quorum
 */
sessionSchema.methods.calculateQuorum = function () {
    const presentCount = this.speakerLists?.present?.length || 0
    const totalDelegates = presentCount + (this.speakerLists?.absent?.length || 0)

    const requiredForQuorum = Math.floor(totalDelegates / 2) + 1

    this.quorum = {
        required: requiredForQuorum,
        present: presentCount,
        hasQuorum: presentCount >= requiredForQuorum
    }

    return this.quorum
}

/**
 * Check if session has quorum
 */
sessionSchema.methods.hasQuorum = function () {
    return this.quorum?.hasQuorum || false
}

/**
 * Get next speaker in queue
 */
sessionSchema.methods.getNextSpeaker = function () {
    if (!this.speakerLists?.present || this.speakerLists.present.length === 0) {
        return null
    }

    // Find first speaker who hasn't spoken
    const nextSpeaker = this.speakerLists.present.find(speaker => !speaker.hasSpoken)
    return nextSpeaker || null
}

/**
 * Mark speaker as having spoken
 */
sessionSchema.methods.markSpeakerAsSpoken = function (country) {
    if (!this.speakerLists?.present) return false

    const speaker = this.speakerLists.present.find(s => s.country === country)
    if (speaker) {
        speaker.hasSpoken = true
        return true
    }

    return false
}

/**
 * Move speaker to end of queue
 */
sessionSchema.methods.moveSpeakerToEnd = function (country) {
    if (!this.speakerLists?.present) return false

    const speakerIndex = this.speakerLists.present.findIndex(s => s.country === country)
    if (speakerIndex === -1) return false

    const speaker = this.speakerLists.present[speakerIndex]

    // Check if already moved to end
    if (speaker.hasMovedToEnd) {
        throw new Error('Speaker has already moved to end once')
    }

    // Remove from current position
    this.speakerLists.present.splice(speakerIndex, 1)

    // Mark as moved to end
    speaker.hasMovedToEnd = true

    // Add to end
    this.speakerLists.present.push(speaker)

    // Recalculate positions
    this.speakerLists.present.forEach((s, idx) => {
        s.position = idx + 1
    })

    return true
}

// Statics

/**
 * Get active session for committee
 */
sessionSchema.statics.getActiveSession = async function (committeeId) {
    return await this.findOne({
        committeeId: committeeId,
        status: 'active'
    }).populate('committeeId', 'name countries')
}

/**
 * Get all sessions for committee
 */
sessionSchema.statics.getCommitteeSessions = async function (committeeId, options = {}) {
    const {
        status,
        page = 1,
        limit = 20,
        sort = '-sessionNumber'
    } = options

    const query = { committeeId }
    if (status) query.status = status

    const skip = (page - 1) * limit

    return await this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('committeeId', 'name')
}

/**
 * Create new session
 */
sessionSchema.statics.createSession = async function (sessionData) {
    const session = new this(sessionData)

    // Initialize timers based on mode
    session.initializeTimers(sessionData.currentMode || 'formal')

    // Set status to active if not specified
    if (!session.status) {
        session.status = 'active'
    }

    await session.save()
    return session
}

const Session = mongoose.model('Session', sessionSchema)

module.exports = Session