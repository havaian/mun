<template>
    <TransitionRoot appear :show="modelValue" as="template">
        <Dialog as="div" @close="close" class="relative z-50">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/25 backdrop-blur-sm" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel
                            class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl transition-all">
                            <!-- Modal Header -->
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <DialogTitle as="h3" class="text-2xl font-bold text-mun-gray-900">
                                        {{ isEditing ? 'Edit Event' : 'Create New Event' }}
                                    </DialogTitle>
                                    <p class="text-mun-gray-600 mt-1">
                                        {{ isEditing ? 'Update event details and settings' : 'Set up a new MUN event with committees and participants' }}
                                    </p>
                                </div>

                                <button @click="close" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                                </button>
                            </div>

                            <!-- Form -->
                            <form @submit.prevent="handleSubmit" class="space-y-6">
                                <!-- Basic Information -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="md:col-span-2">
                                        <label for="eventName" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Event Name *
                                        </label>
                                        <input id="eventName" v-model="form.name" type="text" required
                                            class="input-field" placeholder="e.g., Global Youth MUN 2025"
                                            :disabled="isSubmitting" />
                                        <p class="text-xs text-mun-gray-500 mt-1">
                                            This will be displayed to participants and in reports
                                        </p>
                                    </div>

                                    <div class="md:col-span-2">
                                        <label for="description"
                                            class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea id="description" v-model="form.description" rows="3"
                                            class="input-field resize-none"
                                            placeholder="Brief description of the event, its theme, and objectives..."
                                            :disabled="isSubmitting"></textarea>
                                    </div>

                                    <div>
                                        <label for="startDate" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Start Date *
                                        </label>
                                        <input id="startDate" v-model="form.startDate" type="date" required
                                            class="input-field" :disabled="isSubmitting" />
                                    </div>

                                    <div>
                                        <label for="endDate" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            End Date *
                                        </label>
                                        <input id="endDate" v-model="form.endDate" type="date" required
                                            class="input-field" :min="form.startDate" :disabled="isSubmitting" />
                                    </div>
                                </div>

                                <!-- Event Settings -->
                                <div class="bg-mun-gray-50 rounded-xl p-4">
                                    <h4 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                        <CogIcon class="w-5 h-5 mr-2" />
                                        Event Settings
                                    </h4>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label for="registrationDeadline"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Registration Deadline
                                            </label>
                                            <input id="registrationDeadline"
                                                v-model="form.settings.registrationDeadline" type="date"
                                                class="input-field" :max="form.startDate" :disabled="isSubmitting" />
                                        </div>

                                        <div>
                                            <label for="qrExpiration"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                QR Code Expiration (hours)
                                            </label>
                                            <input id="qrExpiration" v-model.number="form.settings.qrExpirationPeriod"
                                                type="number" min="1" max="168" class="input-field" placeholder="24"
                                                :disabled="isSubmitting" />
                                        </div>

                                        <div class="md:col-span-2">
                                            <div class="flex items-center space-x-3">
                                                <input id="allowLateRegistration"
                                                    v-model="form.settings.allowLateRegistration" type="checkbox"
                                                    class="h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue"
                                                    :disabled="isSubmitting" />
                                                <label for="allowLateRegistration" class="text-sm text-mun-gray-700">
                                                    Allow late registration after deadline
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status Selection -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-3">
                                        Event Status
                                    </label>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <label v-for="status in statusOptions" :key="status.value" :class="[
                                            'relative flex cursor-pointer rounded-xl border p-4 transition-all',
                                            form.status === status.value
                                                ? 'border-un-blue bg-un-blue-50 ring-2 ring-un-blue ring-opacity-50'
                                                : 'border-mun-gray-200 bg-white hover:bg-mun-gray-50'
                                        ]">
                                            <input v-model="form.status" type="radio" :value="status.value"
                                                class="sr-only" :disabled="isSubmitting" />
                                            <div class="flex flex-1 items-center">
                                                <div class="flex-shrink-0">
                                                    <component :is="status.icon" :class="[
                                                        'h-5 w-5',
                                                        form.status === status.value ? 'text-un-blue-600' : 'text-mun-gray-400'
                                                    ]" />
                                                </div>
                                                <div class="ml-3">
                                                    <span :class="[
                                                        'block text-sm font-medium',
                                                        form.status === status.value ? 'text-un-blue-900' : 'text-mun-gray-900'
                                                    ]">
                                                        {{ status.label }}
                                                    </span>
                                                    <span :class="[
                                                        'block text-xs',
                                                        form.status === status.value ? 'text-un-blue-700' : 'text-mun-gray-500'
                                                    ]">
                                                        {{ status.description }}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <!-- Form Actions -->
                                <div class="flex justify-end space-x-4 pt-6 border-t border-mun-gray-200">
                                    <AppButton type="button" variant="outline" @click="close" :disabled="isSubmitting">
                                        Cancel
                                    </AppButton>

                                    <AppButton type="submit" variant="primary" :loading="isSubmitting"
                                        :disabled="!isFormValid">
                                        {{ isEditing ? 'Update Event' : 'Create Event' }}
                                    </AppButton>
                                </div>
                            </form>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionRoot,
    TransitionChild
} from '@headlessui/vue'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    CogIcon,
    DocumentTextIcon,
    PlayIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },

    event: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'saved', 'close'])

const appStore = useAppStore()

// State
const isSubmitting = ref(false)

const form = reactive({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    settings: {
        registrationDeadline: '',
        qrExpirationPeriod: 24,
        allowLateRegistration: false
    }
})

// Computed
const isEditing = computed(() => !!props.event?._id)

const isFormValid = computed(() => {
    return form.name.trim() &&
        form.startDate &&
        form.endDate &&
        new Date(form.startDate) <= new Date(form.endDate)
})

const statusOptions = [
    {
        value: 'draft',
        label: 'Draft',
        description: 'Event is being prepared',
        icon: DocumentTextIcon
    },
    {
        value: 'active',
        label: 'Active',
        description: 'Event is currently running',
        icon: PlayIcon
    },
    {
        value: 'completed',
        label: 'Completed',
        description: 'Event has finished',
        icon: CheckCircleIcon
    }
]

// Methods
const resetForm = () => {
    form.name = ''
    form.description = ''
    form.startDate = ''
    form.endDate = ''
    form.status = 'draft'
    form.settings.registrationDeadline = ''
    form.settings.qrExpirationPeriod = 24
    form.settings.allowLateRegistration = false
}

const populateForm = (event) => {
    if (!event) return

    form.name = event.name || ''
    form.description = event.description || ''
    form.startDate = event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : ''
    form.endDate = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : ''
    form.status = event.status || 'draft'

    if (event.settings) {
        form.settings.registrationDeadline = event.settings.registrationDeadline
            ? new Date(event.settings.registrationDeadline).toISOString().split('T')[0]
            : ''
        form.settings.qrExpirationPeriod = event.settings.qrExpirationPeriod || 24
        form.settings.allowLateRegistration = event.settings.allowLateRegistration || false
    }
}

const handleSubmit = async () => {
    if (!isFormValid.value) return

    try {
        isSubmitting.value = true

        const eventData = {
            name: form.name.trim(),
            description: form.description.trim(),
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            status: form.status,
            settings: {
                registrationDeadline: form.settings.registrationDeadline
                    ? new Date(form.settings.registrationDeadline).toISOString()
                    : null,
                qrExpirationPeriod: form.settings.qrExpirationPeriod,
                allowLateRegistration: form.settings.allowLateRegistration
            }
        }

        let response
        if (isEditing.value) {
            response = await apiMethods.events.update(props.event._id, eventData)
        } else {
            response = await apiMethods.events.create(eventData)
        }

        if (response.data.success) {
            emit('saved', response.data.event)
            close()

            const message = isEditing.value ? 'Event updated successfully' : 'Event created successfully'
            appStore.showSuccessMessage(message)
        }

    } catch (error) {
        console.error('Save event error:', error)
        const message = error.response?.data?.error || 'Failed to save event'
        appStore.showErrorMessage(message)
    } finally {
        isSubmitting.value = false
    }
}

const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        if (props.event) {
            populateForm(props.event)
        } else {
            resetForm()
        }
    }
})

watch(() => props.event, (newEvent) => {
    if (props.modelValue && newEvent) {
        populateForm(newEvent)
    }
})

// Set default dates
onMounted(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (!form.startDate) {
        form.startDate = today.toISOString().split('T')[0]
    }
    if (!form.endDate) {
        form.endDate = tomorrow.toISOString().split('T')[0]
    }
})
</script>

<style scoped>
/* Custom radio button styling */
input[type="radio"]:checked+div {
    background-color: rgba(0, 158, 219, 0.05);
}

/* Form animation */
.form-slide-in {
    animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>