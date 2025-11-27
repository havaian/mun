<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
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
                    <div class="flex-1 overflow-y-auto">
                        <form @submit.prevent="handleFormSubmit" class="p-6 space-y-8" novalidate>
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
                                        <input v-model="formData.name" type="text" class="input-field"
                                            placeholder="e.g., MUNUZ 2024 Conference"
                                            :class="{ 'border-mun-red-300': errors.name }" />
                                        <p v-if="errors.name" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.name }}
                                        </p>
                                    </div>

                                    <!-- Status -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Status
                                        </label>
                                        <SleekSelect v-model="formData.status" :options="[
                                            { label: 'Draft', value: 'draft' },
                                            { label: 'Active', value: 'active' },
                                            { label: 'Completed', value: 'completed' }
                                        ]" size="md" />
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
                                    <CalendarDaysIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Event Schedule
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Start Date -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <input v-model="formData.startDate" type="datetime-local"
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
                                        <input v-model="formData.endDate" type="datetime-local"
                                            class="input-field" :class="{ 'border-mun-red-300': errors.endDate }" />
                                        <p v-if="errors.endDate" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.endDate }}
                                        </p>
                                    </div>

                                    <!-- Registration Deadline -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Registration Deadline *
                                        </label>
                                        <input v-model="formData.registrationDeadline" type="datetime-local"
                                            class="input-field" :class="{ 'border-mun-red-300': errors.registrationDeadline }" />
                                        <p v-if="errors.registrationDeadline" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.registrationDeadline }}
                                        </p>
                                    </div>

                                    <!-- Timezone -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Timezone
                                        </label>
                                        <SleekSelect v-model="formData.timezone" :options="[
                                            { label: 'Asia/Tashkent (UTC+5)', value: 'Asia/Tashkent' },
                                            { label: 'UTC (UTC+0)', value: 'UTC' },
                                            { label: 'Europe/Moscow (UTC+3)', value: 'Europe/Moscow' },
                                            { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
                                            { label: 'America/New_York (UTC-5)', value: 'America/New_York' }
                                        ]" size="md" />
                                    </div>
                                </div>
                            </div>

                            <!-- Event Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Event Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Max Committees -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Maximum Committees
                                        </label>
                                        <input v-model.number="formData.maxCommittees" type="number" min="1" max="50"
                                            class="input-field" placeholder="10" />
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Maximum number of committees for this event (1-50)
                                        </p>
                                    </div>

                                    <!-- QR Expiration Period -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            QR Code Expiration (hours)
                                        </label>
                                        <input v-model.number="formData.qrExpirationPeriod" type="number" min="1" max="720"
                                            class="input-field" placeholder="168" />
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            How long QR codes remain valid (1-720 hours)
                                        </p>
                                    </div>

                                    <!-- Allow Late Registration -->
                                    <div class="lg:col-span-2">
                                        <div class="flex items-center">
                                            <input id="allowLateRegistration" v-model="formData.allowLateRegistration" type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="allowLateRegistration" class="ml-2 text-sm text-mun-gray-700">
                                                Allow late registration after deadline
                                            </label>
                                        </div>
                                    </div>
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
                            <AppButton v-if="mode === 'create'" variant="outline" @click.stop="handleSaveDraft"
                                :loading="isDraftSaving" :disabled="isSubmitting">
                                <DocumentIcon class="w-4 h-4 mr-2" />
                                Save as Draft
                            </AppButton>

                            <AppButton variant="primary" @click.stop="handleCreateEvent" :loading="isSubmitting" type="button">
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

// Emits - Define this before using it
const emit = defineEmits(['update:modelValue', 'created', 'updated', 'saved'])

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
    description: '',
    status: 'draft',

    // Event Schedule  
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    timezone: 'UTC',

    // Settings
    maxCommittees: 10,
    qrExpirationPeriod: 168,
    allowLateRegistration: false
})

// Select options
const eventTypeOptions = [
    { label: 'Select event type', value: '' },
    { label: 'Model United Nations', value: 'mun' },
    { label: 'Conference', value: 'conference' },
    { label: 'Workshop', value: 'workshop' },
    { label: 'Simulation', value: 'simulation' },
    { label: 'Training', value: 'training' },
    { label: 'Seminar', value: 'seminar' },
    { label: 'Competition', value: 'competition' }
]

const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' }
]

const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Russian', value: 'ru' },
    { label: 'Uzbek', value: 'uz' },
    { label: 'French', value: 'fr' },
    { label: 'Spanish', value: 'es' },
    { label: 'Arabic', value: 'ar' },
    { label: 'Chinese', value: 'zh' }
]

const timezoneOptions = [
    { label: 'Tashkent (UTC+5)', value: 'Asia/Tashkent' },
    { label: 'Moscow (UTC+3)', value: 'Europe/Moscow' },
    { label: 'London (UTC+0)', value: 'Europe/London' },
    { label: 'New York (UTC-5)', value: 'America/New_York' },
    { label: 'Dubai (UTC+4)', value: 'Asia/Dubai' }
]

const currencyOptions = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'UZS (сўм)', value: 'UZS' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'RUB (₽)', value: 'RUB' }
]

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

    if (formData.registrationDeadline && formData.startDate) {
        const regOpen = new Date(formData.registrationDeadline)
        const start = new Date(formData.startDate)

        if (regOpen >= start) {
            errors.value.registrationDeadline = 'Registration must end before event starts'
        }
    }
}

watch(() => formData.registrationDeadline, validateDates)
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
        formData.name = props.event.name || ''
        formData.description = props.event.description || ''
        formData.status = props.event.status || 'draft'
        
        // Handle dates - convert UTC from backend to local time for display
        formData.startDate = props.event.startDate ? 
            convertUTCToLocal(props.event.startDate) : ''
        formData.endDate = props.event.endDate ? 
            convertUTCToLocal(props.event.endDate) : ''
        
        // Handle nested settings
        if (props.event.settings) {
            formData.registrationDeadline = props.event.settings.registrationDeadline ? 
                convertUTCToLocal(props.event.settings.registrationDeadline) : ''
            formData.timezone = props.event.settings.timezone || 'UTC'
            formData.maxCommittees = props.event.settings.maxCommittees || 10
            formData.qrExpirationPeriod = props.event.settings.qrExpirationPeriod || 168
            formData.allowLateRegistration = props.event.settings.allowLateRegistration || false
        }
    } else {
        // Reset form for new event
        resetForm()
    }
}

// Helper function to convert UTC date to local datetime-local format
const convertUTCToLocal = (utcDateString) => {
    const utcDate = new Date(utcDateString)
    // Get local time by subtracting timezone offset
    const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
    return localDate.toISOString().slice(0, 16)
}

// Helper function to convert local datetime-local to UTC
const convertLocalToUTC = (localDateTimeString) => {
    if (!localDateTimeString) return null
    // datetime-local is already in local time, just create Date object
    const localDate = new Date(localDateTimeString)
    return localDate.toISOString()
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

async function submitForm() {
    if (!validateForm()) {
        toast.error('Please fix the form errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        // Prepare data for API - convert local times to UTC
        const submitData = {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            startDate: convertLocalToUTC(formData.startDate),
            endDate: convertLocalToUTC(formData.endDate),
            settings: {
                registrationDeadline: convertLocalToUTC(formData.registrationDeadline),
                qrExpirationPeriod: formData.qrExpirationPeriod,
                allowLateRegistration: formData.allowLateRegistration,
                maxCommittees: formData.maxCommittees,
                timezone: formData.timezone
            }
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

            emit('saved', eventData)
            close()
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

        const draftData = {
            name: formData.name,
            description: formData.description,
            status: 'draft',
            startDate: convertLocalToUTC(formData.startDate),
            endDate: convertLocalToUTC(formData.endDate),
            settings: {
                registrationDeadline: convertLocalToUTC(formData.registrationDeadline),
                qrExpirationPeriod: formData.qrExpirationPeriod,
                allowLateRegistration: formData.allowLateRegistration,
                maxCommittees: formData.maxCommittees,
                timezone: formData.timezone
            }
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
                close()
            }
        }

    } catch (error) {
        console.error('Save draft error:', error)
        toast.error('Failed to save draft')
    } finally {
        isDraftSaving.value = false
    }
}

const handleFormSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    // Do nothing - only allow explicit button clicks
}

const handleCreateEvent = async () => {
    await submitForm()
}

const handleSaveDraft = async () => {
    await saveDraft()
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

<style scoped></style>