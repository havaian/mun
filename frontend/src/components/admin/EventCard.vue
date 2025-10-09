<template>
    <div class="mun-card group hover:shadow-mun-lg transition-all duration-300 cursor-pointer"
        @click="$emit('view', event)">

        <!-- Card Header -->
        <div class="relative p-6 pb-4">
            <!-- Status Badge -->
            <div class="absolute top-4 right-4">
                <span :class="statusBadgeClass">
                    {{ statusText }}
                </span>
            </div>

            <!-- Event Type Icon -->
            <div class="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" :class="eventTypeIconClass">
                <component :is="eventTypeIcon" class="w-6 h-6 text-white" />
            </div>

            <!-- Event Title -->
            <h3
                class="text-lg font-bold text-mun-gray-900 mb-2 line-clamp-2 group-hover:text-mun-blue transition-colors">
                {{ event.name }}
            </h3>

            <!-- Event Description -->
            <p class="text-sm text-mun-gray-600 line-clamp-3 mb-4">
                {{ event.description || 'No description provided' }}
            </p>

            <!-- Event Metadata -->
            <div class="space-y-3">
                <!-- Date Range -->
                <div class="flex items-center space-x-2 text-sm text-mun-gray-600">
                    <CalendarDaysIcon class="w-4 h-4 flex-shrink-0" />
                    <span>{{ formatDateRange() }}</span>
                </div>

                <!-- Location -->
                <div v-if="event.location" class="flex items-center space-x-2 text-sm text-mun-gray-600">
                    <MapPinIcon class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">{{ event.location }}</span>
                </div>

                <!-- Organizer -->
                <div v-if="event.organizer" class="flex items-center space-x-2 text-sm text-mun-gray-600">
                    <UserIcon class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">{{ event.organizer }}</span>
                </div>

                <!-- Participants -->
                <div class="flex items-center space-x-2 text-sm text-mun-gray-600">
                    <UsersIcon class="w-4 h-4 flex-shrink-0" />
                    <span>
                        {{ event.registrations?.length || 0 }} / {{ event.maxParticipants || '∞' }} participants
                    </span>
                </div>
            </div>
        </div>

        <!-- Progress Bar (if event is active) -->
        <div v-if="event.status === 'active' && eventProgress !== null" class="px-6 pb-4">
            <div class="bg-mun-gray-200 rounded-full h-2">
                <div class="bg-mun-blue rounded-full h-2 transition-all duration-300"
                    :style="{ width: `${eventProgress}%` }"></div>
            </div>
            <p class="text-xs text-mun-gray-500 mt-1">
                {{ eventProgress }}% complete
            </p>
        </div>

        <!-- Statistics -->
        <div class="px-6 pb-4">
            <div class="grid grid-cols-3 gap-4 py-4 border-t border-mun-gray-100">
                <div class="text-center">
                    <div class="text-lg font-bold text-mun-gray-900">
                        {{ event.committees?.length || 0 }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Committees</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-mun-gray-900">
                        {{ event.registrations?.length || 0 }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Delegates</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-mun-gray-900">
                        {{ formatDuration() }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Duration</div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="px-6 pb-6">
            <div class="flex items-center space-x-2">
                <AppButton variant="primary" size="sm" @click.stop="$emit('view', event)" class="flex-1">
                    <EyeIcon class="w-4 h-4 mr-2" />
                    View Details
                </AppButton>

                <!-- Action Menu -->
                <div class="relative">
                    <button @click.stop="showActions = !showActions"
                        class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <EllipsisVerticalIcon class="w-4 h-4 text-mun-gray-600" />
                    </button>

                    <!-- Actions Dropdown -->
                    <transition name="dropdown">
                        <div v-if="showActions"
                            class="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-mun-lg border border-white/20 py-2 z-10">

                            <button @click.stop="handleEdit"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <PencilIcon class="w-4 h-4" />
                                <span>Edit Event</span>
                            </button>

                            <button @click.stop="handleDuplicate"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <DocumentDuplicateIcon class="w-4 h-4" />
                                <span>Duplicate</span>
                            </button>

                            <button @click.stop="handleToggleStatus"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <component :is="toggleStatusIcon" class="w-4 h-4" />
                                <span>{{ toggleStatusText }}</span>
                            </button>

                            <div class="border-t border-mun-gray-100 my-1"></div>

                            <button @click.stop="handleDelete"
                                class="w-full px-4 py-2 text-left text-sm text-mun-red-600 hover:bg-mun-red-50 flex items-center space-x-2">
                                <TrashIcon class="w-4 h-4" />
                                <span>Delete Event</span>
                            </button>
                        </div>
                    </transition>
                </div>
            </div>
        </div>

        <!-- Quick Access Buttons (show on hover) -->
        <div class="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="flex space-x-2">
                <button v-if="event.status === 'active'" @click.stop="goToLiveView"
                    class="bg-mun-green-500 text-white p-2 rounded-lg hover:bg-mun-green-600 transition-colors"
                    title="Live View">
                    <PlayIcon class="w-4 h-4" />
                </button>

                <button v-if="event.committees?.length > 0" @click.stop="goToCommittees"
                    class="bg-mun-blue text-white p-2 rounded-lg hover:bg-mun-blue-600 transition-colors"
                    title="Manage Committees">
                    <UserGroupIcon class="w-4 h-4" />
                </button>

                <button v-if="hasGeneratedQRs" @click.stop="downloadQRs"
                    class="bg-mun-purple-500 text-white p-2 rounded-lg hover:bg-mun-purple-600 transition-colors"
                    title="Download QR Codes">
                    <QrCodeIcon class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Event Countdown (for upcoming events) -->
        <div v-if="showCountdown"
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-mun-blue to-mun-blue-600 text-white px-6 py-3 rounded-b-2xl">
            <div class="flex items-center justify-between text-sm">
                <span class="font-medium">Starts in:</span>
                <span class="font-bold">{{ countdownText }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    CalendarDaysIcon,
    MapPinIcon,
    UserIcon,
    UsersIcon,
    EyeIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    PlayIcon,
    PauseIcon,
    UserGroupIcon,
    QrCodeIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

// Props
const props = defineProps({
    event: {
        type: Object,
        required: true
    }
})

// Emits
const emit = defineEmits(['view', 'edit', 'delete', 'duplicate', 'toggle-status'])

// State
const showActions = ref(false)
const countdownInterval = ref(null)
const countdownText = ref('')

// Computed
const statusBadgeClass = computed(() => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (props.event.status) {
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
})

const statusText = computed(() => {
    const statusMap = {
        'draft': 'Draft',
        'published': 'Published',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    }
    return statusMap[props.event.status] || 'Unknown'
})

const eventTypeIcon = computed(() => {
    switch (props.event.eventType) {
        case 'conference':
            return CalendarDaysIcon
        case 'simulation':
            return PlayIcon
        case 'training':
            return UserIcon
        case 'competition':
            return UsersIcon
        default:
            return CalendarDaysIcon
    }
})

const eventTypeIconClass = computed(() => {
    switch (props.event.eventType) {
        case 'conference':
            return 'bg-mun-blue'
        case 'simulation':
            return 'bg-mun-green-500'
        case 'training':
            return 'bg-mun-purple-500'
        case 'competition':
            return 'bg-mun-yellow-500'
        default:
            return 'bg-mun-blue'
    }
})

const eventProgress = computed(() => {
    if (props.event.status !== 'active') return null

    const now = new Date()
    const start = new Date(props.event.startDate)
    const end = new Date(props.event.endDate)

    if (now < start) return 0
    if (now > end) return 100

    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()

    return Math.round((elapsed / total) * 100)
})

const showCountdown = computed(() => {
    const now = new Date()
    const start = new Date(props.event.startDate)
    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60)

    return props.event.status === 'published' && diffHours > 0 && diffHours <= 168 // 7 days
})

const toggleStatusIcon = computed(() => {
    return props.event.status === 'active' ? PauseIcon : PlayIcon
})

const toggleStatusText = computed(() => {
    return props.event.status === 'active' ? 'Deactivate' : 'Activate'
})

const hasGeneratedQRs = computed(() => {
    return props.event.committees?.some(committee => committee.qrGenerated)
})

// Methods
const formatDateRange = () => {
    if (!props.event.startDate) return 'Date TBD'

    const start = new Date(props.event.startDate)
    const end = props.event.endDate ? new Date(props.event.endDate) : null

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }

    if (end && start.toDateString() !== end.toDateString()) {
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
    } else {
        return start.toLocaleDateString('en-US', options)
    }
}

const formatDuration = () => {
    if (!props.event.startDate || !props.event.endDate) return 'TBD'

    const start = new Date(props.event.startDate)
    const end = new Date(props.event.endDate)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day'
    if (diffDays < 7) return `${diffDays} days`
    if (diffDays === 7) return '1 week'
    return `${Math.round(diffDays / 7)} weeks`
}

const updateCountdown = () => {
    if (!showCountdown.value) return

    const now = new Date()
    const start = new Date(props.event.startDate)
    const diff = start.getTime() - now.getTime()

    if (diff <= 0) {
        countdownText.value = 'Starting now!'
        clearInterval(countdownInterval.value)
        return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
        countdownText.value = `${days}d ${hours}h`
    } else if (hours > 0) {
        countdownText.value = `${hours}h ${minutes}m`
    } else {
        countdownText.value = `${minutes}m`
    }
}

// Action handlers
const handleEdit = () => {
    showActions.value = false
    emit('edit', props.event)
}

const handleDelete = () => {
    showActions.value = false
    emit('delete', props.event)
}

const handleDuplicate = () => {
    showActions.value = false
    emit('duplicate', props.event)
}

const handleToggleStatus = () => {
    showActions.value = false
    emit('toggle-status', props.event)
}

const goToLiveView = () => {
    // Navigate to live event dashboard
    router.push({
        name: 'EventLive',
        params: { id: props.event._id }
    })
}

const goToCommittees = () => {
    router.push({
        name: 'AdminCommittees',
        query: { event: props.event._id }
    })
}

const downloadQRs = () => {
    // Download QR codes for all committees
    window.open(`/api/export/event-qr-codes/${props.event._id}`, '_blank')
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

    if (showCountdown.value) {
        updateCountdown()
        countdownInterval.value = setInterval(updateCountdown, 60000) // Update every minute
    }
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)

    if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
    }
})
</script>

<style scoped>
/* Line clamp utilities */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}

/* Card hover effects */
.mun-card:hover {
    transform: translateY(-2px);
}

/* Progress bar animation */
.progress-bar {
    transition: width 0.3s ease;
}
</style>