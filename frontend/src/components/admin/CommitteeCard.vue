<template>
    <div class="mun-card hover-lift group relative overflow-hidden">
        <!-- Committee Type Indicator -->
        <div class="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-current"
            :class="typeColorClasses">
            <div class="absolute -top-8 -right-1 text-white text-xs font-bold rotate-45">
                {{ committee.type?.toUpperCase() }}
            </div>
        </div>

        <!-- Card Header -->
        <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                        <div :class="['p-2 rounded-lg', typeIconBgClasses]">
                            <component :is="typeIcon" :class="['w-5 h-5', typeIconClasses]" />
                        </div>
                        <div>
                            <h3
                                class="text-lg font-semibold text-mun-gray-900 group-hover:text-un-blue transition-colors">
                                {{ committee.name }}
                            </h3>
                            <div class="flex items-center space-x-2 text-sm text-mun-gray-500">
                                <span>{{ formatCommitteeType(committee.type) }}</span>
                                <span>•</span>
                                <span>{{ committee.language || 'English' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Badge -->
                <div :class="statusBadgeClasses">
                    <component :is="statusIcon" class="w-4 h-4 mr-1" />
                    {{ formatStatus(committee.status) }}
                </div>
            </div>

            <!-- Event Info -->
            <div class="flex items-center text-sm text-mun-gray-600 mb-4">
                <CalendarDaysIcon class="w-4 h-4 mr-2" />
                <span>{{ eventName }}</span>
            </div>

            <!-- Description -->
            <p v-if="committee.description" class="text-sm text-mun-gray-600 line-clamp-2 mb-4">
                {{ committee.description }}
            </p>
        </div>

        <!-- Statistics -->
        <div class="px-6 pb-4">
            <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-mun-gray-900">
                        {{ committee.countries?.length || 0 }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Countries</div>
                </div>

                <div class="text-center">
                    <div class="text-2xl font-bold text-mun-green-600">
                        {{ registeredCount }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Registered</div>
                </div>

                <div class="text-center">
                    <div class="text-2xl font-bold text-un-blue-600">
                        {{ qrGeneratedCount }}
                    </div>
                    <div class="text-xs text-mun-gray-500">QR Codes</div>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4">
                <div class="flex justify-between text-xs text-mun-gray-500 mb-1">
                    <span>Registration Progress</span>
                    <span>{{ registrationProgress }}%</span>
                </div>
                <div class="w-full bg-mun-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-un-blue to-mun-green h-2 rounded-full transition-all duration-500"
                        :style="{ width: `${registrationProgress}%` }"></div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="px-6 py-4 bg-mun-gray-50/50 border-t border-mun-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                    <!-- Country Management -->
                    <ActionButton :icon="FlagIcon" tooltip="Manage Countries"
                        @click="$emit('manage-countries', committee)" />

                    <!-- QR Generation -->
                    <ActionButton :icon="QrCodeIcon" tooltip="Generate QR Codes"
                        @click="$emit('generate-qr', committee)" :disabled="!hasCountries" />

                    <!-- View Details -->
                    <ActionButton :icon="EyeIcon" tooltip="View Details" @click="$emit('view-details', committee)" />
                </div>

                <!-- More Actions Menu -->
                <div class="relative">
                    <ActionButton :icon="EllipsisVerticalIcon" tooltip="More Actions"
                        @click="showActionsMenu = !showActionsMenu" />

                    <!-- Actions Dropdown -->
                    <transition enter-active-class="transition ease-out duration-100"
                        enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                        leave-active-class="transition ease-in duration-75"
                        leave-from-class="transform opacity-100 scale-100"
                        leave-to-class="transform opacity-0 scale-95">
                        <div v-show="showActionsMenu"
                            class="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-mun-lg border border-white/20 py-2 z-10">
                            <button @click="handleAction('edit')"
                                class="flex items-center w-full px-4 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-50">
                                <PencilIcon class="w-4 h-4 mr-3" />
                                Edit Committee
                            </button>

                            <button @click="handleAction('export-pdf')"
                                class="flex items-center w-full px-4 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-50"
                                :disabled="!hasQRCodes">
                                <DocumentArrowDownIcon class="w-4 h-4 mr-3" />
                                Export QR PDF
                            </button>

                            <button @click="handleAction('duplicate')"
                                class="flex items-center w-full px-4 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-50">
                                <DocumentDuplicateIcon class="w-4 h-4 mr-3" />
                                Duplicate Committee
                            </button>

                            <hr class="my-2 border-mun-gray-100" />

                            <button @click="handleAction('delete')"
                                class="flex items-center w-full px-4 py-2 text-sm text-mun-red-600 hover:bg-mun-red-50">
                                <TrashIcon class="w-4 h-4 mr-3" />
                                Delete Committee
                            </button>
                        </div>
                    </transition>
                </div>
            </div>
        </div>

        <!-- Loading Overlay -->
        <transition name="fade">
            <div v-if="isProcessing"
                class="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
                <div class="text-center">
                    <LoadingSpinner size="lg" />
                    <p class="mt-3 text-sm text-mun-gray-600">{{ processingMessage }}</p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onClickOutside } from 'vue'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import {
    CalendarDaysIcon,
    FlagIcon,
    QrCodeIcon,
    EyeIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    DocumentArrowDownIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    PlayIcon,
    PauseIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline'
import ActionButton from './ActionButton.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const props = defineProps({
    committee: {
        type: Object,
        required: true
    }
})

const emit = defineEmits([
    'edit',
    'manage-countries',
    'generate-qr',
    'view-details',
    'delete'
])

const appStore = useAppStore()

// State
const showActionsMenu = ref(false)
const isProcessing = ref(false)
const processingMessage = ref('')

// Computed
const eventName = computed(() => {
    return props.committee.eventId?.name || props.committee.eventName || 'Unknown Event'
})

const registeredCount = computed(() => {
    return props.committee.countries?.filter(country => country.email)?.length || 0
})

const qrGeneratedCount = computed(() => {
    const delegateQRs = props.committee.countries?.filter(country => country.qrToken)?.length || 0
    const presidiumQRs = props.committee.presidium?.filter(p => p.qrToken)?.length || 0
    return delegateQRs + presidiumQRs
})

const registrationProgress = computed(() => {
    const total = props.committee.countries?.length || 0
    if (total === 0) return 0
    return Math.round((registeredCount.value / total) * 100)
})

const hasCountries = computed(() => {
    return (props.committee.countries?.length || 0) > 0
})

const hasQRCodes = computed(() => {
    return qrGeneratedCount.value > 0
})

const typeIcon = computed(() => {
    const iconMap = {
        'GA': UserGroupIcon,
        'SC': ShieldCheckIcon,
        'other': GlobeAltIcon
    }
    return iconMap[props.committee.type] || GlobeAltIcon
})

const typeColorClasses = computed(() => {
    const colorMap = {
        'GA': 'text-blue-500',
        'SC': 'text-red-500',
        'other': 'text-mun-gray-500'
    }
    return colorMap[props.committee.type] || colorMap.other
})

const typeIconBgClasses = computed(() => {
    const colorMap = {
        'GA': 'bg-blue-50',
        'SC': 'bg-red-50',
        'other': 'bg-mun-gray-50'
    }
    return colorMap[props.committee.type] || colorMap.other
})

const typeIconClasses = computed(() => {
    const colorMap = {
        'GA': 'text-blue-600',
        'SC': 'text-red-600',
        'other': 'text-mun-gray-600'
    }
    return colorMap[props.committee.type] || colorMap.other
})

const statusIcon = computed(() => {
    const iconMap = {
        'setup': PencilIcon,
        'active': PlayIcon,
        'paused': PauseIcon,
        'completed': CheckCircleIcon
    }
    return iconMap[props.committee.status] || PencilIcon
})

const statusBadgeClasses = computed(() => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'

    const colorMap = {
        'setup': 'bg-mun-yellow-50 text-mun-yellow-700 border border-mun-yellow-200',
        'active': 'bg-mun-green-50 text-mun-green-700 border border-mun-green-200',
        'paused': 'bg-mun-gray-50 text-mun-gray-700 border border-mun-gray-200',
        'completed': 'bg-un-blue-50 text-un-blue-700 border border-un-blue-200'
    }

    return `${baseClasses} ${colorMap[props.committee.status] || colorMap.setup}`
})

// Methods
const formatCommitteeType = (type) => {
    const typeMap = {
        'GA': 'General Assembly',
        'SC': 'Security Council',
        'other': 'Other Committee'
    }
    return typeMap[type] || 'Unknown Type'
}

const formatStatus = (status) => {
    const statusMap = {
        'setup': 'Setup',
        'active': 'Active',
        'paused': 'Paused',
        'completed': 'Completed'
    }
    return statusMap[status] || 'Setup'
}

const handleAction = async (action) => {
    showActionsMenu.value = false

    switch (action) {
        case 'edit':
            emit('edit', props.committee)
            break

        case 'export-pdf':
            await exportQRPDF()
            break

        case 'duplicate':
            await duplicateCommittee()
            break

        case 'delete':
            emit('delete', props.committee)
            break
    }
}

const exportQRPDF = async () => {
    try {
        isProcessing.value = true
        processingMessage.value = 'Generating QR PDF...'

        const response = await apiMethods.export.generateQRPDF(props.committee._id)

        // Create blob and download
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `QR_Codes_${props.committee.name.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        appStore.showSuccessMessage('QR PDF downloaded successfully')

    } catch (error) {
        console.error('Export PDF error:', error)
        appStore.showErrorMessage('Failed to export QR PDF')
    } finally {
        isProcessing.value = false
    }
}

const duplicateCommittee = async () => {
    try {
        isProcessing.value = true
        processingMessage.value = 'Duplicating committee...'

        const duplicatedCommittee = {
            ...props.committee,
            name: `${props.committee.name} (Copy)`,
            status: 'setup',
            countries: props.committee.countries?.map(country => ({
                ...country,
                email: null,
                qrToken: null,
                isQrActive: true,
                registeredAt: null
            }))
        }

        delete duplicatedCommittee._id
        delete duplicatedCommittee.createdAt
        delete duplicatedCommittee.updatedAt

        const response = await apiMethods.committees.create(duplicatedCommittee)

        if (response.data.success) {
            appStore.showSuccessMessage('Committee duplicated successfully')
            // The parent component should refresh the list
        }

    } catch (error) {
        console.error('Duplicate committee error:', error)
        appStore.showErrorMessage('Failed to duplicate committee')
    } finally {
        isProcessing.value = false
    }
}

// Close dropdown when clicking outside
onClickOutside(showActionsMenu, () => {
    showActionsMenu.value = false
})
</script>

<style scoped>
/* Line clamp utility */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Hover effects */
.hover-lift {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 158, 219, 0.15);
}

/* Progress bar animation */
.progress-bar {
    transition: width 0.5s ease-in-out;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>