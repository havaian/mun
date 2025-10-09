<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Document Review</h1>
                <p class="text-mun-gray-600">Review and manage submitted documents</p>
            </div>
            <button @click="uploadPublicDocument" class="btn-un-primary">
                <DocumentPlusIcon class="w-5 h-5 mr-2" />
                Upload Public Document
            </button>
        </div>

        <!-- Document Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Pending Review</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pending }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Approved</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.approved }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <XCircleIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Rejected</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.rejected }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-un-blue/10">
                        <DocumentTextIcon class="w-6 h-6 text-un-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Documents</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.total }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="mun-card p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div class="flex items-center space-x-4">
                    <select v-model="filters.type" class="input-field max-w-xs">
                        <option value="">All Document Types</option>
                        <option value="position-paper">Position Papers</option>
                        <option value="resolution">Resolutions</option>
                        <option value="amendment">Amendments</option>
                        <option value="public">Public Documents</option>
                    </select>

                    <select v-model="filters.status" class="input-field max-w-xs">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="revision_requested">Revision Requested</option>
                    </select>
                </div>

                <div class="flex items-center space-x-3">
                    <input v-model="searchQuery" type="text" placeholder="Search documents..."
                        class="input-field max-w-xs">
                    <button @click="refreshDocuments" :disabled="isLoading" class="btn-un-secondary">
                        <ArrowPathIcon class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Documents List -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <h2 class="text-lg font-semibold text-mun-gray-900">Documents</h2>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else-if="filteredDocuments.length === 0" class="text-center py-12">
                <DocumentTextIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Documents Found</h3>
                <p class="mt-2 text-mun-gray-600">No documents match your current filters</p>
            </div>

            <div v-else class="divide-y divide-mun-gray-200">
                <div v-for="document in filteredDocuments" :key="document.id"
                    class="p-6 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 class="text-lg font-medium text-mun-gray-900">{{ document.title }}</h3>
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    document.type === 'position-paper' ? 'bg-blue-100 text-blue-700' :
                                        document.type === 'resolution' ? 'bg-purple-100 text-purple-700' :
                                            document.type === 'amendment' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-700'
                                ]">
                                    {{ formatDocumentType(document.type) }}
                                </span>
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    document.status === 'pending' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                        document.status === 'approved' ? 'bg-mun-green-100 text-mun-green-700' :
                                            document.status === 'rejected' ? 'bg-mun-red-100 text-mun-red-700' :
                                                'bg-mun-gray-100 text-mun-gray-700'
                                ]">
                                    {{ formatStatus(document.status) }}
                                </span>
                            </div>

                            <div class="text-sm text-mun-gray-600 mb-3">
                                <span class="font-medium">{{ document.country }}</span> •
                                Submitted {{ formatDate(document.submittedAt) }} •
                                {{ document.fileSize }}
                            </div>

                            <div v-if="document.description" class="text-sm text-mun-gray-700 mb-3">
                                {{ document.description }}
                            </div>

                            <div v-if="document.reviewComments" class="p-3 bg-mun-gray-50 rounded-lg text-sm">
                                <p class="font-medium text-mun-gray-900 mb-1">Review Comments:</p>
                                <p class="text-mun-gray-700">{{ document.reviewComments }}</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2 ml-4">
                            <button @click="viewDocument(document)" class="btn-un-secondary px-3 py-2">
                                <EyeIcon class="w-4 h-4 mr-1" />
                                View
                            </button>

                            <button @click="downloadDocument(document)" class="btn-un-secondary px-3 py-2">
                                <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                                Download
                            </button>

                            <button v-if="document.status === 'pending'" @click="reviewDocument(document)"
                                class="btn-un-primary px-3 py-2">
                                <DocumentMagnifyingGlassIcon class="w-4 h-4 mr-1" />
                                Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review Modal would go here -->
        <!-- DocumentReviewModal -->
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    DocumentTextIcon,
    DocumentPlusIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    DocumentMagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const searchQuery = ref('')

const filters = reactive({
    type: '',
    status: ''
})

const stats = reactive({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
})

const documents = ref([])

// Computed
const filteredDocuments = computed(() => {
    let filtered = documents.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.country.toLowerCase().includes(query) ||
            doc.description?.toLowerCase().includes(query)
        )
    }

    if (filters.type) {
        filtered = filtered.filter(doc => doc.type === filters.type)
    }

    if (filters.status) {
        filtered = filtered.filter(doc => doc.status === filters.status)
    }

    return filtered
})

// Methods
const loadDocuments = async () => {
    try {
        isLoading.value = true

        // Sample data
        documents.value = [
            {
                id: 1,
                title: "Position Paper on Climate Change",
                type: "position-paper",
                country: "United States",
                status: "pending",
                submittedAt: new Date(Date.now() - 3600000).toISOString(),
                description: "Comprehensive position on global climate action",
                fileSize: "245 KB"
            },
            {
                id: 2,
                title: "Draft Resolution A/1: Nuclear Disarmament",
                type: "resolution",
                country: "France",
                status: "approved",
                submittedAt: new Date(Date.now() - 7200000).toISOString(),
                description: "Proposal for nuclear disarmament framework",
                fileSize: "512 KB",
                reviewComments: "Approved with minor formatting suggestions"
            },
            {
                id: 3,
                title: "Amendment to Resolution A/1",
                type: "amendment",
                country: "Germany",
                status: "rejected",
                submittedAt: new Date(Date.now() - 10800000).toISOString(),
                description: "Proposed changes to paragraph 3",
                fileSize: "78 KB",
                reviewComments: "Amendment scope too broad. Please focus on specific clauses."
            }
        ]

        // Update stats
        stats.pending = documents.value.filter(d => d.status === 'pending').length
        stats.approved = documents.value.filter(d => d.status === 'approved').length
        stats.rejected = documents.value.filter(d => d.status === 'rejected').length
        stats.total = documents.value.length

    } catch (error) {
        console.error('Load documents error:', error)
        toast.error('Failed to load documents')
    } finally {
        isLoading.value = false
    }
}

const refreshDocuments = async () => {
    await loadDocuments()
    toast.success('Documents refreshed')
}

const viewDocument = (document) => {
    toast.info(`Viewing ${document.title}`)
    // TODO: Open document viewer
}

const downloadDocument = (document) => {
    toast.success(`Downloading ${document.title}`)
    // TODO: Download document
}

const reviewDocument = (document) => {
    toast.info(`Opening review for ${document.title}`)
    // TODO: Open review modal
}

const uploadPublicDocument = () => {
    toast.info('Public document upload modal would open here')
    // TODO: Open upload modal
}

const formatDocumentType = (type) => {
    const typeMap = {
        'position-paper': 'Position Paper',
        'resolution': 'Resolution',
        'amendment': 'Amendment',
        'public': 'Public Document'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'revision_requested': 'Revision Required'
    }
    return statusMap[status] || status
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
        return `${diffMins}m ago`
    } else if (diffHours < 24) {
        return `${diffHours}h ago`
    } else if (diffDays < 7) {
        return `${diffDays}d ago`
    } else {
        return date.toLocaleDateString()
    }
}

// Watchers
watch([() => filters.type, () => filters.status], () => {
    // Filters changed, could refetch if needed
})

// Lifecycle
onMounted(() => {
    loadDocuments()
})
</script>