// frontend/src/stores/admin.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiMethods } from '@/utils/api'
import { performanceUtils } from '@/utils/performance'

export const useAdminStore = defineStore('admin', () => {
    // State
    const stats = ref({
        unreadNotifications: 0,
        activeEvents: 0,
        activeCommittees: 0,
        activeUsers: 0,
        recentDocuments: 0,
        totalUsers: 0,
        totalEvents: 0,
        totalCommittees: 0,
        totalDocuments: 0,
        systemLoad: 0,
        memoryUsage: 0,
        activeSessions: 0,
        errorRate: 0
    })

    const systemHealth = ref({
        api: true,
        database: true,
        websocket: true,
        redis: true,
        storage: true,
        overall: 'healthy'
    })

    const healthData = ref({
        uptime: 0,
        version: '1.0.0',
        environment: 'production',
        lastUpdate: null,
        dbConnections: 0,
        activeConnections: 0
    })

    const performanceMetrics = ref({
        responseTime: 0,
        errorRate: 0,
        memoryUsage: {
            heapUsed: 0,
            heapTotal: 0,
            external: 0,
            rss: 0
        },
        cpuUsage: 0,
        diskUsage: 0,
        networkLatency: 0
    })

    const recentActivity = ref([])

    // Internal state
    const isLoading = ref(false)
    const lastUpdated = ref(null)
    let autoRefreshTimer = null
    let performanceTimer = null

    // Computed
    const isHealthy = computed(() => {
        return systemHealth.value.api &&
            systemHealth.value.database &&
            systemHealth.value.websocket
    })

    const criticalAlerts = computed(() => {
        const alerts = []

        if (!systemHealth.value.api) {
            alerts.push({ type: 'error', message: 'API is down' })
        }

        if (!systemHealth.value.database) {
            alerts.push({ type: 'error', message: 'Database connection lost' })
        }

        if (performanceMetrics.value.errorRate > 5) {
            alerts.push({ type: 'warning', message: `High error rate: ${performanceMetrics.value.errorRate}%` })
        }

        if (performanceMetrics.value.responseTime > 2000) {
            alerts.push({ type: 'warning', message: `Slow response time: ${performanceMetrics.value.responseTime}ms` })
        }

        return alerts
    })

    const memoryUsagePercentage = computed(() => {
        const { heapUsed, heapTotal } = performanceMetrics.value.memoryUsage
        if (!heapTotal) return 0
        return Math.round((heapUsed / heapTotal) * 100)
    })

    // Methods
    const initializeAdminData = async () => {
        try {
            isLoading.value = true

            // Load all admin data in parallel for better performance
            await Promise.allSettled([
                loadStats(),
                loadSystemHealth(),
                loadPerformanceMetrics(),
                loadRecentActivity()
            ])

            lastUpdated.value = new Date()
        } catch (error) {
            console.error('Admin data initialization error:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const loadStats = async () => {
        try {
            const response = await apiMethods.admin.getDashboardStats()

            if (response?.data) {
                // Merge with existing stats to prevent flashing
                stats.value = {
                    ...stats.value,
                    ...response.data
                }
            }
        } catch (error) {
            console.error('Failed to load stats:', error)
            throw error
        }
    }

    const loadSystemHealth = async () => {
        try {
            const response = await apiMethods.admin.getSystemHealth()

            if (response?.data) {
                systemHealth.value = {
                    ...systemHealth.value,
                    ...response.data.health
                }

                healthData.value = {
                    ...healthData.value,
                    ...response.data.info
                }
            }
        } catch (error) {
            console.error('Failed to load system health:', error)
            // Don't mark as unhealthy due to network issues
        }
    }

    const loadPerformanceMetrics = async () => {
        try {
            const response = await apiMethods.admin.getPerformanceMetrics()

            if (response?.data) {
                performanceMetrics.value = {
                    ...performanceMetrics.value,
                    ...response.data.metrics
                }
            }
        } catch (error) {
            console.error('Failed to load performance metrics:', error)
        }
    }

    const loadRecentActivity = async (limit = 20) => {
        try {
            const response = await apiMethods.admin.getRecentActivity({
                limit,
                timeRange: '24h'
            })

            if (response?.data?.success) {
                recentActivity.value = response.data.activities || []
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error)
        }
    }

    const refreshAllData = async () => {
        try {
            isLoading.value = true

            const startTime = Date.now()

            await Promise.allSettled([
                loadStats(),
                loadSystemHealth(),
                loadPerformanceMetrics(),
                loadRecentActivity()
            ])

            const loadTime = Date.now() - startTime

            lastUpdated.value = new Date()

            // Track performance
            if (loadTime > 5000) {
                console.warn(`Admin data refresh took ${loadTime}ms - consider optimization`)
            }

        } catch (error) {
            console.error('Failed to refresh admin data:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    // Optimized auto-refresh with intelligent intervals
    const startAutoRefresh = (baseInterval = 30000) => {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer)
        }

        let currentInterval = baseInterval

        const refresh = async () => {
            try {
                // Only refresh stats frequently, health less frequently
                await loadStats()

                // Health check every 3rd refresh
                if (Date.now() % 3 === 0) {
                    await loadSystemHealth()
                }

                // Performance metrics every 5th refresh  
                if (Date.now() % 5 === 0) {
                    await loadPerformanceMetrics()
                }

                // Reset interval on success
                currentInterval = baseInterval

            } catch (error) {
                // Exponential backoff on errors
                currentInterval = Math.min(currentInterval * 1.5, 300000) // Max 5 minutes
                console.warn(`Admin refresh error, backing off to ${currentInterval}ms:`, error)
            }

            // Schedule next refresh with current interval
            autoRefreshTimer = setTimeout(refresh, currentInterval)
        }

        // Start first refresh
        autoRefreshTimer = setTimeout(refresh, baseInterval)
    }

    const stopAutoRefresh = () => {
        if (autoRefreshTimer) {
            clearTimeout(autoRefreshTimer)
            autoRefreshTimer = null
        }
    }

    // Real-time performance monitoring
    const startPerformanceMonitoring = () => {
        if (performanceTimer) {
            clearInterval(performanceTimer)
        }

        performanceTimer = setInterval(async () => {
            try {
                // Client-side performance metrics
                if (performance.memory) {
                    performanceMetrics.value.memoryUsage = {
                        ...performanceMetrics.value.memoryUsage,
                        heapUsed: performance.memory.usedJSHeapSize,
                        heapTotal: performance.memory.totalJSHeapSize
                    }
                }

                // Network latency test
                const startTime = Date.now()
                try {
                    await fetch('/api/ping', { method: 'HEAD' })
                    performanceMetrics.value.networkLatency = Date.now() - startTime
                } catch (error) {
                    performanceMetrics.value.networkLatency = -1 // Error indicator
                }

            } catch (error) {
                console.warn('Performance monitoring error:', error)
            }
        }, 5000) // Every 5 seconds
    }

    const stopPerformanceMonitoring = () => {
        if (performanceTimer) {
            clearInterval(performanceTimer)
            performanceTimer = null
        }
    }

    // Utility methods
    const formatUptime = (uptime) => {
        if (!uptime) return 'Unknown'

        const days = Math.floor(uptime / (24 * 60 * 60))
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60))
        const minutes = Math.floor((uptime % (60 * 60)) / 60)

        if (days > 0) return `${days}d ${hours}h ${minutes}m`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    const exportHealthReport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            stats: stats.value,
            systemHealth: systemHealth.value,
            performanceMetrics: performanceMetrics.value,
            recentActivity: recentActivity.value.slice(0, 10)
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `health-report-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // Action methods
    const clearSystemCache = async () => {
        try {
            const response = await apiMethods.admin.clearSystemCache()
            if (response?.data?.success) {
                // Refresh stats after cache clear
                await loadStats()
                return true
            }
            return false
        } catch (error) {
            console.error('Failed to clear system cache:', error)
            throw error
        }
    }

    const restartService = async (serviceName) => {
        try {
            const response = await apiMethods.admin.restartService(serviceName)
            if (response?.data?.success) {
                // Refresh health after service restart
                await loadSystemHealth()
                return true
            }
            return false
        } catch (error) {
            console.error(`Failed to restart ${serviceName}:`, error)
            throw error
        }
    }

    const bulkGenerateQR = async (committeeIds) => {
        try {
            const response = await apiMethods.admin.bulkGenerateQR({
                committeeIds
            })

            if (response?.data?.success) {
                // Update stats after bulk operation
                await loadStats()
                return response.data
            }

            throw new Error('Bulk QR generation failed')
        } catch (error) {
            console.error('Bulk QR generation error:', error)
            throw error
        }
    }

    // Event handlers for WebSocket updates
    const handleWebSocketMessage = (message) => {
        try {
            const data = JSON.parse(message)

            switch (data.type) {
                case 'stats_update':
                    stats.value = { ...stats.value, ...data.stats }
                    break

                case 'health_update':
                    systemHealth.value = { ...systemHealth.value, ...data.health }
                    break

                case 'performance_update':
                    performanceMetrics.value = { ...performanceMetrics.value, ...data.metrics }
                    break

                case 'activity_update':
                    recentActivity.value.unshift(data.activity)
                    // Keep only latest 50 activities
                    recentActivity.value = recentActivity.value.slice(0, 50)
                    break
            }
        } catch (error) {
            console.warn('Failed to process WebSocket message:', error)
        }
    }

    return {
        // State
        stats,
        systemHealth,
        healthData,
        performanceMetrics,
        recentActivity,
        isLoading,
        lastUpdated,

        // Computed
        isHealthy,
        criticalAlerts,
        memoryUsagePercentage,

        // Methods
        initializeAdminData,
        loadStats,
        loadSystemHealth,
        loadPerformanceMetrics,
        loadRecentActivity,
        refreshAllData,
        startAutoRefresh,
        stopAutoRefresh,
        startPerformanceMonitoring,
        stopPerformanceMonitoring,
        formatUptime,
        exportHealthReport,
        clearSystemCache,
        restartService,
        bulkGenerateQR,
        handleWebSocketMessage
    }
}, {
    // Persist only critical data across sessions
    persist: {
        enabled: true,
        strategies: [
            {
                key: 'admin-cache',
                storage: sessionStorage,
                paths: ['stats', 'lastUpdated'],
                serializer: {
                    serialize: JSON.stringify,
                    deserialize: JSON.parse
                }
            }
        ]
    }
})