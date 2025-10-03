<template>
  <!-- Non-closable modal overlay -->
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-amber-100 rounded-full">
            <ClockIcon class="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Session Timeout Warning</h3>
            <p class="text-sm text-gray-500">Your session is about to expire</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Countdown Display -->
        <div class="text-center mb-6">
          <div class="relative inline-flex items-center justify-center">
            <!-- Countdown Circle -->
            <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <!-- Background circle -->
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                stroke-width="8"
                fill="none"
                class="text-gray-200"
              />
              <!-- Progress circle -->
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                stroke-width="8"
                fill="none"
                stroke-linecap="round"
                :class="[
                  timeRemaining > 30 ? 'text-blue-500' :
                  timeRemaining > 10 ? 'text-amber-500' : 'text-red-500'
                ]"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="strokeDashoffset"
                class="transition-all duration-1000 ease-linear"
              />
            </svg>
            
            <!-- Countdown number -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span
                :class="[
                  'text-2xl font-bold',
                  timeRemaining > 30 ? 'text-blue-600' :
                  timeRemaining > 10 ? 'text-amber-600' : 'text-red-600'
                ]"
              >
                {{ timeRemaining }}
              </span>
            </div>
          </div>
          
          <p class="text-gray-600 mt-4">
            Your session will expire in <strong>{{ timeRemaining }}</strong> second{{ timeRemaining !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Session Info -->
        <div v-if="sessionInfo" class="bg-gray-50 rounded-lg p-4 mb-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Current Session:</span>
              <p class="font-medium text-gray-900">{{ sessionInfo.duration }}</p>
            </div>
            <div>
              <span class="text-gray-600">Last Activity:</span>
              <p class="font-medium text-gray-900">{{ sessionInfo.lastActivity }}</p>
            </div>
            <div v-if="sessionInfo.role">
              <span class="text-gray-600">Role:</span>
              <p class="font-medium text-gray-900">{{ sessionInfo.role }}</p>
            </div>
            <div v-if="sessionInfo.committee">
              <span class="text-gray-600">Committee:</span>
              <p class="font-medium text-gray-900">{{ sessionInfo.committee }}</p>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div class="flex items-start space-x-3">
            <ExclamationTriangleIcon class="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p class="text-sm text-amber-800">
                <strong>Session about to expire!</strong>
              </p>
              <p class="text-sm text-amber-700 mt-1">
                To continue your work, please extend your session. All unsaved changes will be lost if your session expires.
              </p>
            </div>
          </div>
        </div>

        <!-- Auto-logout warning -->
        <div v-if="timeRemaining <= 10" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p class="text-sm text-red-800 font-medium">
              Automatic logout in {{ timeRemaining }} second{{ timeRemaining !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
        <div class="flex items-center justify-between space-x-3">
          <!-- Logout Button -->
          <button
            @click="handleLogout"
            :disabled="isExtending"
            class="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50"
          >
            Logout Now
          </button>

          <!-- Extend Session Button -->
          <button
            @click="handleExtendSession"
            :disabled="isExtending || timeRemaining === 0"
            :class="[
              'px-6 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed',
              timeRemaining > 10
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            ]"
          >
            <span v-if="isExtending" class="flex items-center space-x-2">
              <LoadingSpinner class="w-4 h-4" />
              <span>Extending...</span>
            </span>
            <span v-else>
              {{ timeRemaining > 10 ? 'Extend Session' : 'Extend Now!' }}
            </span>
          </button>
        </div>

        <!-- Session Extension Info -->
        <div v-if="!isExtending" class="mt-3 text-center">
          <p class="text-xs text-gray-500">
            Extending will give you an additional {{ extensionDuration }} minutes
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Icons
import {
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  warningTime: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  extensionDuration: {
    type: Number,
    default: 30 // 30 minutes
  }
})

// Emits
const emit = defineEmits(['sessionExtended', 'sessionExpired'])

// Composables
const authStore = useAuthStore()
const toast = useToast()

// State
const isVisible = ref(false)
const timeRemaining = ref(0)
const isExtending = ref(false)
const intervalId = ref(null)
const timeoutId = ref(null)
const warningShown = ref(false)

// Session info
const sessionInfo = ref(null)

// Circle animation calculations
const circumference = 2 * Math.PI * 42 // radius = 42
const strokeDashoffset = computed(() => {
  const progress = timeRemaining.value / props.warningTime
  return circumference * (1 - progress)
})

// Methods
const checkSessionTimeout = () => {
  const token = localStorage.getItem('mun_token')
  if (!token || !authStore.isAuthenticated) {
    hideModal()
    return
  }

  try {
    // Decode JWT to get expiration time
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiration = Math.max(0, Math.floor((expirationTime - currentTime) / 1000))

    // Show warning if within warning time and not already shown
    if (timeUntilExpiration <= props.warningTime && timeUntilExpiration > 0 && !warningShown.value) {
      showModal(timeUntilExpiration)
    } else if (timeUntilExpiration === 0) {
      // Session expired
      handleSessionExpired()
    }
  } catch (error) {
    console.error('Error checking session timeout:', error)
    // If we can't decode the token, assume it's invalid
    handleSessionExpired()
  }
}

const showModal = (remainingTime) => {
  timeRemaining.value = remainingTime
  isVisible.value = true
  warningShown.value = true
  
  // Load session info
  loadSessionInfo()
  
  // Start countdown
  startCountdown()
  
  // Play warning sound (if supported)
  playWarningSound()
}

const hideModal = () => {
  isVisible.value = false
  warningShown.value = false
  stopCountdown()
}

const startCountdown = () => {
  stopCountdown() // Clear any existing interval
  
  intervalId.value = setInterval(() => {
    timeRemaining.value = Math.max(0, timeRemaining.value - 1)
    
    if (timeRemaining.value === 0) {
      handleSessionExpired()
    }
  }, 1000)
}

const stopCountdown = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  if (timeoutId.value) {
    clearTimeout(timeoutId.value)
    timeoutId.value = null
  }
}

const handleExtendSession = async () => {
  isExtending.value = true
  
  try {
    // Call API to refresh/extend session
    const response = await apiMethods.auth.validateSession()
    
    if (response.data.token) {
      // Update the token in storage
      localStorage.setItem('mun_token', response.data.token)
      
      // Update auth store
      authStore.updateToken(response.data.token)
      
      toast.success(`Session extended by ${props.extensionDuration} minutes`)
      
      emit('sessionExtended', props.extensionDuration)
      hideModal()
    } else {
      throw new Error('Failed to extend session')
    }
  } catch (error) {
    console.error('Session extension error:', error)
    toast.error('Failed to extend session. Please log in again.')
    handleLogout()
  } finally {
    isExtending.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  hideModal()
  toast.info('You have been logged out')
}

const handleSessionExpired = () => {
  emit('sessionExpired')
  authStore.logout()
  hideModal()
  toast.error('Your session has expired. Please log in again.')
}

const loadSessionInfo = () => {
  const user = authStore.user
  const sessionStart = localStorage.getItem('mun_session_start')
  const lastActivity = localStorage.getItem('mun_last_activity')
  
  if (user) {
    sessionInfo.value = {
      duration: sessionStart ? formatSessionDuration(new Date(sessionStart)) : 'Unknown',
      lastActivity: lastActivity ? formatRelativeTime(new Date(lastActivity)) : 'Unknown',
      role: user.role ? formatRole(user.role) : undefined,
      committee: user.committee || undefined
    }
  }
}

const formatSessionDuration = (startTime) => {
  const duration = Date.now() - startTime.getTime()
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatRelativeTime = (time) => {
  const diff = Date.now() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

const formatRole = (role) => {
  const roleMap = {
    'delegate': 'Delegate',
    'observer': 'Observer',
    'chair': 'Chairperson',
    'co_chair': 'Co-Chair',
    'rapporteur': 'Rapporteur',
    'admin': 'Administrator'
  }
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

const playWarningSound = () => {
  try {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    // Sound not supported or permission denied
    console.warn('Warning sound not available:', error)
  }
}

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    hideModal()
  }
})

// Expose methods for parent component
defineExpose({
  showModal,
  hideModal,
  checkSessionTimeout
})

// Lifecycle
onMounted(() => {
  // Check session timeout periodically
  timeoutId.value = setInterval(checkSessionTimeout, 30000) // Check every 30 seconds
  
  // Initial check
  checkSessionTimeout()
  
  // Update last activity timestamp
  const updateLastActivity = () => {
    localStorage.setItem('mun_last_activity', new Date().toISOString())
  }
  
  // Listen for user activity
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  activityEvents.forEach(event => {
    document.addEventListener(event, updateLastActivity, { passive: true })
  })
  
  // Store session start time if not already stored
  if (!localStorage.getItem('mun_session_start') && authStore.isAuthenticated) {
    localStorage.setItem('mun_session_start', new Date().toISOString())
  }
})

onUnmounted(() => {
  stopCountdown()
  
  if (timeoutId.value) {
    clearInterval(timeoutId.value)
  }
  
  // Clean up activity listeners
  const updateLastActivity = () => {
    localStorage.setItem('mun_last_activity', new Date().toISOString())
  }
  
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  activityEvents.forEach(event => {
    document.removeEventListener(event, updateLastActivity)
  })
})
</script>

<style scoped>
/* Pulse animation for urgent states */
.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Smooth transitions for circle progress */
circle {
  transition: stroke-dashoffset 1s ease-in-out;
}
</style>