<template>
    <div class="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-8 border-b border-gray-700">
            <div>
                <h1 class="text-4xl font-bold text-white mb-2">{{ committee?.name || 'UN General Assembly' }}</h1>
                <p class="text-xl text-gray-300">{{ committee?.description || 'Global Sustainability Goals' }}</p>
            </div>
            <div class="text-right">
                <div :class="[
                    'text-lg font-bold px-6 py-3 rounded-lg uppercase tracking-wide',
                    getModeColor(currentMode)
                ]">
                    {{ getModeLabel(currentMode) }}
                </div>
                <div class="text-gray-400 text-sm mt-2">
                    Session {{ currentSession?.sessionNumber || 1 }}
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex">
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

        <!-- Bottom Status Bar -->
        <div class="bg-gray-800 border-t border-gray-700 px-8 py-4 flex items-center justify-between">
            <!-- Session Info -->
            <div class="flex items-center space-x-8">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-gray-300">Session Active</span>
                </div>

                <div v-if="quorumData.hasQuorum" class="flex items-center space-x-3">
                    <CheckCircleIcon class="w-5 h-5 text-green-500" />
                    <span class="text-green-400">Quorum Present</span>
                    <span class="text-gray-400">({{ quorumData.presentVoting }}/{{ quorumData.required }})</span>
                </div>

                <div v-else class="flex items-center space-x-3">
                    <XCircleIcon class="w-5 h-5 text-red-500" />
                    <span class="text-red-400">No Quorum</span>
                    <span class="text-gray-400">({{ quorumData.presentVoting }}/{{ quorumData.required }})</span>
                </div>
            </div>

            <!-- Voting Status -->
            <div v-if="activeVoting" class="flex items-center space-x-6">
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
    CheckCircleIcon, XCircleIcon
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

    } catch (error) {
        console.error('Failed to load public display data:', error)
    }
}

const loadActiveSession = async () => {
    try {
        const response = await enhancedSessionApi.sessions.getByCommittee(committee.value._id, {
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
        // Load session details
        const sessionResponse = await enhancedSessionApi.sessions.getById(currentSession.value._id)
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
    // Session events
    wsService.on('session-mode-changed', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentMode.value = data.mode
        }
    })

    // Timer events
    wsService.on('timer-started', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            activeTimer.value = data.timer
            startTimerSync()
        }
    })

    wsService.on('timer-completed', (data) => {
        if (data.timerId === activeTimer.value?._id) {
            activeTimer.value = null
        }
    })

    // Speaker events
    wsService.on('speaker-list-updated', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            speakerQueue.value = data.speakerList
        }
    })

    wsService.on('current-speaker-changed', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.speaker
        }
    })

    // Voting events
    wsService.on('voting-started', (data) => {
        if (data.committeeId === committee.value?._id) {
            activeVoting.value = data.voting
        }
    })

    wsService.on('voting-ended', (data) => {
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
</style>