<!-- frontend/src/components/delegate/CoalitionCard.vue -->
<template>
    <div :class="[
        'coalition-card bg-white border rounded-lg p-4 transition-all duration-200',
        'hover:shadow-mun hover:border-mun-blue/30',
        getStatusBorderClass()
    ]">
        <!-- Coalition Header -->
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-start space-x-3 flex-1">
                <!-- Coalition Icon -->
                <div :class="getCoalitionIconBg()" class="p-2 rounded-lg flex-shrink-0">
                    <UserGroupIcon class="w-5 h-5" :class="getCoalitionIconColor()" />
                </div>

                <!-- Coalition Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                        <h4 class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ coalition.name }}
                        </h4>
                        <span :class="getStatusBadgeClass()" class="px-2 py-1 text-xs font-medium rounded-full">
                            {{ getStatusText() }}
                        </span>
                        <span v-if="isUserHead"
                            class="px-2 py-1 text-xs font-medium bg-mun-blue/10 text-mun-blue rounded-full">
                            HEAD
                        </span>
                    </div>

                    <p v-if="coalition.description" class="text-xs text-mun-gray-600 line-clamp-2 mb-2">
                        {{ coalition.description }}
                    </p>

                    <div class="flex items-center space-x-4 text-xs text-mun-gray-500">
                        <span class="flex items-center">
                            <UserIcon class="w-3 h-3 mr-1" />
                            {{ coalition.headCountry }}
                        </span>
                        <span class="flex items-center">
                            <ClockIcon class="w-3 h-3 mr-1" />
                            {{ formatDate(coalition.createdAt) }}
                        </span>
                        <span class="flex items-center">
                            <UsersIcon class="w-3 h-3 mr-1" />
                            {{ memberCount }} member{{ memberCount !== 1 ? 's' : '' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Actions Dropdown -->
            <div class="relative">
                <button @click="showActions = !showActions"
                    class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors">
                    <EllipsisVerticalIcon class="w-4 h-4 text-mun-gray-600" />
                </button>

                <div v-if="showActions"
                    class="actions-dropdown absolute right-0 top-8 z-10 w-48 bg-white border border-mun-gray-200 rounded-lg shadow-mun py-1">
                    <button @click="viewDetails"
                        class="w-full px-3 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 transition-colors">
                        <EyeIcon class="w-4 h-4 mr-2 inline" />
                        View Details
                    </button>

                    <button v-if="canJoin" @click="requestToJoin" :disabled="isUpdating"
                        class="w-full px-3 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 transition-colors disabled:opacity-50">
                        <PlusIcon class="w-4 h-4 mr-2 inline" />
                        Request to Join
                    </button>

                    <button v-if="canLeave" @click="leaveCoalition" :disabled="isUpdating"
                        class="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50">
                        <ArrowRightOnRectangleIcon class="w-4 h-4 mr-2 inline" />
                        Leave Coalition
                    </button>

                    <div v-if="isUserHead" class="border-t border-mun-gray-200 my-1"></div>

                    <button v-if="isUserHead" @click="manageMembers"
                        class="w-full px-3 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 transition-colors">
                        <CogIcon class="w-4 h-4 mr-2 inline" />
                        Manage Members
                    </button>

                    <button v-if="isUserHead && coalition.status === 'draft'" @click="activateCoalition"
                        :disabled="isUpdating || !canActivate"
                        class="w-full px-3 py-2 text-left text-sm text-mun-green-700 hover:bg-mun-green-50 transition-colors disabled:opacity-50">
                        <CheckIcon class="w-4 h-4 mr-2 inline" />
                        Activate Coalition
                    </button>
                </div>
            </div>
        </div>

        <!-- Members Preview -->
        <div class="members-preview mb-3">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-mun-gray-700">Members</span>
                <span class="text-xs text-mun-gray-500">{{ acceptedMembers.length }}/{{ coalition.members.length
                }}</span>
            </div>

            <div class="flex items-center space-x-2">
                <!-- Head Country -->
                <div class="member-item flex items-center space-x-1 px-2 py-1 bg-mun-blue/10 rounded-full">
                    <CountryFlag :country="coalition.headCountry" size="xs" />
                    <span class="text-xs font-medium text-mun-blue">{{ coalition.headCountry }}</span>
                    <CrownIcon class="w-3 h-3 text-mun-blue" />
                </div>

                <!-- Accepted Members -->
                <div v-for="member in visibleMembers" :key="member.email"
                    class="member-item flex items-center space-x-1 px-2 py-1 bg-mun-green-50 border border-mun-green-200 rounded-full">
                    <CountryFlag :country="member.country" size="xs" />
                    <span class="text-xs font-medium text-mun-green-700">{{ member.country }}</span>
                </div>

                <!-- Pending Members -->
                <div v-for="member in pendingMembers.slice(0, 2)" :key="member.email"
                    class="member-item flex items-center space-x-1 px-2 py-1 bg-mun-yellow-50 border border-mun-yellow-200 rounded-full">
                    <CountryFlag :country="member.country" size="xs" />
                    <span class="text-xs font-medium text-mun-yellow-700">{{ member.country }}</span>
                    <ClockIcon class="w-3 h-3 text-mun-yellow-600" />
                </div>

                <!-- More indicator -->
                <div v-if="hiddenMembersCount > 0" class="more-members px-2 py-1 bg-mun-gray-100 rounded-full">
                    <span class="text-xs text-mun-gray-600">+{{ hiddenMembersCount }}</span>
                </div>
            </div>
        </div>

        <!-- Coalition Progress -->
        <div v-if="coalition.status === 'draft'" class="coalition-progress mb-3">
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-mun-gray-700">Formation Progress</span>
                <span class="text-xs text-mun-gray-500">{{ progressPercentage }}%</span>
            </div>

            <div class="progress-bar w-full bg-mun-gray-200 rounded-full h-2">
                <div :class="getProgressBarClass()" class="h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${progressPercentage}%` }"></div>
            </div>

            <div class="flex items-center justify-between mt-1 text-xs text-mun-gray-500">
                <span>{{ acceptedMembers.length }} accepted</span>
                <span>{{ coalition.minMembers || 3 }} required</span>
            </div>
        </div>

        <!-- Resolution Status -->
        <div v-if="coalition.resolutionId || coalition.status === 'active'" class="resolution-status mb-3">
            <div class="flex items-center justify-between p-2 bg-mun-gray-50 rounded-lg">
                <div class="flex items-center space-x-2">
                    <DocumentTextIcon class="w-4 h-4 text-mun-gray-600" />
                    <div>
                        <span class="text-xs font-medium text-mun-gray-900">
                            {{ coalition.resolutionId ? 'Resolution Submitted' : 'Ready for Resolution' }}
                        </span>
                        <p v-if="coalition.resolutionTitle" class="text-xs text-mun-gray-600">
                            {{ coalition.resolutionTitle }}
                        </p>
                    </div>
                </div>

                <span v-if="coalition.resolutionStatus" :class="getResolutionStatusBadgeClass()"
                    class="px-2 py-1 text-xs font-medium rounded">
                    {{ getResolutionStatusText() }}
                </span>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <!-- View Details Button -->
                <button @click="viewDetails"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded hover:bg-mun-blue/20 transition-colors">
                    <EyeIcon class="w-4 h-4 mr-1" />
                    View
                </button>

                <!-- Join/Leave Button -->
                <button v-if="canJoin" @click="requestToJoin" :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-mun-green-600 border border-mun-green-600 rounded hover:bg-mun-green-700 transition-colors disabled:opacity-50">
                    <PlusIcon class="w-4 h-4 mr-1" />
                    {{ isUpdating ? 'Requesting...' : 'Join' }}
                </button>

                <button v-else-if="canLeave" @click="leaveCoalition" :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-mun-red-600 border border-mun-red-600 rounded hover:bg-mun-red-700 transition-colors disabled:opacity-50">
                    <ArrowRightOnRectangleIcon class="w-4 h-4 mr-1" />
                    {{ isUpdating ? 'Leaving...' : 'Leave' }}
                </button>
            </div>

            <!-- Head Actions -->
            <div v-if="isUserHead" class="flex items-center space-x-2">
                <button @click="manageMembers"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-gray-700 bg-mun-gray-100 border border-mun-gray-200 rounded hover:bg-mun-gray-200 transition-colors">
                    <CogIcon class="w-4 h-4 mr-1" />
                    Manage
                </button>

                <button v-if="coalition.status === 'active' && !coalition.resolutionId" @click="submitResolution"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-mun-blue border border-mun-blue rounded hover:bg-mun-blue-600 transition-colors">
                    <DocumentTextIcon class="w-4 h-4 mr-1" />
                    Submit Resolution
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
    UserGroupIcon,
    UserIcon,
    ClockIcon,
    UsersIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PlusIcon,
    ArrowRightOnRectangleIcon,
    CogIcon,
    CheckIcon,
    DocumentTextIcon
} from '@heroicons/vue/24/outline'
import { CrownIcon } from '@heroicons/vue/24/solid'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    coalition: {
        type: Object,
        required: true
    },
    userMembership: {
        type: Object,
        default: null // User's membership status in this coalition
    }
})

// Emits
const emit = defineEmits([
    'view-details',
    'join-requested',
    'left-coalition',
    'manage-members',
    'submit-resolution',
    'activate-coalition'
])

const authStore = useAuthStore()
const toast = useToast()

// State
const isUpdating = ref(false)
const showActions = ref(false)

// Computed
const isUserHead = computed(() => {
    return authStore.user?.email === props.coalition.headEmail
})

const memberCount = computed(() => {
    return props.coalition.members?.length || 0
})

const acceptedMembers = computed(() => {
    return props.coalition.members?.filter(member => member.status === 'accepted') || []
})

const pendingMembers = computed(() => {
    return props.coalition.members?.filter(member => member.status === 'invited') || []
})

const visibleMembers = computed(() => {
    // Show first 3 accepted members (excluding head)
    return acceptedMembers.value.slice(0, 3)
})

const hiddenMembersCount = computed(() => {
    const total = acceptedMembers.value.length + pendingMembers.value.length
    const visible = visibleMembers.value.length + Math.min(pendingMembers.value.length, 2)
    return Math.max(0, total - visible)
})

const progressPercentage = computed(() => {
    const minMembers = props.coalition.minMembers || 3
    const currentMembers = acceptedMembers.value.length + 1 // +1 for head
    return Math.min(100, Math.round((currentMembers / minMembers) * 100))
})

const canJoin = computed(() => {
    return !isUserHead.value &&
        !props.userMembership &&
        props.coalition.status === 'draft' &&
        props.coalition.isActive !== false
})

const canLeave = computed(() => {
    return !isUserHead.value &&
        props.userMembership &&
        ['accepted', 'invited'].includes(props.userMembership.status)
})

const canActivate = computed(() => {
    const minMembers = props.coalition.minMembers || 3
    const currentMembers = acceptedMembers.value.length + 1 // +1 for head
    return currentMembers >= minMembers
})

// Style methods
const getStatusBorderClass = () => {
    const status = props.coalition.status || 'draft'
    const classes = {
        draft: 'border-mun-gray-200',
        active: 'border-mun-green-300',
        closed: 'border-mun-red-300'
    }
    return classes[status] || 'border-mun-gray-200'
}

const getCoalitionIconBg = () => {
    const status = props.coalition.status || 'draft'
    const backgrounds = {
        draft: 'bg-mun-yellow-100',
        active: 'bg-mun-green-100',
        closed: 'bg-mun-red-100'
    }
    return backgrounds[status] || 'bg-mun-gray-100'
}

const getCoalitionIconColor = () => {
    const status = props.coalition.status || 'draft'
    const colors = {
        draft: 'text-mun-yellow-700',
        active: 'text-mun-green-700',
        closed: 'text-mun-red-700'
    }
    return colors[status] || 'text-mun-gray-600'
}

const getStatusBadgeClass = () => {
    const status = props.coalition.status || 'draft'
    const classes = {
        draft: 'bg-mun-yellow-100 text-mun-yellow-700',
        active: 'bg-mun-green-100 text-mun-green-700',
        closed: 'bg-mun-red-100 text-mun-red-700'
    }
    return classes[status] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getStatusText = () => {
    const status = props.coalition.status || 'draft'
    const texts = {
        draft: 'Forming',
        active: 'Active',
        closed: 'Closed'
    }
    return texts[status] || 'Unknown'
}

const getProgressBarClass = () => {
    if (progressPercentage.value >= 100) {
        return 'bg-mun-green-500'
    } else if (progressPercentage.value >= 75) {
        return 'bg-mun-yellow-500'
    }
    return 'bg-mun-blue'
}

const getResolutionStatusBadgeClass = () => {
    const status = props.coalition.resolutionStatus
    const classes = {
        draft: 'bg-mun-gray-100 text-mun-gray-700',
        submitted: 'bg-mun-blue-100 text-mun-blue-700',
        under_review: 'bg-mun-yellow-100 text-mun-yellow-700',
        approved: 'bg-mun-green-100 text-mun-green-700',
        rejected: 'bg-mun-red-100 text-mun-red-700'
    }
    return classes[status] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getResolutionStatusText = () => {
    const status = props.coalition.resolutionStatus
    const texts = {
        draft: 'Draft',
        submitted: 'Submitted',
        under_review: 'Under Review',
        approved: 'Approved',
        rejected: 'Rejected'
    }
    return texts[status] || 'Unknown'
}

// Methods
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    } catch {
        return 'Unknown date'
    }
}

const viewDetails = () => {
    showActions.value = false
    emit('view-details', props.coalition)
}

const requestToJoin = async () => {
    try {
        isUpdating.value = true

        const response = await apiMethods.coalitions.requestToJoin(props.coalition._id)

        if (response.data.success) {
            emit('join-requested', {
                coalition: props.coalition,
                request: response.data.request
            })
            toast.success('Join request sent successfully')
        }

    } catch (error) {
        console.error('Request to join error:', error)
        toast.error('Failed to send join request')
    } finally {
        isUpdating.value = false
        showActions.value = false
    }
}

const leaveCoalition = async () => {
    try {
        isUpdating.value = true

        const response = await apiMethods.coalitions.leaveCoalition(props.coalition._id)

        if (response.data.success) {
            emit('left-coalition', {
                coalition: props.coalition
            })
            toast.success('Left coalition successfully')
        }

    } catch (error) {
        console.error('Leave coalition error:', error)
        toast.error('Failed to leave coalition')
    } finally {
        isUpdating.value = false
        showActions.value = false
    }
}

const manageMembers = () => {
    showActions.value = false
    emit('manage-members', props.coalition)
}

const activateCoalition = async () => {
    try {
        isUpdating.value = true

        const response = await apiMethods.coalitions.activateCoalition(props.coalition._id)

        if (response.data.success) {
            emit('activate-coalition', {
                coalition: props.coalition
            })
            toast.success('Coalition activated successfully')
        }

    } catch (error) {
        console.error('Activate coalition error:', error)
        toast.error('Failed to activate coalition')
    } finally {
        isUpdating.value = false
        showActions.value = false
    }
}

const submitResolution = () => {
    showActions.value = false
    emit('submit-resolution', props.coalition)
}

// Click outside handler
const handleClickOutside = (event) => {
    if (!event.target.closest('.actions-dropdown')) {
        showActions.value = false
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.coalition-card {
    border-width: 1px;
    border-style: solid;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Hover effects */
.coalition-card:hover {
    transform: translateY(-1px);
}

.member-item {
    transition: all 0.2s ease;
}

.member-item:hover {
    transform: scale(1.05);
}

/* Progress bar animation */
.progress-bar>div {
    transition: width 0.5s ease;
}

/* Actions dropdown animation */
.actions-dropdown {
    animation: dropdown-enter 0.2s ease-out;
    transform-origin: top right;
}

@keyframes dropdown-enter {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .flex.items-center.space-x-2 {
        justify-content: center;
    }

    .members-preview .flex.items-center.space-x-2 {
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .member-item {
        margin: 0.125rem;
    }
}

/* Loading state */
.coalition-card.loading {
    pointer-events: none;
    opacity: 0.7;
}

/* Special status indicators */
.coalition-card.border-mun-green-300 {
    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.1);
}

.coalition-card.border-mun-red-300 {
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1);
}

/* Crown icon for head */
.member-item:has(.crown-icon) {
    background: linear-gradient(45deg, rgba(0, 158, 219, 0.1), rgba(0, 158, 219, 0.2));
}

/* Animation for member status changes */
.member-item {
    animation: member-appear 0.3s ease-out;
}

@keyframes member-appear {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>