<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Delegate Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-mun-lg transition-transform duration-300',
            { '-translate-x-full': appStore.sidebarCollapsed }
        ]">
            <!-- Sidebar Header -->
            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                <div class="flex items-center space-x-3">
                    <!-- Country Flag -->
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
                <!-- Main Navigation -->
                <div class="space-y-1">
                    <RouterLink v-for="item in navigationItems" :key="item.name" :to="item.to" class="nav-link group"
                        :class="{ 'active': $route.name === item.name }">
                        <component :is="item.icon" class="w-5 h-5 mr-3 flex-shrink-0" />
                        <span>{{ item.label }}</span>
                        <span v-if="item.badge"
                            class="ml-auto px-2 py-1 text-xs font-medium bg-mun-red-500 text-white rounded-full">
                            {{ item.badge }}
                        </span>
                    </RouterLink>
                </div>

                <!-- Delegate Quick Actions -->
                <div class="pt-4 border-t border-mun-gray-100">
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
                        class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-mun-purple-700 bg-mun-purple-100 hover:bg-mun-purple-200 rounded-lg transition-colors disabled:opacity-50 mt-2">
                        <DocumentPlusIcon class="w-4 h-4 mr-2" />
                        Submit Motion
                    </button>

                    <!-- Quick Vote -->
                    <button v-if="activeVoting" @click="$router.push('/delegate/voting')"
                        class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors animate-pulse mt-2">
                        <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
                        Vote Now!
                    </button>

                    <!-- Create/Join Coalition -->
                    <button @click="manageCoalition" :disabled="!canManageCoalition"
                        class="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-mun-green-700 bg-mun-green-100 hover:bg-mun-green-200 rounded-lg transition-colors disabled:opacity-50 mt-2">
                        <UserGroupIcon class="w-4 h-4 mr-2" />
                        {{ userCoalition ? 'Manage Coalition' : 'Join Coalition' }}
                    </button>
                </div>
            </nav>

            <!-- Current Status -->
            <div class="border-t border-mun-gray-100 p-4">
                <div class="space-y-3">
                    <!-- Session Status -->
                    <div class="text-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-mun-gray-600">Session Status</span>
                            <div class="flex items-center space-x-2">
                                <div
                                    :class="['w-2 h-2 rounded-full', isSessionActive ? 'bg-green-500' : 'bg-gray-400']">
                                </div>
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

                    <!-- Coalition Status -->
                    <div v-if="userCoalition" class="text-sm">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-mun-gray-600">Coalition</span>
                            <span class="text-xs font-medium text-mun-green-600">
                                {{ userCoalition.status }}
                            </span>
                        </div>

                        <div class="text-xs text-mun-gray-500">
                            <div>{{ userCoalition.name }}</div>
                            <div>{{ userCoalition.memberCount }} members</div>
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

            <!-- Committee Info -->
            <div class="border-t border-mun-gray-100 p-4">
                <div class="text-sm text-mun-gray-600 mb-2">
                    Committee: {{ committeeInfo?.name || 'Loading...' }}
                </div>
                <div class="text-xs text-mun-gray-500">
                    Topic: {{ committeeInfo?.topic || 'No topic set' }}
                </div>
                <div class="text-xs text-mun-gray-500 mt-1">
                    {{ committeeInfo?.countries?.length || 0 }} delegates present
                </div>
            </div>

            <!-- User Profile -->
            <div class="border-t border-mun-gray-200 p-4">
                <div class="space-y-3">
                    <!-- User Info -->
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-mun-red-500 rounded-full flex items-center justify-center">
                            <UserIcon class="w-5 h-5 text-white" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-mun-gray-900 truncate">
                                {{ authStore.user?.fullName || 'Delegate' }}
                            </p>
                            <p class="text-xs text-mun-gray-500 truncate">
                                {{ userCountry?.name || 'Country' }}
                            </p>
                        </div>
                    </div>

                    <!-- User Actions -->
                    <div class="space-y-1">
                        <router-link to="/shared/profile"
                            class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <UserIcon class="w-4 h-4 mr-3" />
                            Profile Settings
                        </router-link>

                        <button @click="handleLogout"
                            class="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div :class="[
            'transition-all duration-300',
            appStore.sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        ]">
            <main class="min-h-screen">
                <RouterView />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!appStore.sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            @click="appStore.toggleSidebar"></div>

        <!-- Motion Modal -->
        <div v-if="showMotionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">Submit Motion</h3>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Motion Type</label>
                        <select v-model="motionForm.type" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">Select motion type</option>
                            <option value="moderated_caucus">Moderated Caucus</option>
                            <option value="unmoderated_caucus">Unmoderated Caucus</option>
                            <option value="previous_question">Previous Question</option>
                            <option value="extend_debate">Extend Debate Time</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Justification</label>
                        <textarea v-model="motionForm.justification" rows="3"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Provide justification for your motion..."></textarea>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button @click="showMotionModal = false"
                        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button @click="submitMotion" :disabled="!motionForm.type || !motionForm.justification"
                        class="px-4 py-2 bg-mun-blue-600 text-white rounded-lg hover:bg-mun-blue-700 transition-colors disabled:opacity-50">
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
import { useToast } from '@/plugins/toast'

// Icons
import {
    XMarkIcon, ChartBarIcon, DocumentTextIcon, HandRaisedIcon, UserIcon,
    DocumentPlusIcon, ExclamationTriangleIcon, ChatBubbleLeftRightIcon,
    UserGroupIcon, ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

// Stores and composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const showMotionModal = ref(false)
const isInSpeakersList = ref(false)
const currentSession = ref(null)
const committeeInfo = ref(null)
const userCountry = ref(null)
const activeVoting = ref(null)
const currentSpeaker = ref('')
const userCoalition = ref(null)

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
    },
    {
        name: 'DelegateCoalitions',
        label: 'Coalitions',
        to: '/delegate/coalitions',
        icon: UserGroupIcon,
        badge: userCoalition.value ? 'ACTIVE' : null
    }
])

// Computed properties
const pendingDocuments = computed(() => {
    return 0 // This would come from your document store
})

const unreadMessages = computed(() => {
    return 0 // This would come from your messaging store
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

const canManageCoalition = computed(() => {
    return true // Always allow coalition management
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
        isInSpeakersList.value = true
        toast.success('Added to speakers list')
    } catch (error) {
        toast.error('Failed to join speakers list:', error)
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
        toast.success('Motion submitted successfully')
        showMotionModal.value = false
        motionForm.value = { type: '', justification: '' }
    } catch (error) {
        toast.error('Failed to submit motion:', error)
        toast.error('Failed to submit motion')
    }
}

const manageCoalition = () => {
    router.push('/delegate/coalitions')
}

const handleLogout = async () => {
    try {
        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/auth/login')
    } catch (error) {
        toast.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

const loadDelegateData = async () => {
    try {
        // Load delegate-specific data
        userCountry.value = {
            name: 'United States',
            code: 'US'
        }

        committeeInfo.value = {
            name: 'General Assembly',
            topic: 'Climate Change and Sustainable Development',
            countries: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Country ${i + 1}` }))
        }

        delegateStats.value = {
            speechesGiven: 3,
            votesCast: 7,
            documentsSubmitted: 2
        }

        // Mock session data
        currentSession.value = {
            id: 'session_1',
            status: 'active',
            currentMode: 'formal',
            currentSpeaker: 'France'
        }

        // Mock coalition data
        userCoalition.value = {
            name: 'Climate Action Coalition',
            status: 'Active',
            memberCount: 8
        }

        currentSpeaker.value = currentSession.value.currentSpeaker

    } catch (error) {
        toast.error('Failed to load delegate data:', error)
    }
}

// Lifecycle
onMounted(async () => {
    await loadDelegateData()

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
</style>