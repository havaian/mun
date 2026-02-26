<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Loading state while context resolves -->
        <div v-if="ctx.isLoading.value && !ctx.isReady.value" class="min-h-screen flex items-center justify-center">
            <div class="text-center">
                <div
                    class="w-8 h-8 border-2 border-mun-blue border-t-transparent rounded-full animate-spin mx-auto mb-3">
                </div>
                <p class="text-sm text-mun-gray-500">Loading committee context...</p>
            </div>
        </div>

        <!-- Error state -->
        <div v-else-if="ctx.error.value && !ctx.isReady.value"
            class="min-h-screen flex items-center justify-center p-6">
            <div class="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
                <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
                </div>
                <h2 class="text-lg font-semibold text-mun-gray-900">Context Error</h2>
                <p class="text-sm text-mun-gray-500 mt-2">{{ ctx.error.value }}</p>
                <router-link to="/dashboard"
                    class="inline-block mt-4 px-4 py-2 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                    ← Back to Dashboard
                </router-link>
            </div>
        </div>

        <!-- Main layout -->
        <template v-else>
            <UniversalSidebar :sidebar-collapsed="sidebarCollapsed" user-role="presidium" :user="authStore.user"
                :primary-navigation="primaryNavigation" :navigation-sections="navigationSections"
                :user-actions="userActions" @toggle-sidebar="toggleSidebar" @logout="handleLogout" />

            <div :class="[
                'transition-all duration-200 ease-in-out',
                sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-72'
            ]">
                <!-- Context bar -->
                <div class="bg-white border-b border-mun-gray-200 px-6 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3 min-w-0">
                            <span
                                class="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">Presidium</span>
                            <span class="text-sm font-medium text-mun-gray-900 truncate">
                                {{ ctx.committee.value?.name || 'Committee' }}
                            </span>
                            <span v-if="ctx.committee.value?.acronym" class="text-xs text-mun-gray-400">
                                ({{ ctx.committee.value.acronym }})
                            </span>
                            <span class="text-mun-gray-300">·</span>
                            <span class="text-xs text-mun-gray-500 truncate">
                                {{ ctx.event.value?.name || 'Event' }}
                            </span>
                        </div>
                        <span v-if="ctx.event.value?.status" :class="eventStatusClass">
                            {{ formatEventStatus(ctx.event.value.status) }}
                        </span>
                    </div>
                </div>

                <main class="min-h-screen bg-mun-gray-50">
                    <router-view />
                </main>
            </div>

            <!-- Mobile overlay -->
            <div v-if="!sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
                @click="toggleSidebar"></div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSessionContext } from '@/composables/useSessionContext'
import UniversalSidebar from '@/components/layout/UniversalSidebar.vue'

import {
    HomeIcon,
    RectangleGroupIcon,
    UsersIcon,
    ShieldCheckIcon,
    HandRaisedIcon,
    ChatBubbleLeftRightIcon,
    PresentationChartBarIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const ctx = useSessionContext()

// Provide context to all child views
provide('sessionContext', ctx)

const sidebarCollapsed = ref(false)

// Build nav paths relative to /session/:committeeId/presidium
const base = computed(() => ctx.basePath.value + '/presidium')

const primaryNavigation = computed(() => [
    {
        name: 'DashboardHome',
        label: '← Home',
        to: '/dashboard',
        icon: HomeIcon,
    },
    {
        name: 'PresidiumDashboard',
        label: 'Console',
        to: base.value,
        icon: RectangleGroupIcon,
    },
    {
        name: 'PresidiumAttendance',
        label: 'Roll Call',
        to: `${base.value}/attendance`,
        icon: UsersIcon,
    },
    {
        name: 'PresidiumCoalitions',
        label: 'Coalitions',
        to: `${base.value}/coalitions`,
        icon: ShieldCheckIcon,
    },
    {
        name: 'PresidiumVoting',
        label: 'Voting',
        to: `${base.value}/voting`,
        icon: HandRaisedIcon,
    },
    {
        name: 'PresidiumMessaging',
        label: 'Diplomacy',
        to: `${base.value}/messaging`,
        icon: ChatBubbleLeftRightIcon,
    },
])

const navigationSections = computed(() => [
    {
        title: 'Tools',
        items: [
            {
                name: 'PresidiumPublicDisplay',
                label: 'Public Display',
                to: `${base.value}/public-display`,
                icon: PresentationChartBarIcon,
            },
            {
                name: 'PresidiumApplications',
                label: 'Applications',
                to: `${base.value}/applications`,
                icon: ClipboardDocumentListIcon,
            },
        ]
    }
])

const userActions = computed(() => [
    { name: 'DashboardProfile', label: 'Profile', to: '/dashboard/profile' },
])

const eventStatusClass = computed(() => {
    const status = ctx.event.value?.status
    const map = {
        active: 'px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700',
        registration_open: 'px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700',
        registration_closed: 'px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
        completed: 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500',
    }
    return map[status] || 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500'
})

const formatEventStatus = (status) => status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''

const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }

const handleLogout = async () => {
    await authStore.logout()
    router.push({ name: 'Login' })
}
</script>