<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div
            class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 flex items-center justify-between">
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
                <div class="flex h-full items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <UsersIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium bg-mun-blue/10">Total Users</p>
                        <p class="text-2xl font-bold text-mun-blue">{{ stats.total || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex h-full items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-blue" />
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
                        <p class="text-sm font-medium text-mun-gray-600">Pending</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pending || 0 }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex h-full items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <XCircleIcon class="w-6 h-6 text-mun-blue" />
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
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <!-- Search -->
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Search Users
                    </label>
                    <div class="relative">
                        <input v-model="searchQuery" type="text" placeholder="Search by name, email, or country..."
                            class="input-field pl-10" @input="debouncedSearch" />
                        <MagnifyingGlassIcon
                            class="w-5 h-5 text-mun-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <!-- Role Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Role
                    </label>
                    <SleekSelect v-model="filters.role" @change="filterUsers" :options="[
                        { label: 'All Roles', value: '' },
                        { label: 'Admin', value: 'admin' },
                        { label: 'Presidium', value: 'presidium' },
                        { label: 'Delegate', value: 'delegate' }
                    ]" container-class="w-full" placeholder="Filter by role" />
                </div>

                <!-- Status Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Status
                    </label>
                    <SleekSelect v-model="filters.status" @change="filterUsers" :options="[
                        { label: 'All Statuses', value: '' },
                        { label: 'Active', value: 'active' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Inactive', value: 'inactive' }
                    ]" container-class="w-full" placeholder="Filter by status" />
                </div>

                <!-- Committee Filter -->
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Committee
                    </label>
                    <SleekSelect v-model="filters.committee" @change="filterUsers" :options="[
                        { label: 'All Committees', value: '' },
                        ...committees.map(committee => ({
                            label: committee.name,
                            value: committee.id
                        }))
                    ]" container-class="w-full" placeholder="Filter by committee" />
                </div>
            </div>
        </div>

        <!-- View Toggle and Bulk Actions -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <!-- Table View Info -->
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">Table View</span>
                </div>

                <!-- Bulk Actions -->
                <div v-if="selectedUsers.length > 0" class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">
                        {{ selectedUsers.length }} selected
                    </span>

                    <button @click="bulkAction('activate')" :disabled="selectedUsers.length === 0"
                        class="btn-un-secondary px-3 py-2">
                        <CheckIcon class="w-4 h-4 mr-2" />
                        Activate
                    </button>

                    <button @click="exportUsers" class="btn-un-secondary px-3 py-2">
                        <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                        Export
                    </button>

                    <button @click="selectedUsers = []" class="btn-un-secondary px-3 py-2">
                        Clear
                    </button>
                </div>

                <!-- Filter Status -->
                <div v-else-if="hasActiveFilters" class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">
                        {{ filteredUsers.length }} of {{ users.length }} users
                    </span>
                    <button @click="clearFilters" class="btn-un-secondary px-3 py-2">
                        Clear Filters
                    </button>
                </div>
            </div>

            <!-- Sort Options -->
            <div class="flex items-center space-x-2">
                <span class="text-sm text-mun-gray-600">Sort by:</span>
                <SleekSelect v-model="sortBy" @change="sortUsers" :options="[
                    { label: 'Newest First', value: 'created_desc' },
                    { label: 'Oldest First', value: 'created_asc' },
                    { label: 'Name A-Z', value: 'name_asc' },
                    { label: 'Name Z-A', value: 'name_desc' },
                    { label: 'Last Login', value: 'lastLogin_desc' }
                ]" container-class="min-w-[150px]" placeholder="Sort by" />
            </div>
        </div>

        <!-- Users Table -->
        <div>
            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
            </div>

            <div v-else-if="filteredUsers.length === 0" class="mun-card overflow-hidden text-center py-12">
                <UsersIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-mun-gray-900 mb-2">
                    {{ hasActiveFilters ? 'No users match your filters' : 'No users found' }}
                </h3>
                <p class="text-mun-gray-600 mb-6">
                    {{ hasActiveFilters
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Add your first user to get started.'
                    }}
                </p>
                <button v-if="!hasActiveFilters" @click="showCreateModal = true" class="btn-un-primary">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Add First User
                </button>
                <button v-else @click="clearFilters" class="btn-un-secondary">
                    Clear All Filters
                </button>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-mun-gray-200">
                    <thead class="bg-mun-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left">
                                <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected"
                                    class="input-field">
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
                                <input type="checkbox" v-model="selectedUsers" :value="user.id" class="input-field">
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10">
                                        <div :class="[
                                            'h-10 w-10 rounded-full flex items-center justify-center text-white font-medium',
                                            user.role === 'admin' ? 'bg-mun-red-500' :
                                                user.role === 'presidium' ? 'bg-mun-green-500' :
                                                    'bg-mun-blue'
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
                                                'bg-mun-blue/10 text-mun-blue'
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
                                        class="text-mun-blue hover:text-mun-blue-600 transition-colors">
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

const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' ||
        Object.values(filters.value).some(value => value !== '')
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
            apiMethods.users.getAll(),
            apiMethods.committees.getAll()
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
        toast.error('Load users error:', error)
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

const clearFilters = () => {
    searchQuery.value = ''
    Object.keys(filters.value).forEach(key => {
        filters.value[key] = ''
    })
    selectedUsers.value = []
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

        const response = await apiMethods.users.bulkAction(action, selectedUsers.value)

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
        toast.error('Bulk action error:', error)
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
        const response = await apiMethods.users.updateStatus(user.id, !user.isActive)

        if (response?.success) {
            user.isActive = !user.isActive
            toast.success(`User ${user.isActive ? 'activated' : 'deactivated'}`)
        }
    } catch (error) {
        toast.error('Toggle user status error:', error)
        toast.error('Failed to update user status')
    }
}

const resetUserQR = async (user) => {
    try {
        const response = await apiMethods.users.resetQR(user.id)
        if (response?.success) {
            toast.success('QR code reset successfully')
        }
    } catch (error) {
        toast.error('Reset QR error:', error)
        toast.error('Failed to reset QR code')
    }
}

const deleteUser = (user) => {
    selectedUser.value = user
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    try {
        const response = await apiMethods.users.delete(selectedUser.value.id)
        if (response?.success) {
            users.value = users.value.filter(u => u.id !== selectedUser.value.id)
            toast.success('User deleted successfully')
        }

        showDeleteConfirm.value = false
        selectedUser.value = null
    } catch (error) {
        toast.error('Delete user error:', error)
        toast.error('Failed to delete user')
    }
}

const exportUsers = async () => {
    try {
        const response = await apiMethods.exports.exportUsers()

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
        toast.error('Export users error:', error)
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