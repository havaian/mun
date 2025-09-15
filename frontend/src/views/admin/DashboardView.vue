<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Admin Dashboard</h1>
                <p class="text-mun-gray-600">System overview and management</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="refreshDashboard" :disabled="isLoading" class="btn-un-secondary">
                    <ArrowPathIcon class="w-5 h-5 mr-2" />
                    Refresh
                </button>
                <button @click="showExportModal = true" class="btn-un-primary">
                    <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
                    Export Reports
                </button>
            </div>
        </div>

        <!-- Dashboard Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="stat in dashboardStats" :key="stat.title" class="mun-card p-6">
                <div class="flex items-center">
                    <div :class="[
                        'p-3 rounded-lg',
                        stat.color === 'blue' ? 'bg-un-blue/10' :
                            stat.color === 'green' ? 'bg-mun-green-500/10' :
                                stat.color === 'purple' ? 'bg-purple-500/10' :
                                    'bg-orange-500/10'
                    ]">
                        <component :is="stat.icon" :class="[
                            'w-6 h-6',
                            stat.color === 'blue' ? 'text-un-blue' :
                                stat.color === 'green' ? 'text-mun-green-500' :
                                    stat.color === 'purple' ? 'text-purple-500' :
                                        'text-orange-500'
                        ]" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">{{ stat.title }}</p>
                        <div class="flex items-center space-x-2">
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stat.value || 0 }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Quick Actions</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button @click="showCreateEventModal = true"
                    class="flex flex-col items-center p-4 border-2 border-dashed border-mun-gray-200 rounded-lg hover:border-un-blue hover:bg-un-blue/5 transition-colors">
                    <PlusIcon class="w-8 h-8 text-un-blue mb-2" />
                    <span class="text-sm font-medium text-mun-gray-900">Create Event</span>
                </button>

                <button @click="showCreateCommitteeModal = true"
                    class="flex flex-col items-center p-4 border-2 border-dashed border-mun-gray-200 rounded-lg hover:border-mun-green-500 hover:bg-mun-green-50 transition-colors">
                    <UserGroupIcon class="w-8 h-8 text-mun-green-500 mb-2" />
                    <span class="text-sm font-medium text-mun-gray-900">Add Committee</span>
                </button>

                <button @click="bulkGenerateQR"
                    class="flex flex-col items-center p-4 border-2 border-dashed border-mun-gray-200 rounded-lg hover:border-mun-yellow-500 hover:bg-mun-yellow-50 transition-colors">
                    <QrCodeIcon class="w-8 h-8 text-mun-yellow-500 mb-2" />
                    <span class="text-sm font-medium text-mun-gray-900">Generate QR Codes</span>
                </button>

                <RouterLink to="/admin/reports"
                    class="flex flex-col items-center p-4 border-2 border-dashed border-mun-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <ChartBarIcon class="w-8 h-8 text-purple-500 mb-2" />
                    <span class="text-sm font-medium text-mun-gray-900">View Reports</span>
                </RouterLink>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- System Health -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">System Health</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-mun-gray-600">API Status</span>
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                systemHealth.apiStatus === 'healthy' ? 'bg-mun-green-500' : 'bg-mun-red-500'
                            ]"></div>
                            <span class="text-sm font-medium">{{ systemHealth.apiResponseTime || '--' }}ms</span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="text-sm text-mun-gray-600">Database</span>
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                systemHealth.dbStatus === 'connected' ? 'bg-mun-green-500' : 'bg-mun-red-500'
                            ]"></div>
                            <span class="text-sm font-medium">{{ systemHealth.dbStatus || 'unknown' }}</span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="text-sm text-mun-gray-600">WebSocket</span>
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                systemHealth.wsStatus === 'healthy' ? 'bg-mun-green-500' : 'bg-mun-red-500'
                            ]"></div>
                            <span class="text-sm font-medium">{{ systemHealth.activeConnections || 0 }} active</span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="text-sm text-mun-gray-600">Storage</span>
                        <div class="flex items-center space-x-2">
                            <div class="w-16 bg-mun-gray-200 rounded-full h-2">
                                <div :class="[
                                    'h-2 rounded-full transition-all duration-300',
                                    (systemHealth.storageUsed || 0) < 80 ? 'bg-mun-green-500' : 'bg-mun-red-500'
                                ]" :style="{ width: `${systemHealth.storageUsed || 0}%` }"></div>
                            </div>
                            <span class="text-sm font-medium">{{ systemHealth.storageUsed || 0 }}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="lg:col-span-2 mun-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Recent Activity</h3>
                    <button @click="loadRecentActivity" class="text-sm text-un-blue hover:text-un-blue-600">
                        View All
                    </button>
                </div>

                <div v-if="isLoading" class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-un-blue"></div>
                </div>

                <div v-else class="space-y-4">
                    <div v-for="activity in recentActivity" :key="activity.id"
                        class="flex items-start space-x-3 p-3 hover:bg-mun-gray-50 rounded-lg transition-colors">
                        <div :class="[
                            'p-2 rounded-lg',
                            activity.color === 'blue' ? 'bg-un-blue/10' :
                                activity.color === 'green' ? 'bg-mun-green-500/10' :
                                    activity.color === 'purple' ? 'bg-purple-500/10' :
                                        'bg-orange-500/10'
                        ]">
                            <component :is="activity.icon" :class="[
                                'w-4 h-4',
                                activity.color === 'blue' ? 'text-un-blue' :
                                    activity.color === 'green' ? 'text-mun-green-500' :
                                        activity.color === 'purple' ? 'text-purple-500' :
                                            'text-orange-500'
                            ]" />
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-mun-gray-900">{{ activity.title }}</p>
                            <p class="text-sm text-mun-gray-600">{{ activity.description }}</p>
                            <div class="flex items-center space-x-2 mt-1 text-xs text-mun-gray-500">
                                <span>{{ activity.user }}</span>
                                <span>•</span>
                                <span>{{ formatTime(activity.timestamp) }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="recentActivity.length === 0" class="text-center py-8">
                        <ClockIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-4" />
                        <p class="text-mun-gray-500">No recent activity</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Events & Committees Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Active Events -->
            <div class="mun-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Active Events</h3>
                    <RouterLink to="/admin/events" class="text-sm text-un-blue hover:text-un-blue-600">
                        Manage Events
                    </RouterLink>
                </div>

                <div class="space-y-4">
                    <div v-for="event in activeEvents" :key="event.id" @click="goToEvent(event.id)"
                        class="p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 cursor-pointer transition-colors">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-medium text-mun-gray-900">{{ event.name }}</h4>
                                <p class="text-sm text-mun-gray-600 mt-1">{{ event.description }}</p>
                                <div class="flex items-center space-x-4 mt-2 text-xs text-mun-gray-500">
                                    <span>{{ event.committees?.length || 0 }} committees</span>
                                    <span>{{ event.participants || 0 }} participants</span>
                                    <span>{{ formatDate(event.startDate) }}</span>
                                </div>
                            </div>
                            <span :class="[
                                'px-2 py-1 rounded-full text-xs font-medium',
                                event.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                    event.status === 'draft' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                        'bg-mun-gray-100 text-mun-gray-700'
                            ]">
                                {{ event.status }}
                            </span>
                        </div>
                    </div>

                    <div v-if="activeEvents.length === 0" class="text-center py-8">
                        <CalendarDaysIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-4" />
                        <p class="text-mun-gray-500 mb-4">No active events</p>
                        <button @click="showCreateEventModal = true" class="btn-un-primary">
                            Create First Event
                        </button>
                    </div>
                </div>
            </div>

            <!-- Committee Status -->
            <div class="mun-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Committee Status</h3>
                    <RouterLink to="/admin/committees" class="text-sm text-un-blue hover:text-un-blue-600">
                        Manage Committees
                    </RouterLink>
                </div>

                <div class="space-y-4">
                    <div v-for="committee in committeeStatus" :key="committee.id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-mun-gray-900">{{ committee.name }}</h4>
                            <p class="text-sm text-mun-gray-600">{{ committee.eventName }}</p>
                            <div class="flex items-center space-x-3 mt-1 text-xs text-mun-gray-500">
                                <span>{{ committee.countries?.length || 0 }} countries</span>
                                <span>{{ committee.registeredCount || 0 }} registered</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <span :class="[
                                'px-2 py-1 rounded-full text-xs font-medium',
                                committee.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                    committee.status === 'setup' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                        'bg-mun-gray-100 text-mun-gray-700'
                            ]">
                                {{ committee.status }}
                            </span>
                            <div class="mt-2 text-xs text-mun-gray-500">
                                {{ Math.round(((committee.registeredCount || 0) / (committee.countries?.length || 1)) *
                                    100) }}% ready
                            </div>
                        </div>
                    </div>

                    <div v-if="committeeStatus.length === 0" class="text-center py-8">
                        <UserGroupIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-4" />
                        <p class="text-mun-gray-500 mb-4">No committees yet</p>
                        <button @click="showCreateCommitteeModal = true" class="btn-un-secondary">
                            Create Committee
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreateEventModal v-model="showCreateEventModal" @created="handleEventCreated" />
        <CreateCommitteeModal v-model="showCreateCommitteeModal" @created="handleCommitteeCreated" />
        <ExportReportsModal v-model="showExportModal" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    ArrowPathIcon,
    DocumentArrowDownIcon,
    PlusIcon,
    UserGroupIcon,
    QrCodeIcon,
    ChartBarIcon,
    ClockIcon,
    CalendarDaysIcon,
    UsersIcon,
    DocumentTextIcon
} from '@heroicons/vue/24/outline'

// Components
import CreateEventModal from '@/components/admin/CreateEventModal.vue'
import CreateCommitteeModal from '@/components/admin/CreateCommitteeModal.vue'
import ExportReportsModal from '@/components/admin/ExportReportsModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const showCreateEventModal = ref(false)
const showCreateCommitteeModal = ref(false)
const showExportModal = ref(false)

// Data - these will be populated from real API calls
const stats = ref({
    totalEvents: null,
    activeCommittees: null,
    registeredUsers: null,
    documentsUploaded: null
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
const committeeStatus = ref([])
const recentActivity = ref([])

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

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true

        // Load all data in parallel for better performance
        const [dashboardResponse, healthResponse] = await Promise.all([
            // Single API call for all dashboard data
            apiMethods.get('/api/admin/dashboard'),
            // System health check
            fetch('/api/health').then(res => res.ok ? res.json() : null).catch(() => null)
        ])

        if (dashboardResponse?.data) {
            const data = dashboardResponse.data

            // Update stats
            stats.value = {
                totalEvents: data.stats?.totalEvents || 0,
                activeCommittees: data.stats?.activeCommittees || 0,
                registeredUsers: data.stats?.registeredUsers || 0,
                documentsUploaded: data.stats?.documentsUploaded || 0
            }

            // Update other sections
            activeEvents.value = data.events || []
            committeeStatus.value = data.committees || []
            recentActivity.value = data.recentActivity || []
        }

        // Update system health
        if (healthResponse) {
            systemHealth.value = {
                apiStatus: healthResponse.status === 'healthy' ? 'healthy' : 'unhealthy',
                apiResponseTime: healthResponse.responseTime || null,
                dbStatus: healthResponse.services?.database || 'unknown',
                wsStatus: healthResponse.modules?.websocket === 'active' ? 'healthy' : 'unhealthy',
                activeConnections: healthResponse.connections?.active || 0,
                storageUsed: healthResponse.storage?.usedPercent || 0
            }
        }

    } catch (error) {
        console.error('Dashboard loading error:', error)
        toast.error('Failed to load dashboard data')

        // Set defaults on error
        stats.value = {
            totalEvents: 0,
            activeCommittees: 0,
            registeredUsers: 0,
            documentsUploaded: 0
        }
        systemHealth.value = {
            apiStatus: 'unhealthy',
            apiResponseTime: null,
            dbStatus: 'unknown',
            wsStatus: 'unhealthy',
            activeConnections: 0,
            storageUsed: 0
        }
    } finally {
        isLoading.value = false
    }
}

const loadRecentActivity = async () => {
    try {
        const response = await apiMethods.get('/api/admin/activity')
        if (response?.data) {
            recentActivity.value = response.data
        }
    } catch (error) {
        console.error('Load activity error:', error)
    }
}

const refreshDashboard = async () => {
    await loadDashboardData()
    toast.success('Dashboard refreshed')
}

const bulkGenerateQR = async () => {
    try {
        const response = await apiMethods.post('/api/admin/bulk-qr-generate')
        if (response?.success) {
            toast.success('QR codes generated successfully')
        } else {
            toast.error('Failed to generate QR codes')
        }
    } catch (error) {
        console.error('QR generation error:', error)
        toast.error('Failed to generate QR codes')
    }
}

const goToEvent = (eventId) => {
    router.push({ name: 'AdminEvents', query: { highlight: eventId } })
}

const handleEventCreated = (event) => {
    activeEvents.value.unshift(event)
    stats.value.totalEvents++
    toast.success(`Event "${event.name}" created successfully`)
}

const handleCommitteeCreated = (committee) => {
    committeeStatus.value.unshift(committee)
    stats.value.activeCommittees++
    toast.success(`Committee "${committee.name}" created successfully`)
}

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

// Lifecycle
onMounted(() => {
    loadDashboardData()
})
</script>