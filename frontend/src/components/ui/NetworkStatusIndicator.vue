<template>
    <teleport to="body">
        <!-- Offline Banner -->
        <transition name="slide-down">
            <div v-if="isOffline" class="fixed top-0 left-0 right-0 z-50 bg-mun-red-600 text-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <WifiIcon class="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <div>
                                <p class="font-medium text-sm">No Internet Connection</p>
                                <p class="text-xs text-mun-red-100">
                                    Some features may not work properly. Trying to reconnect...
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-4">
                            <div v-if="reconnectAttempts > 0" class="text-xs text-mun-red-100">
                                Attempt {{ reconnectAttempts }}
                            </div>
                            <button @click="checkConnection" :disabled="isChecking"
                                class="text-xs font-medium text-white hover:text-mun-red-100 focus:outline-none focus:underline disabled:opacity-50 transition-colors">
                                <ArrowPathIcon v-if="isChecking" class="w-4 h-4 animate-spin" />
                                <span v-else>Retry</span>
                            </button>
                        </div>
                    </div>

                    <!-- Progress Bar for Auto-retry -->
                    <div v-if="showProgress" class="mt-2">
                        <div class="w-full bg-mun-red-700 rounded-full h-1">
                            <div class="bg-white h-1 rounded-full transition-all duration-1000 ease-linear"
                                :style="{ width: `${progressPercentage}%` }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Connection Restored Toast -->
        <transition name="slide-up">
            <div v-if="showReconnectedToast"
                class="fixed bottom-4 right-4 z-50 bg-mun-green-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
                <div class="flex items-center space-x-3">
                    <CheckCircleIcon class="w-6 h-6 text-white flex-shrink-0" />
                    <div>
                        <p class="font-medium text-sm">Connection Restored</p>
                        <p class="text-xs text-mun-green-100">You're back online!</p>
                    </div>
                    <button @click="hideReconnectedToast"
                        class="text-mun-green-100 hover:text-white focus:outline-none transition-colors">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </transition>

        <!-- Poor Connection Warning -->
        <transition name="slide-up">
            <div v-if="showSlowConnectionWarning"
                class="fixed bottom-4 left-4 z-50 bg-mun-yellow-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
                <div class="flex items-center space-x-3">
                    <ExclamationTriangleIcon class="w-6 h-6 text-white flex-shrink-0" />
                    <div>
                        <p class="font-medium text-sm">Slow Connection</p>
                        <p class="text-xs text-mun-yellow-100">
                            Network is slow. Some features may be delayed.
                        </p>
                    </div>
                    <button @click="hideSlowConnectionWarning"
                        class="text-mun-yellow-100 hover:text-white focus:outline-none transition-colors">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </transition>

        <!-- Network Info Debug Panel (Development) -->
        <div v-if="showDebugInfo && isDevelopment"
            class="fixed top-20 right-4 z-40 bg-black/80 text-white rounded-lg p-3 text-xs font-mono max-w-xs">
            <div class="space-y-1">
                <div class="flex justify-between">
                    <span>Status:</span>
                    <span :class="isOnline ? 'text-green-400' : 'text-red-400'">
                        {{ isOnline ? 'Online' : 'Offline' }}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span>Type:</span>
                    <span class="text-blue-400">{{ connectionType || 'Unknown' }}</span>
                </div>
                <div class="flex justify-between">
                    <span>Speed:</span>
                    <span class="text-yellow-400">{{ connectionSpeed || 'Unknown' }}</span>
                </div>
                <div class="flex justify-between">
                    <span>RTT:</span>
                    <span class="text-purple-400">{{ roundTripTime }}ms</span>
                </div>
                <div class="flex justify-between">
                    <span>Attempts:</span>
                    <span class="text-orange-400">{{ reconnectAttempts }}</span>
                </div>
                <button @click="showDebugInfo = false" class="text-gray-400 hover:text-white mt-2 w-full text-left">
                    Hide Debug
                </button>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import { apiMethods } from '@/utils/api'
import {
    WifiIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

const appStore = useAppStore()
const wsStore = useWebSocketStore()

// State
const isOnline = ref(navigator.onLine)
const isChecking = ref(false)
const reconnectAttempts = ref(0)
const showReconnectedToast = ref(false)
const showSlowConnectionWarning = ref(false)
const showProgress = ref(false)
const progressPercentage = ref(0)
const showDebugInfo = ref(false)

// Connection info
const connectionType = ref('')
const connectionSpeed = ref('')
const roundTripTime = ref(0)

// Timers
const retryTimer = ref(null)
const progressTimer = ref(null)
const toastTimer = ref(null)
const speedTestTimer = ref(null)

// Configuration
const maxRetryAttempts = 5
const retryInterval = 5000 // 5 seconds
const progressDuration = retryInterval
const toastDuration = 4000
const speedTestInterval = 30000 // 30 seconds

// Environment
const isDevelopment = import.meta.env.DEV

// Computed
const isOffline = computed(() => !isOnline.value)

// Methods
const checkConnection = async () => {
    if (isChecking.value) return

    isChecking.value = true

    try {
        const startTime = Date.now()

        // Use the proper API method instead of fetch
        const response = await apiMethods.health.check()

        const endTime = Date.now()
        roundTripTime.value = endTime - startTime

        if (response?.data) {
            handleConnectionRestored()
        } else {
            throw new Error('Health check failed')
        }

    } catch (error) {
        toast.warn('Connection check failed:', error)

        if (!isOffline.value) {
            // Browser thinks we're online but API is unreachable
            handleConnectionLost()
        }

        scheduleRetry()

    } finally {
        isChecking.value = false
    }
}

const handleConnectionLost = () => {
    isOnline.value = false
    appStore.setNetworkStatus('offline')

    // Start retry mechanism
    scheduleRetry()

    // Disconnect WebSocket
    if (wsStore.isConnected) {
        wsStore.disconnect()
    }
}

const handleConnectionRestored = () => {
    const wasOffline = isOffline.value

    isOnline.value = true
    appStore.setNetworkStatus('online')

    // Reset retry attempts
    reconnectAttempts.value = 0
    clearRetryTimer()

    // Show success toast if we were offline
    if (wasOffline) {
        showReconnectedToast.value = true
        toastTimer.value = setTimeout(() => {
            hideReconnectedToast()
        }, toastDuration)

        // Reconnect WebSocket if authenticated
        if (wsStore.shouldConnect) {
            wsStore.connect()
        }
    }
}

const scheduleRetry = () => {
    if (reconnectAttempts.value >= maxRetryAttempts) {
        toast.warn('Max retry attempts reached')
        return
    }

    clearRetryTimer()

    reconnectAttempts.value++
    showProgress.value = true
    progressPercentage.value = 0

    // Animate progress bar
    progressTimer.value = setInterval(() => {
        progressPercentage.value += (100 / (progressDuration / 100))
        if (progressPercentage.value >= 100) {
            clearInterval(progressTimer.value)
            showProgress.value = false
            progressPercentage.value = 0
        }
    }, 100)

    // Schedule retry
    retryTimer.value = setTimeout(() => {
        checkConnection()
    }, retryInterval)
}

const clearRetryTimer = () => {
    if (retryTimer.value) {
        clearTimeout(retryTimer.value)
        retryTimer.value = null
    }

    if (progressTimer.value) {
        clearInterval(progressTimer.value)
        progressTimer.value = null
    }

    showProgress.value = false
    progressPercentage.value = 0
}

const hideReconnectedToast = () => {
    showReconnectedToast.value = false
    if (toastTimer.value) {
        clearTimeout(toastTimer.value)
        toastTimer.value = null
    }
}

const hideSlowConnectionWarning = () => {
    showSlowConnectionWarning.value = false
}

const detectConnectionInfo = () => {
    // Get connection information if available
    if ('connection' in navigator) {
        const connection = navigator.connection
        connectionType.value = connection.effectiveType || 'unknown'
        connectionSpeed.value = connection.downlink ? `${connection.downlink}Mbps` : 'unknown'

        // Show slow connection warning for 2G or slow-2g
        if (['slow-2g', '2g'].includes(connection.effectiveType)) {
            showSlowConnectionWarning.value = true
        }
    }
}

const performSpeedTest = async () => {
    if (isOffline.value) return

    try {
        const startTime = Date.now()

        // Use API method for speed test instead of fetch
        await apiMethods.health.check()

        const endTime = Date.now()
        roundTripTime.value = endTime - startTime

        // Consider connection slow if RTT > 1000ms
        if (roundTripTime.value > 1000 && !showSlowConnectionWarning.value) {
            showSlowConnectionWarning.value = true
        }

    } catch (error) {
        // Speed test failed, might indicate connection issues
        toast.warn('Speed test failed:', error)
    }
}

// Event handlers
const handleOnline = () => {
    handleConnectionRestored()
}

const handleOffline = () => {
    handleConnectionLost()
}

const handleConnectionChange = () => {
    detectConnectionInfo()
}

// Lifecycle hooks
onMounted(() => {
    // Set initial state
    isOnline.value = navigator.onLine
    appStore.setNetworkStatus(isOnline.value ? 'online' : 'offline')

    // Detect initial connection info
    detectConnectionInfo()

    // Set up event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes
    if ('connection' in navigator) {
        navigator.connection.addEventListener('change', handleConnectionChange)
    }

    // Start periodic speed tests in development
    if (isDevelopment) {
        speedTestTimer.value = setInterval(performSpeedTest, speedTestInterval)
    }

    // Start retry mechanism if offline
    if (isOffline.value) {
        scheduleRetry()
    }
})

onUnmounted(() => {
    // Clean up event listeners
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)

    if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', handleConnectionChange)
    }

    // Clear timers
    clearRetryTimer()
    hideReconnectedToast()

    if (speedTestTimer.value) {
        clearInterval(speedTestTimer.value)
    }
})

// Watch for manual app store changes
watch(() => appStore.networkStatus, (status) => {
    if (status === 'online' && isOffline.value) {
        handleConnectionRestored()
    } else if (status === 'offline' && isOnline.value) {
        handleConnectionLost()
    }
})

// Expose debug toggle for development
if (isDevelopment) {
    window.toggleNetworkDebug = () => {
        showDebugInfo.value = !showDebugInfo.value
    }
}
</script>

<style scoped>
/* Slide down animation for offline banner */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from {
    transform: translateY(-100%);
    opacity: 0;
}

.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

/* Slide up animation for toasts */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

/* Ensure proper z-index stacking */
.z-50 {
    z-index: 50;
}

/* Smooth progress bar animation */
.transition-all {
    transition-property: width;
}

/* High contrast mode support */
@media (prefers-contrast: high) {

    .bg-mun-red-600,
    .bg-mun-green-600,
    .bg-mun-yellow-600 {
        border: 2px solid white;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {

    .slide-down-enter-active,
    .slide-down-leave-active,
    .slide-up-enter-active,
    .slide-up-leave-active {
        transition: none;
    }

    .animate-pulse,
    .animate-spin {
        animation: none;
    }
}

/* Focus styles for accessibility */
button:focus {
    outline: 2px solid white;
    outline-offset: 2px;
}

/* Custom pulse animation for offline icon */
@keyframes pulse-slow {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse-slow 2s ease-in-out infinite;
}
</style>