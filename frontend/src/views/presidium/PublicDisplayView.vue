<template>
    <div class="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
        <!-- Session View -->
        <div v-if="displayMode === 'session'" class="h-full flex flex-col">
            <!-- Header -->
            <div class="bg-black/40 backdrop-blur-sm px-8 py-6 border-b border-white/20">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-4xl font-bold mb-1">{{ committee?.name || 'MUN Committee' }}</h1>
                        <p class="text-xl text-blue-200">
                            Session {{ currentSession?.sessionNumber || 'N/A' }} - {{ formattedMode }}
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-6xl font-bold font-mono">{{ formattedTimer }}</p>
                        <p class="text-lg text-gray-300 uppercase tracking-wide">{{ currentTimerName }}</p>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 grid grid-cols-3 gap-6 p-8">
                <!-- Left Column: Current Speaker -->
                <div class="col-span-1 space-y-6">
                    <!-- Current Speaker -->
                    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                        <h2 class="text-2xl font-bold mb-4 text-center">Current Speaker</h2>
                        <div class="text-center">
                            <div v-if="currentSpeaker" class="space-y-4">
                                <div
                                    class="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
                                    <MicrophoneIcon class="w-16 h-16 text-white" />
                                </div>
                                <h3 class="text-3xl font-bold">{{ currentSpeaker.country }}</h3>
                                <p class="text-lg text-gray-300">
                                    Speaking time: {{ formatDuration(getSpeakerDuration()) }}
                                </p>
                            </div>
                            <div v-else class="py-12">
                                <UserIcon class="w-24 h-24 mx-auto text-gray-400 opacity-50 mb-4" />
                                <p class="text-2xl text-gray-400">No active speaker</p>
                            </div>
                        </div>
                    </div>

                    <!-- Quorum Status -->
                    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h3 class="text-xl font-bold mb-3">Quorum Status</h3>
                        <div class="flex items-center justify-between">
                            <div class="text-center flex-1">
                                <p class="text-4xl font-bold"
                                    :class="quorum.hasQuorum ? 'text-green-400' : 'text-red-400'">
                                    {{ quorum.present || 0 }}
                                </p>
                                <p class="text-sm text-gray-300">Present</p>
                            </div>
                            <div class="text-2xl text-gray-400">/</div>
                            <div class="text-center flex-1">
                                <p class="text-4xl font-bold">{{ quorum.required || 0 }}</p>
                                <p class="text-sm text-gray-300">Required</p>
                            </div>
                        </div>
                        <div class="mt-4 text-center">
                            <span :class="[
                                'px-4 py-2 rounded-full font-bold text-sm',
                                quorum.hasQuorum ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            ]">
                                {{ quorum.hasQuorum ? '✓ QUORUM REACHED' : '✗ NO QUORUM' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Middle Column: Speakers Queue -->
                <div
                    class="col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 overflow-hidden flex flex-col">
                    <h2 class="text-2xl font-bold mb-4">Speakers Queue</h2>
                    <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        <div v-if="speakerLists.present.length === 0" class="text-center py-12">
                            <UsersIcon class="w-16 h-16 mx-auto text-gray-400 opacity-50 mb-3" />
                            <p class="text-gray-400">No speakers in queue</p>
                        </div>
                        <div v-for="(speaker, idx) in speakerLists.present" :key="speaker.country" :class="[
                            'p-4 rounded-lg transition-all duration-300',
                            currentSpeaker?.country === speaker.country
                                ? 'bg-gradient-to-r from-blue-500/40 to-purple-500/40 border-2 border-white/40 shadow-lg scale-105'
                                : 'bg-white/5 border border-white/10',
                            speaker.hasSpoken ? 'opacity-60' : ''
                        ]">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <span class="text-2xl font-bold text-blue-300">{{ speaker.position }}.</span>
                                    <span class="text-lg font-medium">{{ speaker.country }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span v-if="speaker.hasSpoken"
                                        class="text-xs bg-green-500/30 text-green-200 px-2 py-1 rounded">
                                        ✓ Spoke
                                    </span>
                                    <span v-if="speaker.hasMovedToEnd"
                                        class="text-xs bg-yellow-500/30 text-yellow-200 px-2 py-1 rounded">
                                        ↓ Moved
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Active Voting or Info -->
                <div class="col-span-1">
                    <!-- Active Voting -->
                    <div v-if="activeVoting"
                        class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 h-full flex flex-col">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-2xl font-bold">Active Voting</h2>
                            <span class="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-sm font-bold">
                                LIVE
                            </span>
                        </div>

                        <h3 class="text-xl mb-6">{{ activeVoting.title }}</h3>

                        <!-- Voting Results -->
                        <div class="flex-1 space-y-6">
                            <div v-for="(count, option) in votingResults" :key="option">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-lg font-medium capitalize">{{ option }}</span>
                                    <span class="text-2xl font-bold">{{ count }}</span>
                                </div>
                                <div class="h-4 bg-white/10 rounded-full overflow-hidden">
                                    <div :class="[
                                        'h-full transition-all duration-500',
                                        getVoteBarColor(option)
                                    ]" :style="{ width: `${getVotePercentage(count)}%` }">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Vote Progress -->
                        <div class="mt-6 pt-6 border-t border-white/20">
                            <div class="text-center mb-3">
                                <p class="text-4xl font-bold">{{ totalVotes }}</p>
                                <p class="text-sm text-gray-300">votes cast</p>
                            </div>
                            <div class="flex justify-between text-sm text-gray-300 mb-2">
                                <span>Progress</span>
                                <span>{{ totalVotes }} / {{ activeVoting.eligibleVoters?.length || 0 }}</span>
                            </div>
                            <div class="w-full bg-white/10 rounded-full h-3">
                                <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                    :style="{ width: `${votingProgress}%` }"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Committee Info (No Voting) -->
                    <div v-else
                        class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 h-full flex flex-col justify-center items-center">
                        <DocumentTextIcon class="w-24 h-24 text-white/30 mb-6" />
                        <h2 class="text-2xl font-bold mb-3">{{ committee?.name }}</h2>
                        <p class="text-gray-300 text-center">No active voting session</p>
                    </div>
                </div>
            </div>

            <!-- Footer: Timer Tiles -->
            <div class="bg-black/40 backdrop-blur-sm px-8 py-4 border-t border-white/20">
                <div class="flex items-center justify-center space-x-4">
                    <!-- Session/Debate Timer -->
                    <div class="bg-white/10 rounded-lg px-6 py-3 border border-white/20">
                        <p class="text-xs text-gray-300 uppercase text-center">
                            {{ currentSession?.currentMode === 'moderated' || currentSession?.currentMode ===
                                'unmoderated' ? 'Debate' : 'Session' }}
                        </p>
                        <p class="text-2xl font-mono font-bold text-center">
                            {{ formatTimerDisplay(sessionTimers.session) }}
                        </p>
                    </div>

                    <!-- Speaker Timer -->
                    <div v-if="hasSpeakerTimer" class="bg-white/10 rounded-lg px-6 py-3 border border-white/20">
                        <p class="text-xs text-gray-300 uppercase text-center">Presentation</p>
                        <p class="text-2xl font-mono font-bold text-center">
                            {{ formatTimerDisplay(sessionTimers.speaker) }}
                        </p>
                    </div>

                    <!-- Q&A Timer -->
                    <div v-if="hasQATimer" class="bg-white/10 rounded-lg px-6 py-3 border border-white/20">
                        <p class="text-xs text-gray-300 uppercase text-center">Q&A</p>
                        <p class="text-2xl font-mono font-bold text-center">
                            {{ formatTimerDisplay(sessionTimers.qa) }}
                        </p>
                    </div>

                    <!-- Additional Timers -->
                    <div v-for="timer in sessionTimers.additional" :key="timer._id"
                        class="bg-white/10 rounded-lg px-6 py-3 border border-white/20">
                        <p class="text-xs text-gray-300 uppercase text-center truncate">{{ timer.name }}</p>
                        <p class="text-2xl font-mono font-bold text-center">
                            {{ formatTimerDisplay(timer) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gossip Box View -->
        <div v-else class="h-full flex items-center justify-center p-12">
            <div
                class="max-w-4xl w-full bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
                <div class="text-center mb-8">
                    <ChatBubbleOvalLeftEllipsisIcon class="w-24 h-24 mx-auto text-white/80 mb-6" />
                    <h1 class="text-5xl font-bold mb-3">Gossip Box</h1>
                    <p class="text-2xl text-gray-300">Anonymous messages from delegates</p>
                </div>

                <div class="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    <div v-if="gossipMessages.length === 0" class="text-center py-16">
                        <p class="text-2xl text-gray-400">No messages yet...</p>
                        <p class="text-lg text-gray-500 mt-2">Waiting for delegates to share their thoughts</p>
                    </div>

                    <div v-for="message in gossipMessages" :key="message._id"
                        class="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                        <p class="text-xl leading-relaxed mb-3">{{ message.content }}</p>
                        <div class="flex items-center justify-between text-sm text-gray-400">
                            <span>Posted {{ formatMessageTime(message.createdAt) }}</span>
                            <span>👁️ {{ message.views || 0 }} views</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import {
    MicrophoneIcon, UserIcon, UsersIcon, DocumentTextIcon,
    ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/vue/24/outline'

// Props
const route = useRoute()

// State
const committee = ref(null)
const currentSession = ref(null)
const sessionTimers = ref({
    session: null,
    speaker: null,
    debate: null,
    qa: null,
    additional: []
})
const activeTimer = ref(null)
const activeTimerType = ref('session')
const speakerLists = ref({ present: [], absent: [] })
const currentSpeaker = ref(null)
const activeVoting = ref(null)
const votingResults = ref({})
const quorum = ref({ hasQuorum: false, present: 0, required: 0 })
const displayMode = ref('session')
const gossipMessages = ref([])

let displayUpdateInterval = null

// Helper: Calculate real-time remaining
const getRealTimeRemaining = (timer) => {
    if (!timer) return 0
    if (!timer.isActive) return timer.remainingTime || timer.totalDuration || 0
    if (timer.isPaused) return timer.remainingTime || 0

    const startedAt = new Date(timer.startedAt)
    const now = new Date()
    const elapsed = Math.floor((now - startedAt) / 1000)
    const pauseTime = timer.accumulatedPause || 0
    const actualElapsed = elapsed - pauseTime
    const remaining = Math.max(0, timer.totalDuration - actualElapsed)

    return remaining
}

// Computed
const formattedMode = computed(() => {
    const modes = {
        'formal': 'FORMAL DEBATE',
        'moderated': 'MODERATED CAUCUS',
        'unmoderated': 'UNMODERATED CAUCUS',
        'informal': 'INFORMAL CONSULTATION'
    }
    return modes[currentSession.value?.currentMode] || 'FORMAL DEBATE'
})

const formattedTimer = computed(() => {
    if (!activeTimer.value) return '00:00'

    const time = getRealTimeRemaining(activeTimer.value)
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const currentTimerName = computed(() => {
    if (!activeTimer.value) return 'NO TIMER'

    if (activeTimerType.value === 'speaker') {
        return activeTimer.value.country || 'SPEAKER'
    } else if (activeTimerType.value === 'debate') {
        return 'DEBATE'
    } else if (activeTimerType.value === 'session') {
        return 'SESSION'
    } else if (activeTimerType.value === 'qa') {
        return 'Q&A'
    } else if (activeTimerType.value === 'additional') {
        return activeTimer.value.name || 'TIMER'
    }

    return 'TIMER'
})

const hasSpeakerTimer = computed(() => {
    const mode = currentSession.value?.currentMode
    return mode === 'formal' || mode === 'moderated' || mode === 'informal'
})

const hasQATimer = computed(() => {
    const mode = currentSession.value?.currentMode
    return mode === 'formal' || mode === 'informal'
})

const totalVotes = computed(() => {
    return Object.values(votingResults.value).reduce((sum, count) => sum + count, 0)
})

const votingProgress = computed(() => {
    if (!activeVoting.value || !activeVoting.value.eligibleVoters) return 0
    return Math.round((totalVotes.value / activeVoting.value.eligibleVoters.length) * 100)
})

// Methods
const formatTimerDisplay = (timer) => {
    if (!timer) return '--:--'

    const time = getRealTimeRemaining(timer)
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getSpeakerDuration = () => {
    if (!currentSpeaker.value?.startedAt) return 0
    const elapsed = Math.floor((Date.now() - new Date(currentSpeaker.value.startedAt)) / 1000)
    return elapsed
}

const getVotePercentage = (count) => {
    return totalVotes.value > 0 ? (count / totalVotes.value) * 100 : 0
}

const getVoteBarColor = (option) => {
    const colors = {
        for: 'bg-green-500',
        against: 'bg-red-500',
        abstain: 'bg-yellow-500'
    }
    return colors[option] || 'bg-gray-500'
}

const formatMessageTime = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return then.toLocaleDateString()
}

const updateVotingResults = (voting) => {
    if (!voting?.votes) {
        votingResults.value = { for: 0, against: 0, abstain: 0 }
        return
    }

    const results = { for: 0, against: 0, abstain: 0 }
    voting.votes.forEach(vote => {
        if (vote.vote && results.hasOwnProperty(vote.vote)) {
            results[vote.vote]++
        }
    })

    votingResults.value = results
}

// Data Loading
const loadPublicData = async () => {
    try {
        const committeeId = route.params.committeeId

        // Load committee
        const committeeResponse = await apiMethods.committees.getById(committeeId)
        if (committeeResponse.data.success) {
            committee.value = committeeResponse.data.committee
        }

        // Load active session
        const sessionResponse = await apiMethods.sessions.getAll(committeeId, {
            status: 'active',
            limit: 1
        })

        if (sessionResponse.data.success && sessionResponse.data.sessions?.length > 0) {
            currentSession.value = sessionResponse.data.sessions[0]
            await loadSessionDetails()
        }

        // Load gossip messages
        await loadGossipMessages()

        // Setup WebSocket
        setupWebSocketListeners()

    } catch (error) {
        console.error('Failed to load public data:', error)
    }
}

const loadSessionDetails = async () => {
    if (!currentSession.value?._id) return

    try {
        const response = await apiMethods.sessions.getById(currentSession.value._id)
        if (response.data.success) {
            const sessionData = response.data.session
            currentSession.value = sessionData

            // Load timers
            if (sessionData.timers) {
                sessionTimers.value = sessionData.timers

                // Set active timer
                if (sessionData.timers.speaker?.isActive) {
                    activeTimer.value = sessionData.timers.speaker
                    activeTimerType.value = 'speaker'
                } else if (sessionData.timers.debate?.isActive) {
                    activeTimer.value = sessionData.timers.debate
                    activeTimerType.value = 'debate'
                } else if (sessionData.timers.session?.isActive) {
                    activeTimer.value = sessionData.timers.session
                    activeTimerType.value = 'session'
                } else if (sessionData.timers.qa?.isActive) {
                    activeTimer.value = sessionData.timers.qa
                    activeTimerType.value = 'qa'
                } else {
                    activeTimer.value = sessionData.timers.session
                    activeTimerType.value = 'session'
                }
            }

            speakerLists.value = sessionData.speakerLists || { present: [], absent: [] }
            currentSpeaker.value = sessionData.currentSpeaker || null
            quorum.value = sessionData.quorum || { hasQuorum: false, present: 0, required: 0 }
        }

        // Load active voting
        const votingResponse = await apiMethods.voting.getByCommitteeId(committee.value._id)
        if (votingResponse.data.success) {
            const activeVotingData = votingResponse.data.voting?.find(v => v.status === 'active')
            if (activeVotingData) {
                activeVoting.value = activeVotingData
                updateVotingResults(activeVotingData)
            }
        }

    } catch (error) {
        console.error('Failed to load session details:', error)
    }
}

const loadGossipMessages = async () => {
    if (!committee.value?._id) return

    try {
        const response = await apiMethods.gossip.getAll(committee.value._id)
        if (response.data.success) {
            gossipMessages.value = response.data.messages || []
        }
    } catch (error) {
        console.error('Failed to load gossip messages:', error)
    }
}

// WebSocket
const setupWebSocketListeners = () => {
    console.log('🎧 Setting up public display WebSocket listeners')

    if (committee.value?._id) {
        wsService.emit('join-committee-room', {
            committeeId: committee.value._id
        })
    }

    // Timer state sync
    wsService.on('timer-state-sync', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            sessionTimers.value = data.timers

            // Update active timer
            if (activeTimerType.value === 'additional') {
                activeTimer.value = data.timers.additional?.find(t => t._id === activeTimerId.value)
            } else if (activeTimerType.value && data.timers[activeTimerType.value]) {
                activeTimer.value = data.timers[activeTimerType.value]
            }
        }
    })

    // Display mode
    wsService.on('public-display-mode-changed', (data) => {
        console.log('📺 Display mode changed:', data)
        if (data.committeeId === committee.value?._id) {
            displayMode.value = data.mode
        }
    })

    // Speakers
    wsService.on('current-speaker-set', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.currentSpeaker
            speakerLists.value = data.speakerLists
            if (data.speakerTimer) {
                sessionTimers.value.speaker = data.speakerTimer
                activeTimer.value = data.speakerTimer
                activeTimerType.value = 'speaker'
            }
        }
    })

    wsService.on('speaker-moved', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            speakerLists.value = data.speakerLists
        }
    })

    // Roll call
    wsService.on('roll-call-ended', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            speakerLists.value = data.speakerLists
            quorum.value = data.quorum
        }
    })

    // Voting
    wsService.on('voting-started', (data) => {
        if (data.committeeId === committee.value?._id) {
            activeVoting.value = data.voting
            updateVotingResults(data.voting)
        }
    })

    wsService.on('vote-cast', (data) => {
        if (data.votingId === activeVoting.value?._id) {
            updateVotingResults(data.voting)
        }
    })

    wsService.on('voting-ended', (data) => {
        if (data.votingId === activeVoting.value?._id) {
            activeVoting.value = null
            votingResults.value = {}
        }
    })

    // Gossip
    wsService.on('gossip-message-posted', (data) => {
        if (data.committeeId === committee.value?._id) {
            gossipMessages.value.unshift(data.message)
        }
    })

    console.log('✅ Public display WebSocket listeners ready')
}

// Lifecycle
onMounted(async () => {
    await loadPublicData()

    // Update display every second
    displayUpdateInterval = setInterval(() => {
        if (activeTimer.value?.isActive && !activeTimer.value?.isPaused) {
            activeTimer.value = { ...activeTimer.value }
        }
    }, 1000)
})

onUnmounted(() => {
    if (displayUpdateInterval) {
        clearInterval(displayUpdateInterval)
    }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}
</style>