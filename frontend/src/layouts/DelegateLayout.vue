<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Delegate Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-mun-lg transition-transform duration-300',
            { '-translate-x-full': appStore.sidebarCollapsed }
        ]">
            <!-- Sidebar Header -->
            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                <div class="flex items-center space-x-3">
                    <!-- Country Flag Placeholder -->
                    <div
                        class="w-10 h-8 bg-mun-red-500 rounded-lg flex items-center justify-center border border-mun-gray-300">
                        <span class="text-white text-xs font-bold">
                            {{ getCountryCode() }}
                        </span>
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-mun-gray-900">{{ userCountry?.name || 'Delegate' }}</h2>
                        <p class="text-sm text-mun-gray-500">{{ committeeInfo?.name || 'Committee' }}</p>
                    </div>
                </div>

                <button @click="appStore.toggleSidebar"
                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors lg:hidden">
                    <XMarkIcon class="w-5 h-5 text-mun-gray-600" />
                </button>
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 p-4 space-y-2">
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

            <!-- Quick Actions -->
            <div class="p-4 border-t border-mun-gray-100">
                <div class="space-y-2">
                    <button @click="quickJoinSpeakers"
                        class="w-full flex items-center px-3 py-2 text-sm font-medium text-un-blue hover:bg-un-blue/10 rounded-lg transition-colors">
                        <MegaphoneIcon class="w-4 h-4 mr-3" />
                        Join Speakers
                    </button>
                    <button @click="quickVote"
                        class="w-full flex items-center px-3 py-2 text-sm font-medium text-mun-green-600 hover:bg-mun-green-50 rounded-lg transition-colors">
                        <HandRaisedIcon class="w-4 h-4 mr-3" />
                        Quick Vote
                    </button>
                </div>
            </div>

            <!-- Sidebar Footer -->
            <div class="p-4 border-t border-mun-gray-100">
                <div class="text-sm text-mun-gray-600 mb-3">
                    Ranking: #{{ delegateStats?.ranking || '--' }}
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
                            <RouterLink to="/delegate"
                                class="text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                                Delegate
                            </RouterLink>
                            <ChevronRightIcon class="w-4 h-4 text-mun-gray-400" />
                            <span class="text-mun-gray-900 font-medium">{{ pageTitle }}</span>
                        </nav>
                    </div>

                    <!-- Center - Session Info -->
                    <div v-if="currentSession" class="hidden md:flex items-center space-x-4 text-sm">
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                currentSession.status === 'active' ? 'bg-mun-green-500' : 'bg-mun-yellow-500'
                            ]"></div>
                            <span class="text-mun-gray-600">Session {{ currentSession.number }}</span>
                        </div>
                        <div class="text-mun-gray-400">•</div>
                        <div class="text-mun-gray-600">{{ currentSession.mode }}</div>
                        <div v-if="sessionTimer" class="text-mun-gray-600">{{ sessionTimer }}</div>
                    </div>

                    <!-- Right side - User menu and notifications -->
                    <div class="flex items-center space-x-4">
                        <!-- Current Speaker Indicator -->
                        <div v-if="currentSpeaker" class="hidden md:flex items-center space-x-2 text-sm">
                            <div
                                class="flex items-center space-x-2 px-3 py-1 bg-mun-yellow-100 text-mun-yellow-700 rounded-full">
                                <div class="w-2 h-2 bg-mun-yellow-500 rounded-full animate-pulse"></div>
                                <span>{{ currentSpeaker }} speaking</span>
                            </div>
                        </div>

                        <!-- Messages -->
                        <RouterLink to="/delegate/messages"
                            class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors relative">
                            <ChatBubbleLeftIcon class="w-5 h-5 text-mun-gray-600" />
                            <span v-if="unreadMessages > 0"
                                class="absolute -top-1 -right-1 bg-mun-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {{ unreadMessages }}
                            </span>
                        </RouterLink>

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
                                <div class="w-8 h-8 bg-un-blue rounded-lg flex items-center justify-center">
                                    <span class="text-white text-sm font-medium">
                                        {{ getUserInitials() }}
                                    </span>
                                </div>
                                <div class="hidden md:block text-left">
                                    <p class="text-sm font-medium text-mun-gray-900">
                                        {{ userCountry?.name || 'Delegate' }}
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
                                    <div class="border-t border-mun-gray-100 my-1"></div>
                                    <div class="px-3 py-2 text-xs text-mun-gray-500">
                                        Rank: #{{ delegateStats?.ranking || '--' }}
                                    </div>
                                    <div class="px-3 py-2 text-xs text-mun-gray-500">
                                        Points: {{ delegateStats?.points || 0 }}
                                    </div>
                                    <div class="border-t border-mun-gray-100 my-1"></div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import { onClickOutside } from '@vueuse/core'

// Icons
import {
    XMarkIcon,
    Bars3Icon,
    ChevronRightIcon,
    BellIcon,
    ChatBubbleLeftIcon,
    ChevronDownIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    MegaphoneIcon,
    HandRaisedIcon,
    HomeIcon,
    DocumentTextIcon,
    UserGroupIcon
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
const userCountry = ref(null)
const committeeInfo = ref(null)
const delegateStats = ref(null)
const isSessionActive = ref(false)
const currentSession = ref(null)
const currentSpeaker = ref(null)
const unreadMessages = ref(0)
const notifications = ref([])
const notificationCount = ref(0)

// Navigation items
const navigationItems = [
    {
        name: 'DelegateDashboard',
        to: '/delegate',
        label: 'Dashboard',
        icon: HomeIcon
    },
    {
        name: 'DelegateDocuments',
        to: '/delegate/documents',
        label: 'Documents',
        icon: DocumentTextIcon
    },
    {
        name: 'DelegateCoalitions',
        to: '/delegate/coalitions',
        label: 'Coalitions',
        icon: UserGroupIcon,
        badge: 1
    },
    {
        name: 'DelegateMessages',
        to: '/delegate/messages',
        label: 'Messages',
        icon: ChatBubbleLeftIcon,
        badge: 5
    },
    {
        name: 'DelegateVoting',
        to: '/delegate/voting',
        label: 'Voting',
        icon: HandRaisedIcon
    }
]

// Computed
const pageTitle = computed(() => {
    const currentRoute = navigationItems.find(item => item.name === route.name)
    return currentRoute ? currentRoute.label : 'Delegate'
})

// Methods
const loadLayoutData = async () => {
    try {
        // Load user country
        userCountry.value = {
            name: authStore.user?.countryName || "United States",
            code: "US"
        }

        // Load committee info
        committeeInfo.value = {
            name: "General Assembly",
            id: authStore.user?.committeeId
        }

        // Load delegate stats
        delegateStats.value = {
            ranking: 12,
            points: 245
        }

        // Load current session
        currentSession.value = {
            number: 1,
            status: 'active',
            mode: 'Formal Debate'
        }

        currentSpeaker.value = "United Kingdom"
        isSessionActive.value = true
        unreadMessages.value = 5

        // Load notifications
        notifications.value = [
            {
                id: 1,
                message: "Invited to join Climate Action Coalition",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                message: "New voting session started",
                timestamp: new Date(Date.now() - 300000).toISOString()
            }
        ]

        notificationCount.value = notifications.value.length
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

        sessionTimer.value = `${hours}:${minutes.toString().padStart(2, '0')}`
    }, 1000)
}

const getCountryCode = () => {
    const country = userCountry.value?.name || 'US'
    return country.substring(0, 2).toUpperCase()
}

const getUserInitials = () => {
    const country = userCountry.value?.name || 'Country'
    return country.substring(0, 2).toUpperCase()
}

const quickJoinSpeakers = () => {
    toast.success('Added to speakers list')
    // TODO: API call to join speakers list
}

const quickVote = () => {
    router.push('/delegate/voting')
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
    background: linear-gradient(90deg, transparent, rgba(0, 158, 219, 0.1), transparent);
    transition: left 0.5s;
}

.nav-link:hover::before {
    left: 100%;
}

/* Active nav link styling */
.nav-link.active {
    @apply bg-un-blue/10 text-un-blue;
    transform: translateX(4px);
}
</style>