<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Application Review</h1>
                <p class="text-sm text-mun-gray-500 mt-1">
                    Review applications routed to
                    <span class="font-medium text-mun-gray-700">{{ committeeName }}</span>
                </p>
            </div>
            <div class="flex items-center space-x-3">
                <span class="text-sm text-mun-gray-500">{{ applications.length }} application{{ applications.length !==
                    1 ? 's' : '' }}</span>
                <AppButton variant="outline" size="sm" @click="loadApplications" :disabled="isLoading">
                    <ArrowPathIcon class="w-4 h-4 mr-1" />
                    Refresh
                </AppButton>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <!-- Context error -->
        <div v-else-if="contextError" class="bg-white rounded-xl border border-red-200 p-12 text-center">
            <ExclamationCircleIcon class="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p class="text-red-600 font-medium">{{ contextError }}</p>
        </div>

        <template v-else>
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Stage sidebar -->
                <div class="lg:w-48 flex-shrink-0">
                    <div class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden sticky top-6">
                        <button v-for="stage in stageFilters" :key="stage.value" @click="activeStage = stage.value"
                            :class="[
                                'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-l-3',
                                activeStage === stage.value
                                    ? 'bg-mun-blue-50 text-mun-blue-700 font-semibold border-l-mun-blue'
                                    : 'text-mun-gray-600 hover:bg-mun-gray-50 border-l-transparent'
                            ]">
                            <span>{{ stage.label }}</span>
                            <span v-if="stageCount(stage.value) > 0" :class="[
                                'px-2 py-0.5 text-xs rounded-full font-medium',
                                activeStage === stage.value ? 'bg-mun-blue-100 text-mun-blue-700' : 'bg-mun-gray-100 text-mun-gray-500'
                            ]">
                                {{ stageCount(stage.value) }}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Application list -->
                <div class="flex-1 min-w-0">
                    <div v-if="filteredApps.length === 0"
                        class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
                        <DocumentTextIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
                        <p class="text-mun-gray-500">
                            {{ activeStage === 'all' ? 'No applications routed to your committee yet.' : 'No applications in this stage.' }}
                        </p>
                    </div>

                    <div v-else class="space-y-2">
                        <div v-for="app in filteredApps" :key="app._id" @click="openDetail(app)"
                            class="bg-white rounded-xl border border-mun-gray-200 p-4 hover:border-mun-blue-200 transition-colors cursor-pointer">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3 min-w-0">
                                    <div
                                        class="w-10 h-10 bg-mun-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-xs font-bold text-mun-blue">
                                            {{ app.applicant?.firstName?.charAt(0) }}{{
                                            app.applicant?.lastName?.charAt(0) }}
                                        </span>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="text-sm font-medium text-mun-gray-900 truncate">
                                            {{ app.applicant?.firstName }} {{ app.applicant?.lastName }}
                                        </p>
                                        <p class="text-xs text-mun-gray-500 truncate">
                                            {{ app.applicant?.email }}
                                            <span v-if="app.applicant?.institution"> · {{ app.applicant.institution
                                                }}</span>
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3 flex-shrink-0 ml-3">
                                    <span class="text-xs text-mun-gray-400">
                                        Priority #{{ (app.currentPriorityIndex || 0) + 1 }}
                                    </span>
                                    <span :class="stageClass(app.currentStage)">{{ formatStage(app.currentStage)
                                        }}</span>
                                    <ChevronRightIcon class="w-4 h-4 text-mun-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- =============================================
             DETAIL MODAL
             ============================================= -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="!!selectedApp" @close="selectedApp = null" size="lg">
            <template #title>
                Review — {{ selectedApp?.applicant?.firstName }} {{ selectedApp?.applicant?.lastName }}
            </template>
            <template #default>
                <div v-if="selectedApp" class="space-y-6 max-h-[70vh] overflow-y-auto">

                    <!-- Status bar -->
                    <div class="flex items-center justify-between p-3 rounded-lg"
                        :class="stageBgClass(selectedApp.currentStage)">
                        <div>
                            <p class="text-sm font-semibold">Stage: {{ formatStage(selectedApp.currentStage) }}</p>
                            <p class="text-xs opacity-75">
                                Submitted {{ formatDate(selectedApp.createdAt) }}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs opacity-75">Priority</p>
                            <p class="text-sm font-semibold">#{{ (selectedApp.currentPriorityIndex || 0) + 1 }}</p>
                        </div>
                    </div>

                    <!-- Applicant info -->
                    <section>
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Applicant Information</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-mun-gray-500">Name:</span>
                                <span class="font-medium ml-1">{{ selectedApp.applicant?.firstName }} {{
                                    selectedApp.applicant?.lastName }}</span>
                            </div>
                            <div>
                                <span class="text-mun-gray-500">Email:</span>
                                <span class="font-medium ml-1">{{ selectedApp.applicant?.email }}</span>
                            </div>
                            <div v-if="selectedApp.applicant?.phone">
                                <span class="text-mun-gray-500">Phone:</span>
                                <span class="font-medium ml-1">{{ selectedApp.applicant.phone }}</span>
                            </div>
                            <div v-if="selectedApp.applicant?.institution">
                                <span class="text-mun-gray-500">Institution:</span>
                                <span class="font-medium ml-1">{{ selectedApp.applicant.institution }}</span>
                            </div>
                        </div>
                    </section>

                    <!-- Committee preferences (shows all, highlights this committee) -->
                    <section v-if="selectedApp.committeePreferences?.length">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Committee Preferences</h3>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(pref, i) in sortedPreferences" :key="i" :class="[
                                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm border',
                                isOurCommittee(pref)
                                    ? 'bg-mun-blue-50 border-mun-blue-300 text-mun-blue-800 ring-1 ring-mun-blue-200'
                                    : 'bg-white border-mun-gray-200 text-mun-gray-600'
                            ]">
                                <span class="text-xs font-bold opacity-60">#{{ pref.priority }}</span>
                                <span class="font-medium">{{ pref.committee?.acronym || pref.committee?.name || '...'
                                    }}</span>
                                <span v-if="isOurCommittee(pref)" class="text-xs">(current)</span>
                            </div>
                        </div>
                    </section>

                    <!-- Previous committee reviews (from earlier committees in the chain) -->
                    <section v-if="previousReviews.length > 0">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Previous Committee Reviews</h3>
                        <div class="space-y-2">
                            <div v-for="(review, i) in previousReviews" :key="i"
                                class="p-3 bg-mun-gray-50 rounded-lg text-sm">
                                <div class="flex items-center justify-between">
                                    <span class="font-medium text-mun-gray-900">
                                        {{ review.committee?.acronym || review.committee?.name }}
                                    </span>
                                    <span :class="[
                                        'px-1.5 py-0.5 text-xs rounded font-medium',
                                        review.decision === 'passed' ? 'bg-yellow-100 text-yellow-700' : 'bg-mun-gray-100 text-mun-gray-600'
                                    ]">{{ review.decision }}</span>
                                </div>
                                <p v-if="review.internalNote" class="text-xs text-mun-gray-600 mt-1 italic">
                                    Note from previous committee: "{{ review.internalNote }}"
                                </p>
                                <p v-if="review.interviewData?.score != null" class="text-xs text-mun-gray-500 mt-1">
                                    Interview score: {{ review.interviewData.score }}/10
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Custom field responses -->
                    <section v-if="customFieldsList.length > 0">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Application Responses</h3>
                        <div class="space-y-2">
                            <div v-for="field in customFieldsList" :key="field.fieldId"
                                class="flex flex-col sm:flex-row sm:items-start gap-1 text-sm p-2 bg-mun-gray-50 rounded-lg">
                                <span class="text-mun-gray-500 sm:w-40 flex-shrink-0 font-medium">{{ field.label
                                    }}:</span>
                                <template v-if="field.isFile">
                                    <a :href="mediaUrl(field.value)" target="_blank"
                                        class="text-mun-blue hover:text-mun-blue-700 flex items-center space-x-1">
                                        <DocumentArrowDownIcon class="w-4 h-4" />
                                        <span>{{ field.fileName }}</span>
                                    </a>
                                </template>
                                <span v-else class="text-mun-gray-900">{{ field.value }}</span>
                            </div>
                        </div>
                    </section>

                    <!-- Interview section (for this committee's review) -->
                    <section v-if="selectedApp.currentStage === 'interview'">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Interview</h3>
                        <div class="p-3 bg-mun-gray-50 rounded-lg space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-medium text-mun-gray-500 mb-1">Scheduled At</label>
                                    <input v-model="interviewForm.scheduledAt" type="datetime-local"
                                        class="input-field text-sm !py-1.5" />
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-mun-gray-500 mb-1">Score (0-10)</label>
                                    <input v-model.number="interviewForm.score" type="number" min="0" max="10"
                                        class="input-field text-sm !py-1.5" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-mun-gray-500 mb-1">Notes</label>
                                <textarea v-model="interviewForm.notes" rows="2" class="input-field text-sm !py-1.5"
                                    placeholder="Interview notes..."></textarea>
                            </div>
                            <AppButton size="sm" @click="saveInterview">Save Interview</AppButton>
                        </div>
                    </section>

                    <!-- =============================================
                         ACTIONS
                         ============================================= -->
                    <div v-if="canAct" class="border-t border-mun-gray-200 pt-4 space-y-3">

                        <!-- Advance: form_review → interview -->
                        <div v-if="selectedApp.currentStage === 'form_review'" class="flex flex-wrap gap-2">
                            <AppButton size="sm" @click="advanceStage" :disabled="isActioning">
                                Move to Interview
                            </AppButton>
                            <AppButton size="sm" class="!bg-green-600 hover:!bg-green-700"
                                @click="showAcceptPanel = !showAcceptPanel" :disabled="isActioning">
                                Accept
                            </AppButton>
                            <AppButton variant="outline" size="sm" @click="showPassPanel = !showPassPanel"
                                :disabled="isActioning">
                                Pass to Next Committee
                            </AppButton>
                        </div>

                        <!-- Interview stage: accept or pass -->
                        <div v-if="selectedApp.currentStage === 'interview'" class="flex flex-wrap gap-2">
                            <AppButton size="sm" class="!bg-green-600 hover:!bg-green-700"
                                @click="showAcceptPanel = !showAcceptPanel" :disabled="isActioning">
                                Accept
                            </AppButton>
                            <AppButton variant="outline" size="sm" @click="showPassPanel = !showPassPanel"
                                :disabled="isActioning">
                                Pass to Next Committee
                            </AppButton>
                        </div>

                        <!-- Accept panel -->
                        <div v-if="showAcceptPanel"
                            class="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                            <p class="text-sm font-medium text-green-800">
                                Accept to {{ committeeName }}
                            </p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-medium text-mun-gray-700 mb-1">Role</label>
                                    <select v-model="acceptForm.role" class="input-field text-sm !py-1.5">
                                        <option value="delegate">Delegate</option>
                                        <option value="observer">Observer</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>
                                <div v-if="acceptForm.role === 'delegate' && committeeCountries.length > 0">
                                    <label class="block text-xs font-medium text-mun-gray-700 mb-1">Country *</label>
                                    <select v-model="acceptForm.countryCode" class="input-field text-sm !py-1.5">
                                        <option value="">Select country...</option>
                                        <option v-for="c in committeeCountries" :key="c.code" :value="c.code">
                                            {{ c.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <AppButton size="sm" class="!bg-green-600 hover:!bg-green-700" @click="acceptApp"
                                    :disabled="isActioning || (acceptForm.role === 'delegate' && !acceptForm.countryCode)">
                                    Confirm Accept
                                </AppButton>
                                <AppButton variant="ghost" size="sm" @click="showAcceptPanel = false">Cancel</AppButton>
                            </div>
                        </div>

                        <!-- Pass panel -->
                        <div v-if="showPassPanel"
                            class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                            <p class="text-sm text-yellow-800">
                                Pass this applicant to the next committee in their preference chain.
                            </p>
                            <div>
                                <label class="block text-xs font-medium text-mun-gray-700 mb-1">Internal note (optional,
                                    visible to next
                                    committee)</label>
                                <textarea v-model="passNote" rows="2" class="input-field text-sm !py-1.5"
                                    placeholder="Any notes for the next reviewing committee..."></textarea>
                            </div>
                            <div class="flex space-x-2">
                                <AppButton size="sm" class="!bg-yellow-600 hover:!bg-yellow-700 !text-white"
                                    @click="passApp" :disabled="isActioning">
                                    Confirm Pass
                                </AppButton>
                                <AppButton variant="ghost" size="sm" @click="showPassPanel = false">Cancel</AppButton>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, inject } from 'vue'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    DocumentTextIcon, ChevronRightIcon, DocumentArrowDownIcon,
    ArrowPathIcon, ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const toast = useToast()

// Context
const ctx = inject('sessionContext')

// =============================================
// STATE
// =============================================
const isLoading = ref(true)
const isActioning = ref(false)
const applications = ref([])
const selectedApp = ref(null)
const activeStage = ref('all')
const stageCounts = ref({})
const committeeCountries = ref([])

// Detail modal state
const showAcceptPanel = ref(false)
const showPassPanel = ref(false)
const passNote = ref('')

const interviewForm = reactive({
    scheduledAt: '',
    score: null,
    notes: ''
})

const acceptForm = reactive({
    role: 'delegate',
    countryCode: ''
})

// =============================================
// STAGE FILTERS
// =============================================
const stageFilters = [
    { value: 'all', label: 'All' },
    { value: 'form_review', label: 'Form Review' },
    { value: 'interview', label: 'Interview' },
]

const stageCount = (stageValue) => {
    if (stageValue === 'all') return applications.value.length
    return applications.value.filter(a => a.currentStage === stageValue).length
}

const filteredApps = computed(() => {
    if (activeStage.value === 'all') return applications.value
    return applications.value.filter(a => a.currentStage === activeStage.value)
})

// =============================================
// COMPUTED — DETAIL
// =============================================
const sortedPreferences = computed(() => {
    if (!selectedApp.value?.committeePreferences) return []
    return [...selectedApp.value.committeePreferences].sort((a, b) => a.priority - b.priority)
})

const previousReviews = computed(() => {
    if (!selectedApp.value?.committeeReviews) return []
    return selectedApp.value.committeeReviews.filter(r => {
        const rId = r.committee?._id || r.committee
        return rId !== ctx.committeeId.value && r.decision !== 'pending'
    })
})

const customFieldsList = computed(() => {
    if (!selectedApp.value?.form?.customFields || !selectedApp.value?.customFieldResponses) return []
    const responses = selectedApp.value.customFieldResponses
    return selectedApp.value.form.customFields
        .map(field => {
            const value = responses instanceof Map ? responses.get(field.fieldId) : responses[field.fieldId]
            return {
                fieldId: field.fieldId,
                label: field.label,
                value: value ?? null,
                isFile: field.type === 'file',
                fileName: field.type === 'file' && typeof value === 'string' ? value.split('/').pop() : null
            }
        })
        .filter(f => f.value !== null && f.value !== undefined)
})

const canAct = computed(() => {
    if (!selectedApp.value) return false
    return ['form_review', 'interview'].includes(selectedApp.value.currentStage)
})

const loadApplications = async () => {
    committeeCountries.value = ctx.committee.value.countries || []

    if (!ctx.orgId.value || !ctx.eventId.value || !ctx.committeeId.value) return
    isLoading.value = true
    try {
        const res = await apiMethods.registration.getCommitteeApplications(
            ctx.orgId.value, ctx.eventId.value, ctx.committeeId.value
        )
        if (res.data.success) {
            applications.value = res.data.applications || []
            if (res.data.stageCounts) stageCounts.value = res.data.stageCounts
        }
    } catch (e) {
        console.error('Failed to load committee applications:', e)
        toast.error('Failed to load applications')
    } finally {
        isLoading.value = false
    }
}

// =============================================
// DETAIL VIEW
// =============================================
const openDetail = async (app) => {
    try {
        // Use the org-level detail endpoint to get full data
        const res = await apiMethods.registration.getApplication(ctx.orgId.value, ctx.eventId.value, app._id)
        if (res.data.success) {
            selectedApp.value = res.data.application
            showAcceptPanel.value = false
            showPassPanel.value = false
            passNote.value = ''
            acceptForm.role = 'delegate'
            acceptForm.countryCode = ''

            // Pre-fill interview form from current committee review
            const currentReview = selectedApp.value.committeeReviews?.find(r => {
                const rId = r.committee?._id || r.committee
                return rId === ctx.committeeId.value
            })
            if (currentReview?.interviewData) {
                interviewForm.scheduledAt = currentReview.interviewData.scheduledAt
                    ? new Date(currentReview.interviewData.scheduledAt).toISOString().slice(0, 16) : ''
                interviewForm.score = currentReview.interviewData.score || null
                interviewForm.notes = currentReview.interviewData.notes || ''
            } else {
                interviewForm.scheduledAt = ''
                interviewForm.score = null
                interviewForm.notes = ''
            }
        }
    } catch (e) {
        toast.error('Failed to load application details')
    }
}

// =============================================
// ACTIONS
// =============================================
const advanceStage = async () => {
    isActioning.value = true
    try {
        await apiMethods.registration.advanceApplicationStage(
            ctx.orgId.value, ctx.eventId.value, ctx.committeeId.value, selectedApp.value._id
        )
        toast.success('Advanced to Interview')
        selectedApp.value = null
        await loadApplications()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to advance stage')
    } finally {
        isActioning.value = false
    }
}

const acceptApp = async () => {
    if (acceptForm.role === 'delegate' && !acceptForm.countryCode) {
        toast.error('Select a country')
        return
    }

    isActioning.value = true
    try {
        const selectedCountry = committeeCountries.value.find(c => c.code === acceptForm.countryCode)
        await apiMethods.registration.reviewApplication(
            ctx.orgId.value, ctx.eventId.value, ctx.committeeId.value, selectedApp.value._id,
            {
                decision: 'accept',
                role: acceptForm.role,
                country: acceptForm.role === 'delegate' && selectedCountry ? {
                    name: selectedCountry.name,
                    code: selectedCountry.code,
                    flag: selectedCountry.flag || null
                } : undefined
            }
        )
        toast.success('Application accepted')
        selectedApp.value = null
        await loadApplications()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to accept application')
    } finally {
        isActioning.value = false
    }
}

const passApp = async () => {
    isActioning.value = true
    try {
        await apiMethods.registration.reviewApplication(
            ctx.orgId.value, ctx.eventId.value, ctx.committeeId.value, selectedApp.value._id,
            {
                decision: 'pass',
                internalNote: passNote.value || undefined
            }
        )
        toast.success('Passed to next committee')
        selectedApp.value = null
        await loadApplications()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to pass application')
    } finally {
        isActioning.value = false
    }
}

const saveInterview = async () => {
    try {
        const data = {}
        if (interviewForm.scheduledAt) data.scheduledAt = interviewForm.scheduledAt
        if (interviewForm.score != null) data.score = interviewForm.score
        if (interviewForm.notes) data.notes = interviewForm.notes

        await apiMethods.registration.updateCommitteeInterview(
            ctx.orgId.value, ctx.eventId.value, ctx.committeeId.value, selectedApp.value._id, data
        )
        toast.success('Interview data saved')
        await openDetail(selectedApp.value)
    } catch (e) {
        toast.error('Failed to update interview')
    }
}

// =============================================
// HELPERS
// =============================================
const isOurCommittee = (pref) => {
    const prefId = pref.committee?._id || pref.committee
    return prefId === ctx.committeeId.value
}

const mediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}${path}`
}

// =============================================
// FORMATTING
// =============================================
const formatStage = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const stageClass = (stage) => {
    const map = {
        form_review: 'px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
        interview: 'px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700',
    }
    return map[stage] || 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600'
}

const stageBgClass = (stage) => {
    const map = {
        form_review: 'bg-blue-50 text-blue-800',
        interview: 'bg-purple-50 text-purple-800',
    }
    return map[stage] || 'bg-mun-gray-100 text-mun-gray-700'
}

// =============================================
// LIFECYCLE
// =============================================
watch(() => ctx.isReady.value, async (ready) => {
    if (ready) {
        const ok = await resolveContext()
        if (ok) await loadApplications()
        else isLoading.value = false
    }
}, { immediate: true })
</script>