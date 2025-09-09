<template>
    <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Committee Management</h1>
                <p class="text-mun-gray-600 mt-1">Create and manage MUN committees</p>
            </div>

            <div class="flex items-center space-x-3">
                <AppButton variant="outline" size="md" @click="refreshCommittees" :loading="isLoading">
                    <ArrowPathIcon class="w-4 h-4 mr-2" />
                    Refresh
                </AppButton>

                <AppButton variant="primary" size="md" @click="showCreateCommittee = true">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Create Committee
                </AppButton>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard v-for="stat in committeeStats" :key="stat.title" :title="stat.title" :value="stat.value"
                :change="stat.change" :trend="stat.trend" :icon="stat.icon" :color="stat.color" />
        </div>

        <!-- Filters and Search -->
        <AppCard class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <!-- Search -->
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Search Committees
                    </label>
                    <div class="relative">
                        <input v-model="searchQuery" type="text" placeholder="Search by name, type, or event..."
                            class="input-field pl-10" @input="debouncedSearch" />
                        <MagnifyingGlassIcon
                            class="w-5 h-5 text-mun-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <!-- Event Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Event
                    </label>
                    <select v-model="filters.eventId" class="input-field" @change="applyFilters">
                        <option value="">All Events</option>
                        <option v-for="event in availableEvents" :key="event._id" :value="event._id">
                            {{ event.name }}
                        </option>
                    </select>
                </div>

                <!-- Committee Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Type
                    </label>
                    <select v-model="filters.type" class="input-field" @change="applyFilters">
                        <option value="">All Types</option>
                        <option value="GA">General Assembly</option>
                        <option value="SC">Security Council</option>
                        <option value="ECOSOC">Economic and Social Council</option>
                        <option value="HRC">Human Rights Council</option>
                        <option value="LEGAL">Legal Committee</option>
                        <option value="DISEC">Disarmament Committee</option>
                        <option value="SPECPOL">Special Political Committee</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
            </div>

            <!-- Advanced Filters -->
            <div v-if="showAdvancedFilters" class="mt-6 pt-6 border-t border-mun-gray-200">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Status
                        </label>
                        <select v-model="filters.status" class="input-field" @change="applyFilters">
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="setup">Setup</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Country Count
                        </label>
                        <select v-model="filters.countryRange" class="input-field" @change="applyFilters">
                            <option value="">Any Size</option>
                            <option value="small">Small (1-15)</option>
                            <option value="medium">Medium (16-30)</option>
                            <option value="large">Large (31-50)</option>
                            <option value="xlarge">Very Large (50+)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Has QR Codes
                        </label>
                        <select v-model="filters.hasQR" class="input-field" @change="applyFilters">
                            <option value="">All</option>
                            <option value="yes">Generated</option>
                            <option value="no">Not Generated</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Filter Actions -->
            <div class="flex items-center justify-between mt-4">
                <button @click="showAdvancedFilters = !showAdvancedFilters"
                    class="text-sm text-un-blue hover:text-un-blue-600 flex items-center">
                    <ChevronDownIcon v-if="!showAdvancedFilters" class="w-4 h-4 mr-1" />
                    <ChevronUpIcon v-else class="w-4 h-4 mr-1" />
                    {{ showAdvancedFilters ? 'Hide' : 'Show' }} Advanced Filters
                </button>

                <div class="flex items-center space-x-3">
                    <span v-if="hasActiveFilters" class="text-sm text-mun-gray-600">
                        {{ filteredCommittees.length }} of {{ totalCommittees }} committees
                    </span>

                    <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">
                        Clear Filters
                    </AppButton>
                </div>
            </div>
        </AppCard>

        <!-- View Toggle and Bulk Actions -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <!-- View Toggle -->
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">View:</span>
                    <button @click="viewMode = 'grid'" :class="[
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'grid'
                            ? 'bg-un-blue text-white'
                            : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                    ]">
                        <Squares2X2Icon class="w-4 h-4" />
                    </button>
                    <button @click="viewMode = 'list'" :class="[
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'list'
                            ? 'bg-un-blue text-white'
                            : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                    ]">
                        <ListBulletIcon class="w-4 h-4" />
                    </button>
                </div>

                <!-- Bulk Actions -->
                <div v-if="selectedCommittees.length > 0" class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">
                        {{ selectedCommittees.length }} selected
                    </span>

                    <AppButton variant="outline" size="sm" @click="bulkGenerateQR" :loading="isBulkGenerating">
                        <QrCodeIcon class="w-4 h-4 mr-2" />
                        Generate QR
                    </AppButton>

                    <AppButton variant="outline" size="sm" @click="bulkExport">
                        <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                        Export
                    </AppButton>

                    <AppButton variant="outline" size="sm" @click="clearSelection">
                        Clear
                    </AppButton>
                </div>
            </div>

            <!-- Sort Options -->
            <div class="flex items-center space-x-2">
                <span class="text-sm text-mun-gray-600">Sort by:</span>
                <select v-model="sortBy" class="input-field !py-2 !px-3 text-sm" @change="applySorting">
                    <option value="created_desc">Newest First</option>
                    <option value="created_asc">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="type_asc">Type A-Z</option>
                    <option value="countries_desc">Most Countries</option>
                    <option value="countries_asc">Least Countries</option>
                </select>
            </div>
        </div>

        <!-- Committees Display -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner size="lg" />
        </div>

        <div v-else-if="filteredCommittees.length === 0" class="text-center py-12">
            <UserGroupIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-mun-gray-900 mb-2">
                {{ hasActiveFilters ? 'No committees match your filters' : 'No committees found' }}
            </h3>
            <p class="text-mun-gray-600 mb-6">
                {{ hasActiveFilters
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Get started by creating your first committee.'
                }}
            </p>
            <AppButton v-if="!hasActiveFilters" variant="primary" @click="showCreateCommittee = true">
                <PlusIcon class="w-4 h-4 mr-2" />
                Create First Committee
            </AppButton>
            <AppButton v-else variant="outline" @click="clearFilters">
                Clear All Filters
            </AppButton>
        </div>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CommitteeCard v-for="committee in paginatedCommittees" :key="committee._id" :committee="committee"
                :selected="selectedCommittees.includes(committee._id)" @view="viewCommittee" @edit="editCommittee"
                @delete="deleteCommittee" @duplicate="duplicateCommittee" @manage-countries="manageCountries"
                @generate-qr="generateQR" @toggle-status="toggleCommitteeStatus" @select="toggleSelection" />
        </div>

        <!-- List View -->
        <CommitteeTable v-else :committees="paginatedCommittees" :loading="isLoading" :selected="selectedCommittees"
            @view="viewCommittee" @edit="editCommittee" @delete="deleteCommittee" @duplicate="duplicateCommittee"
            @manage-countries="manageCountries" @generate-qr="generateQR" @toggle-status="toggleCommitteeStatus"
            @sort="handleTableSort" @select="toggleSelection" @select-all="toggleSelectAll" />

        <!-- Pagination -->
        <Pagination v-if="filteredCommittees.length > pagination.pageSize" :current-page="pagination.currentPage"
            :total-pages="pagination.totalPages" :total-items="filteredCommittees.length"
            :page-size="pagination.pageSize" @page-change="handlePageChange" @page-size-change="handlePageSizeChange" />

        <!-- Modals -->
        <CreateEditCommitteeModal v-model="showCreateCommittee" @created="handleCommitteeCreated" />

        <CreateEditCommitteeModal v-model="showEditCommittee" :committee="selectedCommittee" mode="edit"
            @updated="handleCommitteeUpdated" />

        <CommitteeDetailsModal v-model="showCommitteeDetails" :committee="selectedCommittee"
            @edit="editCommitteeFromDetails" @delete="deleteCommittee" @manage-countries="manageCountries" />

        <CountryManagementModal v-model="showCountryManagement" :committee="selectedCommittee"
            @saved="handleCountriesUpdated" />

        <QRGenerationModal v-model="showQRGeneration" :committee="selectedCommittee" @generated="handleQRGenerated" />

        <ConfirmDeleteModal v-model="showDeleteConfirm" :title="`Delete Committee: ${selectedCommittee?.name}`"
            :message="deleteConfirmMessage" @confirmed="confirmDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import { debounce } from 'lodash-es'

// Icons
import {
    PlusIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Squares2X2Icon,
    ListBulletIcon,
    UserGroupIcon,
    QrCodeIcon,
    DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

// Components
import StatCard from '@/components/admin/StatCard.vue'
import CommitteeCard from '@/components/admin/CommitteeCard.vue'
import CommitteeTable from '@/components/admin/CommitteeTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import CreateEditCommitteeModal from '@/components/admin/CreateEditCommitteeModal.vue'
import CommitteeDetailsModal from '@/components/admin/CommitteeDetailsModal.vue'
import CountryManagementModal from '@/components/admin/CountryManagementModal.vue'
import QRGenerationModal from '@/components/admin/QRGenerationModal.vue'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isBulkGenerating = ref(false)
const searchQuery = ref('')
const viewMode = ref('grid')
const sortBy = ref('created_desc')
const showAdvancedFilters = ref(false)

// Data
const committees = ref([])
const availableEvents = ref([])
const selectedCommittee = ref(null)
const selectedCommittees = ref([])
const totalCommittees = ref(0)

// Modals
const showCreateCommittee = ref(false)
const showEditCommittee = ref(false)
const showCommitteeDetails = ref(false)
const showCountryManagement = ref(false)
const showQRGeneration = ref(false)
const showDeleteConfirm = ref(false)

// Filters
const filters = reactive({
    eventId: '',
    type: '',
    status: '',
    countryRange: '',
    hasQR: ''
})

// Pagination
const pagination = reactive({
    currentPage: 1,
    pageSize: 12,
    totalPages: 0
})

// Computed
const committeeStats = computed(() => [
    {
        title: 'Total Committees',
        value: totalCommittees.value,
        change: '+8%',
        trend: 'up',
        icon: UserGroupIcon,
        color: 'blue'
    },
    {
        title: 'Active Committees',
        value: committees.value.filter(c => c.status === 'active').length,
        change: '+12%',
        trend: 'up',
        icon: UserGroupIcon,
        color: 'green'
    },
    {
        title: 'Total Countries',
        value: committees.value.reduce((total, c) => total + (c.countries?.length || 0), 0),
        change: '+15%',
        trend: 'up',
        icon: UserGroupIcon,
        color: 'purple'
    },
    {
        title: 'QR Generated',
        value: committees.value.filter(c => c.qrGenerated).length,
        change: '+25%',
        trend: 'up',
        icon: QrCodeIcon,
        color: 'orange'
    }
])

const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' ||
        Object.values(filters).some(value => value !== '')
})

const filteredCommittees = computed(() => {
    let filtered = [...committees.value]

    // Apply search
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(committee =>
            committee.name.toLowerCase().includes(query) ||
            committee.type?.toLowerCase().includes(query) ||
            committee.eventId?.name?.toLowerCase().includes(query)
        )
    }

    // Apply filters
    if (filters.eventId) {
        filtered = filtered.filter(committee => committee.eventId?._id === filters.eventId)
    }

    if (filters.type) {
        filtered = filtered.filter(committee => committee.type === filters.type)
    }

    if (filters.status) {
        filtered = filtered.filter(committee => committee.status === filters.status)
    }

    if (filters.countryRange) {
        filtered = filtered.filter(committee => {
            const count = committee.countries?.length || 0

            switch (filters.countryRange) {
                case 'small':
                    return count <= 15
                case 'medium':
                    return count > 15 && count <= 30
                case 'large':
                    return count > 30 && count <= 50
                case 'xlarge':
                    return count > 50
                default:
                    return true
            }
        })
    }

    if (filters.hasQR) {
        filtered = filtered.filter(committee => {
            if (filters.hasQR === 'yes') return committee.qrGenerated
            if (filters.hasQR === 'no') return !committee.qrGenerated
            return true
        })
    }

    return filtered
})

const sortedCommittees = computed(() => {
    const sorted = [...filteredCommittees.value]

    const [field, direction] = sortBy.value.split('_')

    sorted.sort((a, b) => {
        let aVal, bVal

        switch (field) {
            case 'name':
                aVal = a.name.toLowerCase()
                bVal = b.name.toLowerCase()
                break
            case 'created':
                aVal = new Date(a.createdAt)
                bVal = new Date(b.createdAt)
                break
            case 'type':
                aVal = a.type || ''
                bVal = b.type || ''
                break
            case 'countries':
                aVal = a.countries?.length || 0
                bVal = b.countries?.length || 0
                break
            default:
                return 0
        }

        if (direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
    })

    return sorted
})

const paginatedCommittees = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return sortedCommittees.value.slice(start, end)
})

const deleteConfirmMessage = computed(() => {
    if (!selectedCommittee.value) return ''

    const committee = selectedCommittee.value
    const hasCountries = committee.countries?.length > 0
    const hasDocuments = committee.documents?.length > 0

    let message = `Are you sure you want to delete "${committee.name}"?`

    if (hasCountries || hasDocuments) {
        message += '\n\nThis action will also delete:'
        if (hasCountries) {
            message += `\n• ${committee.countries.length} country assignment(s)`
        }
        if (hasDocuments) {
            message += `\n• ${committee.documents.length} document(s)`
        }
        message += '\n\nThis action cannot be undone.'
    }

    return message
})

// Watch for filtered committees change
watch(() => filteredCommittees.value.length, (newLength) => {
    pagination.totalPages = Math.ceil(newLength / pagination.pageSize)
    if (pagination.currentPage > pagination.totalPages && pagination.totalPages > 0) {
        pagination.currentPage = pagination.totalPages
    }
})

// Methods
const loadCommittees = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.committees.getAll({
            page: 1,
            limit: 1000,
            include: 'eventId,countries,documents'
        })

        if (response.data.success) {
            committees.value = response.data.committees || []
            totalCommittees.value = response.data.total || committees.value.length
        }

    } catch (error) {
        console.error('Load committees error:', error)
        toast.error('Failed to load committees')
    } finally {
        isLoading.value = false
    }
}

const loadEvents = async () => {
    try {
        const response = await apiMethods.events.getAll({
            status: 'active,published',
            limit: 100
        })

        if (response.data.success) {
            availableEvents.value = response.data.events || []
        }

    } catch (error) {
        console.error('Load events error:', error)
    }
}

const refreshCommittees = async () => {
    await loadCommittees()
    toast.success('Committees refreshed')
}

const debouncedSearch = debounce(() => {
    pagination.currentPage = 1
}, 300)

const applyFilters = () => {
    pagination.currentPage = 1
}

const applySorting = () => {
    pagination.currentPage = 1
}

const clearFilters = () => {
    searchQuery.value = ''
    Object.keys(filters).forEach(key => {
        filters[key] = ''
    })
    pagination.currentPage = 1
}

const handlePageChange = (page) => {
    pagination.currentPage = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size) => {
    pagination.pageSize = size
    pagination.currentPage = 1
}

const handleTableSort = (column, direction) => {
    sortBy.value = `${column}_${direction}`
}

// Selection methods
const toggleSelection = (committeeId) => {
    const index = selectedCommittees.value.indexOf(committeeId)
    if (index > -1) {
        selectedCommittees.value.splice(index, 1)
    } else {
        selectedCommittees.value.push(committeeId)
    }
}

const toggleSelectAll = () => {
    if (selectedCommittees.value.length === paginatedCommittees.value.length) {
        selectedCommittees.value = []
    } else {
        selectedCommittees.value = paginatedCommittees.value.map(c => c._id)
    }
}

const clearSelection = () => {
    selectedCommittees.value = []
}

// Committee actions
const viewCommittee = (committee) => {
    selectedCommittee.value = committee
    showCommitteeDetails.value = true
}

const editCommittee = (committee) => {
    selectedCommittee.value = committee
    showEditCommittee.value = true
}

const editCommitteeFromDetails = () => {
    showCommitteeDetails.value = false
    showEditCommittee.value = true
}

const deleteCommittee = (committee) => {
    selectedCommittee.value = committee
    showDeleteConfirm.value = true
}

const confirmDelete = async () => {
    try {
        await apiMethods.committees.delete(selectedCommittee.value._id)

        committees.value = committees.value.filter(c => c._id !== selectedCommittee.value._id)
        totalCommittees.value--

        toast.success('Committee deleted successfully')
        showDeleteConfirm.value = false
        selectedCommittee.value = null

    } catch (error) {
        console.error('Delete committee error:', error)
        toast.error('Failed to delete committee')
    }
}

const duplicateCommittee = async (committee) => {
    try {
        const duplicatedData = {
            ...committee,
            name: `${committee.name} (Copy)`,
            status: 'draft',
            qrGenerated: false,
            countries: []
        }

        delete duplicatedData._id
        delete duplicatedData.createdAt
        delete duplicatedData.updatedAt
        delete duplicatedData.documents

        const response = await apiMethods.committees.create(duplicatedData)

        if (response.data.success) {
            committees.value.unshift(response.data.committee)
            totalCommittees.value++
            toast.success('Committee duplicated successfully')
        }

    } catch (error) {
        console.error('Duplicate committee error:', error)
        toast.error('Failed to duplicate committee')
    }
}

const toggleCommitteeStatus = async (committee) => {
    try {
        const newStatus = committee.status === 'active' ? 'setup' : 'active'

        const response = await apiMethods.committees.update(committee._id, {
            status: newStatus
        })

        if (response.data.success) {
            const index = committees.value.findIndex(c => c._id === committee._id)
            if (index !== -1) {
                committees.value[index] = { ...committees.value[index], ...response.data.committee }
            }

            toast.success(`Committee ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        }

    } catch (error) {
        console.error('Toggle committee status error:', error)
        toast.error('Failed to update committee status')
    }
}

const manageCountries = (committee) => {
    selectedCommittee.value = committee
    showCountryManagement.value = true
}

const generateQR = (committee) => {
    selectedCommittee.value = committee
    showQRGeneration.value = true
}

// Bulk actions
const bulkGenerateQR = async () => {
    try {
        isBulkGenerating.value = true

        const promises = selectedCommittees.value.map(id =>
            apiMethods.committees.generateQRs(id)
        )

        await Promise.all(promises)

        // Update committees with QR generated status
        selectedCommittees.value.forEach(id => {
            const index = committees.value.findIndex(c => c._id === id)
            if (index !== -1) {
                committees.value[index].qrGenerated = true
            }
        })

        toast.success(`QR codes generated for ${selectedCommittees.value.length} committees`)
        clearSelection()

    } catch (error) {
        console.error('Bulk generate QR error:', error)
        toast.error('Failed to generate QR codes')
    } finally {
        isBulkGenerating.value = false
    }
}

const bulkExport = () => {
    const committeeIds = selectedCommittees.value.join(',')
    window.open(`/api/export/committees?ids=${committeeIds}`, '_blank')
}

// Event handlers
const handleCommitteeCreated = (committee) => {
    committees.value.unshift(committee)
    totalCommittees.value++
    showCreateCommittee.value = false
    toast.success('Committee created successfully')
}

const handleCommitteeUpdated = (updatedCommittee) => {
    const index = committees.value.findIndex(c => c._id === updatedCommittee._id)
    if (index !== -1) {
        committees.value[index] = updatedCommittee
    }
    showEditCommittee.value = false
    selectedCommittee.value = null
    toast.success('Committee updated successfully')
}

const handleCountriesUpdated = (updatedCommittee) => {
    const index = committees.value.findIndex(c => c._id === updatedCommittee._id)
    if (index !== -1) {
        committees.value[index] = updatedCommittee
    }
    showCountryManagement.value = false
    toast.success('Countries updated successfully')
}

const handleQRGenerated = (updatedCommittee) => {
    const index = committees.value.findIndex(c => c._id === updatedCommittee._id)
    if (index !== -1) {
        committees.value[index] = updatedCommittee
    }
    showQRGeneration.value = false
    toast.success('QR codes generated successfully')
}

// Lifecycle
onMounted(async () => {
    await Promise.all([loadCommittees(), loadEvents()])

    // Check for event filter from route query
    if (route.query.event) {
        filters.eventId = route.query.event
    }

    // Update breadcrumbs
    appStore.setBreadcrumbs([
        { text: 'Admin', to: { name: 'AdminDashboard' } },
        { text: 'Committees', active: true }
    ])
})
</script>

<style scoped>
/* Custom transitions for view mode changes */
.view-transition-enter-active,
.view-transition-leave-active {
    transition: all 0.3s ease;
}

.view-transition-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.view-transition-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>