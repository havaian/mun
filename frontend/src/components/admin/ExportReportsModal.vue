<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <ArrowDownTrayIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    Export Reports
                                </h2>
                                <p class="text-white/80 text-sm">
                                    Generate and download comprehensive reports
                                </p>
                            </div>
                        </div>

                        <button @click="closeModal"
                            class="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
                        <div class="p-6 space-y-6">
                            <!-- Export Type Selection -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <DocumentArrowDownIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Report Type
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label v-for="reportType in reportTypes" :key="reportType.value"
                                        class="relative cursor-pointer">
                                        <input v-model="selectedReportType" type="radio" :value="reportType.value"
                                            class="sr-only" />
                                        <div :class="[
                                            'p-4 border-2 rounded-xl transition-all duration-200',
                                            selectedReportType === reportType.value
                                                ? 'border-mun-blue bg-mun-blue/5'
                                                : 'border-mun-gray-200 hover:border-mun-gray-300'
                                        ]">
                                            <div class="flex items-start space-x-3">
                                                <component :is="reportType.icon" :class="[
                                                    'w-6 h-6 mt-0.5',
                                                    selectedReportType === reportType.value
                                                        ? 'text-mun-blue'
                                                        : 'text-mun-gray-500'
                                                ]" />
                                                <div class="flex-1">
                                                    <h4 class="font-medium text-mun-gray-900">{{ reportType.label }}
                                                    </h4>
                                                    <p class="text-sm text-mun-gray-600 mt-1">{{ reportType.description
                                                        }}</p>
                                                    <div class="flex items-center mt-2 space-x-2">
                                                        <span v-for="format in reportType.formats" :key="format"
                                                            class="px-2 py-1 bg-mun-gray-100 text-mun-gray-700 text-xs rounded">
                                                            {{ format.toUpperCase() }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <!-- Date Range Selection -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <CalendarDaysIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Date Range
                                </h3>

                                <div class="space-y-4">
                                    <!-- Quick Date Range Options -->
                                    <div class="flex flex-wrap gap-2">
                                        <button v-for="quickRange in quickDateRanges" :key="quickRange.value"
                                            @click="setQuickDateRange(quickRange.value)" :class="[
                                                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                                                selectedQuickRange === quickRange.value
                                                    ? 'border-mun-blue bg-mun-blue text-white'
                                                    : 'border-mun-gray-300 bg-white text-mun-gray-700 hover:bg-mun-gray-50'
                                            ]">
                                            {{ quickRange.label }}
                                        </button>
                                    </div>

                                    <!-- Custom Date Range -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Start Date
                                            </label>
                                            <input v-model="dateRange.start" type="date" class="mun-input"
                                                :max="dateRange.end || getCurrentDate()" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                End Date
                                            </label>
                                            <input v-model="dateRange.end" type="date" class="mun-input"
                                                :min="dateRange.start" :max="getCurrentDate()" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Filters -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <AdjustmentsHorizontalIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Filters
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Event Selection -->
                                    <div v-if="showEventFilter">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Events
                                        </label>
                                        <select multiple v-model="filters.events" class="mun-input" size="4">
                                            <option v-for="event in availableEvents" :key="event.id" :value="event.id">
                                                {{ event.name }}
                                            </option>
                                        </select>
                                        <p class="text-xs text-mun-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                                    </div>

                                    <!-- Committee Selection -->
                                    <div v-if="showCommitteeFilter">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committees
                                        </label>
                                        <select multiple v-model="filters.committees" class="mun-input" size="4">
                                            <option v-for="committee in availableCommittees" :key="committee.id"
                                                :value="committee.id">
                                                {{ committee.name }} ({{ committee.acronym }})
                                            </option>
                                        </select>
                                        <p class="text-xs text-mun-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                                    </div>

                                    <!-- User Role Filter -->
                                    <div v-if="showUserRoleFilter">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            User Roles
                                        </label>
                                        <div class="space-y-2">
                                            <label v-for="role in userRoles" :key="role.value"
                                                class="flex items-center space-x-2">
                                                <input v-model="filters.userRoles" type="checkbox" :value="role.value"
                                                    class="mun-checkbox" />
                                                <span class="text-sm text-mun-gray-700">{{ role.label }}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- Status Filter -->
                                    <div v-if="showStatusFilter">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Status
                                        </label>
                                        <div class="space-y-2">
                                            <label v-for="status in availableStatuses" :key="status.value"
                                                class="flex items-center space-x-2">
                                                <input v-model="filters.statuses" type="checkbox" :value="status.value"
                                                    class="mun-checkbox" />
                                                <span class="text-sm text-mun-gray-700">{{ status.label }}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Format Selection -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <DocumentIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Export Format
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <label v-for="format in availableFormats" :key="format.value"
                                        class="relative cursor-pointer">
                                        <input v-model="selectedFormat" type="radio" :value="format.value"
                                            class="sr-only" />
                                        <div :class="[
                                            'p-4 border-2 rounded-lg text-center transition-all duration-200',
                                            selectedFormat === format.value
                                                ? 'border-mun-blue bg-mun-blue/5'
                                                : 'border-mun-gray-200 hover:border-mun-gray-300'
                                        ]">
                                            <component :is="format.icon" :class="[
                                                'w-8 h-8 mx-auto mb-2',
                                                selectedFormat === format.value
                                                    ? 'text-mun-blue'
                                                    : 'text-mun-gray-500'
                                            ]" />
                                            <h4 class="font-medium text-mun-gray-900">{{ format.label }}</h4>
                                            <p class="text-xs text-mun-gray-600 mt-1">{{ format.description }}</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <!-- Advanced Options -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Advanced Options
                                </h3>

                                <div class="space-y-4">
                                    <label class="flex items-center space-x-3">
                                        <input v-model="advancedOptions.includePersonalData" type="checkbox"
                                            class="mun-checkbox" />
                                        <div>
                                            <div class="text-sm font-medium text-mun-gray-900">Include Personal Data
                                            </div>
                                            <div class="text-xs text-mun-gray-500">Email addresses, phone numbers, etc.
                                            </div>
                                        </div>
                                    </label>

                                    <label class="flex items-center space-x-3">
                                        <input v-model="advancedOptions.includeStatistics" type="checkbox"
                                            class="mun-checkbox" />
                                        <div>
                                            <div class="text-sm font-medium text-mun-gray-900">Include Statistics</div>
                                            <div class="text-xs text-mun-gray-500">Participation rates, voting patterns,
                                                etc.</div>
                                        </div>
                                    </label>

                                    <label class="flex items-center space-x-3">
                                        <input v-model="advancedOptions.includeDocuments" type="checkbox"
                                            class="mun-checkbox" />
                                        <div>
                                            <div class="text-sm font-medium text-mun-gray-900">Include Documents</div>
                                            <div class="text-xs text-mun-gray-500">Links to submitted documents and
                                                files</div>
                                        </div>
                                    </label>

                                    <label class="flex items-center space-x-3">
                                        <input v-model="advancedOptions.separateSheets" type="checkbox"
                                            class="mun-checkbox" />
                                        <div>
                                            <div class="text-sm font-medium text-mun-gray-900">Separate Sheets</div>
                                            <div class="text-xs text-mun-gray-500">Create separate sheets/tabs for
                                                different data types</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <!-- Export Preview -->
                            <div v-if="selectedReportType" class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <EyeIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Export Preview
                                </h3>

                                <div class="bg-mun-gray-50 rounded-lg p-4">
                                    <div class="flex items-center space-x-3 mb-3">
                                        <DocumentIcon class="w-5 h-5 text-mun-gray-500" />
                                        <span class="font-medium text-mun-gray-900">
                                            {{ getExportFileName() }}
                                        </span>
                                    </div>

                                    <div class="text-sm text-mun-gray-600 space-y-1">
                                        <p><strong>Report Type:</strong> {{ getCurrentReportType()?.label }}</p>
                                        <p><strong>Date Range:</strong> {{ formatDateRange() }}</p>
                                        <p><strong>Format:</strong> {{ getCurrentFormat()?.label }}</p>
                                        <p v-if="hasFilters()"><strong>Filters Applied:</strong> {{ getFilterSummary()
                                            }}</p>
                                        <p><strong>Estimated Size:</strong> {{ getEstimatedSize() }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                        <div class="text-sm text-mun-gray-500">
                            Export will be processed and downloaded automatically
                        </div>

                        <div class="flex space-x-3">
                            <AppButton @click="closeModal" variant="outline" :disabled="isExporting">
                                Cancel
                            </AppButton>

                            <AppButton @click="generateExport" variant="primary" :loading="isExporting"
                                :disabled="!canExport">
                                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                                Generate Export
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    ArrowDownTrayIcon,
    DocumentArrowDownIcon,
    CalendarDaysIcon,
    AdjustmentsHorizontalIcon,
    DocumentIcon,
    CogIcon,
    EyeIcon,
    ChartBarIcon,
    UsersIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const toast = useToast()

// State
const isExporting = ref(false)
const selectedReportType = ref('')
const selectedFormat = ref('xlsx')
const selectedQuickRange = ref('all')
const availableEvents = ref([])
const availableCommittees = ref([])

// Date range
const dateRange = reactive({
    start: '',
    end: ''
})

// Filters
const filters = reactive({
    events: [],
    committees: [],
    userRoles: ['admin', 'presidium', 'delegate'],
    statuses: ['active', 'completed']
})

// Advanced options
const advancedOptions = reactive({
    includePersonalData: false,
    includeStatistics: true,
    includeDocuments: false,
    separateSheets: true
})

// Report types configuration
const reportTypes = [
    {
        value: 'events',
        label: 'Events Report',
        description: 'Complete overview of all events, registrations, and statistics',
        icon: CalendarDaysIcon,
        formats: ['xlsx', 'csv', 'pdf']
    },
    {
        value: 'users',
        label: 'Users Report',
        description: 'User registrations, roles, and activity data',
        icon: UsersIcon,
        formats: ['xlsx', 'csv']
    },
    {
        value: 'committees',
        label: 'Committees Report',
        description: 'Committee information, membership, and session data',
        icon: BuildingOfficeIcon,
        formats: ['xlsx', 'csv', 'pdf']
    },
    {
        value: 'attendance',
        label: 'Attendance Report',
        description: 'Session attendance tracking and participation metrics',
        icon: ClipboardDocumentListIcon,
        formats: ['xlsx', 'csv']
    },
    {
        value: 'documents',
        label: 'Documents Report',
        description: 'Submitted documents, voting records, and resolutions',
        icon: DocumentTextIcon,
        formats: ['xlsx', 'pdf']
    },
    {
        value: 'analytics',
        label: 'Analytics Report',
        description: 'Comprehensive analytics and performance metrics',
        icon: ChartBarIcon,
        formats: ['xlsx', 'pdf']
    }
]

// Quick date ranges
const quickDateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
]

// Export formats
const availableFormats = [
    {
        value: 'xlsx',
        label: 'Excel',
        description: 'Spreadsheet with multiple sheets',
        icon: DocumentIcon
    },
    {
        value: 'csv',
        label: 'CSV',
        description: 'Comma-separated values',
        icon: DocumentIcon
    },
    {
        value: 'pdf',
        label: 'PDF',
        description: 'Formatted report document',
        icon: DocumentIcon
    }
]

// User roles
const userRoles = [
    { value: 'admin', label: 'Administrators' },
    { value: 'presidium', label: 'Presidium Members' },
    { value: 'delegate', label: 'Delegates' }
]

// Available statuses
const availableStatuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'draft', label: 'Draft' }
]

// Computed
const canExport = computed(() => {
    return selectedReportType.value && selectedFormat.value &&
        (selectedQuickRange.value === 'all' || (dateRange.start && dateRange.end))
})

const showEventFilter = computed(() => {
    return ['events', 'attendance', 'documents'].includes(selectedReportType.value)
})

const showCommitteeFilter = computed(() => {
    return ['committees', 'attendance', 'documents'].includes(selectedReportType.value)
})

const showUserRoleFilter = computed(() => {
    return ['users', 'attendance'].includes(selectedReportType.value)
})

const showStatusFilter = computed(() => {
    return selectedReportType.value !== ''
})

// Methods
const closeModal = () => {
    if (isExporting.value) return
    emit('update:modelValue', false)
}

const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0]
}

const setQuickDateRange = (range) => {
    selectedQuickRange.value = range
    const now = new Date()

    switch (range) {
        case 'today':
            dateRange.start = dateRange.end = getCurrentDate()
            break
        case 'week':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
            dateRange.start = weekStart.toISOString().split('T')[0]
            dateRange.end = getCurrentDate()
            break
        case 'month':
            dateRange.start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            dateRange.end = getCurrentDate()
            break
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3)
            dateRange.start = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0]
            dateRange.end = getCurrentDate()
            break
        case 'year':
            dateRange.start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
            dateRange.end = getCurrentDate()
            break
        case 'all':
        default:
            dateRange.start = dateRange.end = ''
            break
    }
}

const loadAvailableData = async () => {
    try {
        // Load events
        const eventsResponse = await apiMethods.get('/admin/events')
        availableEvents.value = eventsResponse.data.events || []

        // Load committees
        const committeesResponse = await apiMethods.get('/admin/committees')
        availableCommittees.value = committeesResponse.data.committees || []

    } catch (error) {
        toast.error('Failed to load available data:', error)
        toast.error('Failed to load filter options')
    }
}

const getCurrentReportType = () => {
    return reportTypes.find(type => type.value === selectedReportType.value)
}

const getCurrentFormat = () => {
    return availableFormats.find(format => format.value === selectedFormat.value)
}

const getExportFileName = () => {
    const reportType = getCurrentReportType()
    const format = getCurrentFormat()
    const timestamp = new Date().toISOString().split('T')[0]

    return `${reportType?.label.replace(/\s+/g, '_')}_Report_${timestamp}.${format?.value}`
}

const formatDateRange = () => {
    if (selectedQuickRange.value === 'all') {
        return 'All time'
    }

    if (!dateRange.start || !dateRange.end) {
        return 'Not specified'
    }

    const start = new Date(dateRange.start).toLocaleDateString()
    const end = new Date(dateRange.end).toLocaleDateString()

    return start === end ? start : `${start} - ${end}`
}

const hasFilters = () => {
    return filters.events.length > 0 ||
        filters.committees.length > 0 ||
        filters.userRoles.length < userRoles.length ||
        filters.statuses.length < availableStatuses.length
}

const getFilterSummary = () => {
    const parts = []

    if (filters.events.length > 0) {
        parts.push(`${filters.events.length} event(s)`)
    }

    if (filters.committees.length > 0) {
        parts.push(`${filters.committees.length} committee(s)`)
    }

    if (filters.userRoles.length !== userRoles.length) {
        parts.push(`${filters.userRoles.length} role(s)`)
    }

    if (filters.statuses.length !== availableStatuses.length) {
        parts.push(`${filters.statuses.length} status(es)`)
    }

    return parts.join(', ') || 'None'
}

const getEstimatedSize = () => {
    // Simple estimation based on report type and filters
    let baseSize = 50 // KB

    if (selectedReportType.value === 'analytics') baseSize *= 3
    if (advancedOptions.includePersonalData) baseSize *= 1.5
    if (advancedOptions.includeDocuments) baseSize *= 2

    if (baseSize < 1024) {
        return `~${Math.round(baseSize)} KB`
    } else {
        return `~${(baseSize / 1024).toFixed(1)} MB`
    }
}

const generateExport = async () => {
    try {
        isExporting.value = true

        const exportData = {
            reportType: selectedReportType.value,
            format: selectedFormat.value,
            dateRange: selectedQuickRange.value === 'all' ? null : dateRange,
            filters: filters,
            options: advancedOptions
        }

        const response = await apiMethods.post('/admin/reports/export', exportData, {
            responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', getExportFileName())
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success('Report exported successfully')
        closeModal()

    } catch (error) {
        toast.error('Export failed:', error)
        toast.error(error.response?.data?.message || 'Failed to generate export')
    } finally {
        isExporting.value = false
    }
}

// Initialize
onMounted(() => {
    if (props.modelValue) {
        loadAvailableData()
        setQuickDateRange('all')
    }
})
</script>

<style scoped>
.mun-card {
    @apply bg-white rounded-xl shadow-sm border border-mun-gray-100;
}

.mun-input {
    @apply w-full px-4 py-3 border border-mun-gray-200 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue transition-colors;
}

.mun-checkbox {
    @apply w-4 h-4 text-mun-blue border-mun-gray-300 rounded focus:ring-mun-blue focus:ring-2;
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Multi-select styling */
select[multiple] {
    background-image: none;
    padding-right: 12px;
}

select[multiple] option {
    padding: 8px 12px;
    border-radius: 4px;
    margin: 2px 0;
}

select[multiple] option:checked {
    background: #009edb;
    color: white;
}

/* Date input styling */
input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.6);
}

input[type="date"]::-webkit-calendar-picker-indicator:hover {
    filter: invert(0.4);
}

/* Format selection cards hover effect */
.format-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .grid-cols-1.md\\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .grid-cols-1.md\\:grid-cols-3 {
        grid-template-columns: 1fr;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .border-2 {
        border-width: 3px;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {

    .modal-enter-active,
    .modal-leave-active {
        transition: none;
    }

    .format-card:hover {
        transform: none;
    }

    input[type="radio"]:checked+div,
    input[type="checkbox"]:checked+div {
        transform: none;
    }
}
</style>