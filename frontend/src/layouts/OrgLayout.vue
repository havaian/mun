<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Sidebar -->
        <UniversalSidebar :sidebar-collapsed="sidebarCollapsed" user-role="admin" :user="authStore.user"
            :primary-navigation="primaryNavigation" :navigation-sections="navigationSections"
            :user-actions="userActions" @toggle-sidebar="toggleSidebar" @logout="handleLogout" />

        <!-- Main Content -->
        <div :class="[
            'transition-all duration-200 ease-in-out',
            sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-72'
        ]">
            <main class="min-h-screen bg-mun-gray-50">
                <router-view />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UniversalSidebar from '@/components/layout/UniversalSidebar.vue'

import {
    RectangleGroupIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    CogIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)

// Current org slug from URL
const orgSlug = computed(() => route.params.orgSlug)

// Set active org when slug changes
watch(orgSlug, (newSlug) => {
    if (newSlug) {
        const org = authStore.allOrganizations.find(o => o.slug === newSlug)
        if (org) {
            authStore.setActiveOrg(org._id)
        }
    }
}, { immediate: true })

const primaryNavigation = computed(() => [
    {
        name: 'OrgDashboard',
        label: 'Dashboard',
        to: `/org/${orgSlug.value}`,
        icon: RectangleGroupIcon,
    },
    {
        name: 'OrgEvents',
        label: 'Events',
        to: `/org/${orgSlug.value}/events`,
        icon: CalendarDaysIcon,
    },
    {
        name: 'OrgMembers',
        label: 'Members',
        to: `/org/${orgSlug.value}/members`,
        icon: UserGroupIcon,
    },
])

const navigationSections = computed(() => {
    const sections = []

    if (authStore.isOrgAdmin) {
        sections.push({
            title: 'Administration',
            items: [
                {
                    name: 'OrgSettings',
                    label: 'Settings',
                    to: `/org/${orgSlug.value}/settings`,
                    icon: CogIcon,
                },
            ]
        })
    }

    return sections
})

const userActions = computed(() => [
    { name: 'Profile', label: 'Profile', to: '/profile' },
])

const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
    await authStore.logout()
    router.push({ name: 'Login' })
}
</script>