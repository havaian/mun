<template>
    <div class="admin-logs">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 mb-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                    <h1 class="text-2xl font-bold text-mun-gray-900">System Logs</h1>
                    <p class="text-mun-gray-600 mt-1">Monitor system activity and audit trails</p>
                </div>

                <div class="flex items-center space-x-3">
                    <button @click="refreshLogs" :disabled="isLoading"
                        class="inline-flex items-center px-4 py-2 border border-mun-gray-300 rounded-lg text-sm font-medium text-mun-gray-700 bg-white hover:bg-mun-gray-50 disabled:opacity-50 transition-colors">
                        <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
                        Refresh
                    </button>

                    <button @click="exportLogs"
                        class="inline-flex items-center px-4 py-2 bg-mun-blue-600 text-white rounded-lg text-sm font-medium hover:bg-mun-blue-700 transition-colors">
                        <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Log Level Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Log Level</label>
                    <select v-model="filters.level" @change="applyFilters"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue-500 focus:border-mun-blue-500">
                        <option value="">All Levels</option>
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                    </select>
                </div>

                <!-- Activity Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Activity Type</label>
                    <select v-model="filters.type" @change="applyFilters"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue-500 focus:border-mun-blue-500">
                        <option value="">All Types</option>
                        <option value="auth">Authentication</option>
                        <option value="session">Session</option>
                        <option value="document">Document</option>
                        <option value="voting">Voting</option>
                        <option value="system">System</option>
                        <option value="api">API</option>
                    </select>
                </div>

                <!-- Date Range -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Date From</label>
                    <input type="date" v-model="filters.dateFrom" @change="applyFilters"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue-500 focus:border-mun-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Date To</label>
                    <input type="date" v-model="filters.dateTo" @change="applyFilters"
                        class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue-500 focus:border-mun-blue-500">
                </div>
            </div>

            <!-- Search -->
            <div class="mt-4">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Search Logs</label>
                <div class="relative">
                    <MagnifyingGlassIcon class="absolute left-3 top-3 h-4 w-4 text-mun-gray-400" />
                    <input type="text" v-model="filters.search" @input="debounceSearch"
                        placeholder="Search by message, user, or IP address..."
                        class="w-full pl-10 pr-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue-500 focus:border-mun-blue-500">
                </div>
            </div>

            <!-- Quick Filters -->
            <div class="mt-4 flex flex-wrap gap-2">
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
        </div>

        <!-- Logs Table -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 overflow-hidden">
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
            <div v-else class="p-8 text-center">
                <DocumentTextIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
                <p class="text-mun-gray-500 mb-2">No logs found</p>
                <p class="text-sm text-mun-gray-400">Try adjusting your filters or search terms</p>
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
const loadLogs = async () => {
    isLoading.value = true
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        const allLogs = generateMockLogs()
        let filteredLogs = allLogs

        // Apply filters
        if (filters.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filters.level)
        }

        if (filters.type) {
            filteredLogs = filteredLogs.filter(log => log.type === filters.type)
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase()
            filteredLogs = filteredLogs.filter(log =>
                log.message.toLowerCase().includes(searchTerm) ||
                (log.user && log.user.toLowerCase().includes(searchTerm))
            )
        }

        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

        totalLogs.value = filteredLogs.length

        // Paginate
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        logs.value = filteredLogs.slice(startIndex, endIndex)

    } catch (error) {
        toast.error('Failed to load logs')
        console.error('Load logs error:', error)
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
    // Simulate export functionality
    toast.success('Logs exported successfully')
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