<template>
    <div class="admin-logs p-6 space-y-6">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">System Logs</h1>
                <p class="text-mun-gray-600 mt-1">Monitor system activity and audit trails</p>
            </div>

            <div class="flex items-center space-x-3">
                <button @click="refreshLogs" :disabled="isLoading" class="btn-un-fourth">
                    <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
                    Refresh
                </button>

                <button @click="exportLogs" class="btn-un-third">
                    <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                    Export
                </button>
            </div>
        </div>

        <!-- Filters -->
        <div class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Log Level Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Log Level</label>
                    <SleekSelect v-model="filters.level" @change="applyFilters" :options="[
                        { label: 'All Levels', value: '' },
                        { label: 'Error', value: 'error' },
                        { label: 'Warning', value: 'warn' },
                        { label: 'Info', value: 'info' },
                        { label: 'Debug', value: 'debug' }
                    ]" placeholder="Select log level" container-class="w-full" />
                </div>

                <!-- Activity Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Activity Type</label>
                    <SleekSelect v-model="filters.type" @change="applyFilters" :options="[
                        { label: 'All Types', value: '' },
                        { label: 'Authentication', value: 'auth' },
                        { label: 'Session', value: 'session' },
                        { label: 'Document', value: 'document' },
                        { label: 'Voting', value: 'voting' },
                        { label: 'System', value: 'system' },
                        { label: 'API', value: 'api' }
                    ]" placeholder="Select activity type" container-class="w-full" />
                </div>

                <!-- Date From -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Date From</label>
                    <input type="date" v-model="filters.dateFrom" @change="applyFilters" class="input-field w-full">
                </div>

                <!-- Date To -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Date To</label>
                    <input type="date" v-model="filters.dateTo" @change="applyFilters" class="input-field w-full">
                </div>
            </div>

            <!-- Search -->
            <div class="mt-4">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Search Logs</label>
                <div class="relative">
                    <MagnifyingGlassIcon class="absolute left-3 top-3 h-4 w-4 text-mun-gray-400" />
                    <input type="text" v-model="filters.search" @input="debounceSearch"
                        placeholder="Search by message, user, or IP address..."
                        class="input-field w-full pl-10 pr-4 py-2">
                </div>
            </div>

            <!-- Quick Filters -->
            <div class="mt-4 flex flex-wrap gap-2 items-center justify-between">
                <div class="flex flex-wrap gap-2">
                    <button @click="applyQuickFilter('today')" :class="quickFilterClass('today')"
                        class="px-3 py-1 text-xs font-medium rounded-full transition-colors">
                        Today
                    </button>
                    <button @click="applyQuickFilter('week')" :class="quickFilterClass('week')"
                        class="px-3 py-1 text-xs font-medium rounded-full transition-colors">
                        This Week
                    </button>
                    <button @click="applyQuickFilter('errors')" :class="quickFilterClass('errors')"
                        class="px-3 py-1 text-xs font-medium rounded-full transition-colors">
                        Errors Only
                    </button>
                    <button @click="clearFilters"
                        class="px-3 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-700 hover:bg-mun-gray-200 transition-colors">
                        Clear All
                    </button>
                </div>

                <!-- Filter Status -->
                <div v-if="hasActiveFilters" class="text-sm text-mun-gray-600">
                    {{ logs.length }} logs found
                </div>
            </div>
        </div>

        <!-- View Toggle and Actions -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
                <!-- Table View Info -->
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">Table View</span>
                </div>

                <!-- Filter Status -->
                <div v-if="hasActiveFilters" class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">
                        {{ logs.length }} logs found
                    </span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-3">
                <button @click="exportLogs" class="btn-un-secondary px-3 py-2">
                    <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                    Export
                </button>

                <button @click="refreshLogs" :disabled="isLoading" class="btn-un-secondary px-3 py-2">
                    <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
                    Refresh
                </button>
            </div>
        </div>

        <!-- Logs Table -->
        <div class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 overflow-hidden">
            <!-- Loading State -->
            <div v-if="isLoading" class="p-8 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-mun-blue-600 mx-auto mb-4"></div>
                <p class="text-mun-gray-600">Loading logs...</p>
            </div>

            <!-- Logs Content -->
            <div v-else-if="logs.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-mun-gray-200">
                    <thead class="bg-mun-gray-50">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Level
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Message
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-mun-gray-200">
                        <tr v-for="log in logs" :key="log.id" class="hover:bg-mun-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-900">
                                {{ formatTimestamp(log.timestamp) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="getLevelClass(log.level)"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                    {{ log.level.toUpperCase() }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="getTypeClass(log.type)"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                    {{ log.type }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-mun-gray-900 max-w-md truncate">
                                {{ log.message }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-600">
                                {{ log.user || 'System' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button @click="viewLogDetails(log)"
                                    class="text-mun-blue-600 hover:text-mun-blue-900 transition-colors">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            <div v-else
                class="bg-white rounded-xl shadow-sm border border-mun-gray-200 overflow-hidden text-center py-12">
                <DocumentTextIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-mun-gray-900 mb-2">
                    {{ hasActiveFilters ? 'No logs match your filters' : 'No logs found' }}
                </h3>
                <p class="text-mun-gray-600 mb-6">
                    {{ hasActiveFilters
                        ? 'Try adjusting your search criteria or filters.'
                        : 'System logs will appear here as activity occurs.'
                    }}
                </p>
                <button v-if="hasActiveFilters" @click="clearFilters" class="btn-un-secondary">
                    Clear All Filters
                </button>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="px-6 py-4 bg-mun-gray-50 border-t border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-mun-gray-700">
                        Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalLogs)
                        }}
                        of {{ totalLogs }} logs
                    </p>

                    <div class="flex items-center space-x-2">
                        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
                            class="px-3 py-1 text-sm bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Previous
                        </button>

                        <span class="text-sm text-mun-gray-700">
                            Page {{ currentPage }} of {{ totalPages }}
                        </span>

                        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages"
                            class="px-3 py-1 text-sm bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Log Details Modal -->
        <div v-if="selectedLog" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-mun-gray-500 bg-opacity-75" @click="selectedLog = null">
                </div>

                <div
                    class="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-mun-gray-900">Log Details</h3>
                        <button @click="selectedLog = null" class="text-mun-gray-400 hover:text-mun-gray-600">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700">Timestamp</label>
                                <p class="text-sm text-mun-gray-900">{{ formatTimestamp(selectedLog.timestamp) }}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700">Level</label>
                                <span :class="getLevelClass(selectedLog.level)"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                    {{ selectedLog.level.toUpperCase() }}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700">Type</label>
                                <span :class="getTypeClass(selectedLog.type)"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                    {{ selectedLog.type }}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700">User</label>
                                <p class="text-sm text-mun-gray-900">{{ selectedLog.user || 'System' }}</p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Message</label>
                            <p class="text-sm text-mun-gray-900 bg-mun-gray-50 p-3 rounded-lg">{{ selectedLog.message }}
                            </p>
                        </div>

                        <div v-if="selectedLog.details">
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Additional Details</label>
                            <pre
                                class="text-xs text-mun-gray-700 bg-mun-gray-50 p-3 rounded-lg overflow-x-auto">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end">
                        <button @click="selectedLog = null"
                            class="px-4 py-2 bg-mun-gray-100 text-mun-gray-700 rounded-lg hover:bg-mun-gray-200 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { apiMethods } from '@/utils/api'
import {
    ArrowPathIcon,
    ArrowDownTrayIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

// State
const isLoading = ref(false)
const logs = ref([])
const selectedLog = ref(null)
const currentPage = ref(1)
const pageSize = ref(50)
const totalLogs = ref(0)
const activeQuickFilter = ref('')

// Filters
const filters = reactive({
    level: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    search: ''
})

// Computed
const totalPages = computed(() => Math.ceil(totalLogs.value / pageSize.value))

// Map activity types to log levels for better categorization
const mapActivityToLogLevel = (actionType) => {
    const errorTypes = ['login_failed', 'upload_failed', 'system_error', 'database_error']
    const warnTypes = ['session_timeout', 'invalid_request', 'rate_limit_exceeded']
    const infoTypes = ['login', 'logout', 'document_upload', 'vote_cast', 'session_start', 'session_end']

    if (errorTypes.includes(actionType)) return 'error'
    if (warnTypes.includes(actionType)) return 'warn'
    if (infoTypes.includes(actionType)) return 'info'
    return 'debug'
}

// Map activity types to our log categories
const mapActivityToType = (actionType) => {
    if (actionType.includes('login') || actionType.includes('logout')) return 'auth'
    if (actionType.includes('session')) return 'session'
    if (actionType.includes('document') || actionType.includes('upload')) return 'document'
    if (actionType.includes('vote') || actionType.includes('voting')) return 'voting'
    if (actionType.includes('system') || actionType.includes('database')) return 'system'
    return 'api'
}

// Methods
const getTimeRange = () => {
    if (filters.dateFrom && filters.dateTo) {
        const fromDate = new Date(filters.dateFrom)
        const toDate = new Date(filters.dateTo)
        const diffDays = Math.ceil(Math.abs(toDate - fromDate) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return '24h'
        if (diffDays <= 7) return '7d'
        if (diffDays <= 30) return '30d'
        return '30d'
    }
    return '7d'
}

const loadLogs = async () => {
    isLoading.value = true
    try {
        // Build query parameters
        const params = new URLSearchParams({
            limit: pageSize.value,
            page: currentPage.value,
            type: filters.type || 'all'
        })

        // Add time range based on date filters
        if (filters.dateFrom && filters.dateTo) {
            const fromDate = new Date(filters.dateFrom)
            const toDate = new Date(filters.dateTo)
            const diffTime = Math.abs(toDate - fromDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays === 0) {
                params.set('timeRange', '24h')
            } else if (diffDays <= 7) {
                params.set('timeRange', '7d')
            } else if (diffDays <= 30) {
                params.set('timeRange', '30d')
            }
        } else if (filters.dateFrom || filters.dateTo) {
            params.set('timeRange', '7d') // Default to week if only one date is set
        }

        const response = await apiMethods.admin.getRecentActivity({
            limit: pageSize.value,
            page: currentPage.value,
            type: filters.type || 'all',
            timeRange: getTimeRange()
        })

        const data = response?.data

        if (data.success) {
            // Transform activity data to log format
            let activities = data.activities || []

            // Apply client-side filters
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                activities = activities.filter(activity =>
                    activity.description.toLowerCase().includes(searchTerm) ||
                    (activity.user && activity.user.toLowerCase().includes(searchTerm))
                )
            }

            if (filters.level) {
                activities = activities.filter(activity => {
                    const logLevel = mapActivityToLogLevel(activity.actionType || '')
                    return logLevel === filters.level
                })
            }

            // Transform to log format
            const transformedLogs = activities.map(activity => ({
                id: activity.id,
                timestamp: activity.timestamp,
                level: mapActivityToLogLevel(activity.actionType || ''),
                type: mapActivityToType(activity.actionType || ''),
                message: activity.description,
                user: activity.user,
                details: {
                    actionType: activity.actionType,
                    committee: activity.committee,
                    event: activity.event,
                    metadata: activity.metadata
                }
            }))

            logs.value = transformedLogs
            totalLogs.value = data.totalCount || transformedLogs.length
        } else {
            throw new Error(data.error || 'Failed to load logs')
        }

    } catch (error) {
        console.error('Load logs error:', error)
        toast.error('Failed to load logs')
    } finally {
        isLoading.value = false
    }
}

const refreshLogs = () => {
    currentPage.value = 1
    loadLogs()
}

const applyFilters = () => {
    currentPage.value = 1
    activeQuickFilter.value = ''
    loadLogs()
}

const hasActiveFilters = computed(() => {
    return filters.search.trim() !== '' ||
        filters.level !== '' ||
        filters.type !== '' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '' ||
        activeQuickFilter.value !== ''
})

const debounceSearch = (() => {
    let timeout
    return () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            applyFilters()
        }, 500)
    }
})()

const applyQuickFilter = (filterType) => {
    activeQuickFilter.value = filterType

    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    switch (filterType) {
        case 'today':
            filters.dateFrom = today.toISOString().split('T')[0]
            filters.dateTo = today.toISOString().split('T')[0]
            filters.level = ''
            break
        case 'week':
            filters.dateFrom = weekAgo.toISOString().split('T')[0]
            filters.dateTo = today.toISOString().split('T')[0]
            filters.level = ''
            break
        case 'errors':
            filters.level = 'error'
            filters.dateFrom = ''
            filters.dateTo = ''
            break
    }

    applyFilters()
}

const quickFilterClass = (filterType) => {
    return activeQuickFilter.value === filterType
        ? 'bg-mun-blue-100 text-mun-blue-800'
        : 'bg-mun-gray-100 text-mun-gray-700 hover:bg-mun-gray-200'
}

const clearFilters = () => {
    filters.level = ''
    filters.type = ''
    filters.dateFrom = ''
    filters.dateTo = ''
    filters.search = ''
    activeQuickFilter.value = ''
    applyFilters()
}

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        loadLogs()
    }
}

const viewLogDetails = (log) => {
    selectedLog.value = log
}

const exportLogs = () => {
    // TODO: Implement real export functionality
    toast.success('Export feature coming soon')
}

// Formatting functions
const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
}

const getLevelClass = (level) => {
    const classes = {
        error: 'bg-red-100 text-red-800',
        warn: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        debug: 'bg-gray-100 text-gray-800'
    }
    return classes[level] || classes.info
}

const getTypeClass = (type) => {
    const classes = {
        auth: 'bg-green-100 text-green-800',
        session: 'bg-purple-100 text-purple-800',
        document: 'bg-orange-100 text-orange-800',
        voting: 'bg-red-100 text-red-800',
        system: 'bg-gray-100 text-gray-800',
        api: 'bg-blue-100 text-blue-800'
    }
    return classes[type] || classes.system
}

// Lifecycle
onMounted(() => {
    loadLogs()
})
</script>

<style scoped>
.admin-logs {
    min-height: calc(100vh - 4rem);
    background: #f9fafb;
    padding: 1.5rem;
}

@media (max-width: 640px) {
    .admin-logs {
        padding: 1rem;
    }
}
</style>