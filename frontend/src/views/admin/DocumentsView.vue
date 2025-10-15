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
                    <!-- Quick Filter using SleekSelect -->
                    <SleekSelect
                        v-model="filters.status"
                        :options="statusFilterOptions"
                        placeholder="Filter by status"
                        size="md"
                        container-class="min-w-[160px]"
                        @change="handleStatusFilterChange"
                    />
                    
                    <button @click="refreshDocuments" :disabled="isLoading"
                        class="inline-flex items-center px-4 py-2 bg-mun-blue-600 text-white text-sm font-medium rounded-lg hover:bg-mun-blue-700 focus:ring-2 focus:ring-mun-blue-500 disabled:opacity-50 transition-colors">
                        <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
                        {{ isLoading ? 'Loading...' : 'Refresh' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Document Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-blue-100">
                        <DocumentTextIcon class="w-6 h-6 text-blue-600" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Documents</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.total }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-yellow-100">
                        <ClockIcon class="w-6 h-6 text-yellow-600" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Pending Review</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pending }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-green-100">
                        <CheckCircleIcon class="w-6 h-6 text-green-600" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Approved</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.approved }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-red-100">
                        <XCircleIcon class="w-6 h-6 text-red-600" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Rejected</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.rejected }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Advanced Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Search</label>
                    <input v-model="filters.search" type="text" placeholder="Search documents..."
                        class="input-field w-full px-3 py-2" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Document Type</label>
                    <SleekSelect
                        v-model="filters.type"
                        :options="documentTypeOptions"
                        placeholder="All Types"
                        searchable
                        size="md"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Committee</label>
                    <SleekSelect
                        v-model="filters.committee"
                        :options="committeeOptions"
                        placeholder="All Committees"
                        searchable
                        size="md"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Date Range</label>
                    <SleekSelect
                        v-model="filters.dateRange"
                        :options="dateRangeOptions"
                        placeholder="All Time"
                        size="md"
                    />
                </div>
            </div>
        </div>

        <!-- Documents Table -->
        <div class="bg-white rounded-xl shadow-sm border border-mun-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-mun-gray-900">Documents</h3>
                    <div class="flex items-center space-x-3">
                        <SleekSelect
                            v-model="pagination.pageSize"
                            :options="pageSizeOptions"
                            size="sm"
                            container-class="min-w-[120px]"
                            @change="loadDocuments"
                        />
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
                                            <div class="text-sm font-medium text-gray-900">{{ document.title || document.originalName || document.filename || 'Untitled' }}</div>
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
                                        <button v-if="document.status === 'pending' || document.status === 'under_review'"
                                            @click="moderateDocument(document)"
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
    XCircleIcon,
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

// Options for SleekSelect components
const statusFilterOptions = [
    { label: 'All Documents', value: 'all' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
]

const documentTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Position Paper', value: 'position_paper' },
    { label: 'Public Document', value: 'public_document' },
    { label: 'Resolution Draft', value: 'resolution_draft' }
]

const dateRangeOptions = [
    { label: 'All Time', value: '' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' }
]

const pageSizeOptions = [
    { label: '10 per page', value: 10 },
    { label: '25 per page', value: 25 },
    { label: '50 per page', value: 50 }
]

// Computed options for committees
const committeeOptions = computed(() => {
    return [
        { label: 'All Committees', value: '' },
        ...committees.value.map(committee => ({
            label: committee.name,
            value: committee._id
        }))
    ]
})

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

        // Use the correct API method - now calls the new general documents endpoint
        const response = await apiMethods.documents.getAll(params)
        if (response?.data) {
            documents.value = response.data.documents || []

            // Use backend-provided stats if available, otherwise calculate
            if (response.data.stats) {
                stats.value = response.data.stats
            } else {
                calculateStats()
            }

            pagination.value.total = response.data.total || response.data.pagination?.total || documents.value.length
            pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize)
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
        const response = await apiMethods.committees.getAll()
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
        pending: documents.value.filter(d => d.status === 'pending' || d.status === 'uploaded' || d.status === 'under_review').length,
        approved: documents.value.filter(d => d.status === 'approved').length,
        rejected: documents.value.filter(d => d.status === 'rejected').length
    }
}

const refreshDocuments = () => {
    loadDocuments()
}

const handleStatusFilterChange = () => {
    pagination.value.currentPage = 1
    loadDocuments()
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
    // Open document preview using proper API method
    window.open(`/api/documents/${document._id}/preview`, '_blank')
}

const moderateDocument = (document) => {
    // Navigate to moderation page or open modal
    toast.log('Document moderation feature coming soon')
}

const downloadDocument = (document) => {
    // Download document using proper API method
    apiMethods.documents.download(document._id)
        .then(response => {
            // Create download link for blob response
            const url = window.URL.createObjectURL(new Blob([response]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', document.originalName || document.filename || `document_${document._id}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Document downloaded')
        })
        .catch(error => {
            console.error('Download failed:', error)
            toast.error('Failed to download document')
        })
}

// Utility functions
const getDocumentTypeLabel = (type) => {
    const typeOption = documentTypeOptions.find(option => option.value === type)
    return typeOption?.label || type?.replace('_', ' ') || 'Document'
}

const getStatusLabel = (status) => {
    const labels = {
        'pending': 'Pending Review',
        'uploaded': 'Pending Review',
        'under_review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'needs_revision': 'Needs Revision',
        'draft': 'Draft'
    }
    return labels[status] || status
}

const getStatusClasses = (status) => {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'uploaded': 'bg-yellow-100 text-yellow-800',
        'under_review': 'bg-blue-100 text-blue-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'needs_revision': 'bg-orange-100 text-orange-800',
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