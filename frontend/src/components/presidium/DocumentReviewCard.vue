<!-- frontend/src/components/presidium/DocumentReviewCard.vue -->
<template>
    <div :class="[
        'document-review-card bg-white border rounded-lg p-4 transition-all duration-200',
        'hover:shadow-mun hover:border-mun-blue/30',
        getStatusBorderClass()
    ]">
        <!-- Document Header -->
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-start space-x-3 flex-1">
                <!-- Document Type Icon -->
                <div :class="getDocumentTypeIconBg()" class="p-2 rounded-lg flex-shrink-0">
                    <component :is="getDocumentTypeIcon()" :class="getDocumentTypeIconColor()" class="w-5 h-5" />
                </div>

                <!-- Document Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                        <h4 class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ document.title || document.originalName }}
                        </h4>
                        <span :class="getStatusBadgeClass()" class="px-2 py-1 text-xs font-medium rounded-full">
                            {{ getStatusText() }}
                        </span>
                    </div>

                    <div class="flex items-center space-x-4 text-xs text-mun-gray-500">
                        <span class="flex items-center">
                            <UserIcon class="w-3 h-3 mr-1" />
                            {{ document.authorCountry || document.authorEmail }}
                        </span>
                        <span class="flex items-center">
                            <ClockIcon class="w-3 h-3 mr-1" />
                            {{ formatDate(document.submittedAt || document.createdAt) }}
                        </span>
                        <span v-if="document.fileSize" class="flex items-center">
                            <DocumentIcon class="w-3 h-3 mr-1" />
                            {{ formatFileSize(document.fileSize) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Priority Indicator -->
            <div v-if="getPriorityLevel()" class="flex-shrink-0">
                <span :class="getPriorityBadgeClass()" class="px-2 py-1 text-xs font-medium rounded">
                    {{ getPriorityLevel() }}
                </span>
            </div>
        </div>

        <!-- Document Preview/Description -->
        <div v-if="document.description || document.publicDescription" class="mb-3">
            <p class="text-sm text-mun-gray-600 line-clamp-2">
                {{ document.description || document.publicDescription }}
            </p>
        </div>

        <!-- Review Status Section -->
        <div v-if="document.presidiumReview || document.status !== 'uploaded'" class="mb-4">
            <!-- Previous Review -->
            <div v-if="document.presidiumReview" class="p-3 bg-mun-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-mun-gray-900">Previous Review</span>
                    <span class="text-xs text-mun-gray-500">
                        {{ formatDate(document.presidiumReview.reviewedAt) }}
                    </span>
                </div>

                <div class="flex items-center space-x-2 mb-2">
                    <span :class="getReviewDecisionBadgeClass()" class="px-2 py-1 text-xs font-medium rounded">
                        {{ getReviewDecisionText() }}
                    </span>
                    <span v-if="document.presidiumReview.reviewedByCountry" class="text-xs text-mun-gray-600">
                        by {{ document.presidiumReview.reviewedByCountry }}
                    </span>
                </div>

                <p v-if="document.presidiumReview.comments" class="text-xs text-mun-gray-600 mt-2">
                    {{ document.presidiumReview.comments }}
                </p>

                <!-- Extended Deadline -->
                <div v-if="document.presidiumReview.extendedDeadline"
                    class="mt-2 p-2 bg-mun-yellow-50 border border-mun-yellow-200 rounded">
                    <div class="flex items-center text-xs text-mun-yellow-800">
                        <ExclamationTriangleIcon class="w-3 h-3 mr-1" />
                        Extended deadline: {{ formatDate(document.presidiumReview.extendedDeadline) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <!-- View/Download Button -->
                <button @click="$emit('view-document', document)"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded hover:bg-mun-blue/20 transition-colors">
                    <EyeIcon class="w-4 h-4 mr-1" />
                    View
                </button>

                <!-- Download Button -->
                <button @click="downloadDocument"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-gray-700 bg-mun-gray-100 border border-mun-gray-200 rounded hover:bg-mun-gray-200 transition-colors">
                    <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                    Download
                </button>

                <!-- Version History -->
                <button v-if="document.versions && document.versions.length > 1"
                    @click="showVersionHistory = !showVersionHistory"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-gray-700 bg-mun-gray-100 border border-mun-gray-200 rounded hover:bg-mun-gray-200 transition-colors">
                    <ClockIcon class="w-4 h-4 mr-1" />
                    Versions ({{ document.versions.length }})
                </button>
            </div>

            <!-- Review Actions -->
            <div v-if="canReview" class="flex items-center space-x-2">
                <button @click="openReviewModal('approve')" :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-mun-green-600 border border-mun-green-600 rounded hover:bg-mun-green-700 transition-colors disabled:opacity-50">
                    <CheckIcon class="w-4 h-4 mr-1" />
                    Approve
                </button>

                <button @click="openReviewModal('needs_revision')" :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-yellow-700 bg-mun-yellow-100 border border-mun-yellow-200 rounded hover:bg-mun-yellow-200 transition-colors disabled:opacity-50">
                    <PencilIcon class="w-4 h-4 mr-1" />
                    Needs Revision
                </button>

                <button @click="openReviewModal('reject')" :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-mun-red-600 border border-mun-red-600 rounded hover:bg-mun-red-700 transition-colors disabled:opacity-50">
                    <XMarkIcon class="w-4 h-4 mr-1" />
                    Reject
                </button>
            </div>
        </div>

        <!-- Version History Dropdown -->
        <div v-if="showVersionHistory && document.versions" class="mt-3 border-t border-mun-gray-200 pt-3">
            <h5 class="text-xs font-medium text-mun-gray-900 mb-2">Version History</h5>
            <div class="space-y-2">
                <div v-for="(version, index) in document.versions" :key="version._id || index"
                    class="flex items-center justify-between p-2 bg-mun-gray-50 rounded text-xs">
                    <div class="flex items-center space-x-2">
                        <span class="font-medium">v{{ version.version || index + 1 }}</span>
                        <span class="text-mun-gray-500">{{ formatDate(version.submittedAt) }}</span>
                        <span v-if="version.status" :class="getVersionStatusClass(version.status)"
                            class="px-1.5 py-0.5 rounded">
                            {{ version.status }}
                        </span>
                    </div>
                    <button @click="$emit('view-version', document, version)"
                        class="text-mun-blue hover:text-mun-blue-600">
                        View
                    </button>
                </div>
            </div>
        </div>

        <!-- Review Modal -->
        <ReviewModal v-if="showReviewModal" v-model="showReviewModal" :document="document"
            :review-type="selectedReviewType" @review-submitted="handleReviewSubmitted" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
    DocumentTextIcon,
    UserIcon,
    ClockIcon,
    DocumentIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    CheckIcon,
    XMarkIcon,
    PencilIcon,
    ExclamationTriangleIcon,
    CalendarDaysIcon
} from '@heroicons/vue/24/outline'
import ReviewModal from './DocumentReviewModal.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    document: {
        type: Object,
        required: true
    },
    canReview: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits(['view-document', 'view-version', 'document-reviewed', 'download-document'])

const authStore = useAuthStore()
const toast = useToast()

// State
const isUpdating = ref(false)
const showVersionHistory = ref(false)
const showReviewModal = ref(false)
const selectedReviewType = ref('')

// Computed
const getDocumentTypeIcon = () => {
    const icons = {
        position_paper: DocumentTextIcon,
        resolution_draft: DocumentTextIcon,
        public_document: DocumentIcon,
        amendment: PencilIcon
    }
    return icons[props.document.type] || DocumentTextIcon
}

const getDocumentTypeIconBg = () => {
    const backgrounds = {
        position_paper: 'bg-mun-blue/10',
        resolution_draft: 'bg-mun-green-100',
        public_document: 'bg-mun-yellow-100',
        amendment: 'bg-purple-100'
    }
    return backgrounds[props.document.type] || 'bg-mun-gray-100'
}

const getDocumentTypeIconColor = () => {
    const colors = {
        position_paper: 'text-mun-blue',
        resolution_draft: 'text-mun-green-700',
        public_document: 'text-mun-yellow-700',
        amendment: 'text-purple-700'
    }
    return colors[props.document.type] || 'text-mun-gray-600'
}

const getStatusBorderClass = () => {
    const classes = {
        uploaded: 'border-mun-gray-200',
        under_review: 'border-mun-yellow-300',
        approved: 'border-mun-green-300',
        rejected: 'border-mun-red-300',
        needs_revision: 'border-mun-yellow-300'
    }
    return classes[props.document.status] || 'border-mun-gray-200'
}

const getStatusBadgeClass = () => {
    const classes = {
        uploaded: 'bg-mun-gray-100 text-mun-gray-700',
        under_review: 'bg-mun-yellow-100 text-mun-yellow-700',
        approved: 'bg-mun-green-100 text-mun-green-700',
        rejected: 'bg-mun-red-100 text-mun-red-700',
        needs_revision: 'bg-mun-yellow-100 text-mun-yellow-700'
    }
    return classes[props.document.status] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getStatusText = () => {
    const texts = {
        uploaded: 'Awaiting Review',
        under_review: 'Under Review',
        approved: 'Approved',
        rejected: 'Rejected',
        needs_revision: 'Needs Revision'
    }
    return texts[props.document.status] || 'Unknown'
}

const getPriorityLevel = () => {
    // Calculate priority based on submission deadline, document type, etc.
    if (!props.document.submissionDeadline) return null

    const deadline = new Date(props.document.submissionDeadline)
    const now = new Date()
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

    if (daysUntilDeadline < 0) return 'OVERDUE'
    if (daysUntilDeadline <= 1) return 'URGENT'
    if (daysUntilDeadline <= 3) return 'HIGH'

    return null
}

const getPriorityBadgeClass = () => {
    const priority = getPriorityLevel()
    const classes = {
        'OVERDUE': 'bg-mun-red-600 text-white',
        'URGENT': 'bg-mun-red-100 text-mun-red-700',
        'HIGH': 'bg-mun-yellow-100 text-mun-yellow-700'
    }
    return classes[priority] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getReviewDecisionBadgeClass = () => {
    const decision = props.document.presidiumReview?.decision
    const classes = {
        approve: 'bg-mun-green-100 text-mun-green-700',
        reject: 'bg-mun-red-100 text-mun-red-700',
        needs_revision: 'bg-mun-yellow-100 text-mun-yellow-700',
        reject_with_deadline: 'bg-mun-red-100 text-mun-red-700',
        reject_with_extension: 'bg-mun-yellow-100 text-mun-yellow-700'
    }
    return classes[decision] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getReviewDecisionText = () => {
    const decision = props.document.presidiumReview?.decision
    const texts = {
        approve: 'Approved',
        reject: 'Rejected',
        needs_revision: 'Needs Revision',
        reject_with_deadline: 'Rejected - Resubmit by Deadline',
        reject_with_extension: 'Rejected - Extension Granted'
    }
    return texts[decision] || 'Reviewed'
}

const getVersionStatusClass = (status) => {
    const classes = {
        approved: 'bg-mun-green-100 text-mun-green-700',
        rejected: 'bg-mun-red-100 text-mun-red-700',
        needs_revision: 'bg-mun-yellow-100 text-mun-yellow-700'
    }
    return classes[status] || 'bg-mun-gray-100 text-mun-gray-700'
}

// Methods
const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Invalid date'
    }
}

const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const downloadDocument = async () => {
    try {
        emit('download-document', props.document)

        // Fallback to direct download
        const response = await apiMethods.documents.downloadDocument(props.document._id)

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = props.document.originalName || 'document'
        link.click()
        window.URL.revokeObjectURL(url)

    } catch (error) {
        console.error('Download error:', error)
        toast.error('Failed to download document')
    }
}

const openReviewModal = (reviewType) => {
    selectedReviewType.value = reviewType
    showReviewModal.value = true
}

const handleReviewSubmitted = (reviewData) => {
    emit('document-reviewed', {
        document: props.document,
        review: reviewData
    })
    showReviewModal.value = false
}
</script>

<style scoped>
.document-review-card {
    border-width: 1px;
    border-style: solid;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Hover effects */
.document-review-card:hover {
    transform: translateY(-1px);
}

/* Button hover effects */
button:hover {
    transform: translateY(-1px);
}

button:active {
    transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .flex.items-center.justify-between {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .flex.items-center.space-x-2 {
        justify-content: center;
    }
}
</style>