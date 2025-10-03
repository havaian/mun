<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-minimal border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Left side -->
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h1 class="text-lg font-semibold text-gray-900">{{ committeeInfo?.name || 'Committee' }}
                                </h1>
                                <p class="text-xs text-gray-500">{{ authStore.user?.presidiumRole || 'Presidium Member'
                                    }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Center - Session Status -->
                    <div v-if="currentSession" class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-3 h-3 rounded-full',
                                currentSession.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                            ]"></div>
                            <span class="text-sm font-medium text-gray-900">
                                {{ currentSession.isActive ? 'Session Active' : 'Session Paused' }}
                            </span>
                        </div>

                        <!-- Session Timer -->
                        <div class="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
                            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-sm font-mono text-blue-700">{{ formatTimer(sessionTimer) }}</span>
                        </div>
                    </div>

                    <!-- Right side -->
                    <div class="flex items-center space-x-4">
                        <!-- Quick Stats -->
                        <div class="flex items-center space-x-4 text-sm text-gray-600">
                            <div class="flex items-center space-x-1">
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{{ attendanceStats.present }}/{{ attendanceStats.total }} present</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{{ onlineCount }} online</span>
                            </div>
                        </div>

                        <!-- User Menu -->
                        <div class="flex items-center space-x-3">
                            <div class="text-right">
                                <p class="text-sm font-medium text-gray-900">{{ authStore.user?.name ||
                                    authStore.user?.email }}</p>
                                <p class="text-xs text-gray-500">{{ authStore.user?.presidiumRole }}</p>
                            </div>
                            <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <span class="text-sm font-bold text-white">
                                    {{ getInitials(authStore.user?.name || authStore.user?.email) }}
                                </span>
                            </div>
                            <button @click="handleLogout"
                                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Logout">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Session Controls -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <!-- Session Management -->
                <div class="lg:col-span-2 card p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Session Management</h2>

                    <div class="space-y-4">
                        <!-- Current Session Info -->
                        <div v-if="currentSession" class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div>
                                <h3 class="font-medium text-blue-900">{{ currentSession.name }}</h3>
                                <p class="text-sm text-blue-700">{{ currentSession.description }}</p>
                                <p class="text-xs text-blue-600 mt-1">Started {{ formatTime(currentSession.startedAt) }}
                                </p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button v-if="currentSession.isActive" @click="pauseSession" class="btn-secondary">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M10 9v6m4-6v6" />
                                    </svg>
                                    Pause
                                </button>
                                <button v-else @click="resumeSession" class="btn-primary">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1" />
                                    </svg>
                                    Resume
                                </button>
                                <button @click="endSession" class="btn-danger">
                                    End Session
                                </button>
                            </div>
                        </div>

                        <!-- Start New Session -->
                        <div v-else class="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 class="mt-4 text-lg font-medium text-gray-900">No Active Session</h3>
                            <p class="mt-2 text-gray-500">Start a new committee session to begin proceedings</p>
                            <button @click="startNewSession" class="mt-4 btn-primary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Start New Session
                            </button>
                        </div>

                        <!-- Debate Modes -->
                        <div v-if="currentSession" class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button v-for="mode in debateModes" :key="mode.id" @click="setDebateMode(mode.id)" :class="[
                                'p-3 rounded-lg border-2 text-sm font-medium transition-colors',
                                currentSession.currentMode === mode.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            ]">
                                <div class="text-center">
                                    <div class="font-semibold">{{ mode.name }}</div>
                                    <div class="text-xs mt-1">{{ mode.description }}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div class="space-y-3">
                        <button @click="openAttendanceModal"
                            class="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-green-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Roll Call</p>
                                    <p class="text-xs text-gray-600">Take attendance</p>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button @click="openVotingModal"
                            class="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-blue-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Start Voting</p>
                                    <p class="text-xs text-gray-600">Create a vote</p>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button @click="openDocumentsModal"
                            class="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-purple-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Documents</p>
                                    <p class="text-xs text-gray-600">Manage drafts</p>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button @click="openTimerModal"
                            class="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-yellow-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Timers</p>
                                    <p class="text-xs text-gray-600">Manage timers</p>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Active Components Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Current Speakers List -->
                <div class="card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">Speakers List</h2>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500">{{ speakersList.length }} delegates</span>
                            <button @click="manageSpeakersList" class="btn-secondary text-sm">
                                Manage
                            </button>
                        </div>
                    </div>

                    <div v-if="speakersList.length === 0" class="text-center py-8 text-gray-500">
                        <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <p class="text-sm">No speakers in queue</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div v-for="(speaker, index) in speakersList.slice(0, 5)" :key="speaker.id" :class="[
                            'flex items-center justify-between p-3 rounded-lg border',
                            index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        ]">
                            <div class="flex items-center space-x-3">
                                <span :class="[
                                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                                    index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                ]">
                                    {{ index + 1 }}
                                </span>
                                <div>
                                    <p class="font-medium text-gray-900">{{ speaker.country }}</p>
                                    <p class="text-sm text-gray-500">{{ speaker.delegate }}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span v-if="speaker.speaking" class="text-green-600 text-sm font-medium">Speaking</span>
                                <span v-else-if="index === 0" class="text-blue-600 text-sm font-medium">Next</span>
                            </div>
                        </div>

                        <div v-if="speakersList.length > 5" class="text-center">
                            <button @click="manageSpeakersList" class="text-sm text-blue-600 hover:text-blue-700">
                                View all {{ speakersList.length }} speakers
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <button @click="viewAllActivity" class="text-sm text-blue-600 hover:text-blue-700">
                            View All
                        </button>
                    </div>

                    <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
                        <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-sm">No recent activity</p>
                    </div>

                    <div v-else class="space-y-4">
                        <div v-for="activity in recentActivity.slice(0, 5)" :key="activity.id"
                            class="flex items-start space-x-3">
                            <div :class="[
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                activity.type === 'vote' ? 'bg-blue-50 text-blue-600' :
                                    activity.type === 'document' ? 'bg-purple-50 text-purple-600' :
                                        activity.type === 'speech' ? 'bg-green-50 text-green-600' :
                                            'bg-gray-50 text-gray-600'
                            ]">
                                <component :is="getActivityIcon(activity.type)" class="w-4 h-4" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                                <p class="text-sm text-gray-600">{{ activity.description }}</p>
                                <p class="text-xs text-gray-500 mt-1">{{ formatTime(activity.timestamp) }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../storeswebsocket'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const socketStore = useSocketStore()
const router = useRouter()

// State
const committeeInfo = ref(null)
const currentSession = ref(null)
const sessionTimer = ref(0)
const attendanceStats = ref({ present: 0, total: 0 })
const speakersList = ref([])
const recentActivity = ref([])

// Timer interval
let timerInterval = null

// Debate modes
const debateModes = [
    { id: 'formal', name: 'Formal', description: 'Structured debate' },
    { id: 'moderated', name: 'Moderated', description: 'Moderated caucus' },
    { id: 'unmoderated', name: 'Unmoderated', description: 'Free discussion' },
    { id: 'informal', name: 'Informal', description: 'Informal consultation' }
]

// Computed
const onlineCount = computed(() => {
    return socketStore.onlineUsersList.length
})

// Methods
async function fetchCommitteeData() {
    try {
        const response = await authStore.apiCall('/presidium/committee')
        if (response.ok) {
            const data = await response.json()
            committeeInfo.value = data.committee
            currentSession.value = data.currentSession
            attendanceStats.value = data.attendanceStats
            speakersList.value = data.speakersList || []
            recentActivity.value = data.recentActivity || []

            if (currentSession.value && currentSession.value.isActive) {
                startTimer()
            }
        }
    } catch (error) {
        console.error('Committee data fetch error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to load committee data'
        })
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval)

    timerInterval = setInterval(() => {
        if (currentSession.value && currentSession.value.isActive) {
            sessionTimer.value++
        }
    }, 1000)
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

async function startNewSession() {
    window.openModal({
        component: 'StartSessionModal',
        props: {
            committeeId: committeeInfo.value?.id,
            onSuccess: (session) => {
                currentSession.value = session
                sessionTimer.value = 0
                startTimer()
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Session started successfully'
                })
            }
        }
    })
}

async function pauseSession() {
    try {
        const response = await authStore.apiCall('/presidium/session/pause', {
            method: 'PUT'
        })

        if (response.ok) {
            currentSession.value.isActive = false
            stopTimer()
            window.showNotification({
                type: 'info',
                title: 'Session Paused',
                message: 'Session has been paused'
            })
        }
    } catch (error) {
        console.error('Pause session error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to pause session'
        })
    }
}

async function resumeSession() {
    try {
        const response = await authStore.apiCall('/presidium/session/resume', {
            method: 'PUT'
        })

        if (response.ok) {
            currentSession.value.isActive = true
            startTimer()
            window.showNotification({
                type: 'info',
                title: 'Session Resumed',
                message: 'Session has been resumed'
            })
        }
    } catch (error) {
        console.error('Resume session error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to resume session'
        })
    }
}

async function endSession() {
    const confirmed = await showConfirmDialog({
        title: 'End Session',
        message: 'Are you sure you want to end this session? This action cannot be undone.',
        confirmText: 'End Session',
        confirmType: 'danger'
    })

    if (confirmed) {
        try {
            const response = await authStore.apiCall('/presidium/session/end', {
                method: 'PUT'
            })

            if (response.ok) {
                currentSession.value = null
                stopTimer()
                sessionTimer.value = 0
                window.showNotification({
                    type: 'success',
                    title: 'Session Ended',
                    message: 'Session has been ended successfully'
                })
            }
        } catch (error) {
            console.error('End session error:', error)
            window.showNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to end session'
            })
        }
    }
}

async function setDebateMode(mode) {
    try {
        const response = await authStore.apiCall('/presidium/session/mode', {
            method: 'PUT',
            body: JSON.stringify({ mode })
        })

        if (response.ok) {
            currentSession.value.currentMode = mode
            window.showNotification({
                type: 'success',
                title: 'Mode Changed',
                message: `Debate mode set to ${debateModes.find(m => m.id === mode)?.name}`
            })
        }
    } catch (error) {
        console.error('Set debate mode error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to change debate mode'
        })
    }
}

function openAttendanceModal() {
    window.openModal({
        component: 'AttendanceModal',
        size: 'lg',
        props: {
            committeeId: committeeInfo.value?.id,
            onUpdate: (stats) => {
                attendanceStats.value = stats
            }
        }
    })
}

function openVotingModal() {
    window.openModal({
        component: 'CreateVotingModal',
        size: 'lg',
        props: {
            committeeId: committeeInfo.value?.id
        }
    })
}

function openDocumentsModal() {
    window.openModal({
        component: 'DocumentsModal',
        size: 'xl',
        props: {
            committeeId: committeeInfo.value?.id
        }
    })
}

function openTimerModal() {
    window.openModal({
        component: 'TimerModal',
        props: {
            committeeId: committeeInfo.value?.id
        }
    })
}

function manageSpeakersList() {
    window.openModal({
        component: 'SpeakersListModal',
        size: 'lg',
        props: {
            speakers: speakersList.value,
            onUpdate: (newList) => {
                speakersList.value = newList
            }
        }
    })
}

function viewAllActivity() {
    window.openModal({
        component: 'ActivityModal',
        size: 'lg',
        props: {
            activities: recentActivity.value
        }
    })
}

function formatTimer(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatTime(timestamp) {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now - time
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return time.toLocaleDateString()
}

function getInitials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function getActivityIcon(type) {
    const icons = {
        vote: {
            template: `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      `
        },
        document: {
            template: `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      `
        },
        speech: {
            template: `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
        </svg>
      `
        }
    }
    return icons[type] || icons.speech
}

async function showConfirmDialog({ title, message, confirmText, confirmType }) {
    return new Promise((resolve) => {
        window.openModal({
            component: 'ConfirmDialog',
            props: {
                title,
                message,
                confirmText,
                confirmType,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            }
        })
    })
}

function handleLogout() {
    authStore.logout()
    router.push('/')
}

// Initialize
onMounted(() => {
    fetchCommitteeData()

    // Join committee room for real-time updates
    if (committeeInfo.value?.id) {
        socketStore.joinCommittee(committeeInfo.value.id)
    }

    // Listen for real-time updates
    const unsubscribes = [
        socketStore.subscribe('committee:session', (data) => {
            currentSession.value = data
            if (data && data.isActive) {
                startTimer()
            } else {
                stopTimer()
            }
        }),

        socketStore.subscribe('committee:attendance', (data) => {
            attendanceStats.value = data
        }),

        socketStore.subscribe('committee:speakers', (data) => {
            speakersList.value = data
        }),

        socketStore.subscribe('committee:activity', (activity) => {
            recentActivity.value.unshift(activity)
            if (recentActivity.value.length > 20) {
                recentActivity.value = recentActivity.value.slice(0, 20)
            }
        })
    ]

    onUnmounted(() => {
        stopTimer()
        unsubscribes.forEach(unsubscribe => unsubscribe())
        if (committeeInfo.value?.id) {
            socketStore.leaveCommittee(committeeInfo.value.id)
        }
    })
})
</script>