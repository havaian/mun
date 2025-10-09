<template>
  <div id="app" class="min-h-screen">
    <!-- Global Loading Overlay -->
    <transition name="fade">
      <div v-if="isGlobalLoading"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
          <LoadingSpinner size="lg" />
          <p class="mt-4 text-mun-gray-600 text-center font-medium">{{ loadingMessage }}</p>

          <!-- Loading progress indicator -->
          <div v-if="loadingProgress > 0" class="mt-4">
            <div class="bg-mun-gray-200 rounded-full h-2">
              <div class="bg-un-blue rounded-full h-2 transition-all duration-300"
                :style="{ width: `${loadingProgress}%` }"></div>
            </div>
            <p class="text-xs text-mun-gray-500 mt-2 text-center">{{ loadingProgress }}% complete</p>
          </div>
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
    <SessionTimeoutModal ref="sessionTimeoutModal" />

    <!-- Network Status Indicator -->
    <NetworkStatusIndicator />

    <!-- WebSocket Connection Status -->
    <div v-if="showWebSocketStatus" class="fixed bottom-4 right-4 z-40 transition-all duration-300"
      :class="webSocketStatusClass">
      <div class="bg-white rounded-lg shadow-lg border p-3 flex items-center space-x-2">
        <div :class="['w-2 h-2 rounded-full', webSocketIndicatorClass]"></div>
        <span class="text-sm font-medium text-mun-gray-700">
          {{ webSocketStatusText }}
        </span>
      </div>
    </div>

    <!-- Maintenance Mode Notice -->
    <div v-if="isMaintenanceMode" class="fixed top-0 left-0 right-0 z-50 bg-mun-yellow-500 text-white p-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <ExclamationTriangleIcon class="w-5 h-5" />
          <span class="font-medium">Maintenance Mode</span>
          <span class="text-mun-yellow-100">{{ maintenanceMessage }}</span>
        </div>
        <button @click="dismissMaintenance" class="text-mun-yellow-100 hover:text-white">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Debug Information (Development Only) -->
    <div v-if="isDevelopment && showDebugInfo"
      class="fixed bottom-4 left-4 z-40 bg-black/80 text-white rounded-lg p-3 text-xs font-mono max-w-xs">
      <div class="space-y-1">
        <div class="flex justify-between">
          <span>Auth:</span>
          <span :class="authStore.isAuthenticated ? 'text-green-400' : 'text-red-400'">
            {{ authStore.isAuthenticated ? 'Yes' : 'No' }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>Role:</span>
          <span class="text-blue-400">{{ authStore.user?.role || 'None' }}</span>
        </div>
        <div class="flex justify-between">
          <span>WS:</span>
          <span :class="wsStore.isConnected ? 'text-green-400' : 'text-red-400'">
            {{ wsStore.isConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>Lang:</span>
          <span class="text-yellow-400">{{ appStore.currentLanguage }}</span>
        </div>
        <button @click="showDebugInfo = false" class="text-gray-400 hover:text-white mt-2">
          Hide Debug
        </button>
      </div>
    </div>

    <!-- Quick Debug Toggle (Development Only) -->
    <button v-if="isDevelopment && !showDebugInfo" @click="showDebugInfo = true"
      class="fixed bottom-4 left-4 z-40 bg-gray-800 text-white rounded-full p-2 opacity-50 hover:opacity-100">
      <span class="text-xs">🐛</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ModalContainer from '@/components/ui/ModalContainer.vue'
import SessionTimeoutModal from '@/components/modals/SessionTimeoutModal.vue'
import NetworkStatusIndicator from '@/components/ui/NetworkStatusIndicator.vue'

// Icons
import {
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// Refs
const sessionTimeoutModal = ref(null)

// State
const isGlobalLoading = ref(false)
const loadingMessage = ref('Loading...')
const loadingProgress = ref(0)
const showWebSocketStatus = ref(false)
const isMaintenanceMode = ref(false)
const maintenanceMessage = ref('')
const showDebugInfo = ref(false)

// Environment
const isDevelopment = import.meta.env.DEV

// Computed
const webSocketStatusClass = computed(() => ({
  'transform translate-y-0 opacity-100': showWebSocketStatus.value,
  'transform translate-y-full opacity-0': !showWebSocketStatus.value
}))

const webSocketIndicatorClass = computed(() => {
  if (wsStore.isConnected) return 'bg-mun-green-500 animate-pulse'
  if (wsStore.isConnecting) return 'bg-mun-yellow-500 animate-spin'
  return 'bg-mun-red-500'
})

const webSocketStatusText = computed(() => {
  if (wsStore.isConnected) return 'Real-time connected'
  if (wsStore.isConnecting) return 'Connecting...'
  return 'Connection lost'
})

// Methods
const initializeApplication = async () => {
  try {
    isGlobalLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Initializing application...'

    // Step 1: Basic setup
    loadingProgress.value = 20
    await new Promise(resolve => setTimeout(resolve, 100)) // Brief pause for UX

    // Step 2: Check for existing session
    loadingMessage.value = 'Checking authentication...'
    loadingProgress.value = 40

    const token = localStorage.getItem('mun_token')
    if (token) {
      loadingMessage.value = 'Validating session...'
      loadingProgress.value = 60

      const isValid = await authStore.validateSession()

      if (isValid && authStore.isAuthenticated) {
        // Step 3: Initialize WebSocket for authenticated users
        loadingMessage.value = 'Connecting to real-time services...'
        loadingProgress.value = 80

        try {
          await wsStore.connect()
        } catch (wsError) {
          console.warn('WebSocket connection failed:', wsError)
          // Continue without WebSocket - not critical for basic functionality
        }
      }
    }

    // Step 4: Load user preferences
    loadingMessage.value = 'Loading preferences...'
    loadingProgress.value = 90

    await loadUserPreferences()

    // Step 5: Complete initialization
    loadingMessage.value = 'Ready!'
    loadingProgress.value = 100

    // Set app as initialized
    appStore.setInitialized(true)

    // Start session monitoring if authenticated
    if (authStore.isAuthenticated) {
      authStore.startSessionMonitoring()
    }

  } catch (error) {
    console.error('App initialization error:', error)

    // Clear potentially corrupted state
    authStore.logout(false)

    toast.error('Failed to initialize application. Please refresh the page.')
  } finally {
    // Delay hiding loading to show completion
    await new Promise(resolve => setTimeout(resolve, 500))
    isGlobalLoading.value = false
    loadingProgress.value = 0
  }
}

const loadUserPreferences = async () => {
  try {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('mun_language')
    if (savedLanguage) {
      appStore.setLanguage(savedLanguage)
    }

    // Load saved theme preference
    const savedTheme = localStorage.getItem('mun_theme')
    if (savedTheme) {
      appStore.setTheme(savedTheme)
    }

    // Load saved sidebar state
    const savedSidebarState = localStorage.getItem('mun_sidebar_collapsed')
    if (savedSidebarState !== null) {
      appStore.setSidebarCollapsed(savedSidebarState === 'true')
    }

  } catch (error) {
    console.warn('Failed to load user preferences:', error)
  }
}

const handleRouteChange = (to, from) => {
  // Update page title
  document.title = to.meta.title ? `${to.meta.title} - MUN.UZ` : 'MUN.UZ'

  // Update breadcrumbs if needed
  if (to.meta.breadcrumbs) {
    appStore.setBreadcrumbs(to.meta.breadcrumbs)
  }

  // Track page navigation in production
  if (import.meta.env.PROD) {
    // Add analytics tracking here if needed
  }

  // Handle authentication requirements
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    router.push({ name: 'Login' })
    return
  }

  // Handle role-based access
  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    toast.error('Access denied: Insufficient permissions')
    router.push({ name: authStore.getDashboardRoute() })
    return
  }

  // Hide authenticated users from auth pages
  if (to.meta.hideForAuthenticated && authStore.isAuthenticated) {
    router.push({ name: authStore.getDashboardRoute() })
    return
  }

  // Handle new user language selection
  if (to.meta.newUserOnly && authStore.user?.hasCompletedSetup) {
    router.push({ name: authStore.getDashboardRoute() })
    return
  }
}

const handleAuthStateChange = (mutation, state) => {
  if (state.isAuthenticated && !wsStore.isConnected) {
    // Connect WebSocket when user logs in
    wsStore.connect().catch(error => {
      console.warn('Failed to connect WebSocket after login:', error)
    })
  } else if (!state.isAuthenticated && wsStore.isConnected) {
    // Disconnect WebSocket when user logs out
    wsStore.disconnect()
  }
}

const handleWebSocketStateChange = () => {
  // Show/hide WebSocket status based on connection state
  if (authStore.isAuthenticated) {
    if (wsStore.isConnecting || !wsStore.isConnected) {
      showWebSocketStatus.value = true

      // Auto-hide after successful connection
      if (wsStore.isConnected) {
        setTimeout(() => {
          showWebSocketStatus.value = false
        }, 3000)
      }
    }
  } else {
    showWebSocketStatus.value = false
  }
}

const handleKeyboardShortcuts = (event) => {
  // Global keyboard shortcuts

  // Ctrl/Cmd + K for search (when implemented)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    // TODO: Open global search when implemented
    console.log('Global search shortcut triggered')
  }

  // Escape key to close modals
  if (event.key === 'Escape') {
    appStore.closeAllModals()
  }

  // Debug toggle (Development only)
  if (isDevelopment && event.ctrlKey && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showDebugInfo.value = !showDebugInfo.value
  }

  // Force logout (Ctrl+Shift+L)
  if (event.ctrlKey && event.shiftKey && event.key === 'L') {
    event.preventDefault()
    if (authStore.isAuthenticated) {
      authStore.logout(true)
    }
  }
}

const handleWindowFocus = () => {
  // Update activity when window gains focus
  if (authStore.isAuthenticated) {
    authStore.updateActivity()
  }
}

const handleWindowBlur = () => {
  // Could pause real-time updates when window loses focus to save bandwidth
  // For now, just log the event in development
  if (isDevelopment) {
    console.log('Window lost focus')
  }
}

const dismissMaintenance = () => {
  isMaintenanceMode.value = false
}

const handleOnlineOffline = () => {
  if (navigator.onLine) {
    appStore.setNetworkStatus('online')
    toast.success('Connection restored')

    // Reconnect WebSocket if needed
    if (authStore.isAuthenticated && !wsStore.isConnected) {
      wsStore.connect()
    }
  } else {
    appStore.setNetworkStatus('offline')
    toast.warning('Connection lost - working offline')
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Initialize the application
  await initializeApplication()

  // Set up event listeners
  document.addEventListener('keydown', handleKeyboardShortcuts)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('online', handleOnlineOffline)
  window.addEventListener('offline', handleOnlineOffline)

  // Set up router guards
  router.afterEach(handleRouteChange)

  // Set up store watchers
  authStore.$subscribe(handleAuthStateChange)

  // Watch WebSocket state
  watch(() => wsStore.connectionState, handleWebSocketStateChange)

  // Check for maintenance mode (could be from backend)
  // This is just a placeholder - in real app this would come from API
  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
    isMaintenanceMode.value = true
    maintenanceMessage.value = import.meta.env.VITE_MAINTENANCE_MESSAGE || 'System maintenance in progress'
  }
})

onUnmounted(() => {
  // Cleanup event listeners
  document.removeEventListener('keydown', handleKeyboardShortcuts)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('blur', handleWindowBlur)
  window.removeEventListener('online', handleOnlineOffline)
  window.removeEventListener('offline', handleOnlineOffline)

  // Disconnect WebSocket
  wsStore.disconnect()
})

// Watch for authentication changes to handle redirects
watch(() => authStore.isAuthenticated, async (newVal, oldVal) => {
  if (newVal && !oldVal) {
    // User just logged in
    const currentRoute = router.currentRoute.value

    // If on auth page, redirect to dashboard
    if (currentRoute.path.startsWith('/auth')) {
      await nextTick()
      router.push({ name: authStore.getDashboardRoute() })
    }
  }
})

// Watch for language changes to update document
watch(() => appStore.currentLanguage, (newLang) => {
  document.documentElement.lang = newLang

  // Update direction for RTL languages if needed
  const rtlLanguages = ['ar', 'he', 'fa']
  document.documentElement.dir = rtlLanguages.includes(newLang) ? 'rtl' : 'ltr'
})

// Expose methods for external use (e.g., error boundary)
defineExpose({
  initializeApplication,
  sessionTimeoutModal
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

/* WebSocket status animation */
.websocket-status-enter-active,
.websocket-status-leave-active {
  transition: all 0.3s ease;
}

.websocket-status-enter-from,
.websocket-status-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>