<!-- frontend/src/components/shared/TimerDisplay.vue -->
<template>
    <div class="timer-display" :class="timerClasses">
        <!-- Timer Header -->
        <div class="flex items-center justify-between mb-2" v-if="showHeader">
            <div class="flex items-center space-x-2">
                <ClockIcon class="w-4 h-4" :class="iconColorClass" />
                <span class="text-sm font-medium" :class="headerTextClass">
                    {{ timerTitle }}
                </span>
            </div>

            <!-- Timer Status Badge -->
            <div class="flex items-center space-x-2">
                <span v-if="isExtended"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Extended
                </span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="statusBadgeClass">
                    {{ statusText }}
                </span>
            </div>
        </div>

        <!-- Main Timer Display -->
        <div class="timer-main" :class="mainDisplayClass">
            <!-- Digital Display -->
            <div class="text-center">
                <div class="timer-digits" :class="digitClass">
                    {{ formattedTime }}
                </div>

                <!-- Subtitle info -->
                <div v-if="subtitle" class="text-sm mt-1" :class="subtitleClass">
                    {{ subtitle }}
                </div>
            </div>

            <!-- Circular Progress (if enabled) -->
            <div v-if="showProgress" class="mt-4 flex justify-center">
                <div class="relative w-20 h-20">
                    <svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 84 84">
                        <!-- Background circle -->
                        <circle cx="42" cy="42" r="38" stroke="currentColor" stroke-width="6" fill="none"
                            class="text-mun-gray-200" />
                        <!-- Progress circle -->
                        <circle cx="42" cy="42" r="38" stroke="currentColor" stroke-width="6" fill="none"
                            :stroke-dasharray="circumference" :stroke-dashoffset="strokeDashoffset"
                            :class="progressColorClass" class="transition-all duration-1000 ease-linear" />
                    </svg>

                    <!-- Center percentage -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-xs font-medium" :class="progressTextClass">
                            {{ Math.round(progressPercentage) }}%
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Timer Controls (if controllable) -->
        <div v-if="showControls && canControl" class="timer-controls mt-4 flex justify-center space-x-2">
            <!-- Start/Resume -->
            <button v-if="!isRunning" @click="$emit('start')"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                :disabled="remainingTime <= 0">
                <PlayIcon class="w-3 h-3 mr-1" />
                {{ isPaused ? 'Resume' : 'Start' }}
            </button>

            <!-- Pause -->
            <button v-if="isRunning" @click="$emit('pause')"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
                <PauseIcon class="w-3 h-3 mr-1" />
                Pause
            </button>

            <!-- Stop -->
            <button v-if="isRunning || isPaused" @click="$emit('stop')"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                <StopIcon class="w-3 h-3 mr-1" />
                Stop
            </button>

            <!-- Extend (if allowed) -->
            <button v-if="allowExtension && !isExtended && (isRunning || isPaused)" @click="$emit('extend')"
                class="inline-flex items-center px-3 py-1.5 border border-mun-gray-300 text-xs font-medium rounded-md text-mun-gray-700 bg-white hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                <PlusIcon class="w-3 h-3 mr-1" />
                Extend
            </button>
        </div>

        <!-- Warning indicators -->
        <div v-if="showWarnings" class="timer-warnings mt-2">
            <!-- Time running out warning -->
            <div v-if="isLowTime && isRunning"
                class="flex items-center justify-center space-x-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                <ExclamationTriangleIcon class="w-4 h-4" />
                <span class="text-xs font-medium">Time running low</span>
            </div>

            <!-- Time expired warning -->
            <div v-if="isExpired"
                class="flex items-center justify-center space-x-2 text-red-700 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                <XCircleIcon class="w-4 h-4" />
                <span class="text-xs font-medium">Time expired</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import {
    ClockIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    XCircleIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    // Timer data
    remainingTime: {
        type: Number,
        default: 0
    },
    totalTime: {
        type: Number,
        default: 0
    },
    isRunning: {
        type: Boolean,
        default: false
    },
    isPaused: {
        type: Boolean,
        default: false
    },

    // Display options
    title: {
        type: String,
        default: 'Timer'
    },
    subtitle: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: 'medium', // small, medium, large
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    variant: {
        type: String,
        default: 'default', // default, session, speaker, warning, danger
        validator: (value) => ['default', 'session', 'speaker', 'warning', 'danger'].includes(value)
    },

    // Features
    showHeader: {
        type: Boolean,
        default: true
    },
    showProgress: {
        type: Boolean,
        default: false
    },
    showControls: {
        type: Boolean,
        default: false
    },
    showWarnings: {
        type: Boolean,
        default: true
    },

    // Control permissions
    canControl: {
        type: Boolean,
        default: false
    },
    allowExtension: {
        type: Boolean,
        default: false
    },
    isExtended: {
        type: Boolean,
        default: false
    },

    // Thresholds
    warningThreshold: {
        type: Number,
        default: 30 // seconds
    },
    dangerThreshold: {
        type: Number,
        default: 10 // seconds
    }
})

// Emits
const emit = defineEmits(['start', 'pause', 'stop', 'extend', 'expired'])

// State
const localTime = ref(props.remainingTime)

// Watch for prop changes
watch(() => props.remainingTime, (newTime) => {
    localTime.value = newTime
}, { immediate: true })

// Computed
const timerTitle = computed(() => {
    if (props.variant === 'session') return 'Session Timer'
    if (props.variant === 'speaker') return 'Speaker Timer'
    return props.title
})

const formattedTime = computed(() => {
    const time = Math.max(0, localTime.value)
    const minutes = Math.floor(time / 60)
    const seconds = time % 60

    if (props.size === 'large') {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const progressPercentage = computed(() => {
    if (props.totalTime === 0) return 0
    return Math.max(0, (localTime.value / props.totalTime) * 100)
})

const circumference = computed(() => 2 * Math.PI * 38) // radius = 38

const strokeDashoffset = computed(() => {
    const progress = progressPercentage.value / 100
    return circumference.value * (1 - progress)
})

const isLowTime = computed(() => {
    return localTime.value <= props.warningThreshold && localTime.value > props.dangerThreshold
})

const isDangerTime = computed(() => {
    return localTime.value <= props.dangerThreshold && localTime.value > 0
})

const isExpired = computed(() => {
    return localTime.value <= 0 && props.totalTime > 0
})

// Style classes
const timerClasses = computed(() => {
    const base = 'timer-display rounded-lg border transition-all duration-300'
    const sizeClasses = {
        small: 'p-3',
        medium: 'p-4',
        large: 'p-6'
    }

    const variantClasses = {
        default: 'bg-white border-mun-gray-200',
        session: 'bg-mun-blue-50 border-mun-blue-200',
        speaker: 'bg-green-50 border-green-200',
        warning: 'bg-amber-50 border-amber-200',
        danger: 'bg-red-50 border-red-200'
    }

    let variant = props.variant
    if (isDangerTime.value) variant = 'danger'
    else if (isLowTime.value) variant = 'warning'

    return `${base} ${sizeClasses[props.size]} ${variantClasses[variant]}`
})

const digitClass = computed(() => {
    const sizeClasses = {
        small: 'text-2xl',
        medium: 'text-4xl',
        large: 'text-6xl'
    }

    const colorClasses = {
        default: 'text-mun-gray-900',
        session: 'text-mun-blue-700',
        speaker: 'text-green-700',
        warning: 'text-amber-700',
        danger: 'text-red-700'
    }

    let variant = props.variant
    if (isDangerTime.value) variant = 'danger'
    else if (isLowTime.value) variant = 'warning'

    return `font-mono font-bold ${sizeClasses[props.size]} ${colorClasses[variant]}`
})

const iconColorClass = computed(() => {
    if (isDangerTime.value) return 'text-red-500'
    if (isLowTime.value) return 'text-amber-500'
    if (props.variant === 'session') return 'text-mun-blue-500'
    if (props.variant === 'speaker') return 'text-green-500'
    return 'text-mun-gray-500'
})

const headerTextClass = computed(() => {
    if (isDangerTime.value) return 'text-red-700'
    if (isLowTime.value) return 'text-amber-700'
    if (props.variant === 'session') return 'text-mun-blue-700'
    if (props.variant === 'speaker') return 'text-green-700'
    return 'text-mun-gray-700'
})

const subtitleClass = computed(() => {
    if (isDangerTime.value) return 'text-red-600'
    if (isLowTime.value) return 'text-amber-600'
    if (props.variant === 'session') return 'text-mun-blue-600'
    if (props.variant === 'speaker') return 'text-green-600'
    return 'text-mun-gray-600'
})

const statusBadgeClass = computed(() => {
    if (props.isRunning) return 'bg-green-100 text-green-800'
    if (props.isPaused) return 'bg-amber-100 text-amber-800'
    if (isExpired.value) return 'bg-red-100 text-red-800'
    return 'bg-mun-gray-100 text-mun-gray-800'
})

const statusText = computed(() => {
    if (isExpired.value) return 'Expired'
    if (props.isRunning) return 'Running'
    if (props.isPaused) return 'Paused'
    return 'Stopped'
})

const mainDisplayClass = computed(() => {
    if (props.size === 'large') return 'timer-main-large'
    if (props.size === 'small') return 'timer-main-small'
    return 'timer-main-medium'
})

const progressColorClass = computed(() => {
    if (isDangerTime.value) return 'text-red-500'
    if (isLowTime.value) return 'text-amber-500'
    if (props.variant === 'session') return 'text-mun-blue-500'
    if (props.variant === 'speaker') return 'text-green-500'
    return 'text-mun-blue-500'
})

const progressTextClass = computed(() => {
    if (isDangerTime.value) return 'text-red-700'
    if (isLowTime.value) return 'text-amber-700'
    return 'text-mun-gray-700'
})

// Lifecycle
let intervalId = null

onMounted(() => {
    // Check for expiration
    if (isExpired.value && props.isRunning) {
        emit('expired')
    }
})

onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId)
    }
})

// Watch for expiration
watch(isExpired, (expired) => {
    if (expired && props.isRunning) {
        emit('expired')
    }
})
</script>

<style scoped>
.timer-display {
    min-width: fit-content;
}

.timer-main-small {
    min-height: 60px;
}

.timer-main-medium {
    min-height: 80px;
}

.timer-main-large {
    min-height: 120px;
}

.timer-digits {
    letter-spacing: 0.05em;
    text-shadow: 0 0 10px currentColor;
}
</style>