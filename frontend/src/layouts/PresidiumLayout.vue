<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Navbar -->
        <UniversalNavbar />

        <!-- Presidium Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-mun-lg transition-transform duration-300',
            'mt-16', // Add margin top for navbar
            { '-translate-x-full': appStore.sidebarCollapsed }
        ]">
            <!-- Sidebar Header -->
            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-mun-green-500 rounded-xl flex items-center justify-center">
                        <UserGroupIcon class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-mun-gray-900">Presidium</h2>
                        <p class="text-sm text-mun-gray-500">{{ authStore.user?.presidiumRole || 'Member' }}</p>
                    </div>
                </div>

                <button @click="appStore.toggleSidebar"
                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors lg:hidden">
                    <XMarkIcon class="w-5 h-5 text-mun-gray-600" />
                </button>
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                <RouterLink v-for="item in navigationItems" :key="item.name" :to="item.to" class="nav-link group"
                    :class="{ 'active': $route.name === item.name }">
                    <component :is="item.icon" class="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{{ item.label }}</span>
                    <span v-if="item.badge"
                        class="ml-auto px-2 py-1 text-xs font-medium bg-mun-red-500 text-white rounded-full">
                        {{ item.badge }}
                    </span>
                </RouterLink>
            </nav>

            <!-- Session Controls -->
            <div class="border-t border-mun-gray-100 p-4">
                <div class="space-y-3">
                    <!-- Current Session Status -->
                    <div class="text-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-mun-gray-600">Current Session</span>
                            <div class="flex items-center space-x-2">
                                <div :class="[
                                    'w-2 h-2 rounded-full',
                                    currentSession?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                ]"></div>
                                <span class="text-xs font-medium">
                                    {{ currentSession?.status === 'active' ? 'Active' : 'Inactive' }}
                                </span>
                            </div>
                        </div>

                        <div v-if="currentSession" class="text-xs text-mun-gray-500">
                            <div>Mode: {{ formatSessionMode(currentSession.currentMode) }}</div>
                            <div v-if="sessionTimer">Timer: {{ sessionTimer }}</div>
                        </div>
                    </div>

                    <!-- Quick Session Actions -->
                    <div class="space-y-2">
                        <button v-if="!currentSession || currentSession.status !== 'active'" @click="startSession"
                            :disabled="isLoading"
                            class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                            <PlayIcon class="w-4 h-4 mr-2" />
                            Start Session
                        </button>

                        <button v-else @click="pauseSession" :disabled="isLoading"
                            class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50">
                            <PauseIcon class="w-4 h-4 mr-2" />
                            Pause Session
                        </button>
                    </div>
                </div>
            </div>

            <!-- Committee Info Footer -->
            <div class="border-t border-mun-gray-100 p-4">
                <div class="text-sm text-mun-gray-600 mb-2">
                    Committee: {{ committeeInfo?.name || 'Loading...' }}
                </div>
                <div class="text-xs text-mun-gray-500">
                    {{ committeeInfo?.countries?.length || 0 }} countries •
                    {{ attendanceCount }} present
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div :class="[
            'transition-all duration-300',
            'mt-16', // Add margin top for navbar
            appStore.sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        ]">
            <!-- Page Content -->
            <main class="min-h-screen">
                <RouterView />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!appStore.sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden mt-16"
            @click="appStore.toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Import the Universal Navbar
import UniversalNavbar from '@/components/shared/UniversalNavbar.vue'

// Icons
import {
    UserGroupIcon,
    XMarkIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    ClockIcon,
    PlayIcon,
    PauseIcon,
    UserIcon
} from '@heroicons/vue/24/outline'

// Stores and composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const currentSession = ref(null)
const committeeInfo = ref(null)
const sessionTimer = ref('')
const attendanceCount = ref(0)

// Navigation items for presidium
const navigationItems = computed(() => [
    {
        name: 'PresidiumDashboard',
        label: 'Dashboard',
        to: '/presidium',
        icon: ChartBarIcon
    },
    {
        name: 'PresidiumSessions',
        label: 'Session Management',
        to: '/presidium/sessions',
        icon: CalendarDaysIcon,
        badge: currentSession.value?.status === 'active' ? 'LIVE' : null
    },
    {
        name: 'PresidiumDocuments',
        label: 'Document Review',
        to: '/presidium/documents',
        icon: DocumentTextIcon,
        badge: pendingDocuments.value > 0 ? pendingDocuments.value : null
    },
    {
        name: 'PresidiumVoting',
        label: 'Voting Management',
        to: '/presidium/voting',
        icon: HandRaisedIcon
    },
    {
        name: 'PresidiumAttendance',
        label: 'Attendance Tracking',
        to: '/presidium/attendance',
        icon: UserIcon
    }
])

// Computed properties
const pendingDocuments = computed(() => {
    // This would come from your document store
    return 0 // Placeholder
})

const pageTitle = computed(() => {
    const titleMap = {
        'PresidiumDashboard': 'Dashboard',
        'PresidiumSessions': 'Session Management',
        'PresidiumDocuments': 'Document Review',
        'PresidiumVoting': 'Voting Management',
        'PresidiumAttendance': 'Attendance Tracking'
    }
    return titleMap[route.name] || 'Presidium Panel'
})

// Methods
const formatSessionMode = (mode) => {
    const modeMap = {
        'formal': 'Formal Debate',
        'moderated': 'Moderated Caucus',
        'unmoderated': 'Unmoderated Caucus',
        'informal': 'Informal Consultation',
        'closed': 'Closed Session'
    }
    return modeMap[mode] || mode || 'Unknown'
}

const startSession = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        // Implementation would depend on your session management API
        // const response = await sessionAPI.start(committeeInfo.value.id)

        // Mock implementation
        currentSession.value = {
            id: 'session_' + Date.now(),
            status: 'active',
            currentMode: 'formal',
            startedAt: new Date().toISOString()
        }

        toast.success('Session started successfully')
        await loadSessionData()

    } catch (error) {
        console.error('Failed to start session:', error)
        toast.error('Failed to start session')
    } finally {
        isLoading.value = false
    }
}

const pauseSession = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        // Implementation would depend on your session management API
        // const response = await sessionAPI.pause(currentSession.value.id)

        // Mock implementation
        if (currentSession.value) {
            currentSession.value.status = 'paused'
        }

        toast.success('Session paused')

    } catch (error) {
        console.error('Failed to pause session:', error)
        toast.error('Failed to pause session')
    } finally {
        isLoading.value = false
    }
}

const loadSessionData = async () => {
    try {
        // This would load current session data from your API
        // const response = await sessionAPI.getCurrent(committeeInfo.value.id)

        // Mock data for now
        committeeInfo.value = {
            id: 'committee_1',
            name: 'General Assembly',
            countries: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Country ${i + 1}` }))
        }

        attendanceCount.value = Math.floor(Math.random() * 45) + 25 // Mock attendance

    } catch (error) {
        console.error('Failed to load session data:', error)
    }
}

const updateSessionTimer = () => {
    if (currentSession.value?.status === 'active') {
        const startTime = new Date(currentSession.value.startedAt)
        const now = new Date()
        const elapsed = Math.floor((now - startTime) / 1000)

        const hours = Math.floor(elapsed / 3600)
        const minutes = Math.floor((elapsed % 3600) / 60)
        const seconds = elapsed % 60

        sessionTimer.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
        sessionTimer.value = ''
    }
}

// Lifecycle
onMounted(async () => {
    await loadSessionData()

    // Set up timer update interval
    const timerInterval = setInterval(updateSessionTimer, 1000)

    // Set up data refresh interval
    const refreshInterval = setInterval(async () => {
        await loadSessionData()
    }, 30000) // Refresh every 30 seconds

    // Cleanup on unmount
    onUnmounted(() => {
        clearInterval(timerInterval)
        clearInterval(refreshInterval)
    })
})
</script>

<style scoped>
/* Navigation styles */
.nav-link {
    @apply flex items-center px-4 py-3 text-mun-gray-700 rounded-xl;
    @apply transition-all duration-200 hover:bg-white/60 hover:text-mun-blue-600;
    @apply relative;
}

.nav-link.active {
    @apply bg-mun-blue-600 text-white shadow-lg;
}

/* Ensure proper spacing with navbar */
.mt-16 {
    margin-top: 4rem;
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Transition optimizations */
.transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-all {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

/* Z-index management */
.z-40 {
    z-index: 40;
}

.z-50 {
    z-index: 50;
}
</style>