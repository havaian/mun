<!-- frontend/src/components/delegate/DocumentUpload.vue -->
<template>
    <div class="document-upload bg-white border border-mun-gray-200 rounded-lg p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
                <div class="p-3 bg-mun-blue/10 rounded-xl">
                    <DocumentArrowUpIcon class="w-6 h-6 text-mun-blue" />
                </div>
                <div>
                    <h3 class="text-lg font-medium text-mun-gray-900">Document Upload</h3>
                    <p class="text-sm text-mun-gray-600">Upload position papers and other documents</p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <button @click="showGuidelines = !showGuidelines"
                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors" title="Upload guidelines">
                    <InformationCircleIcon class="w-5 h-5 text-mun-gray-600" />
                </button>
            </div>
        </div>

        <!-- Upload Guidelines -->
        <div v-if="showGuidelines" class="guidelines mb-6 p-4 bg-mun-blue-50 border border-mun-blue-200 rounded-lg">
            <h4 class="text-sm font-medium text-mun-blue-900 mb-2">Upload Guidelines</h4>
            <ul class="text-sm text-mun-blue-800 space-y-1">
                <li>• Supported formats: PDF, DOC, DOCX</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Position papers are required for participation</li>
                <li>• Documents will be reviewed by the presidium</li>
                <li>• Use clear, descriptive titles for your documents</li>
            </ul>
        </div>

        <!-- Document Type Selection -->
        <div class="document-type-selection mb-6">
            <label class="block text-sm font-medium text-mun-gray-700 mb-3">
                Document Type <span class="text-red-500">*</span>
            </label>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="type in documentTypes" :key="type.value" @click="selectedType = type.value" :class="[
                    'type-card p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
                    selectedType === type.value
                        ? 'border-mun-blue bg-mun-blue/5'
                        : 'border-mun-gray-200 hover:border-mun-blue/30'
                ]">
                    <div class="flex items-center space-x-3">
                        <div :class="[
                            'p-2 rounded-lg',
                            selectedType === type.value ? type.activeBg : type.inactiveBg
                        ]">
                            <component :is="type.icon" :class="[
                                'w-5 h-5',
                                selectedType === type.value ? type.activeColor : type.inactiveColor
                            ]" />
                        </div>
                        <div>
                            <h4 :class="[
                                'text-sm font-medium',
                                selectedType === type.value ? 'text-mun-blue' : 'text-mun-gray-900'
                            ]">
                                {{ type.name }}
                            </h4>
                            <p class="text-xs text-mun-gray-600">{{ type.description }}</p>
                            <p v-if="type.required" class="text-xs text-red-600 mt-1">Required</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- File Upload Area -->
        <div class="file-upload-section mb-6">
            <label class="block text-sm font-medium text-mun-gray-700 mb-3">
                Select File <span class="text-red-500">*</span>
            </label>

            <!-- Drag and Drop Area -->
            <div @drop="handleDrop" @dragover.prevent @dragenter.prevent @dragleave="isDragOver = false"
                @dragover="isDragOver = true" :class="[
                    'upload-dropzone border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
                    isDragOver
                        ? 'border-mun-blue bg-mun-blue/5'
                        : selectedFile
                            ? 'border-mun-green-300 bg-mun-green-50'
                            : 'border-mun-gray-300 hover:border-mun-gray-400'
                ]" @click="triggerFileInput">
                <input ref="fileInput" type="file" accept=".pdf,.doc,.docx" @change="handleFileSelect" class="hidden" />

                <div v-if="!selectedFile" class="upload-prompt">
                    <DocumentArrowUpIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                    <p class="text-lg font-medium text-mun-gray-900 mb-2">
                        {{ isDragOver ? 'Drop file here' : 'Choose a file or drag it here' }}
                    </p>
                    <p class="text-sm text-mun-gray-600">
                        PDF, DOC, DOCX up to 10MB
                    </p>
                </div>

                <div v-else class="selected-file">
                    <div class="flex items-center justify-center space-x-3 mb-4">
                        <div class="p-3 bg-mun-green-100 rounded-lg">
                            <DocumentTextIcon class="w-8 h-8 text-mun-green-600" />
                        </div>
                        <div class="text-left">
                            <p class="text-sm font-medium text-mun-gray-900">{{ selectedFile.name }}</p>
                            <p class="text-xs text-mun-gray-600">{{ formatFileSize(selectedFile.size) }}</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-center space-x-3">
                        <button @click.stop="removeFile"
                            class="px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
                            Remove
                        </button>
                        <button @click.stop="triggerFileInput"
                            class="px-3 py-1 text-sm text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded hover:bg-mun-blue/20 transition-colors">
                            Change
                        </button>
                    </div>
                </div>
            </div>

            <!-- File Validation Errors -->
            <div v-if="fileError" class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center space-x-2">
                    <ExclamationTriangleIcon class="w-4 h-4 text-red-600" />
                    <p class="text-sm text-red-700">{{ fileError }}</p>
                </div>
            </div>
        </div>

        <!-- Document Information -->
        <div class="document-info mb-6 space-y-4">
            <!-- Document Title -->
            <div>
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Document Title <span class="text-red-500">*</span>
                </label>
                <input v-model="documentTitle" type="text" placeholder="Enter a descriptive title for your document..."
                    maxlength="200"
                    class="input-field w-full px-4 py-3"
                    :class="{ 'border-red-300': errors.title }" />
                <div class="flex items-center justify-between mt-1">
                    <p v-if="errors.title" class="text-sm text-red-600">{{ errors.title }}</p>
                    <span class="text-xs text-mun-gray-500 ml-auto">{{ documentTitle.length }}/200</span>
                </div>
            </div>

            <!-- Document Description -->
            <div>
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Description (Optional)
                </label>
                <textarea v-model="documentDescription"
                    placeholder="Provide a brief description of the document's content and purpose..." rows="3"
                    maxlength="500"
                    class="input-field w-full px-4 py-3 resize-none"></textarea>
                <div class="flex justify-end mt-1">
                    <span class="text-xs text-mun-gray-500">{{ documentDescription.length }}/500</span>
                </div>
            </div>

            <!-- Tags -->
            <div>
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Tags (Optional)
                </label>
                <div class="flex flex-wrap gap-2 mb-2">
                    <span v-for="tag in documentTags" :key="tag"
                        class="tag inline-flex items-center px-3 py-1 bg-mun-blue/10 text-mun-blue text-sm rounded-full">
                        {{ tag }}
                        <button @click="removeTag(tag)" class="ml-2 text-mun-blue hover:text-mun-blue-600">
                            <XMarkIcon class="w-3 h-3" />
                        </button>
                    </span>
                </div>
                <div class="flex items-center space-x-2">
                    <input v-model="newTag" @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag" type="text"
                        placeholder="Add tags (press Enter or comma to add)..." maxlength="20"
                        class="input-field flex-1 px-3 py-2 text-sm" />
                    <button @click="addTag" :disabled="!newTag.trim() || documentTags.length >= 5"
                        class="px-3 py-2 text-sm font-medium text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded hover:bg-mun-blue/20 transition-colors disabled:opacity-50">
                        Add
                    </button>
                </div>
                <p class="text-xs text-mun-gray-600 mt-1">Add up to 5 tags to help categorize your document</p>
            </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploading" class="upload-progress mb-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-mun-gray-700">Uploading...</span>
                <span class="text-sm text-mun-gray-600">{{ uploadProgress }}%</span>
            </div>
            <div class="progress-bar w-full bg-mun-gray-200 rounded-full h-2">
                <div class="bg-mun-blue h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${uploadProgress}%` }"></div>
            </div>
        </div>

        <!-- Existing Documents -->
        <div v-if="existingDocuments.length > 0" class="existing-documents mb-6">
            <h4 class="text-sm font-medium text-mun-gray-900 mb-3">Your Documents</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto">
                <div v-for="doc in existingDocuments" :key="doc._id"
                    class="document-item flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div :class="getDocumentStatusIconBg(doc.status)" class="p-2 rounded-lg">
                            <component :is="getDocumentStatusIcon(doc.status)"
                                :class="getDocumentStatusIconColor(doc.status)" class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-mun-gray-900">{{ doc.title }}</p>
                            <div class="flex items-center space-x-3 text-xs text-mun-gray-600">
                                <span>{{ getDocumentTypeText(doc.type) }}</span>
                                <span>{{ formatDate(doc.createdAt) }}</span>
                                <span :class="getDocumentStatusTextClass(doc.status)">
                                    {{ getDocumentStatusText(doc.status) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <button @click="viewDocument(doc)"
                            class="p-2 text-mun-gray-600 hover:text-mun-blue hover:bg-mun-blue/10 rounded transition-colors"
                            title="View document">
                            <EyeIcon class="w-4 h-4" />
                        </button>

                        <button v-if="doc.status === 'rejected' || doc.status === 'needs_revision'"
                            @click="replaceDocument(doc)"
                            class="p-2 text-mun-yellow-600 hover:text-mun-yellow-700 hover:bg-mun-yellow-50 rounded transition-colors"
                            title="Upload new version">
                            <ArrowPathIcon class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons flex items-center justify-between">
            <div class="text-sm text-mun-gray-600">
                <InformationCircleIcon class="w-4 h-4 inline mr-1" />
                Documents will be reviewed by the presidium
            </div>

            <div class="flex items-center space-x-3">
                <button @click="clearForm" :disabled="isUploading"
                    class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-lg hover:bg-mun-gray-50 transition-colors disabled:opacity-50">
                    Clear
                </button>

                <button @click="uploadDocument" :disabled="!canUpload || isUploading"
                    class="px-6 py-2 text-sm font-medium text-white bg-mun-blue border border-mun-blue rounded-lg hover:bg-mun-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <LoadingSpinner v-if="isUploading" class="w-4 h-4 mr-2" />
                    {{ isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Document' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    DocumentArrowUpIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    EyeIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Emits
const emit = defineEmits(['document-uploaded', 'document-viewed'])

const authStore = useAuthStore()
const toast = useToast()

// State
const selectedType = ref('position_paper')
const selectedFile = ref(null)
const documentTitle = ref('')
const documentDescription = ref('')
const documentTags = ref([])
const newTag = ref('')
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const showGuidelines = ref(false)
const fileError = ref('')
const errors = ref({})
const existingDocuments = ref([])

// File input ref
const fileInput = ref(null)

// Document types configuration
const documentTypes = [
    {
        value: 'position_paper',
        name: 'Position Paper',
        description: 'Official country position on agenda topics',
        icon: DocumentTextIcon,
        required: true,
        activeBg: 'bg-mun-blue/10',
        inactiveBg: 'bg-mun-gray-100',
        activeColor: 'text-mun-blue',
        inactiveColor: 'text-mun-gray-600'
    },
    {
        value: 'working_paper',
        name: 'Working Paper',
        description: 'Draft proposals and ideas for discussion',
        icon: DocumentTextIcon,
        required: false,
        activeBg: 'bg-mun-green-100',
        inactiveBg: 'bg-mun-gray-100',
        activeColor: 'text-mun-green-700',
        inactiveColor: 'text-mun-gray-600'
    }
]

// Computed
const canUpload = computed(() => {
    return selectedFile.value &&
        documentTitle.value.trim().length >= 3 &&
        !fileError.value &&
        !Object.keys(errors.value).length
})

// Methods
const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event) => {
    const files = event.target.files
    if (files && files.length > 0) {
        validateAndSetFile(files[0])
    }
}

const handleDrop = (event) => {
    event.preventDefault()
    isDragOver.value = false

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
        validateAndSetFile(files[0])
    }
}

const validateAndSetFile = (file) => {
    fileError.value = ''

    // Check file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
        fileError.value = 'Please select a PDF, DOC, or DOCX file'
        return
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
        fileError.value = 'File size must be less than 10MB'
        return
    }

    selectedFile.value = file

    // Auto-generate title if empty
    if (!documentTitle.value.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        documentTitle.value = nameWithoutExt
    }
}

const removeFile = () => {
    selectedFile.value = null
    fileError.value = ''
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const addTag = () => {
    const tag = newTag.value.trim()
    if (tag && !documentTags.value.includes(tag) && documentTags.value.length < 5) {
        documentTags.value.push(tag)
        newTag.value = ''
    }
}

const removeTag = (tag) => {
    const index = documentTags.value.indexOf(tag)
    if (index > -1) {
        documentTags.value.splice(index, 1)
    }
}

const validateForm = () => {
    errors.value = {}

    if (!documentTitle.value.trim()) {
        errors.value.title = 'Document title is required'
    } else if (documentTitle.value.trim().length < 3) {
        errors.value.title = 'Title must be at least 3 characters'
    }

    return Object.keys(errors.value).length === 0
}

const uploadDocument = async () => {
    if (!validateForm() || !selectedFile.value) return

    try {
        isUploading.value = true
        uploadProgress.value = 0

        const formData = new FormData()
        formData.append('document', selectedFile.value)
        formData.append('type', selectedType.value)
        formData.append('title', documentTitle.value.trim())
        formData.append('description', documentDescription.value.trim())
        formData.append('tags', JSON.stringify(documentTags.value))
        formData.append('committeeId', authStore.user?.committeeId)

        const response = await apiMethods.documents.uploadDocument(formData, {
            onUploadProgress: (progressEvent) => {
                uploadProgress.value = Math.round(
                    (progressEvent.loaded / progressEvent.total) * 100
                )
            }
        })

        if (response.data.success) {
            emit('document-uploaded', {
                document: response.data.document
            })

            toast.success('Document uploaded successfully')
            clearForm()
            loadExistingDocuments()
        }

    } catch (error) {
        toast.error('Upload document error:', error)
        toast.error('Failed to upload document')
    } finally {
        isUploading.value = false
        uploadProgress.value = 0
    }
}

const clearForm = () => {
    selectedFile.value = null
    documentTitle.value = ''
    documentDescription.value = ''
    documentTags.value = []
    newTag.value = ''
    fileError.value = ''
    errors.value = {}
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const loadExistingDocuments = async () => {
    try {
        const response = await apiMethods.documents.getUserDocuments({
            authorEmail: authStore.user?.email,
            limit: 10
        })

        if (response.data.success) {
            existingDocuments.value = response.data.documents || []
        }

    } catch (error) {
        toast.error('Load existing documents error:', error)
    }
}

const viewDocument = (doc) => {
    emit('document-viewed', doc)
}

const replaceDocument = (doc) => {
    selectedType.value = doc.type
    documentTitle.value = doc.title
    documentDescription.value = doc.description || ''
    documentTags.value = doc.tags || []
}

// Document status helpers
const getDocumentStatusIcon = (status) => {
    const icons = {
        uploaded: ClockIcon,
        under_review: ClockIcon,
        approved: CheckCircleIcon,
        rejected: XCircleIcon,
        needs_revision: ExclamationTriangleIcon
    }
    return icons[status] || ClockIcon
}

const getDocumentStatusIconBg = (status) => {
    const backgrounds = {
        uploaded: 'bg-mun-gray-100',
        under_review: 'bg-mun-yellow-100',
        approved: 'bg-mun-green-100',
        rejected: 'bg-mun-red-100',
        needs_revision: 'bg-mun-yellow-100'
    }
    return backgrounds[status] || 'bg-mun-gray-100'
}

const getDocumentStatusIconColor = (status) => {
    const colors = {
        uploaded: 'text-mun-gray-600',
        under_review: 'text-mun-yellow-600',
        approved: 'text-mun-green-600',
        rejected: 'text-mun-red-600',
        needs_revision: 'text-mun-yellow-600'
    }
    return colors[status] || 'text-mun-gray-600'
}

const getDocumentStatusText = (status) => {
    const texts = {
        uploaded: 'Uploaded',
        under_review: 'Under Review',
        approved: 'Approved',
        rejected: 'Rejected',
        needs_revision: 'Needs Revision'
    }
    return texts[status] || 'Unknown'
}

const getDocumentStatusTextClass = (status) => {
    const classes = {
        uploaded: 'text-mun-gray-600',
        under_review: 'text-mun-yellow-600',
        approved: 'text-mun-green-600',
        rejected: 'text-mun-red-600',
        needs_revision: 'text-mun-yellow-600'
    }
    return classes[status] || 'text-mun-gray-600'
}

const getDocumentTypeText = (type) => {
    const types = {
        position_paper: 'Position Paper',
        working_paper: 'Working Paper',
        resolution_draft: 'Resolution'
    }
    return types[type] || 'Document'
}

const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    } catch {
        return 'Unknown'
    }
}

// Lifecycle
onMounted(() => {
    loadExistingDocuments()
})
</script>

<style scoped>
/* Upload dropzone */
.upload-dropzone {
    transition: all 0.2s ease;
}

.upload-dropzone:hover {
    background-color: rgba(249, 250, 251, 0.5);
}

/* Type card animations */
.type-card {
    transition: all 0.2s ease;
}

.type-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Tag animations */
.tag {
    animation: tag-appear 0.3s ease-out;
}

@keyframes tag-appear {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Progress bar animation */
.progress-bar>div {
    transition: width 0.3s ease;
}

/* Document item hover effects */
.document-item {
    transition: all 0.2s ease;
}

.document-item:hover {
    transform: translateX(2px);
    background-color: rgba(243, 244, 246, 0.8);
}

/* Custom scrollbar for existing documents */
.existing-documents .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.existing-documents .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.existing-documents .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.existing-documents .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .grid.md\\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .action-buttons {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .action-buttons .flex.items-center.space-x-3 {
        justify-content: stretch;
        gap: 0.75rem;
    }

    .action-buttons button {
        flex: 1;
    }

    .upload-dropzone {
        padding: 2rem 1rem;
    }
}

/* Drag and drop visual feedback */
.upload-dropzone.border-mun-blue {
    box-shadow: 0 0 0 1px rgba(0, 158, 219, 0.2);
}

/* File validation error animation */
.border-red-300 {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(-5px);
    }

    75% {
        transform: translateX(5px);
    }
}
</style>