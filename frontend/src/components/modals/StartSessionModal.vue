<template>
    <div class="max-w-lg mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Start New Session</h2>
            <p class="text-sm text-gray-600 mt-1">Initialize a new committee session</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
            <!-- Session Name -->
            <div>
                <label for="sessionName" class="block text-sm font-medium text-gray-700 mb-2">
                    Session Name *
                </label>
                <input id="sessionName" v-model="form.sessionName" type="text"
                    placeholder="e.g., Session 1 - General Debate" class="input"
                    :class="{ 'input-error': errors.sessionName }" required />
                <p v-if="errors.sessionName" class="mt-1 text-sm text-red-600">{{ errors.sessionName }}</p>
            </div>

            <!-- Session Description -->
            <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea id="description" v-model="form.description" rows="3"
                    placeholder="Brief description of the session agenda..." class="input resize-none"
                    :class="{ 'input-error': errors.description }"></textarea>
                <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
            </div>

            <!-- Initial Debate Mode -->
            <div>
                <label for="initialMode" class="block text-sm font-medium text-gray-700 mb-2">
                    Initial Debate Mode *
                </label>
                <select id="initialMode" v-model="form.initialMode" class="input"
                    :class="{ 'input-error': errors.initialMode }" required>
                    <option value="">Select debate mode</option>
                    <option value="formal">Formal Debate</option>
                    <option value="moderated">Moderated Caucus</option>
                    <option value="unmoderated">Unmoderated Caucus</option>
                    <option value="informal">Informal Consultation</option>
                </select>
                <p v-if="errors.initialMode" class="mt-1 text-sm text-red-600">{{ errors.initialMode }}</p>

                <!-- Mode Description -->
                <div v-if="form.initialMode" class="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-700">{{ getModeDescription(form.initialMode) }}</p>
                </div>
            </div>

            <!-- Session Duration -->
            <div>
                <label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
                    Planned Duration
                </label>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <select id="durationHours" v-model="form.durationHours" class="input">
                            <option value="0">0 hours</option>
                            <option v-for="hour in 12" :key="hour" :value="hour">
                                {{ hour }} hour{{ hour > 1 ? 's' : '' }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <select id="durationMinutes" v-model="form.durationMinutes" class="input">
                            <option value="0">0 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                        </select>
                    </div>
                </div>
                <p class="mt-1 text-xs text-gray-500">
                    Leave as 0 for unlimited session duration
                </p>
            </div>

            <!-- Session Options -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Session Options</h3>

                <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                        <input id="requireAttendance" v-model="form.requireAttendance" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="requireAttendance" class="text-sm font-medium text-gray-700">
                            Require roll call before starting
                        </label>
                    </div>

                    <div class="flex items-center space-x-3">
                        <input id="enableTimers" v-model="form.enableTimers" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="enableTimers" class="text-sm font-medium text-gray-700">
                            Enable session and speaking timers
                        </label>
                    </div>

                    <div class="flex items-center space-x-3">
                        <input id="allowProcedural" v-model="form.allowProcedural" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="allowProcedural" class="text-sm font-medium text-gray-700">
                            Allow procedural motions and points
                        </label>
                    </div>

                    <div class="flex items-center space-x-3">
                        <input id="recordActivity" v-model="form.recordActivity" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="recordActivity" class="text-sm font-medium text-gray-700">
                            Record session activity for statistics
                        </label>
                    </div>
                </div>
            </div>

            <!-- Speaking Time Settings (if timers enabled) -->
            <div v-if="form.enableTimers" class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Timer Settings</h3>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="defaultSpeakingTime" class="block text-sm font-medium text-gray-700 mb-2">
                            Default Speaking Time (seconds)
                        </label>
                        <select id="defaultSpeakingTime" v-model="form.defaultSpeakingTime" class="input">
                            <option value="60">1 minute</option>
                            <option value="90">1.5 minutes</option>
                            <option value="120">2 minutes</option>
                            <option value="180">3 minutes</option>
                            <option value="300">5 minutes</option>
                        </select>
                    </div>

                    <div>
                        <label for="maxExtensions" class="block text-sm font-medium text-gray-700 mb-2">
                            Max Speaking Extensions
                        </label>
                        <select id="maxExtensions" v-model="form.maxExtensions" class="input">
                            <option value="0">No extensions</option>
                            <option value="1">1 extension</option>
                            <option value="2">2 extensions</option>
                            <option value="3">3 extensions</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Error Display -->
            <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error starting session</h3>
                        <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
                    </div>
                </div>
            </div>
        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button type="button" @click="$emit('close')" :disabled="isSubmitting" class="btn-secondary">
                Cancel
            </button>
            <button @click="handleSubmit" :disabled="isSubmitting || !isFormValid" class="btn-primary">
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                {{ isSubmitting ? 'Starting Session...' : 'Start Session' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close', 'success'])
const props = defineProps({
    committeeId: {
        type: String,
        required: true
    }
})

const authStore = useAuthStore()

// Form state
const form = reactive({
    sessionName: '',
    description: '',
    initialMode: 'formal',
    durationHours: 2,
    durationMinutes: 0,
    requireAttendance: true,
    enableTimers: true,
    allowProcedural: true,
    recordActivity: true,
    defaultSpeakingTime: 120,
    maxExtensions: 1
})

const errors = reactive({})
const isSubmitting = ref(false)
const submitError = ref('')

// Computed
const isFormValid = computed(() => {
    return form.sessionName.trim() && form.initialMode
})

const totalDurationMinutes = computed(() => {
    return (form.durationHours * 60) + form.durationMinutes
})

// Methods
function getModeDescription(mode) {
    const descriptions = {
        'formal': 'Structured debate with speakers list and formal procedures',
        'moderated': 'Moderated discussion with time limits and topic focus',
        'unmoderated': 'Free-flowing discussion among delegates',
        'informal': 'Private consultation between select delegates'
    }
    return descriptions[mode] || ''
}

function validateForm() {
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key])

    // Session name validation
    if (!form.sessionName.trim()) {
        errors.sessionName = 'Session name is required'
    } else if (form.sessionName.length < 3) {
        errors.sessionName = 'Session name must be at least 3 characters'
    }

    // Initial mode validation
    if (!form.initialMode) {
        errors.initialMode = 'Initial debate mode is required'
    }

    return Object.keys(errors).length === 0
}

async function handleSubmit() {
    if (!validateForm()) {
        return
    }

    isSubmitting.value = true
    submitError.value = ''

    try {
        // Prepare session data
        const sessionData = {
            name: form.sessionName.trim(),
            description: form.description.trim(),
            initialMode: form.initialMode,
            plannedDuration: totalDurationMinutes.value > 0 ? totalDurationMinutes.value : null,
            settings: {
                requireAttendance: form.requireAttendance,
                enableTimers: form.enableTimers,
                allowProcedural: form.allowProcedural,
                recordActivity: form.recordActivity,
                defaultSpeakingTime: form.defaultSpeakingTime,
                maxExtensions: form.maxExtensions
            }
        }

        const response = await authStore.apiCall(`/presidium/committee/${props.committeeId}/session/start`, {
            method: 'POST',
            body: JSON.stringify(sessionData)
        })

        if (response.ok) {
            const data = await response.json()
            emit('success', data.session)
            emit('close')
        } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to start session')
        }
    } catch (error) {
        console.error('Start session error:', error)
        submitError.value = error.message || 'An unexpected error occurred'
    } finally {
        isSubmitting.value = false
    }
}

// Set default session name based on current time
import { onMounted } from 'vue'

onMounted(() => {
    const now = new Date()
    const sessionNumber = Math.ceil(now.getHours() / 4) // Rough session numbering
    form.sessionName = `Session ${sessionNumber} - ${now.toLocaleDateString()}`
})
</script>