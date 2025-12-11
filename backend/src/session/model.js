const mongoose = require('mongoose');

// Complete MUN Session Model - FIXED VERSION
const sessionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Basic Session Info
    number: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },

    status: {
        type: String,
        enum: ['inactive', 'active', 'paused', 'completed'],
        default: 'inactive'
    },

    startedAt: Date,
    endedAt: Date,

    // COMPLETE TIMER HIERARCHY - All 4 types needed for MUN
    timers: {
        // Session timer - overall session duration
        session: {
            totalDuration: { type: Number, default: 0 },
            remainingTime: { type: Number, default: 0 },
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: Date,
            purpose: { type: String, default: 'Session management' }
        },

        // Debate timer - for moderated/unmoderated caucuses
        debate: {
            totalDuration: { type: Number, default: 0 },
            remainingTime: { type: Number, default: 0 },
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: Date,
            debateType: String, // 'moderated', 'unmoderated'
            topic: String
        },

        // Speaker timer - current speaker's time
        speaker: {
            totalDuration: { type: Number, default: 120 },
            remainingTime: { type: Number, default: 120 },
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: Date,
            country: String,
            canBeExtended: { type: Boolean, default: false }
        },

        // Additional timers (up to 6)
        additional: [{
            id: String,
            name: String,
            purpose: String,
            totalDuration: Number,
            remainingTime: Number,
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: Date
        }]
    },

    // Debate Mode System
    currentMode: {
        type: String,
        enum: ['formal', 'moderated', 'unmoderated', 'informal'],
        default: 'formal'
    },

    modeSettings: {
        // Used by all modes
        speechTime: { type: Number, default: 120 }, // seconds per speech

        // Formal debate specific
        questionsAllowed: { type: Boolean, default: false },
        questionTime: Number,

        // Moderated caucus specific
        topic: String,
        totalTime: Number, // max 20 min (1200 sec)

        // Informal specific
        allowPassToNext: { type: Boolean, default: true }
    },

    modeStartedAt: Date,

    modeHistory: [{
        mode: String,
        settings: mongoose.Schema.Types.Mixed,
        startedAt: Date,
        endedAt: Date,
        startedBy: {
            email: String,
            name: String,
            userId: mongoose.Schema.Types.ObjectId
        }
    }],

    // Roll Call System
    rollCall: {
        isActive: { type: Boolean, default: false },
        startedAt: Date,
        endedAt: Date,
        startedBy: mongoose.Schema.Types.ObjectId,
        timeLimit: Number
    },

    // Attendance - Simple present/absent
    attendance: [{
        country: { type: String, required: true },
        email: String,
        status: {
            type: String,
            enum: ['absent', 'present'],
            default: 'absent'
        },
        markedAt: Date,
        arrivedLate: { type: Boolean, default: false }
    }],

    // Quorum
    quorum: {
        required: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        hasQuorum: { type: Boolean, default: false },
        lastUpdated: Date
    },

    // TWO SPEAKER LISTS as per MUN rules
    speakerLists: {
        // Present delegates - alphabetically sorted, can move to end once
        present: [{
            country: String,
            email: String,
            position: Number,
            hasMovedToEnd: { type: Boolean, default: false }, // can only move once
            addedAt: Date,
            hasSpoken: { type: Boolean, default: false }
        }],

        // Absent delegates - waiting to arrive
        absent: [{
            country: String,
            email: String,
            position: Number,
            addedAt: Date
        }]
    },

    // Current speaker
    currentSpeaker: {
        country: String,
        email: String,
        startedAt: Date,
        canTakeQuestions: Boolean
    }
}, {
    timestamps: true
});

// Indexes
sessionSchema.index({ committeeId: 1, number: 1 }, { unique: true });
sessionSchema.index({ committeeId: 1, status: 1 });

// ==================== INITIALIZATION ====================

// Initialize session with committee countries
sessionSchema.methods.initialize = async function () {
    const Committee = mongoose.model('Committee');
    const committee = await Committee.findById(this.committeeId);

    if (!committee || !committee.countries) {
        throw new Error('Committee or countries not found');
    }

    // Initialize attendance for all countries
    this.attendance = committee.countries.map(c => ({
        country: c.name,
        email: c.email || '',
        status: 'absent',
        markedAt: new Date(),
        arrivedLate: false
    }));

    // Initialize absent speaker list (alphabetically)
    this.speakerLists.absent = committee.countries
        .map(c => ({
            country: c.name,
            email: c.email || '',
            position: 0,
            addedAt: new Date()
        }))
        .sort((a, b) => a.country.localeCompare(b.country))
        .map((speaker, index) => ({
            ...speaker,
            position: index + 1
        }));

    this.speakerLists.present = [];
    this.calculateQuorum();

    return this.save();
};

// ==================== ROLL CALL METHODS ====================

// Start roll call
sessionSchema.methods.startRollCall = function (startedBy, timeLimit = null) {
    this.rollCall = {
        isActive: true,
        startedAt: new Date(),
        startedBy: startedBy,
        timeLimit: timeLimit
    };

    return this.save();
};

// End roll call and initialize present speaker list
sessionSchema.methods.endRollCall = function () {
    this.rollCall.isActive = false;
    this.rollCall.endedAt = new Date();

    // Move all present delegates from absent list to present list
    const presentCountries = this.attendance
        .filter(a => a.status === 'present')
        .map(a => a.country);

    // Create present list alphabetically
    this.speakerLists.present = this.speakerLists.absent
        .filter(speaker => presentCountries.includes(speaker.country))
        .sort((a, b) => a.country.localeCompare(b.country))
        .map((speaker, index) => ({
            country: speaker.country,
            email: speaker.email,
            position: index + 1,
            hasMovedToEnd: false,
            addedAt: new Date(),
            hasSpoken: false
        }));

    // Keep only absent countries in absent list
    this.speakerLists.absent = this.speakerLists.absent
        .filter(speaker => !presentCountries.includes(speaker.country))
        .map((speaker, index) => ({
            ...speaker,
            position: index + 1
        }));

    this.calculateQuorum();
    return this.save();
};

// Mark attendance
sessionSchema.methods.markAttendance = function (country, status = 'present') {
    const att = this.attendance.find(a => a.country === country);
    if (!att) {
        throw new Error('Country not found in attendance');
    }

    const wasAbsent = att.status === 'absent';
    att.status = status;
    att.markedAt = new Date();

    // If arrived late (session already started and roll call ended)
    if (wasAbsent && this.status === 'active' && !this.rollCall.isActive) {
        att.arrivedLate = true;

        // Move from absent list to END of present list
        this.moveFromAbsentToPresent(country);
    }

    this.calculateQuorum();
    return this.save();
};

// Move country from absent to present (at the end)
sessionSchema.methods.moveFromAbsentToPresent = function (country) {
    const absentIndex = this.speakerLists.absent.findIndex(s => s.country === country);
    if (absentIndex === -1) return;

    const speaker = this.speakerLists.absent.splice(absentIndex, 1)[0];

    // Add to END of present list
    speaker.position = this.speakerLists.present.length + 1;
    speaker.hasMovedToEnd = false;
    speaker.hasSpoken = false;
    this.speakerLists.present.push(speaker);

    // Reorder absent positions
    this.speakerLists.absent.forEach((s, i) => {
        s.position = i + 1;
    });
};

// Calculate quorum
sessionSchema.methods.calculateQuorum = function () {
    const present = this.attendance.filter(a => a.status === 'present').length;
    const total = this.attendance.length;

    this.quorum = {
        required: Math.floor(total / 2) + 1,
        present: present,
        hasQuorum: present >= Math.floor(total / 2) + 1,
        lastUpdated: new Date()
    };
};

// ==================== SPEAKER METHODS ====================

// Move delegate to end of queue (can only do once)
sessionSchema.methods.moveToEndOfQueue = function (country) {
    const speaker = this.speakerLists.present.find(s => s.country === country);

    if (!speaker) {
        throw new Error(`${country} not found in present speakers list`);
    }

    if (speaker.hasMovedToEnd) {
        throw new Error(`${country} has already moved to end once`);
    }

    if (this.currentSpeaker?.country === country) {
        throw new Error(`Cannot move ${country} while they are speaking`);
    }

    // Remove from current position
    this.speakerLists.present = this.speakerLists.present.filter(s => s.country !== country);

    // Add to end
    speaker.hasMovedToEnd = true;
    speaker.position = this.speakerLists.present.length + 1;
    this.speakerLists.present.push(speaker);

    // Reorder positions
    this.speakerLists.present.forEach((s, i) => {
        s.position = i + 1;
    });

    return this.save();
};

// Set current speaker and start their timer
sessionSchema.methods.setCurrentSpeaker = function (country) {
    const speaker = this.speakerLists.present.find(s => s.country === country);

    if (!speaker) {
        throw new Error(`${country} not found in speakers list`);
    }

    // Mark previous speaker as having spoken
    if (this.currentSpeaker) {
        const prevSpeaker = this.speakerLists.present.find(
            s => s.country === this.currentSpeaker.country
        );
        if (prevSpeaker) {
            prevSpeaker.hasSpoken = true;
        }
    }

    // Set new current speaker
    this.currentSpeaker = {
        country: speaker.country,
        email: speaker.email,
        startedAt: new Date(),
        canTakeQuestions: this.modeSettings.questionsAllowed || false
    };

    // Start speaker timer
    const speechTime = this.modeSettings.speechTime || 120;
    this.timers.speaker = {
        totalDuration: speechTime,
        remainingTime: speechTime,
        isActive: true,
        isPaused: false,
        startedAt: new Date(),
        country: country,
        canBeExtended: this.modeSettings.questionsAllowed || false
    };

    return this.save();
};

// Get next speaker in queue
sessionSchema.methods.getNextSpeaker = function () {
    // Find first speaker who hasn't spoken
    const nextSpeaker = this.speakerLists.present.find(s => !s.hasSpoken);
    return nextSpeaker || null;
};

// ==================== MODE METHODS ====================

// Change debate mode
sessionSchema.methods.changeMode = function (mode, settings = {}, startedBy = null) {
    // Save current mode to history
    if (this.currentMode && this.modeStartedAt) {
        this.modeHistory.push({
            mode: this.currentMode,
            settings: { ...this.modeSettings },
            startedAt: this.modeStartedAt,
            endedAt: new Date(),
            startedBy: startedBy ? {
                email: startedBy.email || 'presidium@mun.uz',
                name: startedBy.name || 'Presidium',
                userId: startedBy.userId || null
            } : null
        });
    }

    // Set new mode
    this.currentMode = mode;
    this.modeStartedAt = new Date();

    // Apply mode-specific defaults
    const defaults = {
        formal: {
            speechTime: settings.speechTime || 180,
            questionsAllowed: settings.questionsAllowed !== undefined ? settings.questionsAllowed : false
        },
        moderated: {
            speechTime: settings.speechTime || 90,
            totalTime: Math.min(settings.totalTime || 600, 1200), // max 20 min
            topic: settings.topic || 'Discussion',
            questionsAllowed: false // no questions in moderated
        },
        unmoderated: {
            totalTime: Math.min(settings.totalTime || 600, 1200), // max 20 min
            speechTime: 0 // no individual speech time
        },
        informal: {
            speechTime: settings.speechTime || 120,
            allowPassToNext: true
        }
    };

    this.modeSettings = { ...defaults[mode], ...settings };

    // Start debate timer for moderated/unmoderated
    if (mode === 'moderated' || mode === 'unmoderated') {
        this.timers.debate = {
            totalDuration: this.modeSettings.totalTime,
            remainingTime: this.modeSettings.totalTime,
            isActive: false, // Don't auto-start, presidium must start it
            isPaused: false,
            startedAt: null,
            debateType: mode,
            topic: this.modeSettings.topic || ''
        };
    }

    return this.save();
};

// ==================== TIMER METHODS ====================

// Start session timer
sessionSchema.methods.startSessionTimer = function (duration, purpose = 'Session management') {
    this.timers.session = {
        totalDuration: duration,
        remainingTime: duration,
        isActive: true,
        isPaused: false,
        startedAt: new Date(),
        purpose: purpose
    };
    return this.save();
};

// Start debate timer (for moderated/unmoderated)
sessionSchema.methods.startDebateTimer = function () {
    if (!this.timers.debate.totalDuration) {
        throw new Error('Debate timer not configured');
    }

    this.timers.debate.isActive = true;
    this.timers.debate.isPaused = false;
    this.timers.debate.startedAt = new Date();
    return this.save();
};

// Pause any timer
sessionSchema.methods.pauseTimer = function (timerType) {
    const timer = this.timers[timerType];
    if (timer && timer.isActive && !timer.isPaused) {
        timer.isPaused = true;
    }
    return this.save();
};

// Resume any timer
sessionSchema.methods.resumeTimer = function (timerType) {
    const timer = this.timers[timerType];
    if (timer && timer.isActive && timer.isPaused) {
        timer.isPaused = false;
    }
    return this.save();
};

// Adjust timer remaining time
sessionSchema.methods.adjustTimer = function (timerType, newTime) {
    const timer = this.timers[timerType];
    if (timer) {
        timer.remainingTime = Math.max(0, newTime);
        if (newTime > timer.totalDuration) {
            timer.totalDuration = newTime;
        }
    }
    return this.save();
};

// Add additional timer
sessionSchema.methods.addAdditionalTimer = function (name, purpose, duration) {
    if (this.timers.additional.length >= 6) {
        throw new Error('Maximum 6 additional timers allowed');
    }

    const timerId = `timer_${Date.now()}`;
    this.timers.additional.push({
        id: timerId,
        name: name,
        purpose: purpose,
        totalDuration: duration,
        remainingTime: duration,
        isActive: false,
        isPaused: false,
        startedAt: null
    });

    return this.save();
};

const Session = mongoose.model('Session', sessionSchema);
module.exports = { Session };