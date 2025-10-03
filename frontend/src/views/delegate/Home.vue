<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-minimal border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Left side -->
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-3">
                            <!-- Country Flag Placeholder -->
                            <div
                                class="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                                <span class="text-xs font-bold text-white">{{ getCountryCode() }}</span>
                            </div>
                            <div>
                                <h1 class="text-lg font-semibold text-gray-900">{{ delegateInfo?.country || 'Country' }}
                                </h1>
                                <p class="text-xs text-gray-500">{{ delegateInfo?.committee?.name || 'Committee' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Center - Session Status -->
                    <div v-if="sessionInfo" class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <div :class="[
                                'w-3 h-3 rounded-full',
                                sessionInfo.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                            ]"></div>
                            <span class="text-sm font-medium text-gray-900">
                                {{ sessionInfo.isActive ? sessionInfo.currentMode || 'In Session' : 'Session Paused' }}
                            </span>
                        </div>

                        <!-- Speaking Status -->
                        <div v-if="isSpeaking"
                            class="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span class="text-sm font-medium text-red-700">You are speaking</span>
                            <div class="text-sm font-mono text-red-600">{{ formatTimer(speakingTimer) }}</div>
                        </div>

                        <!-- Queue Position -->
                        <div v-else-if="queuePosition > 0"
                            class="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="text-sm font-medium text-blue-700">Queue position: {{ queuePosition }}</span>
                        </div>
                    </div>

                    <!-- Right side -->
                    <div class="flex items-center space-x-4">
                        <!-- Attendance Status -->
                        <div class="flex items-center space-x-2 text-sm">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                attendanceStatus === 'present_voting' ? 'bg-green-500' :
                                    attendanceStatus === 'present' ? 'bg-yellow-500' :
                                        'bg-gray-300'
                            ]"></div>
                            <span class="text-gray-600">
                                {{ getAttendanceStatusText() }}
                            </span>
                        </div>

                        <!-- User Menu -->
                        <div class="flex items-center space-x-3">
                            <div class="text-right">
                                <p class="text-sm font-medium text-gray-900">{{ authStore.user?.name || 'Delegate' }}
                                </p>
                                <p class="text-xs text-gray-500">{{ getDelegationType() }}</p>
                            </div>
                            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span class="text-sm font-bold text-white">
                                    {{ getInitials(authStore.user?.name || delegateInfo?.country) }}
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
            <!-- Alert Banners -->
            <div v-if="alerts.length > 0" class="mb-6 space-y-3">
                <div v-for="alert in alerts" :key="alert.id" :class="[
                    'p-4 rounded-lg border-l-4',
                    alert.type === 'voting' ? 'bg-blue-50 border-blue-400' :
                        alert.type === 'speaking' ? 'bg-green-50 border-green-400' :
                            alert.type === 'urgent' ? 'bg-red-50 border-red-400' :
                                'bg-yellow-50 border-yellow-400'
                ]">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <component :is="getAlertIcon(alert.type)" :class="[
                                'w-5 h-5',
                                alert.type === 'voting' ? 'text-blue-600' :
                                    alert.type === 'speaking' ? 'text-green-600' :
                                        alert.type === 'urgent' ? 'text-red-600' :
                                            'text-yellow-600'
                            ]" />
                            <div>
                                <p class="font-medium text-gray-900">{{ alert.title }}</p>
                                <p class="text-sm text-gray-700">{{ alert.message }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button v-if="alert.action" @click="handleAlertAction(alert)" :class="[
                                'btn text-sm',
                                alert.type === 'voting' ? 'btn-primary' : 'btn-secondary'
                            ]">
                                {{ alert.actionText }}
                            </button>
                            <button @click="dismissAlert(alert.id)" class="text-gray-400 hover:text-gray-600">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dashboard Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <!-- Current Status Card -->
                <div class="lg:col-span-2 card p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Committee Status</h2>

                    <div class="space-y-4">
                        <!-- Session Info -->
                        <div v-if="sessionInfo" class="p-4 bg-blue-50 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="font-medium text-blue-900">{{ sessionInfo.name }}</h3>
                                    <p class="text-sm text-blue-700">{{ sessionInfo.currentMode || 'Formal Debate' }}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-medium text-blue-900">{{ formatTimer(sessionInfo.duration ||
                                        0) }}</p>
                                    <p class="text-xs text-blue-600">Session time</p>
                                </div>
                            </div>
                        </div>

                        <!-- Active Voting -->
                        <div v-if="activeVoting" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="font-medium text-red-900">Active Voting</h3>
                                    <p class="text-sm text-red-700">{{ activeVoting.title }}</p>
                                    <p class="text-xs text-red-600 mt-1">{{ activeVoting.votingType }} • {{
                                        activeVoting.timeRemaining }} remaining</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button v-if="!activeVoting.hasVoted" @click="openVotingModal" class="btn-primary">
                                        Cast Vote
                                    </button>
                                    <button v-else disabled class="btn-secondary opacity-50 cursor-not-allowed">
                                        Vote Cast
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Speaking Queue -->
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="font-medium text-gray-900">Speakers List</h3>
                                <button v-if="!isInQueue && sessionInfo?.isActive" @click="joinSpeakersList"
                                    class="btn-secondary text-sm">
                                    Join Queue
                                </button>
                                <button v-else-if="isInQueue" @click="leaveSpeakersList" class="btn-secondary text-sm">
                                    Leave Queue
                                </button>
                            </div>

                            <div v-if="speakers.length === 0" class="text-center py-4 text-gray-500">
                                <p class="text-sm">No speakers in queue</p>
                            </div>

                            <div v-else class="space-y-2">
                                <div v-for="(speaker, index) in speakers.slice(0, 3)" :key="speaker.id" :class="[
                                    'flex items-center space-x-3 p-2 rounded',
                                    speaker.country === delegateInfo?.country ? 'bg-blue-100' : 'bg-white'
                                ]">
                                    <span :class="[
                                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                                        index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                    ]">
                                        {{ index + 1 }}
                                    </span>
                                    <span class="text-sm font-medium">{{ speaker.country }}</span>
                                    <span v-if="speaker.speaking"
                                        class="text-xs text-green-600 font-medium">Speaking</span>
                                    <span v-else-if="index === 0" class="text-xs text-blue-600 font-medium">Next</span>
                                </div>

                                <div v-if="speakers.length > 3" class="text-center">
                                    <button @click="viewFullSpeakersList"
                                        class="text-sm text-blue-600 hover:text-blue-700">
                                        View all {{ speakers.length }} speakers
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card p-6">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div class="space-y-3">
                        <!-- Documents -->
                        <button @click="openDocuments"
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
                                    <p class="text-xs text-gray-600">View drafts & resolutions</p>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <!-- Coalitions -->
                        <button @click="openCoalitions"
                            class="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-green-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Coalitions</p>
                                    <p class="text-xs text-gray-600">Join or create groups</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span v-if="coalitionCount > 0"
                                    class="text-xs bg-green-600 text-white rounded-full px-2 py-1">
                                    {{ coalitionCount }}
                                </span>
                                <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        <!-- Messages -->
                        <button @click="openMessages"
                            class="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-blue-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Messages</p>
                                    <p class="text-xs text-gray-600">Diplomatic correspondence</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-1">
                                <span v-if="unreadMessages > 0"
                                    class="text-xs bg-red-600 text-white rounded-full px-2 py-1">
                                    {{ unreadMessages }}
                                </span>
                                <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        <!-- Statistics -->
                        <button @click="openStatistics"
                            class="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <div class="p-2 bg-yellow-600 text-white rounded-lg">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div class="text-left">
                                    <p class="font-medium text-gray-900">Statistics</p>
                                    <p class="text-xs text-gray-600">Performance & activity</p>
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

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Committee Updates -->
                <div class="card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">Committee Updates</h2>
                        <button class="text-sm text-blue-600 hover:text-blue-700">View All</button>
                    </div>

                    <div v-if="committeeUpdates.length === 0" class="text-center py-8 text-gray-500">
                        <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-sm">No recent updates</p>
                    </div>

                    <div v-else class="space-y-4">
                        <div v-for="update in committeeUpdates.slice(0, 5)" :key="update.id"
                            class="flex items-start space-x-3">
                            <div :class="[
                                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                                update.type === 'vote' ? 'bg-blue-50 text-blue-600' :
                                    update.type === 'document' ? 'bg-purple-50 text-purple-600' :
                                        update.type === 'session' ? 'bg-green-50 text-green-600' :
                                            'bg-gray-50 text-gray-600'
                            ]">
                                <component :is="getUpdateIcon(update.type)" class="w-4 h-4" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900">{{ update.title }}</p>
                                <p class="text-sm text-gray-600">{{ update.description }}</p>
                                <p class="text-xs text-gray-500 mt-1">{{ formatTime(update.timestamp) }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Personal Activity -->
                <div class="card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">Your Activity</h2>
                        <button class="text-sm text-blue-600 hover:text-blue-700">View History</button>
                    </div>

                    <div class="space-y-4">
                        <!-- Activity Stats -->
                        <div class="grid grid-cols-3 gap-4">
                            <div class="text-center p-3 bg-blue-50 rounded-lg">
                                <p class="text-2xl font-bold text-blue-600">{{ personalStats.speeches || 0 }}</p>
                                <p class="text-xs text-blue-700">Speeches</p>
                            </div>
                            <div class="text-center p-3 bg-green-50 rounded-lg">
                                <p class="text-2xl font-bold text-green-600">{{ personalStats.votes || 0 }}</p>
                                <p class="text-xs text-green-700">Votes Cast</p>
                            </div>
                            <div class="text-center p-3 bg-purple-50 rounded-lg">
                                <p class="text-2xl font-bold text-purple-600">{{ personalStats.documents || 0 }}</p>
                                <p class="text-xs text-purple-700">Documents</p>
                            </div>
                        </div>

                        <!-- Recent Personal Activity -->
                        <div v-if="personalActivity.length === 0" class="text-center py-6 text-gray-500">
                            <p class="text-sm">No recent activity</p>
                        </div>

                        <div v-else class="space-y-3">
                            <div v-for="activity in personalActivity.slice(0, 4)" :key="activity.id"
                                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                                    <p class="text-xs text-gray-600">{{ formatTime(activity.timestamp) }}</p>
                                </div>
                                <span :class="[
                                    'px-2 py-1 text-xs font-medium rounded-full',
                                    activity.status === 'success' ? 'bg-green-100 text-green-700' :
                                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                ]">
                                    {{ activity.status }}
                                </span>
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
const delegateInfo = ref(null)
const sessionInfo = ref(null)
const attendanceStatus = ref('absent')
const activeVoting = ref(null)
const speakers = ref([])
const alerts = ref([])

// Counters
const coalitionCount = ref(0)
const unreadMessages = ref(0)
const queuePosition = ref(0)
const isSpeaking = ref(false)
const speakingTimer = ref(0)

// Activity data
const committeeUpdates = ref([])
const personalActivity = ref([])
const personalStats = ref({
    speeches: 0,
    votes: 0,
    documents: 0
})

// Timers
let speakingInterval = null

// Computed
const isInQueue = computed(() => queuePosition.value > 0)

// Methods
async function fetchDelegateData() {
    try {
        const response = await authStore.apiCall('/delegate/dashboard')
        if (response.ok) {
            const data = await response.json()

            delegateInfo.value = data.delegate
            sessionInfo.value = data.session
            attendanceStatus.value = data.attendanceStatus || 'absent'
            activeVoting.value = data.activeVoting
            speakers.value = data.speakers || []
            coalitionCount.value = data.coalitionCount || 0
            unreadMessages.value = data.unreadMessages || 0
            committeeUpdates.value = data.committeeUpdates || []
            personalActivity.value = data.personalActivity || []
            personalStats.value = data.personalStats || personalStats.value

            // Check if delegate is in queue or speaking
            updateSpeakingStatus(data.speakingStatus)

            // Add any alerts
            if (data.alerts && data.alerts.length > 0) {
                alerts.value.push(...data.alerts)
            }
        }
    } catch (error) {
        console.error('Delegate data fetch error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to load delegate data'
        })
    }
}

function updateSpeakingStatus(status) {
    if (status && status.isSpeaking) {
        isSpeaking.value = true
        speakingTimer.value = status.duration || 0
        startSpeakingTimer()
    } else {
        isSpeaking.value = false
        speakingTimer.value = 0
        stopSpeakingTimer()
    }

    queuePosition.value = status?.queuePosition || 0
}

function startSpeakingTimer() {
    if (speakingInterval) clearInterval(speakingInterval)

    speakingInterval = setInterval(() => {
        if (isSpeaking.value) {
            speakingTimer.value++
        }
    }, 1000)
}

function stopSpeakingTimer() {
    if (speakingInterval) {
        clearInterval(speakingInterval)
        speakingInterval = null
    }
}

async function joinSpeakersList() {
    try {
        const response = await authStore.apiCall('/delegate/speakers/join', {
            method: 'POST'
        })

        if (response.ok) {
            window.showNotification({
                type: 'success',
                title: 'Added to Queue',
                message: 'You have been added to the speakers list'
            })
        }
    } catch (error) {
        console.error('Join speakers error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to join speakers list'
        })
    }
}

async function leaveSpeakersList() {
    try {
        const response = await authStore.apiCall('/delegate/speakers/leave', {
            method: 'POST'
        })

        if (response.ok) {
            queuePosition.value = 0
            window.showNotification({
                type: 'info',
                title: 'Left Queue',
                message: 'You have been removed from the speakers list'
            })
        }
    } catch (error) {
        console.error('Leave speakers error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to leave speakers list'
        })
    }
}

function openVotingModal() {
    if (!activeVoting.value) return

    window.openModal({
        component: 'VotingModal',
        size: 'lg',
        props: {
            voting: activeVoting.value,
            onVote: (vote) => {
                activeVoting.value.hasVoted = true
                window.showNotification({
                    type: 'success',
                    title: 'Vote Cast',
                    message: 'Your vote has been recorded'
                })
            }
        }
    })
}

function openDocuments() {
    window.openModal({
        component: 'DocumentsViewModal',
        size: 'xl',
        props: {
            committeeId: delegateInfo.value?.committee?.id
        }
    })
}

function openCoalitions() {
    window.openModal({
        component: 'CoalitionsModal',
        size: 'lg',
        props: {
            delegateInfo: delegateInfo.value,
            onUpdate: (count) => {
                coalitionCount.value = count
            }
        }
    })
}

function openMessages() {
    window.openModal({
        component: 'MessagesModal',
        size: 'lg',
        props: {
            delegateInfo: delegateInfo.value,
            onRead: (count) => {
                unreadMessages.value = Math.max(0, unreadMessages.value - count)
            }
        }
    })
}

function openStatistics() {
    window.openModal({
        component: 'StatisticsModal',
        size: 'lg',
        props: {
            stats: personalStats.value,
            activity: personalActivity.value
        }
    })
}

function viewFullSpeakersList() {
    window.openModal({
        component: 'SpeakersViewModal',
        props: {
            speakers: speakers.value,
            currentCountry: delegateInfo.value?.country
        }
    })
}

function handleAlertAction(alert) {
    if (alert.action === 'vote') {
        openVotingModal()
    } else if (alert.action === 'speak') {
        // Handle speaking action
    }
    dismissAlert(alert.id)
}

function dismissAlert(alertId) {
    const index = alerts.value.findIndex(a => a.id === alertId)
    if (index > -1) {
        alerts.value.splice(index, 1)
    }
}

// Utility functions
function getCountryCode() {
    if (!delegateInfo.value?.country) return '??'
    return delegateInfo.value.country.substring(0, 2).toUpperCase()
}

function getDelegationType() {
    return delegateInfo.value?.delegationType || 'Delegate'
}

function getAttendanceStatusText() {
    switch (attendanceStatus.value) {
        case 'present_voting':
            return 'Present and Voting'
        case 'present':
            return 'Present'
        default:
            return 'Absent'
    }
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

function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
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

function getAlertIcon(type) {
    const icons = {
        voting: {
            template: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      `
        },
        speaking: {
            template: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
        </svg>
      `
        },
        urgent: {
            template: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      `
        }
    }
    return icons[type] || icons.urgent
}

function getUpdateIcon(type) {
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
        session: {
            template: `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `
        }
    }
    return icons[type] || icons.session
}

function handleLogout() {
    authStore.logout()
    router.push('/')
}

// Initialize
onMounted(() => {
    fetchDelegateData()

    // Join committee room for real-time updates
    if (delegateInfo.value?.committee?.id) {
        socketStore.joinCommittee(delegateInfo.value.committee.id)
    }

    // Listen for real-time updates
    const unsubscribes = [
        socketStore.subscribe('committee:voting', (voting) => {
            if (voting.status === 'active' && !voting.hasVoted) {
                activeVoting.value = voting
                alerts.value.unshift({
                    id: Date.now(),
                    type: 'voting',
                    title: 'New Voting Started',
                    message: voting.title,
                    action: 'vote',
                    actionText: 'Cast Vote'
                })
            } else if (voting.status === 'completed') {
                activeVoting.value = null
                dismissAlert('voting')
            }
        }),

        socketStore.subscribe('committee:speakers', (speakersData) => {
            speakers.value = speakersData.list || []
            updateSpeakingStatus(speakersData.myStatus)
        }),

        socketStore.subscribe('committee:session', (session) => {
            sessionInfo.value = session
        }),

        socketStore.subscribe('delegate:alert', (alert) => {
            alerts.value.unshift({
                ...alert,
                id: Date.now()
            })
        }),

        socketStore.subscribe('delegate:attendance', (status) => {
            attendanceStatus.value = status
        })
    ]

    onUnmounted(() => {
        stopSpeakingTimer()
        unsubscribes.forEach(unsubscribe => unsubscribe())
        if (delegateInfo.value?.committee?.id) {
            socketStore.leaveCommittee(delegateInfo.value.committee.id)
        }
    })
})
</script>