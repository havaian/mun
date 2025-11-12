<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Admin Sidebar -->
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
                    <router-link to="/admin" :class="getNavLinkClass('AdminDashboard')" exact-active-class="nav-active">
                        <ChartBarIcon class="w-5 h-5" />
                        <span>Dashboard</span>
                        <div v-if="adminStore.stats.unreadNotifications > 0" class="ml-auto">
                            <span
                                class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {{ adminStore.stats.unreadNotifications > 99 ? '99+' :
                                adminStore.stats.unreadNotifications }}
                            </span>
                        </div>
                    </router-link>
                </div>

                <!-- System Management -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        System Management
                    </h3>

                    <router-link to="/admin/events" :class="getNavLinkClass('AdminEvents')">
                        <CalendarDaysIcon class="w-5 h-5" />
                        <span>Event Management</span>
                        <div v-if="adminStore.stats.activeEvents > 0" class="ml-auto">
                            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {{ adminStore.stats.activeEvents }}
                            </span>
                        </div>
                    </router-link>

                    <router-link to="/admin/committees" :class="getNavLinkClass('AdminCommittees')">
                        <UserGroupIcon class="w-5 h-5" />
                        <span>Committee Management</span>
                        <div v-if="adminStore.stats.activeCommittees > 0" class="ml-auto">
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {{ adminStore.stats.activeCommittees }}
                            </span>
                        </div>
                    </router-link>

                    <router-link to="/admin/users" :class="getNavLinkClass('AdminUsers')">
                        <UsersIcon class="w-5 h-5" />
                        <span>User Management</span>
                        <div v-if="adminStore.stats.activeUsers > 0" class="ml-auto">
                            <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {{ adminStore.stats.activeUsers }}
                            </span>
                        </div>
                    </router-link>

                    <router-link to="/admin/documents" :class="getNavLinkClass('AdminDocuments')">
                        <DocumentTextIcon class="w-5 h-5" />
                        <span>Document Management</span>
                        <div v-if="adminStore.stats.recentDocuments > 0" class="ml-auto">
                            <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                {{ adminStore.stats.recentDocuments }}
                            </span>
                        </div>
                    </router-link>
                </div>

                <!-- Analytics & Reports -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        Analytics & Reports
                    </h3>

                    <router-link to="/admin/reports" :class="getNavLinkClass('AdminReports')">
                        <DocumentChartBarIcon class="w-5 h-5" />
                        <span>Reports & Analytics</span>
                    </router-link>

                    <router-link to="/admin/logs" :class="getNavLinkClass('AdminLogs')">
                        <ClipboardDocumentListIcon class="w-5 h-5" />
                        <span>System Logs</span>
                    </router-link>
                </div>

                <!-- System Settings -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        Configuration
                    </h3>

                    <router-link to="/admin/settings" :class="getNavLinkClass('AdminSettings')">
                        <CogIcon class="w-5 h-5" />
                        <span>System Settings</span>
                    </router-link>
                </div>
            </nav>

            <!-- System Status Footer -->
            <div class="p-4 border-t border-mun-gray-200 bg-mun-gray-50">
                <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        System Status
                    </h4>
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">API Status</span>
                            <span :class="adminStore.systemHealth.api ? 'text-green-600' : 'text-red-600'">
                                {{ adminStore.systemHealth.api ? 'Healthy' : 'Issues' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">Database</span>
                            <span :class="adminStore.systemHealth.database ? 'text-green-600' : 'text-red-600'">
                                {{ adminStore.systemHealth.database ? 'Connected' : 'Disconnected' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">WebSocket</span>
                            <span :class="adminStore.systemHealth.websocket ? 'text-green-600' : 'text-red-600'">
                                {{ adminStore.systemHealth.websocket ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- User Info -->
                <div class="mt-4 pt-4 border-t border-mun-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-mun-blue rounded-lg flex items-center justify-center">
                            <span class="text-xs font-semibold text-white">
                                {{ getUserInitials() }}
                            </span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-mun-gray-900 truncate">
                                {{ authStore.user?.username || 'Admin' }}
                            </p>
                            <p class="text-xs text-mun-gray-500 truncate">
                                {{ authStore.user?.email || 'admin@mun.uz' }}
                            </p>
                        </div>
                    </div>

                    <!-- User Actions -->
                    <div class="space-y-1 mt-3">
                        <router-link to="/shared/profile"
                            class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <UserIcon class="w-4 h-4 mr-3" />
                            Profile Settings
                        </router-link>

                        <button @click="handleLogout"
                            class="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <div :class="['transition-all duration-200 ease-in-out', sidebarCollapsed ? 'ml-0' : 'ml-72']">
            <main class="min-h-screen bg-mun-gray-50">
                <!-- Use keep-alive to cache components and prevent unnecessary re-renders -->
                <!-- Remove key attribute to prevent forced remounting -->
                <router-view v-slot="{ Component, route }">
                    <keep-alive :include="keepAlivePages">
                        <component :is="Component" :key="route.fullPath" />
                    </keep-alive>
                </router-view>
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/plugins/toast'

// Icons
import {
    XMarkIcon, ChartBarIcon, CalendarDaysIcon, UserGroupIcon, UsersIcon, DocumentTextIcon,
    DocumentChartBarIcon, CogIcon, UserIcon, ArrowRightOnRectangleIcon, ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const toast = useToast()

// State
const sidebarCollapsed = ref(false)

// Pages to keep alive for better performance
const keepAlivePages = computed(() => [
    'AdminDashboard',
    'AdminEvents',
    'AdminCommittees',
    'AdminUsers',
    'AdminDocuments',
    'AdminReports'
])

// Methods
const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const getNavLinkClass = (routeName) => {
    const baseClasses = 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3'
    return route.name === routeName
        ? `${baseClasses} bg-mun-blue text-white shadow-lg`
        : `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-blue-600`
}

const getUserInitials = () => {
    const user = authStore.user
    if (user?.username) {
        return user.username.substring(0, 2).toUpperCase()
    }
    return 'AD'
}

const handleLogout = async () => {
    try {
        // Stop auto-refresh when logging out
        adminStore.stopAutoRefresh()

        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/auth/login')
    } catch (error) {
        console.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

// Lifecycle
onMounted(async () => {
    // Initialize admin data when layout loads
    await adminStore.initializeAdminData()

    // Start auto-refresh for system health and stats
    adminStore.startAutoRefresh(30000) // Refresh every 30 seconds
})

onUnmounted(() => {
    // Clean up auto-refresh when component unmounts
    adminStore.stopAutoRefresh()
})

onBeforeRouteLeave((to, from, next) => {
  // Clear any active intervals/timers before leaving
  console.log('Admin layout route guard - layout staying mounted')
  
  // Clean up any component-specific timers if needed
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  
  next()
})

const refreshTimer = ref(null)

onBeforeUnmount(() => {
  // Clean up timers and event listeners
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
  adminStore.stopAutoRefresh()
  console.log('Admin layout component unmounting - cleaning up')
})
</script>

<style scoped>
/* Navigation styles */
.nav-link {
    @apply flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3;
}

/* Active navigation state */
.nav-active {
    @apply bg-mun-blue text-white shadow-lg;
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
</style>