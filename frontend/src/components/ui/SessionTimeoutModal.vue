<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="showWarning"
                class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300"
                    :class="{ 'animate-pulse-subtle': timeRemaining <= 30 }">

                    <!-- Header -->
                    <div class="flex items-center space-x-3 p-6 border-b border-mun-gray-100">
                        <div class="w-12 h-12 bg-mun-yellow-100 rounded-full flex items-center justify-center">
                            <ClockIcon class="w-6 h-6 text-mun-yellow-600" />
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-mun-gray-900">
                                Session Timeout Warning
                            </h3>
                            <p class="text-sm text-mun-gray-600">
                                Your session will expire soon
                            </p>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-6">
                        <!-- Countdown Display -->
                        <div class="text-center mb-6">
                            <div class="relative w-24 h-24 mx-auto mb-4">
                                <!-- Circular Progress -->
                                <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                                    <!-- Background circle -->
                                    <path class="stroke-mun-gray-200" stroke-width="3" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <!-- Progress circle -->
                                    <path :class="getProgressColorClass()" stroke-width="3" fill="none"
                                        stroke-linecap="round" :stroke-dasharray="circumference"
                                        :stroke-dashoffset="strokeDashoffset"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        style="transition: stroke-dashoffset 1s ease-in-out" />
                                </svg>

                                <!-- Time Display -->
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="text-center">
                                        <div :class="[
                                            'text-2xl font-bold',
                                            timeRemaining <= 30 ? 'text-mun-red-600' :
                                                timeRemaining <= 60 ? 'text-mun-yellow-600' : 'text-mun-gray-700'
                                        ]">
                                            {{ format.time(timeRemaining) }}
                                        </div>
                                        <div class="text-xs text-mun-gray-500 mt-1">
                                            remaining
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Warning Message -->
                            <div class="space-y-2">
                                <p class="text-mun-gray-700 font-medium">
                                    {{ getWarningMessage() }}
                                </p>
                                <p class="text-sm text-mun-gray-500">
                                    {{ getDescriptionMessage() }}
                                </p>
                            </div>
                        </div>

                        <!-- Session Info -->
                        <div class="bg-mun-gray-50 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-mun-gray-600">Session Duration:</span>
                                <span class="font-medium text-mun-gray-900">
                                    {{ formatSessionDuration() }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between text-sm mt-2">
                                <span class="text-mun-gray-600">Last Activity:</span>
                                <span class="font-medium text-mun-gray-900">
                                    {{ formatLastActivity() }}
                                </span>
                            </div>
                        </div>

                        <!-- Auto-logout warning -->
                        <div v-if="timeRemaining <= 60"
                            class="flex items-center space-x-2 p-3 bg-mun-red-50 rounded-lg border border-mun-red-200">
                            <ExclamationTriangleIcon class="w-5 h-5 text-mun-red-500 flex-shrink-0" />
                            <p class="text-sm text-mun-red-700">
                                <strong>Auto-logout in {{ timeRemaining }}s</strong> - You will be automatically signed
                                out if no action is taken.
                            </p>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex space-x-3 p-6 bg-mun-gray-50 rounded-b-2xl">
                        <AppButton variant="primary" size="lg" @click="extendSession" :loading="isExtending"
                            class="flex-1">
                            <ClockIcon class="w-5 h-5 mr-2" />
                            Stay Logged In
                        </AppButton>

                        <AppButton variant="outline" size="lg" @click="logoutNow" :disabled="isExtending"
                            class="flex-1">
                            <ArrowRightOnRectangleIcon class="w-5 h-5 mr-2" />
                            Logout Now
                        </AppButton>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import {
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import format from '@/utils/time'

const authStore = useAuthStore()
const toast = useToast()

// Props
const props = defineProps({
    warningMinutes: {
        type: Number,
        default: 5
    },
    sessionMinutes: {
        type: Number,
        default: 30
    }
})

// State
const showWarning = ref(false)
const timeRemaining = ref(300) // 5 minutes in seconds
const isExtending = ref(false)
const countdownInterval = ref(null)
const sessionStartTime = ref(Date.now())
const lastActivityTime = ref(Date.now())

// Computed
const circumference = computed(() => 2 * Math.PI * 15.9155)

const strokeDashoffset = computed(() => {
    const progress = timeRemaining.value / (props.warningMinutes * 60)
    return circumference.value * (1 - progress)
})

const formatSessionDuration = () => {
    const duration = Math.floor((Date.now() - sessionStartTime.value) / 1000 / 60)
    return `${duration} minutes`
}

const formatLastActivity = () => {
    const secondsAgo = Math.floor((Date.now() - lastActivityTime.value) / 1000)
    if (secondsAgo < 60) {
        return `${secondsAgo}s ago`
    }
    const minutesAgo = Math.floor(secondsAgo / 60)
    return `${minutesAgo}m ago`
}

const getProgressColorClass = () => {
    if (timeRemaining.value <= 30) return 'stroke-mun-red-500'
    if (timeRemaining.value <= 60) return 'stroke-mun-yellow-500'
    return 'stroke-mun-blue'
}

const getWarningMessage = () => {
    if (timeRemaining.value <= 30) {
        return 'Critical: Session expires very soon!'
    }
    if (timeRemaining.value <= 60) {
        return 'Warning: Session expires in 1 minute'
    }
    return 'Your session will expire soon'
}

const getDescriptionMessage = () => {
    if (timeRemaining.value <= 30) {
        return 'Take action immediately to avoid losing your work.'
    }
    if (timeRemaining.value <= 60) {
        return 'Click "Stay Logged In" to continue your session.'
    }
    return 'You can extend your session or logout safely.'
}

const startCountdown = () => {
    if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
    }

    countdownInterval.value = setInterval(() => {
        timeRemaining.value--

        if (timeRemaining.value <= 0) {
            // Force logout
            handleAutoLogout()
        }
    }, 1000)
}

const stopCountdown = () => {
    if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
        countdownInterval.value = null
    }
}

const extendSession = async () => {
    try {
        isExtending.value = true

        // Call API to extend session
        const response = await authStore.extendSession()

        if (response.success) {
            // Update last activity time
            lastActivityTime.value = Date.now()

            // Hide warning
            hide()

            toast.success('Session extended successfully')
        } else {
            throw new Error('Failed to extend session')
        }

    } catch (error) {
        toast.error('Failed to extend session:', error)
        toast.error('Failed to extend session. Please log in again.')

        // Force logout on extension failure
        handleAutoLogout()

    } finally {
        isExtending.value = false
    }
}

const logoutNow = () => {
    hide()
    authStore.logout(true)
    toast.log('You have been logged out')
}

const handleAutoLogout = () => {
    hide()
    authStore.logout(true)
    toast.warn('Session expired. Please log in again.')
}

// Public methods for external use
const show = (remainingSeconds = props.warningMinutes * 60) => {
    timeRemaining.value = remainingSeconds
    showWarning.value = true
    startCountdown()
}

const hide = () => {
    showWarning.value = false
    stopCountdown()
}

const updateActivity = () => {
    lastActivityTime.value = Date.now()
}

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
        hide()
    }
})

// Cleanup on unmount
onUnmounted(() => {
    stopCountdown()
})

// Activity monitoring
onMounted(() => {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const updateActivityThrottled = (() => {
        let lastUpdate = 0
        return () => {
            const now = Date.now()
            if (now - lastUpdate > 5000) { // Throttle to once per 5 seconds
                updateActivity()
                lastUpdate = now
            }
        }
    })()

    activityEvents.forEach(event => {
        document.addEventListener(event, updateActivityThrottled, { passive: true })
    })

    // Store cleanup function
    const cleanup = () => {
        activityEvents.forEach(event => {
            document.removeEventListener(event, updateActivityThrottled)
        })
    }

    // Return cleanup for component unmount
    onUnmounted(cleanup)
})

// Expose methods for external use
defineExpose({
    show,
    hide,
    updateActivity
})
</script>

<style scoped>
/* Subtle pulse animation for critical state */
@keyframes pulse-subtle {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.95;
    }
}

.animate-pulse-subtle {
    animation: pulse-subtle 2s ease-in-out infinite;
}

/* Progress circle animation */
.stroke-mun-red-500,
.stroke-mun-yellow-500,
.stroke-mun-blue {
    transition: stroke 0.3s ease;
}

/* Ensure modal stays on top */
.z-\[9999\] {
    z-index: 9999;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .bg-white {
        border: 2px solid #000;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .animate-pulse-subtle {
        animation: none;
    }

    .transform.-rotate-90 {
        transition: none;
    }
}
</style>