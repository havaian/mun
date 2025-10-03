<template>
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">{{ voting.title }}</h2>
                    <p class="text-sm text-gray-600 mt-1">{{ voting.description }}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <!-- Timer -->
                    <div v-if="timeRemaining > 0"
                        class="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                        <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-mono text-red-700">{{ formatTimer(timeRemaining) }}</span>
                    </div>

                    <!-- Voting Type Badge -->
                    <span :class="[
                        'px-3 py-1 text-xs font-medium rounded-full',
                        voting.votingType === 'roll-call' ? 'bg-blue-100 text-blue-800' :
                            voting.votingType === 'secret' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                    ]">
                        {{ getVotingTypeDisplay() }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Voting Content -->
        <div class="p-6">
            <!-- Roll Call Voting -->
            <div v-if="voting.votingType === 'roll-call'">
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Roll Call Vote</h3>
                    <p class="text-sm text-gray-600">
                        Countries will be called in alphabetical order. You will be notified when it's your turn to
                        vote.
                    </p>
                </div>

                <!-- Current Voter -->
                <div v-if="currentVoter" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-blue-900">Currently Voting</h4>
                            <p class="text-blue-700">{{ currentVoter.country }}</p>
                        </div>
                        <div v-if="currentVoter.country === userCountry" class="flex space-x-3">
                            <button @click="castVote('for')" :disabled="isVoting" class="btn-primary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                Vote For
                            </button>
                            <button @click="castVote('against')" :disabled="isVoting" class="btn-danger">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Vote Against
                            </button>
                            <button @click="castVote('abstain')" :disabled="isVoting" class="btn-secondary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M20 12H4" />
                                </svg>
                                Abstain
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Roll Call Progress -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700">Voting Progress</span>
                        <span class="text-sm text-gray-500">{{ votedCount }}/{{ totalVoters }} voted</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${(votedCount / totalVoters) * 100}%` }"></div>
                    </div>
                </div>

                <!-- Voting Order -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="(country, index) in votingOrder" :key="country.id" :class="[
                        'p-3 rounded-lg border',
                        country.hasVoted ? 'border-green-200 bg-green-50' :
                            country.country === currentVoter?.country ? 'border-blue-200 bg-blue-50' :
                                'border-gray-200 bg-white'
                    ]">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <span class="text-sm font-medium text-gray-900">{{ index + 1 }}.</span>
                                <span class="text-sm font-medium text-gray-900">{{ country.country }}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <div v-if="country.hasVoted" class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div v-else-if="country.country === currentVoter?.country"
                                    class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <div v-else class="w-2 h-2 bg-gray-300 rounded-full"></div>

                                <!-- Vote display (if visible) -->
                                <span v-if="country.hasVoted && voting.showVotes" :class="[
                                    'text-xs px-2 py-1 rounded-full font-medium',
                                    country.vote === 'for' ? 'bg-green-100 text-green-700' :
                                        country.vote === 'against' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                ]">
                                    {{ getVoteDisplay(country.vote) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Simple Voting -->
            <div v-else>
                <div class="max-w-md mx-auto">
                    <!-- Vote Options -->
                    <div class="space-y-4 mb-6">
                        <h3 class="text-lg font-medium text-gray-900 text-center mb-4">Cast Your Vote</h3>

                        <button @click="castVote('for')" :disabled="isVoting || hasVoted" :class="[
                            'w-full p-4 rounded-lg border-2 transition-all font-medium',
                            selectedVote === 'for' ? 'border-green-500 bg-green-50 text-green-700' :
                                'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        ]">
                            <div class="flex items-center justify-center space-x-3">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Vote For</span>
                            </div>
                        </button>

                        <button @click="castVote('against')" :disabled="isVoting || hasVoted" :class="[
                            'w-full p-4 rounded-lg border-2 transition-all font-medium',
                            selectedVote === 'against' ? 'border-red-500 bg-red-50 text-red-700' :
                                'border-gray-200 hover:border-red-300 hover:bg-red-50'
                        ]">
                            <div class="flex items-center justify-center space-x-3">
                                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Vote Against</span>
                            </div>
                        </button>

                        <button @click="castVote('abstain')" :disabled="isVoting || hasVoted" :class="[
                            'w-full p-4 rounded-lg border-2 transition-all font-medium',
                            selectedVote === 'abstain' ? 'border-gray-500 bg-gray-50 text-gray-700' :
                                'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        ]">
                            <div class="flex items-center justify-center space-x-3">
                                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M20 12H4" />
                                </svg>
                                <span>Abstain</span>
                            </div>
                        </button>
                    </div>

                    <!-- Vote Confirmation -->
                    <div v-if="hasVoted" class="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <svg class="mx-auto w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 class="text-lg font-medium text-green-900 mb-1">Vote Recorded</h3>
                        <p class="text-sm text-green-700">Your vote has been successfully recorded.</p>
                    </div>
                </div>
            </div>

            <!-- Results (if visible) -->
            <div v-if="voting.showResults && results" class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Current Results</h3>

                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <p class="text-2xl font-bold text-green-600">{{ results.for || 0 }}</p>
                        <p class="text-sm text-green-700">For</p>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded-lg">
                        <p class="text-2xl font-bold text-red-600">{{ results.against || 0 }}</p>
                        <p class="text-sm text-red-700">Against</p>
                    </div>
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <p class="text-2xl font-bold text-gray-600">{{ results.abstain || 0 }}</p>
                        <p class="text-sm text-gray-700">Abstain</p>
                    </div>
                </div>

                <!-- Majority Indicator -->
                <div class="text-center">
                    <p class="text-sm text-gray-600">
                        {{ results.for || 0 }} / {{ Math.ceil(totalVoters / 2) }} needed for simple majority
                    </p>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-green-600 h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${Math.min(100, ((results.for || 0) / Math.ceil(totalVoters / 2)) * 100)}%` }">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                    <p>{{ voting.majorityType }} required</p>
                    <p v-if="voting.hasVetoRights">Security Council voting rules apply</p>
                </div>
                <button @click="$emit('close')" class="btn-secondary">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/websocket'

const emit = defineEmits(['close', 'vote'])
const props = defineProps({
    voting: {
        type: Object,
        required: true
    }
})

const authStore = useAuthStore()
const socketStore = useSocketStore()

// State
const selectedVote = ref('')
const hasVoted = ref(false)
const isVoting = ref(false)
const timeRemaining = ref(0)
const currentVoter = ref(null)
const votingOrder = ref([])
const results = ref(null)

// Timer
let timer = null

// Computed
const userCountry = computed(() => {
    return authStore.user?.country
})

const votedCount = computed(() => {
    return votingOrder.value.filter(v => v.hasVoted).length
})

const totalVoters = computed(() => {
    return votingOrder.value.length
})

// Methods
async function castVote(vote) {
    if (isVoting.value || hasVoted.value) return

    isVoting.value = true
    selectedVote.value = vote

    try {
        const response = await authStore.apiCall(`/delegate/voting/${props.voting.id}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote })
        })

        if (response.ok) {
            hasVoted.value = true
            emit('vote', { vote, votingId: props.voting.id })

            window.showNotification({
                type: 'success',
                title: 'Vote Cast',
                message: `Your vote "${getVoteDisplay(vote)}" has been recorded`
            })
        } else {
            throw new Error('Failed to cast vote')
        }
    } catch (error) {
        console.error('Voting error:', error)
        window.showNotification({
            type: 'error',
            title: 'Voting Error',
            message: 'Failed to cast your vote. Please try again.'
        })
        selectedVote.value = ''
    } finally {
        isVoting.value = false
    }
}

function getVotingTypeDisplay() {
    switch (props.voting.votingType) {
        case 'roll-call':
            return 'Roll Call Vote'
        case 'secret':
            return 'Secret Ballot'
        default:
            return 'Simple Vote'
    }
}

function getVoteDisplay(vote) {
    switch (vote) {
        case 'for':
            return 'For'
        case 'against':
            return 'Against'
        case 'abstain':
            return 'Abstain'
        default:
            return vote
    }
}

function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function startTimer() {
    if (timer) clearInterval(timer)

    timer = setInterval(() => {
        if (timeRemaining.value > 0) {
            timeRemaining.value--
        } else {
            clearInterval(timer)
            timer = null
        }
    }, 1000)
}

async function fetchVotingData() {
    try {
        const response = await authStore.apiCall(`/delegate/voting/${props.voting.id}`)
        if (response.ok) {
            const data = await response.json()

            hasVoted.value = data.hasVoted || false
            selectedVote.value = data.myVote || ''
            timeRemaining.value = data.timeRemaining || 0
            currentVoter.value = data.currentVoter
            votingOrder.value = data.votingOrder || []
            results.value = data.results

            if (timeRemaining.value > 0) {
                startTimer()
            }
        }
    } catch (error) {
        console.error('Fetch voting data error:', error)
    }
}

// Watch for voting updates
watch(() => props.voting, (newVoting) => {
    if (newVoting) {
        fetchVotingData()
    }
}, { immediate: true })

// Initialize
onMounted(() => {
    fetchVotingData()

    // Listen for real-time voting updates
    const unsubscribes = [
        socketStore.subscribe(`voting:${props.voting.id}:update`, (data) => {
            if (data.currentVoter) {
                currentVoter.value = data.currentVoter
            }
            if (data.votingOrder) {
                votingOrder.value = data.votingOrder
            }
            if (data.results) {
                results.value = data.results
            }
            if (data.timeRemaining !== undefined) {
                timeRemaining.value = data.timeRemaining
                if (data.timeRemaining > 0 && !timer) {
                    startTimer()
                }
            }
        }),

        socketStore.subscribe(`voting:${props.voting.id}:completed`, (data) => {
            if (timer) {
                clearInterval(timer)
                timer = null
            }
            results.value = data.results

            window.showNotification({
                type: 'info',
                title: 'Voting Completed',
                message: data.results.passed ? 'Motion passed' : 'Motion failed'
            })
        })
    ]

    onUnmounted(() => {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
        unsubscribes.forEach(unsubscribe => unsubscribe())
    })
})
</script>