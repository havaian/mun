<template>
    <div class="p-6 lg:p-8 space-y-6">
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else-if="event">
            <!-- Header -->
            <div class="page-header p-6">
                <div>
                    <div class="flex items-center space-x-3 mb-1">
                        <router-link :to="{ name: 'OrgEvents' }"
                            class="text-sm text-mun-gray-400 hover:text-mun-gray-600">Events</router-link>
                        <span class="text-mun-gray-300">/</span>
                    </div>
                    <h1 class="text-2xl font-bold text-mun-gray-900">{{ event.name }}</h1>
                    <p v-if="event.description" class="text-sm text-mun-gray-500 mt-1">{{ event.description }}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span :class="statusClass(event.status)">{{ formatStatus(event.status) }}</span>
                    <AppButton v-if="canManage" variant="ghost" size="sm" @click="showEditModal = true">
                        <PencilIcon class="w-4 h-4 mr-1" /> Edit
                    </AppButton>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex items-center space-x-1 bg-white rounded-xl border border-mun-gray-200 p-1">
                <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === tab.id
                        ? 'bg-mun-blue text-white'
                        : 'text-mun-gray-600 hover:bg-mun-gray-50'
                ]">
                    {{ tab.label }}
                </button>
            </div>

            <!-- Tab content -->
            <template v-if="activeTab === 'overview'">
                <!-- Event page link -->
                <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
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
                            <button @click="copyToClipboard(eventPageUrl, 'Event page link')"
                                class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                                <ClipboardDocumentIcon class="w-4 h-4" />
                                {{ copiedField === 'Event page link' ? 'Copied!' : 'Copy' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats grid -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Committees</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalCommittees || 0
                            }}
                        </p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Participants</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalParticipants || 0
                            }}
                        </p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Applications</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalApplications || 0
                            }}
                        </p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                        <p class="text-sm font-medium text-mun-gray-500">Countries</p>
                        <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ event.statistics?.totalCountries || 0 }}
                        </p>
                    </div>
                </div>

                <!-- Event details -->
                <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Details</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div v-if="event.startDate">
                            <p class="text-mun-gray-500">Start Date</p>
                            <p class="font-medium text-mun-gray-900">{{ formatDate(event.startDate) }}</p>
                        </div>
                        <div v-if="event.endDate">
                            <p class="text-mun-gray-500">End Date</p>
                            <p class="font-medium text-mun-gray-900">{{ formatDate(event.endDate) }}</p>
                        </div>
                        <div v-if="event.location">
                            <p class="text-mun-gray-500">Location</p>
                            <p class="font-medium text-mun-gray-900">{{ event.location }}</p>
                        </div>
                        <div v-if="event.timezone">
                            <p class="text-mun-gray-500">Timezone</p>
                            <p class="font-medium text-mun-gray-900">{{ event.timezone }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Slug</p>
                            <p class="font-mono text-xs text-mun-gray-700">{{ event.slug }}</p>
                        </div>
                        <div v-if="event.logo">
                            <p class="text-mun-gray-500">Event Logo</p>
                            <img :src="event.logo" alt="Event logo"
                                class="mt-1 w-16 h-16 rounded-lg object-cover border border-mun-gray-200" />
                        </div>
                    </div>
                </div>

                <!-- Status change -->
                <div v-if="canChangeStatus && nextStatuses.length > 0"
                    class="bg-white rounded-xl border border-mun-gray-200 p-6">
                    <h2 class="text-lg font-semibold text-mun-gray-900 mb-3">Status Management</h2>
                    <p class="text-xs text-mun-gray-400 mb-4">Current status: <span class="font-medium">{{
                            formatStatus(event.status) }}</span></p>
                    <div class="flex flex-wrap gap-2">
                        <AppButton v-for="s in nextStatuses" :key="s" variant="ghost" size="sm"
                            @click="changeStatus(s)">
                            → {{ formatStatus(s) }}
                        </AppButton>
                    </div>
                </div>
            </template>

            <EventCommittees v-else-if="activeTab === 'committees'" :embedded="true" />
            <EventParticipants v-else-if="activeTab === 'participants'" :embedded="true" />
            <EventRegistration v-else-if="activeTab === 'registration'" :embedded="true" />
            <EventApplications v-else-if="activeTab === 'applications'" :embedded="true" />
        </template>

        <div v-else class="text-center py-12 text-mun-gray-500">Event not found.</div>

        <!-- Edit Modal -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="showEditModal" @close="showEditModal = false">
            <template #title>Edit Event</template>
            <template #default>
                <form @submit.prevent="handleEdit" class="space-y-5">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Event Name *</label>
                        <input v-model="editForm.name" type="text" required class="input-field"
                            placeholder="e.g. TASHKENT MUN 2026" />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                        <textarea v-model="editForm.description" rows="3" class="input-field"
                            placeholder="Describe the event, its goals, and what participants can expect..."></textarea>
                        <p class="text-xs text-mun-gray-400 mt-1">Shown on the public event page</p>
                    </div>

                    <!-- Dates -->
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

                    <!-- Location -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Location</label>
                        <input v-model="editForm.location" type="text" class="input-field"
                            placeholder="e.g. Hilton Tashkent City, Uzbekistan" />
                    </div>

                    <!-- Logo URL -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Event Logo URL</label>
                        <input v-model="editForm.logo" type="url" class="input-field"
                            placeholder="https://example.com/logo.png" />
                        <p class="text-xs text-mun-gray-400 mt-1">Direct link to the event logo image</p>
                        <!-- Logo preview -->
                        <div v-if="editForm.logo" class="mt-2 flex items-center gap-3">
                            <img :src="editForm.logo" alt="Logo preview"
                                class="w-12 h-12 rounded-lg object-cover border border-mun-gray-200"
                                @error="editForm.logo = ''" />
                            <button type="button" @click="editForm.logo = ''"
                                class="text-xs text-red-500 hover:text-red-700">Remove</button>
                        </div>
                    </div>

                    <!-- Timezone -->
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
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { PencilIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'

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
const activeTab = ref('overview')
const copiedField = ref(null)

const editForm = reactive({ name: '', description: '', startDate: '', endDate: '', location: '', logo: '', timezone: 'UTC' })

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

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'committees', label: 'Committees' },
    { id: 'participants', label: 'Participants' },
    { id: 'registration', label: 'Registration' },
    { id: 'applications', label: 'Applications' },
]

// Flexible status flow — everything reversible except completed
const STATUS_FLOW = {
    draft: ['published'],
    published: ['registration_open', 'draft'],
    registration_open: ['registration_closed', 'published'],
    registration_closed: ['active', 'registration_open'],
    active: ['completed', 'registration_open'],
    completed: [],
}

const nextStatuses = computed(() => STATUS_FLOW[event.value?.status] || [])

// Public URLs
const baseUrl = computed(() => window.location.origin)
const eventPageUrl = computed(() => `${baseUrl.value}/events/${orgSlug.value}/${eventSlug.value}`)

const copyToClipboard = async (text, label) => {
    try {
        await navigator.clipboard.writeText(text)
        copiedField.value = label
        toast.success(`${label} copied!`)
        setTimeout(() => { copiedField.value = null }, 2000)
    } catch {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        copiedField.value = label
        toast.success(`${label} copied!`)
        setTimeout(() => { copiedField.value = null }, 2000)
    }
}

const loadEvent = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const res = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (res.data.success) {
            event.value = res.data.event
        }
    } catch (e) {
        console.error('Failed to load event:', e)
    } finally {
        isLoading.value = false
    }
}

const changeStatus = async (newStatus) => {
    try {
        await apiMethods.events.updateStatus(orgId.value, event.value._id, { status: newStatus })
        toast.success(`Event moved to ${formatStatus(newStatus)}`)
        await loadEvent()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to update status')
    }
}

const handleEdit = async () => {
    isSaving.value = true
    try {
        const res = await apiMethods.events.update(orgId.value, event.value._id, editForm)
        if (res.data.success) {
            toast.success('Event updated')
            showEditModal.value = false
            // If slug changed, redirect
            if (res.data.event.slug !== eventSlug.value) {
                router.replace({ name: 'OrgEventDetail', params: { orgSlug: orgSlug.value, eventSlug: res.data.event.slug } })
            }
            await loadEvent()
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to update event')
    } finally {
        isSaving.value = false
    }
}

watch(showEditModal, (v) => {
    if (v && event.value) {
        editForm.name = event.value.name
        editForm.description = event.value.description || ''
        editForm.startDate = event.value.startDate?.split('T')[0] || ''
        editForm.endDate = event.value.endDate?.split('T')[0] || ''
        editForm.location = event.value.location || ''
        editForm.logo = event.value.logo || ''
        editForm.timezone = event.value.timezone || 'UTC'
    }
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''
const formatStatus = (s) => s?.replace(/_/g, ' ') || ''
const statusClass = (status) => {
    const m = {
        draft: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
        published: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
        registration_open: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
        registration_closed: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
        active: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-blue-100 text-mun-blue-700',
        completed: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
    }
    return m[status] || m.draft
}

onMounted(() => loadEvent())
</script>