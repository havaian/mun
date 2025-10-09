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
                            class="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl transition-all">
                            <!-- Modal Header -->
                            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                                <div>
                                    <DialogTitle as="h3" class="text-2xl font-bold text-mun-gray-900">
                                        Bulk QR Generation
                                    </DialogTitle>
                                    <p class="text-mun-gray-600 mt-1">
                                        Generate QR codes for multiple committees at once
                                    </p>
                                </div>

                                <button @click="close" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                                </button>
                            </div>

                            <!-- Operation Selection -->
                            <div class="p-6 border-b border-mun-gray-100">
                                <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">Select Operations</h4>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <label
                                        class="relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-mun-gray-50">
                                        <input v-model="selectedOperations.presidium" type="checkbox" class="sr-only" />
                                        <div class="flex flex-1 items-center">
                                            <div class="flex-shrink-0">
                                                <div :class="[
                                                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                                                    selectedOperations.presidium
                                                        ? 'border-red-500 bg-red-500'
                                                        : 'border-mun-gray-300'
                                                ]">
                                                    <CheckIcon v-if="selectedOperations.presidium"
                                                        class="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <div class="ml-3">
                                                <div class="flex items-center">
                                                    <ShieldCheckIcon class="w-5 h-5 text-red-500 mr-2" />
                                                    <span class="text-sm font-medium text-mun-gray-900">Presidium
                                                        QRs</span>
                                                </div>
                                                <span class="text-xs text-mun-gray-500">Generate for all
                                                    committees</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label
                                        class="relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-mun-gray-50">
                                        <input v-model="selectedOperations.delegates" type="checkbox" class="sr-only" />
                                        <div class="flex flex-1 items-center">
                                            <div class="flex-shrink-0">
                                                <div :class="[
                                                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                                                    selectedOperations.delegates
                                                        ? 'border-un-blue bg-un-blue'
                                                        : 'border-mun-gray-300'
                                                ]">
                                                    <CheckIcon v-if="selectedOperations.delegates"
                                                        class="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <div class="ml-3">
                                                <div class="flex items-center">
                                                    <FlagIcon class="w-5 h-5 text-un-blue mr-2" />
                                                    <span class="text-sm font-medium text-mun-gray-900">Delegate
                                                        QRs</span>
                                                </div>
                                                <span class="text-xs text-mun-gray-500">Generate for all
                                                    countries</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label
                                        class="relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-mun-gray-50">
                                        <input v-model="selectedOperations.pdfs" type="checkbox" class="sr-only" />
                                        <div class="flex flex-1 items-center">
                                            <div class="flex-shrink-0">
                                                <div :class="[
                                                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                                                    selectedOperations.pdfs
                                                        ? 'border-mun-green bg-mun-green'
                                                        : 'border-mun-gray-300'
                                                ]">
                                                    <CheckIcon v-if="selectedOperations.pdfs"
                                                        class="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <div class="ml-3">
                                                <div class="flex items-center">
                                                    <DocumentTextIcon class="w-5 h-5 text-mun-green mr-2" />
                                                    <span class="text-sm font-medium text-mun-gray-900">Generate
                                                        PDFs</span>
                                                </div>
                                                <span class="text-xs text-mun-gray-500">Create PDF files</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <!-- Committee Selection -->
                            <div class="p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-semibold text-mun-gray-900">
                                        Select Committees ({{ selectedCommittees.length }}/{{ committees.length }})
                                    </h4>

                                    <div class="flex items-center space-x-3">
                                        <AppButton variant="outline" size="sm" @click="selectAll">
                                            Select All
                                        </AppButton>
                                        <AppButton variant="outline" size="sm" @click="selectNone">
                                            Select None
                                        </AppButton>
                                    </div>
                                </div>

                                <!-- Committee Grid -->
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    <CommitteeSelectionCard v-for="committee in committees" :key="committee._id"
                                        :committee="committee" :selected="selectedCommittees.includes(committee._id)"
                                        @toggle="toggleCommittee" />
                                </div>
                            </div>

                            <!-- Progress Section -->
                            <div v-if="isProcessing" class="p-6 border-t border-mun-gray-100 bg-mun-gray-50/50">
                                <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">Generation Progress</h4>

                                <!-- Overall Progress -->
                                <div class="mb-6">
                                    <div class="flex justify-between text-sm text-mun-gray-600 mb-2">
                                        <span>Overall Progress</span>
                                        <span>{{ Math.round(overallProgress) }}%</span>
                                    </div>
                                    <div class="w-full bg-mun-gray-200 rounded-full h-3">
                                        <div class="bg-gradient-to-r from-un-blue to-mun-green h-3 rounded-full transition-all duration-500"
                                            :style="{ width: `${overallProgress}%` }"></div>
                                    </div>
                                </div>

                                <!-- Current Operation -->
                                <div class="flex items-center space-x-4 mb-4">
                                    <LoadingSpinner size="md" />
                                    <div>
                                        <p class="text-sm font-medium text-mun-gray-900">{{ currentOperation }}</p>
                                        <p class="text-xs text-mun-gray-500">{{ currentCommittee || 'Preparing...' }}
                                        </p>
                                    </div>
                                </div>

                                <!-- Processing Log -->
                                <div class="max-h-40 overflow-y-auto bg-white rounded-xl p-4">
                                    <div class="space-y-2">
                                        <div v-for="log in processingLog" :key="log.id"
                                            class="flex items-center space-x-3 text-sm">
                                            <div :class="[
                                                'w-2 h-2 rounded-full flex-shrink-0',
                                                getLogStatusColor(log.status)
                                            ]"></div>
                                            <span :class="getLogTextColor(log.status)">{{ log.message }}</span>
                                            <span class="text-xs text-mun-gray-400 ml-auto">{{ formatTime(log.timestamp)
                                            }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Results Section -->
                            <div v-if="results.length > 0" class="p-6 border-t border-mun-gray-100">
                                <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">Generation Results</h4>

                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <ResultCard v-for="result in results" :key="result.committeeId" :result="result"
                                        @download="downloadResult" />
                                </div>

                                <!-- Summary Stats -->
                                <div class="mt-6 bg-mun-green-50 rounded-xl p-4">
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <div class="text-2xl font-bold text-mun-green-700">{{ successCount }}</div>
                                            <div class="text-sm text-mun-green-600">Successful</div>
                                        </div>
                                        <div>
                                            <div class="text-2xl font-bold text-mun-red-700">{{ errorCount }}</div>
                                            <div class="text-sm text-mun-red-600">Errors</div>
                                        </div>
                                        <div>
                                            <div class="text-2xl font-bold text-un-blue-700">{{ totalQRsGenerated }}
                                            </div>
                                            <div class="text-sm text-un-blue-600">QRs Generated</div>
                                        </div>
                                        <div>
                                            <div class="text-2xl font-bold text-mun-gray-700">{{ totalPDFsGenerated }}
                                            </div>
                                            <div class="text-sm text-mun-gray-600">PDFs Created</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Modal Footer -->
                            <div
                                class="flex justify-between items-center p-6 border-t border-mun-gray-100 bg-mun-gray-50/50">
                                <div class="text-sm text-mun-gray-600">
                                    {{ selectedCommittees.length }} committees selected
                                </div>

                                <div class="flex space-x-4">
                                    <AppButton variant="outline" @click="close" :disabled="isProcessing">
                                        {{ isProcessing ? 'Cancel' : 'Close' }}
                                    </AppButton>

                                    <AppButton variant="primary" :icon="BoltIcon" @click="startBulkGeneration"
                                        :loading="isProcessing" :disabled="!canStartGeneration">
                                        Start Generation
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
import { ref, reactive, computed } from 'vue'
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
    CheckIcon,
    ShieldCheckIcon,
    FlagIcon,
    DocumentTextIcon,
    BoltIcon
} from '@heroicons/vue/24/outline'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import CommitteeSelectionCard from './CommitteeSelectionCard.vue'
import ResultCard from './ResultCard.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },

    committees: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['update:modelValue', 'generated'])

const appStore = useAppStore()

// State
const selectedCommittees = ref([])
const isProcessing = ref(false)
const overallProgress = ref(0)
const currentOperation = ref('')
const currentCommittee = ref('')
const processingLog = ref([])
const results = ref([])

const selectedOperations = reactive({
    presidium: true,
    delegates: true,
    pdfs: true
})

// Computed
const canStartGeneration = computed(() => {
    return selectedCommittees.value.length > 0 &&
        (selectedOperations.presidium || selectedOperations.delegates || selectedOperations.pdfs) &&
        !isProcessing.value
})

const successCount = computed(() => results.value.filter(r => r.status === 'success').length)
const errorCount = computed(() => results.value.filter(r => r.status === 'error').length)
const totalQRsGenerated = computed(() => results.value.reduce((sum, r) => sum + (r.qrsGenerated || 0), 0))
const totalPDFsGenerated = computed(() => results.value.filter(r => r.pdfGenerated).length)

// Methods
const toggleCommittee = (committeeId) => {
    const index = selectedCommittees.value.indexOf(committeeId)
    if (index > -1) {
        selectedCommittees.value.splice(index, 1)
    } else {
        selectedCommittees.value.push(committeeId)
    }
}

const selectAll = () => {
    selectedCommittees.value = props.committees.map(c => c._id)
}

const selectNone = () => {
    selectedCommittees.value = []
}

const startBulkGeneration = async () => {
    try {
        isProcessing.value = true
        overallProgress.value = 0
        currentOperation.value = 'Initializing...'
        currentCommittee.value = ''
        processingLog.value = []
        results.value = []

        const totalOperations = selectedCommittees.value.length *
            (Object.values(selectedOperations).filter(Boolean).length)
        let completedOperations = 0

        for (const committeeId of selectedCommittees.value) {
            const committee = props.committees.find(c => c._id === committeeId)
            currentCommittee.value = committee?.name || 'Unknown Committee'

            const result = {
                committeeId,
                committeeName: committee?.name,
                status: 'processing',
                operations: [],
                qrsGenerated: 0,
                pdfGenerated: false,
                downloadUrl: null
            }

            results.value.push(result)

            try {
                // Generate Presidium QRs
                if (selectedOperations.presidium) {
                    currentOperation.value = 'Generating Presidium QR codes...'
                    addLog(`Starting presidium QR generation for ${committee?.name}`, 'info')

                    const presidiumResponse = await apiMethods.committees.generatePresidiumQRs(committeeId)

                    if (presidiumResponse.data.success) {
                        result.operations.push('Presidium QRs generated')
                        result.qrsGenerated += 4 // 4 presidium roles
                        addLog(`Presidium QRs generated for ${committee?.name}`, 'success')
                    } else {
                        throw new Error('Presidium QR generation failed')
                    }

                    completedOperations++
                    overallProgress.value = (completedOperations / totalOperations) * 100
                }

                // Generate Delegate QRs
                if (selectedOperations.delegates) {
                    currentOperation.value = 'Generating Delegate QR codes...'
                    addLog(`Starting delegate QR generation for ${committee?.name}`, 'info')

                    const delegateResponse = await apiMethods.committees.generateQRs(committeeId)

                    if (delegateResponse.data.success) {
                        const countryCount = committee?.countries?.length || 0
                        result.operations.push('Delegate QRs generated')
                        result.qrsGenerated += countryCount
                        addLog(`Delegate QRs generated for ${committee?.name} (${countryCount} countries)`, 'success')
                    } else {
                        throw new Error('Delegate QR generation failed')
                    }

                    completedOperations++
                    overallProgress.value = (completedOperations / totalOperations) * 100
                }

                // Generate PDFs
                if (selectedOperations.pdfs) {
                    currentOperation.value = 'Generating PDF...'
                    addLog(`Starting PDF generation for ${committee?.name}`, 'info')

                    const pdfResponse = await apiMethods.export.generateQRPDF(committeeId)

                    if (pdfResponse.data) {
                        result.operations.push('PDF generated')
                        result.pdfGenerated = true
                        result.downloadUrl = createDownloadUrl(pdfResponse.data, `${committee?.name}_QR_Codes.pdf`)
                        addLog(`PDF generated for ${committee?.name}`, 'success')
                    } else {
                        throw new Error('PDF generation failed')
                    }

                    completedOperations++
                    overallProgress.value = (completedOperations / totalOperations) * 100
                }

                result.status = 'success'
                addLog(`All operations completed for ${committee?.name}`, 'success')

            } catch (error) {
                console.error(`Error processing committee ${committeeId}:`, error)
                result.status = 'error'
                result.error = error.message
                addLog(`Error processing ${committee?.name}: ${error.message}`, 'error')
            }
        }

        currentOperation.value = 'Generation Complete'
        currentCommittee.value = ''
        overallProgress.value = 100

        addLog(`Bulk generation completed. ${successCount.value} successful, ${errorCount.value} errors`, 'info')

        emit('generated')
        appStore.showSuccessMessage('Bulk QR generation completed')

    } catch (error) {
        console.error('Bulk generation error:', error)
        addLog(`Bulk generation failed: ${error.message}`, 'error')
        appStore.showErrorMessage('Bulk generation failed')
    } finally {
        isProcessing.value = false
    }
}

const addLog = (message, status) => {
    processingLog.value.push({
        id: Date.now() + Math.random(),
        message,
        status,
        timestamp: new Date()
    })

    // Keep only last 50 entries
    if (processingLog.value.length > 50) {
        processingLog.value = processingLog.value.slice(-50)
    }
}

const createDownloadUrl = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    return { url, filename }
}

const downloadResult = (result) => {
    if (result.downloadUrl) {
        const link = document.createElement('a')
        link.href = result.downloadUrl.url
        link.download = result.downloadUrl.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
}

const close = () => {
    if (isProcessing.value) {
        // Could implement cancellation logic here
    }
    emit('update:modelValue', false)
}

// Utility functions
const getLogStatusColor = (status) => {
    const colorMap = {
        'success': 'bg-mun-green',
        'error': 'bg-mun-red',
        'info': 'bg-un-blue'
    }
    return colorMap[status] || 'bg-mun-gray-400'
}

const getLogTextColor = (status) => {
    const colorMap = {
        'success': 'text-mun-green-700',
        'error': 'text-mun-red-700',
        'info': 'text-un-blue-700'
    }
    return colorMap[status] || 'text-mun-gray-700'
}

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
/* Progress animations */
.progress-bar {
    transition: width 0.3s ease-in-out;
}

/* Log animation */
.log-item {
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Result card animation */
.result-card {
    animation: slideInUp 0.4s ease-out;
}

.result-card:nth-child(1) {
    animation-delay: 0.1s;
}

.result-card:nth-child(2) {
    animation-delay: 0.2s;
}

.result-card:nth-child(3) {
    animation-delay: 0.3s;
}
</style>