<!-- frontend/src/components/delegate/VotingInterface.vue -->
<template>
    <div class="voting-interface bg-white border border-mun-gray-200 rounded-lg">
        <!-- Header -->
        <div class="voting-header p-6 border-b border-mun-gray-200">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div :class="getVotingStatusIconBg()" class="p-3 rounded-xl">
                        <component :is="getVotingStatusIcon()" :class="getVotingStatusIconColor()" class="w-6 h-6" />
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-mun-gray-900">{{ voting.title }}</h3>
                        <p class="text-sm text-mun-gray-600">{{ getVotingTypeDisplay() }}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-2">
                    <!-- Voting Status Badge -->
                    <span :class="getVotingStatusBadgeClass()" class="px-3 py-1 text-sm font-medium rounded-full">
                        {{ getVotingStatusText() }}
                    </span>

                    <!-- Timer -->
                    <div v-if="voting.timeLimit && voting.status === 'active'"
                        class="timer-display flex items-center space-x-2 px-3 py-1 bg-mun-gray-100 rounded-full">
                        <ClockIcon class="w-4 h-4 text-mun-gray-600" />
                        <span class="text-sm font-medium text-mun-gray-900">
                            {{ formatTimeRemaining() }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Voting Subject -->
            <div class="voting-subject p-4 bg-mun-gray-50 rounded-lg mb-4">
                <h4 class="text-sm font-medium text-mun-gray-900 mb-2">Voting On:</h4>
                <p class="text-sm text-mun-gray-700">{{ voting.description || voting.fullText }}</p>
            </div>

            <!-- Majority Information -->
            <div class="majority-info grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div class="majority-item">
                    <div class="text-lg font-bold text-mun-gray-900">{{ voting.majorityThreshold }}</div>
                    <div class="text-xs text-mun-gray-600">Required for Passage</div>
                </div>
                <div class="majority-item">
                    <div class="text-lg font-bold text-mun-gray-900">{{ getMajorityTypeText() }}</div>
                    <div class="text-xs text-mun-gray-600">Majority Type</div>
                </div>
                <div class="majority-item">
                    <div class="text-lg font-bold text-mun-gray-900">{{ voting.eligibleVoters?.length || 0 }}</div>
                    <div class="text-xs text-mun-gray-600">Eligible Voters</div>
                </div>
            </div>
        </div>

        <!-- Voting Content -->
        <div class="voting-content p-6">
            <!-- User Vote Status -->
            <div v-if="userVoteStatus" class="user-vote-status mb-6 p-4 rounded-lg" :class="getUserVoteStatusClass()">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <component :is="getUserVoteIcon()" :class="getUserVoteIconColor()" class="w-5 h-5" />
                        <div>
                            <span class="text-sm font-medium" :class="getUserVoteTextColor()">
                                {{ getUserVoteText() }}
                            </span>
                            <p v-if="userVoteStatus.timestamp" class="text-xs" :class="getUserVoteTextColor()">
                                Voted {{ formatTime(userVoteStatus.timestamp) }}
                            </p>
                        </div>
                    </div>

                    <div v-if="userVoteStatus.isVeto" class="veto-indicator">
                        <span class="px-2 py-1 text-xs font-bold text-white bg-mun-red-600 rounded transform rotate-12">
                            VETO
                        </span>
                    </div>
                </div>
            </div>

            <!-- Roll Call Voting -->
            <div v-if="voting.votingType === 'rollCall'" class="roll-call-voting mb-6">
                <div class="roll-call-header flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-mun-gray-900">Roll Call Procedure</h4>
                    <span class="text-sm text-mun-gray-600">
                        {{ getCurrentVoterPosition() }} / {{ voting.rollCallOrder?.length || 0 }}
                    </span>
                </div>

                <!-- Current Voter -->
                <div v-if="voting.currentlyVoting"
                    class="current-voter mb-4 p-3 bg-mun-blue/5 border border-mun-blue/20 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 bg-mun-blue/10 rounded-lg">
                            <MicrophoneIcon class="w-5 h-5 text-mun-blue" />
                        </div>
                        <div>
                            <span class="text-sm font-medium text-mun-blue">
                                Currently Voting: {{ voting.currentlyVoting }}
                            </span>
                            <p v-if="isCurrentVoter" class="text-xs text-mun-blue">
                                It's your turn to vote
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Roll Call Progress -->
                <div class="roll-call-progress">
                    <div class="progress-bar w-full bg-mun-gray-200 rounded-full h-2 mb-2">
                        <div class="bg-mun-blue h-2 rounded-full transition-all duration-500"
                            :style="{ width: `${getRollCallProgress()}%` }"></div>
                    </div>
                    <div class="flex justify-between text-xs text-mun-gray-600">
                        <span>{{ getVotesCount() }} voted</span>
                        <span>{{ getPendingVotesCount() }} remaining</span>
                    </div>
                </div>
            </div>

            <!-- Voting Buttons -->
            <div v-if="canVote" class="voting-buttons">
                <h4 class="text-sm font-medium text-mun-gray-900 mb-4">Cast Your Vote</h4>

                <div class="vote-options grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <!-- Vote For -->
                    <button @click="castVote('for')" :disabled="isVoting || hasVoted" :class="[
                        'vote-btn vote-for p-4 border-2 rounded-lg transition-all duration-200',
                        'hover:shadow-mun focus:outline-none focus:ring-2 focus:ring-offset-2',
                        userVoteStatus?.vote === 'for'
                            ? 'border-mun-green-500 bg-mun-green-50 text-mun-green-700'
                            : 'border-mun-green-200 text-mun-green-700 hover:border-mun-green-300 hover:bg-mun-green-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    ]">
                        <div class="flex flex-col items-center space-y-2">
                            <HandThumbUpIcon class="w-8 h-8" />
                            <span class="font-medium">Vote For</span>
                            <span class="text-xs">Support the motion</span>
                        </div>
                    </button>

                    <!-- Vote Against -->
                    <button @click="castVote('against')" :disabled="isVoting || hasVoted" :class="[
                        'vote-btn vote-against p-4 border-2 rounded-lg transition-all duration-200',
                        'hover:shadow-mun focus:outline-none focus:ring-2 focus:ring-offset-2',
                        userVoteStatus?.vote === 'against'
                            ? 'border-mun-red-500 bg-mun-red-50 text-mun-red-700'
                            : 'border-mun-red-200 text-mun-red-700 hover:border-mun-red-300 hover:bg-mun-red-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    ]">
                        <div class="flex flex-col items-center space-y-2">
                            <HandThumbDownIcon class="w-8 h-8" />
                            <span class="font-medium">Vote Against</span>
                            <span class="text-xs">Oppose the motion</span>
                        </div>
                    </button>

                    <!-- Abstain -->
                    <button @click="castVote('abstain')" :disabled="isVoting || hasVoted" :class="[
                        'vote-btn vote-abstain p-4 border-2 rounded-lg transition-all duration-200',
                        'hover:shadow-mun focus:outline-none focus:ring-2 focus:ring-offset-2',
                        userVoteStatus?.vote === 'abstain'
                            ? 'border-mun-yellow-500 bg-mun-yellow-50 text-mun-yellow-700'
                            : 'border-mun-yellow-200 text-mun-yellow-700 hover:border-mun-yellow-300 hover:bg-mun-yellow-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    ]">
                        <div class="flex flex-col items-center space-y-2">
                            <MinusIcon class="w-8 h-8" />
                            <span class="font-medium">Abstain</span>
                            <span class="text-xs">Neither support nor oppose</span>
                        </div>
                    </button>
                </div>

                <!-- Veto Option (Security Council) -->
                <div v-if="canUseVeto" class="veto-option mb-6">
                    <div class="p-4 bg-mun-red-50 border border-mun-red-200 rounded-lg">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center space-x-2">
                                <ShieldExclamationIcon class="w-5 h-5 text-mun-red-600" />
                                <span class="text-sm font-medium text-mun-red-800">Security Council Veto</span>
                            </div>
                        </div>

                        <p class="text-xs text-mun-red-700 mb-3">
                            As a permanent member of the Security Council, you have the power to veto this resolution.
                        </p>

                        <button @click="castVeto" :disabled="isVoting || hasVoted"
                            class="w-full px-4 py-2 text-sm font-medium text-white bg-mun-red-600 border border-mun-red-600 rounded-lg hover:bg-mun-red-700 transition-colors disabled:opacity-50">
                            <ShieldExclamationIcon class="w-4 h-4 mr-2 inline" />
                            Cast Veto
                        </button>
                    </div>
                </div>

                <!-- Vote Confirmation -->
                <div v-if="pendingVote"
                    class="vote-confirmation p-4 bg-mun-blue-50 border border-mun-blue-200 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <ExclamationTriangleIcon class="w-5 h-5 text-mun-blue-600" />
                            <div>
                                <span class="text-sm font-medium text-mun-blue-900">
                                    Confirm your vote: {{ getVoteDisplayText(pendingVote) }}
                                </span>
                                <p class="text-xs text-mun-blue-700">This action cannot be undone</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2">
                            <button @click="cancelVote"
                                class="px-3 py-1 text-sm text-mun-blue-700 bg-white border border-mun-blue-200 rounded hover:bg-mun-blue-50 transition-colors">
                                Cancel
                            </button>
                            <button @click="confirmVote" :disabled="isVoting"
                                class="px-3 py-1 text-sm text-white bg-mun-blue-600 border border-mun-blue-600 rounded hover:bg-mun-blue-700 transition-colors disabled:opacity-50">
                                <LoadingSpinner v-if="isVoting" class="w-3 h-3 mr-1" />
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Voting Disabled Message -->
            <div v-else-if="!canVote"
                class="voting-disabled p-4 bg-mun-gray-50 border border-mun-gray-200 rounded-lg text-center">
                <div class="flex flex-col items-center space-y-2">
                    <XCircleIcon class="w-8 h-8 text-mun-gray-400" />
                    <span class="text-sm font-medium text-mun-gray-700">{{ getVotingDisabledReason() }}</span>
                </div>
            </div>

            <!-- Voting Results Preview -->
            <div v-if="voting.status === 'completed'" class="voting-results mt-6">
                <h4 class="text-sm font-medium text-mun-gray-900 mb-4">Results</h4>

                <div class="results-summary grid grid-cols-3 gap-4 mb-4">
                    <div class="result-item text-center p-3 bg-mun-green-50 rounded-lg">
                        <div class="text-lg font-bold text-mun-green-700">{{ voting.results?.votesFor || 0 }}</div>
                        <div class="text-xs text-mun-gray-600">For</div>
                    </div>
                    <div class="result-item text-center p-3 bg-mun-red-50 rounded-lg">
                        <div class="text-lg font-bold text-mun-red-700">{{ voting.results?.votesAgainst || 0 }}</div>
                        <div class="text-xs text-mun-gray-600">Against</div>
                    </div>
                    <div class="result-item text-center p-3 bg-mun-yellow-50 rounded-lg">
                        <div class="text-lg font-bold text-mun-yellow-700">{{ voting.results?.abstentions || 0 }}</div>
                        <div class="text-xs text-mun-gray-600">Abstentions</div>
                    </div>
                </div>

                <div class="final-result text-center p-4 rounded-lg" :class="getFinalResultClass()">
                    <div class="flex items-center justify-center space-x-2 mb-2">
                        <component :is="getFinalResultIcon()" class="w-6 h-6" />
                        <span class="text-lg font-bold">{{ getFinalResultText() }}</span>
                    </div>
                    <p class="text-sm opacity-80">{{ getFinalResultDescription() }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
    HandRaisedIcon,
    ClockIcon,
    MicrophoneIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    MinusIcon,
    ShieldExclamationIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    PauseIcon
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    voting: {
        type: Object,
        required: true
    },
    userVoteStatus: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['vote-cast', 'voting-updated'])

const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isVoting = ref(false)
const pendingVote = ref(null)
const timeRemaining = ref(0)
const timerInterval = ref(null)

// Computed
const canVote = computed(() => {
    return props.voting.status === 'active' &&
        !hasVoted.value &&
        isEligibleVoter.value &&
        (props.voting.votingType !== 'rollCall' || isCurrentVoter.value)
})

const hasVoted = computed(() => {
    return !!props.userVoteStatus?.vote
})

const isEligibleVoter = computed(() => {
    const userEmail = authStore.user?.email
    return props.voting.eligibleVoters?.some(voter => voter.email === userEmail)
})

const isCurrentVoter = computed(() => {
    return props.voting.currentlyVoting === authStore.user?.countryName
})

const canUseVeto = computed(() => {
    return authStore.user?.specialRole === 'security-council' &&
        props.voting.subjectType !== 'procedural_motion'
})

// Methods
const getVotingStatusIcon = () => {
    const status = props.voting.status
    if (status === 'active') return HandRaisedIcon
    if (status === 'completed') return CheckCircleIcon
    return PauseIcon
}

const getVotingStatusIconBg = () => {
    const status = props.voting.status
    const backgrounds = {
        active: 'bg-mun-green-100',
        completed: 'bg-mun-blue/10',
        paused: 'bg-mun-yellow-100'
    }
    return backgrounds[status] || 'bg-mun-gray-100'
}

const getVotingStatusIconColor = () => {
    const status = props.voting.status
    const colors = {
        active: 'text-mun-green-700',
        completed: 'text-mun-blue',
        paused: 'text-mun-yellow-700'
    }
    return colors[status] || 'text-mun-gray-600'
}

const getVotingStatusBadgeClass = () => {
    const status = props.voting.status
    const classes = {
        active: 'bg-mun-green-100 text-mun-green-700',
        completed: 'bg-mun-blue/10 text-mun-blue',
        paused: 'bg-mun-yellow-100 text-mun-yellow-700'
    }
    return classes[status] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getVotingStatusText = () => {
    const status = props.voting.status
    const texts = {
        active: 'Active Voting',
        completed: 'Voting Completed',
        paused: 'Voting Paused'
    }
    return texts[status] || 'Unknown Status'
}

const getVotingTypeDisplay = () => {
    const types = {
        simple: 'Simple Vote',
        rollCall: 'Roll Call Vote',
        secret: 'Secret Ballot'
    }
    return types[props.voting.votingType] || 'Voting'
}

const getMajorityTypeText = () => {
    const types = {
        simple: 'Simple Majority',
        qualified: 'Two-Thirds Majority',
        consensus: 'Consensus Required'
    }
    return types[props.voting.majorityRequired] || 'Simple Majority'
}

const getUserVoteIcon = () => {
    const vote = props.userVoteStatus?.vote
    if (vote === 'for') return HandThumbUpIcon
    if (vote === 'against') return HandThumbDownIcon
    if (vote === 'abstain') return MinusIcon
    return CheckCircleIcon
}

const getUserVoteStatusClass = () => {
    const vote = props.userVoteStatus?.vote
    const classes = {
        for: 'bg-mun-green-50 border border-mun-green-200',
        against: 'bg-mun-red-50 border border-mun-red-200',
        abstain: 'bg-mun-yellow-50 border border-mun-yellow-200'
    }
    return classes[vote] || 'bg-mun-gray-50 border border-mun-gray-200'
}

const getUserVoteIconColor = () => {
    const vote = props.userVoteStatus?.vote
    const colors = {
        for: 'text-mun-green-600',
        against: 'text-mun-red-600',
        abstain: 'text-mun-yellow-600'
    }
    return colors[vote] || 'text-mun-gray-600'
}

const getUserVoteTextColor = () => {
    const vote = props.userVoteStatus?.vote
    const colors = {
        for: 'text-mun-green-800',
        against: 'text-mun-red-800',
        abstain: 'text-mun-yellow-800'
    }
    return colors[vote] || 'text-mun-gray-800'
}

const getUserVoteText = () => {
    const vote = props.userVoteStatus?.vote
    if (props.userVoteStatus?.isVeto) return 'Veto Cast'

    const texts = {
        for: 'You voted FOR',
        against: 'You voted AGAINST',
        abstain: 'You abstained'
    }
    return texts[vote] || 'Vote recorded'
}

const getVotingDisabledReason = () => {
    if (hasVoted.value) return 'You have already voted'
    if (!isEligibleVoter.value) return 'You are not eligible to vote'
    if (props.voting.status !== 'active') return 'Voting is not currently active'
    if (props.voting.votingType === 'rollCall' && !isCurrentVoter.value) return 'Waiting for your turn'
    return 'Voting not available'
}

const getCurrentVoterPosition = () => {
    if (!props.voting.rollCallOrder) return 0
    return props.voting.rollCallOrder.indexOf(props.voting.currentlyVoting) + 1
}

const getRollCallProgress = () => {
    if (!props.voting.rollCallOrder?.length) return 0
    const position = getCurrentVoterPosition()
    return (position / props.voting.rollCallOrder.length) * 100
}

const getVotesCount = () => {
    return props.voting.votes?.length || 0
}

const getPendingVotesCount = () => {
    const total = props.voting.eligibleVoters?.length || 0
    const voted = getVotesCount()
    return total - voted
}

const getVoteDisplayText = (vote) => {
    const texts = {
        for: 'FOR',
        against: 'AGAINST',
        abstain: 'ABSTAIN'
    }
    return texts[vote] || vote.toUpperCase()
}

const getFinalResultClass = () => {
    return props.voting.results?.passed
        ? 'bg-mun-green-100 text-mun-green-800'
        : 'bg-mun-red-100 text-mun-red-800'
}

const getFinalResultIcon = () => {
    return props.voting.results?.passed ? CheckCircleIcon : XCircleIcon
}

const getFinalResultText = () => {
    return props.voting.results?.passed ? 'MOTION PASSED' : 'MOTION FAILED'
}

const getFinalResultDescription = () => {
    const results = props.voting.results
    if (!results) return ''

    return `${results.votesFor} for, ${results.votesAgainst} against, ${results.abstentions} abstentions`
}

const formatTime = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Unknown time'
    }
}

const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const castVote = (vote) => {
    pendingVote.value = vote
}

const castVeto = () => {
    pendingVote.value = 'veto'
}

const cancelVote = () => {
    pendingVote.value = null
}

const confirmVote = async () => {
    if (!pendingVote.value) return

    try {
        isVoting.value = true

        const voteData = {
            votingId: props.voting._id,
            vote: pendingVote.value === 'veto' ? 'against' : pendingVote.value,
            isVeto: pendingVote.value === 'veto'
        }

        const response = await apiMethods.voting.castVote(voteData)

        if (response.data.success) {
            emit('vote-cast', {
                voting: props.voting,
                vote: voteData
            })

            toast.success(pendingVote.value === 'veto' ? 'Veto cast successfully' : 'Vote cast successfully')
            pendingVote.value = null
        }

    } catch (error) {
        console.error('Cast vote error:', error)
        toast.error('Failed to cast vote')
    } finally {
        isVoting.value = false
    }
}

const updateTimer = () => {
    if (props.voting.timeLimit && props.voting.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(props.voting.startedAt)) / 1000)
        timeRemaining.value = Math.max(0, props.voting.timeLimit - elapsed)

        if (timeRemaining.value === 0) {
            clearInterval(timerInterval.value)
        }
    }
}

const setupTimer = () => {
    if (props.voting.timeLimit && props.voting.status === 'active') {
        updateTimer()
        timerInterval.value = setInterval(updateTimer, 1000)
    }
}

const clearTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
    }
}

// WebSocket listeners
const handleVotingUpdate = (data) => {
    emit('voting-updated', data)
}

// Lifecycle
onMounted(() => {
    setupTimer()

    if (wsStore.isConnected) {
        wsStore.on('voting-updated', handleVotingUpdate)
    }
})

onUnmounted(() => {
    clearTimer()

    if (wsStore.isConnected) {
        wsStore.off('voting-updated', handleVotingUpdate)
    }
})

// Watch for voting changes
watch(() => props.voting, (newVoting) => {
    clearTimer()
    if (newVoting.status === 'active') {
        setupTimer()
    }
}, { deep: true })
</script>

<style scoped>
/* Vote button animations */
.vote-btn {
    transition: all 0.2s ease;
}

.vote-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.vote-btn:active:not(:disabled) {
    transform: translateY(0);
}

/* Progress bar animation */
.progress-bar>div {
    transition: width 0.5s ease;
}

/* Timer pulse animation */
.timer-display {
    animation: timer-pulse 2s infinite;
}

@keyframes timer-pulse {

    0%,
    100% {
        background-color: rgb(243, 244, 246);
    }

    50% {
        background-color: rgb(254, 243, 199);
    }
}

/* Veto indicator animation */
.veto-indicator {
    animation: veto-glow 2s infinite;
}

@keyframes veto-glow {

    0%,
    100% {
        transform: rotate(12deg) scale(1);
    }

    50% {
        transform: rotate(12deg) scale(1.05);
    }
}

/* Vote confirmation animation */
.vote-confirmation {
    animation: confirmation-appear 0.3s ease-out;
}

@keyframes confirmation-appear {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Results animation */
.voting-results {
    animation: results-appear 0.5s ease-out;
}

@keyframes results-appear {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Roll call current voter highlight */
.current-voter {
    animation: current-voter-pulse 2s infinite;
}

@keyframes current-voter-pulse {

    0%,
    100% {
        background-color: rgba(0, 158, 219, 0.05);
        border-color: rgba(0, 158, 219, 0.2);
    }

    50% {
        background-color: rgba(0, 158, 219, 0.1);
        border-color: rgba(0, 158, 219, 0.3);
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .majority-info {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .vote-options {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .results-summary {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .voting-header {
        padding: 1rem;
    }

    .voting-content {
        padding: 1rem;
    }

    .vote-btn {
        padding: 1rem;
    }

    .vote-confirmation {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .vote-confirmation .flex.items-center.space-x-2 {
        justify-content: stretch;
        gap: 0.5rem;
    }

    .vote-confirmation button {
        flex: 1;
    }
}

/* Loading state */
.voting-interface.loading {
    pointer-events: none;
    opacity: 0.7;
}

/* Status transitions */
.voting-interface {
    transition: all 0.3s ease;
}

/* Focus states for accessibility */
.vote-btn:focus {
    ring: 2px;
    ring-offset: 2px;
}

.vote-for:focus {
    ring-color: rgb(34, 197, 94);
}

.vote-against:focus {
    ring-color: rgb(239, 68, 68);
}

.vote-abstain:focus {
    ring-color: rgb(245, 158, 11);
}
</style>