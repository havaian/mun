<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <BuildingOfficeIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    {{ committee?.name || 'Committee Details' }}
                                </h2>
                                <p class="text-white/80 text-sm flex items-center space-x-2">
                                    <span>{{ committee?.acronym }}</span>
                                    <span v-if="committee?.type" class="px-2 py-0.5 bg-white/20 rounded text-xs">
                                        {{ formatCommitteeType(committee.type) }}
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
                    <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
                        <div v-if="!committee" class="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>

                        <div v-else class="p-6 space-y-8">
                            <!-- Committee Overview -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Main Information -->
                                <div class="lg:col-span-2 space-y-6">
                                    <!-- Basic Information -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Committee Information
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Full Name</label>
                                                <p class="text-mun-gray-900 font-medium">{{ committee.name }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Acronym</label>
                                                <p class="text-mun-gray-900 font-medium">{{ committee.acronym }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Type</label>
                                                <p class="text-mun-gray-900">{{ formatCommitteeType(committee.type) }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Status</label>
                                                <span :class="[
                                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                    getStatusClasses(committee.status)
                                                ]">
                                                    {{ formatStatus(committee.status) }}
                                                </span>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Working
                                                    Language</label>
                                                <p class="text-mun-gray-900">{{ getLanguageName(committee.language) }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Session
                                                    Duration</label>
                                                <p class="text-mun-gray-900">{{ committee.sessionDuration ?
                                                    `${committee.sessionDuration} minutes` : 'Not set' }}</p>
                                            </div>
                                        </div>

                                        <div v-if="committee.description" class="mt-4">
                                            <label class="text-sm font-medium text-mun-gray-600">Description</label>
                                            <p class="text-mun-gray-900 mt-1">{{ committee.description }}</p>
                                        </div>
                                    </div>

                                    <!-- Agenda Topics -->
                                    <div v-if="committee.agendaTopics && committee.agendaTopics.length"
                                        class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <DocumentTextIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Agenda Topics
                                        </h3>

                                        <div class="space-y-4">
                                            <div v-for="(topic, index) in committee.agendaTopics" :key="index"
                                                class="p-4 bg-mun-gray-50 rounded-lg">
                                                <h4 class="font-medium text-mun-gray-900 mb-2">
                                                    {{ index + 1 }}. {{ topic.title }}
                                                </h4>
                                                <p v-if="topic.description" class="text-sm text-mun-gray-600">
                                                    {{ topic.description }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Presidium -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <UsersIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Presidium
                                        </h3>

                                        <div class="space-y-4">
                                            <!-- Chairman -->
                                            <div v-if="committee.chairmanInfo"
                                                class="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                                                <div
                                                    class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <UserIcon class="w-5 h-5 text-white" />
                                                </div>
                                                <div class="flex-1">
                                                    <h4 class="font-medium text-blue-900">Chairman</h4>
                                                    <p class="text-blue-700">{{ committee.chairmanInfo.name }}</p>
                                                    <p class="text-sm text-blue-600">{{ committee.chairmanInfo.email }}
                                                    </p>
                                                </div>
                                            </div>

                                            <!-- Co-Chairman -->
                                            <div v-if="committee.coChairmanInfo"
                                                class="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                                                <div
                                                    class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                                    <UserIcon class="w-5 h-5 text-white" />
                                                </div>
                                                <div class="flex-1">
                                                    <h4 class="font-medium text-green-900">Co-Chairman</h4>
                                                    <p class="text-green-700">{{ committee.coChairmanInfo.name }}</p>
                                                    <p class="text-sm text-green-600">{{ committee.coChairmanInfo.email
                                                        }}</p>
                                                </div>
                                            </div>

                                            <!-- Additional Presidium Members -->
                                            <div v-if="committee.presidiumMembersInfo && committee.presidiumMembersInfo.length"
                                                class="space-y-3">
                                                <h4 class="font-medium text-mun-gray-900">Additional Members</h4>
                                                <div v-for="member in committee.presidiumMembersInfo" :key="member.id"
                                                    class="flex items-center space-x-4 p-3 bg-mun-gray-50 rounded-lg">
                                                    <div
                                                        class="w-8 h-8 bg-mun-gray-600 rounded-full flex items-center justify-center">
                                                        <UserIcon class="w-4 h-4 text-white" />
                                                    </div>
                                                    <div class="flex-1">
                                                        <p class="font-medium text-mun-gray-900">{{ member.name }}</p>
                                                        <p class="text-sm text-mun-gray-600">{{ member.email }} • {{
                                                            formatRole(member.role) }}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- No Presidium -->
                                            <div v-if="!hasPresidium" class="text-center py-8 text-mun-gray-500">
                                                <UsersIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>No presidium members assigned</p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Committee Settings -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Committee Features
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div
                                                class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                                <span class="text-sm font-medium text-mun-gray-900">Guest
                                                    Speakers</span>
                                                <span
                                                    :class="committee.allowGuestSpeakers ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ committee.allowGuestSpeakers ? 'Enabled' : 'Disabled' }}
                                                </span>
                                            </div>

                                            <div
                                                class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                                <span class="text-sm font-medium text-mun-gray-900">Voting System</span>
                                                <span
                                                    :class="committee.enableVoting ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ committee.enableVoting ? 'Enabled' : 'Disabled' }}
                                                </span>
                                            </div>

                                            <div
                                                class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                                <span class="text-sm font-medium text-mun-gray-900">Document
                                                    Sharing</span>
                                                <span
                                                    :class="committee.enableDocumentSharing ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ committee.enableDocumentSharing ? 'Enabled' : 'Disabled' }}
                                                </span>
                                            </div>

                                            <div
                                                class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                                <span class="text-sm font-medium text-mun-gray-900">Private
                                                    Messaging</span>
                                                <span
                                                    :class="committee.enablePrivateMessaging ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ committee.enablePrivateMessaging ? 'Enabled' : 'Disabled' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Additional Information -->
                                    <div v-if="committee.backgroundGuideUrl || committee.meetingRoom || committee.internalNotes"
                                        class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <AdjustmentsHorizontalIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Additional Information
                                        </h3>

                                        <div class="space-y-4">
                                            <div v-if="committee.backgroundGuideUrl">
                                                <label class="text-sm font-medium text-mun-gray-600">Background
                                                    Guide</label>
                                                <a :href="committee.backgroundGuideUrl" target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="block text-mun-blue hover:text-mun-blue-dark mt-1">
                                                    {{ committee.backgroundGuideUrl }}
                                                </a>
                                            </div>

                                            <div v-if="committee.meetingRoom">
                                                <label class="text-sm font-medium text-mun-gray-600">Meeting
                                                    Room</label>
                                                <p class="text-mun-gray-900 mt-1">{{ committee.meetingRoom }}</p>
                                            </div>

                                            <div v-if="committee.internalNotes">
                                                <label class="text-sm font-medium text-mun-gray-600 flex items-center">
                                                    Internal Notes
                                                    <span
                                                        class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Admin
                                                        Only</span>
                                                </label>
                                                <div class="mt-1 p-3 bg-mun-gray-50 rounded-lg">
                                                    <p class="text-mun-gray-700 whitespace-pre-wrap">{{
                                                        committee.internalNotes }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Statistics & Actions Sidebar -->
                                <div class="space-y-6">
                                    <!-- Quick Stats -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <ChartBarIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Statistics
                                        </h3>

                                        <div class="space-y-4">
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Delegates</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    committee.stats?.totalDelegates || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Active Sessions</span>
                                                <span class="font-semibold text-green-600">{{
                                                    committee.stats?.activeSessions || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Documents Submitted</span>
                                                <span class="font-semibold text-blue-600">{{
                                                    committee.stats?.documentsSubmitted || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Resolutions Passed</span>
                                                <span class="font-semibold text-purple-600">{{
                                                    committee.stats?.resolutionsPassed || 0 }}</span>
                                            </div>

                                            <!-- Capacity Progress -->
                                            <div v-if="committee.maxDelegates" class="pt-2">
                                                <div class="flex justify-between items-center mb-2">
                                                    <span class="text-sm text-mun-gray-600">Capacity</span>
                                                    <span class="text-sm font-medium">
                                                        {{ committee.stats?.totalDelegates || 0 }}/{{
                                                            committee.maxDelegates }}
                                                    </span>
                                                </div>
                                                <div class="w-full bg-mun-gray-200 rounded-full h-2">
                                                    <div class="bg-mun-blue rounded-full h-2 transition-all duration-300"
                                                        :style="{ width: `${getCapacityPercentage()}%` }">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quick Actions -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Quick Actions</h3>

                                        <div class="space-y-3">
                                            <AppButton @click="editCommittee" variant="primary" size="sm"
                                                class="w-full">
                                                <PencilIcon class="w-4 h-4 mr-2" />
                                                Edit Committee
                                            </AppButton>

                                            <AppButton @click="manageDelegates" variant="outline" size="sm"
                                                class="w-full">
                                                <UsersIcon class="w-4 h-4 mr-2" />
                                                Manage Delegates
                                            </AppButton>

                                            <AppButton @click="viewSessions" variant="outline" size="sm" class="w-full">
                                                <ClockIcon class="w-4 h-4 mr-2" />
                                                View Sessions
                                            </AppButton>

                                            <AppButton @click="exportData" variant="outline" size="sm" class="w-full"
                                                :loading="isExporting">
                                                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                                                Export Data
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Recent Activity -->
                                    <div v-if="committee.recentActivity && committee.recentActivity.length"
                                        class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Recent Activity</h3>

                                        <div class="space-y-3">
                                            <div v-for="activity in committee.recentActivity.slice(0, 5)"
                                                :key="activity.id" class="flex items-start space-x-3 text-sm">
                                                <div :class="[
                                                    'w-2 h-2 rounded-full mt-2',
                                                    getActivityColor(activity.type)
                                                ]"></div>
                                                <div class="flex-1">
                                                    <p class="text-mun-gray-900">{{ activity.description }}</p>
                                                    <p class="text-mun-gray-500 text-xs">{{
                                                        formatDate(activity.timestamp) }}</p>
                                                </div>
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
                            Created {{ formatDate(committee?.createdAt) }} • Last updated {{
                                formatDate(committee?.updatedAt) }}
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
    BuildingOfficeIcon,
    InformationCircleIcon,
    DocumentTextIcon,
    UsersIcon,
    CogIcon,
    AdjustmentsHorizontalIcon,
    ChartBarIcon,
    PencilIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    UserIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    committee: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'edit', 'manage-delegates', 'view-sessions'])

const toast = useToast()

// State
const isExporting = ref(false)

// Computed
const hasPresidium = computed(() => {
    return props.committee?.chairmanInfo ||
        props.committee?.coChairmanInfo ||
        (props.committee?.presidiumMembersInfo && props.committee.presidiumMembersInfo.length > 0)
})

const getCapacityPercentage = () => {
    if (!props.committee?.maxDelegates) return 0
    const total = props.committee.stats?.totalDelegates || 0
    return Math.min(100, (total / props.committee.maxDelegates) * 100)
}

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
}

const formatCommitteeType = (type) => {
    const typeMap = {
        'ga': 'General Assembly',
        'sc': 'Security Council',
        'ecosoc': 'Economic and Social Council',
        'tc': 'Trusteeship Council',
        'icj': 'International Court of Justice',
        'specialized': 'Specialized Agency',
        'regional': 'Regional Organization',
        'crisis': 'Crisis Committee',
        'joint': 'Joint Committee',
        'historical': 'Historical Committee'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'active': 'Active',
        'inactive': 'Inactive',
        'draft': 'Draft'
    }
    return statusMap[status] || status
}

const getStatusClasses = (status) => {
    const classMap = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-red-100 text-red-800',
        'draft': 'bg-gray-100 text-gray-800'
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

const formatRole = (role) => {
    const roleMap = {
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role
}

const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const getActivityColor = (type) => {
    const colorMap = {
        'created': 'bg-blue-500',
        'updated': 'bg-green-500',
        'session': 'bg-purple-500',
        'document': 'bg-yellow-500',
        'vote': 'bg-red-500'
    }
    return colorMap[type] || 'bg-mun-gray-500'
}

const editCommittee = () => {
    emit('edit', props.committee)
    closeModal()
}

const manageDelegates = () => {
    emit('manage-delegates', props.committee)
    closeModal()
}

const viewSessions = () => {
    emit('view-sessions', props.committee)
    closeModal()
}

const exportData = async () => {
    try {
        isExporting.value = true

        const response = await apiMethods.get(`/admin/committees/${props.committee.id}/export`, {
            responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${props.committee.acronym}-data-export.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success('Committee data exported successfully')

    } catch (error) {
        toast.error('Export failed:', error)
        toast.error('Failed to export committee data')
    } finally {
        isExporting.value = false
    }
}
</script>

<style scoped>
.mun-card {
    @apply bg-white rounded-xl shadow-sm border border-mun-gray-100;
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>