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
                    <div class="p-3 rounded-lg bg-un-blue/10">
                        <ChartBarIcon class="w-6 h-6 text-un-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Reports</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.totalReports }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <DocumentArrowDownIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Downloads</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.totalDownloads }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Processing</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.processing }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <CalendarDaysIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">This Month</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.thisMonth }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Categories -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Event Reports -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Event Reports</h3>
                <div class="space-y-3">
                    <div v-for="report in eventReports" :key="report.id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <div>
                            <h4 class="font-medium text-mun-gray-900">{{ report.title }}</h4>
                            <p class="text-sm text-mun-gray-600">{{ report.description }}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button @click="generateReport(report)" :disabled="isGenerating[report.id]"
                                class="btn-un-secondary px-3 py-2">
                                <component :is="isGenerating[report.id] ? ArrowPathIcon : DocumentArrowDownIcon"
                                    :class="['w-4 h-4', isGenerating[report.id] ? 'animate-spin' : '']" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Reports -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">User Reports</h3>
                <div class="space-y-3">
                    <div v-for="report in userReports" :key="report.id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <div>
                            <h4 class="font-medium text-mun-gray-900">{{ report.title }}</h4>
                            <p class="text-sm text-mun-gray-600">{{ report.description }}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button @click="generateReport(report)" :disabled="isGenerating[report.id]"
                                class="btn-un-secondary px-3 py-2">
                                <component :is="isGenerating[report.id] ? ArrowPathIcon : DocumentArrowDownIcon"
                                    :class="['w-4 h-4', isGenerating[report.id] ? 'animate-spin' : '']" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Analytics -->
        <div class="mun-card p-6">
            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">System Analytics</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Usage Chart -->
                <div>
                    <h4 class="font-medium text-mun-gray-900 mb-3">Usage Over Time</h4>
                    <div class="h-64 bg-mun-gray-50 rounded-lg flex items-center justify-center">
                        <div class="text-center">
                            <ChartBarIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-2" />
                            <p class="text-mun-gray-500">Chart would be rendered here</p>
                            <p class="text-sm text-mun-gray-400">Using Chart.js or similar</p>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div>
                    <h4 class="font-medium text-mun-gray-900 mb-3">Performance Metrics</h4>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Average Response Time</span>
                            <span class="font-medium text-mun-gray-900">{{ performanceMetrics.avgResponseTime
                            }}ms</span>
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm text-mun-gray-600">Server Uptime</span>
                                <span class="font-medium text-mun-gray-900">{{ performanceMetrics.uptime }}%</span>
                            </div>
                            <div class="w-full bg-mun-gray-200 rounded-full h-2">
                                <div class="bg-mun-green-500 h-2 rounded-full transition-all duration-300"
                                    :style="{ width: `${performanceMetrics.uptime}%` }"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Active Sessions</span>
                            <span class="font-medium text-mun-gray-900">{{ performanceMetrics.activeSessions }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-mun-gray-600">Error Rate</span>
                            <span class="font-medium text-mun-gray-900">{{ performanceMetrics.errorRate }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Reports History -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Recent Reports</h3>
                    <div class="flex items-center space-x-3">
                        <select v-model="historyFilter" class="input-field max-w-xs">
                            <option value="">All Reports</option>
                            <option value="event">Event Reports</option>
                            <option value="user">User Reports</option>
                            <option value="system">System Reports</option>
                            <option value="custom">Custom Reports</option>
                        </select>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else-if="filteredReportHistory.length === 0" class="text-center py-12">
                <DocumentChartBarIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Reports Found</h3>
                <p class="mt-2 text-mun-gray-600">Generate your first report to get started</p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-mun-gray-200">
                    <thead class="bg-mun-gray-50">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Report
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Generated
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Size
                            </th>
                            <th
                                class="px-6 py-3 text-right text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-mun-gray-200">
                        <tr v-for="report in paginatedReportHistory" :key="report.id"
                            class="hover:bg-mun-gray-50 transition-colors">
                            <td class="px-6 py-4">
                                <div>
                                    <div class="text-sm font-medium text-mun-gray-900">{{ report.name }}</div>
                                    <div class="text-sm text-mun-gray-500">{{ report.description }}</div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    report.type === 'event' ? 'bg-blue-100 text-blue-700' :
                                        report.type === 'user' ? 'bg-green-100 text-green-700' :
                                            report.type === 'system' ? 'bg-purple-100 text-purple-700' :
                                                'bg-orange-100 text-orange-700'
                                ]">
                                    {{ formatReportType(report.type) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                                {{ formatDate(report.generatedAt) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    report.status === 'completed' ? 'bg-mun-green-100 text-mun-green-700' :
                                        report.status === 'processing' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                            'bg-mun-red-100 text-mun-red-700'
                                ]">
                                    {{ formatStatus(report.status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                                {{ report.fileSize }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex items-center justify-end space-x-2">
                                    <button v-if="report.status === 'completed'" @click="downloadReport(report)"
                                        class="text-un-blue hover:text-un-blue-600 transition-colors">
                                        <ArrowDownTrayIcon class="w-4 h-4" />
                                    </button>
                                    <button @click="viewReport(report)"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                        <EyeIcon class="w-4 h-4" />
                                    </button>
                                    <button @click="deleteReport(report)"
                                        class="text-mun-red-400 hover:text-mun-red-600 transition-colors">
                                        <TrashIcon class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="px-6 py-4 border-t border-mun-gray-200">
                <Pagination :current-page="pagination.currentPage" :total-pages="totalPages"
                    @page-change="handlePageChange" />
            </div>
        </div>

        <!-- Custom Report Modal -->
        <CustomReportModal v-model="showCustomReportModal" @generated="handleCustomReportGenerated" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
import Pagination from '@/components/ui/Pagination.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isGenerating = reactive({})
const showCustomReportModal = ref(false)
const historyFilter = ref('')

const stats = reactive({
    totalReports: 0,
    totalDownloads: 0,
    processing: 0,
    thisMonth: 0
})

const performanceMetrics = reactive({
    avgResponseTime: 145,
    uptime: 99.8,
    activeSessions: 47,
    errorRate: 0.2
})

const reportHistory = ref([])

// Pagination
const pagination = reactive({
    currentPage: 1,
    pageSize: 10
})

// Report Templates
const eventReports = [
    {
        id: 'event_summary',
        title: 'Event Summary',
        description: 'Complete overview of all events and their statistics'
    },
    {
        id: 'committee_performance',
        title: 'Committee Performance',
        description: 'Detailed analysis of committee activities and outcomes'
    },
    {
        id: 'participant_engagement',
        title: 'Participant Engagement',
        description: 'Metrics on delegate participation and activity levels'
    },
    {
        id: 'document_analysis',
        title: 'Document Analysis',
        description: 'Statistics on submitted documents and approval rates'
    }
]

const userReports = [
    {
        id: 'user_activity',
        title: 'User Activity',
        description: 'Login patterns and system usage statistics'
    },
    {
        id: 'role_distribution',
        title: 'Role Distribution',
        description: 'Breakdown of users by role and committee assignment'
    },
    {
        id: 'registration_trends',
        title: 'Registration Trends',
        description: 'Analysis of user registration patterns over time'
    },
    {
        id: 'access_logs',
        title: 'Access Logs',
        description: 'Detailed logs of user access and actions'
    }
]

// Computed
const filteredReportHistory = computed(() => {
    if (!historyFilter.value) return reportHistory.value
    return reportHistory.value.filter(report => report.type === historyFilter.value)
})

const totalPages = computed(() => {
    return Math.ceil(filteredReportHistory.value.length / pagination.pageSize)
})

const paginatedReportHistory = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredReportHistory.value.slice(start, end)
})

// Methods
const loadReportsData = async () => {
    try {
        isLoading.value = true

        // Load report statistics
        stats.totalReports = 156
        stats.totalDownloads = 89
        stats.processing = 3
        stats.thisMonth = 23

        // Load report history
        reportHistory.value = [
            {
                id: 1,
                name: 'Event Summary Report',
                description: 'Complete overview of Global Youth MUN 2025',
                type: 'event',
                status: 'completed',
                generatedAt: new Date().toISOString(),
                fileSize: '2.4 MB'
            },
            {
                id: 2,
                name: 'User Activity Report',
                description: 'Monthly user activity analysis',
                type: 'user',
                status: 'completed',
                generatedAt: new Date(Date.now() - 3600000).toISOString(),
                fileSize: '1.8 MB'
            },
            {
                id: 3,
                name: 'System Performance Report',
                description: 'Weekly performance metrics',
                type: 'system',
                status: 'processing',
                generatedAt: new Date(Date.now() - 7200000).toISOString(),
                fileSize: '--'
            }
        ]

    } catch (error) {
        console.error('Load reports error:', error)
        toast.error('Failed to load reports data')
    } finally {
        isLoading.value = false
    }
}

const refreshData = async () => {
    await loadReportsData()
    toast.success('Reports data refreshed')
}

const generateReport = async (reportTemplate) => {
    try {
        isGenerating[reportTemplate.id] = true

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 2000))

        const newReport = {
            id: Date.now(),
            name: reportTemplate.title,
            description: reportTemplate.description,
            type: reportTemplate.id.includes('user') ? 'user' : 'event',
            status: 'completed',
            generatedAt: new Date().toISOString(),
            fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`
        }

        reportHistory.value.unshift(newReport)
        stats.totalReports++

        toast.success(`${reportTemplate.title} generated successfully`)

    } catch (error) {
        console.error('Generate report error:', error)
        toast.error('Failed to generate report')
    } finally {
        isGenerating[reportTemplate.id] = false
    }
}

const downloadReport = async (report) => {
    try {
        // TODO: Implement actual download
        toast.success(`Downloading ${report.name}`)
        stats.totalDownloads++
    } catch (error) {
        console.error('Download report error:', error)
        toast.error('Failed to download report')
    }
}

const viewReport = (report) => {
    toast.info(`Viewing ${report.name}`)
    // TODO: Open report viewer modal
}

const deleteReport = async (report) => {
    try {
        const confirmed = await toast.confirm({
            title: 'Delete Report',
            message: `Are you sure you want to delete "${report.name}"?`,
            confirmText: 'Delete',
            type: 'warning'
        })

        if (confirmed) {
            reportHistory.value = reportHistory.value.filter(r => r.id !== report.id)
            stats.totalReports--
            toast.success('Report deleted successfully')
        }
    } catch (error) {
        console.error('Delete report error:', error)
        toast.error('Failed to delete report')
    }
}

const handleCustomReportGenerated = (report) => {
    reportHistory.value.unshift(report)
    stats.totalReports++
    toast.success('Custom report generated successfully')
}

const handlePageChange = (page) => {
    pagination.currentPage = page
}

// Utility functions
const formatReportType = (type) => {
    const typeMap = {
        'event': 'Event',
        'user': 'User',
        'system': 'System',
        'custom': 'Custom'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'completed': 'Completed',
        'processing': 'Processing',
        'failed': 'Failed'
    }
    return statusMap[status] || status
}

const formatDate = (dateString) => {
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