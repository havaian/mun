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
                            <h1 class="text-lg font-semibold text-gray-900">User Management</h1>
                            <p class="text-sm text-gray-500">Manage delegates, presidium, and administrators</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-3">
                        <!-- Search -->
                        <div class="relative">
                            <input v-model="searchQuery" type="text" placeholder="Search users..."
                                class="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <!-- Role Filter -->
                        <select v-model="selectedRole"
                            class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Roles</option>
                            <option value="admin">Administrators</option>
                            <option value="presidium">Presidium</option>
                            <option value="delegate">Delegates</option>
                            <option value="observer">Observers</option>
                        </select>

                        <!-- Event Filter -->
                        <select v-model="selectedEvent"
                            class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Events</option>
                            <option v-for="event in events" :key="event.id" :value="event.id">
                                {{ event.name }}
                            </option>
                        </select>

                        <!-- Add User Button -->
                        <button @click="handleAddUser" class="btn-primary">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add User
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
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total Users</p>
                            <p class="text-2xl font-bold text-gray-900">{{ userStats.total }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-green-50 rounded-lg">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Active</p>
                            <p class="text-2xl font-bold text-green-600">{{ userStats.active }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-purple-50 rounded-lg">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Delegates</p>
                            <p class="text-2xl font-bold text-purple-600">{{ userStats.delegates }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-yellow-50 rounded-lg">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Online Now</p>
                            <p class="text-2xl font-bold text-yellow-600">{{ userStats.online }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Users Table -->
            <div class="card">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-gray-900">All Users</h2>
                        <div class="flex items-center space-x-3">
                            <!-- Bulk Actions -->
                            <div v-if="selectedUsers.length > 0" class="flex items-center space-x-2">
                                <span class="text-sm text-gray-600">{{ selectedUsers.length }} selected</span>
                                <button @click="handleBulkActivate" class="btn-secondary text-sm">
                                    Activate
                                </button>
                                <button @click="handleBulkDeactivate" class="btn-secondary text-sm">
                                    Deactivate
                                </button>
                                <button @click="handleBulkDelete" class="btn-danger text-sm">
                                    Delete
                                </button>
                            </div>

                            <!-- Export -->
                            <button @click="handleExport" class="btn-secondary">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading" class="flex items-center justify-center py-12">
                    <div class="flex items-center space-x-3">
                        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin">
                        </div>
                        <span class="text-gray-600">Loading users...</span>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No users found</h3>
                    <p class="mt-2 text-gray-500">
                        {{ searchQuery ? 'Try adjusting your search or filters.' : 'Get started by adding your first user.' }}
                    </p>
                </div>

                <!-- Users List -->
                <div v-else class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left">
                                    <input type="checkbox" :checked="allUsersSelected"
                                        :indeterminate="someUsersSelected" @change="toggleSelectAll"
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User Details
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role & Status
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Committee/Country
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Activity
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <input type="checkbox" :checked="selectedUsers.includes(user.id)"
                                        @change="toggleUserSelection(user.id)"
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div
                                                class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                                <span class="text-sm font-medium text-white">
                                                    {{ getInitials(user.name || user.email) }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">
                                                {{ user.name || 'Unnamed User' }}
                                            </div>
                                            <div class="text-sm text-gray-500">{{ user.email }}</div>
                                            <div v-if="user.username" class="text-xs text-gray-400">@{{ user.username }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center space-x-2">
                                        <span :class="[
                                            'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                user.role === 'presidium' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'delegate' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                        ]">
                                            {{ user.role }}
                                        </span>
                                        <div :class="[
                                            'w-2 h-2 rounded-full',
                                            user.isActive ? 'bg-green-500' : 'bg-gray-300'
                                        ]" :title="user.isActive ? 'Active' : 'Inactive'"></div>
                                        <div v-if="user.isOnline" :class="[
                                            'w-2 h-2 rounded-full bg-green-400 animate-pulse'
                                        ]" title="Online"></div>
                                    </div>
                                    <div v-if="user.presidiumRole" class="text-xs text-purple-600 mt-1">
                                        {{ user.presidiumRole }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">
                                        {{ user.committee?.name || 'No Committee' }}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        {{ user.country || 'No Country' }}
                                    </div>
                                    <div v-if="user.delegationType" class="text-xs text-gray-400 mt-1">
                                        {{ user.delegationType }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>{{ formatDate(user.lastLoginAt) }}</div>
                                    <div class="text-xs">{{ user.loginCount || 0 }} logins</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex items-center space-x-2">
                                        <button @click="handleViewUser(user)" class="text-blue-600 hover:text-blue-900">
                                            View
                                        </button>
                                        <button @click="handleEditUser(user)"
                                            class="text-indigo-600 hover:text-indigo-900">
                                            Edit
                                        </button>
                                        <button v-if="!user.isActive" @click="handleActivateUser(user)"
                                            class="text-green-600 hover:text-green-900">
                                            Activate
                                        </button>
                                        <button v-else @click="handleDeactivateUser(user)"
                                            class="text-yellow-600 hover:text-yellow-900">
                                            Deactivate
                                        </button>
                                        <button @click="handleResetQR(user)"
                                            class="text-purple-600 hover:text-purple-900">
                                            Reset QR
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="filteredUsers.length > itemsPerPage" class="px-6 py-4 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-700">
                            Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to {{ Math.min(currentPage *
                                itemsPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} users
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
import { useSocketStore } from '../../stores/websocket'

const authStore = useAuthStore()
const socketStore = useSocketStore()

// State
const users = ref([])
const events = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedRole = ref('all')
const selectedEvent = ref('all')
const currentPage = ref(1)
const itemsPerPage = 15
const selectedUsers = ref([])

// User statistics
const userStats = ref({
    total: 0,
    active: 0,
    delegates: 0,
    online: 0
})

// Computed
const filteredUsers = computed(() => {
    let filtered = users.value

    // Filter by role
    if (selectedRole.value !== 'all') {
        filtered = filtered.filter(user => user.role === selectedRole.value)
    }

    // Filter by event
    if (selectedEvent.value !== 'all') {
        filtered = filtered.filter(user => user.eventId === selectedEvent.value)
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(user =>
            user.name?.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query) ||
            user.country?.toLowerCase().includes(query) ||
            user.committee?.name?.toLowerCase().includes(query)
        )
    }

    return filtered
})

const totalPages = computed(() => {
    return Math.ceil(filteredUsers.value.length / itemsPerPage)
})

const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredUsers.value.slice(start, end)
})

const allUsersSelected = computed(() => {
    return paginatedUsers.value.length > 0 &&
        paginatedUsers.value.every(user => selectedUsers.value.includes(user.id))
})

const someUsersSelected = computed(() => {
    return selectedUsers.value.length > 0 && !allUsersSelected.value
})

// Methods
async function fetchUsers() {
    try {
        isLoading.value = true

        const response = await authStore.apiCall('/admin/users')
        if (response.ok) {
            const data = await response.json()
            users.value = data.users || []
            events.value = data.events || []
            updateStats()
        } else {
            throw new Error('Failed to fetch users')
        }
    } catch (error) {
        console.error('Users fetch error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to load users'
        })
    } finally {
        isLoading.value = false
    }
}

function updateStats() {
    const onlineUserIds = socketStore.onlineUsersList.map(u => u.id)

    userStats.value = {
        total: users.value.length,
        active: users.value.filter(u => u.isActive).length,
        delegates: users.value.filter(u => u.role === 'delegate').length,
        online: users.value.filter(u => onlineUserIds.includes(u.id)).length
    }

    // Update online status for users
    users.value.forEach(user => {
        user.isOnline = onlineUserIds.includes(user.id)
    })
}

function toggleSelectAll() {
    if (allUsersSelected.value) {
        selectedUsers.value = selectedUsers.value.filter(id =>
            !paginatedUsers.value.some(user => user.id === id)
        )
    } else {
        const pageUserIds = paginatedUsers.value.map(user => user.id)
        selectedUsers.value = [...new Set([...selectedUsers.value, ...pageUserIds])]
    }
}

function toggleUserSelection(userId) {
    const index = selectedUsers.value.indexOf(userId)
    if (index > -1) {
        selectedUsers.value.splice(index, 1)
    } else {
        selectedUsers.value.push(userId)
    }
}

function handleAddUser() {
    window.openModal({
        component: 'AddUserModal',
        size: 'lg',
        props: {
            events: events.value,
            onSuccess: (newUser) => {
                users.value.unshift(newUser)
                updateStats()
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'User added successfully'
                })
            }
        }
    })
}

function handleViewUser(user) {
    window.openModal({
        component: 'ViewUserModal',
        size: 'lg',
        props: { user }
    })
}

function handleEditUser(user) {
    window.openModal({
        component: 'EditUserModal',
        size: 'lg',
        props: {
            user,
            events: events.value,
            onSuccess: (updatedUser) => {
                const index = users.value.findIndex(u => u.id === user.id)
                if (index !== -1) {
                    users.value[index] = updatedUser
                }
                updateStats()
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'User updated successfully'
                })
            }
        }
    })
}

async function handleActivateUser(user) {
    try {
        const response = await authStore.apiCall(`/admin/users/${user.id}/activate`, {
            method: 'PUT'
        })

        if (response.ok) {
            user.isActive = true
            updateStats()
            window.showNotification({
                type: 'success',
                title: 'Success',
                message: 'User activated successfully'
            })
        } else {
            throw new Error('Failed to activate user')
        }
    } catch (error) {
        console.error('User activation error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to activate user'
        })
    }
}

async function handleDeactivateUser(user) {
    try {
        const response = await authStore.apiCall(`/admin/users/${user.id}/deactivate`, {
            method: 'PUT'
        })

        if (response.ok) {
            user.isActive = false
            updateStats()
            window.showNotification({
                type: 'success',
                title: 'Success',
                message: 'User deactivated successfully'
            })
        } else {
            throw new Error('Failed to deactivate user')
        }
    } catch (error) {
        console.error('User deactivation error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to deactivate user'
        })
    }
}

async function handleResetQR(user) {
    try {
        const response = await authStore.apiCall(`/admin/users/${user.id}/reset-qr`, {
            method: 'PUT'
        })

        if (response.ok) {
            window.showNotification({
                type: 'success',
                title: 'Success',
                message: 'QR code reset successfully'
            })
        } else {
            throw new Error('Failed to reset QR code')
        }
    } catch (error) {
        console.error('QR reset error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to reset QR code'
        })
    }
}

async function handleBulkActivate() {
    // Implementation for bulk activate
    window.showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: 'Bulk activation feature is under development'
    })
}

async function handleBulkDeactivate() {
    // Implementation for bulk deactivate
    window.showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: 'Bulk deactivation feature is under development'
    })
}

async function handleBulkDelete() {
    // Implementation for bulk delete
    window.showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: 'Bulk delete feature is under development'
    })
}

function handleExport() {
    // Implementation for export
    window.showNotification({
        type: 'info',
        title: 'Coming Soon',
        message: 'Export feature is under development'
    })
}

function getInitials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

function formatDate(date) {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

// Watch for filter changes and reset pagination
watch([selectedRole, selectedEvent, searchQuery], () => {
    currentPage.value = 1
    selectedUsers.value = []
})

// Watch for online users changes
watch(() => socketStore.onlineUsersList, () => {
    updateStats()
}, { deep: true })

// Initialize
onMounted(() => {
    fetchUsers()

    // Listen for user updates
    const unsubscribe = socketStore.subscribe('user:updated', (userData) => {
        const index = users.value.findIndex(u => u.id === userData.id)
        if (index !== -1) {
            users.value[index] = { ...users.value[index], ...userData }
            updateStats()
        }
    })

    import { onUnmounted } from 'vue'
    onUnmounted(unsubscribe)
})
</script>