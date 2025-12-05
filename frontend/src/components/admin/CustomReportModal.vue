<template>
    <ModalWrapper :model-value="modelValue" title="Custom Report Builder"
        subtitle="Create advanced reports with custom data fields and filters" :icon="ChartBarIcon" size="full"
        height="full" variant="primary" :has-unsaved-changes="hasChanges" :is-loading="isGenerating"
        cancel-text="Cancel" primary-text="Generate Report" :is-primary-disabled="!canGenerate" @close="closeModal"
        @primary-action="generateReport">
        <template #content>
            <div class="flex h-full">
                <!-- Sidebar - Report Builder -->
                <div class="w-80 border-r border-mun-gray-200 bg-mun-gray-50 flex flex-col">
                    <div class="p-6 flex-1 overflow-y-auto">
                        <div class="space-y-6">
                            <!-- Report Type Selection -->
                            <div>
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Report Configuration</h3>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Report Name *
                                        </label>
                                        <input v-model="reportConfig.name" type="text" class="input-field"
                                            placeholder="Enter report name" required />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Data Source *
                                        </label>
                                        <SleekSelect v-model="reportConfig.dataSource" :options="dataSources"
                                            placeholder="Select data source" @change="onDataSourceChange" required
                                            size="md" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Report Type
                                        </label>
                                        <div class="grid grid-cols-2 gap-2">
                                            <label v-for="type in reportTypes" :key="type.value"
                                                class="relative cursor-pointer">
                                                <input v-model="reportConfig.type" type="radio" :value="type.value"
                                                    class="input-field sr-only" />
                                                <div :class="[
                                                    'p-3 border-2 rounded-lg text-center transition-all',
                                                    reportConfig.type === type.value
                                                        ? 'border-mun-blue bg-mun-blue/5'
                                                        : 'border-mun-gray-200 hover:border-mun-gray-300'
                                                ]">
                                                    <component :is="type.icon" :class="[
                                                        'w-5 h-5 mx-auto mb-1',
                                                        reportConfig.type === type.value
                                                            ? 'text-mun-blue'
                                                            : 'text-mun-gray-500'
                                                    ]" />
                                                    <p class="text-xs font-medium">{{ type.label }}</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Available Fields -->
                            <div v-if="reportConfig.dataSource">
                                <h4 class="text-sm font-semibold text-mun-gray-900 mb-3">Available Fields</h4>
                                <div class="space-y-2 max-h-48 overflow-y-auto">
                                    <div v-for="field in availableFields" :key="field.key"
                                        class="flex items-center space-x-2 p-2 bg-white rounded-lg border border-mun-gray-200">
                                        <input :id="`field-${field.key}`" v-model="selectedFields" :value="field.key"
                                            type="checkbox" class="input-field" />
                                        <label :for="`field-${field.key}`" class="flex-1 cursor-pointer">
                                            <div class="text-sm font-medium text-mun-gray-900">{{ field.label }}</div>
                                            <div class="text-xs text-mun-gray-500">{{ field.description }}</div>
                                        </label>
                                        <span :class="[
                                            'px-2 py-1 text-xs rounded-full',
                                            getFieldTypeClasses(field.type)
                                        ]">
                                            {{ field.type }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Quick Field Groups -->
                            <div v-if="availableFields.length > 0">
                                <h4 class="text-sm font-semibold text-mun-gray-900 mb-3">Quick Select</h4>
                                <div class="space-y-2">
                                    <button @click="selectAllFields"
                                        class="w-full text-left px-3 py-2 text-sm bg-white rounded-lg border border-mun-gray-200 hover:bg-mun-gray-50">
                                        Select All Fields
                                    </button>
                                    <button @click="selectBasicFields"
                                        class="w-full text-left px-3 py-2 text-sm bg-white rounded-lg border border-mun-gray-200 hover:bg-mun-gray-50">
                                        Basic Fields Only
                                    </button>
                                    <button @click="clearFields"
                                        class="w-full text-left px-3 py-2 text-sm bg-white rounded-lg border border-mun-gray-200 hover:bg-mun-gray-50">
                                        Clear Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content - Report Builder -->
                <div class="flex-1 flex flex-col overflow-hidden">
                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="space-y-6">
                            <!-- Selected Fields Configuration -->
                            <div v-if="selectedFields.length > 0">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-mun-gray-900">
                                        Selected Fields ({{ selectedFields.length }})
                                    </h3>
                                    <AppButton @click="previewReport" variant="outline" size="sm"
                                        :loading="isGeneratingPreview">
                                        <EyeIcon class="w-4 h-4 mr-2" />
                                        Preview
                                    </AppButton>
                                </div>

                                <div class="mun-card p-6">
                                    <!-- Field List with Drag & Drop -->
                                    <div class="space-y-3">
                                        <div v-for="(fieldKey, index) in selectedFields" :key="fieldKey"
                                            class="flex items-center space-x-4 p-3 bg-mun-gray-50 rounded-lg">
                                            <!-- Drag Handle -->
                                            <div class="cursor-move text-mun-gray-400">
                                                <Bars3Icon class="w-4 h-4" />
                                            </div>

                                            <!-- Field Info -->
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-2">
                                                    <span class="font-medium text-mun-gray-900">
                                                        {{ getFieldLabel(fieldKey) }}
                                                    </span>
                                                    <span :class="[
                                                        'px-2 py-1 text-xs rounded-full',
                                                        getFieldTypeClasses(getFieldType(fieldKey))
                                                    ]">
                                                        {{ getFieldType(fieldKey) }}
                                                    </span>
                                                </div>
                                                <p class="text-xs text-mun-gray-500">
                                                    {{ getFieldDescription(fieldKey) }}
                                                </p>
                                            </div>

                                            <!-- Field Configuration -->
                                            <div class="flex items-center space-x-2">
                                                <!-- Sorting -->
                                                <SleekSelect v-model="fieldConfigs[fieldKey].sort" :options="[
                                                    { label: 'No Sort', value: '' },
                                                    { label: 'Sort Asc', value: 'asc' },
                                                    { label: 'Sort Desc', value: 'desc' }
                                                ]" size="sm" container-class="w-24" />

                                                <SleekSelect v-if="getFieldType(fieldKey) === 'number'"
                                                    v-model="fieldConfigs[fieldKey].aggregation" :options="[
                                                        { label: 'No Aggregation', value: '' },
                                                        { label: 'Sum', value: 'sum' },
                                                        { label: 'Average', value: 'avg' },
                                                        { label: 'Minimum', value: 'min' },
                                                        { label: 'Maximum', value: 'max' },
                                                        { label: 'Count', value: 'count' }
                                                    ]" size="sm" container-class="w-32" />
                                            </div>

                                            <!-- Move Up/Down -->
                                            <div class="flex flex-col space-y-1">
                                                <button @click="moveFieldUp(index)" :disabled="index === 0"
                                                    class="p-1 text-mun-gray-400 hover:text-mun-gray-600 disabled:opacity-50">
                                                    <ChevronUpIcon class="w-3 h-3" />
                                                </button>
                                                <button @click="moveFieldDown(index)"
                                                    :disabled="index === selectedFields.length - 1"
                                                    class="p-1 text-mun-gray-400 hover:text-mun-gray-600 disabled:opacity-50">
                                                    <ChevronDownIcon class="w-3 h-3" />
                                                </button>
                                            </div>

                                            <!-- Remove Field -->
                                            <button @click="removeField(fieldKey)"
                                                class="p-1 text-red-500 hover:text-red-700">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Filters Section -->
                            <div>
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-mun-gray-900">Filters</h3>
                                    <AppButton @click="addFilter" variant="outline" size="sm">
                                        <PlusIcon class="w-4 h-4 mr-2" />
                                        Add Filter
                                    </AppButton>
                                </div>

                                <div v-if="reportFilters.length > 0" class="mun-card p-6">
                                    <div class="space-y-4">
                                        <div v-for="(filter, index) in reportFilters" :key="index"
                                            class="flex items-center space-x-4 p-3 bg-mun-gray-50 rounded-lg">

                                            <!-- Field Selection -->
                                            <SleekSelect v-model="filter.field" :options="availableFields.map(field => ({
                                                label: field.label,
                                                value: field.key
                                            }))" placeholder="Select Field" searchable size="sm"
                                                container-class="w-48" />

                                            <SleekSelect v-model="filter.operator"
                                                :options="getOperatorsForField(filter.field)" size="sm"
                                                container-class="w-32" />

                                            <!-- Value Input -->
                                            <input v-model="filter.value" :type="getInputTypeForField(filter.field)"
                                                class="input-field input-sm" placeholder="Filter value" />

                                            <!-- Remove Filter -->
                                            <button @click="removeFilter(index)"
                                                class="p-1 text-red-500 hover:text-red-700">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div v-else class="text-center py-8 text-mun-gray-500">
                                    <AdjustmentsHorizontalIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No filters added. Click "Add Filter" to start filtering your data.</p>
                                </div>
                            </div>

                            <!-- Grouping and Aggregation -->
                            <div v-if="reportConfig.type === 'summary'">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Grouping & Aggregation</h3>

                                <div class="mun-card p-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Group By
                                            </label>
                                            <SleekSelect v-model="reportConfig.groupBy" :options="[
                                                { label: 'No Grouping', value: '' },
                                                ...categoricalFields.map(field => ({
                                                    label: field.label,
                                                    value: field.key
                                                }))
                                            ]" placeholder="No Grouping" size="md" />
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Order By
                                            </label>
                                            <SleekSelect v-model="reportConfig.orderBy" :options="[
                                                { label: 'No Ordering', value: '' },
                                                ...selectedFieldObjects.map(field => ({
                                                    label: field.label,
                                                    value: field.key
                                                }))
                                            ]" placeholder="No Ordering" size="md" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Report Preview -->
                            <div v-if="previewData">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Report Preview</h3>

                                <div class="mun-card overflow-hidden">
                                    <div class="overflow-x-auto">
                                        <table class="min-w-full divide-y divide-mun-gray-200">
                                            <thead class="bg-mun-gray-50">
                                                <tr>
                                                    <th v-for="field in selectedFieldObjects" :key="field.key"
                                                        class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                                        {{ field.label }}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-mun-gray-200">
                                                <tr v-for="(row, index) in previewData.slice(0, 10)" :key="index">
                                                    <td v-for="field in selectedFieldObjects" :key="field.key"
                                                        class="px-6 py-4 whitespace-nowrap text-sm text-mun-gray-900">
                                                        {{ formatCellValue(row[field.key], field.type) }}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div v-if="previewData.length > 10"
                                        class="px-6 py-3 bg-mun-gray-50 text-sm text-mun-gray-500">
                                        Showing 10 of {{ previewData.length }} rows. Full report will include all data.
                                    </div>
                                </div>
                            </div>

                            <!-- No Fields Selected State -->
                            <div v-if="selectedFields.length === 0" class="text-center py-12">
                                <div class="text-mun-gray-400 mb-4">
                                    <ChartBarIcon class="w-16 h-16 mx-auto opacity-30" />
                                </div>
                                <h3 class="text-lg font-medium text-mun-gray-900 mb-2">Start Building Your Report</h3>
                                <p class="text-mun-gray-600 mb-6">Select a data source and fields from the sidebar to
                                    begin creating your custom report.</p>
                                <div class="space-y-2 text-sm text-mun-gray-500">
                                    <p>1. Choose a data source (Events, Users, Committees, etc.)</p>
                                    <p>2. Select the fields you want to include</p>
                                    <p>3. Configure filters and sorting</p>
                                    <p>4. Preview and generate your report</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #footer-left>
            <div class="text-sm text-mun-gray-500">
                <span class="font-medium">{{ selectedFields.length }}</span> fields selected
                <span v-if="reportFilters.length > 0" class="ml-4">
                    <span class="font-medium">{{ reportFilters.length }}</span> filters applied
                </span>
                <span v-if="previewData" class="ml-4">
                    <span class="font-medium">{{ previewData.length }}</span> records found
                </span>
            </div>
        </template>

        <template #footer-buttons>
            <AppButton @click="closeModal" variant="outline" :disabled="isGenerating">
                Cancel
            </AppButton>

            <AppButton @click="saveReportTemplate" variant="outline" :disabled="!canSaveTemplate"
                :loading="isSavingTemplate">
                <BookmarkIcon class="w-4 h-4 mr-2" />
                Save Template
            </AppButton>

            <AppButton @click="generateReport" variant="primary" :loading="isGenerating" :disabled="!canGenerate">
                <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
                Generate Report
            </AppButton>
        </template>
    </ModalWrapper>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    ChartBarIcon,
    EyeIcon,
    PlusIcon,
    Bars3Icon,
    ChevronUpIcon,
    ChevronDownIcon,
    AdjustmentsHorizontalIcon,
    BookmarkIcon,
    ArrowDownTrayIcon,
    TableCellsIcon,
    PresentationChartLineIcon,
    ClipboardDocumentListIcon
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
const isGenerating = ref(false)
const isGeneratingPreview = ref(false)
const isSavingTemplate = ref(false)
const previewData = ref(null)
const availableFields = ref([])
const selectedFields = ref([])
const reportFilters = ref([])
const fieldConfigs = ref({})

// Report configuration
const reportConfig = reactive({
    name: '',
    dataSource: '',
    type: 'detailed',
    groupBy: '',
    orderBy: ''
})

// Data sources
const dataSources = [
    { value: 'events', label: 'Events & Registrations' },
    { value: 'users', label: 'Users & Profiles' },
    { value: 'committees', label: 'Committees & Sessions' },
    { value: 'attendance', label: 'Attendance Records' },
    { value: 'documents', label: 'Documents & Submissions' },
    { value: 'voting', label: 'Voting Records' },
    { value: 'messages', label: 'Messages & Communications' },
    { value: 'analytics', label: 'Analytics & Metrics' }
]

// Report types
const reportTypes = [
    { value: 'detailed', label: 'Detailed', icon: TableCellsIcon },
    { value: 'summary', label: 'Summary', icon: PresentationChartLineIcon },
    { value: 'list', label: 'List', icon: ClipboardDocumentListIcon }
]

// Computed
const selectedFieldObjects = computed(() => {
    return selectedFields.value.map(key =>
        availableFields.value.find(f => f.key === key)
    ).filter(Boolean)
})

const categoricalFields = computed(() => {
    return availableFields.value.filter(f =>
        ['text', 'select', 'boolean'].includes(f.type)
    )
})

const canGenerate = computed(() => {
    return reportConfig.name &&
        reportConfig.dataSource &&
        selectedFields.value.length > 0
})

const canSaveTemplate = computed(() => {
    return canGenerate.value
})

const hasChanges = computed(() => {
    return reportConfig.name ||
        reportConfig.dataSource ||
        selectedFields.value.length > 0 ||
        reportFilters.value.length > 0
})

// Methods
const closeModal = () => {
    if (isGenerating.value) return
    resetReport()
    emit('update:modelValue', false)
}

const resetReport = () => {
    Object.keys(reportConfig).forEach(key => {
        reportConfig[key] = key === 'type' ? 'detailed' : ''
    })
    selectedFields.value = []
    reportFilters.value = []
    fieldConfigs.value = {}
    previewData.value = null
    availableFields.value = []
}

const onDataSourceChange = async () => {
    selectedFields.value = []
    reportFilters.value = []
    fieldConfigs.value = {}
    previewData.value = null

    if (reportConfig.dataSource) {
        await loadAvailableFields()
    }
}

const loadAvailableFields = async () => {
    try {
        const response = await apiMethods.admin.getReportFields(reportConfig.dataSource)
        availableFields.value = response.data.fields || []

        // Initialize field configs
        availableFields.value.forEach(field => {
            fieldConfigs.value[field.key] = {
                sort: '',
                aggregation: ''
            }
        })

    } catch (error) {
        toast.error('Failed to load fields:', error)
        toast.error('Failed to load available fields')
    }
}

const getFieldLabel = (key) => {
    const field = availableFields.value.find(f => f.key === key)
    return field?.label || key
}

const getFieldType = (key) => {
    const field = availableFields.value.find(f => f.key === key)
    return field?.type || 'text'
}

const getFieldDescription = (key) => {
    const field = availableFields.value.find(f => f.key === key)
    return field?.description || ''
}

const getFieldTypeClasses = (type) => {
    const classMap = {
        'text': 'bg-blue-100 text-blue-800',
        'number': 'bg-green-100 text-green-800',
        'date': 'bg-purple-100 text-purple-800',
        'boolean': 'bg-yellow-100 text-yellow-800',
        'select': 'bg-indigo-100 text-indigo-800'
    }
    return classMap[type] || 'bg-gray-100 text-gray-800'
}

const selectAllFields = () => {
    selectedFields.value = availableFields.value.map(f => f.key)
}

const selectBasicFields = () => {
    selectedFields.value = availableFields.value
        .filter(f => f.basic)
        .map(f => f.key)
}

const clearFields = () => {
    selectedFields.value = []
}

const moveFieldUp = (index) => {
    if (index > 0) {
        const temp = selectedFields.value[index]
        selectedFields.value[index] = selectedFields.value[index - 1]
        selectedFields.value[index - 1] = temp
    }
}

const moveFieldDown = (index) => {
    if (index < selectedFields.value.length - 1) {
        const temp = selectedFields.value[index]
        selectedFields.value[index] = selectedFields.value[index + 1]
        selectedFields.value[index + 1] = temp
    }
}

const removeField = (fieldKey) => {
    const index = selectedFields.value.indexOf(fieldKey)
    if (index > -1) {
        selectedFields.value.splice(index, 1)
    }
}

const addFilter = () => {
    reportFilters.value.push({
        field: '',
        operator: 'equals',
        value: ''
    })
}

const removeFilter = (index) => {
    reportFilters.value.splice(index, 1)
}

const getOperatorsForField = (fieldKey) => {
    const field = availableFields.value.find(f => f.key === fieldKey)
    if (!field) return []

    const baseOperators = [
        { value: 'equals', label: 'Equals' },
        { value: 'not_equals', label: 'Not Equals' }
    ]

    if (field.type === 'text') {
        return [
            ...baseOperators,
            { value: 'contains', label: 'Contains' },
            { value: 'starts_with', label: 'Starts With' },
            { value: 'ends_with', label: 'Ends With' }
        ]
    }

    if (field.type === 'number' || field.type === 'date') {
        return [
            ...baseOperators,
            { value: 'greater_than', label: 'Greater Than' },
            { value: 'less_than', label: 'Less Than' },
            { value: 'between', label: 'Between' }
        ]
    }

    return baseOperators
}

const getInputTypeForField = (fieldKey) => {
    const field = availableFields.value.find(f => f.key === fieldKey)
    if (!field) return 'text'

    const typeMap = {
        'number': 'number',
        'date': 'date',
        'boolean': 'checkbox'
    }

    return typeMap[field.type] || 'text'
}

const formatCellValue = (value, type) => {
    if (value === null || value === undefined) return '-'

    if (type === 'date') {
        return new Date(value).toLocaleDateString()
    }

    if (type === 'boolean') {
        return value ? 'Yes' : 'No'
    }

    if (type === 'number') {
        return typeof value === 'number' ? value.toLocaleString() : value
    }

    return value
}

const previewReport = async () => {
    try {
        isGeneratingPreview.value = true

        const reportData = {
            dataSource: reportConfig.dataSource,
            fields: selectedFields.value,
            filters: reportFilters.value.filter(f => f.field && f.value),
            fieldConfigs: fieldConfigs.value,
            type: reportConfig.type,
            groupBy: reportConfig.groupBy,
            orderBy: reportConfig.orderBy,
            limit: 50 // Preview limit
        }

        const response = await apiMethods.admin.generateReportPreview(reportData)
        previewData.value = response.data.data || []

    } catch (error) {
        toast.error('Failed to generate preview:', error)
        toast.error('Failed to generate report preview')
    } finally {
        isGeneratingPreview.value = false
    }
}

const saveReportTemplate = async () => {
    try {
        isSavingTemplate.value = true

        const templateData = {
            name: reportConfig.name,
            dataSource: reportConfig.dataSource,
            fields: selectedFields.value,
            filters: reportFilters.value,
            fieldConfigs: fieldConfigs.value,
            type: reportConfig.type,
            groupBy: reportConfig.groupBy,
            orderBy: reportConfig.orderBy
        }

        await apiMethods.admin.saveReportTemplate(templateData)

        toast.success('Report template saved successfully')

    } catch (error) {
        toast.error('Failed to save template:', error)
        toast.error('Failed to save report template')
    } finally {
        isSavingTemplate.value = false
    }
}

const generateReport = async () => {
    try {
        isGenerating.value = true

        const reportData = {
            name: reportConfig.name,
            dataSource: reportConfig.dataSource,
            fields: selectedFields.value,
            filters: reportFilters.value.filter(f => f.field && f.value),
            fieldConfigs: fieldConfigs.value,
            type: reportConfig.type,
            groupBy: reportConfig.groupBy,
            orderBy: reportConfig.orderBy
        }

        const response = await apiMethods.admin.generateReport(reportData)

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${reportConfig.name.replace(/\s+/g, '_')}_Report.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success('Report generated successfully')
        closeModal()

    } catch (error) {
        toast.error('Failed to generate report:', error)
        toast.error('Failed to generate report')
    } finally {
        isGenerating.value = false
    }
}

// Watchers
watch(() => selectedFields.value, () => {
    previewData.value = null
})

watch(() => reportFilters.value, () => {
    previewData.value = null
}, { deep: true })
</script>

<style scoped>
/* Table styling */
table {
    border-collapse: separate;
    border-spacing: 0;
}

th:first-child {
    border-top-left-radius: 0.5rem;
}

th:last-child {
    border-top-right-radius: 0.5rem;
}
</style>