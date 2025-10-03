import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// Import stores
import { useAuthStore } from './stores/auth'
import { useSocketStore } from './storeswebsocket'

import router from './router'

// Create Vue app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize WebSocket connection after auth check
const authStore = useAuthStore()
const socketStore = useSocketStore()

authStore.$subscribe((mutation, state) => {
  if (state.isAuthenticated && state.user) {
    socketStore.connect(state.token)
  } else {
    socketStore.disconnect()
  }
})

app.mount('#app')