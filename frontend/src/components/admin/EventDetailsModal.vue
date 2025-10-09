V<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-un-blue to-mun-blue-600">
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
                    <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div v-if="!event" class="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>

                        <div v-else class="p-6 space-y-8">
                            <!-- Event Overview -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Basic Information -->
                                <div class="lg:col-span-2 space-y-6">
                                    <!-- Event Details Card -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <InformationCircleIcon class="w-5 h-5 mr-2 text-un-blue" />
                                            Event Information
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Event Type</label>
                                                <p class="text-mun-gray-900 font-medium">{{
                                                    formatEventType(event.eventType) }}</p>
                                            </div>

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
                                                <label class="text-sm font-medium text-mun-gray-600">Location</label>
                                                <p class="text-mun-gray-900">{{ event.location || 'Not specified' }}</p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Organizer</label>
                                                <p class="text-mun-gray-900">{{ event.organizer || 'Not specified' }}
                                                </p>
                                            </div>
                                        </div>

                                        <div v-if="event.description" class="mt-4">
                                            <label class="text-sm font-medium text-mun-gray-600">Description</label>
                                            <p class="text-mun-gray-900 mt-1">{{ event.description }}</p>
                                        </div>
                                    </div>

                                    <!-- Registration Information -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <UserPlusIcon class="w-5 h-5 mr-2 text-un-blue" />
                                            Registration Details
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Registration
                                                    Opens</label>
                                                <p class="text-mun-gray-900">{{ formatDate(event.registrationOpens) }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Registration
                                                    Closes</label>
                                                <p class="text-mun-gray-900">{{ formatDate(event.registrationCloses) }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Max
                                                    Participants</label>
                                                <p class="text-mun-gray-900">{{ event.maxParticipants || 'Unlimited' }}
                                                </p>
                                            </div>

                                            <div>
                                                <label class="text-sm font-medium text-mun-gray-600">Registration
                                                    Fee</label>
                                                <p class="text-mun-gray-900">
                                                    {{ event.registrationFee ? `${event.registrationFee}
                                                    ${event.currency || 'USD'}` : 'Free' }}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Registration Settings -->
                                        <div class="mt-4 flex flex-wrap gap-4">
                                            <span v-if="event.requireApproval"
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                <ShieldCheckIcon class="w-3 h-3 mr-1" />
                                                Requires Approval
                                            </span>

                                            <span v-if="event.allowWaitlist"
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <QueueListIcon class="w-3 h-3 mr-1" />
                                                Waitlist Enabled
                                            </span>

                                            <span v-if="event.sendWelcomeEmail"
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <EnvelopeIcon class="w-3 h-3 mr-1" />
                                                Welcome Email
                                            </span>

                                            <span v-if="event.isPublic"
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                <GlobeAltIcon class="w-3 h-3 mr-1" />
                                                Public Event
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Contact Information -->
                                    <div v-if="event.contactEmail || event.contactPhone || event.website"
                                        class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <EnvelopeIcon class="w-5 h-5 mr-2 text-un-blue" />
                                            Contact Information
                                        </h3>

                                        <div class="space-y-3">
                                            <div v-if="event.contactEmail" class="flex items-center space-x-3">
                                                <EnvelopeIcon class="w-4 h-4 text-mun-gray-500" />
                                                <a :href="`mailto:${event.contactEmail}`"
                                                    class="text-un-blue hover:text-un-blue-dark">
                                                    {{ event.contactEmail }}
                                                </a>
                                            </div>

                                            <div v-if="event.contactPhone" class="flex items-center space-x-3">
                                                <PhoneIcon class="w-4 h-4 text-mun-gray-500" />
                                                <a :href="`tel:${event.contactPhone}`"
                                                    class="text-un-blue hover:text-un-blue-dark">
                                                    {{ event.contactPhone }}
                                                </a>
                                            </div>

                                            <div v-if="event.website" class="flex items-center space-x-3">
                                                <GlobeAltIcon class="w-4 h-4 text-mun-gray-500" />
                                                <a :href="event.website" target="_blank" rel="noopener noreferrer"
                                                    class="text-un-blue hover:text-un-blue-dark">
                                                    {{ event.website }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Statistics & Actions Sidebar -->
                                <div class="space-y-6">
                                    <!-- Quick Stats -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <ChartBarIcon class="w-5 h-5 mr-2 text-un-blue" />
                                            Statistics
                                        </h3>

                                        <div class="space-y-4">
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Registrations</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    event.stats?.totalRegistrations || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Confirmed</span>
                                                <span class="font-semibold text-green-600">{{ event.stats?.confirmed ||
                                                    0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Pending</span>
                                                <span class="font-semibold text-yellow-600">{{ event.stats?.pending || 0
                                                    }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Cancelled</span>
                                                <span class="font-semibold text-red-600">{{ event.stats?.cancelled || 0
                                                    }}</span>
                                            </div>

                                            <!-- Capacity Progress -->
                                            <div v-if="event.maxParticipants" class="pt-2">
                                                <div class="flex justify-between items-center mb-2">
                                                    <span class="text-sm text-mun-gray-600">Capacity</span>
                                                    <span class="text-sm font-medium">
                                                        {{ event.stats?.totalRegistrations || 0 }}/{{
                                                            event.maxParticipants }}
                                                    </span>
                                                </div>
                                                <div class="w-full bg-mun-gray-200 rounded-full h-2">
                                                    <div class="bg-un-blue rounded-full h-2 transition-all duration-300"
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
                                            <AppButton @click="editEvent" variant="primary" size="sm" class="w-full">
                                                <PencilIcon class="w-4 h-4 mr-2" />
                                                Edit Event
                                            </AppButton>

                                            <AppButton @click="viewRegistrations" variant="outline" size="sm"
                                                class="w-full">
                                                <UsersIcon class="w-4 h-4 mr-2" />
                                                View Registrations
                                            </AppButton>

                                            <AppButton @click="exportData" variant="outline" size="sm" class="w-full"
                                                :loading="isExporting">
                                                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                                                Export Data
                                            </AppButton>

                                            <AppButton @click="duplicateEvent" variant="outline" size="sm"
                                                class="w-full">
                                                <DocumentDuplicateIcon class="w-4 h-4 mr-2" />
                                                Duplicate Event
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Event Tags -->
                                    <div v-if="event.tags && event.tags.length" class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Tags</h3>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="tag in event.tags" :key="tag"
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mun-gray-100 text-mun-gray-800">
                                                {{ tag }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Additional Settings -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Settings</h3>

                                        <div class="space-y-3 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-mun-gray-600">Time Zone</span>
                                                <span class="text-mun-gray-900">{{ event.timeZone || 'Not set' }}</span>
                                            </div>

                                            <div class="flex justify-between">
                                                <span class="text-mun-gray-600">Language</span>
                                                <span class="text-mun-gray-900">{{ getLanguageName(event.language)
                                                    }}</span>
                                            </div>

                                            <div class="flex justify-between">
                                                <span class="text-mun-gray-600">Feedback Enabled</span>
                                                <span
                                                    :class="event.enableFeedback ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ event.enableFeedback ? 'Yes' : 'No' }}
                                                </span>
                                            </div>

                                            <div class="flex justify-between">
                                                <span class="text-mun-gray-600">Guest Observers</span>
                                                <span
                                                    :class="event.allowGuestObservers ? 'text-green-600' : 'text-mun-gray-400'">
                                                    {{ event.allowGuestObservers ? 'Allowed' : 'Not Allowed' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Internal Notes (Admin Only) -->
                            <div v-if="event.internalNotes" class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-un-blue" />
                                    Internal Notes
                                    <span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Admin
                                        Only</span>
                                </h3>
                                <div class="bg-mun-gray-50 rounded-lg p-4">
                                    <p class="text-mun-gray-700 whitespace-pre-wrap">{{ event.internalNotes }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                        <div class="text-sm text-mun-gray-500">
                            Created {{ formatDate(event.createdAt) }} • Last updated {{ formatDate(event.updatedAt) }}
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
    CalendarDaysIcon,
    InformationCircleIcon,
    UserPlusIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    ChartBarIcon,
    PencilIcon,
    UsersIcon,
    ArrowDownTrayIcon,
    DocumentDuplicateIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    QueueListIcon
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

const emit = defineEmits(['update:modelValue', 'edit', 'view-registrations', 'duplicate'])

const toast = useToast()

// State
const isExporting = ref(false)

// Computed
const getCapacityPercentage = () => {
    if (!props.event?.maxParticipants) return 0
    const total = props.event.stats?.totalRegistrations || 0
    return Math.min(100, (total / props.event.maxParticipants) * 100)
}

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

const formatEventType = (type) => {
    const typeMap = {
        'conference': 'Conference',
        'workshop': 'Workshop',
        'simulation': 'MUN Simulation',
        'training': 'Training Session',
        'meeting': 'Meeting'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'draft': 'Draft',
        'published': 'Published',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
}

const getStatusClasses = (status) => {
    const classMap = {
        'draft': 'bg-gray-100 text-gray-800',
        'published': 'bg-blue-100 text-blue-800',
        'active': 'bg-green-100 text-green-800',
        'completed': 'bg-purple-100 text-purple-800',
        'cancelled': 'bg-red-100 text-red-800'
    }
    return classMap[status] || 'bg-gray-100 text-gray-800'
}

const getEventStatusText = () => {
    if (!props.event) return ''
    const status = props.event.status
    const now = new Date()
    const startDate = new Date(props.event.startDate)
    const endDate = new Date(props.event.endDate)

    if (status === 'cancelled') return 'Event Cancelled'
    if (status === 'draft') return 'Draft Event'
    if (now < startDate) return 'Upcoming Event'
    if (now >= startDate && now <= endDate) return 'Event in Progress'
    if (now > endDate) return 'Event Completed'

    return formatStatus(status)
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

const editEvent = () => {
    emit('edit', props.event)
    closeModal()
}

const viewRegistrations = () => {
    emit('view-registrations', props.event)
    closeModal()
}

const exportData = async () => {
    try {
        isExporting.value = true

        const response = await apiMethods.get(`/admin/events/${props.event.id}/export`, {
            responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${props.event.name}-export.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success('Event data exported successfully')

    } catch (error) {
        console.error('Export failed:', error)
        toast.error('Failed to export event data')
    } finally {
        isExporting.value = false
    }
}

const duplicateEvent = () => {
    emit('duplicate', props.event)
    closeModal()
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
    transform: scale(0.95);
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