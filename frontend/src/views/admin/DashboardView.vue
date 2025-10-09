<template>
    <div class="admin-dashboard">
        <!-- Performance Loading State -->
        <div v-if="isInitialLoading" class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-mun-blue-600 mx-auto mb-4"></div>
                <p class="text-mun-gray-600">Loading dashboard...</p>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="space-y-6 p-6">
            <!-- Dashboard Header -->
            <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 class="text-2xl font-bold text-mun-gray-900">Admin Dashboard</h1>
                        <p class="text-mun-gray-600 mt-1">
                            Welcome back, {{ authStore.user?.username || 'Administrator' }}. Here's what's happening
                            today.
                        </p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="text-sm text-mun-gray-600">
                            Last updated: {{ formatTime(lastUpdated) }}
                        </div>
                        <button @click="refreshAll" :disabled="isRefreshing"
                            class="inline-flex items-center px-4 py-2 border border-mun-gray-300 rounded-lg text-sm font-medium text-mun-gray-700 bg-white hover:bg-mun-gray-50 disabled:opacity-50 transition-colors">
                            <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isRefreshing }]" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Events -->
                <div
                    class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Total Events</p>
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

                <!-- Total Committees -->
                <div
                    class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 hover:shadow-md transition-shadow">
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

                <!-- Registered Users -->
                <div
                    class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Registered Users</p>
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

                <!-- Documents -->
                <div
                    class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Documents</p>
                            <p class="text-3xl font-bold text-mun-gray-900 mt-2">{{ stats.documentsUploaded || 0 }}</p>
                            <div class="flex items-center mt-2">
                                <span class="text-sm text-orange-600 font-medium">{{ pendingModeration }} pending</span>
                            </div>
                        </div>
                        <div class="p-3 bg-orange-100 rounded-lg">
                            <DocumentTextIcon class="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions & System Status Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Quick Actions -->
                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button @click="$router.push('/admin/events')"
                            class="flex items-center p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 transition-colors text-left">
                            <PlusIcon class="w-5 h-5 text-mun-blue-600 mr-3" />
                            <div>
                                <div class="font-medium text-mun-gray-900">Create Event</div>
                                <div class="text-sm text-mun-gray-600">Set up new MUN event</div>
                            </div>
                        </button>

                        <button @click="$router.push('/admin/committees')"
                            class="flex items-center p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 transition-colors text-left">
                            <PlusIcon class="w-5 h-5 text-mun-purple-600 mr-3" />
                            <div>
                                <div class="font-medium text-mun-gray-900">Add Committee</div>
                                <div class="text-sm text-mun-gray-600">Create new committee</div>
                            </div>
                        </button>

                        <button @click="generateQRCodes" :disabled="isGeneratingQR"
                            class="flex items-center p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 transition-colors text-left disabled:opacity-50">
                            <QrCodeIcon
                                :class="['w-5 h-5 text-mun-green-600 mr-3', { 'animate-spin': isGeneratingQR }]" />
                            <div>
                                <div class="font-medium text-mun-gray-900">Generate QR Codes</div>
                                <div class="text-sm text-mun-gray-600">Bulk QR generation</div>
                            </div>
                        </button>

                        <button @click="$router.push('/admin/reports')"
                            class="flex items-center p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 transition-colors text-left">
                            <DocumentChartBarIcon class="w-5 h-5 text-mun-orange-600 mr-3" />
                            <div>
                                <div class="font-medium text-mun-gray-900">View Reports</div>
                                <div class="text-sm text-mun-gray-600">Analytics & insights</div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- System Status -->
                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">System Status</h3>
                    <div class="space-y-4">
                        <!-- API Status -->
                        <div class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div
                                    :class="['w-3 h-3 rounded-full', systemHealth.api ? 'bg-green-500' : 'bg-red-500']">
                                </div>
                                <span class="font-medium text-mun-gray-900">API Server</span>
                            </div>
                            <span
                                :class="['text-sm font-medium', systemHealth.api ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.api ? 'Healthy' : 'Issues Detected' }}
                            </span>
                        </div>

                        <!-- Database Status -->
                        <div class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div
                                    :class="['w-3 h-3 rounded-full', systemHealth.database ? 'bg-green-500' : 'bg-red-500']">
                                </div>
                                <span class="font-medium text-mun-gray-900">Database</span>
                            </div>
                            <span
                                :class="['text-sm font-medium', systemHealth.database ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.database ? 'Connected' : 'Connection Issues' }}
                            </span>
                        </div>

                        <!-- WebSocket Status -->
                        <div class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div
                                    :class="['w-3 h-3 rounded-full', wsStatus.connected ? 'bg-green-500' : 'bg-yellow-500']">
                                </div>
                                <span class="font-medium text-mun-gray-900">Real-time Services</span>
                            </div>
                            <span
                                :class="['text-sm font-medium', wsStatus.connected ? 'text-green-700' : 'text-yellow-700']">
                                {{ wsStatus.text }}
                            </span>
                        </div>

                        <!-- Performance Metrics -->
                        <div class="pt-2 border-t border-mun-gray-200">
                            <div class="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div class="text-2xl font-bold text-mun-gray-900">{{ responseTime }}ms</div>
                                    <div class="text-sm text-mun-gray-600">Avg Response</div>
                                </div>
                                <div>
                                    <div class="text-2xl font-bold text-mun-gray-900">{{ uptime }}%</div>
                                    <div class="text-sm text-mun-gray-600">Uptime</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity & Active Events -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Recent Activity -->
                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
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
                                <p class="text-sm text-mun-gray-900">
                                    {{ activity.description }}
                                </p>
                                <div class="flex items-center space-x-2 mt-1">
                                    <span class="text-xs text-mun-gray-500">
                                        {{ formatTimeAgo(activity.timestamp) }}
                                    </span>
                                    <span v-if="activity.user" class="text-xs text-mun-gray-500">
                                        by {{ activity.user }}
                                    </span>
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
                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Icons
import {
    ArrowPathIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    PlusIcon,
    QrCodeIcon,
    DocumentChartBarIcon,
    ClockIcon,
    UserIcon,
    CogIcon,
    HandRaisedIcon,
    DocumentIcon
} from '@heroicons/vue/24/outline'

// Stores and composables
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
    documentsUploaded: 0
})

const systemHealth = ref({
    api: true,
    database: true,
    websocket: true
})

const responseTime = ref(0)
const uptime = ref(99.9)
const pendingModeration = ref(0)
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

// Methods
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
                stats.value = { ...stats.value, ...data.stats }
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        toast.error('Failed to load dashboard statistics')
    }
}

const loadRecentActivity = async () => {
    isLoadingActivity.value = true
    try {
        const response = await fetch('/api/admin/dashboard/activity?limit=10', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (response.ok) {
            const data = await response.json()
            if (data.success) {
                recentActivity.value = data.activities || []
            }
        }
    } catch (error) {
        console.error('Failed to load recent activity:', error)
    } finally {
        isLoadingActivity.value = false
    }
}

const loadActiveEvents = async () => {
    isLoadingEvents.value = true
    try {
        const response = await fetch('/api/events?status=active', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (response.ok) {
            const data = await response.json()
            activeEvents.value = Array.isArray(data) ? data : data.events || []
        }
    } catch (error) {
        console.error('Failed to load active events:', error)
    } finally {
        isLoadingEvents.value = false
    }
}

const loadSystemHealth = async () => {
    try {
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
        toast.error('Failed to refresh dashboard')
    } finally {
        isRefreshing.value = false
    }
}

const generateQRCodes = async () => {
    if (isGeneratingQR.value) return

    isGeneratingQR.value = true
    try {
        // Get active committees first
        const committeesResponse = await fetch('/api/committees?status=active', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (!committeesResponse.ok) {
            throw new Error('Failed to fetch committees')
        }

        const committeesData = await committeesResponse.json()
        const committees = Array.isArray(committeesData) ? committeesData : committeesData.committees || []

        if (committees.length === 0) {
            toast.info('No active committees found')
            return
        }

        const committeeIds = committees.map(c => c._id)

        // Bulk generate QR codes
        const response = await fetch('/api/admin/committees/bulk-qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            },
            body: JSON.stringify({ committeeIds })
        })

        if (response.ok) {
            const data = await response.json()
            toast.success(`Generated QR codes for ${data.totalQRGenerated} countries`)
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

// Utility functions
const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date)
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
        // Load all data in parallel for faster initial load
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

    // Set up auto-refresh interval (every 60 seconds)
    const refreshInterval = setInterval(async () => {
        if (!isRefreshing.value) {
            await loadSystemHealth()
            await loadDashboardStats()
        }
    }, 60000)

    // Cleanup on unmount
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

/* Performance optimized transitions */
.transition-colors {
    transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out;
}

.transition-shadow {
    transition: box-shadow 150ms ease-in-out;
}

/* Hover effects */
.hover\:shadow-md:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Loading animations */
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

/* Responsive design */
@media (max-width: 640px) {
    .admin-dashboard {
        padding: 1rem;
    }
}
</style>