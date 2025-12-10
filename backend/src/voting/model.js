const mongoose = require('mongoose');

// Individual vote schema
const voteSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true
    },

    vote: {
        type: String,
        enum: ['for', 'against', 'abstain'],
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now
    },

    // For roll call voting
    rollCallPosition: {
        type: Number,
        default: null
    },

    // Veto information (for Security Council)
    isVeto: {
        type: Boolean,
        default: false
    },

    vetoJustification: {
        type: String,
        default: null
    }
}, { _id: false });

// Eligible voter schema
const eligibleVoterSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true
    },

    hasVetoRight: {
        type: Boolean,
        default: false
    },

    canVote: {
        type: Boolean,
        required: true
    },

    attendanceStatus: {
        type: String,
        enum: ['present_and_voting', 'present', 'absent'],
        required: true
    }
}, { _id: false });

// Results schema
const resultsSchema = new mongoose.Schema({
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

    totalVotes: {
        type: Number,
        default: 0
    },

    presentVoters: {
        type: Number,
        default: 0
    },

    passed: {
        type: Boolean,
        default: false
    },

    // Veto information
    vetoUsed: {
        type: Boolean,
        default: false
    },

    vetoCountry: {
        type: String,
        default: null
    },

    // Majority calculation
    majorityThreshold: {
        type: Number,
        required: true
    },

    actualMajority: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Main voting schema
const votingSchema = new mongoose.Schema({
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

    // Type and subject of voting
    votingType: {
        type: String,
        enum: ['simple', 'rollCall'],
        required: true
    },

    subjectType: {
        type: String,
        enum: ['resolution', 'amendment', 'procedural_motion', 'question'],
        required: true
    },

    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    // Content
    title: {
        type: String,
        required: true,
        maxlength: 300
    },

    description: {
        type: String,
        maxlength: 1000
    },

    fullText: {
        type: String, // Full text being voted on
        required: true
    },

    // Majority requirements
    majorityRequired: {
        type: String,
        enum: ['simple', 'qualified', 'consensus'],
        default: 'simple'
    },

    majorityThreshold: {
        type: Number,
        required: true
    },

    // Participants
    eligibleVoters: [eligibleVoterSchema],

    // Votes
    votes: [voteSchema],

    // Roll call specific data
    rollCallOrder: [String], // Array of country names in alphabetical order

    currentlyVoting: {
        type: String,
        default: null
    },

    skippedCountries: [String], // Countries that skipped their turn

    // Status and timing
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending'
    },

    startedAt: {
        type: Date,
        default: null
    },

    completedAt: {
        type: Date,
        default: null
    },

    timeLimit: {
        type: Number, // seconds
        default: null
    },

    // Results
    results: resultsSchema,

    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    collection: 'votings'
});

// Indexes for performance
votingSchema.index({ committeeId: 1, status: 1 });
votingSchema.index({ sessionId: 1 });
votingSchema.index({ subjectType: 1, subjectId: 1 });
votingSchema.index({ 'eligibleVoters.email': 1 });
votingSchema.index({ startedAt: -1 });

// Methods for voting management
votingSchema.methods.calculateMajorityThreshold = function() {
    const presentVoters = this.eligibleVoters.filter(v => 
        v.attendanceStatus === 'present_and_voting' && v.canVote
    ).length;

    switch (this.majorityRequired) {
        case 'simple':
            return Math.floor(presentVoters / 2) + 1;
        case 'qualified':
            return Math.ceil(presentVoters * 2 / 3);
        case 'consensus':
            return presentVoters; // All must agree or abstain
        default:
            return Math.floor(presentVoters / 2) + 1;
    }
};

votingSchema.methods.calculateResults = function() {
    const votesFor = this.votes.filter(v => v.vote === 'for').length;
    const votesAgainst = this.votes.filter(v => v.vote === 'against').length;
    const abstentions = this.votes.filter(v => v.vote === 'abstain').length;
    const totalVotes = this.votes.length;
    
    // Check for veto usage
    const vetoVote = this.votes.find(v => v.isVeto && v.vote === 'against');
    const vetoUsed = !!vetoVote;
    
    // Calculate if passed
    let passed = false;
    if (!vetoUsed) {
        switch (this.majorityRequired) {
            case 'simple':
                passed = votesFor > votesAgainst;
                break;
            case 'qualified':
                passed = votesFor >= this.majorityThreshold;
                break;
            case 'consensus':
                passed = votesAgainst === 0;
                break;
        }
    }

    this.results = {
        votesFor,
        votesAgainst,
        abstentions,
        totalVotes,
        presentVoters: this.eligibleVoters.filter(v => 
            v.attendanceStatus === 'present_and_voting' && v.canVote
        ).length,
        passed,
        vetoUsed,
        vetoCountry: vetoVote ? vetoVote.country : null,
        majorityThreshold: this.majorityThreshold,
        actualMajority: votesFor
    };
};

votingSchema.methods.canVote = function(email) {
    const voter = this.eligibleVoters.find(v => v.email === email);
    if (!voter) return false;
    
    return voter.canVote && 
           voter.attendanceStatus === 'present_and_voting' && 
           !this.votes.find(v => v.email === email);
};

votingSchema.methods.hasVetoRight = function(email) {
    const voter = this.eligibleVoters.find(v => v.email === email);
    return voter ? voter.hasVetoRight : false;
};

votingSchema.methods.getNextRollCallVoter = function() {
    if (this.votingType !== 'rollCall') return null;
    
    // Find next voter who hasn't voted and isn't skipped
    for (const country of this.rollCallOrder) {
        const hasVoted = this.votes.find(v => v.country === country);
        const isSkipped = this.skippedCountries.includes(country);
        const voter = this.eligibleVoters.find(v => v.country === country);
        
        if (!hasVoted && !isSkipped && voter && voter.canVote) {
            return country;
        }
    }
    
    // If all eligible voters have been called, return first skipped country
    for (const country of this.skippedCountries) {
        const hasVoted = this.votes.find(v => v.country === country);
        const voter = this.eligibleVoters.find(v => v.country === country);
        
        if (!hasVoted && voter && voter.canVote) {
            return country;
        }
    }
    
    return null;
};

votingSchema.methods.canSkipInRollCall = function(country) {
    // Can only skip if not already skipped and it's first time being called
    return !this.skippedCountries.includes(country) && 
           !this.votes.find(v => v.country === country);
};

// For skipped countries voting at the end - cannot abstain
votingSchema.methods.getAllowedVotesForSkipped = function(country) {
    if (this.skippedCountries.includes(country)) {
        return ['for', 'against']; // No abstain for skipped countries
    }
    return ['for', 'against', 'abstain'];
};

const Voting = mongoose.model('Voting', votingSchema);

module.exports = { Voting };