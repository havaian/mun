<template>
    <nav class="universal-navbar bg-white border-b border-mun-gray-200 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <!-- Left side: Logo and primary navigation -->
                <div class="flex items-center space-x-8">
                    <!-- Logo -->
                    <router-link to="/"
                        class="flex items-center space-x-3 text-mun-gray-900 hover:text-mun-blue-600 transition-colors">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-mun-blue-500 to-mun-blue-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-sm">🏛️</span>
                        </div>
                        <span class="font-bold text-lg hidden sm:block">MUN Platform</span>
                    </router-link>

                    <!-- Primary Navigation - Role-based -->
                    <div class="hidden md:flex items-center space-x-1">
                        <template v-for="item in primaryNavItems" :key="item.name">
                            <router-link :to="item.to" :class="getPrimaryNavClass(item.name)"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors">
                                <component :is="item.icon" class="w-4 h-4 mr-2" />
                                {{ item.label }}
                                <span v-if="item.badge" :class="item.badgeClass"
                                    class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                                    {{ item.badge }}
                                </span>
                            </router-link>
                        </template>
                    </div>
                </div>

                <!-- Right side: Actions and user menu -->
                <div class="flex items-center space-x-4">
                    <!-- Real-time status indicator -->
                    <div class="hidden sm:flex items-center space-x-2">
                        <div :class="['w-2 h-2 rounded-full', connectionStatus.class]"></div>
                        <span class="text-xs text-mun-gray-600">{{ connectionStatus.text }}</span>
                    </div>

                    <!-- Quick actions - Role-based -->
                    <div class="hidden lg:flex items-center space-x-2">
                        <template v-for="action in quickActions" :key="action.name">
                            <button @click="action.handler" :disabled="action.disabled" :class="action.class"
                                class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                :title="action.tooltip">
                                <component :is="action.icon"
                                    :class="['w-4 h-4', action.spinning ? 'animate-spin' : '']" />
                                <span class="ml-1.5 hidden xl:block">{{ action.label }}</span>
                            </button>
                        </template>
                    </div>

                    <!-- Notifications -->
                    <div class="relative">
                        <button @click="toggleNotifications"
                            class="p-2 text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100 rounded-lg transition-colors relative">
                            <BellIcon class="w-5 h-5" />
                            <span v-if="unreadCount > 0"
                                class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {{ unreadCount > 9 ? '9+' : unreadCount }}
                            </span>
                        </button>

                        <!-- Notifications dropdown -->
                        <div v-if="showNotifications"
                            class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-mun-gray-200 z-50">
                            <div class="p-4 border-b border-mun-gray-200">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-semibold text-mun-gray-900">Notifications</h3>
                                    <button v-if="unreadCount > 0" @click="markAllAsRead"
                                        class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium">
                                        Mark all read
                                    </button>
                                </div>
                            </div>

                            <div class="max-h-80 overflow-y-auto">
                                <div v-if="notifications.length === 0" class="p-4 text-center text-mun-gray-500">
                                    No notifications
                                </div>
                                <div v-else>
                                    <div v-for="notification in notifications.slice(0, 5)" :key="notification.id"
                                        :class="['p-4 border-b border-mun-gray-100 hover:bg-mun-gray-50 transition-colors', { 'bg-mun-blue-50': !notification.read }]"
                                        @click="handleNotificationClick(notification)" class="cursor-pointer">
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
                                                    formatTimeAgo(notification.createdAt) }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="notifications.length > 5" class="p-3 border-t border-mun-gray-200 text-center">
                                <router-link to="/notifications"
                                    class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium"
                                    @click="showNotifications = false">
                                    View all notifications
                                </router-link>
                            </div>
                        </div>
                    </div>

                    <!-- User menu -->
                    <div class="relative">
                        <button @click="toggleUserMenu"
                            class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-mun-gray-100 transition-colors">
                            <div
                                class="w-8 h-8 bg-gradient-to-br from-mun-blue-500 to-mun-blue-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-semibold text-sm">
                                    {{ getUserInitials() }}
                                </span>
                            </div>
                            <div class="hidden lg:block text-left">
                                <p class="text-sm font-medium text-mun-gray-900">{{ getUserDisplayName() }}</p>
                                <p class="text-xs text-mun-gray-500">{{ getRoleDisplayName() }}</p>
                            </div>
                            <ChevronDownIcon class="w-4 h-4 text-mun-gray-500" />
                        </button>

                        <!-- User dropdown -->
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
                                <!-- Role-specific menu items -->
                                <template v-for="item in userMenuItems" :key="item.name">
                                    <router-link v-if="item.to" :to="item.to"
                                        class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors"
                                        @click="showUserMenu = false">
                                        <component :is="item.icon" class="w-4 h-4 mr-3" />
                                        {{ item.label }}
                                    </router-link>
                                    <button v-else @click="item.handler"
                                        class="w-full flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors">
                                        <component :is="item.icon" class="w-4 h-4 mr-3" />
                                        {{ item.label }}
                                    </button>
                                    <hr v-if="item.divider" class="my-2 border-mun-gray-200">
                                </template>

                                <!-- Logout -->
                                <button @click="handleLogout"
                                    class="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                    <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile menu button -->
                    <button @click="toggleMobileMenu"
                        class="md:hidden p-2 text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100 rounded-lg transition-colors">
                        <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6" />
                        <XMarkIcon v-else class="w-6 h-6" />
                    </button>
                </div>
            </div>

            <!-- Mobile menu -->
            <div v-if="showMobileMenu" class="md:hidden border-t border-mun-gray-200 bg-white">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <template v-for="item in primaryNavItems" :key="item.name">
                        <router-link :to="item.to" :class="getMobileNavClass(item.name)"
                            class="flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors"
                            @click="showMobileMenu = false">
                            <component :is="item.icon" class="w-5 h-5 mr-3" />
                            {{ item.label }}
                            <span v-if="item.badge" :class="item.badgeClass"
                                class="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                                {{ item.badge }}
                            </span>
                        </router-link>
                    </template>
                </div>

                <!-- Mobile quick actions -->
                <div v-if="quickActions.length > 0" class="px-2 py-3 border-t border-mun-gray-200">
                    <p class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider mb-2 px-3">Quick Actions
                    </p>
                    <div class="space-y-1">
                        <template v-for="action in quickActions" :key="action.name">
                            <button @click="action.handler" :disabled="action.disabled"
                                class="w-full flex items-center px-3 py-2 text-sm font-medium text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors disabled:opacity-50">
                                <component :is="action.icon"
                                    :class="['w-4 h-4 mr-3', action.spinning ? 'animate-spin' : '']" />
                                {{ action.label }}
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile menu overlay -->
        <div v-if="showMobileMenu" class="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
            @click="showMobileMenu = false">
        </div>
    </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Icons
import {
    BellIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowRightOnRectangleIcon,
    UserIcon,
    CogIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    DocumentChartBarIcon,
    ClipboardDocumentListIcon,
    ArrowPathIcon,
    PlusIcon,
    QrCodeIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline'

// Stores and composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const showUserMenu = ref(false)
const showNotifications = ref(false)
const showMobileMenu = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// Computed properties
const userRole = computed(() => authStore.user?.role || 'guest')

const connectionStatus = computed(() => {
    if (!navigator.onLine) {
        return { class: 'bg-red-500', text: 'Offline' }
    }

    if (wsStore?.isConnected) {
        return { class: 'bg-green-500', text: 'Connected' }
    } else if (wsStore?.isConnecting) {
        return { class: 'bg-yellow-500 animate-pulse', text: 'Connecting' }
    } else {
        return { class: 'bg-orange-500', text: 'Limited' }
    }
})

const primaryNavItems = computed(() => {
    const baseItems = []

    switch (userRole.value) {
        case 'admin':
            return [
                { name: 'AdminDashboard', label: 'Dashboard', to: '/admin', icon: ChartBarIcon },
                { name: 'AdminEvents', label: 'Events', to: '/admin/events', icon: CalendarDaysIcon },
                { name: 'AdminCommittees', label: 'Committees', to: '/admin/committees', icon: UserGroupIcon },
                { name: 'AdminUsers', label: 'Users', to: '/admin/users', icon: UsersIcon },
                { name: 'AdminReports', label: 'Reports', to: '/admin/reports', icon: DocumentChartBarIcon }
            ]

        case 'presidium':
            return [
                { name: 'PresidiumDashboard', label: 'Dashboard', to: '/presidium', icon: ChartBarIcon },
                { name: 'PresidiumSessions', label: 'Sessions', to: '/presidium/sessions', icon: CalendarDaysIcon },
                { name: 'PresidiumDocuments', label: 'Documents', to: '/presidium/documents', icon: DocumentTextIcon },
                { name: 'PresidiumVoting', label: 'Voting', to: '/presidium/voting', icon: HandRaisedIcon },
                { name: 'PresidiumAttendance', label: 'Attendance', to: '/presidium/attendance', icon: UserGroupIcon }
            ]

        case 'delegate':
            return [
                { name: 'DelegateDashboard', label: 'Dashboard', to: '/delegate', icon: ChartBarIcon },
                { name: 'DelegateDocuments', label: 'Documents', to: '/delegate/documents', icon: DocumentTextIcon },
                { name: 'DelegateVoting', label: 'Voting', to: '/delegate/voting', icon: HandRaisedIcon },
                { name: 'DelegateMessaging', label: 'Messages', to: '/delegate/messaging', icon: UserIcon }
            ]

        default:
            return [
                { name: 'Home', label: 'Home', to: '/', icon: ChartBarIcon },
                { name: 'About', label: 'About', to: '/about', icon: InformationCircleIcon }
            ]
    }
})

const quickActions = computed(() => {
    switch (userRole.value) {
        case 'admin':
            return [
                {
                    name: 'refresh',
                    label: 'Refresh',
                    icon: ArrowPathIcon,
                    handler: refreshData,
                    class: 'text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100',
                    disabled: false,
                    spinning: false,
                    tooltip: 'Refresh dashboard data'
                },
                {
                    name: 'create-event',
                    label: 'New Event',
                    icon: PlusIcon,
                    handler: () => router.push('/admin/events'),
                    class: 'text-mun-blue-600 hover:text-mun-blue-700 hover:bg-mun-blue-50',
                    disabled: false,
                    spinning: false,
                    tooltip: 'Create new event'
                }
            ]

        case 'presidium':
            return [
                {
                    name: 'refresh',
                    label: 'Refresh',
                    icon: ArrowPathIcon,
                    handler: refreshData,
                    class: 'text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100',
                    disabled: false,
                    spinning: false,
                    tooltip: 'Refresh session data'
                }
            ]

        default:
            return []
    }
})

const userMenuItems = computed(() => {
    const baseItems = [
        { name: 'profile', label: 'Profile Settings', to: '/shared/profile', icon: UserIcon },
        { name: 'preferences', label: 'Preferences', to: '/shared/preferences', icon: CogIcon, divider: true }
    ]

    switch (userRole.value) {
        case 'admin':
            return [
                ...baseItems,
                { name: 'system-settings', label: 'System Settings', to: '/admin/settings', icon: CogIcon },
                { name: 'logs', label: 'System Logs', to: '/admin/logs', icon: ClipboardDocumentListIcon, divider: true }
            ]

        case 'presidium':
            return [
                ...baseItems,
                { name: 'committee-settings', label: 'Committee Settings', to: '/presidium/settings', icon: CogIcon, divider: true }
            ]

        default:
            return baseItems
    }
})

// Methods
const getPrimaryNavClass = (routeName) => {
    const isActive = route.name === routeName

    if (isActive) {
        return 'bg-mun-blue-100 text-mun-blue-700 border-mun-blue-500'
    }

    return 'text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100'
}

const getMobileNavClass = (routeName) => {
    const isActive = route.name === routeName

    if (isActive) {
        return 'bg-mun-blue-100 text-mun-blue-700'
    }

    return 'text-mun-gray-600 hover:text-mun-gray-900 hover:bg-mun-gray-100'
}

const getUserInitials = () => {
    const username = authStore.user?.username || authStore.user?.email || 'User'
    return username.split(' ').map(n => n[0]?.toUpperCase()).join('').slice(0, 2) || 'U'
}

const getUserDisplayName = () => {
    return authStore.user?.username || authStore.user?.email || 'User'
}

const getRoleDisplayName = () => {
    const roleMap = {
        'admin': 'System Administrator',
        'presidium': authStore.user?.presidiumRole || 'Presidium Member',
        'delegate': authStore.user?.countryName || 'Delegate',
        'guest': 'Guest'
    }
    return roleMap[userRole.value] || 'User'
}

const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value
    showNotifications.value = false
    showMobileMenu.value = false
}

const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value
    showUserMenu.value = false
    showMobileMenu.value = false
}

const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value
    showUserMenu.value = false
    showNotifications.value = false
}

const refreshData = async () => {
    // Emit event for parent components to handle refresh
    toast.success('Refreshing data...')
    // This would be handled by individual components
}

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

const handleNotificationClick = (notification) => {
    // Mark as read
    notification.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)

    // Navigate if has route
    if (notification.route) {
        router.push(notification.route)
    }

    showNotifications.value = false
}

const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true)
    unreadCount.value = 0
}

const getNotificationIcon = (type) => {
    const iconMap = {
        'info': InformationCircleIcon,
        'warning': ExclamationTriangleIcon,
        'success': CheckCircleIcon,
        'error': ExclamationTriangleIcon
    }
    return iconMap[type] || InformationCircleIcon
}

const getNotificationIconClass = (type) => {
    const classMap = {
        'info': 'bg-blue-100 text-blue-600',
        'warning': 'bg-yellow-100 text-yellow-600',
        'success': 'bg-green-100 text-green-600',
        'error': 'bg-red-100 text-red-600'
    }
    return classMap[type] || 'bg-gray-100 text-gray-600'
}

const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        showUserMenu.value = false
        showNotifications.value = false
    }
}

// Load notifications
const loadNotifications = async () => {
    try {
        // Mock notifications for now
        notifications.value = [
            {
                id: 1,
                title: 'New Document Submitted',
                message: 'A new resolution has been submitted for review',
                type: 'info',
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
                route: '/admin/documents'
            },
            {
                id: 2,
                title: 'System Maintenance',
                message: 'Scheduled maintenance tonight at 2:00 AM',
                type: 'warning',
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            }
        ]

        unreadCount.value = notifications.value.filter(n => !n.read).length
    } catch (error) {
        console.error('Failed to load notifications:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadNotifications()
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.universal-navbar {
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.95);
}

/* Smooth transitions */
.transition-colors {
    transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out;
}

/* Mobile menu animations */
@media (max-width: 768px) {

    .mobile-menu-enter-active,
    .mobile-menu-leave-active {
        transition: all 0.2s ease;
    }

    .mobile-menu-enter-from,
    .mobile-menu-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
}

/* Notification badge pulse */
@keyframes pulse-red {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}

.animate-pulse-red {
    animation: pulse-red 2s infinite;
}

/* Dropdown shadows */
.shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Z-index management */
.z-40 {
    z-index: 40;
}

.z-50 {
    z-index: 50;
}
</style>