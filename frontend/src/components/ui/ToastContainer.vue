<template>
    <teleport to="body">
        <div class="toast-container fixed top-4 right-4 z-[9999] space-y-4 pointer-events-none">
            <transition-group name="toast" tag="div" class="space-y-4">
                <div v-for="toast in toasts" :key="toast.id"
                    class="toast-item pointer-events-auto relative max-w-sm w-full bg-white shadow-lg rounded-lg border overflow-hidden"
                    :class="getBorderClass(toast.type)" @mouseenter="pauseTimer(toast.id)"
                    @mouseleave="resumeTimer(toast.id)">
                    <div class="p-4">
                        <div class="flex items-start space-x-3">
                            <!-- Icon -->
                            <div class="flex-shrink-0">
                                <component :is="getIconComponent(toast.type)" :class="[
                                    'h-6 w-6',
                                    getIconClass(toast.type)
                                ]" />
                            </div>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1" v-if="toast.title">
                                    <h4 class="text-sm font-semibold text-gray-900">{{ toast.title }}</h4>
                                </div>
                                <p class="text-sm text-gray-700" :class="{ 'font-medium': !toast.title }">
                                    {{ toast.message }}
                                </p>

                                <!-- Action button -->
                                <div v-if="toast.action" class="mt-3">
                                    <button @click="handleAction(toast)" :class="[
                                        'text-sm font-medium rounded-md px-3 py-1.5 transition-colors',
                                        getActionButtonClass(toast.type)
                                    ]">
                                        {{ toast.action.label }}
                                    </button>
                                </div>
                            </div>

                            <!-- Close button -->
                            <div class="flex-shrink-0 flex" v-if="toast.closable !== false">
                                <button @click="removeToast(toast.id)"
                                    class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                    <span class="sr-only">Close</span>
                                    <XMarkIcon class="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <!-- Progress bar for timed toasts -->
                        <div v-if="toast.duration > 0 && toast.showProgress !== false" class="mt-3 -mb-1 -mx-4">
                            <div class="h-1 bg-gray-100">
                                <div :class="[
                                    'h-1 transition-all ease-linear',
                                    getProgressClasses(toast.type)
                                ]" :style="{
                                    width: `${Math.max(0, Math.min(100, currentProgress[toast.id] || 100))}%`,
                                    transitionDuration: toast.paused ? '0ms' : '100ms'
                                }"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition-group>
        </div>
    </teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

const { toast: toastService } = useToast()

// Access reactive toasts from the service
const toasts = computed(() => toastService.toasts)

// Reactive progress tracking and timeout management
const currentProgress = ref({})
const toastTimeouts = ref({})
const startTimes = ref({})

// Toast type configurations
const toastConfig = {
    success: {
        borderClass: 'border-l-4 border-green-400',
        iconComponent: CheckCircleIcon,
        iconClass: 'text-green-400',
        progressClass: 'bg-green-400',
        actionClass: 'bg-green-50 hover:bg-green-100 text-green-700'
    },
    error: {
        borderClass: 'border-l-4 border-red-400',
        iconComponent: ExclamationCircleIcon,
        iconClass: 'text-red-400',
        progressClass: 'bg-red-400',
        actionClass: 'bg-red-50 hover:bg-red-100 text-red-700'
    },
    warning: {
        borderClass: 'border-l-4 border-yellow-400',
        iconComponent: ExclamationTriangleIcon,
        iconClass: 'text-yellow-400',
        progressClass: 'bg-yellow-400',
        actionClass: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
    },
    info: {
        borderClass: 'border-l-4 border-blue-400',
        iconComponent: InformationCircleIcon,
        iconClass: 'text-blue-400',
        progressClass: 'bg-blue-400',
        actionClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
    }
}

// Helper functions for styling
const getBorderClass = (type) => toastConfig[type]?.borderClass || toastConfig.info.borderClass
const getIconComponent = (type) => toastConfig[type]?.iconComponent || toastConfig.info.iconComponent
const getIconClass = (type) => toastConfig[type]?.iconClass || toastConfig.info.iconClass
const getProgressClasses = (type) => toastConfig[type]?.progressClass || toastConfig.info.progressClass
const getActionButtonClass = (type) => toastConfig[type]?.actionClass || toastConfig.info.actionClass

// Fixed progress calculation - should decrease from 100 to 0
const calculateProgress = (toast) => {
    if (!toast.duration || toast.duration <= 0) return 100

    const now = Date.now()
    const startTime = startTimes.value[toast.id] || toast.timestamp
    const totalPausedTime = toast.totalPausedTime || 0
    const elapsed = now - startTime - totalPausedTime

    // If paused, don't update progress
    if (toast.paused) {
        return currentProgress.value[toast.id] || 100
    }

    // Calculate remaining progress (starts at 100%, decreases to 0%)
    const remainingProgress = Math.max(0, ((toast.duration - elapsed) / toast.duration) * 100)
    return remainingProgress
}

const removeToast = (id) => {
    // Clear any pending timeout
    if (toastTimeouts.value[id]) {
        clearTimeout(toastTimeouts.value[id])
        delete toastTimeouts.value[id]
    }

    // Clean up progress tracking
    delete currentProgress.value[id]
    delete startTimes.value[id]
    toastService.remove(id)
}

const handleAction = (toast) => {
    if (toast.action?.handler) {
        toast.action.handler()
    }

    // Auto-close toast after action unless specified otherwise
    if (toast.action?.keepOpen !== true) {
        removeToast(toast.id)
    }
}

const pauseTimer = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast && toast.duration > 0 && !toast.paused) {
        // Clear the existing timeout
        if (toastTimeouts.value[id]) {
            clearTimeout(toastTimeouts.value[id])
            delete toastTimeouts.value[id]
        }

        // Mark as paused and save current progress
        toast.paused = true
        toast.pausedAt = Date.now()

        // Save the current progress to maintain it while paused
        toast.pausedProgress = currentProgress.value[id]
    }
}

const resumeTimer = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast && toast.paused) {
        // Calculate how long we were paused
        const pauseDuration = Date.now() - (toast.pausedAt || 0)
        toast.totalPausedTime = (toast.totalPausedTime || 0) + pauseDuration

        // Resume the toast
        toast.paused = false
        toast.pausedAt = null

        // Calculate remaining time and set new timeout
        const startTime = startTimes.value[id] || toast.timestamp
        const elapsed = Date.now() - startTime - toast.totalPausedTime
        const remainingTime = Math.max(0, toast.duration - elapsed)

        if (remainingTime > 0) {
            toastTimeouts.value[id] = setTimeout(() => {
                removeToast(id)
            }, remainingTime)
        } else {
            // Time is up, remove immediately
            removeToast(id)
        }
    }
}

// Progress update interval
let progressInterval = null

const updateProgress = () => {
    toasts.value.forEach(toast => {
        if (toast.duration > 0 && !toast.paused) {
            const progress = calculateProgress(toast)
            currentProgress.value[toast.id] = progress

            // Auto-remove when progress reaches 0
            if (progress <= 0) {
                removeToast(toast.id)
            }
        }
    })
}

// Initialize new toasts with proper timeout management
const initializeToast = (toast) => {
    if (toast.duration > 0) {
        // Set initial progress to 100%
        currentProgress.value[toast.id] = 100
        startTimes.value[toast.id] = Date.now()

        // Initialize pause tracking properties
        toast.paused = false
        toast.totalPausedTime = 0
        toast.pausedAt = null
        toast.pausedProgress = null

        // Set up auto-removal timeout
        toastTimeouts.value[toast.id] = setTimeout(() => {
            removeToast(toast.id)
        }, toast.duration)
    }
}

// Watch for new toasts
watch(toasts, (newToasts, oldToasts) => {
    // Initialize new toasts
    newToasts.forEach(toast => {
        if (!(toast.id in currentProgress.value)) {
            initializeToast(toast)
        }
    })

    // Clean up removed toasts
    if (oldToasts) {
        const currentIds = new Set(newToasts.map(t => t.id))
        Object.keys(currentProgress.value).forEach(id => {
            const numericId = parseInt(id)
            if (!currentIds.has(numericId)) {
                // Clear timeout if exists
                if (toastTimeouts.value[id]) {
                    clearTimeout(toastTimeouts.value[id])
                    delete toastTimeouts.value[id]
                }
                delete currentProgress.value[id]
                delete startTimes.value[id]
            }
        })
    }
}, { immediate: true })

onMounted(() => {
    // Update progress bars every 50ms for smooth animation
    progressInterval = setInterval(updateProgress, 50)
})

onUnmounted(() => {
    if (progressInterval) {
        clearInterval(progressInterval)
    }

    // Clear all timeouts
    Object.values(toastTimeouts.value).forEach(timeout => {
        clearTimeout(timeout)
    })
    toastTimeouts.value = {}
    currentProgress.value = {}
    startTimes.value = {}
})
</script>

<style scoped>
/* Toast animations - avoiding transform: scale per user preference */
.toast-enter-active {
    transition: all 0.3s ease-out;
}

.toast-leave-active {
    transition: all 0.3s ease-in;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

.toast-move {
    transition: transform 0.3s ease;
}

/* Ensure proper spacing in transition group */
.space-y-4>*+* {
    margin-top: 1rem;
}

/* Hover effects - avoiding transform: scale as per user preference */
.toast-item {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toast-item:hover {
    transform: translateX(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Custom scrollbar for container if needed */
.toast-container::-webkit-scrollbar {
    width: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .toast-container {
        left: 1rem;
        right: 1rem;
        top: 1rem;
    }

    .toast-item {
        max-width: calc(100vw - 2rem);
        width: auto;
    }

    /* Maintain spacing on mobile */
    .space-y-4>*+* {
        margin-top: 0.75rem;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .toast-item {
        border: 2px solid;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {

    .toast-enter-active,
    .toast-leave-active,
    .toast-move {
        transition: none;
    }

    .toast-item:hover {
        transform: none;
    }
}
</style>