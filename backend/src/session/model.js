const mongoose = require('mongoose');

const timerSchema = new mongoose.Schema({
    totalDuration: { type: Number, default: 0 },
    remainingTime: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    isPaused: { type: Boolean, default: false },
    startedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    accumulatedPause: { type: Number, default: 0 }, // SECONDS of pause, NOT timestamp
    country: { type: String, default: '' },
    topic: { type: String, default: '' },
    purpose: { type: String, default: '' },
    name: { type: String, default: '' },
    debateType: { type: String, default: '' }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    sessionNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['inactive', 'active', 'paused', 'completed'],
        default: 'inactive'
    },
    currentMode: {
        type: String,
        enum: ['formal', 'moderated', 'unmoderated', 'informal'],
        default: 'formal'
    },
    modeSettings: {
        speechTime: { type: Number, default: 180 },
        totalTime: { type: Number, default: 600 },
        topic: { type: String, default: '' },
        questionsAllowed: { type: Boolean, default: true }
    },
    timers: {
        session: timerSchema,
        speaker: timerSchema,
        debate: timerSchema,
        qa: timerSchema,
        additional: [timerSchema]
    },
    rollCall: {
        isActive: { type: Boolean, default: false },
        startedAt: { type: Date },
        endedAt: { type: Date },
        responses: [{
            country: String,
            status: { type: String, enum: ['absent', 'present', 'present_and_voting'] },
            respondedAt: Date
        }]
    },
    speakerLists: {
        present: [{
            country: String,
            position: Number,
            hasSpoken: { type: Boolean, default: false },
            hasMovedToEnd: { type: Boolean, default: false },
            arrivedLate: { type: Boolean, default: false }
        }],
        absent: [{
            country: String,
            position: Number,
            hasSpoken: { type: Boolean, default: false },
            hasMovedToEnd: { type: Boolean, default: false },
            arrivedLate: { type: Boolean, default: false }
        }]
    },
    currentSpeaker: {
        country: { type: String, default: '' },
        startedAt: { type: Date }
    },
    quorum: {
        total: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        required: { type: Number, default: 0 },
        hasMet: { type: Boolean, default: false }
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// FIXED: Calculate current timer state from timestamps
sessionSchema.methods.getCurrentTimerState = function (timer) {
    if (!timer) return null;

    const now = new Date();

    // If timer is inactive or paused, return as-is
    if (!timer.isActive || timer.isPaused) {
        return {
            totalDuration: timer.totalDuration,
            remainingTime: timer.remainingTime,
            isActive: timer.isActive,
            isPaused: timer.isPaused,
            startedAt: timer.startedAt,
            pausedAt: timer.pausedAt,
            accumulatedPause: timer.accumulatedPause, // This should be duration in seconds
            country: timer.country || '',
            topic: timer.topic || '',
            purpose: timer.purpose || '',
            name: timer.name || '',
            debateType: timer.debateType || ''
        };
    }

    // Timer is active and running - calculate real-time remaining
    const elapsed = Math.floor((now - new Date(timer.startedAt)) / 1000); // seconds
    const pauseDuration = timer.accumulatedPause || 0; // seconds
    const actualElapsed = elapsed - pauseDuration;
    const remaining = Math.max(0, timer.totalDuration - actualElapsed);

    return {
        totalDuration: timer.totalDuration,
        remainingTime: remaining,
        isActive: timer.isActive,
        isPaused: timer.isPaused,
        startedAt: timer.startedAt,
        pausedAt: timer.pausedAt,
        accumulatedPause: pauseDuration,
        country: timer.country || '',
        topic: timer.topic || '',
        purpose: timer.purpose || '',
        name: timer.name || '',
        debateType: timer.debateType || ''
    };
};

// Get all timer states with real-time calculation
sessionSchema.methods.getAllTimerStates = function () {
    return {
        session: this.getCurrentTimerState(this.timers.session),
        speaker: this.getCurrentTimerState(this.timers.speaker),
        debate: this.getCurrentTimerState(this.timers.debate),
        qa: this.getCurrentTimerState(this.timers.qa),
        additional: (this.timers.additional || []).map(t => this.getCurrentTimerState(t))
    };
};

// Initialize timers based on mode
sessionSchema.methods.initializeTimers = function (mode) {
    const speechTime = this.modeSettings?.speechTime || 180;
    const totalTime = this.modeSettings?.totalTime || 600;

    // Session/Debate timer (always available)
    if (!this.timers.session) {
        this.timers.session = {};
    }
    this.timers.session.totalDuration = totalTime;
    this.timers.session.remainingTime = totalTime;
    this.timers.session.isActive = false;
    this.timers.session.isPaused = false;

    // Speaker presentation timer
    if (!this.timers.speaker) {
        this.timers.speaker = {};
    }
    this.timers.speaker.totalDuration = speechTime;
    this.timers.speaker.remainingTime = speechTime;
    this.timers.speaker.isActive = false;
    this.timers.speaker.isPaused = false;

    // Debate timer (for moderated/unmoderated)
    if (!this.timers.debate) {
        this.timers.debate = {};
    }
    this.timers.debate.totalDuration = totalTime;
    this.timers.debate.remainingTime = totalTime;
    this.timers.debate.isActive = false;
    this.timers.debate.isPaused = false;
    this.timers.debate.debateType = mode === 'moderated' ? 'moderated' : 'unmoderated';

    // Q&A timer (for formal/informal)
    if (!this.timers.qa) {
        this.timers.qa = {};
    }
    this.timers.qa.totalDuration = Math.floor(speechTime / 2);
    this.timers.qa.remainingTime = Math.floor(speechTime / 2);
    this.timers.qa.isActive = false;
    this.timers.qa.isPaused = false;

    // Initialize additional timers array
    if (!this.timers.additional) {
        this.timers.additional = [];
    }
};

// Calculate quorum
sessionSchema.methods.calculateQuorum = function () {
    const presentCount = this.speakerLists?.present?.length || 0;
    const absentCount = this.speakerLists?.absent?.length || 0;
    const total = presentCount + absentCount;
    const required = Math.floor(total / 2) + 1;

    this.quorum = {
        total,
        present: presentCount,
        required,
        hasMet: presentCount >= required
    };
};

// Check if quorum is met
sessionSchema.methods.hasQuorum = function () {
    return this.quorum?.hasMet || false;
};

// Get next speaker
sessionSchema.methods.getNextSpeaker = function () {
    const presentList = this.speakerLists?.present || [];
    const unspoken = presentList.filter(s => !s.hasSpoken);

    return unspoken.length > 0 ? unspoken[0] : null;
};

// Mark speaker as spoken
sessionSchema.methods.markSpeakerAsSpoken = function (country) {
    const presentList = this.speakerLists?.present || [];
    const speaker = presentList.find(s => s.country === country);

    if (speaker) {
        speaker.hasSpoken = true;
    }
};

// Move speaker to end
sessionSchema.methods.moveSpeakerToEnd = function (country) {
    const presentList = this.speakerLists?.present || [];
    const speakerIndex = presentList.findIndex(s => s.country === country);

    if (speakerIndex === -1) {
        throw new Error('Speaker not found in present list');
    }

    const speaker = presentList[speakerIndex];

    if (speaker.hasMovedToEnd) {
        throw new Error('Speaker has already moved to end once');
    }

    // Remove from current position
    presentList.splice(speakerIndex, 1);

    // Add to end
    speaker.hasMovedToEnd = true;
    speaker.position = presentList.length + 1;
    presentList.push(speaker);

    // Reorder positions
    presentList.forEach((s, idx) => {
        s.position = idx + 1;
    });
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;