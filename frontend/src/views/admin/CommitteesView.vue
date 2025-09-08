<template>
    <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-mun-gray-900">Committee Management</h1>
                <p class="text-mun-gray-600 mt-2">
                    Create and manage committees, assign countries, and generate QR codes for authentication.
                </p>
            </div>

            <div class="flex items-center space-x-4">
                <!-- Event Filter -->
                <select v-model="selectedEventId"
                    class="px-4 py-2 border border-mun-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-un-blue focus:border-un-blue">
                    <option value="">All Events</option>
                    <option v-for="event in events" :key="event._id" :value="event._id">
                        {{ event.name }}
                    </option>
                </select>

                <AppButton variant="primary" :icon="PlusIcon" @click="showCreateCommittee = true"
                    :disabled="!hasActiveEvents">
                    Create Committee
                </AppButton>
            </div>
        </div>

        <!-- Committee Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Committees" :value="committeeStats.total" :loading="isLoading" color="blue"
                :icon="UserGroupIcon" />
            <StatCard title="Active Committees" :value="committeeStats.active" :loading="isLoading" color="green"
                :icon="PlayIcon" />
            <StatCard title="Countries Assigned" :value="committeeStats.countries" :loading="isLoading" color="purple"
                :icon="FlagIcon" />
            <StatCard title="QR Codes Generated" :value="committeeStats.qrCodes" :loading="isLoading" color="orange"
                :icon="QrCodeIcon" />
        </div>

        <!-- Quick Actions Bar -->
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
            <div class="flex flex-wrap items-center gap-4">
                <div class="flex items-center space-x-2">
                    <BoltIcon class="w-5 h-5 text-un-blue" />
                    <span class="font-medium text-mun-gray-900">Quick Actions:</span>
                </div>

                <AppButton variant="outline" size="sm" :icon="QrCodeIcon" @click="showBulkQRGeneration = true"
                    :disabled="filteredCommittees.length === 0">
                    Generate All QR Codes
                </AppButton>

                <AppButton variant="outline" size="sm" :icon="DocumentTextIcon" @click="exportCommitteeReports"
                    :disabled="filteredCommittees.length === 0">
                    Export Reports
                </AppButton>

                <AppButton variant="outline" size="sm" :icon="ArrowPathIcon" @click="refreshCommittees"
                    :loading="isLoading">
                    Refresh
                </AppButton>
            </div>
        </div>

        <!-- Committee Grid -->
        <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div v-for="i in 6" :key="i" class="loading-shimmer h-80 rounded-2xl"></div>
        </div>

        <div v-else-if="filteredCommittees.length === 0" class="text-center py-12">
            <UserGroupIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-mun-gray-900 mb-2">No committees found</h3>
            <p class="text-mun-gray-500 mb-6">
                {{ selectedEventId ? 'No committees created for this event.' : 'Get started by creating your first committee.' }}
            </p>
            <AppButton variant="primary" :icon="PlusIcon" @click="showCreateCommittee = true"
                :disabled="!hasActiveEvents">
                {{ hasActiveEvents ? 'Create First Committee' : 'Create Event First' }}
            </AppButton>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <CommitteeCard v-for="committee in filteredCommittees" :key="committee._id" :committee="committee"
                @edit="editCommittee" @manage-countries="manageCountries" @generate-qr="generateQRCodes"
                @view-details="viewCommitteeDetails" @delete="deleteCommittee" />
        </div>

        <!-- Create/Edit Committee Modal -->
        <CreateEditCommitteeModal v-model="showCreateCommittee" :committee="selectedCommittee" :events="events"
            @saved="handleCommitteeSaved" @close="resetSelectedCommittee" />

        <!-- Country Management Modal -->
        <CountryManagementModal v-model="showCountryManagement" :committee="selectedCommittee"
            @saved="handleCountriesUpdated" @close="resetSelectedCommittee" />

        <!-- QR Generation Modal -->
        <QRGenerationModal v-model="showQRGeneration" :committee="selectedCommittee" @generated="handleQRGenerated"
            @close="resetSelectedCommittee" />

        <!-- Bulk QR Generation Modal -->
        <BulkQRGenerationModal v-model="showBulkQRGeneration" :committees="filteredCommittees"
            @generated="handleBulkQRGenerated" />

        <!-- Committee Details Modal -->
        <CommitteeDetailsModal v-model="showCommitteeDetails" :committee="selectedCommittee" @edit="editCommittee"
            @manage-countries="manageCountries" @close="resetSelectedCommittee" />

        <!-- Delete Confirmation Modal -->
        <ConfirmDeleteModal v-model="showDeleteConfirm" :item-name="selectedCommittee?.name" item-type="committee"
            :warning-message="deleteWarningMessage" @confirm="confirmDelete" @cancel="cancelDelete" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import {
    PlusIcon,
    UserGroupIcon,
    PlayIcon,
    FlagIcon,
    QrCodeIcon,
    BoltIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '@heroicons/vue/24/outline'

// Import components
import StatCard from '@/components/admin/StatCard.vue'
import CommitteeCard from '@/components/admin/CommitteeCard.vue'
import CreateEditCommitteeModal from '@/components/admin/CreateEditCommitteeModal.vue'
import CountryManagementModal from '@/components/admin/CountryManagementModal.vue'
import QRGenerationModal from '@/components/admin/QRGenerationModal.vue'
import BulkQRGenerationModal from '@/components/admin/BulkQRGenerationModal.vue'
import CommitteeDetailsModal from '@/components/admin/CommitteeDetailsModal.vue'
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal.vue'

const route = useRoute()
const appStore = useAppStore()

// State
const isLoading = ref(false)
const selectedEventId = ref('')
const committees = ref([])
const events = ref([])
const selectedCommittee = ref(null)

// Modal states
const showCreateCommittee = ref(false)
const showCountryManagement = ref(false)
const showQRGeneration = ref(false)
const showBulkQRGeneration = ref(false)
const showCommitteeDetails = ref(false)
const showDeleteConfirm = ref(false)

// Stats
const committeeStats = reactive({
    total: 0,
    active: 0,
    countries: 0,
    qrCodes: 0
})

// Computed
const hasActiveEvents = computed(() => events.value.length > 0)

const filteredCommittees = computed(() => {
    if (!selectedEventId.value) return committees.value
    return committees.value.filter(committee =>
        committee.eventId._id === selectedEventId.value ||
        committee.eventId === selectedEventId.value
    )
})

const deleteWarningMessage = computed(() => {
    if (!selectedCommittee.value) return ''

    const countryCount = selectedCommittee.value.countries?.length || 0
    const registeredCount = selectedCommittee.value.countries?.filter(c => c.email)?.length || 0

    if (registeredCount > 0) {
        return `This committee has ${registeredCount} registered participants. Deleting it will remove all their data and cannot be undone.`
    } else if (countryCount > 0) {
        return `This committee has ${countryCount} assigned countries. All country assignments will be lost.`
    }

    return 'This action cannot be undone.'
})

// Methods
const loadCommittees = async () => {
    try {
        isLoading.value = true

        const params = {}
        if (selectedEventId.value) {
            params.eventId = selectedEventId.value
        }

        const response = await apiMethods.committees.getAll(params)

        committees.value = response.data.committees || []

        // Update stats
        updateCommitteeStats()

    } catch (error) {
        console.error('Load committees error:', error)
        appStore.showErrorMessage('Failed to load committees')
    } finally {
        isLoading.value = false
    }
}

const loadEvents = async () => {
    try {
        const response = await apiMethods.events.getAll({ status: 'active,draft' })
        events.value = response.data.events || []
    } catch (error) {
        console.error('Load events error:', error)
    }
}

const updateCommitteeStats = () => {
    const filtered = filteredCommittees.value

    committeeStats.total = filtered.length
    committeeStats.active = filtered.filter(c => c.status === 'active').length
    committeeStats.countries = filtered.reduce((sum, c) => sum + (c.countries?.length || 0), 0)
    committeeStats.qrCodes = filtered.reduce((sum, c) => {
        const delegateQRs = c.countries?.filter(country => country.qrToken)?.length || 0
        const presidiumQRs = c.presidium?.filter(p => p.qrToken)?.length || 0
        return sum + delegateQRs + presidiumQRs
    }, 0)
}

const refreshCommittees = async () => {
    await loadCommittees()
    appStore.showSuccessMessage('Committees refreshed')
}

// Committee actions
const editCommittee = (committee) => {
    selectedCommittee.value = { ...committee }
    showCreateCommittee.value = true
}

const manageCountries = (committee) => {
    selectedCommittee.value = committee
    showCountryManagement.value = true
}

const generateQRCodes = (committee) => {
    selectedCommittee.value = committee
    showQRGeneration.value = true
}

const viewCommitteeDetails = (committee) => {
    selectedCommittee.value = committee
    showCommitteeDetails.value = true
}

const deleteCommittee = (committee) => {
    selectedCommittee.value = committee
    showDeleteConfirm.value = true
}

const exportCommitteeReports = async () => {
    try {
        appStore.setLoading(true, 'Generating committee reports...')

        // This would generate comprehensive reports for all committees
        const reportData = {
            committees: filteredCommittees.value.map(c => ({
                name: c.name,
                type: c.type,
                countries: c.countries?.length || 0,
                registered: c.countries?.filter(country => country.email)?.length || 0,
                qrGenerated: c.countries?.filter(country => country.qrToken)?.length || 0
            })),
            timestamp: new Date().toISOString(),
            eventFilter: selectedEventId.value
        }

        // Create and download CSV
        const csv = generateCSVReport(reportData)
        downloadFile(csv, `committee-report-${Date.now()}.csv`, 'text/csv')

        appStore.showSuccessMessage('Committee report exported successfully')

    } catch (error) {
        console.error('Export error:', error)
        appStore.showErrorMessage('Failed to export reports')
    } finally {
        appStore.setLoading(false)
    }
}

const generateCSVReport = (data) => {
    const headers = ['Committee Name', 'Type', 'Countries', 'Registered', 'QR Generated', 'Registration %']
    const rows = data.committees.map(c => [
        c.name,
        c.type,
        c.countries,
        c.registered,
        c.qrGenerated,
        c.countries > 0 ? Math.round((c.registered / c.countries) * 100) + '%' : '0%'
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
}

const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

// Event handlers
const handleCommitteeSaved = (committee) => {
    if (selectedCommittee.value?._id) {
        // Update existing committee
        const index = committees.value.findIndex(c => c._id === selectedCommittee.value._id)
        if (index !== -1) {
            committees.value[index] = committee
        }
        appStore.showSuccessMessage('Committee updated successfully')
    } else {
        // Add new committee
        committees.value.unshift(committee)
        appStore.showSuccessMessage('Committee created successfully')
    }

    updateCommitteeStats()
}

const handleCountriesUpdated = (updatedCommittee) => {
    const index = committees.value.findIndex(c => c._id === updatedCommittee._id)
    if (index !== -1) {
        committees.value[index] = updatedCommittee
    }
    updateCommitteeStats()
    appStore.showSuccessMessage('Countries updated successfully')
}

const handleQRGenerated = (updatedCommittee) => {
    const index = committees.value.findIndex(c => c._id === updatedCommittee._id)
    if (index !== -1) {
        committees.value[index] = updatedCommittee
    }
    updateCommitteeStats()
    appStore.showSuccessMessage('QR codes generated successfully')
}

const handleBulkQRGenerated = () => {
    loadCommittees() // Refresh all data
    appStore.showSuccessMessage('Bulk QR generation completed')
}

const confirmDelete = async () => {
    try {
        await apiMethods.committees.delete(selectedCommittee.value._id)

        committees.value = committees.value.filter(c => c._id !== selectedCommittee.value._id)
        updateCommitteeStats()
        appStore.showSuccessMessage('Committee deleted successfully')

        showDeleteConfirm.value = false
        resetSelectedCommittee()

    } catch (error) {
        console.error('Delete committee error:', error)
        appStore.showErrorMessage('Failed to delete committee')
    }
}

const cancelDelete = () => {
    showDeleteConfirm.value = false
    resetSelectedCommittee()
}

const resetSelectedCommittee = () => {
    selectedCommittee.value = null
}

// Watchers
watch(selectedEventId, () => {
    updateCommitteeStats()
})

// Initialize
onMounted(async () => {
    await Promise.all([loadEvents(), loadCommittees()])

    // Handle deep link actions from query params
    if (route.query.action === 'generate-qr') {
        showBulkQRGeneration.value = true
    }

    // Update breadcrumbs
    appStore.setBreadcrumbs([
        { text: 'Admin', to: { name: 'AdminDashboard' } },
        { text: 'Committees', active: true }
    ])
})
</script>

<style scoped>
/* Committee grid animation */
.committee-card {
    animation: slideInUp 0.4s ease-out;
}

.committee-card:nth-child(1) {
    animation-delay: 0.1s;
}

.committee-card:nth-child(2) {
    animation-delay: 0.2s;
}

.committee-card:nth-child(3) {
    animation-delay: 0.3s;
}

/* Quick actions hover effects */
.quick-action-bar {
    transition: all 0.3s ease;
}

.quick-action-bar:hover {
    background-color: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 158, 219, 0.1);
}
</style>