<template>
    <div class="min-h-screen bg-mun-gray-50">
        <!-- Header -->
        <div class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-mun-gray-900">System Logs</h1>
                        <p class="mt-1 text-sm text-mun-gray-600">
                            Monitor system activities and debug information
                        </p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button @click="refreshLogs" :disabled="isLoading"
                            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue disabled:opacity-50">
                            <ArrowPathIcon :class="['h-4 w-4 mr-2', { 'animate-spin': isLoading }]" />
                            Refresh
                        </button>
                        <button @click="downloadLogs" :disabled="logs.length === 0"
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mun-blue-600 hover:bg-mun-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue disabled:opacity-50">
                            <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Filters -->
            <div class="bg-white rounded-lg shadow mb-6 p-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Log Level Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                        <select v-model="filters.level" @change="applyFilters"
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-mun-blue focus:ring-mun-blue text-sm">
                            <option value="">All Levels</option>
                            <option value="error">Error</option>
                            <option value="warn">Warning</option>
                            <option value="info">Info</option>
                            <option value="debug">Debug</option>
                        </select>
                    </div>

                    <!-- Source Filter -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Source</label>
                        <select v-model="filters.source" @change="applyFilters"
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-mun-blue focus:ring-mun-blue text-sm">
                            <option value="">All Sources</option>
                            <option value="api">API</option>
                            <option value="auth">Authentication</option>
                            <option value="database">Database</option>
                            <option value="websocket">WebSocket</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <!-- Date Range -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                        <select v-model="filters.timeRange" @change="applyFilters"
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-mun-blue focus:ring-mun-blue text-sm">
                            <option value="1h">Last Hour</option>
                            <option value="6h">Last 6 Hours</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>

                    <!-- Search -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <input v-model="filters.search" @input="debounceSearch" type="text" placeholder="Search logs..."
                            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-mun-blue focus:ring-mun-blue text-sm">
                    </div>
                </div>

                <!-- Stats -->
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-red-600">{{ logStats.errors }}</div>
                            <div class="text-sm text-gray-500">Errors</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600">{{ logStats.warnings }}</div>
                            <div class="text-sm text-gray-500">Warnings</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">{{ logStats.info }}</div>
                            <div class="text-sm text-gray-500">Info</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-gray-600">{{ logStats.debug }}</div>
                            <div class="text-sm text-gray-500">Debug</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-mun-blue-600">{{ filteredLogs.length }}</div>
                            <div class="text-sm text-gray-500">Total Shown</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Logs List -->
            <div class="bg-white rounded-lg shadow">
                <!-- Loading State -->
                <div v-if="isLoading" class="p-8 text-center">
                    <div class="animate-spin h-8 w-8 text-mun-blue-600 mx-auto mb-4">
                        <ArrowPathIcon class="h-8 w-8" />
                    </div>
                    <p class="text-gray-500">Loading logs...</p>
                </div>

                <!-- Empty State -->
                <div v-else-if="filteredLogs.length === 0" class="p-8 text-center">
                    <DocumentTextIcon class="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                    <p class="text-gray-500">Try adjusting your filters or check back later.</p>
                </div>

                <!-- Logs Table -->
                <div v-else class="overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Level
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Message
                                    </th>
                                    <th
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="log in paginatedLogs" :key="log.id" class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span :class="[
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                            getLogLevelClass(log.level)
                                        ]">
                                            {{ log.level.toUpperCase() }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {{ formatTimestamp(log.timestamp) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span :class="[
                                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                                            getSourceClass(log.source)
                                        ]">
                                            {{ log.source || 'system' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">
                                        <div class="max-w-xs md:max-w-md lg:max-w-lg">
                                            <p class="truncate" :title="log.message">{{ log.message }}</p>
                                            <div v-if="log.details" class="text-xs text-gray-500 mt-1">
                                                {{ JSON.stringify(log.details).substring(0, 100) }}...
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button @click="viewLogDetails(log)"
                                            class="text-mun-blue-600 hover:text-mun-blue-900 transition-colors">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div class="flex-1 flex justify-between sm:hidden">
                            <button @click="previousPage" :disabled="currentPage === 1"
                                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                Previous
                            </button>
                            <button @click="nextPage" :disabled="currentPage === totalPages"
                                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                Next
                            </button>
                        </div>
                        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p class="text-sm text-gray-700">
                                    Showing
                                    <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                                    to
                                    <span class="font-medium">{{ Math.min(currentPage * pageSize, filteredLogs.length)
                                    }}</span>
                                    of
                                    <span class="font-medium">{{ filteredLogs.length }}</span>
                                    results
                                </p>
                            </div>
                            <div>
                                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button @click="previousPage" :disabled="currentPage === 1"
                                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                        Previous
                                    </button>
                                    <button @click="nextPage" :disabled="currentPage === totalPages"
                                        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Log Details Modal -->
        <LogDetailsModal v-if="selectedLog" :log="selectedLog" @close="selectedLog = null" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import LogDetailsModal from '@/components/admin/LogDetailsModal.vue'

// Icons
import {
    ArrowPathIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon
} from '@heroicons/vue/24/outline'

const toast = useToast()

// State
const isLoading = ref(false)
const logs = ref([])
const selectedLog = ref(null)
const currentPage = ref(1)
const pageSize = ref(50)

// Filters
const filters = ref({
    level: '',
    source: '',
    timeRange: '24h',
    search: ''
})

// Search debounce
let searchTimeout = null

// Computed
const filteredLogs = computed(() => {
    return logs.value.filter(log => {
        // Level filter
        if (filters.value.level && log.level !== filters.value.level) {
            return false
        }

        // Source filter
        if (filters.value.source && log.source !== filters.value.source) {
            return false
        }

        // Search filter
        if (filters.value.search) {
            const searchTerm = filters.value.search.toLowerCase()
            const searchableText = `${log.message} ${log.source || ''} ${JSON.stringify(log.details || {})}`.toLowerCase()
            if (!searchableText.includes(searchTerm)) {
                return false
            }
        }

        return true
    })
})

const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredLogs.value.slice(start, end)
})

const totalPages = computed(() => {
    return Math.ceil(filteredLogs.value.length / pageSize.value)
})

const logStats = computed(() => {
    return filteredLogs.value.reduce((stats, log) => {
        stats[log.level] = (stats[log.level] || 0) + 1
        return stats
    }, { errors: 0, warnings: 0, info: 0, debug: 0 })
})

// Methods
const loadLogs = async () => {
    isLoading.value = true
    try {
        // Since we don't have a real logs endpoint, we'll create mock data
        // In a real implementation, this would call: apiMethods.get('/admin/logs', { params: filters.value })

        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

        // Mock log data
        logs.value = generateMockLogs()

    } catch (error) {
        toast.error('Failed to load logs:', error)
        toast.error('Failed to load system logs')
    } finally {
        isLoading.value = false
    }
}

const generateMockLogs = () => {
    const levels = ['error', 'warn', 'info', 'debug']
    const sources = ['api', 'auth', 'database', 'websocket', 'admin']
    const messages = [
        'User authentication successful',
        'Database connection established',
        'WebSocket client connected',
        'Failed to process request',
        'Cache miss for key',
        'Email sent successfully',
        'File upload completed',
        'Invalid request parameters',
        'Session expired',
        'Background job started'
    ]

    return Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        details: Math.random() > 0.5 ? {
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0...'
        } : null
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

const refreshLogs = () => {
    currentPage.value = 1
    loadLogs()
}

const applyFilters = () => {
    currentPage.value = 1
    // In a real implementation, this would make an API call with new filters
    // For now, filtering is done client-side
}

const debounceSearch = () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        applyFilters()
    }, 500)
}

const downloadLogs = () => {
    const logsData = filteredLogs.value.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
        details: log.details
    }))

    const dataStr = JSON.stringify(logsData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Logs downloaded successfully')
}

const viewLogDetails = (log) => {
    selectedLog.value = log
}

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--
    }
}

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
    }
}

// Styling helpers
const getLogLevelClass = (level) => {
    const classes = {
        error: 'bg-red-100 text-red-800',
        warn: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        debug: 'bg-gray-100 text-gray-800'
    }
    return classes[level] || classes.debug
}

const getSourceClass = (source) => {
    const classes = {
        api: 'bg-green-100 text-green-800',
        auth: 'bg-purple-100 text-purple-800',
        database: 'bg-blue-100 text-blue-800',
        websocket: 'bg-orange-100 text-orange-800',
        admin: 'bg-red-100 text-red-800'
    }
    return classes[source] || 'bg-gray-100 text-gray-800'
}

const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
}

// Watch for filter changes to reset pagination
watch(filteredLogs, () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = 1
    }
})

// Lifecycle
onMounted(() => {
    loadLogs()
})
</script>

<style scoped>
/* Component is styled using Tailwind utility classes */
</style>