<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div
            class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Reports & Analytics</h1>
                <p class="text-mun-gray-600">Generate reports and view system analytics</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="refreshData" :disabled="adminStore.isLoading" class="btn-un-secondary">
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
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.documentsUploaded || 0 }}</p>
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

        <!-- System Health -->
        <div class="mun-card p-6">
            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">System Health</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- System Status -->
                <div class="space-y-4">
                    <h4 class="font-medium text-mun-gray-900">System Status</h4>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">API Status</span>
                            <span
                                :class="['text-sm font-medium', systemHealth.api ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.api ? 'Healthy' : 'Issues' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">Database</span>
                            <span
                                :class="['text-sm font-medium', systemHealth.database ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.database ? 'Connected' : 'Disconnected' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">WebSocket</span>
                            <span
                                :class="['text-sm font-medium', systemHealth.websocket ? 'text-green-700' : 'text-red-700']">
                                {{ systemHealth.websocket ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">Memory Usage</span>
                            <span class="font-medium text-mun-gray-900">{{
                                formatMemoryUsage(performanceMetrics.memoryUsage) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="space-y-4">
                    <h4 class="font-medium text-mun-gray-900">Performance</h4>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">Uptime</span>
                            <span class="font-medium text-mun-gray-900">{{ adminStore.formatUptime(healthData.uptime)
                                }}</span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">Active Sessions</span>
                            <span class="font-medium text-mun-gray-900">{{ stats.activeSessions || 0 }}</span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">Avg Response Time</span>
                            <span class="font-medium text-mun-gray-900">{{ performanceMetrics.responseTime || '--'
                                }}ms</span>
                        </div>
                        <div class="flex items-center justify-between py-2">
                            <span class="text-sm text-mun-gray-600">Error Rate</span>
                            <span class="font-medium text-mun-gray-900">{{ formatErrorRate(performanceMetrics.errorRate)
                                }}</span>
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
                        <SleekSelect v-model="activityFilter" @change="loadActivity" :options="[
                            { label: 'All Activities', value: '' },
                            { label: 'Logins', value: 'login' },
                            { label: 'Documents', value: 'document' },
                            { label: 'Voting', value: 'voting' },
                            { label: 'System', value: 'system' }
                        ]" containerClass="max-w-xs" placeholder="Filter activities" />
                    </div>
                </div>
            </div>

            <div v-if="isLoadingActivity" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
            </div>

            <div v-else-if="recentActivity.length === 0" class="text-center py-12">
                <DocumentChartBarIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Recent Activity</h3>
                <p class="mt-2 text-mun-gray-600">Activity will appear here as users interact with the system</p>
            </div>

            <div v-else class="divide-y divide-mun-gray-200">
                <div v-for="activity in recentActivity" :key="activity._id || activity.id"
                    class="px-6 py-4 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-900">{{ activity.action || activity.description
                                }}</p>
                            <p class="text-sm text-mun-gray-600">{{ activity.details || activity.description }}</p>
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
import { useAdminStore } from '@/stores/admin'
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
const adminStore = useAdminStore()
const toast = useToast()

// Local state for page-specific loading
const isGenerating = ref({})
const showCustomReportModal = ref(false)
const activityFilter = ref('')
const isLoadingActivity = ref(false)
const committees = ref([])

// Use admin store data via computed properties
const stats = computed(() => adminStore.stats)
const systemHealth = computed(() => adminStore.systemHealth)
const healthData = computed(() => adminStore.healthData)
const performanceMetrics = computed(() => adminStore.performanceMetrics)
const recentActivity = computed(() => adminStore.recentActivity)

// System Exports
const systemExports = [
    {
        id: 'all_stats',
        title: 'System Statistics',
        description: 'Complete system statistics export',
        endpoint: '/admin/dashboard/stats'
    },
    {
        id: 'user_activity',
        title: 'User Activity Report',
        description: 'Detailed user activity logs',
        endpoint: '/admin/dashboard/activity'
    },
    {
        id: 'system_config',
        title: 'System Configuration',
        description: 'Current system configuration export',
        endpoint: '/admin/export/config'
    }
]

// Methods
const loadCommittees = async () => {
    try {
        const response = await apiMethods.committees.getAll()
        if (response?.data) {
            committees.value = response.data.committees || response.data || []
        }
    } catch (error) {
        console.error('Failed to load committees:', error)
        toast.error('Failed to load committees')
    }
}

const loadActivity = async () => {
    isLoadingActivity.value = true
    try {
        const params = { limit: 20 }
        if (activityFilter.value) {
            params.type = activityFilter.value
        }

        await adminStore.loadRecentActivity(params.limit)
    } catch (error) {
        console.error('Failed to load activity:', error)
        toast.error('Failed to load activity')
    } finally {
        isLoadingActivity.value = false
    }
}

const refreshData = async () => {
    try {
        await Promise.all([
            adminStore.refreshAllData(),
            loadCommittees(),
            loadActivity()
        ])
        toast.success('Reports data refreshed')
    } catch (error) {
        console.error('Refresh error:', error)
        toast.error('Failed to refresh data')
    }
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
const formatMemoryUsage = (memoryData) => {
    if (!memoryData) return '--'

    if (typeof memoryData === 'object' && memoryData.heapUsed && memoryData.heapTotal) {
        const usagePercent = Math.round((memoryData.heapUsed / memoryData.heapTotal) * 100)
        return `${usagePercent}%`
    }

    return memoryData.toString() + '%'
}

const formatErrorRate = (errorRate) => {
    if (errorRate === null || errorRate === undefined) return '0%'
    return `${errorRate}%`
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
onMounted(async () => {
    // Load page-specific data that may not be in the admin store
    await Promise.all([
        loadCommittees(),
        loadActivity()
    ])
})
</script>