<template>
  <div id="app" class="min-h-screen">
    <!-- Only show content after stores are ready -->
    <div v-if="!storesLoading">
      <!-- Global Loading Overlay -->
      <transition name="fade">
        <div v-if="isGlobalLoading"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p class="mt-4 text-gray-600 text-center font-medium">{{ loadingMessage }}</p>
          </div>
        </div>
      </transition>

      <!-- Main Router View -->
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>

      <!-- Dynamic Components (loaded only when available) -->
      <component v-if="ToastContainer" :is="ToastContainer" />
      <component v-if="ModalContainer" :is="ModalContainer" />
      <component v-if="NetworkStatusIndicator" :is="NetworkStatusIndicator" />
    </div>

    <!-- Loading screen while stores initialize -->
    <div v-else class="fixed inset-0 flex items-center justify-center bg-white">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Initializing application...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State
const storesLoading = ref(true)
const isGlobalLoading = ref(false)
const loadingMessage = ref('Loading...')

// Dynamic component refs
const ToastContainer = shallowRef(null)
const ModalContainer = shallowRef(null)
const NetworkStatusIndicator = shallowRef(null)

// Store refs (will be populated after loading)
let authStore = null
let appStore = null
let wsStore = null

// Initialize stores and components
const initializeApp = async () => {
  try {
    console.log('Starting app initialization...')

    // Step 1: Load stores
    const { useAuthStore } = await import('@/stores/auth')
    const { useAppStore } = await import('@/stores/app')
    const { useSocketStore } = await import('@/stores/websocket')

    authStore = useAuthStore()
    appStore = useAppStore()
    wsStore = useSocketStore()

    console.log('Stores loaded successfully')

    // Step 2: Load components dynamically
    try {
      const [toastModule, modalModule, networkModule] = await Promise.allSettled([
        import('@/components/ui/ToastContainer.vue'),
        import('@/components/ui/ModalContainer.vue'),
        import('@/components/ui/NetworkStatusIndicator.vue')
      ])

      if (toastModule.status === 'fulfilled') {
        ToastContainer.value = toastModule.value.default
      }
      if (modalModule.status === 'fulfilled') {
        ModalContainer.value = modalModule.value.default
      }
      if (networkModule.status === 'fulfilled') {
        NetworkStatusIndicator.value = networkModule.value.default
      }

      console.log('Components loaded')
    } catch (error) {
      console.warn('Some components failed to load:', error)
    }

    // Step 3: Initialize auth if token exists
    const token = localStorage.getItem('mun_token')
    if (token && authStore) {
      try {
        await authStore.validateSession()
      } catch (error) {
        console.warn('Session validation failed:', error)
        localStorage.removeItem('mun_token')
      }
    }

    // Step 4: Mark as ready
    storesLoading.value = false
    console.log('App initialization complete')

  } catch (error) {
    console.error('App initialization failed:', error)
    // Show error state or fallback
    storesLoading.value = false
  }
}

onMounted(() => {
  initializeApp()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.page-enter-active, .page-leave-active {
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
</style>