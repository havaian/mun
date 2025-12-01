<template>
    <ModalWrapper :model-value="modelValue" :title="event?.name || 'Event Details'" :subtitle="formatEventDate()"
        :icon="CalendarDaysIcon" size="xl" variant="primary" is-view-only content-scrollable cancel-text="Close"
        :footer-text="formatFooterText()" @close="closeModal">
        <!-- Content slot -->
        <template #content>
            <div class="mt-2 space-y-2">
                <!-- Event Overview -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Left Column: Basic Details -->
                    <div class="mun-card p-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Event Information</h3>

                        <div class="space-y-4">
                            <div class="flex items-start space-x-3">
                                <CalendarDaysIcon class="w-5 h-5 text-mun-gray-400 mt-0.5 flex-shrink-0" />
                                <div class="flex-1">
                                    <p class="text-sm text-mun-gray-600">Start Date</p>
                                    <p class="font-medium text-mun-gray-900">{{ formatDate(event?.startDate) }}</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-3">
                                <CalendarDaysIcon class="w-5 h-5 text-mun-gray-400 mt-0.5 flex-shrink-0" />
                                <div class="flex-1">
                                    <p class="text-sm text-mun-gray-600">End Date</p>
                                    <p class="font-medium text-mun-gray-900">{{ formatDate(event?.endDate) }}</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-3">
                                <MapPinIcon class="w-5 h-5 text-mun-gray-400 mt-0.5 flex-shrink-0" />
                                <div class="flex-1">
                                    <p class="text-sm text-mun-gray-600">Location</p>
                                    <p class="font-medium text-mun-gray-900">{{ event?.location || 'Not specified' }}
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-3">
                                <UserIcon class="w-5 h-5 text-mun-gray-400 mt-0.5 flex-shrink-0" />
                                <div class="flex-1">
                                    <p class="text-sm text-mun-gray-600">Status</p>
                                    <div class="flex items-center space-x-2">
                                        <span :class="[
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                            event?.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : event?.status === 'draft'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                        ]">
                                            {{ event?.status?.charAt(0).toUpperCase() + event?.status?.slice(1) ||
                                            'Unknown' }}
                                        </span>
                                        <span class="text-sm text-mun-gray-600">{{ getEventTimelineStatus() }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="event?.description" class="flex items-start space-x-3">
                                <InformationCircleIcon class="w-5 h-5 text-mun-gray-400 mt-0.5 flex-shrink-0" />
                                <div class="flex-1">
                                    <p class="text-sm text-mun-gray-600">Description</p>
                                    <p class="font-medium text-mun-gray-900">{{ event.description }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Statistics -->
                    <div class="mt-2 space-y-2">
                        <!-- Committee Statistics -->
                        <div class="mun-card p-6">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Statistics</h3>

                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            class="w-10 h-10 bg-mun-blue-100 rounded-lg flex items-center justify-center">
                                            <BuildingLibraryIcon class="w-5 h-5 text-mun-blue-600" />
                                        </div>
                                        <div>
                                            <p class="text-sm text-mun-gray-600">Total Committees</p>
                                            <p class="text-2xl font-bold text-mun-gray-900">{{
                                                event?.statistics?.totalCommittees || 0 }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <UsersIcon class="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p class="text-sm text-mun-gray-600">Total Participants</p>
                                            <p class="text-2xl font-bold text-mun-gray-900">{{
                                                event?.statistics?.totalParticipants || 0 }}</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <GlobeAltIcon class="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p class="text-sm text-mun-gray-600">Countries Represented</p>
                                            <p class="text-2xl font-bold text-mun-gray-900">{{
                                                event?.statistics?.totalCountries || 0 }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Registration Status -->
                        <div class="mun-card p-6">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Registration</h3>

                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-mun-gray-600">Status</span>
                                    <span :class="[
                                        'text-sm font-medium',
                                        isRegistrationOpen() ? 'text-green-600' : 'text-red-600'
                                    ]">
                                        {{ getRegistrationStatus() }}
                                    </span>
                                </div>

                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-mun-gray-600">Deadline</span>
                                    <span class="text-sm font-medium text-mun-gray-900">
                                        {{ formatDate(event?.settings?.registrationDeadline) || 'Not set' }}
                                    </span>
                                </div>

                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-mun-gray-600">Late Registration</span>
                                    <span :class="[
                                        'text-sm font-medium',
                                        event?.settings?.allowLateRegistration ? 'text-green-600' : 'text-red-600'
                                    ]">
                                        {{ event?.settings?.allowLateRegistration ? 'Allowed' : 'Not allowed' }}
                                    </span>
                                </div>

                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-mun-gray-600">Maximum Participants</span>
                                    <span class="text-sm font-medium text-mun-gray-900">{{
                                        event?.settings?.maxParticipants || 'Unlimited' }}</span>
                                </div>

                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-mun-gray-600">Open Registration</span>
                                    <span :class="[
                                        'text-sm font-medium',
                                        isRegistrationOpen() ?
                                            'text-green-600' : 'text-red-600'
                                    ]">
                                        {{ isRegistrationOpen() ? 'Yes' : 'No' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="mun-card p-6">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Quick Actions</h3>

                            <div class="space-y-3">
                                <AppButton @click="editEvent" variant="primary" size="sm" class="w-full">
                                    <PencilIcon class="w-4 h-4 mr-2" />
                                    Edit Event
                                </AppButton>

                                <AppButton @click="viewCommittees" variant="outline" size="sm" class="w-full">
                                    <BuildingLibraryIcon class="w-4 h-4 mr-2" />
                                    View Committees
                                </AppButton>
                            </div>
                        </div>

                        <!-- Event Timeline -->
                        <div class="mun-card p-6">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Timeline</h3>

                            <div class="space-y-3">
                                <div class="flex items-center text-sm">
                                    <div :class="[
                                        'w-3 h-3 rounded-full mr-3 flex-shrink-0',
                                        isRegistrationOpen() ?
                                            'bg-green-500' : 'bg-gray-400'
                                    ]"></div>
                                    <span class="text-mun-gray-600">Registration:</span>
                                    <span class="ml-2 font-medium">{{ getRegistrationStatus() }}</span>
                                </div>

                                <div class="flex items-center text-sm">
                                    <div :class="[
                                        'w-3 h-3 rounded-full mr-3 flex-shrink-0',
                                        getEventTimelineColor()
                                    ]"></div>
                                    <span class="text-mun-gray-600">Event:</span>
                                    <span class="ml-2 font-medium">{{ getEventTimelineStatus() }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Information -->
                <div v-if="event?.settings" class="mun-card p-6">
                    <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Event Settings</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-mun-gray-600">Public Event</span>
                                <span class="text-sm font-medium text-mun-gray-900">
                                    {{ event.settings.isPublic ? 'Yes' : 'No' }}
                                </span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-sm text-mun-gray-600">Featured Event</span>
                                <span class="text-sm font-medium text-mun-gray-900">
                                    {{ event.settings.isFeatured ? 'Yes' : 'No' }}
                                </span>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-mun-gray-600">Time Zone</span>
                                <span class="text-sm font-medium text-mun-gray-900">
                                    {{ event.settings.timezone || 'UTC' }}
                                </span>
                            </div>

                            <div class="flex justify-between items-center">
                                <span class="text-sm text-mun-gray-600">Language</span>
                                <span class="text-sm font-medium text-mun-gray-900">
                                    {{ event.settings.language || 'English' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
    CalendarDaysIcon,
    MapPinIcon,
    UserIcon,
    UsersIcon,
    BuildingLibraryIcon,
    GlobeAltIcon,
    InformationCircleIcon,
    PencilIcon
} from '@heroicons/vue/24/outline'
import ModalWrapper from '@/components/ui/ModalWrapper.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    event: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'edit'])

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
}

const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const formatEventDate = () => {
    if (!props.event?.startDate) return 'Date not specified'

    const startDate = new Date(props.event.startDate)
    const endDate = props.event.endDate ? new Date(props.event.endDate) : null

    if (endDate) {
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    } else {
        return startDate.toLocaleDateString()
    }
}

const formatFooterText = () => {
    if (!props.event?.createdAt) return ''
    return `Created ${formatDate(props.event.createdAt)}`
}

const isRegistrationOpen = () => {
    if (!props.event?.settings?.registrationDeadline) return false
    return new Date() <= new Date(props.event.settings.registrationDeadline)
}

const getRegistrationStatus = () => {
    if (!props.event?.settings?.registrationDeadline) return 'Not configured'

    const now = new Date()
    const deadline = new Date(props.event.settings.registrationDeadline)

    if (now <= deadline) {
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
        return `Open (${daysLeft} days left)`
    } else if (props.event.settings.allowLateRegistration) {
        return 'Late registration allowed'
    } else {
        return 'Closed'
    }
}

const getEventTimelineStatus = () => {
    if (!props.event?.startDate || !props.event?.endDate) return 'Dates not set'

    const now = new Date()
    const startDate = new Date(props.event.startDate)
    const endDate = new Date(props.event.endDate)

    if (now < startDate) {
        const daysLeft = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))
        return `Starts in ${daysLeft} days`
    } else if (now >= startDate && now <= endDate) {
        return 'In progress'
    } else {
        return 'Completed'
    }
}

const getEventTimelineColor = () => {
    if (!props.event?.startDate || !props.event?.endDate) return 'bg-gray-400'

    const now = new Date()
    const startDate = new Date(props.event.startDate)
    const endDate = new Date(props.event.endDate)

    if (now < startDate) return 'bg-blue-500'
    if (now >= startDate && now <= endDate) return 'bg-green-500'
    return 'bg-purple-500'
}

const editEvent = () => {
    emit('edit', props.event)
    closeModal()
}

const viewCommittees = () => {
    // Fixed routing - ensure proper navigation to committees view
    router.push({
        name: 'admin-committees',
        query: { eventId: props.event._id || props.event.id }
    })
    closeModal()
}
</script>