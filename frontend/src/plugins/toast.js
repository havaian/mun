import { createApp, reactive } from 'vue'

// Toast state
const toasts = reactive([])
let toastIdCounter = 0

// Toast types
const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
}

// Default toast options
const DEFAULT_OPTIONS = {
    duration: 4000,
    position: 'top-right',
    closable: true,
    showIcon: true
}

// Toast service
class ToastService {
    constructor() {
        this.toasts = toasts
    }

    // Add a toast
    add(options) {
        const toast = {
            id: ++toastIdCounter,
            ...DEFAULT_OPTIONS,
            ...options,
            timestamp: Date.now()
        }

        this.toasts.push(toast)

        return toast.id
    }

    // Remove a toast
    remove(id) {
        const index = this.toasts.findIndex(toast => toast.id === id)
        if (index > -1) {
            this.toasts.splice(index, 1)
        }
    }

    // Clear all toasts
    clear() {
        this.toasts.splice(0, this.toasts.length)
    }

    // Convenience methods
    success(message, options = {}) {
        return this.add({
            type: TOAST_TYPES.SUCCESS,
            message,
            ...options
        })
    }

    error(message, options = {}) {
        return this.add({
            type: TOAST_TYPES.ERROR,
            message,
            duration: 6000, // Longer duration for errors
            ...options
        })
    }

    warn(message, options = {}) {
        return this.add({
            type: TOAST_TYPES.WARNING,
            message,
            ...options
        })
    }

    log(message, options = {}) {
        return this.add({
            type: TOAST_TYPES.INFO,
            message,
            ...options
        })
    }
}

// Create toast service instance
const toastService = new ToastService()

// Composable for using toast
export function useToast() {
    return {
        toast: toastService,
        success: toastService.success.bind(toastService),
        error: toastService.error.bind(toastService),
        warn: toastService.warn.bind(toastService),
        log: toastService.log.bind(toastService),
        clear: toastService.clear.bind(toastService)
    }
}

// Vue plugin
export default {
    install(app) {
        // Provide toast service
        app.provide('toast', toastService)

        // Add global properties
        app.config.globalProperties.$toast = toastService
    }
}

// Export toast service and types
export { toastService, TOAST_TYPES }