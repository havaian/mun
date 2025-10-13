<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Reports & Analytics</h1>
                <p class="text-mun-gray-600">Generate reports and view system analytics</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="refreshData" :disabled="isLoading" class="btn-un-secondary">
                    <ArrowPathIcon class="w-5 h-5 mr-2" />
                    Refresh
                </button>
                <button @click="showCustomReportModal = true" class="btn-un-primary">
                    <DocumentChartBarIcon class="w-5 h-5 mr-2" />
                    Custom Report
                </button>
            </div>
        </div>

        <!-- Quick Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <ChartBarIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Documents</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.totalDocuments || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <DocumentArrowDownIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Active Users</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.activeUsers || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Active Events</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.activeEvents || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <CalendarDaysIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Committees</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.totalCommittees || 0 }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Export Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- System Exports -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">System Exports</h3>
                <div class="space-y-3">
                    <div v-for="exportItem in systemExports" :key="exportItem.id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <div>
                            <h4 class="font-medium text-mun-gray-900">{{ exportItem.title }}</h4>
                            <p class="text-sm text-mun-gray-600">{{ exportItem.description }}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button @click="downloadExport(exportItem)" :disabled="isGenerating[exportItem.id]"
                                class="btn-un-secondary px-3 py-2">
                                <component :is="isGenerating[exportItem.id] ? ArrowPathIcon : DocumentArrowDownIcon"
                                    :class="['w-4 h-4', isGenerating[exportItem.id] ? 'animate-spin' : '']" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Committee Exports -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Committee Reports</h3>
                <div class="space-y-3">
                    <div v-for="committee in committees" :key="committee._id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <div>
                            <h4 class="font-medium text-mun-gray-900">{{ committee.name }}</h4>
                            <p class="text-sm text-mun-gray-600">{{ committee.countries?.length || 0 }} countries</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button @click="exportCommitteeReport(committee)" :disabled="isGenerating[committee._id]"
                                class="btn-un-secondary px-3 py-2">
                                <component :is="isGenerating[committee._id] ? ArrowPathIcon : DocumentArrowDownIcon"
                                    :class="['w-4 h-4', isGenerating[committee._id] ? 'animate-spin' : '']" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Analytics -->
        <div class="mun-card p-6">
            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">System Health</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- System Status -->
                <div>
                    <h4 class="font-medium text-mun-gray-900 mb-3">System Status</h4>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">API Status</span>
                            <span
                                :class="['text-sm font-medium', systemHealth.api ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.api ? 'Healthy' : 'Issues' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Database</span>
                            <span
                                :class="['text-sm font-medium', systemHealth.database ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.database ? 'Connected' : 'Disconnected' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">WebSocket</span>
                            <span
                                :class="['text-sm font-medium', systemHealth.websocket ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.websocket ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Memory Usage</span>
                            <span class="font-medium text-mun-gray-900">{{ systemHealth.memoryUsage || '--' }}%</span>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div>
                    <h4 class="font-medium text-mun-gray-900 mb-3">Performance</h4>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Uptime</span>
                            <span class="font-medium text-mun-gray-900">{{ formatUptime(systemHealth.uptime) }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Active Sessions</span>
                            <span class="font-medium text-mun-gray-900">{{ stats.activeSessions || 0 }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Avg Response Time</span>
                            <span class="font-medium text-mun-gray-900">{{ systemHealth.avgResponseTime || '--'
                                }}ms</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Error Rate</span>
                            <span class="font-medium text-mun-gray-900">{{ systemHealth.errorRate || 0 }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Recent Activity</h3>
                    <div class="flex items-center space-x-3">
                        <select v-model="activityFilter" class="input-field max-w-xs" @change="loadActivity">
                            <option value="">All Activities</option>
                            <option value="login">Logins</option>
                            <option value="document">Documents</option>
                            <option value="voting">Voting</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
            </div>

            <div v-else-if="recentActivity.length === 0" class="text-center py-12">
                <DocumentChartBarIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Recent Activity</h3>
                <p class="mt-2 text-mun-gray-600">Activity will appear here as users interact with the system</p>
            </div>

            <div v-else class="divide-y divide-mun-gray-200">
                <div v-for="activity in recentActivity" :key="activity._id"
                    class="px-6 py-4 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-900">{{ activity.action }}</p>
                            <p class="text-sm text-mun-gray-600">{{ activity.details }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-mun-gray-500">{{ formatDate(activity.timestamp) }}</p>
                            <p class="text-xs text-mun-gray-400">{{ activity.user || 'System' }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Custom Report Modal -->
        <CustomReportModal v-model="showCustomReportModal" @generated="handleCustomReportGenerated" />
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
    DocumentChartBarIcon,
    ChartBarIcon,
    DocumentArrowDownIcon,
    ClockIcon,
    CalendarDaysIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    TrashIcon
} from '@heroicons/vue/24/outline'

// Components
import CustomReportModal from '@/components/admin/CustomReportModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isGenerating = ref({})
const showCustomReportModal = ref(false)
const activityFilter = ref('')

const stats = ref({
    totalDocuments: 0,
    activeUsers: 0,
    activeEvents: 0,
    totalCommittees: 0,
    activeSessions: 0
})

const systemHealth = ref({
    api: true,
    database: true,
    websocket: true,
    memoryUsage: null,
    uptime: null,
    avgResponseTime: null,
    errorRate: null
})

const recentActivity = ref([])
const committees = ref([])

// System Exports
const systemExports = [
    {
        id: 'all_stats',
        title: 'System Statistics',
        description: 'Complete system statistics export',
        endpoint: '/api/admin/dashboard/stats'
    },
    {
        id: 'user_activity',
        title: 'User Activity Report',
        description: 'Detailed user activity logs',
        endpoint: '/api/admin/dashboard/activity'
    },
    {
        id: 'system_config',
        title: 'System Configuration',
        description: 'Current system configuration export',
        endpoint: '/api/admin/export/config'
    }
]

// Methods
const loadReportsData = async () => {
    try {
        isLoading.value = true

        // Load dashboard stats and system health using proper API methods
        const [statsResponse, healthResponse, activityResponse] = await Promise.all([
            apiMethods.admin.getDashboardStats(),
            apiMethods.admin.getSystemHealth(),
            apiMethods.admin.getRecentActivity({ limit: 10 })
        ])

        // Update stats
        if (statsResponse?.data) {
            stats.value = {
                totalDocuments: statsResponse.data.stats?.totalDocuments || 0,
                activeUsers: statsResponse.data.stats?.activeUsers || 0,
                activeEvents: statsResponse.data.stats?.activeEvents || 0,
                totalCommittees: statsResponse.data.stats?.totalCommittees || 0,
                activeSessions: statsResponse.data.stats?.activeSessions || 0
            }
        }

        // Update system health
        if (healthResponse?.data) {
            systemHealth.value = {
                api: healthResponse.data.services?.api || true,
                database: healthResponse.data.services?.database || true,
                websocket: healthResponse.data.services?.websocket || true,
                memoryUsage: healthResponse.data.memory?.usage || null,
                uptime: healthResponse.data.uptime || null,
                avgResponseTime: healthResponse.data.performance?.avgResponseTime || null,
                errorRate: healthResponse.data.performance?.errorRate || null
            }
        }

        // Update activity
        if (activityResponse?.data?.activities) {
            recentActivity.value = activityResponse.data.activities
        }

        // Load committees for exports
        await loadCommittees()

    } catch (error) {
        toast.error('Failed to load reports data')
        console.error('Load reports error:', error)

        // Set defaults on error
        stats.value = {
            totalDocuments: 0,
            activeUsers: 0,
            activeEvents: 0,
            totalCommittees: 0,
            activeSessions: 0
        }
        systemHealth.value = {
            api: false,
            database: false,
            websocket: false,
            memoryUsage: null,
            uptime: null,
            avgResponseTime: null,
            errorRate: null
        }
        recentActivity.value = []
    } finally {
        isLoading.value = false
    }
}

const loadCommittees = async () => {
    try {
        const response = await apiMethods.committees.getAll()
        if (response?.data) {
            committees.value = response.data.committees || response.data || []
        }
    } catch (error) {
        console.error('Failed to load committees:', error)
    }
}

const loadActivity = async () => {
    try {
        const params = { limit: 20 }
        if (activityFilter.value) {
            params.type = activityFilter.value
        }

        const response = await apiMethods.admin.getRecentActivity(params)
        if (response?.data?.activities) {
            recentActivity.value = response.data.activities
        }
    } catch (error) {
        console.error('Failed to load activity:', error)
    }
}

const refreshData = async () => {
    await loadReportsData()
    toast.success('Reports data refreshed')
}

const downloadExport = async (exportItem) => {
    try {
        isGenerating.value[exportItem.id] = true

        let response;

        // Use the appropriate API method based on export type
        if (exportItem.id === 'all_stats') {
            response = await apiMethods.admin.getDashboardStats()
        } else if (exportItem.id === 'user_activity') {
            response = await apiMethods.admin.getRecentActivity({ limit: 1000 })
        } else if (exportItem.id === 'system_config') {
            response = await apiMethods.exports.getSystemConfig()
        } else {
            throw new Error('Unknown export type')
        }

        if (response?.data) {
            // Create downloadable JSON file
            const dataStr = JSON.stringify(response.data, null, 2)
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

            const exportFileDefaultName = `${exportItem.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`

            const linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', exportFileDefaultName)
            linkElement.click()

            toast.success(`Downloaded ${exportItem.title}`)
        }

    } catch (error) {
        toast.error(`Failed to download ${exportItem.title}`)
        console.error('Download export error:', error)
    } finally {
        isGenerating.value[exportItem.id] = false
    }
}

const exportCommitteeReport = async (committee) => {
    try {
        isGenerating.value[committee._id] = true

        const response = await apiMethods.exports.exportCompleteReport(committee._id)

        if (response) {
            // Create download link for PDF
            const url = window.URL.createObjectURL(new Blob([response]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${committee.name.replace(/\s+/g, '_')}_Report.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success(`Downloaded ${committee.name} report`)
        }
    } catch (error) {
        toast.error(`Failed to export ${committee.name} report`)
        console.error('Export committee report error:', error)
    } finally {
        isGenerating.value[committee._id] = false
    }
}

const handleCustomReportGenerated = (report) => {
    toast.success('Custom report generated successfully')
}

// Utility functions
const formatUptime = (seconds) => {
    if (!seconds) return '--'

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

const formatDate = (dateString) => {
    if (!dateString) return '--'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) {
        return `${diffMins}m ago`
    } else if (diffHours < 24) {
        return `${diffHours}h ago`
    } else {
        return date.toLocaleDateString()
    }
}

// Lifecycle
onMounted(() => {
    loadReportsData()
})
</script>