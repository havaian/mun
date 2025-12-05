<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-6">
                        <!-- Header -->
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-mun-gray-900">Change Debate Mode</h2>
                            <button @click="closeModal" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                <XMarkIcon class="w-5 h-5 text-mun-gray-500" />
                            </button>
                        </div>

                        <!-- Current Mode -->
                        <div class="p-4 bg-mun-blue/5 rounded-lg border border-mun-blue/20">
                            <p class="text-sm text-mun-gray-600 mb-1">Current Mode</p>
                            <p class="text-lg font-semibold text-mun-gray-900">{{ formatMode(session?.mode) }}</p>
                        </div>

                        <!-- Form -->
                        <form @submit.prevent="handleSubmit" class="space-y-4">
                            <!-- New Mode -->
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                    New Debate Mode
                                </label>
                                <select v-model="selectedMode" required
                                    class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent">
                                    <option value="">Select a mode</option>
                                    <option value="formal">Formal Debate</option>
                                    <option value="moderated">Moderated Caucus</option>
                                    <option value="unmoderated">Unmoderated Caucus</option>
                                    <option value="informal">Informal Consultation</option>
                                    <option value="closed">Closed Session</option>
                                </select>
                            </div>

                            <!-- Mode Description -->
                            <div v-if="selectedMode" class="p-4 bg-mun-gray-50 rounded-lg">
                                <p class="text-sm font-medium text-mun-gray-900 mb-2">{{ formatMode(selectedMode) }}</p>
                                <p class="text-sm text-mun-gray-600">{{ getModeDescription(selectedMode) }}</p>
                            </div>

                            <!-- Moderated Caucus Settings -->
                            <div v-if="selectedMode === 'moderated'"
                                class="space-y-4 p-4 bg-mun-yellow-50 rounded-lg border border-mun-yellow-200">
                                <h3 class="text-sm font-semibold text-mun-gray-900">Moderated Caucus Settings</h3>

                                <!-- Duration -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Total Duration (minutes)
                                    </label>
                                    <input v-model.number="moderatedSettings.duration" type="number" min="5" max="60"
                                        step="5" required
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                </div>

                                <!-- Speech Time -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Speech Time (seconds)
                                    </label>
                                    <input v-model.number="moderatedSettings.speechTime" type="number" min="30"
                                        max="180" step="15" required
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                </div>

                                <!-- Topic -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Topic
                                    </label>
                                    <input v-model="moderatedSettings.topic" type="text" required
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent"
                                        placeholder="Discussion topic" />
                                </div>
                            </div>

                            <!-- Unmoderated Caucus Settings -->
                            <div v-if="selectedMode === 'unmoderated'"
                                class="space-y-4 p-4 bg-mun-green-50 rounded-lg border border-mun-green-200">
                                <h3 class="text-sm font-semibold text-mun-gray-900">Unmoderated Caucus Settings</h3>

                                <!-- Duration -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Duration (minutes)
                                    </label>
                                    <input v-model.number="unmoderatedSettings.duration" type="number" min="5" max="30"
                                        step="5" required
                                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center justify-end space-x-3 pt-4">
                                <button type="button" @click="closeModal" class="btn-un-secondary"
                                    :disabled="isSubmitting">
                                    Cancel
                                </button>
                                <button type="submit" class="btn-un-primary" :disabled="isSubmitting || !selectedMode">
                                    <span v-if="isSubmitting">Changing...</span>
                                    <span v-else>Change Mode</span>
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
    session: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'mode-changed'])
const toast = useToast()

// State
const isSubmitting = ref(false)
const selectedMode = ref('')

const moderatedSettings = reactive({
    duration: 15,
    speechTime: 60,
    topic: ''
})

const unmoderatedSettings = reactive({
    duration: 10
})

// Methods
const closeModal = () => {
    if (!isSubmitting.value) {
        emit('update:modelValue', false)
        resetForm()
    }
}

const resetForm = () => {
    selectedMode.value = ''
    moderatedSettings.duration = 15
    moderatedSettings.speechTime = 60
    moderatedSettings.topic = ''
    unmoderatedSettings.duration = 10
}

const formatMode = (mode) => {
    const modeMap = {
        'formal': 'Formal Debate',
        'moderated': 'Moderated Caucus',
        'unmoderated': 'Unmoderated Caucus',
        'informal': 'Informal Consultation',
        'closed': 'Closed Session'
    }
    return modeMap[mode] || mode || 'Unknown'
}

const getModeDescription = (mode) => {
    const descriptions = {
        'formal': 'Structured debate with speaker list and formal procedures',
        'moderated': 'Focused discussion on specific topic with time-limited speeches',
        'unmoderated': 'Informal negotiation period without speaker list',
        'informal': 'Informal consultation for drafting and compromise',
        'closed': 'Closed session for sensitive discussions'
    }
    return descriptions[mode] || ''
}

const handleSubmit = async () => {
    try {
        isSubmitting.value = true

        const modeData = {
            mode: selectedMode.value
        }

        // Add specific settings based on mode
        if (selectedMode.value === 'moderated') {
            modeData.moderatedSettings = {
                duration: moderatedSettings.duration * 60, // Convert to seconds
                speechTime: moderatedSettings.speechTime,
                topic: moderatedSettings.topic
            }
        } else if (selectedMode.value === 'unmoderated') {
            modeData.unmoderatedSettings = {
                duration: unmoderatedSettings.duration * 60 // Convert to seconds
            }
        }

        const response = await apiMethods.sessions.changeMode(props.session._id, modeData)

        if (response.data.success) {
            emit('mode-changed', response.data.session)
            closeModal()
        }

    } catch (error) {
        console.error('Change mode error:', error)
        toast.error(error.response?.data?.error || 'Failed to change mode')
    } finally {
        isSubmitting.value = false
    }
}

// Watch for modal open
watch(() => props.modelValue, (newVal) => {
    if (newVal && props.session) {
        // Don't pre-select current mode
        selectedMode.value = ''
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