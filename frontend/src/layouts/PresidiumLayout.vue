<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Sidebar -->
        <UniversalSidebar :sidebar-collapsed="appStore.sidebarCollapsed" user-role="presidium" :user="authStore.user"
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
    CalendarDaysIcon,
    DocumentTextIcon,
    HandRaisedIcon,
    ClockIcon,
    PlayIcon,
    PauseIcon,
    ClipboardDocumentListIcon,
    UserIcon,
    CogIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const currentSession = ref(null)
const committeeInfo = ref(null)
const sessionTimer = ref('')
const attendanceCount = ref(0)
const pendingDocuments = ref(0)

// Navigation Configuration
const primaryNavigation = computed(() => [
    {
        name: 'PresidiumDashboard',
        label: 'Dashboard',
        to: '/presidium',
        icon: ChartBarIcon
    }
])

const navigationSections = computed(() => [
    {
        title: 'Committee Management',
        items: [
            {
                name: 'PresidiumSessions',
                label: 'Session Management',
                to: '/presidium/sessions',
                icon: CalendarDaysIcon,
                badge: currentSession.value?.status === 'active' ? 'LIVE' : null,
                badgeType: 'live'
            },
            // {
            //     name: 'PresidiumDocuments',
            //     label: 'Document Review',
            //     to: '/presidium/documents',
            //     icon: DocumentTextIcon,
            //     badge: pendingDocuments.value > 0 ? pendingDocuments.value : null,
            //     badgeType: 'warning'
            // },
            // {
            //     name: 'PresidiumVoting',
            //     label: 'Voting Management',
            //     to: '/presidium/voting',
            //     icon: HandRaisedIcon
            // },
            {
                name: 'PresidiumAttendance',
                label: 'Attendance',
                to: '/presidium/attendance',
                icon: ClockIcon,
                badge: attendanceCount.value > 0 ? attendanceCount.value : null,
                badgeType: 'info'
            }
        ]
    }
])

const quickActions = computed(() => {
    const actions = []

    // Session control actions
    if (!currentSession.value || currentSession.value.status !== 'active') {
        actions.push({
            name: 'start-session',
            label: 'Start Session',
            icon: PlayIcon,
            type: 'success',
            disabled: isLoading.value
        })
    } else {
        actions.push({
            name: 'pause-session',
            label: 'Pause Session',
            icon: PauseIcon,
            type: 'warning',
            disabled: isLoading.value
        })
    }

    // Attendance action
    actions.push({
        name: 'take-attendance',
        label: 'Take Attendance',
        icon: ClipboardDocumentListIcon,
        type: 'primary',
        disabled: isLoading.value
    })

    return actions
})

const currentStatus = computed(() => ({
    title: 'Session Status',
    items: [
        {
            label: 'Current Session',
            value: currentSession.value?.status === 'active' ? 'Active' : 'Inactive',
            indicator: currentSession.value?.status === 'active' ? 'active' : 'inactive'
        }
    ],
    details: currentSession.value ? [
        {
            key: 'mode',
            label: 'Mode',
            value: formatSessionMode(currentSession.value.currentMode)
        },
        {
            key: 'timer',
            label: 'Timer',
            value: sessionTimer.value || 'N/A'
        },
        {
            key: 'present',
            label: 'Present',
            value: attendanceCount.value || 0
        },
        {
            key: 'pending',
            label: 'Pending Docs',
            value: pendingDocuments.value || 0
        }
    ] : [
        {
            key: 'committee',
            label: 'Committee',
            value: committeeInfo.value?.name || 'Loading...'
        },
        {
            key: 'countries',
            label: 'Countries',
            value: committeeInfo.value?.countries?.length || 0
        }
    ]
}))

const userActions = computed(() => [
    {
        name: 'profile',
        label: 'Profile Settings',
        to: '/shared/profile',
        icon: UserIcon
    },
    {
        name: 'committee-settings',
        label: 'Committee Settings',
        to: '/presidium/committee-settings',
        icon: CogIcon
    }
])

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
        case 'start-session':
            await startSession()
            break
        case 'pause-session':
            await pauseSession()
            break
        case 'take-attendance':
            router.push('/presidium/attendance')
            break
        default:
            console.warn('Unknown quick action:', actionName)
    }
}

const startSession = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        // Implementation would depend on your session API
        // const response = await sessionAPI.start(committeeInfo.value.id)

        // Mock implementation
        currentSession.value = {
            id: 'session_1',
            status: 'active',
            currentMode: 'formal',
            startTime: new Date()
        }

        toast.success('Session started successfully')
    } catch (error) {
        console.error('Failed to start session:', error)
        toast.error('Failed to start session')
    } finally {
        isLoading.value = false
    }
}

const pauseSession = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        // Implementation would depend on your session API
        // const response = await sessionAPI.pause(currentSession.value.id)

        // Mock implementation
        if (currentSession.value) {
            currentSession.value.status = 'paused'
        }

        toast.success('Session paused')
    } catch (error) {
        console.error('Failed to pause session:', error)
        toast.error('Failed to pause session')
    } finally {
        isLoading.value = false
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

const loadPresidiumData = async () => {
    try {
        // Load presidium-specific data
        // This would typically come from your API
        committeeInfo.value = {
            name: 'General Assembly',
            countries: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Country ${i + 1}` }))
        }

        // Mock session data
        currentSession.value = {
            id: 'session_1',
            status: 'inactive',
            currentMode: 'formal'
        }

    } catch (error) {
        console.error('Failed to load presidium data:', error)
        toast.error('Failed to load presidium data')
    }
}

// Lifecycle
onMounted(async () => {
    await loadPresidiumData()

    // Set up data refresh interval
    const refreshInterval = setInterval(async () => {
        await loadPresidiumData()
    }, 30000) // Refresh every 30 seconds

    // Cleanup on unmount
    onUnmounted(() => {
        clearInterval(refreshInterval)
    })
})
</script>