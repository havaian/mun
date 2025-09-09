<template>
    <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Session Management</h1>
                <p class="text-mun-gray-600 mt-1">Control and manage committee sessions</p>
            </div>

            <div class="flex items-center space-x-3">
                <AppButton variant="outline" size="md" @click="refreshSession" :loading="isLoading">
                    <ArrowPathIcon class="w-4 h-4 mr-2" />
                    Refresh
                </AppButton>

                <AppButton v-if="!currentSession" variant="primary" size="md" @click="startNewSession"
                    :loading="isStarting">
                    <PlayIcon class="w-4 h-4 mr-2" />
                    Start Session
                </AppButton>

                <AppButton v-else-if="currentSession.status === 'active'" variant="outline" size="md"
                    @click="pauseSession" :loading="isPausing">
                    <PauseIcon class="w-4 h-4 mr-2" />
                    Pause Session
                </AppButton>

                <AppButton v-else-if="currentSession.status === 'paused'" variant="primary" size="md"
                    @click="resumeSession" :loading="isResuming">
                    <PlayIcon class="w-4 h-4 mr-2" />
                    Resume Session
                </AppButton>
            </div>
        </div>

        <!-- Session Status Card -->
        <div v-if="currentSession" class="bg-white rounded-2xl shadow-mun border border-white/20 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <div :class="[
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        currentSession.status === 'active' ? 'bg-mun-green-100' : 'bg-mun-yellow-100'
                    ]">
                        <component :is="getSessionIcon()" :class="[
                            'w-6 h-6',
                            currentSession.status === 'active' ? 'text-mun-green-600' : 'text-mun-yellow-600'
                        ]" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-mun-gray-900">
                            {{ currentSession.title || 'Committee Session' }}
                        </h2>
                        <p class="text-mun-gray-600">
                            {{ formatSessionStatus() }} • {{ formatSessionDuration() }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center space-x-2">
                    <span :class="getStatusBadgeClass()">
                        {{ formatStatus(currentSession.status) }}
                    </span>
                </div>
            </div>

            <!-- Session Progress -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-mun-gray-900">
                        {{ formatTime(sessionTimer) }}
                    </div>
                    <div class="text-sm text-mun-gray-600">Session Time</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-mun-gray-900">
                        {{ attendanceCount }}
                    </div>
                    <div class="text-sm text-mun-gray-600">Present Delegates</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-mun-gray-900">
                        {{ speakersList.length }}
                    </div>
                    <div class="text-sm text-mun-gray-600">Speakers Queue</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-mun-gray-900">
                        {{ currentSession.debateMode || 'Formal' }}
                    </div>
                    <div class="text-sm text-mun-gray-600">Debate Mode</div>
                </div>
            </div>

            <!-- Session Controls -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Debate Mode Control -->
                <div class="border border-mun-gray-200 rounded-xl p-4">
                    <h3 class="font-semibold text-mun-gray-900 mb-3">Debate Mode</h3>
                    <div class="space-y-2">
                        <button v-for="mode in debateModes" :key="mode.value" @click="changeDebateMode(mode.value)"
                            :class="[
                                'w-full p-3 rounded-lg text-left transition-colors border',
                                currentSession.debateMode === mode.value
                                    ? 'bg-un-blue-50 border-un-blue-200 text-un-blue-900'
                                    : 'border-mun-gray-200 hover:bg-mun-gray-50'
                            ]">
                            <div class="font-medium">{{ mode.name }}</div>
                            <div class="text-sm text-mun-gray-600">{{ mode.description }}</div>
                        </button>
                    </div>
                </div>

                <!-- Timer Controls -->
                <div class="border border-mun-gray-200 rounded-xl p-4">
                    <h3 class="font-semibold text-mun-gray-900 mb-3">Timer Control</h3>
                    <div class="space-y-3">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-mun-gray-900 mb-2">
                                {{ formatTime(speakingTimer) }}
                            </div>
                            <div class="text-sm text-mun-gray-600">
                                {{ currentSpeaker ? `${currentSpeaker.country} speaking` : 'No active speaker' }}
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            <AppButton variant="primary" size="sm" @click="startSpeakingTimer"
                                :disabled="!currentSpeaker || speakingTimerActive" class="flex-1">
                                Start
                            </AppButton>
                            <AppButton variant="outline" size="sm" @click="pauseSpeakingTimer"
                                :disabled="!speakingTimerActive" class="flex-1">
                                Pause
                            </AppButton>
                            <AppButton variant="outline" size="sm" @click="resetSpeakingTimer" class="flex-1">
                                Reset
                            </AppButton>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                Speaking Time (seconds)
                            </label>
                            <input v-model.number="speakingTimeLimit" type="number" min="30" max="600"
                                class="input-field" :disabled="speakingTimerActive" />
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="border border-mun-gray-200 rounded-xl p-4">
                    <h3 class="font-semibold text-mun-gray-900 mb-3">Quick Actions</h3>
                    <div class="space-y-2">
                        <AppButton variant="outline" size="sm" @click="showAttendanceModal = true" class="w-full">
                            <UserGroupIcon class="w-4 h-4 mr-2" />
                            Take Attendance
                        </AppButton>

                        <AppButton variant="outline" size="sm" @click="showSpeakersModal = true" class="w-full">
                            <ChatBubbleLeftRightIcon class="w-4 h-4 mr-2" />
                            Manage Speakers
                        </AppButton>

                        <AppButton variant="outline" size="sm" @click="showVotingModal = true" class="w-full">
                            <HandRaisedIcon class="w-4 h-4 mr-2" />
                            Start Voting
                        </AppButton>

                        <AppButton variant="outline" size="sm" @click="endSession" :loading="isEnding" class="w-full">
                            <StopIcon class="w-4 h-4 mr-2" />
                            End Session
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- No Active Session -->
        <div v-else class="text-center py-12">
            <PlayIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-mun-gray-900 mb-2">No Active Session</h3>
            <p class="text-mun-gray-600 mb-6">
                Start a new committee session to begin managing speakers, timers, and voting.
            </p>
            <AppButton variant="primary" @click="startNewSession" :loading="isStarting">
                <PlayIcon class="w-4 h-4 mr-2" />
                Start New Session
            </AppButton>
        </div>

        <!-- Current Activity Panel -->
        <div v-if="currentSession" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Speakers List -->
            <div class="bg-white rounded-2xl shadow-mun border border-white/20 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Speakers List</h3>
                    <AppButton variant="outline" size="sm" @click="showSpeakersModal = true">
                        <PlusIcon class="w-4 h-4 mr-2" />
                        Add Speaker
                    </AppButton>
                </div>

                <div class="space-y-3">
                    <div v-if="currentSpeaker" class="p-3 bg-un-blue-50 border border-un-blue-200 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-6 h-6 bg-un-blue rounded-full flex items-center justify-center">
                                    <span class="text-xs font-bold text-white">▶</span>
                                </div>
                                <div>
                                    <div class="font-medium text-un-blue-900">{{ currentSpeaker.country }}</div>
                                    <div class="text-sm text-un-blue-700">Currently speaking</div>
                                </div>
                            </div>
                            <div class="text-sm font-mono text-un-blue-800">
                                {{ formatTime(speakingTimer) }}
                            </div>
                        </div>
                    </div>

                    <div v-for="(speaker, index) in speakersList" :key="speaker.id"
                        class="flex items-center justify-between p-3 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50">
                        <div class="flex items-center space-x-3">
                            <div class="w-6 h-6 bg-mun-gray-200 rounded-full flex items-center justify-center">
                                <span class="text-xs font-bold text-mun-gray-600">{{ index + 1 }}</span>
                            </div>
                            <div>
                                <div class="font-medium text-mun-gray-900">{{ speaker.country }}</div>
                                <div class="text-sm text-mun-gray-600">{{ speaker.type || 'General statement' }}</div>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2">
                            <button @click="moveSpeakerUp(index)" :disabled="index === 0"
                                class="p-1 text-mun-gray-400 hover:text-mun-gray-600 disabled:opacity-50">
                                <ChevronUpIcon class="w-4 h-4" />
                            </button>
                            <button @click="moveSpeakerDown(index)" :disabled="index === speakersList.length - 1"
                                class="p-1 text-mun-gray-400 hover:text-mun-gray-600 disabled:opacity-50">
                                <ChevronDownIcon class="w-4 h-4" />
                            </button>
                            <button @click="removeSpeaker(index)" class="p-1 text-mun-red-400 hover:text-mun-red-600">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div v-if="!currentSpeaker && speakersList.length === 0" class="text-center py-8">
                        <ChatBubbleLeftRightIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                        <p class="text-mun-gray-500">No speakers in queue</p>
                        <p class="text-sm text-mun-gray-400">Add speakers to begin debate</p>
                    </div>
                </div>

                <div v-if="speakersList.length > 0" class="mt-4 pt-4 border-t border-mun-gray-200">
                    <div class="flex space-x-2">
                        <AppButton variant="primary" size="sm" @click="nextSpeaker"
                            :disabled="speakersList.length === 0" class="flex-1">
                            Next Speaker
                        </AppButton>
                        <AppButton variant="outline" size="sm" @click="clearSpeakersList" class="flex-1">
                            Clear List
                        </AppButton>
                    </div>
                </div>
            </div>

            <!-- Session Activity Log -->
            <div class="bg-white rounded-2xl shadow-mun border border-white/20 p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Session Activity</h3>

                <div class="space-y-3 max-h-96 overflow-y-auto">
                    <div v-for="activity in sessionActivity" :key="activity.id"
                        class="flex items-start space-x-3 p-3 bg-mun-gray-50 rounded-lg">
                        <div :class="[
                            'w-2 h-2 rounded-full mt-2',
                            getActivityColor(activity.type)
                        ]"></div>
                        <div class="flex-1">
                            <div class="text-sm font-medium text-mun-gray-900">
                                {{ activity.description }}
                            </div>
                            <div class="text-xs text-mun-gray-500">
                                {{ formatActivityTime(activity.timestamp) }}
                            </div>
                        </div>
                    </div>

                    <div v-if="sessionActivity.length === 0" class="text-center py-8">
                        <ClockIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                        <p class="text-mun-gray-500">No activity yet</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <AttendanceModal v-model="showAttendanceModal" :session="currentSession"
            @attendance-updated="handleAttendanceUpdate" />

        <SpeakersModal v-model="showSpeakersModal" :session="currentSession" @speaker-added="handleSpeakerAdded" />

        <VotingModal v-model="showVotingModal" :session="currentSession" @voting-started="handleVotingStarted" />

        <SessionSettingsModal v-model="showSessionSettings" :session="currentSession"
            @session-updated="handleSessionUpdated" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    PlayIcon,
    PauseIcon,
    StopIcon,
    ArrowPathIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    HandRaisedIcon,
    PlusIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    XMarkIcon,
    ClockIcon
} from '@heroicons/vue/24/outline'

// Components (these would need to be created)
import AttendanceModal from '@/components/presidium/AttendanceModal.vue'
import SpeakersModal from '@/components/presidium/SpeakersModal.vue'
import VotingModal from '@/components/presidium/VotingModal.vue'
import SessionSettingsModal from '@/components/presidium/SessionSettingsModal.vue'

const authStore = useAuthStore()
const appStore = useAppStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isStarting = ref(false)
const isPausing = ref(false)
const isResuming = ref(false)
const isEnding = ref(false)

// Session data
const currentSession = ref(null)
const sessionTimer = ref(0)
const speakingTimer = ref(0)
const speakingTimeLimit = ref(120)
const speakingTimerActive = ref(false)
const currentSpeaker = ref(null)
const speakersList = ref([])
const attendanceCount = ref(0)
const sessionActivity = ref([])

// Modals
const showAttendanceModal = ref(false)
const showSpeakersModal = ref(false)
const showVotingModal = ref(false)
const showSessionSettings = ref(false)

// Timer intervals
let sessionInterval = null
let speakingInterval = null

// Debate modes
const debateModes = [
    {
        value: 'formal',
        name: 'Formal Debate',
        description: 'Structured debate with speakers list'
    },
    {
        value: 'informal',
        name: 'Informal Consultation',
        description: 'Open discussion format'
    },
    {
        value: 'moderated',
        name: 'Moderated Caucus',
        description: 'Presidium-moderated discussion'
    },
    {
        value: 'unmoderated',
        name: 'Unmoderated Caucus',
        description: 'Free delegate interaction'
    }
]

// Computed
const getSessionIcon = () => {
    if (!currentSession.value) return PlayIcon
    return currentSession.value.status === 'active' ? PlayIcon : PauseIcon
}

const getStatusBadgeClass = () => {
    if (!currentSession.value) return ''

    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (currentSession.value.status) {
        case 'active':
            return `${baseClass} bg-mun-green-100 text-mun-green-800`
        case 'paused':
            return `${baseClass} bg-mun-yellow-100 text-mun-yellow-800`
        case 'completed':
            return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
        default:
            return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
    }
}

// Methods
const loadCurrentSession = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.sessions.getCurrent(authStore.committeeInfo.id)

        if (response.data.success && response.data.session) {
            currentSession.value = response.data.session
            initializeSessionData()
        }

    } catch (error) {
        console.error('Load session error:', error)
    } finally {
        isLoading.value = false
    }
}

const initializeSessionData = () => {
    if (!currentSession.value) return

    // Initialize timers
    sessionTimer.value = currentSession.value.duration || 0
    speakingTimer.value = speakingTimeLimit.value

    // Load session data
    speakersList.value = currentSession.value.speakersList || []
    currentSpeaker.value = currentSession.value.currentSpeaker || null
    attendanceCount.value = currentSession.value.attendanceCount || 0
    sessionActivity.value = currentSession.value.activity || []

    // Start session timer if active
    if (currentSession.value.status === 'active') {
        startSessionTimer()
    }
}

const startNewSession = async () => {
    try {
        isStarting.value = true

        const sessionData = {
            committeeId: authStore.committeeInfo.id,
            title: `${new Date().toLocaleDateString()} Session`,
            debateMode: 'formal',
            status: 'active'
        }

        const response = await apiMethods.sessions.create(sessionData)

        if (response.data.success) {
            currentSession.value = response.data.session
            initializeSessionData()
            addActivity('Session started', 'session')
            toast.success('Session started successfully')
        }

    } catch (error) {
        console.error('Start session error:', error)
        toast.error('Failed to start session')
    } finally {
        isStarting.value = false
    }
}

const pauseSession = async () => {
    try {
        isPausing.value = true

        const response = await apiMethods.sessions.update(currentSession.value._id, {
            status: 'paused'
        })

        if (response.data.success) {
            currentSession.value.status = 'paused'
            stopSessionTimer()
            addActivity('Session paused', 'session')
            toast.success('Session paused')
        }

    } catch (error) {
        console.error('Pause session error:', error)
        toast.error('Failed to pause session')
    } finally {
        isPausing.value = false
    }
}

const resumeSession = async () => {
    try {
        isResuming.value = true

        const response = await apiMethods.sessions.update(currentSession.value._id, {
            status: 'active'
        })

        if (response.data.success) {
            currentSession.value.status = 'active'
            startSessionTimer()
            addActivity('Session resumed', 'session')
            toast.success('Session resumed')
        }

    } catch (error) {
        console.error('Resume session error:', error)
        toast.error('Failed to resume session')
    } finally {
        isResuming.value = false
    }
}

const endSession = async () => {
    try {
        isEnding.value = true

        const response = await apiMethods.sessions.update(currentSession.value._id, {
            status: 'completed',
            endedAt: new Date().toISOString()
        })

        if (response.data.success) {
            stopAllTimers()
            addActivity('Session ended', 'session')
            toast.success('Session ended')

            // Clear session after delay
            setTimeout(() => {
                currentSession.value = null
                sessionActivity.value = []
            }, 2000)
        }

    } catch (error) {
        console.error('End session error:', error)
        toast.error('Failed to end session')
    } finally {
        isEnding.value = false
    }
}

const changeDebateMode = async (mode) => {
    try {
        const response = await apiMethods.sessions.update(currentSession.value._id, {
            debateMode: mode
        })

        if (response.data.success) {
            currentSession.value.debateMode = mode
            addActivity(`Debate mode changed to ${mode}`, 'mode')
            toast.success(`Debate mode changed to ${mode}`)
        }

    } catch (error) {
        console.error('Change debate mode error:', error)
        toast.error('Failed to change debate mode')
    }
}

// Timer functions
const startSessionTimer = () => {
    if (sessionInterval) clearInterval(sessionInterval)

    sessionInterval = setInterval(() => {
        sessionTimer.value++
    }, 1000)
}

const stopSessionTimer = () => {
    if (sessionInterval) {
        clearInterval(sessionInterval)
        sessionInterval = null
    }
}

const startSpeakingTimer = () => {
    if (!currentSpeaker.value) return

    speakingTimerActive.value = true
    addActivity(`${currentSpeaker.value.country} started speaking`, 'speaking')

    speakingInterval = setInterval(() => {
        if (speakingTimer.value > 0) {
            speakingTimer.value--
        } else {
            // Time expired
            pauseSpeakingTimer()
            addActivity(`${currentSpeaker.value.country} time expired`, 'timer')
            toast.warning('Speaking time expired!')
        }
    }, 1000)
}

const pauseSpeakingTimer = () => {
    speakingTimerActive.value = false
    if (speakingInterval) {
        clearInterval(speakingInterval)
        speakingInterval = null
    }
}

const resetSpeakingTimer = () => {
    pauseSpeakingTimer()
    speakingTimer.value = speakingTimeLimit.value
}

const stopAllTimers = () => {
    stopSessionTimer()
    pauseSpeakingTimer()
}

// Speaker management
const nextSpeaker = () => {
    if (speakersList.value.length === 0) return

    // Move current speaker to previous
    if (currentSpeaker.value) {
        addActivity(`${currentSpeaker.value.country} finished speaking`, 'speaking')
    }

    // Set next speaker
    currentSpeaker.value = speakersList.value.shift()
    resetSpeakingTimer()

    addActivity(`${currentSpeaker.value.country} now speaking`, 'speaking')
}

const moveSpeakerUp = (index) => {
    if (index === 0) return

    const speaker = speakersList.value.splice(index, 1)[0]
    speakersList.value.splice(index - 1, 0, speaker)
}

const moveSpeakerDown = (index) => {
    if (index === speakersList.value.length - 1) return

    const speaker = speakersList.value.splice(index, 1)[0]
    speakersList.value.splice(index + 1, 0, speaker)
}

const removeSpeaker = (index) => {
    const speaker = speakersList.value.splice(index, 1)[0]
    addActivity(`${speaker.country} removed from speakers list`, 'speakers')
}

const clearSpeakersList = () => {
    speakersList.value = []
    addActivity('Speakers list cleared', 'speakers')
    toast.success('Speakers list cleared')
}

// Event handlers
const handleAttendanceUpdate = (attendance) => {
    attendanceCount.value = attendance.presentCount
    addActivity(`Attendance updated: ${attendance.presentCount} present`, 'attendance')
}

const handleSpeakerAdded = (speaker) => {
    speakersList.value.push(speaker)
    addActivity(`${speaker.country} added to speakers list`, 'speakers')
}

const handleVotingStarted = (voting) => {
    addActivity(`Voting started: ${voting.title}`, 'voting')
}

const handleSessionUpdated = (session) => {
    currentSession.value = { ...currentSession.value, ...session }
    addActivity('Session settings updated', 'session')
}

// Utility functions
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatSessionStatus = () => {
    if (!currentSession.value) return ''

    const startTime = new Date(currentSession.value.startedAt)
    return `Started at ${startTime.toLocaleTimeString()}`
}

const formatSessionDuration = () => {
    return formatTime(sessionTimer.value)
}

const formatStatus = (status) => {
    const statusMap = {
        'active': 'Active',
        'paused': 'Paused',
        'completed': 'Completed'
    }
    return statusMap[status] || status
}

const formatActivityTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
}

const getActivityColor = (type) => {
    const colorMap = {
        'session': 'bg-un-blue',
        'speaking': 'bg-mun-green-500',
        'timer': 'bg-mun-yellow-500',
        'speakers': 'bg-mun-purple-500',
        'attendance': 'bg-mun-blue-500',
        'voting': 'bg-mun-red-500',
        'mode': 'bg-mun-gray-500'
    }
    return colorMap[type] || 'bg-mun-gray-400'
}

const addActivity = (description, type) => {
    sessionActivity.value.unshift({
        id: Date.now(),
        description,
        type,
        timestamp: new Date().toISOString()
    })

    // Keep only last 50 activities
    if (sessionActivity.value.length > 50) {
        sessionActivity.value = sessionActivity.value.slice(0, 50)
    }
}

const refreshSession = () => {
    loadCurrentSession()
    toast.success('Session refreshed')
}

// WebSocket event handlers
const handleWebSocketMessage = (message) => {
    switch (message.type) {
        case 'session_updated':
            if (message.data.sessionId === currentSession.value?._id) {
                currentSession.value = { ...currentSession.value, ...message.data.updates }
            }
            break
        case 'speaker_added':
            if (message.data.sessionId === currentSession.value?._id) {
                handleSpeakerAdded(message.data.speaker)
            }
            break
        case 'attendance_updated':
            if (message.data.sessionId === currentSession.value?._id) {
                handleAttendanceUpdate(message.data.attendance)
            }
            break
    }
}

// Lifecycle
onMounted(() => {
    loadCurrentSession()

    // Set up WebSocket listeners
    wsStore.on('message', handleWebSocketMessage)

    // Update breadcrumbs
    appStore.setBreadcrumbs([
        { text: 'Presidium', to: { name: 'PresidiumDashboard' } },
        { text: 'Session Management', active: true }
    ])
})

onUnmounted(() => {
    stopAllTimers()
    wsStore.off('message', handleWebSocketMessage)
})
</script>

<style scoped>
/* Timer display styling */
.timer-display {
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
}

/* Activity log scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}
</style>