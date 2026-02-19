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
                        <div>
                            <p class="text-mun-gray-500">Slug</p>
                            <p class="font-mono text-xs text-mun-gray-700">{{ event.slug }}</p>
                        </div>
                    </div>
                </div>

                <!-- Status change -->
                <div v-if="canManage" class="bg-white rounded-xl border border-mun-gray-200 p-6">
                    <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Status Management</h2>
                    <div class="flex flex-wrap gap-2">
                        <AppButton v-for="s in nextStatuses" :key="s" variant="ghost" size="sm"
                            @click="changeStatus(s)">
                            Move to {{ formatStatus(s) }}
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
                <form @submit.prevent="handleEdit" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Name</label>
                        <input v-model="editForm.name" type="text" required class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                        <textarea v-model="editForm.description" rows="3" class="input-field"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Start Date</label>
                            <input v-model="editForm.startDate" type="date" class="input-field" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">End Date</label>
                            <input v-model="editForm.endDate" type="date" class="input-field" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Location</label>
                        <input v-model="editForm.location" type="text" class="input-field" />
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
import { PencilIcon } from '@heroicons/vue/24/outline'

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

const isLoading = ref(true)
const isSaving = ref(false)
const event = ref(null)
const showEditModal = ref(false)
const activeTab = ref('overview')

const editForm = reactive({ name: '', description: '', startDate: '', endDate: '', location: '' })

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'committees', label: 'Committees' },
    { id: 'participants', label: 'Participants' },
    { id: 'registration', label: 'Registration' },
    { id: 'applications', label: 'Applications' },
]

const STATUS_FLOW = {
    draft: ['published'],
    published: ['registration_open', 'draft'],
    registration_open: ['registration_closed'],
    registration_closed: ['active', 'registration_open'],
    active: ['completed'],
    completed: [],
}

const nextStatuses = computed(() => STATUS_FLOW[event.value?.status] || [])

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