<template>
    <div class="w-full max-w-5xl mx-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div class="flex items-center space-x-4">
                <div
                    class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UsersIcon class="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">{{ coalition?.name || 'Coalition Details' }}</h3>
                    <div class="flex items-center space-x-3 mt-1">
                        <span :class="[
                            'text-xs px-2 py-1 rounded-full',
                            getStatusColor(coalition?.status)
                        ]">
                            {{ coalition?.status?.toUpperCase() }}
                        </span>
                        <span class="text-sm text-gray-500">
                            {{ coalition?.members?.length || 0 }} member{{ (coalition?.members?.length || 0) !== 1 ? 's'
                            : '' }}
                        </span>
                        <span class="text-sm text-gray-500">
                            Created {{ coalition?.createdAt ? formatRelativeTime(coalition.createdAt) : '' }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex items-center space-x-3">
                <!-- Actions Menu -->
                <div v-if="canManage" class="relative">
                    <button @click="showActionsMenu = !showActionsMenu"
                        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <EllipsisVerticalIcon class="w-5 h-5" />
                    </button>

                    <!-- Actions Dropdown -->
                    <div v-if="showActionsMenu" v-click-away="() => showActionsMenu = false"
                        class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button v-if="canEdit" @click="editCoalition"
                            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <PencilIcon class="w-4 h-4 mr-3" />
                            Edit Coalition
                        </button>

                        <button v-if="canManageMembers" @click="manageMembers"
                            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <UserPlusIcon class="w-4 h-4 mr-3" />
                            Manage Members
                        </button>

                        <button v-if="canCreateDocument" @click="createDocument"
                            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <DocumentPlusIcon class="w-4 h-4 mr-3" />
                            Create Document
                        </button>

                        <div class="border-t border-gray-100 my-1"></div>

                        <button v-if="canLeave" @click="leaveCoalition"
                            class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <ArrowLeftOnRectangleIcon class="w-4 h-4 mr-3" />
                            Leave Coalition
                        </button>

                        <button v-if="canDisband" @click="disbandCoalition"
                            class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <TrashIcon class="w-4 h-4 mr-3" />
                            Disband Coalition
                        </button>
                    </div>
                </div>

                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <LoadingSpinner class="w-8 h-8 text-un-blue" />
        </div>

        <!-- Coalition Content -->
        <div v-else class="bg-white">
            <!-- Main Content Area -->
            <div class="p-6 max-h-[70vh] overflow-y-auto">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Main Information -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Basic Information -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <h4 class="text-base font-medium text-gray-900 mb-4">Coalition Information</h4>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Coalition Name</label>
                                    <p class="text-sm text-gray-900">{{ coalition?.name }}</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Type</label>
                                    <p class="text-sm text-gray-900">{{ formatCoalitionType(coalition?.type) }}</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Focus Area</label>
                                    <p class="text-sm text-gray-900">{{ formatFocusArea(coalition?.focusArea) }}</p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Created By</label>
                                    <p class="text-sm text-gray-900">{{ coalition?.createdBy?.name }} ({{
                                        coalition?.createdBy?.country }})</p>
                                </div>

                                <div class="md:col-span-2" v-if="coalition?.description">
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Description</label>
                                    <p class="text-sm text-gray-900">{{ coalition.description }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Members List -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-base font-medium text-gray-900">
                                    Members ({{ coalition?.members?.length || 0 }})
                                </h4>
                                <div v-if="coalition?.head" class="text-sm text-gray-500">
                                    Led by {{ coalition.head.country }}
                                </div>
                            </div>

                            <div class="space-y-3">
                                <div v-for="member in coalition?.members || []" :key="member.id"
                                    class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <img :src="member.flagUrl" :alt="member.country" class="w-8 h-6 rounded-sm" />
                                        <div>
                                            <p class="text-sm font-medium text-gray-900">{{ member.country }}</p>
                                            <p class="text-xs text-gray-500">{{ member.delegateName }}</p>
                                        </div>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <!-- Head Badge -->
                                        <span v-if="member.isHead"
                                            class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            Coalition Head
                                        </span>

                                        <!-- Status Badge -->
                                        <span :class="[
                                            'text-xs px-2 py-1 rounded-full',
                                            getMemberStatusColor(member.status)
                                        ]">
                                            {{ member.status }}
                                        </span>

                                        <!-- Join Date -->
                                        <span class="text-xs text-gray-400">
                                            Joined {{ formatRelativeTime(member.joinedAt) }}
                                        </span>

                                        <!-- Actions -->
                                        <div v-if="canManageMembers && !member.isHead"
                                            class="flex items-center space-x-1">
                                            <button @click="removeMember(member)"
                                                class="text-red-400 hover:text-red-600" title="Remove member">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pending Invitations -->
                        <div v-if="pendingInvitations.length > 0" class="bg-gray-50 rounded-lg p-6">
                            <h4 class="text-base font-medium text-gray-900 mb-4">
                                Pending Invitations ({{ pendingInvitations.length }})
                            </h4>

                            <div class="space-y-2">
                                <div v-for="invitation in pendingInvitations" :key="invitation.id"
                                    class="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <img :src="invitation.flagUrl" :alt="invitation.country"
                                            class="w-6 h-4 rounded-sm" />
                                        <span class="text-sm text-gray-900">{{ invitation.country }}</span>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <span class="text-xs text-gray-500">
                                            Sent {{ formatRelativeTime(invitation.sentAt) }}
                                        </span>
                                        <button v-if="canManageMembers" @click="cancelInvitation(invitation)"
                                            class="text-red-400 hover:text-red-600" title="Cancel invitation">
                                            <XMarkIcon class="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Documents -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-base font-medium text-gray-900">
                                    Coalition Documents ({{ coalitionDocuments.length }})
                                </h4>
                                <button v-if="canCreateDocument" @click="createDocument"
                                    class="text-sm text-un-blue hover:text-un-blue-600 font-medium">
                                    + Create Document
                                </button>
                            </div>

                            <div v-if="coalitionDocuments.length === 0" class="text-center py-8">
                                <DocumentIcon class="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p class="text-sm text-gray-500">No documents created yet</p>
                            </div>

                            <div v-else class="space-y-3">
                                <div v-for="document in coalitionDocuments" :key="document.id"
                                    class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300"
                                    @click="viewDocument(document)">
                                    <div class="flex items-center space-x-3">
                                        <div :class="['p-2 rounded-lg', getDocumentTypeColor(document.type)]">
                                            <DocumentIcon class="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium text-gray-900">{{ document.title }}</p>
                                            <p class="text-xs text-gray-500">
                                                {{ document.type }} • Created {{ formatRelativeTime(document.createdAt)
                                                }}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <span :class="[
                                            'text-xs px-2 py-1 rounded-full',
                                            getDocumentStatusColor(document.status)
                                        ]">
                                            {{ document.status.replace('_', ' ').toUpperCase() }}
                                        </span>

                                        <EyeIcon class="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="space-y-6">
                        <!-- Quick Stats -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <h4 class="text-base font-medium text-gray-900 mb-4">Statistics</h4>

                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-600">Total Members</span>
                                    <span class="text-sm font-medium text-gray-900">{{ coalition?.members?.length || 0
                                        }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-600">Documents Created</span>
                                    <span class="text-sm font-medium text-gray-900">{{ coalitionDocuments.length
                                        }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-600">Days Active</span>
                                    <span class="text-sm font-medium text-gray-900">{{ daysActive }}</span>
                                </div>

                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-600">Success Rate</span>
                                    <span class="text-sm font-medium text-green-600">{{ successRate }}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Activity -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <h4 class="text-base font-medium text-gray-900 mb-4">Recent Activity</h4>

                            <div v-if="recentActivity.length === 0" class="text-center py-6">
                                <ClockIcon class="w-6 h-6 text-gray-300 mx-auto mb-2" />
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
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Coalition Rules (if any) -->
                        <div v-if="coalition?.rules?.length > 0" class="bg-gray-50 rounded-lg p-6">
                            <h4 class="text-base font-medium text-gray-900 mb-4">Coalition Rules</h4>

                            <div class="space-y-2">
                                <div v-for="(rule, index) in coalition.rules" :key="index"
                                    class="text-sm text-gray-700">
                                    {{ index + 1 }}. {{ rule }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
    UsersIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    UserPlusIcon,
    DocumentPlusIcon,
    ArrowLeftOnRectangleIcon,
    TrashIcon,
    DocumentIcon,
    EyeIcon,
    ClockIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
const props = defineProps({
    coalitionId: {
        type: String,
        required: true
    },
    onUpdate: {
        type: Function,
        default: () => { }
    }
})

const emit = defineEmits(['close', 'edit', 'manage', 'leave'])

// Composables
const toast = useToast()
const authStore = useAuthStore()

// State
const isLoading = ref(true)
const coalition = ref(null)
const coalitionDocuments = ref([])
const pendingInvitations = ref([])
const recentActivity = ref([])
const showActionsMenu = ref(false)

// Computed
const canManage = computed(() => {
    return coalition.value?.head?.userId === authStore.user?.id ||
        authStore.user?.role === 'admin' ||
        authStore.user?.role?.includes('chair')
})

const canEdit = computed(() => {
    return canManage.value
})

const canManageMembers = computed(() => {
    return canManage.value
})

const canCreateDocument = computed(() => {
    return coalition.value?.members?.some(m => m.userId === authStore.user?.id) &&
        coalition.value?.status === 'active'
})

const canLeave = computed(() => {
    return coalition.value?.members?.some(m => m.userId === authStore.user?.id) &&
        !coalition.value?.head?.userId === authStore.user?.id
})

const canDisband = computed(() => {
    return coalition.value?.head?.userId === authStore.user?.id ||
        authStore.user?.role === 'admin'
})

const daysActive = computed(() => {
    if (!coalition.value?.createdAt) return 0
    const now = new Date()
    const created = new Date(coalition.value.createdAt)
    return Math.floor((now - created) / (1000 * 60 * 60 * 24))
})

const successRate = computed(() => {
    if (coalitionDocuments.value.length === 0) return 0
    const approved = coalitionDocuments.value.filter(d => d.status === 'approved').length
    return Math.round((approved / coalitionDocuments.value.length) * 100)
})

// Methods
const loadCoalitionDetails = async () => {
    isLoading.value = true

    try {
        // Load coalition details
        const coalitionResponse = await apiMethods.coalitions.getById(props.coalitionId)
        coalition.value = coalitionResponse.data

        // Load coalition documents
        // This would be an API call to get documents by coalition
        coalitionDocuments.value = coalition.value.documents || []

        // Load pending invitations
        pendingInvitations.value = coalition.value.pendingInvitations || []

        // Load recent activity
        const activityResponse = await apiMethods.coalitions.getActivity(props.coalitionId)
        recentActivity.value = activityResponse.data || []

    } catch (error) {
        console.error('Load coalition details error:', error)
        toast.error('Failed to load coalition details')
    } finally {
        isLoading.value = false
    }
}

const editCoalition = () => {
    showActionsMenu.value = false
    emit('edit', coalition.value)
}

const manageMembers = () => {
    showActionsMenu.value = false
    emit('manage', coalition.value)
}

const createDocument = () => {
    showActionsMenu.value = false
    // This would open the document creation modal with coalition pre-selected
    toast.info('Document creation modal would open here')
}

const leaveCoalition = async () => {
    showActionsMenu.value = false

    if (!confirm('Are you sure you want to leave this coalition? This action cannot be undone.')) {
        return
    }

    try {
        await apiMethods.coalitions.leave(props.coalitionId)
        toast.success('Successfully left the coalition')
        emit('leave', coalition.value)
        emit('close')
    } catch (error) {
        console.error('Leave coalition error:', error)
        toast.error('Failed to leave coalition')
    }
}

const disbandCoalition = async () => {
    showActionsMenu.value = false

    if (!confirm('Are you sure you want to disband this coalition? This will remove all members and cannot be undone.')) {
        return
    }

    try {
        await apiMethods.coalitions.delete(props.coalitionId)
        toast.success('Coalition disbanded successfully')
        emit('close')
    } catch (error) {
        console.error('Disband coalition error:', error)
        toast.error('Failed to disband coalition')
    }
}

const removeMember = async (member) => {
    if (!confirm(`Are you sure you want to remove ${member.country} from the coalition?`)) {
        return
    }

    try {
        await apiMethods.coalitions.removeMember(props.coalitionId, member.id)
        toast.success(`${member.country} removed from coalition`)
        loadCoalitionDetails() // Reload to update member list
    } catch (error) {
        console.error('Remove member error:', error)
        toast.error('Failed to remove member')
    }
}

const cancelInvitation = async (invitation) => {
    try {
        // This would be an API call to cancel the invitation
        toast.success(`Invitation to ${invitation.country} cancelled`)
        loadCoalitionDetails() // Reload to update invitations
    } catch (error) {
        console.error('Cancel invitation error:', error)
        toast.error('Failed to cancel invitation')
    }
}

const viewDocument = (document) => {
    // This would open the document view modal
    console.log('View document:', document.id)
}

// Helper functions
const getStatusColor = (status) => {
    const colors = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        inactive: 'bg-gray-100 text-gray-700',
        disbanded: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const getMemberStatusColor = (status) => {
    const colors = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        invited: 'bg-blue-100 text-blue-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const getDocumentTypeColor = (type) => {
    const colors = {
        resolution: 'bg-blue-500',
        amendment: 'bg-purple-500',
        position_paper: 'bg-green-500',
        working_paper: 'bg-orange-500'
    }
    return colors[type] || 'bg-gray-500'
}

const getDocumentStatusColor = (status) => {
    const colors = {
        draft: 'bg-gray-100 text-gray-700',
        under_review: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const getActivityColor = (type) => {
    const colors = {
        member_joined: 'bg-green-500',
        member_left: 'bg-red-500',
        document_created: 'bg-blue-500',
        document_approved: 'bg-green-600',
        invitation_sent: 'bg-yellow-500',
        coalition_activated: 'bg-purple-500'
    }
    return colors[type] || 'bg-gray-500'
}

const getActivityIcon = (type) => {
    const icons = {
        member_joined: UserPlusIcon,
        member_left: ArrowLeftOnRectangleIcon,
        document_created: DocumentPlusIcon,
        document_approved: DocumentIcon,
        invitation_sent: UsersIcon,
        coalition_activated: UsersIcon
    }
    return icons[type] || ClockIcon
}

const formatCoalitionType = (type) => {
    const types = {
        formal: 'Formal Coalition',
        working_group: 'Working Group',
        bloc: 'Regional/Interest Bloc',
        negotiating_group: 'Negotiating Group'
    }
    return types[type] || type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'
}

const formatFocusArea = (area) => {
    const areas = {
        political_security: 'Political & Security',
        economic_social: 'Economic & Social',
        humanitarian: 'Humanitarian Affairs',
        environment: 'Environmental Issues',
        legal: 'Legal Affairs',
        disarmament: 'Disarmament',
        human_rights: 'Human Rights',
        development: 'Sustainable Development',
        peacekeeping: 'Peacekeeping',
        counter_terrorism: 'Counter-Terrorism'
    }
    return areas[area] || area?.replace('_', ' ').toUpperCase() || 'Unknown'
}

const formatRelativeTime = (date) => {
    if (!date) return 'Unknown'

    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

// Lifecycle
onMounted(() => {
    loadCoalitionDetails()
})
</script>