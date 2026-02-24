<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Header bar -->
        <header class="bg-white border-b border-mun-gray-200 sticky top-0 z-10">
            <div class="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
                <router-link
                    :to="{ name: 'PublicEventPage', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                    class="flex items-center gap-2 text-sm text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                    <ArrowLeftIcon class="w-4 h-4" />
                    <span class="hidden sm:inline">Back to event</span>
                </router-link>
                <span class="text-sm font-medium text-mun-gray-900 truncate max-w-xs">{{ eventName }}</span>
            </div>
        </header>

        <div class="max-w-2xl mx-auto px-6 py-10 lg:py-14">
            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-12">
                <LoadingSpinner class="w-8 h-8" />
            </div>

            <!-- Error -->
            <div v-else-if="error"
                class="bg-white rounded-2xl border border-mun-gray-200 shadow-sm p-10 text-center space-y-4">
                <ExclamationCircleIcon class="w-12 h-12 text-mun-gray-300 mx-auto" />
                <p class="text-mun-gray-600">{{ error }}</p>
                <router-link
                    :to="{ name: 'PublicRegistrationPage', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                    class="inline-block text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                    Apply now →
                </router-link>
            </div>

            <!-- Application content -->
            <template v-else-if="application">
                <!-- Title -->
                <div class="mb-8">
                    <h1 class="text-3xl font-extrabold text-mun-gray-900 tracking-tight mb-2">Your Application</h1>
                    <p class="text-mun-gray-500">Track the status of your registration.</p>
                </div>

                <!-- Status card -->
                <div class="bg-white rounded-2xl border border-mun-gray-200 shadow-sm overflow-hidden mb-6">
                    <div :class="['p-6', statusBgClass]">
                        <div class="flex items-center space-x-4">
                            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', statusIconBgClass]">
                                <component :is="statusIcon" class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p class="text-lg font-bold" :class="statusTextClass">{{ statusLabel }}</p>
                                <p class="text-sm opacity-75" :class="statusTextClass">{{ statusDescription }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Progress steps -->
                    <div class="px-6 py-4 border-t border-mun-gray-100">
                        <div class="flex items-center justify-between">
                            <div v-for="(step, i) in progressSteps" :key="step.key" class="flex items-center"
                                :class="i < progressSteps.length - 1 ? 'flex-1' : ''">
                                <div class="flex flex-col items-center">
                                    <div :class="[
                                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                                        step.status === 'done' ? 'bg-green-500 text-white' :
                                            step.status === 'current' ? 'bg-mun-blue text-white' :
                                                step.status === 'error' ? 'bg-red-500 text-white' :
                                                    'bg-mun-gray-200 text-mun-gray-500'
                                    ]">
                                        <CheckIcon v-if="step.status === 'done'" class="w-4 h-4" />
                                        <XMarkIcon v-else-if="step.status === 'error'" class="w-4 h-4" />
                                        <span v-else>{{ i + 1 }}</span>
                                    </div>
                                    <span class="text-[10px] text-mun-gray-500 mt-1 text-center leading-tight w-16">{{
                                        step.label }}</span>
                                </div>
                                <div v-if="i < progressSteps.length - 1"
                                    :class="['flex-1 h-0.5 mx-2 mt-[-16px]', step.status === 'done' ? 'bg-green-300' : 'bg-mun-gray-200']">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Returned for revision message -->
                <div v-if="application.currentStage === 'returned_for_revision'"
                    class="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <p class="text-sm font-medium text-orange-800 mb-1">Revision Requested</p>
                    <p v-if="latestReturnComment" class="text-sm text-orange-700">
                        "{{ latestReturnComment }}"
                    </p>
                    <router-link
                        :to="{ name: 'PublicRegistrationPage', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="inline-block mt-2 text-sm text-orange-800 font-medium hover:text-orange-900">
                        Edit and resubmit →
                    </router-link>
                </div>

                <!-- Acceptance details -->
                <div v-if="application.acceptance?.committee"
                    class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <p class="text-sm font-medium text-green-800 mb-2">You've been accepted!</p>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span class="text-green-700">Committee:</span>
                            <span class="font-medium text-green-900 ml-1">
                                {{ application.acceptance.committee?.name || application.acceptance.committee?.acronym
                                }}
                            </span>
                        </div>
                        <div>
                            <span class="text-green-700">Role:</span>
                            <span class="font-medium text-green-900 ml-1 capitalize">{{ application.acceptance.role ||
                                'delegate' }}</span>
                        </div>
                        <div v-if="application.acceptance.country?.name">
                            <span class="text-green-700">Country:</span>
                            <span class="font-medium text-green-900 ml-1">{{ application.acceptance.country.name
                                }}</span>
                        </div>
                    </div>
                </div>

                <!-- Payment section -->
                <div v-if="application.currentStage === 'payment_pending' && application.payment"
                    class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p class="text-sm font-medium text-amber-800 mb-2">Payment Required</p>
                    <div class="space-y-1 text-sm text-amber-700">
                        <p v-if="application.payment.amount">
                            Amount: <span class="font-medium text-amber-900">{{ application.payment.amount }} {{
                                application.payment.currency || 'USD' }}</span>
                        </p>
                        <p v-if="application.payment.deadline">
                            Deadline: <span class="font-medium text-amber-900">{{
                                formatDate(application.payment.deadline) }}</span>
                        </p>
                        <p v-if="application.payment.instructions" class="pt-1 border-t border-amber-200 mt-2">
                            {{ application.payment.instructions }}
                        </p>
                    </div>
                </div>

                <!-- Committee preferences -->
                <div v-if="application.committeePreferences?.length"
                    class="bg-white rounded-xl border border-mun-gray-200 p-4 mb-6">
                    <h3 class="text-sm font-semibold text-mun-gray-700 mb-3">Your Committee Preferences</h3>
                    <div class="flex flex-wrap gap-2">
                        <div v-for="(pref, i) in sortedPreferences" :key="i"
                            class="flex items-center space-x-1.5 px-3 py-1.5 bg-mun-gray-50 rounded-lg text-sm border border-mun-gray-200">
                            <span class="text-xs font-bold text-mun-gray-400">#{{ pref.priority }}</span>
                            <span class="font-medium text-mun-gray-800">{{ pref.committee?.name ||
                                pref.committee?.acronym || '...' }}</span>
                        </div>
                    </div>
                </div>

                <!-- Application details (custom fields) -->
                <div v-if="customFieldsList.length > 0" class="bg-white rounded-xl border border-mun-gray-200 p-4 mb-6">
                    <h3 class="text-sm font-semibold text-mun-gray-700 mb-3">Your Responses</h3>
                    <div class="space-y-2">
                        <div v-for="field in customFieldsList" :key="field.fieldId"
                            class="text-sm p-2 bg-mun-gray-50 rounded-lg">
                            <span class="text-mun-gray-500 font-medium">{{ field.label }}:</span>
                            <span class="text-mun-gray-900 ml-1">{{ field.value }}</span>
                        </div>
                    </div>
                </div>

                <!-- Timeline -->
                <div v-if="application.statusHistory?.length"
                    class="bg-white rounded-xl border border-mun-gray-200 p-4 mb-6">
                    <h3 class="text-sm font-semibold text-mun-gray-700 mb-3">Timeline</h3>
                    <div class="space-y-3">
                        <div v-for="(entry, i) in reversedHistory" :key="i" class="flex items-start space-x-3">
                            <div :class="[
                                'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                i === 0 ? 'bg-mun-blue' : 'bg-mun-gray-300'
                            ]"></div>
                            <div>
                                <p class="text-sm text-mun-gray-900 font-medium">{{ formatStage(entry.toStage) }}</p>
                                <p class="text-xs text-mun-gray-400">{{ formatDateTime(entry.timestamp) }}</p>
                                <p v-if="entry.comment" class="text-xs text-mun-gray-500 mt-0.5 italic">{{ entry.comment
                                    }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Withdraw -->
                <div v-if="canWithdraw" class="text-center pt-4">
                    <button @click="withdrawApplication" class="text-sm text-red-500 hover:text-red-700 font-medium"
                        :disabled="isWithdrawing">
                        {{ isWithdrawing ? 'Withdrawing...' : 'Withdraw Application' }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    ArrowLeftIcon, CheckIcon, XMarkIcon, ExclamationCircleIcon,
    ClockIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon,
    CurrencyDollarIcon, UserGroupIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(true)
const error = ref(null)
const application = ref(null)
const eventName = ref('')
const orgId = ref(null)
const eventId = ref(null)
const isWithdrawing = ref(false)

// =============================================
// LOAD
// =============================================
onMounted(async () => {
    try {
        // Resolve event from slug
        const eventRes = await apiMethods.events.getPublic(route.params.orgSlug, route.params.eventSlug)
        if (!eventRes.data.success) {
            error.value = 'Event not found.'
            return
        }

        const ev = eventRes.data.event
        eventName.value = ev.name
        eventId.value = ev._id
        orgId.value = ev.organization?._id || ev.organization

        // Get my application
        const appRes = await apiMethods.registration.getMyApplication(orgId.value, eventId.value)
        if (appRes.data.success) {
            application.value = appRes.data.application
        } else {
            error.value = 'You have not submitted an application for this event.'
        }
    } catch (e) {
        if (e.response?.status === 404) {
            error.value = 'You have not submitted an application for this event.'
        } else if (e.response?.status === 401) {
            router.push({ name: 'Login', query: { redirect: route.fullPath } })
        } else {
            error.value = 'Failed to load your application.'
        }
    } finally {
        isLoading.value = false
    }
})

// =============================================
// COMPUTED
// =============================================
const sortedPreferences = computed(() => {
    if (!application.value?.committeePreferences) return []
    return [...application.value.committeePreferences].sort((a, b) => a.priority - b.priority)
})

const customFieldsList = computed(() => {
    if (!application.value?.form?.customFields || !application.value?.customFieldResponses) return []
    const responses = application.value.customFieldResponses
    return application.value.form.customFields
        .map(field => {
            const value = responses instanceof Map ? responses.get(field.fieldId) : responses[field.fieldId]
            return {
                fieldId: field.fieldId,
                label: field.label,
                value: value ?? null
            }
        })
        .filter(f => f.value !== null && f.value !== undefined && f.value !== '')
})

const reversedHistory = computed(() => {
    if (!application.value?.statusHistory) return []
    return [...application.value.statusHistory].reverse()
})

// The backend maps stages to friendly labels for applicants
const friendlyStage = computed(() => application.value?.currentStage || 'submitted')

const canWithdraw = computed(() => {
    if (!application.value) return false
    return !['joined', 'rejected', 'withdrawn'].includes(application.value.currentStage)
})

const latestReturnComment = computed(() => {
    if (!application.value?.statusHistory) return null
    const returnEntry = [...application.value.statusHistory]
        .reverse()
        .find(e => e.toStage === 'returned_for_revision')
    return returnEntry?.comment || null
})

// =============================================
// STATUS DISPLAY
// =============================================
const statusLabel = computed(() => {
    const map = {
        under_review: 'Under Review',
        form_review: 'Under Review',
        interview: 'Under Review',
        passed: 'Under Review',
        returned_for_revision: 'Revision Requested',
        payment_pending: 'Payment Required',
        payment_verified: 'Accepted',
        accepted: 'Accepted',
        joined: 'Confirmed',
        rejected: 'Not Selected',
        withdrawn: 'Withdrawn',
    }
    return map[friendlyStage.value] || 'Submitted'
})

const statusDescription = computed(() => {
    const map = {
        under_review: 'Your application is being reviewed by the committee.',
        form_review: 'Your application is being reviewed by the committee.',
        interview: 'Your application is being reviewed by the committee.',
        passed: 'Your application is being reviewed by the committee.',
        returned_for_revision: 'Please update your application based on the feedback below.',
        payment_pending: 'You have been accepted! Please complete the payment to confirm.',
        payment_verified: 'Your payment has been verified. Welcome!',
        accepted: 'Congratulations! You have been accepted.',
        joined: 'You are confirmed as a participant.',
        rejected: 'Unfortunately, your application was not accepted this time.',
        withdrawn: 'You have withdrawn your application.',
    }
    return map[friendlyStage.value] || 'Your application has been submitted.'
})

const statusIcon = computed(() => {
    const stage = friendlyStage.value
    if (['joined', 'payment_verified', 'accepted'].includes(stage)) return CheckCircleIcon
    if (stage === 'rejected') return XCircleIcon
    if (stage === 'withdrawn') return XCircleIcon
    if (stage === 'returned_for_revision') return ExclamationCircleIcon
    if (stage === 'payment_pending') return CurrencyDollarIcon
    return ClockIcon
})

const statusBgClass = computed(() => {
    const stage = friendlyStage.value
    if (['joined', 'payment_verified', 'accepted'].includes(stage)) return 'bg-green-50'
    if (stage === 'rejected') return 'bg-red-50'
    if (stage === 'withdrawn') return 'bg-mun-gray-50'
    if (stage === 'returned_for_revision') return 'bg-orange-50'
    if (stage === 'payment_pending') return 'bg-amber-50'
    return 'bg-blue-50'
})

const statusIconBgClass = computed(() => {
    const stage = friendlyStage.value
    if (['joined', 'payment_verified', 'accepted'].includes(stage)) return 'bg-green-500'
    if (stage === 'rejected') return 'bg-red-500'
    if (stage === 'withdrawn') return 'bg-mun-gray-400'
    if (stage === 'returned_for_revision') return 'bg-orange-500'
    if (stage === 'payment_pending') return 'bg-amber-500'
    return 'bg-mun-blue'
})

const statusTextClass = computed(() => {
    const stage = friendlyStage.value
    if (['joined', 'payment_verified', 'accepted'].includes(stage)) return 'text-green-800'
    if (stage === 'rejected') return 'text-red-800'
    if (stage === 'withdrawn') return 'text-mun-gray-700'
    if (stage === 'returned_for_revision') return 'text-orange-800'
    if (stage === 'payment_pending') return 'text-amber-800'
    return 'text-blue-800'
})

// =============================================
// PROGRESS STEPS
// =============================================
const progressSteps = computed(() => {
    const stage = friendlyStage.value
    const steps = [
        { key: 'submitted', label: 'Submitted' },
        { key: 'review', label: 'Review' },
        { key: 'decision', label: 'Decision' },
        { key: 'confirmed', label: 'Confirmed' },
    ]

    // Determine step status
    if (stage === 'rejected') {
        steps[0].status = 'done'
        steps[1].status = 'done'
        steps[2].status = 'error'
        steps[3].status = 'pending'
    } else if (stage === 'withdrawn') {
        steps[0].status = 'done'
        steps[1].status = 'pending'
        steps[2].status = 'pending'
        steps[3].status = 'pending'
    } else if (['joined', 'payment_verified'].includes(stage)) {
        steps.forEach(s => s.status = 'done')
    } else if (['accepted', 'payment_pending'].includes(stage)) {
        steps[0].status = 'done'
        steps[1].status = 'done'
        steps[2].status = 'done'
        steps[3].status = stage === 'payment_pending' ? 'current' : 'done'
    } else if (['form_review', 'interview', 'under_review', 'passed'].includes(stage)) {
        steps[0].status = 'done'
        steps[1].status = 'current'
        steps[2].status = 'pending'
        steps[3].status = 'pending'
    } else if (stage === 'returned_for_revision') {
        steps[0].status = 'done'
        steps[1].status = 'current'
        steps[2].status = 'pending'
        steps[3].status = 'pending'
    } else {
        steps[0].status = 'current'
        steps[1].status = 'pending'
        steps[2].status = 'pending'
        steps[3].status = 'pending'
    }

    return steps
})

// =============================================
// ACTIONS
// =============================================
const withdrawApplication = async () => {
    if (!confirm('Are you sure you want to withdraw your application? This cannot be undone.')) return
    isWithdrawing.value = true
    try {
        await apiMethods.registration.withdraw(orgId.value, eventId.value)
        toast.success('Application withdrawn')
        application.value.currentStage = 'withdrawn'
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to withdraw')
    } finally {
        isWithdrawing.value = false
    }
}

// =============================================
// FORMATTING
// =============================================
const formatStage = (s) => {
    const map = {
        form_review: 'Under Review',
        interview: 'Interview Stage',
        returned_for_revision: 'Revision Requested',
        passed: 'Under Review',
        payment_pending: 'Payment Required',
        payment_verified: 'Payment Verified',
        accepted: 'Accepted',
        joined: 'Confirmed',
        rejected: 'Not Selected',
        withdrawn: 'Withdrawn',
    }
    return map[s] || s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
</script>