<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Navbar -->
        <UniversalNavbar />

        <!-- Performance-optimized sidebar with role-based navigation -->
        <aside :class="[
            'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-mun-gray-200 transform transition-transform duration-200 ease-in-out',
            'mt-16', // Add margin top for navbar
            sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        ]">
            <!-- Brand Header -->
            <div
                class="flex items-center justify-between h-16 px-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue-600 to-mun-blue-700">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <span class="text-white font-bold text-lg">🏛️</span>
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

            <!-- Navigation Sections -->
            <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <!-- Main Dashboard -->
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
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        Core Management
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
                        <div v-if="stats.activeUsers > 0" class="ml-auto">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {{ stats.activeUsers }}
                            </span>
                        </div>
                    </router-link>
                </div>

                <!-- Content & Data -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        Content & Data
                    </h3>
                    <router-link to="/admin/documents" :class="getNavLinkClass('AdminDocuments')">
                        <DocumentTextIcon class="w-5 h-5" />
                        <span>Documents</span>
                        <div v-if="pendingModeration > 0" class="ml-auto">
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                {{ pendingModeration }} pending
                            </span>
                        </div>
                    </router-link>

                    <router-link to="/admin/voting" :class="getNavLinkClass('AdminVoting')">
                        <HandRaisedIcon class="w-5 h-5" />
                        <span>Voting Systems</span>
                    </router-link>

                    <router-link to="/admin/reports" :class="getNavLinkClass('AdminReports')">
                        <DocumentChartBarIcon class="w-5 h-5" />
                        <span>Reports & Analytics</span>
                    </router-link>
                </div>

                <!-- System -->
                <div class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        System
                    </h3>
                    <router-link to="/admin/settings" :class="getNavLinkClass('AdminSettings')">
                        <CogIcon class="w-5 h-5" />
                        <span>Settings</span>
                    </router-link>

                    <router-link to="/admin/logs" :class="getNavLinkClass('AdminLogs')">
                        <ClipboardDocumentListIcon class="w-5 h-5" />
                        <span>System Logs</span>
                    </router-link>
                </div>
            </nav>

            <!-- System Status Footer -->
            <div class="border-t border-mun-gray-200 p-4">
                <div class="space-y-3">
                    <!-- Connection Status -->
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

                    <!-- Performance Metrics -->
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

        <!-- Main Content Area -->
        <div :class="[
            'lg:ml-72 transition-all duration-200 ease-in-out',
            'mt-16', // Add margin top for navbar
            sidebarCollapsed ? 'ml-0' : 'ml-0'
        ]">
            <!-- Page Content -->
            <main class="min-h-screen bg-mun-gray-50">
                <router-view />
            </main>
        </div>

        <!-- Mobile sidebar overlay -->
        <div v-if="!sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden mt-16"
            @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Import the Universal Navbar
import UniversalNavbar from '@/components/shared/UniversalNavbar.vue'

// Icons
import {
    XMarkIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    DocumentChartBarIcon,
    CogIcon,
    ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

// Stores and composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const sidebarCollapsed = ref(true)
const isRefreshing = ref(false)

// Dashboard data
const stats = ref({
    totalEvents: 0,
    activeEvents: 0,
    totalCommittees: 0,
    activeCommittees: 0,
    registeredUsers: 0,
    activeUsers: 0,
    documentsUploaded: 0
})

const systemHealth = ref({
    api: true,
    database: true,
    websocket: true
})

const responseTime = ref(0)
const activeConnections = ref(0)
const unreadNotifications = ref(0)
const pendingModeration = ref(0)

// Methods
const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const getNavLinkClass = (routeName) => {
    const baseClasses = 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3'
    const isActive = route.name === routeName

    if (isActive) {
        return `${baseClasses} bg-mun-blue-50 text-mun-blue-700 border-r-2 border-mun-blue-600`
    }

    return `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-gray-900`
}

const loadDashboardStats = async () => {
    try {
        const response = await fetch('/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (response.ok) {
            const data = await response.json()
            if (data.success) {
                stats.value = data.stats
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error)
    }
}

const loadSystemMetrics = async () => {
    try {
        // Simulate system health check
        const startTime = Date.now()

        const response = await fetch('/api/health', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        responseTime.value = Date.now() - startTime

        if (response.ok) {
            const data = await response.json()
            systemHealth.value = {
                api: true,
                database: data.services?.database === 'connected',
                websocket: wsStore?.isConnected || false
            }
        }
    } catch (error) {
        systemHealth.value = {
            api: false,
            database: false,
            websocket: false
        }
    }
}

// Lifecycle
onMounted(async () => {
    // Set responsive sidebar state
    if (window.innerWidth >= 1024) {
        sidebarCollapsed.value = false
    }

    // Load initial data
    await loadDashboardStats()
    await loadSystemMetrics()

    // Set up data refresh interval (every 30 seconds)
    const refreshInterval = setInterval(async () => {
        if (!isRefreshing.value) {
            await loadSystemMetrics()
        }
    }, 30000)

    // Cleanup interval on unmount
    onUnmounted(() => {
        clearInterval(refreshInterval)
    })
})

// Watch for route changes to update active connections count
watch(route, () => {
    activeConnections.value = Math.floor(Math.random() * 50) + 1 // Simulate active connections
})
</script>

<style scoped>
/* Performance optimized animations */
.transition-transform {
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

/* Scrollbar styling for webkit browsers */
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

/* Ensure proper z-index stacking */
.z-40 {
    z-index: 40;
}

.z-50 {
    z-index: 50;
}
</style>