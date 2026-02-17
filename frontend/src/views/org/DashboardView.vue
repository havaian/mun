<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">{{ org?.name || 'Organization' }}</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Organization dashboard</p>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else>
            <!-- Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                    <p class="text-sm font-medium text-mun-gray-500">Events</p>
                    <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ events.length }}</p>
                </div>
                <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                    <p class="text-sm font-medium text-mun-gray-500">Active Events</p>
                    <p class="text-2xl font-bold text-mun-blue mt-1">{{ activeEventCount }}</p>
                </div>
                <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                    <p class="text-sm font-medium text-mun-gray-500">Members</p>
                    <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ memberCount }}</p>
                </div>
                <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                    <p class="text-sm font-medium text-mun-gray-500">Pending Invitations</p>
                    <p class="text-2xl font-bold text-mun-yellow-600 mt-1">{{ invitationCount }}</p>
                </div>
            </div>

            <!-- Recent Events -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Events</h2>
                    <router-link :to="{ name: 'OrgEvents' }"
                        class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                        View all
                    </router-link>
                </div>

                <div v-if="events.length === 0" class="text-center py-8 text-mun-gray-500">
                    No events yet. Create your first event to get started.
                </div>

                <div v-else class="divide-y divide-mun-gray-100">
                    <router-link v-for="event in events.slice(0, 5)" :key="event._id"
                        :to="{ name: 'OrgEventDetail', params: { orgSlug, eventSlug: event.slug } }"
                        class="flex items-center justify-between py-3 hover:bg-mun-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-900">{{ event.name }}</p>
                            <p class="text-xs text-mun-gray-500">
                                {{ formatDate(event.startDate) }}
                                <span v-if="event.endDate"> — {{ formatDate(event.endDate) }}</span>
                            </p>
                        </div>
                        <span :class="statusClass(event.status)">{{ event.status }}</span>
                    </router-link>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'

const route = useRoute()
const authStore = useAuthStore()

const orgSlug = computed(() => route.params.orgSlug)
const org = computed(() => authStore.activeOrganization)

const isLoading = ref(true)
const events = ref([])
const memberCount = ref(0)
const invitationCount = ref(0)

const activeEventCount = computed(() =>
    events.value.filter(e => ['active', 'registration_open', 'published'].includes(e.status)).length
)

const loadDashboard = async () => {
    if (!org.value?._id) return

    isLoading.value = true
    try {
        const [eventsRes, membersRes] = await Promise.all([
            apiMethods.events.getAll(org.value._id, { limit: 10, sort: '-startDate' }),
            apiMethods.orgMembers.getAll(org.value._id, { limit: 1 }).catch(() => null),
        ])

        if (eventsRes.data.success) {
            events.value = eventsRes.data.events || []
        }

        if (membersRes?.data?.success) {
            memberCount.value = membersRes.data.pagination?.total || 0
        }

        // Try invitations
        try {
            const invRes = await apiMethods.orgMembers.getInvitations(org.value._id)
            if (invRes.data.success) {
                invitationCount.value = (invRes.data.invitations || []).length
            }
        } catch (e) { /* non-fatal */ }

    } catch (e) {
        console.error('Failed to load dashboard:', e)
    } finally {
        isLoading.value = false
    }
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusClass = (status) => {
    const map = {
        draft: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
        published: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
        registration_open: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
        registration_closed: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
        active: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-blue-100 text-mun-blue-700',
        completed: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
    }
    return map[status] || map.draft
}

onMounted(() => loadDashboard())
</script>