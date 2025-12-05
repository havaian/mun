<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-6">
                        <!-- Header -->
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-mun-gray-900">Create New Session</h2>
                            <button @click="closeModal" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                <XMarkIcon class="w-5 h-5 text-mun-gray-500" />
                            </button>
                        </div>

                        <!-- Form -->
                        <form @submit.prevent="handleSubmit" class="space-y-6">
                            <!-- Session Number -->
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                    Session Number
                                </label>
                                <input v-model.number="form.sessionNumber" type="number" min="1" required
                                    class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent"
                                    placeholder="1" />
                            </div>

                            <!-- Initial Mode -->
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                    Initial Debate Mode
                                </label>
                                <select v-model="form.mode" required
                                    class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent">
                                    <option value="formal">Formal Debate</option>
                                    <option value="moderated">Moderated Caucus</option>
                                    <option value="unmoderated">Unmoderated Caucus</option>
                                    <option value="informal">Informal Consultation</option>
                                </select>
                            </div>

                            <!-- Settings Section -->
                            <div class="border-t border-mun-gray-200 pt-4">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Session Settings</h3>

                                <!-- Default Speech Time -->
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Default Speech Time (seconds)
                                    </label>
                                    <input v-model.number="form.settings.defaultSpeechTime" type="number" min="30"
                                        max="600" step="30" required
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                    <p class="text-xs text-mun-gray-500 mt-1">
                                        {{ Math.floor(form.settings.defaultSpeechTime / 60) }} minutes {{
                                        form.settings.defaultSpeechTime % 60 }} seconds
                                    </p>
                                </div>

                                <!-- Allow Extensions -->
                                <div class="flex items-center mb-4">
                                    <input v-model="form.settings.allowExtensions" type="checkbox" id="allowExtensions"
                                        class="w-4 h-4 text-mun-blue border-mun-gray-300 rounded focus:ring-mun-blue" />
                                    <label for="allowExtensions" class="ml-2 text-sm text-mun-gray-700">
                                        Allow speech time extensions
                                    </label>
                                </div>

                                <!-- Extension Time -->
                                <div v-if="form.settings.allowExtensions" class="mb-4 ml-6">
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Extension Time (seconds)
                                    </label>
                                    <input v-model.number="form.settings.extensionTime" type="number" min="15" max="180"
                                        step="15"
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                </div>

                                <!-- Min Coalition Size -->
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Minimum Coalition Size
                                    </label>
                                    <input v-model.number="form.settings.minCoalitionSize" type="number" min="2"
                                        max="10" required
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                    <p class="text-xs text-mun-gray-500 mt-1">
                                        Minimum number of co-authors required for resolutions
                                    </p>
                                </div>
                            </div>

                            <!-- Document Deadlines -->
                            <div class="border-t border-mun-gray-200 pt-4">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Document Deadlines</h3>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <!-- Position Papers -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Position Papers
                                        </label>
                                        <input v-model="form.settings.documentDeadlines.positionPapers"
                                            type="datetime-local"
                                            class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                    </div>

                                    <!-- Resolutions -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Resolutions
                                        </label>
                                        <input v-model="form.settings.documentDeadlines.resolutions"
                                            type="datetime-local"
                                            class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                    </div>

                                    <!-- Amendments -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Amendments
                                        </label>
                                        <input v-model="form.settings.documentDeadlines.amendments"
                                            type="datetime-local"
                                            class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                    </div>
                                </div>
                            </div>

                            <!-- Auto-start option -->
                            <div class="border-t border-mun-gray-200 pt-4">
                                <div class="flex items-center">
                                    <input v-model="autoStart" type="checkbox" id="autoStart"
                                        class="w-4 h-4 text-mun-blue border-mun-gray-300 rounded focus:ring-mun-blue" />
                                    <label for="autoStart" class="ml-2 text-sm text-mun-gray-700">
                                        Start session immediately after creation
                                    </label>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center justify-end space-x-3 pt-4">
                                <button type="button" @click="closeModal" class="btn-un-secondary"
                                    :disabled="isSubmitting">
                                    Cancel
                                </button>
                                <button type="submit" class="btn-un-primary" :disabled="isSubmitting">
                                    <span v-if="isSubmitting">Creating...</span>
                                    <span v-else>Create Session</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    committeeId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'session-created'])
const toast = useToast()

// State
const isSubmitting = ref(false)
const autoStart = ref(false)

const form = reactive({
    sessionNumber: 1,
    mode: 'formal',
    settings: {
        defaultSpeechTime: 180, // 3 minutes
        allowExtensions: true,
        extensionTime: 60,
        minCoalitionSize: 3,
        documentDeadlines: {
            positionPapers: '',
            resolutions: '',
            amendments: ''
        }
    }
})

// Methods
const closeModal = () => {
    if (!isSubmitting.value) {
        emit('update:modelValue', false)
        resetForm()
    }
}

const resetForm = () => {
    form.sessionNumber = 1
    form.mode = 'formal'
    form.settings.defaultSpeechTime = 180
    form.settings.allowExtensions = true
    form.settings.extensionTime = 60
    form.settings.minCoalitionSize = 3
    form.settings.documentDeadlines = {
        positionPapers: '',
        resolutions: '',
        amendments: ''
    }
    autoStart.value = false
}

const handleSubmit = async () => {
    try {
        isSubmitting.value = true

        const sessionData = {
            committeeId: props.committeeId,
            sessionNumber: form.sessionNumber,
            mode: form.mode,
            status: autoStart.value ? 'active' : 'draft',
            settings: {
                defaultSpeechTime: form.settings.defaultSpeechTime,
                allowExtensions: form.settings.allowExtensions,
                extensionTime: form.settings.extensionTime,
                minCoalitionSize: form.settings.minCoalitionSize,
                documentDeadlines: {
                    positionPapers: form.settings.documentDeadlines.positionPapers || null,
                    resolutions: form.settings.documentDeadlines.resolutions || null,
                    amendments: form.settings.documentDeadlines.amendments || null
                }
            }
        }

        const response = await apiMethods.sessions.create(sessionData)

        if (response.data.success) {
            emit('session-created', response.data.session)
            closeModal()
        }

    } catch (error) {
        console.error('Create session error:', error)
        toast.error(error.response?.data?.error || 'Failed to create session')
    } finally {
        isSubmitting.value = false
    }
}

// Watch for modal open to set default deadlines
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        // Set default deadlines (1 day from now for each)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const defaultDate = tomorrow.toISOString().slice(0, 16)

        form.settings.documentDeadlines.positionPapers = defaultDate

        const twoDays = new Date()
        twoDays.setDate(twoDays.getDate() + 2)
        form.settings.documentDeadlines.resolutions = twoDays.toISOString().slice(0, 16)

        const threeDays = new Date()
        threeDays.setDate(threeDays.getDate() + 3)
        form.settings.documentDeadlines.amendments = threeDays.toISOString().slice(0, 16)
    }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>