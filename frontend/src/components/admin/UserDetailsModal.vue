<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] min-h-[400px]" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span class="text-white text-lg font-semibold">
                                    {{ getUserInitials() }}
                                </span>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    {{ user?.fullName || `${user?.firstName} ${user?.lastName}` || 'User Details' }}
                                </h2>
                                <p class="text-white/80 text-sm flex items-center space-x-2">
                                    <span>{{ user?.email }}</span>
                                    <span v-if="user?.role" class="px-2 py-0.5 bg-white/20 rounded text-xs">
                                        {{ formatRole(user.role) }}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button @click="closeModal"
                            class="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="overflow-y-auto max-h-[80vh]">
                        <div v-if="!user" class="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>

                        <div v-else class="p-6 space-y-8">
                            <!-- User Overview -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Main Information -->
                                <div class="lg:col-span-2 space-y-6">
                                    <!-- Basic Information -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Personal Information
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Full Name</label>
                                                <p class="text-mun-gray-900 font-medium">
                                                    {{ user.fullName || `${user.firstName} ${user.lastName}` }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Username</label>
                                                <p class="text-mun-gray-900 font-medium">{{ user.username }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Email
                                                    Address</label>
                                                <a :href="`mailto:${user.email}`"
                                                    class="text-mun-blue hover:text-mun-blue-dark">
                                                    {{ user.email }}
                                                </a>
                                            </div>

                                            <div v-if="user.phone">
                                                <label class="text-sm font-medium text-mun-gray-600">Phone
                                                    Number</label>
                                                <a :href="`tel:${user.phone}`"
                                                    class="text-mun-blue hover:text-mun-blue-dark">
                                                    {{ user.phone }}
                                                </a>
                                            </div>

                                            <div v-if="user.dateOfBirth">
                                                <label class="text-sm font-medium text-mun-gray-600">Date of
                                                    Birth</label>
                                                <p class="text-mun-gray-900">{{ formatDate(user.dateOfBirth) }}</p>
                                            </div>

                                            <div v-if="user.institution">
                                                <label class="text-sm font-medium text-mun-gray-600">Institution</label>
                                                <p class="text-mun-gray-900">{{ user.institution }}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Role & Assignment Information -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <ShieldCheckIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Role & Assignment
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Role</label>
                                                <span :class="[
                                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                    getRoleClasses(user.role)
                                                ]">
                                                    {{ formatRole(user.role) }}
                                                </span>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Status</label>
                                                <span :class="[
                                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                    getStatusClasses(user.status)
                                                ]">
                                                    {{ formatStatus(user.status) }}
                                                </span>
                                            </div>

                                            <div v-if="user.presidiumRole">
                                                <label class="text-sm font-medium text-mun-gray-600">Presidium
                                                    Role</label>
                                                <p class="text-mun-gray-900">{{ formatPresidiumRole(user.presidiumRole)
                                                }}</p>
                                            </div>

                                            <div v-if="user.country">
                                                <label
                                                    class="text-sm font-medium text-mun-gray-600">Country/Organization</label>
                                                <p class="text-mun-gray-900">{{ getCountryName(user.country) }}</p>
                                            </div>

                                            <div v-if="user.committeeInfo">
                                                <label class="text-sm font-medium text-mun-gray-600">Committee</label>
                                                <p class="text-mun-gray-900">
                                                    {{ user.committeeInfo.name }} ({{ user.committeeInfo.acronym }})
                                                </p>
                                            </div>

                                            <div v-if="user.experienceLevel">
                                                <label class="text-sm font-medium text-mun-gray-600">Experience
                                                    Level</label>
                                                <p class="text-mun-gray-900">{{
                                                    formatExperienceLevel(user.experienceLevel) }}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Account Information -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Account Settings
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Language</label>
                                                <p class="text-mun-gray-900">{{ getLanguageName(user.language) }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Time Zone</label>
                                                <p class="text-mun-gray-900">{{ user.timezone || 'Not set' }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Account
                                                    Created</label>
                                                <p class="text-mun-gray-900">{{ formatDateTime(user.createdAt) }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Last Login</label>
                                                <p class="text-mun-gray-900">{{ formatDateTime(user.lastLoginAt) }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Email
                                                    Verified</label>
                                                <span :class="user.emailVerified ? 'text-green-600' : 'text-red-600'">
                                                    {{ user.emailVerified ? 'Yes' : 'No' }}
                                                </span>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Two-Factor
                                                    Auth</label>
                                                <span
                                                    :class="user.twoFactorEnabled ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ user.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Account Flags -->
                                        <div v-if="hasAccountFlags" class="mt-4 pt-4 border-t border-mun-gray-200">
                                            <label class="text-sm font-medium text-mun-gray-600 mb-2 block">Account
                                                Flags</label>
                                            <div class="flex flex-wrap gap-2">
                                                <span v-if="user.requirePasswordChange"
                                                    class="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                    <ExclamationTriangleIcon class="w-3 h-3 mr-1" />
                                                    Password Change Required
                                                </span>

                                                <span v-if="user.isFirstLogin"
                                                    class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    <InformationCircleIcon class="w-3 h-3 mr-1" />
                                                    First Login Pending
                                                </span>

                                                <span v-if="user.accountLocked"
                                                    class="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                                    <LockClosedIcon class="w-3 h-3 mr-1" />
                                                    Account Locked
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Additional Information -->
                                    <div v-if="user.emergencyContact || user.adminNotes" class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <DocumentTextIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Additional Information
                                        </h3>

                                        <div class="space-y-4">
                                            <div v-if="user.emergencyContact">
                                                <label class="text-sm font-medium text-mun-gray-600">Emergency
                                                    Contact</label>
                                                <p class="text-mun-gray-900">{{ user.emergencyContact }}</p>
                                            </div>

                                            <div v-if="user.adminNotes">
                                                <label class="text-sm font-medium text-mun-gray-600 flex items-center">
                                                    Admin Notes
                                                    <span
                                                        class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Admin
                                                        Only</span>
                                                </label>
                                                <div class="mt-1 p-3 bg-mun-gray-50 rounded-lg">
                                                    <p class="text-mun-gray-700 whitespace-pre-wrap">{{ user.adminNotes
                                                    }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Statistics & Actions Sidebar -->
                                <div class="mt-2 space-y-2">
                                    <!-- Quick Stats -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <ChartBarIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Activity Statistics
                                        </h3>

                                        <div class="space-y-4">
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Sessions Attended</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    user.stats?.sessionsAttended || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Documents Submitted</span>
                                                <span class="font-semibold text-blue-600">{{
                                                    user.stats?.documentsSubmitted || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Votes Cast</span>
                                                <span class="font-semibold text-green-600">{{ user.stats?.votesCast || 0
                                                }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Messages Sent</span>
                                                <span class="font-semibold text-purple-600">{{ user.stats?.messagesSent
                                                    || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Login Count</span>
                                                <span class="font-semibold text-mun-gray-900">{{ user.stats?.loginCount
                                                    || 0 }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quick Actions -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Quick Actions</h3>

                                        <div class="space-y-3">
                                            <AppButton @click="editUser" variant="primary" size="sm" class="w-full">
                                                <PencilIcon class="w-4 h-4 mr-2" />
                                                Edit User
                                            </AppButton>

                                            <AppButton @click="sendPasswordReset" variant="outline" size="sm"
                                                class="w-full" :loading="isSendingReset">
                                                <KeyIcon class="w-4 h-4 mr-2" />
                                                Reset Password
                                            </AppButton>

                                            <AppButton @click="viewActivity" variant="outline" size="sm" class="w-full">
                                                <ClockIcon class="w-4 h-4 mr-2" />
                                                View Activity
                                            </AppButton>

                                            <AppButton @click="sendMessage" variant="outline" size="sm" class="w-full">
                                                <ChatBubbleLeftIcon class="w-4 h-4 mr-2" />
                                                Send Message
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Recent Activity -->
                                    <div v-if="user.recentActivity && user.recentActivity.length" class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Recent Activity</h3>

                                        <div class="space-y-3">
                                            <div v-for="activity in user.recentActivity.slice(0, 5)" :key="activity.id"
                                                class="flex items-start space-x-3 text-sm">
                                                <div :class="[
                                                    'w-2 h-2 rounded-full mt-2',
                                                    getActivityColor(activity.type)
                                                ]"></div>
                                                <div class="flex-1">
                                                    <p class="text-mun-gray-900">{{ activity.description }}</p>
                                                    <p class="text-mun-gray-500 text-xs">{{
                                                        formatDateTime(activity.timestamp) }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Account Security -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Security Status</h3>

                                        <div class="space-y-3">
                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-mun-gray-600">Password Strength</span>
                                                <span :class="[
                                                    'text-xs font-medium',
                                                    getPasswordStrengthColor(user.passwordStrength)
                                                ]">
                                                    {{ formatPasswordStrength(user.passwordStrength) }}
                                                </span>
                                            </div>

                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-mun-gray-600">Last Password Change</span>
                                                <span class="text-xs text-mun-gray-900">
                                                    {{ formatDate(user.lastPasswordChange) }}
                                                </span>
                                            </div>

                                            <div class="flex items-center justify-between">
                                                <span class="text-sm text-mun-gray-600">Failed Login Attempts</span>
                                                <span :class="[
                                                    'text-xs font-medium',
                                                    (user.failedLoginAttempts || 0) > 0 ? 'text-red-600' : 'text-green-600'
                                                ]">
                                                    {{ user.failedLoginAttempts || 0 }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                        <div class="text-sm text-mun-gray-500">
                            User ID: {{ user?.id }} • Last updated {{ formatDateTime(user?.updatedAt) }}
                        </div>

                        <div class="flex space-x-3">
                            <AppButton @click="closeModal" variant="outline">
                                Close
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    CogIcon,
    DocumentTextIcon,
    ChartBarIcon,
    PencilIcon,
    KeyIcon,
    ClockIcon,
    ChatBubbleLeftIcon,
    ExclamationTriangleIcon,
    LockClosedIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    user: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'edit', 'view-activity', 'send-message'])

const toast = useToast()

// State
const isSendingReset = ref(false)

// Computed
const hasAccountFlags = computed(() => {
    return props.user?.requirePasswordChange ||
        props.user?.isFirstLogin ||
        props.user?.accountLocked
})

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
}

const getUserInitials = () => {
    if (props.user?.firstName && props.user?.lastName) {
        return `${props.user.firstName[0]}${props.user.lastName[0]}`.toUpperCase()
    }
    return props.user?.username?.charAt(0).toUpperCase() || 'U'
}

const formatRole = (role) => {
    const roleMap = {
        'admin': 'Administrator',
        'presidium': 'Presidium Member',
        'delegate': 'Delegate'
    }
    return roleMap[role] || role
}

const formatStatus = (status) => {
    const statusMap = {
        'active': 'Active',
        'inactive': 'Inactive',
        'suspended': 'Suspended',
        'pending': 'Pending'
    }
    return statusMap[status] || status
}

const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role
}

const formatExperienceLevel = (level) => {
    const levelMap = {
        'beginner': 'Beginner (0-1 conferences)',
        'intermediate': 'Intermediate (2-5 conferences)',
        'advanced': 'Advanced (5+ conferences)',
        'expert': 'Expert/Veteran'
    }
    return levelMap[level] || level
}

const getRoleClasses = (role) => {
    const classMap = {
        'admin': 'bg-red-100 text-red-800',
        'presidium': 'bg-blue-100 text-blue-800',
        'delegate': 'bg-green-100 text-green-800'
    }
    return classMap[role] || 'bg-gray-100 text-gray-800'
}

const getStatusClasses = (status) => {
    const classMap = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'suspended': 'bg-red-100 text-red-800',
        'pending': 'bg-yellow-100 text-yellow-800'
    }
    return classMap[status] || 'bg-gray-100 text-gray-800'
}

const getLanguageName = (code) => {
    const languageMap = {
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'ar': 'Arabic',
        'ru': 'Russian',
        'zh': 'Chinese'
    }
    return languageMap[code] || code || 'Not set'
}

const getCountryName = (code) => {
    // This would typically come from a countries lookup
    return code || 'Not set'
}

const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const formatDateTime = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getActivityColor = (type) => {
    const colorMap = {
        'login': 'bg-blue-500',
        'logout': 'bg-gray-500',
        'document': 'bg-green-500',
        'vote': 'bg-purple-500',
        'message': 'bg-yellow-500',
        'session': 'bg-red-500'
    }
    return colorMap[type] || 'bg-mun-gray-500'
}

const formatPasswordStrength = (strength) => {
    const strengthMap = {
        'weak': 'Weak',
        'fair': 'Fair',
        'good': 'Good',
        'strong': 'Strong'
    }
    return strengthMap[strength] || 'Unknown'
}

const getPasswordStrengthColor = (strength) => {
    const colorMap = {
        'weak': 'text-red-600',
        'fair': 'text-yellow-600',
        'good': 'text-blue-600',
        'strong': 'text-green-600'
    }
    return colorMap[strength] || 'text-mun-gray-600'
}

const editUser = () => {
    emit('edit', props.user)
    closeModal()
}

const sendPasswordReset = async () => {
    try {
        isSendingReset.value = true

        await apiMethods.admin.users.resetPassword(props.user.id)

        toast.success('Password reset email sent successfully')

    } catch (error) {
        toast.error('Failed to send password reset:', error)
        toast.error('Failed to send password reset email')
    } finally {
        isSendingReset.value = false
    }
}

const viewActivity = () => {
    emit('view-activity', props.user)
    closeModal()
}

const sendMessage = () => {
    emit('send-message', props.user)
    closeModal()
}
</script>

<style scoped>
</style>