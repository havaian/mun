<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Sidebar -->
        <UniversalSidebar :sidebar-collapsed="sidebarCollapsed" user-role="admin" :user="authStore.user"
            :primary-navigation="primaryNavigation" :navigation-sections="navigationSections"
            :system-status="adminStore.systemHealth" :performance-metrics="adminStore.performanceMetrics"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/plugins/toast'
import UniversalSidebar from '@/components/layout/UniversalSidebar.vue'

// Icons
import {
    ChartBarIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    DocumentChartBarIcon,
    ClipboardDocumentListIcon,
    CogIcon,
    UserIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const toast = useToast()

// State
const sidebarCollapsed = ref(false)

// Navigation Configuration
const primaryNavigation = computed(() => [
    {
        name: 'AdminDashboard',
        label: 'Dashboard',
        to: '/admin',
        icon: ChartBarIcon,
        badge: adminStore.stats.unreadNotifications > 0 ? adminStore.stats.unreadNotifications : null,
        badgeType: 'default'
    }
])

const navigationSections = computed(() => [
    {
        title: 'System Management',
        items: [
            {
                name: 'AdminEvents',
                label: 'Event Management',
                to: '/admin/events',
                icon: CalendarDaysIcon
            },
            {
                name: 'AdminCommittees',
                label: 'Committee Management',
                to: '/admin/committees',
                icon: UserGroupIcon
            },
            {
                name: 'AdminUsers',
                label: 'User Management',
                to: '/admin/users',
                icon: UsersIcon
            },
            {
                name: 'AdminDocuments',
                label: 'Document Management',
                to: '/admin/documents',
                icon: DocumentTextIcon
            }
        ]
    },
    {
        title: 'Analytics & Reports',
        items: [
            {
                name: 'AdminReports',
                label: 'Reports & Analytics',
                to: '/admin/reports',
                icon: DocumentChartBarIcon
            },
            {
                name: 'AdminLogs',
                label: 'System Logs',
                to: '/admin/logs',
                icon: ClipboardDocumentListIcon,
                badge: adminStore.stats.recentErrors > 0 ? adminStore.stats.recentErrors : null,
                badgeType: 'danger'
            }
        ]
    },
    {
        title: 'Configuration',
        items: [
            {
                name: 'AdminSettings',
                label: 'System Settings',
                to: '/admin/settings',
                icon: CogIcon
            }
        ]
    }
])

const userActions = computed(() => [
    {
        name: 'profile',
        label: 'Profile Settings',
        to: '/shared/profile',
        icon: UserIcon
    }
])

// Methods
const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
    try {
        // Stop auto-refresh when logging out
        adminStore.stopAutoRefresh()

        await authStore.logout()
        toast.success('Logged out successfully')
        router.push('/auth/login')
    } catch (error) {
        console.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

// Lifecycle
onMounted(async () => {
    // Initialize admin data when layout loads
    await adminStore.initializeAdminData()

    // Start auto-refresh for system health and stats
    adminStore.startAutoRefresh(120000) // Refresh every 120 seconds
})

onUnmounted(() => {
    // Clean up auto-refresh when component unmounts
    adminStore.stopAutoRefresh()
})
</script>