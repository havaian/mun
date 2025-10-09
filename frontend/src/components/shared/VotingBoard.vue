<!-- frontend/src/components/shared/VotingBoard.vue -->
<template>
    <div class="voting-board" :class="boardClasses">
        <!-- Board Header -->
        <div class="board-header" :class="headerClasses">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold text-white">
                        {{ voting.subject || 'Voting in Progress' }}
                    </h2>
                    <p class="text-un-blue-100 text-sm mt-1">
                        {{ voting.description || `${votingTypeDisplay} • ${majorityDisplay}` }}
                    </p>
                </div>

                <div class="voting-status" :class="statusClasses">
                    <div class="text-right">
                        <div class="text-2xl font-bold text-white">
                            {{ progressPercentage }}%
                        </div>
                        <div class="text-xs text-un-blue-100">
                            {{ votesReceived }}/{{ totalVoters }} votes
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Voting Grid -->
        <div class="voting-grid" :class="gridClasses">
            <!-- Country voting cards -->
            <div v-for="country in sortedCountries" :key="country.countryName" class="country-vote-card"
                :class="getCountryCardClasses(country)" @click="handleCountryClick(country)">
                <!-- Flag -->
                <div class="country-flag-container">
                    <CountryFlag :country-name="country.countryName" :country-code="country.countryCode" size="medium"
                        shape="rectangular" :show-status="false" />
                </div>

                <!-- Country name -->
                <div class="country-name" :class="getCountryNameClasses(country)">
                    <span class="country-name-text" :title="country.countryName">
                        {{ truncateCountryName(country.countryName) }}
                    </span>

                    <!-- Special role indicator -->
                    <span v-if="country.specialRole" class="special-role-badge"
                        :class="getSpecialRoleClasses(country.specialRole)">
                        {{ getSpecialRoleIcon(country.specialRole) }}
                    </span>
                </div>

                <!-- Vote indicator -->
                <div class="vote-indicator" :class="getVoteIndicatorClasses(country)">
                    <!-- Vote icon -->
                    <div class="vote-icon">
                        <CheckCircleIcon v-if="country.vote === 'favour'" class="w-6 h-6 text-green-600" />
                        <XCircleIcon v-else-if="country.vote === 'against'" class="w-6 h-6 text-red-600" />
                        <MinusCircleIcon v-else-if="country.vote === 'abstention'" class="w-6 h-6 text-amber-600" />
                        <ClockIcon v-else-if="isVotingActive && country.isEligible"
                            class="w-5 h-5 text-mun-gray-400 animate-pulse" />
                        <UserIcon v-else-if="!country.isEligible" class="w-5 h-5 text-mun-gray-300"
                            title="Observer - Cannot vote" />
                    </div>

                    <!-- Vote text -->
                    <div class="vote-text" :class="getVoteTextClasses(country)">
                        {{ getVoteDisplayText(country) }}
                    </div>
                </div>

                <!-- Roll call indicator (if roll call voting) -->
                <div v-if="isRollCall && country.isEligible" class="roll-call-indicator"
                    :class="getRollCallClasses(country)">
                    <span v-if="country.rollCallPosition" class="roll-call-number">
                        {{ country.rollCallPosition }}
                    </span>
                    <ChevronRightIcon v-if="isCurrentVoter(country)" class="w-4 h-4 text-un-blue animate-pulse" />
                </div>

                <!-- Veto indicator (Security Council) -->
                <div v-if="country.specialRole === 'security-council' && voting.vetoPossible" class="veto-indicator"
                    :class="getVetoClasses(country)">
                    <span class="veto-text">VETO</span>
                </div>
            </div>
        </div>

        <!-- Voting Summary -->
        <div class="voting-summary" :class="summaryClasses">
            <div class="summary-grid">
                <!-- In Favour -->
                <div class="summary-item favour">
                    <div class="summary-icon">
                        <CheckCircleIcon class="w-8 h-8 text-green-600" />
                    </div>
                    <div class="summary-content">
                        <div class="summary-number">{{ results.favour || 0 }}</div>
                        <div class="summary-label">In Favour</div>
                    </div>
                </div>

                <!-- Against -->
                <div class="summary-item against">
                    <div class="summary-icon">
                        <XCircleIcon class="w-8 h-8 text-red-600" />
                    </div>
                    <div class="summary-content">
                        <div class="summary-number">{{ results.against || 0 }}</div>
                        <div class="summary-label">Against</div>
                    </div>
                </div>

                <!-- Abstentions -->
                <div class="summary-item abstention">
                    <div class="summary-icon">
                        <MinusCircleIcon class="w-8 h-8 text-amber-600" />
                    </div>
                    <div class="summary-content">
                        <div class="summary-number">{{ results.abstention || 0 }}</div>
                        <div class="summary-label">Abstention</div>
                    </div>
                </div>

                <!-- Absent -->
                <div class="summary-item absent">
                    <div class="summary-icon">
                        <UserIcon class="w-8 h-8 text-mun-gray-400" />
                    </div>
                    <div class="summary-content">
                        <div class="summary-number">{{ results.absent || 0 }}</div>
                        <div class="summary-label">Absent</div>
                    </div>
                </div>

                <!-- Majority indicator -->
                <div class="majority-indicator" :class="getMajorityClasses()">
                    <div class="majority-content">
                        <div class="majority-number">{{ requiredMajority }}</div>
                        <div class="majority-label">Required</div>
                        <div v-if="voting.status === 'completed'" class="majority-result" :class="getResultClasses()">
                            {{ results.passed ? 'PASSED' : 'FAILED' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="showFooter" class="board-footer" :class="footerClasses">
            <div class="flex items-center justify-between text-sm">
                <div class="footer-info">
                    <span v-if="voting.startedAt">
                        Started {{ formatRelativeTime(voting.startedAt) }}
                    </span>
                    <span v-if="voting.timeLimit" class="ml-4">
                        Time Limit: {{ formatDuration(voting.timeLimit) }}
                    </span>
                </div>

                <div v-if="isRollCall && currentVoterCountry" class="current-voter">
                    <span class="text-mun-gray-600">Current: </span>
                    <span class="font-semibold text-un-blue">{{ currentVoterCountry }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import {
    CheckCircleIcon,
    XCircleIcon,
    MinusCircleIcon,
    ClockIcon,
    UserIcon,
    ChevronRightIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from './CountryFlag.vue'

// Props
const props = defineProps({
    // Voting data
    voting: {
        type: Object,
        required: true
    },
    countries: {
        type: Array,
        required: true
    },
    votes: {
        type: Array,
        default: () => []
    },

    // Display options
    size: {
        type: String,
        default: 'large', // medium, large, xl
        validator: (value) => ['medium', 'large', 'xl'].includes(value)
    },
    layout: {
        type: String,
        default: 'grid', // grid, list, compact
        validator: (value) => ['grid', 'list', 'compact'].includes(value)
    },
    sortBy: {
        type: String,
        default: 'alphabetical', // alphabetical, vote-status, roll-call
        validator: (value) => ['alphabetical', 'vote-status', 'roll-call'].includes(value)
    },

    // Features
    showFooter: {
        type: Boolean,
        default: true
    },
    interactive: {
        type: Boolean,
        default: false
    },
    highlightCurrent: {
        type: Boolean,
        default: true
    },

    // Roll call specific
    rollCallOrder: {
        type: Array,
        default: () => []
    },
    currentVoter: {
        type: String,
        default: ''
    },

    // Real-time updates
    realTimeUpdates: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits(['country-click', 'vote-update'])

// Computed
const isVotingActive = computed(() => {
    return props.voting.status === 'active'
})

const isRollCall = computed(() => {
    return props.voting.votingType === 'roll-call'
})

const votingTypeDisplay = computed(() => {
    const types = {
        'simple': 'Simple Majority',
        'roll-call': 'Roll Call Vote',
        'secret': 'Secret Ballot',
        'veto-enabled': 'Security Council Vote'
    }
    return types[props.voting.votingType] || 'Voting'
})

const majorityDisplay = computed(() => {
    const types = {
        'simple': 'Simple Majority',
        'two-thirds': 'Two-Thirds Majority',
        'consensus': 'Consensus Required',
        'unanimity': 'Unanimous Consent'
    }
    return types[props.voting.majorityType] || 'Majority Required'
})

const votesReceived = computed(() => {
    return props.votes.length
})

const totalVoters = computed(() => {
    return props.countries.filter(c => c.isEligible).length
})

const progressPercentage = computed(() => {
    if (totalVoters.value === 0) return 0
    return Math.round((votesReceived.value / totalVoters.value) * 100)
})

const requiredMajority = computed(() => {
    const total = totalVoters.value
    switch (props.voting.majorityType) {
        case 'simple':
            return Math.floor(total / 2) + 1
        case 'two-thirds':
            return Math.ceil(total * 2 / 3)
        case 'consensus':
            return total
        case 'unanimity':
            return total
        default:
            return Math.floor(total / 2) + 1
    }
})

const results = computed(() => {
    const counts = {
        favour: 0,
        against: 0,
        abstention: 0,
        absent: 0
    }

    // Count votes
    props.votes.forEach(vote => {
        if (counts.hasOwnProperty(vote.choice)) {
            counts[vote.choice]++
        }
    })

    // Count absent (eligible voters who haven't voted)
    const votedEmails = props.votes.map(v => v.voterEmail)
    counts.absent = props.countries.filter(c =>
        c.isEligible && !votedEmails.includes(c.email)
    ).length

    return counts
})

const currentVoterCountry = computed(() => {
    if (!isRollCall.value || !props.currentVoter) return ''
    const country = props.countries.find(c => c.email === props.currentVoter)
    return country?.countryName || ''
})

const sortedCountries = computed(() => {
    let sorted = [...props.countries]

    switch (props.sortBy) {
        case 'alphabetical':
            sorted.sort((a, b) => a.countryName.localeCompare(b.countryName))
            break
        case 'vote-status':
            sorted.sort((a, b) => {
                const aVote = getCountryVote(a)
                const bVote = getCountryVote(b)
                const voteOrder = { 'favour': 0, 'against': 1, 'abstention': 2, 'pending': 3, 'absent': 4 }
                return (voteOrder[aVote] || 5) - (voteOrder[bVote] || 5)
            })
            break
        case 'roll-call':
            if (isRollCall.value) {
                sorted.sort((a, b) => (a.rollCallPosition || 999) - (b.rollCallPosition || 999))
            }
            break
    }

    return sorted
})

// Style classes
const boardClasses = computed(() => {
    const base = 'voting-board bg-white border border-mun-gray-200 rounded-lg shadow-lg overflow-hidden'
    const sizeClasses = {
        medium: 'max-w-4xl',
        large: 'max-w-6xl',
        xl: 'max-w-7xl'
    }

    return `${base} ${sizeClasses[props.size]}`
})

const headerClasses = computed(() => {
    return 'bg-gradient-to-r from-un-blue to-un-blue-600 px-6 py-4'
})

const statusClasses = computed(() => {
    return 'voting-progress'
})

const gridClasses = computed(() => {
    const base = 'p-6'
    const layoutClasses = {
        grid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
        list: 'space-y-2',
        compact: 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2'
    }

    return `${base} ${layoutClasses[props.layout]}`
})

const summaryClasses = computed(() => {
    return 'bg-mun-gray-50 border-t border-mun-gray-200 px-6 py-4'
})

const footerClasses = computed(() => {
    return 'bg-mun-gray-100 border-t border-mun-gray-200 px-6 py-3 text-mun-gray-600'
})

// Methods
const getCountryVote = (country) => {
    const vote = props.votes.find(v => v.voterEmail === country.email)
    if (vote) return vote.choice
    if (!country.isEligible) return 'observer'
    if (isVotingActive.value) return 'pending'
    return 'absent'
}

const getCountryCardClasses = (country) => {
    const base = 'country-vote-card bg-white border rounded-lg p-3 transition-all duration-200'
    const vote = getCountryVote(country)

    const voteClasses = {
        favour: 'border-green-200 bg-green-50',
        against: 'border-red-200 bg-red-50',
        abstention: 'border-amber-200 bg-amber-50',
        pending: 'border-mun-gray-200 hover:border-un-blue-300',
        absent: 'border-mun-gray-200 bg-mun-gray-50',
        observer: 'border-mun-gray-200 bg-mun-gray-50 opacity-75'
    }

    const interactiveClass = props.interactive ? 'cursor-pointer hover:shadow-md' : ''
    const currentClass = isCurrentVoter(country) && props.highlightCurrent ? 'ring-2 ring-un-blue shadow-md' : ''

    return `${base} ${voteClasses[vote]} ${interactiveClass} ${currentClass}`
}

const getCountryNameClasses = (country) => {
    const base = 'text-center mt-2'
    const vote = getCountryVote(country)

    const textClasses = {
        favour: 'text-green-700',
        against: 'text-red-700',
        abstention: 'text-amber-700',
        pending: 'text-mun-gray-700',
        absent: 'text-mun-gray-500',
        observer: 'text-mun-gray-400'
    }

    return `${base} ${textClasses[vote]}`
}

const getVoteIndicatorClasses = (country) => {
    return 'flex flex-col items-center mt-2 space-y-1'
}

const getVoteTextClasses = (country) => {
    const base = 'text-xs font-medium'
    const vote = getCountryVote(country)

    const colorClasses = {
        favour: 'text-green-600',
        against: 'text-red-600',
        abstention: 'text-amber-600',
        pending: 'text-mun-gray-500',
        absent: 'text-mun-gray-400',
        observer: 'text-mun-gray-400'
    }

    return `${base} ${colorClasses[vote]}`
}

const getRollCallClasses = (country) => {
    const base = 'absolute top-1 right-1 flex items-center space-x-1'
    return base
}

const getVetoClasses = (country) => {
    const base = 'absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-1 rounded'
    const vote = getCountryVote(country)

    if (vote === 'against' && country.vetoUsed) {
        return `${base} bg-red-700`
    }

    return `${base} opacity-30`
}

const getSpecialRoleClasses = (role) => {
    const base = 'inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full ml-1'

    const roleClasses = {
        'security-council': 'bg-red-100 text-red-600',
        'observer': 'bg-blue-100 text-blue-600',
        'president': 'bg-yellow-100 text-yellow-600'
    }

    return `${base} ${roleClasses[role] || 'bg-mun-gray-100 text-mun-gray-600'}`
}

const getMajorityClasses = () => {
    const base = 'majority-indicator border-l-4 pl-4'
    const borderClass = props.voting.status === 'completed'
        ? (results.value.passed ? 'border-green-500' : 'border-red-500')
        : 'border-un-blue'

    return `${base} ${borderClass}`
}

const getResultClasses = () => {
    return results.value.passed
        ? 'text-green-600 font-bold'
        : 'text-red-600 font-bold'
}

const getVoteDisplayText = (country) => {
    const vote = getCountryVote(country)

    const displayTexts = {
        favour: 'For',
        against: 'Against',
        abstention: 'Abstain',
        pending: 'Pending',
        absent: 'Absent',
        observer: 'Observer'
    }

    return displayTexts[vote] || ''
}

const getSpecialRoleIcon = (role) => {
    const icons = {
        'security-council': 'SC',
        'observer': 'O',
        'president': 'P'
    }

    return icons[role] || ''
}

const isCurrentVoter = (country) => {
    return isRollCall.value && country.email === props.currentVoter
}

const truncateCountryName = (name) => {
    if (props.layout === 'compact' && name.length > 8) {
        return name.substring(0, 8) + '...'
    }
    if (name.length > 15) {
        return name.substring(0, 15) + '...'
    }
    return name
}

const handleCountryClick = (country) => {
    if (props.interactive) {
        emit('country-click', country)
    }
}

const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
}

const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}
</script>

<style scoped>
.voting-board {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.country-vote-card {
    min-height: 120px;
    position: relative;
}

.country-flag-container {
    display: flex;
    justify-content: center;
}

.country-name-text {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
}

.special-role-badge {
    vertical-align: super;
}

.vote-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 24px;
}

.vote-text {
    text-align: center;
    min-height: 16px;
}

.roll-call-indicator {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 0.375rem;
    padding: 0.125rem 0.25rem;
}

.roll-call-number {
    font-size: 0.6rem;
    font-weight: bold;
    color: rgb(59 130 246);
}

.veto-indicator {
    transform: rotate(-15deg);
}

.veto-text {
    font-size: 0.5rem;
    letter-spacing: 0.05em;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1.5rem;
    align-items: center;
}

.summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.summary-content {
    margin-top: 0.5rem;
}

.summary-number {
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
}

.summary-label {
    font-size: 0.75rem;
    color: rgb(107 114 128);
    margin-top: 0.25rem;
}

.majority-content {
    text-align: center;
}

.majority-number {
    font-size: 1.25rem;
    font-weight: bold;
    color: rgb(59 130 246);
}

.majority-label {
    font-size: 0.75rem;
    color: rgb(107 114 128);
    margin-top: 0.25rem;
}

.majority-result {
    font-size: 0.875rem;
    margin-top: 0.5rem;
    letter-spacing: 0.05em;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .summary-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }

    .majority-indicator {
        grid-column: span 3;
        border-left: none;
        border-top: 4px solid;
        padding-left: 0;
        padding-top: 1rem;
        margin-top: 1rem;
    }

    .country-vote-card {
        min-height: 100px;
    }

    .summary-number {
        font-size: 1.25rem;
    }
}

@media (max-width: 480px) {
    .summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .majority-indicator {
        grid-column: span 2;
    }
}

/* Animation for real-time updates */
@keyframes vote-update {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

.country-vote-card.vote-updated {
    animation: vote-update 0.3s ease-in-out;
}

/* Accessibility */
.country-vote-card:focus {
    outline: 2px solid rgb(59 130 246);
    outline-offset: 2px;
}

/* Print styles */
@media print {
    .voting-board {
        box-shadow: none;
        border: 1px solid #000;
    }

    .board-header {
        background: #f3f4f6 !important;
        color: #000 !important;
    }

    .country-vote-card {
        break-inside: avoid;
    }
}
</style>