<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Session Management</h1>
                <p class="text-mun-gray-600">Control committee sessions and debate flow</p>
            </div>
        </div>

        <!-- Session Controls -->
        <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Session Controls</h2>

            <div v-if="currentSession" class="space-y-4">
                <!-- Session Status -->
                <div class="flex items-center justify-between p-4 bg-mun-gray-50 rounded-lg">
                    <div>
                        <h3 class="font-medium text-mun-gray-900">Session {{ currentSession.number }}</h3>
                        <p class="text-sm text-mun-gray-600">{{ currentSession.mode }} • {{ formatTime(sessionDuration)
                            }}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span :class="[
                            'px-3 py-1 rounded-full text-sm font-medium',
                            currentSession.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                currentSession.status === 'paused' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                    'bg-mun-gray-100 text-mun-gray-700'
                        ]">
                            {{ currentSession.status?.charAt(0).toUpperCase() + currentSession.status?.slice(1) }}
                        </span>

                        <button v-if="currentSession.status === 'active'" @click="pauseSession" :disabled="isLoading"
                            class="btn-un-secondary px-4 py-2">
                            <PauseIcon class="w-4 h-4 mr-2" />
                            Pause
                        </button>

                        <button v-if="currentSession.status === 'paused'" @click="resumeSession" :disabled="isLoading"
                            class="btn-un-primary px-4 py-2">
                            <PlayIcon class="w-4 h-4 mr-2" />
                            Resume
                        </button>

                        <button @click="endSession" :disabled="isLoading"
                            class="px-4 py-2 bg-mun-red-500 hover:bg-mun-red-600 text-white rounded-lg transition-colors">
                            <StopIcon class="w-4 h-4 mr-2" />
                            End Session
                        </button>
                    </div>
                </div>

                <!-- Debate Mode -->
                <div class="p-4 border border-mun-gray-200 rounded-lg">
                    <h3 class="font-medium text-mun-gray-900 mb-3">Debate Mode</h3>
                    <div class="flex items-center space-x-4">
                        <select v-model="selectedMode" @change="changeDebateMode" class="input-field max-w-xs">
                            <option value="formal">Formal Debate</option>
                            <option value="informal">Informal Consultation</option>
                            <option value="moderated">Moderated Caucus</option>
                            <option value="unmoderated">Unmoderated Caucus</option>
                        </select>

                        <div v-if="selectedMode === 'moderated'" class="flex items-center space-x-2">
                            <label class="text-sm text-mun-gray-600">Duration:</label>
                            <input v-model="caucusDuration" type="number" min="1" max="30" class="input-field w-20"
                                placeholder="10">
                            <span class="text-sm text-mun-gray-600">minutes</span>
                        </div>
                    </div>
                </div>

                <!-- Speaking Timer -->
                <div class="p-4 border border-mun-gray-200 rounded-lg">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-medium text-mun-gray-900">Speaking Timer</h3>
                        <div class="text-2xl font-mono font-bold text-mun-gray-900">
                            {{ formatTime(speakingTime) }}
                        </div>
                    </div>

                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <label class="text-sm text-mun-gray-600">Duration:</label>
                            <select v-model="speakingDuration" class="input-field w-24">
                                <option value="60">1 min</option>
                                <option value="90">1.5 min</option>
                                <option value="120">2 min</option>
                                <option value="180">3 min</option>
                            </select>
                        </div>

                        <button v-if="!speakingTimerActive" @click="startSpeakingTimer"
                            class="btn-un-primary px-4 py-2">
                            <PlayIcon class="w-4 h-4 mr-2" />
                            Start
                        </button>

                        <button v-if="speakingTimerActive" @click="stopSpeakingTimer"
                            class="px-4 py-2 bg-mun-red-500 hover:bg-mun-red-600 text-white rounded-lg transition-colors">
                            <StopIcon class="w-4 h-4 mr-2" />
                            Stop
                        </button>

                        <button @click="resetSpeakingTimer" class="btn-un-secondary px-4 py-2">
                            <ArrowPathIcon class="w-4 h-4 mr-2" />
                            Reset
                        </button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <RouterLink to="/presidium/attendance" class="btn-un-secondary text-center">
                        <UsersIcon class="w-5 h-5 mx-auto mb-2" />
                        Attendance
                    </RouterLink>

                    <button @click="openSpeakersModal" class="btn-un-secondary">
                        <MegaphoneIcon class="w-5 h-5 mx-auto mb-2" />
                        Speakers
                    </button>

                    <RouterLink to="/presidium/voting" class="btn-un-secondary text-center">
                        <HandRaisedIcon class="w-5 h-5 mx-auto mb-2" />
                        Voting
                    </RouterLink>

                    <button @click="openSettingsModal" class="btn-un-secondary">
                        <CogIcon class="w-5 h-5 mx-auto mb-2" />
                        Settings
                    </button>
                </div>
            </div>

            <!-- No Session State -->
            <div v-else class="text-center py-8">
                <ClockIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Active Session</h3>
                <p class="mt-2 text-mun-gray-600 mb-4">Start a new session to begin committee work</p>
                <button @click="startNewSession" :disabled="isLoading" class="btn-un-primary">
                    <PlayIcon class="w-5 h-5 mr-2" />
                    Start New Session
                </button>
            </div>
        </div>

        <!-- Current Speakers -->
        <div v-if="currentSession" class="mun-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-mun-gray-900">Speakers List</h2>
                <button @click="openSpeakersModal" class="text-un-blue hover:text-un-blue-600 text-sm font-medium">
                    Manage List
                </button>
            </div>

            <div v-if="speakersList.length > 0" class="space-y-3">
                <div v-for="(speaker, index) in speakersList.slice(0, 5)" :key="speaker.id" :class="[
                    'flex items-center justify-between p-3 rounded-lg',
                    index === 0 ? 'bg-un-blue/10 border border-un-blue/20' : 'bg-mun-gray-50'
                ]">
                    <div class="flex items-center space-x-3">
                        <span :class="[
                            'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium',
                            index === 0 ? 'bg-un-blue text-white' : 'bg-mun-gray-300 text-mun-gray-700'
                        ]">
                            {{ index + 1 }}
                        </span>
                        <div>
                            <p class="font-medium text-mun-gray-900">{{ speaker.country }}</p>
                            <p v-if="index === 0" class="text-sm text-un-blue">Currently Speaking</p>
                        </div>
                    </div>

                    <div v-if="index === 0" class="text-sm text-mun-gray-600">
                        {{ speaker.timeRemaining || speakingDuration }}s remaining
                    </div>
                </div>

                <div v-if="speakersList.length > 5" class="text-center text-sm text-mun-gray-500">
                    +{{ speakersList.length - 5 }} more speakers
                </div>
            </div>

            <div v-else class="text-center py-4 text-mun-gray-500">
                No speakers in queue
            </div>
        </div>

        <!-- Modals would go here -->
        <!-- SpeakersModal, SessionSettingsModal, etc. -->
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    PlayIcon,
    PauseIcon,
    StopIcon,
    ClockIcon,
    ArrowPathIcon,
    UsersIcon,
    MegaphoneIcon,
    HandRaisedIcon,
    CogIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const currentSession = ref(null)
const sessionDuration = ref(0)
const speakingTime = ref(0)
const speakingTimerActive = ref(false)
const selectedMode = ref('formal')
const caucusDuration = ref(10)
const speakingDuration = ref(120)

const speakersList = ref([])

// Timer intervals
let sessionInterval = null
let speakingInterval = null

// Methods
const loadSessionData = async () => {
    try {
        isLoading.value = true

        // Load current session
        currentSession.value = {
            id: '1',
            number: 1,
            status: 'active',
            mode: 'Formal Debate',
            startedAt: new Date().toISOString()
        }

        // Load speakers list
        speakersList.value = [
            { id: 1, country: 'United States', timeRemaining: 90 },
            { id: 2, country: 'United Kingdom' },
            { id: 3, country: 'France' },
            { id: 4, country: 'Germany' }
        ]

        startSessionTimer()

    } catch (error) {
        console.error('Load session error:', error)
        toast.error('Failed to load session data')
    } finally {
        isLoading.value = false
    }
}

const startNewSession = async () => {
    try {
        isLoading.value = true
        toast.success('Session started successfully')
        await loadSessionData()
    } catch (error) {
        console.error('Start session error:', error)
        toast.error('Failed to start session')
    } finally {
        isLoading.value = false
    }
}

const pauseSession = async () => {
    try {
        currentSession.value.status = 'paused'
        stopSessionTimer()
        toast.success('Session paused')
    } catch (error) {
        console.error('Pause session error:', error)
        toast.error('Failed to pause session')
    }
}

const resumeSession = async () => {
    try {
        currentSession.value.status = 'active'
        startSessionTimer()
        toast.success('Session resumed')
    } catch (error) {
        console.error('Resume session error:', error)
        toast.error('Failed to resume session')
    }
}

const endSession = async () => {
    try {
        currentSession.value = null
        stopSessionTimer()
        stopSpeakingTimer()
        toast.success('Session ended')
    } catch (error) {
        console.error('End session error:', error)
        toast.error('Failed to end session')
    }
}

const changeDebateMode = async () => {
    try {
        currentSession.value.mode = selectedMode.value
        toast.success(`Debate mode changed to ${selectedMode.value}`)
    } catch (error) {
        console.error('Change mode error:', error)
        toast.error('Failed to change debate mode')
    }
}

const startSpeakingTimer = () => {
    speakingTime.value = parseInt(speakingDuration.value)
    speakingTimerActive.value = true

    speakingInterval = setInterval(() => {
        if (speakingTime.value > 0) {
            speakingTime.value--
        } else {
            stopSpeakingTimer()
            toast.warning('Speaking time expired!')
        }
    }, 1000)
}

const stopSpeakingTimer = () => {
    speakingTimerActive.value = false
    if (speakingInterval) {
        clearInterval(speakingInterval)
        speakingInterval = null
    }
}

const resetSpeakingTimer = () => {
    stopSpeakingTimer()
    speakingTime.value = parseInt(speakingDuration.value)
}

const startSessionTimer = () => {
    sessionInterval = setInterval(() => {
        sessionDuration.value++
    }, 1000)
}

const stopSessionTimer = () => {
    if (sessionInterval) {
        clearInterval(sessionInterval)
        sessionInterval = null
    }
}

const openSpeakersModal = () => {
    // TODO: Open speakers management modal
    toast.info('Speakers management modal would open here')
}

const openSettingsModal = () => {
    // TODO: Open session settings modal
    toast.info('Session settings modal would open here')
}

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
    loadSessionData()
})

onUnmounted(() => {
    stopSessionTimer()
    stopSpeakingTimer()
})
</script>