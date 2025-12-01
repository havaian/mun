<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Event Management</h1>
                <p class="text-mun-gray-600 mt-1">Create and manage MUN events</p>
            </div>

            <div class="flex items-center space-x-3">
                <button @click="refreshEvents" :disabled="isLoading" class="btn-un-fourth">
                    <ArrowPathIcon class="w-4 h-4 mr-2" />
                    Refresh
                </button>

                <button @click="showCreateModal = true" class="btn-un-third">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Create Event
                </button>
            </div>
        </div>

        <!-- Events Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex h-full items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <CalendarDaysIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Events</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.total || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex h-full items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <PlayIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Active</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.active || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex h-full items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <ClockIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Upcoming</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.upcoming || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card h-full p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <UsersIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Participants</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.totalParticipants || 0 }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters and Search -->
        <div class="mun-card p-6">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <!-- Search -->
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Search Events
                    </label>
                    <div class="relative">
                        <input v-model="searchQuery" type="text" placeholder="Search by name or description..."
                            class="input-field pl-10" @input="debouncedSearch" />
                        <MagnifyingGlassIcon
                            class="w-5 h-5 text-mun-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Status
                    </label>
                    <SleekSelect v-model="filters.status" placeholder="Select status" :options="[
                        { label: 'All Statuses', value: '' },
                        { label: 'Draft', value: 'draft' },
                        { label: 'Active', value: 'active' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' }
                    ]" @change="filterEvents" container-class="w-full" />
                </div>

                <!-- Date Range Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Date Range
                    </label>
                    <SleekSelect v-model="filters.dateRange" placeholder="Select time period" :options="[
                        { label: 'All Dates', value: '' },
                        { label: 'This Week', value: 'this_week' },
                        { label: 'This Month', value: 'this_month' },
                        { label: 'Next Month', value: 'next_month' },
                        { label: 'Past Events', value: 'past' }
                    ]" @change="filterEvents" container-class="w-full" />
                </div>
            </div>
        </div>

        <!-- View Toggle and Bulk Actions -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <!-- View Toggle -->
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">View:</span>
                    <button @click="viewMode = 'grid'" :class="[
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'grid' ? 'bg-mun-blue text-white' : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                    ]">
                        <Squares2X2Icon class="w-4 h-4" />
                    </button>
                    <button @click="viewMode = 'list'" :class="[
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'list' ? 'bg-mun-blue text-white' : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                    ]">
                        <ListBulletIcon class="w-4 h-4" />
                    </button>
                </div>

                <!-- Filter Status -->
                <div v-if="hasActiveFilters" class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">
                        {{ filteredEvents.length }} of {{ events.length }} events
                    </span>
                    <button @click="clearFilters" class="btn-un-secondary px-3 py-2">
                        Clear Filters
                    </button>
                </div>
            </div>

            <!-- Sort Options -->
            <div class="flex items-center space-x-2">
                <span class="text-sm text-mun-gray-600">Sort by:</span>
                <SleekSelect v-model="sortBy" :options="[
                    { label: 'Newest First', value: 'created_desc' },
                    { label: 'Oldest First', value: 'created_asc' },
                    { label: 'Name A-Z', value: 'name_asc' },
                    { label: 'Name Z-A', value: 'name_desc' },
                    { label: 'Start Date', value: 'date_asc' },
                    { label: 'End Date', value: 'date_desc' }
                ]" @change="sortEvents" size="sm" container-class="min-w-[150px]" />
            </div>
        </div>

        <!-- Events List/Grid -->
        <div>
            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
            </div>

            <div v-else-if="filteredEvents.length === 0" class="mun-card overflow-hidden text-center py-12">
                <CalendarDaysIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-mun-gray-900 mb-2">
                    {{ hasActiveFilters ? 'No events match your filters' : 'No events found' }}
                </h3>
                <p class="text-mun-gray-600 mb-6">
                    {{ hasActiveFilters
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Get started by creating your first event.'
                    }}
                </p>
                <button v-if="!hasActiveFilters" @click="showCreateModal = true" class="btn-un-primary">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Create First Event
                </button>
                <button v-else @click="clearFilters" class="btn-un-secondary">
                    Clear All Filters
                </button>
            </div>

            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="event in paginatedEvents" :key="event._id || event.id"
                    class="mun-card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border border-mun-gray-200"
                    @click="viewEvent(event)">

                    <!-- Event Header -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-1 truncate">{{ event.name }}</h3>
                            <p class="text-sm text-mun-gray-600 line-clamp-2">
                                {{ event.description || 'No description available' }}
                            </p>
                        </div>
                    </div>

                    <!-- Status Badge -->
                    <div class="flex items-center justify-between mb-4">
                        <span :class="[
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            event.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                event.status === 'draft' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                    event.status === 'completed' ? 'bg-mun-blue-100 text-mun-blue-700' :
                                        'bg-mun-red-100 text-mun-red-700'
                        ]">
                            {{ formatStatus(event.status) }}
                        </span>
                        <div class="flex items-center text-xs text-mun-gray-500">
                            <CalendarDaysIcon class="w-3 h-3 mr-1" />
                            {{ getDaysUntilEvent(event.startDate) }}
                        </div>
                    </div>

                    <!-- Event Stats -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-mun-gray-900">{{ event.statistics?.totalCommittees || 0 }}</div>
                            <div class="text-xs text-mun-gray-600">Committees</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-mun-gray-900">{{ event.statistics?.totalParticipants || 0 }}</div>
                            <div class="text-xs text-mun-gray-600">Participants</div>
                        </div>
                    </div>

                    <!-- Event Timeline -->
                    <div class="space-y-3 mb-4">
                        <div class="flex items-center text-sm">
                            <div class="w-2 h-2 rounded-full bg-mun-blue mr-3 flex-shrink-0"></div>
                            <div class="flex-1">
                                <span class="text-mun-gray-600">Event:</span>
                                <span class="text-mun-gray-900 font-medium ml-1">
                                    {{ formatDateRange(event.startDate, event.endDate) }}
                                </span>
                            </div>
                        </div>
                        <div v-if="event.settings?.registrationDeadline" class="flex items-center text-sm">
                            <div class="w-2 h-2 rounded-full bg-mun-orange mr-3 flex-shrink-0"></div>
                            <div class="flex-1">
                                <span class="text-mun-gray-600">Registration:</span>
                                <span class="text-mun-gray-900 font-medium ml-1">
                                    {{ formatDate(event.settings.registrationDeadline) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Event Actions -->
                    <div class="flex items-center justify-between pt-4 border-t border-mun-gray-200">
                        <div class="text-xs text-mun-gray-500">
                            Created {{ formatRelativeDate(event.createdAt) }}
                        </div>
                        <div class="flex items-center space-x-1">
                            <button @click.stop="editEvent(event)"
                                class="p-2 text-mun-gray-400 hover:text-mun-blue hover:bg-mun-blue-50 rounded-lg transition-colors">
                                <PencilIcon class="w-4 h-4" />
                            </button>
                            <button @click.stop="deleteEvent(event)"
                                class="p-2 text-mun-gray-400 hover:text-mun-red-500 hover:bg-mun-red-50 rounded-lg transition-colors">
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List View -->
            <div v-else class="mun-card overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-mun-gray-200">
                        <thead class="bg-mun-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Status & Timeline
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Committees
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Participants
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-mun-gray-500 uppercase tracking-wider w-32">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-mun-gray-200">
                            <tr v-for="event in paginatedEvents" :key="event._id || event.id"
                                class="hover:bg-mun-gray-50 cursor-pointer transition-colors"
                                @click="viewEvent(event)">
                                <td class="px-6 py-4">
                                    <div class="flex items-center space-x-3">
                                        <div class="min-w-0 flex-1">
                                            <div class="text-sm font-medium text-mun-gray-900 truncate">{{ event.name }}</div>
                                            <div class="text-sm text-mun-gray-500 truncate">
                                                {{ event.description || 'No description' }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col space-y-1">
                                        <span :class="[
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit',
                                            event.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                                event.status === 'draft' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                                    event.status === 'completed' ? 'bg-mun-blue-100 text-mun-blue-700' :
                                                        'bg-mun-red-100 text-mun-red-700'
                                        ]">
                                            {{ formatStatus(event.status) }}
                                        </span>
                                        <span class="text-xs text-mun-gray-500">
                                            {{ getDaysUntilEvent(event.startDate) }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <div class="text-lg font-semibold text-mun-gray-900">
                                        {{ event.statistics?.totalCommittees || 0 }}
                                    </div>
                                    <div class="text-xs text-mun-gray-500">committees</div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <div class="text-lg font-semibold text-mun-gray-900">
                                        {{ event.statistics?.totalParticipants || 0 }}
                                    </div>
                                    <div class="text-xs text-mun-gray-500">registered</div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-mun-gray-900 font-medium">
                                        {{ formatDateRange(event.startDate, event.endDate) }}
                                    </div>
                                    <div v-if="event.settings?.registrationDeadline" class="text-sm text-mun-gray-500">
                                        Reg: {{ formatDate(event.settings.registrationDeadline) }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right w-32">
                                    <div class="flex items-center justify-end space-x-1">
                                        <button @click.stop="editEvent(event)"
                                            class="p-2 text-mun-gray-400 hover:text-mun-blue hover:bg-mun-blue-50 rounded-lg transition-colors">
                                            <PencilIcon class="w-4 h-4" />
                                        </button>
                                        <!-- <button @click.stop="duplicateEvent(event)"
                                            class="p-2 text-mun-gray-400 hover:text-mun-green-500 hover:bg-mun-green-50 rounded-lg transition-colors">
                                            <DocumentDuplicateIcon class="w-4 h-4" />
                                        </button> -->
                                        <button @click.stop="deleteEvent(event)"
                                            class="p-2 text-mun-gray-400 hover:text-mun-red-500 hover:bg-mun-red-50 rounded-lg transition-colors">
                                            <TrashIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="px-6 py-4 border-t border-mun-gray-200">
                <Pagination :current-page="pagination.currentPage" :total-pages="totalPages"
                    @page-change="handlePageChange" />
            </div>
        </div>

        <!-- Modals -->
        <CreateEditEventModal v-model="showCreateModal" mode="create" @saved="handleEventCreated" />

        <CreateEditEventModal v-model="showEditModal" mode="edit" :event="selectedEvent" @saved="handleEventUpdated" />

        <EventDetailsModal v-model="showDetailsModal" :event="selectedEvent" @edit="editEventFromDetails"
            @delete="deleteEvent" />

        <ConfirmDeleteModal v-model="showDeleteConfirm" :title="`Delete Event: ${selectedEvent?.name}`"
            :message="deleteConfirmMessage" @confirmed="confirmDelete" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
    Squares2X2Icon,
    ListBulletIcon,
    CalendarDaysIcon,
    PlayIcon,
    ClockIcon,
    UsersIcon,
    UserGroupIcon,
    DocumentArrowDownIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon
} from '@heroicons/vue/24/outline'

// Components
import CreateEditEventModal from '@/components/admin/CreateEditEventModal.vue'
import EventDetailsModal from '@/components/admin/EventDetailsModal.vue'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal.vue'
import Pagination from '@/components/ui/Pagination.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const searchQuery = ref('')
const viewMode = ref('grid') // 'grid' or 'list'
const sortBy = ref('created_desc')

// Events data
const events = ref([])
const selectedEvent = ref(null)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteConfirm = ref(false)

// Filters
const filters = ref({
    status: '',
    dateRange: ''
})

// Stats - calculated from events data
const stats = computed(() => {
    const now = new Date()
    const total = events.value.length
    const active = events.value.filter(e => e.status === 'active').length
    const upcoming = events.value.filter(e => {
        const startDate = new Date(e.startDate)
        return e.status === 'draft' && startDate > now
    }).length
    const totalParticipants = events.value.reduce((sum, e) => sum + (e.participants || 0), 0)

    return { total, active, upcoming, totalParticipants }
})

// Pagination
const pagination = ref({
    currentPage: 1,
    pageSize: 12
})

// Computed
const filteredEvents = computed(() => {
    let filtered = events.value

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(event =>
            event.name.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query)
        )
    }

    // Status filter
    if (filters.value.status) {
        filtered = filtered.filter(event => event.status === filters.value.status)
    }

    // Date range filter
    if (filters.value.dateRange) {
        const now = new Date()
        filtered = filtered.filter(event => {
            const eventDate = new Date(event.startDate)
            switch (filters.value.dateRange) {
                case 'this_week':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
                    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return eventDate >= weekStart && eventDate <= weekEnd
                case 'this_month':
                    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
                case 'next_month':
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1)
                    return eventDate.getMonth() === nextMonth.getMonth() && eventDate.getFullYear() === nextMonth.getFullYear()
                case 'past':
                    return eventDate < now
                default:
                    return true
            }
        })
    }

    // Sort
    return filtered.sort((a, b) => {
        switch (sortBy.value) {
            case 'created_asc':
                return new Date(a.createdAt) - new Date(b.createdAt)
            case 'created_desc':
                return new Date(b.createdAt) - new Date(a.createdAt)
            case 'name_asc':
                return a.name.localeCompare(b.name)
            case 'name_desc':
                return b.name.localeCompare(a.name)
            case 'date_asc':
                return new Date(a.startDate) - new Date(b.startDate)
            case 'date_desc':
                return new Date(b.startDate) - new Date(a.startDate)
            default:
                return 0
        }
    })
})

const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' ||
        Object.values(filters.value).some(value => value !== '')
})

const totalPages = computed(() => {
    return Math.ceil(filteredEvents.value.length / pagination.value.pageSize)
})

const paginatedEvents = computed(() => {
    const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return filteredEvents.value.slice(start, end)
})

const deleteConfirmMessage = computed(() => {
    return `Are you sure you want to delete "${selectedEvent.value?.name}"? This action cannot be undone and will also delete all associated committees and data.`
})

// Methods
const loadEvents = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.events.getAll()

        // Handle different response structures
        if (response?.data?.success && response.data.events) {
            // Backend returns { success: true, events: [...], pagination: {...} }
            events.value = response.data.events || []
        } else if (response?.data && Array.isArray(response.data)) {
            // Direct array response
            events.value = response.data
        } else if (response?.data) {
            // Single data object with events property
            events.value = response.data.events || response.data || []
        } else {
            events.value = []
        }

    } catch (error) {
        console.error('Failed to load events:', error)
        toast.error('Failed to load events')
        events.value = []
    } finally {
        isLoading.value = false
    }
}

const refreshEvents = async () => {
    await loadEvents()
    toast.success('Events refreshed')
}

const filterEvents = () => {
    pagination.value.currentPage = 1
}

const clearFilters = () => {
    searchQuery.value = ''
    Object.keys(filters.value).forEach(key => {
        filters.value[key] = ''
    })
    pagination.value.currentPage = 1
}

const sortEvents = () => {
    pagination.value.currentPage = 1
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    })
}

const getDaysUntilEvent = (startDate) => {
    if (!startDate) return 'No date set'
    
    const now = new Date()
    const eventDate = new Date(startDate)
    const diffTime = eventDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
        return `${Math.abs(diffDays)} days ago`
    } else if (diffDays === 0) {
        return 'Today'
    } else if (diffDays === 1) {
        return 'Tomorrow'
    } else {
        return `in ${diffDays} days`
    }
}

const debouncedSearch = debounce(() => {
    pagination.value.currentPage = 1
}, 300)

const viewEvent = (event) => {
    selectedEvent.value = event
    showDetailsModal.value = true
}

const editEvent = (event) => {
    selectedEvent.value = event
    showEditModal.value = true
}

const editEventFromDetails = (event) => {
    showDetailsModal.value = false
    setTimeout(() => {
        selectedEvent.value = event
        showEditModal.value = true
    }, 100)
}

const duplicateEvent = async (event) => {
    try {
        const duplicateData = {
            name: `${event.name} (Copy)`,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            status: 'draft'
        }

        const response = await apiMethods.events.create(duplicateData)

        if (response?.data?.success && response.data.event) {
            events.value.unshift(response.data.event)
            toast.success(`Event "${response.data.event.name}" duplicated successfully`)
        } else if (response?.data) {
            // Fallback if structure is different
            events.value.unshift(response.data)
            toast.success(`Event "${response.data.name}" duplicated successfully`)
        } else {
            throw new Error('Unexpected response structure')
        }
    } catch (error) {
        console.error('Failed to duplicate event:', error)
        toast.error('Failed to duplicate event')
    }
}

const deleteEvent = (event) => {
    selectedEvent.value = event
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    try {
        // Handle both _id (MongoDB) and id field names
        const eventId = selectedEvent.value._id || selectedEvent.value.id

        if (!eventId) {
            throw new Error('Event ID not found')
        }

        const response = await apiMethods.events.delete(eventId)

        // Check for successful deletion
        if (response?.status === 200 || response?.data?.success) {
            // Remove event from local array
            events.value = events.value.filter(e =>
                (e._id || e.id) !== eventId
            )
            toast.success(`Event "${selectedEvent.value.name}" deleted successfully`)
        } else {
            throw new Error('Delete operation failed')
        }

        showDeleteConfirm.value = false
        selectedEvent.value = null
    } catch (error) {
        console.error('Failed to delete event:', error)

        // Check for specific error messages
        if (error.response?.data?.error) {
            const errorMessage = error.response.data.error
            if (errorMessage.includes('Cannot delete event with existing committees')) {
                toast.error('Cannot delete event with existing committees. Delete committees first.')
            } else {
                toast.error(errorMessage)
            }
        } else {
            toast.error('Failed to delete event')
        }
    }
}

const exportEvents = async () => {
    try {
        const response = await apiMethods.exports.exportEvents()

        if (response?.data) {
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `events-export-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Events exported successfully')
        } else {
            throw new Error('No data received')
        }
    } catch (error) {
        console.error('Failed to export events:', error)
        toast.error('Failed to export events')
    }
}

const handleEventCreated = (event) => {
    events.value.unshift(event)
    toast.success(`Event "${event.name}" created successfully`)
}

const handleEventUpdated = (event) => {
    const index = events.value.findIndex(e =>
        (e._id || e.id) === (event._id || event.id)
    )
    if (index !== -1) {
        events.value[index] = event
        toast.success(`Event "${event.name}" updated successfully`)
    }
}

const handlePageChange = (page) => {
    pagination.value.currentPage = page
}

// Utility functions
const formatStatus = (status) => {
    const statusMap = {
        'draft': 'Draft',
        'active': 'Active',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
}

const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'No dates set'
    const start = new Date(startDate).toLocaleDateString()
    const end = new Date(endDate).toLocaleDateString()
    return `${start} - ${end}`
}

const formatRelativeDate = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
}

// Watchers
watch(() => route.query.highlight, (eventId) => {
    if (eventId) {
        const event = events.value.find(e => e.id === parseInt(eventId))
        if (event) {
            viewEvent(event)
        }
    }
}, { immediate: true })

// Lifecycle
onMounted(() => {
    loadEvents()
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