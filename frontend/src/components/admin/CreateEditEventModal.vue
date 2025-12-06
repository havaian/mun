<template>
    <ModalWrapper :model-value="modelValue" :title="mode === 'edit' ? 'Edit Event' : 'Create New Event'"
        :subtitle="mode === 'edit' ? 'Update event details and settings' : 'Set up a new MUN event'"
        :icon="CalendarDaysIcon" size="xl" variant="default" :has-unsaved-changes="hasUnsavedChanges"
        :is-loading="isSubmitting" cancel-text="Cancel" primary-text="Save Event" :is-primary-disabled="!isValid"
        @close="close" @primary-action="handleCreateEvent">
        <template #content>
            <!-- Basic Information -->
            <div class="mt-2 space-y-2">
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
                            placeholder="e.g., MUNUZ 2024 Conference" :class="{ 'border-mun-red-300': errors.name }" />
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
                        <textarea v-model="formData.description" rows="4" class="input-field resize-none"
                            placeholder="Describe the event, its goals, and what participants can expect..."></textarea>
                    </div>
                </div>
            </div>

            <!-- Event Details -->
            <div class="mt-2 space-y-2">
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
                        <input v-model="formData.startDate" type="datetime-local" class="input-field"
                            :class="{ 'border-mun-red-300': errors.startDate }" />
                        <p v-if="errors.startDate" class="mt-1 text-sm text-mun-red-600">
                            {{ errors.startDate }}
                        </p>
                    </div>

                    <!-- End Date -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            End Date *
                        </label>
                        <input v-model="formData.endDate" type="datetime-local" class="input-field"
                            :class="{ 'border-mun-red-300': errors.endDate }" />
                        <p v-if="errors.endDate" class="mt-1 text-sm text-mun-red-600">
                            {{ errors.endDate }}
                        </p>
                    </div>

                    <!-- Registration Deadline -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Registration Deadline *
                        </label>
                        <input v-model="formData.registrationDeadline" type="datetime-local" class="input-field"
                            :class="{ 'border-mun-red-300': errors.registrationDeadline }" />
                        <p v-if="errors.registrationDeadline" class="mt-1 text-sm text-mun-red-600">
                            {{ errors.registrationDeadline }}
                        </p>
                    </div>

                    <!-- Position Paper Deadline -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Position Paper Deadline
                        </label>
                        <input v-model="formData.positionPaperDeadline" type="datetime-local" class="input-field"
                            :class="{ 'border-mun-red-300': errors.positionPaperDeadline }" />
                        <p v-if="errors.positionPaperDeadline" class="mt-1 text-sm text-mun-red-600">
                            {{ errors.positionPaperDeadline }}
                        </p>
                        <p class="mt-1 text-xs text-mun-gray-500">
                            Delegates must submit position papers before this deadline
                        </p>
                    </div>

                    <!-- Timezone -->
                    <div class="lg:col-span-2">
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
            <div class="mt-2 space-y-2">
                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                    Event Settings
                </h3>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Allow Late Registration -->
                    <div>
                        <div class="flex items-center">
                            <input id="allowLateRegistration" v-model="formData.allowLateRegistration" type="checkbox"
                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                            <label for="allowLateRegistration" class="ml-2 text-sm text-mun-gray-700">
                                Allow late registration after deadline
                            </label>
                        </div>
                    </div>

                    <!-- Allow Late Position Papers -->
                    <div>
                        <div class="flex items-center">
                            <input id="allowLatePositionPapers" v-model="formData.allowLatePositionPapers"
                                type="checkbox"
                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                            <label for="allowLatePositionPapers" class="ml-2 text-sm text-mun-gray-700">
                                Allow late position paper submissions
                            </label>
                        </div>
                        <p class="ml-6 text-xs text-mun-gray-500 mt-1">
                            Presidium can still accept late submissions after deadline
                        </p>
                    </div>
                </div>
            </div>
        </template>

        <!-- SAME FOOTER PATTERN AS COMMITTEE -->
        <template #footer-buttons>
            <AppButton @click="close" variant="outline" :disabled="isSubmitting">Cancel</AppButton>
            <AppButton v-if="mode === 'edit'" variant="outline" @click="resetForm" :disabled="isSubmitting">Reset
            </AppButton>
            <AppButton v-if="mode === 'create'" variant="outline" @click="handleSaveDraft" :loading="isDraftSaving"
                :disabled="isSubmitting">Save as Draft</AppButton>
            <AppButton variant="primary" @click="handleCreateEvent" :loading="isSubmitting" :disabled="!isValid">
                {{ mode === 'edit' ? 'Update Event' : 'Create Event' }}
            </AppButton>
        </template>
    </ModalWrapper>
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
    positionPaperDeadline: '', // NEW
    timezone: 'UTC',

    // Settings
    allowLateRegistration: false,
    allowLatePositionPapers: true // NEW
})

// Computed
const isValid = computed(() => {
    return formData.name.trim() !== '' &&
        formData.startDate !== '' &&
        formData.endDate !== '' &&
        Object.keys(errors.value).length === 0
})

const hasUnsavedChanges = computed(() => {
    // Add logic to detect unsaved changes
    return false
})

// Watchers
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        initializeForm()
    }
})

const validateDates = () => {
    // Clear previous errors
    delete errors.value.endDate
    delete errors.value.registrationDeadline
    delete errors.value.positionPaperDeadline // NEW
    delete errors.value.startDate

    // Validate start and end dates
    if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)

        if (start >= end) {
            errors.value.endDate = 'End date must be after start date'
        }
    }

    // Validate registration deadline
    if (formData.registrationDeadline && formData.startDate) {
        const regDeadline = new Date(formData.registrationDeadline)
        const eventStart = new Date(formData.startDate)

        // Registration deadline should be BEFORE event start
        if (regDeadline >= eventStart) {
            errors.value.registrationDeadline = 'Registration deadline must be before event starts'
        }
    }

    // Validate position paper deadline (NEW)
    if (formData.positionPaperDeadline && formData.startDate) {
        const ppDeadline = new Date(formData.positionPaperDeadline)
        const eventStart = new Date(formData.startDate)

        // Position paper deadline should be BEFORE event start
        if (ppDeadline >= eventStart) {
            errors.value.positionPaperDeadline = 'Position paper deadline must be before event starts'
        }
    }
}

watch(() => formData.registrationDeadline, validateDates)
watch(() => formData.positionPaperDeadline, validateDates) // NEW
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
            formData.positionPaperDeadline = props.event.settings.positionPaperDeadline ?
                convertUTCToLocal(props.event.settings.positionPaperDeadline) : '' // NEW
            formData.timezone = props.event.settings.timezone || 'UTC'
            formData.allowLateRegistration = props.event.settings.allowLateRegistration || false
            formData.allowLatePositionPapers = props.event.settings.allowLatePositionPapers !== undefined ?
                props.event.settings.allowLatePositionPapers : true // NEW
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
                key === 'isPublic' || key === 'enableFeedback' || key === 'allowLatePositionPapers' // NEW
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
                positionPaperDeadline: convertLocalToUTC(formData.positionPaperDeadline), // NEW
                allowLateRegistration: formData.allowLateRegistration,
                allowLatePositionPapers: formData.allowLatePositionPapers, // NEW
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
                positionPaperDeadline: convertLocalToUTC(formData.positionPaperDeadline), // NEW
                allowLateRegistration: formData.allowLateRegistration,
                allowLatePositionPapers: formData.allowLatePositionPapers, // NEW
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