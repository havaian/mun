<template>
    <div class="p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-mun-blue"></div>
        </div>

        <!-- Main Content -->
        <template v-else>
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-mun-gray-900">Presidium Dashboard</h1>
                    <p class="text-mun-gray-600">{{ userCommittee?.name || 'Loading...' }}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="px-3 py-1 text-sm font-medium rounded-lg bg-mun-blue/10 text-mun-blue">
                        {{ authStore.user?.presidiumRole || 'Presidium Member' }}
                    </span>
                    <button @click="loadDashboardData" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <ArrowPathIcon class="w-5 h-5 text-mun-gray-600" />
                    </button>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Present Count -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-blue/10">
                            <UsersIcon class="w-6 h-6 text-mun-blue" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Present</p>
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stats.presentCount }}</p>
                            <p class="text-xs text-mun-gray-500">of {{ stats.totalCountries }} countries</p>
                        </div>
                    </div>
                </div>

                <!-- Quorum Status -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div :class="[
                            'p-3 rounded-lg',
                            stats.hasQuorum ? 'bg-mun-green-500/10' : 'bg-mun-red-500/10'
                        ]">
                            <CheckCircleIcon :class="[
                                'w-6 h-6',
                                stats.hasQuorum ? 'text-mun-green-500' : 'text-mun-red-500'
                            ]" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Quorum</p>
                            <p class="text-2xl font-bold text-mun-gray-900">
                                {{ stats.hasQuorum ? 'Yes' : 'No' }}
                            </p>
                            <p class="text-xs text-mun-gray-500">{{ stats.quorumCount }} needed</p>
                        </div>
                    </div>
                </div>

                <!-- Pending Documents -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                            <DocumentTextIcon class="w-6 h-6 text-mun-yellow-600" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Pending Review</p>
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pendingDocuments }}</p>
                            <p class="text-xs text-mun-gray-500">documents</p>
                        </div>
                    </div>
                </div>

                <!-- Active Votings -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-purple-500/10">
                            <HandRaisedIcon class="w-6 h-6 text-mun-purple-600" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Active Votes</p>
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stats.activeVotings }}</p>
                            <p class="text-xs text-mun-gray-500">in progress</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Current Session -->
            <div class="mun-card p-6">
                <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Current Session</h2>

                <div v-if="currentSession" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-mun-gray-900">
                                Session {{ currentSession.sessionNumber || 1 }}
                            </p>
                            <p class="text-sm text-mun-gray-600">{{ formatSessionMode(currentSession.mode) }}</p>
                        </div>
                        <span :class="[
                            'px-3 py-1 text-sm font-medium rounded-lg',
                            currentSession.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                currentSession.status === 'paused' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                    'bg-mun-gray-100 text-mun-gray-700'
                        ]">
                            {{ currentSession.status?.charAt(0).toUpperCase() + currentSession.status?.slice(1) }}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-mun-gray-100">
                        <RouterLink to="/presidium/sessions" class="btn-un-primary text-center">
                            Manage Session
                        </RouterLink>
                        <RouterLink to="/presidium/attendance" class="btn-un-secondary text-center">
                            Take Attendance
                        </RouterLink>
                        <RouterLink to="/presidium/voting" class="btn-un-secondary text-center">
                            Start Voting
                        </RouterLink>
                    </div>
                </div>

                <div v-else class="text-center py-8">
                    <ClockIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                    <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Active Session</h3>
                    <p class="mt-2 text-mun-gray-600">Start a new session to begin committee work</p>
                    <RouterLink to="/presidium/sessions" class="mt-4 btn-un-primary inline-block">
                        Start Session
                    </RouterLink>
                </div>
            </div>

            <!-- Quick Actions Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Recent Documents -->
                <div class="mun-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-mun-gray-900">Recent Documents</h3>
                        <RouterLink to="/presidium/documents"
                            class="text-mun-blue hover:text-mun-blue-600 text-sm font-medium">
                            View All
                        </RouterLink>
                    </div>

                    <div v-if="recentDocuments.length > 0" class="space-y-3">
                        <div v-for="doc in recentDocuments" :key="doc.id"
                            class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg hover:bg-mun-gray-100 transition-colors cursor-pointer"
                            @click="$router.push(`/presidium/documents`)">
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-mun-gray-900 truncate">{{ doc.title }}</p>
                                <p class="text-sm text-mun-gray-600">{{ doc.country }}</p>
                            </div>
                            <span :class="[
                                'px-2 py-1 rounded text-xs font-medium ml-3 flex-shrink-0',
                                doc.status === 'pending' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                    doc.status === 'approved' ? 'bg-mun-green-100 text-mun-green-700' :
                                        'bg-mun-red-100 text-mun-red-700'
                            ]">
                                {{ doc.status }}
                            </span>
                        </div>
                    </div>

                    <div v-else class="text-center py-8">
                        <DocumentTextIcon class="mx-auto h-10 w-10 text-mun-gray-300" />
                        <p class="mt-2 text-sm text-mun-gray-500">No recent documents</p>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="mun-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-mun-gray-900">Recent Activity</h3>
                    </div>

                    <div v-if="recentActivity.length > 0" class="space-y-3">
                        <div v-for="activity in recentActivity" :key="activity.id"
                            class="flex items-start space-x-3 p-3 bg-mun-gray-50 rounded-lg">
                            <div class="p-1.5 rounded-lg bg-mun-blue/10 flex-shrink-0">
                                <ClockIcon class="w-4 h-4 text-mun-blue" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm text-mun-gray-900">{{ activity.description }}</p>
                                <p class="text-xs text-mun-gray-500 mt-1">{{ formatTime(activity.timestamp) }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8">
                        <ClockIcon class="mx-auto h-10 w-10 text-mun-gray-300" />
                        <p class="mt-2 text-sm text-mun-gray-500">No recent activity</p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    UsersIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    ArrowPathIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const userCommittee = ref(null)
const currentSession = ref(null)

const stats = reactive({
    presentCount: 0,
    totalCountries: 0,
    hasQuorum: false,
    quorumCount: 0,
    pendingDocuments: 0,
    activeVotings: 0
})

const recentDocuments = ref([])
const recentActivity = ref([])

// Computed
const committeeId = computed(() => authStore.user?.committeeId?._id)

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true

        // Get committee ID from auth store
        const committeeId = authStore.user?.committeeId?._id

        if (!committeeId) {
            toast.error('No committee assigned to your account')
            return
        }

        // Load committee info
        const committeeResponse = await apiMethods.committees.getById(committeeId)
        if (committeeResponse.data.success) {
            userCommittee.value = committeeResponse.data.committee
            stats.totalCountries = committeeResponse.data.committee.countries?.length || 0
        }

        // Load current session
        try {
            const sessionsResponse = await apiMethods.sessions.getAll(committeeId, {
                status: 'active',
                limit: 1
            })
            if (sessionsResponse.data.success && sessionsResponse.data.sessions?.length > 0) {
                currentSession.value = sessionsResponse.data.sessions[0]

                // Load attendance for current session
                try {
                    const attendanceResponse = await apiMethods.sessions.getAttendance(currentSession.value._id)
                    if (attendanceResponse.data.success) {
                        const attendance = attendanceResponse.data.attendance || []
                        stats.presentCount = attendance.filter(a =>
                            a.status === 'present_voting' || a.status === 'present'
                        ).length

                        const votingCount = attendance.filter(a => a.status === 'present_voting').length
                        stats.quorumCount = Math.floor(stats.totalCountries / 2) + 1
                        stats.hasQuorum = votingCount >= stats.quorumCount
                    }
                } catch (err) {
                    console.warn('Could not load attendance:', err)
                }
            }
        } catch (err) {
            console.warn('No active session found')
            currentSession.value = null
        }

        // Load pending documents count
        try {
            const docsResponse = await apiMethods.documents.getByCommitteeId(committeeId)
            if (docsResponse.data.success) {
                stats.pendingDocuments = docsResponse.data.total || docsResponse.data.documents?.length || 0
                recentDocuments.value = docsResponse.data.documents?.slice(0, 3) || []
            }
        } catch (err) {
            console.warn('Could not load documents:', err)
        }

        // Load active votings count
        try {
            const votingsResponse = await apiMethods.voting.loadCommitteeVotingDetails(committeeId)
            if (votingsResponse.data.success) {
                stats.activeVotings = votingsResponse.data.votings?.length || 0
            }
        } catch (err) {
            console.warn('Could not load votings:', err)
        }

        // Mock recent activity (to be replaced with real API later)
        recentActivity.value = [
            {
                id: 1,
                description: currentSession.value ? 'Session started' : 'No active session',
                timestamp: new Date().toISOString()
            }
        ]

    } catch (error) {
        console.error('Dashboard load error:', error)
        toast.error('Failed to load dashboard data')
    } finally {
        isLoading.value = false
    }
}

const formatSessionMode = (mode) => {
    const modeMap = {
        'formal': 'Formal Debate',
        'moderated': 'Moderated Caucus',
        'unmoderated': 'Unmoderated Caucus',
        'informal': 'Informal Consultation',
        'closed': 'Closed Session'
    }
    return modeMap[mode] || mode || 'Unknown'
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

// Lifecycle
onMounted(async () => {
    await loadDashboardData()

    // Connect WebSocket if not connected
    if (!wsStore.isConnected) {
        try {
            await wsStore.connect()
        } catch (error) {
            console.error('Failed to connect WebSocket:', error)
        }
    }

    // Join committee room
    if (committeeId.value && wsStore.isConnected) {
        wsStore.joinCommittee(committeeId.value)
    }

    // Join session room if there's an active session
    if (currentSession.value?._id && wsStore.isConnected) {
        wsStore.joinSession(currentSession.value._id)
    }
})

onUnmounted(() => {
    // Leave rooms on unmount
    if (committeeId.value) {
        wsStore.leaveCommittee(committeeId.value)
    }
    if (currentSession.value?._id) {
        wsStore.leaveSession(currentSession.value._id)
    }
})

console.log(currentSession);

// Watch for real-time updates
watch(() => wsStore.sessionUpdates[currentSession.value?._id], (update) => {
    if (update && currentSession.value) {
        // Update current session with real-time data
        currentSession.value.mode = update.newMode || update.mode
        currentSession.value.status = update.status
    }
}, { deep: true })

// Watch for attendance updates
watch(() => {
    const sessionId = currentSession.value?._id
    return sessionId ? wsStore.attendanceUpdates[sessionId] : null
}, (update) => {
    if (update) {
        // Update attendance stats from WebSocket
        if (update.presentCount !== undefined) {
            stats.presentCount = update.presentCount
        }
        if (update.quorumStatus) {
            stats.hasQuorum = update.quorumStatus.hasQuorum
            stats.quorumCount = update.quorumStatus.required
        }
    }
}, { deep: true })

console.log(wsStore.votingUpdates)

// Watch for voting updates
watch(() => Object.values(wsStore.votingUpdates), (votings) => {
    stats.activeVotings = votings.filter(v => v.status === 'active').length
}, { deep: true })
</script>