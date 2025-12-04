<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Delegate Dashboard</h1>
                <p class="text-mun-gray-600">Representing {{ userCountry?.name || 'Your Country' }}</p>
            </div>
            <div class="flex items-center space-x-3">
                <div class="text-sm text-mun-gray-500">
                    {{ userCommittee?.name || 'Committee' }}
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <DocumentTextIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Documents</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.documents }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <UsersIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Coalitions</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.coalitions }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ChatBubbleLeftIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Messages</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.unreadMessages }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <TrophyIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Ranking</p>
                        <p class="text-2xl font-bold text-mun-gray-900">#{{ stats.ranking }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Session Status -->
        <!-- <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Current Session</h2>
            <div v-if="currentSession" class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-medium text-mun-gray-900">Session {{ currentSession.number }}</p>
                        <p class="text-sm text-mun-gray-600">{{ currentSession.mode }} • {{ formatSessionTime() }}</p>
                    </div>
                    <span :class="[
                        'px-3 py-1 rounded-full text-sm font-medium',
                        currentSession.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                            currentSession.status === 'paused' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                'bg-mun-gray-100 text-mun-gray-700'
                    ]">
                        {{ currentSession.status?.charAt(0).toUpperCase() + currentSession.status?.slice(1) }}
                    </span>
                </div>

                <!-- Speakers List Position
                <div v-if="speakersPosition" class="p-4 bg-mun-blue/5 border border-mun-blue/20 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-mun-blue">You are on the speakers list</p>
                            <p class="text-sm text-mun-gray-600">Position {{ speakersPosition }} in queue</p>
                        </div>
                        <button @click="removeMeFromSpeakers" class="btn-un-secondary px-3 py-2 text-sm">
                            Remove Me
                        </button>
                    </div>
                </div>

                <!-- Current Speaker
                <div v-if="currentSpeaker" class="p-4 bg-mun-yellow-50 border border-mun-yellow-200 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-mun-gray-900">{{ currentSpeaker.country }} is speaking</p>
                            <p class="text-sm text-mun-gray-600">{{ formatTime(currentSpeaker.timeRemaining) }}
                                remaining</p>
                        </div>
                        <div class="text-2xl font-mono font-bold text-mun-yellow-600">
                            {{ formatTime(currentSpeaker.timeRemaining) }}
                        </div>
                    </div>
                </div>

                <!-- Quick Actions
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button @click="joinSpeakersList" :disabled="!!speakersPosition"
                        class="btn-un-primary text-center py-3">
                        <MegaphoneIcon class="w-5 h-5 mx-auto mb-2" />
                        Join Speakers
                    </button>

                    <RouterLink to="/delegate/voting" class="btn-un-secondary text-center py-3">
                        <HandRaisedIcon class="w-5 h-5 mx-auto mb-2" />
                        Voting
                    </RouterLink>

                    <RouterLink to="/delegate/coalitions" class="btn-un-secondary text-center py-3">
                        <UserGroupIcon class="w-5 h-5 mx-auto mb-2" />
                        Coalitions
                    </RouterLink>

                    <RouterLink to="/delegate/messages" class="btn-un-secondary text-center py-3 relative">
                        <ChatBubbleLeftIcon class="w-5 h-5 mx-auto mb-2" />
                        Messages
                        <span v-if="stats.unreadMessages > 0"
                            class="absolute -top-1 -right-1 bg-mun-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {{ stats.unreadMessages }}
                        </span>
                    </RouterLink>
                </div>
            </div>

            <div v-else class="text-center py-8">
                <ClockIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Active Session</h3>
                <p class="mt-2 text-mun-gray-600">Committee session has not started yet</p>
            </div>
        </div> -->

        <!-- Recent Activity & Tasks -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- My Documents -->
            <div class="mun-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900">My Documents</h3>
                    <RouterLink to="/delegate/documents"
                        class="text-mun-blue hover:text-mun-blue-600 text-sm font-medium">
                        View All
                    </RouterLink>
                </div>
                <div class="space-y-3">
                    <div v-for="doc in recentDocuments" :key="doc.id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                        <div>
                            <p class="font-medium text-mun-gray-900">{{ doc.title }}</p>
                            <p class="text-sm text-mun-gray-600">{{ doc.type }}</p>
                        </div>
                        <span :class="[
                            'px-2 py-1 rounded text-xs font-medium',
                            doc.status === 'pending' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                doc.status === 'approved' ? 'bg-mun-green-100 text-mun-green-700' :
                                    'bg-mun-red-100 text-mun-red-700'
                        ]">
                            {{ doc.status }}
                        </span>
                    </div>
                    <div v-if="recentDocuments.length === 0" class="text-center py-4 text-mun-gray-500">
                        No documents uploaded yet
                        <br>
                        <RouterLink to="/delegate/documents" class="text-mun-blue hover:text-mun-blue-600">
                            Upload your first document
                        </RouterLink>
                    </div>
                </div>
            </div>

            <!-- Recent Notifications -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Recent Activity</h3>
                <div class="space-y-3">
                    <div v-for="notification in recentNotifications" :key="notification.id"
                        class="flex items-start space-x-3">
                        <div :class="[
                            'flex-shrink-0 w-2 h-2 rounded-full mt-2',
                            notification.type === 'coalition' ? 'bg-mun-green-500' :
                                notification.type === 'voting' ? 'bg-mun-red-500' :
                                    notification.type === 'message' ? 'bg-mun-yellow-500' :
                                        'bg-mun-blue'
                        ]"></div>
                        <div>
                            <p class="text-sm text-mun-gray-900">{{ notification.title }}</p>
                            <p class="text-xs text-mun-gray-500">{{ formatTime(notification.timestamp) }}</p>
                        </div>
                    </div>
                    <div v-if="recentNotifications.length === 0" class="text-center py-4 text-mun-gray-500">
                        No recent activity
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Coalitions -->
        <div v-if="activeCoalitions.length > 0" class="mun-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-mun-gray-900">My Coalitions</h3>
                <RouterLink to="/delegate/coalitions" class="text-mun-blue hover:text-mun-blue-600 text-sm font-medium">
                    Manage All
                </RouterLink>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="coalition in activeCoalitions" :key="coalition.id"
                    class="p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-mun-gray-900">{{ coalition.name }}</h4>
                        <span :class="[
                            'px-2 py-1 rounded text-xs font-medium',
                            coalition.isHead ? 'bg-mun-blue/10 text-mun-blue' : 'bg-mun-gray-100 text-mun-gray-600'
                        ]">
                            {{ coalition.isHead ? 'Head' : 'Member' }}
                        </span>
                    </div>
                    <p class="text-sm text-mun-gray-600 mb-2">{{ coalition.members.length }} members</p>
                    <div class="text-xs text-mun-gray-500">
                        {{ coalition.members.slice(0, 3).join(', ') }}
                        <span v-if="coalition.members.length > 3">+{{ coalition.members.length - 3 }} more</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    DocumentTextIcon,
    UsersIcon,
    ChatBubbleLeftIcon,
    TrophyIcon,
    ClockIcon,
    MegaphoneIcon,
    HandRaisedIcon,
    UserGroupIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const userCountry = ref(null)
const userCommittee = ref(null)
const currentSession = ref(null)
const currentSpeaker = ref(null)
const speakersPosition = ref(null)

const stats = reactive({
    documents: 0,
    coalitions: 0,
    unreadMessages: 0,
    ranking: 0
})

const recentDocuments = ref([])
const recentNotifications = ref([])
const activeCoalitions = ref([])

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true

        // Load user country and committee info
        userCountry.value = {
            name: authStore.user?.countryName || "United States",
            code: "US"
        }

        userCommittee.value = {
            name: "General Assembly",
            id: authStore.user?.committeeId
        }

        // Load current session
        currentSession.value = {
            number: 1,
            status: 'active',
            mode: 'Formal Debate',
            startedAt: new Date().toISOString()
        }

        // Current speaker
        currentSpeaker.value = {
            country: "United Kingdom",
            timeRemaining: 90
        }

        // Speakers position
        speakersPosition.value = 3

        // Load stats
        stats.documents = 2
        stats.coalitions = 1
        stats.unreadMessages = 5
        stats.ranking = 12

        // Load recent documents
        recentDocuments.value = [
            {
                id: 1,
                title: "Position Paper",
                type: "Position Paper",
                status: "approved"
            },
            {
                id: 2,
                title: "Draft Resolution A/1",
                type: "Resolution",
                status: "pending"
            }
        ]

        // Load notifications
        recentNotifications.value = [
            {
                id: 1,
                title: "Invited to join Coalition on Climate Action",
                type: "coalition",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                title: "New voting session started",
                type: "voting",
                timestamp: new Date(Date.now() - 300000).toISOString()
            },
            {
                id: 3,
                title: "Message from France",
                type: "message",
                timestamp: new Date(Date.now() - 600000).toISOString()
            }
        ]

        // Load active coalitions
        activeCoalitions.value = [
            {
                id: 1,
                name: "Climate Action Alliance",
                isHead: false,
                members: ["France", "Germany", "United Kingdom", "Canada"]
            }
        ]

    } catch (error) {
        toast.error('Load dashboard error:', error)
        toast.error('Failed to load dashboard data')
    } finally {
        isLoading.value = false
    }
}

const formatSessionTime = () => {
    if (!currentSession.value?.startedAt) return '--:--'

    const now = new Date()
    const start = new Date(currentSession.value.startedAt)
    const diff = Math.floor((now - start) / 1000)
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)

    return `${hours}:${minutes.toString().padStart(2, '0')}`
}

const formatTime = (value) => {
    if (typeof value === 'string') {
        // It's a timestamp
        const date = new Date(value)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        if (diffMins < 60) {
            return `${diffMins}m ago`
        } else if (diffHours < 24) {
            return `${diffHours}h ago`
        } else {
            return date.toLocaleDateString()
        }
    } else {
        // It's seconds for timer
        const mins = Math.floor(value / 60)
        const secs = value % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }
}

const joinSpeakersList = async () => {
    try {
        // TODO: API call to join speakers list
        speakersPosition.value = 8 // Example position
        toast.success('Added to speakers list')
    } catch (error) {
        toast.error('Join speakers error:', error)
        toast.error('Failed to join speakers list')
    }
}

const removeMeFromSpeakers = async () => {
    try {
        speakersPosition.value = null
        toast.success('Removed from speakers list')
    } catch (error) {
        toast.error('Remove speakers error:', error)
        toast.error('Failed to remove from speakers list')
    }
}

// Lifecycle
onMounted(() => {
    loadDashboardData()
})
</script>