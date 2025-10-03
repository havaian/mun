<template>
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">Coalitions</h2>
                    <p class="text-sm text-gray-600 mt-1">Join or create coalitions to work on resolutions together</p>
                </div>
                <div class="flex items-center space-x-3">
                    <!-- Filter -->
                    <select v-model="statusFilter"
                        class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Coalitions</option>
                        <option value="my">My Coalitions</option>
                        <option value="invited">Invitations</option>
                        <option value="available">Available to Join</option>
                    </select>

                    <!-- Create Coalition Button -->
                    <button v-if="canCreateCoalition" @click="showCreateModal = true" class="btn-primary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Coalition
                    </button>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="p-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="flex items-center space-x-3">
                    <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-gray-600">Loading coalitions...</span>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredCoalitions.length === 0" class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900">
                    {{ getEmptyStateTitle() }}
                </h3>
                <p class="mt-2 text-gray-500">
                    {{ getEmptyStateMessage() }}
                </p>
                <button v-if="statusFilter === 'all' && canCreateCoalition" @click="showCreateModal = true"
                    class="mt-4 btn-primary">
                    Create Your First Coalition
                </button>
            </div>

            <!-- Coalitions Grid -->
            <div v-else class="space-y-4">
                <div v-for="coalition in filteredCoalitions" :key="coalition.id"
                    class="card p-6 hover:shadow-medium transition-shadow">
                    <div class="flex items-start justify-between">
                        <!-- Coalition Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-3 mb-3">
                                <div
                                    class="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="text-lg font-medium text-gray-900 truncate">
                                        {{ coalition.name }}
                                    </h3>
                                    <p class="text-sm text-gray-600 truncate">
                                        Led by {{ coalition.headCountry }}
                                    </p>
                                </div>
                            </div>

                            <!-- Description -->
                            <p v-if="coalition.description" class="text-sm text-gray-700 mb-4 line-clamp-2">
                                {{ coalition.description }}
                            </p>

                            <!-- Members -->
                            <div class="flex items-center space-x-4 mb-4">
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm font-medium text-gray-700">Members:</span>
                                    <div class="flex items-center space-x-1">
                                        <span v-for="member in coalition.members.slice(0, 5)" :key="member.country"
                                            :class="[
                                                'px-2 py-1 text-xs rounded-full',
                                                member.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    member.status === 'invited' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                            ]" :title="`${member.country} (${member.status})`">
                                            {{ getCountryCode(member.country) }}
                                        </span>
                                        <span v-if="coalition.members.length > 5" class="text-xs text-gray-500">
                                            +{{ coalition.members.length - 5 }} more
                                        </span>
                                    </div>
                                </div>

                                <div class="text-sm text-gray-500">
                                    {{ coalition.acceptedMembers }}/{{ coalition.members.length }} confirmed
                                </div>
                            </div>

                            <!-- Resolution Status -->
                            <div v-if="coalition.resolution" class="mb-4">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span class="text-sm font-medium text-gray-700">Resolution:</span>
                                    <span class="text-sm text-purple-600">{{ coalition.resolution.title }}</span>
                                    <span :class="[
                                        'px-2 py-1 text-xs font-medium rounded-full',
                                        coalition.resolution.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            coalition.resolution.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                                coalition.resolution.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                    ]">
                                        {{ coalition.resolution.status }}
                                    </span>
                                </div>
                            </div>

                            <!-- Coalition Status -->
                            <div class="flex items-center space-x-3">
                                <span :class="[
                                    'px-3 py-1 text-xs font-semibold rounded-full',
                                    coalition.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                ]">
                                    {{ coalition.isActive ? 'Active' : 'Inactive' }}
                                </span>

                                <span v-if="coalition.minMembersReached"
                                    class="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                    Minimum Members Reached
                                </span>

                                <span class="text-xs text-gray-500">
                                    Created {{ formatTime(coalition.createdAt) }}
                                </span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex flex-col items-end space-y-2 ml-6">
                            <!-- My Status in Coalition -->
                            <div v-if="getMyStatusInCoalition(coalition)" class="text-right">
                                <span :class="[
                                    'px-2 py-1 text-xs font-medium rounded-full',
                                    getMyStatusInCoalition(coalition) === 'head' ? 'bg-purple-100 text-purple-700' :
                                        getMyStatusInCoalition(coalition) === 'accepted' ? 'bg-green-100 text-green-700' :
                                            getMyStatusInCoalition(coalition) === 'invited' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                ]">
                                    {{ getStatusDisplayText(getMyStatusInCoalition(coalition)) }}
                                </span>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex space-x-2">
                                <!-- Join Coalition -->
                                <button v-if="canJoinCoalition(coalition)" @click="requestToJoin(coalition)"
                                    class="btn-primary text-sm">
                                    Request to Join
                                </button>

                                <!-- Accept Invitation -->
                                <button v-if="hasInvitation(coalition)" @click="acceptInvitation(coalition)"
                                    class="btn-primary text-sm">
                                    Accept Invitation
                                </button>

                                <!-- Decline Invitation -->
                                <button v-if="hasInvitation(coalition)" @click="declineInvitation(coalition)"
                                    class="btn-secondary text-sm">
                                    Decline
                                </button>

                                <!-- Manage Coalition -->
                                <button v-if="isCoalitionHead(coalition)" @click="manageCoalition(coalition)"
                                    class="btn-secondary text-sm">
                                    Manage
                                </button>

                                <!-- Leave Coalition -->
                                <button v-if="isMemberOfCoalition(coalition) && !isCoalitionHead(coalition)"
                                    @click="leaveCoalition(coalition)" class="btn-secondary text-sm">
                                    Leave
                                </button>

                                <!-- View Details -->
                                <button @click="viewCoalitionDetails(coalition)" class="btn-ghost text-sm">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                    {{ filteredCoalitions.length }} coalition{{ filteredCoalitions.length !== 1 ? 's' : '' }} found
                </div>
                <div class="flex space-x-3">
                    <button @click="refreshCoalitions" :disabled="isLoading" class="btn-secondary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button @click="$emit('close')" class="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <!-- Create Coalition Modal -->
        <CreateCoalitionModal v-if="showCreateModal" :delegate-info="delegateInfo" @close="showCreateModal = false"
            @success="handleCoalitionCreated" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/websocket'
import CreateCoalitionModal from './CreateCoalitionModal.vue'

const emit = defineEmits(['close', 'update'])
const props = defineProps({
    delegateInfo: {
        type: Object,
        required: true
    }
})

const authStore = useAuthStore()
const socketStore = useSocketStore()

// State
const coalitions = ref([])
const isLoading = ref(true)
const statusFilter = ref('all')
const showCreateModal = ref(false)

// Computed
const filteredCoalitions = computed(() => {
    let filtered = coalitions.value

    switch (statusFilter.value) {
        case 'my':
            filtered = filtered.filter(c => isMemberOfCoalition(c) || isCoalitionHead(c))
            break
        case 'invited':
            filtered = filtered.filter(c => hasInvitation(c))
            break
        case 'available':
            filtered = filtered.filter(c => canJoinCoalition(c))
            break
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const canCreateCoalition = computed(() => {
    // Can create if not already head of an active coalition
    return !coalitions.value.some(c =>
        c.headCountry === props.delegateInfo.country && c.isActive
    )
})

const myCoalitionsCount = computed(() => {
    return coalitions.value.filter(c =>
        isMemberOfCoalition(c) || isCoalitionHead(c)
    ).length
})

// Methods
async function fetchCoalitions() {
    try {
        isLoading.value = true

        const response = await authStore.apiCall(`/delegate/coalitions?committeeId=${props.delegateInfo.committee.id}`)
        if (response.ok) {
            const data = await response.json()
            coalitions.value = data.coalitions || []
        }
    } catch (error) {
        console.error('Fetch coalitions error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to load coalitions'
        })
    } finally {
        isLoading.value = false
    }
}

function refreshCoalitions() {
    fetchCoalitions()
}

function getMyStatusInCoalition(coalition) {
    if (coalition.headCountry === props.delegateInfo.country) {
        return 'head'
    }

    const member = coalition.members.find(m => m.country === props.delegateInfo.country)
    return member?.status || null
}

function isCoalitionHead(coalition) {
    return coalition.headCountry === props.delegateInfo.country
}

function isMemberOfCoalition(coalition) {
    const status = getMyStatusInCoalition(coalition)
    return status === 'accepted' || status === 'head'
}

function hasInvitation(coalition) {
    return getMyStatusInCoalition(coalition) === 'invited'
}

function canJoinCoalition(coalition) {
    return !getMyStatusInCoalition(coalition) &&
        coalition.isActive &&
        coalition.members.length < 10 // Assuming max coalition size
}

async function requestToJoin(coalition) {
    try {
        const response = await authStore.apiCall(`/delegate/coalitions/${coalition.id}/join`, {
            method: 'POST'
        })

        if (response.ok) {
            await refreshCoalitions()
            window.showNotification({
                type: 'success',
                title: 'Request Sent',
                message: `Join request sent to ${coalition.name}`
            })
        }
    } catch (error) {
        console.error('Join coalition error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to send join request'
        })
    }
}

async function acceptInvitation(coalition) {
    try {
        const response = await authStore.apiCall(`/delegate/coalitions/${coalition.id}/accept`, {
            method: 'POST'
        })

        if (response.ok) {
            await refreshCoalitions()
            emit('update', myCoalitionsCount.value)
            window.showNotification({
                type: 'success',
                title: 'Invitation Accepted',
                message: `You joined ${coalition.name}`
            })
        }
    } catch (error) {
        console.error('Accept invitation error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to accept invitation'
        })
    }
}

async function declineInvitation(coalition) {
    try {
        const response = await authStore.apiCall(`/delegate/coalitions/${coalition.id}/decline`, {
            method: 'POST'
        })

        if (response.ok) {
            await refreshCoalitions()
            window.showNotification({
                type: 'info',
                title: 'Invitation Declined',
                message: `You declined to join ${coalition.name}`
            })
        }
    } catch (error) {
        console.error('Decline invitation error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to decline invitation'
        })
    }
}

async function leaveCoalition(coalition) {
    const confirmed = await showConfirmDialog({
        title: 'Leave Coalition',
        message: `Are you sure you want to leave "${coalition.name}"?`,
        confirmText: 'Leave Coalition',
        confirmType: 'danger'
    })

    if (confirmed) {
        try {
            const response = await authStore.apiCall(`/delegate/coalitions/${coalition.id}/leave`, {
                method: 'POST'
            })

            if (response.ok) {
                await refreshCoalitions()
                emit('update', myCoalitionsCount.value)
                window.showNotification({
                    type: 'info',
                    title: 'Left Coalition',
                    message: `You left ${coalition.name}`
                })
            }
        } catch (error) {
            console.error('Leave coalition error:', error)
            window.showNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to leave coalition'
            })
        }
    }
}

function manageCoalition(coalition) {
    window.openModal({
        component: 'ManageCoalitionModal',
        size: 'lg',
        props: {
            coalition,
            onUpdate: refreshCoalitions
        }
    })
}

function viewCoalitionDetails(coalition) {
    window.openModal({
        component: 'CoalitionDetailsModal',
        size: 'lg',
        props: { coalition }
    })
}

function handleCoalitionCreated(coalition) {
    showCreateModal.value = false
    coalitions.value.unshift(coalition)
    emit('update', myCoalitionsCount.value)
    window.showNotification({
        type: 'success',
        title: 'Coalition Created',
        message: `Successfully created "${coalition.name}"`
    })
}

function getEmptyStateTitle() {
    switch (statusFilter.value) {
        case 'my':
            return 'No Coalitions Yet'
        case 'invited':
            return 'No Pending Invitations'
        case 'available':
            return 'No Available Coalitions'
        default:
            return 'No Coalitions Found'
    }
}

function getEmptyStateMessage() {
    switch (statusFilter.value) {
        case 'my':
            return 'Create a coalition or accept an invitation to get started.'
        case 'invited':
            return 'You have no pending coalition invitations.'
        case 'available':
            return 'All available coalitions are full or inactive.'
        default:
            return 'No coalitions have been created in this committee yet.'
    }
}

function getStatusDisplayText(status) {
    const statusMap = {
        'head': 'Coalition Head',
        'accepted': 'Member',
        'invited': 'Invited',
        'declined': 'Declined'
    }
    return statusMap[status] || status
}

function getCountryCode(country) {
    if (!country) return '??'
    return country.substring(0, 2).toUpperCase()
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

async function showConfirmDialog({ title, message, confirmText, confirmType }) {
    return new Promise((resolve) => {
        window.openModal({
            component: 'ConfirmDialog',
            props: {
                title,
                message,
                confirmText,
                confirmType,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            }
        })
    })
}

// Initialize
onMounted(() => {
    fetchCoalitions()

    // Listen for real-time coalition updates
    const unsubscribe = socketStore.subscribe(`committee:${props.delegateInfo.committee.id}:coalitions`, (data) => {
        if (data.action === 'created') {
            coalitions.value.unshift(data.coalition)
        } else if (data.action === 'updated') {
            const index = coalitions.value.findIndex(c => c.id === data.coalition.id)
            if (index !== -1) {
                coalitions.value[index] = data.coalition
            }
        } else if (data.action === 'invitation') {
            const index = coalitions.value.findIndex(c => c.id === data.coalitionId)
            if (index !== -1) {
                // Refresh to get latest member status
                refreshCoalitions()
            }
        }
    })

    onUnmounted(unsubscribe)
})
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>