<!-- frontend/src/components/presidium/SessionSettingsModal.vue -->
<template>
    <Teleport to="body">
        <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    @click="$emit('update:modelValue', false)" />

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
                        @click.stop>
                        <!-- Header -->
                        <div class="bg-white px-6 py-4 border-b border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-mun-gray-900">
                                        Session Settings
                                    </h3>
                                    <p class="text-sm text-mun-gray-500 mt-1">
                                        Configure session parameters and debate modes
                                    </p>
                                </div>

                                <button @click="$emit('update:modelValue', false)"
                                    class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                    <XMarkIcon class="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="px-6 py-4 max-h-96 overflow-y-auto">
                            <div class="space-y-6">
                                <!-- General Session Settings -->
                                <div class="session-general">
                                    <h4 class="text-md font-medium text-mun-gray-900 mb-4">General Settings</h4>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <!-- Session Duration -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Session Duration (minutes)
                                            </label>
                                            <input v-model.number="settings.sessionDuration" type="number" min="30"
                                                max="480" step="15"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                                                placeholder="e.g., 120" />
                                            <p class="text-xs text-mun-gray-500 mt-1">Total time allocated for this
                                                session</p>
                                        </div>

                                        <!-- Break Duration -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Break Duration (minutes)
                                            </label>
                                            <input v-model.number="settings.breakDuration" type="number" min="5"
                                                max="60" step="5"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                                                placeholder="e.g., 15" />
                                            <p class="text-xs text-mun-gray-500 mt-1">Standard break length</p>
                                        </div>

                                        <!-- Quorum Percentage -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Quorum Percentage
                                            </label>
                                            <select v-model="settings.quorumPercentage"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                                                <option value="0.33">33% (One-third)</option>
                                                <option value="0.5">50% (Simple majority)</option>
                                                <option value="0.67">67% (Two-thirds)</option>
                                                <option value="0.75">75% (Three-quarters)</option>
                                            </select>
                                            <p class="text-xs text-mun-gray-500 mt-1">Minimum attendance for valid
                                                session</p>
                                        </div>

                                        <!-- Language -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Working Language
                                            </label>
                                            <select v-model="settings.language"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                                                <option value="en">English</option>
                                                <option value="fr">French</option>
                                                <option value="es">Spanish</option>
                                                <option value="ar">Arabic</option>
                                                <option value="zh">Chinese</option>
                                                <option value="ru">Russian</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Speaker Settings -->
                                <div class="speaker-settings">
                                    <h4 class="text-md font-medium text-mun-gray-900 mb-4">Speaker Settings</h4>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <!-- Default Speech Time -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Default Speech Time (seconds)
                                            </label>
                                            <input v-model.number="settings.defaultSpeechTime" type="number" min="30"
                                                max="600" step="30"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                                                placeholder="e.g., 120" />
                                        </div>

                                        <!-- Extension Time -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Extension Time (seconds)
                                            </label>
                                            <input v-model.number="settings.extensionTime" type="number" min="15"
                                                max="120" step="15"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                                                placeholder="e.g., 30" />
                                        </div>

                                        <!-- Max Speaker List Size -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Max Speaker List Size
                                            </label>
                                            <input v-model.number="settings.maxSpeakerListSize" type="number" min="5"
                                                max="50"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                                                placeholder="e.g., 20" />
                                        </div>

                                        <!-- Auto-advance speakers -->
                                        <div class="flex items-center">
                                            <input v-model="settings.autoAdvanceSpeakers" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Auto-advance to next speaker
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Debate Mode Settings -->
                                <div class="debate-mode-settings">
                                    <h4 class="text-md font-medium text-mun-gray-900 mb-4">Debate Mode Settings</h4>

                                    <!-- Formal Debate -->
                                    <div class="mode-setting border border-mun-gray-200 rounded-lg p-4 mb-4">
                                        <div class="flex items-center justify-between mb-3">
                                            <h5 class="font-medium text-mun-gray-900">Formal Debate</h5>
                                            <span
                                                class="text-xs text-mun-gray-500 bg-mun-gray-100 px-2 py-1 rounded">Default</span>
                                        </div>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label class="block text-xs text-mun-gray-600 mb-1">Speech Time
                                                    (seconds)</label>
                                                <input v-model.number="settings.formalDebate.speechTime" type="number"
                                                    min="60" max="300"
                                                    class="w-full px-2 py-1 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mun-blue" />
                                            </div>

                                            <div class="flex items-center">
                                                <input v-model="settings.formalDebate.allowQuestions" type="checkbox"
                                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                <label class="ml-2 text-xs text-mun-gray-700">Allow questions</label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Moderated Caucus -->
                                    <div class="mode-setting border border-mun-gray-200 rounded-lg p-4 mb-4">
                                        <h5 class="font-medium text-mun-gray-900 mb-3">Moderated Caucus</h5>

                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label class="block text-xs text-mun-gray-600 mb-1">Total Time
                                                    (minutes)</label>
                                                <input v-model.number="settings.moderatedCaucus.totalTime" type="number"
                                                    min="5" max="60"
                                                    class="w-full px-2 py-1 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mun-blue" />
                                            </div>

                                            <div>
                                                <label class="block text-xs text-mun-gray-600 mb-1">Speech Time
                                                    (seconds)</label>
                                                <input v-model.number="settings.moderatedCaucus.speechTime"
                                                    type="number" min="30" max="180"
                                                    class="w-full px-2 py-1 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mun-blue" />
                                            </div>

                                            <div class="flex items-center">
                                                <input v-model="settings.moderatedCaucus.requireTopic" type="checkbox"
                                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                <label class="ml-2 text-xs text-mun-gray-700">Require topic</label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Unmoderated Caucus -->
                                    <div class="mode-setting border border-mun-gray-200 rounded-lg p-4 mb-4">
                                        <h5 class="font-medium text-mun-gray-900 mb-3">Unmoderated Caucus</h5>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label class="block text-xs text-mun-gray-600 mb-1">Default Duration
                                                    (minutes)</label>
                                                <input v-model.number="settings.unmoderatedCaucus.defaultDuration"
                                                    type="number" min="5" max="30"
                                                    class="w-full px-2 py-1 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mun-blue" />
                                            </div>

                                            <div>
                                                <label class="block text-xs text-mun-gray-600 mb-1">Max Duration
                                                    (minutes)</label>
                                                <input v-model.number="settings.unmoderatedCaucus.maxDuration"
                                                    type="number" min="10" max="60"
                                                    class="w-full px-2 py-1 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mun-blue" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Voting Settings -->
                                <div class="voting-settings">
                                    <h4 class="text-md font-medium text-mun-gray-900 mb-4">Voting Settings</h4>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <!-- Default Voting Time -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Default Voting Time (minutes)
                                            </label>
                                            <input v-model.number="settings.defaultVotingTime" type="number" min="2"
                                                max="30"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                                                placeholder="e.g., 5" />
                                        </div>

                                        <!-- Majority Threshold -->
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">
                                                Default Majority Type
                                            </label>
                                            <select v-model="settings.defaultMajorityType"
                                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                                                <option value="simple">Simple Majority</option>
                                                <option value="two-thirds">Two-Thirds Majority</option>
                                                <option value="consensus">Consensus Required</option>
                                            </select>
                                        </div>

                                        <!-- Allow Abstentions -->
                                        <div class="flex items-center">
                                            <input v-model="settings.allowAbstentions" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Allow abstentions by default
                                            </label>
                                        </div>

                                        <!-- Show real-time results -->
                                        <div class="flex items-center">
                                            <input v-model="settings.showRealTimeResults" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Show real-time voting results
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Notification Settings -->
                                <div class="notification-settings">
                                    <h4 class="text-md font-medium text-mun-gray-900 mb-4">Notifications</h4>

                                    <div class="space-y-3">
                                        <div class="flex items-center">
                                            <input v-model="settings.notifications.timerWarnings" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Timer warnings (30 seconds remaining)
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input v-model="settings.notifications.quorumAlerts" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Quorum status alerts
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input v-model="settings.notifications.voteReminders" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Vote reminders for delegates
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input v-model="settings.notifications.soundEffects" type="checkbox"
                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                            <label class="ml-2 text-sm text-mun-gray-700">
                                                Sound effects for timers and alerts
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="bg-mun-gray-50 px-6 py-4 border-t border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <!-- Reset to defaults -->
                                <button @click="resetToDefaults"
                                    class="text-sm text-mun-gray-600 hover:text-mun-gray-800 underline transition-colors">
                                    Reset to Defaults
                                </button>

                                <!-- Actions -->
                                <div class="flex items-center space-x-3">
                                    <button @click="$emit('update:modelValue', false)"
                                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                        Cancel
                                    </button>

                                    <button @click="saveSettings" :disabled="isUpdating"
                                        class="px-4 py-2 text-sm font-medium text-white bg-mun-blue border border-transparent rounded-md hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                        {{ isUpdating ? 'Saving...' : 'Save Settings' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    sessionId: {
        type: String,
        required: true
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'settings-updated'])

const sessionStore = useSessionStore()
const toast = useToast()

// State
const isUpdating = ref(false)

// Default settings
const defaultSettings = {
    // General
    sessionDuration: 120,
    breakDuration: 15,
    quorumPercentage: 0.5,
    language: 'en',

    // Speaker settings
    defaultSpeechTime: 120,
    extensionTime: 30,
    maxSpeakerListSize: 20,
    autoAdvanceSpeakers: false,

    // Debate modes
    formalDebate: {
        speechTime: 120,
        allowQuestions: true
    },
    moderatedCaucus: {
        totalTime: 20,
        speechTime: 60,
        requireTopic: true
    },
    unmoderatedCaucus: {
        defaultDuration: 15,
        maxDuration: 30
    },

    // Voting
    defaultVotingTime: 5,
    defaultMajorityType: 'simple',
    allowAbstentions: true,
    showRealTimeResults: true,

    // Notifications
    notifications: {
        timerWarnings: true,
        quorumAlerts: true,
        voteReminders: true,
        soundEffects: false
    }
}

// Settings reactive object
const settings = reactive({ ...defaultSettings })

// Methods
const resetToDefaults = () => {
    Object.assign(settings, defaultSettings)
    toast.log('Settings reset to defaults')
}

const saveSettings = async () => {
    try {
        isUpdating.value = true

        // Save settings through session store or API
        await sessionStore.updateSessionSettings(props.sessionId, settings)

        emit('settings-updated', settings)
        emit('update:modelValue', false)
        toast.success('Session settings saved')

    } catch (error) {
        toast.error('Save settings error:', error)
        toast.error('Failed to save settings')
    } finally {
        isUpdating.value = false
    }
}

const loadSettings = async () => {
    try {
        // Load existing settings from session store or API
        const existingSettings = await sessionStore.getSessionSettings(props.sessionId)

        if (existingSettings) {
            Object.assign(settings, existingSettings)
        }

    } catch (error) {
        toast.error('Load settings error:', error)
        // Use defaults if loading fails
    }
}

// Load settings on mount
onMounted(() => {
    loadSettings()
})
</script>

<style scoped>
.mode-setting {
    background: rgba(249, 250, 251, 0.5);
}

.mode-setting:hover {
    background: rgba(243, 244, 246, 0.5);
}

/* Custom checkbox and input focus styles */
input[type="checkbox"]:focus {
    ring: 2px;
    ring-color: rgb(59 130 246);
    ring-offset: 2px;
}

input[type="number"]:focus,
select:focus {
    ring: 2px;
    ring-color: rgb(59 130 246);
    border-color: rgb(59 130 246);
}

/* Responsive adjustments */
@media (max-width: 768px) {

    .grid.md\\:grid-cols-2,
    .grid.md\\:grid-cols-3 {
        grid-template-columns: 1fr;
    }
}
</style>