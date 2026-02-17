<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Sidebar -->
        <UniversalSidebar :sidebar-collapsed="sidebarCollapsed" user-role="superadmin" :user="authStore.user"
            :primary-navigation="primaryNavigation" :navigation-sections="[]" :user-actions="userActions"
            @toggle-sidebar="toggleSidebar" @logout="handleLogout" />

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
    BuildingOffice2Icon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)

const primaryNavigation = computed(() => [
    {
        name: 'SuperAdminDashboard',
        label: 'Dashboard',
        to: '/superadmin',
        icon: RectangleGroupIcon,
    },
    {
        name: 'SuperAdminOrganizations',
        label: 'Organizations',
        to: '/superadmin/organizations',
        icon: BuildingOffice2Icon,
    },
])

const userActions = computed(() => [
    { label: 'Profile', action: () => router.push({ name: 'Profile' }) },
])

const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
    await authStore.logout()
    router.push({ name: 'Login' })
}
</script>