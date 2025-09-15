<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Admin Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-mun-lg transition-transform duration-300',
            { '-translate-x-full': appStore.sidebarCollapsed }
        ]">
            <!-- Sidebar Header -->
            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-un-blue rounded-xl flex items-center justify-center">
                        <ShieldCheckIcon class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-mun-gray-900">Admin</h2>
                        <p class="text-sm text-mun-gray-500">Control Panel</p>
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
                        class="ml-auto px-2 py-1 text-xs font-medium bg-un-blue text-white rounded-full">
                        {{ item.badge }}
                    </span>
                </RouterLink>
            </nav>

            <!-- Sidebar Footer -->
            <div class="p-4 border-t border-mun-gray-100">
                <div class="flex items-center space-x-3 p-3 bg-mun-gray-50 rounded-xl">
                    <div class="w-8 h-8 bg-un-blue rounded-lg flex items-center justify-center">
                        <span class="text-sm font-bold text-white">
                            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ authStore.user?.username }}
                        </p>
                        <p class="text-xs text-mun-gray-500">Administrator</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div :class="[
            'transition-all duration-300',
            { 'lg:ml-64': !appStore.sidebarCollapsed, 'lg:ml-0': appStore.sidebarCollapsed }
        ]">
            <!-- Top Navigation Bar -->
            <header class="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-mun">
                <div class="flex items-center justify-between px-6 py-4">
                    <!-- Left Section -->
                    <div class="flex items-center space-x-4">
                        <!-- Mobile menu button -->
                        <button @click="appStore.toggleSidebar"
                            class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors lg:hidden">
                            <Bars3Icon class="w-6 h-6 text-mun-gray-600" />
                        </button>

                        <!-- Breadcrumbs -->
                        <nav class="hidden md:flex" aria-label="Breadcrumb">
                            <ol class="flex items-center space-x-2">
                                <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
                                    <RouterLink v-if="crumb.to && !crumb.active" :to="crumb.to"
                                        class="text-mun-gray-500 hover:text-un-blue transition-colors">
                                        {{ crumb.text }}
                                    </RouterLink>
                                    <span v-else class="text-mun-gray-900 font-medium">
                                        {{ crumb.text }}
                                    </span>
                                    <ChevronRightIcon v-if="index < breadcrumbs.length - 1"
                                        class="w-4 h-4 text-mun-gray-400 mx-2" />
                                </li>
                            </ol>
                        </nav>
                    </div>

                    <!-- Right Section -->
                    <div class="flex items-center space-x-4">
                        <!-- Network Status -->
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                { 'bg-mun-green animate-pulse': appStore.isOnline, 'bg-mun-red': appStore.isOffline }
                            ]"></div>
                            <span class="text-sm text-mun-gray-600 hidden md:block">
                                {{ appStore.isOnline ? 'Online' : 'Offline' }}
                            </span>
                        </div>

                        <!-- Notifications -->
                        <button @click="showNotifications = !showNotifications"
                            class="relative p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                            <BellIcon class="w-6 h-6 text-mun-gray-600" />
                            <span v-if="appStore.unreadNotifications > 0"
                                class="absolute -top-1 -right-1 w-5 h-5 bg-mun-red text-white text-xs rounded-full flex items-center justify-center">
                                {{ appStore.unreadNotifications > 9 ? '9+' : appStore.unreadNotifications }}
                            </span>
                        </button>

                        <!-- Theme Toggle -->
                        <button @click="appStore.toggleTheme"
                            class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                            <SunIcon v-if="appStore.theme === 'dark'" class="w-6 h-6 text-mun-gray-600" />
                            <MoonIcon v-else class="w-6 h-6 text-mun-gray-600" />
                        </button>

                        <!-- User Menu -->
                        <div class="relative">
                            <button @click="showUserMenu = !showUserMenu"
                                class="flex items-center space-x-2 p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                <div class="w-8 h-8 bg-un-blue rounded-lg flex items-center justify-center">
                                    <span class="text-sm font-bold text-white">
                                        {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                                    </span>
                                </div>
                                <ChevronDownIcon class="w-4 h-4 text-mun-gray-600" />
                            </button>

                            <!-- User Dropdown -->
                            <transition enter-active-class="transition ease-out duration-100"
                                enter-from-class="transform opacity-0 scale-95"
                                enter-to-class="transform opacity-100 scale-100"
                                leave-active-class="transition ease-in duration-75"
                                leave-from-class="transform opacity-100 scale-100"
                                leave-to-class="transform opacity-0 scale-95">T
                                <div v-show="showUserMenu"
                                    class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-mun-lg border border-white/20 py-2 z-50">
                                    <RouterLink to="/profile"
                                        class="flex items-center px-4 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-50">
                                        <UserIcon class="w-4 h-4 mr-3" />
                                        Profile Settings
                                    </RouterLink>
                                    <hr class="my-2 border-mun-gray-100" />
                                    <button @click="handleLogout"
                                        class="flex items-center w-full px-4 py-2 text-sm text-mun-red-600 hover:bg-mun-red-50">
                                        <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                                        Sign Out
                                    </button>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main class="p-6">
                <router-view />
            </main>
        </div>

        <!-- Mobile Sidebar Overlay -->
        <transition enter-active-class="transition-opacity ease-linear duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition-opacity ease-linear duration-300"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="!appStore.sidebarCollapsed" class="fixed inset-0 bg-black/50 z-40 lg:hidden"
                @click="appStore.setSidebarCollapsed(true)"></div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import {
    ShieldCheckIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    BellIcon,
    SunIcon,
    MoonIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    HomeIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentTextIcon,
    CogIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// State
const showUserMenu = ref(false)
const showNotifications = ref(false)

// Navigation items
const navigationItems = ref([
    {
        name: 'AdminDashboard',
        label: 'Dashboard',
        to: { name: 'AdminDashboard' },
        icon: HomeIcon
    },
    {
        name: 'AdminEvents',
        label: 'Events',
        to: { name: 'AdminEvents' },
        icon: CalendarDaysIcon
    },
    {
        name: 'AdminCommittees',
        label: 'Committees',
        to: { name: 'AdminCommittees' },
        icon: UserGroupIcon
    },
    {
        name: 'AdminUsers',
        label: 'Users',
        to: { name: 'AdminUsers' },
        icon: UsersIcon
    },
    {
        name: 'AdminReports',
        label: 'Reports',
        to: { name: 'AdminReports' },
        icon: ChartBarIcon,
        badge: '0'
    }
])

// Breadcrumbs
const breadcrumbs = computed(() => {
    const crumbs = [
        { text: 'Admin', to: { name: 'AdminDashboard' } }
    ]

    const routeMap = {
        'AdminDashboard': 'Dashboard',
        'AdminEvents': 'Events',
        'AdminCommittees': 'Committees',
        'AdminUsers': 'Users',
        'AdminReports': 'Reports'
    }

    if (route.name && route.name !== 'AdminDashboard') {
        crumbs.push({
            text: routeMap[route.name] || route.name,
            active: true
        })
    }

    return crumbs
})

// Methods
const handleLogout = async () => {
    const confirmed = await appStore.showConfirmDialog({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        confirmText: 'Sign Out',
        type: 'warning'
    })

    if (confirmed) {
        await authStore.logout()
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
})
</script>

<style scoped>
/* Custom nav link hover effects */
.nav-link {
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
    background: linear-gradient(135deg, #009edb, #0284c7);
    transform: translateX(4px);
}
</style>