<!-- frontend/src/components/presidium/SessionStats.vue -->
<template>
    <div class="session-stats bg-white border border-mun-gray-200 rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-un-blue/10 rounded-lg">
                    <ChartBarIcon class="w-5 h-5 text-un-blue" />
                </div>
                <div>
                    <h3 class="text-sm font-medium text-mun-gray-900">Session Statistics</h3>
                    <p class="text-xs text-mun-gray-500">Real-time session metrics</p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <!-- Time Range Selector -->
                <select v-model="timeRange"
                    class="px-2 py-1 text-xs border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-un-blue">
                    <option value="session">This Session</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                </select>

                <!-- Refresh Button -->
                <button @click="refreshStats" :disabled="isLoading"
                    class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors" title="Refresh statistics">
                    <ArrowPathIcon class="w-4 h-4 text-mun-gray-600" />
                </button>

                <!-- Export Button -->
                <button @click="exportStats" class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors"
                    title="Export statistics">
                    <DocumentArrowDownIcon class="w-4 h-4 text-mun-gray-600" />
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
            <LoadingSpinner />
        </div>

        <!-- Statistics Grid -->
        <div v-else class="stats-grid">
            <!-- Core Metrics -->
            <div class="core-metrics grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <!-- Session Duration -->
                <div class="stat-card bg-un-blue/5 border border-un-blue/20 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <ClockIcon class="w-4 h-4 text-un-blue" />
                        <span class="text-xs text-un-blue font-medium">DURATION</span>
                    </div>
                    <div class="text-lg font-bold text-mun-gray-900">{{ formatDuration(stats.duration) }}</div>
                    <div class="text-xs text-mun-gray-500">{{ getSessionStatus() }}</div>
                </div>

                <!-- Speakers -->
                <div class="stat-card bg-mun-green-50 border border-mun-green-200 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <MicrophoneIcon class="w-4 h-4 text-mun-green-600" />
                        <span class="text-xs text-mun-green-600 font-medium">SPEAKERS</span>
                    </div>
                    <div class="text-lg font-bold text-mun-gray-900">{{ stats.totalSpeakers }}</div>
                    <div class="text-xs text-mun-gray-500">{{ stats.totalSpeeches }} speeches</div>
                </div>

                <!-- Documents -->
                <div class="stat-card bg-mun-yellow-50 border border-mun-yellow-200 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <DocumentTextIcon class="w-4 h-4 text-mun-yellow-600" />
                        <span class="text-xs text-mun-yellow-600 font-medium">DOCUMENTS</span>
                    </div>
                    <div class="text-lg font-bold text-mun-gray-900">{{ stats.documentsSubmitted }}</div>
                    <div class="text-xs text-mun-gray-500">{{ stats.documentsApproved }} approved</div>
                </div>

                <!-- Votes -->
                <div class="stat-card bg-mun-red-50 border border-mun-red-200 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                        <HandRaisedIcon class="w-4 h-4 text-mun-red-600" />
                        <span class="text-xs text-mun-red-600 font-medium">VOTES</span>
                    </div>
                    <div class="text-lg font-bold text-mun-gray-900">{{ stats.totalVotes }}</div>
                    <div class="text-xs text-mun-gray-500">{{ stats.passedVotes }} passed</div>
                </div>
            </div>

            <!-- Detailed Metrics -->
            <div class="detailed-metrics grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Participation Breakdown -->
                <div class="participation-section">
                    <h4 class="text-sm font-medium text-mun-gray-900 mb-3">Participation</h4>

                    <!-- Attendance Chart -->
                    <div class="attendance-chart mb-4 p-3 bg-mun-gray-50 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-mun-gray-700">Current Attendance</span>
                            <span class="text-xs text-mun-gray-500">{{ getAttendancePercentage() }}%</span>
                        </div>

                        <div class="attendance-bar w-full bg-mun-gray-200 rounded-full h-2 mb-2">
                            <div class="bg-mun-green-500 h-2 rounded-full transition-all duration-500"
                                :style="{ width: `${getAttendancePercentage()}%` }"></div>
                        </div>

                        <div class="grid grid-cols-3 gap-2 text-center text-xs">
                            <div>
                                <div class="text-sm font-bold text-mun-green-700">{{ stats.attendance.present }}</div>
                                <div class="text-mun-gray-500">Present</div>
                            </div>
                            <div>
                                <div class="text-sm font-bold text-mun-red-700">{{ stats.attendance.absent }}</div>
                                <div class="text-mun-gray-500">Absent</div>
                            </div>
                            <div>
                                <div class="text-sm font-bold text-mun-gray-700">{{ stats.attendance.total }}</div>
                                <div class="text-mun-gray-500">Total</div>
                            </div>
                        </div>
                    </div>

                    <!-- Speaking Time Distribution -->
                    <div class="speaking-time mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-mun-gray-700">Speaking Time</span>
                            <span class="text-xs text-mun-gray-500">{{ formatDuration(stats.totalSpeakingTime) }}</span>
                        </div>

                        <div class="space-y-1">
                            <div v-for="speaker in topSpeakers" :key="speaker.country"
                                class="flex items-center justify-between text-xs">
                                <div class="flex items-center space-x-2">
                                    <CountryFlag :country="speaker.country" size="xs" />
                                    <span class="font-medium">{{ speaker.country }}</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-16 bg-mun-gray-200 rounded-full h-1">
                                        <div class="bg-un-blue h-1 rounded-full"
                                            :style="{ width: `${(speaker.time / stats.totalSpeakingTime) * 100}%` }">
                                        </div>
                                    </div>
                                    <span class="text-mun-gray-500">{{ formatDuration(speaker.time) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Activity Timeline -->
                <div class="activity-section">
                    <h4 class="text-sm font-medium text-mun-gray-900 mb-3">Recent Activity</h4>

                    <!-- Mode Changes -->
                    <div class="mode-changes mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-mun-gray-700">Debate Modes</span>
                            <span class="text-xs text-mun-gray-500">{{ stats.modeChanges }} changes</span>
                        </div>

                        <div class="timeline-container max-h-24 overflow-y-auto">
                            <div v-for="mode in recentModes" :key="mode.id"
                                class="timeline-item flex items-center justify-between text-xs mb-1">
                                <div class="flex items-center space-x-2">
                                    <div :class="getModeIconBg(mode.mode)" class="w-2 h-2 rounded-full"></div>
                                    <span>{{ getModeDisplayName(mode.mode) }}</span>
                                </div>
                                <span class="text-mun-gray-500">{{ formatTime(mode.startedAt) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Document Submissions -->
                    <div class="document-activity mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-mun-gray-700">Documents</span>
                            <span class="text-xs text-mun-gray-500">{{ stats.recentDocuments }} recent</span>
                        </div>

                        <div class="space-y-1">
                            <div v-for="doc in recentDocuments" :key="doc.id"
                                class="flex items-center justify-between text-xs">
                                <div class="flex items-center space-x-2">
                                    <div :class="getDocumentTypeBg(doc.type)" class="w-2 h-2 rounded-full"></div>
                                    <span class="truncate max-w-20">{{ doc.title }}</span>
                                </div>
                                <span class="text-mun-gray-500">{{ doc.author }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Voting Results -->
                    <div class="voting-results">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-mun-gray-700">Recent Votes</span>
                            <span class="text-xs text-mun-gray-500">{{ stats.recentVotes }} today</span>
                        </div>

                        <div class="space-y-1">
                            <div v-for="vote in recentVoting" :key="vote.id"
                                class="flex items-center justify-between text-xs">
                                <div class="flex items-center space-x-2">
                                    <div :class="vote.passed ? 'bg-mun-green-500' : 'bg-mun-red-500'"
                                        class="w-2 h-2 rounded-full"></div>
                                    <span class="truncate max-w-20">{{ vote.title }}</span>
                                </div>
                                <span :class="vote.passed ? 'text-mun-green-600' : 'text-mun-red-600'"
                                    class="font-medium">
                                    {{ vote.passed ? 'PASSED' : 'FAILED' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Metrics -->
            <div class="performance-metrics mt-6 p-4 bg-mun-gray-50 rounded-lg">
                <h4 class="text-sm font-medium text-mun-gray-900 mb-3">Session Performance</h4>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Efficiency Score -->
                    <div class="efficiency-metric text-center">
                        <div class="flex items-center justify-center mb-2">
                            <div class="relative w-12 h-12">
                                <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                    <path class="text-mun-gray-300" stroke="currentColor" stroke-width="3" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path :class="getEfficiencyScoreColor()" stroke="currentColor" stroke-width="3"
                                        fill="none" stroke-linecap="round"
                                        :stroke-dasharray="`${stats.efficiencyScore}, 100`"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-xs font-bold" :class="getEfficiencyScoreColor()">
                                        {{ stats.efficiencyScore }}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="text-xs text-mun-gray-600">Efficiency</div>
                    </div>

                    <!-- Engagement Level -->
                    <div class="engagement-metric text-center">
                        <div class="text-lg font-bold" :class="getEngagementColor()">
                            {{ getEngagementLevel() }}
                        </div>
                        <div class="text-xs text-mun-gray-600">Engagement</div>
                        <div class="text-xs text-mun-gray-500">{{ stats.engagementScore }}/10</div>
                    </div>

                    <!-- Productivity Index -->
                    <div class="productivity-metric text-center">
                        <div class="text-lg font-bold text-un-blue">{{ stats.productivityIndex }}</div>
                        <div class="text-xs text-mun-gray-600">Productivity</div>
                        <div class="text-xs text-mun-gray-500">Actions/hour</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
    ChartBarIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
    ClockIcon,
    MicrophoneIcon,
    DocumentTextIcon,
    HandRaisedIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useSessionStore } from '@/stores/session'
import { useWebSocketStore } from '@/stores/websocket'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    sessionId: {
        type: String,
        required: true
    },
    autoRefresh: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits(['stats-updated'])

const sessionStore = useSessionStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const timeRange = ref('session')
const refreshInterval = ref(null)

// Default stats structure
const stats = ref({
    duration: 0,
    totalSpeakers: 0,
    totalSpeeches: 0,
    documentsSubmitted: 0,
    documentsApproved: 0,
    totalVotes: 0,
    passedVotes: 0,
    attendance: {
        present: 0,
        absent: 0,
        total: 0
    },
    totalSpeakingTime: 0,
    modeChanges: 0,
    recentDocuments: 0,
    recentVotes: 0,
    efficiencyScore: 0,
    engagementScore: 0,
    productivityIndex: 0,
    speakingTimeByCountry: [],
    recentModeChanges: [],
    recentDocumentsList: [],
    recentVotingList: []
})

// Computed
const topSpeakers = computed(() => {
    return stats.value.speakingTimeByCountry
        .slice(0, 5)
        .sort((a, b) => b.time - a.time)
})

const recentModes = computed(() => {
    return stats.value.recentModeChanges.slice(0, 5)
})

const recentDocuments = computed(() => {
    return stats.value.recentDocumentsList.slice(0, 3)
})

const recentVoting = computed(() => {
    return stats.value.recentVotingList.slice(0, 3)
})

// Methods
const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0m'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

const formatTime = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Unknown'
    }
}

const getSessionStatus = () => {
    if (stats.value.duration === 0) return 'Not started'
    if (sessionStore.currentSession?.status === 'active') return 'Active'
    if (sessionStore.currentSession?.status === 'paused') return 'Paused'
    return 'Completed'
}

const getAttendancePercentage = () => {
    if (stats.value.attendance.total === 0) return 0
    return Math.round((stats.value.attendance.present / stats.value.attendance.total) * 100)
}

const getModeIconBg = (mode) => {
    const colors = {
        formal: 'bg-un-blue',
        moderated: 'bg-mun-green-500',
        unmoderated: 'bg-mun-yellow-500',
        voting: 'bg-mun-red-500',
        closed: 'bg-mun-gray-500'
    }
    return colors[mode] || 'bg-mun-gray-400'
}

const getModeDisplayName = (mode) => {
    const names = {
        formal: 'Formal',
        moderated: 'Moderated',
        unmoderated: 'Unmoderated',
        voting: 'Voting',
        closed: 'Closed'
    }
    return names[mode] || mode
}

const getDocumentTypeBg = (type) => {
    const colors = {
        position_paper: 'bg-un-blue',
        resolution: 'bg-mun-green-500',
        amendment: 'bg-mun-yellow-500',
        public: 'bg-purple-500'
    }
    return colors[type] || 'bg-mun-gray-400'
}

const getEfficiencyScoreColor = () => {
    const score = stats.value.efficiencyScore
    if (score >= 80) return 'text-mun-green-600'
    if (score >= 60) return 'text-mun-yellow-600'
    return 'text-mun-red-600'
}

const getEngagementLevel = () => {
    const score = stats.value.engagementScore
    if (score >= 8) return 'HIGH'
    if (score >= 6) return 'MEDIUM'
    if (score >= 4) return 'LOW'
    return 'VERY LOW'
}

const getEngagementColor = () => {
    const score = stats.value.engagementScore
    if (score >= 8) return 'text-mun-green-600'
    if (score >= 6) return 'text-mun-yellow-600'
    if (score >= 4) return 'text-mun-red-600'
    return 'text-mun-red-700'
}

const refreshStats = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.statistics.getSessionStats(props.sessionId, {
            timeRange: timeRange.value
        })

        if (response.data.success) {
            stats.value = { ...stats.value, ...response.data.statistics }
            emit('stats-updated', stats.value)
        }

    } catch (error) {
        console.error('Failed to load session statistics:', error)
        toast.error('Failed to load statistics')
    } finally {
        isLoading.value = false
    }
}

const exportStats = async () => {
    try {
        const response = await apiMethods.statistics.exportSessionStats(props.sessionId, {
            timeRange: timeRange.value,
            format: 'pdf'
        })

        // Create download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `session-stats-${props.sessionId}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)

        toast.success('Statistics exported successfully')

    } catch (error) {
        console.error('Export statistics error:', error)
        toast.error('Failed to export statistics')
    }
}

const setupAutoRefresh = () => {
    if (props.autoRefresh && !refreshInterval.value) {
        refreshInterval.value = setInterval(refreshStats, 30000) // Refresh every 30 seconds
    }
}

const clearAutoRefresh = () => {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
    }
}

// WebSocket listeners
const handleStatsUpdate = (data) => {
    // Update stats when received via WebSocket
    stats.value = { ...stats.value, ...data }
    emit('stats-updated', stats.value)
}

// Lifecycle
onMounted(async () => {
    await refreshStats()
    setupAutoRefresh()

    // Listen for real-time stats updates
    if (wsStore.isConnected) {
        wsStore.on('session-stats-updated', handleStatsUpdate)
    }
})

onUnmounted(() => {
    clearAutoRefresh()

    if (wsStore.isConnected) {
        wsStore.off('session-stats-updated', handleStatsUpdate)
    }
})

// Watch for time range changes
watch(timeRange, () => {
    refreshStats()
})

// Watch for WebSocket connection changes
watch(() => wsStore.isConnected, (connected) => {
    if (connected) {
        wsStore.on('session-stats-updated', handleStatsUpdate)
    } else {
        wsStore.off('session-stats-updated', handleStatsUpdate)
    }
})
</script>

<style scoped>
.stats-grid {
    min-height: 400px;
}

.stat-card {
    transition: all 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.attendance-bar {
    background: linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 100%);
}

.timeline-container {
    border-left: 2px solid #e5e7eb;
    padding-left: 0.75rem;
}

.timeline-item {
    position: relative;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: -0.875rem;
    top: 0.125rem;
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background: #9ca3af;
}

/* Circular progress */
.efficiency-metric svg {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* Custom scrollbar */
.timeline-container::-webkit-scrollbar {
    width: 2px;
}

.timeline-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 1px;
}

.timeline-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 1px;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .grid.md\\:grid-cols-4 {
        grid-template-columns: 1fr 1fr;
    }

    .grid.md\\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .grid.md\\:grid-cols-3 {
        grid-template-columns: 1fr;
    }

    .stat-card {
        padding: 0.75rem;
    }

    .performance-metrics {
        padding: 1rem;
    }
}

/* Animation for stat updates */
.stat-card .text-lg {
    transition: all 0.3s ease;
}

.stat-card:hover .text-lg {
    transform: scale(1.05);
}

/* Progress bar animations */
.attendance-bar>div,
.timeline-container .w-16>div {
    transition: width 0.5s ease;
}

/* Loading shimmer effect */
@keyframes shimmer {
    0% {
        background-position: -468px 0;
    }

    100% {
        background-position: 468px 0;
    }
}

.loading-shimmer {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 400% 100%;
    animation: shimmer 1.5s infinite;
}
</style>