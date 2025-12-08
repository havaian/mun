<template>
    <ModalWrapper v-model="modelValue" title="Adjust Timer" :subtitle="`Modify ${timer?.label || 'Timer'} settings`"
        :icon="ClockIcon" size="md" variant="warning" :is-loading="isAdjusting" :has-unsaved-changes="hasChanges"
        primary-text="Apply Changes" cancel-text="Cancel" @primary-action="adjustTimer" @close="closeModal">
        <!-- Content -->
        <div class="space-y-6">
            <!-- Current Timer Info -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-800 mb-3">Current Timer Status</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-600">Type:</span>
                        <span class="font-mono ml-2">{{ timer?.label || 'Unknown' }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Current Time:</span>
                        <span class="font-mono ml-2 text-lg font-bold">{{ currentTimeDisplay }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Status:</span>
                        <span :class="[
                            'ml-2 px-2 py-1 rounded text-xs font-medium',
                            timer?.isRunning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        ]">
                            {{ timer?.isRunning ? 'Running' : 'Paused' }}
                        </span>
                    </div>
                    <div>
                        <span class="text-gray-600">Total Duration:</span>
                        <span class="font-mono ml-2">{{ formatTime(timer?.totalTime || 0) }}</span>
                    </div>
                </div>
            </div>

            <!-- Adjustment Options -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                    Adjustment Method
                </label>
                <div class="space-y-3">
                    <label class="flex items-center space-x-3">
                        <input v-model="adjustmentType" type="radio" value="set"
                            class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500" />
                        <span class="text-sm text-gray-700">Set exact time remaining</span>
                    </label>
                    <label class="flex items-center space-x-3">
                        <input v-model="adjustmentType" type="radio" value="add"
                            class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500" />
                        <span class="text-sm text-gray-700">Add time</span>
                    </label>
                    <label class="flex items-center space-x-3">
                        <input v-model="adjustmentType" type="radio" value="subtract"
                            class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500" />
                        <span class="text-sm text-gray-700">Subtract time</span>
                    </label>
                </div>
            </div>

            <!-- Time Input -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ adjustmentType === 'set' ? 'Set Time To' :
                        adjustmentType === 'add' ? 'Add Time' : 'Subtract Time' }}
                </label>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Minutes</label>
                        <input v-model.number="minutes" type="number" min="0" max="120"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Seconds</label>
                        <input v-model.number="seconds" type="number" min="0" max="59"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0" />
                    </div>
                </div>

                <!-- Preview -->
                <div class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div class="text-sm text-orange-800">
                        <strong>Result:</strong> {{ previewTime }}
                        <span v-if="adjustmentType !== 'set'" class="ml-2 text-xs">
                            ({{ adjustmentType === 'add' ? '+' : '-' }}{{ formatTime(adjustmentSeconds) }})
                        </span>
                    </div>
                </div>
            </div>

            <!-- Reason for Adjustment -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Adjustment <span class="text-gray-500">(Optional)</span>
                </label>
                <textarea v-model="reason" rows="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Technical difficulties, extended discussion needed..." />
                <p class="text-xs text-gray-500 mt-1">
                    This will be logged for session records
                </p>
            </div>

            <!-- Quick Time Presets -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                    Quick Adjustments
                </label>
                <div class="grid grid-cols-4 gap-2">
                    <button v-for="preset in timePresets" :key="preset.label" type="button" @click="applyPreset(preset)"
                        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        {{ preset.label }}
                    </button>
                </div>
            </div>

            <!-- Warning for Timer Running -->
            <div v-if="timer?.isRunning" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start">
                    <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                        <h4 class="text-sm font-semibold text-yellow-800">Timer is currently running</h4>
                        <p class="text-sm text-yellow-700 mt-1">
                            The timer will continue to count down. Changes will be applied immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </ModalWrapper>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    timer: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['update:modelValue', 'timer-adjusted'])

// State
const isAdjusting = ref(false)
const adjustmentType = ref('set')
const minutes = ref(1)
const seconds = ref(30)
const reason = ref('')

// Time presets for quick adjustments
const timePresets = [
    { label: '+30s', type: 'add', seconds: 30 },
    { label: '+1m', type: 'add', seconds: 60 },
    { label: '+2m', type: 'add', seconds: 120 },
    { label: '-30s', type: 'subtract', seconds: 30 },
    { label: '-1m', type: 'subtract', seconds: 60 },
    { label: '1m', type: 'set', seconds: 60 },
    { label: '2m', type: 'set', seconds: 120 },
    { label: '3m', type: 'set', seconds: 180 }
]

// Computed
const currentTimeDisplay = computed(() => {
    return formatTime(props.timer?.remainingTime || 0)
})

const adjustmentSeconds = computed(() => {
    return (minutes.value * 60) + seconds.value
})

const previewTime = computed(() => {
    const currentTime = props.timer?.remainingTime || 0
    let newTime = currentTime

    switch (adjustmentType.value) {
        case 'set':
            newTime = adjustmentSeconds.value
            break
        case 'add':
            newTime = currentTime + adjustmentSeconds.value
            break
        case 'subtract':
            newTime = Math.max(0, currentTime - adjustmentSeconds.value)
            break
    }

    return formatTime(newTime)
})

const hasChanges = computed(() => {
    return adjustmentSeconds.value > 0 || reason.value.trim() !== ''
})

// Methods
const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const closeModal = () => {
    emit('update:modelValue', false)
    resetForm()
}

const resetForm = () => {
    adjustmentType.value = 'set'
    minutes.value = 1
    seconds.value = 30
    reason.value = ''
}

const applyPreset = (preset) => {
    adjustmentType.value = preset.type
    minutes.value = Math.floor(preset.seconds / 60)
    seconds.value = preset.seconds % 60
}

const adjustTimer = async () => {
    if (adjustmentSeconds.value === 0 && adjustmentType.value !== 'set') {
        return
    }

    isAdjusting.value = true

    try {
        const currentTime = props.timer?.remainingTime || 0
        let newTime = currentTime

        switch (adjustmentType.value) {
            case 'set':
                newTime = adjustmentSeconds.value
                break
            case 'add':
                newTime = currentTime + adjustmentSeconds.value
                break
            case 'subtract':
                newTime = Math.max(0, currentTime - adjustmentSeconds.value)
                break
        }

        const adjustmentData = {
            oldTime: currentTime,
            newTime,
            adjustmentType: adjustmentType.value,
            adjustmentAmount: adjustmentSeconds.value,
            reason: reason.value.trim() || `Timer ${adjustmentType.value} via manual adjustment`
        }

        emit('timer-adjusted', adjustmentData)
        closeModal()
    } catch (error) {
        console.error('Failed to adjust timer:', error)
    } finally {
        isAdjusting.value = false
    }
}

// Watch for modal open to reset form and populate with current timer
watch(() => props.modelValue, (newVal) => {
    if (newVal && props.timer) {
        resetForm()
        // Set default to current timer time
        const currentSeconds = props.timer.remainingTime || 0
        minutes.value = Math.floor(currentSeconds / 60)
        seconds.value = currentSeconds % 60
    }
})
</script>