<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Event Settings</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage your event's profile and public page</p>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else-if="event">
            <!-- Public page link bar -->
            <section class="bg-white rounded-xl border border-mun-gray-200 p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-mun-gray-700">Public Event Page</p>
                        <p class="text-xs text-mun-gray-400 mt-0.5">Share this link for people to view the event</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <code
                            class="text-xs bg-mun-gray-50 text-mun-gray-600 px-3 py-1.5 rounded-lg border border-mun-gray-200 max-w-xs truncate hidden sm:block">
                            {{ eventPageUrl }}
                        </code>
                        <button @click="copyLink(eventPageUrl)"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                            <ClipboardDocumentIcon class="w-4 h-4" />
                            {{ copiedField === 'link' ? 'Copied!' : 'Copy' }}
                        </button>
                        <a :href="eventPageUrl" target="_blank"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mun-gray-600 bg-mun-gray-50 rounded-lg hover:bg-mun-gray-100 transition-colors">
                            <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                            Open
                        </a>
                    </div>
                </div>
            </section>

            <!-- Tabs -->
            <div class="flex items-center space-x-1 bg-white rounded-xl border border-mun-gray-200 p-1 overflow-x-auto">
                <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                    activeTab === tab.id
                        ? 'bg-mun-blue text-white'
                        : 'text-mun-gray-600 hover:bg-mun-gray-50'
                ]">
                    {{ tab.label }}
                </button>
            </div>

            <!-- ==================== OVERVIEW TAB ==================== -->
            <template v-if="activeTab === 'overview'">
                <!-- General Information -->
                <section class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-mun-gray-900">General Information</h2>
                        <AppButton v-if="canManage" variant="ghost" size="sm" @click="showEditModal = true">
                            <PencilIcon class="w-4 h-4 mr-1" /> Edit
                        </AppButton>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p class="text-mun-gray-500">Name</p>
                            <p class="font-medium text-mun-gray-900">{{ event.name }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Slug</p>
                            <p class="font-mono text-xs text-mun-gray-700">{{ event.slug }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Status</p>
                            <span :class="statusBadgeClass(event.status)">{{ formatStatus(event.status) }}</span>
                        </div>
                        <div v-if="event.startDate">
                            <p class="text-mun-gray-500">Start Date</p>
                            <p class="text-mun-gray-900">{{ formatDate(event.startDate) }}</p>
                        </div>
                        <div v-if="event.endDate">
                            <p class="text-mun-gray-500">End Date</p>
                            <p class="text-mun-gray-900">{{ formatDate(event.endDate) }}</p>
                        </div>
                        <div v-if="event.timezone">
                            <p class="text-mun-gray-500">Timezone</p>
                            <p class="text-mun-gray-900">{{ event.timezone }}</p>
                        </div>
                        <div v-if="event.location">
                            <p class="text-mun-gray-500">Location</p>
                            <p class="text-mun-gray-900">{{ event.location }}</p>
                        </div>
                        <div v-if="event.mapUrl">
                            <p class="text-mun-gray-500">Map Link</p>
                            <a :href="event.mapUrl" target="_blank"
                                class="text-mun-blue hover:underline break-all text-sm">View on map ↗</a>
                        </div>
                        <div v-if="event.logo">
                            <p class="text-mun-gray-500">Logo</p>
                            <img :src="mediaUrl(event.logo)" alt="Event logo"
                                class="mt-1 w-14 h-14 rounded-lg object-cover border border-mun-gray-200" />
                        </div>
                    </div>

                    <!-- Description rendered as rich text -->
                    <div v-if="event.description">
                        <p class="text-sm text-mun-gray-500 mb-2">Description</p>
                        <div class="bg-mun-gray-50 rounded-xl border border-mun-gray-100 p-4">
                            <RichTextContent v-if="isHtml(event.description)" :content="event.description" />
                            <p v-else class="text-sm text-mun-gray-700 whitespace-pre-line">{{ event.description }}</p>
                        </div>
                    </div>
                    <div v-else class="text-sm text-mun-gray-400 italic">No description set</div>
                </section>

                <!-- Stats -->
                <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Committees</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalCommittees || 0
                            }}</p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Participants</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalParticipants || 0
                            }}</p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Applications</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalApplications || 0
                            }}</p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Countries</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalCountries || 0 }}
                        </p>
                    </div>
                </section>

                <!-- Event Images -->
                <section v-if="canManage" class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Event Images</h2>

                    <!-- Hero background image -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">Hero Background Image</label>
                        <p class="text-xs text-mun-gray-400 mb-2">Background of the hero section on the public event
                            page, shown with a blue overlay.</p>
                        <div v-if="event.heroImage" class="relative rounded-xl overflow-hidden mb-2"
                            style="aspect-ratio: 16/5;">
                            <img :src="mediaUrl(event.heroImage)" alt="Hero background"
                                class="w-full h-full object-cover" />
                            <div
                                class="absolute inset-0 bg-gradient-to-br from-mun-blue-900/55 via-mun-blue-800/45 to-mun-blue-950/55 flex items-center justify-center">
                                <span class="text-white/60 text-sm font-medium">Hero preview</span>
                            </div>
                            <button @click="updateEventField('heroImage', null)"
                                class="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                        <ImageUploader v-if="!event.heroImage" :model-value="null"
                            @update:model-value="updateEventField('heroImage', $event)" />
                    </div>

                    <!-- Photo gallery -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">Event Photos</label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div v-for="(photo, i) in (event.photos || [])" :key="i"
                                class="relative group aspect-square rounded-xl overflow-hidden bg-mun-gray-100">
                                <img :src="mediaUrl(photo)" alt="" class="w-full h-full object-cover" />
                                <button @click="removePhoto(i)"
                                    class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <XMarkIcon class="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <ImageUploader :model-value="null" @update:model-value="addPhoto($event)" compact
                                size-classes="w-full aspect-square" />
                        </div>
                    </div>
                </section>

                <!-- Sponsors -->
                <section v-if="canManage" class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-mun-gray-900">Sponsors</h2>
                        <AppButton variant="ghost" size="sm" @click="showSponsorModal = true">
                            <PlusIcon class="w-4 h-4 mr-1" /> Add Sponsor
                        </AppButton>
                    </div>

                    <div v-if="!event.sponsors?.length" class="text-center py-6 text-sm text-mun-gray-400">
                        No sponsors added yet.
                    </div>

                    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div v-for="(sponsor, i) in event.sponsors" :key="i"
                            class="group relative flex flex-col items-center p-4 border border-mun-gray-200 rounded-xl hover:border-mun-gray-300 transition-colors">
                            <div v-if="sponsor.logo" class="w-16 h-16 rounded-lg overflow-hidden bg-mun-gray-50 mb-3">
                                <img :src="mediaUrl(sponsor.logo)" :alt="sponsor.name"
                                    class="w-full h-full object-contain" />
                            </div>
                            <div v-else
                                class="w-16 h-16 rounded-lg bg-mun-gray-100 flex items-center justify-center mb-3">
                                <BuildingOffice2Icon class="w-6 h-6 text-mun-gray-400" />
                            </div>
                            <p class="text-sm font-medium text-mun-gray-900 text-center">{{ sponsor.name }}</p>
                            <a v-if="sponsor.website" :href="sponsor.website" target="_blank"
                                class="text-xs text-mun-blue hover:underline mt-0.5 truncate max-w-full">
                                {{ sponsor.website.replace(/^https?:\/\//, '') }}
                            </a>
                            <button @click="removeSponsor(i)"
                                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <XMarkIcon class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </section>
            </template>

            <!-- ==================== EMBEDDED TABS ==================== -->
            <EventCommittees v-else-if="activeTab === 'committees'" :embedded="true" />
            <EventParticipants v-else-if="activeTab === 'participants'" :embedded="true" />
            <EventRegistration v-else-if="activeTab === 'registration'" :embedded="true" />
            <EventApplications v-else-if="activeTab === 'applications'" :embedded="true" />

            <!-- ==================== LIFECYCLE TAB ==================== -->
            <template v-else-if="activeTab === 'lifecycle'">
                <section class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                    <div>
                        <h2 class="text-lg font-semibold text-mun-gray-900">Event Lifecycle</h2>
                        <p class="text-sm text-mun-gray-500 mt-1">Move your event through each stage. You can advance to
                            the next step or go back one step.</p>
                    </div>

                    <!-- Visual pipeline -->
                    <div class="flex flex-col sm:flex-row items-stretch gap-0">
                        <div v-for="(stage, idx) in LIFECYCLE_STAGES" :key="stage.key" class="flex-1 relative">
                            <!-- Connector line -->
                            <div v-if="idx > 0"
                                class="hidden sm:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5"
                                :class="stageIndex(event.status) >= idx ? 'bg-mun-blue' : 'bg-mun-gray-200'"></div>

                            <button @click="handleStageClick(stage.key)" :disabled="!canMoveTo(stage.key)" :class="[
                                'w-full px-3 py-4 text-center border-2 transition-all relative',
                                idx === 0 ? 'rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none' : '',
                                idx === LIFECYCLE_STAGES.length - 1 ? 'rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none' : '',
                                event.status === stage.key
                                    ? 'border-mun-blue bg-mun-blue-50 ring-1 ring-mun-blue/30'
                                    : stageIndex(event.status) > idx
                                        ? 'border-mun-blue/30 bg-mun-blue-50/30'
                                        : 'border-mun-gray-200 bg-white',
                                canMoveTo(stage.key) && event.status !== stage.key
                                    ? 'hover:border-mun-blue-300 hover:bg-mun-blue-50/50 cursor-pointer'
                                    : event.status === stage.key ? 'cursor-default' : 'cursor-not-allowed opacity-50',
                            ]">
                                <div class="flex items-center justify-center mb-1.5">
                                    <span v-if="stageIndex(event.status) > idx"
                                        class="w-6 h-6 rounded-full bg-mun-blue text-white text-xs font-bold flex items-center justify-center">✓</span>
                                    <span v-else
                                        :class="['w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center', event.status === stage.key ? 'bg-mun-blue text-white' : 'bg-mun-gray-200 text-mun-gray-500']">
                                        {{ idx + 1 }}
                                    </span>
                                </div>
                                <p class="text-xs font-semibold"
                                    :class="event.status === stage.key ? 'text-mun-blue' : stageIndex(event.status) > idx ? 'text-mun-blue/70' : 'text-mun-gray-500'">
                                    {{ stage.label }}
                                </p>
                                <p class="text-[10px] mt-0.5 leading-tight"
                                    :class="event.status === stage.key ? 'text-mun-blue/70' : 'text-mun-gray-400'">
                                    {{ stage.hint }}
                                </p>
                                <div v-if="event.status === stage.key"
                                    class="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-mun-blue text-white text-[9px] font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
                                    Current
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Action hint -->
                    <div v-if="nextStatuses.length > 0" class="flex items-center gap-3 p-3 bg-mun-blue-50 rounded-xl">
                        <InformationCircleIcon class="w-5 h-5 text-mun-blue flex-shrink-0" />
                        <p class="text-sm text-mun-blue-700">
                            <template v-if="nextStatuses.length === 1">
                                Next step: click <strong>{{ stageLabelFor(nextStatuses[0]) }}</strong> above to advance.
                            </template>
                            <template v-else>
                                You can move to:
                                <strong v-for="(s, i) in nextStatuses" :key="s">{{ stageLabelFor(s) }}<template
                                        v-if="i < nextStatuses.length - 1">, </template></strong>
                            </template>
                        </p>
                    </div>
                    <div v-else-if="event.status === 'completed'"
                        class="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <CheckCircleIcon class="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p class="text-sm text-green-700">This event has been completed. No further status changes
                            available.</p>
                    </div>
                </section>
            </template>
        </template>

        <div v-else class="text-center py-12 text-mun-gray-500">Event not found.</div>

        <!-- ==================== EDIT MODAL ==================== -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="showEditModal" @close="showEditModal = false">
            <template #title>Edit Event</template>
            <template #default>
                <form @submit.prevent="handleEdit" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Event Name *</label>
                        <input v-model="editForm.name" type="text" required class="input-field"
                            placeholder="e.g. TASHKENT MUN 2026" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                        <RichTextEditor v-model="editForm.description" placeholder="Describe the event..." />
                        <p class="text-xs text-mun-gray-400 mt-1">Shown on the public event page. Supports rich text
                            formatting.</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Start Date *</label>
                            <input v-model="editForm.startDate" type="date" required class="input-field" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">End Date *</label>
                            <input v-model="editForm.endDate" type="date" required class="input-field" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Location</label>
                        <input v-model="editForm.location" type="text" class="input-field"
                            placeholder="e.g. Hilton Tashkent City" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Map Link</label>
                        <input v-model="editForm.mapUrl" type="url" class="input-field"
                            placeholder="https://maps.google.com/..." />
                        <p class="text-xs text-mun-gray-400 mt-1">Google Maps link shown on public event page</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Event Logo</label>
                        <ImageUploader v-model="editForm.logo" size-classes="w-14 h-14" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Timezone</label>
                        <SleekSelect v-model="editForm.timezone" :options="timezoneOptions"
                            placeholder="Select timezone" searchable size="md" container-class="w-full" />
                    </div>
                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" type="button" @click="showEditModal = false">Cancel</AppButton>
                        <AppButton type="submit" :disabled="isSaving">{{ isSaving ? 'Saving...' : 'Save' }}</AppButton>
                    </div>
                </form>
            </template>
        </ModalWrapper>

        <!-- ==================== SPONSOR MODAL ==================== -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="showSponsorModal" @close="showSponsorModal = false">
            <template #title>Add Sponsor</template>
            <template #default>
                <form @submit.prevent="addSponsor" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Sponsor Name *</label>
                        <input v-model="sponsorForm.name" type="text" required class="input-field"
                            placeholder="e.g. Coca-Cola Uzbekistan" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Website</label>
                        <input v-model="sponsorForm.website" type="url" class="input-field" placeholder="https://..." />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Logo</label>
                        <ImageUploader v-model="sponsorForm.logo" size-classes="w-14 h-14" compact />
                    </div>
                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" type="button" @click="showSponsorModal = false">Cancel</AppButton>
                        <AppButton type="submit">Add Sponsor</AppButton>
                    </div>
                </form>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    PencilIcon, ClipboardDocumentIcon, PlusIcon, XMarkIcon,
    BuildingOffice2Icon, ArrowTopRightOnSquareIcon,
    InformationCircleIcon, CheckCircleIcon
} from '@heroicons/vue/24/outline'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'
import SleekSelect from '@/components/ui/SleekSelect.vue'

import EventCommittees from '@/views/org/event/CommitteesView.vue'
import EventParticipants from '@/views/org/event/ParticipantsView.vue'
import EventRegistration from '@/views/org/event/RegistrationView.vue'
import EventApplications from '@/views/org/event/ApplicationsView.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const orgSlug = computed(() => route.params.orgSlug)
const eventSlug = computed(() => route.params.eventSlug)
const orgId = computed(() => authStore.activeOrganization?._id)
const canManage = computed(() => authStore.isOrgAdmin || authStore.hasOrgPermission('manage_event_content'))
const canChangeStatus = computed(() => authStore.isOrgAdmin || authStore.hasOrgPermission('manage_event_status'))

const isLoading = ref(true)
const isSaving = ref(false)
const event = ref(null)
const showEditModal = ref(false)
const showSponsorModal = ref(false)
const activeTab = ref('overview')
const copiedField = ref(null)

const editForm = reactive({ name: '', description: '', startDate: '', endDate: '', location: '', mapUrl: '', logo: '', timezone: 'UTC' })
const sponsorForm = reactive({ name: '', website: '', logo: null })

const tabs = computed(() => {
    const list = [
        { id: 'overview', label: 'Overview' },
        { id: 'committees', label: 'Committees' },
        { id: 'participants', label: 'Participants' },
        { id: 'registration', label: 'Registration' },
        { id: 'applications', label: 'Applications' },
    ]
    if (canChangeStatus.value) {
        list.push({ id: 'lifecycle', label: 'Lifecycle' })
    }
    return list
})

const timezoneOptions = [
    { label: 'UTC (GMT+0)', value: 'UTC' },
    { label: 'Tashkent (GMT+5)', value: 'Asia/Tashkent' },
    { label: 'Moscow (GMT+3)', value: 'Europe/Moscow' },
    { label: 'London (GMT+0/+1)', value: 'Europe/London' },
    { label: 'Berlin (GMT+1/+2)', value: 'Europe/Berlin' },
    { label: 'New York (GMT-5/-4)', value: 'America/New_York' },
    { label: 'Los Angeles (GMT-8/-7)', value: 'America/Los_Angeles' },
    { label: 'Dubai (GMT+4)', value: 'Asia/Dubai' },
    { label: 'Singapore (GMT+8)', value: 'Asia/Singapore' },
    { label: 'Tokyo (GMT+9)', value: 'Asia/Tokyo' },
    { label: 'Seoul (GMT+9)', value: 'Asia/Seoul' },
    { label: 'Istanbul (GMT+3)', value: 'Europe/Istanbul' },
    { label: 'Almaty (GMT+6)', value: 'Asia/Almaty' },
]

// ========== Status lifecycle ==========
const LIFECYCLE_STAGES = [
    { key: 'draft', label: 'Draft', hint: 'Setting up event' },
    { key: 'published', label: 'Published', hint: 'Visible, not yet open' },
    { key: 'registration_open', label: 'Registration Open', hint: 'Accepting applications' },
    { key: 'registration_closed', label: 'Reg. Closed', hint: 'Review applications' },
    { key: 'active', label: 'Active', hint: 'Event is live' },
    { key: 'completed', label: 'Completed', hint: 'Event finished' },
]

const stageIndex = (status) => LIFECYCLE_STAGES.findIndex(s => s.key === status)
const stageLabelFor = (status) => LIFECYCLE_STAGES.find(s => s.key === status)?.label || status

const STATUS_FLOW = {
    draft: ['published'],
    published: ['registration_open', 'draft'],
    registration_open: ['registration_closed', 'published'],
    registration_closed: ['active', 'registration_open'],
    active: ['completed', 'registration_open'],
    completed: [],
}

const nextStatuses = computed(() => STATUS_FLOW[event.value?.status] || [])
const canMoveTo = (targetStatus) => nextStatuses.value.includes(targetStatus)

const handleStageClick = async (targetStatus) => {
    if (!canMoveTo(targetStatus)) return
    const currentIdx = stageIndex(event.value.status)
    const targetIdx = stageIndex(targetStatus)
    if (targetIdx < currentIdx) {
        if (!confirm(`Move back to "${stageLabelFor(targetStatus)}"? This will revert the event status.`)) return
    }
    await changeStatus(targetStatus)
}

// ========== Helpers ==========
const eventPageUrl = computed(() => `${window.location.origin}/events/${orgSlug.value}/${eventSlug.value}`)
const isHtml = (text) => /<[a-z][\s\S]*>/i.test(text)

const mediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_URL || ''}${path}`
}

const copyLink = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t) }
    copiedField.value = 'link'; toast.success('Link copied!'); setTimeout(() => { copiedField.value = null }, 2000)
}

// ========== Data ==========
const loadEvent = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const res = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (res.data.success) { event.value = res.data.event }
    } catch (e) { console.error('Failed to load event:', e) }
    finally { isLoading.value = false }
}

const changeStatus = async (newStatus) => {
    try {
        await apiMethods.events.updateStatus(orgId.value, event.value._id, { status: newStatus })
        toast.success(`Event moved to ${stageLabelFor(newStatus)}`)
        await loadEvent()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update status') }
}

const handleEdit = async () => {
    isSaving.value = true
    try {
        const res = await apiMethods.events.update(orgId.value, event.value._id, editForm)
        if (res.data.success) {
            toast.success('Event updated')
            showEditModal.value = false
            if (res.data.event.slug !== eventSlug.value) {
                router.replace({ name: 'OrgEventDetail', params: { orgSlug: orgSlug.value, eventSlug: res.data.event.slug } })
            }
            await loadEvent()
        }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update event') }
    finally { isSaving.value = false }
}

// Quick-save a single field without full reload (preserves scroll + focus)
const updateEventField = async (field, value) => {
    try {
        const res = await apiMethods.events.update(orgId.value, event.value._id, { [field]: value })
        if (res.data.success) {
            if (res.data.event) { event.value = res.data.event } else { event.value[field] = value }
            toast.success('Updated')
        }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update') }
}

const addPhoto = async (url) => { if (!url) return; await updateEventField('photos', [...(event.value.photos || []), url]) }
const removePhoto = async (i) => { const p = [...(event.value.photos || [])]; p.splice(i, 1); await updateEventField('photos', p) }

const addSponsor = async () => {
    if (!sponsorForm.name.trim()) return
    const sponsors = [...(event.value.sponsors || []), { name: sponsorForm.name.trim(), website: sponsorForm.website.trim() || null, logo: sponsorForm.logo || null }]
    await updateEventField('sponsors', sponsors)
    showSponsorModal.value = false
    Object.assign(sponsorForm, { name: '', website: '', logo: null })
}
const removeSponsor = async (i) => { const s = [...(event.value.sponsors || [])]; s.splice(i, 1); await updateEventField('sponsors', s) }

watch(showEditModal, (v) => {
    if (v && event.value) {
        editForm.name = event.value.name
        editForm.description = event.value.description || ''
        editForm.startDate = event.value.startDate?.split('T')[0] || ''
        editForm.endDate = event.value.endDate?.split('T')[0] || ''
        editForm.location = event.value.location || ''
        editForm.mapUrl = event.value.mapUrl || ''
        editForm.logo = event.value.logo || ''
        editForm.timezone = event.value.timezone || 'UTC'
    }
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''
const formatStatus = (s) => s?.replace(/_/g, ' ') || ''
const statusBadgeClass = (status) => ({
    draft: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
    published: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
    registration_open: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
    registration_closed: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
    active: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-blue-100 text-mun-blue-700',
    completed: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
}[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600')

onMounted(() => loadEvent())
</script>