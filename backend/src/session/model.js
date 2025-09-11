const mongoose = require('mongoose');

// Speaker in speaker list schema
const speakerSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    hasSpoken: {
        type: Boolean,
        default: false
    },

    speaking: {
        type: Boolean,
        default: false
    },

    position: {
        type: Number,
        required: true
    },

    addedAt: {
        type: Date,
        default: Date.now
    },

    spokeAt: {
        type: Date,
        default: null
    },

    speechDuration: {
        type: Number, // seconds
        default: 0
    }
}, { _id: false });

// Attendance record schema
const attendanceSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['present_and_voting', 'present', 'absent'],
        default: 'absent'
    },

    markedAt: {
        type: Date,
        default: Date.now
    },

    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { _id: false });

// Timer schema for different types of timers
const timerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },

    purpose: {
        type: String,
        required: true // 'session', 'speaker', 'moderated_caucus', 'break', 'voting'
    },

    totalDuration: {
        type: Number, // seconds
        required: true
    },

    remainingTime: {
        type: Number, // seconds
        required: true
    },

    startedAt: {
        type: Date,
        default: null
    },

    pausedAt: {
        type: Date,
        default: null
    },

    completedAt: {
        type: Date,
        default: null
    },

    isActive: {
        type: Boolean,
        default: false
    },

    isPaused: {
        type: Boolean,
        default: false
    },

    extensions: [{
        duration: Number, // seconds added
        reason: String,
        authorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { _id: false });

// Mode history schema
const modeHistorySchema = new mongoose.Schema({
    mode: {
        type: String,
        required: true
    },

    startedAt: {
        type: Date,
        required: true
    },

    endedAt: {
        type: Date,
        default: null
    },

    settings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { _id: false });

// Main session schema
const sessionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    number: {
        type: Number,
        required: true
    },

    title: {
        type: String,
        default: function () {
            return `Session ${this.number}`;
        }
    },

    // Current status
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
        default: 'active'
    },

    startedAt: {
        type: Date,
        default: Date.now
    },

    endedAt: {
        type: Date,
        default: null
    },

    // Current debate mode
    currentMode: {
        type: String,
        enum: ['formal', 'moderated', 'unmoderated', 'informal', 'voting', 'closed'],
        default: 'formal'
    },

    modeStartedAt: {
        type: Date,
        default: Date.now
    },

    // Mode-specific settings
    modeSettings: {
        topic: {
            type: String,
            default: null // for moderated caucus
        },

        totalTime: {
            type: Number, // seconds
            default: null
        },

        speechTime: {
            type: Number, // seconds
            default: 90
        },

        allowQuestions: {
            type: Boolean,
            default: false
        }
    },

    // History of mode changes
    modeHistory: [modeHistorySchema],

    // Speaker management
    speakerList: [speakerSchema],

    currentSpeaker: {
        country: {
            type: String,
            default: null
        },

        startedAt: {
            type: Date,
            default: null
        }
    },

    // Attendance tracking
    attendance: [attendanceSchema],

    // Quorum information
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
        },

        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    // Timer management
    timers: {
        session: timerSchema,
        speaker: timerSchema,
        additional: [timerSchema]
    }
}, {
    timestamps: true,
    collection: 'sessions'
});

// Indexes for performance
sessionSchema.index({ committeeId: 1, number: 1 }, { unique: true });
sessionSchema.index({ committeeId: 1, status: 1 });
sessionSchema.index({ 'attendance.country': 1 });
sessionSchema.index({ 'speakerList.country': 1 });

// Virtual for session duration
sessionSchema.virtual('duration').get(function () {
    const end = this.endedAt || new Date();
    return Math.floor((end - this.startedAt) / 1000); // seconds
});

// Virtual for total speaking time used
sessionSchema.virtual('totalSpeakingTime').get(function () {
    return this.speakerList.reduce((total, speaker) => {
        return total + (speaker.speechDuration || 0);
    }, 0);
});

// Method to update attendance
sessionSchema.methods.updateAttendance = function (country, status, markedBy) {
    const existingIndex = this.attendance.findIndex(a => a.country === country);

    const attendanceRecord = {
        country,
        email: null, // Will be filled by controller
        status,
        markedAt: new Date(),
        markedBy
    };

    if (existingIndex >= 0) {
        this.attendance[existingIndex] = attendanceRecord;
    } else {
        this.attendance.push(attendanceRecord);
    }

    this.calculateQuorum();
};

// Method to calculate quorum
sessionSchema.methods.calculateQuorum = function () {
    const votingMembers = this.attendance.filter(a =>
        a.status === 'present_and_voting'
    ).length;

    // Simple majority requirement
    this.quorum.present = votingMembers;
    this.quorum.required = Math.floor(votingMembers / 2) + 1;
    this.quorum.hasQuorum = votingMembers >= this.quorum.required;
    this.quorum.lastUpdated = new Date();
};

// Method to add speaker to list
sessionSchema.methods.addSpeaker = function (country, email) {
    // Check if speaker already in list
    const existingSpeaker = this.speakerList.find(s => s.country === country);
    if (existingSpeaker) {
        throw new Error(`${country} is already in the speaker list`);
    }

    const position = this.speakerList.length + 1;

    this.speakerList.push({
        country,
        email,
        position,
        hasSpoken: false,
        speaking: false
    });

    return this.speakerList[this.speakerList.length - 1];
};

// Method to remove speaker from list
sessionSchema.methods.removeSpeaker = function (country) {
    const speakerIndex = this.speakerList.findIndex(s => s.country === country);
    if (speakerIndex === -1) {
        throw new Error(`${country} not found in speaker list`);
    }

    // Can't remove currently speaking delegate
    if (this.speakerList[speakerIndex].speaking) {
        throw new Error(`Cannot remove ${country} while they are speaking`);
    }

    this.speakerList.splice(speakerIndex, 1);

    // Reorder positions
    this.speakerList.forEach((speaker, index) => {
        speaker.position = index + 1;
    });
};

// Method to move speaker to end of list (yield)
sessionSchema.methods.moveSpeakerToEnd = function (country) {
    const speakerIndex = this.speakerList.findIndex(s => s.country === country);
    if (speakerIndex === -1) {
        throw new Error(`${country} not found in speaker list`);
    }

    const speaker = this.speakerList[speakerIndex];

    // Can't move currently speaking delegate
    if (speaker.speaking) {
        throw new Error(`Cannot move ${country} while they are speaking`);
    }

    // Remove from current position and add to end
    this.speakerList.splice(speakerIndex, 1);
    this.speakerList.push(speaker);

    // Reorder positions
    this.speakerList.forEach((speaker, index) => {
        speaker.position = index + 1;
    });
};

// Method to set current speaker
sessionSchema.methods.setCurrentSpeaker = function (country) {
    // Clear previous speaker
    this.speakerList.forEach(speaker => {
        if (speaker.speaking) {
            speaker.speaking = false;
            speaker.hasSpoken = true;
            speaker.spokeAt = new Date();
        }
    });

    // Set new speaker
    const speaker = this.speakerList.find(s => s.country === country);
    if (!speaker) {
        throw new Error(`${country} not found in speaker list`);
    }

    speaker.speaking = true;
    this.currentSpeaker = {
        country,
        startedAt: new Date()
    };

    return speaker;
};

// Method to change debate mode
sessionSchema.methods.changeMode = function (newMode, settings = {}, changedBy) {
    // Record mode history
    if (this.modeHistory.length > 0) {
        const lastMode = this.modeHistory[this.modeHistory.length - 1];
        if (!lastMode.endedAt) {
            lastMode.endedAt = new Date();
        }
    }

    this.modeHistory.push({
        mode: this.currentMode,
        startedAt: this.modeStartedAt,
        endedAt: new Date(),
        settings: { ...this.modeSettings.toObject() },
        startedBy: changedBy
    });

    // Set new mode
    this.currentMode = newMode;
    this.modeStartedAt = new Date();
    this.modeSettings = { ...this.modeSettings.toObject(), ...settings };

    // Mode-specific actions
    if (newMode === 'unmoderated') {
        // Clear current speaker for unmoderated caucus
        this.currentSpeaker = { country: null, startedAt: null };
        this.speakerList.forEach(speaker => {
            speaker.speaking = false;
        });
    }
};

// Method to initialize timer
sessionSchema.methods.initializeTimer = function (timerType, duration, purpose = '') {
    const timerId = `${timerType}-${Date.now()}`;

    const timer = {
        id: timerId,
        purpose: purpose || timerType,
        totalDuration: duration,
        remainingTime: duration,
        isActive: false,
        isPaused: false,
        extensions: []
    };

    if (timerType === 'session') {
        this.timers.session = timer;
    } else if (timerType === 'speaker') {
        this.timers.speaker = timer;
    } else {
        this.timers.additional.push(timer);
    }

    return timer;
};

// Method to start timer
sessionSchema.methods.startTimer = function (timerType, timerId = null) {
    let timer;

    if (timerType === 'session') {
        timer = this.timers.session;
    } else if (timerType === 'speaker') {
        timer = this.timers.speaker;
    } else {
        timer = this.timers.additional.find(t => t.id === timerId);
    }

    if (!timer) {
        throw new Error('Timer not found');
    }

    timer.startedAt = new Date();
    timer.isActive = true;
    timer.isPaused = false;
    timer.pausedAt = null;

    return timer;
};

// Method to pause timer
sessionSchema.methods.pauseTimer = function (timerType, timerId = null) {
    let timer;

    if (timerType === 'session') {
        timer = this.timers.session;
    } else if (timerType === 'speaker') {
        timer = this.timers.speaker;
    } else {
        timer = this.timers.additional.find(t => t.id === timerId);
    }

    if (!timer || !timer.isActive) {
        throw new Error('Timer not found or not active');
    }

    timer.pausedAt = new Date();
    timer.isPaused = true;

    return timer;
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = { Session };