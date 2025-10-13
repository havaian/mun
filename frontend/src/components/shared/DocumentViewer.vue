<!-- frontend/src/components/shared/DocumentViewer.vue -->
<template>
    <div class="document-viewer" :class="viewerClasses">
        <!-- Header -->
        <div v-if="showHeader" class="viewer-header" :class="headerClasses">
            <div class="flex items-center justify-between">
                <!-- Document info -->
                <div class="flex items-center space-x-3">
                    <div class="document-icon" :class="iconClasses">
                        <DocumentTextIcon v-if="isPDF" class="w-5 h-5" />
                        <DocumentIcon v-else-if="isWord" class="w-5 h-5" />
                        <PhotoIcon v-else-if="isImage" class="w-5 h-5" />
                        <DocumentDuplicateIcon v-else class="w-5 h-5" />
                    </div>

                    <div>
                        <h3 class="text-sm font-medium text-mun-gray-900 truncate max-w-48">
                            {{ document.title || document.name || 'Document' }}
                        </h3>
                        <p class="text-xs text-mun-gray-500">
                            {{ fileExtension }} • {{ formattedFileSize }}
                            <span v-if="document.uploadedAt">
                                • {{ formatDate(document.uploadedAt) }}
                            </span>
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center space-x-2">
                    <!-- View mode toggle -->
                    <div v-if="canToggleMode" class="view-mode-toggle">
                        <button v-for="mode in availableModes" :key="mode" @click="currentMode = mode"
                            :class="modeButtonClass(mode)" :title="`View as ${mode}`">
                            <EyeIcon v-if="mode === 'preview'" class="w-4 h-4" />
                            <DocumentTextIcon v-if="mode === 'text'" class="w-4 h-4" />
                            <CodeBracketIcon v-if="mode === 'raw'" class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Download -->
                    <button v-if="allowDownload" @click="downloadDocument"
                        class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-mun-gray-300 text-mun-gray-700 bg-white hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors"
                        :disabled="isDownloading">
                        <ArrowDownTrayIcon class="w-3 h-3 mr-1" />
                        {{ isDownloading ? 'Downloading...' : 'Download' }}
                    </button>

                    <!-- Close -->
                    <button v-if="showCloseButton" @click="$emit('close')"
                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="viewer-content" :class="contentClasses">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
                <div class="flex flex-col items-center justify-center h-full">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
                    <p class="mt-2 text-sm text-mun-gray-500">Loading document...</p>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="error-state">
                <div class="flex flex-col items-center justify-center h-full">
                    <ExclamationTriangleIcon class="w-12 h-12 text-red-400 mb-4" />
                    <h3 class="text-lg font-medium text-mun-gray-900 mb-2">Cannot display document</h3>
                    <p class="text-sm text-mun-gray-500 text-center mb-4">{{ error }}</p>
                    <button v-if="allowDownload" @click="downloadDocument"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mun-blue hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                        <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                        Download Instead
                    </button>
                </div>
            </div>

            <!-- PDF Preview -->
            <div v-else-if="currentMode === 'preview' && isPDF" class="pdf-preview">
                <iframe :src="previewUrl" class="w-full h-full border-0" title="PDF Preview" @load="onPreviewLoad"
                    @error="onPreviewError" />
            </div>

            <!-- Image Preview -->
            <div v-else-if="currentMode === 'preview' && isImage" class="image-preview">
                <div class="flex items-center justify-center h-full">
                    <img :src="previewUrl" :alt="document.title || 'Document image'"
                        class="max-w-full max-h-full object-contain" @load="onPreviewLoad" @error="onPreviewError" />
                </div>
            </div>

            <!-- Text Preview -->
            <div v-else-if="currentMode === 'text' && documentText" class="text-preview">
                <div class="text-content" :class="textContentClasses">
                    <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{{ documentText }}</pre>
                </div>
            </div>

            <!-- Raw Content -->
            <div v-else-if="currentMode === 'raw' && documentText" class="raw-preview">
                <div class="raw-content">
                    <pre
                        class="text-xs font-mono bg-mun-gray-50 p-4 rounded overflow-auto h-full">{{ documentText }}</pre>
                </div>
            </div>

            <!-- Unsupported Format -->
            <div v-else class="unsupported-format">
                <div class="flex flex-col items-center justify-center h-full">
                    <DocumentIcon class="w-16 h-16 text-mun-gray-300 mb-4" />
                    <h3 class="text-lg font-medium text-mun-gray-900 mb-2">Preview not available</h3>
                    <p class="text-sm text-mun-gray-500 text-center mb-4">
                        This file type cannot be previewed in the browser.
                    </p>
                    <div class="flex space-x-3">
                        <button v-if="allowDownload" @click="downloadDocument"
                            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mun-blue hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                            Download
                        </button>

                        <button v-if="documentText" @click="currentMode = 'text'"
                            class="inline-flex items-center px-3 py-2 border border-mun-gray-300 text-sm font-medium rounded-md text-mun-gray-700 bg-white hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                            <DocumentTextIcon class="w-4 h-4 mr-2" />
                            View as Text
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="showFooter" class="viewer-footer" :class="footerClasses">
            <div class="flex items-center justify-between text-xs text-mun-gray-500">
                <div>
                    <span v-if="document.uploadedBy">Uploaded by {{ document.uploadedBy }}</span>
                    <span v-if="document.version" class="ml-2">Version {{ document.version }}</span>
                </div>
                <div v-if="document.fileSize">
                    {{ formattedFileSize }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
    DocumentTextIcon,
    DocumentIcon,
    DocumentDuplicateIcon,
    PhotoIcon,
    EyeIcon,
    CodeBracketIcon,
    ArrowDownTrayIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    // Document data
    document: {
        type: Object,
        required: true
    },

    // Display options
    height: {
        type: String,
        default: '500px'
    },
    maxHeight: {
        type: String,
        default: ''
    },

    // Features
    showHeader: {
        type: Boolean,
        default: true
    },
    showFooter: {
        type: Boolean,
        default: false
    },
    showCloseButton: {
        type: Boolean,
        default: false
    },
    allowDownload: {
        type: Boolean,
        default: true
    },
    autoLoadPreview: {
        type: Boolean,
        default: true
    },

    // View modes
    defaultMode: {
        type: String,
        default: 'preview', // preview, text, raw
        validator: (value) => ['preview', 'text', 'raw'].includes(value)
    },
    allowModeSwitch: {
        type: Boolean,
        default: true
    },

    // Styling
    variant: {
        type: String,
        default: 'default', // default, modal, embedded
        validator: (value) => ['default', 'modal', 'embedded'].includes(value)
    }
})

// Emits
const emit = defineEmits(['close', 'loaded', 'error', 'download'])

const toast = useToast()

// State
const isLoading = ref(false)
const isDownloading = ref(false)
const error = ref(null)
const currentMode = ref(props.defaultMode)
const previewUrl = ref('')
const documentText = ref('')

// Computed
const fileExtension = computed(() => {
    const fileName = props.document.name || props.document.fileName || ''
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
})

const isPDF = computed(() => {
    return fileExtension.value === 'PDF' || props.document.mimeType?.includes('pdf')
})

const isWord = computed(() => {
    const wordExtensions = ['DOC', 'DOCX']
    return wordExtensions.includes(fileExtension.value) ||
        props.document.mimeType?.includes('word') ||
        props.document.mimeType?.includes('document')
})

const isImage = computed(() => {
    const imageExtensions = ['PNG', 'JPG', 'JPEG', 'GIF', 'BMP', 'SVG', 'WEBP']
    return imageExtensions.includes(fileExtension.value) ||
        props.document.mimeType?.includes('image')
})

const formattedFileSize = computed(() => {
    const size = props.document.fileSize || props.document.size || 0
    if (size === 0) return 'Unknown size'

    const units = ['B', 'KB', 'MB', 'GB']
    let unitIndex = 0
    let fileSize = size

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024
        unitIndex++
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`
})

const availableModes = computed(() => {
    const modes = []

    if (isPDF.value || isImage.value) {
        modes.push('preview')
    }

    if (documentText.value) {
        modes.push('text', 'raw')
    }

    return modes
})

const canToggleMode = computed(() => {
    return props.allowModeSwitch && availableModes.value.length > 1
})

// Style classes
const viewerClasses = computed(() => {
    const base = 'document-viewer bg-white'
    const variantClasses = {
        default: 'border border-mun-gray-200 rounded-lg shadow-sm',
        modal: 'rounded-lg',
        embedded: 'border-0'
    }

    return `${base} ${variantClasses[props.variant]}`
})

const headerClasses = computed(() => {
    const base = 'px-4 py-3 border-b border-mun-gray-200'
    return base
})

const contentClasses = computed(() => {
    const base = 'viewer-content-area overflow-hidden'
    const height = props.maxHeight
        ? `max-h-[${props.maxHeight}]`
        : `h-[${props.height}]`

    return `${base} ${height}`
})

const footerClasses = computed(() => {
    const base = 'px-4 py-2 border-t border-mun-gray-200 bg-mun-gray-50'
    return base
})

const iconClasses = computed(() => {
    const base = 'flex items-center justify-center w-8 h-8 rounded'

    if (isPDF.value) return `${base} bg-red-100 text-red-600`
    if (isWord.value) return `${base} bg-blue-100 text-blue-600`
    if (isImage.value) return `${base} bg-green-100 text-green-600`
    return `${base} bg-mun-gray-100 text-mun-gray-600`
})

const textContentClasses = computed(() => {
    return 'p-4 h-full overflow-auto bg-white'
})

const modeButtonClass = (mode) => {
    const base = 'inline-flex items-center justify-center w-8 h-8 text-xs font-medium rounded transition-colors'
    const active = currentMode.value === mode

    if (active) {
        return `${base} bg-mun-blue text-white`
    }

    return `${base} text-mun-gray-500 hover:text-mun-gray-700 hover:bg-mun-gray-100`
}

// Methods
const loadDocument = async () => {
    try {
        isLoading.value = true
        error.value = null

        // Load preview URL for PDFs and images
        if (isPDF.value || isImage.value) {
            if (props.document.previewUrl) {
                previewUrl.value = props.document.previewUrl
            } else if (props.document._id) {
                // Construct preview URL
                previewUrl.value = `/api/documents/${props.document._id}/preview`
            }
        }

        // Load text content if available
        if (props.document._id) {
            try {
                const response = await apiMethods.documents.preview(props.document._id)
                if (response.data.success && response.data.text) {
                    documentText.value = response.data.text
                }
            } catch (textError) {
                toast.warn('Text preview not available:', textError)
            }
        }

        emit('loaded', props.document)

    } catch (err) {
        error.value = err.message || 'Failed to load document'
        emit('error', err)
    } finally {
        isLoading.value = false
    }
}

const downloadDocument = async () => {
    try {
        isDownloading.value = true

        if (!props.document._id) {
            throw new Error('Document ID not available')
        }

        const response = await apiMethods.documents.download(props.document._id)

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        const fileName = props.document.name ||
            props.document.fileName ||
            `document.${fileExtension.value.toLowerCase()}`

        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()

        // Cleanup
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)

        emit('download', props.document)
        toast.success('Document downloaded successfully')

    } catch (err) {
        error.value = err.message || 'Failed to download document'
        toast.error('Download failed')
    } finally {
        isDownloading.value = false
    }
}

const onPreviewLoad = () => {
    // Preview loaded successfully
}

const onPreviewError = () => {
    error.value = 'Preview could not be loaded'

    // Try to fall back to text mode if available
    if (documentText.value && currentMode.value === 'preview') {
        currentMode.value = 'text'
        error.value = null
    }
}

const formatDate = (dateString) => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString()
    } catch {
        return 'Unknown date'
    }
}

// Watch for document changes
watch(() => props.document, () => {
    if (props.autoLoadPreview) {
        loadDocument()
    }
}, { immediate: true })

// Watch for mode changes
watch(currentMode, (newMode) => {
    // Ensure we have the right data for the mode
    if (newMode === 'text' || newMode === 'raw') {
        if (!documentText.value && props.document._id) {
            loadDocument()
        }
    }
})

// Lifecycle
onMounted(() => {
    if (props.autoLoadPreview) {
        loadDocument()
    }
})
</script>

<style scoped>
.document-viewer {
    display: flex;
    flex-direction: column;
}

.viewer-content-area {
    flex: 1;
    position: relative;
}

.loading-state,
.error-state,
.unsupported-format {
    padding: 2rem;
}

.pdf-preview,
.image-preview {
    height: 100%;
}

.text-preview,
.raw-preview {
    height: 100%;
    overflow: hidden;
}

.text-content,
.raw-content {
    height: 100%;
    overflow: auto;
}

.view-mode-toggle {
    display: flex;
    border: 1px solid rgb(209 213 219);
    border-radius: 0.375rem;
    overflow: hidden;
}

.view-mode-toggle button {
    border: none;
    border-radius: 0;
}

.view-mode-toggle button:not(:last-child) {
    border-right: 1px solid rgb(209 213 219);
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .viewer-header {
        padding: 0.75rem;
    }

    .viewer-header .max-w-48 {
        max-width: 8rem;
    }

    .loading-state,
    .error-state,
    .unsupported-format {
        padding: 1rem;
    }
}
</style>