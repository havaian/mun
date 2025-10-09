<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Presidium Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-mun-lg transition-transform duration-300',
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
                                <div
                                    :class="['w-2 h-2 rounded-full', currentSession?.status === 'active' ? 'bg-green-500' : 'bg-gray-400']">
                                </div>
                                <span class="text-xs font-medium">{{ currentSession?.status === 'active' ? 'Active' :
                                    'Inactive' }}</span>
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
                <div class="text-sm text-mun-gray-600 mb-2">Committee: {{ committeeInfo?.name || 'Loading...' }}</div>
                <div class="text-xs text-mun-gray-500">{{ committeeInfo?.countries?.length || 0 }} countries • {{
                    attendanceCount }} present</div>
            </div>
        </div>

        <!-- Top Navigation Bar -->
        <header :class="[
            'fixed top-0 right-0 z-40 h-16 bg-white border-b border-mun-gray-200 shadow-sm',
            appStore.sidebarCollapsed ? 'left-0' : 'lg:left-64'
        ]">
            <div class="flex items-center justify-between h-full px-6">
                <!-- Left: Mobile menu + Page title -->
                <div class="flex items-center space-x-4">
                    <button @click="appStore.toggleSidebar"
                        class="lg:hidden p-2 text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100 rounded-lg transition-colors">
                        <Bars3Icon class="w-6 h-6" />
                    </button>
                    <div class="hidden sm:block">
                        <h1 class="text-xl font-semibold text-mun-gray-900">{{ pageTitle }}</h1>
                    </div>
                </div>

                <!-- Right: Actions + Status + User -->
                <div class="flex items-center space-x-4">
                    <!-- Session Timer -->
                    <div v-if="sessionTimer" class="hidden md:flex items-center space-x-2 text-sm text-mun-gray-600">
                        <ClockIcon class="w-4 h-4" />
                        <span>{{ sessionTimer }}</span>
                    </div>

                    <!-- Refresh Button -->
                    <button @click="refreshData" :disabled="isRefreshing"
                        class="p-2 text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh Data">
                        <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': isRefreshing }]" />
                    </button>

                    <!-- Connection Status -->
                    <div class="hidden md:flex items-center space-x-2">
                        <div :class="['w-3 h-3 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500']"></div>
                        <span class="text-sm text-mun-gray-600">{{ isOnline ? 'Online' : 'Offline' }}</span>
                    </div>

                    <!-- Notifications -->
                    <div class="relative">
                        <button @click="toggleNotifications"
                            class="p-2 text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100 rounded-lg transition-colors relative">
                            <BellIcon class="w-5 h-5" />
                            <span v-if="unreadNotifications > 0"
                                class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
                            </span>
                        </button>

                        <!-- Notifications Dropdown -->
                        <div v-if="showNotifications"
                            class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-mun-gray-200 z-50">
                            <div class="p-4 border-b border-mun-gray-200">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-semibold text-mun-gray-900">Session Alerts</h3>
                                    <button v-if="unreadNotifications > 0" @click="markAllAsRead"
                                        class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium">
                                        Mark all read
                                    </button>
                                </div>
                            </div>

                            <div class="max-h-80 overflow-y-auto">
                                <div v-if="notifications.length === 0" class="p-4 text-center text-mun-gray-500">No
                                    alerts</div>
                                <div v-else>
                                    <div v-for="notification in notifications.slice(0, 5)" :key="notification.id"
                                        :class="['p-4 border-b border-mun-gray-100 hover:bg-mun-gray-50 transition-colors cursor-pointer', { 'bg-mun-blue-50': !notification.read }]"
                                        @click="handleNotificationClick(notification)">
                                        <div class="flex items-start space-x-3">
                                            <div
                                                :class="['flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', getNotificationIconClass(notification.type)]">
                                                <component :is="getNotificationIcon(notification.type)"
                                                    class="w-4 h-4" />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-medium text-mun-gray-900">{{ notification.title
                                                    }}</p>
                                                <p class="text-sm text-mun-gray-600 mt-1">{{ notification.message }}</p>
                                                <p class="text-xs text-mun-gray-500 mt-2">{{
                                                    formatTimeAgo(notification.createdAt) }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User Menu -->
                    <div class="relative">
                        <button @click="toggleUserMenu"
                            class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-mun-gray-100 transition-colors">
                            <div
                                class="w-8 h-8 bg-gradient-to-br from-mun-green-500 to-mun-green-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-semibold text-sm">{{ getUserInitials() }}</span>
                            </div>
                            <div class="hidden lg:block text-left">
                                <p class="text-sm font-medium text-mun-gray-900">{{ getUserDisplayName() }}</p>
                                <p class="text-xs text-mun-gray-500">{{ authStore.user?.presidiumRole || 'Presidium' }}
                                </p>
                            </div>
                            <ChevronDownIcon class="w-4 h-4 text-mun-gray-500" />
                        </button>

                        <!-- User Dropdown -->
                        <div v-if="showUserMenu"
                            class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-mun-gray-200 z-50">
                            <div class="p-3 border-b border-mun-gray-200">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-10 h-10 bg-gradient-to-br from-mun-green-500 to-mun-green-600 rounded-lg flex items-center justify-center">
                                        <span class="text-white font-semibold">{{ getUserInitials() }}</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-mun-gray-900 truncate">{{
                                            getUserDisplayName() }}</p>
                                        <p class="text-xs text-mun-gray-500 truncate">{{ authStore.user?.email }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="p-2">
                                <router-link to="/shared/profile"
                                    class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors"
                                    @click="showUserMenu = false">
                                    <UserIcon class="w-4 h-4 mr-3" />
                                    Profile Settings
                                </router-link>

                                <router-link to="/presidium/committee-settings"
                                    class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors"
                                    @click="showUserMenu = false">
                                    <CogIcon class="w-4 h-4 mr-3" />
                                    Committee Settings
                                </router-link>

                                <hr class="my-2 border-mun-gray-200">

                                <button @click="handleLogout"
                                    class="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                    <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <div :class="[
            'transition-all duration-300 pt-16',
            appStore.sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        ]">
            <!-- Page Content -->
            <main class="min-h-screen">
                <RouterView />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!appStore.sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
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

// Icons
import {
    UserGroupIcon, XMarkIcon, Bars3Icon, ChartBarIcon, CalendarDaysIcon, DocumentTextIcon, HandRaisedIcon, ClockIcon, PlayIcon, PauseIcon, UserIcon,
    ArrowPathIcon, BellIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, CogIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isRefreshing = ref(false)
const isOnline = ref(navigator.onLine)
const showNotifications = ref(false)
const showUserMenu = ref(false)
const currentSession = ref(null)
const committeeInfo = ref(null)
const sessionTimer = ref('')
const attendanceCount = ref(0)
const unreadNotifications = ref(1)

const notifications = ref([
    { id: 1, title: 'Motion Submitted', message: 'New procedural motion from United States', type: 'info', read: false, createdAt: new Date(Date.now() - 600000), route: '/presidium/sessions' }
])

// Navigation items for presidium
const navigationItems = computed(() => [
    { name: 'PresidiumDashboard', label: 'Dashboard', to: '/presidium', icon: ChartBarIcon },
    { name: 'PresidiumSessions', label: 'Session Management', to: '/presidium/sessions', icon: CalendarDaysIcon, badge: currentSession.value?.status === 'active' ? 'LIVE' : null },
    { name: 'PresidiumDocuments', label: 'Document Review', to: '/presidium/documents', icon: DocumentTextIcon, badge: pendingDocuments.value > 0 ? pendingDocuments.value : null },
    { name: 'PresidiumVoting', label: 'Voting Management', to: '/presidium/voting', icon: HandRaisedIcon },
    { name: 'PresidiumAttendance', label: 'Attendance Tracking', to: '/presidium/attendance', icon: UserIcon }
])

// Computed properties
const pendingDocuments = computed(() => 0) // Placeholder
const pageTitle = computed(() => {
    const titleMap = { 'PresidiumDashboard': 'Dashboard', 'PresidiumSessions': 'Session Management', 'PresidiumDocuments': 'Document Review', 'PresidiumVoting': 'Voting Management', 'PresidiumAttendance': 'Attendance Tracking' }
    return titleMap[route.name] || 'Presidium Panel'
})

// Methods
const formatSessionMode = (mode) => {
    const modeMap = { 'formal': 'Formal Debate', 'moderated': 'Moderated Caucus', 'unmoderated': 'Unmoderated Caucus', 'informal': 'Informal Consultation', 'closed': 'Closed Session' }
    return modeMap[mode] || mode || 'Unknown'
}

const startSession = async () => {
    if (isLoading.value) return
    isLoading.value = true
    try {
        currentSession.value = { id: 'session_' + Date.now(), status: 'active', currentMode: 'formal', startedAt: new Date().toISOString() }
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
        if (currentSession.value) currentSession.value.status = 'paused'
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
        committeeInfo.value = { id: 'committee_1', name: 'General Assembly', countries: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Country ${i + 1}` })) }
        attendanceCount.value = Math.floor(Math.random() * 45) + 25
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

const toggleNotifications = () => { showNotifications.value = !showNotifications.value; showUserMenu.value = false }
const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; showNotifications.value = false }

const getUserInitials = () => {
    const username = authStore.user?.username || authStore.user?.email || 'Presidium'
    return username.split(' ').map(n => n[0]?.toUpperCase()).join('').slice(0, 2) || 'PR'
}

const getUserDisplayName = () => authStore.user?.username || authStore.user?.email || 'Presidium Member'

const handleLogout = async () => {
    try {
        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/auth/login')
    } catch (error) {
        toast.error('Error during logout')
    }
    showUserMenu.value = false
}

const refreshData = async () => {
    if (isRefreshing.value) return
    isRefreshing.value = true
    try {
        await loadSessionData()
        toast.success('Data refreshed')
    } catch (error) {
        toast.error('Failed to refresh data')
    } finally {
        isRefreshing.value = false
    }
}

const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true)
    unreadNotifications.value = 0
}

const handleNotificationClick = (notification) => {
    notification.read = true
    unreadNotifications.value = Math.max(0, unreadNotifications.value - 1)
    if (notification.route) router.push(notification.route)
    showNotifications.value = false
}

const getNotificationIcon = (type) => {
    const iconMap = { 'info': InformationCircleIcon, 'warning': ExclamationTriangleIcon, 'success': CheckCircleIcon, 'error': ExclamationTriangleIcon }
    return iconMap[type] || InformationCircleIcon
}

const getNotificationIconClass = (type) => {
    const classMap = { 'info': 'bg-blue-100 text-blue-600', 'warning': 'bg-yellow-100 text-yellow-600', 'success': 'bg-green-100 text-green-600', 'error': 'bg-red-100 text-red-600' }
    return classMap[type] || 'bg-gray-100 text-gray-600'
}

const formatTimeAgo = (timestamp) => {
    const diffInSeconds = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const handleOnlineStatus = () => { isOnline.value = navigator.onLine }
const handleClickOutside = (event) => { if (!event.target.closest('.relative')) { showUserMenu.value = false; showNotifications.value = false } }

// Lifecycle
onMounted(async () => {
    await loadSessionData()

    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    document.addEventListener('click', handleClickOutside)

    const timerInterval = setInterval(updateSessionTimer, 1000)
    const refreshInterval = setInterval(async () => { await loadSessionData() }, 30000)

    onUnmounted(() => {
        clearInterval(timerInterval)
        clearInterval(refreshInterval)
        window.removeEventListener('online', handleOnlineStatus)
        window.removeEventListener('offline', handleOnlineStatus)
        document.removeEventListener('click', handleClickOutside)
    })
})
</script>

<style scoped>
.nav-link {
    @apply flex items-center px-4 py-3 text-mun-gray-700 rounded-xl;
    @apply transition-all duration-200 hover:bg-white/60 hover:text-mun-blue;
    @apply relative;
}

.nav-link.active {
    @apply bg-mun-blue text-white shadow-lg;
}

.mt-16 {
    margin-top: 4rem;
}

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

.transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-all {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

.z-40 {
    z-index: 40;
}

.z-50 {
    z-index: 50;
}
</style>