<template>
    <div class="admin-documents p-6 space-y-6">
        <!-- Page Header -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                    <h1 class="text-2xl font-bold text-mun-gray-900">Document Management</h1>
                    <p class="text-mun-gray-600 mt-1">
                        Manage position papers, resolutions, and other committee documents
                    </p>
                </div>
                <div class="flex items-center space-x-3">
                    <button @click="refreshDocuments" :disabled="isLoading"
                        class="inline-flex items-center px-4 py-2 bg-mun-blue-600 text-white text-sm font-medium rounded-lg hover:bg-mun-blue-700 focus:ring-2 focus:ring-mun-blue-500 disabled:opacity-50 transition-colors">
                        <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
                        {{ isLoading ? 'Loading...' : 'Refresh' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Filters and Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Document Stats -->
            <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Total Documents</p>
                            <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ stats.total }}</p>
                        </div>
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <DocumentTextIcon class="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Pending Review</p>
                            <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ stats.pending }}</p>
                        </div>
                        <div class="p-2 bg-yellow-100 rounded-lg">
                            <ClockIcon class="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-600">Approved</p>
                            <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ stats.approved }}</p>
                        </div>
                        <div class="p-2 bg-green-100 rounded-lg">
                            <CheckCircleIcon class="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Filters -->
            <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-4">
                <h3 class="text-sm font-semibold text-mun-gray-900 mb-3">Quick Filters</h3>
                <div class="space-y-2">
                    <button @click="setFilter('all')"
                        :class="['w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            filters.status === 'all' ? 'bg-mun-blue-50 text-mun-blue-700' : 'text-mun-gray-600 hover:bg-gray-50']">
                        All Documents
                    </button>
                    <button @click="setFilter('pending')"
                        :class="['w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            filters.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'text-mun-gray-600 hover:bg-gray-50']">
                        Pending Review
                    </button>
                    <button @click="setFilter('approved')"
                        :class="['w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            filters.status === 'approved' ? 'bg-green-50 text-green-700' : 'text-mun-gray-600 hover:bg-gray-50']">
                        Approved
                    </button>
                    <button @click="setFilter('rejected')"
                        :class="['w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                            filters.status === 'rejected' ? 'bg-red-50 text-red-700' : 'text-mun-gray-600 hover:bg-gray-50']">
                        Rejected
                    </button>
                </div>
            </div>
        </div>

        <!-- Advanced Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Search</label>
                    <input v-model="filters.search" type="text" placeholder="Search documents..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Document Type</label>
                    <select v-model="filters.type" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                        <option value="">All Types</option>
                        <option v-for="type in documentTypes" :key="type.value" :value="type.value">
                            {{ type.label }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Committee</label>
                    <select v-model="filters.committee" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                        <option value="">All Committees</option>
                        <option v-for="committee in committees" :key="committee._id" :value="committee._id">
                            {{ committee.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Date Range</label>
                    <select v-model="filters.dateRange" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                        <option value="">All Time</option>
                        <option v-for="range in dateRangeOptions" :key="range.value" :value="range.value">
                            {{ range.label }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Documents Table -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Documents</h3>
                    <div class="flex items-center space-x-3">
                        <select v-model="pagination.pageSize" @change="loadDocuments"
                            class="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                            <option value="10">10 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue-600"></div>
            </div>

            <div v-else-if="documents.length === 0" class="text-center py-12">
                <DocumentTextIcon class="mx-auto h-12 w-12 text-mun-gray-300 mb-4" />
                <h3 class="text-sm font-medium text-mun-gray-900 mb-2">No documents found</h3>
                <p class="text-sm text-mun-gray-500">Try adjusting your filters or check back later.</p>
            </div>

            <div v-else>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Document
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Committee
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Author
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Uploaded
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="document in documents" :key="document._id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <DocumentTextIcon class="h-6 w-6 text-gray-500" />
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">{{ document.title || document.filename || 'Untitled' }}</div>
                                            <div class="text-sm text-gray-500">{{ getDocumentTypeLabel(document.type) }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {{ document.committeeId?.name || 'N/A' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>
                                        <div class="font-medium">{{ document.authorEmail || document.uploadedBy?.username || 'Unknown' }}</div>
                                        <div class="text-gray-500">{{ document.countryName || 'N/A' }}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="[
                                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                                        getStatusClasses(document.status)
                                    ]">
                                        {{ getStatusLabel(document.status) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ formatDate(document.createdAt || document.uploadedAt) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div class="flex items-center justify-end space-x-2">
                                        <button @click="viewDocument(document)"
                                            class="text-mun-blue-600 hover:text-mun-blue-900 transition-colors">
                                            <EyeIcon class="w-4 h-4" />
                                        </button>
                                        <button @click="downloadDocument(document)"
                                            class="text-gray-600 hover:text-gray-900 transition-colors">
                                            <ArrowDownTrayIcon class="w-4 h-4" />
                                        </button>
                                        <button v-if="document.status === 'pending'" @click="moderateDocument(document)"
                                            class="text-purple-600 hover:text-purple-900 transition-colors">
                                            <CheckCircleIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div class="flex items-center justify-between">
                        <div class="flex-1 flex justify-between sm:hidden">
                            <button @click="previousPage" :disabled="pagination.currentPage === 1"
                                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                Previous
                            </button>
                            <button @click="nextPage" :disabled="pagination.currentPage === pagination.totalPages"
                                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                Next
                            </button>
                        </div>
                        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p class="text-sm text-gray-700">
                                    Showing {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} to
                                    {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }} of
                                    {{ pagination.total }} results
                                </p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button @click="previousPage" :disabled="pagination.currentPage === 1"
                                    class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 rounded-l-md">
                                    Previous
                                </button>
                                <button @click="nextPage" :disabled="pagination.currentPage === pagination.totalPages"
                                    class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 rounded-r-md">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    DocumentTextIcon, 
    ArrowPathIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    EyeIcon, 
    ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

// Composables
const toast = useToast()

// State
const isLoading = ref(false)
const documents = ref([])
const committees = ref([])

// Filters
const filters = ref({
    search: '',
    status: 'all',
    type: '',
    committee: '',
    dateRange: ''
})

// Pagination
const pagination = ref({
    currentPage: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0
})

// Stats
const stats = ref({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
})

// Options
const documentTypes = [
    { label: 'Position Paper', value: 'position_paper' },
    { label: 'Public Document', value: 'public_document' },
    { label: 'Resolution', value: 'resolution' },
    { label: 'Amendment', value: 'amendment' }
]

const dateRangeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' }
]

// Methods
const loadDocuments = async () => {
    isLoading.value = true
    try {
        const params = {
            page: pagination.value.currentPage,
            limit: pagination.value.pageSize
        }

        // Add filters to params
        if (filters.value.search) {
            params.search = filters.value.search
        }
        if (filters.value.type) {
            params.type = filters.value.type
        }
        if (filters.value.committee) {
            params.committeeId = filters.value.committee
        }
        if (filters.value.status && filters.value.status !== 'all') {
            params.status = filters.value.status
        }
        if (filters.value.dateRange) {
            params.dateRange = filters.value.dateRange
        }

        const response = await apiMethods.get('/api/documents', { params })
        if (response?.data) {
            documents.value = response.data.documents || response.data || []
            pagination.value.total = response.data.total || 0
            pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize)

            // Calculate stats from documents
            calculateStats()
        }
    } catch (error) {
        toast.error('Failed to load documents')
        console.error('Failed to load documents:', error)
    } finally {
        isLoading.value = false
    }
}

const loadCommittees = async () => {
    try {
        const response = await apiMethods.get('/api/committees')
        if (response?.data) {
            committees.value = response.data.committees || response.data || []
        }
    } catch (error) {
        console.error('Failed to load committees:', error)
    }
}

const calculateStats = () => {
    stats.value = {
        total: documents.value.length,
        pending: documents.value.filter(d => d.status === 'pending').length,
        approved: documents.value.filter(d => d.status === 'approved').length,
        rejected: documents.value.filter(d => d.status === 'rejected').length
    }
}

const refreshDocuments = () => {
    loadDocuments()
}

const setFilter = (status) => {
    filters.value.status = status
    pagination.value.currentPage = 1
}

const previousPage = () => {
    if (pagination.value.currentPage > 1) {
        pagination.value.currentPage--
    }
}

const nextPage = () => {
    if (pagination.value.currentPage < pagination.value.totalPages) {
        pagination.value.currentPage++
    }
}

const viewDocument = (document) => {
    // Open document preview in new tab
    window.open(`/api/documents/${document._id}/preview`, '_blank')
}

const moderateDocument = (document) => {
    // Navigate to moderation page or open modal
    toast.log('Document moderation feature coming soon')
}

const downloadDocument = (document) => {
    // Download document
    window.open(`/api/documents/${document._id}/download`, '_blank')
}

// Utility functions
const getDocumentTypeLabel = (type) => {
    const typeObj = documentTypes.find(t => t.value === type)
    return typeObj?.label || type?.replace('_', ' ') || 'Document'
}

const getStatusLabel = (status) => {
    const labels = {
        'pending': 'Pending Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'draft': 'Draft'
    }
    return labels[status] || status
}

const getStatusClasses = (status) => {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'draft': 'bg-gray-100 text-gray-800'
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
}

// Watchers
watch(() => filters.value, () => {
    pagination.value.currentPage = 1
    loadDocuments()
}, { deep: true })

watch(() => pagination.value.currentPage, () => {
    loadDocuments()
})

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadDocuments(),
        loadCommittees()
    ])
})
</script>

<style scoped>
.admin-documents {
    @apply min-h-screen bg-mun-gray-50;
}

/* Table hover effects */
tbody tr:hover {
    @apply bg-gray-50;
}

/* Loading animations */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>