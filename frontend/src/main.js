import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import router from './router'

// Create Vue app
const app = createApp(App)
const pinia = createPinia()

// Register plugins
app.use(pinia)
app.use(router)

// Mount the application
app.mount('#app')