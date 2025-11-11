<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between p-6 border-b border-mun-gray-200">
                        <div>
                            <h2 class="text-xl font-bold text-mun-gray-900">
                                {{ mode === 'edit' ? 'Edit Event' : 'Create New Event' }}
                            </h2>
                            <p class="text-sm text-mun-gray-600 mt-1">
                                {{ mode === 'edit' ? 'Update event details and settings' : 'Set up a new MUN event' }}
                            </p>
                        </div>

                        <button @click="closeModal" class="p-2 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <form @submit.prevent="submitForm" class="p-6 space-y-8">
                            <!-- Basic Information -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Basic Information
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Event Name -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Event Name *
                                        </label>
                                        <input v-model="formData.name" type="text" required class="input-field"
                                            placeholder="e.g., MUNUZ 2024 Conference"
                                            :class="{ 'border-mun-red-300': errors.name }" />
                                        <p v-if="errors.name" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.name }}
                                        </p>
                                    </div>

                                    <!-- Event Type -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Event Type *
                                        </label>
                                        <select v-model="formData.eventType" required class="input-field"
                                            :class="{ 'border-mun-red-300': errors.eventType }">
                                            <option value="">Select type</option>
                                            <option value="conference">Conference</option>
                                            <option value="simulation">Simulation</option>
                                            <option value="training">Training</option>
                                            <option value="competition">Competition</option>
                                        </select>
                                        <p v-if="errors.eventType" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.eventType }}
                                        </p>
                                    </div>

                                    <!-- Status (only for edit mode) -->
                                    <div v-if="mode === 'edit'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select v-model="formData.status" class="input-field">
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Description -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea v-model="formData.description" rows="4" class="input-field resize-none"
                                        placeholder="Brief description of the event, its goals, and what participants can expect..."></textarea>
                                </div>
                            </div>

                            <!-- Event Details -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <CalendarDaysIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Event Details
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Start Date -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <input v-model="formData.startDate" type="datetime-local" required
                                            class="input-field" :class="{ 'border-mun-red-300': errors.startDate }" />
                                        <p v-if="errors.startDate" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.startDate }}
                                        </p>
                                    </div>

                                    <!-- End Date -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            End Date *
                                        </label>
                                        <input v-model="formData.endDate" type="datetime-local" required
                                            class="input-field" :class="{ 'border-mun-red-300': errors.endDate }" />
                                        <p v-if="errors.endDate" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.endDate }}
                                        </p>
                                    </div>

                                    <!-- Location -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Location
                                        </label>
                                        <input v-model="formData.location" type="text" class="input-field"
                                            placeholder="e.g., University of Uzbekistan, Tashkent" />
                                    </div>

                                    <!-- Organizer -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Organizer
                                        </label>
                                        <input v-model="formData.organizer" type="text" class="input-field"
                                            placeholder="e.g., MUNUZ Society" />
                                    </div>

                                    <!-- Max Participants -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Maximum Participants
                                        </label>
                                        <input v-model.number="formData.maxParticipants" type="number" min="1"
                                            class="input-field" placeholder="e.g., 200" />
                                    </div>
                                </div>
                            </div>

                            <!-- Registration Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <UserPlusIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Registration Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Registration Opens -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Opens
                                        </label>
                                        <input v-model="formData.registrationOpens" type="datetime-local"
                                            class="input-field"
                                            :class="{ 'border-mun-red-300': errors.registrationOpens }" />
                                        <p v-if="errors.registrationOpens" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.registrationOpens }}
                                        </p>
                                    </div>

                                    <!-- Registration Closes -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Closes
                                        </label>
                                        <input v-model="formData.registrationCloses" type="datetime-local"
                                            class="input-field"
                                            :class="{ 'border-mun-red-300': errors.registrationCloses }" />
                                        <p v-if="errors.registrationCloses" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.registrationCloses }}
                                        </p>
                                    </div>

                                    <!-- Registration Fee -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Fee (USD)
                                        </label>
                                        <input v-model.number="formData.registrationFee" type="number" min="0"
                                            step="0.01" class="input-field" placeholder="0.00" />
                                    </div>

                                    <!-- Early Bird Fee -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Early Bird Fee (USD)
                                        </label>
                                        <input v-model.number="formData.earlyBirdFee" type="number" min="0" step="0.01"
                                            class="input-field" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <!-- Contact Information -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <EnvelopeIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Contact Information
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Contact Email -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Contact Email
                                        </label>
                                        <input v-model="formData.contactEmail" type="email" class="input-field"
                                            placeholder="contact@mun.uz" />
                                    </div>

                                    <!-- Contact Phone -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Contact Phone
                                        </label>
                                        <input v-model="formData.contactPhone" type="tel" class="input-field"
                                            placeholder="+998 90 123 45 67" />
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Additional Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <!-- Language -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Primary Language
                                        </label>
                                        <select v-model="formData.language" class="input-field">
                                            <option value="en">English</option>
                                            <option value="uz">Uzbek</option>
                                            <option value="ru">Russian</option>
                                        </select>
                                    </div>

                                    <!-- Currency -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Currency
                                        </label>
                                        <select v-model="formData.currency" class="input-field">
                                            <option value="USD">USD ($)</option>
                                            <option value="UZS">UZS (so'm)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>

                                    <!-- Time Zone -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <select v-model="formData.timeZone" class="input-field">
                                            <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                                            <option value="UTC">UTC (UTC+0)</option>
                                            <option value="Europe/London">Europe/London</option>
                                            <option value="America/New_York">America/New_York</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Tags -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Tags
                                    </label>
                                    <div class="flex flex-wrap gap-2 mb-3">
                                        <span v-for="tag in formData.tags" :key="tag"
                                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mun-blue/10 text-mun-blue">
                                            {{ tag }}
                                            <button type="button" @click="removeTag(tag)"
                                                class="ml-2 hover:text-mun-red-500">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </span>
                                    </div>
                                    <div class="flex gap-2">
                                        <input v-model="newTag" @keyup.enter="addTag" type="text"
                                            class="input-field flex-1" placeholder="Add a tag and press Enter" />
                                        <button type="button" @click="addTag" class="btn-un-secondary">
                                            Add Tag
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Information -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Additional Information
                                </h3>

                                <div class="space-y-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Instructions for Participants
                                        </label>
                                        <textarea v-model="formData.instructions" rows="4"
                                            class="input-field resize-none"
                                            placeholder="Provide any additional instructions, requirements, or information for participants..."></textarea>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Internal Notes
                                        </label>
                                        <textarea v-model="formData.internalNotes" rows="3"
                                            class="input-field resize-none"
                                            placeholder="Internal notes for organizers (not visible to participants)..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex items-center justify-between p-6 bg-mun-gray-50 border-t border-mun-gray-200">
                        <div class="flex items-center space-x-4">
                            <button type="button" @click="closeModal" :disabled="isSubmitting" class="btn-un-secondary">
                                Cancel
                            </button>

                            <button v-if="mode === 'edit'" type="button" @click="resetForm" :disabled="isSubmitting"
                                class="btn-un-outline">
                                <ArrowPathIcon class="w-4 h-4 mr-2" />
                                Reset
                            </button>
                        </div>

                        <div class="flex items-center space-x-3">
                            <button v-if="mode === 'create'" type="button" @click="saveDraft"
                                :disabled="isSubmitting || isDraftSaving" class="btn-un-outline">
                                <DocumentIcon class="w-4 h-4 mr-2" />
                                <span v-if="isDraftSaving">Saving...</span>
                                <span v-else>Save as Draft</span>
                            </button>

                            <button type="button" @click="submitForm" :disabled="isSubmitting" class="btn-un-primary">
                                <CheckIcon class="w-4 h-4 mr-2" />
                                <span v-if="isSubmitting">
                                    {{ mode === 'edit' ? 'Updating...' : 'Creating...' }}
                                </span>
                                <span v-else>
                                    {{ mode === 'edit' ? 'Update Event' : 'Create Event' }}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    XMarkIcon,
    InformationCircleIcon,
    CalendarDaysIcon,
    UserPlusIcon,
    EnvelopeIcon,
    CogIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    DocumentIcon,
    CheckIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    event: {
        type: Object,
        default: null
    },
    mode: {
        type: String,
        default: 'create', // 'create' or 'edit'
        validator: (value) => ['create', 'edit'].includes(value)
    }
})

// Emits - IMPORTANT: Define this before using it anywhere
const emit = defineEmits(['update:modelValue', 'created', 'updated', 'saved'])

// Initialize toast
const toast = useToast()

// State
const isSubmitting = ref(false)
const isDraftSaving = ref(false)
const newTag = ref('')
const errors = ref({})

// Form data with comprehensive event structure
const formData = reactive({
    // Basic Information
    name: '',
    eventType: '',
    status: 'draft',
    description: '',

    // Event Details
    startDate: '',
    endDate: '',
    location: '',
    organizer: '',
    maxParticipants: null,

    // Registration Settings
    registrationOpens: '',
    registrationCloses: '',
    registrationFee: 0,
    earlyBirdFee: 0,

    // Contact Information
    contactEmail: '',
    contactPhone: '',

    // Additional Settings
    language: 'en',
    currency: 'USD',
    timeZone: 'Asia/Tashkent',
    tags: [],

    // Additional Information
    instructions: '',
    internalNotes: ''
})

// Computed properties
const isFormValid = computed(() => {
    return Object.keys(errors.value).length === 0
})

// Watchers
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        initializeForm()
    }
})

watch(() => props.event, () => {
    if (props.modelValue) {
        initializeForm()
    }
})

// Methods
const initializeForm = () => {
    if (props.mode === 'edit' && props.event) {
        // Populate form with existing event data
        Object.keys(formData).forEach(key => {
            if (props.event[key] !== undefined) {
                if (key === 'tags' && Array.isArray(props.event[key])) {
                    formData[key] = [...props.event[key]]
                } else if (['startDate', 'endDate', 'registrationOpens', 'registrationCloses'].includes(key) && props.event[key]) {
                    // Convert ISO string to datetime-local format
                    formData[key] = new Date(props.event[key]).toISOString().slice(0, 16)
                } else {
                    formData[key] = props.event[key]
                }
            }
        })
    } else {
        // Reset form for create mode
        resetForm()
    }

    // Clear errors
    errors.value = {}
}

const resetForm = () => {
    Object.keys(formData).forEach(key => {
        if (key === 'tags') {
            formData[key] = []
        } else if (typeof formData[key] === 'boolean') {
            formData[key] = false
        } else if (typeof formData[key] === 'number') {
            formData[key] = key === 'registrationFee' || key === 'earlyBirdFee' ? 0 : null
        } else if (key === 'status') {
            formData[key] = 'draft'
        } else if (key === 'timeZone') {
            formData[key] = 'Asia/Tashkent'
        } else if (key === 'language') {
            formData[key] = 'en'
        } else if (key === 'currency') {
            formData[key] = 'USD'
        } else {
            formData[key] = ''
        }
    })
    errors.value = {}
}

const validateForm = () => {
    errors.value = {}

    // Required fields
    if (!formData.name.trim()) {
        errors.value.name = 'Event name is required'
    }

    if (!formData.eventType) {
        errors.value.eventType = 'Event type is required'
    }

    if (!formData.startDate) {
        errors.value.startDate = 'Start date is required'
    }

    if (!formData.endDate) {
        errors.value.endDate = 'End date is required'
    }

    // Date validation
    validateDates()

    return Object.keys(errors.value).length === 0
}

const validateDates = () => {
    if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)

        if (start >= end) {
            errors.value.endDate = 'End date must be after start date'
        } else {
            delete errors.value.endDate
        }
    }

    if (formData.registrationOpens && formData.startDate) {
        const regOpen = new Date(formData.registrationOpens)
        const start = new Date(formData.startDate)

        if (regOpen >= start) {
            errors.value.registrationOpens = 'Registration must open before event starts'
        }
    }

    if (formData.registrationCloses && formData.startDate) {
        const regClose = new Date(formData.registrationCloses)
        const start = new Date(formData.startDate)

        if (regClose > start) {
            errors.value.registrationCloses = 'Registration must close before event starts'
        }
    }
}

const addTag = () => {
    const tag = newTag.value.trim()
    if (tag && !formData.tags.includes(tag)) {
        formData.tags.push(tag)
        newTag.value = ''
    }
}

const removeTag = (tag) => {
    const index = formData.tags.indexOf(tag)
    if (index > -1) {
        formData.tags.splice(index, 1)
    }
}

const submitForm = async () => {
    if (!validateForm()) {
        toast.error('Please fix the form errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        // Prepare data for API
        const submitData = { ...formData }

        // Convert datetime-local strings back to ISO strings
        if (submitData.startDate) {
            submitData.startDate = new Date(submitData.startDate).toISOString()
        }
        if (submitData.endDate) {
            submitData.endDate = new Date(submitData.endDate).toISOString()
        }
        if (submitData.registrationOpens) {
            submitData.registrationOpens = new Date(submitData.registrationOpens).toISOString()
        }
        if (submitData.registrationCloses) {
            submitData.registrationCloses = new Date(submitData.registrationCloses).toISOString()
        }

        let response
        if (props.mode === 'edit') {
            const eventId = props.event._id || props.event.id
            response = await apiMethods.events.update(eventId, submitData)
        } else {
            response = await apiMethods.events.create(submitData)
        }

        if (response?.data) {
            const eventData = response.data.event || response.data

            if (props.mode === 'edit') {
                emit('updated', eventData)
                toast.success('Event updated successfully')
            } else {
                emit('created', eventData)
                toast.success('Event created successfully')
            }

            // Emit saved for both cases
            emit('saved', eventData)
            closeModal()
        }

    } catch (error) {
        console.error('Submit form error:', error)
        toast.error(props.mode === 'edit' ? 'Failed to update event' : 'Failed to create event')
    } finally {
        isSubmitting.value = false
    }
}

const saveDraft = async () => {
    try {
        isDraftSaving.value = true

        const draftData = { ...formData }
        draftData.status = 'draft'

        // Convert dates if present
        if (draftData.startDate) {
            draftData.startDate = new Date(draftData.startDate).toISOString()
        }
        if (draftData.endDate) {
            draftData.endDate = new Date(draftData.endDate).toISOString()
        }

        let response
        if (props.mode === 'edit') {
            const eventId = props.event._id || props.event.id
            response = await apiMethods.events.update(eventId, draftData)
        } else {
            response = await apiMethods.events.create(draftData)
        }

        if (response?.data) {
            toast.success('Draft saved successfully')

            const eventData = response.data.event || response.data
            emit('saved', eventData)

            if (props.mode === 'create') {
                closeModal()
            }
        }

    } catch (error) {
        console.error('Save draft error:', error)
        toast.error('Failed to save draft')
    } finally {
        isDraftSaving.value = false
    }
}

const closeModal = () => {
    emit('update:modelValue', false)
}

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        initializeForm()
    }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>