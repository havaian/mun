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

    warning(message, options = {}) {
        return this.add({
            type: TOAST_TYPES.WARNING,
            message,
            ...options
        })
    }

    info(message, options = {}) {
        return this.add({
            type: TOAST_TYPES.INFO,
            message,
            ...options
        })
    }
}

// Create toast service instance
const toastService = new ToastService()

// Toast component template
const ToastComponent = {
    name: 'ToastContainer',
    setup() {
        return {
            toasts: toastService.toasts,
            removeToast: toastService.remove.bind(toastService)
        }
    },
    template: `
        <teleport to="body">
            <div class="toast-container fixed top-4 right-4 z-50 space-y-2">
                <transition-group
                    name="toast"
                    tag="div"
                    class="space-y-2"
                >
                    <div
                        v-for="toast in toasts"
                        :key="toast.id"
                        :class="[
                            'toast-item max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
                            {
                                'border-l-4 border-green-400': toast.type === 'success',
                                'border-l-4 border-red-400': toast.type === 'error',
                                'border-l-4 border-yellow-400': toast.type === 'warning',
                                'border-l-4 border-blue-400': toast.type === 'info'
                            }
                        ]"
                    >
                        <div class="p-4">
                            <div class="flex items-start">
                                <div class="flex-shrink-0" v-if="toast.showIcon">
                                    <!-- Success Icon -->
                                    <svg v-if="toast.type === 'success'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                    </svg>
                                    <!-- Error Icon -->
                                    <svg v-else-if="toast.type === 'error'" class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                    </svg>
                                    <!-- Warning Icon -->
                                    <svg v-else-if="toast.type === 'warning'" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                    <!-- Info Icon -->
                                    <svg v-else-if="toast.type === 'info'" class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="ml-3 w-0 flex-1">
                                    <p v-if="toast.title" class="text-sm font-medium text-gray-900">
                                        {{ toast.title }}
                                    </p>
                                    <p :class="[
                                        'text-sm text-gray-500',
                                        { 'mt-1': toast.title }
                                    ]">
                                        {{ toast.message }}
                                    </p>
                                </div>
                                <div class="ml-4 flex-shrink-0 flex" v-if="toast.closable">
                                    <button
                                        @click="removeToast(toast.id)"
                                        class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <span class="sr-only">Close</span>
                                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition-group>
            </div>
        </teleport>
    `
}

// Composable for using toast
export function useToast() {
    return {
        toast: toastService,
        success: toastService.success.bind(toastService),
        error: toastService.error.bind(toastService),
        warning: toastService.warning.bind(toastService),
        info: toastService.info.bind(toastService),
        clear: toastService.clear.bind(toastService)
    }
}

// Vue plugin
export default {
    install(app) {
        // Register toast component globally
        app.component('ToastContainer', ToastComponent)

        // Provide toast service
        app.provide('toast', toastService)

        // Add global properties
        app.config.globalProperties.$toast = toastService

        // Mount toast container if not already mounted
        if (!document.querySelector('.toast-container')) {
            const toastApp = createApp(ToastComponent)
            const mountPoint = document.createElement('div')
            document.body.appendChild(mountPoint)
            toastApp.mount(mountPoint)
        }
    }
}

// Export toast service and types
export { toastService, TOAST_TYPES }