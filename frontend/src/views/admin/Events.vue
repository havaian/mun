<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-minimal border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center space-x-4">
                        <button @click="$router.push('/admin/dashboard')"
                            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 class="text-lg font-semibold text-gray-900">Events Management</h1>
                            <p class="text-sm text-gray-500">Create and manage MUN events</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-3">
                        <!-- Search -->
                        <div class="relative">
                            <input v-model="searchQuery" type="text" placeholder="Search events..."
                                class="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <!-- Filter -->
                        <select v-model="selectedFilter"
                            class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Events</option>
                            <option value="active">Active</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="draft">Draft</option>
                        </select>

                        <!-- Create Event Button -->
                        <button @click="handleCreateEvent" class="btn-primary">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Event
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-blue-50 rounded-lg">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total Events</p>
                            <p class="text-2xl font-bold text-gray-900">{{ eventStats.total }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-green-50 rounded-lg">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Active</p>
                            <p class="text-2xl font-bold text-green-600">{{ eventStats.active }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-yellow-50 rounded-lg">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Upcoming</p>
                            <p class="text-2xl font-bold text-yellow-600">{{ eventStats.upcoming }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-purple-50 rounded-lg">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Participants</p>
                            <p class="text-2xl font-bold text-purple-600">{{ eventStats.participants }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Events Table -->
            <div class="card">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">All Events</h2>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading" class="flex items-center justify-center py-12">
                    <div class="flex items-center space-x-3">
                        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin">
                        </div>
                        <span class="text-gray-600">Loading events...</span>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="filteredEvents.length === 0" class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No events found</h3>
                    <p class="mt-2 text-gray-500">
                        {{ searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first event.' }}
                    </p>
                    <button v-if="!searchQuery" @click="handleCreateEvent" class="mt-4 btn-primary">
                        Create Event
                    </button>
                </div>

                <!-- Events List -->
                <div v-else class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event Details
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Committees
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Participants
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date Range
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="event in paginatedEvents" :key="event.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div :class="[
                                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                                event.status === 'active' ? 'bg-green-100 text-green-600' :
                                                    event.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                                                        event.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                            ]">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">{{ event.name }}</div>
                                            <div class="text-sm text-gray-500">{{ event.description }}</div>
                                            <div class="text-xs text-gray-400 mt-1">Created {{
                                                formatDate(event.createdAt) }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="[
                                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                                        event.status === 'active' ? 'bg-green-100 text-green-800' :
                                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                                event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                    ]">
                                        {{ event.status }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ event.committees?.length || 0 }} committees
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        {{event.committees?.slice(0, 2).map(c => c.name).join(', ')}}
                                        <span v-if="event.committees?.length > 2">+{{ event.committees.length - 2 }}
                                            more</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">{{ event.totalParticipants || 0 }}</div>
                                    <div class="text-xs text-gray-500">{{ event.registeredParticipants || 0 }}
                                        registered</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>{{ formatDate(event.startDate) }}</div>
                                    <div class="text-xs">to {{ formatDate(event.endDate) }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex items-center space-x-2">
                                        <button @click="handleViewEvent(event)"
                                            class="text-blue-600 hover:text-blue-900">
                                            View
                                        </button>
                                        <button @click="handleEditEvent(event)"
                                            class="text-indigo-600 hover:text-indigo-900">
                                            Edit
                                        </button>
                                        <button @click="handleDeleteEvent(event)"
                                            class="text-red-600 hover:text-red-900">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="filteredEvents.length > itemsPerPage" class="px-6 py-4 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-700">
                            Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage *
                                itemsPerPage, filteredEvents.length) }} of {{ filteredEvents.length }} events
                        </div>
                        <div class="flex items-center space-x-2">
                            <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                Previous
                            </button>
                            <span class="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md">
                                {{ currentPage }}
                            </span>
                            <button @click="currentPage = Math.min(totalPages, currentPage + 1)"
                                :disabled="currentPage === totalPages"
                                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// State
const events = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10

// Event statistics
const eventStats = ref({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    participants: 0
})

// Computed
const filteredEvents = computed(() => {
    let filtered = events.value

    // Filter by status
    if (selectedFilter.value !== 'all') {
        filtered = filtered.filter(event => event.status === selectedFilter.value)
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(event =>
            event.name.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.committees?.some(c => c.name.toLowerCase().includes(query))
        )
    }

    return filtered
})

const totalPages = computed(() => {
    return Math.ceil(filteredEvents.value.length / itemsPerPage)
})

const paginatedEvents = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredEvents.value.slice(start, end)
})

// Methods
async function fetchEvents() {
    try {
        isLoading.value = true

        const response = await authStore.apiCall('/admin/events')
        if (response.ok) {
            const data = await response.json()
            events.value = data.events || []
            eventStats.value = data.stats || eventStats.value
        } else {
            throw new Error('Failed to fetch events')
        }
    } catch (error) {
        console.error('Events fetch error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to load events'
        })
    } finally {
        isLoading.value = false
    }
}

function handleCreateEvent() {
    window.openModal({
        component: 'CreateEventModal',
        size: 'lg',
        props: {
            onSuccess: (newEvent) => {
                events.value.unshift(newEvent)
                updateStats()
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Event created successfully'
                })
            }
        }
    })
}

function handleViewEvent(event) {
    router.push(`/admin/events/${event.id}`)
}

function handleEditEvent(event) {
    window.openModal({
        component: 'EditEventModal',
        size: 'lg',
        props: {
            event,
            onSuccess: (updatedEvent) => {
                const index = events.value.findIndex(e => e.id === event.id)
                if (index !== -1) {
                    events.value[index] = updatedEvent
                }
                updateStats()
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Event updated successfully'
                })
            }
        }
    })
}

async function handleDeleteEvent(event) {
    const confirmed = await showConfirmDialog({
        title: 'Delete Event',
        message: `Are you sure you want to delete "${event.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger'
    })

    if (!confirmed) return

    try {
        const response = await authStore.apiCall(`/admin/events/${event.id}`, {
            method: 'DELETE'
        })

        if (response.ok) {
            events.value = events.value.filter(e => e.id !== event.id)
            updateStats()
            window.showNotification({
                type: 'success',
                title: 'Success',
                message: 'Event deleted successfully'
            })
        } else {
            throw new Error('Failed to delete event')
        }
    } catch (error) {
        console.error('Event deletion error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to delete event'
        })
    }
}

function updateStats() {
    const stats = {
        total: events.value.length,
        active: events.value.filter(e => e.status === 'active').length,
        upcoming: events.value.filter(e => e.status === 'upcoming').length,
        completed: events.value.filter(e => e.status === 'completed').length,
        participants: events.value.reduce((sum, e) => sum + (e.totalParticipants || 0), 0)
    }
    eventStats.value = stats
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

// Watch for URL params to trigger create action
watch(() => route.query.action, (action) => {
    if (action === 'create') {
        handleCreateEvent()
        // Remove the query param
        router.replace({ query: {} })
    }
}, { immediate: true })

// Watch for filter changes and reset pagination
watch([selectedFilter, searchQuery], () => {
    currentPage.value = 1
})

// Initialize
onMounted(() => {
    fetchEvents()
})
</script>