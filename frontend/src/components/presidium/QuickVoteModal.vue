<template>
    <ModalWrapper :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        title="Start Quick Vote" subtitle="Create a new voting session for the committee" :icon="HandRaisedIcon"
        size="lg" :has-unsaved-changes="hasUnsavedChanges" :is-primary-disabled="!isValid || isSubmitting"
        primary-text="Start Voting" @primary-action="handleSubmit" @close="closeModal">

        <template #content>
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <!-- Vote Type -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Voting Type
                    </label>
                    <select v-model="form.votingType" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="simple">Simple Vote</option>
                        <option value="rollCall">Roll Call Vote</option>
                        <option value="secretBallot">Secret Ballot</option>
                    </select>
                </div>

                <!-- Vote Title -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Vote Title
                    </label>
                    <input v-model="form.title" type="text" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter vote title..." />
                </div>

                <!-- Vote Description -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional)
                    </label>
                    <textarea v-model="form.description" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional details about this vote..."></textarea>
                </div>

                <!-- Vote Subject -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Vote Subject
                    </label>
                    <select v-model="form.subjectType"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="motion">Motion</option>
                        <option value="resolution">Resolution</option>
                        <option value="amendment">Amendment</option>
                        <option value="procedure">Procedural Question</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <!-- Majority Required -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Majority Required
                    </label>
                    <select v-model="form.majorityRequired"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="simple">Simple Majority (50% + 1)</option>
                        <option value="twoThirds">Two-Thirds Majority (66.7%)</option>
                        <option value="consensus">Consensus</option>
                    </select>
                </div>

                <!-- Time Limit -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (minutes)
                    </label>
                    <input v-model.number="form.timeLimit" type="number" min="1" max="60"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10" />
                    <p class="text-sm text-gray-500 mt-1">Leave blank for no time limit</p>
                </div>

                <!-- Options for different voting types -->
                <div v-if="form.votingType === 'rollCall'" class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-medium text-blue-900 mb-2">Roll Call Voting</h4>
                    <p class="text-sm text-blue-700">
                        Countries will vote in alphabetical order. Each delegation will be called to cast their vote
                        publicly.
                    </p>
                </div>

                <div v-if="form.votingType === 'secretBallot'" class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-medium text-green-900 mb-2">Secret Ballot</h4>
                    <p class="text-sm text-green-700">
                        Votes will be cast anonymously. Results will only show vote counts without revealing individual
                        positions.
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button type="button" @click="closeModal" class="btn-un-secondary" :disabled="isSubmitting">
                        Cancel
                    </button>
                    <button type="submit" class="btn-un-primary" :disabled="isSubmitting">
                        <span v-if="isSubmitting">Creating Vote...</span>
                        <span v-else>Start Voting</span>
                    </button>
                </div>
            </form>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { HandRaisedIcon } from '@heroicons/vue/24/outline'
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

const emit = defineEmits(['update:modelValue', 'voting-created'])
const toast = useToast()

// State
const isSubmitting = ref(false)

const form = reactive({
    votingType: 'simple',
    title: '',
    description: '',
    subjectType: 'motion',
    majorityRequired: 'simple',
    timeLimit: 10
})

// Computed
const isValid = computed(() => {
    return form.title.trim().length > 0 && props.session
})

const hasUnsavedChanges = computed(() => {
    return form.title.trim() !== '' ||
        form.description.trim() !== '' ||
        form.votingType !== 'simple' ||
        form.subjectType !== 'motion' ||
        form.majorityRequired !== 'simple' ||
        form.timeLimit !== 10
})

// Methods
const closeModal = () => {
    if (!isSubmitting.value) {
        emit('update:modelValue', false)
        resetForm()
    }
}

const resetForm = () => {
    form.votingType = 'simple'
    form.title = ''
    form.description = ''
    form.subjectType = 'motion'
    form.majorityRequired = 'simple'
    form.timeLimit = 10
}

const handleSubmit = async () => {
    if (!props.session) {
        toast.error('No active session found')
        return
    }

    try {
        isSubmitting.value = true

        const votingData = {
            committeeId: props.session.committeeId,
            sessionId: props.session._id,
            votingType: form.votingType,
            subjectType: form.subjectType,
            title: form.title.trim(),
            description: form.description.trim() || null,
            fullText: form.title.trim(), // Use title as full text for quick votes
            majorityRequired: form.majorityRequired,
            timeLimit: form.timeLimit || null
        }

        const response = await apiMethods.voting.create(votingData)

        if (response.data.success) {
            emit('voting-created', response.data.voting)
            toast.success('Voting started successfully')
            closeModal()
        } else {
            throw new Error(response.data.message || 'Failed to create voting')
        }

    } catch (error) {
        console.error('Create voting error:', error)
        toast.error(error.message || 'Failed to create voting')
    } finally {
        isSubmitting.value = false
    }
}

// Watch for modal close
watch(() => props.modelValue, (newVal) => {
    if (!newVal) {
        resetForm()
    }
})
</script>

<style scoped>
/* No custom styles needed - ModalWrapper handles everything */
</style>