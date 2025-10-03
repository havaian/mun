<template>
    <div class="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
        <TransitionGroup name="notification" tag="div">
            <div v-for="notification in visibleNotifications" :key="notification.id" :class="[
                'card p-4 shadow-strong border-l-4 cursor-pointer hover:shadow-medium transition-all duration-200',
                notificationClasses[notification.type] || notificationClasses.info
            ]" @click="handleNotificationClick(notification)">
                <div class="flex items-start space-x-3">
                    <!-- Icon -->
                    <div class="flex-shrink-0 mt-0.5">
                        <component :is="getIcon(notification.type)" class="w-5 h-5" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <p v-if="notification.title" class="text-sm font-semibold text-gray-900 mb-1">
                            {{ notification.title }}
                        </p>
                        <p class="text-sm text-gray-700">
                            {{ notification.message }}
                        </p>
                        <p v-if="notification.timestamp" class="text-xs text-gray-500 mt-1">
                            {{ formatTime(notification.timestamp) }}
                        </p>
                    </div>

                    <!-- Close button -->
                    <button @click.stop="removeNotification(notification.id)"
                        class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Progress bar for auto-dismiss -->
                <div v-if="notification.autoDismiss" class="mt-3">
                    <div class="w-full bg-gray-200 rounded-full h-1">
                        <div class="bg-current h-1 rounded-full transition-all ease-linear"
                            :style="{ width: `${notification.progress || 0}%` }"></div>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSocketStore } from '@/stores/websocket'

// Icons
const CheckCircleIcon = {
    template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>
  `
}

const ExclamationCircleIcon = {
    template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
    </svg>
  `
}

const XCircleIcon = {
    template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
    </svg>
  `
}

const InformationCircleIcon = {
    template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
    </svg>
  `
}

const socketStore = useSocketStore()

// Local notifications state
const localNotifications = ref([])
const maxNotifications = 5
const defaultDuration = 5000

// Notification styling
const notificationClasses = {
    success: 'border-green-400 bg-green-50 text-green-800',
    error: 'border-red-400 bg-red-50 text-red-800',
    warning: 'border-yellow-400 bg-yellow-50 text-yellow-800',
    info: 'border-blue-400 bg-blue-50 text-blue-800'
}

// Computed
const visibleNotifications = computed(() => {
    return localNotifications.value.slice(0, maxNotifications)
})

// Methods
function getIcon(type) {
    switch (type) {
        case 'success':
            return CheckCircleIcon
        case 'error':
            return XCircleIcon
        case 'warning':
            return ExclamationCircleIcon
        default:
            return InformationCircleIcon
    }
}

function addNotification(notification) {
    const id = Date.now() + Math.random()
    const newNotification = {
        id,
        type: 'info',
        autoDismiss: true,
        duration: defaultDuration,
        progress: 100,
        timestamp: new Date(),
        ...notification
    }

    localNotifications.value.unshift(newNotification)

    // Auto-dismiss with progress bar
    if (newNotification.autoDismiss) {
        startProgressTimer(newNotification)
    }

    // Keep only recent notifications
    if (localNotifications.value.length > maxNotifications * 2) {
        localNotifications.value = localNotifications.value.slice(0, maxNotifications * 2)
    }
}

function startProgressTimer(notification) {
    const interval = 50 // Update every 50ms
    const steps = notification.duration / interval
    let currentStep = steps

    const timer = setInterval(() => {
        currentStep--
        notification.progress = (currentStep / steps) * 100

        if (currentStep <= 0) {
            clearInterval(timer)
            removeNotification(notification.id)
        }
    }, interval)

    notification.timer = timer
}

function removeNotification(id) {
    const index = localNotifications.value.findIndex(n => n.id === id)
    if (index > -1) {
        const notification = localNotifications.value[index]
        if (notification.timer) {
            clearInterval(notification.timer)
        }
        localNotifications.value.splice(index, 1)
    }
}

function handleNotificationClick(notification) {
    if (notification.action) {
        notification.action()
    }
    if (notification.dismissOnClick !== false) {
        removeNotification(notification.id)
    }
}

function formatTime(timestamp) {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return timestamp.toLocaleDateString()
}

// Global notification API
window.showNotification = addNotification

// Listen for socket notifications
onMounted(() => {
    // Add existing socket notifications
    socketStore.notifications.forEach(notification => {
        addNotification({
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info',
            timestamp: notification.timestamp
        })
    })

    // Watch for new socket notifications
    const unsubscribe = socketStore.subscribe('notification', (notification) => {
        addNotification({
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info',
            timestamp: new Date()
        })
    })

    // Cleanup
    onUnmounted(() => {
        unsubscribe()
        // Clear all timers
        localNotifications.value.forEach(notification => {
            if (notification.timer) {
                clearInterval(notification.timer)
            }
        })
    })
})

// Expose methods for programmatic use
defineExpose({
    addNotification,
    removeNotification
})
</script>

<style scoped>
.notification-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
}

.notification-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
}

.notification-move {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>