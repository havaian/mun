<!-- frontend/src/components/presidium/TimerControls.vue -->
<template>
    <div class="timer-controls" :class="containerClasses">
        <!-- Session Timer -->
        <div class="timer-section session-timer">
            <div class="timer-header">
                <h4 class="text-sm font-medium text-mun-gray-900 flex items-center">
                    <ClockIcon class="w-4 h-4 mr-2 text-mun-blue" />
                    Session Timer
                </h4>

                <div class="timer-status-badge" :class="getSessionTimerStatusClass()">
                    {{ getSessionTimerStatus() }}
                </div>
            </div>

            <div class="timer-content">
                <TimerDisplay :remaining-time="sessionTimer.remainingTime" :total-time="sessionTimer.totalDuration"
                    :is-running="sessionTimer.isRunning" :is-paused="sessionTimer.isPaused" size="medium"
                    variant="session" :show-progress="true" :show-controls="false" :show-warnings="true"
                    :warning-threshold="300" :danger-threshold="60" />

                <div class="timer-controls-row">
                    <button v-if="!sessionTimer.isRunning && !sessionTimer.isPaused" @click="startSessionTimer"
                        :disabled="isUpdating" class="timer-btn timer-btn-start">
                        <PlayIcon class="w-4 h-4 mr-1" />
                        Start Session
                    </button>

                    <button v-else-if="sessionTimer.isRunning" @click="pauseSessionTimer" :disabled="isUpdating"
                        class="timer-btn timer-btn-pause">
                        <PauseIcon class="w-4 h-4 mr-1" />
                        Pause
                    </button>

                    <button v-else-if="sessionTimer.isPaused" @click="resumeSessionTimer" :disabled="isUpdating"
                        class="timer-btn timer-btn-resume">
                        <PlayIcon class="w-4 h-4 mr-1" />
                        Resume
                    </button>

                    <button v-if="sessionTimer.isRunning || sessionTimer.isPaused" @click="stopSessionTimer"
                        :disabled="isUpdating" class="timer-btn timer-btn-stop">
                        <StopIcon class="w-4 h-4 mr-1" />
                        Stop
                    </button>

                    <button v-if="sessionTimer.isRunning || sessionTimer.isPaused" @click="extendSessionTimer"
                        :disabled="isUpdating || sessionTimer.extensionsUsed >= maxExtensions"
                        class="timer-btn timer-btn-extend">
                        <PlusIcon class="w-4 h-4 mr-1" />
                        Extend (+15m)
                    </button>
                </div>

                <!-- Session timer settings -->
                <div v-if="!sessionTimer.isRunning && !sessionTimer.isPaused" class="timer-settings">
                    <div class="flex items-center space-x-2">
                        <label class="text-xs text-mun-gray-600">Duration:</label>
                        <select v-model="sessionTimerDuration"
                            class="text-xs border border-mun-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-mun-blue">
                            <option :value="60">1 hour</option>
                            <option :value="90">1.5 hours</option>
                            <option :value="120">2 hours</option>
                            <option :value="150">2.5 hours</option>
                            <option :value="180">3 hours</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Speaker Timer -->
        <div class="timer-section speaker-timer">
            <div class="timer-header">
                <h4 class="text-sm font-medium text-mun-gray-900 flex items-center">
                    <MicrophoneIcon class="w-4 h-4 mr-2 text-green-600" />
                    Speaker Timer
                </h4>

                <div v-if="currentSpeaker" class="current-speaker-info">
                    <CountryFlag :country-name="currentSpeaker.countryName" :country-code="currentSpeaker.countryCode"
                        size="tiny" class="mr-1" />
                    <span class="text-xs text-mun-gray-600">{{ currentSpeaker.countryName }}</span>
                </div>
            </div>

            <div class="timer-content">
                <TimerDisplay :remaining-time="speakerTimer.remainingTime" :total-time="speakerTimer.duration"
                    :is-running="speakerTimer.isRunning" :is-paused="speakerTimer.isPaused"
                    :is-extended="speakerTimer.extensionUsed" size="medium" variant="speaker" :show-progress="true"
                    :show-controls="false" :show-warnings="true" :warning-threshold="30" :danger-threshold="10" />

                <div class="timer-controls-row">
                    <button v-if="!speakerTimer.isRunning && !speakerTimer.isPaused && currentSpeaker"
                        @click="startSpeakerTimer" :disabled="isUpdating" class="timer-btn timer-btn-start">
                        <PlayIcon class="w-4 h-4 mr-1" />
                        Start Speech
                    </button>

                    <button v-else-if="speakerTimer.isRunning" @click="pauseSpeakerTimer" :disabled="isUpdating"
                        class="timer-btn timer-btn-pause">
                        <PauseIcon class="w-4 h-4 mr-1" />
                        Pause
                    </button>

                    <button v-else-if="speakerTimer.isPaused" @click="resumeSpeakerTimer" :disabled="isUpdating"
                        class="timer-btn timer-btn-resume">
                        <PlayIcon class="w-4 h-4 mr-1" />
                        Resume
                    </button>

                    <button v-if="speakerTimer.isRunning || speakerTimer.isPaused" @click="finishSpeech"
                        :disabled="isUpdating" class="timer-btn timer-btn-finish">
                        <CheckIcon class="w-4 h-4 mr-1" />
                        Finish
                    </button>

                    <button v-if="speakerTimer.isRunning && speakerTimer.allowExtension && !speakerTimer.extensionUsed"
                        @click="extendSpeakerTimer" :disabled="isUpdating" class="timer-btn timer-btn-extend">
                        <PlusIcon class="w-4 h-4 mr-1" />
                        Extend (+30s)
                    </button>
                </div>

                <!-- Speaker timer settings -->
                <div v-if="!speakerTimer.isRunning && !speakerTimer.isPaused" class="timer-settings">
                    <div class="flex items-center space-x-2">
                        <label class="text-xs text-mun-gray-600">Speech time:</label>
                        <select v-model="speakerTimerDuration"
                            class="text-xs border border-mun-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-mun-blue">
                            <option :value="60">1 minute</option>
                            <option :value="90">1.5 minutes</option>
                            <option :value="120">2 minutes</option>
                            <option :value="180">3 minutes</option>
                            <option :value="240">4 minutes</option>
                            <option :value="300">5 minutes</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Additional Timers -->
        <div v-if="additionalTimers.length > 0" class="timer-section additional-timers">
            <div class="timer-header">
                <h4 class="text-sm font-medium text-mun-gray-900 flex items-center">
                    <ClockIcon class="w-4 h-4 mr-2 text-amber-600" />
                    Additional Timers
                </h4>

                <button @click="showCreateAdditionalTimer = true"
                    class="text-xs text-mun-blue hover:text-mun-blue-600 flex items-center">
                    <PlusIcon class="w-3 h-3 mr-1" />
                    Add Timer
                </button>
            </div>

            <div class="additional-timers-list space-y-2">
                <div v-for="timer in additionalTimers" :key="timer.id" class="additional-timer-item">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-medium text-mun-gray-800">{{ timer.purpose }}</span>
                            <TimerDisplay :remaining-time="timer.remainingTime" :total-time="timer.duration"
                                :is-running="timer.isActive" size="small" variant="warning" :show-header="false"
                                :show-controls="false" :show-progress="false" />
                        </div>

                        <div class="flex items-center space-x-1">
                            <button v-if="!timer.isActive" @click="startAdditionalTimer(timer.id)"
                                :disabled="isUpdating" class="timer-btn-small timer-btn-start">
                                <PlayIcon class="w-3 h-3" />
                            </button>

                            <button v-else @click="stopAdditionalTimer(timer.id)" :disabled="isUpdating"
                                class="timer-btn-small timer-btn-stop">
                                <StopIcon class="w-3 h-3" />
                            </button>

                            <button @click="removeAdditionalTimer(timer.id)" :disabled="isUpdating"
                                class="timer-btn-small timer-btn-remove">
                                <XMarkIcon class="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="timer-section quick-actions">
            <div class="timer-header">
                <h4 class="text-sm font-medium text-mun-gray-900">Quick Actions</h4>
            </div>

            <div class="quick-actions-grid">
                <button @click="startBreakTimer" :disabled="isUpdating" class="quick-action-btn">
                    <CoffeeIcon class="w-4 h-4 mb-1" />
                    <span>Break (15m)</span>
                </button>

                <button @click="startVotingTimer" :disabled="isUpdating" class="quick-action-btn">
                    <ChartBarIcon class="w-4 h-4 mb-1" />
                    <span>Voting (5m)</span>
                </button>

                <button @click="startCaucusTimer" :disabled="isUpdating" class="quick-action-btn">
                    <UserGroupIcon class="w-4 h-4 mb-1" />
                    <span>Caucus (20m)</span>
                </button>

                <button @click="showCreateAdditionalTimer = true" :disabled="isUpdating" class="quick-action-btn">
                    <PlusIcon class="w-4 h-4 mb-1" />
                    <span>Custom</span>
                </button>
            </div>
        </div>

        <!-- Create Additional Timer Modal -->
        <div v-if="showCreateAdditionalTimer" class="create-timer-modal">
            <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Create Additional Timer</h3>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Purpose</label>
                            <input v-model="newTimerForm.purpose" type="text"
                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue"
                                placeholder="e.g., Moderated Caucus" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Duration (minutes)</label>
                            <input v-model.number="newTimerForm.duration" type="number" min="1" max="120"
                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue"
                                placeholder="e.g., 20" />
                        </div>

                        <div class="flex items-center">
                            <input v-model="newTimerForm.startImmediately" type="checkbox"
                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                            <label class="ml-2 text-sm text-mun-gray-700">Start immediately</label>
                        </div>
                    </div>

                    <div class="flex items-center justify-end space-x-3 mt-6">
                        <button @click="showCreateAdditionalTimer = false"
                            class="px-3 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50">
                            Cancel
                        </button>

                        <button @click="createAdditionalTimer"
                            :disabled="!newTimerForm.purpose || !newTimerForm.duration || isUpdating"
                            class="px-3 py-2 text-sm font-medium text-white bg-mun-blue border border-transparent rounded-md hover:bg-mun-blue-600 disabled:opacity-50">
                            {{ isUpdating ? 'Creating...' : 'Create Timer' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
    ClockIcon,
    MicrophoneIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    PlusIcon,
    CheckIcon,
    XMarkIcon,
    CoffeeIcon,
    ChartBarIcon,
    UserGroupIcon
} from '@heroicons/vue/24/outline'
import TimerDisplay from '@/components/shared/TimerDisplay.vue'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import { useSessionStore } from '@/stores/session'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    sessionId: {
        type: String,
        required: true
    },
    currentSpeaker: {
        type: Object,
        default: null
    },
    variant: {
        type: String,
        default: 'full', // full, compact, minimal
        validator: (value) => ['full', 'compact', 'minimal'].includes(value)
    }
})

// Emits
const emit = defineEmits(['timer-started', 'timer-stopped', 'speaker-finished'])

const sessionStore = useSessionStore()
const toast = useToast()

// State
const isUpdating = ref(false)
const showCreateAdditionalTimer = ref(false)
const sessionTimerDuration = ref(120) // minutes
const speakerTimerDuration = ref(120) // seconds
const maxExtensions = 3

// Timer states from store
const sessionTimer = computed(() => sessionStore.timers.session)
const speakerTimer = computed(() => sessionStore.timers.speaker)
const additionalTimers = computed(() => sessionStore.timers.additional)

// New timer form
const newTimerForm = reactive({
    purpose: '',
    duration: 20,
    startImmediately: false
})

// Computed
const containerClasses = computed(() => {
    const base = 'timer-controls bg-white border border-mun-gray-200 rounded-lg'
    const variants = {
        full: 'p-4 space-y-4',
        compact: 'p-3 space-y-3',
        minimal: 'p-2 space-y-2'
    }

    return `${base} ${variants[props.variant]}`
})

// Style classes for timer status
const getSessionTimerStatusClass = () => {
    if (sessionTimer.value.isRunning) return 'bg-green-100 text-green-800'
    if (sessionTimer.value.isPaused) return 'bg-amber-100 text-amber-800'
    return 'bg-mun-gray-100 text-mun-gray-800'
}

const getSessionTimerStatus = () => {
    if (sessionTimer.value.isRunning) return 'Running'
    if (sessionTimer.value.isPaused) return 'Paused'
    return 'Stopped'
}

// Timer control methods
const startSessionTimer = async () => {
    try {
        isUpdating.value = true
        await sessionStore.startSessionTimer(props.sessionId, sessionTimerDuration.value * 60)
        emit('timer-started', { type: 'session', duration: sessionTimerDuration.value * 60 })
        toast.success('Session timer started')
    } catch (error) {
        console.error('Start session timer error:', error)
        toast.error('Failed to start session timer')
    } finally {
        isUpdating.value = false
    }
}

const pauseSessionTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.pauseTimer(props.sessionId, 'session')
        toast.info('Session timer paused')
    } catch (error) {
        console.error('Pause session timer error:', error)
        toast.error('Failed to pause session timer')
    } finally {
        isUpdating.value = false
    }
}

const resumeSessionTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.resumeTimer(props.sessionId, 'session')
        toast.success('Session timer resumed')
    } catch (error) {
        console.error('Resume session timer error:', error)
        toast.error('Failed to resume session timer')
    } finally {
        isUpdating.value = false
    }
}

const stopSessionTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.stopTimer(props.sessionId, 'session')
        emit('timer-stopped', { type: 'session' })
        toast.info('Session timer stopped')
    } catch (error) {
        console.error('Stop session timer error:', error)
        toast.error('Failed to stop session timer')
    } finally {
        isUpdating.value = false
    }
}

const extendSessionTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.extendTimer(props.sessionId, 'session', { extension: 900 }) // 15 minutes
        toast.success('Session timer extended by 15 minutes')
    } catch (error) {
        console.error('Extend session timer error:', error)
        toast.error('Failed to extend session timer')
    } finally {
        isUpdating.value = false
    }
}

const startSpeakerTimer = async () => {
    if (!props.currentSpeaker) return

    try {
        isUpdating.value = true
        await sessionStore.startSpeakerTimer(props.sessionId, props.currentSpeaker.email, speakerTimerDuration.value)
        emit('timer-started', { type: 'speaker', speaker: props.currentSpeaker, duration: speakerTimerDuration.value })
        toast.success(`Speaker timer started for ${props.currentSpeaker.countryName}`)
    } catch (error) {
        console.error('Start speaker timer error:', error)
        toast.error('Failed to start speaker timer')
    } finally {
        isUpdating.value = false
    }
}

const pauseSpeakerTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.pauseTimer(props.sessionId, 'speaker')
        toast.info('Speaker timer paused')
    } catch (error) {
        console.error('Pause speaker timer error:', error)
        toast.error('Failed to pause speaker timer')
    } finally {
        isUpdating.value = false
    }
}

const resumeSpeakerTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.resumeTimer(props.sessionId, 'speaker')
        toast.success('Speaker timer resumed')
    } catch (error) {
        console.error('Resume speaker timer error:', error)
        toast.error('Failed to resume speaker timer')
    } finally {
        isUpdating.value = false
    }
}

const finishSpeech = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.stopTimer(props.sessionId, 'speaker')
        emit('speaker-finished', props.currentSpeaker)
        toast.success('Speech finished')
    } catch (error) {
        console.error('Finish speech error:', error)
        toast.error('Failed to finish speech')
    } finally {
        isUpdating.value = false
    }
}

const extendSpeakerTimer = async () => {
    try {
        isUpdating.value = true
        await apiMethods.timers.extendTimer(props.sessionId, 'speaker', { extension: 30 })
        toast.success('Speaker timer extended by 30 seconds')
    } catch (error) {
        console.error('Extend speaker timer error:', error)
        toast.error('Failed to extend speaker timer')
    } finally {
        isUpdating.value = false
    }
}

// Additional timer methods
const createAdditionalTimer = async () => {
    try {
        isUpdating.value = true

        const timerData = {
            purpose: newTimerForm.purpose,
            duration: newTimerForm.duration * 60 // convert to seconds
        }

        await apiMethods.timers.createAdditionalTimer(props.sessionId, timerData)

        if (newTimerForm.startImmediately) {
            // Start the timer immediately
            // Implementation would start the timer here
        }

        // Reset form
        newTimerForm.purpose = ''
        newTimerForm.duration = 20
        newTimerForm.startImmediately = false
        showCreateAdditionalTimer.value = false

        toast.success('Additional timer created')

    } catch (error) {
        console.error('Create additional timer error:', error)
        toast.error('Failed to create additional timer')
    } finally {
        isUpdating.value = false
    }
}

const startAdditionalTimer = async (timerId) => {
    try {
        isUpdating.value = true
        await apiMethods.timers.updateAdditionalTimer(props.sessionId, timerId, { action: 'start' })
        toast.success('Timer started')
    } catch (error) {
        console.error('Start additional timer error:', error)
        toast.error('Failed to start timer')
    } finally {
        isUpdating.value = false
    }
}

const stopAdditionalTimer = async (timerId) => {
    try {
        isUpdating.value = true
        await apiMethods.timers.updateAdditionalTimer(props.sessionId, timerId, { action: 'stop' })
        toast.info('Timer stopped')
    } catch (error) {
        console.error('Stop additional timer error:', error)
        toast.error('Failed to stop timer')
    } finally {
        isUpdating.value = false
    }
}

const removeAdditionalTimer = async (timerId) => {
    try {
        isUpdating.value = true
        await apiMethods.timers.deleteAdditionalTimer(props.sessionId, timerId)
        toast.info('Timer removed')
    } catch (error) {
        console.error('Remove additional timer error:', error)
        toast.error('Failed to remove timer')
    } finally {
        isUpdating.value = false
    }
}

// Quick action methods
const startBreakTimer = async () => {
    const timerData = {
        purpose: 'Break',
        duration: 15 * 60 // 15 minutes in seconds
    }

    try {
        isUpdating.value = true
        await apiMethods.timers.createAdditionalTimer(props.sessionId, timerData)
        toast.success('Break timer started (15 minutes)')
    } catch (error) {
        console.error('Start break timer error:', error)
        toast.error('Failed to start break timer')
    } finally {
        isUpdating.value = false
    }
}

const startVotingTimer = async () => {
    const timerData = {
        purpose: 'Voting',
        duration: 5 * 60 // 5 minutes in seconds
    }

    try {
        isUpdating.value = true
        await apiMethods.timers.createAdditionalTimer(props.sessionId, timerData)
        toast.success('Voting timer started (5 minutes)')
    } catch (error) {
        console.error('Start voting timer error:', error)
        toast.error('Failed to start voting timer')
    } finally {
        isUpdating.value = false
    }
}

const startCaucusTimer = async () => {
    const timerData = {
        purpose: 'Moderated Caucus',
        duration: 20 * 60 // 20 minutes in seconds
    }

    try {
        isUpdating.value = true
        await apiMethods.timers.createAdditionalTimer(props.sessionId, timerData)
        toast.success('Caucus timer started (20 minutes)')
    } catch (error) {
        console.error('Start caucus timer error:', error)
        toast.error('Failed to start caucus timer')
    } finally {
        isUpdating.value = false
    }
}

// Lifecycle
onMounted(() => {
    // Load timer state if needed
})

onUnmounted(() => {
    // Cleanup if needed
})
</script>

<style scoped>
.timer-section {
    @apply border border-mun-gray-200 rounded-lg p-3;
}

.timer-header {
    @apply flex items-center justify-between mb-3;
}

.timer-content {
    @apply space-y-3;
}

.timer-controls-row {
    @apply flex items-center justify-center space-x-2 flex-wrap gap-2;
}

.timer-settings {
    @apply flex items-center justify-center;
}

.timer-status-badge {
    @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

.timer-btn {
    @apply inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50;
}

.timer-btn-start {
    @apply text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500;
}

.timer-btn-pause {
    @apply text-amber-700 bg-amber-100 hover:bg-amber-200 focus:ring-amber-500;
}

.timer-btn-resume {
    @apply text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500;
}

.timer-btn-stop {
    @apply text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500;
}

.timer-btn-finish {
    @apply text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500;
}

.timer-btn-extend {
    @apply text-mun-blue-700 bg-mun-blue-100 hover:bg-mun-blue-200 focus:ring-mun-blue;
}

.timer-btn-small {
    @apply inline-flex items-center justify-center w-6 h-6 text-xs rounded transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50;
}

.timer-btn-small.timer-btn-start {
    @apply text-green-600 hover:bg-green-50 focus:ring-green-500;
}

.timer-btn-small.timer-btn-stop {
    @apply text-red-600 hover:bg-red-50 focus:ring-red-500;
}

.timer-btn-small.timer-btn-remove {
    @apply text-mun-gray-400 hover:text-red-600 hover:bg-red-50 focus:ring-red-500;
}

.additional-timer-item {
    @apply bg-mun-gray-50 border border-mun-gray-200 rounded-md p-2;
}

.current-speaker-info {
    @apply flex items-center text-xs text-mun-gray-600 bg-green-50 border border-green-200 rounded px-2 py-1;
}

.quick-actions-grid {
    @apply grid grid-cols-2 sm:grid-cols-4 gap-2;
}

.quick-action-btn {
    @apply flex flex-col items-center justify-center p-3 text-xs font-medium text-mun-gray-700 bg-mun-gray-50 border border-mun-gray-200 rounded-md hover:bg-mun-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50;
}

.create-timer-modal {
    @apply fixed inset-0 z-50;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .timer-controls-row {
        @apply flex-col space-x-0 space-y-2;
    }

    .quick-actions-grid {
        @apply grid-cols-2;
    }

    .timer-btn {
        @apply w-full justify-center;
    }
}

/* Compact variant adjustments */
.timer-controls.variant-compact .timer-section {
    @apply p-2;
}

.timer-controls.variant-compact .timer-header {
    @apply mb-2;
}

.timer-controls.variant-compact .timer-btn {
    @apply px-2 py-1 text-xs;
}

/* Minimal variant adjustments */
.timer-controls.variant-minimal .timer-section {
    @apply p-2 border-0 bg-transparent;
}

.timer-controls.variant-minimal .timer-header {
    @apply mb-1;
}

.timer-controls.variant-minimal .timer-btn {
    @apply px-2 py-1 text-xs;
}
</style>