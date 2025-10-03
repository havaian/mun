<template>
    <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Create New Event</h2>
            <p class="text-sm text-gray-600 mt-1">Set up a new Model UN event</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
            <!-- Basic Information -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Basic Information</h3>

                <!-- Event Name -->
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                        Event Name *
                    </label>
                    <input id="name" v-model="form.name" type="text"
                        placeholder="e.g., Harvard Model United Nations 2024" class="input"
                        :class="{ 'input-error': errors.name }" required />
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                </div>

                <!-- Description -->
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea id="description" v-model="form.description" rows="3"
                        placeholder="Brief description of the event..." class="input resize-none"
                        :class="{ 'input-error': errors.description }"></textarea>
                    <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
                </div>

                <!-- Date Range -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                        </label>
                        <input id="startDate" v-model="form.startDate" type="date" class="input"
                            :class="{ 'input-error': errors.startDate }" required />
                        <p v-if="errors.startDate" class="mt-1 text-sm text-red-600">{{ errors.startDate }}</p>
                    </div>

                    <div>
                        <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
                            End Date *
                        </label>
                        <input id="endDate" v-model="form.endDate" type="date" class="input"
                            :class="{ 'input-error': errors.endDate }" required />
                        <p v-if="errors.endDate" class="mt-1 text-sm text-red-600">{{ errors.endDate }}</p>
                    </div>
                </div>

                <!-- Location -->
                <div>
                    <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <input id="location" v-model="form.location" type="text"
                        placeholder="e.g., Harvard University, Cambridge, MA" class="input"
                        :class="{ 'input-error': errors.location }" />
                    <p v-if="errors.location" class="mt-1 text-sm text-red-600">{{ errors.location }}</p>
                </div>
            </div>

            <!-- Event Settings -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Event Settings</h3>

                <!-- Event Type -->
                <div>
                    <label for="eventType" class="block text-sm font-medium text-gray-700 mb-2">
                        Event Type
                    </label>
                    <select id="eventType" v-model="form.eventType" class="input"
                        :class="{ 'input-error': errors.eventType }">
                        <option value="conference">Full Conference</option>
                        <option value="single-committee">Single Committee</option>
                        <option value="crisis">Crisis Committee</option>
                        <option value="specialized">Specialized Agency</option>
                    </select>
                    <p v-if="errors.eventType" class="mt-1 text-sm text-red-600">{{ errors.eventType }}</p>
                </div>

                <!-- Max Participants -->
                <div>
                    <label for="maxParticipants" class="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Participants
                    </label>
                    <input id="maxParticipants" v-model.number="form.maxParticipants" type="number" min="10" max="1000"
                        placeholder="e.g., 500" class="input" :class="{ 'input-error': errors.maxParticipants }" />
                    <p class="mt-1 text-xs text-gray-500">Leave empty for unlimited participants</p>
                    <p v-if="errors.maxParticipants" class="mt-1 text-sm text-red-600">{{ errors.maxParticipants }}</p>
                </div>

                <!-- Registration Settings -->
                <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                        <input id="requireRegistration" v-model="form.requireRegistration" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="requireRegistration" class="text-sm font-medium text-gray-700">
                            Require registration before event
                        </label>
                    </div>

                    <div class="flex items-center space-x-3">
                        <input id="allowSelfRegistration" v-model="form.allowSelfRegistration" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="allowSelfRegistration" class="text-sm font-medium text-gray-700">
                            Allow participants to self-register
                        </label>
                    </div>
                </div>
            </div>

            <!-- Committees Setup -->
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Committees</h3>
                    <button type="button" @click="addCommittee" class="btn-secondary text-sm">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Committee
                    </button>
                </div>

                <div v-if="form.committees.length === 0"
                    class="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h4 class="mt-2 text-sm font-medium text-gray-900">No committees added</h4>
                    <p class="mt-1 text-sm text-gray-500">Add at least one committee to continue</p>
                </div>

                <div v-else class="space-y-3">
                    <div v-for="(committee, index) in form.committees" :key="index"
                        class="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                        <div class="flex-1 grid grid-cols-2 gap-4">
                            <div>
                                <input v-model="committee.name" type="text" placeholder="Committee name" class="input"
                                    required />
                            </div>
                            <div>
                                <select v-model="committee.type" class="input" required>
                                    <option value="">Select type</option>
                                    <option value="GA">General Assembly</option>
                                    <option value="SC">Security Council</option>
                                    <option value="ECOSOC">Economic and Social Council</option>
                                    <option value="SPECIAL">Specialized Agency</option>
                                    <option value="CRISIS">Crisis Committee</option>
                                </select>
                            </div>
                        </div>
                        <button type="button" @click="removeCommittee(index)"
                            class="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
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
                        <h3 class="text-sm font-medium text-red-800">Error creating event</h3>
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
                {{ isSubmitting ? 'Creating Event...' : 'Create Event' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close', 'success'])

const authStore = useAuthStore()

// Form state
const form = reactive({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    eventType: 'conference',
    maxParticipants: null,
    requireRegistration: true,
    allowSelfRegistration: false,
    committees: []
})

const errors = reactive({})
const isSubmitting = ref(false)
const submitError = ref('')

// Computed
const isFormValid = computed(() => {
    return form.name.trim() &&
        form.startDate &&
        form.endDate &&
        form.committees.length > 0 &&
        form.committees.every(c => c.name.trim() && c.type) &&
        new Date(form.startDate) <= new Date(form.endDate)
})

// Methods
function addCommittee() {
    form.committees.push({
        name: '',
        type: '',
        maxDelegates: 50
    })
}

function removeCommittee(index) {
    form.committees.splice(index, 1)
}

function validateForm() {
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key])

    // Name validation
    if (!form.name.trim()) {
        errors.name = 'Event name is required'
    } else if (form.name.length < 3) {
        errors.name = 'Event name must be at least 3 characters'
    }

    // Date validation
    if (!form.startDate) {
        errors.startDate = 'Start date is required'
    }

    if (!form.endDate) {
        errors.endDate = 'End date is required'
    }

    if (form.startDate && form.endDate) {
        const start = new Date(form.startDate)
        const end = new Date(form.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (start < today) {
            errors.startDate = 'Start date cannot be in the past'
        }

        if (end < start) {
            errors.endDate = 'End date must be after start date'
        }
    }

    // Max participants validation
    if (form.maxParticipants !== null && form.maxParticipants < 10) {
        errors.maxParticipants = 'Minimum 10 participants required'
    }

    // Committees validation
    if (form.committees.length === 0) {
        errors.committees = 'At least one committee is required'
    } else {
        const hasInvalidCommittee = form.committees.some(c => !c.name.trim() || !c.type)
        if (hasInvalidCommittee) {
            errors.committees = 'All committees must have a name and type'
        }
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
        // Prepare form data
        const eventData = {
            name: form.name.trim(),
            description: form.description.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            location: form.location.trim(),
            eventType: form.eventType,
            maxParticipants: form.maxParticipants,
            requireRegistration: form.requireRegistration,
            allowSelfRegistration: form.allowSelfRegistration,
            committees: form.committees.map(c => ({
                name: c.name.trim(),
                type: c.type,
                maxDelegates: c.maxDelegates || 50
            }))
        }

        const response = await authStore.apiCall('/admin/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        })

        if (response.ok) {
            const data = await response.json()
            emit('success', data.event)
            emit('close')
        } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to create event')
        }
    } catch (error) {
        console.error('Create event error:', error)
        submitError.value = error.message || 'An unexpected error occurred'
    } finally {
        isSubmitting.value = false
    }
}

// Set default dates
import { onMounted } from 'vue'

onMounted(() => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    form.startDate = today.toISOString().split('T')[0]
    form.endDate = nextWeek.toISOString().split('T')[0]

    // Add default committee
    addCommittee()
})
</script>