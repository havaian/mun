<template>
    <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            <!-- Header -->
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center gap-3 text-blue-600 font-bold text-xl mb-4">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <GlobeAltIcon class="w-5 h-5" />
                    </div>
                    <span>mun.uz</span>
                </div>
                <p class="text-sm text-gray-500 mb-4">{{ committeeInfo?.name || 'UN General Assembly' }}</p>

                <!-- User Info -->
                <div class="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-lg border">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon class="w-5 h-5 text-blue-600" />
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-sm font-semibold text-gray-900 truncate">
                            {{ authStore.user?.name || 'Chairperson' }}
                        </p>
                        <p class="text-xs text-gray-500">{{ authStore.user?.presidiumRole || 'Presidium' }}</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                <!-- Main Navigation -->
                <div class="space-y-1">
                    <RouterLink v-for="item in mainNavigation" :key="item.name" :to="item.to"
                        :class="getNavLinkClass(item.name)">
                        <div class="flex items-center gap-3">
                            <component :is="item.icon" class="w-5 h-5" />
                            <span class="font-medium">{{ item.label }}</span>
                        </div>
                        <span v-if="item.badge" :class="getBadgeClass(item.badgeType)">
                            {{ item.badge }}
                        </span>
                    </RouterLink>
                </div>

                <!-- Presentation Section -->
                <div class="pt-6 mt-6 border-t border-gray-100">
                    <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        PRESENTATION
                    </p>
                    <div class="space-y-1">
                        <RouterLink v-for="item in presentationNavigation" :key="item.name" :to="item.to"
                            :class="getNavLinkClass(item.name)">
                            <div class="flex items-center gap-3">
                                <component :is="item.icon" class="w-5 h-5" />
                                <span class="font-medium">{{ item.label }}</span>
                            </div>
                        </RouterLink>
                    </div>
                </div>
            </nav>

            <!-- Logout -->
            <div class="p-4 border-t border-gray-200">
                <button @click="handleLogout"
                    class="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <ArrowRightOnRectangleIcon class="w-5 h-5" />
                    <span class="font-medium">Logout</span>
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-hidden">
            <RouterView />
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    GlobeAltIcon, UserIcon, ArrowRightOnRectangleIcon,
    RectangleGroupIcon, UsersIcon, ShieldCheckIcon, DocumentTextIcon,
    HandRaisedIcon, ChatBubbleLeftRightIcon, PresentationChartBarIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// State
const committeeInfo = ref(null)
const currentSession = ref(null)
const attendanceCount = ref(0)
const pendingDocuments = ref(0)

// Navigation Configuration
const mainNavigation = computed(() => [
    {
        name: 'PresidiumDashboard',
        label: 'Presidium Console',
        to: '/presidium',
        icon: RectangleGroupIcon
    },
    {
        name: 'PresidiumAttendance',
        label: 'Roll Call',
        to: '/presidium/attendance',
        icon: UsersIcon,
        badge: attendanceCount.value > 0 ? attendanceCount.value : null,
        badgeType: 'info'
    },
    {
        name: 'PresidiumCoalitions',
        label: 'Coalitions',
        to: '/presidium/coalitions',
        icon: ShieldCheckIcon
    },
    {
        name: 'PresidiumDocuments',
        label: 'Documents',
        to: '/presidium/documents',
        icon: DocumentTextIcon,
        badge: pendingDocuments.value > 0 ? pendingDocuments.value : null,
        badgeType: 'warning'
    },
    {
        name: 'PresidiumVoting',
        label: 'Voting',
        to: '/presidium/voting',
        icon: HandRaisedIcon
    },
    {
        name: 'PresidiumMessaging',
        label: 'Diplomacy',
        to: '/presidium/messaging',
        icon: ChatBubbleLeftRightIcon
    }
])

const presentationNavigation = computed(() => [
    {
        name: 'PresidiumPublicDisplay',
        label: 'Public Display',
        to: '/presidium/public-display',
        icon: PresentationChartBarIcon
    }
])

// Methods
const getNavLinkClass = (routeName) => {
    const baseClasses = 'flex items-center justify-between px-3 py-2.5 text-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 group'
    return route.name === routeName
        ? `${baseClasses} bg-blue-50 text-blue-700 shadow-sm border border-blue-100`
        : baseClasses
}

const getBadgeClass = (type = 'default') => {
    const baseClasses = 'ml-auto px-2 py-0.5 text-xs font-medium rounded-full'

    const typeClasses = {
        'info': 'bg-blue-100 text-blue-700',
        'warning': 'bg-orange-100 text-orange-700',
        'success': 'bg-green-100 text-green-700',
        'danger': 'bg-red-100 text-red-700',
        'live': 'bg-red-500 text-white animate-pulse',
        'default': 'bg-gray-100 text-gray-700'
    }

    return `${baseClasses} ${typeClasses[type] || typeClasses.default}`
}

const handleLogout = async () => {
    try {
        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/login')
    } catch (error) {
        console.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

// Load initial data
const loadLayoutData = async () => {
    try {
        // Load committee info
        committeeInfo.value = {
            name: 'UN General Assembly'
        }

        // Load session status
        currentSession.value = {
            status: 'active',
            mode: 'formal'
        }

        // Load counts
        attendanceCount.value = 0
        pendingDocuments.value = 0
    } catch (error) {
        console.error('Failed to load layout data:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadLayoutData()
})
</script>