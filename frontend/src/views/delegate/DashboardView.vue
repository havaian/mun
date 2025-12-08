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
                            STATUS: <span :class="attendanceStatusClass">{{ attendanceStatus }}</span>
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div :class="[
                            'px-3 py-1 rounded-full text-sm font-medium',
                            sessionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        ]">
                            {{ sessionStatus === 'active' ? 'Listening' : 'Session Inactive' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left Column: Floor Actions -->
                <div class="space-y-6">
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
                        <div class="flex items-center space-x-3">
                            <SpeakerWaveIcon class="w-6 h-6" />
                            <h3 class="text-lg font-semibold">CURRENT SPEAKER</h3>
                        </div>
                        <div class="mt-4">
                            <p class="text-3xl font-bold">{{ currentSpeaker || 'None' }}</p>
                            <div v-if="currentSpeaker && speakerTimeRemaining" class="mt-2 text-sm text-gray-300">
                                Time remaining: {{ formattedSpeakerTime }}
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div v-if="activeVoting" class="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-red-800">Active Voting</h3>
                                <p class="text-sm text-red-600">{{ activeVoting.subject }}</p>
                            </div>
                            <RouterLink to="/delegate/voting"
                                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                                Vote Now
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Session Info -->
                <div class="space-y-6">
                    <!-- Session Status -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Session Information</h2>

                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Current Mode</span>
                                <span class="font-medium">{{ formatSessionMode(sessionMode) }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Quorum Status</span>
                                <span :class="[
                                    'font-medium',
                                    hasQuorum ? 'text-green-600' : 'text-red-600'
                                ]">
                                    {{ hasQuorum ? 'Achieved' : 'Not Met' }}
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Present Delegates</span>
                                <span class="font-medium">{{ presentCount }}/{{ totalDelegates }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Speaker Queue -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Speakers List</h2>

                        <div v-if="speakersList.length === 0" class="text-center text-gray-500 py-4">
                            No speakers in queue
                        </div>
                        <div v-else class="space-y-2">
                            <div v-for="(speaker, index) in speakersList.slice(0, 5)" :key="speaker.country" :class="[
                                'flex items-center justify-between p-3 rounded-lg',
                                index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                            ]">
                                <span class="font-medium">{{ index + 1 }}. {{ speaker.country }}</span>
                                <span v-if="index === 0" class="text-xs text-blue-600 font-medium">NEXT</span>
                            </div>
                            <div v-if="speakersList.length > 5" class="text-center text-sm text-gray-500 pt-2">
                                +{{ speakersList.length - 5 }} more speakers
                            </div>
                        </div>
                    </div>

                    <!-- Coalition Status -->
                    <div v-if="userCoalition" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-4">Coalition Status</h2>

                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Coalition</span>
                                <span class="font-medium">{{ userCoalition.name }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Role</span>
                                <span :class="[
                                    'font-medium',
                                    userCoalition.isLeader ? 'text-blue-600' : 'text-gray-900'
                                ]">
                                    {{ userCoalition.isLeader ? 'Leader' : 'Member' }}
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Members</span>
                                <span class="font-medium">{{ userCoalition.memberCount }}</span>
                            </div>
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
                <!-- Recent Messages -->
                <div v-for="message in recentMessages" :key="message.id" class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-medium text-sm">{{ message.sender }}</span>
                        <span class="text-xs text-gray-500">{{ message.time }}</span>
                    </div>
                    <p class="text-sm text-gray-700">{{ message.content }}</p>
                </div>

                <div v-if="recentMessages.length === 0" class="text-center text-gray-500 py-8">
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    HandRaisedIcon, SpeakerWaveIcon, ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const userCountry = ref('Chile')
const attendanceStatus = ref('NOT MARKED')
const sessionStatus = ref('active')
const sessionMode = ref('formal')
const currentSpeaker = ref(null)
const speakerTimeRemaining = ref(90)
const isInSpeakersList = ref(false)
const activeVoting = ref(null)
const hasQuorum = ref(false)
const presentCount = ref(25)
const totalDelegates = ref(50)

// Coalition data
const userCoalition = ref(null)

// Speakers list
const speakersList = ref([
    { country: 'United States', position: 1 },
    { country: 'United Kingdom', position: 2 },
    { country: 'France', position: 3 },
])

// Messages
const recentMessages = ref([
    {
        id: 1,
        sender: 'Chairperson',
        content: 'Session will resume in 5 minutes.',
        time: '09:01 AM'
    },
    {
        id: 2,
        sender: 'Anonymous',
        content: 'Did anyone see the amendment from Russian Federation?',
        time: '09:01 AM'
    },
    {
        id: 3,
        sender: 'Anonymous',
        content: 'The coffee break needs to be longer!',
        time: '09:01 AM'
    }
])

// Computed
const isMarkedPresent = computed(() => attendanceStatus.value !== 'NOT MARKED')
const canRequestSpeak = computed(() => isMarkedPresent.value && !isInSpeakersList.value)
const canTakeActions = computed(() => isMarkedPresent.value)

const attendanceStatusClass = computed(() => {
    switch (attendanceStatus.value) {
        case 'PRESENT_AND_VOTING':
            return 'text-green-600 font-medium'
        case 'PRESENT':
            return 'text-blue-600 font-medium'
        case 'NOT MARKED':
        default:
            return 'text-red-600 font-medium'
    }
})

const formattedSpeakerTime = computed(() => {
    const minutes = Math.floor(speakerTimeRemaining.value / 60)
    const seconds = speakerTimeRemaining.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Methods
const formatSessionMode = (mode) => {
    const modeMap = {
        'formal': 'Formal Debate',
        'moderated': 'Moderated Caucus',
        'unmoderated': 'Unmoderated Caucus',
        'informal': 'Informal Consultation'
    }
    return modeMap[mode] || 'Unknown Mode'
}

const requestToSpeak = async () => {
    if (!canRequestSpeak.value) return

    try {
        // API call would go here
        isInSpeakersList.value = true
        toast.success('Added to speakers list')
    } catch (error) {
        console.error('Failed to request to speak:', error)
        toast.error('Failed to add to speakers list')
    }
}

const pointOfOrder = async () => {
    if (!canTakeActions.value) return

    try {
        // API call would go here
        toast.success('Point of order submitted')
    } catch (error) {
        toast.error('Failed to submit point of order')
    }
}

const rightOfReply = async () => {
    if (!canTakeActions.value) return

    try {
        // API call would go here
        toast.success('Right of reply requested')
    } catch (error) {
        toast.error('Failed to request right of reply')
    }
}

// Load initial data
const loadDashboardData = async () => {
    try {
        // Mock data - in real app would come from API
        hasQuorum.value = presentCount.value >= Math.floor(totalDelegates.value / 2) + 1

        // Check for active voting
        // activeVoting.value = {
        //     subject: 'Amendment to Resolution A/RES/123',
        //     timeRemaining: 300
        // }
    } catch (error) {
        console.error('Failed to load dashboard data:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadDashboardData()
})
</script>