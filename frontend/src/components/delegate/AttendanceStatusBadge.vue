<template>
    <div class="attendance-status-badge">
        <!-- Full Status Card (for dashboard) -->
        <div v-if="variant === 'card'" class="mun-card p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div :class="getIconContainerClass(status)">
                        <CheckCircleIcon v-if="status === 'present_voting'" class="w-6 h-6" />
                        <ClockIcon v-else-if="status === 'present'" class="w-6 h-6" />
                        <XCircleIcon v-else class="w-6 h-6" />
                    </div>
                    <div>
                        <p class="text-sm text-mun-gray-600">Your Attendance Status</p>
                        <p class="text-lg font-semibold text-mun-gray-900">{{ getStatusLabel(status) }}</p>
                    </div>
                </div>
                <button v-if="status === 'absent' && canRequestChange" @click="$emit('request-change')"
                    class="text-sm text-mun-blue hover:text-mun-blue-600 font-medium">
                    Mark Present
                </button>
            </div>

            <!-- Warning for absent -->
            <div v-if="status === 'absent'" class="mt-3 p-3 bg-mun-red-50 rounded-lg border border-mun-red-200">
                <p class="text-sm text-mun-red-700 flex items-start">
                    <ExclamationTriangleIcon class="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                        You are currently marked as absent. Some features may be restricted until you mark your
                        attendance.
                    </span>
                </p>
            </div>

            <!-- Info for present -->
            <div v-else-if="status === 'present'"
                class="mt-3 p-3 bg-mun-yellow-50 rounded-lg border border-mun-yellow-200">
                <p class="text-sm text-mun-yellow-700 flex items-start">
                    <InformationCircleIcon class="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                        You are present but not voting. You can participate in debates but cannot cast votes.
                    </span>
                </p>
            </div>

            <!-- Info for present & voting -->
            <div v-else-if="status === 'present_voting'"
                class="mt-3 p-3 bg-mun-green-50 rounded-lg border border-mun-green-200">
                <p class="text-sm text-mun-green-700 flex items-start">
                    <CheckCircleIcon class="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                        You are present and voting. Full participation enabled.
                    </span>
                </p>
            </div>

            <!-- Marked info -->
            <div v-if="markedAt" class="mt-2 pt-2 border-t border-mun-gray-100">
                <p class="text-xs text-mun-gray-500">
                    Marked {{ formatTime(markedAt) }}
                    <span v-if="markedBy === 'presidium'" class="text-mun-blue">(by presidium)</span>
                    <span v-else class="text-mun-green-600">(by you)</span>
                </p>
            </div>
        </div>

        <!-- Badge variant (compact) -->
        <span v-else-if="variant === 'badge'" :class="getBadgeClass(status)">
            {{ getStatusLabel(status) }}
        </span>

        <!-- Inline variant -->
        <div v-else-if="variant === 'inline'" class="flex items-center space-x-2">
            <div :class="getIconContainerClass(status, true)">
                <CheckCircleIcon v-if="status === 'present_voting'" class="w-4 h-4" />
                <ClockIcon v-else-if="status === 'present'" class="w-4 h-4" />
                <XCircleIcon v-else class="w-4 h-4" />
            </div>
            <span class="text-sm font-medium text-mun-gray-900">{{ getStatusLabel(status) }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    status: {
        type: String,
        required: true,
        validator: (value) => ['present_voting', 'present', 'absent'].includes(value)
    },
    variant: {
        type: String,
        default: 'card',
        validator: (value) => ['card', 'badge', 'inline'].includes(value)
    },
    markedAt: {
        type: String,
        default: null
    },
    markedBy: {
        type: String,
        default: null,
        validator: (value) => !value || ['delegate', 'presidium'].includes(value)
    },
    canRequestChange: {
        type: Boolean,
        default: false
    }
})

defineEmits(['request-change'])

// Methods
const getStatusLabel = (status) => {
    const labels = {
        'present_voting': 'Present & Voting',
        'present': 'Present',
        'absent': 'Absent'
    }
    return labels[status] || 'Unknown'
}

const getIconContainerClass = (status, small = false) => {
    const baseClasses = small ? 'p-1 rounded' : 'p-2 rounded-lg'
    const statusClasses = {
        'present_voting': 'bg-mun-green-100 text-mun-green-600',
        'present': 'bg-mun-yellow-100 text-mun-yellow-600',
        'absent': 'bg-mun-red-100 text-mun-red-600'
    }
    return `${baseClasses} ${statusClasses[status] || statusClasses.absent}`
}

const getBadgeClass = (status) => {
    const statusClasses = {
        'present_voting': 'px-3 py-1 text-sm font-medium rounded-lg bg-mun-green-100 text-mun-green-700',
        'present': 'px-3 py-1 text-sm font-medium rounded-lg bg-mun-yellow-100 text-mun-yellow-700',
        'absent': 'px-3 py-1 text-sm font-medium rounded-lg bg-mun-red-100 text-mun-red-700'
    }
    return statusClasses[status] || statusClasses.absent
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return ''
    }
}
</script>