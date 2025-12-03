<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Committee Management</h1>
                <p class="text-mun-gray-600 mt-1">Create and manage MUN committees</p>
            </div>

            <div class="flex items-center space-x-3">
                <button @click="refreshCommittees" :disabled="isLoading" class="btn-un-fourth">
                    <ArrowPathIcon class="w-4 h-4 mr-2" />
                    Refresh
                </button>

                <button @click="showCreateCommittee = true" class="btn-un-third">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Create Committee
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="stat in committeeStats" :key="stat.title" class="mun-card p-6">
                <div class="flex h-full items-center">
                    <div :class="[
                        'p-3 rounded-lg bg-mun-blue/10'
                    ]">
                        <component :is="stat.icon" :class="[
                            'w-6 h-6 text-mun-blue',
                        ]" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">{{ stat.title }}</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stat.value || 0 }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters and Search -->
        <div class="mun-card p-6">
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
                    <SleekSelect v-model="filters.eventId" :options="[
                        { label: 'All Events', value: '' },
                        ...availableEvents.map(event => ({ label: event.name, value: event._id }))
                    ]" @change="applyFilters" container-class="w-full" />
                </div>

                <!-- Committee Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                        Type
                    </label>
                    <SleekSelect v-model="filters.type" :options="[
                        { label: 'All Types', value: '' },
                        { label: 'General Assembly', value: 'GA' },
                        { label: 'Security Council', value: 'SC' },
                        { label: 'Other', value: 'other' }
                    ]" @change="applyFilters" container-class="w-full" />
                </div>
            </div>

            <!-- Advanced Filters -->
            <div v-if="showAdvancedFilters" class="mt-6 pt-6 border-t border-mun-gray-200">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Status
                        </label>
                        <SleekSelect v-model="filters.status" :options="[
                            { label: 'All Statuses', value: '' },
                            { label: 'Draft', value: 'draft' },
                            { label: 'Setup', value: 'setup' },
                            { label: 'Active', value: 'active' },
                            { label: 'Paused', value: 'paused' },
                            { label: 'Completed', value: 'completed' }
                        ]" @change="applyFilters" container-class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Country Count
                        </label>
                        <SleekSelect v-model="filters.countryRange" :options="[
                            { label: 'Any Size', value: '' },
                            { label: 'Small (1-15)', value: 'small' },
                            { label: 'Medium (16-30)', value: 'medium' },
                            { label: 'Large (31-50)', value: 'large' },
                            { label: 'Very Large (50+)', value: 'xlarge' }
                        ]" @change="applyFilters" container-class="w-full" />
                    </div>

                    <!-- CHANGED: Login Links filter instead of QR filter -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Has Login Links
                        </label>
                        <SleekSelect v-model="filters.hasLinks" :options="[
                            { label: 'All', value: '' },
                            { label: 'Generated', value: 'yes' },
                            { label: 'Not Generated', value: 'no' }
                        ]" @change="applyFilters" container-class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Filter Actions -->
            <div class="flex items-center justify-between mt-4">
                <button @click="showAdvancedFilters = !showAdvancedFilters"
                    class="text-sm text-mun-blue hover:text-mun-blue-600 flex items-center">
                    <ChevronDownIcon v-if="!showAdvancedFilters" class="w-4 h-4 mr-1" />
                    <ChevronUpIcon v-else class="w-4 h-4 mr-1" />
                    {{ showAdvancedFilters ? 'Hide' : 'Show' }} Advanced Filters
                </button>

                <div class="flex items-center space-x-3">
                    <span v-if="hasActiveFilters" class="text-sm text-mun-gray-600">
                        {{ filteredCommittees.length }} of {{ totalCommittees }} committees
                    </span>

                    <button v-if="hasActiveFilters" @click="clearFilters" class="btn-un-secondary px-3 py-2">
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>

        <!-- View Toggle and Bulk Actions -->
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <!-- View Toggle -->
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-mun-gray-600">View:</span>
                    <button @click="viewMode = 'grid'" :class="[
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'grid'
                            ? 'bg-mun-blue text-white'
                            : 'bg-mun-gray-100 text-mun-gray-600 hover:bg-mun-gray-200'
                    ]">
                        <Squares2X2Icon class="w-4 h-4" />
                    </button>
                    <button @click="viewMode = 'list'" :class="[
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'list'
                            ? 'bg-mun-blue text-white'
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

                    <!-- CHANGED: Generate Links instead of Generate QR -->
                    <button @click="bulkGenerateLinks" :disabled="isBulkGenerating" class="btn-un-secondary px-3 py-2">
                        <LinkIcon class="w-4 h-4 mr-2" />
                        Generate Links
                    </button>

                    <button @click="bulkExport" class="btn-un-secondary px-3 py-2">
                        <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
                        Export
                    </button>

                    <button @click="clearSelection" class="btn-un-secondary px-3 py-2">
                        Clear
                    </button>
                </div>
            </div>

            <!-- Sort Options -->
            <div class="flex items-center space-x-2">
                <span class="text-sm text-mun-gray-600">Sort by:</span>
                <SleekSelect v-model="sortBy" :options="[
                    { label: 'Newest First', value: 'created_desc' },
                    { label: 'Oldest First', value: 'created_asc' },
                    { label: 'Name A-Z', value: 'name_asc' },
                    { label: 'Name Z-A', value: 'name_desc' },
                    { label: 'Type A-Z', value: 'type_asc' },
                    { label: 'Most Countries', value: 'countries_desc' },
                    { label: 'Least Countries', value: 'countries_asc' }
                ]" @change="applySorting" size="sm" container-class="min-w-[150px]" />
            </div>
        </div>

        <!-- Committees Display -->
        <div>
            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
            </div>

            <div v-else-if="filteredCommittees.length === 0" class="mun-card overflow-hidden text-center py-12">
                <UserGroupIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-mun-gray-900 mb-2">
                    {{ hasActiveFilters ? 'No committees match your filters' : 'No committees found' }}
                </h3>
                <p class="text-mun-gray-600 mb-6">
                    {{ hasActiveFilters
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Get started by creating your first committee.'
                    }}
                </p>
                <button v-if="!hasActiveFilters" @click="showCreateCommittee = true" class="btn-un-primary">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Create First Committee
                </button>
                <button v-else @click="clearFilters" class="btn-un-secondary">
                    Clear All Filters
                </button>
            </div>


            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="committee in paginatedCommittees" :key="committee._id"
                    class="mun-card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border border-mun-gray-200"
                    @click="viewCommittee(committee)">

                    <!-- Committee Header -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-1 truncate">{{ committee.name }}</h3>
                            <p class="text-sm text-mun-gray-600 line-clamp-2">
                                {{ committee.description || 'No description available' }}
                            </p>
                        </div>
                        <input type="checkbox" v-model="selectedCommittees" :value="committee._id" @click.stop
                            class="ml-3 h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded flex-shrink-0" />
                    </div>

                    <!-- Committee Badge -->
                    <div class="flex items-center space-x-2 mb-4">
                        <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mun-blue-100 text-mun-blue-800">
                            {{ committee.type || 'Other' }}
                        </span>
                        <span :class="[
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            committee.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                committee.status === 'setup' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                    'bg-mun-gray-100 text-mun-gray-700'
                        ]">
                            {{ formatStatus(committee.status) }}
                        </span>
                    </div>

                    <!-- Committee Stats -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-mun-gray-900">{{ committee.countries?.length || 0 }}
                            </div>
                            <div class="text-xs text-mun-gray-600">Countries</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-mun-gray-900">{{ committee.presidium?.length || 0 }}
                            </div>
                            <div class="text-xs text-mun-gray-600">Presidium</div>
                        </div>
                    </div>

                    <!-- Event Info -->
                    <div class="mb-4">
                        <div class="text-xs text-mun-gray-500 mb-1">Event</div>
                        <div class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ committee.eventId?.name || 'No event assigned' }}
                        </div>
                    </div>

                    <!-- Committee Actions -->
                    <div class="flex items-center justify-between pt-4 border-t border-mun-gray-200">
                        <div class="text-xs text-mun-gray-500">
                            Created {{ formatDate(committee.createdAt) }}
                        </div>
                        <div class="flex items-center space-x-1">
                            <button @click.stop="editCommittee(committee)"
                                class="p-2 text-mun-gray-400 hover:text-mun-blue hover:bg-mun-blue-50 rounded-lg transition-colors">
                                <PencilIcon class="w-4 h-4" />
                            </button>
                            <button @click.stop="deleteCommittee(committee)"
                                class="p-2 text-mun-gray-400 hover:text-mun-red-500 hover:bg-mun-red-50 rounded-lg transition-colors">
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List View -->
            <div v-else class="mun-card overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-mun-gray-200">
                        <thead class="bg-mun-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left w-12">
                                    <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected"
                                        class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded">
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Committee
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Type & Status
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th
                                    class="px-6 py-3 text-center text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Countries
                                </th>
                                <th
                                    class="px-6 py-3 text-center text-xs font-medium text-mun-gray-500 uppercase tracking-wider">
                                    Presidium
                                </th>
                                <th
                                    class="px-6 py-3 text-right text-xs font-medium text-mun-gray-500 uppercase tracking-wider w-32">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-mun-gray-200">
                            <tr v-for="committee in paginatedCommittees" :key="committee._id"
                                class="hover:bg-mun-gray-50 cursor-pointer transition-colors"
                                @click="viewCommittee(committee)">
                                <td class="px-6 py-4 w-12">
                                    <input type="checkbox" v-model="selectedCommittees" :value="committee._id"
                                        @click.stop
                                        class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded">
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center space-x-3">
                                        <div class="min-w-0 flex-1">
                                            <div class="text-sm font-medium text-mun-gray-900 truncate">{{
                                                committee.name }}</div>
                                            <div class="text-sm text-mun-gray-500 truncate">
                                                {{ committee.description || 'No description' }}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col space-y-1">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mun-blue-100 text-mun-blue-800 w-fit">
                                            {{ committee.type || 'Other' }}
                                        </span>
                                        <span :class="[
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit',
                                            committee.status === 'active' ? 'bg-mun-green-100 text-mun-green-700' :
                                                committee.status === 'setup' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                                    'bg-mun-gray-100 text-mun-gray-700'
                                        ]">
                                            {{ formatStatus(committee.status) }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-mun-gray-900 font-medium">
                                        {{ committee.eventId?.name || 'No event' }}
                                    </div>
                                    <div class="text-sm text-mun-gray-500">
                                        {{ formatDate(committee.createdAt) }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <div class="text-lg font-semibold text-mun-gray-900">
                                        {{ committee.countries?.length || 0 }}
                                    </div>
                                    <div class="text-xs text-mun-gray-500">assigned</div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <div class="text-lg font-semibold text-mun-gray-900">
                                        {{ committee.presidium?.length || 0 }}
                                    </div>
                                    <div class="text-xs text-mun-gray-500">members</div>
                                </td>
                                <td class="px-6 py-4 text-right w-32">
                                    <div class="flex items-center justify-end space-x-1">
                                        <button @click.stop="editCommittee(committee)"
                                            class="p-2 text-mun-gray-400 hover:text-mun-blue hover:bg-mun-blue-50 rounded-lg transition-colors">
                                            <PencilIcon class="w-4 h-4" />
                                        </button>
                                        <button @click.stop="deleteCommittee(committee)"
                                            class="p-2 text-mun-gray-400 hover:text-mun-red-500 hover:bg-mun-red-50 rounded-lg transition-colors">
                                            <TrashIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="filteredCommittees.length > pagination.pageSize"
            class="mun-card bg-white rounded-xl shadow-sm border border-mun-gray-200 overflow-hidden flex justify-center">
            <Pagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages"
                @page-change="handlePageChange" />
        </div>

        <!-- Modals -->
        <CreateEditCommitteeModal v-model="showCreateCommittee" :events="availableEvents"
            @created="handleCommitteeCreated" />

        <CreateEditCommitteeModal v-model="showEditCommittee" :committee="selectedCommittee" :events="availableEvents"
            mode="edit" @updated="handleCommitteeUpdated" />

        <CommitteeDetailsModal v-model="showCommitteeDetails" :committee="selectedCommittee"
            :is-loading="isAutoOpeningCommittee" @close="closeCommitteeDetails" @edit="editCommitteeFromDetails"
            @delete="deleteCommittee" @manage-countries="manageCountries" @generate-login-links="generateLoginLinks" />

        <CountryManagementModal v-model="showCountryManagement" :committee="selectedCommittee"
            @saved="handleCountriesUpdated" />

        <!-- CHANGED: LoginLinksModal instead of QRGenerationModal -->
        <LoginLinksModal v-model="showLoginLinksGeneration" :committee="selectedCommittee"
            @generated="handleLinksGenerated" />

        <ConfirmationDialog v-model="showDeleteConfirm" :title="`Delete Committee: ${selectedCommittee?.name}`"
            :message="deleteConfirmMessage" confirm-text="Delete Committee" confirm-variant="danger"
            @confirm="confirmDelete" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
    LinkIcon,
    DocumentArrowDownIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentIcon,
    BuildingLibraryIcon
} from '@heroicons/vue/24/outline'

// Components
import Pagination from '@/components/ui/Pagination.vue'
import CreateEditCommitteeModal from '@/components/admin/CreateEditCommitteeModal.vue'
import CommitteeDetailsModal from '@/components/admin/CommitteeDetailsModal.vue'
import CountryManagementModal from '@/components/admin/CountryManagementModal.vue'
import LoginLinksModal from '@/components/admin/LoginLinksModal.vue'
import ConfirmationDialog from '@/components/ui/ConfirmationDialog.vue'

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
const showLoginLinksGeneration = ref(false)
const showDeleteConfirm = ref(false)

// Enhanced: Auto-opening committee details
const pendingCommitteeId = ref(null)
const isAutoOpeningCommittee = ref(false)

// Filters
const filters = ref({
    eventId: '',
    type: '',
    status: '',
    countryRange: '',
    hasLinks: ''
})

// Pagination
const pagination = ref({
    currentPage: 1,
    pageSize: 12,
    totalPages: 0
})

// Computed
const committeeStats = computed(() => [
    {
        title: 'Total Committees',
        value: totalCommittees.value,
        icon: BuildingLibraryIcon,
        color: 'blue'
    },
    {
        title: 'Active Committees',
        value: committees.value.filter(c => c.status === 'active').length,
        icon: ClipboardDocumentCheckIcon,
        color: 'green'
    },
    {
        title: 'Total Countries',
        value: committees.value.reduce((total, c) => total + (c.countries?.length || 0), 0),
        icon: ClipboardDocumentIcon,
        color: 'purple'
    },
    {
        title: 'Links Generated',
        value: committees.value.filter(c => c.linksGenerated).length,
        icon: LinkIcon,
        color: 'orange'
    }
])

const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' ||
        Object.values(filters.value).some(value => value !== '')
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
    if (filters.value.eventId) {
        filtered = filtered.filter(committee => committee.eventId?._id === filters.value.eventId)
    }

    if (filters.value.type) {
        filtered = filtered.filter(committee => committee.type === filters.value.type)
    }

    if (filters.value.status) {
        filtered = filtered.filter(committee => committee.status === filters.value.status)
    }

    if (filters.value.countryRange) {
        filtered = filtered.filter(committee => {
            const count = committee.countries?.length || 0

            switch (filters.value.countryRange) {
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

    if (filters.value.hasLinks) {
        filtered = filtered.filter(committee => {
            if (filters.value.hasLinks === 'yes') return committee.linksGenerated
            if (filters.value.hasLinks === 'no') return !committee.linksGenerated
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
    const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    return sortedCommittees.value.slice(start, end)
})

const isAllSelected = computed(() => {
    return paginatedCommittees.value.length > 0 &&
        paginatedCommittees.value.every(committee => selectedCommittees.value.includes(committee._id))
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

// Watchers
watch(() => filteredCommittees.value.length, (newLength) => {
    pagination.value.totalPages = Math.ceil(newLength / pagination.value.pageSize)
    if (pagination.value.currentPage > pagination.value.totalPages && pagination.value.totalPages > 0) {
        pagination.value.currentPage = pagination.value.totalPages
    }
})

// Enhanced: Route watcher to handle committee ID in params
watch(() => route.params, async (newParams) => {
    if (newParams.committeeId && committees.value.length > 0) {
        await openCommitteeFromRoute(newParams.committeeId)
    }
}, { immediate: true })

// Enhanced: Watch for committees loading completion to handle pending committee opening
watch(() => committees.value, async (newCommittees) => {
    if (pendingCommitteeId.value && newCommittees.length > 0) {
        await openCommitteeFromRoute(pendingCommitteeId.value)
        pendingCommitteeId.value = null
    }
}, { immediate: true })

// Methods
const loadCommittees = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.committees.getAll({
            include: 'eventId,countries,documents'
        })

        if (response?.data) {
            committees.value = response.data.committees || response.data || []
            totalCommittees.value = response.data.total || committees.value.length
        } else {
            committees.value = []
            totalCommittees.value = 0
        }

    } catch (error) {
        console.error('Load committees error:', error)
        toast.error('Failed to load committees')
        committees.value = []
        totalCommittees.value = 0
    } finally {
        isLoading.value = false
    }
}

const loadEvents = async () => {
    try {
        const response = await apiMethods.events.getAll({
            limit: 100
        })

        if (response?.data) {
            availableEvents.value = response.data.events || response.data || []
        } else {
            availableEvents.value = []
        }

    } catch (error) {
        console.error('Load events error:', error)
        availableEvents.value = []
    }
}

// Enhanced: Method to open committee from route parameter
const openCommitteeFromRoute = async (committeeId) => {
    if (!committeeId) return

    try {
        isAutoOpeningCommittee.value = true

        // Try to find committee in already loaded committees first
        let committee = committees.value.find(c => c._id === committeeId || c.id === committeeId)

        if (!committee) {
            // If not found in loaded committees, try to load it specifically
            console.log(`Committee ${committeeId} not found in loaded committees, attempting to fetch...`)

            try {
                const response = await apiMethods.committees.getById(committeeId, {
                    include: 'eventId,countries,documents,presidium'
                })

                if (response?.data?.success) {
                    committee = response.data.committee

                    // Add to committees array if not already present
                    const existingIndex = committees.value.findIndex(c => c._id === committee._id)
                    if (existingIndex === -1) {
                        committees.value.push(committee)
                        totalCommittees.value++
                    }
                }
            } catch (fetchError) {
                console.error('Failed to fetch committee by ID:', fetchError)
                toast.error(`Committee with ID ${committeeId} not found`)

                // Clean up the URL to remove invalid committee ID
                await router.replace({
                    name: 'admin-committees',
                    query: route.query
                })
                return
            }
        }

        if (committee) {
            console.log(`Opening committee details for: ${committee.name}`)
            selectedCommittee.value = committee
            showCommitteeDetails.value = true

            // Update the URL to reflect the opened committee (if not already there)
            if (route.params.committeeId !== committee._id) {
                await router.replace({
                    name: 'admin-committee-details',
                    params: { committeeId: committee._id },
                    query: route.query
                })
            }
        } else {
            toast.error(`Committee with ID ${committeeId} not found`)

            // Clean up the URL
            await router.replace({
                name: 'admin-committees',
                query: route.query
            })
        }

    } catch (error) {
        console.error('Error opening committee from route:', error)
        toast.error('Failed to open committee details')
    } finally {
        isAutoOpeningCommittee.value = false
    }
}

const refreshCommittees = async () => {
    await loadCommittees()
    toast.success('Committees refreshed')
}

const debouncedSearch = debounce(() => {
    pagination.value.currentPage = 1
}, 300)

const applyFilters = () => {
    pagination.value.currentPage = 1
}

const applySorting = () => {
    pagination.value.currentPage = 1
}

const clearFilters = () => {
    searchQuery.value = ''
    Object.keys(filters.value).forEach(key => {
        filters.value[key] = ''
    })
    pagination.value.currentPage = 1
}

const handlePageChange = (page) => {
    pagination.value.currentPage = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
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
    if (isAllSelected.value) {
        selectedCommittees.value = []
    } else {
        selectedCommittees.value = paginatedCommittees.value.map(c => c._id)
    }
}

const clearSelection = () => {
    selectedCommittees.value = []
}

// Enhanced: Committee actions
const viewCommittee = async (committee) => {
    selectedCommittee.value = committee
    showCommitteeDetails.value = true

    // Update URL to include committee ID
    await router.push({
        name: 'admin-committee-details',
        params: { committeeId: committee._id },
        query: route.query
    })
}

// Enhanced: Committee details modal close handler
const closeCommitteeDetails = () => {
    showCommitteeDetails.value = false
    selectedCommittee.value = null

    // Update URL to remove committee ID when modal is closed
    if (route.params.committeeId) {
        router.push({
            name: 'admin-committees',
            query: route.query
        })
    }
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
        const response = await apiMethods.committees.delete(selectedCommittee.value._id)

        if (response?.data?.success) {
            // Remove from local state
            committees.value = committees.value.filter(c => c._id !== selectedCommittee.value._id)
            totalCommittees.value = Math.max(0, totalCommittees.value - 1)

            // Also remove from selected committees if it was selected
            selectedCommittees.value = selectedCommittees.value.filter(id => id !== selectedCommittee.value._id)

            toast.success('Committee deleted successfully')
        } else {
            toast.error(response?.data?.error || 'Failed to delete committee')
        }

        showDeleteConfirm.value = false
        selectedCommittee.value = null

    } catch (error) {
        console.error('Delete committee error:', error)

        if (error.response?.data?.error) {
            toast.error(error.response.data.error)
        } else if (error.message) {
            toast.error(error.message)
        } else {
            toast.error('Failed to delete committee')
        }

        showDeleteConfirm.value = false
        selectedCommittee.value = null
    }
}

const manageCountries = (committee) => {
    selectedCommittee.value = committee
    showCountryManagement.value = true
}

const generateLoginLinks = (committee) => {
    selectedCommittee.value = committee
    showLoginLinksGeneration.value = true
}

// Bulk actions
const bulkGenerateLinks = async () => {
    try {
        isBulkGenerating.value = true

        // Generate login links for selected committees
        const promises = selectedCommittees.value.map(async (committeeId) => {
            try {
                await apiMethods.committees.generateLoginLinks(committeeId)
                return { success: true, id: committeeId }
            } catch (error) {
                console.error(`Failed to generate links for committee ${committeeId}:`, error)
                return { success: false, id: committeeId, error }
            }
        })

        const results = await Promise.all(promises)
        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        if (successful.length > 0) {
            // Update committees with links generated status
            successful.forEach(result => {
                const index = committees.value.findIndex(c => c._id === result.id)
                if (index !== -1) {
                    committees.value[index].linksGenerated = true
                }
            })

            toast.success(`Login links generated for ${successful.length} committees`)
        }

        if (failed.length > 0) {
            toast.error(`Failed to generate links for ${failed.length} committees`)
        }

        clearSelection()

    } catch (error) {
        console.error('Bulk generate links error:', error)
        toast.error('Failed to generate login links')
    } finally {
        isBulkGenerating.value = false
    }
}

const bulkExport = async () => {
    try {
        const response = await apiMethods.exports.exportCommitteesBulk(selectedCommittees.value.join(','))

        if (response) {
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `committees-export-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Committees exported successfully')
        }
    } catch (error) {
        console.error('Bulk export error:', error)
        toast.error('Failed to export committees')
    }
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

const handleLinksGenerated = (updatedCommittee) => {
    const index = committees.value.findIndex(c => c._id === updatedCommittee._id)
    if (index !== -1) {
        committees.value[index] = updatedCommittee
    }
    showLoginLinksGeneration.value = false
    toast.success('Login links generated successfully')
}

// Utility functions
const formatStatus = (status) => {
    const statusMap = {
        'draft': 'Draft',
        'setup': 'Setup',
        'active': 'Active',
        'paused': 'Paused',
        'completed': 'Completed'
    }
    return statusMap[status] || status
}

// Enhanced: Lifecycle
onMounted(async () => {
    // Check if there's a committee ID in the route before loading
    if (route.params.committeeId) {
        pendingCommitteeId.value = route.params.committeeId
        console.log(`Pending committee ID from route: ${pendingCommitteeId.value}`)
    }

    // Load committees and events
    await Promise.all([loadCommittees(), loadEvents()])

    // Check for event filter from route query
    if (route.query.eventId) {
        filters.value.eventId = route.query.eventId
    }

    // Handle pending committee opening after data is loaded
    if (pendingCommitteeId.value && committees.value.length > 0) {
        await openCommitteeFromRoute(pendingCommitteeId.value)
        pendingCommitteeId.value = null
    }
})
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

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