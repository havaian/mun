<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isVisible" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop - cannot close -->
                <div class="fixed inset-0 bg-black bg-opacity-75"></div>

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-6">
                        <!-- Header with pulsing indicator -->
                        <div class="text-center">
                            <div class="flex justify-center mb-4">
                                <span class="flex h-4 w-4 relative">
                                    <span
                                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-mun-blue opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-4 w-4 bg-mun-blue"></span>
                                </span>
                            </div>
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-2">Roll Call Active</h2>
                            <p class="text-mun-gray-600">Please mark your attendance</p>
                        </div>

                        <!-- Country Info -->
                        <div class="p-4 bg-mun-blue/5 rounded-lg border border-mun-blue/20">
                            <div class="flex items-center space-x-3">
                                <img v-if="country?.flagUrl" :src="country.flagUrl" :alt="country.name"
                                    class="w-12 h-9 object-cover rounded border border-mun-gray-200" />
                                <div>
                                    <h3 class="font-semibold text-mun-gray-900">{{ country?.name }}</h3>
                                    <p v-if="country?.specialRole" class="text-sm text-mun-gray-600">
                                        {{ country.specialRole }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Selected Status Preview -->
                        <div v-if="selectedStatus" class="p-4 rounded-lg border-2"
                            :class="getPreviewClass(selectedStatus)">
                            <p class="text-sm font-medium text-center">
                                You will be marked as: <strong>{{ getStatusLabel(selectedStatus) }}</strong>
                            </p>
                            <p class="text-xs text-center mt-1" :class="getPreviewTextClass(selectedStatus)">
                                {{ getStatusDescription(selectedStatus) }}
                            </p>
                        </div>

                        <!-- Status Options -->
                        <div class="space-y-3">
                            <!-- Present & Voting (only for voting countries) -->
                            <button v-if="canVote" @click="selectStatus('present_and_voting')" :disabled="isSubmitting"
                                :class="[
                                    'w-full p-4 rounded-lg border-2 transition-all text-left',
                                    selectedStatus === 'present_and_voting'
                                        ? 'border-mun-green-500 bg-mun-green-50'
                                        : 'border-mun-gray-200 hover:border-mun-green-300 hover:bg-mun-green-50/50'
                                ]">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div :class="[
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                            selectedStatus === 'present_and_voting'
                                                ? 'border-mun-green-500 bg-mun-green-500'
                                                : 'border-mun-gray-300'
                                        ]">
                                            <CheckIcon v-if="selectedStatus === 'present_and_voting'"
                                                class="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <p class="font-semibold text-mun-gray-900">Present and Voting</p>
                                            <p class="text-sm text-mun-gray-600">Full participation + voting rights</p>
                                        </div>
                                    </div>
                                    <CheckCircleIcon class="w-6 h-6 text-mun-green-600" />
                                </div>
                            </button>

                            <!-- Present (for all) -->
                            <button @click="selectStatus('present')" :disabled="isSubmitting" :class="[
                                'w-full p-4 rounded-lg border-2 transition-all text-left',
                                selectedStatus === 'present'
                                    ? 'border-mun-yellow-500 bg-mun-yellow-50'
                                    : 'border-mun-gray-200 hover:border-mun-yellow-300 hover:bg-mun-yellow-50/50'
                            ]">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div :class="[
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                            selectedStatus === 'present'
                                                ? 'border-mun-yellow-500 bg-mun-yellow-500'
                                                : 'border-mun-gray-300'
                                        ]">
                                            <CheckIcon v-if="selectedStatus === 'present'" class="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <p class="font-semibold text-mun-gray-900">Present</p>
                                            <p class="text-sm text-mun-gray-600">Present but not voting</p>
                                        </div>
                                    </div>
                                    <ClockIcon class="w-6 h-6 text-mun-yellow-600" />
                                </div>
                            </button>

                            <!-- Note for observers -->
                            <div v-if="!canVote" class="p-3 bg-mun-blue/5 rounded-lg border border-mun-blue/20">
                                <p class="text-sm text-mun-blue flex items-center">
                                    <InformationCircleIcon class="w-4 h-4 mr-2 flex-shrink-0" />
                                    As an {{ country?.isObserver ? 'observer' : 'participant' }}, you cannot vote in
                                    this committee.
                                </p>
                            </div>
                        </div>

                        <!-- Warning -->
                        <div class="p-3 bg-mun-yellow-50 rounded-lg border border-mun-yellow-200">
                            <p class="text-sm text-mun-yellow-800 flex items-start">
                                <ExclamationTriangleIcon class="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                <span>
                                    If you don't mark your attendance, you will be marked as <strong>Absent</strong> and
                                    locked out of the system until the next roll call.
                                </span>
                            </p>
                        </div>

                        <!-- Submit Button -->
                        <button @click="submitAttendance" :disabled="!selectedStatus || isSubmitting"
                            class="w-full btn-un-primary py-3 text-lg font-semibold">
                            <span v-if="isSubmitting">Submitting...</span>
                            <span v-else>Confirm Attendance</span>
                        </button>

                        <!-- Cannot close notice -->
                        <p class="text-xs text-center text-mun-gray-500">
                            You must mark your attendance to continue
                        </p>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckIcon
} from '@heroicons/vue/24/outline'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    country: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['update:modelValue', 'attendance-submitted'])
const toast = useToast()

// State
const isSubmitting = ref(false)
const selectedStatus = ref(null)
const isVisible = ref(false)

// Computed
const canVote = computed(() => {
    return !props.country?.isObserver && !props.country?.specialRole
})

// Methods
const selectStatus = (status) => {
    if (isSubmitting.value) return
    selectedStatus.value = status
}

const getStatusLabel = (status) => {
    const labels = {
        'present_and_voting': 'Present and Voting',
        'present': 'Present'
    }
    return labels[status] || status
}

const getStatusDescription = (status) => {
    const descriptions = {
        'present_and_voting': 'You will be counted for quorum and can participate in all votes',
        'present': 'You can participate in debates but cannot vote'
    }
    return descriptions[status] || ''
}

const getPreviewClass = (status) => {
    const classes = {
        'present_and_voting': 'bg-mun-green-50 border-mun-green-200',
        'present': 'bg-mun-yellow-50 border-mun-yellow-200'
    }
    return classes[status] || 'bg-mun-gray-50 border-mun-gray-200'
}

const getPreviewTextClass = (status) => {
    const classes = {
        'present_and_voting': 'text-mun-green-700',
        'present': 'text-mun-yellow-700'
    }
    return classes[status] || 'text-mun-gray-600'
}

const submitAttendance = async () => {
    if (!selectedStatus.value || isSubmitting.value) return

    try {
        isSubmitting.value = true

        const attendanceData = {
            attendance: [{
                country: props.country.name,
                status: selectedStatus.value,
                markedBy: 'delegate',
                markedAt: new Date().toISOString()
            }]
        }

        const response = await apiMethods.sessions.updateAttendance(
            props.sessionId,
            attendanceData
        )

        if (response.data.success) {
            toast.success('Attendance marked successfully')
            emit('attendance-submitted', selectedStatus.value)
            closeModal()
        }

    } catch (error) {
        console.error('Submit attendance error:', error)
        toast.error('Failed to mark attendance')
    } finally {
        isSubmitting.value = false
    }
}

const closeModal = () => {
    isVisible.value = false
    setTimeout(() => {
        emit('update:modelValue', false)
        selectedStatus.value = null
    }, 300)
}

// Watch for modal open
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        isVisible.value = true
        // Pre-select based on voting rights
        if (canVote.value) {
            selectedStatus.value = 'present_and_voting'
        } else {
            selectedStatus.value = 'present'
        }
    } else {
        isVisible.value = false
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