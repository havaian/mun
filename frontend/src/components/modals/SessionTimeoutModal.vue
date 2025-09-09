<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="showWarning"
                class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300"
                    :class="{ 'animate-pulse': timeRemaining <= 30 }">

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
                                                timeRemaining <= 60 ? 'text-mun-yellow-600' : 'text-mun-gray-900'
                                        ]">
                                            {{ formatTime(timeRemaining) }}
                                        </div>
                                        <div class="text-xs text-mun-gray-500 mt-1">
                                            remaining
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <p class="text-mun-gray-800 font-medium">
                                    Your session will expire due to inactivity
                                </p>
                                <p class="text-sm text-mun-gray-600">
                                    Click "Stay Logged In" to continue your session, or you'll be automatically logged
                                    out.
                                </p>
                            </div>
                        </div>

                        <!-- Warning Message -->
                        <div v-if="timeRemaining <= 30"
                            class="bg-mun-red-50 border border-mun-red-200 rounded-xl p-4 mb-6">
                            <div class="flex items-center space-x-2">
                                <ExclamationTriangleIcon class="w-5 h-5 text-mun-red-600 flex-shrink-0" />
                                <p class="text-sm text-mun-red-800 font-medium">
                                    Critical: Session expires in {{ timeRemaining }} seconds!
                                </p>
                            </div>
                        </div>

                        <!-- Activity Info -->
                        <div class="bg-mun-gray-50 rounded-xl p-4 mb-6">
                            <div class="flex items-start space-x-3">
                                <InformationCircleIcon class="w-5 h-5 text-mun-gray-600 flex-shrink-0 mt-0.5" />
                                <div class="text-sm text-mun-gray-700">
                                    <p class="font-medium mb-1">Session Information</p>
                                    <p>Last activity: {{ formatLastActivity() }}</p>
                                    <p>Session started: {{ formatSessionStart() }}</p>
                                    <p class="mt-2 text-xs text-mun-gray-600">
                                        For security, sessions expire after {{ sessionTimeoutMinutes }} minutes of
                                        inactivity.
                                    </p>
                                </div>
                            </div>
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
    InformationCircleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const toast = useToast()

// State
const showWarning = ref(false)
const timeRemaining = ref(300) // 5 minutes in seconds
const isExtending = ref(false)
const countdownInterval = ref(null)

// Configuration
const sessionTimeoutMinutes = ref(30)
const warningTimeMinutes = ref(5)

// Computed
const circumference = computed(() => 2 * Math.PI * 15.9155)

const strokeDashoffset = computed(() => {
    const progress = timeRemaining.value / (warningTimeMinutes.value * 60)
    return circumference.value * (1 - progress)
})

// Methods
const startSessionMonitoring = () => {
    // Check session status every minute
    const checkInterval = setInterval(() => {
        if (!authStore.isAuthenticated) {
            clearInterval(checkInterval)
            return
        }

        const timeoutDuration = sessionTimeoutMinutes.value * 60 * 1000 // 30 minutes
        const warningDuration = warningTimeMinutes.value * 60 * 1000 // 5 minutes
        const now = Date.now()
        const timeSinceActivity = now - authStore.lastActivity

        // Show warning if approaching timeout
        if (timeSinceActivity >= timeoutDuration - warningDuration && !showWarning.value) {
            showSessionWarning()
        }

        // Auto logout if session expired
        if (timeSinceActivity >= timeoutDuration) {
            handleSessionExpiry()
        }
    }, 60000) // Check every minute

    // Return cleanup function
    return () => clearInterval(checkInterval)
}

const showSessionWarning = () => {
    showWarning.value = true
    authStore.sessionWarningShown = true

    // Calculate initial time remaining
    const timeoutDuration = sessionTimeoutMinutes.value * 60 * 1000
    const now = Date.now()
    const timeSinceActivity = now - authStore.lastActivity
    const timeUntilExpiry = timeoutDuration - timeSinceActivity

    timeRemaining.value = Math.max(0, Math.floor(timeUntilExpiry / 1000))

    // Start countdown
    startCountdown()

    // Play warning sound (optional)
    playWarningSound()
}

const startCountdown = () => {
    if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
    }

    countdownInterval.value = setInterval(() => {
        timeRemaining.value--

        if (timeRemaining.value <= 0) {
            handleSessionExpiry()
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

        // Update last activity time
        authStore.updateActivity()

        // Validate session with backend
        const isValid = await authStore.validateSession()

        if (isValid) {
            hideWarning()
            toast.success('Session extended successfully')
        } else {
            throw new Error('Session validation failed')
        }

    } catch (error) {
        console.error('Session extension error:', error)
        toast.error('Failed to extend session')
        handleSessionExpiry()
    } finally {
        isExtending.value = false
    }
}

const logoutNow = () => {
    hideWarning()
    authStore.logout(true)
}

const handleSessionExpiry = () => {
    hideWarning()
    authStore.logout(false)
    toast.error('Session expired due to inactivity')
}

const hideWarning = () => {
    showWarning.value = false
    authStore.sessionWarningShown = false
    stopCountdown()
}

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatLastActivity = () => {
    const now = Date.now()
    const diff = now - authStore.lastActivity
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
        return 'Less than a minute ago'
    } else if (minutes === 1) {
        return '1 minute ago'
    } else {
        return `${minutes} minutes ago`
    }
}

const formatSessionStart = () => {
    // This would need to be tracked when user logs in
    // For now, we'll estimate based on token creation time
    const sessionStart = new Date(authStore.lastActivity - (20 * 60 * 1000)) // Assume 20 mins ago
    return sessionStart.toLocaleTimeString()
}

const getProgressColorClass = () => {
    if (timeRemaining.value <= 30) {
        return 'stroke-mun-red-500'
    } else if (timeRemaining.value <= 60) {
        return 'stroke-mun-yellow-500'
    } else {
        return 'stroke-un-blue'
    }
}

const playWarningSound = () => {
    // Create a subtle warning sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
        console.warn('Could not play warning sound:', error)
    }
}

// Handle user activity to reset warning
const handleUserActivity = () => {
    if (showWarning.value) {
        // User is active, extend the warning time
        const timeoutDuration = sessionTimeoutMinutes.value * 60 * 1000
        const warningDuration = warningTimeMinutes.value * 60 * 1000
        const now = Date.now()

        authStore.updateActivity()

        // Recalculate time remaining
        const timeSinceActivity = now - authStore.lastActivity
        const timeUntilExpiry = timeoutDuration - timeSinceActivity
        timeRemaining.value = Math.max(0, Math.floor(timeUntilExpiry / 1000))

        // If user activity reset the timeout, hide warning
        if (timeUntilExpiry > warningDuration) {
            hideWarning()
        }
    }
}

// Lifecycle hooks
onMounted(() => {
    // Start session monitoring
    const cleanup = startSessionMonitoring()

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity, true)
    })

    // Cleanup on unmount
    onUnmounted(() => {
        cleanup()
        stopCountdown()

        activityEvents.forEach(event => {
            document.removeEventListener(event, handleUserActivity, true)
        })
    })
})

// Watch for auth state changes
watch(() => authStore.isAuthenticated, (newVal) => {
    if (!newVal) {
        hideWarning()
    }
})

// Expose for external triggering if needed
defineExpose({
    showSessionWarning,
    hideWarning,
    extendSession
})
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
}

.modal-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
}

/* Pulse animation for critical state */
@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }

    50% {
        transform: scale(1.02);
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
}

.animate-pulse {
    animation: pulse 2s infinite;
}

/* Progress circle styling */
.stroke-transition {
    transition: stroke-dashoffset 1s ease-in-out;
}
</style>