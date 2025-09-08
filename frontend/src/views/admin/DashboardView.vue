<template>
    <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold text-mun-gray-900">Admin Dashboard</h1>
                <p class="text-mun-gray-600 mt-2">
                    Welcome back, {{ authStore.user?.username }}. Here's what's happening with your MUN platform.
                </p>
            </div>

            <div class="flex items-center space-x-4">
                <button @click="refreshDashboard" :disabled="isLoading"
                    class="p-2 rounded-lg bg-white/60 hover:bg-white/80 border border-white/20 transition-colors">
                    <ArrowPathIcon :class="['w-5 h-5 text-mun-gray-600', { 'animate-spin': isLoading }]" />
                </button>

                <AppButton variant="primary" :icon="PlusIcon" @click="quickActions.showCreateEvent = true">
                    Quick Create
                </AppButton>
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard v-for="stat in stats" :key="stat.title" :title="stat.title" :value="stat.value"
                :change="stat.change" :trend="stat.trend" :icon="stat.icon" :color="stat.color" :loading="isLoading" />
        </div>

        <!-- Quick Actions & Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Quick Actions -->
            <div class="lg:col-span-1">
                <AppCard title="Quick Actions" class="h-full">
                    <template #header-action>
                        <button class="text-sm text-un-blue hover:text-un-blue-600">
                            View All
                        </button>
                    </template>

                    <div class="space-y-4">
                        <QuickActionItem icon="CalendarDaysIcon" title="Create Event"
                            description="Set up a new MUN event" @click="quickActions.showCreateEvent = true" />

                        <QuickActionItem icon="UserGroupIcon" title="Add Committee" description="Create a new committee"
                            @click="quickActions.showCreateCommittee = true" />

                        <QuickActionItem icon="QrCodeIcon" title="Generate QR Codes"
                            description="Create authentication QR codes" @click="showQRGeneration" />

                        <QuickActionItem icon="DocumentTextIcon" title="Export Reports"
                            description="Download platform reports" @click="quickActions.showExportReports = true" />
                    </div>
                </AppCard>
            </div>

            <!-- Recent Activity -->
            <div class="lg:col-span-2">
                <AppCard title="Recent Activity" class="h-full">
                    <template #header-action>
                        <button class="text-sm text-un-blue hover:text-un-blue-600">
                            View All
                        </button>
                    </template>

                    <div class="space-y-4">
                        <ActivityItem v-for="activity in recentActivity" :key="activity.id" :activity="activity" />

                        <div v-if="recentActivity.length === 0" class="text-center py-8">
                            <ClockIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                            <p class="text-mun-gray-500">No recent activity</p>
                        </div>
                    </div>
                </AppCard>
            </div>
        </div>

        <!-- Events & Committees Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Active Events -->
            <AppCard title="Active Events">
                <template #header-action>
                    <RouterLink :to="{ name: 'AdminEvents' }" class="text-sm text-un-blue hover:text-un-blue-600">
                        Manage Events
                    </RouterLink>
                </template>

                <div class="space-y-4">
                    <EventCard v-for="event in activeEvents" :key="event.id" :event="event"
                        @click="goToEvent(event.id)" />

                    <div v-if="activeEvents.length === 0" class="text-center py-8">
                        <CalendarDaysIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                        <p class="text-mun-gray-500 mb-4">No active events</p>
                        <AppButton variant="outline" size="sm" @click="quickActions.showCreateEvent = true">
                            Create First Event
                        </AppButton>
                    </div>
                </div>
            </AppCard>

            <!-- Committee Status -->
            <AppCard title="Committee Status">
                <template #header-action>
                    <RouterLink :to="{ name: 'AdminCommittees' }" class="text-sm text-un-blue hover:text-un-blue-600">
                        Manage Committees
                    </RouterLink>
                </template>

                <div class="space-y-4">
                    <CommitteeStatusItem v-for="committee in committeeStatus" :key="committee.id"
                        :committee="committee" />

                    <div v-if="committeeStatus.length === 0" class="text-center py-8">
                        <UserGroupIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                        <p class="text-mun-gray-500 mb-4">No committees created</p>
                        <AppButton variant="outline" size="sm" @click="quickActions.showCreateCommittee = true">
                            Create First Committee
                        </AppButton>
                    </div>
                </div>
            </AppCard>
        </div>

        <!-- System Health -->
        <AppCard title="System Health" v-if="systemHealth">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HealthMetric title="API Response Time" :value="systemHealth.apiResponseTime" unit="ms"
                    :status="systemHealth.apiStatus" />

                <HealthMetric title="WebSocket Connections" :value="systemHealth.activeConnections" unit="users"
                    :status="systemHealth.wsStatus" />

                <HealthMetric title="Database Status" :value="systemHealth.dbStatus" :status="systemHealth.dbHealth" />
            </div>
        </AppCard>

        <!-- Quick Create Modals -->
        <CreateEventModal v-model="quickActions.showCreateEvent" @created="handleEventCreated" />

        <CreateCommitteeModal v-model="quickActions.showCreateCommittee" @created="handleCommitteeCreated" />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import {
    ArrowPathIcon,
    PlusIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    QrCodeIcon,
    DocumentTextIcon,
    ClockIcon,
    UsersIcon,
    ChartBarIcon
} from '@heroicons/vue/24/outline'

// Import components (these would be created next)
import StatCard from '@/components/admin/StatCard.vue'
import QuickActionItem from '@/components/admin/QuickActionItem.vue'
import ActivityItem from '@/components/admin/ActivityItem.vue'
import EventCard from '@/components/admin/EventCard.vue'
import CommitteeStatusItem from '@/components/admin/CommitteeStatusItem.vue'
import HealthMetric from '@/components/admin/HealthMetric.vue'
import CreateEventModal from '@/components/admin/CreateEventModal.vue'
import CreateCommitteeModal from '@/components/admin/CreateCommitteeModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// State
const isLoading = ref(false)
const stats = ref([])
const activeEvents = ref([])
const committeeStatus = ref([])
const recentActivity = ref([])
const systemHealth = ref(null)

const quickActions = reactive({
    showCreateEvent: false,
    showCreateCommittee: false,
    showExportReports: false
})

// Computed
const dashboardStats = computed(() => [
    {
        title: 'Total Events',
        value: stats.value.totalEvents || 0,
        change: '+12%',
        trend: 'up',
        icon: CalendarDaysIcon,
        color: 'blue'
    },
    {
        title: 'Active Committees',
        value: stats.value.activeCommittees || 0,
        change: '+5%',
        trend: 'up',
        icon: UserGroupIcon,
        color: 'green'
    },
    {
        title: 'Registered Users',
        value: stats.value.registeredUsers || 0,
        change: '+23%',
        trend: 'up',
        icon: UsersIcon,
        color: 'purple'
    },
    {
        title: 'Documents Uploaded',
        value: stats.value.documentsUploaded || 0,
        change: '+8%',
        trend: 'up',
        icon: DocumentTextIcon,
        color: 'orange'
    }
])

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true

        // Load dashboard statistics
        const [eventsRes, committeesRes, statsRes] = await Promise.all([
            apiMethods.events.getAll({ status: 'active', limit: 5 }),
            apiMethods.committees.getAll({ limit: 5 }),
            loadDashboardStats()
        ])

        activeEvents.value = eventsRes.data.events || []
        committeeStatus.value = committeesRes.data.committees || []

        // Load recent activity
        await loadRecentActivity()

        // Load system health
        await loadSystemHealth()

    } catch (error) {
        console.error('Dashboard loading error:', error)
        appStore.showErrorMessage('Failed to load dashboard data')
    } finally {
        isLoading.value = false
    }
}

const loadDashboardStats = async () => {
    try {
        // This would be a dedicated dashboard stats endpoint
        const response = await apiMethods.export.getStatistics('global')
        stats.value = response.data.statistics || {}
        return response
    } catch (error) {
        console.error('Stats loading error:', error)
        return { data: {} }
    }
}

const loadRecentActivity = async () => {
    try {
        // Mock activity data - in real app this would come from an activity log API
        recentActivity.value = [
            {
                id: 1,
                type: 'event_created',
                title: 'New event created',
                description: 'Global Youth MUN 2025 has been created',
                user: 'admin',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                icon: CalendarDaysIcon,
                color: 'blue'
            },
            {
                id: 2,
                type: 'committee_added',
                title: 'Committee added',
                description: 'Security Council added to Global Youth MUN 2025',
                user: 'admin',
                timestamp: new Date(Date.now() - 15 * 60 * 1000),
                icon: UserGroupIcon,
                color: 'green'
            },
            {
                id: 3,
                type: 'users_registered',
                title: 'New registrations',
                description: '12 new users registered in the last hour',
                user: 'system',
                timestamp: new Date(Date.now() - 45 * 60 * 1000),
                icon: UsersIcon,
                color: 'purple'
            }
        ]
    } catch (error) {
        console.error('Activity loading error:', error)
    }
}

const loadSystemHealth = async () => {
    try {
        // Mock system health data
        systemHealth.value = {
            apiResponseTime: 125,
            apiStatus: 'healthy',
            activeConnections: 47,
            wsStatus: 'healthy',
            dbStatus: 'Connected',
            dbHealth: 'healthy'
        }
    } catch (error) {
        console.error('System health loading error:', error)
    }
}

const refreshDashboard = async () => {
    await loadDashboardData()
    appStore.showSuccessMessage('Dashboard refreshed')
}

const showQRGeneration = () => {
    if (activeEvents.value.length === 0) {
        appStore.showWarningMessage('Please create an event first before generating QR codes')
        return
    }

    router.push({ name: 'AdminCommittees', query: { action: 'generate-qr' } })
}

const goToEvent = (eventId) => {
    router.push({ name: 'AdminEvents', params: { id: eventId } })
}

const handleEventCreated = (event) => {
    activeEvents.value.unshift(event)
    appStore.showSuccessMessage('Event created successfully')
    loadDashboardData() // Refresh stats
}

const handleCommitteeCreated = (committee) => {
    committeeStatus.value.unshift(committee)
    appStore.showSuccessMessage('Committee created successfully')
    loadDashboardData() // Refresh stats
}

// Initialize dashboard
onMounted(() => {
    loadDashboardData()

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
        if (!document.hidden) {
            loadDashboardData()
        }
    }, 5 * 60 * 1000)

    // Cleanup on unmount
    onUnmounted(() => {
        clearInterval(refreshInterval)
    })
})

// Update breadcrumbs
appStore.setBreadcrumbs([
    { text: 'Admin', to: { name: 'AdminDashboard' } },
    { text: 'Dashboard', active: true }
])
</script>

<style scoped>
/* Custom animations for dashboard cards */
.dashboard-card {
    animation: slideInUp 0.6s ease-out;
}

.dashboard-card:nth-child(1) {
    animation-delay: 0.1s;
}

.dashboard-card:nth-child(2) {
    animation-delay: 0.2s;
}

.dashboard-card:nth-child(3) {
    animation-delay: 0.3s;
}

.dashboard-card:nth-child(4) {
    animation-delay: 0.4s;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Hover effects for cards */
.hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 158, 219, 0.15);
}
</style>