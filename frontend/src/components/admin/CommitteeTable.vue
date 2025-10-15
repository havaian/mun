<template>
    <div class="bg-white rounded-2xl shadow-mun border border-white/20 overflow-hidden">
        <!-- Table Header -->
        <div class="px-6 py-4 border-b border-mun-gray-200 bg-mun-gray-50">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-mun-gray-900">Committees List</h3>

                <!-- Select All -->
                <div class="flex items-center space-x-3">
                    <label class="flex items-center text-sm text-mun-gray-600">
                        <input type="checkbox" :checked="isAllSelected" :indeterminate="isIndeterminate"
                            @change="$emit('select-all')"
                            class="input-field mr-2 h-4 w-4" />
                        Select All
                    </label>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-mun-gray-200">
                <thead class="bg-mun-gray-50">
                    <tr>
                        <!-- Selection -->
                        <th scope="col" class="w-12 px-6 py-3">
                            <span class="sr-only">Select</span>
                        </th>

                        <!-- Committee Name -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('name')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Committee Name</span>
                                <SortIcon :column="'name'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Type -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('type')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Type</span>
                                <SortIcon :column="'type'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Event -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <span class="text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Event
                            </span>
                        </th>

                        <!-- Status -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <span class="text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                Status
                            </span>
                        </th>

                        <!-- Countries -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('countries')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Countries</span>
                                <SortIcon :column="'countries'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- QR Status -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <span class="text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                QR Status
                            </span>
                        </th>

                        <!-- Created -->
                        <th scope="col" class="px-6 py-3 text-left">
                            <button @click="handleSort('createdAt')"
                                class="group flex items-center space-x-1 text-xs font-medium text-mun-gray-500 uppercase tracking-wider hover:text-mun-gray-700">
                                <span>Created</span>
                                <SortIcon :column="'createdAt'" :current-sort="currentSort"
                                    :current-direction="currentDirection" />
                            </button>
                        </th>

                        <!-- Actions -->
                        <th scope="col" class="relative px-6 py-3">
                            <span class="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>

                <tbody class="bg-white divide-y divide-mun-gray-200">
                    <tr v-if="loading" class="animate-pulse">
                        <td colspan="9" class="px-6 py-12 text-center">
                            <LoadingSpinner size="md" />
                            <p class="mt-2 text-sm text-mun-gray-500">Loading committees...</p>
                        </td>
                    </tr>

                    <tr v-else-if="committees.length === 0">
                        <td colspan="9" class="px-6 py-12 text-center">
                            <UserGroupIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                            <p class="text-mun-gray-500">No committees to display</p>
                        </td>
                    </tr>

                    <tr v-else v-for="committee in committees" :key="committee._id"
                        class="hover:bg-mun-gray-50 transition-colors"
                        :class="{ 'bg-mun-blue-50': selected.includes(committee._id) }">
                        <!-- Selection -->
                        <td class="px-6 py-4">
                            <input type="checkbox" :checked="selected.includes(committee._id)"
                                @change="$emit('select', committee._id)"
                                class="input-field h-4 w-4" />
                        </td>

                        <!-- Committee Name -->
                        <td class="px-6 py-4">
                            <div class="flex items-center cursor-pointer" @click="$emit('view', committee)">
                                <div class="flex-shrink-0 w-10 h-10">
                                    <div :class="[
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        getCommitteeTypeIconClass(committee.type)
                                    ]">
                                        <component :is="getCommitteeTypeIcon(committee.type)"
                                            class="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <div
                                        class="text-sm font-medium text-mun-gray-900 hover:text-mun-blue transition-colors">
                                        {{ committee.name }}
                                    </div>
                                    <div class="text-sm text-mun-gray-500">
                                        {{ committee.abbreviation || committee.topic || 'No topic' }}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <!-- Type -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-mun-gray-900">
                                {{ formatCommitteeType(committee.type) }}
                            </div>
                        </td>

                        <!-- Event -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-mun-gray-900">
                                {{ committee.eventId?.name || 'No event' }}
                            </div>
                        </td>

                        <!-- Status -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="getStatusBadgeClass(committee.status)">
                                {{ formatStatus(committee.status) }}
                            </span>
                        </td>

                        <!-- Countries -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="text-sm text-mun-gray-900">
                                    {{ committee.countries?.length || 0 }}
                                </div>
                                <div v-if="committee.maxCountries" class="text-sm text-mun-gray-500 ml-1">
                                    / {{ committee.maxCountries }}
                                </div>
                            </div>
                            <div v-if="committee.maxCountries"
                                class="mt-1 w-full bg-mun-gray-200 rounded-full h-1.5 max-w-[80px]">
                                <div class="bg-mun-blue h-1.5 rounded-full transition-all duration-300"
                                    :style="{ width: `${getCountryProgress(committee)}%` }"></div>
                            </div>
                        </td>

                        <!-- QR Status -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div v-if="committee.qrGenerated"
                                    class="flex items-center space-x-1 text-mun-green-600">
                                    <CheckCircleIcon class="w-4 h-4" />
                                    <span class="text-sm">Generated</span>
                                </div>
                                <div v-else class="flex items-center space-x-1 text-mun-gray-400">
                                    <ClockIcon class="w-4 h-4" />
                                    <span class="text-sm">Pending</span>
                                </div>
                            </div>
                        </td>

                        <!-- Created -->
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-500">
                            {{ formatRelativeDate(committee.createdAt) }}
                        </td>

                        <!-- Actions -->
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end space-x-2">
                                <!-- Quick Actions -->
                                <button @click.stop="$emit('view', committee)"
                                    class="text-mun-blue hover:text-mun-blue-600 transition-colors" title="View Details">
                                    <EyeIcon class="w-4 h-4" />
                                </button>

                                <button @click.stop="$emit('edit', committee)"
                                    class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors"
                                    title="Edit Committee">
                                    <PencilIcon class="w-4 h-4" />
                                </button>

                                <button @click.stop="$emit('manage-countries', committee)"
                                    class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors"
                                    title="Manage Countries">
                                    <GlobeAltIcon class="w-4 h-4" />
                                </button>

                                <!-- More Actions Menu -->
                                <div class="relative">
                                    <button @click.stop="toggleActionsMenu(committee._id)"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors"
                                        title="More Actions">
                                        <EllipsisVerticalIcon class="w-4 h-4" />
                                    </button>

                                    <!-- Actions Dropdown -->
                                    <transition name="dropdown">
                                        <div v-if="activeActionsMenu === committee._id"
                                            class="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-mun-lg border border-white/20 py-2 z-20">

                                            <button @click.stop="handleGenerateQR(committee)"
                                                :disabled="!committee.countries?.length" :class="[
                                                    'w-full px-4 py-2 text-left text-sm hover:bg-mun-gray-50 flex items-center space-x-2',
                                                    committee.countries?.length ? 'text-mun-gray-700' : 'text-mun-gray-400 cursor-not-allowed'
                                                ]">
                                                <QrCodeIcon class="w-4 h-4" />
                                                <span>{{ committee.qrGenerated ? 'Regenerate QR' : 'Generate QR'
                                                }}</span>
                                            </button>

                                            <button @click.stop="handleDuplicate(committee)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <DocumentDuplicateIcon class="w-4 h-4" />
                                                <span>Duplicate Committee</span>
                                            </button>

                                            <button @click.stop="handleToggleStatus(committee)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <component :is="getToggleStatusIcon(committee.status)"
                                                    class="w-4 h-4" />
                                                <span>{{ getToggleStatusText(committee.status) }}</span>
                                            </button>

                                            <div v-if="committee.qrGenerated" class="border-t border-mun-gray-100 my-1">
                                            </div>

                                            <button v-if="committee.qrGenerated" @click.stop="downloadQRs(committee)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <DocumentArrowDownIcon class="w-4 h-4" />
                                                <span>Download QR Codes</span>
                                            </button>

                                            <button v-if="committee.countries?.length > 0"
                                                @click.stop="downloadCountryList(committee)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <DocumentTextIcon class="w-4 h-4" />
                                                <span>Download Country List</span>
                                            </button>

                                            <div v-if="committee.status === 'active'"
                                                class="border-t border-mun-gray-100 my-1"></div>

                                            <button v-if="committee.status === 'active'"
                                                @click.stop="goToLiveView(committee)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-gray-700 hover:bg-mun-gray-50 flex items-center space-x-2">
                                                <PlayIcon class="w-4 h-4" />
                                                <span>Live Committee View</span>
                                            </button>

                                            <div class="border-t border-mun-gray-100 my-1"></div>

                                            <button @click.stop="handleDelete(committee)"
                                                class="w-full px-4 py-2 text-left text-sm text-mun-red-600 hover:bg-mun-red-50 flex items-center space-x-2">
                                                <TrashIcon class="w-4 h-4" />
                                                <span>Delete Committee</span>
                                            </button>
                                        </div>
                                    </transition>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    UserGroupIcon,
    CheckCircleIcon,
    ClockIcon,
    EyeIcon,
    PencilIcon,
    GlobeAltIcon,
    EllipsisVerticalIcon,
    QrCodeIcon,
    DocumentDuplicateIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    TrashIcon,
    PlayIcon,
    PauseIcon,
    ShieldCheckIcon,
    BuildingLibraryIcon,
    ScaleIcon
} from '@heroicons/vue/24/outline'

import SortIcon from '@/components/ui/SortIcon.vue'

const router = useRouter()

// Props
const props = defineProps({
    committees: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    selected: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits([
    'view', 'edit', 'delete', 'duplicate', 'manage-countries',
    'generate-qr', 'toggle-status', 'sort', 'select', 'select-all'
])

// State
const activeActionsMenu = ref(null)
const currentSort = ref('')
const currentDirection = ref('asc')

// Computed
const isAllSelected = computed(() => {
    return props.committees.length > 0 &&
        props.committees.every(c => props.selected.includes(c._id))
})

const isIndeterminate = computed(() => {
    return props.selected.length > 0 && !isAllSelected.value
})

// Methods
const getCommitteeTypeIcon = (type) => {
    switch (type) {
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
}

const getCommitteeTypeIconClass = (type) => {
    switch (type) {
        case 'GA':
            return 'bg-mun-blue'
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
}

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

const getStatusBadgeClass = (status) => {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (status) {
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

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
}

const getCountryProgress = (committee) => {
    if (!committee.maxCountries) return 0

    const assigned = committee.countries?.length || 0
    return Math.min(100, Math.round((assigned / committee.maxCountries) * 100))
}

const getToggleStatusIcon = (status) => {
    return status === 'active' ? PauseIcon : PlayIcon
}

const getToggleStatusText = (status) => {
    switch (status) {
        case 'active':
            return 'Pause Committee'
        case 'paused':
            return 'Resume Committee'
        default:
            return 'Activate Committee'
    }
}

const handleSort = (column) => {
    if (currentSort.value === column) {
        currentDirection.value = currentDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        currentSort.value = column
        currentDirection.value = 'asc'
    }

    emit('sort', column, currentDirection.value)
}

const toggleActionsMenu = (committeeId) => {
    activeActionsMenu.value = activeActionsMenu.value === committeeId ? null : committeeId
}

const handleGenerateQR = (committee) => {
    activeActionsMenu.value = null
    emit('generate-qr', committee)
}

const handleDuplicate = (committee) => {
    activeActionsMenu.value = null
    emit('duplicate', committee)
}

const handleToggleStatus = (committee) => {
    activeActionsMenu.value = null
    emit('toggle-status', committee)
}

const handleDelete = (committee) => {
    activeActionsMenu.value = null
    emit('delete', committee)
}

const downloadQRs = (committee) => {
    activeActionsMenu.value = null
    window.open(`/api/export/qr-codes/${committee._id}`, '_blank')
}

const downloadCountryList = (committee) => {
    activeActionsMenu.value = null
    window.open(`/api/export/committee-countries/${committee._id}`, '_blank')
}

const goToLiveView = (committee) => {
    activeActionsMenu.value = null
    router.push({
        name: 'CommitteeLive',
        params: { id: committee._id }
    })
}

// Click outside handler
const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        activeActionsMenu.value = null
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
    transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

/* Table row hover effect */
tbody tr:hover {
    background-color: #f8fafc;
}

/* Selection row highlight */
tr.bg-mun-blue-50 {
    background-color: #f0f9ff;
}

/* Progress bar animation */
.progress-bar {
    transition: width 0.3s ease;
}

/* Indeterminate checkbox styling */
input[type="checkbox"]:indeterminate {
    background-color: #009edb;
    border-color: #009edb;
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3 8h10'/%3e%3c/svg%3e");
}
</style>