<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between p-6 border-b border-mun-gray-200">
                        <div>
                            <h2 class="text-xl font-bold text-mun-gray-900">
                                Login Links Generation - {{ committee?.name }}
                            </h2>
                            <p class="text-sm text-mun-gray-600 mt-1">
                                Generate and manage login links for committee access
                            </p>
                        </div>

                        <button @click="close" class="p-2 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div class="p-6 space-y-8">
                            <!-- Generation Status -->
                            <div v-if="committee?.linksGenerated"
                                class="bg-mun-green-50 border border-mun-green-200 rounded-xl p-4">
                                <div class="flex items-center">
                                    <CheckCircleIcon class="w-6 h-6 text-mun-green-600 mr-3" />
                                    <div>
                                        <h3 class="font-medium text-mun-green-900">Login Links Generated</h3>
                                        <p class="text-sm text-mun-green-700 mt-1">
                                            Login links have been generated for this committee. You can download or
                                            regenerate them below.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Link Generation Options -->
                            <div class="mt-2 space-y-2">
                                <h3 class="text-lg font-semibold text-mun-gray-900">
                                    Generation Options
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Presidium Login Links -->
                                    <div class="border border-mun-gray-200 rounded-xl p-6">
                                        <div class="flex items-center mb-4">
                                            <div
                                                class="w-10 h-10 bg-mun-purple-100 rounded-lg flex items-center justify-center mr-3">
                                                <ShieldCheckIcon class="w-5 h-5 text-mun-purple-600" />
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-mun-gray-900">Presidium Login Links</h4>
                                                <p class="text-sm text-mun-gray-600">For committee presidium members</p>
                                            </div>
                                        </div>

                                        <div class="space-y-3 mb-4">
                                            <div v-for="member in presidiumMembers" :key="member.role"
                                                class="flex items-center justify-between">
                                                <div class="flex items-center space-x-3">
                                                    <div :class="[
                                                        'w-3 h-3 rounded-full',
                                                        member.linksGenerated ? 'bg-mun-green-500' : 'bg-mun-gray-300'
                                                    ]"></div>
                                                    <span class="text-sm font-medium">{{
                                                        formatPresidiumRole(member.role) }}</span>
                                                </div>
                                                <div class="text-xs text-mun-gray-500">
                                                    {{ member.linksGenerated ? 'Generated' : 'Pending' }}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex space-x-2">
                                            <AppButton variant="outline" size="sm" @click="generatePresidiumLinks"
                                                :loading="isGeneratingPresidium" class="flex-1">
                                                {{ hasPresidiumLinks ? 'Regenerate' : 'Generate' }}
                                            </AppButton>

                                            <AppButton v-if="hasPresidiumLinks" variant="outline" size="sm"
                                                @click="downloadPresidiumLinks" :loading="isDownloadingPresidium">
                                                <DocumentArrowDownIcon class="w-4 h-4" />
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Delegate Login Links -->
                                    <div class="border border-mun-gray-200 rounded-xl p-6">
                                        <div class="flex items-center mb-4">
                                            <div
                                                class="w-10 h-10 bg-mun-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                <UserGroupIcon class="w-5 h-5 text-mun-blue" />
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-mun-gray-900">Delegate Login Links</h4>
                                                <p class="text-sm text-mun-gray-600">For country delegates</p>
                                            </div>
                                        </div>

                                        <div class="mb-4">
                                            <div class="text-center">
                                                <div class="text-2xl font-bold text-mun-gray-900">
                                                    {{ committee?.countries?.length || 0 }}
                                                </div>
                                                <div class="text-sm text-mun-gray-600">Countries assigned</div>
                                            </div>
                                        </div>

                                        <div class="flex space-x-2">
                                            <AppButton variant="outline" size="sm" @click="generateDelegateLinks"
                                                :loading="isGeneratingDelegates"
                                                :disabled="!committee?.countries?.length" class="flex-1">
                                                {{ hasDelegateLinks ? 'Regenerate' : 'Generate' }}
                                            </AppButton>

                                            <AppButton v-if="hasDelegateLinks" variant="outline" size="sm"
                                                @click="downloadDelegateLinks" :loading="isDownloadingDelegates">
                                                <DocumentArrowDownIcon class="w-4 h-4" />
                                            </AppButton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Bulk Actions -->
                                <div class="border border-mun-gray-200 rounded-xl p-6 bg-mun-gray-50">
                                    <div class="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 class="font-medium text-mun-gray-900">Bulk Actions</h4>
                                            <p class="text-sm text-mun-gray-600">Generate and download all login links
                                                at
                                                once</p>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <AppButton variant="outline" size="sm" @click="refreshStatus"
                                                :loading="isRefreshing">
                                                <ArrowPathIcon class="w-4 h-4 mr-2" />
                                                Refresh
                                            </AppButton>
                                        </div>
                                    </div>

                                    <div class="flex space-x-3">
                                        <AppButton variant="primary" @click="generateAllLinks"
                                            :loading="isGeneratingAll" :disabled="!committee?.countries?.length">
                                            <LinkIcon class="w-4 h-4 mr-2" />
                                            Generate All Login Links
                                        </AppButton>

                                        <AppButton v-if="hasAnyLinks" variant="outline" @click="downloadCompleteLinks"
                                            :loading="isDownloadingComplete">
                                            <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                                            Download Complete File
                                        </AppButton>
                                    </div>
                                </div>

                                <!-- Generated Links Preview -->
                                <div v-if="showLinksPreview && (generatedDelegateLinks.length > 0 || generatedPresidiumLinks.length > 0)"
                                    class="border border-mun-gray-200 rounded-xl p-6">
                                    <div class="flex items-center justify-between mb-4">
                                        <h4 class="font-medium text-mun-gray-900">Generated Links</h4>
                                        <div class="flex space-x-2">
                                            <AppButton variant="ghost" size="sm" @click="copyAllLinks">
                                                <ClipboardDocumentIcon class="w-4 h-4 mr-1" />
                                                Copy All
                                            </AppButton>
                                            <AppButton variant="ghost" size="sm" @click="showLinksPreview = false">
                                                <XMarkIcon class="w-4 h-4" />
                                            </AppButton>
                                        </div>
                                    </div>

                                    <div class="space-y-4 max-h-64 overflow-y-auto">
                                        <!-- Presidium Links -->
                                        <div v-if="generatedPresidiumLinks.length > 0">
                                            <h5 class="text-sm font-medium text-mun-gray-700 mb-2">Presidium</h5>
                                            <div class="space-y-2">
                                                <div v-for="link in generatedPresidiumLinks" :key="link.role"
                                                    class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                                    <div>
                                                        <p class="text-sm font-medium text-mun-gray-900">{{
                                                            formatPresidiumRole(link.role) }}</p>
                                                        <p class="text-xs text-mun-gray-600 font-mono">{{ link.link }}
                                                        </p>
                                                    </div>
                                                    <AppButton variant="ghost" size="xs" @click="copyLink(link.link)">
                                                        <ClipboardDocumentIcon class="w-3 h-3" />
                                                    </AppButton>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Delegate Links -->
                                        <div v-if="generatedDelegateLinks.length > 0">
                                            <h5 class="text-sm font-medium text-mun-gray-700 mb-2">Delegates</h5>
                                            <div class="space-y-2">
                                                <div v-for="link in generatedDelegateLinks" :key="link.country"
                                                    class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                                                    <div>
                                                        <p class="text-sm font-medium text-mun-gray-900">{{ link.country
                                                            }}</p>
                                                        <p class="text-xs text-mun-gray-600 font-mono">{{ link.link }}
                                                        </p>
                                                    </div>
                                                    <AppButton variant="ghost" size="xs" @click="copyLink(link.link)">
                                                        <ClipboardDocumentIcon class="w-3 h-3" />
                                                    </AppButton>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Generation History -->
                            <div v-if="generationHistory.length > 0" class="space-y-4">
                                <h3 class="text-lg font-semibold text-mun-gray-900">
                                    Recent Activity
                                </h3>

                                <div class="bg-white border border-mun-gray-200 rounded-xl overflow-hidden">
                                    <div class="max-h-64 overflow-y-auto">
                                        <div v-for="item in generationHistory" :key="item.id"
                                            class="flex items-center justify-between p-4 border-b border-mun-gray-100 last:border-b-0">
                                            <div class="flex items-center space-x-3">
                                                <div :class="[
                                                    'w-2 h-2 rounded-full',
                                                    item.status === 'success' ? 'bg-mun-green-500' :
                                                        item.status === 'error' ? 'bg-mun-red-500' : 'bg-mun-yellow-500'
                                                ]"></div>
                                                <div>
                                                    <p class="text-sm font-medium text-mun-gray-900">{{ item.action }}
                                                    </p>
                                                    <p class="text-xs text-mun-gray-500">
                                                        {{ formatDate(item.timestamp) }}
                                                    </p>
                                                </div>
                                            </div>

                                            <div v-if="item.filename" class="flex items-center space-x-2">
                                                <span class="text-xs text-mun-gray-500">{{ item.filename }}</span>
                                                <AppButton v-if="item.downloadUrl" variant="ghost" size="xs"
                                                    @click="downloadFile(item.downloadUrl, item.filename)">
                                                    <ArrowDownTrayIcon class="w-3 h-3" />
                                                </AppButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    XMarkIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    LinkIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    committee: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'generated'])

// Composables
const toast = useToast()

// State
const isGeneratingPresidium = ref(false)
const isGeneratingDelegates = ref(false)
const isGeneratingAll = ref(false)
const isDownloadingPresidium = ref(false)
const isDownloadingDelegates = ref(false)
const isDownloadingComplete = ref(false)
const isRefreshing = ref(false)

const presidiumStatus = ref([])
const generationHistory = ref([])
const generatedPresidiumLinks = ref([])
const generatedDelegateLinks = ref([])
const showLinksPreview = ref(false)

// Mock presidium members (you can replace with actual data from props)
const presidiumMembers = ref([
    { role: 'chairman', linksGenerated: false },
    { role: 'co-chairman', linksGenerated: false },
    { role: 'expert', linksGenerated: false },
    { role: 'secretary', linksGenerated: false }
])

// Computed
const hasPresidiumLinks = computed(() => {
    return presidiumMembers.value.some(member => member.linksGenerated)
})

const hasDelegateLinks = computed(() => {
    return props.committee?.linksGenerated || false
})

const hasAnyLinks = computed(() => {
    return hasPresidiumLinks.value || hasDelegateLinks.value
})

// Watch for committee changes
watch(() => props.committee?._id, (newVal) => {
    if (newVal) {
        loadPresidiumStatus()
    }
})

// Methods
const loadPresidiumStatus = async () => {
    try {
        const response = await apiMethods.committees.getPresidiumStatus(props.committee._id)

        if (response.data.success) {
            presidiumStatus.value = response.data.presidiumStatus || []

            // Update presidium members status
            presidiumMembers.value.forEach(member => {
                const status = presidiumStatus.value.find(p => p.role === member.role)
                member.linksGenerated = status?.hasLoginLink || false
            })
        }

    } catch (error) {
        console.error('Load presidium status error:', error)
    }
}

const generatePresidiumLinks = async () => {
    try {
        isGeneratingPresidium.value = true

        const response = await apiMethods.committees.generatePresidiumLoginLinks(props.committee._id)

        if (response.data.success) {
            generatedPresidiumLinks.value = response.data.presidiumLinks || []
            showLinksPreview.value = true
            await loadPresidiumStatus()
            addToHistory('Presidium login links generated', 'success', 'presidium-links.txt')
            toast.success('Presidium login links generated successfully')
        }

    } catch (error) {
        console.error('Generate presidium links error:', error)
        addToHistory('Presidium link generation failed', 'error')
        toast.error('Failed to generate presidium login links')
    } finally {
        isGeneratingPresidium.value = false
    }
}

const generateDelegateLinks = async () => {
    try {
        isGeneratingDelegates.value = true

        const response = await apiMethods.committees.generateLoginLinks(props.committee._id)

        if (response.data.success) {
            generatedDelegateLinks.value = response.data.delegateLinks || []
            showLinksPreview.value = true
            addToHistory('Delegate login links generated', 'success', 'delegate-links.txt')
            toast.success('Delegate login links generated successfully')

            // Update committee status
            emit('generated', { ...props.committee, linksGenerated: true })
        }

    } catch (error) {
        console.error('Generate delegate links error:', error)
        addToHistory('Delegate link generation failed', 'error')
        toast.error('Failed to generate delegate login links')
    } finally {
        isGeneratingDelegates.value = false
    }
}

const generateAllLinks = async () => {
    try {
        isGeneratingAll.value = true

        // Generate both presidium and delegate links
        await Promise.all([
            generatePresidiumLinks(),
            generateDelegateLinks()
        ])

        addToHistory('All login links generated', 'success', 'complete-links.txt')
        toast.success('All login links generated successfully')

    } catch (error) {
        console.error('Generate all links error:', error)
        addToHistory('Complete link generation failed', 'error')
        toast.error('Failed to generate all login links')
    } finally {
        isGeneratingAll.value = false
    }
}

const getFilenameFromContentDisposition = (response) => {
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
        // Example: attachment; filename="Test_1235_complete_links.txt"
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch.length > 1) {
            return filenameMatch[1]
        }
    }
    // Fallback to a default name if header is missing or unparseable
    return 'download.txt'
}

const downloadPresidiumLinks = async () => {
    try {
        isDownloadingPresidium.value = true

        const response = await apiMethods.exports.generatePresidiumLinks(props.committee._id, 'plain')

        if (response.data) {
            const filename = getFilenameFromContentDisposition(response)
            downloadText(response.data, filename)
            addToHistory('Presidium links downloaded', 'success', filename)
            toast.success('Presidium links downloaded successfully')
        }

    } catch (error) {
        console.error('Download presidium links error:', error)
        addToHistory('Presidium links download failed', 'error')
        toast.error('Failed to download presidium links')
    } finally {
        isDownloadingPresidium.value = false
    }
}

const downloadDelegateLinks = async () => {
    try {
        isDownloadingDelegates.value = true

        const response = await apiMethods.exports.generateDelegateLinks(props.committee._id, 'plain')

        if (response.data) {
            const filename = getFilenameFromContentDisposition(response)
            downloadText(response.data, filename)
            addToHistory('Delegate links downloaded', 'success', filename)
            toast.success('Delegate links downloaded successfully')
        }

    } catch (error) {
        console.error('Download delegate links error:', error)
        addToHistory('Delegate links download failed', 'error')
        toast.error('Failed to download delegate links')
    } finally {
        isDownloadingDelegates.value = false
    }
}

const downloadCompleteLinks = async () => {
    try {
        isDownloadingComplete.value = true

        const response = await apiMethods.exports.generateCompleteLinks(props.committee._id, 'plain')

        if (response.data) {
            const filename = getFilenameFromContentDisposition(response)
            downloadText(response.data, filename)
            addToHistory('Complete links downloaded', 'success', filename)
            toast.success('Complete links downloaded successfully')
        }

    } catch (error) {
        console.error('Download complete links error:', error)
        addToHistory('Complete links download failed', 'error')
        toast.error('Failed to download complete links')
    } finally {
        isDownloadingComplete.value = false
    }
}

const refreshStatus = async () => {
    try {
        isRefreshing.value = true
        await loadPresidiumStatus()
        toast.success('Status refreshed')
    } catch (error) {
        console.error('Refresh status error:', error)
        toast.error('Failed to refresh status')
    } finally {
        isRefreshing.value = false
    }
}

const copyLink = async (link) => {
    try {
        await navigator.clipboard.writeText(link)
        toast.success('Link copied to clipboard')
    } catch (error) {
        console.error('Copy link error:', error)
        toast.error('Failed to copy link')
    }
}

const copyAllLinks = async () => {
    try {
        const allLinks = []

        if (generatedPresidiumLinks.value.length > 0) {
            allLinks.push('PRESIDIUM:')
            generatedPresidiumLinks.value.forEach(link => {
                allLinks.push(`${formatPresidiumRole(link.role)}: ${link.link}`)
            })
            allLinks.push('')
        }

        if (generatedDelegateLinks.value.length > 0) {
            allLinks.push('DELEGATES:')
            generatedDelegateLinks.value.forEach(link => {
                allLinks.push(`${link.country}: ${link.link}`)
            })
        }

        await navigator.clipboard.writeText(allLinks.join('\n'))
        toast.success('All links copied to clipboard')
    } catch (error) {
        console.error('Copy all links error:', error)
        toast.error('Failed to copy links')
    }
}

const downloadText = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

const downloadFile = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const addToHistory = (action, status, filename = null) => {
    generationHistory.value.unshift({
        id: Date.now(),
        action,
        status,
        filename,
        timestamp: new Date(),
        downloadUrl: filename ? `#${filename}` : null
    })

    // Keep only last 10 items
    if (generationHistory.value.length > 10) {
        generationHistory.value = generationHistory.value.slice(0, 10)
    }
}

const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}

const close = () => {
    emit('update:modelValue', false)
}

// Lifecycle
onMounted(() => {
    if (props.committee?._id) {
        loadPresidiumStatus()
    }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>