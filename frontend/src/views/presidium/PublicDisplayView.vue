<template>
    <div class="h-screen flex flex-col overflow-hidden" :class="[
        displayMode === 'gossip' ? 'bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900' : 'bg-gray-900',
        'text-white'
    ]">
        <!-- Header -->
        <div class="flex items-center justify-between p-8 border-b border-gray-700">
            <div v-if="displayMode === 'session'">
                <h1 class="text-4xl font-bold text-white mb-2">{{ committee?.name || 'UN General Assembly' }}</h1>
                <p class="text-xl text-gray-300">{{ committee?.description || 'Global Sustainability Goals' }}</p>
            </div>
            <div v-else class="flex items-center">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <ChatBubbleLeftRightIcon class="w-6 h-6 text-purple-700" />
                </div>
                <div>
                    <h1 class="text-4xl font-bold text-white mb-1">GOSSIP BOX</h1>
                    <p class="text-xl text-purple-200">{{ committee?.name || 'UN General Assembly' }}</p>
                </div>
            </div>

            <div class="text-right">
                <div v-if="displayMode === 'session'" :class="[
                    'text-lg font-bold px-6 py-3 rounded-lg uppercase tracking-wide',
                    getModeColor(currentMode)
                ]">
                    {{ getModeLabel(currentMode) }}
                </div>
                <div v-else
                    class="px-6 py-3 bg-purple-600 text-white rounded-lg text-lg font-bold uppercase tracking-wide">
                    ANONYMOUS CHAT
                </div>
                <div class="text-gray-400 text-sm mt-2">
                    {{ displayMode === 'session' ? `Session ${currentSession?.sessionNumber || 1}` : 'Live Messages' }}
                </div>
            </div>
        </div>

        <!-- Session View Content -->
        <div v-if="displayMode === 'session'" class="flex-1 flex">
            <!-- Left Side - Timer and Current Speaker -->
            <div class="flex-1 flex flex-col justify-center items-center p-16">
                <!-- Timer Section -->
                <div class="text-center mb-16">
                    <div class="text-gray-400 text-2xl uppercase tracking-wide mb-6 flex items-center justify-center">
                        <ClockIcon class="w-8 h-8 mr-4" />
                        {{ timerLabel }}
                    </div>

                    <!-- Large Timer Display -->
                    <div class="relative">
                        <div class="text-8xl md:text-9xl font-mono font-bold text-white leading-none mb-8">
                            {{ formattedTimer }}
                        </div>

                        <!-- Timer Progress Bar -->
                        <div v-if="activeTimer" class="w-96 h-4 bg-gray-700 rounded-full mx-auto overflow-hidden">
                            <div :class="[
                                'h-full transition-all duration-1000 rounded-full',
                                getTimerColor()
                            ]" :style="{ width: `${timerProgress}%` }"></div>
                        </div>
                    </div>
                </div>

                <!-- Current Speaker -->
                <div class="bg-gray-800 rounded-2xl p-12 w-full max-w-2xl border border-gray-700">
                    <div class="text-center">
                        <div
                            class="text-gray-400 text-xl uppercase tracking-wide mb-6 flex items-center justify-center">
                            <UserIcon class="w-6 h-6 mr-3" />
                            Current Speaker
                        </div>

                        <div v-if="currentSpeaker" class="space-y-6">
                            <img :src="getCountryFlag(currentSpeaker.country)" :alt="currentSpeaker.country"
                                class="w-24 h-16 rounded-lg border-2 border-gray-600 object-cover mx-auto" />
                            <div class="text-5xl font-bold text-white">{{ currentSpeaker.country }}</div>
                        </div>

                        <div v-else class="space-y-6">
                            <div class="w-24 h-16 bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
                                <MicrophoneIcon class="w-12 h-12 text-gray-500" />
                            </div>
                            <div class="text-5xl font-bold text-gray-400">Floor Open</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Sidebar - Speakers Queue -->
            <div class="w-96 bg-gray-800 border-l border-gray-700 p-8">
                <div class="h-full flex flex-col">
                    <div class="text-2xl font-bold text-white mb-8">Speakers Queue</div>

                    <!-- Queue List -->
                    <div class="flex-1 overflow-y-auto space-y-4">
                        <div v-if="speakerQueue.length === 0" class="text-center py-16">
                            <UsersIcon class="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p class="text-gray-400 text-xl italic">No speakers queued.</p>
                        </div>

                        <div v-else>
                            <div v-for="(speaker, index) in speakerQueue" :key="speaker.country"
                                class="flex items-center space-x-4 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                                <div class="text-2xl font-bold text-blue-400 w-8">{{ index + 1 }}</div>
                                <img :src="getCountryFlag(speaker.country)" :alt="speaker.country"
                                    class="w-12 h-8 rounded border border-gray-600 object-cover" />
                                <div class="flex-1">
                                    <div class="text-lg font-semibold text-white">{{ speaker.country }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Queue Stats -->
                    <div class="border-t border-gray-700 pt-6 mt-6">
                        <div class="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div class="text-3xl font-bold text-blue-400">{{ speakerQueue.length }}</div>
                                <div class="text-gray-400 text-sm uppercase">In Queue</div>
                            </div>
                            <div>
                                <div class="text-3xl font-bold text-green-400">{{ speakersSpoken }}</div>
                                <div class="text-gray-400 text-sm uppercase">Spoken</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gossip View Content -->
        <div v-else class="flex-1 flex flex-col p-8">
            <!-- Messages Container -->
            <div class="flex-1 flex justify-center items-start">
                <div class="w-full max-w-4xl space-y-6">
                    <!-- Recent Messages -->
                    <div v-if="gossipMessages.length > 0" class="space-y-4">
                        <div v-for="message in gossipMessages.slice(-10)" :key="message._id" class="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 
                                   hover:bg-black/30 transition-all duration-300 shadow-xl">
                            <div class="flex items-start space-x-4">
                                <!-- Anonymous Avatar -->
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 
                                           flex items-center justify-center shadow-lg">
                                    <div class="w-6 h-6 bg-white/20 rounded-full"></div>
                                </div>

                                <!-- Message Content -->
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="text-purple-200 text-sm font-medium">
                                            {{ formatGossipTime(message.sentAt) }}
                                        </div>
                                        <div v-if="message.priority === 'important'"
                                            class="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                                            Important
                                        </div>
                                    </div>
                                    <div class="text-white text-lg leading-relaxed">
                                        "{{ message.content }}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="text-center py-20">
                        <div
                            class="w-24 h-24 bg-purple-100/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <ChatBubbleLeftRightIcon class="w-12 h-12 text-purple-300" />
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">No Messages Yet</h3>
                        <p class="text-purple-200">Anonymous messages will appear here during the session.</p>
                    </div>
                </div>
            </div>

            <!-- Gossip Stats -->
            <div class="mt-8 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div class="text-center">
                    <div class="text-3xl font-bold text-white mb-1">{{ gossipMessages.length }}</div>
                    <div class="text-purple-200 text-sm uppercase tracking-wide">Total Messages</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-300 mb-1">{{ anonymousParticipants }}</div>
                    <div class="text-purple-200 text-sm uppercase tracking-wide">Anonymous Users</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-pink-300 mb-1">{{ recentMessagesCount }}</div>
                    <div class="text-purple-200 text-sm uppercase tracking-wide">Recent (5 min)</div>
                </div>
            </div>
        </div>

        <!-- Bottom Status Bar -->
        <div class="border-t px-8 py-4 flex items-center justify-between" :class="[
            displayMode === 'gossip' ? 'bg-purple-900/50 border-purple-700' : 'bg-gray-800 border-gray-700'
        ]">
            <!-- Session Info -->
            <div class="flex items-center space-x-8">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-gray-300">
                        {{ displayMode === 'session' ? 'Session Active' : 'Gossip Active' }}
                    </span>
                </div>

                <div v-if="displayMode === 'session' && quorumData.hasQuorum" class="flex items-center space-x-3">
                    <CheckCircleIcon class="w-5 h-5 text-green-500" />
                    <span class="text-green-400">Quorum Present</span>
                    <span class="text-gray-400">({{ quorumData.presentVoting }}/{{ quorumData.required }})</span>
                </div>

                <div v-else-if="displayMode === 'session' && !quorumData.hasQuorum" class="flex items-center space-x-3">
                    <XCircleIcon class="w-5 h-5 text-red-500" />
                    <span class="text-red-400">No Quorum</span>
                    <span class="text-gray-400">({{ quorumData.presentVoting }}/{{ quorumData.required }})</span>
                </div>

                <!-- Gossip Mode Info -->
                <div v-if="displayMode === 'gossip'" class="flex items-center space-x-3">
                    <EyeSlashIcon class="w-5 h-5 text-purple-400" />
                    <span class="text-purple-300">Anonymous Mode</span>
                </div>
            </div>

            <!-- Voting Status -->
            <div v-if="displayMode === 'session' && activeVoting" class="flex items-center space-x-6">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span class="text-red-400 font-medium">VOTING IN PROGRESS</span>
                </div>
                <div class="text-gray-300">{{ activeVoting.title }}</div>
            </div>

            <!-- Time -->
            <div class="text-gray-400 text-lg font-mono">
                {{ currentTime }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import sessionApi from '@/utils/sessionApi'

// Icons
import {
    ClockIcon, UserIcon, MicrophoneIcon, UsersIcon,
    CheckCircleIcon, XCircleIcon, ChatBubbleLeftRightIcon, EyeSlashIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()

// State
const committee = ref(null)
const currentSession = ref(null)
const currentSpeaker = ref(null)
const speakerQueue = ref([])
const speakersSpoken = ref(0)
const activeTimer = ref(null)
const currentMode = ref('formal')
const quorumData = ref({
    hasQuorum: false,
    presentVoting: 0,
    required: 0
})
const activeVoting = ref(null)
const currentTime = ref('')
const displayMode = ref('session') // 'session' or 'gossip'
const gossipMessages = ref([])

// Timer update interval
let timerUpdateInterval = null
let clockUpdateInterval = null

// Computed
const formattedTimer = computed(() => {
    if (!activeTimer.value) return '00:00'

    const time = activeTimer.value.remainingTime || 0
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const timerLabel = computed(() => {
    if (!activeTimer.value) return 'NO TIMER'

    const labels = {
        'speaker': 'SPEAKER TIME',
        'session': 'SESSION TIME',
        'caucus': 'CAUCUS TIME',
        'break': 'BREAK TIME'
    }

    return labels[activeTimer.value.timerType] || activeTimer.value.name?.toUpperCase() || 'TIMER'
})

const timerProgress = computed(() => {
    if (!activeTimer.value) return 0
    return activeTimer.value.progressPercentage || 0
})

const anonymousParticipants = computed(() => {
    // Count unique anonymous IDs from recent gossip messages
    const recentMessages = gossipMessages.value.filter(msg => {
        const messageTime = new Date(msg.sentAt)
        const now = new Date()
        return (now - messageTime) < 30 * 60 * 1000 // Last 30 minutes
    })

    const uniqueIds = new Set(recentMessages.map(msg => msg.gossipId))
    return uniqueIds.size
})

const recentMessagesCount = computed(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return gossipMessages.value.filter(msg => new Date(msg.sentAt) > fiveMinutesAgo).length
})

const getModeLabel = (mode) => {
    const labels = {
        'formal': 'FORMAL',
        'moderated': 'MODERATED CAUCUS',
        'unmoderated': 'UNMODERATED CAUCUS',
        'informal': 'INFORMAL'
    }
    return labels[mode] || 'FORMAL'
}

const getModeColor = (mode) => {
    const colors = {
        'formal': 'bg-blue-600',
        'moderated': 'bg-purple-600',
        'unmoderated': 'bg-orange-600',
        'informal': 'bg-gray-600'
    }
    return colors[mode] || 'bg-blue-600'
}

const getTimerColor = () => {
    const progress = timerProgress.value
    if (progress > 80) return 'bg-red-500'
    if (progress > 60) return 'bg-orange-500'
    return 'bg-blue-500'
}

// Methods
const loadData = async () => {
    try {
        // Get committee from auth context
        committee.value = authStore.user?.committeeId
        if (!committee.value) {
            throw new Error('No committee assigned')
        }

        // Load active session
        await loadActiveSession()

        // Load gossip messages
        await loadGossipMessages()

    } catch (error) {
        console.error('Failed to load public display data:', error)
    }
}

const loadActiveSession = async () => {
    try {
        const response = await apiMethods.sessions.getAll(committee.value._id, {
            status: 'active',
            limit: 1
        })

        if (response.data.success && response.data.sessions?.length > 0) {
            currentSession.value = response.data.sessions[0]
            await loadSessionDetails()
        }
    } catch (error) {
        console.error('Failed to load active session:', error)
    }
}

const loadSessionDetails = async () => {
    if (!currentSession.value?._id) return

    try {
        const sessionResponse = await apiMethods.sessions.getById(currentSession.value._id)
        if (sessionResponse.data.success) {
            const sessionData = sessionResponse.data.session

            currentMode.value = sessionData.currentMode || 'formal'
            speakerQueue.value = sessionData.speakerList?.queue || []
            currentSpeaker.value = sessionData.speakerList?.current || null
            quorumData.value = sessionData.rollCall?.quorum || quorumData.value
        }

        // Load active timers
        const timerResponse = await apiMethods.timers.getActiveTimers(currentSession.value._id)
        if (timerResponse.data.success) {
            const timers = timerResponse.data.timers || []
            activeTimer.value = timers.find(t => t.status === 'running') || timers[0] || null
        }

        // Load active voting
        const votingResponse = await apiMethods.voting.getByCommitteeId(committee.value._id)
        if (votingResponse.data.success) {
            activeVoting.value = votingResponse.data.voting?.find(v => v.status === 'active') || null
        }

    } catch (error) {
        console.error('Failed to load session details:', error)
    }
}

const loadGossipMessages = async () => {
    if (!committee.value?._id) return

    try {
        // The gossip messages will be populated via WebSocket events
        console.log('Gossip messages will be loaded via WebSocket events')
    } catch (error) {
        console.error('Failed to load gossip messages:', error)
    }
}

const getCountryFlag = (countryName) => {
    const country = committee.value?.countries?.find(c => c.name === countryName)
    return country?.flagUrl || '/api/countries/flags/default'
}

const updateClock = () => {
    currentTime.value = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

const formatGossipTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
}

const startTimerSync = () => {
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval)
    }

    timerUpdateInterval = setInterval(() => {
        if (activeTimer.value?.isActive && !activeTimer.value?.isPaused) {
            if (activeTimer.value.remainingTime > 0) {
                activeTimer.value.remainingTime--
                activeTimer.value.progressPercentage =
                    ((activeTimer.value.totalDuration - activeTimer.value.remainingTime) / activeTimer.value.totalDuration) * 100
            }
        }
    }, 1000)
}

// WebSocket listeners
const setupWebSocketListeners = () => {
    console.log('🎧 Setting up WebSocket listeners for public display')

    // Join multiple room types for maximum compatibility
    if (committee.value?._id) {
        wsService.emit('join-committee-room', { committeeId: committee.value._id })
        wsService.emit('join-room', `committee-${committee.value._id}`)
        wsService.emit('join-room', `public-display-${committee.value._id}`)
        wsService.emit('join-room', committee.value._id)
        
        console.log(`📡 Joined multiple rooms for committee: ${committee.value._id}`)
    }

    // Display mode control events - ENHANCED WITH MORE EVENT TYPES
    const displayModeEvents = [
        'public-display-mode-changed',
        'display-mode-changed',
        'display-toggle',
        'committee-display-mode-changed',
        'set-public-display-mode',
        'display-mode-change',
        'public-display-toggle',
        `committee-${committee.value?._id}-display-mode`
    ];

    displayModeEvents.forEach(eventName => {
        wsService.on(eventName, (data) => {
            console.log(`📡 Received ${eventName}:`, data)
            if (data.committeeId === committee.value?._id) {
                displayMode.value = data.mode
                console.log(`✅ Display mode updated to: ${data.mode}`)
            }
        });
    });

    // Session events
    wsService.on('session-mode-changed', (data) => {
        console.log('📡 Received session-mode-changed:', data)
        if (data.sessionId === currentSession.value?._id) {
            currentMode.value = data.mode
        }
    })

    // Timer events
    const timerEvents = [
        'timer-started', 'timer-paused', 'timer-resumed', 
        'timer-completed', 'timer-expired', 'timer-updated'
    ];

    timerEvents.forEach(eventName => {
        wsService.on(eventName, (data) => {
            console.log(`📡 Received ${eventName}:`, data)
            if (data.sessionId === currentSession.value?._id) {
                loadSessionDetails()
            }
        });
    });

    // Speaker events  
    wsService.on('speaker-list-updated', (data) => {
        console.log('📡 Received speaker-list-updated:', data)
        if (data.sessionId === currentSession.value?._id) {
            speakerQueue.value = data.speakerList
        }
    })

    wsService.on('current-speaker-changed', (data) => {
        console.log('📡 Received current-speaker-changed:', data)
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.speaker
        }
    })

    // Voting events
    wsService.on('voting-started', (data) => {
        console.log('📡 Received voting-started:', data)
        if (data.committeeId === committee.value?._id) {
            activeVoting.value = data.voting
        }
    })

    wsService.on('voting-ended', (data) => {
        console.log('📡 Received voting-ended:', data)
        if (data.votingId === activeVoting.value?._id) {
            activeVoting.value = null
        }
    })

    // Roll call events
    wsService.on('roll-call-completed', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            quorumData.value = data.quorum
        }
    })

    wsService.on('attendance-updated', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            quorumData.value = data.quorum
        }
    })

    // Gossip events
    wsService.on('gossip-message-posted', (data) => {
        if (data.committeeId === committee.value?._id) {
            gossipMessages.value.push(data.message)
            // Keep only last 50 messages in memory
            if (gossipMessages.value.length > 50) {
                gossipMessages.value = gossipMessages.value.slice(-50)
            }
        }
    })

    wsService.on('gossip-message-removed', (data) => {
        if (data.committeeId === committee.value?._id) {
            gossipMessages.value = gossipMessages.value.filter(msg => msg._id !== data.messageId)
        }
    })

    console.log('✅ All WebSocket listeners set up for public display')
}

// Lifecycle
onMounted(async () => {
    await loadData()
    setupWebSocketListeners()
    startTimerSync()

    // Update clock every second
    updateClock()
    clockUpdateInterval = setInterval(updateClock, 1000)

    // Auto-refresh data every 30 seconds
    setInterval(loadSessionDetails, 30000)

    // Refresh gossip messages every 10 seconds when in gossip mode
    setInterval(() => {
        if (displayMode.value === 'gossip') {
            loadGossipMessages()
        }
    }, 10000)
})

onUnmounted(() => {
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval)
    }
    if (clockUpdateInterval) {
        clearInterval(clockUpdateInterval)
    }
})
</script>

<style scoped>
/* Ensure full screen and prevent scrollbars */
.h-screen {
    height: 100vh;
    max-height: 100vh;
}

/* Custom scrollbar for queue */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: #6B7280;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
}

/* Gossip view specific styles */
.backdrop-blur-sm {
    backdrop-filter: blur(8px);
}
</style>