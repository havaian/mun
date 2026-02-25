<template>
    <div :class="embedded ? 'space-y-6' : 'p-6 lg:p-8 space-y-6'">
        <!-- Header (standalone mode) -->
        <div v-if="!embedded" class="page-header p-6">
            <div>
                <div class="flex items-center space-x-3 mb-1">
                    <router-link
                        :to="{ name: 'OrgEventDetail', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="text-sm text-mun-gray-400 hover:text-mun-gray-600">← Back to Event</router-link>
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Applications</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Review and manage registration applications</p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else>
            <!-- Filters row -->
            <div class="flex items-center gap-3 flex-wrap">
                <!-- Stage filter buttons -->
                <div class="flex flex-wrap gap-1.5">
                    <button v-for="sf in stageFilters" :key="sf.value" @click="activeStage = sf.value" :class="[
                        'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                        activeStage === sf.value
                            ? 'bg-mun-blue-50 text-mun-blue-700 border-mun-blue-200'
                            : 'bg-white text-mun-gray-500 border-mun-gray-200 hover:bg-mun-gray-50'
                    ]">
                        {{ sf.label }}
                        <span v-if="stageCount(sf.value)" class="ml-1 opacity-70">{{ stageCount(sf.value) }}</span>
                    </button>
                </div>

                <!-- Committee filter -->
                <select v-if="committees.length > 1" v-model="committeeFilter"
                    class="input-field text-sm !py-1.5 !w-auto min-w-[160px]">
                    <option value="">All Committees</option>
                    <option v-for="c in committees" :key="c._id" :value="c._id">
                        {{ c.acronym || c.name }}
                    </option>
                </select>
            </div>

            <!-- Empty -->
            <div v-if="applications.length === 0"
                class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
                <DocumentTextIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
                <p class="text-mun-gray-500">
                    {{ activeStage === 'all' ? 'No applications yet.' : 'No applications in this stage.' }}
                </p>
            </div>

            <!-- Applications list -->
            <div v-else class="space-y-2">
                <div v-for="app in applications" :key="app._id" @click="openDetail(app)"
                    class="bg-white rounded-xl border border-mun-gray-200 p-4 hover:border-mun-blue-200 transition-colors cursor-pointer">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div
                                class="w-10 h-10 bg-mun-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-xs font-bold text-mun-blue">
                                    {{ app.applicant?.firstName?.charAt(0) }}{{ app.applicant?.lastName?.charAt(0) }}
                                </span>
                            </div>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-mun-gray-900 truncate">
                                    {{ app.applicant?.firstName }} {{ app.applicant?.lastName }}
                                </p>
                                <p class="text-xs text-mun-gray-500 truncate">
                                    {{ app.applicant?.email }}
                                    <span v-if="app.applicant?.institution"> · {{ app.applicant.institution }}</span>
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 flex-shrink-0 ml-3">
                            <!-- Committee preference chips -->
                            <div class="hidden sm:flex items-center gap-1">
                                <span v-for="pref in (app.committeePreferences || []).slice(0, 3)" :key="pref.priority"
                                    class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-mun-gray-100 text-mun-gray-500">
                                    {{ pref.committee?.acronym || '?' }}
                                </span>
                            </div>
                            <span :class="stageClass(app.currentStage)">{{ formatStage(app.currentStage) }}</span>
                            <ChevronRightIcon class="w-4 h-4 text-mun-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.pages > 1" class="flex items-center justify-center gap-2 pt-2">
                <button v-for="p in pagination.pages" :key="p" @click="loadApplications(p)" :class="[
                    'w-8 h-8 text-xs rounded-lg font-medium',
                    p === pagination.page
                        ? 'bg-mun-blue text-white'
                        : 'bg-white text-mun-gray-500 border border-mun-gray-200 hover:bg-mun-gray-50'
                ]">
                    {{ p }}
                </button>
            </div>
        </template>

        <!-- Application detail modal -->
        <ApplicationDetailModal v-model="showDetailModal" :application="selectedApp" :org-id="orgId" :event-id="eventId"
            :committees="committees" @updated="onApplicationUpdated" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import ApplicationDetailModal from '@/components/admin/ApplicationDetailModal.vue'
import {
    DocumentTextIcon, ChevronRightIcon
} from '@heroicons/vue/24/outline'

defineProps({
    embedded: { type: Boolean, default: false }
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)

// =============================================
// STATE
// =============================================
const isLoading = ref(true)
const eventData = ref(null)
const applications = ref([])
const committees = ref([])
const stageCounts = ref({})
const activeStage = ref('all')
const committeeFilter = ref('')

// Detail modal
const showDetailModal = ref(false)
const selectedApp = ref(null)

const pagination = reactive({ page: 1, total: 0, pages: 1, limit: 20 })

const eventId = computed(() => eventData.value?._id)

// =============================================
// STAGE DEFINITIONS
// =============================================
const stageFilters = [
    { value: 'all', label: 'All' },
    { value: 'form_review', label: 'Form Review' },
    { value: 'interview', label: 'Interview' },
    { value: 'returned_for_revision', label: 'Returned' },
    { value: 'payment_pending', label: 'Payment' },
    { value: 'joined', label: 'Joined' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
]

const stageCount = (stageValue) => {
    if (stageValue === 'all') return Object.values(stageCounts.value).reduce((a, b) => a + b, 0)
    return stageCounts.value[stageValue] || 0
}

// =============================================
// DATA LOADING
// =============================================
const loadInitial = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (!eventRes.data.success) return
        eventData.value = eventRes.data.event

        // Load committees for filters and accept dropdown
        try {
            const cRes = await apiMethods.committees.getAll(orgId.value, eventData.value._id)
            if (cRes.data.success) committees.value = cRes.data.committees || []
        } catch (e) { /* non-fatal */ }

        await loadApplications()
    } catch (e) {
        console.error('Failed to load:', e)
    } finally {
        isLoading.value = false
    }
}

const loadApplications = async (page = 1) => {
    if (!eventData.value) return
    try {
        const params = { page, limit: pagination.limit }
        if (activeStage.value !== 'all') params.stage = activeStage.value
        if (committeeFilter.value) params.committee = committeeFilter.value

        const res = await apiMethods.registration.getApplications(orgId.value, eventData.value._id, params)
        if (res.data.success) {
            applications.value = res.data.applications || []
            Object.assign(pagination, res.data.pagination || { page: 1, total: 0, pages: 1 })
            if (res.data.stageCounts) stageCounts.value = res.data.stageCounts
        }
    } catch (e) {
        console.error('Failed to load applications:', e)
    }
}

// Reload when filters change
watch(activeStage, () => loadApplications(1))
watch(committeeFilter, () => loadApplications(1))

// =============================================
// DETAIL MODAL
// =============================================
const openDetail = async (app) => {
    try {
        const res = await apiMethods.registration.getApplication(orgId.value, eventData.value._id, app._id)
        if (res.data.success) {
            selectedApp.value = res.data.application
            showDetailModal.value = true
        }
    } catch (e) {
        toast.error('Failed to load application details')
    }
}

const onApplicationUpdated = () => {
    loadApplications(pagination.page)
}

// =============================================
// FORMATTING
// =============================================
const formatStage = (s) => {
    const map = {
        form_review: 'Form Review',
        interview: 'Interview',
        returned_for_revision: 'Returned',
        accepted: 'Accepted',
        passed: 'Passed',
        payment_pending: 'Payment',
        payment_verified: 'Verified',
        joined: 'Joined',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn',
        final_decision: 'Final Decision',
    }
    return map[s] || s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
}

const stageClass = (stage) => {
    const base = 'px-2 py-0.5 text-xs font-medium rounded-full'
    const map = {
        form_review: `${base} bg-blue-100 text-blue-700`,
        interview: `${base} bg-purple-100 text-purple-700`,
        returned_for_revision: `${base} bg-yellow-100 text-yellow-700`,
        payment_pending: `${base} bg-orange-100 text-orange-700`,
        joined: `${base} bg-green-100 text-green-700`,
        rejected: `${base} bg-red-100 text-red-700`,
        withdrawn: `${base} bg-mun-gray-100 text-mun-gray-500`,
        final_decision: `${base} bg-indigo-100 text-indigo-700`,
    }
    return map[stage] || `${base} bg-mun-gray-100 text-mun-gray-600`
}

onMounted(() => loadInitial())
</script>