<template>
  <div id="app" class="min-h-screen">
    <!-- Global Loading Overlay -->
    <transition name="fade">
      <div v-if="isGlobalLoading"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div class="bg-white rounded-2xl p-8 shadow-2xl">
          <LoadingSpinner size="lg" />
          <p class="mt-4 text-mun-gray-600 text-center">{{ loadingMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- Main Router View -->
    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- Global Toast Container -->
    <ToastContainer />

    <!-- Global Modal Container -->
    <ModalContainer />

    <!-- Session Timeout Warning -->
    <SessionTimeoutModal />

    <!-- Network Status Indicator -->
    <NetworkStatusIndicator />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ModalContainer from '@/components/ui/ModalContainer.vue'
import SessionTimeoutModal from '@/components/modals/SessionTimeoutModal.vue'
import NetworkStatusIndicator from '@/components/ui/NetworkStatusIndicator.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const wsStore = useWebSocketStore()

// Global loading state
const isGlobalLoading = ref(false)
const loadingMessage = ref('Loading...')

// Initialize application
onMounted(async () => {
  try {
    isGlobalLoading.value = true
    loadingMessage.value = 'Initializing application...'

    // Check for existing session
    const token = localStorage.getItem('mun_token')
    if (token) {
      loadingMessage.value = 'Validating session...'
      await authStore.validateSession()

      if (authStore.isAuthenticated) {
        // Initialize WebSocket if authenticated
        loadingMessage.value = 'Connecting to real-time services...'
        await wsStore.connect()
      }
    }

    // Set app as initialized
    appStore.setInitialized(true)

  } catch (error) {
    console.error('App initialization error:', error)
    // Clear invalid token
    authStore.logout()
  } finally {
    isGlobalLoading.value = false
  }
})

// Cleanup on unmount
onUnmounted(() => {
  wsStore.disconnect()
})

// Handle route changes
router.afterEach((to, from) => {
  // Update page title
  document.title = to.meta.title ? `${to.meta.title} - MUN.UZ` : 'MUN.UZ'

  // Track page navigation
  if (import.meta.env.PROD) {
    // TODO: Add analytics tracking
  }
})

// Handle authentication changes
authStore.$subscribe((mutation, state) => {
  if (state.isAuthenticated && !wsStore.isConnected) {
    // Connect WebSocket when user logs in
    wsStore.connect()
  } else if (!state.isAuthenticated && wsStore.isConnected) {
    // Disconnect WebSocket when user logs out
    wsStore.disconnect()
  }
})

// Handle global keyboard shortcuts
const handleKeyboardShortcuts = (event) => {
  // Ctrl/Cmd + K for search (if implemented)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    // TODO: Open global search
  }

  // Escape key to close modals
  if (event.key === 'Escape') {
    appStore.closeAllModals()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<style scoped>
/* Page transition animations */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>