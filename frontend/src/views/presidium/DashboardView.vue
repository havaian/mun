<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Presidium Dashboard</h1>
                <p class="text-mun-gray-600">{{ userCommittee?.name || 'Committee Management' }}</p>
            </div>
            <div class="flex items-center space-x-3">
                <div class="text-sm text-mun-gray-500">
                    {{ authStore.user?.presidiumRole || 'Presidium Member' }}
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <UsersIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Present</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.presentCount }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Quorum</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.hasQuorum ? 'Yes' : 'No' }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Session Time</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ formatSessionTime() }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <DocumentTextIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Pending Docs</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pendingDocuments }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Session Status -->
        <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Current Session</h2>
            <div v-if="currentSession" class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-medium text-mun-gray-900">Session {{ currentSession.number }}</p>
                        <p class="text-sm text-mun-gray-600">{{ currentSession.mode || 'Formal Debate' }}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span :class="[
                            'px-3 py-1 rounded-full text-sm font-medium',
                            currentSession.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                currentSession.status === 'paused' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                    'bg-mun-gray-100 text-mun-gray-700'
                        ]">
                            {{ currentSession.status?.charAt(0).toUpperCase() + currentSession.status?.slice(1) }}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-mun-gray-100">
                    <RouterLink to="/presidium/sessions" class="btn-un-primary text-center">
                        Manage Session
                    </RouterLink>
                    <RouterLink to="/presidium/attendance" class="btn-un-secondary text-center">
                        Take Attendance
                    </RouterLink>
                    <RouterLink to="/presidium/voting" class="btn-un-secondary text-center">
                        Start Voting
                    </RouterLink>
                </div>
            </div>

            <div v-else class="text-center py-8">
                <ClockIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Active Session</h3>
                <p class="mt-2 text-mun-gray-600">Start a new session to begin committee work</p>
                <RouterLink to="/presidium/sessions" class="mt-4 btn-un-primary">
                    Start Session
                </RouterLink>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Recent Documents -->
            <div class="mun-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Recent Documents</h3>
                    <RouterLink to="/presidium/documents"
                        class="text-mun-blue hover:text-mun-blue-600 text-sm font-medium">
                        View All
                    </RouterLink>
                </div>
                <div class="space-y-3">
                    <div v-for="doc in recentDocuments" :key="doc.id"
                        class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                        <div>
                            <p class="font-medium text-mun-gray-900">{{ doc.title }}</p>
                            <p class="text-sm text-mun-gray-600">{{ doc.country }}</p>
                        </div>
                        <span :class="[
                            'px-2 py-1 rounded text-xs font-medium',
                            doc.status === 'pending' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                doc.status === 'approved' ? 'bg-mun-green-100 text-mun-green-700' :
                                    'bg-mun-red-100 text-mun-red-700'
                        ]">
                            {{ doc.status }}
                        </span>
                    </div>
                    <div v-if="recentDocuments.length === 0" class="text-center py-4 text-mun-gray-500">
                        No recent documents
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="mun-card p-6">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Recent Activity</h3>
                <div class="space-y-3">
                    <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3">
                        <div class="flex-shrink-0 w-2 h-2 bg-mun-blue rounded-full mt-2"></div>
                        <div>
                            <p class="text-sm text-mun-gray-900">{{ activity.description }}</p>
                            <p class="text-xs text-mun-gray-500">{{ formatTime(activity.timestamp) }}</p>
                        </div>
                    </div>
                    <div v-if="recentActivity.length === 0" class="text-center py-4 text-mun-gray-500">
                        No recent activity
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    UsersIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const userCommittee = ref(null)
const currentSession = ref(null)

const stats = reactive({
    presentCount: 0,
    hasQuorum: false,
    pendingDocuments: 0
})

const recentDocuments = ref([])
const recentActivity = ref([])

// Computed
const sessionStartTime = ref(null)

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true

        // Load committee info
        userCommittee.value = {
            name: "General Assembly",
            id: authStore.user?.committeeId
        }

        // Load current session
        currentSession.value = {
            number: 1,
            status: 'active',
            mode: 'Formal Debate',
            startedAt: new Date().toISOString()
        }

        // Load stats
        stats.presentCount = 45
        stats.hasQuorum = true
        stats.pendingDocuments = 3

        // Load recent documents
        recentDocuments.value = [
            {
                id: 1,
                title: "Position Paper on Climate Change",
                country: "United States",
                status: "pending"
            },
            {
                id: 2,
                title: "Draft Resolution A/1",
                country: "France",
                status: "approved"
            }
        ]

        // Load recent activity
        recentActivity.value = [
            {
                id: 1,
                description: "Session started",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                description: "United Kingdom added to speakers list",
                timestamp: new Date(Date.now() - 300000).toISOString()
            }
        ]

        sessionStartTime.value = new Date()

    } catch (error) {
        toast.error('Load dashboard error:', error)
        toast.error('Failed to load dashboard data')
    } finally {
        isLoading.value = false
    }
}

const formatSessionTime = () => {
    if (!sessionStartTime.value) return '--:--'

    const now = new Date()
    const diff = Math.floor((now - sessionStartTime.value) / 1000)
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)

    return `${hours}:${minutes.toString().padStart(2, '0')}`
}

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Lifecycle
onMounted(() => {
    loadDashboardData()
})
</script>