<template>
    <div :class="embedded ? 'space-y-6' : 'p-6 lg:p-8 space-y-6'">
        <!-- Header (standalone mode only) -->
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
            <div class="flex items-center space-x-3">
                <!-- Committee filter -->
                <select v-if="committees.length > 0" v-model="committeeFilter"
                    class="input-field text-sm !py-2 !px-3 !rounded-lg w-48">
                    <option value="">All committees</option>
                    <option v-for="c in committees" :key="c._id" :value="c._id">
                        {{ c.acronym || c.name }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Embedded header with committee filter -->
        <div v-if="embedded && committees.length > 0" class="flex items-center justify-end">
            <select v-model="committeeFilter" class="input-field text-sm !py-2 !px-3 !rounded-lg w-48">
                <option value="">All committees</option>
                <option v-for="c in committees" :key="c._id" :value="c._id">
                    {{ c.acronym || c.name }}
                </option>
            </select>
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
                                    <!-- Committee chain indicator -->
                                    <div v-if="app.committeePreferences?.length"
                                        class="hidden sm:flex items-center space-x-1">
                                        <span v-for="(pref, i) in app.committeePreferences.slice(0, 3)" :key="i" :class="[
                                            'px-1.5 py-0.5 text-[10px] rounded font-medium',
                                            app.currentReviewingCommittee?._id === pref.committee?._id
                                                ? 'bg-mun-blue-100 text-mun-blue-700 ring-1 ring-mun-blue-300'
                                                : isCommitteeReviewed(app, pref.committee?._id)
                                                    ? 'bg-mun-gray-200 text-mun-gray-500 line-through'
                                                    : 'bg-mun-gray-100 text-mun-gray-500'
                                        ]">
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

        <!-- =============================================
             APPLICATION DETAIL MODAL
             ============================================= -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="!!selectedApp" @close="selectedApp = null" size="lg">
            <template #title>
                Application — {{ selectedApp?.applicant?.firstName }} {{ selectedApp?.applicant?.lastName }}
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
                                <span v-if="selectedApp.decidedAt"> · Decided {{ formatDate(selectedApp.decidedAt)
                                    }}</span>
                            </p>
                        </div>
                        <div v-if="selectedApp.currentReviewingCommittee" class="text-right">
                            <p class="text-xs opacity-75">Reviewing committee</p>
                            <p class="text-sm font-semibold">
                                {{ selectedApp.currentReviewingCommittee?.acronym ||
                                    selectedApp.currentReviewingCommittee?.name }}
                                <span class="font-normal opacity-75">(priority {{ (selectedApp.currentPriorityIndex ||
                                    0) + 1 }})</span>
                            </p>
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

                    <!-- Committee preferences -->
                    <section v-if="selectedApp.committeePreferences?.length">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Committee Preferences</h3>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="(pref, i) in sortedPreferences" :key="i" :class="[
                                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm border',
                                getPreferenceClass(pref)
                            ]">
                                <span class="text-xs font-bold opacity-60">#{{ pref.priority }}</span>
                                <span class="font-medium">{{ pref.committee?.acronym || pref.committee?.name || '...'
                                    }}</span>
                                <span v-if="getPreferenceDecision(pref)" class="text-xs opacity-75">
                                    ({{ getPreferenceDecision(pref) }})
                                </span>
                            </div>
                        </div>
                    </section>

                    <!-- Committee review trail -->
                    <section v-if="selectedApp.committeeReviews?.length">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Committee Review Trail</h3>
                        <div class="space-y-2">
                            <div v-for="(review, i) in selectedApp.committeeReviews" :key="i"
                                class="flex items-start space-x-3 p-3 bg-mun-gray-50 rounded-lg text-sm">
                                <div :class="[
                                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                    review.decision === 'accepted' ? 'bg-green-100' :
                                        review.decision === 'passed' ? 'bg-yellow-100' : 'bg-mun-gray-200'
                                ]">
                                    <CheckIcon v-if="review.decision === 'accepted'"
                                        class="w-3.5 h-3.5 text-green-600" />
                                    <ArrowRightIcon v-else-if="review.decision === 'passed'"
                                        class="w-3.5 h-3.5 text-yellow-600" />
                                    <ClockIcon v-else class="w-3.5 h-3.5 text-mun-gray-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <p class="font-medium text-mun-gray-900">
                                            {{ review.committee?.acronym || review.committee?.name }}
                                            <span :class="[
                                                'ml-2 px-1.5 py-0.5 text-xs rounded font-medium',
                                                review.decision === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    review.decision === 'passed' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-mun-gray-100 text-mun-gray-600'
                                            ]">{{ review.decision }}</span>
                                        </p>
                                        <span v-if="review.decidedAt" class="text-xs text-mun-gray-400">
                                            {{ formatDate(review.decidedAt) }}
                                        </span>
                                    </div>
                                    <p v-if="review.decidedBy" class="text-xs text-mun-gray-500 mt-0.5">
                                        by {{ review.decidedBy?.firstName }} {{ review.decidedBy?.lastName }}
                                    </p>
                                    <p v-if="review.internalNote" class="text-xs text-mun-gray-600 mt-1 italic">
                                        "{{ review.internalNote }}"
                                    </p>
                                    <p v-if="review.stageReachedBeforePass" class="text-xs text-mun-gray-400 mt-0.5">
                                        Reached stage: {{ formatStage(review.stageReachedBeforePass) }}
                                    </p>
                                    <!-- Per-committee interview data -->
                                    <div v-if="review.interviewData?.scheduledAt || review.interviewData?.score"
                                        class="mt-1.5 pl-3 border-l-2 border-mun-gray-200">
                                        <p v-if="review.interviewData.scheduledAt" class="text-xs text-mun-gray-500">
                                            Interview: {{ formatDateTime(review.interviewData.scheduledAt) }}
                                            <span v-if="review.interviewData.completedAt" class="text-green-600"> ✓
                                                completed</span>
                                        </p>
                                        <p v-if="review.interviewData.score != null" class="text-xs text-mun-gray-500">
                                            Score: {{ review.interviewData.score }}/10
                                        </p>
                                        <p v-if="review.interviewData.notes" class="text-xs text-mun-gray-500 italic">
                                            {{ review.interviewData.notes }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Acceptance details -->
                    <section v-if="selectedApp.acceptance?.committee">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Acceptance Details</h3>
                        <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm space-y-1">
                            <div>
                                <span class="text-green-700">Committee:</span>
                                <span class="font-medium text-green-900 ml-1">
                                    {{ selectedApp.acceptance.committee?.name ||
                                    selectedApp.acceptance.committee?.acronym }}
                                </span>
                            </div>
                            <div>
                                <span class="text-green-700">Role:</span>
                                <span class="font-medium text-green-900 ml-1 capitalize">{{ selectedApp.acceptance.role
                                    || 'delegate' }}</span>
                            </div>
                            <div v-if="selectedApp.acceptance.country?.name">
                                <span class="text-green-700">Country:</span>
                                <span class="font-medium text-green-900 ml-1">{{ selectedApp.acceptance.country.name
                                    }}</span>
                            </div>
                            <div v-if="selectedApp.acceptance.acceptedBy">
                                <span class="text-green-700">Accepted by:</span>
                                <span class="font-medium text-green-900 ml-1">
                                    {{ selectedApp.acceptance.acceptedBy?.firstName }} {{
                                        selectedApp.acceptance.acceptedBy?.lastName }}
                                </span>
                                <span v-if="selectedApp.acceptance.acceptedAt" class="text-green-600 text-xs ml-1">
                                    on {{ formatDate(selectedApp.acceptance.acceptedAt) }}
                                </span>
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

                    <!-- Interview section (legacy flat field — shown when no committee reviews exist) -->
                    <section v-if="showInterviewSection">
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

                    <!-- Payment section -->
                    <section v-if="showPaymentSection">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Payment</h3>
                        <div class="p-3 rounded-lg space-y-2 text-sm" :class="selectedApp.currentStage === 'joined' || selectedApp.payment?.verifiedAt
                            ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
                            <div class="grid grid-cols-2 gap-2">
                                <div v-if="selectedApp.payment?.amount">
                                    <span class="text-mun-gray-500">Amount:</span>
                                    <span class="font-medium ml-1">
                                        {{ selectedApp.payment.amount }} {{ selectedApp.payment.currency || 'USD' }}
                                    </span>
                                </div>
                                <div v-if="selectedApp.payment?.deadline">
                                    <span class="text-mun-gray-500">Deadline:</span>
                                    <span class="font-medium ml-1">{{ formatDate(selectedApp.payment.deadline) }}</span>
                                </div>
                                <div v-if="selectedApp.payment?.paidAt">
                                    <span class="text-mun-gray-500">Paid:</span>
                                    <span class="font-medium ml-1">{{ formatDate(selectedApp.payment.paidAt) }}</span>
                                </div>
                                <div v-if="selectedApp.payment?.paidAmount">
                                    <span class="text-mun-gray-500">Paid amount:</span>
                                    <span class="font-medium ml-1">{{ selectedApp.payment.paidAmount }} {{
                                        selectedApp.payment.currency
                                        || 'USD' }}</span>
                                </div>
                                <div v-if="selectedApp.payment?.verifiedAt">
                                    <span class="text-green-700">Verified:</span>
                                    <span class="font-medium text-green-800 ml-1">{{
                                        formatDate(selectedApp.payment.verifiedAt)
                                        }}</span>
                                </div>
                            </div>
                            <!-- Waiver info -->
                            <div v-if="selectedApp.payment?.waiver?.type && selectedApp.payment.waiver.type !== 'none'"
                                class="pt-1 border-t border-yellow-200">
                                <span class="text-mun-gray-500">Waiver:</span>
                                <span class="font-medium ml-1 capitalize">{{ selectedApp.payment.waiver.type }}</span>
                                <span v-if="selectedApp.payment.waiver.reason" class="text-xs text-mun-gray-500 ml-1">
                                    — {{ selectedApp.payment.waiver.reason }}
                                </span>
                            </div>
                            <!-- Verify button -->
                            <AppButton v-if="selectedApp.currentStage === 'payment_pending'" size="sm"
                                class="!bg-green-600 hover:!bg-green-700" @click="verifyPayment"
                                :disabled="isActioning">
                                Verify Payment
                            </AppButton>
                        </div>
                    </section>

                    <!-- Moderator notes -->
                    <section v-if="selectedApp.moderatorNotes?.length || !isTerminal">
                        <h3 class="text-sm font-semibold text-mun-gray-700 mb-2">Internal Notes</h3>
                        <div class="space-y-2">
                            <div v-for="(note, i) in selectedApp.moderatorNotes" :key="i"
                                class="p-2 bg-mun-gray-50 rounded-lg text-sm">
                                <p class="text-mun-gray-900">{{ note.text }}</p>
                                <p class="text-xs text-mun-gray-400 mt-1">
                                    {{ note.author?.firstName }} {{ note.author?.lastName }} · {{
                                    formatDate(note.timestamp) }}
                                </p>
                            </div>
                            <div v-if="!isTerminal" class="flex space-x-2">
                                <input v-model="newNote" type="text" class="input-field text-sm flex-1"
                                    placeholder="Add an internal note..." @keyup.enter="addNote" />
                                <AppButton size="sm" @click="addNote" :disabled="!newNote.trim()">Add</AppButton>
                            </div>
                        </div>
                    </section>

                    <!-- Status history (collapsible) -->
                    <section v-if="selectedApp.statusHistory?.length">
                        <button @click="showHistory = !showHistory"
                            class="text-sm font-semibold text-mun-gray-700 flex items-center space-x-1 mb-2">
                            <span>Status History ({{ selectedApp.statusHistory.length }})</span>
                            <ChevronRightIcon
                                :class="['w-4 h-4 transition-transform', showHistory ? 'rotate-90' : '']" />
                        </button>
                        <div v-if="showHistory" class="space-y-1">
                            <div v-for="(entry, i) in [...selectedApp.statusHistory].reverse()" :key="i"
                                class="flex items-start space-x-2 text-xs p-1.5">
                                <span class="text-mun-gray-400 flex-shrink-0 w-28">{{ formatDateTime(entry.timestamp)
                                    }}</span>
                                <span class="text-mun-gray-600">
                                    {{ entry.fromStage ? formatStage(entry.fromStage) + ' →' : '' }}
                                    <span class="font-medium text-mun-gray-800">{{ formatStage(entry.toStage) }}</span>
                                </span>
                                <span v-if="entry.changedBy" class="text-mun-gray-400">
                                    by {{ entry.changedBy?.firstName }} {{ entry.changedBy?.lastName }}
                                </span>
                                <span v-if="entry.comment" class="text-mun-gray-500 italic truncate max-w-xs"
                                    :title="entry.comment">
                                    — {{ entry.comment }}
                                </span>
                            </div>
                        </div>
                    </section>

                    <!-- =============================================
                         ACTIONS BAR
                         ============================================= -->
                    <div v-if="!isTerminal" class="border-t border-mun-gray-200 pt-4 space-y-3">
                        <!-- Action buttons row -->
                        <div class="flex flex-wrap items-center gap-2">
                            <!-- Advance stage -->
                            <AppButton v-if="canAdvance" size="sm" @click="advanceStage" :disabled="isActioning">
                                Advance to {{ formatStage(nextStage) }}
                            </AppButton>

                            <!-- Return for revision -->
                            <AppButton v-if="canReturn" variant="outline" size="sm"
                                @click="showReturnInput = !showReturnInput" :disabled="isActioning">
                                Return for Revision
                            </AppButton>

                            <!-- Accept -->
                            <AppButton v-if="canAccept" size="sm" class="!bg-green-600 hover:!bg-green-700"
                                @click="showAcceptPanel = !showAcceptPanel" :disabled="isActioning">
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
                                placeholder="Reason for returning (required)..." @keyup.enter="returnForRevision" />
                            <AppButton size="sm" @click="returnForRevision" :disabled="!returnComment.trim()">
                                Send Back
                            </AppButton>
                            <AppButton variant="ghost" size="sm" @click="showReturnInput = false">Cancel</AppButton>
                        </div>

                        <!-- Accept panel -->
                        <div v-if="showAcceptPanel"
                            class="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-medium text-mun-gray-700 mb-1">Committee *</label>
                                    <select v-model="acceptForm.committeeId" class="input-field text-sm !py-1.5">
                                        <option value="">Select committee...</option>
                                        <option v-for="c in committees" :key="c._id" :value="c._id">
                                            {{ c.name }}
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
                            </div>
                            <!-- Country selection for delegates -->
                            <div v-if="acceptForm.role === 'delegate' && acceptableCountries.length > 0">
                                <label class="block text-xs font-medium text-mun-gray-700 mb-1">Country *</label>
                                <select v-model="acceptForm.countryCode" class="input-field text-sm !py-1.5">
                                    <option value="">Select country...</option>
                                    <option v-for="country in acceptableCountries" :key="country.code"
                                        :value="country.code">
                                        {{ country.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="flex space-x-2">
                                <AppButton size="sm" class="!bg-green-600 hover:!bg-green-700"
                                    @click="acceptApplication"
                                    :disabled="isActioning || !acceptForm.committeeId || (acceptForm.role === 'delegate' && !acceptForm.countryCode)">
                                    Confirm Accept
                                </AppButton>
                                <AppButton variant="ghost" size="sm" @click="showAcceptPanel = false">Cancel</AppButton>
                            </div>
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
import {
    DocumentTextIcon, ChevronRightIcon, DocumentArrowDownIcon,
    CheckIcon, ArrowRightIcon, ClockIcon
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
const isActioning = ref(false)
const eventData = ref(null)
const applications = ref([])
const committees = ref([])
const stageCounts = ref({})
const selectedApp = ref(null)
const activeStage = ref('all')
const committeeFilter = ref('')

// Detail modal state
const showReturnInput = ref(false)
const showAcceptPanel = ref(false)
const showHistory = ref(false)
const returnComment = ref('')
const newNote = ref('')

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

const pagination = reactive({ page: 1, total: 0, pages: 1, limit: 20 })

// =============================================
// STAGE DEFINITIONS
// =============================================
const TERMINAL_STAGES = ['joined', 'rejected', 'withdrawn']

const stageFilters = [
    { value: 'all', label: 'All' },
    { value: 'form_review', label: 'Form Review' },
    { value: 'interview', label: 'Interview' },
    { value: 'returned_for_revision', label: 'Returned' },
    { value: 'payment_pending', label: 'Payment Pending' },
    { value: 'joined', label: 'Joined' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
]

const activeStageLabel = computed(() => stageFilters.find(s => s.value === activeStage.value)?.label || activeStage.value)

const stageCount = (stageValue) => {
    if (stageValue === 'all') {
        return Object.values(stageCounts.value).reduce((a, b) => a + b, 0)
    }
    return stageCounts.value[stageValue] || 0
}

// =============================================
// COMPUTED — DETAIL MODAL
// =============================================
const isTerminal = computed(() => TERMINAL_STAGES.includes(selectedApp.value?.currentStage))

const sortedPreferences = computed(() => {
    if (!selectedApp.value?.committeePreferences) return []
    return [...selectedApp.value.committeePreferences].sort((a, b) => a.priority - b.priority)
})

const customFieldsList = computed(() => {
    if (!selectedApp.value?.form?.customFields || !selectedApp.value?.customFieldResponses) return []
    const responses = selectedApp.value.customFieldResponses
    return selectedApp.value.form.customFields
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

// Show interview section only if the app is at interview stage and no committee-level interview data exists
const showInterviewSection = computed(() => {
    if (!selectedApp.value) return false
    const stage = selectedApp.value.currentStage
    if (!['form_review', 'interview'].includes(stage)) return false
    // If committee reviews have interview data, that section handles it
    const hasCommitteeInterviews = selectedApp.value.committeeReviews?.some(r => r.interviewData?.scheduledAt)
    return !hasCommitteeInterviews && stage === 'interview'
})

const showPaymentSection = computed(() => {
    if (!selectedApp.value) return false
    return ['payment_pending', 'payment_verified', 'joined'].includes(selectedApp.value.currentStage) &&
        (selectedApp.value.payment?.amount || selectedApp.value.payment?.paidAt || selectedApp.value.payment?.verifiedAt)
})

// Action permissions — org admin view, so broad permissions
const canAdvance = computed(() => {
    if (!selectedApp.value || isTerminal.value) return false
    const stage = selectedApp.value.currentStage
    // Can advance from form_review → interview (if interview stage exists in form pipeline)
    return stage === 'form_review'
})

const canReturn = computed(() => {
    if (!selectedApp.value || isTerminal.value) return false
    return ['form_review', 'interview'].includes(selectedApp.value.currentStage)
})

const canAccept = computed(() => {
    if (!selectedApp.value || isTerminal.value) return false
    return ['form_review', 'interview'].includes(selectedApp.value.currentStage)
})

const canReject = computed(() => {
    if (!selectedApp.value || isTerminal.value) return false
    return selectedApp.value.currentStage !== 'returned_for_revision'
})

const nextStage = computed(() => {
    if (selectedApp.value?.currentStage === 'form_review') return 'interview'
    return null
})

// Countries available for the selected committee in accept form
const acceptableCountries = computed(() => {
    if (!acceptForm.committeeId) return []
    const committee = committees.value.find(c => c._id === acceptForm.committeeId)
    return committee?.countries || []
})

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
// DETAIL VIEW
// =============================================
const openDetail = async (app) => {
    try {
        const res = await apiMethods.registration.getApplication(orgId.value, eventData.value._id, app._id)
        if (res.data.success) {
            selectedApp.value = res.data.application
            showReturnInput.value = false
            showAcceptPanel.value = false
            showHistory.value = false
            returnComment.value = ''
            newNote.value = ''

            // Pre-fill interview form from legacy flat field
            if (selectedApp.value.interview) {
                interviewForm.scheduledAt = selectedApp.value.interview.scheduledAt
                    ? new Date(selectedApp.value.interview.scheduledAt).toISOString().slice(0, 16) : ''
                interviewForm.score = selectedApp.value.interview.score || null
                interviewForm.notes = selectedApp.value.interview.notes || ''
            }

            // Pre-fill accept form from current reviewing committee
            if (selectedApp.value.currentReviewingCommittee) {
                const cId = selectedApp.value.currentReviewingCommittee._id || selectedApp.value.currentReviewingCommittee
                acceptForm.committeeId = cId
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
    if (!returnComment.value.trim()) return
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
    if (acceptForm.role === 'delegate' && !acceptForm.countryCode) { toast.error('Select a country'); return }

    isActioning.value = true
    try {
        const selectedCountry = acceptableCountries.value.find(c => c.code === acceptForm.countryCode)
        await apiMethods.registration.accept(orgId.value, eventData.value._id, selectedApp.value._id, {
            committeeId: acceptForm.committeeId,
            country: acceptForm.role === 'delegate' && selectedCountry ? {
                name: selectedCountry.name,
                code: selectedCountry.code,
                flag: selectedCountry.flag || null
            } : undefined,
            role: acceptForm.role,
        })
        toast.success('Application accepted')
        selectedApp.value = null
        acceptForm.committeeId = ''
        acceptForm.countryCode = ''
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
            text: newNote.value
        })
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
        if (interviewForm.score != null) data.score = interviewForm.score
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

// =============================================
// HELPERS
// =============================================
const isCommitteeReviewed = (app, committeeId) => {
    if (!app.committeeReviews || !committeeId) return false
    return app.committeeReviews.some(r => {
        const rId = r.committee?._id || r.committee
        return rId === committeeId && r.decision !== 'pending'
    })
}

const getPreferenceClass = (pref) => {
    if (!selectedApp.value?.committeeReviews) return 'bg-white border-mun-gray-200'
    const review = selectedApp.value.committeeReviews.find(r => {
        const rId = r.committee?._id || r.committee
        const pId = pref.committee?._id || pref.committee
        return rId === pId
    })
    if (!review) return 'bg-white border-mun-gray-200'
    if (review.decision === 'accepted') return 'bg-green-50 border-green-300 text-green-800'
    if (review.decision === 'passed') return 'bg-yellow-50 border-yellow-300 text-yellow-800'
    // pending — check if currently reviewing
    const currentId = selectedApp.value.currentReviewingCommittee?._id || selectedApp.value.currentReviewingCommittee
    const prefId = pref.committee?._id || pref.committee
    if (currentId === prefId) return 'bg-mun-blue-50 border-mun-blue-300 text-mun-blue-800'
    return 'bg-white border-mun-gray-200'
}

const getPreferenceDecision = (pref) => {
    if (!selectedApp.value?.committeeReviews) return null
    const review = selectedApp.value.committeeReviews.find(r => {
        const rId = r.committee?._id || r.committee
        const pId = pref.committee?._id || pref.committee
        return rId === pId
    })
    if (!review || review.decision === 'pending') return null
    return review.decision
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

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
}) : ''

const stageClass = (stage) => {
    const map = {
        form_review: 'px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
        interview: 'px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700',
        returned_for_revision: 'px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700',
        accepted: 'px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700',
        passed: 'px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
        payment_pending: 'px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700',
        payment_verified: 'px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-700',
        joined: 'px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800',
        rejected: 'px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700',
        withdrawn: 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
    }
    return map[stage] || 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600'
}

const stageBgClass = (stage) => {
    const map = {
        form_review: 'bg-blue-50 text-blue-800',
        interview: 'bg-purple-50 text-purple-800',
        returned_for_revision: 'bg-orange-50 text-orange-800',
        accepted: 'bg-green-50 text-green-800',
        passed: 'bg-yellow-50 text-yellow-800',
        payment_pending: 'bg-amber-50 text-amber-800',
        payment_verified: 'bg-teal-50 text-teal-800',
        joined: 'bg-green-50 text-green-800',
        rejected: 'bg-red-50 text-red-800',
        withdrawn: 'bg-mun-gray-100 text-mun-gray-700',
    }
    return map[stage] || 'bg-mun-gray-100 text-mun-gray-700'
}

// =============================================
// LIFECYCLE
// =============================================
onMounted(() => loadInitial())
</script>