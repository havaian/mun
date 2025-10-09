<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Sidebar -->
        <aside :class="[
            'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-mun-gray-200 transform transition-transform duration-200 ease-in-out',
            sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        ]">
            <!-- Brand Header -->
            <div
                class="flex items-center justify-between h-16 px-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue-600 to-mun-blue-700">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-mun-blue backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <img src="/logo.svg" alt="" class="w-8 h-8 text-white">
                        </div>
                    </div>
                    <div class="text-white">
                        <h1 class="text-lg font-bold tracking-tight">Admin Center</h1>
                        <p class="text-xs text-blue-100 opacity-90">System Control</p>
                    </div>
                </div>
                <button @click="toggleSidebar"
                    class="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <XMarkIcon class="w-5 h-5" />
                </button>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <!-- Dashboard -->
                <div class="space-y-2">
                    <router-link to="/admin" :class="getNavLinkClass('AdminDashboard')">
                        <ChartBarIcon class="w-5 h-5" />
                        <span>Dashboard</span>
                        <div v-if="unreadNotifications > 0" class="ml-auto">
                            <span
                                class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
                            </span>
                        </div>
                    </router-link>
                </div>

                <!-- Core Management -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">Core Management
                    </h3>
                    <router-link to="/admin/events" :class="getNavLinkClass('AdminEvents')">
                        <CalendarDaysIcon class="w-5 h-5" />
                        <span>Events</span>
                        <div v-if="stats.activeEvents > 0" class="ml-auto">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {{ stats.activeEvents }} active
                            </span>
                        </div>
                    </router-link>

                    <router-link to="/admin/committees" :class="getNavLinkClass('AdminCommittees')">
                        <UserGroupIcon class="w-5 h-5" />
                        <span>Committees</span>
                        <div v-if="stats.activeCommittees > 0" class="ml-auto">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {{ stats.activeCommittees }}
                            </span>
                        </div>
                    </router-link>

                    <router-link to="/admin/users" :class="getNavLinkClass('AdminUsers')">
                        <UsersIcon class="w-5 h-5" />
                        <span>Users</span>
                    </router-link>
                </div>

                <!-- Content & Data -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">Content & Data
                    </h3>
                    <router-link to="/admin/documents" :class="getNavLinkClass('AdminDocuments')">
                        <DocumentTextIcon class="w-5 h-5" />
                        <span>Documents</span>
                    </router-link>

                    <router-link to="/admin/reports" :class="getNavLinkClass('AdminReports')">
                        <DocumentChartBarIcon class="w-5 h-5" />
                        <span>Reports</span>
                    </router-link>
                </div>

                <!-- System -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">System</h3>
                    <router-link to="/admin/settings" :class="getNavLinkClass('AdminSettings')">
                        <CogIcon class="w-5 h-5" />
                        <span>Settings</span>
                    </router-link>
                </div>
            </nav>

            <!-- System Status Footer -->
            <div class="border-t border-mun-gray-200 p-4">
                <div class="space-y-3">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-mun-gray-600">System Status</span>
                        <div class="flex items-center space-x-2">
                            <div :class="['w-2 h-2 rounded-full', systemHealth.api ? 'bg-green-500' : 'bg-red-500']">
                            </div>
                            <span
                                :class="['text-xs font-medium', systemHealth.api ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.api ? 'Healthy' : 'Issues' }}
                            </span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="text-center p-2 bg-mun-gray-50 rounded">
                            <div class="font-semibold text-mun-gray-900">{{ responseTime }}ms</div>
                            <div class="text-mun-gray-500">Response</div>
                        </div>
                        <div class="text-center p-2 bg-mun-gray-50 rounded">
                            <div class="font-semibold text-mun-gray-900">{{ activeConnections }}</div>
                            <div class="text-mun-gray-500">Active</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Top Navigation Bar -->
        <header :class="[
            'fixed top-0 right-0 z-40 h-16 bg-white border-b border-mun-gray-200 shadow-sm',
            sidebarCollapsed ? 'left-0' : 'lg:left-72'
        ]">
            <div class="flex items-center justify-between h-full px-6">
                <!-- Left: Mobile menu + Page title -->
                <div class="flex items-center space-x-4">
                    <button @click="toggleSidebar"
                        class="lg:hidden p-2 text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100 rounded-lg transition-colors">
                        <Bars3Icon class="w-6 h-6" />
                    </button>
                    <div class="hidden sm:block">
                        <h1 class="text-xl font-semibold text-mun-gray-900">{{ pageTitle }}</h1>
                    </div>
                </div>

                <!-- Right: Actions + Status + User -->
                <div class="flex items-center space-x-4">
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
                                    <h3 class="text-lg font-semibold text-mun-gray-900">Notifications</h3>
                                    <button v-if="unreadNotifications > 0" @click="markAllAsRead"
                                        class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium">
                                        Mark all read
                                    </button>
                                </div>
                            </div>

                            <div class="max-h-80 overflow-y-auto">
                                <div v-if="notifications.length === 0" class="p-4 text-center text-mun-gray-500">No
                                    notifications</div>
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
                                class="w-8 h-8 bg-gradient-to-br from-mun-blue-500 to-mun-blue-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-semibold text-sm">{{ getUserInitials() }}</span>
                            </div>
                            <div class="hidden lg:block text-left">
                                <p class="text-sm font-medium text-mun-gray-900">{{ getUserDisplayName() }}</p>
                                <p class="text-xs text-mun-gray-500">System Administrator</p>
                            </div>
                            <ChevronDownIcon class="w-4 h-4 text-mun-gray-500" />
                        </button>

                        <!-- User Dropdown -->
                        <div v-if="showUserMenu"
                            class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-mun-gray-200 z-50">
                            <div class="p-3 border-b border-mun-gray-200">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-10 h-10 bg-gradient-to-br from-mun-blue-500 to-mun-blue-600 rounded-lg flex items-center justify-center">
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

                                <router-link to="/admin/settings"
                                    class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors"
                                    @click="showUserMenu = false">
                                    <CogIcon class="w-4 h-4 mr-3" />
                                    System Settings
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

        <!-- Main Content -->
        <div :class="['lg:ml-72 transition-all duration-200 ease-in-out pt-16', sidebarCollapsed ? 'ml-0' : 'ml-0']">
            <main class="min-h-screen bg-mun-gray-50">
                <router-view />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Icons
import {
    XMarkIcon, Bars3Icon, ChartBarIcon, CalendarDaysIcon, UserGroupIcon, UsersIcon, DocumentTextIcon,
    HandRaisedIcon, DocumentChartBarIcon, CogIcon, ClipboardDocumentListIcon, ArrowPathIcon, BellIcon,
    UserIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const sidebarCollapsed = ref(true)
const isRefreshing = ref(false)
const isOnline = ref(navigator.onLine)
const showNotifications = ref(false)
const showUserMenu = ref(false)

// Data
const stats = ref({ totalEvents: 0, activeEvents: 0, totalCommittees: 0, activeCommittees: 0, registeredUsers: 0, activeUsers: 0, documentsUploaded: 0 })
const systemHealth = ref({ api: true, database: true, websocket: true })
const responseTime = ref(45)
const activeConnections = ref(12)
const unreadNotifications = ref(2)

const notifications = ref([
    { id: 1, title: 'New Document Submitted', message: 'A new resolution has been submitted for review', type: 'info', read: false, createdAt: new Date(Date.now() - 300000), route: '/admin/documents' },
    { id: 2, title: 'System Maintenance', message: 'Scheduled maintenance tonight at 2:00 AM', type: 'warning', read: false, createdAt: new Date(Date.now() - 1800000) }
])

// Computed
const pageTitle = computed(() => {
    const titleMap = { 'AdminDashboard': 'Dashboard', 'AdminEvents': 'Event Management', 'AdminCommittees': 'Committee Management', 'AdminUsers': 'User Management', 'AdminDocuments': 'Document Management', 'AdminReports': 'Reports & Analytics', 'AdminSettings': 'System Settings' }
    return titleMap[route.name] || 'Admin Panel'
})

// Methods
const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }
const toggleNotifications = () => { showNotifications.value = !showNotifications.value; showUserMenu.value = false }
const toggleUserMenu = () => { showUserMenu.value = !showUserMenu.value; showNotifications.value = false }

const getNavLinkClass = (routeName) => {
    const baseClasses = 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3'
    return route.name === routeName ? `${baseClasses} bg-mun-blue-50 text-mun-blue-700 border-r-2 border-mun-blue-600` : `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-gray-900`
}

const getUserInitials = () => {
    const username = authStore.user?.username || authStore.user?.email || 'Admin'
    return username.split(' ').map(n => n[0]?.toUpperCase()).join('').slice(0, 2) || 'AD'
}

const getUserDisplayName = () => authStore.user?.username || authStore.user?.email || 'Administrator'

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
        await loadDashboardStats()
        await loadSystemMetrics()
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

const loadDashboardStats = async () => {
    try {
        const response = await fetch('/api/admin/dashboard/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('mun_token')}` } })
        if (response.ok) {
            const data = await response.json()
            if (data.success) stats.value = data.stats
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error)
    }
}

const loadSystemMetrics = async () => {
    try {
        const startTime = Date.now()
        const response = await fetch('/api/health', { headers: { 'Authorization': `Bearer ${localStorage.getItem('mun_token')}` } })
        responseTime.value = Date.now() - startTime
        if (response.ok) {
            const data = await response.json()
            systemHealth.value = { api: true, database: data.services?.database === 'connected', websocket: wsStore?.isConnected || false }
        }
    } catch (error) {
        systemHealth.value = { api: false, database: false, websocket: false }
    }
}

const handleOnlineStatus = () => { isOnline.value = navigator.onLine }
const handleClickOutside = (event) => { if (!event.target.closest('.relative')) { showUserMenu.value = false; showNotifications.value = false } }

// Lifecycle
onMounted(async () => {
    if (window.innerWidth >= 1024) sidebarCollapsed.value = false
    await loadDashboardStats()
    await loadSystemMetrics()
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    document.addEventListener('click', handleClickOutside)

    const refreshInterval = setInterval(async () => {
        if (!isRefreshing.value && isOnline.value) await loadSystemMetrics()
    }, 30000)

    onUnmounted(() => {
        clearInterval(refreshInterval)
        window.removeEventListener('online', handleOnlineStatus)
        window.removeEventListener('offline', handleOnlineStatus)
        document.removeEventListener('click', handleClickOutside)
    })
})

watch(route, () => { activeConnections.value = Math.floor(Math.random() * 50) + 1 })
</script>

<style scoped>
.transition-transform {
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
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

.z-40 {
    z-index: 40;
}

.z-50 {
    z-index: 50;
}
</style>