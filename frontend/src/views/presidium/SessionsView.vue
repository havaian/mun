<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Session Management</h1>
                <p class="text-mun-gray-600">{{ committee?.name || 'Loading...' }}</p>
            </div>
            <button @click="showCreateModal = true" class="btn-un-primary">
                <PlusIcon class="w-5 h-5 mr-2" />
                Create New Session
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-mun-blue"></div>
        </div>

        <!-- Sessions List -->
        <div v-else class="space-y-4">
            <!-- Active Session (if exists) -->
            <div v-if="activeSession" class="mun-card p-6 border-l-4 border-mun-green-500">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="flex h-3 w-3 relative">
                            <span
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-mun-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-mun-green-500"></span>
                        </span>
                        <h3 class="text-lg font-semibold text-mun-gray-900">Active Session</h3>
                    </div>
                    <span class="px-3 py-1 text-sm font-medium rounded-lg bg-mun-green-100 text-mun-green-700">
                        LIVE
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <p class="text-sm text-mun-gray-600">Session Number</p>
                        <p class="text-lg font-semibold text-mun-gray-900">{{ activeSession.sessionNumber || 1 }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-mun-gray-600">Current Mode</p>
                        <p class="text-lg font-semibold text-mun-gray-900">{{ formatMode(activeSession.mode) }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-mun-gray-600">Duration</p>
                        <p class="text-lg font-semibold text-mun-gray-900">{{ formatDuration(activeSession.startedAt) }}
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-mun-gray-100">
                    <button @click="pauseSession(activeSession._id)" v-if="activeSession.status === 'active'"
                        class="btn-un-secondary">
                        <PauseIcon class="w-4 h-4 mr-2" />
                        Pause Session
                    </button>
                    <button @click="resumeSession(activeSession._id)" v-else class="btn-un-primary">
                        <PlayIcon class="w-4 h-4 mr-2" />
                        Resume Session
                    </button>

                    <button @click="changeModeModal = true" class="btn-un-secondary">
                        <ArrowPathIcon class="w-4 h-4 mr-2" />
                        Change Mode
                    </button>

                    <RouterLink :to="`/presidium/attendance`" class="btn-un-secondary text-center">
                        <ClipboardDocumentListIcon class="w-4 h-4 mr-2" />
                        Take Attendance
                    </RouterLink>

                    <button @click="endSession(activeSession._id)" class="btn-un-danger">
                        <StopIcon class="w-4 h-4 mr-2" />
                        End Session
                    </button>
                </div>
            </div>

            <!-- All Sessions List -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">All Sessions</h3>

                <div v-if="sessions.length > 0" class="space-y-3">
                    <div v-for="session in sessions" :key="session._id"
                        class="p-4 border border-mun-gray-200 rounded-lg hover:border-mun-blue transition-colors">
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h4 class="font-semibold text-mun-gray-900">
                                        Session {{ session.sessionNumber || 1 }}
                                    </h4>
                                    <span :class="getStatusClass(session.status)">
                                        {{ session.status }}
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                        <span class="text-mun-gray-600">Mode:</span>
                                        <span class="ml-1 text-mun-gray-900">{{ formatMode(session.mode) }}</span>
                                    </div>
                                    <div>
                                        <span class="text-mun-gray-600">Started:</span>
                                        <span class="ml-1 text-mun-gray-900">{{ formatDate(session.startedAt) }}</span>
                                    </div>
                                    <div v-if="session.endedAt">
                                        <span class="text-mun-gray-600">Ended:</span>
                                        <span class="ml-1 text-mun-gray-900">{{ formatDate(session.endedAt) }}</span>
                                    </div>
                                    <div>
                                        <span class="text-mun-gray-600">Duration:</span>
                                        <span class="ml-1 text-mun-gray-900">{{ formatDuration(session.startedAt,
                                            session.endedAt) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4">
                                <button v-if="session.status === 'draft'" @click="startSession(session._id)"
                                    class="p-2 rounded-lg bg-mun-green-500 text-white hover:bg-mun-green-600 transition-colors">
                                    <PlayIcon class="w-5 h-5" />
                                </button>
                                <button @click="viewSessionDetails(session)"
                                    class="p-2 rounded-lg bg-mun-blue/10 text-mun-blue hover:bg-mun-blue/20 transition-colors">
                                    <EyeIcon class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-12">
                    <CalendarDaysIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                    <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No sessions yet</h3>
                    <p class="mt-2 text-mun-gray-600">Create your first session to begin committee work</p>
                    <button @click="showCreateModal = true" class="mt-4 btn-un-primary">
                        Create Session
                    </button>
                </div>
            </div>
        </div>

        <!-- Create Session Modal -->
        <SessionCreateModal v-model="showCreateModal" :committee-id="committeeId"
            @session-created="handleSessionCreated" />

        <!-- Change Mode Modal -->
        <ChangeModeModal v-model="changeModeModal" :session="activeSession" @mode-changed="handleModeChanged" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    PlusIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    EyeIcon
} from '@heroicons/vue/24/outline'

// Components
import SessionCreateModal from '@/components/presidium/SessionCreateModal.vue'
import ChangeModeModal from '@/components/presidium/ChangeModeModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const committee = ref(null)
const sessions = ref([])
const showCreateModal = ref(false)
const changeModeModal = ref(false)

const committeeId = computed(() => authStore.user?.committeeId?._id)
const activeSession = computed(() => sessions.value.find(s => s.status === 'active' || s.status === 'paused'))

// Methods
const loadSessions = async () => {
    try {
        isLoading.value = true

        // Load committee info
        const committeeResponse = await apiMethods.committees.getById(committeeId.value)
        if (committeeResponse.data.success) {
            committee.value = committeeResponse.data.committee
        }

        // Load sessions
        const sessionsResponse = await apiMethods.sessions.getAll(committeeId.value)
        if (sessionsResponse.data.success) {
            sessions.value = sessionsResponse.data.sessions || []
        }

    } catch (error) {
        console.error('Load sessions error:', error)
        toast.error('Failed to load sessions')
    } finally {
        isLoading.value = false
    }
}

const startSession = async (sessionId) => {
    try {
        const response = await apiMethods.sessions.updateStatus(sessionId, { status: 'active' })

        if (response.data.success) {
            toast.success('Session started successfully')
            await loadSessions()
        }
    } catch (error) {
        console.error('Start session error:', error)
        toast.error('Failed to start session')
    }
}

const pauseSession = async (sessionId) => {
    try {
        const response = await apiMethods.sessions.updateStatus(sessionId, { status: 'paused' })

        if (response.data.success) {
            toast.success('Session paused')
            await loadSessions()
        }
    } catch (error) {
        console.error('Pause session error:', error)
        toast.error('Failed to pause session')
    }
}

const resumeSession = async (sessionId) => {
    try {
        const response = await apiMethods.sessions.updateStatus(sessionId, { status: 'active' })

        if (response.data.success) {
            toast.success('Session resumed')
            await loadSessions()
        }
    } catch (error) {
        console.error('Resume session error:', error)
        toast.error('Failed to resume session')
    }
}

const endSession = async (sessionId) => {
    if (!confirm('Are you sure you want to end this session? This action cannot be undone.')) {
        return
    }

    try {
        const response = await apiMethods.sessions.updateStatus(sessionId, { status: 'completed' })

        if (response.data.success) {
            toast.success('Session ended successfully')
            await loadSessions()
        }
    } catch (error) {
        console.error('End session error:', error)
        toast.error('Failed to end session')
    }
}

const handleSessionCreated = () => {
    showCreateModal.value = false
    loadSessions()
    toast.success('Session created successfully')
}

const handleModeChanged = () => {
    changeModeModal.value = false
    loadSessions()
    toast.success('Session mode changed successfully')
}

const viewSessionDetails = (session) => {
    // TODO: Implement session details view
    console.log('View session details:', session)
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

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Invalid date'
    }
}

const formatDuration = (startDate, endDate = null) => {
    if (!startDate) return '0m'

    try {
        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : new Date()
        const diffMs = end - start
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

const getStatusClass = (status) => {
    const classes = {
        'active': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-green-100 text-mun-green-700',
        'paused': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-yellow-100 text-mun-yellow-700',
        'completed': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-gray-100 text-mun-gray-700',
        'draft': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-blue-100 text-mun-blue-700'
    }
    return classes[status] || classes.draft
}

// Lifecycle
onMounted(() => {
    loadSessions()
})
</script>