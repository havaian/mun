<template>
    <ModalWrapper v-model="modelValue" title="Start Roll Call"
        subtitle="Establish quorum and determine delegate attendance" :icon="ClipboardDocumentListIcon" size="md"
        variant="success" :is-loading="isStarting" :has-unsaved-changes="hasChanges" primary-text="Start Roll Call"
        cancel-text="Cancel" @primary-action="startRollCall" @close="closeModal">
        <!-- Content -->
        <div class="space-y-6">
            <p class="text-gray-600">
                Start the official roll call to establish quorum and determine which delegates are present for this
                session.
            </p>

            <!-- Time Limit Option -->
            <div>
                <label class="flex items-center space-x-3">
                    <input v-model="hasTimeLimit" type="checkbox"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                    <span class="text-sm font-medium text-gray-700">Set time limit for responses</span>
                </label>
            </div>

            <!-- Time Limit Input -->
            <div v-if="hasTimeLimit" class="ml-7 space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                    </label>
                    <input v-model.number="timeLimit" type="number" min="1" max="30"
                        class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="5" />
                    <p class="text-xs text-gray-500 mt-1">
                        Delegates not responding within this time will be marked as absent
                    </p>
                </div>

                <label class="flex items-center space-x-3">
                    <input v-model="autoMarkAbsent" type="checkbox"
                        class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                    <span class="text-sm text-gray-700">Automatically mark non-responding delegates as absent</span>
                </label>
            </div>

            <!-- Attendance Options Info -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-blue-800 mb-3">Attendance Options</h4>
                <div class="space-y-2 text-sm text-blue-700">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span><strong>Present & Voting:</strong> Full participation rights, counts toward quorum</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span><strong>Present:</strong> Can participate in debates but cannot vote</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span><strong>Absent:</strong> No participation rights, access blocked</span>
                    </div>
                </div>
            </div>

            <!-- Instructions -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-green-800 mb-2">During Roll Call:</h4>
                <ul class="text-sm text-green-700 space-y-1">
                    <li>• Delegates will see options to mark their attendance status</li>
                    <li>• You can manually mark delegates who have technical issues</li>
                    <li>• Quorum will be calculated automatically when roll call ends</li>
                    <li>• Speaker queues will be initialized based on final attendance</li>
                    <li>• Late arrivals can be manually added during the session</li>
                </ul>
            </div>

            <!-- Current Committee Info -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-800 mb-2">Committee Information</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-600">Total Countries:</span>
                        <span class="font-mono ml-2">{{ totalCountries }}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Quorum Required:</span>
                        <span class="font-mono ml-2">{{ Math.floor(totalCountries / 2) + 1 }}</span>
                    </div>
                </div>
            </div>
        </div>
    </ModalWrapper>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'roll-call-started'])

// Stores
const authStore = useAuthStore()

// State
const isStarting = ref(false)
const hasTimeLimit = ref(false)
const timeLimit = ref(5)
const autoMarkAbsent = ref(true)

// Computed
const totalCountries = computed(() => {
    // This would come from committee data
    return 195 // Mock value for UN General Assembly
})

const hasChanges = computed(() => {
    return hasTimeLimit.value || timeLimit.value !== 5 || !autoMarkAbsent.value
})

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
    resetForm()
}

const resetForm = () => {
    hasTimeLimit.value = false
    timeLimit.value = 5
    autoMarkAbsent.value = true
}

const startRollCall = async () => {
    isStarting.value = true

    try {
        const rollCallData = {}

        if (hasTimeLimit.value) {
            rollCallData.timeLimit = timeLimit.value
            rollCallData.autoMarkAbsent = autoMarkAbsent.value
        }

        emit('roll-call-started', rollCallData)
        closeModal()
    } catch (error) {
        console.error('Failed to start roll call:', error)
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