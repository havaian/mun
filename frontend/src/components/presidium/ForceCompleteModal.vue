<template>
    <ModalWrapper :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        title="Force Complete Voting" subtitle="Not all eligible voters have cast their votes"
        :icon="ExclamationTriangleIcon" size="md" :is-primary-disabled="isSubmitting" primary-text="Force Complete"
        secondary-text="Cancel" primary-variant="danger" @primary-action="handleForceComplete"
        @secondary-action="$emit('update:modelValue', false)">

        <template #content>
            <div class="space-y-4">
                <!-- Warning message -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div class="flex">
                        <ExclamationTriangleIcon class="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                        <div>
                            <div class="text-sm font-medium text-amber-800">Incomplete Voting</div>
                            <div class="text-sm text-amber-700 mt-1">
                                {{ remainingVoters }} delegate{{ remainingVoters !== 1 ? 's' : '' }} ha{{
                                remainingVoters === 1 ? 's' : 've' }} not yet voted.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current progress -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm font-medium text-gray-900 mb-2">Current Progress</div>
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{{ totalVotes }} / {{ eligibleVoters }} votes cast</span>
                        <span>{{ Math.round((totalVotes / eligibleVoters) * 100) }}% complete</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${(totalVotes / eligibleVoters) * 100}%` }"></div>
                    </div>
                </div>

                <!-- Confirmation text -->
                <div class="text-sm text-gray-700">
                    <p class="mb-2">
                        <strong>Force completing</strong> will end the voting session immediately and calculate results
                        based on votes already cast.
                    </p>
                    <p>
                        Delegates who haven't voted will be marked as absent from this vote.
                    </p>
                </div>

                <!-- Confirmation checkbox -->
                <div class="flex items-start">
                    <input v-model="confirmed" type="checkbox" id="force-confirm"
                        class="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                    <label for="force-confirm" class="ml-3 text-sm text-gray-700">
                        I understand that this action cannot be undone and will end the voting session
                    </label>
                </div>
            </div>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    remainingVoters: {
        type: Number,
        required: true
    },
    totalVotes: {
        type: Number,
        required: true
    },
    eligibleVoters: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'force-complete'])

const isSubmitting = ref(false)
const confirmed = ref(false)

const isValid = computed(() => confirmed.value)

const handleForceComplete = async () => {
    if (!confirmed.value) return

    isSubmitting.value = true
    emit('force-complete')
}

// Reset when modal closes
const resetForm = () => {
    confirmed.value = false
    isSubmitting.value = false
}

// Watch for modal close to reset form
watch(() => props.modelValue, (newVal) => {
    if (!newVal) {
        resetForm()
    }
})
</script>