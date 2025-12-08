<template>
    <ModalWrapper v-model="modelValue" title="Start Moderated Caucus" :icon="SpeakerWaveIcon" size="lg"
        variant="primary" :is-loading="isStarting" :has-unsaved-changes="hasChanges" primary-text="Start Caucus"
        cancel-text="Cancel" @primary-action="startCaucus" @close="closeModal">
        <!-- Content -->
        <form @submit.prevent="startCaucus" class="space-y-6">
            <!-- Topic -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Discussion Topic <span class="text-red-500">*</span>
                </label>
                <input v-model="form.topic" type="text" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Climate Change Mitigation Strategies" />
                <p class="text-xs text-gray-500 mt-1">
                    Be specific about the aspect to be discussed
                </p>
            </div>

            <!-- Total Time -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Total Caucus Time
                </label>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Minutes</label>
                        <input v-model.number="form.totalMinutes" type="number" min="1" max="20" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="10" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Seconds</label>
                        <input v-model.number="form.totalSeconds" type="number" min="0" max="59"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0" />
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                    Maximum 20 minutes for moderated caucus
                </p>
            </div>

            <!-- Individual Speech Time -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Individual Speech Time
                </label>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Minutes</label>
                        <input v-model.number="form.speechMinutes" type="number" min="0" max="10" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="1" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Seconds</label>
                        <input v-model.number="form.speechSeconds" type="number" min="0" max="59"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="30" />
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                    Time allocated for each individual speech
                </p>
            </div>

            <!-- Auto-start Options -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-blue-800 mb-3">Caucus Settings</h4>
                <div class="space-y-3">
                    <label class="flex items-center space-x-3">
                        <input v-model="form.autoStartTimer" type="checkbox"
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <span class="text-sm text-blue-700">Auto-start caucus timer</span>
                    </label>

                    <label class="flex items-center space-x-3">
                        <input v-model="form.initializeSpeakers" type="checkbox"
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <span class="text-sm text-blue-700">Initialize speakers list automatically</span>
                    </label>
                </div>
            </div>

            <!-- Time Calculation Display -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-800 mb-2">Time Summary</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-600">Total Caucus Time:</span>
                        <span class="font-mono ml-2">{{ formatTime(totalCaucusSeconds) }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Per Speaker:</span>
                        <span class="font-mono ml-2">{{ formatTime(totalSpeechSeconds) }}</span>
                    </div>
                </div>
            </div>

            <!-- Instructions -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-purple-800 mb-2">How Moderated Caucus Works:</h4>
                <ul class="text-sm text-purple-700 space-y-1">
                    <li>• Discussion will be limited to the specific topic</li>
                    <li>• Chair recognizes speakers by raising placards</li>
                    <li>• No predetermined speakers list</li>
                    <li>• Questions to speakers are not permitted (time efficiency)</li>
                    <li>• Aim for equal participation from all delegations</li>
                </ul>
            </div>
        </form>
    </ModalWrapper>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { SpeakerWaveIcon } from '@heroicons/vue/24/outline'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'caucus-started'])

// State
const isStarting = ref(false)
const form = ref({
    topic: '',
    totalMinutes: 10,
    totalSeconds: 0,
    speechMinutes: 1,
    speechSeconds: 30,
    autoStartTimer: true,
    initializeSpeakers: true
})

// Computed
const totalCaucusSeconds = computed(() => {
    return (form.value.totalMinutes * 60) + form.value.totalSeconds
})

const totalSpeechSeconds = computed(() => {
    return (form.value.speechMinutes * 60) + form.value.speechSeconds
})

const hasChanges = computed(() => {
    return form.value.topic.trim() !== '' ||
        form.value.totalMinutes !== 10 ||
        form.value.totalSeconds !== 0 ||
        form.value.speechMinutes !== 1 ||
        form.value.speechSeconds !== 30
})

// Methods
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const closeModal = () => {
    emit('update:modelValue', false)
    resetForm()
}

const resetForm = () => {
    form.value = {
        topic: '',
        totalMinutes: 10,
        totalSeconds: 0,
        speechMinutes: 1,
        speechSeconds: 30,
        autoStartTimer: true,
        initializeSpeakers: true
    }
}

const startCaucus = async () => {
    if (!form.value.topic.trim()) {
        return
    }

    isStarting.value = true

    try {
        const caucusSettings = {
            topic: form.value.topic.trim(),
            totalTime: totalCaucusSeconds.value,
            individualSpeechTime: totalSpeechSeconds.value,
            autoStartTimer: form.value.autoStartTimer,
            initializeSpeakers: form.value.initializeSpeakers
        }

        emit('caucus-started', caucusSettings)
        closeModal()
    } catch (error) {
        console.error('Failed to start moderated caucus:', error)
    } finally {
        isStarting.value = false
    }
}

// Watch for modal open to reset form
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        resetForm()
    }
})
</script>