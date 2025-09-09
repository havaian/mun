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

                        <button @click="close" class="p-2 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <form @submit.prevent="submitForm" class="p-6 space-y-8">
                            <!-- Basic Information -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <InformationCircleIcon class="w-5 h-5 mr-2 text-un-blue" />
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

                                    <!-- Status -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select v-model="formData.status" class="input-field">
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <!-- Description -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea v-model="formData.description" rows="4"
                                            class="input-field resize-none"
                                            placeholder="Describe the event, its goals, and what participants can expect..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Event Details -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <CalendarDaysIcon class="w-5 h-5 mr-2 text-un-blue" />
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
                                            placeholder="e.g., MUNUZ Organization" />
                                    </div>

                                    <!-- Max Participants -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Maximum Participants
                                        </label>
                                        <input v-model.number="formData.maxParticipants" type="number" min="1"
                                            class="input-field" placeholder="e.g., 200" />
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Leave empty for unlimited participants
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Registration Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <UserPlusIcon class="w-5 h-5 mr-2 text-un-blue" />
                                    Registration Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Registration Opens -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Opens
                                        </label>
                                        <input v-model="formData.registrationOpens" type="datetime-local"
                                            class="input-field" />
                                    </div>

                                    <!-- Registration Closes -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Closes
                                        </label>
                                        <input v-model="formData.registrationCloses" type="datetime-local"
                                            class="input-field" />
                                    </div>

                                    <!-- Registration Fee -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Fee (USD)
                                        </label>
                                        <input v-model.number="formData.registrationFee" type="number" min="0"
                                            step="0.01" class="input-field" placeholder="0.00" />
                                    </div>

                                    <!-- Currency -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Currency
                                        </label>
                                        <select v-model="formData.currency" class="input-field">
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="UZS">UZS - Uzbekistan Som</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - British Pound</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Registration Options -->
                                <div class="space-y-4">
                                    <div class="flex items-center">
                                        <input id="requireApproval" v-model="formData.requireApproval" type="checkbox"
                                            class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
                                        <label for="requireApproval" class="ml-2 text-sm text-mun-gray-700">
                                            Require approval for registrations
                                        </label>
                                    </div>

                                    <div class="flex items-center">
                                        <input id="allowWaitlist" v-model="formData.allowWaitlist" type="checkbox"
                                            class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
                                        <label for="allowWaitlist" class="ml-2 text-sm text-mun-gray-700">
                                            Allow waitlist when event is full
                                        </label>
                                    </div>

                                    <div class="flex items-center">
                                        <input id="sendWelcomeEmail" v-model="formData.sendWelcomeEmail" type="checkbox"
                                            class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
                                        <label for="sendWelcomeEmail" class="ml-2 text-sm text-mun-gray-700">
                                            Send welcome email to registrants
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Contact Information -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <EnvelopeIcon class="w-5 h-5 mr-2 text-un-blue" />
                                    Contact Information
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Contact Email -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Contact Email
                                        </label>
                                        <input v-model="formData.contactEmail" type="email" class="input-field"
                                            placeholder="contact@munuz.org" />
                                    </div>

                                    <!-- Contact Phone -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Contact Phone
                                        </label>
                                        <input v-model="formData.contactPhone" type="tel" class="input-field"
                                            placeholder="+998 90 123 45 67" />
                                    </div>

                                    <!-- Website -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input v-model="formData.website" type="url" class="input-field"
                                            placeholder="https://munuz.org" />
                                    </div>

                                    <!-- Social Media -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Social Media
                                        </label>
                                        <input v-model="formData.socialMedia" type="text" class="input-field"
                                            placeholder="@munuz_official" />
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-un-blue" />
                                    Additional Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Time Zone -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <select v-model="formData.timeZone" class="input-field">
                                            <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                                            <option value="UTC">UTC (UTC+0)</option>
                                            <option value="America/New_York">America/New_York (UTC-5)</option>
                                            <option value="Europe/London">Europe/London (UTC+0)</option>
                                            <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                                            <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                                        </select>
                                    </div>

                                    <!-- Language -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Primary Language
                                        </label>
                                        <select v-model="formData.language" class="input-field">
                                            <option value="en">English</option>
                                            <option value="ru">Russian</option>
                                            <option value="uz_lat">Uzbek (Latin)</option>
                                            <option value="uz_cyr">Uzbek (Cyrillic)</option>
                                        </select>
                                    </div>

                                    <!-- Tags -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Tags
                                        </label>
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            <span v-for="tag in formData.tags" :key="tag"
                                                class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-un-blue-100 text-un-blue-800">
                                                {{ tag }}
                                                <button @click="removeTag(tag)" type="button"
                                                    class="ml-2 text-un-blue-600 hover:text-un-blue-800">
                                                    <XMarkIcon class="w-3 h-3" />
                                                </button>
                                            </span>
                                        </div>
                                        <div class="flex space-x-2">
                                            <input v-model="newTag" type="text" class="input-field flex-1"
                                                placeholder="Add a tag..." @keyup.enter="addTag" />
                                            <AppButton type="button" variant="outline" size="md" @click="addTag">
                                                Add
                                            </AppButton>
                                        </div>
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Tags help categorize and search events
                                        </p>
                                    </div>
                                </div>

                                <!-- Advanced Options -->
                                <div class="space-y-4">
                                    <div class="flex items-center">
                                        <input id="isPublic" v-model="formData.isPublic" type="checkbox"
                                            class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
                                        <label for="isPublic" class="ml-2 text-sm text-mun-gray-700">
                                            Make event publicly visible
                                        </label>
                                    </div>

                                    <div class="flex items-center">
                                        <input id="enableFeedback" v-model="formData.enableFeedback" type="checkbox"
                                            class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
                                        <label for="enableFeedback" class="ml-2 text-sm text-mun-gray-700">
                                            Enable participant feedback collection
                                        </label>
                                    </div>

                                    <div class="flex items-center">
                                        <input id="allowGuestObservers" v-model="formData.allowGuestObservers"
                                            type="checkbox"
                                            class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
                                        <label for="allowGuestObservers" class="ml-2 text-sm text-mun-gray-700">
                                            Allow guest observers
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Notes/Instructions -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-un-blue" />
                                    Additional Information
                                </h3>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Instructions for Participants
                                    </label>
                                    <textarea v-model="formData.instructions" rows="4" class="input-field resize-none"
                                        placeholder="Provide any additional instructions, requirements, or information for participants..."></textarea>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Internal Notes
                                    </label>
                                    <textarea v-model="formData.internalNotes" rows="3" class="input-field resize-none"
                                        placeholder="Internal notes for organizers (not visible to participants)..."></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex items-center justify-between p-6 bg-mun-gray-50 border-t border-mun-gray-200">
                        <div class="flex items-center space-x-4">
                            <AppButton variant="ghost" @click="close" :disabled="isSubmitting">
                                Cancel
                            </AppButton>

                            <AppButton v-if="mode === 'edit'" variant="outline" @click="resetForm"
                                :disabled="isSubmitting">
                                <ArrowPathIcon class="w-4 h-4 mr-2" />
                                Reset
                            </AppButton>
                        </div>

                        <div class="flex items-center space-x-3">
                            <AppButton v-if="mode === 'create'" variant="outline" @click="saveDraft"
                                :loading="isDraftSaving" :disabled="isSubmitting">
                                <DocumentIcon class="w-4 h-4 mr-2" />
                                Save as Draft
                            </AppButton>

                            <AppButton variant="primary" @click="submitForm" :loading="isSubmitting">
                                <CheckIcon class="w-4 h-4 mr-2" />
                                {{ mode === 'edit' ? 'Update Event' : 'Create Event' }}
                            </AppButton>
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

// Emits
const emit = defineEmits(['update:modelValue', 'created', 'updated'])

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
    currency: 'USD',
    requireApproval: false,
    allowWaitlist: true,
    sendWelcomeEmail: true,

    // Contact Information
    contactEmail: '',
    contactPhone: '',
    website: '',
    socialMedia: '',

    // Additional Settings
    timeZone: 'Asia/Tashkent',
    language: 'en',
    tags: [],
    isPublic: true,
    enableFeedback: true,
    allowGuestObservers: false,

    // Additional Information
    instructions: '',
    internalNotes: ''
})

// Computed
const isValid = computed(() => {
    return formData.name.trim() !== '' &&
        formData.eventType !== '' &&
        formData.startDate !== '' &&
        formData.endDate !== '' &&
        Object.keys(errors.value).length === 0
})

// Watchers
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        initializeForm()
    }
})

watch(() => formData.startDate, validateDates)
watch(() => formData.endDate, validateDates)
watch(() => formData.name, () => {
    if (errors.value.name) {
        delete errors.value.name
    }
})

// Methods
const initializeForm = () => {
    errors.value = {}

    if (props.mode === 'edit' && props.event) {
        // Populate form with existing event data
        Object.keys(formData).forEach(key => {
            if (props.event[key] !== undefined) {
                if (key === 'startDate' || key === 'endDate' || key === 'registrationOpens' || key === 'registrationCloses') {
                    // Convert dates to datetime-local format
                    formData[key] = props.event[key] ?
                        new Date(props.event[key]).toISOString().slice(0, 16) : ''
                } else {
                    formData[key] = props.event[key]
                }
            }
        })
    } else {
        // Reset form for new event
        resetForm()
    }
}

const resetForm = () => {
    Object.keys(formData).forEach(key => {
        if (key === 'tags') {
            formData[key] = []
        } else if (typeof formData[key] === 'boolean') {
            formData[key] = key === 'allowWaitlist' || key === 'sendWelcomeEmail' ||
                key === 'isPublic' || key === 'enableFeedback'
        } else if (typeof formData[key] === 'number') {
            formData[key] = key === 'registrationFee' ? 0 : null
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
            response = await apiMethods.events.update(props.event._id, submitData)
        } else {
            response = await apiMethods.events.create(submitData)
        }

        if (response.data.success) {
            const event = response.data.event

            if (props.mode === 'edit') {
                emit('updated', event)
                toast.success('Event updated successfully')
            } else {
                emit('created', event)
                toast.success('Event created successfully')
            }

            close()
        } else {
            throw new Error(response.data.error || 'Failed to save event')
        }

    } catch (error) {
        console.error('Submit event error:', error)
        toast.error(error.message || 'Failed to save event')
    } finally {
        isSubmitting.value = false
    }
}

const saveDraft = async () => {
    try {
        isDraftSaving.value = true

        const draftData = { ...formData, status: 'draft' }

        // Convert dates
        if (draftData.startDate) {
            draftData.startDate = new Date(draftData.startDate).toISOString()
        }
        if (draftData.endDate) {
            draftData.endDate = new Date(draftData.endDate).toISOString()
        }

        const response = await apiMethods.events.create(draftData)

        if (response.data.success) {
            emit('created', response.data.event)
            toast.success('Event saved as draft')
            close()
        }

    } catch (error) {
        console.error('Save draft error:', error)
        toast.error('Failed to save draft')
    } finally {
        isDraftSaving.value = false
    }
}

const close = () => {
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
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
}

.modal-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>