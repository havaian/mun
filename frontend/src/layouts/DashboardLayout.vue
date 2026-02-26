<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Sidebar -->
        <UniversalSidebar :sidebar-collapsed="sidebarCollapsed" user-role="user" :user="authStore.user"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UniversalSidebar from '@/components/layout/UniversalSidebar.vue'

import {
    RectangleGroupIcon,
    CalendarDaysIcon,
    BuildingOffice2Icon,
    UserCircleIcon,
    ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)

const primaryNavigation = computed(() => [
    {
        name: 'DashboardHome',
        label: 'Home',
        to: '/dashboard',
        icon: RectangleGroupIcon,
    },
    {
        name: 'DashboardEvents',
        label: 'My Events',
        to: '/dashboard/events',
        icon: CalendarDaysIcon,
        badge: authStore.eventParticipations?.length || null,
    },
    {
        name: 'DashboardOrganizations',
        label: 'My Organizations',
        to: '/dashboard/organizations',
        icon: BuildingOffice2Icon,
        badge: authStore.allOrganizations?.length || null,
    },
    {
        name: 'DashboardProfile',
        label: 'My Profile',
        to: '/dashboard/profile',
        icon: UserCircleIcon,
    },
])

const navigationSections = computed(() => {
    const sections = []

    if (authStore.isSuperAdmin) {
        sections.push({
            title: 'Administration',
            items: [
                {
                    name: 'SuperAdminDashboard',
                    label: 'Platform Admin',
                    to: '/superadmin',
                    icon: ShieldCheckIcon,
                },
            ]
        })
    }

    return sections
})

const userActions = computed(() => [])

const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
    await authStore.logout()
    router.push({ name: 'Login' })
}
</script>