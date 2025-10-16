import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { useWebSocketStore } from '@/stores/websocket'

export const useAdminStore = defineStore('admin', () => {
    const toast = useToast()
    const wsStore = useWebSocketStore()

    // State
    const isLoading = ref(false)
    const lastUpdated = ref(new Date())

    // Dashboard statistics
    const stats = ref({
        totalEvents: 0,
        activeEvents: 0,
        totalCommittees: 0,
        activeCommittees: 0,
        totalUsers: 0,
        activeUsers: 0,
        registeredUsers: 0,
        documentsUploaded: 0,
        pendingModeration: 0,
        recentErrors: 0,
        unreadNotifications: 0
    })

    // System health data
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

    // Performance metrics
    const performanceMetrics = ref({
        responseTime: 0,
        activeConnections: 0,
        memoryUsage: null,
        cpuUsage: null
    })

    // Recent activity data
    const recentActivity = ref([])
    const activeEvents = ref([])

    // Computed
    const overallHealthStatus = computed(() => {
        const { api, database, websocket } = systemHealth.value
        if (api && database && websocket) return 'healthy'
        if (api && database) return 'degraded'
        return 'unhealthy'
    })

    const healthStatusText = computed(() => {
        switch (overallHealthStatus.value) {
            case 'healthy': return 'All Systems Operational'
            case 'degraded': return 'Some Issues Detected'
            default: return 'Major Issues'
        }
    })

    const wsStatus = computed(() => {
        if (!wsStore) return { connected: false, text: 'Not Available' }
        return {
            connected: wsStore.isConnected,
            text: wsStore.isConnected ? 'Connected' : wsStore.isConnecting ? 'Connecting...' : 'Disconnected'
        }
    })

    // Actions
    const loadDashboardStats = async () => {
        try {
            const response = await apiMethods.admin.getDashboardStats()

            if (response?.data?.success) {
                // Merge new stats with existing ones
                stats.value = { ...stats.value, ...response.data.stats }
                lastUpdated.value = new Date()
                return true
            } else {
                throw new Error(response?.data?.error || 'Failed to load stats')
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error)
            toast.error('Failed to load dashboard statistics')
            return false
        }
    }

    const loadSystemHealth = async () => {
        try {
            const startTime = Date.now()
            const response = await apiMethods.admin.getSystemHealth()
            const responseTime = Date.now() - startTime

            performanceMetrics.value.responseTime = responseTime

            if (response?.data) {
                const data = response.data

                // Update health data
                healthData.value = {
                    status: data.status || 'unknown',
                    uptime: data.uptime || 0,
                    version: data.version || '1.0.0',
                    modules: data.modules || {},
                    services: data.services || {}
                }

                // Update system health status
                systemHealth.value = {
                    api: data.status === 'healthy',
                    database: data.services?.database === 'connected',
                    websocket: wsStore?.isConnected || false
                }

                return true
            } else {
                throw new Error('Invalid health response')
            }
        } catch (error) {
            console.error('Failed to load system health:', error)

            // Set error state
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
            performanceMetrics.value.responseTime = 0

            toast.error('Failed to load system health')
            return false
        }
    }

    const loadRecentActivity = async (limit = 10) => {
        try {
            const response = await apiMethods.admin.getRecentActivity({ limit })

            if (response?.data?.success) {
                recentActivity.value = response.data.activities || []
                return true
            } else {
                throw new Error(response?.data?.error || 'Failed to load activity')
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error)
            toast.error('Failed to load recent activity')
            return false
        }
    }

    const loadActiveEvents = async () => {
        try {
            const response = await apiMethods.events.getAll({ status: 'active' })
            activeEvents.value = Array.isArray(response?.data) ? response.data : response?.data?.events || []
            return true
        } catch (error) {
            console.error('Failed to load active events:', error)
            toast.error('Failed to load active events')
            return false
        }
    }

    const loadPerformanceMetrics = async () => {
        try {
            const response = await apiMethods.admin.getPerformanceMetrics()

            if (response?.data?.success) {
                const metrics = response.data.metrics
                performanceMetrics.value = {
                    ...performanceMetrics.value,
                    memoryUsage: metrics.memory,
                    cpuUsage: metrics.cpuUsage,
                    activeConnections: metrics.activeConnections || 0
                }
                return true
            }
        } catch (error) {
            console.error('Failed to load performance metrics:', error)
            return false
        }
    }

    // Bulk data refresh
    const refreshAllData = async () => {
        if (isLoading.value) return false

        isLoading.value = true
        try {
            const results = await Promise.allSettled([
                loadDashboardStats(),
                loadSystemHealth(),
                loadRecentActivity(),
                loadActiveEvents(),
                loadPerformanceMetrics()
            ])

            const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length

            if (successCount > 0) {
                lastUpdated.value = new Date()
                toast.success('Dashboard data refreshed')
                return true
            } else {
                toast.error('Failed to refresh dashboard data')
                return false
            }
        } catch (error) {
            console.error('Failed to refresh all data:', error)
            toast.error('Failed to refresh dashboard data')
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Initialize data loading
    const initializeAdminData = async () => {
        return await refreshAllData()
    }

    // Auto-refresh setup
    let refreshInterval = null

    const startAutoRefresh = (intervalMs = 60000) => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
        }

        refreshInterval = setInterval(async () => {
            if (!isLoading.value) {
                await loadSystemHealth()
                await loadDashboardStats()
            }
        }, intervalMs)
    }

    const stopAutoRefresh = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    }

    // Utility functions
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

    const getHealthColor = (status) => {
        switch (status) {
            case 'healthy': return 'bg-green-500'
            case 'degraded': return 'bg-yellow-500'
            default: return 'bg-red-500'
        }
    }

    const getHealthTextColor = (status) => {
        switch (status) {
            case 'healthy': return 'text-green-700'
            case 'degraded': return 'text-yellow-700'
            default: return 'text-red-700'
        }
    }

    return {
        // State
        isLoading,
        lastUpdated,
        stats,
        systemHealth,
        healthData,
        performanceMetrics,
        recentActivity,
        activeEvents,

        // Computed
        overallHealthStatus,
        healthStatusText,
        wsStatus,

        // Actions
        loadDashboardStats,
        loadSystemHealth,
        loadRecentActivity,
        loadActiveEvents,
        loadPerformanceMetrics,
        refreshAllData,
        initializeAdminData,
        startAutoRefresh,
        stopAutoRefresh,

        // Utilities
        formatUptime,
        getHealthColor,
        getHealthTextColor
    }
})