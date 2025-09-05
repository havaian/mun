const mongoose = require('mongoose');

// Activity schema for tracking delegate actions
const activitySchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        default: null
    },

    // Participant information
    userEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    countryName: {
        type: String,
        required: true
    },

    userRole: {
        type: String,
        enum: ['delegate', 'presidium', 'admin'],
        required: true
    },

    // Activity details
    actionType: {
        type: String,
        enum: [
            'speech', 'vote', 'document_upload', 'amendment', 'motion',
            'question', 'message', 'coalition_join', 'coalition_create',
            'resolution_submit', 'session_attend', 'login', 'logout'
        ],
        required: true
    },

    category: {
        type: String,
        enum: ['debate', 'voting', 'documentation', 'procedural', 'communication', 'session'],
        required: true
    },

    // Detailed activity information
    details: {
        duration: Number, // For speeches - time in seconds
        target: String, // Target of action (ID of document, recipient email, etc.)
        result: String, // Result ('passed', 'rejected', 'accepted', etc.)
        mode: String, // Debate mode for speeches
        votingType: String, // Type of voting
        documentType: String, // Type of document
        wordCount: Number, // For documents and messages
        additionalInfo: mongoose.Schema.Types.Mixed // Flexible additional data
    },

    // Impact on statistics
    scoreImpact: {
        type: Number,
        default: 0
    },

    qualityMultiplier: {
        type: Number,
        default: 1.0
    },

    // Context and references
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    relatedType: {
        type: String,
        enum: ['voting', 'resolution', 'motion', 'question', 'document', 'conversation'],
        default: null
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'activities'
});

// Delegate statistics schema
const delegateStatsSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },

    userEmail: {
        type: String,
        required: true,
        lowercase: true
    },

    countryName: {
        type: String,
        required: true
    },

    // Participation metrics
    participation: {
        totalSessions: {
            type: Number,
            default: 0
        },
        attendedSessions: {
            type: Number,
            default: 0
        },
        attendanceRate: {
            type: Number,
            default: 0
        },
        totalTimeActive: {
            type: Number,
            default: 0 // minutes
        },
        firstLogin: {
            type: Date,
            default: null
        },
        lastActivity: {
            type: Date,
            default: null
        }
    },

    // Debate activity
    debate: {
        totalSpeeches: {
            type: Number,
            default: 0
        },
        totalSpeechTime: {
            type: Number,
            default: 0 // seconds
        },
        averageSpeechLength: {
            type: Number,
            default: 0
        },
        formalSpeeches: {
            type: Number,
            default: 0
        },
        caucusSpeeches: {
            type: Number,
            default: 0
        },
        yieldsUsed: {
            type: Number,
            default: 0
        }
    },

    // Voting behavior
    voting: {
        totalVotes: {
            type: Number,
            default: 0
        },
        votesFor: {
            type: Number,
            default: 0
        },
        votesAgainst: {
            type: Number,
            default: 0
        },
        abstentions: {
            type: Number,
            default: 0
        },
        vetoesUsed: {
            type: Number,
            default: 0
        },
        votingRate: {
            type: Number,
            default: 0
        }
    },

    // Documentation activity
    documentation: {
        positionPapersSubmitted: {
            type: Number,
            default: 0
        },
        resolutionsSubmitted: {
            type: Number,
            default: 0
        },
        amendmentsSubmitted: {
            type: Number,
            default: 0
        },
        documentsApproved: {
            type: Number,
            default: 0
        },
        documentsRejected: {
            type: Number,
            default: 0
        },
        totalWordsWritten: {
            type: Number,
            default: 0
        }
    },

    // Procedural activity
    procedural: {
        motionsSubmitted: {
            type: Number,
            default: 0
        },
        motionsSupported: {
            type: Number,
            default: 0
        },
        questionsAsked: {
            type: Number,
            default: 0
        },
        motionSuccessRate: {
            type: Number,
            default: 0
        }
    },

    // Communication activity
    communication: {
        messagesSent: {
            type: Number,
            default: 0
        },
        conversationsStarted: {
            type: Number,
            default: 0
        },
        bilateralChats: {
            type: Number,
            default: 0
        },
        groupChats: {
            type: Number,
            default: 0
        }
    },

    // Coalition activity
    coalitions: {
        coalitionsJoined: {
            type: Number,
            default: 0
        },
        coalitionsLed: {
            type: Number,
            default: 0
        },
        resolutionsCoauthored: {
            type: Number,
            default: 0
        },
        successfulCoalitions: {
            type: Number,
            default: 0
        }
    },

    // Overall scores and rankings
    scores: {
        participationScore: {
            type: Number,
            default: 0
        },
        leadershipScore: {
            type: Number,
            default: 0
        },
        collaborationScore: {
            type: Number,
            default: 0
        },
        innovationScore: {
            type: Number,
            default: 0
        },
        totalScore: {
            type: Number,
            default: 0
        },
        rankInCommittee: {
            type: Number,
            default: 0
        },
        rankInEvent: {
            type: Number,
            default: 0
        }
    },

    // Achievements and awards
    achievements: [{
        awardType: {
            type: String,
            enum: [
                'best_delegate', 'outstanding_delegate', 'honorable_mention',
                'best_position_paper', 'best_speaker', 'most_collaborative',
                'most_innovative', 'rising_star', 'diplomat_award',
                'leadership_award', 'research_award'
            ]
        },
        awardName: String,
        description: String,
        earnedAt: {
            type: Date,
            default: Date.now
        },
        criteria: mongoose.Schema.Types.Mixed
    }],

    // Last calculation timestamp
    lastCalculated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'delegateStats'
});

// Committee statistics schema
const committeeStatsSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },

    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true,
        unique: true
    },

    // General statistics
    general: {
        totalDelegates: {
            type: Number,
            default: 0
        },
        activeDelegates: {
            type: Number,
            default: 0
        },
        averageAttendance: {
            type: Number,
            default: 0
        },
        totalSessions: {
            type: Number,
            default: 0
        },
        totalSessionTime: {
            type: Number,
            default: 0 // minutes
        }
    },

    // Debate statistics
    debate: {
        totalSpeeches: {
            type: Number,
            default: 0
        },
        averageSpeechLength: {
            type: Number,
            default: 0
        },
        mostActiveDelegate: {
            country: String,
            speechCount: Number
        },
        debateTimeByMode: {
            formal: Number,
            moderatedCaucus: Number,
            unmoderatedCaucus: Number,
            informalConsultation: Number
        }
    },

    // Voting statistics
    voting: {
        totalVotings: {
            type: Number,
            default: 0
        },
        resolutionsPassed: {
            type: Number,
            default: 0
        },
        resolutionsFailed: {
            type: Number,
            default: 0
        },
        amendmentsPassed: {
            type: Number,
            default: 0
        },
        vetoesUsed: {
            type: Number,
            default: 0
        },
        averageVotingParticipation: {
            type: Number,
            default: 0
        }
    },

    // Documentation statistics
    documentation: {
        positionPapersSubmitted: {
            type: Number,
            default: 0
        },
        positionPapersApproved: {
            type: Number,
            default: 0
        },
        resolutionsSubmitted: {
            type: Number,
            default: 0
        },
        amendmentsSubmitted: {
            type: Number,
            default: 0
        },
        averageDocumentQuality: {
            type: Number,
            default: 0
        }
    },

    // Procedural statistics
    procedural: {
        motionsSubmitted: {
            type: Number,
            default: 0
        },
        motionsPassed: {
            type: Number,
            default: 0
        },
        questionsAsked: {
            type: Number,
            default: 0
        },
        questionsAnswered: {
            type: Number,
            default: 0
        }
    },

    // Communication statistics
    communication: {
        totalMessages: {
            type: Number,
            default: 0
        },
        activeConversations: {
            type: Number,
            default: 0
        },
        bilateralChats: {
            type: Number,
            default: 0
        },
        groupChats: {
            type: Number,
            default: 0
        }
    },

    // Coalition statistics
    coalitions: {
        totalCoalitions: {
            type: Number,
            default: 0
        },
        activeCoalitions: {
            type: Number,
            default: 0
        },
        averageCoalitionSize: {
            type: Number,
            default: 0
        },
        successfulCoalitions: {
            type: Number,
            default: 0
        }
    },

    // Performance rankings
    rankings: {
        topDelegates: [{
            country: String,
            email: String,
            score: Number,
            rank: Number
        }],
        mostActive: [{
            country: String,
            activityScore: Number
        }],
        bestCollaborators: [{
            country: String,
            collaborationScore: Number
        }]
    },

    // Last calculation timestamp
    lastCalculated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'committeeStats'
});

// Indexes
activitySchema.index({ userEmail: 1, committeeId: 1 });
activitySchema.index({ eventId: 1, timestamp: -1 });
activitySchema.index({ actionType: 1, category: 1 });
activitySchema.index({ timestamp: -1 });

delegateStatsSchema.index({ eventId: 1, committeeId: 1 });
delegateStatsSchema.index({ userEmail: 1, eventId: 1 }, { unique: true });
delegateStatsSchema.index({ 'scores.totalScore': -1 });

committeeStatsSchema.index({ eventId: 1 });
committeeStatsSchema.index({ lastCalculated: 1 });

// Methods for delegate statistics
delegateStatsSchema.methods.calculateScores = function () {
    // Participation Score (0-100)
    this.scores.participationScore = Math.min(100,
        (this.participation.attendanceRate * 50) +
        (Math.min(this.debate.totalSpeeches, 10) * 3) +
        (this.voting.votingRate * 20) +
        (Math.min(this.procedural.motionsSubmitted + this.procedural.questionsAsked, 10) * 2) +
        (Math.min(this.communication.messagesSent / 10, 10))
    );

    // Leadership Score (0-100)
    this.scores.leadershipScore = Math.min(100,
        (this.coalitions.coalitionsLed * 15) +
        (this.procedural.motionsSubmitted * 5) +
        (this.documentation.resolutionsSubmitted * 10) +
        (this.procedural.motionSuccessRate * 20) +
        (this.coalitions.successfulCoalitions * 10)
    );

    // Collaboration Score (0-100)
    this.scores.collaborationScore = Math.min(100,
        (this.coalitions.coalitionsJoined * 8) +
        (this.procedural.motionsSupported * 3) +
        (this.communication.conversationsStarted * 5) +
        (this.coalitions.resolutionsCoauthored * 12) +
        (Math.min(this.communication.messagesSent / 5, 20))
    );

    // Innovation Score (0-100)
    this.scores.innovationScore = Math.min(100,
        (this.documentation.documentsApproved * 15) +
        (this.debate.averageSpeechLength > 60 ? 10 : 0) +
        (this.procedural.questionsAsked * 3) +
        (this.documentation.totalWordsWritten / 100) +
        (this.achievements.length * 5)
    );

    // Total Score
    this.scores.totalScore = Math.round(
        (this.scores.participationScore * 0.3) +
        (this.scores.leadershipScore * 0.25) +
        (this.scores.collaborationScore * 0.25) +
        (this.scores.innovationScore * 0.2)
    );

    this.lastCalculated = new Date();
    return this;
};

delegateStatsSchema.methods.addAchievement = function (awardType, awardName, description, criteria = {}) {
    // Check if achievement already exists
    const existingAchievement = this.achievements.find(a => a.awardType === awardType);
    if (existingAchievement) {
        return this;
    }

    this.achievements.push({
        awardType,
        awardName,
        description,
        criteria,
        earnedAt: new Date()
    });

    return this;
};

// Static method to calculate rankings for committee
delegateStatsSchema.statics.calculateRankings = async function (committeeId) {
    const stats = await this.find({ committeeId })
        .sort({ 'scores.totalScore': -1 });

    for (let i = 0; i < stats.length; i++) {
        stats[i].scores.rankInCommittee = i + 1;
        await stats[i].save();
    }

    return stats;
};

const Activity = mongoose.model('Activity', activitySchema);
const DelegateStats = mongoose.model('DelegateStats', delegateStatsSchema);
const CommitteeStats = mongoose.model('CommitteeStats', committeeStatsSchema);

module.exports = { Activity, DelegateStats, CommitteeStats };