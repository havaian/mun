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
                            class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl transition-all">
                            <!-- Modal Header -->
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <DialogTitle as="h3" class="text-2xl font-bold text-mun-gray-900">
                                        {{ isEditing ? 'Edit Committee' : 'Create New Committee' }}
                                    </DialogTitle>
                                    <p class="text-mun-gray-600 mt-1">
                                        {{ isEditing ? 'Update committee settings and configuration' : 'Set up a new committee for your MUN event' }}
                                    </p>
                                </div>

                                <button @click="close" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                                </button>
                            </div>

                            <!-- Progress Steps -->
                            <div class="mb-8">
                                <div class="flex items-center justify-between">
                                    <div v-for="(step, index) in steps" :key="step.id" class="flex items-center"
                                        :class="{ 'flex-1': index < steps.length - 1 }">
                                        <!-- Step Circle -->
                                        <div :class="[
                                            'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                                            currentStep >= index
                                                ? 'bg-un-blue border-un-blue text-white'
                                                : 'bg-white border-mun-gray-300 text-mun-gray-400'
                                        ]">
                                            <CheckIcon v-if="currentStep > index" class="w-4 h-4" />
                                            <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
                                        </div>

                                        <!-- Step Label -->
                                        <span :class="[
                                            'ml-2 text-sm font-medium',
                                            currentStep >= index ? 'text-un-blue' : 'text-mun-gray-400'
                                        ]">
                                            {{ step.title }}
                                        </span>

                                        <!-- Connector Line -->
                                        <div v-if="index < steps.length - 1" :class="[
                                            'flex-1 h-0.5 mx-4 transition-all',
                                            currentStep > index ? 'bg-un-blue' : 'bg-mun-gray-200'
                                        ]"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Form Steps -->
                            <form @submit.prevent="handleSubmit" class="space-y-6">
                                <!-- Step 1: Basic Information -->
                                <div v-show="currentStep === 0" class="space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <!-- Event Selection -->
                                        <div class="md:col-span-2">
                                            <label for="eventId"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Select Event *
                                            </label>
                                            <select id="eventId" v-model="form.eventId" required class="input-field"
                                                :disabled="isSubmitting || isEditing">
                                                <option value="">Choose an event...</option>
                                                <option v-for="event in events" :key="event._id" :value="event._id">
                                                    {{ event.name }}
                                                </option>
                                            </select>
                                            <p v-if="isEditing" class="text-xs text-mun-gray-500 mt-1">
                                                Event cannot be changed after committee creation
                                            </p>
                                        </div>

                                        <!-- Committee Name -->
                                        <div>
                                            <label for="committeeName"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Committee Name *
                                            </label>
                                            <input id="committeeName" v-model="form.name" type="text" required
                                                class="input-field" placeholder="e.g., United Nations Security Council"
                                                :disabled="isSubmitting" />
                                        </div>

                                        <!-- Committee Type -->
                                        <div>
                                            <label for="committeeType"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Committee Type *
                                            </label>
                                            <select id="committeeType" v-model="form.type" required class="input-field"
                                                :disabled="isSubmitting">
                                                <option value="">Select type...</option>
                                                <option value="GA">General Assembly</option>
                                                <option value="SC">Security Council</option>
                                                <option value="other">Other Committee</option>
                                            </select>
                                        </div>

                                        <!-- Language -->
                                        <div>
                                            <label for="language"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Working Language
                                            </label>
                                            <select id="language" v-model="form.language" class="input-field"
                                                :disabled="isSubmitting">
                                                <option value="en">English</option>
                                                <option value="ru">Russian</option>
                                                <option value="uz_lat">Uzbek (Latin)</option>
                                                <option value="uz_cyr">Uzbek (Cyrillic)</option>
                                            </select>
                                        </div>

                                        <!-- Status -->
                                        <div>
                                            <label for="status"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Initial Status
                                            </label>
                                            <select id="status" v-model="form.status" class="input-field"
                                                :disabled="isSubmitting">
                                                <option value="setup">Setup (Preparing)</option>
                                                <option value="active">Active (Running)</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>

                                        <!-- Description -->
                                        <div class="md:col-span-2">
                                            <label for="description"
                                                class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea id="description" v-model="form.description" rows="3"
                                                class="input-field resize-none"
                                                placeholder="Brief description of the committee's mandate and focus areas..."
                                                :disabled="isSubmitting"></textarea>
                                        </div>
                                    </div>
                                </div>

                                <!-- Step 2: Committee Settings -->
                                <div v-show="currentStep === 1" class="space-y-6">
                                    <div class="bg-mun-gray-50 rounded-xl p-6">
                                        <h4 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <CogIcon class="w-5 h-5 mr-2" />
                                            Committee Settings
                                        </h4>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <!-- Session Settings -->
                                            <div class="space-y-4">
                                                <h5
                                                    class="font-medium text-mun-gray-700 border-b border-mun-gray-200 pb-2">
                                                    Session Settings
                                                </h5>

                                                <div>
                                                    <label for="defaultSpeechTime"
                                                        class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                        Default Speech Time (seconds)
                                                    </label>
                                                    <input id="defaultSpeechTime"
                                                        v-model.number="form.settings.speechSettings.defaultSpeechTime"
                                                        type="number" min="30" max="300" class="input-field"
                                                        :disabled="isSubmitting" />
                                                </div>

                                                <div>
                                                    <label for="extensionTime"
                                                        class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                        Extension Time (seconds)
                                                    </label>
                                                    <input id="extensionTime"
                                                        v-model.number="form.settings.speechSettings.extensionTime"
                                                        type="number" min="15" max="60" class="input-field"
                                                        :disabled="isSubmitting" />
                                                </div>

                                                <div class="flex items-center space-x-3">
                                                    <input id="allowExtensions"
                                                        v-model="form.settings.speechSettings.allowExtensions"
                                                        type="checkbox"
                                                        class="h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue"
                                                        :disabled="isSubmitting" />
                                                    <label for="allowExtensions" class="text-sm text-mun-gray-700">
                                                        Allow speech extensions
                                                    </label>
                                                </div>
                                            </div>

                                            <!-- Voting Settings -->
                                            <div class="space-y-4">
                                                <h5
                                                    class="font-medium text-mun-gray-700 border-b border-mun-gray-200 pb-2">
                                                    Voting Settings
                                                </h5>

                                                <div>
                                                    <label for="votingMethod"
                                                        class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                        Default Voting Method
                                                    </label>
                                                    <select id="votingMethod"
                                                        v-model="form.settings.votingSettings.defaultMethod"
                                                        class="input-field" :disabled="isSubmitting">
                                                        <option value="simple">Simple Majority</option>
                                                        <option value="rollCall">Roll Call</option>
                                                        <option value="consensus">Consensus</option>
                                                    </select>
                                                </div>

                                                <div class="flex items-center space-x-3">
                                                    <input id="allowAbstentions"
                                                        v-model="form.settings.votingSettings.allowAbstentions"
                                                        type="checkbox"
                                                        class="h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue"
                                                        :disabled="isSubmitting" />
                                                    <label for="allowAbstentions" class="text-sm text-mun-gray-700">
                                                        Allow abstentions
                                                    </label>
                                                </div>

                                                <div class="flex items-center space-x-3">
                                                    <input id="requireTwoThirds"
                                                        v-model="form.settings.votingSettings.requireTwoThirds"
                                                        type="checkbox"
                                                        class="h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue"
                                                        :disabled="isSubmitting" />
                                                    <label for="requireTwoThirds" class="text-sm text-mun-gray-700">
                                                        Require 2/3 majority for resolutions
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Step 3: Review & Create -->
                                <div v-show="currentStep === 2" class="space-y-6">
                                    <div class="bg-un-blue-50 rounded-xl p-6">
                                        <h4 class="text-lg font-semibold text-un-blue-900 mb-4 flex items-center">
                                            <DocumentCheckIcon class="w-5 h-5 mr-2" />
                                            Review Committee Details
                                        </h4>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h5 class="font-medium text-un-blue-800 mb-2">Basic Information</h5>
                                                <div class="space-y-2 text-sm">
                                                    <div><strong>Event:</strong> {{ selectedEventName }}</div>
                                                    <div><strong>Name:</strong> {{ form.name }}</div>
                                                    <div><strong>Type:</strong> {{ formatCommitteeType(form.type) }}
                                                    </div>
                                                    <div><strong>Language:</strong> {{ formatLanguage(form.language) }}
                                                    </div>
                                                    <div><strong>Status:</strong> {{ formatStatus(form.status) }}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h5 class="font-medium text-un-blue-800 mb-2">Settings Summary</h5>
                                                <div class="space-y-2 text-sm">
                                                    <div><strong>Speech Time:</strong> {{
                                                        form.settings.speechSettings.defaultSpeechTime }}s</div>
                                                    <div><strong>Extensions:</strong> {{
                                                        form.settings.speechSettings.allowExtensions ? 'Allowed' : 'Not Allowed' }}</div>
                                                    <div><strong>Voting Method:</strong> {{
                                                        formatVotingMethod(form.settings.votingSettings.defaultMethod)
                                                        }}</div>
                                                    <div><strong>Abstentions:</strong> {{
                                                        form.settings.votingSettings.allowAbstentions ? 'Allowed' : 'Not Allowed' }}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="form.description" class="mt-4">
                                            <h5 class="font-medium text-un-blue-800 mb-2">Description</h5>
                                            <p class="text-sm text-un-blue-700">{{ form.description }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Navigation Buttons -->
                                <div class="flex justify-between pt-6 border-t border-mun-gray-200">
                                    <AppButton v-if="currentStep > 0" type="button" variant="outline"
                                        @click="previousStep" :disabled="isSubmitting">
                                        Previous
                                    </AppButton>
                                    <div v-else></div>

                                    <div class="flex space-x-4">
                                        <AppButton type="button" variant="ghost" @click="close"
                                            :disabled="isSubmitting">
                                            Cancel
                                        </AppButton>

                                        <AppButton v-if="currentStep < steps.length - 1" type="button" variant="primary"
                                            @click="nextStep" :disabled="!canProceedToNextStep">
                                            Next
                                        </AppButton>

                                        <AppButton v-else type="submit" variant="primary" :loading="isSubmitting"
                                            :disabled="!isFormValid">
                                            {{ isEditing ? 'Update Committee' : 'Create Committee' }}
                                        </AppButton>
                                    </div>
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
import { ref, reactive, computed, watch } from 'vue'
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
    CheckIcon,
    CogIcon,
    DocumentCheckIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },

    committee: {
        type: Object,
        default: null
    },

    events: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['update:modelValue', 'saved', 'close'])

const appStore = useAppStore()

// State
const currentStep = ref(0)
const isSubmitting = ref(false)

const steps = [
    { id: 'basic', title: 'Basic Info' },
    { id: 'settings', title: 'Settings' },
    { id: 'review', title: 'Review' }
]

const form = reactive({
    eventId: '',
    name: '',
    type: '',
    language: 'en',
    status: 'setup',
    description: '',
    settings: {
        speechSettings: {
            defaultSpeechTime: 90,
            extensionTime: 30,
            allowExtensions: true
        },
        votingSettings: {
            defaultMethod: 'simple',
            allowAbstentions: true,
            requireTwoThirds: false
        }
    }
})

// Computed
const isEditing = computed(() => !!props.committee?._id)

const selectedEventName = computed(() => {
    const event = props.events.find(e => e._id === form.eventId)
    return event?.name || 'Unknown Event'
})

const canProceedToNextStep = computed(() => {
    switch (currentStep.value) {
        case 0:
            return form.eventId && form.name && form.type
        case 1:
            return true // Settings are optional with defaults
        default:
            return true
    }
})

const isFormValid = computed(() => {
    return form.eventId &&
        form.name.trim() &&
        form.type &&
        form.settings.speechSettings.defaultSpeechTime >= 30 &&
        form.settings.speechSettings.defaultSpeechTime <= 300
})

// Methods
const resetForm = () => {
    form.eventId = ''
    form.name = ''
    form.type = ''
    form.language = 'en'
    form.status = 'setup'
    form.description = ''
    form.settings.speechSettings.defaultSpeechTime = 90
    form.settings.speechSettings.extensionTime = 30
    form.settings.speechSettings.allowExtensions = true
    form.settings.votingSettings.defaultMethod = 'simple'
    form.settings.votingSettings.allowAbstentions = true
    form.settings.votingSettings.requireTwoThirds = false
    currentStep.value = 0
}

const populateForm = (committee) => {
    if (!committee) return

    form.eventId = committee.eventId._id || committee.eventId
    form.name = committee.name || ''
    form.type = committee.type || ''
    form.language = committee.language || 'en'
    form.status = committee.status || 'setup'
    form.description = committee.description || ''

    if (committee.settings) {
        if (committee.settings.speechSettings) {
            form.settings.speechSettings = { ...committee.settings.speechSettings }
        }
        if (committee.settings.votingSettings) {
            form.settings.votingSettings = { ...committee.settings.votingSettings }
        }
    }
}

const nextStep = () => {
    if (currentStep.value < steps.length - 1) {
        currentStep.value++
    }
}

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

const handleSubmit = async () => {
    if (!isFormValid.value) return

    try {
        isSubmitting.value = true

        const committeeData = {
            eventId: form.eventId,
            name: form.name.trim(),
            type: form.type,
            language: form.language,
            status: form.status,
            description: form.description.trim(),
            settings: {
                speechSettings: { ...form.settings.speechSettings },
                votingSettings: { ...form.settings.votingSettings }
            }
        }

        let response
        if (isEditing.value) {
            response = await apiMethods.committees.update(props.committee._id, committeeData)
        } else {
            response = await apiMethods.committees.create(committeeData)
        }

        if (response.data.success) {
            emit('saved', response.data.committee)
            close()

            const message = isEditing.value ? 'Committee updated successfully' : 'Committee created successfully'
            appStore.showSuccessMessage(message)
        }

    } catch (error) {
        console.error('Save committee error:', error)
        const message = error.response?.data?.error || 'Failed to save committee'
        appStore.showErrorMessage(message)
    } finally {
        isSubmitting.value = false
    }
}

const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

// Formatters
const formatCommitteeType = (type) => {
    const typeMap = {
        'GA': 'General Assembly',
        'SC': 'Security Council',
        'other': 'Other Committee'
    }
    return typeMap[type] || type
}

const formatLanguage = (lang) => {
    const langMap = {
        'en': 'English',
        'ru': 'Russian',
        'uz_lat': 'Uzbek (Latin)',
        'uz_cyr': 'Uzbek (Cyrillic)'
    }
    return langMap[lang] || lang
}

const formatStatus = (status) => {
    const statusMap = {
        'setup': 'Setup',
        'active': 'Active',
        'completed': 'Completed'
    }
    return statusMap[status] || status
}

const formatVotingMethod = (method) => {
    const methodMap = {
        'simple': 'Simple Majority',
        'rollCall': 'Roll Call',
        'consensus': 'Consensus'
    }
    return methodMap[method] || method
}

// Watchers
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        if (props.committee) {
            populateForm(props.committee)
        } else {
            resetForm()
        }
    }
})

watch(() => props.committee, (newCommittee) => {
    if (props.modelValue && newCommittee) {
        populateForm(newCommittee)
    }
})
</script>

<style scoped>
/* Step transition animations */
.step-transition-enter-active,
.step-transition-leave-active {
    transition: all 0.3s ease;
}

.step-transition-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.step-transition-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

/* Progress step animation */
.step-circle {
    transition: all 0.3s ease;
}

.step-connector {
    transition: all 0.3s ease;
}
</style>