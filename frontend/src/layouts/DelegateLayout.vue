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
                    <div
                        class="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-lg">
                        {{ countryFlag || '🏳️' }}
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-sm font-semibold text-gray-900 truncate">
                            {{ userCountry }}
                        </p>
                        <p class="text-xs text-gray-500">Delegate</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                <div class="space-y-1">
                    <RouterLink v-for="item in navigationItems" :key="item.name" :to="item.to"
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
    GlobeAltIcon, ArrowRightOnRectangleIcon,
    RectangleGroupIcon, ShieldCheckIcon, DocumentTextIcon,
    HandRaisedIcon, ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// State
const committeeInfo = ref(null)
const userCountry = ref('Chile')
const countryFlag = ref('🇨🇱')
const activeVoting = ref(null)
const unreadMessages = ref(0)
const userCoalition = ref(null)

// Navigation Configuration
const navigationItems = computed(() => [
    {
        name: 'DelegateDashboard',
        label: 'Delegate Workspace',
        to: '/delegate',
        icon: RectangleGroupIcon
    },
    {
        name: 'DelegateCoalitions',
        label: 'Coalitions',
        to: '/delegate/coalitions',
        icon: ShieldCheckIcon,
        badge: userCoalition.value ? 'ACTIVE' : null,
        badgeType: 'success'
    },
    // {
    //     name: 'DelegateDocuments',
    //     label: 'Documents',
    //     to: '/delegate/documents',
    //     icon: DocumentTextIcon
    // },
    {
        name: 'DelegateVoting',
        label: 'Voting',
        to: '/delegate/voting',
        icon: HandRaisedIcon,
        badge: activeVoting.value ? 'LIVE' : null,
        badgeType: 'live'
    },
    {
        name: 'DelegateMessaging',
        label: 'Diplomacy',
        to: '/delegate/messaging',
        icon: ChatBubbleLeftRightIcon,
        badge: unreadMessages.value > 0 ? unreadMessages.value : null,
        badgeType: 'info'
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

        // Load user data from auth store
        const user = authStore.user
        if (user) {
            userCountry.value = user.countryName || 'Chile'
            countryFlag.value = user.countryFlag || '🇨🇱'
        }

        // Load dynamic data
        activeVoting.value = null // Would come from API
        unreadMessages.value = 0  // Would come from API
        userCoalition.value = null // Would come from API
    } catch (error) {
        console.error('Failed to load layout data:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadLayoutData()
})
</script>