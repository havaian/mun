const mongoose = require('mongoose');

// Timer schema for MUN session management
const timerSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },

    // Timer identification
    timerType: {
        type: String,
        enum: [
            'session', // Overall session timer
            'speaker', // Current speaker timer
            'caucus', // Moderated/unmoderated caucus timer
            'additional_1', // Additional timer 1
            'additional_2', // Additional timer 2
            'additional_3', // Additional timer 3
            'additional_4', // Additional timer 4
            'additional_5', // Additional timer 5
            'additional_6' // Additional timer 6
        ],
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    description: {
        type: String,
        trim: true,
        maxlength: 300
    },

    // Timer settings
    totalDuration: {
        type: Number, // Total duration in seconds
        required: true,
        min: 1
    },

    remainingTime: {
        type: Number, // Remaining time in seconds
        required: true,
        min: 0
    },

    // Timer state
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

    completedAt: {
        type: Date,
        default: null
    },

    // Pause tracking
    totalPausedTime: {
        type: Number, // Total time paused in seconds
        default: 0
    },

    pauseHistory: [{
        pausedAt: Date,
        resumedAt: Date,
        duration: Number // seconds
    }],

    // Timer behavior settings
    autoStart: {
        type: Boolean,
        default: false
    },

    countDown: {
        type: Boolean,
        default: true // true for countdown, false for count up
    },

    showWarnings: {
        type: Boolean,
        default: true
    },

    warningTimes: [Number], // Array of seconds when to show warnings (e.g., [30, 10])

    // Sound and visual alerts
    soundAlerts: {
        enabled: {
            type: Boolean,
            default: true
        },
        warningSound: {
            type: Boolean,
            default: true
        },
        endSound: {
            type: Boolean,
            default: true
        }
    },

    visualAlerts: {
        enabled: {
            type: Boolean,
            default: true
        },
        flashOnWarning: {
            type: Boolean,
            default: true
        },
        changeColorOnWarning: {
            type: Boolean,
            default: true
        }
    },

    // Associated entities (for context)
    associatedSpeaker: {
        country: String,
        email: String
    },

    associatedMotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProceduralMotion',
        default: null
    },

    // Timer control permissions
    controllableBy: {
        type: [String],
        enum: ['presidium', 'delegates', 'speaker'],
        default: ['presidium']
    },

    // Status and metadata
    status: {
        type: String,
        enum: ['created', 'running', 'paused', 'completed', 'expired', 'cancelled'],
        default: 'created'
    },

    priority: {
        type: Number,
        default: 0 // Higher priority timers displayed more prominently
    },

    // Timer events log
    events: [{
        eventType: {
            type: String,
            enum: ['created', 'started', 'paused', 'resumed', 'extended', 'completed', 'expired', 'cancelled', 'warning']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        triggeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        }
    }],

    // Extension history
    extensions: [{
        addedTime: Number, // seconds added
        newTotalDuration: Number,
        reason: String,
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    collection: 'timers'
});

// Indexes for performance
timerSchema.index({ committeeId: 1, sessionId: 1 });
timerSchema.index({ timerType: 1, committeeId: 1 });
timerSchema.index({ status: 1, isActive: 1 });
timerSchema.index({ startedAt: 1 });

// Ensure only one active timer per type per committee
timerSchema.index(
    { committeeId: 1, timerType: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isActive: true,
            status: { $in: ['running', 'paused'] }
        }
    }
);

// Methods for timer management
timerSchema.methods.start = function (triggeredBy = null) {
    if (this.isActive) {
        throw new Error('Timer is already active');
    }

    this.isActive = true;
    this.isPaused = false;
    this.startedAt = new Date();
    this.status = 'running';

    this.events.push({
        eventType: 'started',
        triggeredBy,
        details: { startedAt: this.startedAt }
    });

    return this;
};

timerSchema.methods.pause = function (triggeredBy = null) {
    if (!this.isActive || this.isPaused) {
        throw new Error('Timer is not running');
    }

    this.isPaused = true;
    this.pausedAt = new Date();
    this.status = 'paused';

    this.events.push({
        eventType: 'paused',
        triggeredBy,
        details: { pausedAt: this.pausedAt }
    });

    return this;
};

timerSchema.methods.resume = function (triggeredBy = null) {
    if (!this.isActive || !this.isPaused) {
        throw new Error('Timer is not paused');
    }

    const pauseDuration = Math.floor((new Date() - this.pausedAt) / 1000);

    this.pauseHistory.push({
        pausedAt: this.pausedAt,
        resumedAt: new Date(),
        duration: pauseDuration
    });

    this.totalPausedTime += pauseDuration;
    this.isPaused = false;
    this.pausedAt = null;
    this.status = 'running';

    this.events.push({
        eventType: 'resumed',
        triggeredBy,
        details: { pauseDuration }
    });

    return this;
};

timerSchema.methods.extend = function (additionalSeconds, reason, grantedBy) {
    if (additionalSeconds <= 0) {
        throw new Error('Additional time must be positive');
    }

    const oldDuration = this.totalDuration;
    this.totalDuration += additionalSeconds;
    this.remainingTime += additionalSeconds;

    this.extensions.push({
        addedTime: additionalSeconds,
        newTotalDuration: this.totalDuration,
        reason,
        grantedBy
    });

    this.events.push({
        eventType: 'extended',
        triggeredBy: grantedBy,
        details: {
            addedTime: additionalSeconds,
            oldDuration,
            newDuration: this.totalDuration,
            reason
        }
    });

    return this;
};

timerSchema.methods.complete = function (triggeredBy = null) {
    this.isActive = false;
    this.isPaused = false;
    this.completedAt = new Date();
    this.status = 'completed';
    this.remainingTime = 0;

    this.events.push({
        eventType: 'completed',
        triggeredBy,
        details: { completedAt: this.completedAt }
    });

    return this;
};

timerSchema.methods.cancel = function (reason, triggeredBy = null) {
    this.isActive = false;
    this.isPaused = false;
    this.status = 'cancelled';

    this.events.push({
        eventType: 'cancelled',
        triggeredBy,
        details: { reason }
    });

    return this;
};

timerSchema.methods.updateRemainingTime = function () {
    if (!this.isActive || this.isPaused) {
        return this.remainingTime;
    }

    const now = new Date();
    const elapsed = Math.floor((now - this.startedAt) / 1000) - this.totalPausedTime;

    if (this.countDown) {
        this.remainingTime = Math.max(0, this.totalDuration - elapsed);
    } else {
        this.remainingTime = elapsed;
    }

    // Check if timer expired
    if (this.countDown && this.remainingTime === 0 && this.status === 'running') {
        this.status = 'expired';
        this.isActive = false;
        this.events.push({
            eventType: 'expired',
            details: { expiredAt: now }
        });
    }

    return this.remainingTime;
};

timerSchema.methods.checkWarnings = function () {
    if (!this.showWarnings || !this.countDown) {
        return [];
    }

    const currentTime = this.updateRemainingTime();
    const warnings = [];

    for (const warningTime of this.warningTimes) {
        if (currentTime <= warningTime && currentTime > warningTime - 1) {
            warnings.push(warningTime);
        }
    }

    return warnings;
};

timerSchema.methods.getDisplayTime = function () {
    const time = this.updateRemainingTime();
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

timerSchema.methods.canBeControlledBy = function (userRole) {
    return this.controllableBy.includes(userRole);
};

// Virtual for current runtime
timerSchema.virtual('runtime').get(function () {
    if (!this.startedAt) return 0;

    const now = this.isPaused ? this.pausedAt : new Date();
    return Math.floor((now - this.startedAt) / 1000) - this.totalPausedTime;
});

// Virtual for progress percentage
timerSchema.virtual('progressPercentage').get(function () {
    if (this.totalDuration === 0) return 0;

    if (this.countDown) {
        return Math.round(((this.totalDuration - this.remainingTime) / this.totalDuration) * 100);
    } else {
        return Math.round((this.remainingTime / this.totalDuration) * 100);
    }
});

const Timer = mongoose.model('Timer', timerSchema);

module.exports = { Timer };