<template>
    <ModalWrapper :showDefaultFooter="false" :modelValue="modelValue" @close="$emit('update:modelValue', false)"
        size="lg">
        <template #title>
            Application — {{ applicantName }}
        </template>

        <template #default>
            <div v-if="!application" class="py-12 text-center text-mun-gray-400">
                No application selected
            </div>

            <div v-else class="space-y-5">
                <!-- Stage banner -->
                <div :class="[
                    'rounded-lg px-4 py-3',
                    stageBannerClass
                ]">
                    <p class="text-sm font-semibold">Stage: {{ formatStage(application.currentStage) }}</p>
                    <p class="text-xs opacity-70">
                        Submitted {{ formatDate(application.createdAt) }}
                    </p>
                </div>

                <!-- Applicant info -->
                <div>
                    <h4 class="text-sm font-semibold text-mun-gray-900 mb-2">Applicant Information</h4>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <p><span class="text-mun-gray-500">Name:</span> <span class="font-medium">{{ applicantName
                                }}</span></p>
                        <p><span class="text-mun-gray-500">Email:</span> <span class="font-medium">{{ applicant?.email
                                }}</span></p>
                        <p v-if="applicant?.phone"><span class="text-mun-gray-500">Phone:</span> <span
                                class="font-medium">{{ applicant.phone }}</span></p>
                        <p v-if="applicant?.institution"><span class="text-mun-gray-500">Institution:</span> <span
                                class="font-medium">{{ applicant.institution }}</span></p>
                    </div>
                </div>

                <!-- Committee preferences -->
                <div v-if="sortedPreferences.length">
                    <h4 class="text-sm font-semibold text-mun-gray-900 mb-2">Committee Preferences</h4>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="pref in sortedPreferences" :key="pref.priority" :class="[
                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
                            isCurrentCommittee(pref)
                                ? 'bg-mun-blue-50 text-mun-blue-700 border-mun-blue-200'
                                : isPassedCommittee(pref)
                                    ? 'bg-mun-gray-50 text-mun-gray-400 line-through border-mun-gray-200'
                                    : 'bg-white text-mun-gray-600 border-mun-gray-200'
                        ]">
                            #{{ pref.priority }} {{ pref.committee?.acronym || pref.committee?.name || 'Committee' }}
                        </span>
                    </div>
                </div>

                <!-- Acceptance info (if accepted/payment_pending/joined) -->
                <div v-if="application.acceptance?.committee"
                    class="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 class="text-sm font-semibold text-green-800 mb-2">Acceptance Details</h4>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-green-700">
                        <p><span class="opacity-70">Committee:</span> {{ acceptanceCommitteeName }}</p>
                        <p><span class="opacity-70">Role:</span> {{ formatRole(application.acceptance.role) }}</p>
                        <p v-if="application.acceptance.country?.name">
                            <span class="opacity-70">Country:</span> {{ application.acceptance.country.name }}
                        </p>
                        <p v-if="application.acceptance.acceptedAt">
                            <span class="opacity-70">Accepted:</span> {{ formatDate(application.acceptance.acceptedAt)
                            }}
                        </p>
                    </div>
                </div>

                <!-- Custom field responses -->
                <div v-if="customFieldsList.length">
                    <h4 class="text-sm font-semibold text-mun-gray-900 mb-2">Application Responses</h4>
                    <div class="divide-y divide-mun-gray-100 border border-mun-gray-100 rounded-lg overflow-hidden">
                        <div v-for="(field, i) in customFieldsList" :key="field.fieldId"
                            :class="['flex items-start px-4 py-2.5 text-sm', i % 2 === 0 ? 'bg-mun-gray-50/50' : 'bg-white']">
                            <span class="text-mun-gray-500 w-40 flex-shrink-0">{{ field.label }}:</span>
                            <span v-if="field.isFile" class="font-medium">
                                <a :href="mediaUrl(field.value)" target="_blank"
                                    class="text-mun-blue hover:underline inline-flex items-center">
                                    <DocumentArrowDownIcon class="w-4 h-4 mr-1" />
                                    {{ field.fileName }}
                                </a>
                            </span>
                            <span v-else class="font-medium text-mun-gray-900">{{ field.value }}</span>
                        </div>
                    </div>
                </div>

                <!-- Committee review trail -->
                <div v-if="application.committeeReviews?.length">
                    <h4 class="text-sm font-semibold text-mun-gray-900 mb-2">Committee Review Trail</h4>
                    <div class="space-y-2">
                        <div v-for="review in application.committeeReviews"
                            :key="review.committee?._id || review.committee"
                            class="border border-mun-gray-200 rounded-lg p-3 text-sm">
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-medium text-mun-gray-900">
                                    {{ review.committee?.acronym || review.committee?.name || 'Committee' }}
                                </span>
                                <span :class="[
                                    'px-2 py-0.5 text-xs font-medium rounded-full',
                                    review.decision === 'accepted' ? 'bg-green-100 text-green-700' :
                                        review.decision === 'passed' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-mun-gray-100 text-mun-gray-500'
                                ]">
                                    {{ review.decision || 'pending' }}
                                </span>
                            </div>
                            <p v-if="review.internalNote" class="text-mun-gray-500 text-xs">
                                Note: {{ review.internalNote }}
                            </p>
                            <p v-if="review.decidedAt" class="text-mun-gray-400 text-xs">
                                {{ formatDate(review.decidedAt) }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Interview section (legacy flat + committee-level) -->
                <div v-if="showInterviewSection" class="space-y-3">
                    <h4 class="text-sm font-semibold text-mun-gray-900">Interview</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs text-mun-gray-500 mb-1">Scheduled At</label>
                            <input v-model="interviewForm.scheduledAt" type="datetime-local"
                                class="input-field text-sm" />
                        </div>
                        <div>
                            <label class="block text-xs text-mun-gray-500 mb-1">Score (0-10)</label>
                            <input v-model.number="interviewForm.score" type="number" min="0" max="10"
                                class="input-field text-sm" />
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs text-mun-gray-500 mb-1">Interview Notes</label>
                            <textarea v-model="interviewForm.notes" rows="2" class="input-field text-sm"
                                placeholder="Interview observations..."></textarea>
                        </div>
                    </div>
                    <AppButton size="sm" @click="saveInterview" :disabled="isActioning">
                        Save Interview Data
                    </AppButton>
                </div>

                <!-- Payment section -->
                <div v-if="showPaymentSection" class="space-y-2">
                    <h4 class="text-sm font-semibold text-mun-gray-900">Payment</h4>
                    <div class="border border-mun-gray-200 rounded-lg p-3 text-sm space-y-1">
                        <p v-if="application.payment?.amount">
                            <span class="text-mun-gray-500">Amount:</span>
                            {{ application.payment.currency || 'USD' }} {{ application.payment.amount }}
                        </p>
                        <p v-if="application.payment?.deadline">
                            <span class="text-mun-gray-500">Deadline:</span>
                            {{ formatDate(application.payment.deadline) }}
                        </p>
                        <p v-if="application.payment?.paidAt">
                            <span class="text-mun-gray-500">Paid:</span>
                            {{ formatDate(application.payment.paidAt) }}
                            <span v-if="application.payment?.paidAmount"> — {{ application.payment.currency || 'USD' }}
                                {{ application.payment.paidAmount }}</span>
                        </p>
                        <p v-if="application.payment?.waiver?.type && application.payment.waiver.type !== 'none'">
                            <span class="text-mun-gray-500">Waiver:</span>
                            {{ application.payment.waiver.type }}
                            <span v-if="application.payment.waiver.reason"> — {{ application.payment.waiver.reason
                                }}</span>
                        </p>
                        <p v-if="application.payment?.verifiedAt">
                            <span class="text-green-600 font-medium">✓ Verified {{
                                formatDate(application.payment.verifiedAt) }}</span>
                        </p>
                    </div>
                </div>

                <!-- Internal notes -->
                <div>
                    <h4 class="text-sm font-semibold text-mun-gray-900 mb-2">Internal Notes</h4>
                    <div v-if="application.internalNotes?.length" class="space-y-2 mb-3">
                        <div v-for="(note, i) in application.internalNotes" :key="i"
                            class="bg-mun-gray-50 rounded-lg px-3 py-2">
                            <p class="text-sm text-mun-gray-900">{{ note.content || note.text || note }}</p>
                            <p class="text-xs text-mun-gray-400 mt-0.5">
                                {{ note.createdBy?.firstName || note.author || 'Unknown' }}
                                {{ note.createdBy?.lastName || '' }}
                                · {{ formatDate(note.createdAt || note.timestamp) }}
                            </p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <input v-model="newNote" type="text" class="input-field text-sm flex-1"
                            placeholder="Add an internal note..." @keyup.enter="addNote" />
                        <AppButton size="sm" @click="addNote" :disabled="!newNote.trim() || isActioning">
                            Add
                        </AppButton>
                    </div>
                </div>

                <!-- Status history (collapsible) -->
                <div>
                    <button type="button" @click="showHistory = !showHistory"
                        class="flex items-center text-sm font-semibold text-mun-gray-900">
                        Status History ({{ application.statusHistory?.length || 0 }})
                        <ChevronRightIcon
                            :class="['w-4 h-4 ml-1 transition-transform', showHistory ? 'rotate-90' : '']" />
                    </button>
                    <div v-if="showHistory && application.statusHistory?.length" class="mt-2 space-y-1.5">
                        <div v-for="(entry, i) in [...application.statusHistory].reverse()" :key="i"
                            class="flex items-start text-xs text-mun-gray-500 space-x-2">
                            <span class="text-mun-gray-300 flex-shrink-0">{{ formatDate(entry.timestamp) }}</span>
                            <span>
                                {{ formatStage(entry.fromStage) }} → {{ formatStage(entry.toStage) }}
                                <span v-if="entry.comment" class="text-mun-gray-400"> — {{ entry.comment }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- =============================================
                     ACTIONS BAR
                     ============================================= -->
                <div v-if="!isTerminal" class="border-t border-mun-gray-200 pt-4 space-y-3">
                    <!-- Return for revision input -->
                    <div v-if="showReturnInput" class="flex space-x-2">
                        <input v-model="returnComment" type="text" class="input-field text-sm flex-1"
                            placeholder="Reason for returning (required)..." @keyup.enter="returnForRevision" />
                        <AppButton size="sm" variant="outline" @click="returnForRevision"
                            :disabled="!returnComment.trim() || isActioning">
                            Send Back
                        </AppButton>
                        <AppButton size="sm" variant="ghost" @click="showReturnInput = false">Cancel</AppButton>
                    </div>

                    <!-- Accept panel -->
                    <div v-if="showAcceptPanel" class="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                        <p class="text-sm font-medium text-green-800">Accept Applicant</p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-mun-gray-700 mb-1">Committee *</label>
                                <select v-model="acceptForm.committeeId" class="input-field text-sm !py-1.5">
                                    <option value="">Select committee...</option>
                                    <option v-for="c in committees" :key="c._id" :value="c._id">
                                        {{ c.acronym || c.name }}
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-mun-gray-700 mb-1">Role</label>
                                <select v-model="acceptForm.role" class="input-field text-sm !py-1.5">
                                    <option value="delegate">Delegate</option>
                                    <option value="observer">Observer</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                            <div v-if="acceptForm.role === 'delegate' && acceptableCountries.length > 0">
                                <label class="block text-xs font-medium text-mun-gray-700 mb-1">Country *</label>
                                <select v-model="acceptForm.countryCode" class="input-field text-sm !py-1.5">
                                    <option value="">Select country...</option>
                                    <option v-for="c in acceptableCountries" :key="c.code" :value="c.code">
                                        {{ c.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <AppButton size="sm" class="!bg-green-600 hover:!bg-green-700" @click="acceptApplication"
                                :disabled="isActioning || !acceptForm.committeeId || (acceptForm.role === 'delegate' && !acceptForm.countryCode)">
                                Confirm Accept
                            </AppButton>
                            <AppButton variant="ghost" size="sm" @click="showAcceptPanel = false">Cancel</AppButton>
                        </div>
                    </div>

                    <!-- Action buttons -->
                    <div v-if="!showReturnInput && !showAcceptPanel" class="flex flex-wrap gap-2">
                        <!-- Advance to next stage (only if there IS a next review stage in the pipeline) -->
                        <AppButton v-if="canAdvance" size="sm" @click="advanceStage" :disabled="isActioning">
                            <ArrowRightIcon class="w-3.5 h-3.5 mr-1.5" />
                            Advance to {{ formatStage(nextReviewStage) }}
                        </AppButton>

                        <!-- Return for revision -->
                        <AppButton v-if="canReturn" variant="outline" size="sm" @click="showReturnInput = true">
                            Return for Revision
                        </AppButton>

                        <!-- Accept -->
                        <AppButton v-if="canAccept" size="sm" class="!bg-green-600 hover:!bg-green-700"
                            @click="openAcceptPanel">
                            <CheckIcon class="w-3.5 h-3.5 mr-1.5" />
                            Accept
                        </AppButton>

                        <!-- Verify payment -->
                        <AppButton v-if="canVerifyPayment" size="sm" class="!bg-green-600 hover:!bg-green-700"
                            @click="showVerifyConfirm = true" :disabled="isActioning">
                            <CheckIcon class="w-3.5 h-3.5 mr-1.5" />
                            Verify Payment
                        </AppButton>

                        <!-- Reject -->
                        <AppButton v-if="canReject" variant="ghost" size="sm" class="!text-red-600 hover:!text-red-700"
                            @click="showRejectConfirm = true" :disabled="isActioning">
                            Reject
                        </AppButton>
                    </div>
                </div>
            </div>
        </template>
    </ModalWrapper>

    <!-- Reject confirmation -->
    <ConfirmationDialog v-model="showRejectConfirm" title="Reject Application?"
        message="Are you sure you want to reject this application?" type="danger" confirm-variant="danger"
        confirm-text="Reject" @confirm="rejectApplication" />

    <!-- Verify payment confirmation -->
    <ConfirmationDialog v-model="showVerifyConfirm" title="Verify Payment?"
        message="Verify this payment and create participant?" type="question" confirm-variant="success"
        confirm-text="Verify" @confirm="verifyPayment" />
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    DocumentArrowDownIcon, ChevronRightIcon,
    CheckIcon, ArrowRightIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    application: { type: Object, default: null },
    orgId: { type: String, required: true },
    eventId: { type: String, required: true },
    committees: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()

// =============================================
// LOCAL STATE
// =============================================
const isActioning = ref(false)
const showReturnInput = ref(false)
const showAcceptPanel = ref(false)
const showHistory = ref(false)
const returnComment = ref('')
const newNote = ref('')
const showRejectConfirm = ref(false)
const showVerifyConfirm = ref(false)

const interviewForm = reactive({
    scheduledAt: '',
    score: null,
    notes: ''
})

const acceptForm = reactive({
    committeeId: '',
    countryCode: '',
    role: 'delegate'
})

// =============================================
// RESET on open
// =============================================
watch(() => props.modelValue, (open) => {
    if (open && props.application) {
        showReturnInput.value = false
        showAcceptPanel.value = false
        showHistory.value = false
        returnComment.value = ''
        newNote.value = ''

        // Pre-fill interview form
        const iv = props.application.interview
        if (iv) {
            interviewForm.scheduledAt = iv.scheduledAt
                ? new Date(iv.scheduledAt).toISOString().slice(0, 16) : ''
            interviewForm.score = iv.score || null
            interviewForm.notes = iv.notes || ''
        } else {
            interviewForm.scheduledAt = ''
            interviewForm.score = null
            interviewForm.notes = ''
        }

        // Pre-fill accept form from current reviewing committee
        const cId = props.application.currentReviewingCommittee?._id || props.application.currentReviewingCommittee
        acceptForm.committeeId = cId || ''
        acceptForm.countryCode = ''
        acceptForm.role = 'delegate'
    }
})

// =============================================
// COMPUTED — PIPELINE AWARENESS
// =============================================
const TERMINAL_STAGES = ['joined', 'rejected', 'withdrawn']
const REVIEW_STAGES = ['form_review', 'interview'] // possible review stages

const applicant = computed(() => props.application?.applicant)
const applicantName = computed(() => {
    const a = applicant.value
    if (!a) return 'Unknown'
    return `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || 'Unknown'
})

const isTerminal = computed(() => TERMINAL_STAGES.includes(props.application?.currentStage))

// Active pipeline stages from the registration form
const activePipelineStages = computed(() => {
    const stages = props.application?.form?.pipelineStages
    if (!stages || !Array.isArray(stages)) return ['form_review'] // fallback
    return stages
        .filter(s => s.isActive)
        .sort((a, b) => a.order - b.order)
        .map(s => s.stage)
})

// The next review stage after the current one (within active pipeline)
const nextReviewStage = computed(() => {
    const current = props.application?.currentStage
    const idx = activePipelineStages.value.indexOf(current)
    if (idx === -1 || idx >= activePipelineStages.value.length - 1) return null
    return activePipelineStages.value[idx + 1]
})

// Can advance to next review stage? Only if there IS a next stage
const canAdvance = computed(() => {
    if (!props.application || isTerminal.value) return false
    const stage = props.application.currentStage
    if (!REVIEW_STAGES.includes(stage)) return false
    return !!nextReviewStage.value
})

// Can return for revision?
const canReturn = computed(() => {
    if (!props.application || isTerminal.value) return false
    return REVIEW_STAGES.includes(props.application.currentStage)
})

// Can accept? Available at any review stage (admin privilege) + legacy final_decision
const canAccept = computed(() => {
    if (!props.application || isTerminal.value) return false
    const stage = props.application.currentStage
    return REVIEW_STAGES.includes(stage) || stage === 'final_decision'
})

// Can verify payment?
const canVerifyPayment = computed(() => {
    return props.application?.currentStage === 'payment_pending'
})

// Can reject?
const canReject = computed(() => {
    if (!props.application || isTerminal.value) return false
    const stage = props.application.currentStage
    return stage !== 'joined' // can reject from any non-terminal stage
})

const sortedPreferences = computed(() => {
    if (!props.application?.committeePreferences) return []
    return [...props.application.committeePreferences].sort((a, b) => a.priority - b.priority)
})

const acceptableCountries = computed(() => {
    if (!acceptForm.committeeId) return []
    const committee = props.committees.find(c => c._id === acceptForm.committeeId)
    return committee?.countries || []
})

const acceptanceCommitteeName = computed(() => {
    const acc = props.application?.acceptance
    if (!acc?.committee) return ''
    // committee might be populated or just an ID
    if (typeof acc.committee === 'object') {
        return acc.committee.acronym || acc.committee.name || ''
    }
    const c = props.committees.find(cm => cm._id === acc.committee)
    return c?.acronym || c?.name || acc.committee
})

const customFieldsList = computed(() => {
    const app = props.application
    if (!app?.form?.customFields || !app?.customFieldResponses) return []
    const responses = app.customFieldResponses
    return app.form.customFields
        .map(field => {
            const value = responses instanceof Map ? responses.get(field.fieldId) : responses[field.fieldId]
            const isFile = field.type === 'file'
            return {
                fieldId: field.fieldId,
                label: field.label,
                value: value ?? null,
                isFile,
                fileName: isFile && typeof value === 'string' ? value.split('/').pop() : null
            }
        })
        .filter(f => f.value !== null && f.value !== undefined)
})

const showInterviewSection = computed(() => {
    if (!props.application) return false
    const stage = props.application.currentStage
    // Show if we're at interview stage, or if interview is in the active pipeline and we're reviewing
    if (stage === 'interview') return true
    // Also show if committee reviews have interview data
    const hasCommitteeInterviews = props.application.committeeReviews?.some(r => r.interviewData?.scheduledAt)
    return hasCommitteeInterviews
})

const showPaymentSection = computed(() => {
    if (!props.application) return false
    return ['payment_pending', 'payment_verified', 'joined'].includes(props.application.currentStage) &&
        (props.application.payment?.amount || props.application.payment?.paidAt || props.application.payment?.verifiedAt)
})

const stageBannerClass = computed(() => {
    const stage = props.application?.currentStage
    if (!stage) return 'bg-mun-gray-50 text-mun-gray-700'
    if (TERMINAL_STAGES.includes(stage)) {
        if (stage === 'joined') return 'bg-green-50 text-green-800'
        if (stage === 'rejected') return 'bg-red-50 text-red-800'
        return 'bg-mun-gray-50 text-mun-gray-700'
    }
    if (stage === 'payment_pending') return 'bg-yellow-50 text-yellow-800'
    return 'bg-blue-50 text-blue-800'
})

// =============================================
// HELPERS
// =============================================
const isCurrentCommittee = (pref) => {
    const cId = props.application?.currentReviewingCommittee?._id || props.application?.currentReviewingCommittee
    const prefId = pref.committee?._id || pref.committee
    return cId && prefId && cId === prefId
}

const isPassedCommittee = (pref) => {
    const reviews = props.application?.committeeReviews || []
    const prefId = pref.committee?._id || pref.committee
    return reviews.some(r => {
        const rId = r.committee?._id || r.committee
        return rId === prefId && r.decision === 'passed'
    })
}

const mediaUrl = (path) => {
    if (!path) return '#'
    if (path.startsWith('http')) return path
    return `/api/uploads/${path}`
}

const formatStage = (stage) => {
    if (!stage) return ''
    const map = {
        form_review: 'Form Review',
        interview: 'Interview',
        returned_for_revision: 'Returned for Revision',
        accepted: 'Accepted',
        passed: 'Passed',
        payment_pending: 'Payment Pending',
        payment_verified: 'Payment Verified',
        joined: 'Joined',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn',
        final_decision: 'Final Decision',
    }
    return map[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const formatRole = (role) => {
    const map = { delegate: 'Delegate', observer: 'Observer', expert: 'Expert' }
    return map[role] || role
}

const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// =============================================
// ACTIONS
// =============================================
const closeAndRefresh = () => {
    emit('update:modelValue', false)
    emit('updated')
}

const advanceStage = async () => {
    if (!nextReviewStage.value) return
    isActioning.value = true
    try {
        await apiMethods.registration.moveToStage(props.orgId, props.eventId, props.application._id, {
            stage: nextReviewStage.value
        })
        toast.success(`Advanced to ${formatStage(nextReviewStage.value)}`)
        closeAndRefresh()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to advance stage')
    } finally {
        isActioning.value = false
    }
}

const returnForRevision = async () => {
    if (!returnComment.value.trim()) return
    isActioning.value = true
    try {
        await apiMethods.registration.returnForRevision(props.orgId, props.eventId, props.application._id, {
            comment: returnComment.value
        })
        toast.success('Returned for revision')
        closeAndRefresh()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to return application')
    } finally {
        isActioning.value = false
    }
}

const openAcceptPanel = () => {
    // Pre-fill committee from current reviewing committee
    const cId = props.application?.currentReviewingCommittee?._id || props.application?.currentReviewingCommittee
    acceptForm.committeeId = cId || ''
    acceptForm.countryCode = ''
    acceptForm.role = 'delegate'
    showAcceptPanel.value = true
}

const acceptApplication = async () => {
    if (!acceptForm.committeeId) { toast.error('Select a committee'); return }
    if (acceptForm.role === 'delegate' && !acceptForm.countryCode) { toast.error('Select a country'); return }

    isActioning.value = true
    try {
        const selectedCountry = acceptableCountries.value.find(c => c.code === acceptForm.countryCode)
        await apiMethods.registration.accept(props.orgId, props.eventId, props.application._id, {
            committeeId: acceptForm.committeeId,
            country: acceptForm.role === 'delegate' && selectedCountry
                ? { name: selectedCountry.name, code: selectedCountry.code }
                : undefined,
            role: acceptForm.role
        })
        toast.success('Application accepted')
        closeAndRefresh()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to accept application')
    } finally {
        isActioning.value = false
    }
}

const rejectApplication = async () => {
    isActioning.value = true
    try {
        await apiMethods.registration.reject(props.orgId, props.eventId, props.application._id, {})
        toast.success('Application rejected')
        closeAndRefresh()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to reject application')
    } finally {
        isActioning.value = false
    }
}

const verifyPayment = async () => {
    isActioning.value = true
    try {
        await apiMethods.registration.verifyPayment(props.orgId, props.eventId, props.application._id, {})
        toast.success('Payment verified — participant created')
        closeAndRefresh()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to verify payment')
    } finally {
        isActioning.value = false
    }
}

const addNote = async () => {
    if (!newNote.value.trim()) return
    isActioning.value = true
    try {
        await apiMethods.registration.addNote(props.orgId, props.eventId, props.application._id, {
            content: newNote.value
        })
        // Optimistically add the note locally
        if (!props.application.internalNotes) props.application.internalNotes = []
        props.application.internalNotes.push({
            content: newNote.value,
            createdBy: { firstName: 'You' },
            createdAt: new Date()
        })
        newNote.value = ''
        toast.success('Note added')
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to add note')
    } finally {
        isActioning.value = false
    }
}

const saveInterview = async () => {
    isActioning.value = true
    try {
        await apiMethods.registration.updateInterview(props.orgId, props.eventId, props.application._id, {
            scheduledAt: interviewForm.scheduledAt || null,
            score: interviewForm.score,
            notes: interviewForm.notes
        })
        toast.success('Interview data saved')
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save interview data')
    } finally {
        isActioning.value = false
    }
}
</script>