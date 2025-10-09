<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Navbar -->
        <UniversalNavbar />

        <!-- Delegate Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-mun-lg transition-transform duration-300',
            'mt-16', // Add margin top for navbar
            { '-translate-x-full': appStore.sidebarCollapsed }
        ]">
            <!-- Sidebar Header -->
            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                <div class="flex items-center space-x-3">
                    <!-- Country Flag Placeholder -->
                    <div
                        class="w-10 h-8 bg-mun-red-500 rounded-lg flex items-center justify-center border border-mun-gray-300">
                        <span class="text-white text-xs font-bold">
                            {{ getCountryCode() }}
                        </span>
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-mun-gray-900">{{ userCountry?.name || 'Delegate' }}</h2>
                        <p class="text-sm text-mun-gray-500">{{ committeeInfo?.name || 'Committee' }}</p>
                    </div>
                </div>

                <button @click="appStore.toggleSidebar"
                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors lg:hidden">
                    <XMarkIcon class="w-5 h-5 text-mun-gray-600" />
                </button>
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                <RouterLink v-for="item in navigationItems" :key="item.name" :to="item.to" class="nav-link group"
                    :class="{ 'active': $route.name === item.name }">
                    <component :is="item.icon" class="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{{ item.label }}</span>
                    <span v-if="item.badge"
                        class="ml-auto px-2 py-1 text-xs font-medium bg-mun-red-500 text-white rounded-full">
                        {{ item.badge }}
                    </span>
                </RouterLink>
            </nav>

            <!-- Quick Actions -->
            <div class="p-4 border-t border-mun-gray-100">
                <div class="space-y-2">
                    <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider mb-3">
                        Quick Actions
                    </h4>

                    <!-- Join Speakers List -->
                    <button @click="joinSpeakersList" :disabled="isInSpeakersList || !canJoinSpeakers"
                        class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        :class="isInSpeakersList ? 'text-green-700 bg-green-100' : 'text-mun-blue-700 bg-mun-blue-100 hover:bg-mun-blue-200'">
                        <HandRaisedIcon class="w-4 h-4 mr-2" />
                        {{ isInSpeakersList ? 'In Speakers List' : 'Join Speakers' }}
                    </button>

                    <!-- Submit Motion -->
                    <button @click="openMotionModal" :disabled="!canSubmitMotion"
                        class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-mun-purple-700 bg-mun-purple-100 hover:bg-mun-purple-200 rounded-lg transition-colors disabled:opacity-50">
                        <DocumentPlusIcon class="w-4 h-4 mr-2" />
                        Submit Motion
                    </button>

                    <!-- Quick Vote -->
                    <button v-if="activeVoting" @click="$router.push('/delegate/voting')"
                        class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors animate-pulse">
                        <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
                        Vote Now!
                    </button>
                </div>
            </div>

            <!-- Current Status -->
            <div class="border-t border-mun-gray-100 p-4">
                <div class="space-y-3">
                    <!-- Session Status -->
                    <div class="text-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-mun-gray-600">Session Status</span>
                            <div class="flex items-center space-x-2">
                                <div :class="[
                                    'w-2 h-2 rounded-full',
                                    isSessionActive ? 'bg-green-500' : 'bg-gray-400'
                                ]"></div>
                                <span class="text-xs font-medium">
                                    {{ isSessionActive ? 'Active' : 'Inactive' }}
                                </span>
                            </div>
                        </div>

                        <div v-if="currentSession" class="text-xs text-mun-gray-500">
                            <div>Mode: {{ formatSessionMode(currentSession.currentMode) }}</div>
                            <div v-if="currentSpeaker">Speaker: {{ currentSpeaker }}</div>
                        </div>
                    </div>

                    <!-- Voting Status -->
                    <div v-if="activeVoting" class="text-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-mun-gray-600">Active Voting</span>
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span class="text-xs font-medium text-red-600">LIVE</span>
                            </div>
                        </div>

                        <div class="text-xs text-mun-gray-500">
                            {{ activeVoting.title }}
                        </div>
                    </div>

                    <!-- Personal Stats -->
                    <div class="text-xs text-mun-gray-500">
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <div class="font-semibold text-mun-gray-900">{{ delegateStats.speechesGiven || 0 }}
                                </div>
                                <div>Speeches</div>
                            </div>
                            <div>
                                <div class="font-semibold text-mun-gray-900">{{ delegateStats.votesCast || 0 }}</div>
                                <div>Votes Cast</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div :class="[
            'transition-all duration-300',
            'mt-16', // Add margin top for navbar
            appStore.sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        ]">
            <!-- Page Content -->
            <main class="min-h-screen">
                <RouterView />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!appStore.sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden mt-16"
            @click="appStore.toggleSidebar"></div>

        <!-- Motion Submission Modal -->
        <div v-if="showMotionModal"
            class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Submit Procedural Motion</h3>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">Motion Type</label>
                        <select v-model="motionForm.type"
                            class="w-full border border-mun-gray-300 rounded-lg px-3 py-2">
                            <option value="">Select motion type...</option>
                            <option value="extension">Extension of Debate</option>
                            <option value="closure">Closure of Debate</option>
                            <option value="recess">Recess</option>
                            <option value="adjournment">Adjournment</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">Justification</label>
                        <textarea v-model="motionForm.justification" rows="3"
                            class="w-full border border-mun-gray-300 rounded-lg px-3 py-2"
                            placeholder="Provide justification for this motion..."></textarea>
                    </div>
                </div>

                <div class="flex items-center justify-end space-x-3 mt-6">
                    <button @click="showMotionModal = false"
                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button @click="submitMotion" :disabled="!motionForm.type || !motionForm.justification"
                        class="px-4 py-2 text-sm font-medium text-white bg-mun-blue-600 hover:bg-mun-blue-700 rounded-lg transition-colors disabled:opacity-50">
                        Submit Motion
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useWebSocketStore } from '@/stores/websocket'
import { useToast } from '@/plugins/toast'

// Import the Universal Navbar
import UniversalNavbar from '@/components/shared/UniversalNavbar.vue'

// Icons
import {
    XMarkIcon,
    ChartBarIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    UserIcon,
    DocumentPlusIcon,
    ExclamationTriangleIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

// Stores and composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const showMotionModal = ref(false)
const isInSpeakersList = ref(false)
const currentSession = ref(null)
const committeeInfo = ref(null)
const userCountry = ref(null)
const activeVoting = ref(null)
const currentSpeaker = ref('')
const delegateStats = ref({
    speechesGiven: 0,
    votesCast: 0,
    documentsSubmitted: 0
})

const motionForm = ref({
    type: '',
    justification: ''
})

// Navigation items for delegates
const navigationItems = computed(() => [
    {
        name: 'DelegateDashboard',
        label: 'Dashboard',
        to: '/delegate',
        icon: ChartBarIcon
    },
    {
        name: 'DelegateDocuments',
        label: 'Documents',
        to: '/delegate/documents',
        icon: DocumentTextIcon,
        badge: pendingDocuments.value > 0 ? pendingDocuments.value : null
    },
    {
        name: 'DelegateVoting',
        label: 'Voting',
        to: '/delegate/voting',
        icon: HandRaisedIcon,
        badge: activeVoting.value ? 'LIVE' : null
    },
    {
        name: 'DelegateMessaging',
        label: 'Messages',
        to: '/delegate/messaging',
        icon: ChatBubbleLeftRightIcon,
        badge: unreadMessages.value > 0 ? unreadMessages.value : null
    }
])

// Computed properties
const pendingDocuments = computed(() => {
    // This would come from your document store
    return 0 // Placeholder
})

const unreadMessages = computed(() => {
    // This would come from your messaging store
    return 0 // Placeholder
})

const isSessionActive = computed(() => {
    return currentSession.value?.status === 'active'
})

const canJoinSpeakers = computed(() => {
    return isSessionActive.value && !isInSpeakersList.value
})

const canSubmitMotion = computed(() => {
    return isSessionActive.value
})

const pageTitle = computed(() => {
    const titleMap = {
        'DelegateDashboard': 'Dashboard',
        'DelegateDocuments': 'Documents',
        'DelegateVoting': 'Voting',
        'DelegateMessaging': 'Messages'
    }
    return titleMap[route.name] || 'Delegate Panel'
})

// Methods
const getCountryCode = () => {
    return userCountry.value?.code || authStore.user?.countryCode || 'XX'
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

const joinSpeakersList = async () => {
    if (!canJoinSpeakers.value) return

    try {
        // Implementation would depend on your speakers list API
        // const response = await speakersAPI.join(currentSession.value.id)

        // Mock implementation
        isInSpeakersList.value = true
        toast.success('Added to speakers list')

    } catch (error) {
        console.error('Failed to join speakers list:', error)
        toast.error('Failed to join speakers list')
    }
}

const openMotionModal = () => {
    if (!canSubmitMotion.value) return
    showMotionModal.value = true
}

const submitMotion = async () => {
    if (!motionForm.value.type || !motionForm.value.justification) return

    try {
        // Implementation would depend on your motion API
        // const response = await motionAPI.submit({
        //   type: motionForm.value.type,
        //   justification: motionForm.value.justification,
        //   sessionId: currentSession.value.id
        // })

        // Mock implementation
        toast.success('Motion submitted successfully')
        showMotionModal.value = false
        motionForm.value = { type: '', justification: '' }

    } catch (error) {
        console.error('Failed to submit motion:', error)
        toast.error('Failed to submit motion')
    }
}

const loadDelegateData = async () => {
    try {
        // This would load delegate-specific data from your API
        // const [sessionData, countryData, statsData] = await Promise.all([
        //   sessionAPI.getCurrent(),
        //   countryAPI.get(authStore.user.countryId),
        //   statsAPI.getDelegate(authStore.user.email)
        // ])

        // Mock data for now
        currentSession.value = {
            id: 'session_1',
            status: 'active',
            currentMode: 'formal',
            currentSpeaker: 'United States'
        }

        userCountry.value = {
            name: authStore.user?.countryName || 'Your Country',
            code: authStore.user?.countryCode || 'XX'
        }

        committeeInfo.value = {
            id: 'committee_1',
            name: authStore.user?.committeeName || 'General Assembly'
        }

        delegateStats.value = {
            speechesGiven: Math.floor(Math.random() * 10),
            votesCast: Math.floor(Math.random() * 20),
            documentsSubmitted: Math.floor(Math.random() * 5)
        }

        // Check for active voting
        activeVoting.value = Math.random() > 0.7 ? {
            id: 'voting_1',
            title: 'Resolution A/77/1',
            status: 'active'
        } : null

        currentSpeaker.value = currentSession.value.currentSpeaker

    } catch (error) {
        console.error('Failed to load delegate data:', error)
    }
}

// Lifecycle
onMounted(async () => {
    await loadDelegateData()

    // Set up real-time updates
    if (wsStore?.isConnected) {
        // Subscribe to relevant WebSocket events
        // wsStore.on('session_update', handleSessionUpdate)
        // wsStore.on('voting_started', handleVotingStarted)
        // wsStore.on('speaker_changed', handleSpeakerChanged)
    }

    // Set up data refresh interval
    const refreshInterval = setInterval(async () => {
        await loadDelegateData()
    }, 30000) // Refresh every 30 seconds

    // Cleanup on unmount
    onUnmounted(() => {
        clearInterval(refreshInterval)
    })
})
</script>

<style scoped>
/* Navigation styles */
.nav-link {
    @apply flex items-center px-4 py-3 text-mun-gray-700 rounded-xl;
    @apply transition-all duration-200 hover:bg-white/60 hover:text-mun-blue-600;
    @apply relative;
}

.nav-link.active {
    @apply bg-mun-blue-600 text-white shadow-lg;
}

/* Ensure proper spacing with navbar */
.mt-16 {
    margin-top: 4rem;
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Transition optimizations */
.transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.transition-all {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

/* Animation for active voting */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Z-index management */
.z-40 {
    z-index: 40;
}

.z-50 {
    z-index: 50;
}
</style>