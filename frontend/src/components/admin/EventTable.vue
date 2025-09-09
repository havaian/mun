<template>
    <div class="bg-white rounded-2xl shadow-mun border border-white/20 overflow-hidden">
        <!-- Table Header -->
        <div class="px-6 py-4 border-b border-mun-gray-200 bg-mun-gray-50">
            <h3 class="text-lg font-semibold text-mun-gray-900">Events List</h3>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-mun-gray-200">
                <thead class="bg-mun-gray-50">
                    <tr>
                        <!-- Event Name -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('name')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Event Name</span>
                                <SortIcon :column="'name'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Type -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('eventType')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Type</span>
                                <SortIcon :column="'eventType'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Status -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <span class="text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Status
                            </span>
                        </th>

                        <!-- Dates -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('startDate')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Dates</span>
                                <SortIcon :column="'startDate'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Participants -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('registrations')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Participants</span>
                                <SortIcon :column="'registrations'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Committees -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <span class="text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Committees
                            </span>
                        </th>

                        <!-- Created -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('createdAt')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Created</span>
                                <SortIcon :column="'createdAt'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Actions -->
                        <th scope="col" class="relative px-6 py-3">
                            <span class="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>

                <tbody class="bg-white divide-y divide-mun-gray-200">
                    <tr v-if="loading" class="animate-pulse">
                        <td colspan="8" class="px-6 py-12 text-center">
                            <LoadingSpinner size="md" />
                            <p class="mt-2 text-sm text-mun-gray-500">Loading events...</p>
                        </td>
                    </tr>

                    <tr v-else-if="events.length === 0">
                        <td colspan="8" class="px-6 py-12 text-center">
                            <CalendarDaysIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                            <p class="text-mun-gray-500">No events to display</p>
                        </td>
                    </tr>

                    <tr v-else v-for="event in events" :key="event._id"
                        class="hover:bg-mun-gray-50 transition-colors cursor-pointer" @click="$emit('view', event)">
                        <!-- Event Name -->
                        <td class="px-6 py-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 w-10 h-10">
                                    <div :class="[
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        getEventTypeIconClass(event.eventType)
                                    ]">
                                        <component :is="getEventTypeIcon(event.eventType)" class="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <div
                                        class="text-sm font-medium text-mun-gray-900 hover:text-un-blue transition-colors">
                                        {{ event.name }}
                                    </div>
                                    <div class="text-sm text-mun-gray-500">
                                        {{ event.organizer || 'No organizer' }}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <!-- Type -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-mun-gray-900 capitalize">
                                {{ event.eventType || 'Unknown' }}
                            </div>
                        </td>

                        <!-- Status -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="getStatusBadgeClass(event.status)">
                                {{ formatStatus(event.status) }}
                            </span>
                        </td>

                        <!-- Dates -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-mun-gray-900">
                                {{ formatDate(event.startDate) }}
                            </div>
                            <div v-if="event.endDate && event.startDate !== event.endDate"
                                class="text-sm text-mun-gray-500">
                                to {{ formatDate(event.endDate) }}
                            </div>
                            <div v-if="getDateStatus(event)" class="mt-1">
                                <span :class="getDateStatusClass(event)">
                                    {{ getDateStatus(event) }}
                                </span>
                            </div>
                        </td>

                        <!-- Participants -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="text-sm text-mun-gray-900">
                                    {{ event.registrations?.length || 0 }}
                                </div>
                                <div v-if="event.maxParticipants" class="text-sm text-mun-gray-500 ml-1">
                                    / {{ event.maxParticipants }}
                                </div>
                            </div>
                            <div v-if="event.maxParticipants" class="mt-1 w-full bg-mun-gray-200 rounded-full h-1.5">
                                <div class="bg-un-blue h-1.5 rounded-full transition-all duration-300"
                                    :style="{ width: `${getParticipationPercentage(event)}%` }"></div>
                            </div>
                        </td>

                        <!-- Committees -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <UserGroupIcon class="w-4 h-4 text-mun-gray-400 mr-2" />
                                <span class="text-sm text-mun-gray-900">
                                    {{ event.committees?.length || 0 }}
                                </span>
                            </div>
                        </td>

                        <!-- Created -->
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                            {{ formatRelativeDate(event.createdAt) }}
                        </td>

                        <!-- Actions -->
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end space-x-2">
                                <!-- Quick Actions -->
                                <button @click.stop="$emit('view', event)"
                                    class="text-un-blue hover:text-un-blue-600 transition-colors" title="View Details">
                                    <EyeIcon class="w-4 h-4" />
                                </button>

                                <button @click.stop="$emit('edit', event)"
                                    class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors"
                                    title="Edit Event">
                                    <PencilIcon class="w-4 h-4" />
                                </button>

                                <!-- More Actions Menu -->
                                <div class="relative">
                                    <button @click.stop="toggleActionsMenu(event._id)"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors"
                                        title="More Actions">
                                        <EllipsisVerticalIcon class="w-4 h-4" />
                                    </button>

                                    <!-- Actions Dropdown -->
                                    <transition name="dropdown">
                                        <div v-if="activeActionsMenu === event._id"
                                            class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-mun-lg border border-white/20 py-2 z-20">

                                            <button @click.stop="handleDuplicate(event)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <DocumentDuplicateIcon class="w-4 h-4" />
                                                <span>Duplicate</span>
                                            </button>

                                            <button @click.stop="handleToggleStatus(event)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <component :is="getToggleStatusIcon(event.status)" class="w-4 h-4" />
                                                <span>{{ getToggleStatusText(event.status) }}</span>
                                            </button>

                                            <div v-if="event.committees?.length > 0"
                                                class="border-t border-mun-gray-100 my-1"></div>

                                            <button v-if="event.committees?.length > 0"
                                                @click.stop="goToCommittees(event)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <UserGroupIcon class="w-4 h-4" />
                                                <span>Manage Committees</span>
                                            </button>

                                            <button v-if="hasGeneratedQRs(event)" @click.stop="downloadQRs(event)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <QrCodeIcon class="w-4 h-4" />
                                                <span>Download QR Codes</span>
                                            </button>

                                            <div class="border-t border-mun-gray-100 my-1"></div>

                                            <button @click.stop="handleDelete(event)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-red-600 hover:bg-mun-red-50 flex items-center space-x-2">
                                                <TrashIcon class="w-4 h-4" />
                                                <span>Delete Event</span>
                                            </button>
                                        </div>
                                    </transition>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    CalendarDaysIcon,
    UserGroupIcon,
    EyeIcon,
    PencilIcon,
    EllipsisVerticalIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    PlayIcon,
    PauseIcon,
    QrCodeIcon
} from '@heroicons/vue/24/outline'

import SortIcon from '@/components/ui/SortIcon.vue'

const router = useRouter()

// Props
const props = defineProps({
    events: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['view', 'edit', 'delete', 'duplicate', 'toggle-status', 'sort'])

// State
const activeActionsMenu = ref(null)
const currentSort = ref('')
const currentDirection = ref('asc')

// Methods
const getEventTypeIcon = (type) => {
    switch (type) {
        case 'conference':
            return CalendarDaysIcon
        case 'simulation':
            return PlayIcon
        case 'training':
            return UserGroupIcon
        case 'competition':
            return UserGroupIcon
        default:
            return CalendarDaysIcon
    }
}

const getEventTypeIconClass = (type) => {
    switch (type) {
        case 'conference':
            return 'bg-un-blue'
        case 'simulation':
            return 'bg-mun-green-500'
        case 'training':
            return 'bg-mun-purple-500'
        case 'competition':
            return 'bg-mun-yellow-500'
        default:
            return 'bg-un-blue'
    }
}

const getStatusBadgeClass = (status) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (status) {
        case 'draft':
            return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
        case 'published':
            return `${baseClass} bg-blue-100 text-blue-800`
        case 'active':
            return `${baseClass} bg-mun-green-100 text-mun-green-800`
        case 'completed':
            return `${baseClass} bg-mun-purple-100 text-mun-purple-800`
        case 'cancelled':
            return `${baseClass} bg-mun-red-100 text-mun-red-800`
        default:
            return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
    }
}

const formatStatus = (status) => {
    const statusMap = {
        'draft': 'Draft',
        'published': 'Published',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    }
    return statusMap[status] || 'Unknown'
}

const formatDate = (dateString) => {
    if (!dateString) return 'TBD'

    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const formatRelativeDate = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
}

const getDateStatus = (event) => {
    if (!event.startDate) return null

    const now = new Date()
    const start = new Date(event.startDate)
    const end = event.endDate ? new Date(event.endDate) : null

    if (event.status === 'active') {
        if (now < start) return 'Starts soon'
        if (end && now > end) return 'Ended'
        return 'In progress'
    }

    if (event.status === 'published') {
        const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (diffHours > 0 && diffHours <= 24) return 'Starts in 24h'
        if (diffHours > 24 && diffHours <= 168) return 'Starts this week'
    }

    return null
}

const getDateStatusClass = (event) => {
    const status = getDateStatus(event)
    const baseClass = 'text-xs font-medium px-2 py-1 rounded'

    if (!status) return ''

    if (status.includes('soon') || status.includes('24h') || status.includes('week')) {
        return `${baseClass} bg-mun-yellow-100 text-mun-yellow-800`
    }

    if (status === 'In progress') {
        return `${baseClass} bg-mun-green-100 text-mun-green-800`
    }

    if (status === 'Ended') {
        return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
    }

    return `${baseClass} bg-blue-100 text-blue-800`
}

const getParticipationPercentage = (event) => {
    if (!event.maxParticipants) return 0

    const registered = event.registrations?.length || 0
    return Math.min(100, Math.round((registered / event.maxParticipants) * 100))
}

const getToggleStatusIcon = (status) => {
    return status === 'active' ? PauseIcon : PlayIcon
}

const getToggleStatusText = (status) => {
    return status === 'active' ? 'Deactivate' : 'Activate'
}

const hasGeneratedQRs = (event) => {
    return event.committees?.some(committee => committee.qrGenerated)
}

const handleSort = (column) => {
    if (currentSort.value === column) {
        currentDirection.value = currentDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        currentSort.value = column
        currentDirection.value = 'asc'
    }

    emit('sort', column, currentDirection.value)
}

const toggleActionsMenu = (eventId) => {
    activeActionsMenu.value = activeActionsMenu.value === eventId ? null : eventId
}

const handleDuplicate = (event) => {
    activeActionsMenu.value = null
    emit('duplicate', event)
}

const handleToggleStatus = (event) => {
    activeActionsMenu.value = null
    emit('toggle-status', event)
}

const handleDelete = (event) => {
    activeActionsMenu.value = null
    emit('delete', event)
}

const goToCommittees = (event) => {
    activeActionsMenu.value = null
    router.push({
        name: 'AdminCommittees',
        query: { event: event._id }
    })
}

const downloadQRs = (event) => {
    activeActionsMenu.value = null
    window.open(`/api/export/event-qr-codes/${event._id}`, '_blank')
}

// Click outside handler
const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        activeActionsMenu.value = null
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
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

/* Table row hover effect */
tbody tr:hover {
    background-color: #f8fafc;
}

/* Progress bar animation */
.progress-bar {
    transition: width 0.3s ease;
}
</style>