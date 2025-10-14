<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Event Management</h1>
                <p class="text-mun-gray-600">Create and manage MUN events</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="refreshEvents" :disabled="isLoading" class="btn-un-secondary">
                    <ArrowPathIcon class="w-5 h-5 mr-2" />
                    Refresh
                </button>
                <button @click="showCreateModal = true" class="btn-un-primary">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    Create Event
                </button>
            </div>
        </div>

        <!-- Events Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
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
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <PlayIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Active</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.active || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Upcoming</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.upcoming || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <UsersIcon class="w-6 h-6 text-mun-red-500" />
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
            <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div class="flex items-center space-x-4">
                    <SleekSelect v-model="filters.status" :options="[
                        { label: 'All Statuses', value: '' },
                        { label: 'Draft', value: 'draft' },
                        { label: 'Active', value: 'active' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' }
                    ]" @change="filterEvents" container-class="max-w-xs" />

                    <SleekSelect v-model="filters.dateRange" :options="[
                        { label: 'All Dates', value: '' },
                        { label: 'This Week', value: 'this_week' },
                        { label: 'This Month', value: 'this_month' },
                        { label: 'Next Month', value: 'next_month' },
                        { label: 'Past Events', value: 'past' }
                    ]" @change="filterEvents" container-class="max-w-xs" />

                    <div class="flex items-center space-x-2">
                        <button @click="viewMode = 'grid'" :class="[
                            'p-2 rounded-lg transition-colors',
                            viewMode === 'grid' ? 'bg-mun-blue text-white' : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                        ]">
                            <Squares2X2Icon class="w-5 h-5" />
                        </button>
                        <button @click="viewMode = 'list'" :class="[
                            'p-2 rounded-lg transition-colors',
                            viewMode === 'list' ? 'bg-mun-blue text-white' : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                        ]">
                            <ListBulletIcon class="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Search events..."
                        class="input-field max-w-xs">
                    <SleekSelect v-model="sortBy" :options="[
                        { label: 'Newest First', value: 'created_desc' },
                        { label: 'Oldest First', value: 'created_asc' },
                        { label: 'Name A-Z', value: 'name_asc' },
                        { label: 'Name Z-A', value: 'name_desc' },
                        { label: 'Start Date', value: 'date_asc' },
                        { label: 'End Date', value: 'date_desc' }
                    ]" @change="sortEvents" size="sm" container-class="max-w-xs" />
                </div>
            </div>
        </div>

        <!-- Events List/Grid -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Events</h2>
                    <div class="flex items-center space-x-3">
                        <span class="text-sm text-mun-gray-500">
                            {{ filteredEvents.length }} of {{ events.length }} events
                        </span>
                        <button @click="exportEvents" class="btn-un-secondary px-3 py-2">
                            <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
            </div>

            <div v-else-if="filteredEvents.length === 0" class="text-center py-12">
                <CalendarDaysIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">
                    {{searchQuery || Object.values(filters).some(v => v) ? 'No events found' : 'No events yet'}}
                </h3>
                <p class="mt-2 text-mun-gray-600 mb-4">
                    {{searchQuery || Object.values(filters).some(v => v) ? 'Try adjusting your search or filters' :
                        'Create your first event to get started'}}
                </p>
                <button v-if="!searchQuery && !Object.values(filters).some(v => v)" @click="showCreateModal = true"
                    class="btn-un-primary">
                    Create First Event
                </button>
            </div>

            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div v-for="event in paginatedEvents" :key="event.id"
                        class="border border-mun-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        @click="viewEvent(event)">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 class="text-lg font-medium text-mun-gray-900">{{ event.name }}</h3>
                                <p class="text-sm text-mun-gray-600">{{ event.description }}</p>
                            </div>
                            <span :class="[
                                'px-2 py-1 rounded-full text-xs font-medium',
                                event.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                    event.status === 'draft' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                        event.status === 'completed' ? 'bg-mun-gray-100 text-mun-gray-700' :
                                            'bg-mun-red-100 text-mun-red-700'
                            ]">
                                {{ formatStatus(event.status) }}
                            </span>
                        </div>

                        <div class="space-y-2 text-sm text-mun-gray-600">
                            <div class="flex items-center">
                                <CalendarDaysIcon class="w-4 h-4 mr-2" />
                                <span>{{ formatDateRange(event.startDate, event.endDate) }}</span>
                            </div>
                            <div class="flex items-center">
                                <UserGroupIcon class="w-4 h-4 mr-2" />
                                <span>{{ event.committees?.length || 0 }} committees</span>
                            </div>
                            <div class="flex items-center">
                                <UsersIcon class="w-4 h-4 mr-2" />
                                <span>{{ event.participants || 0 }} participants</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between mt-4 pt-4 border-t border-mun-gray-200">
                            <span class="text-xs text-mun-gray-500">
                                Created {{ formatRelativeDate(event.createdAt) }}
                            </span>
                            <div class="flex items-center space-x-2">
                                <button @click.stop="editEvent(event)"
                                    class="p-1 text-mun-gray-400 hover:text-mun-blue transition-colors">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                                <button @click.stop="duplicateEvent(event)"
                                    class="p-1 text-mun-gray-400 hover:text-mun-green-500 transition-colors">
                                    <DocumentDuplicateIcon class="w-4 h-4" />
                                </button>
                                <button @click.stop="deleteEvent(event)"
                                    class="p-1 text-mun-gray-400 hover:text-mun-red-500 transition-colors">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List View -->
            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-mun-gray-200">
                    <thead class="bg-mun-gray-50">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Event
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Dates
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Committees
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Participants
                            </th>
                            <th
                                class="px-6 py-3 text-right text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-mun-gray-200">
                        <tr v-for="event in paginatedEvents" :key="event.id"
                            class="hover:bg-mun-gray-50 cursor-pointer transition-colors" @click="viewEvent(event)">
                            <td class="px-6 py-4">
                                <div>
                                    <div class="text-sm font-medium text-mun-gray-900">{{ event.name }}</div>
                                    <div class="text-sm text-mun-gray-500 max-w-xs truncate">{{ event.description }}
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    event.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                        event.status === 'draft' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                            event.status === 'completed' ? 'bg-mun-gray-100 text-mun-gray-700' :
                                                'bg-mun-red-100 text-mun-red-700'
                                ]">
                                    {{ formatStatus(event.status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                                {{ formatDateRange(event.startDate, event.endDate) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-900">
                                {{ event.committees?.length || 0 }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-900">
                                {{ event.participants || 0 }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex items-center justify-end space-x-2">
                                    <button @click.stop="editEvent(event)"
                                        class="text-mun-blue hover:text-mun-blue-600 transition-colors">
                                        <PencilIcon class="w-4 h-4" />
                                    </button>
                                    <button @click.stop="duplicateEvent(event)"
                                        class="text-mun-gray-400 hover:text-mun-green-500 transition-colors">
                                        <DocumentDuplicateIcon class="w-4 h-4" />
                                    </button>
                                    <button @click.stop="deleteEvent(event)"
                                        class="text-mun-gray-400 hover:text-mun-red-500 transition-colors">
                                        <TrashIcon class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
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

        const response = await apiMethods.get('/api/admin/events')
        if (response?.data) {
            events.value = response.data
        } else {
            // Fallback if API fails
            events.value = []
        }

    } catch (error) {
        toast.error('Load events error:', error)
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

const sortEvents = () => {
    pagination.value.currentPage = 1
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

        const response = await apiMethods.post('/api/admin/events', duplicateData)
        if (response?.data) {
            events.value.unshift(response.data)
            toast.success(`Event "${response.data.name}" created successfully`)
        }
    } catch (error) {
        toast.error('Duplicate event error:', error)
        toast.error('Failed to duplicate event')
    }
}

const deleteEvent = (event) => {
    selectedEvent.value = event
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    try {
        const response = await apiMethods.delete(`/api/admin/events/${selectedEvent.value.id}`)
        if (response?.success) {
            events.value = events.value.filter(e => e.id !== selectedEvent.value.id)
            toast.success(`Event "${selectedEvent.value.name}" deleted successfully`)
        }

        showDeleteConfirm.value = false
        selectedEvent.value = null
    } catch (error) {
        toast.error('Delete event error:', error)
        toast.error('Failed to delete event')
    }
}

const exportEvents = async () => {
    try {
        const response = await apiMethods.get('/api/admin/events/export', {
            responseType: 'blob'
        })

        if (response) {
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `events-export-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Events exported successfully')
        }
    } catch (error) {
        toast.error('Export events error:', error)
        toast.error('Failed to export events')
    }
}

const handleEventCreated = (event) => {
    events.value.unshift(event)
    toast.success(`Event "${event.name}" created successfully`)
}

const handleEventUpdated = (event) => {
    const index = events.value.findIndex(e => e.id === event.id)
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