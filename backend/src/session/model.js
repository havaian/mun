const mongoose = require('mongoose');

// Enhanced Session schema for comprehensive MUN session management
const sessionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    // Session basic info
    number: {
        type: Number,
        required: true,
        min: 1
    },

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    status: {
        type: String,
        enum: ['inactive', 'active', 'paused', 'completed'],
        default: 'inactive'
    },

    // Session timing
    startedAt: {
        type: Date,
        default: null
    },

    pausedAt: {
        type: Date,
        default: null
    },

    endedAt: {
        type: Date,
        default: null
    },

    // Timer Hierarchy System
    timers: {
        // Session timer - overall session time
        session: {
            totalDuration: { type: Number, default: 0 }, // in seconds
            remainingTime: { type: Number, default: 0 },
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: { type: Date, default: null },
            pausedTime: { type: Number, default: 0 }, // total paused time
            extensions: [{
                addedTime: Number,
                addedAt: Date,
                addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reason: String
            }]
        },

        // Current debate timer (primary display timer)
        debate: {
            totalDuration: { type: Number, default: 0 },
            remainingTime: { type: Number, default: 0 },
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: { type: Date, default: null },
            pausedTime: { type: Number, default: 0 },
            debateType: { type: String, enum: ['formal', 'moderated', 'unmoderated', 'informal'] },
            purpose: String // "Moderated Caucus on Climate Change"
        },

        // Current speaker timer
        speaker: {
            totalDuration: { type: Number, default: 90 }, // default 1:30
            remainingTime: { type: Number, default: 90 },
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: { type: Date, default: null },
            pausedTime: { type: Number, default: 0 },
            speakerCountry: String,
            canBeExtended: { type: Boolean, default: false }
        },

        // Additional timers (up to 6)
        additional: [{
            id: String, // unique identifier
            name: String,
            purpose: String, // "Q&A Period", "Technical Break", etc.
            totalDuration: Number,
            remainingTime: Number,
            isActive: { type: Boolean, default: false },
            isPaused: { type: Boolean, default: false },
            startedAt: { type: Date, default: null },
            pausedTime: { type: Number, default: 0 },
            priority: { type: Number, default: 0 } // for display ordering
        }]
    },

    // Current debate mode and settings
    currentMode: {
        type: String,
        enum: ['formal', 'moderated', 'unmoderated', 'informal'],
        default: 'formal'
    },

    modeSettings: {
        // Moderated caucus specific
        topic: String,
        totalTime: Number, // caucus duration
        individualSpeechTime: Number, // time per speaker

        // Formal debate specific
        speechTime: Number,
        questionsAllowed: { type: Boolean, default: false },
        questionTime: Number,

        // Informal consultation specific
        allowPassToNext: { type: Boolean, default: true }
    },

    modeStartedAt: {
        type: Date,
        default: null
    },

    modeHistory: [{
        mode: String,
        settings: mongoose.Schema.Types.Mixed,
        startedAt: Date,
        endedAt: Date,
        startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Roll Call System
    rollCall: {
        isActive: { type: Boolean, default: false },
        startedAt: Date,
        endedAt: Date,
        startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timeLimit: Number, // optional time limit in seconds

        // Auto-mark countries as absent after time limit
        autoMarkAbsent: { type: Boolean, default: true }
    },

    // Attendance tracking with three-tier system
    attendance: [{
        country: { type: String, required: true },
        email: String,
        status: {
            type: String,
            enum: ['absent', 'present', 'present_and_voting'],
            default: 'absent'
        },
        markedAt: { type: Date, default: Date.now },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        arrivedLate: { type: Boolean, default: false } // marked after session started
    }],

    // Quorum calculation
    quorum: {
        required: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        hasQuorum: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now }
    },

    // Speaker Queue Management (Complex alphabetical system)
    speakerQueues: {
        // Primary queue - present delegates (alphabetical + moved to end)
        present: [{
            country: String,
            email: String,
            position: Number,
            hasMovedToEnd: { type: Boolean, default: false }, // can only move once
            addedAt: Date,
            speaking: { type: Boolean, default: false },
            hasSpoken: { type: Boolean, default: false },
            spokeAt: Date
        }],

        // Secondary queue - absent delegates waiting to be moved
        absent: [{
            country: String,
            email: String,
            position: Number,
            addedAt: Date
        }]
    },

    // Current speaker tracking
    currentSpeaker: {
        country: String,
        startedAt: Date,
        timeAllocated: Number,
        timeUsed: Number,
        canTakeQuestions: { type: Boolean, default: false }
    },

    // Session statistics and tracking
    statistics: {
        totalSpeakingTime: { type: Number, default: 0 },
        totalDebates: { type: Number, default: 0 },
        participationCount: { type: Number, default: 0 },
        proceduralMotions: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'sessions'
});

// Indexes for better query performance
sessionSchema.index({ committeeId: 1, number: 1 }, { unique: true });
sessionSchema.index({ committeeId: 1, status: 1 });
sessionSchema.index({ status: 1 });

// Instance Methods

// Timer Management Methods
sessionSchema.methods.startSessionTimer = function (duration) {
    this.timers.session = {
        totalDuration: duration,
        remainingTime: duration,
        isActive: true,
        isPaused: false,
        startedAt: new Date(),
        pausedTime: 0,
        extensions: []
    };
    return this.save();
};

sessionSchema.methods.startDebateTimer = function (duration, debateType, purpose) {
    this.timers.debate = {
        totalDuration: duration,
        remainingTime: duration,
        isActive: true,
        isPaused: false,
        startedAt: new Date(),
        pausedTime: 0,
        debateType,
        purpose
    };
    return this.save();
};

sessionSchema.methods.startSpeakerTimer = function (duration, country, canBeExtended = false) {
    this.timers.speaker = {
        totalDuration: duration,
        remainingTime: duration,
        isActive: true,
        isPaused: false,
        startedAt: new Date(),
        pausedTime: 0,
        speakerCountry: country,
        canBeExtended
    };
    return this.save();
};

sessionSchema.methods.pauseTimer = function (timerType) {
    const timer = this.timers[timerType];
    if (timer && timer.isActive && !timer.isPaused) {
        timer.isPaused = true;
        timer.pausedAt = new Date();
    }
    return this.save();
};

sessionSchema.methods.resumeTimer = function (timerType) {
    const timer = this.timers[timerType];
    if (timer && timer.isActive && timer.isPaused) {
        timer.isPaused = false;
        const pauseDuration = Date.now() - new Date(timer.pausedAt).getTime();
        timer.pausedTime += Math.floor(pauseDuration / 1000);
        delete timer.pausedAt;
    }
    return this.save();
};

sessionSchema.methods.adjustTimer = function (timerType, newTime) {
    const timer = this.timers[timerType];
    if (timer) {
        timer.remainingTime = newTime;
        if (newTime > timer.totalDuration) {
            timer.totalDuration = newTime;
        }
    }
    return this.save();
};

sessionSchema.methods.addAdditionalTimer = function (name, purpose, duration) {
    const timerId = `additional_${Date.now()}`;
    this.timers.additional.push({
        id: timerId,
        name,
        purpose,
        totalDuration: duration,
        remainingTime: duration,
        isActive: false,
        isPaused: false,
        priority: this.timers.additional.length
    });
    return this.save();
};

// Roll Call Methods
sessionSchema.methods.startRollCall = function (startedBy, timeLimit = null) {
    this.rollCall = {
        isActive: true,
        startedAt: new Date(),
        startedBy,
        timeLimit,
        autoMarkAbsent: true
    };

    // Reset all attendance to absent at start of roll call
    this.attendance.forEach(att => {
        att.status = 'absent';
        att.markedAt = new Date();
    });

    return this.save();
};

sessionSchema.methods.endRollCall = function () {
    this.rollCall.isActive = false;
    this.rollCall.endedAt = new Date();
    this.calculateQuorum();
    return this.save();
};

sessionSchema.methods.markAttendance = function (country, status, markedBy) {
    const attendance = this.attendance.find(att => att.country === country);
    if (attendance) {
        const wasAbsent = attendance.status === 'absent';
        attendance.status = status;
        attendance.markedAt = new Date();
        attendance.markedBy = markedBy;

        // If marked as present after session started, flag as late arrival
        if (wasAbsent && this.status === 'active') {
            attendance.arrivedLate = true;
            // Move from absent queue to present queue
            this.moveFromAbsentToPresent(country);
        }
    }
    this.calculateQuorum();
    return this.save();
};

// Quorum Calculation
sessionSchema.methods.calculateQuorum = function () {
    const votingMembers = this.attendance.filter(att =>
        att.status === 'present_and_voting'
    ).length;

    const totalVotingEligible = this.attendance.filter(att =>
        att.email && att.country // has voting rights
    ).length;

    this.quorum = {
        required: Math.floor(totalVotingEligible / 2) + 1,
        present: votingMembers,
        hasQuorum: votingMembers >= Math.floor(totalVotingEligible / 2) + 1,
        lastUpdated: new Date()
    };
};

// Speaker Queue Management
sessionSchema.methods.initializeSpeakerQueues = function () {
    const presentCountries = this.attendance
        .filter(att => att.status === 'present' || att.status === 'present_and_voting')
        .map(att => ({
            country: att.country,
            email: att.email,
            position: 0,
            hasMovedToEnd: false,
            addedAt: new Date(),
            speaking: false,
            hasSpoken: false
        }))
        .sort((a, b) => a.country.localeCompare(b.country)); // Alphabetical

    const absentCountries = this.attendance
        .filter(att => att.status === 'absent')
        .map(att => ({
            country: att.country,
            email: att.email,
            position: 0,
            addedAt: new Date()
        }))
        .sort((a, b) => a.country.localeCompare(b.country)); // Alphabetical

    // Assign positions
    presentCountries.forEach((speaker, index) => {
        speaker.position = index + 1;
    });

    absentCountries.forEach((speaker, index) => {
        speaker.position = index + 1;
    });

    this.speakerQueues = {
        present: presentCountries,
        absent: absentCountries
    };

    return this.save();
};

sessionSchema.methods.moveToEndOfQueue = function (country) {
    const speaker = this.speakerQueues.present.find(s => s.country === country);

    if (!speaker) {
        throw new Error(`${country} not found in present speakers queue`);
    }

    if (speaker.hasMovedToEnd) {
        throw new Error(`${country} has already moved to end once`);
    }

    if (speaker.speaking) {
        throw new Error(`Cannot move ${country} while they are speaking`);
    }

    // Remove from current position
    this.speakerQueues.present = this.speakerQueues.present.filter(s => s.country !== country);

    // Mark as having moved and add to end
    speaker.hasMovedToEnd = true;
    speaker.position = this.speakerQueues.present.length + 1;
    this.speakerQueues.present.push(speaker);

    // Reorder positions
    this.speakerQueues.present.forEach((speaker, index) => {
        speaker.position = index + 1;
    });

    return this.save();
};

sessionSchema.methods.moveFromAbsentToPresent = function (country) {
    const absentIndex = this.speakerQueues.absent.findIndex(s => s.country === country);

    if (absentIndex === -1) {
        return; // Country not in absent queue
    }

    // Remove from absent queue
    const speaker = this.speakerQueues.absent.splice(absentIndex, 1)[0];

    // Add to end of present queue
    speaker.hasMovedToEnd = false; // Reset movement flag
    speaker.position = this.speakerQueues.present.length + 1;
    speaker.addedAt = new Date();

    this.speakerQueues.present.push(speaker);

    // Reorder absent queue positions
    this.speakerQueues.absent.forEach((speaker, index) => {
        speaker.position = index + 1;
    });

    return this.save();
};

sessionSchema.methods.setCurrentSpeaker = function (country) {
    const speaker = this.speakerQueues.present.find(s => s.country === country);

    if (!speaker) {
        throw new Error(`${country} not found in speakers queue`);
    }

    // Clear previous speaker
    this.speakerQueues.present.forEach(s => {
        if (s.speaking) {
            s.speaking = false;
            s.hasSpoken = true;
            s.spokeAt = new Date();
        }
    });

    // Set new speaker
    speaker.speaking = true;
    this.currentSpeaker = {
        country,
        startedAt: new Date(),
        timeAllocated: this.modeSettings.individualSpeechTime || this.modeSettings.speechTime || 90,
        timeUsed: 0,
        canTakeQuestions: this.modeSettings.questionsAllowed || false
    };

    return this.save();
};

// Debate Mode Management
sessionSchema.methods.changeMode = function (newMode, settings, changedBy) {
    // Record current mode in history
    if (this.currentMode && this.modeStartedAt) {
        this.modeHistory.push({
            mode: this.currentMode,
            settings: { ...this.modeSettings },
            startedAt: this.modeStartedAt,
            endedAt: new Date(),
            startedBy: changedBy
        });
    }

    this.currentMode = newMode;
    this.modeSettings = { ...settings };
    this.modeStartedAt = new Date();

    // Mode-specific initialization
    if (newMode === 'moderated') {
        // Initialize speaker queue for moderated caucus
        this.initializeSpeakerQueues();

        // Start debate timer
        if (settings.totalTime) {
            this.startDebateTimer(
                settings.totalTime,
                'moderated',
                `Moderated Caucus: ${settings.topic || 'General Discussion'}`
            );
        }
    }

    return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = { Session };