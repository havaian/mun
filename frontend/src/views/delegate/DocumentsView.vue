<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">My Documents</h1>
                <p class="text-mun-gray-600">Upload and manage your committee documents</p>
            </div>
            <button @click="showUploadModal = true" class="btn-un-primary">
                <DocumentPlusIcon class="w-5 h-5 mr-2" />
                Upload Document
            </button>
        </div>

        <!-- Document Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Under Review</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pending }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <DocumentTextIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.total }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Document Requirements -->
        <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Document Requirements</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                        <div :class="[
                            'w-4 h-4 rounded-full',
                            hasPositionPaper ? 'bg-mun-green-500' : 'bg-mun-gray-300'
                        ]"></div>
                        <span class="text-mun-gray-900">Position Paper</span>
                        <span class="text-sm text-mun-red-500">Required</span>
                    </div>

                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 rounded-full bg-mun-gray-300"></div>
                        <span class="text-mun-gray-900">Opening Statement</span>
                        <span class="text-sm text-mun-gray-500">Optional</span>
                    </div>
                </div>

                <div class="text-sm text-mun-gray-600">
                    <p class="mb-2"><strong>Deadlines:</strong></p>
                    <p>• Position Papers: 24 hours before session</p>
                    <p>• Resolutions: During committee sessions</p>
                    <p>• Amendments: Before voting closes</p>
                </div>
            </div>
        </div>

        <!-- My Documents -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Documents</h2>
                    <div class="flex items-center space-x-3">
                        <SleekSelect v-model="filterType" :options="[
                            { label: 'All Types', value: '' },
                            { label: 'Position Papers', value: 'position-paper' },
                            { label: 'Resolutions', value: 'resolution' },
                            { label: 'Amendments', value: 'amendment' }
                        ]" containerClass="max-w-xs" placeholder="Filter by type" />
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else-if="filteredDocuments.length === 0" class="text-center py-12">
                <DocumentTextIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Documents Yet</h3>
                <p class="mt-2 text-mun-gray-600 mb-4">Upload your first document to get started</p>
                <button @click="showUploadModal = true" class="btn-un-primary">
                    Upload Document
                </button>
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
                                            'bg-orange-100 text-orange-700'
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
                                Uploaded {{ formatDate(document.uploadedAt) }} • {{ document.fileSize }}
                            </div>

                            <div v-if="document.description" class="text-sm text-mun-gray-700 mb-3">
                                {{ document.description }}
                            </div>

                            <!-- Review Feedback -->
                            <div v-if="document.reviewComments" class="p-3 bg-mun-gray-50 rounded-lg text-sm">
                                <p class="font-medium text-mun-gray-900 mb-1">Review Feedback:</p>
                                <p class="text-mun-gray-700">{{ document.reviewComments }}</p>
                            </div>

                            <!-- Version History -->
                            <div v-if="document.versions && document.versions.length > 1" class="mt-3">
                                <p class="text-sm font-medium text-mun-gray-900 mb-2">Version History:</p>
                                <div class="space-y-1">
                                    <div v-for="version in document.versions" :key="version.id"
                                        class="text-sm text-mun-gray-600 flex items-center space-x-2">
                                        <span>v{{ version.number }}</span>
                                        <span>•</span>
                                        <span>{{ formatDate(version.uploadedAt) }}</span>
                                        <span v-if="version.isCurrent" class="text-mun-blue">(Current)</span>
                                    </div>
                                </div>
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

                            <button v-if="document.status === 'rejected' || document.status === 'revision_requested'"
                                @click="uploadNewVersion(document)" class="btn-un-primary px-3 py-2">
                                <ArrowUpTrayIcon class="w-4 h-4 mr-1" />
                                New Version
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Modal -->
        <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
                <div class="px-6 py-4 border-b border-mun-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-mun-gray-900">Upload Document</h2>
                        <button @click="showUploadModal = false" class="text-mun-gray-400 hover:text-mun-gray-600">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <form @submit.prevent="uploadDocument" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Document Type</label>
                            <SleekSelect v-model="uploadForm.type" :options="[
                                { label: 'Position Paper', value: 'position-paper' },
                                { label: 'Resolution', value: 'resolution' },
                                { label: 'Amendment', value: 'amendment' },
                                { label: 'Other', value: 'other' }
                            ]" placeholder="Select document type" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Title</label>
                            <input v-model="uploadForm.title" type="text" required class="input-field"
                                placeholder="Document title">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Description
                                (Optional)</label>
                            <textarea v-model="uploadForm.description" rows="3" class="input-field"
                                placeholder="Brief description of the document"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">File</label>
                            <input ref="fileInput" type="file" @change="handleFileSelect" accept=".pdf,.doc,.docx"
                                required class="input-field">
                            <p class="text-sm text-mun-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX (Max: 10MB)</p>
                        </div>

                        <div class="flex items-center justify-end space-x-3 pt-4">
                            <button type="button" @click="showUploadModal = false" class="btn-un-secondary">
                                Cancel
                            </button>
                            <button type="submit" :disabled="isUploading" class="btn-un-primary">
                                <span v-if="isUploading">Uploading...</span>
                                <span v-else>Upload Document</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    DocumentPlusIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isUploading = ref(false)
const showUploadModal = ref(false)
const filterType = ref('')
const documents = ref([])
const fileInput = ref(null)

const stats = reactive({
    approved: 0,
    pending: 0,
    total: 0
})

const uploadForm = reactive({
    type: '',
    title: '',
    description: '',
    file: null
})

// Computed
const filteredDocuments = computed(() => {
    if (!filterType.value) return documents.value
    return documents.value.filter(doc => doc.type === filterType.value)
})

const hasPositionPaper = computed(() => {
    return documents.value.some(doc =>
        doc.type === 'position-paper' && doc.status === 'approved'
    )
})

// Methods
const loadDocuments = async () => {
    try {
        isLoading.value = true

        // Sample documents
        documents.value = [
            {
                id: 1,
                title: "Position Paper on Climate Change",
                type: "position-paper",
                status: "approved",
                uploadedAt: new Date(Date.now() - 86400000).toISOString(),
                fileSize: "245 KB",
                description: "Our country's position on global climate action",
                reviewComments: "Well-researched and clearly written. Approved for committee review.",
                versions: [
                    { id: 1, number: 1, uploadedAt: new Date(Date.now() - 86400000).toISOString(), isCurrent: true }
                ]
            },
            {
                id: 2,
                title: "Draft Resolution A/1",
                type: "resolution",
                status: "pending",
                uploadedAt: new Date(Date.now() - 3600000).toISOString(),
                fileSize: "512 KB",
                description: "Comprehensive framework for nuclear disarmament"
            },
            {
                id: 3,
                title: "Amendment to Resolution B/2",
                type: "amendment",
                status: "revision_requested",
                uploadedAt: new Date(Date.now() - 7200000).toISOString(),
                fileSize: "78 KB",
                reviewComments: "Please clarify the timeline in paragraph 3 and provide more specific implementation details.",
                versions: [
                    { id: 1, number: 1, uploadedAt: new Date(Date.now() - 7200000).toISOString(), isCurrent: true }
                ]
            }
        ]

        // Update stats
        stats.approved = documents.value.filter(d => d.status === 'approved').length
        stats.pending = documents.value.filter(d => d.status === 'pending').length
        stats.total = documents.value.length

    } catch (error) {
        toast.error('Load documents error:', error)
        toast.error('Failed to load documents')
    } finally {
        isLoading.value = false
    }
}

const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File size must be less than 10MB')
            fileInput.value.value = ''
            return
        }
        uploadForm.file = file
    }
}

const uploadDocument = async () => {
    try {
        isUploading.value = true

        // TODO: Actual file upload logic
        const newDocument = {
            id: Date.now(),
            title: uploadForm.title,
            type: uploadForm.type,
            status: 'pending',
            uploadedAt: new Date().toISOString(),
            fileSize: uploadForm.file ? Math.round(uploadForm.file.size / 1024) + ' KB' : '0 KB',
            description: uploadForm.description
        }

        documents.value.unshift(newDocument)
        stats.pending++
        stats.total++

        // Reset form
        Object.keys(uploadForm).forEach(key => {
            uploadForm[key] = key === 'file' ? null : ''
        })
        fileInput.value.value = ''
        showUploadModal.value = false

        toast.success('Document uploaded successfully')

    } catch (error) {
        toast.error('Upload error:', error)
        toast.error('Failed to upload document')
    } finally {
        isUploading.value = false
    }
}

const viewDocument = (document) => {
    toast.log(`Viewing ${document.title}`)
    // TODO: Open document viewer
}

const downloadDocument = (document) => {
    toast.success(`Downloading ${document.title}`)
    // TODO: Download document
}

const uploadNewVersion = (document) => {
    toast.log(`Upload new version for ${document.title}`)
    // TODO: Open new version upload
}

const formatDocumentType = (type) => {
    const typeMap = {
        'position-paper': 'Position Paper',
        'resolution': 'Resolution',
        'amendment': 'Amendment',
        'other': 'Other'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'pending': 'Under Review',
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
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffHours < 24) {
        return `${diffHours}h ago`
    } else if (diffDays < 7) {
        return `${diffDays}d ago`
    } else {
        return date.toLocaleDateString()
    }
}

// Lifecycle
onMounted(() => {
    loadDocuments()
})
</script>