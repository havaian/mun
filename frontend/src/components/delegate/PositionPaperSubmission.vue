<template>
    <div class="bg-white border border-mun-gray-200 rounded-lg p-6">
        <!-- Header -->
        <div class="border-b border-mun-gray-200 pb-4 mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <DocumentTextIcon class="h-8 w-8 text-mun-blue" />
                    </div>
                    <div>
                        <h2 class="text-xl font-semibold text-mun-gray-900">
                            Position Paper Submission
                        </h2>
                        <p class="text-sm text-mun-gray-600 mt-1">
                            Submit your position paper for {{ committee.name }}
                        </p>
                    </div>
                </div>

                <!-- Status Badge -->
                <div v-if="positionPaper" class="flex flex-col items-end">
                    <StatusBadge :status="positionPaper.status" size="sm" />
                    <span class="text-xs text-mun-gray-500 mt-1">
                        Version {{ positionPaper.version }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Deadline Info -->
        <div class="mb-6">
            <div class="bg-mun-gray-50 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                    <ClockIcon class="h-5 w-5 text-mun-gray-600 mt-0.5" />
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-mun-gray-900">Submission Deadline</h4>
                        <p class="text-sm text-mun-gray-600 mt-1">
                            {{ formatDeadline(event.settings.positionPaperDeadline) }}
                        </p>

                        <!-- Deadline Status -->
                        <div v-if="deadlineStatus" class="mt-2 flex items-center space-x-2">
                            <div v-if="deadlineStatus.isPassed" class="flex items-center text-mun-red-600 text-sm">
                                <ExclamationTriangleIcon class="h-4 w-4 mr-1" />
                                <span>Deadline has passed</span>
                            </div>
                            <div v-else-if="deadlineStatus.isUrgent"
                                class="flex items-center text-mun-orange-600 text-sm">
                                <ClockIcon class="h-4 w-4 mr-1" />
                                <span>{{ deadlineStatus.timeRemaining }}</span>
                            </div>
                            <div v-else class="flex items-center text-mun-green-600 text-sm">
                                <CheckCircleIcon class="h-4 w-4 mr-1" />
                                <span>{{ deadlineStatus.timeRemaining }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Existing Position Paper -->
        <div v-if="positionPaper" class="mb-6">
            <div class="bg-white border border-mun-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <DocumentIcon class="h-6 w-6 text-mun-blue" />
                        <div>
                            <h4 class="text-sm font-medium text-mun-gray-900">
                                {{ positionPaper.originalName }}
                            </h4>
                            <p class="text-xs text-mun-gray-500">
                                Uploaded {{ formatDate(positionPaper.createdAt) }} •
                                {{ formatFileSize(positionPaper.fileSize) }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <AppButton variant="outline" size="sm" @click="downloadPositionPaper">
                            <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
                            Download
                        </AppButton>
                        <AppButton v-if="canUploadNewVersion" variant="outline" size="sm"
                            @click="showUploadModal = true">
                            <ArrowUpIcon class="h-4 w-4 mr-1" />
                            New Version
                        </AppButton>
                    </div>
                </div>

                <!-- Review Status -->
                <div v-if="positionPaper.presidiumReview" class="mt-4 pt-4 border-t border-mun-gray-200">
                    <div class="flex items-start space-x-3">
                        <UserIcon class="h-5 w-5 text-mun-gray-400 mt-0.5" />
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-mun-gray-900">
                                    Presidium Review
                                </span>
                                <span class="text-xs text-mun-gray-500">
                                    {{ formatDate(positionPaper.presidiumReview.reviewedAt) }}
                                </span>
                            </div>

                            <div class="mt-2">
                                <StatusBadge :status="positionPaper.presidiumReview.decision" size="xs" />
                            </div>

                            <div v-if="positionPaper.presidiumReview.comments" class="mt-2">
                                <p class="text-sm text-mun-gray-700 bg-mun-gray-50 p-3 rounded">
                                    {{ positionPaper.presidiumReview.comments }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Version History -->
                <div v-if="positionPaper.versions.length > 0" class="mt-4 pt-4 border-t border-mun-gray-200">
                    <button @click="showVersionHistory = !showVersionHistory"
                        class="flex items-center text-sm text-mun-blue hover:text-mun-blue-600">
                        <ChevronDownIcon :class="[
                            'h-4 w-4 mr-1 transition-transform',
                            showVersionHistory ? 'rotate-180' : ''
                        ]" />
                        Previous Versions ({{ positionPaper.versions.length }})
                    </button>

                    <div v-show="showVersionHistory" class="mt-3 space-y-2">
                        <div v-for="version in positionPaper.versions" :key="version.version"
                            class="flex items-center justify-between py-2 px-3 bg-mun-gray-50 rounded">
                            <div class="flex items-center space-x-2">
                                <span class="text-xs font-medium text-mun-gray-600">
                                    v{{ version.version }}
                                </span>
                                <span class="text-xs text-mun-gray-500">
                                    {{ formatDate(version.uploadedAt) }}
                                </span>
                                <StatusBadge :status="version.status" size="xs" />
                            </div>
                            <AppButton variant="text" size="sm" @click="downloadVersion(version)">
                                <ArrowDownTrayIcon class="h-3 w-3" />
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Section -->
        <div v-if="canSubmit" class="space-y-4">
            <div v-if="!positionPaper">
                <h4 class="text-lg font-medium text-mun-gray-900 mb-4">
                    Upload Position Paper
                </h4>
                <p class="text-sm text-mun-gray-600 mb-4">
                    Upload your position paper document. Accepted formats: PDF, DOC, DOCX. Maximum file size: 10MB.
                </p>
            </div>

            <!-- File Upload Area -->
            <div class="border-2 border-dashed border-mun-gray-300 rounded-lg p-6 text-center hover:border-mun-blue-300 transition-colors"
                :class="{ 'border-mun-blue-400 bg-mun-blue-50': isDragOver }" @drop="handleFileDrop"
                @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false">

                <DocumentIcon class="mx-auto h-12 w-12 text-mun-gray-400" />
                <div class="mt-4">
                    <label for="position-paper-upload"
                        class="cursor-pointer inline-flex items-center px-4 py-2 bg-mun-blue text-white rounded-lg hover:bg-mun-blue-600 transition-colors">
                        <span>Choose File</span>
                        <input id="position-paper-upload" type="file" class="hidden" accept=".pdf,.doc,.docx"
                            @change="handleFileSelect" />
                    </label>
                    <p class="mt-1 text-sm text-mun-gray-500">
                        or drag and drop your file here
                    </p>
                </div>
            </div>

            <!-- Selected File Info -->
            <div v-if="selectedFile" class="bg-mun-blue-50 border border-mun-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <DocumentIcon class="h-6 w-6 text-mun-blue" />
                        <div>
                            <p class="text-sm font-medium text-mun-blue-900">
                                {{ selectedFile.name }}
                            </p>
                            <p class="text-xs text-mun-blue-600">
                                {{ formatFileSize(selectedFile.size) }}
                            </p>
                        </div>
                    </div>
                    <AppButton variant="outline" size="sm" @click="clearSelectedFile">
                        <XMarkIcon class="h-4 w-4" />
                    </AppButton>
                </div>
            </div>

            <!-- Upload Button -->
            <div v-if="selectedFile" class="flex justify-end space-x-3">
                <AppButton variant="outline" @click="clearSelectedFile" :disabled="isUploading">
                    Cancel
                </AppButton>
                <AppButton variant="primary" @click="uploadPositionPaper" :loading="isUploading">
                    {{ positionPaper ? 'Upload New Version' : 'Upload Position Paper' }}
                </AppButton>
            </div>
        </div>

        <!-- Cannot Submit Message -->
        <div v-else-if="deadlineStatus?.isPassed && !event.settings.allowLatePositionPapers" class="text-center py-8">
            <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-mun-red-400" />
            <h3 class="mt-4 text-lg font-medium text-mun-gray-900">
                Submission Deadline Passed
            </h3>
            <p class="mt-2 text-sm text-mun-gray-600">
                The deadline for position paper submissions has passed and late submissions are not allowed for this
                event.
            </p>
        </div>

        <!-- Already Approved Message -->
        <div v-else-if="positionPaper?.status === 'approved'" class="text-center py-8">
            <CheckCircleIcon class="mx-auto h-12 w-12 text-mun-green-400" />
            <h3 class="mt-4 text-lg font-medium text-mun-gray-900">
                Position Paper Approved
            </h3>
            <p class="mt-2 text-sm text-mun-gray-600">
                Your position paper has been approved by the presidium. No further uploads are needed.
            </p>
        </div>
    </div>

    <!-- Upload Modal for New Versions -->
    <ModalWrapper v-model="showUploadModal" title="Upload New Version"
        subtitle="Upload a new version of your position paper" size="md">
        <template #content>
            <div class="space-y-4">
                <div class="border-2 border-dashed border-mun-gray-300 rounded-lg p-6 text-center">
                    <DocumentIcon class="mx-auto h-8 w-8 text-mun-gray-400" />
                    <div class="mt-2">
                        <label for="modal-file-upload"
                            class="cursor-pointer inline-flex items-center px-3 py-2 bg-mun-blue text-white text-sm rounded hover:bg-mun-blue-600">
                            Choose File
                            <input id="modal-file-upload" type="file" class="hidden" accept=".pdf,.doc,.docx"
                                @change="handleModalFileSelect" />
                        </label>
                    </div>
                </div>

                <div v-if="modalSelectedFile" class="bg-mun-blue-50 border border-mun-blue-200 rounded p-3">
                    <div class="flex items-center space-x-2">
                        <DocumentIcon class="h-5 w-5 text-mun-blue" />
                        <span class="text-sm font-medium text-mun-blue-900">
                            {{ modalSelectedFile.name }}
                        </span>
                    </div>
                </div>
            </div>
        </template>

        <template #footer-buttons>
            <AppButton variant="outline" @click="closeUploadModal" :disabled="isUploading">
                Cancel
            </AppButton>
            <AppButton variant="primary" @click="uploadNewVersion" :loading="isUploading"
                :disabled="!modalSelectedFile">
                Upload Version
            </AppButton>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    DocumentTextIcon,
    DocumentIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    ArrowUpIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    UserIcon,
    ChevronDownIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    committee: {
        type: Object,
        required: true
    },
    event: {
        type: Object,
        required: true
    },
    delegate: {
        type: Object,
        required: true
    }
})

// Emits
const emit = defineEmits(['position-paper-uploaded', 'position-paper-updated'])

// Composables
const toast = useToast()

// State
const positionPaper = ref(null)
const selectedFile = ref(null)
const modalSelectedFile = ref(null)
const isUploading = ref(false)
const isDragOver = ref(false)
const showVersionHistory = ref(false)
const showUploadModal = ref(false)

// Computed
const deadlineStatus = computed(() => {
    if (!props.event.settings.positionPaperDeadline) return null

    const deadline = new Date(props.event.settings.positionPaperDeadline)
    const now = new Date()
    const timeLeft = deadline - now

    const isPassed = timeLeft < 0
    const isUrgent = timeLeft < 24 * 60 * 60 * 1000 && timeLeft > 0 // Less than 24 hours

    let timeRemaining = ''
    if (!isPassed) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (days > 0) {
            timeRemaining = `${days} day${days > 1 ? 's' : ''} remaining`
        } else if (hours > 0) {
            timeRemaining = `${hours} hour${hours > 1 ? 's' : ''} remaining`
        } else {
            timeRemaining = 'Less than 1 hour remaining'
        }
    }

    return {
        isPassed,
        isUrgent,
        timeRemaining
    }
})

const canSubmit = computed(() => {
    // Can submit if no deadline or deadline hasn't passed or late submissions allowed
    if (!deadlineStatus.value?.isPassed) return true
    if (props.event.settings.allowLatePositionPapers) return true

    // Can submit new version if paper was sent back for revision
    if (positionPaper.value?.status === 'needs_revision') return true

    return false
})

const canUploadNewVersion = computed(() => {
    if (!positionPaper.value) return false
    if (positionPaper.value.status === 'approved') return false
    return canSubmit.value
})

// Methods
const loadPositionPaper = async () => {
    try {
        const response = await apiMethods.documents.getPositionPaper(
            props.committee._id,
            props.delegate.email
        )

        if (response.data.success && response.data.document) {
            positionPaper.value = response.data.document
        }
    } catch (error) {
        // Position paper doesn't exist yet - this is normal
        console.log('No position paper found:', error)
    }
}

const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
        validateAndSetFile(file)
    }
}

const handleModalFileSelect = (event) => {
    const file = event.target.files[0]
    if (file && validateFile(file)) {
        modalSelectedFile.value = file
    }
}

const handleFileDrop = (event) => {
    event.preventDefault()
    isDragOver.value = false

    const files = event.dataTransfer.files
    if (files.length > 0) {
        validateAndSetFile(files[0])
    }
}

const validateAndSetFile = (file) => {
    if (validateFile(file)) {
        selectedFile.value = file
    }
}

const validateFile = (file) => {
    // Check file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a PDF, DOC, or DOCX file')
        return false
    }

    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
        toast.error('File size must be less than 10MB')
        return false
    }

    return true
}

const clearSelectedFile = () => {
    selectedFile.value = null
    // Reset file input
    const fileInput = document.getElementById('position-paper-upload')
    if (fileInput) fileInput.value = ''
}

const uploadPositionPaper = async () => {
    if (!selectedFile.value) return

    try {
        isUploading.value = true

        const formData = new FormData()
        formData.append('document', selectedFile.value)
        formData.append('committeeId', props.committee._id)

        const response = await apiMethods.documents.uploadPositionPaper(formData)

        if (response.data.success) {
            toast.success('Position paper uploaded successfully')
            positionPaper.value = response.data.document
            clearSelectedFile()
            emit('position-paper-uploaded', response.data.document)
        }

    } catch (error) {
        console.error('Upload error:', error)
        toast.error(error.response?.data?.error || 'Failed to upload position paper')
    } finally {
        isUploading.value = false
    }
}

const uploadNewVersion = async () => {
    if (!modalSelectedFile.value) return

    try {
        isUploading.value = true

        const formData = new FormData()
        formData.append('document', modalSelectedFile.value)
        formData.append('committeeId', props.committee._id)

        const response = await apiMethods.documents.uploadPositionPaper(formData)

        if (response.data.success) {
            toast.success('New version uploaded successfully')
            positionPaper.value = response.data.document
            closeUploadModal()
            emit('position-paper-updated', response.data.document)
        }

    } catch (error) {
        console.error('Upload error:', error)
        toast.error(error.response?.data?.error || 'Failed to upload new version')
    } finally {
        isUploading.value = false
    }
}

const downloadPositionPaper = async () => {
    try {
        const response = await apiMethods.documents.download(positionPaper.value._id)

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', positionPaper.value.originalName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

    } catch (error) {
        console.error('Download error:', error)
        toast.error('Failed to download position paper')
    }
}

const downloadVersion = async (version) => {
    try {
        const response = await apiMethods.documents.downloadVersion(
            positionPaper.value._id,
            version.version
        )

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', version.filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

    } catch (error) {
        console.error('Download error:', error)
        toast.error('Failed to download version')
    }
}

const closeUploadModal = () => {
    showUploadModal.value = false
    modalSelectedFile.value = null
}

const formatDate = (date) => {
    return new Date(date).toLocaleString()
}

const formatDeadline = (date) => {
    if (!date) return 'No deadline set'
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    })
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Lifecycle
onMounted(() => {
    loadPositionPaper()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>