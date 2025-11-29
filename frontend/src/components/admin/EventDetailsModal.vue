<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <CalendarDaysIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    {{ event?.name || 'Event Details' }}
                                </h2>
                                <p class="text-white/80 text-sm">
                                    {{ getEventStatusText() }}
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
                        <div v-if="!event" class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
                        </div>

                        <div v-else class="p-6 space-y-8">
                            <!-- Event Overview -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Basic Information -->
                                <div class="lg:col-span-2 space-y-6">
                                    <!-- Event Details Card -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Event Information
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Status</label>
                                                <span :class="[
                                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                    getStatusClasses(event.status)
                                                ]">
                                                    {{ formatStatus(event.status) }}
                                                </span>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Start Date</label>
                                                <p class="text-mun-gray-900">{{ formatDate(event.startDate) }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">End Date</label>
                                                <p class="text-mun-gray-900">{{ formatDate(event.endDate) }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Duration</label>
                                                <p class="text-mun-gray-900">{{ getEventDuration() }} days</p>
                                            </div>
                                        </div>

                                        <div v-if="event.description" class="mt-4">
                                            <label class="text-sm font-medium text-mun-gray-600">Description</label>
                                            <p class="text-mun-gray-900 mt-1">{{ event.description }}</p>
                                        </div>
                                    </div>

                                    <!-- Registration Settings -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <UserPlusIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Registration & Settings
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Registration
                                                    Deadline</label>
                                                <p class="text-mun-gray-900">{{
                                                    formatDate(event.settings?.registrationDeadline) }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Max
                                                    Committees</label>
                                                <p class="text-mun-gray-900">{{ event.settings?.maxCommittees || 10 }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">QR
                                                    Expiration</label>
                                                <p class="text-mun-gray-900">{{ event.settings?.qrExpirationPeriod ||
                                                    168 }} hours</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Timezone</label>
                                                <p class="text-mun-gray-900">{{ event.settings?.timezone || 'UTC' }}</p>
                                            </div>
                                        </div>

                                        <!-- Registration Settings -->
                                        <div class="mt-4 flex flex-wrap gap-4">
                                            <span v-if="event.settings?.allowLateRegistration"
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <ClockIcon class="w-3 h-3 mr-1" />
                                                Late Registration Allowed
                                            </span>
                                            <span v-else
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <ClockIcon class="w-3 h-3 mr-1" />
                                                Strict Deadline
                                            </span>
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
                                                <span class="text-sm text-mun-gray-600">Total Committees</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    event.statistics?.totalCommittees || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Participants</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    event.statistics?.totalParticipants || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Countries</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    event.statistics?.totalCountries || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center pt-2 border-t">
                                                <span class="text-sm text-mun-gray-600">Registration Open</span>
                                                <span :class="[
                                                    'font-semibold',
                                                    isRegistrationOpen() ? 'text-green-600' : 'text-red-600'
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

                                            <AppButton @click="viewCommittees" variant="outline" size="sm"
                                                class="w-full">
                                                <BuildingLibraryIcon class="w-4 h-4 mr-2" />
                                                View Committees
                                            </AppButton>

                                            <AppButton @click="duplicateEvent" variant="outline" size="sm"
                                                class="w-full">
                                                <DocumentDuplicateIcon class="w-4 h-4 mr-2" />
                                                Duplicate Event
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
                                                    isRegistrationOpen() ? 'bg-green-500' : 'bg-red-500'
                                                ]"></div>
                                                <div class="flex-1">
                                                    <span class="text-mun-gray-600">Registration:</span>
                                                    <span class="text-mun-gray-900 font-medium ml-1">
                                                        {{ getRegistrationStatus() }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div class="flex items-center text-sm">
                                                <div :class="[
                                                    'w-3 h-3 rounded-full mr-3 flex-shrink-0',
                                                    getEventTimelineColor()
                                                ]"></div>
                                                <div class="flex-1">
                                                    <span class="text-mun-gray-600">Event:</span>
                                                    <span class="text-mun-gray-900 font-medium ml-1">
                                                        {{ getEventTimelineStatus() }}
                                                    </span>
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
                            Created {{ formatDate(event?.createdAt) }} • Last updated {{ formatDate(event?.updatedAt) }}
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
import { useRouter } from 'vue-router'
import {
    XMarkIcon,
    CalendarDaysIcon,
    InformationCircleIcon,
    UserPlusIcon,
    ChartBarIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    BuildingLibraryIcon,
    ClockIcon
} from '@heroicons/vue/24/outline'

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

const emit = defineEmits(['update:modelValue', 'edit', 'duplicate'])
const router = useRouter()

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
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

const formatStatus = (status) => {
    const statusMap = {
        'draft': 'Draft',
        'active': 'Active',
        'completed': 'Completed'
    }
    return statusMap[status] || status
}

const getStatusClasses = (status) => {
    const classMap = {
        'draft': 'bg-yellow-100 text-yellow-800',
        'active': 'bg-green-100 text-green-800',
        'completed': 'bg-blue-100 text-blue-800'
    }
    return classMap[status] || 'bg-gray-100 text-gray-800'
}

const getEventStatusText = () => {
    if (!props.event) return ''
    const status = props.event.status
    const now = new Date()
    const startDate = new Date(props.event.startDate)
    const endDate = new Date(props.event.endDate)

    if (status === 'draft') return 'Draft Event'
    if (now < startDate) return 'Upcoming Event'
    if (now >= startDate && now <= endDate) return 'Event in Progress'
    if (now > endDate) return 'Event Completed'

    return formatStatus(status)
}

const getEventDuration = () => {
    if (!props.event?.startDate || !props.event?.endDate) return 0
    const start = new Date(props.event.startDate)
    const end = new Date(props.event.endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const isRegistrationOpen = () => {
    if (!props.event?.settings?.registrationDeadline) return false
    const now = new Date()
    const deadline = new Date(props.event.settings.registrationDeadline)
    return now <= deadline || props.event.settings.allowLateRegistration
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
    router.push({
        name: 'admin-committees',
        query: { event: props.event._id || props.event.id }
    })
    closeModal()
}

const duplicateEvent = () => {
    emit('duplicate', props.event)
    closeModal()
}
</script>