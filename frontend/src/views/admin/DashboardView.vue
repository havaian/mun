<template>
    <div class="space-y-6 p-6">
        <!-- Header with Quick Actions -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p class="text-gray-600">System overview and key metrics</p>
            </div>
            <div class="flex space-x-3">
                <button @click="refreshDashboard" :disabled="isRefreshing"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                    <ArrowPathIcon class="h-4 w-4 mr-1" />
                    {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
                </button>
                <button @click="bulkGenerateQR" :disabled="isGeneratingQR"
                    class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                    <QrCodeIcon class="h-4 w-4 mr-1" />
                    {{ isGeneratingQR ? 'Generating...' : 'Generate QRs' }}
                </button>
            </div>
        </div>

        <!-- Stats Grid - Load First for Instant Feedback -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="stat in dashboardStats" :key="stat.title"
                class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">{{ stat.title }}</p>
                        <!-- Skeleton loading for stats -->
                        <div v-if="isLoadingStats" class="mt-2">
                            <div class="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                        <p v-else class="text-3xl font-bold text-gray-900 mt-2">
                            {{ stat.value?.toLocaleString() || '0' }}
                        </p>
                    </div>
                    <div :class="[
                        'h-12 w-12 rounded-md flex items-center justify-center',
                        stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                            stat.color === 'green' ? 'bg-green-100 text-green-600' :
                                stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                    'bg-orange-100 text-orange-600'
                    ]">
                        <component :is="stat.icon" class="h-6 w-6" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column - Active Events -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">Active Events</h3>
                            <button @click="goToEvents"
                                class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                View All
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <!-- Skeleton loading for events -->
                        <div v-if="isLoadingEvents" class="space-y-4">
                            <div v-for="i in 3" :key="i" class="flex items-center space-x-4">
                                <div class="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                                <div class="flex-1 space-y-2">
                                    <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                    <div class="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <!-- Events content -->
                        <div v-else-if="activeEvents.length > 0" class="space-y-4">
                            <div v-for="event in activeEvents.slice(0, 5)" :key="event.id"
                                class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                @click="goToEvent(event.id)">
                                <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CalendarDaysIcon class="h-5 w-5 text-blue-600" />
                                </div>
                                <div class="flex-1">
                                    <p class="font-medium text-gray-900">{{ event.name }}</p>
                                    <p class="text-sm text-gray-500">{{ formatDate(event.startDate) }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-medium text-gray-900">{{ event.committeeCount }} committees
                                    </p>
                                    <p class="text-xs text-gray-500">{{ event.participantCount }} participants</p>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8">
                            <CalendarDaysIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p class="text-gray-500">No active events</p>
                            <button @click="createEvent"
                                class="mt-2 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Create Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column - System Health & Quick Actions -->
            <div class="space-y-6">
                <!-- System Health -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">API Status</span>
                                <div v-if="isLoadingHealth" class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                <span v-else :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    systemHealth.apiStatus === 'healthy'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                ]">
                                    {{ systemHealth.apiStatus || 'Unknown' }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Database</span>
                                <div v-if="isLoadingHealth" class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                <span v-else :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    systemHealth.dbStatus === 'healthy'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                ]">
                                    {{ systemHealth.dbStatus || 'Unknown' }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">WebSocket</span>
                                <div v-if="isLoadingHealth" class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                <span v-else :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    systemHealth.wsStatus === 'healthy'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                ]">
                                    {{ systemHealth.wsStatus || 'Unknown' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div class="space-y-3">
                            <button @click="goToCommittees"
                                class="w-full inline-flex items-center justify-start px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <UserGroupIcon class="h-4 w-4 mr-2" />
                                Manage Committees
                            </button>
                            <button @click="goToUsers"
                                class="w-full inline-flex items-center justify-start px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <UsersIcon class="h-4 w-4 mr-2" />
                                User Management
                            </button>
                            <button @click="goToReports"
                                class="w-full inline-flex items-center justify-start px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <ChartBarIcon class="h-4 w-4 mr-2" />
                                View Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity - Load Last -->
        <div v-if="!isInitialLoad" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div class="p-6">
                <!-- Skeleton loading for activity -->
                <div v-if="isLoadingActivity" class="space-y-3">
                    <div v-for="i in 5" :key="i" class="flex items-start space-x-3">
                        <div class="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div class="flex-1 space-y-2">
                            <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div class="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                    </div>
                </div>
                <!-- Activity content -->
                <div v-else-if="recentActivity.length > 0" class="space-y-4">
                    <div v-for="activity in recentActivity.slice(0, 10)" :key="activity.id"
                        class="flex items-start space-x-3">
                        <div class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <div class="h-2 w-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm text-gray-900">{{ activity.description }}</p>
                            <p class="text-xs text-gray-500">{{ formatTime(activity.timestamp) }}</p>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-8">
                    <p class="text-gray-500">No recent activity</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Simple fetch-based API calls instead of complex apiMethods
const apiCall = async (endpoint, options = {}) => {
    try {
        const token = localStorage.getItem('mun_token')
        const response = await fetch(`/api${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.headers
            },
            ...options
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error)
        throw error
    }
}

// Icons
import {
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    QrCodeIcon,
    ChartBarIcon,
    EyeIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Loading states - Separate loading for different sections
const isInitialLoad = ref(true)
const isLoadingStats = ref(false)
const isLoadingEvents = ref(false)
const isLoadingHealth = ref(false)
const isLoadingActivity = ref(false)
const isRefreshing = ref(false)
const isGeneratingQR = ref(false)

// Data
const stats = ref({
    totalEvents: 0,
    activeCommittees: 0,
    registeredUsers: 0,
    documentsUploaded: 0
})

const systemHealth = ref({
    apiStatus: null,
    apiResponseTime: null,
    dbStatus: null,
    wsStatus: null,
    activeConnections: null,
    storageUsed: null
})

const activeEvents = ref([])
const recentActivity = ref([])

// Cache for API responses
const cache = ref({
    stats: null,
    events: null,
    health: null,
    activity: null,
    timestamp: null
})

// Computed
const dashboardStats = computed(() => [
    {
        title: 'Total Events',
        value: stats.value.totalEvents,
        icon: CalendarDaysIcon,
        color: 'blue'
    },
    {
        title: 'Active Committees',
        value: stats.value.activeCommittees,
        icon: UserGroupIcon,
        color: 'green'
    },
    {
        title: 'Registered Users',
        value: stats.value.registeredUsers,
        icon: UsersIcon,
        color: 'purple'
    },
    {
        title: 'Documents Uploaded',
        value: stats.value.documentsUploaded,
        icon: DocumentTextIcon,
        color: 'orange'
    }
])

// Check if cache is valid (5 minutes)
const isCacheValid = () => {
    if (!cache.value.timestamp) return false
    return Date.now() - cache.value.timestamp < 300000 // 5 minutes
}

// Load dashboard data in stages for perceived performance
const loadDashboardData = async (forceRefresh = false) => {
    try {
        // Check cache first
        if (!forceRefresh && isCacheValid()) {
            stats.value = cache.value.stats
            activeEvents.value = cache.value.events
            systemHealth.value = cache.value.health
            recentActivity.value = cache.value.activity
            return
        }

        // Stage 1: Load stats first (most important) - this also gets events
        await loadStats()

        // Stage 2: Load health check in parallel with any remaining data
        await loadSystemHealth()

        // Stage 3: Load activity last (least important) with a small delay
        await nextTick() // Wait for UI update
        setTimeout(() => loadRecentActivity(), 200) // Defer to show other content first

    } catch (error) {
        console.error('Dashboard loading error:', error)
        // Don't show error toast for API issues, just log them
        console.warn('Some dashboard data unavailable, using fallbacks')
    } finally {
        isInitialLoad.value = false
    }
}

// Load stats - Use correct new admin endpoint  
const loadStats = async () => {
    try {
        isLoadingStats.value = true

        // Use NEW /api/admin/dashboard/stats endpoint
        const response = await apiCall('/admin/dashboard/stats')

        if (response?.success && response.stats) {
            const data = response.stats
            stats.value = {
                totalEvents: data.totalEvents || 0,
                activeCommittees: data.activeCommittees || 0,
                registeredUsers: data.registeredUsers || 0,
                documentsUploaded: data.documentsUploaded || 0
            }
            cache.value.stats = stats.value
        }
    } catch (error) {
        console.error('Load stats error:', error)
        // Fallback data
        stats.value = {
            totalEvents: 0,
            activeCommittees: 0,
            registeredUsers: 0,
            documentsUploaded: 0
        }
    } finally {
        isLoadingStats.value = false
    }
}

// Load events - Use existing events endpoint
const loadEvents = async () => {
    try {
        isLoadingEvents.value = true

        // Use existing /api/events endpoint (works)
        const response = await apiCall('/events')

        if (response && Array.isArray(response)) {
            activeEvents.value = response.filter(event => event.status === 'active').slice(0, 5)
            cache.value.events = activeEvents.value
        }
    } catch (error) {
        console.error('Load events error:', error)
        activeEvents.value = []
    } finally {
        isLoadingEvents.value = false
    }
}

// Load system health - Priority 2
const loadSystemHealth = async () => {
    try {
        isLoadingHealth.value = true
        const response = await fetch('/api/health', {
            method: 'GET',
            timeout: 3000 // Quick timeout for health check
        }).then(res => res.ok ? res.json() : null).catch(() => null)

        if (response) {
            systemHealth.value = {
                apiStatus: response.status === 'healthy' ? 'healthy' : 'unhealthy',
                apiResponseTime: response.responseTime || null,
                dbStatus: response.services?.database || 'unknown',
                wsStatus: response.modules?.websocket === 'active' ? 'healthy' : 'unhealthy',
                activeConnections: response.connections?.active || 0,
                storageUsed: response.storage?.usedPercent || 0
            }
            cache.value.health = systemHealth.value
        } else {
            // Set unhealthy status if no response
            systemHealth.value = {
                apiStatus: 'unhealthy',
                apiResponseTime: null,
                dbStatus: 'unknown',
                wsStatus: 'unhealthy',
                activeConnections: 0,
                storageUsed: 0
            }
        }
    } catch (error) {
        console.error('Load system health error:', error)
        systemHealth.value = {
            apiStatus: 'unhealthy',
            apiResponseTime: null,
            dbStatus: 'unknown',
            wsStatus: 'unhealthy',
            activeConnections: 0,
            storageUsed: 0
        }
    } finally {
        isLoadingHealth.value = false
    }
}

// Load recent activity - Use new admin endpoint
const loadRecentActivity = async () => {
    try {
        isLoadingActivity.value = true

        // Use NEW /api/admin/dashboard/activity endpoint
        const response = await apiCall('/admin/dashboard/activity')

        if (response?.success && response.activities) {
            recentActivity.value = response.activities
            cache.value.activity = recentActivity.value
            cache.value.timestamp = Date.now()
        }
    } catch (error) {
        console.error('Load activity error:', error)
        recentActivity.value = []
    } finally {
        isLoadingActivity.value = false
    }
}

// Actions
const refreshDashboard = async () => {
    isRefreshing.value = true
    await loadDashboardData(true) // Force refresh
    toast.success('Dashboard refreshed')
    isRefreshing.value = false
}

const bulkGenerateQR = async () => {
    try {
        isGeneratingQR.value = true

        // Use NEW /api/admin/committees/bulk-qr endpoint
        const response = await apiCall('/admin/committees/bulk-qr', {
            method: 'POST',
            body: JSON.stringify({
                committeeIds: [] // All committees - backend will handle getting the list
            })
        })

        if (response?.success) {
            toast.success(`QR codes generated. Total: ${response.totalQRGenerated || 0}`)
        } else {
            toast.error('Failed to generate QR codes')
        }
    } catch (error) {
        console.error('QR generation error:', error)
        toast.error('Failed to generate QR codes')
    } finally {
        isGeneratingQR.value = false
    }
}

// Navigation helpers
const goToEvent = (eventId) => {
    router.push({ name: 'AdminEvents', query: { highlight: eventId } })
}

const goToEvents = () => {
    router.push({ name: 'AdminEvents' })
}

const goToCommittees = () => {
    router.push({ name: 'AdminCommittees' })
}

const goToUsers = () => {
    router.push({ name: 'AdminUsers' })
}

const goToReports = () => {
    router.push({ name: 'AdminReports' })
}

const createEvent = () => {
    router.push({ name: 'AdminEvents', query: { create: 'true' } })
}

// Utility functions
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const now = new Date()
    const diff = Math.floor((now - new Date(timestamp)) / 60000)
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
}

// Initialize
onMounted(() => {
    loadDashboardData()
})
</script>

<style scoped>
/* Smooth loading animations */
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

/* Hover effects */
.hover\:bg-gray-50:hover {
    background-color: rgb(249 250 251);
}

/* Card hover effects */
.shadow-sm {
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.shadow-sm:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    transition: box-shadow 0.15s ease-in-out;
}
</style>