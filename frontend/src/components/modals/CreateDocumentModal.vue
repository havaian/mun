<template>
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Create New Document</h2>
            <p class="text-sm text-gray-600 mt-1">Draft a resolution, working paper, or amendment</p>
        </div>

        <!-- Document Creation Method Selection -->
        <div v-if="!selectedMethod" class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Choose Creation Method</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Built-in Editor -->
                <button @click="selectMethod('editor')"
                    class="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">Built-in Editor</h4>
                            <p class="text-sm text-gray-600">Use structured templates</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-700">
                        Create documents using our built-in editor with UN-standard templates for resolutions and
                        working papers.
                    </p>
                    <div class="mt-3 flex items-center text-sm text-green-600">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Recommended for beginners
                    </div>
                </button>

                <!-- File Upload -->
                <button @click="selectMethod('upload')"
                    class="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">File Upload</h4>
                            <p class="text-sm text-gray-600">Upload ready documents</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-700">
                        Upload completed documents created in Microsoft Word, Google Docs, or other editors.
                    </p>
                    <div class="mt-3 text-sm text-gray-600">
                        Supports: PDF, DOCX, RTF (max 10MB)
                    </div>
                </button>

                <!-- Google Docs Integration -->
                <button @click="selectMethod('google-docs')"
                    class="p-6 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left">
                    <div class="flex items-center space-x-3 mb-3">
                        <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">Google Docs</h4>
                            <p class="text-sm text-gray-600">Collaborative editing</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-700">
                        Link a Google Docs document for real-time collaborative editing with your coalition members.
                    </p>
                    <div class="mt-3 flex items-center text-sm text-blue-600">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Best for collaboration
                    </div>
                </button>
            </div>
        </div>

        <!-- Document Creation Forms -->
        <div v-else class="p-6">
            <!-- Back Button -->
            <button @click="selectedMethod = null"
                class="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to method selection
            </button>

            <!-- Built-in Editor Form -->
            <div v-if="selectedMethod === 'editor'">
                <form @submit.prevent="handleEditorSubmit" class="space-y-6">
                    <!-- Document Type -->
                    <div>
                        <label for="documentType" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Type *
                        </label>
                        <select id="documentType" v-model="editorForm.documentType" class="input"
                            :class="{ 'input-error': errors.documentType }" @change="loadTemplate" required>
                            <option value="">Select document type</option>
                            <option value="resolution">Draft Resolution</option>
                            <option value="working-paper">Working Paper</option>
                            <option value="amendment">Amendment</option>
                            <option value="procedural">Procedural Motion</option>
                        </select>
                        <p v-if="errors.documentType" class="mt-1 text-sm text-red-600">{{ errors.documentType }}</p>
                    </div>

                    <!-- Title -->
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Title *
                        </label>
                        <input id="title" v-model="editorForm.title" type="text"
                            placeholder="e.g., Strengthening International Climate Action" class="input"
                            :class="{ 'input-error': errors.title }" required />
                        <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
                    </div>

                    <!-- Template Selection -->
                    <div v-if="availableTemplates.length > 0">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Choose Template
                        </label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button v-for="template in availableTemplates" :key="template.id" type="button"
                                @click="selectTemplate(template)" :class="[
                                    'p-4 border-2 rounded-lg text-left transition-colors',
                                    selectedTemplate?.id === template.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                ]">
                                <h4 class="font-medium text-gray-900">{{ template.name }}</h4>
                                <p class="text-sm text-gray-600 mt-1">{{ template.description }}</p>
                            </button>
                        </div>
                    </div>

                    <!-- Content Editor -->
                    <div>
                        <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Content *
                        </label>
                        <textarea id="content" v-model="editorForm.content" rows="15"
                            placeholder="Start writing your document content here..."
                            class="input resize-none font-mono text-sm" :class="{ 'input-error': errors.content }"
                            required></textarea>
                        <p v-if="errors.content" class="mt-1 text-sm text-red-600">{{ errors.content }}</p>
                        <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>{{ editorForm.content.length }} characters</span>
                            <button type="button" @click="showTemplateHelper = true"
                                class="text-blue-600 hover:text-blue-700">
                                Formatting Help
                            </button>
                        </div>
                    </div>

                    <!-- Coalition Selection -->
                    <div v-if="availableCoalitions.length > 0">
                        <label for="coalitionId" class="block text-sm font-medium text-gray-700 mb-2">
                            Coalition (Optional)
                        </label>
                        <select id="coalitionId" v-model="editorForm.coalitionId" class="input">
                            <option value="">Individual submission</option>
                            <option v-for="coalition in availableCoalitions" :key="coalition.id" :value="coalition.id">
                                {{ coalition.name }} ({{ coalition.members.length }} members)
                            </option>
                        </select>
                        <p class="mt-1 text-xs text-gray-500">
                            Submit as part of a coalition for joint authorship
                        </p>
                    </div>
                </form>
            </div>

            <!-- File Upload Form -->
            <div v-if="selectedMethod === 'upload'">
                <form @submit.prevent="handleUploadSubmit" class="space-y-6">
                    <!-- Document Type -->
                    <div>
                        <label for="uploadDocumentType" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Type *
                        </label>
                        <select id="uploadDocumentType" v-model="uploadForm.documentType" class="input"
                            :class="{ 'input-error': errors.documentType }" required>
                            <option value="">Select document type</option>
                            <option value="resolution">Draft Resolution</option>
                            <option value="working-paper">Working Paper</option>
                            <option value="amendment">Amendment</option>
                            <option value="procedural">Procedural Motion</option>
                        </select>
                        <p v-if="errors.documentType" class="mt-1 text-sm text-red-600">{{ errors.documentType }}</p>
                    </div>

                    <!-- Title -->
                    <div>
                        <label for="uploadTitle" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Title *
                        </label>
                        <input id="uploadTitle" v-model="uploadForm.title" type="text"
                            placeholder="e.g., Strengthening International Climate Action" class="input"
                            :class="{ 'input-error': errors.title }" required />
                        <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
                    </div>

                    <!-- File Upload -->
                    <div>
                        <label for="file" class="block text-sm font-medium text-gray-700 mb-2">
                            Document File *
                        </label>
                        <div
                            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                            <div class="space-y-1 text-center">
                                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none"
                                    viewBox="0 0 48 48">
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <div class="flex text-sm text-gray-600">
                                    <label for="file-upload"
                                        class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" ref="fileInput" type="file" class="sr-only"
                                            accept=".pdf,.docx,.rtf" @change="handleFileSelect" />
                                    </label>
                                    <p class="pl-1">or drag and drop</p>
                                </div>
                                <p class="text-xs text-gray-500">
                                    PDF, DOCX, RTF up to 10MB
                                </p>
                            </div>
                        </div>
                        <p v-if="errors.file" class="mt-1 text-sm text-red-600">{{ errors.file }}</p>

                        <!-- Selected File Display -->
                        <div v-if="selectedFile" class="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                                    <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                                </div>
                                <button type="button" @click="removeFile" class="text-red-600 hover:text-red-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <label for="uploadDescription" class="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea id="uploadDescription" v-model="uploadForm.description" rows="3"
                            placeholder="Brief description of the document content..."
                            class="input resize-none"></textarea>
                    </div>
                </form>
            </div>

            <!-- Google Docs Form -->
            <div v-if="selectedMethod === 'google-docs'">
                <form @submit.prevent="handleGoogleDocsSubmit" class="space-y-6">
                    <!-- Document Type -->
                    <div>
                        <label for="googleDocsType" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Type *
                        </label>
                        <select id="googleDocsType" v-model="googleDocsForm.documentType" class="input"
                            :class="{ 'input-error': errors.documentType }" required>
                            <option value="">Select document type</option>
                            <option value="resolution">Draft Resolution</option>
                            <option value="working-paper">Working Paper</option>
                            <option value="amendment">Amendment</option>
                            <option value="procedural">Procedural Motion</option>
                        </select>
                        <p v-if="errors.documentType" class="mt-1 text-sm text-red-600">{{ errors.documentType }}</p>
                    </div>

                    <!-- Title -->
                    <div>
                        <label for="googleDocsTitle" class="block text-sm font-medium text-gray-700 mb-2">
                            Document Title *
                        </label>
                        <input id="googleDocsTitle" v-model="googleDocsForm.title" type="text"
                            placeholder="e.g., Strengthening International Climate Action" class="input"
                            :class="{ 'input-error': errors.title }" required />
                        <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
                    </div>

                    <!-- Google Docs URL -->
                    <div>
                        <label for="googleDocsUrl" class="block text-sm font-medium text-gray-700 mb-2">
                            Google Docs Link *
                        </label>
                        <input id="googleDocsUrl" v-model="googleDocsForm.googleDocsUrl" type="url"
                            placeholder="https://docs.google.com/document/d/..." class="input"
                            :class="{ 'input-error': errors.googleDocsUrl }" required />
                        <p v-if="errors.googleDocsUrl" class="mt-1 text-sm text-red-600">{{ errors.googleDocsUrl }}</p>
                        <div class="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div class="flex">
                                <svg class="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clip-rule="evenodd" />
                                </svg>
                                <div class="ml-3">
                                    <h4 class="text-sm font-medium text-yellow-800">Sharing Requirements</h4>
                                    <p class="mt-1 text-sm text-yellow-700">
                                        Ensure the document is shared with "Anyone with the link can view" permissions
                                        for the system to access it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coalition Selection -->
                    <div v-if="availableCoalitions.length > 0">
                        <label for="googleDocsCoalition" class="block text-sm font-medium text-gray-700 mb-2">
                            Coalition *
                        </label>
                        <select id="googleDocsCoalition" v-model="googleDocsForm.coalitionId" class="input"
                            :class="{ 'input-error': errors.coalitionId }" required>
                            <option value="">Select coalition</option>
                            <option v-for="coalition in availableCoalitions" :key="coalition.id" :value="coalition.id">
                                {{ coalition.name }} ({{ coalition.members.length }} members)
                            </option>
                        </select>
                        <p v-if="errors.coalitionId" class="mt-1 text-sm text-red-600">{{ errors.coalitionId }}</p>
                        <p class="mt-1 text-xs text-gray-500">
                            Google Docs integration requires coalition collaboration
                        </p>
                    </div>
                </form>
            </div>

            <!-- Error Display -->
            <div v-if="submitError" class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error creating document</h3>
                        <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="selectedMethod" class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button type="button" @click="$emit('close')" :disabled="isSubmitting" class="btn-secondary">
                Cancel
            </button>
            <button @click="handleSubmit" :disabled="isSubmitting || !isFormValid" class="btn-primary">
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                {{ isSubmitting ? 'Creating Document...' : 'Create Document' }}
            </button>
        </div>

        <!-- Template Helper Modal -->
        <div v-if="showTemplateHelper"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-strong max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Document Formatting Guide</h3>
                        <button @click="showTemplateHelper = false" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4 text-sm">
                        <div>
                            <h4 class="font-medium text-gray-900">Resolution Structure:</h4>
                            <ul class="mt-2 space-y-1 text-gray-700 list-disc list-inside">
                                <li>Preambular clauses: "Recognizing...", "Noting with concern...", "Affirming..."</li>
                                <li>Operative clauses: "1. Calls upon...", "2. Requests...", "3. Decides..."</li>
                                <li>End preambular clauses with commas, operative clauses with semicolons</li>
                                <li>Final operative clause ends with a period</li>
                            </ul>
                        </div>

                        <div>
                            <h4 class="font-medium text-gray-900">Common Phrases:</h4>
                            <ul class="mt-2 space-y-1 text-gray-700 list-disc list-inside">
                                <li><strong>Preambular:</strong> Recalling, Reaffirming, Bearing in mind, Deeply
                                    concerned</li>
                                <li><strong>Operative:</strong> Urges, Encourages, Invites, Recommends, Emphasizes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close', 'success'])
const props = defineProps({
    committeeId: {
        type: String,
        required: true
    }
})

const authStore = useAuthStore()

// State
const selectedMethod = ref(null)
const availableTemplates = ref([])
const selectedTemplate = ref(null)
const availableCoalitions = ref([])
const selectedFile = ref(null)
const isSubmitting = ref(false)
const submitError = ref('')
const showTemplateHelper = ref(false)

// Forms
const editorForm = reactive({
    documentType: '',
    title: '',
    content: '',
    coalitionId: ''
})

const uploadForm = reactive({
    documentType: '',
    title: '',
    description: '',
    file: null
})

const googleDocsForm = reactive({
    documentType: '',
    title: '',
    googleDocsUrl: '',
    coalitionId: ''
})

const errors = reactive({})
const fileInput = ref(null)

// Computed
const isFormValid = computed(() => {
    if (selectedMethod.value === 'editor') {
        return editorForm.documentType && editorForm.title.trim() && editorForm.content.trim()
    } else if (selectedMethod.value === 'upload') {
        return uploadForm.documentType && uploadForm.title.trim() && selectedFile.value
    } else if (selectedMethod.value === 'google-docs') {
        return googleDocsForm.documentType && googleDocsForm.title.trim() &&
            googleDocsForm.googleDocsUrl.trim() && googleDocsForm.coalitionId
    }
    return false
})

// Methods
function selectMethod(method) {
    selectedMethod.value = method
    if (method === 'editor') {
        loadTemplates()
    }
    fetchCoalitions()
}

async function loadTemplates() {
    try {
        const response = await authStore.apiCall(`/documents/templates?type=${editorForm.documentType}`)
        if (response.ok) {
            const data = await response.json()
            availableTemplates.value = data.templates || []
        }
    } catch (error) {
        console.error('Load templates error:', error)
    }
}

async function fetchCoalitions() {
    try {
        const response = await authStore.apiCall(`/delegate/coalitions?committeeId=${props.committeeId}&status=active`)
        if (response.ok) {
            const data = await response.json()
            availableCoalitions.value = data.coalitions || []
        }
    } catch (error) {
        console.error('Fetch coalitions error:', error)
    }
}

function selectTemplate(template) {
    selectedTemplate.value = template
    editorForm.content = template.content || ''
}

function loadTemplate() {
    if (editorForm.documentType) {
        loadTemplates()
    }
}

function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (file) {
        // Validate file
        const maxSize = 10 * 1024 * 1024 // 10MB
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/rtf']

        if (file.size > maxSize) {
            errors.file = 'File size must be less than 10MB'
            return
        }

        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|docx|rtf)$/)) {
            errors.file = 'Only PDF, DOCX, and RTF files are allowed'
            return
        }

        selectedFile.value = file
        uploadForm.file = file
        errors.file = ''
    }
}

function removeFile() {
    selectedFile.value = null
    uploadForm.file = null
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function validateForm() {
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key])

    const form = selectedMethod.value === 'editor' ? editorForm :
        selectedMethod.value === 'upload' ? uploadForm :
            googleDocsForm

    // Common validations
    if (!form.documentType) {
        errors.documentType = 'Document type is required'
    }

    if (!form.title?.trim()) {
        errors.title = 'Document title is required'
    } else if (form.title.length < 5) {
        errors.title = 'Title must be at least 5 characters'
    }

    // Method-specific validations
    if (selectedMethod.value === 'editor') {
        if (!editorForm.content?.trim()) {
            errors.content = 'Document content is required'
        } else if (editorForm.content.length < 100) {
            errors.content = 'Content must be at least 100 characters'
        }
    } else if (selectedMethod.value === 'upload') {
        if (!selectedFile.value) {
            errors.file = 'Please select a file to upload'
        }
    } else if (selectedMethod.value === 'google-docs') {
        if (!googleDocsForm.googleDocsUrl?.trim()) {
            errors.googleDocsUrl = 'Google Docs URL is required'
        } else if (!isValidGoogleDocsUrl(googleDocsForm.googleDocsUrl)) {
            errors.googleDocsUrl = 'Please enter a valid Google Docs URL'
        }

        if (!googleDocsForm.coalitionId) {
            errors.coalitionId = 'Coalition selection is required for Google Docs integration'
        }
    }

    return Object.keys(errors).length === 0
}

function isValidGoogleDocsUrl(url) {
    return url.includes('docs.google.com/document/d/')
}

async function handleSubmit() {
    if (!validateForm()) {
        return
    }

    if (selectedMethod.value === 'editor') {
        await handleEditorSubmit()
    } else if (selectedMethod.value === 'upload') {
        await handleUploadSubmit()
    } else if (selectedMethod.value === 'google-docs') {
        await handleGoogleDocsSubmit()
    }
}

async function handleEditorSubmit() {
    isSubmitting.value = true
    submitError.value = ''

    try {
        const documentData = {
            type: editorForm.documentType,
            title: editorForm.title.trim(),
            content: editorForm.content.trim(),
            coalitionId: editorForm.coalitionId || null,
            templateId: selectedTemplate.value?.id || null,
            method: 'editor'
        }

        const response = await authStore.apiCall('/documents', {
            method: 'POST',
            body: JSON.stringify(documentData)
        })

        if (response.ok) {
            const data = await response.json()
            emit('success', data.document)
            emit('close')
        } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to create document')
        }
    } catch (error) {
        console.error('Create document error:', error)
        submitError.value = error.message || 'An unexpected error occurred'
    } finally {
        isSubmitting.value = false
    }
}

async function handleUploadSubmit() {
    isSubmitting.value = true
    submitError.value = ''

    try {
        const formData = new FormData()
        formData.append('type', uploadForm.documentType)
        formData.append('title', uploadForm.title.trim())
        formData.append('description', uploadForm.description.trim())
        formData.append('file', selectedFile.value)
        formData.append('method', 'upload')

        const response = await authStore.apiCall('/documents', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type for FormData
        })

        if (response.ok) {
            const data = await response.json()
            emit('success', data.document)
            emit('close')
        } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to upload document')
        }
    } catch (error) {
        console.error('Upload document error:', error)
        submitError.value = error.message || 'An unexpected error occurred'
    } finally {
        isSubmitting.value = false
    }
}

async function handleGoogleDocsSubmit() {
    isSubmitting.value = true
    submitError.value = ''

    try {
        const documentData = {
            type: googleDocsForm.documentType,
            title: googleDocsForm.title.trim(),
            googleDocsUrl: googleDocsForm.googleDocsUrl.trim(),
            coalitionId: googleDocsForm.coalitionId,
            method: 'google-docs'
        }

        const response = await authStore.apiCall('/documents', {
            method: 'POST',
            body: JSON.stringify(documentData)
        })

        if (response.ok) {
            const data = await response.json()
            emit('success', data.document)
            emit('close')
        } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to link Google Docs')
        }
    } catch (error) {
        console.error('Link Google Docs error:', error)
        submitError.value = error.message || 'An unexpected error occurred'
    } finally {
        isSubmitting.value = false
    }
}

// Initialize
onMounted(() => {
    // Set default templates
    availableTemplates.value = [
        {
            id: 'resolution-basic',
            name: 'Basic Resolution',
            description: 'Standard UN resolution template with preambular and operative clauses',
            content: `The [Committee Name],

Recalling its previous resolutions on this matter,

Recognizing the importance of international cooperation,

Noting with concern the current challenges,

1. Calls upon all Member States to...;

2. Requests the Secretary-General to...;

3. Decides to remain actively seized of the matter.`
        },
        {
            id: 'working-paper-basic',
            name: 'Working Paper',
            description: 'Template for working papers and preliminary documents',
            content: `WORKING PAPER

Topic: [Your Topic Here]

Submitted by: [Country/Coalition Name]

Issue: [Brief description of the issue]

Background: [Relevant background information]

Proposed Solutions:
1. [First solution]
2. [Second solution]
3. [Third solution]

Implementation: [How to implement these solutions]`
        }
    ]
})
</script>