<template>
    <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-mun-gray-900">Create New Event</h2>
                    <button @click="closeModal" class="text-mun-gray-400 hover:text-mun-gray-600">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div class="flex-1 p-6 overflow-y-auto">
                <form @submit.prevent="createEvent" class="space-y-6">
                    <!-- Basic Information -->
                    <div>
                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Basic Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Event Name *</label>
                                <input v-model="form.name" type="text" required class="input-field"
                                    placeholder="e.g., Global Youth MUN 2025"
                                    :class="{ 'border-mun-red-500': errors.name }">
                                <p v-if="errors.name" class="text-sm text-mun-red-600 mt-1">{{ errors.name }}</p>
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Description *</label>
                                <textarea v-model="form.description" rows="3" required class="input-field"
                                    placeholder="Brief description of the event"
                                    :class="{ 'border-mun-red-500': errors.description }"></textarea>
                                <p v-if="errors.description" class="text-sm text-mun-red-600 mt-1">{{ errors.description
                                    }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Event Type</label>
                                <SleekSelect v-model="form.eventType" :options="[
                                    { label: 'Conference', value: 'conference' },
                                    { label: 'Workshop', value: 'workshop' },
                                    { label: 'Simulation', value: 'simulation' },
                                    { label: 'Training', value: 'training' }
                                ]" size="md" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Language</label>
                                <SleekSelect v-model="form.language" :options="[
                                    { label: 'English', value: 'en' },
                                    { label: 'Russian', value: 'ru' },
                                    { label: 'Uzbek', value: 'uz' }
                                ]" size="md" />
                            </div>
                        </div>
                    </div>

                    <!-- Date & Time -->
                    <div>
                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Date & Time</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Start Date & Time
                                    *</label>
                                <input v-model="form.startDate" type="datetime-local" required class="input-field"
                                    :class="{ 'border-mun-red-500': errors.startDate }" :min="minDateTime">
                                <p v-if="errors.startDate" class="text-sm text-mun-red-600 mt-1">{{ errors.startDate }}
                                </p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">End Date & Time
                                    *</label>
                                <input v-model="form.endDate" type="datetime-local" required class="input-field"
                                    :class="{ 'border-mun-red-500': errors.endDate }"
                                    :min="form.startDate || minDateTime">
                                <p v-if="errors.endDate" class="text-sm text-mun-red-600 mt-1">{{ errors.endDate }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Registration
                                    Deadline</label>
                                <input v-model="form.registrationDeadline" type="datetime-local" class="input-field"
                                    :max="form.startDate">
                                <p class="text-sm text-mun-gray-500 mt-1">Leave empty for no deadline</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Timezone</label>
                                <SleekSelect v-model="form.timezone" :options="[
                                    { label: 'Asia/Tashkent (UTC+5)', value: 'Asia/Tashkent' },
                                    { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
                                    { label: 'America/New_York (UTC-5)', value: 'America/New_York' }
                                ]" size="md" />
                            </div>
                        </div>
                    </div>

                    <!-- Settings -->
                    <div>
                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Event Settings</h3>
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Maximum
                                        Participants</label>
                                    <input v-model.number="form.maxParticipants" type="number" min="1"
                                        class="input-field" placeholder="e.g., 200">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Registration
                                        Fee</label>
                                    <div class="relative">
                                        <span
                                            class="absolute inset-y-0 left-0 pl-3 flex items-center text-mun-gray-500">$</span>
                                        <input v-model.number="form.registrationFee" type="number" min="0" step="0.01"
                                            class="input-field pl-8" placeholder="0.00">
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center space-x-6">
                                <label class="flex items-center">
                                    <input v-model="form.isPublic" type="checkbox"
                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue">
                                    <span class="ml-2 text-sm text-mun-gray-700">Public Event</span>
                                </label>

                                <label class="flex items-center">
                                    <input v-model="form.allowWaitlist" type="checkbox"
                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue">
                                    <span class="ml-2 text-sm text-mun-gray-700">Enable Waitlist</span>
                                </label>

                                <label class="flex items-center">
                                    <input v-model="form.requireApproval" type="checkbox"
                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue">
                                    <span class="ml-2 text-sm text-mun-gray-700">Require Approval</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div>
                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Contact Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Contact Email</label>
                                <input v-model="form.contactEmail" type="email" class="input-field"
                                    placeholder="contact@example.com">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Contact Phone</label>
                                <input v-model="form.contactPhone" type="tel" class="input-field"
                                    placeholder="+998 90 123 45 67">
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Venue/Location</label>
                                <input v-model="form.venue" type="text" class="input-field"
                                    placeholder="e.g., Tashkent International University">
                            </div>
                        </div>
                    </div>

                    <!-- Additional Information -->
                    <div>
                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Additional Information</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Event Tags</label>
                                <input v-model="tagsInput" type="text" class="input-field"
                                    placeholder="Enter tags separated by commas (e.g., youth, diplomacy, leadership)"
                                    @keypress.enter.prevent="addTag">
                                <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                                    <span v-for="(tag, index) in form.tags" :key="index"
                                        class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-mun-blue/10 text-mun-blue">
                                        {{ tag }}
                                        <button @click="removeTag(index)" class="ml-2 hover:text-mun-blue-600">
                                            <XMarkIcon class="w-3 h-3" />
                                        </button>
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label
                                    class="block text-sm font-medium text-mun-gray-700 mb-2">Notes/Instructions</label>
                                <textarea v-model="form.notes" rows="3" class="input-field"
                                    placeholder="Additional notes or instructions for participants"></textarea>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-mun-gray-200 flex items-center justify-between">
                <div class="text-sm text-mun-gray-500">
                    * Required fields
                </div>
                <div class="flex items-center space-x-3">
                    <button type="button" @click="closeModal" class="btn-un-secondary">
                        Cancel
                    </button>
                    <button @click="createEvent" :disabled="isSubmitting || !isFormValid" class="btn-un-primary">
                        <span v-if="isSubmitting">Creating...</span>
                        <span v-else>Create Event</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import { XMarkIcon } from '@heroicons/vue/24/outline'

// Props & Emits
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()

// State
const isSubmitting = ref(false)
const tagsInput = ref('')
const errors = reactive({})

const form = reactive({
    name: '',
    description: '',
    eventType: 'conference',
    language: 'en',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    timezone: 'Asia/Tashkent',
    maxParticipants: null,
    registrationFee: 0,
    isPublic: true,
    allowWaitlist: false,
    requireApproval: false,
    contactEmail: '',
    contactPhone: '',
    venue: '',
    tags: [],
    notes: ''
})

// Computed
const minDateTime = computed(() => {
    return new Date().toISOString().slice(0, 16)
})

const isFormValid = computed(() => {
    return form.name.trim() !== '' &&
        form.description.trim() !== '' &&
        form.startDate !== '' &&
        form.endDate !== '' &&
        Object.keys(errors).length === 0
})

// Methods
const validateForm = () => {
    errors.name = form.name.trim() === '' ? 'Event name is required' : ''
    errors.description = form.description.trim() === '' ? 'Description is required' : ''
    errors.startDate = form.startDate === '' ? 'Start date is required' : ''
    errors.endDate = form.endDate === '' ? 'End date is required' : ''

    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
        errors.endDate = 'End date must be after start date'
    }

    if (form.registrationDeadline && form.startDate && new Date(form.registrationDeadline) > new Date(form.startDate)) {
        errors.registrationDeadline = 'Registration deadline must be before start date'
    }

    // Remove empty errors
    Object.keys(errors).forEach(key => {
        if (!errors[key]) delete errors[key]
    })
}

const createEvent = async () => {
    validateForm()

    if (!isFormValid.value) {
        toast.error('Please fix the form errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        // Prepare data for API
        const eventData = {
            ...form,
            tags: form.tags.join(','),
            status: 'draft'
        }

        // TODO: Replace with actual API call
        // const response = await apiMethods.events.create(eventData)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        const newEvent = {
            id: Date.now(),
            ...eventData,
            participants: 0,
            committees: [],
            createdAt: new Date().toISOString()
        }

        emit('created', newEvent)
        closeModal()
        resetForm()
        toast.success(`Event "${form.name}" created successfully`)

    } catch (error) {
        toast.error('Create event error:', error)
        toast.error('Failed to create event')
    } finally {
        isSubmitting.value = false
    }
}

const addTag = () => {
    const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    form.tags.push(...tags.filter(tag => !form.tags.includes(tag)))
    tagsInput.value = ''
}

const removeTag = (index) => {
    form.tags.splice(index, 1)
}

const resetForm = () => {
    Object.keys(form).forEach(key => {
        if (key === 'tags') {
            form[key] = []
        } else if (typeof form[key] === 'boolean') {
            form[key] = key === 'isPublic'
        } else if (typeof form[key] === 'number') {
            form[key] = key === 'registrationFee' ? 0 : null
        } else {
            form[key] = ['eventType', 'language', 'timezone'].includes(key) ?
                (key === 'eventType' ? 'conference' : key === 'language' ? 'en' : 'Asia/Tashkent') : ''
        }
    })
    tagsInput.value = ''
    Object.keys(errors).forEach(key => delete errors[key])
}

const closeModal = () => {
    emit('update:modelValue', false)
}

// Watchers
watch(() => form.name, () => {
    if (errors.name) validateForm()
})

watch(() => form.description, () => {
    if (errors.description) validateForm()
})

watch(() => [form.startDate, form.endDate], () => {
    if (errors.startDate || errors.endDate) validateForm()
})

watch(() => form.registrationDeadline, () => {
    if (errors.registrationDeadline) validateForm()
})

// Initialize form with some defaults
onMounted(() => {
    // Set default start date to tomorrow 9 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    form.startDate = tomorrow.toISOString().slice(0, 16)

    // Set default end date to 3 days later 5 PM
    const endDate = new Date(tomorrow)
    endDate.setDate(endDate.getDate() + 2)
    endDate.setHours(17, 0, 0, 0)
    form.endDate = endDate.toISOString().slice(0, 16)
})
</script>