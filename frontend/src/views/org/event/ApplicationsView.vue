<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
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

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else>
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Stage sidebar -->
                <div class="lg:w-56 flex-shrink-0">
                    <div class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden sticky top-6">
                        <button v-for="stage in stageFilters" :key="stage.value" @click="activeStage = stage.value"
                            :class="[
                                'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-l-3',
                                activeStage === stage.value
                                    ? 'bg-mun-blue-50 text-mun-blue-700 font-semibold border-l-mun-blue'
                                    : 'text-mun-gray-600 hover:bg-mun-gray-50 border-l-transparent'
                            ]">
                            <span>{{ stage.label }}</span>
                            <span v-if="stageCounts[stage.value] !== undefined" :class="[
                                'px-2 py-0.5 text-xs rounded-full font-medium',
                                activeStage === stage.value ? 'bg-mun-blue-100 text-mun-blue-700' : 'bg-mun-gray-100 text-mun-gray-500'
                            ]">
                                {{ stageCounts[stage.value] || 0 }}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Application list -->
                <div class="flex-1 min-w-0">
                    <div v-if="applications.length === 0"
                        class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
                        <DocumentTextIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
                        <p class="text-mun-gray-500">
                            {{ activeStage === 'all' ? 'No applications yet.' : `No applications in
                            "${activeStageLabel}" stage.` }}
                        </p>
                    </div>

                    <div v-else class="space-y-2">
                        <div v-for="app in applications" :key="app._id" @click="openDetail(app)"
                            class="bg-white rounded-xl border border-mun-gray-200 p-4 hover:border-mun-blue-200 transition-colors cursor-pointer">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-10 h-10 bg-mun-blue-100 rounded-full flex items-center justify-center">
                                        <span class="text-xs font-bold text-mun-blue">
                                            {{ app.user?.firstName?.charAt(0) }}{{ app.user?.lastName?.charAt(0) }}
                                        </span>
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-mun-gray-900">
                                            {{ app.user?.firstName }} {{ app.user?.lastName }}
                                        </p>
                                        <p class="text-xs text-mun-gray-500">
                                            {{ app.user?.email }}
                                            <span v-if="app.user?.institution"> · {{ app.user.institution }}</span>
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <!-- Preferences preview -->
                                    <div v-if="app.committeePreferences?.length"
                                        class="hidden sm:flex items-center space-x-1">
                                        <span v-for="(pref, i) in app.committeePreferences.slice(0, 2)" :key="i"
                                            class="px-1.5 py-0.5 text-[10px] rounded bg-mun-gray-100 text-mun-gray-600">
                                            {{ pref.committee?.acronym || '...' }}
                                        </span>
                                    </div>
                                    <span :class="stageClass(app.currentStage)">{{ formatStage(app.currentStage)
                                        }}</span>
                                    <ChevronRightIcon class="w-4 h-4 text-mun-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="pagination.pages > 1" class="flex items-center justify-between mt-4">
                        <p class="text-sm text-mun-gray-500">{{ pagination.total }} total</p>
                        <div class="flex space-x-2">
                            <AppButton variant="ghost" size="sm" :disabled="pagination.page <= 1"
                                @click="loadApplications(pagination.page - 1)">Previous</AppButton>
                            <AppButton variant="ghost" size="sm" :disabled="pagination.page >= pagination.pages"
                                @click="loadApplications(pagination.page + 1)">Next</AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Application detail modal -->
        <ModalWrapper :show="!!selectedApp" @close="selectedApp = null" size="lg">
            <template #title>
                Application — {{ selectedApp?.user?.firstName }} {{ selectedApp?.user?.lastName }}
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
                    </div>

                    <!-- Applicant info -->
                    <div>
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Applicant Information</h3>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-mun-gray-500">Name:</span> <span class="font-medium">{{
                                    selectedApp.user?.firstName }} {{ selectedApp.user?.lastName }}</span></div>
                            <div><span class="text-mun-gray-500">Email:</span> <span class="font-medium">{{
                                    selectedApp.user?.email }}</span></div>
                            <div v-if="selectedApp.user?.phone"><span class="text-mun-gray-500">Phone:</span> <span
                                    class="font-medium">{{ selectedApp.user.phone }}</span></div>
                            <div v-if="selectedApp.user?.institution"><span
                                    class="text-mun-gray-500">Institution:</span> <span class="font-medium">{{
                                    selectedApp.user.institution }}</span></div>
                        </div>
                    </div>

                    <!-- Committee preferences -->
                    <div v-if="selectedApp.committeePreferences?.length">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Committee Preferences</h3>
                        <div class="space-y-1">
                            <div v-for="(pref, i) in selectedApp.committeePreferences" :key="i"
                                class="flex items-center space-x-2 text-sm">
                                <span
                                    class="w-5 h-5 rounded-full bg-mun-gray-200 flex items-center justify-center text-xs font-bold text-mun-gray-600">{{
                                    i + 1 }}</span>
                                <span>{{ pref.committee?.name || pref.committee?.acronym || 'Unknown' }}</span>
                                <span v-if="pref.country" class="text-mun-gray-400">— {{ pref.country }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Custom field responses -->
                    <div
                        v-if="selectedApp.customFieldResponses && Object.keys(selectedApp.customFieldResponses).length">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Custom Field Responses</h3>
                        <div class="space-y-2 text-sm">
                            <div v-for="(value, key) in selectedApp.customFieldResponses" :key="key">
                                <p class="text-mun-gray-500">{{ key }}</p>
                                <p class="font-medium text-mun-gray-900">{{ value }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Interview section -->
                    <div v-if="showInterviewSection">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Interview</h3>
                        <div class="space-y-3">
                            <div v-if="selectedApp.interview?.completedAt" class="text-sm text-green-700">
                                Completed · Score: {{ selectedApp.interview.score || 'N/A' }}
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs text-mun-gray-500 mb-1">Schedule</label>
                                    <input v-model="interviewForm.scheduledAt" type="datetime-local"
                                        class="input-field text-sm" />
                                </div>
                                <div>
                                    <label class="block text-xs text-mun-gray-500 mb-1">Score (1-10)</label>
                                    <input v-model.number="interviewForm.score" type="number" min="1" max="10"
                                        class="input-field text-sm" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-mun-gray-500 mb-1">Interview Notes</label>
                                <textarea v-model="interviewForm.notes" rows="2" class="input-field text-sm"
                                    placeholder="Interview observations..."></textarea>
                            </div>
                            <AppButton variant="ghost" size="sm" @click="saveInterview">Save Interview</AppButton>
                        </div>
                    </div>

                    <!-- Payment section -->
                    <div v-if="showPaymentSection">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Payment</h3>
                        <div v-if="selectedApp.payment?.verifiedBy" class="text-sm text-green-700 mb-2">
                            Payment verified
                        </div>
                        <AppButton v-else variant="ghost" size="sm" @click="verifyPayment">
                            Verify Payment
                        </AppButton>
                    </div>

                    <!-- Moderator notes -->
                    <div>
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Internal Notes</h3>
                        <div v-if="selectedApp.moderatorNotes?.length" class="space-y-2 mb-3">
                            <div v-for="note in selectedApp.moderatorNotes" :key="note._id"
                                class="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                <p>{{ note.content }}</p>
                                <p class="text-xs text-mun-gray-400 mt-1">{{ formatDate(note.createdAt) }}</p>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <input v-model="newNote" type="text" class="input-field text-sm flex-1"
                                placeholder="Add internal note..." @keyup.enter="addNote" />
                            <AppButton variant="ghost" size="sm" @click="addNote" :disabled="!newNote.trim()">Add
                            </AppButton>
                        </div>
                    </div>

                    <!-- Status history -->
                    <div v-if="selectedApp.statusHistory?.length">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">History</h3>
                        <div class="space-y-1">
                            <div v-for="entry in selectedApp.statusHistory" :key="entry._id"
                                class="flex items-center space-x-2 text-xs text-mun-gray-500">
                                <span class="w-1.5 h-1.5 rounded-full bg-mun-gray-300"></span>
                                <span>{{ formatStage(entry.stage) }}</span>
                                <span>·</span>
                                <span>{{ formatDate(entry.changedAt) }}</span>
                                <span v-if="entry.comment" class="text-mun-gray-400">— {{ entry.comment }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="border-t border-mun-gray-200 pt-4 space-y-3">
                        <!-- Accept form -->
                        <div v-if="canAccept">
                            <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Accept Application</h3>
                            <div class="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label class="block text-xs text-mun-gray-500 mb-1">Committee</label>
                                    <select v-model="acceptForm.committeeId" required class="input-field text-sm">
                                        <option value="">Select committee...</option>
                                        <option v-for="c in committees" :key="c._id" :value="c._id">
                                            {{ c.acronym }} — {{ c.name }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs text-mun-gray-500 mb-1">Country</label>
                                    <select v-model="acceptForm.country" class="input-field text-sm">
                                        <option value="">Select country...</option>
                                        <option v-for="country in acceptableCountries" :key="country.code"
                                            :value="country.name">
                                            {{ country.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="block text-xs text-mun-gray-500 mb-1">Role</label>
                                <select v-model="acceptForm.role" class="input-field text-sm">
                                    <option value="delegate">Delegate</option>
                                    <option value="chair">Chair</option>
                                    <option value="vice_chair">Vice Chair</option>
                                    <option value="rapporteur">Rapporteur</option>
                                    <option value="observer">Observer</option>
                                </select>
                            </div>
                        </div>

                        <!-- Action buttons -->
                        <div class="flex flex-wrap gap-2">
                            <!-- Advance to next stage -->
                            <AppButton v-if="canAdvance" size="sm" @click="advanceStage" :disabled="isActioning">
                                Advance to {{ formatStage(nextStage) }}
                            </AppButton>

                            <!-- Return for revision -->
                            <AppButton v-if="canReturn" variant="ghost" size="sm" @click="showReturnInput = true"
                                :disabled="isActioning">
                                Return for Revision
                            </AppButton>

                            <!-- Accept -->
                            <AppButton v-if="canAccept" size="sm" class="!bg-green-600 hover:!bg-green-700"
                                @click="acceptApplication" :disabled="isActioning || !acceptForm.committeeId">
                                Accept
                            </AppButton>

                            <!-- Reject -->
                            <AppButton v-if="canReject" variant="ghost" size="sm"
                                class="!text-red-600 hover:!text-red-700" @click="rejectApplication"
                                :disabled="isActioning">
                                Reject
                            </AppButton>
                        </div>

                        <!-- Return comment input -->
                        <div v-if="showReturnInput" class="flex space-x-2">
                            <input v-model="returnComment" type="text" class="input-field text-sm flex-1"
                                placeholder="Reason for returning (required)..." />
                            <AppButton size="sm" @click="returnForRevision" :disabled="!returnComment.trim()">
                                Send Back
                            </AppButton>
                            <AppButton variant="ghost" size="sm" @click="showReturnInput = false">Cancel</AppButton>
                        </div>
                    </div>
                </div>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { DocumentTextIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)

const isLoading = ref(true)
const isActioning = ref(false)
const eventData = ref(null)
const applications = ref([])
const committees = ref([])
const activeStage = ref('all')
const selectedApp = ref(null)
const showReturnInput = ref(false)
const returnComment = ref('')
const newNote = ref('')
const pagination = reactive({ page: 1, total: 0, pages: 1 })
const stageCounts = ref({})

const stageFilters = [
    { label: 'All', value: 'all' },
    { label: 'Form Submitted', value: 'form_submitted' },
    { label: 'Form Review', value: 'form_review' },
    { label: 'Interview', value: 'interview' },
    { label: 'Payment', value: 'payment' },
    { label: 'Final Decision', value: 'final_decision' },
    { label: 'Returned', value: 'returned_for_revision' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Withdrawn', value: 'withdrawn' },
]

const activeStageLabel = computed(() => stageFilters.find(s => s.value === activeStage.value)?.label || '')

const interviewForm = reactive({ scheduledAt: '', score: null, notes: '' })
const acceptForm = reactive({ committeeId: '', country: '', role: 'delegate' })

// Which countries are available based on selected committee
const acceptableCountries = computed(() => {
    if (!acceptForm.committeeId) return []
    const committee = committees.value.find(c => c._id === acceptForm.committeeId)
    return committee?.countries || []
})

// Pipeline stage logic
const TERMINAL_STAGES = ['accepted', 'rejected', 'withdrawn']
const STAGE_ORDER = ['form_submitted', 'form_review', 'interview', 'payment', 'final_decision']

const isTerminal = computed(() => TERMINAL_STAGES.includes(selectedApp.value?.currentStage))
const canAdvance = computed(() => {
    if (!selectedApp.value || isTerminal.value) return false
    const stage = selectedApp.value.currentStage
    return ['form_review', 'interview', 'payment'].includes(stage)
})
const canReturn = computed(() => {
    if (!selectedApp.value || isTerminal.value) return false
    return ['form_review', 'interview', 'payment', 'final_decision'].includes(selectedApp.value.currentStage)
})
const canAccept = computed(() => selectedApp.value?.currentStage === 'final_decision')
const canReject = computed(() => !isTerminal.value && selectedApp.value?.currentStage !== 'form_submitted')

const showInterviewSection = computed(() =>
    selectedApp.value && ['interview', 'payment', 'final_decision', 'accepted'].includes(selectedApp.value.currentStage)
)
const showPaymentSection = computed(() =>
    selectedApp.value && ['payment', 'final_decision', 'accepted'].includes(selectedApp.value.currentStage)
)

const nextStage = computed(() => {
    if (!selectedApp.value) return null
    const idx = STAGE_ORDER.indexOf(selectedApp.value.currentStage)
    if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null
    return STAGE_ORDER[idx + 1]
})

// Load data
const loadInitial = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (!eventRes.data.success) return
        eventData.value = eventRes.data.event

        // Load committees for accept dropdown
        try {
            const cRes = await apiMethods.committees.getAll({ eventId: eventData.value._id })
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
        const params = { page, limit: 20 }
        if (activeStage.value !== 'all') params.stage = activeStage.value

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

// Watch stage filter changes
watch(activeStage, () => loadApplications(1))

// Detail view
const openDetail = async (app) => {
    try {
        const res = await apiMethods.registration.getApplication(orgId.value, eventData.value._id, app._id)
        if (res.data.success) {
            selectedApp.value = res.data.application
            showReturnInput.value = false
            returnComment.value = ''
            newNote.value = ''

            // Pre-fill interview form
            if (selectedApp.value.interview) {
                interviewForm.scheduledAt = selectedApp.value.interview.scheduledAt
                    ? new Date(selectedApp.value.interview.scheduledAt).toISOString().slice(0, 16) : ''
                interviewForm.score = selectedApp.value.interview.score || null
                interviewForm.notes = selectedApp.value.interview.notes || ''
            }
        }
    } catch (e) {
        toast.error('Failed to load application details')
    }
}

// Actions
const advanceStage = async () => {
    if (!nextStage.value) return
    isActioning.value = true
    try {
        await apiMethods.registration.moveToStage(orgId.value, eventData.value._id, selectedApp.value._id, {
            stage: nextStage.value
        })
        toast.success(`Moved to ${formatStage(nextStage.value)}`)
        selectedApp.value = null
        await loadApplications(pagination.page)
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to advance stage')
    } finally {
        isActioning.value = false
    }
}

const returnForRevision = async () => {
    isActioning.value = true
    try {
        await apiMethods.registration.returnForRevision(orgId.value, eventData.value._id, selectedApp.value._id, {
            comment: returnComment.value
        })
        toast.success('Returned for revision')
        selectedApp.value = null
        await loadApplications(pagination.page)
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to return application')
    } finally {
        isActioning.value = false
    }
}

const acceptApplication = async () => {
    if (!acceptForm.committeeId) { toast.error('Select a committee'); return }
    isActioning.value = true
    try {
        await apiMethods.registration.accept(orgId.value, eventData.value._id, selectedApp.value._id, {
            committeeId: acceptForm.committeeId,
            country: acceptForm.country || undefined,
            role: acceptForm.role,
        })
        toast.success('Application accepted')
        selectedApp.value = null
        acceptForm.committeeId = ''
        acceptForm.country = ''
        acceptForm.role = 'delegate'
        await loadApplications(pagination.page)
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to accept application')
    } finally {
        isActioning.value = false
    }
}

const rejectApplication = async () => {
    if (!confirm('Reject this application? This action is final.')) return
    isActioning.value = true
    try {
        await apiMethods.registration.reject(orgId.value, eventData.value._id, selectedApp.value._id, {})
        toast.success('Application rejected')
        selectedApp.value = null
        await loadApplications(pagination.page)
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to reject application')
    } finally {
        isActioning.value = false
    }
}

const addNote = async () => {
    if (!newNote.value.trim()) return
    try {
        await apiMethods.registration.addNote(orgId.value, eventData.value._id, selectedApp.value._id, {
            content: newNote.value
        })
        // Refresh detail
        await openDetail(selectedApp.value)
        newNote.value = ''
    } catch (e) {
        toast.error('Failed to add note')
    }
}

const saveInterview = async () => {
    try {
        const data = {}
        if (interviewForm.scheduledAt) data.scheduledAt = interviewForm.scheduledAt
        if (interviewForm.score) data.score = interviewForm.score
        if (interviewForm.notes) data.notes = interviewForm.notes

        await apiMethods.registration.updateInterview(orgId.value, eventData.value._id, selectedApp.value._id, data)
        toast.success('Interview updated')
        await openDetail(selectedApp.value)
    } catch (e) {
        toast.error('Failed to update interview')
    }
}

const verifyPayment = async () => {
    try {
        await apiMethods.registration.verifyPayment(orgId.value, eventData.value._id, selectedApp.value._id, {})
        toast.success('Payment verified')
        await openDetail(selectedApp.value)
    } catch (e) {
        toast.error('Failed to verify payment')
    }
}

// Formatting
const formatStage = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

const stageClass = (stage) => {
    const m = {
        form_submitted: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
        form_review: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
        interview: 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700',
        payment: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
        final_decision: 'px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700',
        returned_for_revision: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700',
        accepted: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
        rejected: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700',
        withdrawn: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500',
    }
    return m[stage] || m.form_submitted
}

const stageBgClass = (stage) => {
    const m = {
        form_submitted: 'bg-blue-50 text-blue-800',
        form_review: 'bg-blue-50 text-blue-800',
        interview: 'bg-purple-50 text-purple-800',
        payment: 'bg-yellow-50 text-yellow-800',
        final_decision: 'bg-orange-50 text-orange-800',
        returned_for_revision: 'bg-red-50 text-red-800',
        accepted: 'bg-green-50 text-green-800',
        rejected: 'bg-red-50 text-red-800',
        withdrawn: 'bg-mun-gray-50 text-mun-gray-700',
    }
    return m[stage] || 'bg-mun-gray-50 text-mun-gray-700'
}

onMounted(() => loadInitial())
</script>

<style scoped>
.border-l-3 {
    border-left-width: 3px;
}

.border-l-mun-blue {
    border-left-color: var(--mun-blue, #2563eb);
}

.border-l-transparent {
    border-left-color: transparent;
}
</style>