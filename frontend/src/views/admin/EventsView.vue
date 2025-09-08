<template>
    <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-mun-gray-900">Event Management</h1>
                <p class="text-mun-gray-600 mt-2">
                    Create and manage MUN events, configure settings, and track progress.
                </p>
            </div>

            <div class="flex items-center space-x-4">
                <div class="relative">
                    <MagnifyingGlassIcon
                        class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mun-gray-400" />
                    <input v-model="searchQuery" type="text" placeholder="Search events..."
                        class="pl-10 pr-4 py-2 border border-mun-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-un-blue focus:border-un-blue transition-all" />
                </div>

                <AppButton variant="primary" :icon="PlusIcon" @click="showCreateEvent = true">
                    Create Event
                </AppButton>
            </div>
        </div>

        <!-- Event Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Events" :value="eventStats.total" :loading="isLoading" color="blue"
                :icon="CalendarDaysIcon" />
            <StatCard title="Active Events" :value="eventStats.active" :loading="isLoading" color="green"
                :icon="PlayIcon" />
            <StatCard title="Upcoming Events" :value="eventStats.upcoming" :loading="isLoading" color="yellow"
                :icon="ClockIcon" />
            <StatCard title="Completed Events" :value="eventStats.completed" :loading="isLoading" color="gray"
                :icon="CheckCircleIcon" />
        </div>

        <!-- Filters and Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center space-x-4">
                <!-- Status Filter -->
                <select v-model="filters.status"
                    class="px-4 py-2 border border-mun-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-un-blue focus:border-un-blue">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>

                <!-- Date Range Filter -->
                <div class="flex items-center space-x-2">
                    <input v-model="filters.startDate" type="date"
                        class="px-3 py-2 border border-mun-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-un-blue focus:border-un-blue" />
                    <span class="text-mun-gray-400">to</span>
                    <input v-model="filters.endDate" type="date"
                        class="px-3 py-2 border border-mun-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-un-blue focus:border-un-blue" />
                </div>

                <!-- Clear Filters -->
                <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
                    Clear Filters
                </AppButton>
            </div>

            <!-- View Toggle -->
            <div class="flex items-center bg-white/60 rounded-xl p-1 border border-white/20">
                <button @click="viewMode = 'grid'" :class="[
                    'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'grid'
                        ? 'bg-un-blue text-white shadow-mun'
                        : 'text-mun-gray-600 hover:text-mun-gray-900'
                ]">
                    <Squares2X2Icon class="w-4 h-4 inline mr-1" />
                    Grid
                </button>
                <button @click="viewMode = 'list'" :class="[
                    'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'list'
                        ? 'bg-un-blue text-white shadow-mun'
                        : 'text-mun-gray-600 hover:text-mun-gray-900'
                ]">
                    <ListBulletIcon class="w-4 h-4 inline mr-1" />
                    List
                </button>
            </div>
        </div>

        <!-- Events Grid/List -->
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="i in 6" :key="i" class="loading-shimmer h-64 rounded-2xl"></div>
        </div>

        <div v-else-if="filteredEvents.length === 0" class="text-center py-12">
            <CalendarDaysIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-mun-gray-900 mb-2">No events found</h3>
            <p class="text-mun-gray-500 mb-6">
                {{ searchQuery ? 'No events match your search criteria.' : 'Get started by creating your first MUN event.' }}
            </p>
            <AppButton variant="primary" :icon="PlusIcon" @click="showCreateEvent = true">
                Create Your First Event
            </AppButton>
        </div>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EventCard v-for="event in filteredEvents" :key="event._id" :event="event" @edit="editEvent"
                @delete="deleteEvent" @duplicate="duplicateEvent" @view-details="viewEventDetails" />
        </div>

        <!-- List View -->
        <div v-else class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-mun border border-white/20 overflow-hidden">
            <EventTable :events="filteredEvents" @edit="editEvent" @delete="deleteEvent" @duplicate="duplicateEvent"
                @view-details="viewEventDetails" />
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center">
            <Pagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages"
                :total-items="pagination.totalItems" @page-change="handlePageChange" />
        </div>

        <!-- Create/Edit Event Modal -->
        <CreateEditEventModal v-model="showCreateEvent" :event="selectedEvent" @saved="handleEventSaved"
            @close="resetSelectedEvent" />

        <!-- Event Details Modal -->
        <EventDetailsModal v-model="showEventDetails" :event="selectedEvent" @edit="editEvent"
            @close="resetSelectedEvent" />

        <!-- Delete Confirmation Modal -->
        <ConfirmDeleteModal v-model="showDeleteConfirm" :item-name="selectedEvent?.name" item-type="event"
            @confirm="confirmDelete" @cancel="cancelDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import { debounce } from 'lodash-es'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    PlayIcon,
    ClockIcon,
    CheckCircleIcon,
    Squares2X2Icon,
    ListBulletIcon
} from '@heroicons/vue/24/outline'

// Import components
import StatCard from '@/components/admin/StatCard.vue'
import EventCard from '@/components/admin/EventCard.vue'
import EventTable from '@/components/admin/EventTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import CreateEditEventModal from '@/components/admin/CreateEditEventModal.vue'
import EventDetailsModal from '@/components/admin/EventDetailsModal.vue'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal.vue'

const router = useRouter()
const appStore = useAppStore()

// State
const isLoading = ref(false)
const searchQuery = ref('')
const viewMode = ref('grid') // 'grid' or 'list'
const events = ref([])
const selectedEvent = ref(null)

// Modals
const showCreateEvent = ref(false)
const showEventDetails = ref(false)
const showDeleteConfirm = ref(false)

// Filters
const filters = reactive({
    status: '',
    startDate: '',
    endDate: ''
})

// Pagination
const pagination = reactive({
    currentPage: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0
})

// Stats
const eventStats = reactive({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0
})

// Computed
const hasActiveFilters = computed(() => {
    return !!(filters.status || filters.startDate || filters.endDate || searchQuery.value)
})

const filteredEvents = computed(() => {
    let filtered = [...events.value]

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(event =>
            event.name.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query)
        )
    }

    // Status filter
    if (filters.status) {
        filtered = filtered.filter(event => event.status === filters.status)
    }

    // Date range filter
    if (filters.startDate) {
        filtered = filtered.filter(event =>
            new Date(event.startDate) >= new Date(filters.startDate)
        )
    }

    if (filters.endDate) {
        filtered = filtered.filter(event =>
            new Date(event.endDate) <= new Date(filters.endDate)
        )
    }

    return filtered
})

// Methods
const loadEvents = async (page = 1) => {
    try {
        isLoading.value = true

        const params = {
            page,
            limit: pagination.pageSize,
            ...filters
        }

        if (searchQuery.value) {
            params.search = searchQuery.value
        }

        const response = await apiMethods.events.getAll(params)

        events.value = response.data.events || []
        pagination.currentPage = response.data.currentPage || 1
        pagination.totalItems = response.data.totalItems || 0
        pagination.totalPages = response.data.totalPages || 0

        // Update stats
        eventStats.total = response.data.stats?.total || 0
        eventStats.active = response.data.stats?.active || 0
        eventStats.upcoming = response.data.stats?.upcoming || 0
        eventStats.completed = response.data.stats?.completed || 0

    } catch (error) {
        console.error('Load events error:', error)
        appStore.showErrorMessage('Failed to load events')
    } finally {
        isLoading.value = false
    }
}

const debouncedSearch = debounce(() => {
    pagination.currentPage = 1
    loadEvents()
}, 300)

const clearFilters = () => {
    filters.status = ''
    filters.startDate = ''
    filters.endDate = ''
    searchQuery.value = ''
    pagination.currentPage = 1
    loadEvents()
}

const handlePageChange = (page) => {
    pagination.currentPage = page
    loadEvents(page)
}

// Event Actions
const editEvent = (event) => {
    selectedEvent.value = { ...event }
    showCreateEvent.value = true
}

const deleteEvent = (event) => {
    selectedEvent.value = event
    showDeleteConfirm.value = true
}

const duplicateEvent = async (event) => {
    try {
        const duplicatedEvent = {
            ...event,
            name: `${event.name} (Copy)`,
            status: 'draft'
        }
        delete duplicatedEvent._id
        delete duplicatedEvent.createdAt
        delete duplicatedEvent.updatedAt

        const response = await apiMethods.events.create(duplicatedEvent)

        if (response.data.success) {
            appStore.showSuccessMessage('Event duplicated successfully')
            loadEvents()
        }
    } catch (error) {
        console.error('Duplicate event error:', error)
        appStore.showErrorMessage('Failed to duplicate event')
    }
}

const viewEventDetails = (event) => {
    selectedEvent.value = event
    showEventDetails.value = true
}

const handleEventSaved = (event) => {
    if (selectedEvent.value?._id) {
        // Update existing event
        const index = events.value.findIndex(e => e._id === selectedEvent.value._id)
        if (index !== -1) {
            events.value[index] = event
        }
        appStore.showSuccessMessage('Event updated successfully')
    } else {
        // Add new event
        events.value.unshift(event)
        appStore.showSuccessMessage('Event created successfully')
    }

    loadEvents() // Refresh to update stats
}

const confirmDelete = async () => {
    try {
        await apiMethods.events.delete(selectedEvent.value._id)

        events.value = events.value.filter(e => e._id !== selectedEvent.value._id)
        appStore.showSuccessMessage('Event deleted successfully')

        showDeleteConfirm.value = false
        resetSelectedEvent()
        loadEvents() // Refresh stats

    } catch (error) {
        console.error('Delete event error:', error)
        appStore.showErrorMessage('Failed to delete event')
    }
}

const cancelDelete = () => {
    showDeleteConfirm.value = false
    resetSelectedEvent()
}

const resetSelectedEvent = () => {
    selectedEvent.value = null
}

// Watchers
watch(searchQuery, debouncedSearch)

watch(() => [filters.status, filters.startDate, filters.endDate], () => {
    pagination.currentPage = 1
    loadEvents()
}, { deep: true })

// Initialize
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
/* Custom grid animations */
.event-card {
    animation: fadeInUp 0.4s ease-out;
}

.event-card:nth-child(1) {
    animation-delay: 0.1s;
}

.event-card:nth-child(2) {
    animation-delay: 0.2s;
}

.event-card:nth-child(3) {
    animation-delay: 0.3s;
}

/* Search input styling */
input[type="text"]:focus {
    background-color: rgba(255, 255, 255, 0.95);
}

/* Filter button transitions */
.filter-button {
    transition: all 0.2s ease;
}

.filter-button.active {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 158, 219, 0.2);
}
</style>