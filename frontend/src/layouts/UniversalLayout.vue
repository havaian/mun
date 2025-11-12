<template>
    <div class="min-h-screen bg-gradient-mun">
        <ResponsiveSidebar :collapsed="sidebarCollapsed" :title="layoutConfig.title" :subtitle="layoutConfig.subtitle"
            :logo-color="layoutConfig.logoColor" :header-gradient="layoutConfig.headerGradient" @toggle="toggleSidebar">
            <!-- Navigation Content -->
            <template #navigation>
                <div v-for="section in layoutConfig.navigation" :key="section.id" class="space-y-2">
                    <h3 v-if="section.title"
                        class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        {{ section.title }}
                    </h3>

                    <router-link v-for="item in section.items" :key="item.name" :to="item.to"
                        :class="getNavLinkClass(item.name)">
                        <component :is="item.icon" class="w-5 h-5" />
                        <span>{{ item.label }}</span>

                        <!-- Badge/Notification -->
                        <div v-if="item.badge" class="ml-auto">
                            <span :class="getBadgeClass(item.badgeType)">
                                {{ item.badge }}
                            </span>
                        </div>
                    </router-link>
                </div>
            </template>

            <!-- System Status (for admin only) -->
            <template v-if="userRole === 'admin'" #system-status>
                <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        System Status
                    </h4>
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">API Status</span>
                            <span :class="adminStore.systemHealth?.api ? 'text-green-600' : 'text-red-600'">
                                {{ adminStore.systemHealth?.api ? 'Healthy' : 'Issues' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">Database</span>
                            <span :class="adminStore.systemHealth?.database ? 'text-green-600' : 'text-red-600'">
                                {{ adminStore.systemHealth?.database ? 'Connected' : 'Disconnected' }}
                            </span>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Role-specific Status -->
            <template v-else-if="userRole === 'presidium'" #system-status>
                <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        Session Status
                    </h4>
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">Session</span>
                            <div class="flex items-center space-x-2">
                                <div
                                    :class="['w-2 h-2 rounded-full', currentSession?.status === 'active' ? 'bg-green-500' : 'bg-gray-400']">
                                </div>
                                <span class="font-medium">{{ currentSession?.status === 'active' ? 'Active' : 'Inactive'
                                }}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-mun-gray-600">Present</span>
                            <span class="font-medium">{{ attendanceCount || 0 }}</span>
                        </div>
                    </div>
                </div>
            </template>

            <!-- User Profile -->
            <template #user-profile>
                <div class="flex items-center space-x-3">
                    <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', layoutConfig.userIconBg]">
                        <span class="text-xs font-semibold text-white">
                            {{ getUserInitials() }}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ authStore.user?.displayName || authStore.user?.username || authStore.user?.countryName ||
                                layoutConfig.defaultUserName }}
                        </p>
                        <p class="text-xs text-mun-gray-500 truncate">
                            {{ getUserRole() }}
                        </p>
                    </div>
                </div>

                <!-- User Actions -->
                <div class="space-y-1 mt-3">
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
            </template>

            <!-- Main Content -->
            <template #content>
                <main class="min-h-screen bg-mun-gray-50">
                    <!-- Keep this simple - just render the content without complex caching -->
                    <router-view />
                </main>
            </template>
        </ResponsiveSidebar>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/plugins/toast'
import ResponsiveSidebar from '@/components/ui/ResponsiveSidebar.vue'

// Icons - import all needed icons
import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    UsersIcon,
    DocumentTextIcon,
    DocumentChartBarIcon,
    CogIcon,
    ClipboardDocumentListIcon,
    HandRaisedIcon,
    ClockIcon,
    HomeIcon,
    DocumentArrowUpIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const toast = useToast()

// Props
const props = defineProps({
    role: {
        type: String,
        required: true,
        validator: value => ['admin', 'presidium', 'delegate'].includes(value)
    }
})

// State
const sidebarCollapsed = ref(false)
const currentSession = ref(null)
const attendanceCount = ref(0)

// User role
const userRole = computed(() => props.role || authStore.user?.role)

// Layout configurations for each role
const layoutConfigs = {
    admin: {
        title: 'Admin Center',
        subtitle: 'System Control',
        logoColor: 'bg-mun-blue',
        headerGradient: 'from-mun-blue-600 to-mun-blue-700',
        userIconBg: 'bg-mun-blue',
        defaultUserName: 'Administrator',
        navigation: [
            {
                id: 'dashboard',
                items: [
                    {
                        name: 'AdminDashboard',
                        label: 'Dashboard',
                        to: '/admin',
                        icon: ChartBarIcon,
                        badge: computed(() => adminStore.stats?.unreadNotifications > 0 ?
                            (adminStore.stats.unreadNotifications > 99 ? '99+' : adminStore.stats.unreadNotifications) : null),
                        badgeType: 'error'
                    }
                ]
            },
            {
                id: 'management',
                title: 'System Management',
                items: [
                    {
                        name: 'AdminEvents',
                        label: 'Event Management',
                        to: '/admin/events',
                        icon: CalendarDaysIcon,
                        badge: computed(() => adminStore.stats?.activeEvents > 0 ? adminStore.stats.activeEvents : null),
                        badgeType: 'success'
                    },
                    {
                        name: 'AdminCommittees',
                        label: 'Committee Management',
                        to: '/admin/committees',
                        icon: UserGroupIcon,
                        badge: computed(() => adminStore.stats?.activeCommittees > 0 ? adminStore.stats.activeCommittees : null),
                        badgeType: 'info'
                    },
                    {
                        name: 'AdminUsers',
                        label: 'User Management',
                        to: '/admin/users',
                        icon: UsersIcon,
                        badge: computed(() => adminStore.stats?.activeUsers > 0 ? adminStore.stats.activeUsers : null),
                        badgeType: 'primary'
                    },
                    {
                        name: 'AdminDocuments',
                        label: 'Document Management',
                        to: '/admin/documents',
                        icon: DocumentTextIcon,
                        badge: computed(() => adminStore.stats?.recentDocuments > 0 ? adminStore.stats.recentDocuments : null),
                        badgeType: 'warning'
                    }
                ]
            },
            {
                id: 'analytics',
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
                        icon: ClipboardDocumentListIcon
                    }
                ]
            },
            {
                id: 'settings',
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
        ]
    },

    presidium: {
        title: 'Presidium',
        subtitle: 'Committee Control',
        logoColor: 'bg-mun-green-500',
        headerGradient: 'from-mun-green-600 to-mun-green-700',
        userIconBg: 'bg-mun-green-500',
        defaultUserName: 'Presidium Member',
        navigation: [
            {
                id: 'main',
                items: [
                    {
                        name: 'PresidiumDashboard',
                        label: 'Dashboard',
                        to: '/presidium',
                        icon: ChartBarIcon
                    },
                    {
                        name: 'PresidiumSessions',
                        label: 'Session Management',
                        to: '/presidium/sessions',
                        icon: CalendarDaysIcon,
                        badge: computed(() => currentSession.value?.status === 'active' ? 'LIVE' : null),
                        badgeType: 'success'
                    },
                    {
                        name: 'PresidiumDocuments',
                        label: 'Document Review',
                        to: '/presidium/documents',
                        icon: DocumentTextIcon
                    },
                    {
                        name: 'PresidiumVoting',
                        label: 'Voting Management',
                        to: '/presidium/voting',
                        icon: HandRaisedIcon
                    },
                    {
                        name: 'PresidiumAttendance',
                        label: 'Attendance',
                        to: '/presidium/attendance',
                        icon: ClockIcon
                    }
                ]
            }
        ]
    },

    delegate: {
        title: 'Delegate Portal',
        subtitle: 'Your Committee',
        logoColor: 'bg-mun-purple-500',
        headerGradient: 'from-mun-purple-600 to-mun-purple-700',
        userIconBg: 'bg-mun-purple-500',
        defaultUserName: 'Delegate',
        navigation: [
            {
                id: 'main',
                items: [
                    {
                        name: 'DelegateDashboard',
                        label: 'Dashboard',
                        to: '/delegate',
                        icon: HomeIcon
                    },
                    {
                        name: 'DelegateDocuments',
                        label: 'My Documents',
                        to: '/delegate/documents',
                        icon: DocumentTextIcon
                    },
                    {
                        name: 'DelegateUpload',
                        label: 'Upload Documents',
                        to: '/delegate/upload',
                        icon: DocumentArrowUpIcon
                    },
                    {
                        name: 'DelegateVoting',
                        label: 'Voting',
                        to: '/delegate/voting',
                        icon: HandRaisedIcon
                    }
                ]
            }
        ]
    }
}

// Get current layout config
const layoutConfig = computed(() => layoutConfigs[userRole.value] || layoutConfigs.delegate)

// Methods
const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const getNavLinkClass = (routeName) => {
    const baseClasses = 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3'
    return route.name === routeName
        ? `${baseClasses} bg-mun-blue text-white shadow-lg`
        : `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-blue-600`
}

const getBadgeClass = (type) => {
    const classes = {
        'success': 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full',
        'error': 'inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full',
        'warning': 'text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full',
        'info': 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full',
        'primary': 'text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full'
    }
    return classes[type] || classes.info
}

const getUserInitials = () => {
    const user = authStore.user
    if (user?.displayName) {
        return user.displayName.substring(0, 2).toUpperCase()
    }
    if (user?.username) {
        return user.username.substring(0, 2).toUpperCase()
    }
    if (user?.countryName) {
        return user.countryName.substring(0, 2).toUpperCase()
    }
    return userRole.value.substring(0, 2).toUpperCase()
}

const getUserRole = () => {
    const user = authStore.user
    if (user?.presidiumRole) {
        return user.presidiumRole
    }
    if (user?.countryName) {
        return user.countryName
    }
    return layoutConfig.value.subtitle
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

// Role-specific data loading
onMounted(async () => {
    if (userRole.value === 'admin') {
        await adminStore.initializeAdminData()
        adminStore.startAutoRefresh(30000)
    } else if (userRole.value === 'presidium') {
        // Load presidium data
        currentSession.value = { status: 'inactive' }
        attendanceCount.value = 0
    }
})

onUnmounted(() => {
    if (userRole.value === 'admin') {
        adminStore.stopAutoRefresh()
    }
})
</script>

<style scoped>
/* Simple transitions - no complex animations */
.transition-colors {
    transition-property: color, background-color, border-color;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>