<template>
    <div class="mun-card group hover:shadow-mun-lg transition-all duration-300 cursor-pointer relative"
        @click="$emit('view', committee)">

        <!-- Selection Checkbox -->
        <div class="absolute top-4 left-4 z-10">
            <input type="checkbox" :checked="selected" @click.stop="$emit('select', committee._id)"
                class="h-4 w-4 text-un-blue focus:ring-un-blue border-mun-gray-300 rounded" />
        </div>

        <!-- QR Status Indicator -->
        <div class="absolute top-4 right-4">
            <div v-if="committee.qrGenerated"
                class="bg-mun-green-100 text-mun-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <QrCodeIcon class="w-3 h-3" />
                <span>QR Ready</span>
            </div>
            <div v-else class="bg-mun-gray-100 text-mun-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                No QR
            </div>
        </div>

        <!-- Card Content -->
        <div class="p-6 pt-12">
            <!-- Committee Type Icon -->
            <div class="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" :class="committeeTypeIconClass">
                <component :is="committeeTypeIcon" class="w-6 h-6 text-white" />
            </div>

            <!-- Committee Info -->
            <div class="mb-4">
                <h3 class="text-lg font-bold text-mun-gray-900 mb-2 group-hover:text-un-blue transition-colors">
                    {{ committee.name }}
                </h3>

                <div class="space-y-2">
                    <!-- Committee Type -->
                    <div class="flex items-center text-sm text-mun-gray-600">
                        <component :is="committeeTypeIcon" class="w-4 h-4 mr-2" />
                        <span>{{ formatCommitteeType(committee.type) }}</span>
                    </div>

                    <!-- Event -->
                    <div v-if="committee.eventId" class="flex items-center text-sm text-mun-gray-600">
                        <CalendarDaysIcon class="w-4 h-4 mr-2" />
                        <span class="truncate">{{ committee.eventId.name }}</span>
                    </div>

                    <!-- Status -->
                    <div class="flex items-center">
                        <span :class="statusBadgeClass">
                            {{ formatStatus(committee.status) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Statistics -->
            <div class="grid grid-cols-3 gap-4 py-4 border-t border-b border-mun-gray-100 mb-4">
                <div class="text-center">
                    <div class="text-lg font-bold text-mun-gray-900">
                        {{ committee.countries?.length || 0 }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Countries</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-mun-gray-900">
                        {{ committee.presidium?.length || 0 }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Presidium</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-mun-gray-900">
                        {{ committee.documents?.length || 0 }}
                    </div>
                    <div class="text-xs text-mun-gray-500">Documents</div>
                </div>
            </div>

            <!-- Progress Indicators -->
            <div class="space-y-3 mb-4">
                <!-- Country Assignment Progress -->
                <div>
                    <div class="flex items-center justify-between text-sm mb-1">
                        <span class="text-mun-gray-600">Countries Assigned</span>
                        <span class="font-medium">{{ getCountryProgress() }}%</span>
                    </div>
                    <div class="w-full bg-mun-gray-200 rounded-full h-2">
                        <div class="bg-un-blue h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${getCountryProgress()}%` }"></div>
                    </div>
                </div>

                <!-- Presidium Assignment Progress -->
                <div>
                    <div class="flex items-center justify-between text-sm mb-1">
                        <span class="text-mun-gray-600">Presidium Setup</span>
                        <span class="font-medium">{{ getPresidiumProgress() }}%</span>
                    </div>
                    <div class="w-full bg-mun-gray-200 rounded-full h-2">
                        <div class="bg-mun-purple-500 h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${getPresidiumProgress()}%` }"></div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-2">
                <AppButton variant="primary" size="sm" @click.stop="$emit('view', committee)" class="flex-1">
                    <EyeIcon class="w-4 h-4 mr-2" />
                    Details
                </AppButton>

                <!-- Quick Actions Dropdown -->
                <div class="relative">
                    <button @click.stop="showActions = !showActions"
                        class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <EllipsisVerticalIcon class="w-4 h-4 text-mun-gray-600" />
                    </button>

                    <!-- Actions Menu -->
                    <transition name="dropdown">
                        <div v-if="showActions"
                            class="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-mun-lg border border-white/20 py-2 z-20">

                            <button @click.stop="handleEdit"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <PencilIcon class="w-4 h-4" />
                                <span>Edit Committee</span>
                            </button>

                            <button @click.stop="handleManageCountries"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <GlobeAltIcon class="w-4 h-4" />
                                <span>Manage Countries</span>
                            </button>

                            <button @click.stop="handleGenerateQR" :disabled="!canGenerateQR" :class="[
                                'w-full px-4 py-2 text-left text-sm hover:bg-mun-gray-50 flex items-center space-x-2',
                                canGenerateQR ? 'text-mun-gray-700' : 'text-mun-gray-400 cursor-not-allowed'
                            ]">
                                <QrCodeIcon class="w-4 h-4" />
                                <span>{{ committee.qrGenerated ? 'Regenerate QR' : 'Generate QR' }}</span>
                            </button>

                            <div class="border-t border-mun-gray-100 my-1"></div>

                            <button @click.stop="handleDuplicate"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <DocumentDuplicateIcon class="w-4 h-4" />
                                <span>Duplicate</span>
                            </button>

                            <button @click.stop="handleToggleStatus"
                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                <component :is="toggleStatusIcon" class="w-4 h-4" />
                                <span>{{ toggleStatusText }}</span>
                            </button>

                            <div class="border-t border-mun-gray-100 my-1"></div>

                            <button @click.stop="handleDelete"
                                class="w-full px-4 py-2 text-left text-sm text-mun-red-600 hover:bg-mun-red-50 flex items-center space-x-2">
                                <TrashIcon class="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    </transition>
                </div>
            </div>
        </div>

        <!-- Quick Access Icons (show on hover) -->
        <div class="absolute top-16 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="flex flex-col space-y-2">
                <button v-if="committee.countries?.length > 0" @click.stop="downloadCountryList"
                    class="bg-un-blue text-white p-2 rounded-lg hover:bg-un-blue-600 transition-colors"
                    title="Download Country List">
                    <DocumentArrowDownIcon class="w-4 h-4" />
                </button>

                <button v-if="committee.qrGenerated" @click.stop="downloadQRCodes"
                    class="bg-mun-purple-500 text-white p-2 rounded-lg hover:bg-mun-purple-600 transition-colors"
                    title="Download QR Codes">
                    <QrCodeIcon class="w-4 h-4" />
                </button>

                <button v-if="committee.status === 'active'" @click.stop="goToLiveView"
                    class="bg-mun-green-500 text-white p-2 rounded-lg hover:bg-mun-green-600 transition-colors"
                    title="Live Committee View">
                    <PlayIcon class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Last Updated Info -->
        <div class="absolute bottom-4 right-4 text-xs text-mun-gray-500">
            Updated {{ formatRelativeDate(committee.updatedAt) }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    CalendarDaysIcon,
    EyeIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    GlobeAltIcon,
    QrCodeIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    DocumentArrowDownIcon,
    PlayIcon,
    PauseIcon,
    UserGroupIcon,
    BuildingLibraryIcon,
    ScaleIcon,
    ShieldCheckIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

// Props
const props = defineProps({
    committee: {
        type: Object,
        required: true
    },
    selected: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'view', 'edit', 'delete', 'duplicate', 'manage-countries',
    'generate-qr', 'toggle-status', 'select'
])

// State
const showActions = ref(false)

// Computed
const committeeTypeIcon = computed(() => {
    switch (props.committee.type) {
        case 'GA':
            return UserGroupIcon
        case 'SC':
            return ShieldCheckIcon
        case 'ECOSOC':
            return BuildingLibraryIcon
        case 'HRC':
            return ScaleIcon
        case 'LEGAL':
            return ScaleIcon
        case 'DISEC':
            return ShieldCheckIcon
        case 'SPECPOL':
            return UserGroupIcon
        default:
            return UserGroupIcon
    }
})

const committeeTypeIconClass = computed(() => {
    switch (props.committee.type) {
        case 'GA':
            return 'bg-un-blue'
        case 'SC':
            return 'bg-mun-red-500'
        case 'ECOSOC':
            return 'bg-mun-green-500'
        case 'HRC':
            return 'bg-mun-purple-500'
        case 'LEGAL':
            return 'bg-mun-yellow-500'
        case 'DISEC':
            return 'bg-mun-red-600'
        case 'SPECPOL':
            return 'bg-mun-blue-600'
        default:
            return 'bg-mun-gray-500'
    }
})

const statusBadgeClass = computed(() => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (props.committee.status) {
        case 'draft':
            return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
        case 'setup':
            return `${baseClass} bg-blue-100 text-blue-800`
        case 'active':
            return `${baseClass} bg-mun-green-100 text-mun-green-800`
        case 'paused':
            return `${baseClass} bg-mun-yellow-100 text-mun-yellow-800`
        case 'completed':
            return `${baseClass} bg-mun-purple-100 text-mun-purple-800`
        default:
            return `${baseClass} bg-mun-gray-100 text-mun-gray-800`
    }
})

const toggleStatusIcon = computed(() => {
    return props.committee.status === 'active' ? PauseIcon : PlayIcon
})

const toggleStatusText = computed(() => {
    switch (props.committee.status) {
        case 'active':
            return 'Pause Committee'
        case 'paused':
            return 'Resume Committee'
        default:
            return 'Activate Committee'
    }
})

const canGenerateQR = computed(() => {
    return props.committee.countries?.length > 0
})

// Methods
const formatCommitteeType = (type) => {
    const typeMap = {
        'GA': 'General Assembly',
        'SC': 'Security Council',
        'ECOSOC': 'Economic and Social Council',
        'HRC': 'Human Rights Council',
        'LEGAL': 'Legal Committee',
        'DISEC': 'Disarmament Committee',
        'SPECPOL': 'Special Political Committee',
        'OTHER': 'Other'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'draft': 'Draft',
        'setup': 'Setup',
        'active': 'Active',
        'paused': 'Paused',
        'completed': 'Completed'
    }
    return statusMap[status] || 'Unknown'
}

const formatRelativeDate = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}m ago`
}

const getCountryProgress = () => {
    const assigned = props.committee.countries?.length || 0
    const maxCountries = getMaxCountriesForType()

    if (maxCountries === 0) return 0
    return Math.min(100, Math.round((assigned / maxCountries) * 100))
}

const getPresidiumProgress = () => {
    const presidium = props.committee.presidium || []
    const assigned = presidium.filter(p => p.email).length
    const required = getRequiredPresidiumForType()

    if (required === 0) return 100
    return Math.min(100, Math.round((assigned / required) * 100))
}

const getMaxCountriesForType = () => {
    switch (props.committee.type) {
        case 'SC':
            return 15
        case 'GA':
            return 193
        case 'ECOSOC':
            return 54
        case 'HRC':
            return 47
        default:
            return 50
    }
}

const getRequiredPresidiumForType = () => {
    // Most committees need: Chairman, Co-Chairman, Expert, Secretary
    return 4
}

// Action handlers
const handleEdit = () => {
    showActions.value = false
    emit('edit', props.committee)
}

const handleDelete = () => {
    showActions.value = false
    emit('delete', props.committee)
}

const handleDuplicate = () => {
    showActions.value = false
    emit('duplicate', props.committee)
}

const handleToggleStatus = () => {
    showActions.value = false
    emit('toggle-status', props.committee)
}

const handleManageCountries = () => {
    showActions.value = false
    emit('manage-countries', props.committee)
}

const handleGenerateQR = () => {
    showActions.value = false
    emit('generate-qr', props.committee)
}

// Quick actions
const downloadCountryList = () => {
    window.open(`/api/export/committee-countries/${props.committee._id}`, '_blank')
}

const downloadQRCodes = () => {
    window.open(`/api/export/qr-codes/${props.committee._id}`, '_blank')
}

const goToLiveView = () => {
    router.push({
        name: 'CommitteeLive',
        params: { id: props.committee._id }
    })
}

// Click outside handler
const handleClickOutside = (event) => {
    if (!event.target.closest('.actions-dropdown')) {
        showActions.value = false
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}

/* Card hover effects */
.mun-card:hover {
    transform: translateY(-2px);
}

/* Progress bar animation */
.progress-bar {
    transition: width 0.3s ease;
}
</style>