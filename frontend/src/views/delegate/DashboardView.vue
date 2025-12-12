<template>
    <div class="h-screen flex bg-gray-50">
        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-6 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">{{ userCountry }}</h1>
                        <p class="text-gray-500 text-sm mt-1">
                            STATUS: <span :class="attendanceStatusClass">{{ attendanceStatusDisplay }}</span>
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div :class="[
                            'px-3 py-1 rounded-full text-sm font-medium',
                            currentSession ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        ]">
                            {{ currentSession ? 'Listening' : 'Session Inactive' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 p-6 overflow-y-auto">
                <div class="max-w-4xl mx-auto space-y-6">
                    <!-- Roll Call Active Banner - BIG PROMINENT NOTIFICATION -->
                    <div v-if="rollCallActive && !isMarkedPresent"
                        class="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-2xl border-2 border-blue-400">
                        <div class="flex items-start justify-between">
                            <div class="flex items-start space-x-4">
                                <div class="flex-shrink-0">
                                    <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-2xl font-bold mb-2">Roll Call in Progress</h3>
                                    <p class="text-blue-100 text-lg">Please confirm your presence for this session.</p>
                                </div>
                            </div>
                            <div class="flex space-x-3">
                                <button @click="markAttendance('present')" :disabled="isMarkingAttendance"
                                    class="px-6 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Present
                                </button>
                                <button @click="markAttendance('present_and_voting')" :disabled="isMarkingAttendance"
                                    class="px-6 py-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Present & Voting
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Floor Actions Card -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Floor Actions</h2>

                        <!-- Attendance Warning -->
                        <div v-if="!isMarkedPresent" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-sm text-red-700">
                                <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" />
                                Mark attendance to enable actions
                            </p>
                        </div>

                        <!-- Request to Speak -->
                        <button @click="requestToSpeak" :disabled="!canRequestSpeak" :class="[
                            'w-full mb-6 py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-3',
                            isInSpeakersList
                                ? 'bg-green-50 border-2 border-green-200 text-green-700'
                                : canRequestSpeak
                                    ? 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                                    : 'bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                        ]">
                            <HandRaisedIcon class="w-6 h-6" />
                            <span class="text-lg">
                                {{ isInSpeakersList ? 'In Speakers List' : 'Request to Speak' }}
                            </span>
                        </button>

                        <!-- Procedural Actions -->
                        <div class="grid grid-cols-2 gap-4">
                            <button @click="pointOfOrder" :disabled="!canTakeActions"
                                class="py-3 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                Point of Order
                            </button>
                            <button @click="rightOfReply" :disabled="!canTakeActions"
                                class="py-3 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                Right of Reply
                            </button>
                        </div>
                    </div>

                    <!-- Current Speaker Card -->
                    <div class="bg-gray-800 text-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center space-x-3 mb-4">
                            <SpeakerWaveIcon class="w-6 h-6" />
                            <h3 class="text-lg font-semibold">CURRENT SPEAKER</h3>
                        </div>
                        <div>
                            <p class="text-3xl font-bold">{{ currentSpeaker?.country || 'None' }}</p>
                            <div v-if="currentSpeaker && speakerTimer" class="mt-2 text-sm text-gray-300">
                                Time remaining: {{ formattedSpeakerTime }}
                            </div>
                        </div>
                    </div>

                    <!-- Active Voting Alert -->
                    <div v-if="activeVoting" class="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-red-800">Active Voting</h3>
                                <p class="text-sm text-red-600">{{ activeVoting.title }}</p>
                            </div>
                            <RouterLink to="/delegate/voting"
                                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                                Vote Now
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Sidebar: Diplomatic Channels -->
        <div class="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Diplomatic Channels</h2>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                <!-- Loading -->
                <div v-if="isLoadingMessages" class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>

                <!-- Recent Messages -->
                <div v-else-if="recentMessages.length > 0">
                    <div v-for="message in recentMessages" :key="message._id" class="p-4 rounded-lg transition-colors"
                        :class="[
                            message.channelType === 'announcements' ? 'bg-yellow-50 border border-yellow-200' :
                                message.channelType === 'gossip' ? 'bg-pink-50 border border-pink-200' :
                                    'bg-gray-50'
                        ]">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-medium text-sm">{{ getSenderName(message) }}</span>
                            <span class="text-xs text-gray-500">{{ formatMessageTime(message.timestamp) }}</span>
                        </div>
                        <p class="text-sm text-gray-700">{{ message.content }}</p>
                    </div>
                </div>

                <div v-else class="text-center text-gray-500 py-8">
                    No recent messages
                </div>
            </div>

            <!-- Message Composer -->
            <div class="p-4 border-t border-gray-200">
                <RouterLink to="/delegate/messaging"
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block">
                    Open Diplomacy
                </RouterLink>
            </div>
        </div>

        <!-- Mark Attendance Modal -->
        <TransitionRoot :show="showAttendanceModal" as="template">
            <Dialog @close="showAttendanceModal = false">
                <div class="fixed inset-0 bg-black/30 z-50" />
                <div class="fixed inset-0 overflow-y-auto z-50">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <DialogPanel class="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                            <DialogTitle class="text-lg font-bold mb-4">
                                Mark Attendance
                            </DialogTitle>

                            <p class="text-sm text-gray-600 mb-6">
                                Select your attendance status for this session:
                            </p>

                            <div class="space-y-3 mb-6">
                                <button @click="markAttendance('present_and_voting')" :disabled="isMarkingAttendance"
                                    class="w-full p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left disabled:opacity-50">
                                    <div class="font-semibold text-green-800">Present and Voting</div>
                                    <div class="text-sm text-green-600">Full participation in session and voting</div>
                                </button>

                                <button @click="markAttendance('present')" :disabled="isMarkingAttendance"
                                    class="w-full p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left disabled:opacity-50">
                                    <div class="font-semibold text-blue-800">Present</div>
                                    <div class="text-sm text-blue-600">Participating but not voting</div>
                                </button>
                            </div>

                            <button @click="showAttendanceModal = false"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                                Cancel
                            </button>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import sessionApi from '@/utils/sessionApi'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'

// Icons
import {
    HandRaisedIcon, SpeakerWaveIcon, ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Stores
const authStore = useAuthStore()
const toast = useToast()

// State
const currentSession = ref(null)
const committee = ref(null)
const attendanceStatus = ref(null)
const rollCallActive = ref(false)
const currentSpeaker = ref(null)
const speakerTimer = ref(null)
const speakerLists = ref({ present: [], absent: [] })
const activeVoting = ref(null)
const recentMessages = ref([])
const isLoadingMessages = ref(false)
const showAttendanceModal = ref(false)
const isMarkingAttendance = ref(false)

// Timer update interval
let timerUpdateInterval = null

// Computed
const userCountry = computed(() => authStore.user?.countryName || 'Unknown')

const isMarkedPresent = computed(() => {
    return attendanceStatus.value === 'present' || attendanceStatus.value === 'present_and_voting'
})

const attendanceStatusDisplay = computed(() => {
    if (!attendanceStatus.value) return 'NOT MARKED'
    if (attendanceStatus.value === 'present_and_voting') return 'PRESENT AND VOTING'
    if (attendanceStatus.value === 'present') return 'PRESENT'
    return 'NOT MARKED'
})

const attendanceStatusClass = computed(() => {
    if (attendanceStatus.value === 'present_and_voting') return 'text-green-600 font-medium'
    if (attendanceStatus.value === 'present') return 'text-blue-600 font-medium'
    return 'text-red-600 font-medium'
})

const isInSpeakersList = computed(() => {
    if (!userCountry.value || !speakerLists.value.present) return false
    return speakerLists.value.present.some(s => s.country === userCountry.value && !s.hasSpoken)
})

const canRequestSpeak = computed(() => {
    return isMarkedPresent.value && !isInSpeakersList.value && currentSession.value
})

const canTakeActions = computed(() => {
    return isMarkedPresent.value && currentSession.value
})

const formattedSpeakerTime = computed(() => {
    if (!speakerTimer.value) return '0:00'

    const remaining = getRealTimeRemaining(speakerTimer.value)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Helper Methods
const getRealTimeRemaining = (timer) => {
    if (!timer) return 0
    if (!timer.isActive) return timer.remainingTime || timer.totalDuration || 0
    if (timer.isPaused) return timer.remainingTime || 0

    const startedAt = new Date(timer.startedAt)
    const now = new Date()
    const elapsed = Math.floor((now - startedAt) / 1000)
    const pauseTime = timer.accumulatedPause || 0
    const actualElapsed = elapsed - pauseTime
    const remaining = Math.max(0, timer.totalDuration - actualElapsed)

    return remaining
}

const formatMessageTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

const getSenderName = (message) => {
    if (message.channelType === 'announcements') return 'Chairperson'
    if (message.channelType === 'gossip') return 'Anonymous'
    return message.senderCountry || 'Unknown'
}

// Data Loading Methods
const loadDashboardData = async () => {
    try {
        committee.value = authStore.user?.committeeId
        if (!committee.value) {
            throw new Error('No committee assigned')
        }

        await Promise.all([
            loadActiveSession(),
            loadRecentMessages(),
            loadActiveVoting()
        ])

        setupWebSocketListeners()

    } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error('Failed to load dashboard data')
    }
}

const loadActiveSession = async () => {
    try {
        const response = await apiMethods.sessions.getAll(committee.value._id, {
            status: 'active',
            limit: 1
        })

        if (response.data.success && response.data.sessions?.length > 0) {
            const session = response.data.sessions[0]
            currentSession.value = session

            // Load full session details
            const sessionDetail = await apiMethods.sessions.getById(session._id)
            if (sessionDetail.data.success) {
                const sessionData = sessionDetail.data.session

                // Roll call status
                rollCallActive.value = sessionData.rollCall?.isActive || false

                // Speaker lists
                speakerLists.value = sessionData.speakerLists || { present: [], absent: [] }

                // Current speaker
                currentSpeaker.value = sessionData.currentSpeaker || null

                // Speaker timer
                if (sessionData.timers?.speaker) {
                    speakerTimer.value = sessionData.timers.speaker
                }

                // Check attendance status from rollCall responses
                const myCountry = authStore.user?.countryName
                if (myCountry && sessionData.rollCall?.responses) {
                    const myAttendance = sessionData.rollCall.responses.find(a => a.country === myCountry)
                    if (myAttendance) {
                        // Convert from backend format to frontend format
                        attendanceStatus.value = myAttendance.status
                    }
                }
            }

            // Join session room
            wsService.joinSession(session._id)
        }
    } catch (error) {
        console.error('Failed to load active session:', error)
    }
}

const loadRecentMessages = async () => {
    try {
        isLoadingMessages.value = true

        // Load announcements
        const announcementsResponse = await apiMethods.messages.getCommitteeConversation(
            committee.value._id,
            'announcements'
        )

        // Load gossip
        const gossipResponse = await apiMethods.messages.getCommitteeConversation(
            committee.value._id,
            'gossip'
        )

        const allMessages = []

        if (announcementsResponse.data.success) {
            const announcements = announcementsResponse.data.conversation.messages || []
            allMessages.push(...announcements.map(m => ({ ...m, channelType: 'announcements' })))
        }

        if (gossipResponse.data.success) {
            const gossip = gossipResponse.data.conversation.messages || []
            allMessages.push(...gossip.map(m => ({ ...m, channelType: 'gossip' })))
        }

        // Sort by timestamp descending and take last 5
        recentMessages.value = allMessages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)

    } catch (error) {
        console.error('Failed to load recent messages:', error)
    } finally {
        isLoadingMessages.value = false
    }
}

const loadActiveVoting = async () => {
    try {
        const response = await apiMethods.voting.getByCommitteeId(committee.value._id)
        if (response.data.success) {
            const active = response.data.voting?.find(v => v.status === 'active')
            activeVoting.value = active || null
        }
    } catch (error) {
        console.error('Failed to load active voting:', error)
    }
}

// Actions
const markAttendance = async (status) => {
    if (!currentSession.value || isMarkingAttendance.value) return

    try {
        isMarkingAttendance.value = true

        const response = await sessionApi.rollCall.markAttendance(currentSession.value._id, {
            country: userCountry.value,
            status: status
        })

        if (response.data.success) {
            attendanceStatus.value = status
            showAttendanceModal.value = false
            toast.success('Attendance marked successfully')

            // Reload session details
            await loadActiveSession()
        }
    } catch (error) {
        console.error('Failed to mark attendance:', error)
        toast.error(error.response?.data?.error || 'Failed to mark attendance')
    } finally {
        isMarkingAttendance.value = false
    }
}

const requestToSpeak = async () => {
    if (!canRequestSpeak.value || !currentSession.value) return

    try {
        const response = await apiMethods.sessions.addToSpeakersList(currentSession.value._id, {
            country: userCountry.value
        })

        if (response.data.success) {
            speakerLists.value = response.data.speakerLists
            toast.success('Added to speakers list')
        }
    } catch (error) {
        console.error('Failed to request to speak:', error)
        toast.error(error.response?.data?.error || 'Failed to add to speakers list')
    }
}

const pointOfOrder = async () => {
    if (!canTakeActions.value) return

    // This would typically trigger a notification to presidium
    toast.success('Point of order submitted to chairperson')
}

const rightOfReply = async () => {
    if (!canTakeActions.value) return

    // This would typically trigger a notification to presidium
    toast.success('Right of reply requested')
}

// WebSocket Listeners
const setupWebSocketListeners = () => {
    if (!currentSession.value) return

    // Join committee room
    if (committee.value?._id) {
        wsService.emit('join-committee-room', {
            committeeId: committee.value._id
        })
    }

    // Roll call events
    wsService.on('roll-call-started', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallActive.value = true
            toast.log('Roll call started - Please mark your attendance')
            if (!isMarkedPresent.value) {
                showAttendanceModal.value = true
            }
        }
    })

    wsService.on('roll-call-ended', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallActive.value = false
            speakerLists.value = data.speakerLists || speakerLists.value
            toast.log('Roll call ended')
        }
    })

    // Attendance updates
    wsService.on('attendance-updated', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            // Reload session to get updated attendance
            loadActiveSession()
        }
    })

    // Speaker events
    wsService.on('current-speaker-set', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.currentSpeaker
            speakerLists.value = data.speakerLists || speakerLists.value

            if (data.speakerTimer) {
                speakerTimer.value = data.speakerTimer
            }

            if (data.currentSpeaker?.country === userCountry.value) {
                toast.success('You are now speaking!')
            }
        }
    })

    wsService.on('speaker-moved', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            speakerLists.value = data.speakerLists || speakerLists.value
        }
    })

    // Timer events
    wsService.on('timer-toggled', (data) => {
        if (data.sessionId === currentSession.value?._id && data.timerType === 'speaker') {
            speakerTimer.value = data.timer
        }
    })

    wsService.on('timer-adjusted', (data) => {
        if (data.sessionId === currentSession.value?._id && data.timerType === 'speaker') {
            speakerTimer.value = data.timer
        }
    })

    // Voting events
    wsService.on('voting-started', (data) => {
        if (data.committeeId === committee.value?._id) {
            activeVoting.value = data.voting
            toast.success('New voting started!')
        }
    })

    wsService.on('voting-ended', (data) => {
        if (data.votingId === activeVoting.value?._id) {
            activeVoting.value = null
            toast.log('Voting ended')
        }
    })

    // Message events
    wsService.on('committee-message-received', (data) => {
        if (data.committeeId === committee.value?._id) {
            const newMessage = {
                _id: data.messageId,
                senderCountry: data.senderCountry,
                content: data.content,
                timestamp: data.timestamp,
                channelType: data.channelType
            }

            recentMessages.value.unshift(newMessage)
            if (recentMessages.value.length > 5) {
                recentMessages.value = recentMessages.value.slice(0, 5)
            }
        }
    })
}

// Lifecycle
onMounted(async () => {
    await loadDashboardData()

    // Update speaker timer every second
    timerUpdateInterval = setInterval(() => {
        if (speakerTimer.value?.isActive && !speakerTimer.value?.isPaused) {
            speakerTimer.value = { ...speakerTimer.value }
        }
    }, 1000)
})

onUnmounted(() => {
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval)
    }
})
</script>