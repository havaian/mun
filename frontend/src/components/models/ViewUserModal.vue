<template>
    <div class="w-full max-w-4xl mx-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div class="flex items-center space-x-4">
                <!-- User Avatar -->
                <div
                    class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-lg font-bold text-white">
                        {{ userInitials }}
                    </span>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                        {{ user?.name || 'User Profile' }}
                    </h3>
                    <p class="text-sm text-gray-500">
                        {{ user?.email }}
                    </p>
                </div>
            </div>

            <div class="flex items-center space-x-3">
                <!-- Status Badge -->
                <span :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    getStatusColor(user?.status)
                ]">
                    <div :class="[
                        'w-2 h-2 rounded-full mr-2',
                        user?.isOnline ? 'bg-current animate-pulse' : 'bg-current opacity-50'
                    ]"></div>
                    {{ user?.isOnline ? 'Online' : 'Offline' }}
                </span>

                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <LoadingSpinner class="w-8 h-8 text-un-blue" />
        </div>

        <!-- User Content -->
        <div v-else class="p-6 bg-white max-h-[70vh] overflow-y-auto">
            <!-- User Information Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Information -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Basic Information -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Basic Information</h4>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                                <p class="text-sm text-gray-900">{{ user?.name || 'N/A' }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                                <p class="text-sm text-gray-900">{{ user?.email || 'N/A' }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">User ID</label>
                                <p class="text-sm text-gray-900 font-mono">{{ user?.id || 'N/A' }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Role</label>
                                <span :class="[
                                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                    getRoleColor(user?.role)
                                ]">
                                    {{ formatRole(user?.role) }}
                                </span>
                            </div>

                            <div v-if="user?.phone">
                                <label class="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                                <p class="text-sm text-gray-900">{{ user.phone }}</p>
                            </div>

                            <div v-if="user?.institution">
                                <label class="block text-sm font-medium text-gray-600 mb-1">Institution</label>
                                <p class="text-sm text-gray-900">{{ user.institution }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Account Created</label>
                                <p class="text-sm text-gray-900">{{ formatDate(user?.createdAt) }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Last Login</label>
                                <p class="text-sm text-gray-900">
                                    {{ user?.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Committee Assignments -->
                    <div v-if="user?.committees?.length > 0" class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Committee Assignments</h4>

                        <div class="space-y-3">
                            <div v-for="committee in user.committees" :key="committee.id"
                                class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <UserGroupIcon class="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-900">{{ committee.name }}</p>
                                        <p class="text-xs text-gray-500">
                                            {{ committee.country ? `Representing ${committee.country}` : committee.role
                                            }}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <span :class="[
                                        'text-xs px-2 py-1 rounded-full',
                                        getCommitteeStatusColor(committee.status)
                                    ]">
                                        {{ committee.status }}
                                    </span>

                                    <button @click="viewCommittee(committee)" class="text-gray-400 hover:text-gray-600">
                                        <EyeIcon class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Recent Activity</h4>

                        <div v-if="recentActivity.length === 0" class="text-center py-8">
                            <ClockIcon class="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p class="text-sm text-gray-500">No recent activity</p>
                        </div>

                        <div v-else class="space-y-3">
                            <div v-for="activity in recentActivity" :key="activity.id"
                                class="flex items-start space-x-3">
                                <div :class="['p-1 rounded-full mt-1', getActivityColor(activity.type)]">
                                    <component :is="getActivityIcon(activity.type)" class="w-3 h-3 text-white" />
                                </div>

                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-gray-900">{{ activity.description }}</p>
                                    <p class="text-xs text-gray-500 mt-1">
                                        {{ formatRelativeTime(activity.timestamp) }}
                                        {{ activity.location ? ` • ${activity.location}` : '' }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <!-- Quick Actions -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Quick Actions</h4>

                        <div class="space-y-2">
                            <button v-if="canEdit" @click="editUser"
                                class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <PencilIcon class="w-4 h-4 mr-3" />
                                Edit User
                            </button>

                            <button v-if="canManagePassword" @click="resetPassword"
                                class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <KeyIcon class="w-4 h-4 mr-3" />
                                Reset Password
                            </button>

                            <button @click="sendMessage"
                                class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChatBubbleLeftIcon class="w-4 h-4 mr-3" />
                                Send Message
                            </button>

                            <button @click="viewSessions"
                                class="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <ClockIcon class="w-4 h-4 mr-3" />
                                View Sessions
                            </button>

                            <div v-if="canDeactivate" class="border-t border-gray-200 pt-2 mt-2">
                                <button @click="toggleUserStatus" :class="[
                                    'w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors',
                                    user?.status === 'active'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-green-600 hover:bg-green-50'
                                ]">
                                    <component :is="user?.status === 'active' ? UserMinusIcon : UserPlusIcon"
                                        class="w-4 h-4 mr-3" />
                                    {{ user?.status === 'active' ? 'Deactivate User' : 'Activate User' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Statistics</h4>

                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Total Logins</span>
                                <span class="text-sm font-medium text-gray-900">{{ userStats.totalLogins || 0 }}</span>
                            </div>

                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Sessions Attended</span>
                                <span class="text-sm font-medium text-gray-900">{{ userStats.sessionsAttended || 0
                                    }}</span>
                            </div>

                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Documents Created</span>
                                <span class="text-sm font-medium text-gray-900">{{ userStats.documentsCreated || 0
                                    }}</span>
                            </div>

                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Votes Cast</span>
                                <span class="text-sm font-medium text-gray-900">{{ userStats.votesCast || 0 }}</span>
                            </div>

                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Avg. Session Time</span>
                                <span class="text-sm font-medium text-gray-900">
                                    {{ formatDuration(userStats.avgSessionTime) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Permissions -->
                    <div v-if="user?.permissions?.length > 0" class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Permissions</h4>

                        <div class="space-y-2">
                            <div v-for="permission in user.permissions" :key="permission"
                                class="flex items-center text-sm">
                                <CheckCircleIcon class="w-4 h-4 text-green-500 mr-2" />
                                <span class="text-gray-700">{{ formatPermission(permission) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Security Information -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h4 class="text-base font-medium text-gray-900 mb-4">Security</h4>

                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Two-Factor Auth</span>
                                <span :class="[
                                    'text-xs px-2 py-1 rounded-full',
                                    user?.twoFactorEnabled
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                ]">
                                    {{ user?.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                                </span>
                            </div>

                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Password Changed</span>
                                <span class="text-sm text-gray-900">
                                    {{ user?.passwordChangedAt ? formatRelativeTime(user.passwordChangedAt) : 'Never' }}
                                </span>
                            </div>

                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Failed Logins</span>
                                <span :class="[
                                    'text-sm font-medium',
                                    (user?.failedLoginAttempts || 0) > 0 ? 'text-red-600' : 'text-gray-900'
                                ]">
                                    {{ user?.failedLoginAttempts || 0 }}
                                </span>
                            </div>

                            <div v-if="user?.lastFailedLoginAt" class="flex items-center justify-between">
                                <span class="text-sm text-gray-600">Last Failed Login</span>
                                <span class="text-sm text-gray-900">
                                    {{ formatRelativeTime(user.lastFailedLoginAt) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div v-if="!isLoading" class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div class="text-sm text-gray-500">
                User ID: {{ user?.id }} • Joined {{ formatDate(user?.createdAt) }}
            </div>

            <div class="flex items-center space-x-3">
                <button v-if="canEdit" @click="editUser" class="btn-un-secondary text-sm px-4 py-2">
                    Edit User
                </button>

                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Icons
import {
    XMarkIcon,
    UserGroupIcon,
    EyeIcon,
    ClockIcon,
    PencilIcon,
    KeyIcon,
    ChatBubbleLeftIcon,
    UserMinusIcon,
    UserPlusIcon,
    CheckCircleIcon,
    DocumentIcon,
    HandRaisedIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
const props = defineProps({
    userId: {
        type: String,
        required: true
    },
    onEdit: {
        type: Function,
        default: () => { }
    }
})

const emit = defineEmits(['close', 'edit'])

// Composables
const toast = useToast()
const authStore = useAuthStore()

// State
const isLoading = ref(true)
const user = ref(null)
const recentActivity = ref([])
const userStats = ref({})

// Computed
const userInitials = computed(() => {
    if (!user.value?.name) return '?'
    return user.value.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase()
})

const canEdit = computed(() => {
    return authStore.user?.role === 'admin' ||
        authStore.user?.id === props.userId
})

const canManagePassword = computed(() => {
    return authStore.user?.role === 'admin'
})

const canDeactivate = computed(() => {
    return authStore.user?.role === 'admin' &&
        authStore.user?.id !== props.userId
})

// Methods
const loadUser = async () => {
    isLoading.value = true

    try {
        // Load user data
        const userResponse = await apiMethods.admin.getUserById(props.userId)
        user.value = userResponse.data

        // Load user statistics
        const statsResponse = await apiMethods.statistics.getPersonalStats(user.value.committeeId || 'general')
        userStats.value = statsResponse.data

        // Load recent activity
        const activityResponse = await apiMethods.statistics.getPersonalActivity(
            user.value.committeeId || 'general',
            { limit: 10 }
        )
        recentActivity.value = activityResponse.data.activities || []

    } catch (error) {
        console.error('Load user error:', error)
        toast.error('Failed to load user information')
    } finally {
        isLoading.value = false
    }
}

const editUser = () => {
    props.onEdit(user.value)
    emit('edit', user.value)
}

const resetPassword = async () => {
    if (!confirm('Are you sure you want to reset this user\'s password? They will receive an email with a new temporary password.')) {
        return
    }

    try {
        await apiMethods.admin.resetUserPassword(props.userId)
        toast.success('Password reset successfully. User will receive an email with instructions.')
    } catch (error) {
        console.error('Reset password error:', error)
        toast.error('Failed to reset password')
    }
}

const sendMessage = () => {
    // This would open the messaging modal
    toast.info('Message functionality would open here')
}

const viewSessions = () => {
    // This would show user session history
    toast.info('Session history would be displayed here')
}

const viewCommittee = (committee) => {
    // This would open committee details
    console.log('View committee:', committee.id)
}

const toggleUserStatus = async () => {
    const newStatus = user.value.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? 'activate' : 'deactivate'

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return
    }

    try {
        await apiMethods.admin.updateUser(props.userId, { status: newStatus })
        user.value.status = newStatus
        toast.success(`User ${action}d successfully`)
    } catch (error) {
        console.error('Toggle user status error:', error)
        toast.error(`Failed to ${action} user`)
    }
}

// Helper functions
const getStatusColor = (status) => {
    const colors = {
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-gray-100 text-gray-700',
        suspended: 'bg-red-100 text-red-700',
        pending: 'bg-yellow-100 text-yellow-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const getRoleColor = (role) => {
    const colors = {
        admin: 'bg-purple-100 text-purple-700',
        chair: 'bg-blue-100 text-blue-700',
        co_chair: 'bg-blue-100 text-blue-700',
        rapporteur: 'bg-indigo-100 text-indigo-700',
        delegate: 'bg-green-100 text-green-700',
        observer: 'bg-gray-100 text-gray-700'
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
}

const getCommitteeStatusColor = (status) => {
    const colors = {
        active: 'bg-green-100 text-green-700',
        setup: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-blue-100 text-blue-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const getActivityColor = (type) => {
    const colors = {
        login: 'bg-green-500',
        logout: 'bg-gray-500',
        document: 'bg-blue-500',
        vote: 'bg-purple-500',
        speech: 'bg-orange-500',
        session: 'bg-indigo-500'
    }
    return colors[type] || 'bg-gray-500'
}

const getActivityIcon = (type) => {
    const icons = {
        login: UserPlusIcon,
        logout: UserMinusIcon,
        document: DocumentIcon,
        vote: HandRaisedIcon,
        speech: ChatBubbleLeftRightIcon,
        session: ClockIcon
    }
    return icons[type] || ClockIcon
}

const formatRole = (role) => {
    const roleMap = {
        admin: 'Administrator',
        chair: 'Chairperson',
        co_chair: 'Co-Chair',
        rapporteur: 'Rapporteur',
        delegate: 'Delegate',
        observer: 'Observer'
    }
    return roleMap[role] || role?.charAt(0).toUpperCase() + role?.slice(1) || 'Unknown'
}

const formatPermission = (permission) => {
    return permission
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const formatRelativeTime = (date) => {
    if (!date) return 'N/A'

    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    if (weeks < 4) return `${weeks}w ago`
    if (months < 12) return `${months}mo ago`

    const years = Math.floor(months / 12)
    return `${years}y ago`
}

const formatDuration = (minutes) => {
    if (!minutes) return '0m'

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
        return `${hours}h ${mins}m`
    }
    return `${mins}m`
}

// Lifecycle
onMounted(() => {
    loadUser()
})
</script>