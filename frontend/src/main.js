import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import router from './router'
import toastPlugin from '@/plugins/toast'

// Create Vue app and pinia instance
const app = createApp(App)
const pinia = createPinia()

// Register plugins in correct order
app.use(pinia) 
app.use(router)
app.use(toastPlugin)

app.mount('#app')