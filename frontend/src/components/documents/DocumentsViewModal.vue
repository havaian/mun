<template>
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">Committee Documents</h2>
                    <p class="text-sm text-gray-600 mt-1">Resolutions, working papers, and amendments</p>
                </div>
                <div class="flex items-center space-x-3">
                    <!-- Document Type Filter -->
                    <select v-model="selectedType"
                        class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Documents</option>
                        <option value="resolution">Resolutions</option>
                        <option value="working-paper">Working Papers</option>
                        <option value="amendment">Amendments</option>
                        <option value="procedural">Procedural</option>
                    </select>

                    <!-- Status Filter -->
                    <select v-model="selectedStatus"
                        class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="voting">In Voting</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                    </select>

                    <!-- Create Document Button (if allowed) -->
                    <button v-if="canCreateDocument" @click="createDocument" class="btn-primary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Document
                    </button>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="p-6">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="flex items-center space-x-3">
                    <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-gray-600">Loading documents...</span>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredDocuments.length === 0" class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
                <p class="mt-2 text-gray-500">
                    {{ selectedType !== 'all' || selectedStatus !== 'all'
                        ? 'Try adjusting your filters.'
                        : 'No documents have been created yet.' }}
                </p>
            </div>

            <!-- Documents Grid -->
            <div v-else class="space-y-4">
                <div v-for="document in filteredDocuments" :key="document.id"
                    class="card p-6 hover:shadow-medium transition-shadow cursor-pointer"
                    @click="openDocument(document)">
                    <div class="flex items-start justify-between">
                        <!-- Document Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-3 mb-2">
                                <div :class="[
                                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                                    document.type === 'resolution' ? 'bg-blue-100 text-blue-600' :
                                        document.type === 'amendment' ? 'bg-purple-100 text-purple-600' :
                                            document.type === 'working-paper' ? 'bg-green-100 text-green-600' :
                                                'bg-gray-100 text-gray-600'
                                ]">
                                    <component :is="getDocumentIcon(document.type)" class="w-5 h-5" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="text-lg font-medium text-gray-900 truncate">
                                        {{ document.title }}
                                    </h3>
                                    <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {{ document.description || 'No description available' }}
                                    </p>
                                </div>
                            </div>

                            <!-- Document Metadata -->
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span class="flex items-center space-x-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>{{ getAuthorsDisplay(document) }}</span>
                                </span>
                                <span class="flex items-center space-x-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{{ formatTime(document.submittedAt || document.createdAt) }}</span>
                                </span>
                                <span v-if="document.version > 1" class="flex items-center space-x-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>v{{ document.version }}</span>
                                </span>
                            </div>

                            <!-- Coalition Info (if applicable) -->
                            <div v-if="document.coalition" class="mt-2">
                                <span class="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                    Coalition: {{ document.coalition.name }}
                                </span>
                            </div>
                        </div>

                        <!-- Document Status and Actions -->
                        <div class="flex flex-col items-end space-y-2">
                            <!-- Status Badge -->
                            <span :class="[
                                'px-3 py-1 text-xs font-semibold rounded-full',
                                document.status === 'passed' ? 'bg-green-100 text-green-800' :
                                    document.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        document.status === 'voting' ? 'bg-blue-100 text-blue-800' :
                                            document.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                document.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                            ]">
                                {{ getStatusDisplay(document.status) }}
                            </span>

                            <!-- Quick Actions -->
                            <div class="flex items-center space-x-2">
                                <button @click.stop="downloadDocument(document)"
                                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Download">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>

                                <!-- More Actions Menu -->
                                <div class="relative">
                                    <button @click.stop="toggleActionsMenu(document.id)"
                                        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>

                                    <!-- Actions Dropdown -->
                                    <div v-if="activeActionsMenu === document.id"
                                        class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-strong border border-gray-200 z-10">
                                        <div class="py-1">
                                            <button v-if="canEditDocument(document)" @click="editDocument(document)"
                                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Edit Document
                                            </button>

                                            <button v-if="document.status === 'approved' && !document.votingId"
                                                @click="startVoting(document)"
                                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Start Voting
                                            </button>

                                            <button v-if="canCreateAmendment(document)"
                                                @click="createAmendment(document)"
                                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Propose Amendment
                                            </button>

                                            <button @click="viewHistory(document)"
                                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                View History
                                            </button>

                                            <button v-if="canDeleteDocument(document)" @click="deleteDocument(document)"
                                                class="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                                                Delete Document
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Voting Results (if available) -->
                            <div v-if="document.votingResults" class="text-xs text-gray-500 text-right">
                                <div>{{ document.votingResults.votesFor }}F {{ document.votingResults.votesAgainst }}A
                                    {{ document.votingResults.abstentions }}Ab</div>
                                <div>{{ document.votingResults.totalVotes }} votes</div>
                            </div>
                        </div>
                    </div>

                    <!-- Amendments (if any) -->
                    <div v-if="document.amendments && document.amendments.length > 0"
                        class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-medium text-gray-700">Amendments ({{ document.amendments.length }})
                            </h4>
                            <button @click.stop="toggleAmendments(document.id)"
                                class="text-xs text-blue-600 hover:text-blue-700">
                                {{ expandedAmendments.includes(document.id) ? 'Hide' : 'Show' }}
                            </button>
                        </div>

                        <div v-if="expandedAmendments.includes(document.id)" class="space-y-2">
                            <div v-for="amendment in document.amendments.slice(0, 3)" :key="amendment.id"
                                class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                    <span class="text-sm font-medium">{{ amendment.title }}</span>
                                    <span class="text-xs text-gray-500 ml-2">by {{ amendment.author }}</span>
                                </div>
                                <span :class="[
                                    'px-2 py-1 text-xs rounded-full',
                                    amendment.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        amendment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                ]">
                                    {{ amendment.status }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                    {{ filteredDocuments.length }} document{{ filteredDocuments.length !== 1 ? 's' : '' }} found
                </div>
                <button @click="$emit('close')" class="btn-secondary">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/websocket'

const emit = defineEmits(['close'])
const props = defineProps({
    committeeId: {
        type: String,
        required: true
    }
})

const authStore = useAuthStore()
const socketStore = useSocketStore()

// State
const documents = ref([])
const isLoading = ref(true)
const selectedType = ref('all')
const selectedStatus = ref('all')
const activeActionsMenu = ref(null)
const expandedAmendments = ref([])

// Computed
const filteredDocuments = computed(() => {
    let filtered = documents.value

    if (selectedType.value !== 'all') {
        filtered = filtered.filter(doc => doc.type === selectedType.value)
    }

    if (selectedStatus.value !== 'all') {
        filtered = filtered.filter(doc => doc.status === selectedStatus.value)
    }

    return filtered.sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt))
})

const canCreateDocument = computed(() => {
    return authStore.user?.role === 'delegate' || authStore.user?.presidiumRole
})

// Methods
async function fetchDocuments() {
    try {
        isLoading.value = true

        const response = await authStore.apiCall(`/committee/${props.committeeId}/documents`)
        if (response.ok) {
            const data = await response.json()
            documents.value = data.documents || []
        }
    } catch (error) {
        console.error('Fetch documents error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to load documents'
        })
    } finally {
        isLoading.value = false
    }
}

function createDocument() {
    window.openModal({
        component: 'CreateDocumentModal',
        size: 'xl',
        props: {
            committeeId: props.committeeId,
            onSuccess: (newDocument) => {
                documents.value.unshift(newDocument)
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Document created successfully'
                })
            }
        }
    })
}

function openDocument(document) {
    activeActionsMenu.value = null

    window.openModal({
        component: 'DocumentViewModal',
        size: 'xl',
        props: {
            document,
            onUpdate: (updatedDoc) => {
                const index = documents.value.findIndex(d => d.id === document.id)
                if (index !== -1) {
                    documents.value[index] = updatedDoc
                }
            }
        }
    })
}

function editDocument(document) {
    activeActionsMenu.value = null

    window.openModal({
        component: 'EditDocumentModal',
        size: 'xl',
        props: {
            document,
            onUpdate: (updatedDoc) => {
                const index = documents.value.findIndex(d => d.id === document.id)
                if (index !== -1) {
                    documents.value[index] = updatedDoc
                }
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Document updated successfully'
                })
            }
        }
    })
}

function createAmendment(document) {
    activeActionsMenu.value = null

    window.openModal({
        component: 'CreateAmendmentModal',
        size: 'lg',
        props: {
            parentDocument: document,
            onSuccess: (amendment) => {
                // Add amendment to document
                if (!document.amendments) {
                    document.amendments = []
                }
                document.amendments.unshift(amendment)

                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Amendment proposed successfully'
                })
            }
        }
    })
}

async function startVoting(document) {
    activeActionsMenu.value = null

    // Only presidium can start voting
    if (!authStore.user?.presidiumRole) {
        window.showNotification({
            type: 'error',
            title: 'Access Denied',
            message: 'Only presidium members can start voting'
        })
        return
    }

    window.openModal({
        component: 'StartVotingModal',
        props: {
            document,
            onSuccess: (votingId) => {
                document.status = 'voting'
                document.votingId = votingId

                window.showNotification({
                    type: 'success',
                    title: 'Voting Started',
                    message: 'Voting has been initiated for this document'
                })
            }
        }
    })
}

function viewHistory(document) {
    activeActionsMenu.value = null

    window.openModal({
        component: 'DocumentHistoryModal',
        size: 'lg',
        props: { document }
    })
}

async function deleteDocument(document) {
    activeActionsMenu.value = null

    const confirmed = await showConfirmDialog({
        title: 'Delete Document',
        message: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger'
    })

    if (confirmed) {
        try {
            const response = await authStore.apiCall(`/documents/${document.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                documents.value = documents.value.filter(d => d.id !== document.id)
                window.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Document deleted successfully'
                })
            }
        } catch (error) {
            console.error('Delete document error:', error)
            window.showNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete document'
            })
        }
    }
}

async function downloadDocument(document) {
    try {
        const response = await authStore.apiCall(`/documents/${document.id}/download`)
        if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = window.document.createElement('a')
            a.href = url
            a.download = `${document.title}.pdf`
            window.document.body.appendChild(a)
            a.click()
            window.document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        }
    } catch (error) {
        console.error('Download document error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to download document'
        })
    }
}

function toggleActionsMenu(documentId) {
    activeActionsMenu.value = activeActionsMenu.value === documentId ? null : documentId
}

function toggleAmendments(documentId) {
    const index = expandedAmendments.value.indexOf(documentId)
    if (index > -1) {
        expandedAmendments.value.splice(index, 1)
    } else {
        expandedAmendments.value.push(documentId)
    }
}

function canEditDocument(document) {
    // Can edit if: own document and status is draft, or presidium member
    return (document.authors?.includes(authStore.user?.country) && document.status === 'draft') ||
        authStore.user?.presidiumRole
}

function canCreateAmendment(document) {
    // Can create amendment if document is approved or in voting
    return ['approved', 'voting'].includes(document.status) && authStore.user?.role === 'delegate'
}

function canDeleteDocument(document) {
    // Can delete if: own document and status is draft, or presidium member
    return (document.authors?.includes(authStore.user?.country) && document.status === 'draft') ||
        authStore.user?.presidiumRole
}

function getDocumentIcon(type) {
    const icons = {
        resolution: {
            template: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      `
        },
        amendment: {
            template: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      `
        },
        'working-paper': {
            template: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      `
        }
    }
    return icons[type] || icons.resolution
}

function getStatusDisplay(status) {
    const statusMap = {
        'draft': 'Draft',
        'submitted': 'Submitted',
        'approved': 'Approved',
        'voting': 'In Voting',
        'passed': 'Passed',
        'failed': 'Failed',
        'rejected': 'Rejected'
    }
    return statusMap[status] || status
}

function getAuthorsDisplay(document) {
    if (document.authors?.length > 0) {
        if (document.authors.length === 1) {
            return document.authors[0]
        } else if (document.authors.length <= 3) {
            return document.authors.join(', ')
        } else {
            return `${document.authors[0]} +${document.authors.length - 1} others`
        }
    }
    return 'Unknown Author'
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

async function showConfirmDialog({ title, message, confirmText, confirmType }) {
    return new Promise((resolve) => {
        window.openModal({
            component: 'ConfirmDialog',
            props: {
                title,
                message,
                confirmText,
                confirmType,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            }
        })
    })
}

// Initialize
onMounted(() => {
    fetchDocuments()

    // Listen for real-time document updates
    const unsubscribe = socketStore.subscribe(`committee:${props.committeeId}:documents`, (data) => {
        if (data.action === 'created') {
            documents.value.unshift(data.document)
        } else if (data.action === 'updated') {
            const index = documents.value.findIndex(d => d.id === data.document.id)
            if (index !== -1) {
                documents.value[index] = data.document
            }
        } else if (data.action === 'deleted') {
            documents.value = documents.value.filter(d => d.id !== data.documentId)
        }
    })

    onUnmounted(unsubscribe)
})

// Close menu when clicking outside
onMounted(() => {
    const handleClickOutside = () => {
        activeActionsMenu.value = null
    }

    document.addEventListener('click', handleClickOutside)

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
    })
})
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>