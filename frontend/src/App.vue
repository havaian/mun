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
              <div class="bg-mun-blue rounded-full h-2 transition-all duration-300"
                :style="{ width: `${loadingProgress}%` }"></div>
            </div>
            <p class="text-xs text-mun-gray-500 mt-2 text-center">{{ loadingProgress }}% complete</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Main Router View - SIMPLIFIED for performance -->
    <router-view v-slot="{ Component, route }">
      <component :is="Component" />
    </router-view>

    <!-- Global Toast Container -->
    <ToastContainer />

    <!-- Global Modal Container -->
    <ModalContainer />

    <!-- Session Timeout Warning -->
    <SessionTimeoutModal ref="sessionTimeoutModal" />

    <!-- WebSocket Connection Status -->
    <transition name="websocket-status">
      <div v-if="showWebSocketStatus" class="fixed bottom-4 right-4 z-40">
        <div class="bg-white rounded-lg shadow-lg border p-3 flex items-center space-x-2">
          <div :class="['w-2 h-2 rounded-full', webSocketIndicatorClass]"></div>
          <span class="text-sm font-medium text-mun-gray-700">
            {{ webSocketStatusText }}
          </span>
        </div>
      </div>
    </transition>

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

    <!-- Network Status Indicator -->
    <transition name="slide-up">
      <div v-if="appStore.networkStatus === 'offline'" class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div class="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span class="text-sm font-medium">Working offline</span>
        </div>
      </div>
    </transition>

    <!-- Debug Information (Development Only) -->
    <div v-if="isDevelopment && showDebugInfo"
      class="fixed bottom-4 left-4 z-40 bg-black/90 text-white rounded-lg p-3 text-xs font-mono max-w-xs">
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
        <div class="flex justify-between">
          <span>Route:</span>
          <span class="text-purple-400">{{ route.name }}</span>
        </div>
        <div class="flex justify-between">
          <span>Cache:</span>
          <span class="text-cyan-400">{{ Object.keys(apiCache.cache || {}).length }} items</span>
        </div>
        <button @click="clearAllCache" class="text-red-400 hover:text-red-300 mt-2 text-xs">
          Clear Cache
        </button>
        <button @click="showDebugInfo = false" class="text-gray-400 hover:text-white mt-1 text-xs">
          Hide Debug
        </button>
      </div>
    </div>

    <!-- Quick Debug Toggle (Development Only) -->
    <button v-if="isDevelopment && !showDebugInfo" @click="showDebugInfo = true"
      class="fixed bottom-4 left-4 z-40 bg-gray-800 text-white rounded-full p-2 opacity-50 hover:opacity-100 transition-opacity">
      <span class="text-xs">🐛</span>
    </button>

    <!-- Performance Monitor (Development Only) -->
    <div v-if="isDevelopment && showDebugInfo"
      class="fixed top-4 right-4 z-40 bg-black/90 text-white rounded-lg p-3 text-xs font-mono max-w-xs">
      <div class="space-y-1">
        <div class="text-yellow-400 font-bold">Performance</div>
        <div class="flex justify-between">
          <span>Load Time:</span>
          <span class="text-green-400">{{ appLoadTime }}ms</span>
        </div>
        <div class="flex justify-between">
          <span>Memory:</span>
          <span class="text-blue-400">{{ memoryUsage }}MB</span>
        </div>
        <div class="flex justify-between">
          <span>API Calls:</span>
          <span class="text-purple-400">{{ apiCallCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'
import { apiCache } from '@/utils/performance'

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ModalContainer from '@/components/ui/ModalContainer.vue'
import SessionTimeoutModal from '@/components/modals/SessionTimeoutModal.vue'

// Icons
import {
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
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

// Performance monitoring
const appStartTime = Date.now()
const appLoadTime = ref(0)
const memoryUsage = ref(0)
const apiCallCount = ref(0)

// Environment
const isDevelopment = import.meta.env.DEV

// Computed
const webSocketIndicatorClass = computed(() => {
  if (wsStore.isConnected) return 'bg-mun-green-500'
  if (wsStore.isConnecting) return 'bg-mun-yellow-500 animate-pulse'
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
    await new Promise(resolve => setTimeout(resolve, 50))

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
          // Continue without WebSocket - not critical
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

    // Calculate load time
    appLoadTime.value = Date.now() - appStartTime

    // Set app as initialized
    appStore.setInitialized(true)

    // Start session monitoring if authenticated
    if (authStore.isAuthenticated) {
      authStore.startSessionMonitoring()
    }

    // Start performance monitoring in development
    if (isDevelopment) {
      startPerformanceMonitoring()
    }

  } catch (error) {
    console.error('App initialization error:', error)
    authStore.logout(false)
    toast.error('Failed to initialize application. Please refresh the page.')
  } finally {
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))
    isGlobalLoading.value = false
    loadingProgress.value = 0
  }
}

const loadUserPreferences = async () => {
  try {
    // Load saved preferences from localStorage
    const savedLanguage = localStorage.getItem('mun_language')
    if (savedLanguage) {
      appStore.setLanguage(savedLanguage)
    }

    const savedTheme = localStorage.getItem('mun_theme')
    if (savedTheme) {
      appStore.setTheme(savedTheme)
    }

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
}

const handleAuthStateChange = (mutation, state) => {
  if (state.isAuthenticated && !wsStore.isConnected && !wsStore.isConnecting) {
    // Connect WebSocket when user logs in
    wsStore.connect().catch(error => {
      console.warn('Failed to connect WebSocket after login:', error)
    })
  } else if (!state.isAuthenticated && wsStore.isConnected) {
    // Disconnect WebSocket on logout
    setTimeout(() => {
      if (!authStore.isAuthenticated && wsStore.isConnected) {
        wsStore.disconnect()
      }
    }, 500)
  }
}

const handleWebSocketStateChange = () => {
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
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    toast.log('Global search shortcut triggered')
  }

  if (event.key === 'Escape') {
    appStore.closeAllModals()
  }

  // Development shortcuts
  if (isDevelopment) {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      event.preventDefault()
      showDebugInfo.value = !showDebugInfo.value
    }

    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault()
      clearAllCache()
      toast.success('Cache cleared')
    }
  }

  // Force logout
  if (event.ctrlKey && event.shiftKey && event.key === 'L') {
    event.preventDefault()
    if (authStore.isAuthenticated) {
      authStore.logout(true)
    }
  }
}

const handleWindowFocus = () => {
  if (authStore.isAuthenticated) {
    authStore.updateActivity()
  }
}

const handleOnlineOffline = () => {
  if (navigator.onLine) {
    appStore.setNetworkStatus('online')
    toast.success('Connection restored')

    if (authStore.isAuthenticated && !wsStore.isConnected) {
      wsStore.connect()
    }
  } else {
    appStore.setNetworkStatus('offline')
    toast.warn('Connection lost - working offline')
  }
}

const dismissMaintenance = () => {
  isMaintenanceMode.value = false
}

const clearAllCache = () => {
  apiCache.clear()
  // Clear any other caches you might have
  if (isDevelopment) {
    console.log('All caches cleared')
  }
}

const startPerformanceMonitoring = () => {
  // Monitor memory usage in development
  setInterval(() => {
    if (performance.memory) {
      memoryUsage.value = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
    }
  }, 5000)

  // Track API call count (this would be incremented in your API utility)
  window.addEventListener('api-call', () => {
    apiCallCount.value++
  })
}

// Lifecycle hooks
onMounted(async () => {
  await initializeApplication()

  // Set up event listeners
  document.addEventListener('keydown', handleKeyboardShortcuts)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('online', handleOnlineOffline)
  window.addEventListener('offline', handleOnlineOffline)

  // Set up router guards
  router.afterEach(handleRouteChange)

  // Set up store watchers
  authStore.$subscribe(handleAuthStateChange)
  watch(() => wsStore.connectionState, handleWebSocketStateChange)

  // Check for maintenance mode
  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
    isMaintenanceMode.value = true
    maintenanceMessage.value = import.meta.env.VITE_MAINTENANCE_MESSAGE || 'System maintenance in progress'
  }
})

onUnmounted(() => {
  // Cleanup event listeners
  document.removeEventListener('keydown', handleKeyboardShortcuts)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('online', handleOnlineOffline)
  window.removeEventListener('offline', handleOnlineOffline)

  // Disconnect WebSocket
  wsStore.disconnect()
})

// Watch for authentication changes
watch(() => authStore.isAuthenticated, async (newVal, oldVal) => {
  if (newVal && !oldVal) {
    const currentRoute = router.currentRoute.value
    if (currentRoute.path.startsWith('/auth')) {
      await nextTick()
      router.push({ name: authStore.getDashboardRoute() })
    }
  }
})

// Watch for language changes
watch(() => appStore.currentLanguage, (newLang) => {
  document.documentElement.lang = newLang
  const rtlLanguages = ['ar', 'he', 'fa']
  document.documentElement.dir = rtlLanguages.includes(newLang) ? 'rtl' : 'ltr'
})

// Expose methods for external use
defineExpose({
  initializeApplication,
  sessionTimeoutModal,
  clearAllCache
})
</script>

<style scoped>
/* Optimized transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.websocket-status-enter-active,
.websocket-status-leave-active {
  transition: all 0.3s ease;
}

.websocket-status-enter-from,
.websocket-status-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>