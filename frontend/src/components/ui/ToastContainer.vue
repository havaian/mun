<template>
    <teleport to="body">
        <div class="toast-container fixed top-4 right-4 z-50 space-y-2">
            <transition-group name="toast" tag="div" class="space-y-2">
                <div v-for="toast in toasts" :key="toast.id" :class="[
                    'toast-item bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300',
                    getToastClasses(toast.type),
                    // Dynamic width based on content length
                    getToastWidth(toast)
                ]" @mouseenter="pauseTimer(toast.id)" @mouseleave="resumeTimer(toast.id)">
                    <div class="p-4">
                        <div class="flex items-start">
                            <!-- Icon -->
                            <div class="flex-shrink-0" v-if="toast.showIcon !== false">
                                <component :is="getToastIcon(toast.type)" :class="[
                                    'h-5 w-5',
                                    getIconClasses(toast.type)
                                ]" />
                            </div>

                            <!-- Content - Fixed width constraint issue -->
                            <div class="ml-3 flex-1 min-w-0">
                                <p v-if="toast.title" class="text-sm font-medium text-gray-900 break-words">
                                    {{ toast.title }}
                                </p>
                                <p :class="[
                                    'text-sm text-gray-500 break-words',
                                    { 'mt-1': toast.title }
                                ]">
                                    {{ toast.message }}
                                </p>

                                <!-- Action button if provided -->
                                <div v-if="toast.action" class="mt-3">
                                    <button @click="handleAction(toast)"
                                        class="text-sm font-medium text-mun-blue hover:text-mun-blue-dark focus:outline-none focus:underline">
                                        {{ toast.action.text }}
                                    </button>
                                </div>
                            </div>

                            <!-- Close button -->
                            <div class="ml-4 flex-shrink-0 flex" v-if="toast.closable !== false">
                                <button @click="removeToast(toast.id)"
                                    class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                    <span class="sr-only">Close</span>
                                    <XMarkIcon class="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <!-- Progress bar for timed toasts - Fixed real-time updates -->
                        <div v-if="toast.duration > 0 && toast.showProgress !== false" class="mt-2 -mb-1 -mx-4">
                            <div class="h-1 bg-gray-100">
                                <div :class="[
                                    'h-1 transition-all ease-linear',
                                    getProgressClasses(toast.type)
                                ]" :style="{
                                    width: `${Math.max(0, currentProgress[toast.id] || 0)}%`,
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

// Reactive progress tracking - Fixed status bar updates
const currentProgress = ref({})

// Toast type configurations
const toastConfig = {
    success: {
        borderClass: 'border-l-4 border-green-400',
        iconComponent: CheckCircleIcon,
        iconClass: 'text-green-400',
        progressClass: 'bg-green-400'
    },
    error: {
        borderClass: 'border-l-4 border-red-400',
        iconComponent: ExclamationCircleIcon,
        iconClass: 'text-red-400',
        progressClass: 'bg-red-400'
    },
    warning: {
        borderClass: 'border-l-4 border-yellow-400',
        iconComponent: ExclamationTriangleIcon,
        iconClass: 'text-yellow-400',
        progressClass: 'bg-yellow-400'
    },
    info: {
        borderClass: 'border-l-4 border-blue-400',
        iconComponent: InformationCircleIcon,
        iconClass: 'text-blue-400',
        progressClass: 'bg-blue-400'
    }
}

// Methods
const getToastClasses = (type) => {
    return toastConfig[type]?.borderClass || toastConfig.info.borderClass
}

const getToastIcon = (type) => {
    return toastConfig[type]?.iconComponent || toastConfig.info.iconComponent
}

const getIconClasses = (type) => {
    return toastConfig[type]?.iconClass || toastConfig.info.iconClass
}

const getProgressClasses = (type) => {
    return toastConfig[type]?.progressClass || toastConfig.info.progressClass
}

// Fixed: Dynamic width calculation based on content
const getToastWidth = (toast) => {
    const messageLength = (toast.title || '').length + (toast.message || '').length

    if (messageLength > 120) {
        return 'w-96 max-w-md' // Wider for longer messages
    } else if (messageLength > 60) {
        return 'w-80 max-w-sm' // Medium width
    } else {
        return 'w-72 max-w-xs' // Compact for short messages
    }
}

// Fixed: Progress calculation with proper real-time updates
const calculateProgress = (toast) => {
    if (!toast.duration || toast.duration <= 0) return 0

    const elapsed = Date.now() - toast.timestamp - (toast.pausedTime || 0)
    const progress = Math.max(0, Math.min(100, (elapsed / toast.duration) * 100))

    // Ensure progress goes all the way to 0 before removal
    const remainingProgress = 100 - progress

    // If less than 1% remaining, show 0 to ensure smooth completion
    return remainingProgress < 1 ? 0 : Math.round(remainingProgress)
}

const removeToast = (id) => {
    // Clean up progress tracking
    delete currentProgress.value[id]
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
    if (toast && toast.duration > 0) {
        toast.paused = true
        toast.pausedAt = Date.now()
    }
}

const resumeTimer = (id) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast && toast.paused) {
        toast.paused = false
        toast.pausedTime = (toast.pausedTime || 0) + (Date.now() - (toast.pausedAt || 0))
    }
}

// Fixed: Progress update interval with proper cleanup
let progressInterval = null

const updateProgress = () => {
    toasts.value.forEach(toast => {
        if (toast.duration > 0) {
            const progress = calculateProgress(toast)
            currentProgress.value[toast.id] = progress

            // Remove toast when progress reaches 0 OR time has actually expired
            const elapsed = Date.now() - toast.timestamp - (toast.pausedTime || 0)
            const hasExpired = elapsed >= toast.duration

            if ((progress <= 0 || hasExpired) && !toast.paused) {
                // Small delay to ensure progress bar reaches 0 visually
                setTimeout(() => {
                    removeToast(toast.id)
                }, 50)
            }
        }
    })
}

// Watch for new toasts and initialize their progress
watch(toasts, (newToasts, oldToasts) => {
    newToasts.forEach(toast => {
        if (toast.duration > 0 && !(toast.id in currentProgress.value)) {
            currentProgress.value[toast.id] = 100
        }
    })

    // Clean up progress for removed toasts
    if (oldToasts) {
        const currentIds = new Set(newToasts.map(t => t.id))
        Object.keys(currentProgress.value).forEach(id => {
            if (!currentIds.has(parseInt(id))) {
                delete currentProgress.value[id]
            }
        })
    }
}, { immediate: true })

onMounted(() => {
    // Update progress bars every 50ms for smoother animation
    progressInterval = setInterval(updateProgress, 50)
})

onUnmounted(() => {
    if (progressInterval) {
        clearInterval(progressInterval)
    }
})
</script>

<style scoped>
/* Toast animations */
.toast-enter-active {
    transition: all 0.3s ease-out;
}

.toast-leave-active {
    transition: all 0.3s ease-in;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
}

.toast-move {
    transition: transform 0.3s ease;
}

/* Hover effects */
.toast-item {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toast-item:hover {
    transform: translateX(-4px) scale(1.02);
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