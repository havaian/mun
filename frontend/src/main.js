import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useFlagsStore } from '@/stores/flags'

// Import CSS
import './assets/css/main.css'

// Import global components and plugins
import Toast, { toastService } from './plugins/toast'
import Modal from './plugins/modal'
import WebSocketPlugin from './plugins/websocket'
import LoadingSpinner from './components/ui/LoadingSpinner.vue'
import AppButton from './components/ui/AppButton.vue'
import SleekSelect from './components/ui/SleekSelect.vue'
import ModalWrapper from './components/ui/ModalWrapper.vue'
import ConfirmationDialog from './components/ui/ConfirmationDialog.vue'

// Initialize Vue app
const app = createApp(App)

// Install plugins
app.use(createPinia())
// Initialize flags store immediately after Pinia setup
const flagsStore = useFlagsStore()

app.use(router)
app.use(Toast)
app.use(Modal)
app.use(WebSocketPlugin) // WebSocket plugin

// Initialize flags on app startup
flagsStore.initializeFlags().then(() => {
    console.log('✅ Flags initialized:', flagsStore.flagCount, 'flags loaded')
}).catch((error) => {
    console.error('❌ Failed to initialize flags:', error)
})

// Register global components
app.component('LoadingSpinner', LoadingSpinner)
app.component('AppButton', AppButton)
app.component('SleekSelect', SleekSelect)
app.component('ModalWrapper', ModalWrapper)
app.component('ConfirmationDialog', ConfirmationDialog)

// Make toast globally available on window object for easy access
window.toast = {
    success: (message, options) => toastService.success(message, options),
    error: (message, options) => toastService.error(message, options),
    warn: (message, options) => toastService.warn(message, options),
    log: (message, options) => toastService.log(message, options),
    clear: () => toastService.clear()
}

// Global error handler
app.config.errorHandler = (err, vm, info) => {
    console.error('Global error:', err, info)

    // Show toast for global errors
    window.toast.error('An unexpected error occurred')

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
        // TODO: Send to error reporting service
    }
}

// Global performance monitoring (if needed)
if (import.meta.env.DEV) {
    app.config.performance = true
}

// Mount app
app.mount('#app')