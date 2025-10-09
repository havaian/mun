import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Import CSS
import './assets/css/main.css'

// Import global components and plugins
import Toast from './plugins/toast'
import Modal from './plugins/modal'
import LoadingSpinner from './components/ui/LoadingSpinner.vue'
import AppButton from './components/ui/AppButton.vue'
import AppCard from './components/ui/AppCard.vue'

// Initialize Vue app
const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(Toast)
app.use(Modal)

// Register global components
app.component('LoadingSpinner', LoadingSpinner)
app.component('AppButton', AppButton)
app.component('AppCard', AppCard)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
    console.error('Global error:', err, info)

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