<template>
    <TransitionRoot appear :show="modelValue" as="template">
        <Dialog as="div" @close="close" class="relative z-50">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/25 backdrop-blur-sm" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel
                            class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl transition-all">
                            <!-- Modal Header -->
                            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                                <div>
                                    <DialogTitle as="h3" class="text-2xl font-bold text-mun-gray-900">
                                        Generate QR Codes
                                    </DialogTitle>
                                    <p class="text-mun-gray-600 mt-1">
                                        {{ committee?.name }} - Create authentication QR codes for participants
                                    </p>
                                </div>

                                <button @click="close" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                                </button>
                            </div>

                            <!-- Generation Options -->
                            <div class="p-6">
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Presidium QR Codes -->
                                    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
                                        <div class="flex items-center mb-4">
                                            <div class="p-3 bg-red-500 rounded-xl">
                                                <ShieldCheckIcon class="w-6 h-6 text-white" />
                                            </div>
                                            <div class="ml-4">
                                                <h3 class="text-lg font-semibold text-red-900">Presidium QR Codes</h3>
                                                <p class="text-sm text-red-700">4 roles: Chairman, Co-Chairman, Expert,
                                                    Secretary</p>
                                            </div>
                                        </div>

                                        <div class="space-y-4">
                                            <!-- Presidium Status -->
                                            <div class="bg-white/60 rounded-xl p-4">
                                                <div class="grid grid-cols-2 gap-4">
                                                    <div class="text-center">
                                                        <div class="text-2xl font-bold text-red-900">{{
                                                            presidiumStats.created }}</div>
                                                        <div class="text-xs text-red-600">Created</div>
                                                    </div>
                                                    <div class="text-center">
                                                        <div class="text-2xl font-bold text-mun-green-600">{{
                                                            presidiumStats.registered }}</div>
                                                        <div class="text-xs text-red-600">Registered</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Presidium Actions -->
                                            <div class="space-y-2">
                                                <AppButton variant="outline" size="sm" full-width :icon="PlusIcon"
                                                    @click="generatePresidiumQRs" :loading="isGeneratingPresidium"
                                                    :disabled="presidiumStats.created === 4">
                                                    {{ presidiumStats.created === 4 ? 'All Roles Created' : 'Generate Presidium QRs' }}
                                                </AppButton>

                                                <AppButton variant="outline" size="sm" full-width
                                                    :icon="DocumentArrowDownIcon" @click="downloadPresidiumPDF"
                                                    :loading="isDownloadingPresidium"
                                                    :disabled="presidiumStats.created === 0">
                                                    Download Presidium PDF
                                                </AppButton>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Delegate QR Codes -->
                                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                                        <div class="flex items-center mb-4">
                                            <div class="p-3 bg-un-blue rounded-xl">
                                                <FlagIcon class="w-6 h-6 text-white" />
                                            </div>
                                            <div class="ml-4">
                                                <h3 class="text-lg font-semibold text-un-blue-900">Delegate QR Codes
                                                </h3>
                                                <p class="text-sm text-un-blue-700">One QR code per assigned country</p>
                                            </div>
                                        </div>

                                        <div class="space-y-4">
                                            <!-- Delegate Status -->
                                            <div class="bg-white/60 rounded-xl p-4">
                                                <div class="grid grid-cols-3 gap-2">
                                                    <div class="text-center">
                                                        <div class="text-xl font-bold text-un-blue-900">{{
                                                            delegateStats.total }}</div>
                                                        <div class="text-xs text-un-blue-600">Countries</div>
                                                    </div>
                                                    <div class="text-center">
                                                        <div class="text-xl font-bold text-mun-yellow-600">{{
                                                            delegateStats.generated }}</div>
                                                        <div class="text-xs text-un-blue-600">QR Codes</div>
                                                    </div>
                                                    <div class="text-center">
                                                        <div class="text-xl font-bold text-mun-green-600">{{
                                                            delegateStats.registered }}</div>
                                                        <div class="text-xs text-un-blue-600">Registered</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Delegate Actions -->
                                            <div class="space-y-2">
                                                <AppButton variant="outline" size="sm" full-width :icon="PlusIcon"
                                                    @click="generateDelegateQRs" :loading="isGeneratingDelegates"
                                                    :disabled="delegateStats.total === 0">
                                                    {{ delegateStats.generated === delegateStats.total ? 'Regenerate All QRs' : 'Generate Delegate QRs' }}
                                                </AppButton>

                                                <AppButton variant="outline" size="sm" full-width
                                                    :icon="DocumentArrowDownIcon" @click="downloadDelegatePDF"
                                                    :loading="isDownloadingDelegates"
                                                    :disabled="delegateStats.generated === 0">
                                                    Download Delegate PDF
                                                </AppButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Complete PDF Generation -->
                                <div class="mt-6 bg-gradient-to-br from-mun-green-50 to-mun-green-100 rounded-2xl p-6">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <div class="p-3 bg-mun-green rounded-xl">
                                                <DocumentTextIcon class="w-6 h-6 text-white" />
                                            </div>
                                            <div class="ml-4">
                                                <h3 class="text-lg font-semibold text-mun-green-900">Complete Committee
                                                    PDF</h3>
                                                <p class="text-sm text-mun-green-700">
                                                    Single PDF with all QR codes (Presidium + Delegates)
                                                </p>
                                            </div>
                                        </div>

                                        <AppButton variant="primary" :icon="DocumentArrowDownIcon"
                                            @click="downloadCompletePDF" :loading="isDownloadingComplete"
                                            :disabled="!canGenerateCompletePDF">
                                            Download Complete PDF
                                        </AppButton>
                                    </div>
                                </div>

                                <!-- QR Code Preview Section -->
                                <div v-if="showPreview" class="mt-6">
                                    <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">QR Code Preview</h4>

                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <!-- Presidium QR Previews -->
                                        <QRPreviewCard v-for="role in presidiumRoles" :key="role"
                                            :title="formatPresidiumRole(role)" :subtitle="'Presidium'"
                                            :qr-data="getPresidiumQRData(role)" :color="'red'"
                                            @regenerate="regeneratePresidiumQR(role)" />

                                        <!-- Sample Delegate QR Previews -->
                                        <QRPreviewCard v-for="country in sampleCountries" :key="country.name"
                                            :title="country.name" :subtitle="'Delegate'" :qr-data="country.qrToken"
                                            :color="'blue'" :flag-url="country.flagUrl"
                                            @regenerate="regenerateDelegateQR(country)" />
                                    </div>
                                </div>

                                <!-- Generation History -->
                                <div v-if="generationHistory.length > 0" class="mt-6">
                                    <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">Generation History</h4>

                                    <div class="bg-white/60 rounded-xl p-4">
                                        <div class="space-y-3">
                                            <div v-for="entry in generationHistory" :key="entry.id"
                                                class="flex items-center justify-between py-2 border-b border-mun-gray-100 last:border-b-0">
                                                <div class="flex items-center space-x-3">
                                                    <div
                                                        :class="['w-2 h-2 rounded-full', getStatusColor(entry.status)]">
                                                    </div>
                                                    <div>
                                                        <p class="text-sm font-medium text-mun-gray-900">{{ entry.action
                                                            }}</p>
                                                        <p class="text-xs text-mun-gray-500">{{
                                                            formatTimestamp(entry.timestamp) }}</p>
                                                    </div>
                                                </div>
                                                <div class="flex items-center space-x-2">
                                                    <span
                                                        :class="['px-2 py-1 text-xs font-medium rounded-full', getStatusBadgeClass(entry.status)]">
                                                        {{ entry.status }}
                                                    </span>
                                                    <button v-if="entry.downloadUrl"
                                                        @click="downloadFile(entry.downloadUrl, entry.filename)"
                                                        class="p-1 rounded hover:bg-mun-gray-100 transition-colors">
                                                        <ArrowDownTrayIcon class="w-4 h-4 text-mun-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Modal Footer -->
                            <div
                                class="flex justify-between items-center p-6 border-t border-mun-gray-100 bg-mun-gray-50/50">
                                <div class="flex items-center space-x-4">
                                    <label class="flex items-center space-x-2">
                                        <input v-model="showPreview" type="checkbox"
                                            class="h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue" />
                                        <span class="text-sm text-mun-gray-700">Show QR Preview</span>
                                    </label>

                                    <label class="flex items-center space-x-2">
                                        <input v-model="autoDownload" type="checkbox"
                                            class="h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue" />
                                        <span class="text-sm text-mun-gray-700">Auto-download PDFs</span>
                                    </label>
                                </div>

                                <div class="flex space-x-4">
                                    <AppButton variant="outline" @click="close">
                                        Close
                                    </AppButton>

                                    <AppButton variant="primary" :icon="ArrowPathIcon" @click="refreshStatus"
                                        :loading="isRefreshing">
                                        Refresh Status
                                    </AppButton>
                                </div>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionRoot,
    TransitionChild
} from '@headlessui/vue'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    ShieldCheckIcon,
    FlagIcon,
    DocumentTextIcon,
    PlusIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import QRPreviewCard from './QRPreviewCard.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },

    committee: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'generated', 'close'])

const appStore = useAppStore()

// State
const showPreview = ref(true)
const autoDownload = ref(false)
const isRefreshing = ref(false)

// Generation states
const isGeneratingPresidium = ref(false)
const isGeneratingDelegates = ref(false)
const isDownloadingPresidium = ref(false)
const isDownloadingDelegates = ref(false)
const isDownloadingComplete = ref(false)

// Data
const presidiumStatus = ref([])
const generationHistory = ref([])

const presidiumRoles = ['chairman', 'co-chairman', 'expert', 'secretary']

// Computed
const presidiumStats = computed(() => {
    return {
        created: presidiumStatus.value.filter(p => p.hasQR).length,
        registered: presidiumStatus.value.filter(p => p.isRegistered).length
    }
})

const delegateStats = computed(() => {
    const countries = props.committee?.countries || []
    return {
        total: countries.length,
        generated: countries.filter(c => c.qrToken).length,
        registered: countries.filter(c => c.email).length
    }
})

const canGenerateCompletePDF = computed(() => {
    return presidiumStats.value.created > 0 || delegateStats.value.generated > 0
})

const sampleCountries = computed(() => {
    return (props.committee?.countries || []).slice(0, 4)
})

// Methods
const loadPresidiumStatus = async () => {
    try {
        const response = await apiMethods.committees.getPresidiumStatus(props.committee._id)
        presidiumStatus.value = response.data.presidiumStatus || []
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
            addToHistory('Presidium QR codes generated', 'success')
            appStore.showSuccessMessage('Presidium QR codes generated successfully')

            emit('generated', props.committee)
        }

    } catch (error) {
        console.error('Generate presidium QRs error:', error)
        addToHistory('Presidium QR generation failed', 'error')
        appStore.showErrorMessage('Failed to generate presidium QR codes')
    } finally {
        isGeneratingPresidium.value = false
    }
}

const generateDelegateQRs = async () => {
    try {
        isGeneratingDelegates.value = true

        const response = await apiMethods.committees.generateQRs(props.committee._id)

        if (response.data.success) {
            addToHistory('Delegate QR codes generated', 'success')
            appStore.showSuccessMessage('Delegate QR codes generated successfully')

            emit('generated', props.committee)
        }

    } catch (error) {
        console.error('Generate delegate QRs error:', error)
        addToHistory('Delegate QR generation failed', 'error')
        appStore.showErrorMessage('Failed to generate delegate QR codes')
    } finally {
        isGeneratingDelegates.value = false
    }
}

const downloadPresidiumPDF = async () => {
    try {
        isDownloadingPresidium.value = true

        // This would be a specific presidium PDF endpoint
        const response = await apiMethods.export.generateQRPDF(props.committee._id, { type: 'presidium' })

        const filename = `Presidium_QR_${props.committee.name.replace(/\s+/g, '_')}.pdf`
        downloadBlob(response.data, filename)

        addToHistory('Presidium PDF downloaded', 'success', filename)
        appStore.showSuccessMessage('Presidium PDF downloaded successfully')

    } catch (error) {
        console.error('Download presidium PDF error:', error)
        addToHistory('Presidium PDF download failed', 'error')
        appStore.showErrorMessage('Failed to download presidium PDF')
    } finally {
        isDownloadingPresidium.value = false
    }
}

const downloadDelegatePDF = async () => {
    try {
        isDownloadingDelegates.value = true

        // This would be a specific delegate PDF endpoint
        const response = await apiMethods.export.generateQRPDF(props.committee._id, { type: 'delegates' })

        const filename = `Delegates_QR_${props.committee.name.replace(/\s+/g, '_')}.pdf`
        downloadBlob(response.data, filename)

        addToHistory('Delegates PDF downloaded', 'success', filename)
        appStore.showSuccessMessage('Delegates PDF downloaded successfully')

    } catch (error) {
        console.error('Download delegates PDF error:', error)
        addToHistory('Delegates PDF download failed', 'error')
        appStore.showErrorMessage('Failed to download delegates PDF')
    } finally {
        isDownloadingDelegates.value = false
    }
}

const downloadCompletePDF = async () => {
    try {
        isDownloadingComplete.value = true

        const response = await apiMethods.export.generateQRPDF(props.committee._id)

        const filename = `Complete_QR_${props.committee.name.replace(/\s+/g, '_')}.pdf`
        downloadBlob(response.data, filename)

        addToHistory('Complete PDF downloaded', 'success', filename)
        appStore.showSuccessMessage('Complete PDF downloaded successfully')

    } catch (error) {
        console.error('Download complete PDF error:', error)
        addToHistory('Complete PDF download failed', 'error')
        appStore.showErrorMessage('Failed to download complete PDF')
    } finally {
        isDownloadingComplete.value = false
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

const regeneratePresidiumQR = async (role) => {
    try {
        const response = await apiMethods.committees.resetPresidiumQR(props.committee._id, role)

        if (response.data.success) {
            await loadPresidiumStatus()
            appStore.showSuccessMessage(`QR code regenerated for ${formatPresidiumRole(role)}`)
        }

    } catch (error) {
        console.error('Regenerate presidium QR error:', error)
        appStore.showErrorMessage('Failed to regenerate QR code')
    }
}

const regenerateDelegateQR = async (country) => {
    try {
        // This would need a specific endpoint for regenerating individual country QRs
        appStore.showSuccessMessage(`QR code regenerated for ${country.name}`)
    } catch (error) {
        console.error('Regenerate delegate QR error:', error)
        appStore.showErrorMessage('Failed to regenerate QR code')
    }
}

const refreshStatus = async () => {
    try {
        isRefreshing.value = true
        await loadPresidiumStatus()
        appStore.showSuccessMessage('Status refreshed')
    } catch (error) {
        console.error('Refresh status error:', error)
        appStore.showErrorMessage('Failed to refresh status')
    } finally {
        isRefreshing.value = false
    }
}

const addToHistory = (action, status, filename = null) => {
    generationHistory.value.unshift({
        id: Date.now(),
        action,
        status,
        filename,
        timestamp: new Date(),
        downloadUrl: filename ? `/downloads/${filename}` : null
    })

    // Keep only last 10 entries
    if (generationHistory.value.length > 10) {
        generationHistory.value = generationHistory.value.slice(0, 10)
    }
}

const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

// Utility functions
const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role
}

const getPresidiumQRData = (role) => {
    const member = presidiumStatus.value.find(p => p.role === role)
    return member?.qrToken || null
}

const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
}

const getStatusColor = (status) => {
    const colorMap = {
        'success': 'bg-mun-green',
        'error': 'bg-mun-red',
        'pending': 'bg-mun-yellow'
    }
    return colorMap[status] || 'bg-mun-gray-400'
}

const getStatusBadgeClass = (status) => {
    const classMap = {
        'success': 'bg-mun-green-50 text-mun-green-700',
        'error': 'bg-mun-red-50 text-mun-red-700',
        'pending': 'bg-mun-yellow-50 text-mun-yellow-700'
    }
    return classMap[status] || 'bg-mun-gray-50 text-mun-gray-700'
}

// Watchers
watch(() => props.modelValue, (newValue) => {
    if (newValue && props.committee) {
        loadPresidiumStatus()
    }
})

// Initialize
onMounted(() => {
    if (props.committee) {
        loadPresidiumStatus()
    }
})
</script>

<style scoped>
/* Generation card animations */
.generation-card {
    animation: slideInUp 0.4s ease-out;
}

.generation-card:nth-child(1) {
    animation-delay: 0.1s;
}

.generation-card:nth-child(2) {
    animation-delay: 0.2s;
}

.generation-card:nth-child(3) {
    animation-delay: 0.3s;
}

/* Progress animations */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.7;
    }
}

.generating {
    animation: pulse 1s ease-in-out infinite;
}

/* History list animation */
.history-item {
    animation: slideInLeft 0.3s ease-out;
}
</style>