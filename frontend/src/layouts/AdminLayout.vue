<template>
    <ResponsiveSidebar :collapsed="sidebarCollapsed" title="Admin Center" subtitle="System Control"
        @toggle="toggleSidebar">
        <!-- Navigation Content -->
        <template #navigation>
            <!-- Dashboard -->
            <div class="space-y-2">
                <router-link to="/admin" :class="getNavLinkClass('AdminDashboard')">
                    <ChartBarIcon class="w-5 h-5" />
                    <span>Dashboard</span>
                    <div v-if="stats.unreadNotifications > 0" class="ml-auto">
                        <span
                            class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {{ stats.unreadNotifications > 99 ? '99+' : stats.unreadNotifications }}
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
                    <div v-if="stats.activeEvents > 0" class="ml-auto">
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {{ stats.activeEvents }}
                        </span>
                    </div>
                </router-link>

                <router-link to="/admin/committees" :class="getNavLinkClass('AdminCommittees')">
                    <UserGroupIcon class="w-5 h-5" />
                    <span>Committee Management</span>
                    <div v-if="stats.activeCommittees > 0" class="ml-auto">
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {{ stats.activeCommittees }}
                        </span>
                    </div>
                </router-link>

                <router-link to="/admin/users" :class="getNavLinkClass('AdminUsers')">
                    <UsersIcon class="w-5 h-5" />
                    <span>User Management</span>
                    <div v-if="stats.activeUsers > 0" class="ml-auto">
                        <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {{ stats.activeUsers }}
                        </span>
                    </div>
                </router-link>

                <router-link to="/admin/documents" :class="getNavLinkClass('AdminDocuments')">
                    <DocumentTextIcon class="w-5 h-5" />
                    <span>Document Management</span>
                    <div v-if="stats.recentDocuments > 0" class="ml-auto">
                        <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            {{ stats.recentDocuments }}
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
        </template>

        <!-- User Profile -->
        <template #user-profile>
            <div class="space-y-3">
                <!-- User Info -->
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-mun-blue-500 rounded-full flex items-center justify-center">
                        <UserIcon class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ authStore.user?.fullName || 'Admin User' }}
                        </p>
                        <p class="text-xs text-mun-gray-500 truncate">
                            {{ authStore.user?.email || 'admin@mun.com' }}
                        </p>
                    </div>
                </div>

                <!-- User Actions -->
                <div class="space-y-1">
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
        </template>

        <!-- Main Content -->
        <template #content>
            <main class="min-h-screen bg-mun-gray-50">
                <router-view />
            </main>
        </template>
    </ResponsiveSidebar>

    <!-- Network Status Indicator Module -->
    <NetworkStatusIndicator />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import ResponsiveSidebar from '@/components/ui/ResponsiveSidebar.vue'

// Icons
import {
    ChartBarIcon, CalendarDaysIcon, UserGroupIcon, UsersIcon, DocumentTextIcon,
    DocumentChartBarIcon, CogIcon, UserIcon, ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// State
const sidebarCollapsed = ref(false)
const isLoading = ref(false)

// Admin statistics from API
const stats = ref({
    activeEvents: 0,
    activeCommittees: 0,
    activeUsers: 0,
    recentDocuments: 0,
    unreadNotifications: 0
})

// Methods
const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const getNavLinkClass = (routeName) => {
    const baseClasses = 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3'
    return route.name === routeName
        ? `${baseClasses} bg-mun-blue-600 text-white shadow-lg`
        : `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-blue-600`
}

const handleLogout = async () => {
    try {
        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/auth/login')
    } catch (error) {
        console.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

// Load admin stats from API
const loadAdminStats = async () => {
    try {
        const response = await apiMethods.get('/admin/dashboard/stats')
        if (response?.data?.success) {
            const backendStats = response.data.stats
            stats.value = {
                activeEvents: backendStats.activeEvents || 0,
                activeCommittees: backendStats.activeCommittees || 0,
                activeUsers: backendStats.activeUsers || 0,
                recentDocuments: backendStats.documentsUploaded || 0,
                unreadNotifications: backendStats.pendingModeration || 0
            }
        }
    } catch (error) {
        console.error('Failed to load admin stats:', error)
        // Keep default values on error
    }
}

const refreshAdminData = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        await Promise.all([
            loadAdminStats()
        ])
    } catch (error) {
        console.error('Failed to refresh admin data:', error)
    } finally {
        isLoading.value = false
    }
}

// Auto-refresh interval
let refreshInterval = null

// Lifecycle
onMounted(async () => {
    await refreshAdminData()

    // Set up data refresh interval (every 30 seconds)
    refreshInterval = setInterval(refreshAdminData, 30000)
})

onUnmounted(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
    }
})
</script>

<style scoped>
/* Navigation styles */
.nav-link {
    @apply flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3;
}
</style>