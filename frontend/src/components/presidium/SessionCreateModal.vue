<template>
    <ModalWrapper v-model="modelValue" title="Create New Session" size="md" variant="primary" :is-loading="isSubmitting"
        primary-text="Create & Start Session" cancel-text="Cancel" @primary-action="handleSubmit" @close="closeModal">

        <template #icon>
            <CalendarDaysIcon class="w-6 h-6" />
        </template>

        <template #content>
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

                <!-- Default Speech Time -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Default Speech Time (seconds)
                    </label>
                    <input v-model.number="form.speechTime" type="number" min="30" max="600" step="30" required
                        class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                    <p class="text-xs text-mun-gray-500 mt-1">
                        {{ Math.floor(form.speechTime / 60) }} minutes {{ form.speechTime % 60 }} seconds
                    </p>
                </div>

                <!-- Allow Questions -->
                <div class="flex items-center">
                    <input v-model="form.questionsAllowed" type="checkbox" id="questionsAllowed"
                        class="w-4 h-4 text-mun-blue border-mun-gray-300 rounded focus:ring-mun-blue" />
                    <label for="questionsAllowed" class="ml-2 text-sm text-mun-gray-700">
                        Allow questions after speeches
                    </label>
                </div>
            </form>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
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

const form = reactive({
    sessionNumber: 1,
    mode: 'formal',
    speechTime: 180, // 3 minutes default
    questionsAllowed: false
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
    form.speechTime = 180
    form.questionsAllowed = false
}

const handleSubmit = async () => {
    try {
        isSubmitting.value = true

        // Send data that matches backend expectations
        const sessionData = {
            committeeId: props.committeeId,
            sessionNumber: form.sessionNumber,
            title: `Session ${form.sessionNumber}`,
            mode: form.mode,
            speechTime: form.speechTime,
            questionsAllowed: form.questionsAllowed,
            autoStart: true // Always auto-start for MVP
        }

        const response = await apiMethods.sessions.create(sessionData)

        if (response.data.success) {
            emit('session-created', response.data.session)
            closeModal()
            toast.success(`Session ${form.sessionNumber} created and started!`)
        }

    } catch (error) {
        console.error('Create session error:', error)
        toast.error(error.response?.data?.error || 'Failed to create session')
    } finally {
        isSubmitting.value = false
    }
}

// Remove the watch since we don't need to set default times anymore
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