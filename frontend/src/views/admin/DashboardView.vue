<template>
    <div class="admin-dashboard">
        <!-- Loading State -->
        <div v-if="isInitialLoading" class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-mun-blue-600 mx-auto mb-4"></div>
                <p class="text-mun-gray-600">Loading dashboard...</p>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="space-y-6 p-6">
            <!-- Header -->
            <div class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 class="text-2xl font-bold text-mun-gray-900">Admin Dashboard</h1>
                        <p class="text-mun-gray-600 mt-1">
                            Welcome back, {{ authStore.user?.username || 'Administrator' }}. System overview and
                            controls.
                        </p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="text-sm text-mun-gray-600">
                            Last updated: {{ format.time(lastUpdated) }}
                        </div>
                        <button @click="refreshAll" :disabled="isRefreshing"
                            class="inline-flex items-center px-4 py-2 border border-mun-gray-300 rounded-lg text-sm font-medium text-mun-gray-700 bg-white hover:bg-mun-gray-50 disabled:opacity-50 transition-colors">
                            <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isRefreshing }]" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="mun-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Events</p>
                            <p class="text-3xl font-bold text-mun-gray-900 mt-2">{{ stats.totalEvents || 0 }}</p>
                            <div class="flex items-center mt-2">
                                <span class="text-sm text-green-600 font-medium">{{ stats.activeEvents || 0 }}
                                    active</span>
                            </div>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-lg">
                            <CalendarDaysIcon class="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div class="mun-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Committees</p>
                            <p class="text-3xl font-bold text-mun-gray-900 mt-2">{{ stats.totalCommittees || 0 }}</p>
                            <div class="flex items-center mt-2">
                                <span class="text-sm text-green-600 font-medium">{{ stats.activeCommittees || 0 }}
                                    active</span>
                            </div>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-lg">
                            <UserGroupIcon class="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div class="mun-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Users</p>
                            <p class="text-3xl font-bold text-mun-gray-900 mt-2">{{ stats.registeredUsers || 0 }}</p>
                            <div class="flex items-center mt-2">
                                <span class="text-sm text-green-600 font-medium">{{ stats.activeUsers || 0 }}
                                    online</span>
                            </div>
                        </div>
                        <div class="p-3 bg-green-100 rounded-lg">
                            <UsersIcon class="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div class="mun-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Documents</p>
                            <p class="text-3xl font-bold text-mun-gray-900 mt-2">{{ stats.documentsUploaded || 0 }}</p>
                            <div class="flex items-center mt-2">
                                <span class="text-sm text-orange-600 font-medium">{{ stats.pendingModeration || 0 }}
                                    pending</span>
                            </div>
                        </div>
                        <div class="p-3 bg-orange-100 rounded-lg">
                            <DocumentTextIcon class="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Health & Recent Activity & Active Events -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Comprehensive System Health Monitor -->
                <div class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900">System Health Monitor</h3>
                        <div class="flex items-center space-x-2">
                            <div :class="['w-3 h-3 rounded-full', getOverallHealthColor()]"></div>
                            <span :class="['text-sm font-medium', getOverallHealthTextColor()]">
                                {{ getOverallHealthStatus() }}
                            </span>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <!-- Core Services -->
                        <div>
                            <h4 class="font-medium text-mun-gray-900 mb-3 flex items-center">
                                <ServerIcon class="w-4 h-4 mr-2" />
                                Core Services
                            </h4>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            :class="['w-3 h-3 rounded-full', systemHealth.api ? 'bg-green-500' : 'bg-red-500']">
                                        </div>
                                        <span class="font-medium text-mun-gray-900">API Server</span>
                                    </div>
                                    <span
                                        :class="['text-sm font-medium', systemHealth.api ? 'text-green-700' : 'text-red-700']">
                                        {{ systemHealth.api ? 'Healthy' : 'Down' }}
                                    </span>
                                </div>

                                <div class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            :class="['w-3 h-3 rounded-full', systemHealth.database ? 'bg-green-500' : 'bg-red-500']">
                                        </div>
                                        <span class="font-medium text-mun-gray-900">Database</span>
                                    </div>
                                    <span
                                        :class="['text-sm font-medium', systemHealth.database ? 'text-green-700' : 'text-red-700']">
                                        {{ systemHealth.database ? 'Connected' : 'Disconnected' }}
                                    </span>
                                </div>

                                <div class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            :class="['w-3 h-3 rounded-full', wsStatus.connected ? 'bg-green-500' : 'bg-yellow-500']">
                                        </div>
                                        <span class="font-medium text-mun-gray-900">WebSocket</span>
                                    </div>
                                    <span
                                        :class="['text-sm font-medium', wsStatus.connected ? 'text-green-700' : 'text-yellow-700']">
                                        {{ wsStatus.text }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Application Modules -->
                        <div>
                            <h4 class="font-medium text-mun-gray-900 mb-3 flex items-center">
                                <PuzzlePieceIcon class="w-4 h-4 mr-2" />
                                Application Modules
                            </h4>
                            <div class="grid grid-cols-2 gap-2">
                                <div v-for="(status, module) in healthData.modules" :key="module"
                                    class="flex items-center justify-between p-2 bg-mun-gray-50 rounded text-xs">
                                    <span class="text-mun-gray-700 capitalize">{{ module }}</span>
                                    <div class="flex items-center space-x-1">
                                        <div :class="['w-1.5 h-1.5 rounded-full', getModuleStatusColor(status)]"></div>
                                        <span :class="['font-medium', getModuleStatusTextColor(status)]">
                                            {{ status }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- External Services -->
                        <div>
                            <h4 class="font-medium text-mun-gray-900 mb-3 flex items-center">
                                <CloudIcon class="w-4 h-4 mr-2" />
                                External Services
                            </h4>
                            <div class="space-y-2">
                                <div v-for="(status, service) in healthData.services" :key="service"
                                    class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                    <span class="text-sm text-mun-gray-700 capitalize">{{ service }}</span>
                                    <div class="flex items-center space-x-2">
                                        <div :class="['w-2 h-2 rounded-full', getServiceStatusColor(status)]"></div>
                                        <span :class="['text-xs font-medium', getServiceStatusTextColor(status)]">
                                            {{ status }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Metrics -->
                        <div class="pt-4 border-t border-mun-gray-200">
                            <div class="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div class="text-lg font-bold text-mun-gray-900">{{ responseTime }}ms</div>
                                    <div class="text-xs text-mun-gray-600">Response Time</div>
                                </div>
                                <div>
                                    <div class="text-lg font-bold text-mun-gray-900">{{ formatUptime(healthData.uptime)
                                    }}</div>
                                    <div class="text-xs text-mun-gray-600">Uptime</div>
                                </div>
                                <div>
                                    <div class="text-lg font-bold text-mun-gray-900">{{ healthData.version || '1.0.0' }}
                                    </div>
                                    <div class="text-xs text-mun-gray-600">Version</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity & Active Events -->
                <div class="space-y-6">
                    <!-- Recent Activity -->
                    <div class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-mun-gray-900">Recent Activity</h3>
                            <router-link to="/admin/logs"
                                class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium">
                                View all logs →
                            </router-link>
                        </div>

                        <div v-if="isLoadingActivity" class="space-y-3">
                            <div v-for="i in 5" :key="i" class="animate-pulse">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-mun-gray-200 rounded-full"></div>
                                    <div class="flex-1">
                                        <div class="h-4 bg-mun-gray-200 rounded w-3/4 mb-2"></div>
                                        <div class="h-3 bg-mun-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="recentActivity.length > 0" class="space-y-4">
                            <div v-for="activity in recentActivity.slice(0, 5)" :key="activity.id"
                                class="flex items-start space-x-3 p-3 hover:bg-mun-gray-50 rounded-lg transition-colors">
                                <div class="flex-shrink-0">
                                    <div
                                        :class="['w-8 h-8 rounded-full flex items-center justify-center', getActivityIconClass(activity.type)]">
                                        <component :is="getActivityIcon(activity.type)" class="w-4 h-4" />
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-mun-gray-900">{{ activity.description }}</p>
                                    <div class="flex items-center space-x-2 mt-1">
                                        <span class="text-xs text-mun-gray-500">{{ formatTimeAgo(activity.timestamp)
                                            }}</span>
                                        <span v-if="activity.user" class="text-xs text-mun-gray-500">by {{ activity.user
                                            }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="text-center py-8">
                            <ClockIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
                            <p class="text-mun-gray-500">No recent activity</p>
                        </div>
                    </div>

                    <!-- Active Events -->
                    <div class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-mun-gray-900">Active Events</h3>
                            <router-link to="/admin/events"
                                class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium">
                                Manage events →
                            </router-link>
                        </div>

                        <div v-if="isLoadingEvents" class="space-y-3">
                            <div v-for="i in 3" :key="i" class="animate-pulse">
                                <div class="h-16 bg-mun-gray-200 rounded-lg"></div>
                            </div>
                        </div>

                        <div v-else-if="activeEvents.length > 0" class="space-y-3">
                            <div v-for="event in activeEvents" :key="event._id"
                                class="border border-mun-gray-200 rounded-lg p-4 hover:border-mun-blue-300 transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-semibold text-mun-gray-900">{{ event.name }}</h4>
                                        <p class="text-sm text-mun-gray-600 mt-1">
                                            {{ event.committees?.length || 0 }} committees •
                                            {{ formatEventDate(event.startDate) }}
                                        </p>
                                    </div>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div v-else class="text-center py-8">
                            <CalendarDaysIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
                            <p class="text-mun-gray-500 mb-2">No active events</p>
                            <button @click="$router.push('/admin/events')"
                                class="text-sm text-mun-blue-600 hover:text-mun-blue-700 font-medium">
                                Create your first event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import format from '@/utils/time'

// Icons
import {
    ArrowPathIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    ClockIcon,
    UserIcon,
    CogIcon,
    HandRaisedIcon,
    DocumentIcon,
    ServerIcon,
    PuzzlePieceIcon,
    CloudIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isInitialLoading = ref(true)
const isRefreshing = ref(false)
const isLoadingActivity = ref(false)
const isLoadingEvents = ref(false)
const isGeneratingQR = ref(false)
const lastUpdated = ref(new Date())

// Data
const stats = ref({
    totalEvents: 0,
    activeEvents: 0,
    totalCommittees: 0,
    activeCommittees: 0,
    registeredUsers: 0,
    activeUsers: 0,
    documentsUploaded: 0,
    pendingModeration: 0
})

const systemHealth = ref({
    api: true,
    database: true,
    websocket: true
})

const healthData = ref({
    status: 'healthy',
    uptime: 0,
    version: '1.0.0',
    modules: {},
    services: {}
})

const responseTime = ref(0)
const recentActivity = ref([])
const activeEvents = ref([])

// Computed
const wsStatus = computed(() => {
    if (!wsStore) return { connected: false, text: 'Not Available' }
    return {
        connected: wsStore.isConnected,
        text: wsStore.isConnected ? 'Connected' : wsStore.isConnecting ? 'Connecting...' : 'Disconnected'
    }
})

// Health status methods
const getOverallHealthColor = () => {
    if (healthData.value.status === 'healthy') return 'bg-green-500'
    if (healthData.value.status === 'degraded') return 'bg-yellow-500'
    return 'bg-red-500'
}

const getOverallHealthTextColor = () => {
    if (healthData.value.status === 'healthy') return 'text-green-700'
    if (healthData.value.status === 'degraded') return 'text-yellow-700'
    return 'text-red-700'
}

const getOverallHealthStatus = () => {
    if (healthData.value.status === 'healthy') return 'All Systems Operational'
    if (healthData.value.status === 'degraded') return 'Some Issues Detected'
    return 'Major Issues'
}

const getModuleStatusColor = (status) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500'
}

const getModuleStatusTextColor = (status) => {
    return status === 'active' ? 'text-green-700' : 'text-red-700'
}

const getServiceStatusColor = (status) => {
    const statusMap = {
        'connected': 'bg-green-500',
        'available': 'bg-green-500',
        'cached': 'bg-blue-500',
        'disconnected': 'bg-red-500',
        'unavailable': 'bg-red-500'
    }
    return statusMap[status] || 'bg-gray-500'
}

const getServiceStatusTextColor = (status) => {
    const statusMap = {
        'connected': 'text-green-700',
        'available': 'text-green-700',
        'cached': 'text-blue-700',
        'disconnected': 'text-red-700',
        'unavailable': 'text-red-700'
    }
    return statusMap[status] || 'text-gray-700'
}

// API Methods - Using apiMethods from utils
const loadDashboardStats = async () => {
    try {
        const response = await apiMethods.admin.getDashboardStats()

        if (response?.data?.success) {
            stats.value = { ...stats.value, ...response.data.stats }
        } else {
            throw new Error(response?.data?.error || 'Failed to load stats')
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        toast.error('Failed to load dashboard statistics')
    }
}

const loadRecentActivity = async () => {
    isLoadingActivity.value = true
    try {
        const response = await apiMethods.admin.getRecentActivity({ limit: 10 })

        if (response?.data?.success) {
            recentActivity.value = response.data.activities || []
        } else {
            throw new Error(response?.data?.error || 'Failed to load activity')
        }
    } catch (error) {
        console.error('Failed to load recent activity:', error)
        toast.error('Failed to load recent activity')
    } finally {
        isLoadingActivity.value = false
    }
}

const loadActiveEvents = async () => {
    isLoadingEvents.value = true
    try {
        const response = await apiMethods.events.getAll({ status: 'active' })

        activeEvents.value = Array.isArray(response?.data) ? response.data : response?.data?.events || []
    } catch (error) {
        console.error('Failed to load active events:', error)
        toast.error('Failed to load active events')
    } finally {
        isLoadingEvents.value = false
    }
}

const loadSystemHealth = async () => {
    try {
        const startTime = Date.now()
        const response = await apiMethods.admin.getSystemHealth()
        responseTime.value = Date.now() - startTime

        if (response?.data) {
            const data = response.data

            healthData.value = {
                status: data.status || 'unknown',
                uptime: data.uptime || 0,
                version: data.version || '1.0.0',
                modules: data.modules || {},
                services: data.services || {}
            }

            systemHealth.value = {
                api: true,
                database: data.services?.database === 'connected',
                websocket: wsStore?.isConnected || false
            }
        } else {
            throw new Error('Invalid health response')
        }
    } catch (error) {
        console.error('Failed to load system health:', error)
        systemHealth.value = {
            api: false,
            database: false,
            websocket: false
        }
        healthData.value = {
            status: 'unhealthy',
            uptime: 0,
            version: 'unknown',
            modules: {},
            services: {}
        }
        toast.error('Failed to load system health')
    }
}

const refreshAll = async () => {
    if (isRefreshing.value) return

    isRefreshing.value = true
    try {
        await Promise.all([
            loadDashboardStats(),
            loadRecentActivity(),
            loadActiveEvents(),
            loadSystemHealth()
        ])
        lastUpdated.value = new Date()
        toast.success('Dashboard refreshed')
    } catch (error) {
        console.error('Failed to refresh dashboard:', error)
        toast.error('Failed to refresh dashboard')
    } finally {
        isRefreshing.value = false
    }
}

const generateQRCodes = async () => {
    if (isGeneratingQR.value) return

    isGeneratingQR.value = true
    try {
        const committeesResponse = await apiMethods.committees.getAll({ status: 'active' })

        const committees = Array.isArray(committeesResponse?.data) ? committeesResponse.data : committeesResponse?.data?.committees || []

        if (committees.length === 0) {
            toast.info('No active committees found')
            return
        }

        const committeeIds = committees.map(c => c._id)
        const response = await apiMethods.admin.bulkGenerateQR({ committeeIds })

        if (response?.data) {
            toast.success(`Generated QR codes for ${response.data.totalQRGenerated || committees.length} countries`)
        } else {
            throw new Error('QR generation failed')
        }
    } catch (error) {
        console.error('QR generation error:', error)
        toast.error('Failed to generate QR codes')
    } finally {
        isGeneratingQR.value = false
    }
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

const formatEventDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date)
}

const formatUptime = (uptime) => {
    if (!uptime) return '0s'

    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return `${Math.floor(uptime)}s`
}

const getActivityIcon = (type) => {
    const iconMap = {
        'login': UserIcon,
        'event': CalendarDaysIcon,
        'committee': UserGroupIcon,
        'document': DocumentIcon,
        'voting': HandRaisedIcon,
        'system': CogIcon
    }
    return iconMap[type] || ClockIcon
}

const getActivityIconClass = (type) => {
    const classMap = {
        'login': 'bg-green-100 text-green-600',
        'event': 'bg-blue-100 text-blue-600',
        'committee': 'bg-purple-100 text-purple-600',
        'document': 'bg-orange-100 text-orange-600',
        'voting': 'bg-red-100 text-red-600',
        'system': 'bg-gray-100 text-gray-600'
    }
    return classMap[type] || 'bg-gray-100 text-gray-600'
}

// Lifecycle
onMounted(async () => {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadRecentActivity(),
            loadActiveEvents(),
            loadSystemHealth()
        ])
        lastUpdated.value = new Date()
    } catch (error) {
        console.error('Dashboard initialization error:', error)
        toast.error('Failed to load dashboard')
    } finally {
        isInitialLoading.value = false
    }

    // Auto-refresh interval (every 60 seconds)
    const refreshInterval = setInterval(async () => {
        if (!isRefreshing.value) {
            await loadSystemHealth()
            await loadDashboardStats()
        }
    }, 60000)

    onUnmounted(() => {
        clearInterval(refreshInterval)
    })
})
</script>

<style scoped>
.admin-dashboard {
    min-height: calc(100vh - 4rem);
    background: #f9fafb;
}

.transition-colors {
    transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out;
}

.transition-shadow {
    transition: box-shadow 150ms ease-in-out;
}

.hover\:shadow-md:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@media (max-width: 640px) {
    .admin-dashboard {
        padding: 1rem;
    }
}
</style>