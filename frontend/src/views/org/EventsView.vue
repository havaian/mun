<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Events</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage your organization's events</p>
            </div>
            <AppButton v-if="authStore.isOrgAdmin || authStore.hasOrgPermission('manage_event_content')"
                @click="showCreateModal = true">
                <PlusIcon class="w-4 h-4 mr-2" />
                New Event
            </AppButton>
        </div>

        <!-- Filter -->
        <div class="flex items-center space-x-3">
            <button v-for="filter in statusFilters" :key="filter.value" @click="activeFilter = filter.value" :class="[
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                activeFilter === filter.value
                    ? 'bg-mun-blue text-white'
                    : 'bg-white text-mun-gray-600 border border-mun-gray-200 hover:bg-mun-gray-50'
            ]">
                {{ filter.label }}
            </button>
        </div>

        <!-- Events list -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <div v-else-if="filteredEvents.length === 0"
            class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
            <CalendarDaysIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
            <p class="text-mun-gray-500">{{ activeFilter === 'all' ? 'No events yet.' : 'No events with this status.' }}
            </p>
        </div>

        <div v-else class="grid gap-4">
            <router-link v-for="event in filteredEvents" :key="event._id"
                :to="{ name: 'OrgEventDetail', params: { orgSlug, eventSlug: event.slug } }"
                class="bg-white rounded-xl border border-mun-gray-200 p-5 hover:border-mun-blue-200 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <h3 class="text-base font-semibold text-mun-gray-900">{{ event.name }}</h3>
                        <p v-if="event.description" class="text-sm text-mun-gray-500 line-clamp-2">{{ event.description
                            }}</p>
                        <div class="flex items-center space-x-4 text-xs text-mun-gray-400 pt-1">
                            <span v-if="event.startDate">{{ formatDate(event.startDate) }}</span>
                            <span v-if="event.statistics?.totalCommittees">{{ event.statistics.totalCommittees }}
                                committees</span>
                            <span v-if="event.statistics?.totalParticipants">{{ event.statistics.totalParticipants }}
                                participants</span>
                        </div>
                    </div>
                    <span :class="statusClass(event.status)">{{ formatStatus(event.status) }}</span>
                </div>
            </router-link>
        </div>

        <!-- Create Modal -->
        <ModalWrapper :modelValue="showCreateModal" @close="showCreateModal = false">
            <template #title>Create Event</template>
            <template #default>
                <form @submit.prevent="handleCreate" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Event Name</label>
                        <input v-model="formData.name" type="text" required class="input-field"
                            placeholder="e.g. TASHKENT MUN 2026" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                        <textarea v-model="formData.description" rows="3" class="input-field"
                            placeholder="Brief event description"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Start Date</label>
                            <input v-model="formData.startDate" type="date" required class="input-field" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">End Date</label>
                            <input v-model="formData.endDate" type="date" class="input-field" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Location</label>
                        <input v-model="formData.location" type="text" class="input-field"
                            placeholder="Venue or city" />
                    </div>
                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" type="button" @click="showCreateModal = false">Cancel</AppButton>
                        <AppButton type="submit" :disabled="isSaving">
                            {{ isSaving ? 'Creating...' : 'Create Event' }}
                        </AppButton>
                    </div>
                </form>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { PlusIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const orgSlug = computed(() => route.params.orgSlug)
const orgId = computed(() => authStore.activeOrganization?._id)

const isLoading = ref(true)
const isSaving = ref(false)
const events = ref([])
const showCreateModal = ref(false)
const activeFilter = ref('all')

const formData = reactive({ name: '', description: '', startDate: '', endDate: '', location: '' })

const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
]

const filteredEvents = computed(() => {
    if (activeFilter.value === 'all') return events.value
    if (activeFilter.value === 'active') {
        return events.value.filter(e => ['published', 'registration_open', 'registration_closed', 'active'].includes(e.status))
    }
    return events.value.filter(e => e.status === activeFilter.value)
})

const loadEvents = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const res = await apiMethods.events.getAll(orgId.value, { limit: 50, sort: '-startDate' })
        if (res.data.success) {
            events.value = res.data.events || []
        }
    } catch (e) {
        console.error('Failed to load events:', e)
    } finally {
        isLoading.value = false
    }
}

const handleCreate = async () => {
    isSaving.value = true
    try {
        const res = await apiMethods.events.create(orgId.value, formData)
        if (res.data.success) {
            toast.success('Event created')
            showCreateModal.value = false
            Object.assign(formData, { name: '', description: '', startDate: '', endDate: '', location: '' })
            router.push({ name: 'OrgEventDetail', params: { orgSlug: orgSlug.value, eventSlug: res.data.event.slug } })
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to create event')
    } finally {
        isSaving.value = false
    }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
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

onMounted(() => loadEvents())
</script>