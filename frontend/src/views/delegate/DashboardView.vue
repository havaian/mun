<template>
    <div class="p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-mun-blue"></div>
        </div>

        <!-- Main Content -->
        <template v-else>
            <!-- Header with Country Info -->
            <div class="mun-card p-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <!-- Flag -->
                        <div v-if="delegateCountry?.flagUrl"
                            class="w-20 h-14 rounded-lg overflow-hidden border-2 border-mun-gray-200 shadow-sm">
                            <img :src="delegateCountry.flagUrl" :alt="delegateCountry.name"
                                class="w-full h-full object-cover" />
                        </div>

                        <!-- Country Info -->
                        <div>
                            <h1 class="text-2xl font-bold text-mun-gray-900">{{ delegateCountry?.name || 'Delegate' }}
                            </h1>
                            <p class="text-mun-gray-600">{{ committee?.name || 'Loading...' }}</p>
                            <div class="flex items-center space-x-2 mt-1">
                                <span v-if="delegateCountry?.isObserver"
                                    class="px-2 py-0.5 text-xs font-medium rounded bg-mun-yellow-100 text-mun-yellow-700">
                                    Observer
                                </span>
                                <span v-if="delegateCountry?.specialRole"
                                    class="px-2 py-0.5 text-xs font-medium rounded bg-mun-purple-100 text-mun-purple-700">
                                    {{ delegateCountry.specialRole }}
                                </span>
                                <span v-if="delegateCountry?.hasVetoRight"
                                    class="px-2 py-0.5 text-xs font-medium rounded bg-mun-red-100 text-mun-red-700">
                                    Veto Power
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Status -->
                    <div class="text-right">
                        <p class="text-sm text-mun-gray-600 mb-2">Your Status</p>
                        <span :class="getAttendanceStatusClass(attendanceStatus)">
                            {{ getAttendanceStatusLabel(attendanceStatus) }}
                        </span>
                        <p v-if="attendanceStatus === 'absent'" class="text-xs text-mun-red-600 mt-1">
                            ⚠️ Mark attendance when roll call starts
                        </p>
                    </div>
                </div>
            </div>

            <!-- Current Session Info -->
            <div class="mun-card p-6">
                <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Current Session</h2>

                <div v-if="currentSession">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <p class="text-sm text-mun-gray-600">Session Number</p>
                            <p class="text-lg font-semibold text-mun-gray-900">{{ currentSession.sessionNumber || 1 }}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-mun-gray-600">Debate Mode</p>
                            <p class="text-lg font-semibold text-mun-gray-900">{{ formatMode(currentSession.mode) }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-mun-gray-600">Status</p>
                            <span :class="getSessionStatusClass(currentSession.status)">
                                {{ currentSession.status }}
                            </span>
                        </div>
                        <div>
                            <p class="text-sm text-mun-gray-600">Duration</p>
                            <p class="text-lg font-semibold text-mun-gray-900">{{
                                formatDuration(currentSession.startedAt) }}</p>
                        </div>
                    </div>

                    <!-- Quorum Status -->
                    <div v-if="quorumInfo" class="p-3 rounded-lg border"
                        :class="quorumInfo.hasQuorum ? 'bg-mun-green-50 border-mun-green-200' : 'bg-mun-red-50 border-mun-red-200'">
                        <div class="flex items-center space-x-2">
                            <CheckCircleIcon v-if="quorumInfo.hasQuorum" class="w-5 h-5 text-mun-green-600" />
                            <XCircleIcon v-else class="w-5 h-5 text-mun-red-600" />
                            <span :class="quorumInfo.hasQuorum ? 'text-mun-green-700' : 'text-mun-red-700'"
                                class="text-sm font-medium">
                                {{ quorumInfo.hasQuorum ? 'Quorum achieved' : 'No quorum' }}
                            </span>
                            <span class="text-sm text-mun-gray-600">
                                ({{ quorumInfo.present }} / {{ quorumInfo.required }} voting)
                            </span>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-8">
                    <ClockIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                    <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Active Session</h3>
                    <p class="mt-2 text-mun-gray-600">Wait for the presidium to start a session</p>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Speeches -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-blue/10">
                            <MicrophoneIcon class="w-6 h-6 text-mun-blue" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Speeches</p>
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stats.speechesGiven }}</p>
                        </div>
                    </div>
                </div>

                <!-- Votes Cast -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-green-500/10">
                            <HandRaisedIcon class="w-6 h-6 text-mun-green-600" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Votes Cast</p>
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stats.votesCast }}</p>
                        </div>
                    </div>
                </div>

                <!-- Documents -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                            <DocumentTextIcon class="w-6 h-6 text-mun-yellow-600" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Documents</p>
                            <p class="text-2xl font-bold text-mun-gray-900">{{ stats.documentsSubmitted }}</p>
                        </div>
                    </div>
                </div>

                <!-- Coalition Status -->
                <div class="mun-card p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-lg bg-mun-purple-500/10">
                            <UserGroupIcon class="w-6 h-6 text-mun-purple-600" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-mun-gray-600">Coalition</p>
                            <p class="text-lg font-bold text-mun-gray-900">
                                {{ userCoalition ? 'Member' : 'None' }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Active Voting -->
                <div class="mun-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-mun-gray-900">Active Voting</h3>
                        <RouterLink to="/delegate/voting"
                            class="text-mun-blue hover:text-mun-blue-600 text-sm font-medium">
                            View All
                        </RouterLink>
                    </div>

                    <div v-if="activeVotings.length > 0" class="space-y-3">
                        <div v-for="voting in activeVotings" :key="voting._id"
                            class="p-4 bg-mun-blue/5 border border-mun-blue/20 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-mun-gray-900">{{ voting.title }}</h4>
                                <span class="flex h-2 w-2">
                                    <span
                                        class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-mun-blue opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-mun-blue"></span>
                                </span>
                            </div>
                            <p class="text-sm text-mun-gray-600 mb-3">{{ voting.description }}</p>
                            <RouterLink :to="`/delegate/voting`" class="btn-un-primary text-sm w-full text-center">
                                Cast Your Vote
                            </RouterLink>
                        </div>
                    </div>

                    <div v-else class="text-center py-8">
                        <HandRaisedIcon class="mx-auto h-10 w-10 text-mun-gray-300" />
                        <p class="mt-2 text-sm text-mun-gray-500">No active voting sessions</p>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="mun-card p-6">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Recent Activity</h3>

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

            <!-- Quick Action Buttons -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RouterLink to="/delegate/documents" class="btn-un-primary text-center">
                    <DocumentTextIcon class="w-5 h-5 mr-2 inline" />
                    Submit Position Paper
                </RouterLink>
                <RouterLink to="/delegate/coalitions" class="btn-un-secondary text-center">
                    <UserGroupIcon class="w-5 h-5 mr-2 inline" />
                    {{ userCoalition ? 'View Coalition' : 'Join Coalition' }}
                </RouterLink>
                <RouterLink to="/delegate/voting" class="btn-un-secondary text-center">
                    <HandRaisedIcon class="w-5 h-5 mr-2 inline" />
                    View Voting
                </RouterLink>
            </div>
        </template>

        <!-- Attendance Modal -->
        <AttendanceModal v-model="showAttendanceModal"
            :session-id="wsStore.activeAttendanceSessionId || currentSession?._id" :country="delegateCountry"
            @attendance-submitted="handleAttendanceSubmitted" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import AttendanceModal from '@/components/delegate/AttendanceModal.vue'

// Icons
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MicrophoneIcon,
    HandRaisedIcon,
    DocumentTextIcon,
    UserGroupIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const showAttendanceModal = ref(false)
const committee = ref(null)
const delegateCountry = ref(null)
const currentSession = ref(null)
const attendanceStatus = ref('absent')
const quorumInfo = ref(null)
const userCoalition = ref(null)
const activeVotings = ref([])
const recentActivity = ref([])

const stats = ref({
    speechesGiven: 0,
    votesCast: 0,
    documentsSubmitted: 0
})

// Computed
const committeeId = computed(() => authStore.user?.committeeId)
const countryName = computed(() => authStore.user?.countryName)

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true

        // Load committee info
        const committeeResponse = await apiMethods.committees.getById(committeeId.value)
        if (committeeResponse.data.success) {
            committee.value = committeeResponse.data.committee

            // Find delegate's country
            delegateCountry.value = committee.value.countries?.find(
                c => c.name === countryName.value
            )
        }

        // Load current session
        try {
            const sessionsResponse = await apiMethods.sessions.getAll(committeeId.value, {
                status: 'active',
                limit: 1
            })

            if (sessionsResponse.data.success && sessionsResponse.data.sessions?.length > 0) {
                currentSession.value = sessionsResponse.data.sessions[0]

                // Load attendance for current session
                try {
                    const attendanceResponse = await apiMethods.sessions.getAttendance(currentSession.value._id)

                    if (attendanceResponse.data.success && attendanceResponse.data.attendance) {
                        const myAttendance = attendanceResponse.data.attendance.find(
                            a => a.country === countryName.value
                        )
                        attendanceStatus.value = myAttendance?.status || 'absent'

                        // Calculate quorum info
                        const votingCount = attendanceResponse.data.attendance.filter(
                            a => a.status === 'present_voting'
                        ).length
                        const totalVoting = committee.value.countries?.filter(
                            c => !c.isObserver && !c.specialRole
                        ).length || 0
                        const required = Math.floor(totalVoting / 2) + 1

                        quorumInfo.value = {
                            present: votingCount,
                            required: required,
                            hasQuorum: votingCount >= required
                        }
                    }
                } catch (err) {
                    console.warn('No attendance data yet:', err)
                }
            }
        } catch (err) {
            console.warn('No active session:', err)
        }

        // Load active votings
        try {
            const votingsResponse = await apiMethods.voting.getAll({
                committeeId: committeeId.value,
                status: 'active'
            })
            if (votingsResponse.data.success) {
                activeVotings.value = votingsResponse.data.votings || []
            }
        } catch (err) {
            console.warn('Could not load votings:', err)
        }

        // Load coalitions
        try {
            const coalitionsResponse = await apiMethods.resolutions.getCoalitions(committeeId.value)
            if (coalitionsResponse.data.success) {
                userCoalition.value = coalitionsResponse.data.coalitions?.find(
                    c => c.head === countryName.value || c.members?.includes(countryName.value)
                )
            }
        } catch (err) {
            console.warn('Could not load coalitions:', err)
        }

        // Mock activity
        recentActivity.value = [
            {
                id: 1,
                description: currentSession.value ? 'Session started' : 'Waiting for session',
                timestamp: new Date().toISOString()
            }
        ]

        // Mock stats (to be replaced with real API)
        stats.value = {
            speechesGiven: 0,
            votesCast: 0,
            documentsSubmitted: 0
        }

    } catch (error) {
        console.error('Dashboard load error:', error)
        toast.error('Failed to load dashboard data')
    } finally {
        isLoading.value = false
    }
}

// Formatting helpers
const formatMode = (mode) => {
    const modeMap = {
        'formal': 'Formal Debate',
        'moderated': 'Moderated Caucus',
        'unmoderated': 'Unmoderated Caucus',
        'informal': 'Informal Consultation',
        'closed': 'Closed Session'
    }
    return modeMap[mode] || mode || 'Unknown'
}

const formatDuration = (startDate) => {
    if (!startDate) return '0m'

    try {
        const start = new Date(startDate)
        const now = new Date()
        const diffMs = now - start
        const diffMins = Math.floor(diffMs / 60000)
        const hours = Math.floor(diffMins / 60)
        const minutes = diffMins % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    } catch {
        return '0m'
    }
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

const getAttendanceStatusClass = (status) => {
    const classes = {
        'present_voting': 'px-3 py-1 text-sm font-medium rounded-lg bg-mun-green-100 text-mun-green-700',
        'present': 'px-3 py-1 text-sm font-medium rounded-lg bg-mun-yellow-100 text-mun-yellow-700',
        'absent': 'px-3 py-1 text-sm font-medium rounded-lg bg-mun-red-100 text-mun-red-700'
    }
    return classes[status] || classes.absent
}

const getAttendanceStatusLabel = (status) => {
    const labels = {
        'present_voting': 'Present & Voting',
        'present': 'Present',
        'absent': 'Absent'
    }
    return labels[status] || 'Absent'
}

const getSessionStatusClass = (status) => {
    const classes = {
        'active': 'px-2 py-1 text-sm font-medium rounded-lg bg-mun-green-100 text-mun-green-700',
        'paused': 'px-2 py-1 text-sm font-medium rounded-lg bg-mun-yellow-100 text-mun-yellow-700',
        'completed': 'px-2 py-1 text-sm font-medium rounded-lg bg-mun-gray-100 text-mun-gray-700'
    }
    return classes[status] || classes.completed
}

const handleAttendanceSubmitted = (status) => {
    attendanceStatus.value = status
    showAttendanceModal.value = false
    wsStore.clearAttendanceState()

    // Reload dashboard to get updated data
    loadDashboardData()
}

// Lifecycle
onMounted(() => {
    loadDashboardData()

    // Connect WebSocket if not connected
    if (!wsStore.isConnected && !wsStore.isConnecting) {
        wsStore.connect()
    }

    // Join committee room
    if (committeeId.value) {
        wsStore.joinCommittee(committeeId.value)
    }
})

onUnmounted(() => {
    // Leave committee room on unmount
    if (committeeId.value) {
        wsStore.leaveCommittee(committeeId.value)
    }
})

// Watch for attendance activation
watch(() => wsStore.isAttendanceActive, (isActive) => {
    if (isActive && wsStore.activeAttendanceSessionId.value) {
        // Check if we're not already marked present
        if (attendanceStatus.value === 'absent') {
            showAttendanceModal.value = true
        }
    }
})

// Watch for session changes from WebSocket
watch(() => wsStore.currentSessionMode, (newMode) => {
    if (newMode && currentSession.value) {
        currentSession.value.mode = newMode
    }
})

// Watch for quorum changes
watch(() => wsStore.quorumStatus, (status) => {
    if (status) {
        quorumInfo.value = status
    }
})
</script>