import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import router from './router'

// Create app and pinia first
const app = createApp(App)
const pinia = createPinia()

// Register Pinia FIRST before any imports that might use stores
app.use(pinia)
app.use(router)

// Import toast plugin AFTER pinia is registered
const initializeToast = async () => {
  try {
    const toastModule = await import('@/plugins/toast')
    app.use(toastModule.default)
  } catch (error) {
    console.warn('Toast plugin failed to load:', error)
  }
}

// Initialize everything in correct order
const initializeApp = async () => {
  await initializeToast()
  app.mount('#app')
}

initializeApp()