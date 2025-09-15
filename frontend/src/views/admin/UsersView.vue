<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">User Management</h1>
                <p class="text-mun-gray-600">Manage system users and their permissions</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="refreshUsers" :disabled="isLoading" class="btn-un-secondary">
                    <ArrowPathIcon class="w-5 h-5 mr-2" />
                    Refresh
                </button>
                <button @click="exportUsers" class="btn-un-secondary">
                    <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
                    Export
                </button>
                <button @click="showCreateModal = true" class="btn-un-primary">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    Add User
                </button>
            </div>
        </div>

        <!-- User Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-un-blue/10">
                        <UsersIcon class="w-6 h-6 text-un-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Users</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.total || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-green-500" />
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
                        <p class="text-sm font-medium text-mun-gray-600">Pending</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pending || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <XCircleIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Inactive</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.inactive || 0 }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters and Search -->
        <div class="mun-card p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div class="flex items-center space-x-4">
                    <select v-model="filters.role" @change="filterUsers" class="input-field max-w-xs">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="presidium">Presidium</option>
                        <option value="delegate">Delegate</option>
                    </select>

                    <select v-model="filters.status" @change="filterUsers" class="input-field max-w-xs">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select v-model="filters.committee" @change="filterUsers" class="input-field max-w-xs">
                        <option value="">All Committees</option>
                        <option v-for="committee in committees" :key="committee.id" :value="committee.id">
                            {{ committee.name }}
                        </option>
                    </select>
                </div>

                <div class="flex items-center space-x-3">
                    <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Search users..."
                        class="input-field max-w-xs">
                    <select v-model="sortBy" @change="sortUsers" class="input-field max-w-xs">
                        <option value="created_desc">Newest First</option>
                        <option value="created_asc">Oldest First</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="name_desc">Name Z-A</option>
                        <option value="lastLogin_desc">Last Login</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Users</h2>
                    <div class="flex items-center space-x-3">
                        <span class="text-sm text-mun-gray-500">
                            {{ filteredUsers.length }} of {{ users.length }} users
                        </span>
                        <button @click="bulkAction('activate')" :disabled="selectedUsers.length === 0"
                            class="btn-un-secondary px-3 py-2 disabled:opacity-50">
                            Bulk Activate
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-un-blue"></div>
            </div>

            <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
                <UsersIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">
                    {{searchQuery || Object.values(filters).some(v => v) ? 'No users found' : 'No users yet'}}
                </h3>
                <p class="mt-2 text-mun-gray-600 mb-4">
                    {{searchQuery || Object.values(filters).some(v => v) ? 'Try adjusting your search or filters' :
                        'Add your first user to get started'}}
                </p>
                <button v-if="!searchQuery && !Object.values(filters).some(v => v)" @click="showCreateModal = true"
                    class="btn-un-primary">
                    Add First User
                </button>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-mun-gray-200">
                    <thead class="bg-mun-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left">
                                <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected"
                                    class="rounded border-mun-gray-300 text-un-blue focus:ring-un-blue">
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Committee
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th
                                class="px-6 py-3 text-right text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-mun-gray-200">
                        <tr v-for="user in paginatedUsers" :key="user.id"
                            class="hover:bg-mun-gray-50 transition-colors">
                            <td class="px-6 py-4">
                                <input type="checkbox" v-model="selectedUsers" :value="user.id"
                                    class="rounded border-mun-gray-300 text-un-blue focus:ring-un-blue">
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10">
                                        <div :class="[
                                            'h-10 w-10 rounded-full flex items-center justify-center text-white font-medium',
                                            user.role === 'admin' ? 'bg-mun-red-500' :
                                                user.role === 'presidium' ? 'bg-mun-green-500' :
                                                    'bg-un-blue'
                                        ]">
                                            {{ getUserInitials(user) }}
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-mun-gray-900">
                                            {{ user.displayName || user.countryName || user.username || 'Unnamed User'
                                            }}
                                        </div>
                                        <div class="text-sm text-mun-gray-500">
                                            {{ user.email || 'No email' }}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <span :class="[
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        user.role === 'admin' ? 'bg-mun-red-100 text-mun-red-700' :
                                            user.role === 'presidium' ? 'bg-mun-green-100 text-mun-green-700' :
                                                'bg-un-blue/10 text-un-blue'
                                    ]">
                                        {{ formatRole(user.role) }}
                                    </span>
                                    <div v-if="user.presidiumRole" class="text-xs text-mun-gray-500 mt-1">
                                        {{ formatPresidiumRole(user.presidiumRole) }}
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                                {{ getCommitteeName(user.committeeId) || 'None' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    user.isActive ? 'bg-mun-green-100 text-mun-green-700' :
                                        user.email ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                            'bg-mun-red-100 text-mun-red-700'
                                ]">
                                    {{ formatUserStatus(user) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                                {{ user.lastLogin ? formatRelativeDate(user.lastLogin) : 'Never' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex items-center justify-end space-x-2">
                                    <button @click="viewUser(user)"
                                        class="text-un-blue hover:text-un-blue-600 transition-colors">
                                        <EyeIcon class="w-4 h-4" />
                                    </button>
                                    <button @click="editUser(user)"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                        <PencilIcon class="w-4 h-4" />
                                    </button>
                                    <button @click="toggleUserStatus(user)" :class="[
                                        'transition-colors',
                                        user.isActive ? 'text-mun-red-400 hover:text-mun-red-600' : 'text-mun-green-400 hover:text-mun-green-600'
                                    ]">
                                        <component :is="user.isActive ? XMarkIcon : CheckIcon" class="w-4 h-4" />
                                    </button>
                                    <button @click="resetUserQR(user)" v-if="user.role !== 'admin'"
                                        class="text-mun-yellow-400 hover:text-mun-yellow-600 transition-colors">
                                        <QrCodeIcon class="w-4 h-4" />
                                    </button>
                                    <button @click="deleteUser(user)"
                                        class="text-mun-red-400 hover:text-mun-red-600 transition-colors">
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
        <CreateUserModal v-model="showCreateModal" @created="handleUserCreated" />

        <EditUserModal v-model="showEditModal" :user="selectedUser" @updated="handleUserUpdated" />

        <UserDetailsModal v-model="showDetailsModal" :user="selectedUser" @edit="editUserFromDetails"
            @delete="deleteUser" />

        <ConfirmDeleteModal v-model="showDeleteConfirm"
            :title="`Delete User: ${selectedUser?.displayName || selectedUser?.countryName || selectedUser?.username}`"
            :message="deleteConfirmMessage" @confirmed="confirmDelete" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
    DocumentArrowDownIcon,
    UsersIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    EyeIcon,
    PencilIcon,
    XMarkIcon,
    CheckIcon,
    QrCodeIcon,
    TrashIcon
} from '@heroicons/vue/24/outline'

// Components
import CreateUserModal from '@/components/admin/CreateUserModal.vue'
import EditUserModal from '@/components/admin/EditUserModal.vue'
import UserDetailsModal from '@/components/admin/UserDetailsModal.vue'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal.vue'
import Pagination from '@/components/ui/Pagination.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const searchQuery = ref('')
const sortBy = ref('created_desc')
const selectedUsers = ref([])

// Users data
const users = ref([])
const committees = ref([])
const selectedUser = ref(null)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteConfirm = ref(false)

// Filters
const filters = ref({
    role: '',
    status: '',
    committee: ''
})

// Stats - calculated from users data
const stats = computed(() => {
    const total = users.value.length
    const active = users.value.filter(u => u.isActive).length
    const pending = users.value.filter(u => !u.isActive && !u.email).length
    const inactive = users.value.filter(u => !u.isActive && u.email).length

    return { total, active, pending, inactive }
})

// Pagination
const pagination = ref({
    currentPage: 1,
    pageSize: 10
})

// Computed
const filteredUsers = computed(() => {
    let filtered = users.value

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(user =>
            (user.displayName || '').toLowerCase().includes(query) ||
            (user.countryName || '').toLowerCase().includes(query) ||
            (user.username || '').toLowerCase().includes(query) ||
            (user.email || '').toLowerCase().includes(query)
        )
    }

    // Role filter
    if (filters.value.role) {
        filtered = filtered.filter(user => user.role === filters.value.role)
    }

    // Status filter
    if (filters.value.status) {
        filtered = filtered.filter(user => {
            const status = formatUserStatus(user).toLowerCase()
            return status === filters.value.status
        })
    }

    // Committee filter
    if (filters.value.committee) {
        filtered = filtered.filter(user => user.committeeId === filters.value.committee)
    }

    // Sort
    return filtered.sort((a, b) => {
        switch (sortBy.value) {
            case 'created_asc':
                return new Date(a.createdAt) - new Date(b.createdAt)
            case 'created_desc':
                return new Date(b.createdAt) - new Date(a.createdAt)
            case 'name_asc':
                const nameA = a.displayName || a.countryName || a.username || ''
                const nameB = b.displayName || b.countryName || b.username || ''
                return nameA.localeCompare(nameB)
            case 'name_desc':
                const nameA2 = a.displayName || a.countryName || a.username || ''
                const nameB2 = b.displayName || b.countryName || b.username || ''
                return nameB2.localeCompare(nameA2)
            case 'lastLogin_desc':
                const loginA = a.lastLogin ? new Date(a.lastLogin) : new Date(0)
                const loginB = b.lastLogin ? new Date(b.lastLogin) : new Date(0)
                return loginB - loginA
            default:
                return 0
        }
    })
})

const totalPages = computed(() => {
    return Math.ceil(filteredUsers.value.length / pagination.value.pageSize)
})

const paginatedUsers = computed(() => {
    const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return filteredUsers.value.slice(start, end)
})

const isAllSelected = computed(() => {
    return paginatedUsers.value.length > 0 &&
        paginatedUsers.value.every(user => selectedUsers.value.includes(user.id))
})

const deleteConfirmMessage = computed(() => {
    const userName = selectedUser.value?.displayName || selectedUser.value?.countryName || selectedUser.value?.username || 'this user'
    return `Are you sure you want to delete ${userName}? This action cannot be undone and will remove all associated data.`
})

// Methods
const loadUsers = async () => {
    try {
        isLoading.value = true

        const [usersResponse, committeesResponse] = await Promise.all([
            apiMethods.get('/api/admin/users'),
            apiMethods.get('/api/admin/committees')
        ])

        if (usersResponse?.data) {
            users.value = usersResponse.data
        } else {
            users.value = []
        }

        if (committeesResponse?.data) {
            committees.value = committeesResponse.data
        } else {
            committees.value = []
        }

    } catch (error) {
        console.error('Load users error:', error)
        toast.error('Failed to load users')
        users.value = []
        committees.value = []
    } finally {
        isLoading.value = false
    }
}

const refreshUsers = async () => {
    await loadUsers()
    toast.success('Users refreshed')
}

const filterUsers = () => {
    pagination.value.currentPage = 1
}

const sortUsers = () => {
    pagination.value.currentPage = 1
}

const debouncedSearch = debounce(() => {
    pagination.value.currentPage = 1
}, 300)

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedUsers.value = selectedUsers.value.filter(id =>
            !paginatedUsers.value.some(user => user.id === id)
        )
    } else {
        const newSelections = paginatedUsers.value.map(user => user.id)
        selectedUsers.value = [...new Set([...selectedUsers.value, ...newSelections])]
    }
}

const bulkAction = async (action) => {
    try {
        if (selectedUsers.value.length === 0) return

        const response = await apiMethods.post('/api/admin/users/bulk-action', {
            action,
            userIds: selectedUsers.value
        })

        if (response?.success) {
            if (action === 'activate') {
                users.value.forEach(user => {
                    if (selectedUsers.value.includes(user.id)) {
                        user.isActive = true
                    }
                })
                toast.success(`${selectedUsers.value.length} users activated`)
            }
        }

        selectedUsers.value = []

    } catch (error) {
        console.error('Bulk action error:', error)
        toast.error('Failed to perform bulk action')
    }
}

const viewUser = (user) => {
    selectedUser.value = user
    showDetailsModal.value = true
}

const editUser = (user) => {
    selectedUser.value = user
    showEditModal.value = true
}

const editUserFromDetails = (user) => {
    showDetailsModal.value = false
    setTimeout(() => {
        selectedUser.value = user
        showEditModal.value = true
    }, 100)
}

const toggleUserStatus = async (user) => {
    try {
        const response = await apiMethods.put(`/api/admin/users/${user.id}/status`, {
            isActive: !user.isActive
        })

        if (response?.success) {
            user.isActive = !user.isActive
            toast.success(`User ${user.isActive ? 'activated' : 'deactivated'}`)
        }
    } catch (error) {
        console.error('Toggle user status error:', error)
        toast.error('Failed to update user status')
    }
}

const resetUserQR = async (user) => {
    try {
        const response = await apiMethods.post(`/api/admin/users/${user.id}/reset-qr`)
        if (response?.success) {
            toast.success('QR code reset successfully')
        }
    } catch (error) {
        console.error('Reset QR error:', error)
        toast.error('Failed to reset QR code')
    }
}

const deleteUser = (user) => {
    selectedUser.value = user
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    try {
        const response = await apiMethods.delete(`/api/admin/users/${selectedUser.value.id}`)
        if (response?.success) {
            users.value = users.value.filter(u => u.id !== selectedUser.value.id)
            toast.success('User deleted successfully')
        }

        showDeleteConfirm.value = false
        selectedUser.value = null
    } catch (error) {
        console.error('Delete user error:', error)
        toast.error('Failed to delete user')
    }
}

const exportUsers = async () => {
    try {
        const response = await apiMethods.get('/api/admin/users/export', {
            responseType: 'blob'
        })

        if (response) {
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Users exported successfully')
        }
    } catch (error) {
        console.error('Export users error:', error)
        toast.error('Failed to export users')
    }
}

const handleUserCreated = (user) => {
    users.value.unshift(user)
    toast.success('User created successfully')
}

const handleUserUpdated = (user) => {
    const index = users.value.findIndex(u => u.id === user.id)
    if (index !== -1) {
        users.value[index] = user
        toast.success('User updated successfully')
    }
}

const handlePageChange = (page) => {
    pagination.value.currentPage = page
}

// Utility functions
const getUserInitials = (user) => {
    if (user.displayName) {
        return user.displayName.substring(0, 2).toUpperCase()
    }
    if (user.countryName) {
        return user.countryName.substring(0, 2).toUpperCase()
    }
    if (user.username) {
        return user.username.substring(0, 2).toUpperCase()
    }
    return 'U'
}

const formatRole = (role) => {
    const roleMap = {
        'admin': 'Admin',
        'presidium': 'Presidium',
        'delegate': 'Delegate'
    }
    return roleMap[role] || role
}

const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role
}

const formatUserStatus = (user) => {
    if (user.isActive) return 'active'
    if (user.email) return 'inactive'
    return 'pending'
}

const getCommitteeName = (committeeId) => {
    const committee = committees.value.find(c => c.id === committeeId)
    return committee?.name
}

const formatRelativeDate = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (60 * 1000))
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
}

// Lifecycle
onMounted(() => {
    loadUsers()
})
</script>