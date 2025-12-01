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
                                QR Code Generation - {{ committee?.name }}
                            </h2>
                            <p class="text-sm text-mun-gray-600 mt-1">
                                Generate and manage QR codes for committee access
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
                            <div v-if="committee?.qrGenerated"
                                class="bg-mun-green-50 border border-mun-green-200 rounded-xl p-4">
                                <div class="flex items-center">
                                    <CheckCircleIcon class="w-6 h-6 text-mun-green-600 mr-3" />
                                    <div>
                                        <h3 class="font-medium text-mun-green-900">QR Codes Generated</h3>
                                        <p class="text-sm text-mun-green-700 mt-1">
                                            QR codes have been generated for this committee. You can download or
                                            regenerate them below.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- QR Generation Options -->
                            <div class="mt-2 space-y-2">
                                <h3 class="text-lg font-semibold text-mun-gray-900">
                                    Generation Options
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Presidium QR Codes -->
                                    <div class="border border-mun-gray-200 rounded-xl p-6">
                                        <div class="flex items-center mb-4">
                                            <div
                                                class="w-10 h-10 bg-mun-purple-100 rounded-lg flex items-center justify-center mr-3">
                                                <ShieldCheckIcon class="w-5 h-5 text-mun-purple-600" />
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-mun-gray-900">Presidium QR Codes</h4>
                                                <p class="text-sm text-mun-gray-600">For committee presidium members</p>
                                            </div>
                                        </div>

                                        <div class="space-y-3 mb-4">
                                            <div v-for="member in presidiumMembers" :key="member.role"
                                                class="flex items-center justify-between">
                                                <div class="flex items-center space-x-3">
                                                    <div :class="[
                                                        'w-3 h-3 rounded-full',
                                                        member.qrGenerated ? 'bg-mun-green-500' : 'bg-mun-gray-300'
                                                    ]"></div>
                                                    <span class="text-sm font-medium">{{
                                                        formatPresidiumRole(member.role) }}</span>
                                                </div>
                                                <div class="text-xs text-mun-gray-500">
                                                    {{ member.qrGenerated ? 'Generated' : 'Pending' }}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex space-x-2">
                                            <AppButton variant="outline" size="sm" @click="generatePresidiumQRs"
                                                :loading="isGeneratingPresidium" class="flex-1">
                                                {{ hasPresidiumQRs ? 'Regenerate' : 'Generate' }}
                                            </AppButton>

                                            <AppButton v-if="hasPresidiumQRs" variant="outline" size="sm"
                                                @click="downloadPresidiumPDF" :loading="isDownloadingPresidium">
                                                <DocumentArrowDownIcon class="w-4 h-4" />
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Delegate QR Codes -->
                                    <div class="border border-mun-gray-200 rounded-xl p-6">
                                        <div class="flex items-center mb-4">
                                            <div
                                                class="w-10 h-10 bg-mun-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                <UserGroupIcon class="w-5 h-5 text-mun-blue" />
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-mun-gray-900">Delegate QR Codes</h4>
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
                                            <AppButton variant="outline" size="sm" @click="generateDelegateQRs"
                                                :loading="isGeneratingDelegates"
                                                :disabled="!committee?.countries?.length" class="flex-1">
                                                {{ hasDelegateQRs ? 'Regenerate' : 'Generate' }}
                                            </AppButton>

                                            <AppButton v-if="hasDelegateQRs" variant="outline" size="sm"
                                                @click="downloadDelegatePDF" :loading="isDownloadingDelegates">
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
                                            <p class="text-sm text-mun-gray-600">Generate and download all QR codes at
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
                                        <AppButton variant="primary" @click="generateAllQRs" :loading="isGeneratingAll"
                                            :disabled="!committee?.countries?.length">
                                            <QrCodeIcon class="w-4 h-4 mr-2" />
                                            Generate All QR Codes
                                        </AppButton>

                                        <AppButton v-if="hasAnyQRs" variant="outline" @click="downloadCompletePDF"
                                            :loading="isDownloadingComplete">
                                            <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                                            Download Complete PDF
                                        </AppButton>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    XMarkIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    QrCodeIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon
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

// Mock presidium members (you can replace with actual data from props)
const presidiumMembers = ref([
    { role: 'chairman', qrGenerated: false },
    { role: 'co-chairman', qrGenerated: false },
    { role: 'expert', qrGenerated: false },
    { role: 'secretary', qrGenerated: false }
])

// Computed
const hasPresidiumQRs = computed(() => {
    return presidiumMembers.value.some(member => member.qrGenerated)
})

const hasDelegateQRs = computed(() => {
    return props.committee?.qrGenerated || false
})

const hasAnyQRs = computed(() => {
    return hasPresidiumQRs.value || hasDelegateQRs.value
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
                member.qrGenerated = status?.hasQR || false
            })
        }

    } catch (error) {
        console.error('Load presidium status error:', error)
    }
}

const generatePresidiumQRs = async () => {
    try {
        isGeneratingPresidium.value = true

        const response = await apiMethods.committees.generatePresidiumQRs(props.committee._id)

        if (response.data.success) {
            await loadPresidiumStatus()
            addToHistory('Presidium QR codes generated', 'success', 'presidium-qr-codes.pdf')
            toast.success('Presidium QR codes generated successfully')
        }

    } catch (error) {
        console.error('Generate presidium QRs error:', error)
        addToHistory('Presidium QR generation failed', 'error')
        toast.error('Failed to generate presidium QR codes')
    } finally {
        isGeneratingPresidium.value = false
    }
}

const generateDelegateQRs = async () => {
    try {
        isGeneratingDelegates.value = true

        const response = await apiMethods.committees.generateQRs(props.committee._id)

        if (response.data.success) {
            addToHistory('Delegate QR codes generated', 'success', 'delegate-qr-codes.pdf')
            toast.success('Delegate QR codes generated successfully')

            // Update committee status
            emit('generated', { ...props.committee, qrGenerated: true })
        }

    } catch (error) {
        console.error('Generate delegate QRs error:', error)
        addToHistory('Delegate QR generation failed', 'error')
        toast.error('Failed to generate delegate QR codes')
    } finally {
        isGeneratingDelegates.value = false
    }
}

const generateAllQRs = async () => {
    try {
        isGeneratingAll.value = true

        // Generate both presidium and delegate QRs
        await Promise.all([
            generatePresidiumQRs(),
            generateDelegateQRs()
        ])

        addToHistory('All QR codes generated', 'success', 'complete-qr-codes.pdf')
        toast.success('All QR codes generated successfully')

    } catch (error) {
        console.error('Generate all QRs error:', error)
        addToHistory('Complete QR generation failed', 'error')
        toast.error('Failed to generate all QR codes')
    } finally {
        isGeneratingAll.value = false
    }
}

const downloadPresidiumPDF = async () => {
    try {
        isDownloadingPresidium.value = true

        const response = await fetch(`/api/export/presidium-qr-codes/${props.committee._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (response.ok) {
            const blob = await response.blob()
            const filename = `${props.committee.name}-presidium-qr-codes.pdf`
            downloadBlob(blob, filename)
            addToHistory('Presidium PDF downloaded', 'success', filename)
            toast.success('Presidium PDF downloaded successfully')
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

    } catch (error) {
        console.error('Download presidium PDF error:', error)
        addToHistory('Presidium PDF download failed', 'error')
        toast.error('Failed to download presidium PDF')
    } finally {
        isDownloadingPresidium.value = false
    }
}

const downloadDelegatePDF = async () => {
    try {
        isDownloadingDelegates.value = true

        const response = await fetch(`/api/export/qr-codes/${props.committee._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (response.ok) {
            const blob = await response.blob()
            const filename = `${props.committee.name}-delegate-qr-codes.pdf`
            downloadBlob(blob, filename)
            addToHistory('Delegate PDF downloaded', 'success', filename)
            toast.success('Delegate PDF downloaded successfully')
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

    } catch (error) {
        console.error('Download delegate PDF error:', error)
        addToHistory('Delegate PDF download failed', 'error')
        toast.error('Failed to download delegate PDF')
    } finally {
        isDownloadingDelegates.value = false
    }
}

const downloadCompletePDF = async () => {
    try {
        isDownloadingComplete.value = true

        const response = await fetch(`/api/export/complete-qr-codes/${props.committee._id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
            }
        })

        if (response.ok) {
            const blob = await response.blob()
            const filename = `${props.committee.name}-complete-qr-codes.pdf`
            downloadBlob(blob, filename)
            addToHistory('Complete PDF downloaded', 'success', filename)
            toast.success('Complete PDF downloaded successfully')
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

    } catch (error) {
        console.error('Download complete PDF error:', error)
        addToHistory('Complete PDF download failed', 'error')
        toast.error('Failed to download complete PDF')
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

const downloadBlob = (blob, filename) => {
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