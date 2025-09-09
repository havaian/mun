<!-- frontend/src/components/presidium/QuorumIndicator.vue -->
<template>
    <div :class="containerClasses" class="quorum-indicator rounded-lg p-4 border transition-all duration-300">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
                <div :class="iconBgClass" class="p-2 rounded-lg">
                    <component :is="quorumIcon" :class="iconColorClass" class="w-5 h-5" />
                </div>
                <div>
                    <h3 :class="titleColorClass" class="text-sm font-medium">
                        {{ hasQuorum ? 'Quorum Achieved' : 'No Quorum' }}
                    </h3>
                    <p class="text-xs text-mun-gray-500">
                        {{ required }} {{ required === 1 ? 'delegate' : 'delegates' }} required
                    </p>
                </div>
            </div>

            <!-- Status Badge -->
            <div :class="statusBadgeClass" class="px-3 py-1 rounded-full">
                <span class="text-xs font-medium">{{ statusText }}</span>
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-mun-gray-700">
                    {{ present }} / {{ total }} Present
                </span>
                <span class="text-xs font-medium" :class="percentageColorClass">
                    {{ progressPercentage }}%
                </span>
            </div>

            <div class="progress-container w-full bg-mun-gray-200 rounded-full h-2">
                <div :class="progressBarClass"
                    class="progress-bar h-2 rounded-full transition-all duration-500 ease-out"
                    :style="{ width: `${Math.min(progressPercentage, 100)}%` }"></div>

                <!-- Quorum Threshold Indicator -->
                <div class="quorum-threshold absolute top-0 h-2 w-0.5 bg-white shadow-sm"
                    :style="{ left: `${quorumThresholdPosition}%` }"></div>
            </div>
        </div>

        <!-- Detailed Breakdown -->
        <div v-if="showDetails" class="quorum-details">
            <div class="grid grid-cols-2 gap-3 text-center">
                <!-- Present Count -->
                <div class="detail-item">
                    <div class="flex items-center justify-center mb-1">
                        <div class="w-2 h-2 bg-mun-green-500 rounded-full mr-1"></div>
                        <span class="text-lg font-bold text-mun-green-700">{{ present }}</span>
                    </div>
                    <p class="text-xs text-mun-gray-600">Present</p>
                </div>

                <!-- Needed for Quorum -->
                <div class="detail-item">
                    <div class="flex items-center justify-center mb-1">
                        <div :class="neededIndicatorColor" class="w-2 h-2 rounded-full mr-1"></div>
                        <span :class="neededTextColor" class="text-lg font-bold">{{ neededForQuorum }}</span>
                    </div>
                    <p class="text-xs text-mun-gray-600">{{ neededForQuorum === 0 ? 'Surplus' : 'Needed' }}</p>
                </div>
            </div>

            <!-- Special Cases -->
            <div v-if="showSpecialCases" class="mt-3 pt-3 border-t border-gray-200">
                <!-- Security Council Special Rules -->
                <div v-if="isSecurityCouncil"
                    class="special-case bg-mun-red-50 border border-mun-red-200 rounded p-2 mb-2">
                    <div class="flex items-center text-xs text-mun-red-800">
                        <ShieldExclamationIcon class="w-3 h-3 mr-1" />
                        <span class="font-medium">Security Council:</span>
                        <span class="ml-1">9 members required, no vetoes for procedural matters</span>
                    </div>
                </div>

                <!-- Consensus Required -->
                <div v-if="requiresConsensus"
                    class="special-case bg-mun-yellow-50 border border-mun-yellow-200 rounded p-2 mb-2">
                    <div class="flex items-center text-xs text-mun-yellow-800">
                        <ExclamationTriangleIcon class="w-3 h-3 mr-1" />
                        <span class="font-medium">Consensus Required:</span>
                        <span class="ml-1">All present members must agree</span>
                    </div>
                </div>

                <!-- Two-Thirds Majority -->
                <div v-if="requiresTwoThirds"
                    class="special-case bg-mun-blue-50 border border-mun-blue-200 rounded p-2">
                    <div class="flex items-center text-xs text-mun-blue-800">
                        <InformationCircleIcon class="w-3 h-3 mr-1" />
                        <span class="font-medium">Two-Thirds Majority:</span>
                        <span class="ml-1">{{ twoThirdsRequired }} votes needed for passage</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div v-if="showActions && canManageQuorum" class="quorum-actions mt-3 pt-3 border-t border-gray-200">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <button v-if="!hasQuorum" @click="$emit('request-roll-call')"
                        class="inline-flex items-center px-2 py-1 text-xs font-medium text-un-blue bg-un-blue/10 border border-un-blue/20 rounded hover:bg-un-blue/20 transition-colors">
                        <ClipboardDocumentListIcon class="w-3 h-3 mr-1" />
                        Roll Call
                    </button>

                    <button @click="$emit('send-reminder')"
                        class="inline-flex items-center px-2 py-1 text-xs font-medium text-mun-gray-700 bg-mun-gray-100 border border-mun-gray-200 rounded hover:bg-mun-gray-200 transition-colors">
                        <BellIcon class="w-3 h-3 mr-1" />
                        Remind Absent
                    </button>
                </div>

                <button @click="showDetails = !showDetails"
                    class="text-xs text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                    {{ showDetails ? 'Less' : 'More' }} Details
                </button>
            </div>
        </div>

        <!-- Historical Tracking -->
        <div v-if="trackHistory && quorumHistory.length > 0" class="quorum-history mt-3 pt-3 border-t border-gray-200">
            <h4 class="text-xs font-medium text-mun-gray-700 mb-2">Quorum Timeline</h4>
            <div class="timeline-container max-h-20 overflow-y-auto">
                <div v-for="(entry, index) in recentQuorumHistory" :key="index"
                    class="timeline-item flex items-center justify-between text-xs text-mun-gray-600 mb-1">
                    <div class="flex items-center space-x-2">
                        <div :class="entry.hasQuorum ? 'bg-mun-green-500' : 'bg-mun-red-500'"
                            class="w-1.5 h-1.5 rounded-full"></div>
                        <span>{{ entry.hasQuorum ? 'Achieved' : 'Lost' }} ({{ entry.present }}/{{ entry.total }})</span>
                    </div>
                    <span>{{ formatTime(entry.timestamp) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    ShieldExclamationIcon,
    InformationCircleIcon,
    ClipboardDocumentListIcon,
    BellIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps({
    present: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    required: {
        type: Number,
        default: null // If null, will calculate as majority
    },
    variant: {
        type: String,
        default: 'default', // default, compact, minimal
        validator: (value) => ['default', 'compact', 'minimal'].includes(value)
    },
    showActions: {
        type: Boolean,
        default: false
    },
    showDetails: {
        type: Boolean,
        default: false
    },
    trackHistory: {
        type: Boolean,
        default: false
    },
    isSecurityCouncil: {
        type: Boolean,
        default: false
    },
    requiresConsensus: {
        type: Boolean,
        default: false
    },
    requiresTwoThirds: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['quorum-changed', 'request-roll-call', 'send-reminder'])

const authStore = useAuthStore()

// State
const quorumHistory = ref([])

// Computed
const hasQuorum = computed(() => {
    return props.present >= quorumRequired.value
})

const quorumRequired = computed(() => {
    if (props.required !== null) return props.required

    // Special cases
    if (props.isSecurityCouncil) return 9 // UN Security Council
    if (props.requiresConsensus) return props.total // All present must agree
    if (props.requiresTwoThirds) return Math.ceil(props.total * 2 / 3)

    // Default: simple majority (50% + 1)
    return Math.floor(props.total / 2) + 1
})

const twoThirdsRequired = computed(() => {
    return Math.ceil(props.total * 2 / 3)
})

const progressPercentage = computed(() => {
    if (props.total === 0) return 0
    return Math.round((props.present / props.total) * 100)
})

const quorumThresholdPosition = computed(() => {
    if (props.total === 0) return 0
    return Math.min((quorumRequired.value / props.total) * 100, 100)
})

const neededForQuorum = computed(() => {
    const needed = quorumRequired.value - props.present
    return Math.max(0, needed)
})

const canManageQuorum = computed(() => {
    return authStore.user?.role === 'presidium' || authStore.user?.role === 'admin'
})

const showSpecialCases = computed(() => {
    return props.isSecurityCouncil || props.requiresConsensus || props.requiresTwoThirds
})

const recentQuorumHistory = computed(() => {
    return quorumHistory.value.slice(-5).reverse() // Show last 5 entries, newest first
})

// Style classes
const containerClasses = computed(() => {
    const base = 'quorum-indicator'
    const variants = {
        default: '',
        compact: 'compact-variant',
        minimal: 'minimal-variant'
    }

    const statusClass = hasQuorum.value
        ? 'border-mun-green-300 bg-mun-green-50'
        : 'border-mun-red-300 bg-mun-red-50'

    return `${base} ${variants[props.variant]} ${statusClass}`
})

const quorumIcon = computed(() => {
    return hasQuorum.value ? CheckCircleIcon : ExclamationTriangleIcon
})

const iconBgClass = computed(() => {
    return hasQuorum.value ? 'bg-mun-green-100' : 'bg-mun-red-100'
})

const iconColorClass = computed(() => {
    return hasQuorum.value ? 'text-mun-green-700' : 'text-mun-red-700'
})

const titleColorClass = computed(() => {
    return hasQuorum.value ? 'text-mun-green-900' : 'text-mun-red-900'
})

const statusBadgeClass = computed(() => {
    return hasQuorum.value
        ? 'bg-mun-green-600 text-white'
        : 'bg-mun-red-600 text-white'
})

const statusText = computed(() => {
    return hasQuorum.value ? 'ACHIEVED' : 'REQUIRED'
})

const progressBarClass = computed(() => {
    if (hasQuorum.value) {
        return 'bg-gradient-to-r from-mun-green-500 to-mun-green-600'
    } else {
        return 'bg-gradient-to-r from-mun-red-400 to-mun-red-500'
    }
})

const percentageColorClass = computed(() => {
    return hasQuorum.value ? 'text-mun-green-700' : 'text-mun-red-700'
})

const neededIndicatorColor = computed(() => {
    return neededForQuorum.value === 0 ? 'bg-mun-green-500' : 'bg-mun-red-500'
})

const neededTextColor = computed(() => {
    return neededForQuorum.value === 0 ? 'text-mun-green-700' : 'text-mun-red-700'
})

// Methods
const formatTime = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Unknown'
    }
}

const addToHistory = (hasQuorumStatus) => {
    if (!props.trackHistory) return

    quorumHistory.value.push({
        timestamp: new Date(),
        hasQuorum: hasQuorumStatus,
        present: props.present,
        total: props.total,
        required: quorumRequired.value
    })

    // Keep only last 20 entries
    if (quorumHistory.value.length > 20) {
        quorumHistory.value = quorumHistory.value.slice(-20)
    }
}

// Watchers
watch(hasQuorum, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        emit('quorum-changed', {
            hasQuorum: newValue,
            present: props.present,
            total: props.total,
            required: quorumRequired.value
        })

        addToHistory(newValue)
    }
}, { immediate: false })

// Initialize history on mount
onMounted(() => {
    if (props.trackHistory) {
        addToHistory(hasQuorum.value)
    }
})
</script>

<style scoped>
.quorum-indicator {
    position: relative;
}

.progress-container {
    position: relative;
}

.progress-bar {
    background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.1) 75%, transparent 75%, transparent);
    background-size: 1rem 1rem;
    animation: progress-animation 2s linear infinite;
}

@keyframes progress-animation {
    0% {
        background-position: 0 0;
    }

    100% {
        background-position: 1rem 0;
    }
}

.quorum-threshold {
    z-index: 10;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.quorum-threshold::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    width: 0;
    height: 0;
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    border-top: 4px solid #374151;
}

.detail-item {
    padding: 0.5rem;
    border-radius: 0.375rem;
    background: rgba(255, 255, 255, 0.5);
}

.special-case {
    animation: pulse-border 2s infinite;
}

@keyframes pulse-border {

    0%,
    100% {
        border-opacity: 1;
    }

    50% {
        border-opacity: 0.5;
    }
}

.timeline-container {
    border-left: 2px solid #e5e7eb;
    padding-left: 0.75rem;
}

.timeline-item {
    position: relative;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: -0.875rem;
    top: 0.125rem;
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background: currentColor;
}

/* Compact variant */
.compact-variant {
    padding: 0.75rem;
}

.compact-variant .detail-item {
    padding: 0.25rem;
}

/* Minimal variant */
.minimal-variant {
    padding: 0.5rem;
    border: none;
    background: transparent;
}

.minimal-variant .quorum-details,
.minimal-variant .quorum-actions,
.minimal-variant .quorum-history {
    display: none;
}

/* Custom scrollbar */
.timeline-container::-webkit-scrollbar {
    width: 2px;
}

.timeline-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 1px;
}

.timeline-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 1px;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .grid.grid-cols-2 {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .flex.items-center.justify-between {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .quorum-actions .flex.items-center.space-x-2 {
        justify-content: center;
    }
}

/* Animation for status changes */
.quorum-indicator {
    transition: all 0.3s ease;
}

.quorum-indicator.border-mun-green-300 {
    animation: success-pulse 1s ease-out;
}

.quorum-indicator.border-mun-red-300 {
    animation: warning-pulse 1s ease-out;
}

@keyframes success-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
}

@keyframes warning-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
}
</style>