<template>
    <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Event Management</h1>
                <p class="text-mun-gray-600 mt-1">Create and manage MUN events</p>
            </div>

            <div class="flex items-center space-x-3">
                <AppButton variant="outline" size="md" @click="refreshEvents" :loading="isLoading">
                    <ArrowPathIcon class="w-4 h-4 mr-2" />
                    Refresh
                </AppButton>

                <AppButton variant="primary" size="md" @click="showCreateEvent = true">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Create Event
                </AppButton>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard v-for="stat in eventStats" :key="stat.title" :title="stat.title" :value="stat.value"
                :change="stat.change" :trend="stat.trend" :icon="stat.icon" :color="stat.color" />
        </div>

        <!-- Filters and Search -->
        <AppCard class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <!-- Search -->
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Search Events
                    </label>
                    <div class="relative">
                        <input v-model="searchQuery" type="text"
                            placeholder="Search by name, description, or organizer..." class="input-field pl-10"
                            @input="debouncedSearch" />
                        <MagnifyingGlassIcon
                            class="w-5 h-5 text-mun-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Status
                    </label>
                    <select v-model="filters.status" class="input-field" @change="applyFilters">
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <!-- Date Range -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Date Range
                    </label>
                    <select v-model="filters.dateRange" class="input-field" @change="applyFilters">
                        <option value="">All Dates</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="this_month">This Month</option>
                        <option value="this_year">This Year</option>
                        <option value="past">Past Events</option>
                    </select>
                </div>
            </div>

            <!-- Advanced Filters (Collapsible) -->
            <div v-if="showAdvancedFilters" class="mt-6 pt-6 border-t border-mun-gray-200">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Organizer
                        </label>
                        <input v-model="filters.organizer" type="text" placeholder="Filter by organizer..."
                            class="input-field" @input="applyFilters" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Participant Count
                        </label>
                        <select v-model="filters.participantRange" class="input-field" @change="applyFilters">
                            <option value="">Any Size</option>
                            <option value="small">Small (1-50)</option>
                            <option value="medium">Medium (51-150)</option>
                            <option value="large">Large (151-300)</option>
                            <option value="xlarge">Very Large (300+)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Event Type
                        </label>
                        <select v-model="filters.eventType" class="input-field" @change="applyFilters">
                            <option value="">All Types</option>
                            <option value="conference">Conference</option>
                            <option value="simulation">Simulation</option>
                            <option value="training">Training</option>
                            <option value="competition">Competition</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Filter Actions -->
            <div class="flex items-center justify-between mt-4">
                <button @click="showAdvancedFilters = !showAdvancedFilters"
                    class="text-sm text-un-blue hover:text-un-blue-600 flex items-center">
                    <ChevronDownIcon v-if="!showAdvancedFilters" class="w-4 h-4 mr-1" />
                    <ChevronUpIcon v-else class="w-4 h-4 mr-1" />
                    {{ showAdvancedFilters ? 'Hide' : 'Show' }} Advanced Filters
                </button>

                <div class="flex items-center space-x-3">
                    <span v-if="hasActiveFilters" class="text-sm text-mun-gray-600">
                        {{ filteredEvents.length }} of {{ totalEvents }} events
                    </span>

                    <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
                        Clear Filters
                    </AppButton>
                </div>
            </div>
        </AppCard>

        <!-- View Toggle -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <span class="text-sm text-mun-gray-600">View:</span>
                <button @click="viewMode = 'grid'" :class="[
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'grid'
                        ? 'bg-un-blue text-white'
                        : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                ]">
                    <Squares2X2Icon class="w-4 h-4" />
                </button>
                <button @click="viewMode = 'list'" :class="[
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'list'
                        ? 'bg-un-blue text-white'
                        : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                ]">
                    <ListBulletIcon class="w-4 h-4" />
                </button>
            </div>

            <!-- Sort Options -->
            <div class="flex items-center space-x-2">
                <span class="text-sm text-mun-gray-600">Sort by:</span>
                <select v-model="sortBy" class="input-field !py-2 !px-3 text-sm" @change="applySorting">
                    <option value="created_desc">Newest First</option>
                    <option value="created_asc">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="start_date_asc">Start Date (Soon)</option>
                    <option value="start_date_desc">Start Date (Latest)</option>
                    <option value="participants_desc">Most Participants</option>
                    <option value="participants_asc">Least Participants</option>
                </select>
            </div>
        </div>

        <!-- Events Display -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner size="lg" />
        </div>

        <div v-else-if="filteredEvents.length === 0" class="text-center py-12">
            <CalendarDaysIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-mun-gray-900 mb-2">
                {{ hasActiveFilters ? 'No events match your filters' : 'No events found' }}
            </h3>
            <p class="text-mun-gray-600 mb-6">
                {{ hasActiveFilters
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Get started by creating your first MUN event.'
                }}
            </p>
            <AppButton v-if="!hasActiveFilters" variant="primary" @click="showCreateEvent = true">
                <PlusIcon class="w-4 h-4 mr-2" />
                Create First Event
            </AppButton>
            <AppButton v-else variant="outline" @click="clearFilters">
                Clear All Filters
            </AppButton>
        </div>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EventCard v-for="event in paginatedEvents" :key="event._id" :event="event" @view="viewEvent"
                @edit="editEvent" @delete="deleteEvent" @duplicate="duplicateEvent"
                @toggle-status="toggleEventStatus" />
        </div>

        <!-- List View -->
        <EventTable v-else :events="paginatedEvents" :loading="isLoading" @view="viewEvent" @edit="editEvent"
            @delete="deleteEvent" @duplicate="duplicateEvent" @toggle-status="toggleEventStatus"
            @sort="handleTableSort" />

        <!-- Pagination -->
        <Pagination v-if="filteredEvents.length > pagination.pageSize" :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages" :total-items="filteredEvents.length" :page-size="pagination.pageSize"
            @page-change="handlePageChange" @page-size-change="handlePageSizeChange" />

        <!-- Modals -->
        <CreateEditEventModal v-model="showCreateEvent" @created="handleEventCreated" />

        <CreateEditEventModal v-model="showEditEvent" :event="selectedEvent" mode="edit"
            @updated="handleEventUpdated" />

        <EventDetailsModal v-model="showEventDetails" :event="selectedEvent" @edit="editEventFromDetails"
            @delete="deleteEvent" />

        <ConfirmDeleteModal v-model="showDeleteConfirm" :title="`Delete Event: ${selectedEvent?.name}`"
            :message="deleteConfirmMessage" @confirmed="confirmDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import { debounce } from 'lodash-es'

// Icons
import {
    PlusIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Squares2X2Icon,
    ListBulletIcon,
    CalendarDaysIcon
} from '@heroicons/vue/24/outline'

// Components
import StatCard from '@/components/admin/StatCard.vue'
import EventCard from '@/components/admin/EventCard.vue'
import EventTable from '@/components/admin/EventTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import CreateEditEventModal from '@/components/admin/CreateEditEventModal.vue'
import EventDetailsModal from '@/components/admin/EventDetailsModal.vue'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const searchQuery = ref('')
const viewMode = ref('grid') // 'grid' or 'list'
const sortBy = ref('created_desc')
const showAdvancedFilters = ref(false)

// Events data
const events = ref([])
const selectedEvent = ref(null)
const totalEvents = ref(0)

// Modals
const showCreateEvent = ref(false)
const showEditEvent = ref(false)
const showEventDetails = ref(false)
const showDeleteConfirm = ref(false)

// Filters
const filters = reactive({
    status: '',
    dateRange: '',
    organizer: '',
    participantRange: '',
    eventType: ''
})

// Pagination
const pagination = reactive({
    currentPage: 1,
    pageSize: 12,
    totalPages: 0
})

// Computed
const eventStats = computed(() => [
    {
        title: 'Total Events',
        value: totalEvents.value,
        change: '+12%',
        trend: 'up',
        icon: CalendarDaysIcon,
        color: 'blue'
    },
    {
        title: 'Active Events',
        value: events.value.filter(e => e.status === 'active').length,
        change: '+5%',
        trend: 'up',
        icon: CalendarDaysIcon,
        color: 'green'
    },
    {
        title: 'Upcoming Events',
        value: events.value.filter(e => e.status === 'published' && new Date(e.startDate) > new Date()).length,
        change: '+8%',
        trend: 'up',
        icon: CalendarDaysIcon,
        color: 'purple'
    },
    {
        title: 'This Month',
        value: events.value.filter(e => {
            const eventDate = new Date(e.startDate)
            const now = new Date()
            return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
        }).length,
        change: '+15%',
        trend: 'up',
        icon: CalendarDaysIcon,
        color: 'orange'
    }
])

const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' ||
        Object.values(filters).some(value => value !== '')
})

const filteredEvents = computed(() => {
    let filtered = [...events.value]

    // Apply search
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(event =>
            event.name.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query) ||
            event.organizer?.toLowerCase().includes(query)
        )
    }

    // Apply filters
    if (filters.status) {
        filtered = filtered.filter(event => event.status === filters.status)
    }

    if (filters.dateRange) {
        const now = new Date()
        filtered = filtered.filter(event => {
            const eventDate = new Date(event.startDate)

            switch (filters.dateRange) {
                case 'upcoming':
                    return eventDate > now
                case 'this_month':
                    return eventDate.getMonth() === now.getMonth() &&
                        eventDate.getFullYear() === now.getFullYear()
                case 'this_year':
                    return eventDate.getFullYear() === now.getFullYear()
                case 'past':
                    return eventDate < now
                default:
                    return true
            }
        })
    }

    if (filters.organizer) {
        const organizer = filters.organizer.toLowerCase()
        filtered = filtered.filter(event =>
            event.organizer?.toLowerCase().includes(organizer)
        )
    }

    if (filters.participantRange) {
        filtered = filtered.filter(event => {
            const count = event.maxParticipants || 0

            switch (filters.participantRange) {
                case 'small':
                    return count <= 50
                case 'medium':
                    return count > 50 && count <= 150
                case 'large':
                    return count > 150 && count <= 300
                case 'xlarge':
                    return count > 300
                default:
                    return true
            }
        })
    }

    if (filters.eventType) {
        filtered = filtered.filter(event => event.eventType === filters.eventType)
    }

    return filtered
})

const sortedEvents = computed(() => {
    const sorted = [...filteredEvents.value]

    const [field, direction] = sortBy.value.split('_')

    sorted.sort((a, b) => {
        let aVal, bVal

        switch (field) {
            case 'name':
                aVal = a.name.toLowerCase()
                bVal = b.name.toLowerCase()
                break
            case 'created':
                aVal = new Date(a.createdAt)
                bVal = new Date(b.createdAt)
                break
            case 'start':
                aVal = new Date(a.startDate)
                bVal = new Date(b.startDate)
                break
            case 'participants':
                aVal = a.maxParticipants || 0
                bVal = b.maxParticipants || 0
                break
            default:
                return 0
        }

        if (direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
    })

    return sorted
})

const paginatedEvents = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return sortedEvents.value.slice(start, end)
})

const deleteConfirmMessage = computed(() => {
    if (!selectedEvent.value) return ''

    const event = selectedEvent.value
    const hasCommittees = event.committees?.length > 0
    const hasParticipants = event.registrations?.length > 0

    let message = `Are you sure you want to delete "${event.name}"?`

    if (hasCommittees || hasParticipants) {
        message += '\n\nThis action will also delete:'
        if (hasCommittees) {
            message += `\n• ${event.committees.length} committee(s)`
        }
        if (hasParticipants) {
            message += `\n• ${event.registrations.length} registration(s)`
        }
        message += '\n\nThis action cannot be undone.'
    }

    return message
})

// Update pagination when filtered events change
watch(() => filteredEvents.value.length, (newLength) => {
    pagination.totalPages = Math.ceil(newLength / pagination.pageSize)
    if (pagination.currentPage > pagination.totalPages && pagination.totalPages > 0) {
        pagination.currentPage = pagination.totalPages
    }
})

// Methods
const loadEvents = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.events.getAll({
            page: 1,
            limit: 1000, // Get all events for client-side filtering/sorting
            include: 'committees,registrations'
        })

        if (response.data.success) {
            events.value = response.data.events || []
            totalEvents.value = response.data.total || events.value.length
        }

    } catch (error) {
        console.error('Load events error:', error)
        toast.error('Failed to load events')
    } finally {
        isLoading.value = false
    }
}

const refreshEvents = async () => {
    await loadEvents()
    toast.success('Events refreshed')
}

const debouncedSearch = debounce(() => {
    pagination.currentPage = 1
}, 300)

const applyFilters = () => {
    pagination.currentPage = 1
}

const applySorting = () => {
    pagination.currentPage = 1
}

const clearFilters = () => {
    searchQuery.value = ''
    Object.keys(filters).forEach(key => {
        filters[key] = ''
    })
    pagination.currentPage = 1
}

const handlePageChange = (page) => {
    pagination.currentPage = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size) => {
    pagination.pageSize = size
    pagination.currentPage = 1
}

const handleTableSort = (column, direction) => {
    sortBy.value = `${column}_${direction}`
}

// Event actions
const viewEvent = (event) => {
    selectedEvent.value = event
    showEventDetails.value = true
}

const editEvent = (event) => {
    selectedEvent.value = event
    showEditEvent.value = true
}

const editEventFromDetails = () => {
    showEventDetails.value = false
    showEditEvent.value = true
}

const deleteEvent = (event) => {
    selectedEvent.value = event
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    try {
        await apiMethods.events.delete(selectedEvent.value._id)

        events.value = events.value.filter(e => e._id !== selectedEvent.value._id)
        totalEvents.value--

        toast.success('Event deleted successfully')
        showDeleteConfirm.value = false
        selectedEvent.value = null

    } catch (error) {
        console.error('Delete event error:', error)
        toast.error('Failed to delete event')
    }
}

const duplicateEvent = async (event) => {
    try {
        const duplicatedData = {
            ...event,
            name: `${event.name} (Copy)`,
            status: 'draft',
            startDate: null,
            endDate: null
        }

        delete duplicatedData._id
        delete duplicatedData.createdAt
        delete duplicatedData.updatedAt
        delete duplicatedData.committees
        delete duplicatedData.registrations

        const response = await apiMethods.events.create(duplicatedData)

        if (response.data.success) {
            events.value.unshift(response.data.event)
            totalEvents.value++
            toast.success('Event duplicated successfully')
        }

    } catch (error) {
        console.error('Duplicate event error:', error)
        toast.error('Failed to duplicate event')
    }
}

const toggleEventStatus = async (event) => {
    try {
        const newStatus = event.status === 'active' ? 'published' : 'active'

        const response = await apiMethods.events.update(event._id, {
            status: newStatus
        })

        if (response.data.success) {
            const index = events.value.findIndex(e => e._id === event._id)
            if (index !== -1) {
                events.value[index] = { ...events.value[index], ...response.data.event }
            }

            toast.success(`Event ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        }

    } catch (error) {
        console.error('Toggle event status error:', error)
        toast.error('Failed to update event status')
    }
}

const handleEventCreated = (event) => {
    events.value.unshift(event)
    totalEvents.value++
    showCreateEvent.value = false
    toast.success('Event created successfully')
}

const handleEventUpdated = (updatedEvent) => {
    const index = events.value.findIndex(e => e._id === updatedEvent._id)
    if (index !== -1) {
        events.value[index] = updatedEvent
    }
    showEditEvent.value = false
    selectedEvent.value = null
    toast.success('Event updated successfully')
}

// Lifecycle
onMounted(() => {
    loadEvents()

    // Update breadcrumbs
    appStore.setBreadcrumbs([
        { text: 'Admin', to: { name: 'AdminDashboard' } },
        { text: 'Events', active: true }
    ])
})
</script>

<style scoped>
/* Custom transitions for view mode changes */
.view-transition-enter-active,
.view-transition-leave-active {
    transition: all 0.3s ease;
}

.view-transition-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.view-transition-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>