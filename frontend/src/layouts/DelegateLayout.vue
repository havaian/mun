<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Sidebar -->
        <UniversalSidebar :sidebar-collapsed="appStore.sidebarCollapsed" user-role="delegate" :user="authStore.user"
            :primary-navigation="primaryNavigation" :navigation-sections="navigationSections"
            :quick-actions="quickActions" :current-status="currentStatus" :user-actions="userActions"
            @toggle-sidebar="appStore.toggleSidebar" @quick-action="handleQuickAction" @logout="handleLogout" />

        <!-- Main Content -->
        <div :class="[
            'transition-all duration-200 ease-in-out',
            appStore.sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-72'
        ]">
            <main class="min-h-screen bg-mun-gray-50">
                <router-view />
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
                        <SleekSelect v-model="motionForm.type" :options="[
                            { label: 'Moderated Caucus', value: 'moderated_caucus' },
                            { label: 'Unmoderated Caucus', value: 'unmoderated_caucus' },
                            { label: 'Previous Question', value: 'previous_question' },
                            { label: 'Extend Debate Time', value: 'extend_debate' }
                        ]" placeholder="Select motion type" container-class="w-full" />
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import UniversalSidebar from '@/components/layout/UniversalSidebar.vue'

// Icons
import {
    ChartBarIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    DocumentPlusIcon,
    ExclamationTriangleIcon,
    UserIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
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

// Navigation Configuration
const primaryNavigation = computed(() => [
    {
        name: 'DelegateDashboard',
        label: 'Dashboard',
        to: '/delegate',
        icon: ChartBarIcon
    }
])

const navigationSections = computed(() => [
    {
        title: 'Committee Participation',
        items: [
            {
                name: 'DelegateDocuments',
                label: 'Documents',
                to: '/delegate/documents',
                icon: DocumentTextIcon,
                badge: pendingDocuments.value > 0 ? pendingDocuments.value : null,
                badgeType: 'warning'
            },
            {
                name: 'DelegateVoting',
                label: 'Voting',
                to: '/delegate/voting',
                icon: HandRaisedIcon,
                badge: activeVoting.value ? 'LIVE' : null,
                badgeType: 'danger'
            },
            {
                name: 'DelegateMessaging',
                label: 'Messages',
                to: '/delegate/messaging',
                icon: ChatBubbleLeftRightIcon,
                badge: unreadMessages.value > 0 ? unreadMessages.value : null,
                badgeType: 'info'
            },
            {
                name: 'DelegateCoalitions',
                label: 'Coalitions',
                to: '/delegate/coalitions',
                icon: UserGroupIcon,
                badge: userCoalition.value ? 'ACTIVE' : null,
                badgeType: 'success'
            }
        ]
    }
])

const quickActions = computed(() => {
    const actions = []

    // Join Speakers List
    actions.push({
        name: 'join-speakers',
        label: isInSpeakersList.value ? 'In Speakers List' : 'Join Speakers',
        icon: HandRaisedIcon,
        type: isInSpeakersList.value ? 'success' : 'primary',
        disabled: isInSpeakersList.value || !canJoinSpeakers.value
    })

    // Submit Motion
    actions.push({
        name: 'submit-motion',
        label: 'Submit Motion',
        icon: DocumentPlusIcon,
        type: 'secondary',
        disabled: !canSubmitMotion.value
    })

    // Active Voting Alert
    if (activeVoting.value) {
        actions.push({
            name: 'vote-now',
            label: 'Vote Now!',
            icon: ExclamationTriangleIcon,
            type: 'danger',
            badge: 'LIVE'
        })
    }

    // Coalition Management
    actions.push({
        name: 'manage-coalition',
        label: userCoalition.value ? 'Manage Coalition' : 'Join Coalition',
        icon: UserGroupIcon,
        type: 'info',
        disabled: !canManageCoalition.value
    })

    return actions
})

const currentStatus = computed(() => ({
    title: 'Current Status',
    items: [
        {
            label: 'Session Status',
            value: isSessionActive.value ? 'Active' : 'Inactive',
            indicator: isSessionActive.value ? 'active' : 'inactive'
        },
        ...(activeVoting.value ? [{
            label: 'Active Voting',
            value: 'LIVE',
            indicator: 'active'
        }] : []),
        ...(userCoalition.value ? [{
            label: 'Coalition',
            value: userCoalition.value.status,
            indicator: 'active'
        }] : [])
    ],
    details: [
        ...(currentSession.value ? [{
            key: 'mode',
            label: 'Mode',
            value: formatSessionMode(currentSession.value.currentMode)
        }] : []),
        ...(currentSpeaker.value ? [{
            key: 'speaker',
            label: 'Speaker',
            value: currentSpeaker.value
        }] : []),
        ...(activeVoting.value ? [{
            key: 'voting',
            label: 'Voting',
            value: activeVoting.value.title
        }] : []),
        ...(userCoalition.value ? [
            {
                key: 'coalition-name',
                label: 'Coalition',
                value: userCoalition.value.name
            },
            {
                key: 'coalition-members',
                label: 'Members',
                value: userCoalition.value.memberCount
            }
        ] : []),
        {
            key: 'speeches',
            label: 'Speeches',
            value: delegateStats.value.speechesGiven || 0
        },
        {
            key: 'votes',
            label: 'Votes Cast',
            value: delegateStats.value.votesCast || 0
        }
    ]
}))

const userActions = computed(() => [
    {
        name: 'profile',
        label: 'Profile Settings',
        to: '/shared/profile',
        icon: UserIcon
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

const handleQuickAction = async (actionName) => {
    switch (actionName) {
        case 'join-speakers':
            await joinSpeakersList()
            break
        case 'submit-motion':
            openMotionModal()
            break
        case 'vote-now':
            router.push('/delegate/voting')
            break
        case 'manage-coalition':
            router.push('/delegate/coalitions')
            break
        default:
            console.warn('Unknown quick action:', actionName)
    }
}

const joinSpeakersList = async () => {
    if (!canJoinSpeakers.value) return

    try {
        // Implementation would depend on your speakers list API
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
        toast.success('Motion submitted successfully')
        showMotionModal.value = false
        motionForm.value = { type: '', justification: '' }
    } catch (error) {
        console.error('Failed to submit motion:', error)
        toast.error('Failed to submit motion')
    }
}

const handleLogout = async () => {
    try {
        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/auth/login')
    } catch (error) {
        console.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

const loadDelegateData = async () => {
    try {
        // Load delegate-specific data
        userCountry.value = {}

        committeeInfo.value = {}

        delegateStats.value = {}

        // Mock session data
        currentSession.value = {}

        // Mock coalition data
        userCoalition.value = {}

        currentSpeaker.value = currentSession.value.currentSpeaker

    } catch (error) {
        console.error('Failed to load delegate data:', error)
        toast.error('Failed to load delegate data')
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