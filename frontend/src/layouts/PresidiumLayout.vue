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
            <nav class="flex-1 p-4 space-y-2">
                <RouterLink v-for="item in navigationItems" :key="item.name" :to="item.to" class="nav-link"
                    :class="{ 'active': $route.name === item.name }">
                    <component :is="item.icon" class="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{{ item.label }}</span>
                    <span v-if="item.badge"
                        class="ml-auto px-2 py-1 text-xs font-medium bg-mun-red-500 text-white rounded-full">
                        {{ item.badge }}
                    </span>
                </RouterLink>
            </nav>

            <!-- Sidebar Footer -->
            <div class="p-4 border-t border-mun-gray-100">
                <div class="text-sm text-mun-gray-600 mb-3">
                    Committee: {{ committeeInfo?.name || 'Loading...' }}
                </div>
                <div class="flex items-center space-x-2">
                    <div :class="[
                        'w-2 h-2 rounded-full',
                        isSessionActive ? 'bg-mun-green-500' : 'bg-mun-gray-300'
                    ]"></div>
                    <span class="text-sm text-mun-gray-600">
                        {{ isSessionActive ? 'Session Active' : 'No Active Session' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div :class="[
            'transition-all duration-300',
            appStore.sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        ]">
            <!-- Top Navigation Bar -->
            <header class="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm sticky top-0 z-40">
                <div class="flex items-center justify-between px-6 py-4">
                    <!-- Left side - Menu toggle and breadcrumb -->
                    <div class="flex items-center space-x-4">
                        <button @click="appStore.toggleSidebar"
                            class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors lg:hidden">
                            <Bars3Icon class="w-5 h-5 text-mun-gray-600" />
                        </button>

                        <nav class="hidden md:flex items-center space-x-2 text-sm">
                            <RouterLink to="/presidium"
                                class="text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                                Presidium
                            </RouterLink>
                            <ChevronRightIcon class="w-4 h-4 text-mun-gray-400" />
                            <span class="text-mun-gray-900 font-medium">{{ pageTitle }}</span>
                        </nav>
                    </div>

                    <!-- Right side - User menu and notifications -->
                    <div class="flex items-center space-x-4">
                        <!-- Session Timer -->
                        <div v-if="sessionTimer"
                            class="hidden md:flex items-center space-x-2 text-sm text-mun-gray-600">
                            <ClockIcon class="w-4 h-4" />
                            <span>{{ sessionTimer }}</span>
                        </div>

                        <!-- Notifications -->
                        <div class="relative">
                            <button @click="showNotifications = !showNotifications"
                                class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors relative">
                                <BellIcon class="w-5 h-5 text-mun-gray-600" />
                                <span v-if="notificationCount > 0"
                                    class="absolute -top-1 -right-1 bg-mun-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {{ notificationCount }}
                                </span>
                            </button>

                            <!-- Notifications Dropdown -->
                            <div v-if="showNotifications"
                                class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-mun-gray-200 z-50">
                                <div class="p-4 border-b border-mun-gray-200">
                                    <h3 class="font-medium text-mun-gray-900">Notifications</h3>
                                </div>
                                <div class="max-h-64 overflow-y-auto">
                                    <div v-for="notification in notifications" :key="notification.id"
                                        class="p-4 hover:bg-mun-gray-50 border-b border-mun-gray-100 last:border-b-0">
                                        <p class="text-sm text-mun-gray-900">{{ notification.message }}</p>
                                        <p class="text-xs text-mun-gray-500 mt-1">{{ formatTime(notification.timestamp)
                                        }}</p>
                                    </div>
                                    <div v-if="notifications.length === 0" class="p-4 text-center text-mun-gray-500">
                                        No new notifications
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- User Menu -->
                        <div class="relative">
                            <button @click="showUserMenu = !showUserMenu"
                                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                <div class="w-8 h-8 bg-mun-green-500 rounded-lg flex items-center justify-center">
                                    <span class="text-white text-sm font-medium">
                                        {{ getUserInitials() }}
                                    </span>
                                </div>
                                <div class="hidden md:block text-left">
                                    <p class="text-sm font-medium text-mun-gray-900">
                                        {{ authStore.user?.presidiumRole || 'Presidium' }}
                                    </p>
                                    <p class="text-xs text-mun-gray-500">{{ committeeInfo?.name }}</p>
                                </div>
                                <ChevronDownIcon class="w-4 h-4 text-mun-gray-500" />
                            </button>

                            <!-- User Dropdown -->
                            <div v-if="showUserMenu"
                                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-mun-gray-200 z-50">
                                <div class="p-2">
                                    <RouterLink to="/shared/profile"
                                        class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg">
                                        <UserIcon class="w-4 h-4 mr-3" />
                                        Profile
                                    </RouterLink>
                                    <button @click="handleLogout"
                                        class="w-full flex items-center px-3 py-2 text-sm text-mun-red-700 hover:bg-mun-red-50 rounded-lg">
                                        <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="min-h-screen">
                <RouterView />
            </main>
        </div>

        <!-- Mobile Menu Overlay -->
        <div v-if="!appStore.sidebarCollapsed" @click="appStore.toggleSidebar"
            class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import { onClickOutside } from '@vueuse/core'

// Icons
import {
    UserGroupIcon,
    XMarkIcon,
    Bars3Icon,
    ChevronRightIcon,
    ClockIcon,
    BellIcon,
    ChevronDownIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    HomeIcon,
    PlayIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    UsersIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const showUserMenu = ref(false)
const showNotifications = ref(false)
const sessionTimer = ref('00:00')
const committeeInfo = ref(null)
const isSessionActive = ref(false)
const notifications = ref([])
const notificationCount = ref(0)

// Navigation items
const navigationItems = [
    {
        name: 'PresidiumDashboard',
        to: '/presidium',
        label: 'Dashboard',
        icon: HomeIcon
    },
    {
        name: 'PresidiumSessions',
        to: '/presidium/sessions',
        label: 'Sessions',
        icon: PlayIcon
    },
    {
        name: 'PresidiumDocuments',
        to: '/presidium/documents',
        label: 'Documents',
        icon: DocumentTextIcon,
        badge: 3
    },
    {
        name: 'PresidiumVoting',
        to: '/presidium/voting',
        label: 'Voting',
        icon: HandRaisedIcon
    },
    {
        name: 'PresidiumAttendance',
        to: '/presidium/attendance',
        label: 'Attendance',
        icon: UsersIcon
    }
]

// Computed
const pageTitle = computed(() => {
    const currentRoute = navigationItems.find(item => item.name === route.name)
    return currentRoute ? currentRoute.label : 'Presidium'
})

// Methods
const loadLayoutData = async () => {
    try {
        // Load committee info
        committeeInfo.value = {
            name: "General Assembly",
            id: authStore.user?.committeeId
        }

        // Load notifications
        notifications.value = [
            {
                id: 1,
                message: "New position paper submitted by United States",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                message: "Voting session scheduled for 15:00",
                timestamp: new Date(Date.now() - 300000).toISOString()
            }
        ]

        notificationCount.value = notifications.value.length

        // Check session status
        isSessionActive.value = true
        startSessionTimer()

    } catch (error) {
        console.error('Load layout data error:', error)
    }
}

const startSessionTimer = () => {
    let seconds = 0
    setInterval(() => {
        seconds++
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        sessionTimer.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }, 1000)
}

const getUserInitials = () => {
    const role = authStore.user?.presidiumRole || 'P'
    return role.substring(0, 2).toUpperCase()
}

const handleLogout = async () => {
    const confirmed = await toast.confirm({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        confirmText: 'Sign Out',
        type: 'warning'
    })

    if (confirmed) {
        await authStore.logout()
    }
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
        return `${diffMins}m ago`
    } else {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}

// Close dropdowns when clicking outside
onClickOutside(showUserMenu, () => {
    showUserMenu.value = false
})

onClickOutside(showNotifications, () => {
    showNotifications.value = false
})

// Initialize sidebar state
onMounted(() => {
    appStore.initializeFromStorage()
    loadLayoutData()
})
</script>

<style scoped>
/* Custom nav link hover effects */
.nav-link {
    @apply flex items-center px-3 py-2 text-sm font-medium text-mun-gray-700 rounded-lg transition-all duration-200;
    @apply hover:bg-mun-gray-100 hover:text-mun-gray-900;
    position: relative;
    overflow: hidden;
}

.nav-link::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
    transition: left 0.5s;
}

.nav-link:hover::before {
    left: 100%;
}

/* Active nav link styling */
.nav-link.active {
    @apply bg-mun-green-100 text-mun-green-700;
    transform: translateX(4px);
}

.nav-link.active::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background: #10b981;
    border-radius: 0 2px 2px 0;
}
</style>