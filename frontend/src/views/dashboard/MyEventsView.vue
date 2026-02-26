<template>
    <div class="p-6 lg:p-8 space-y-6">
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">My Events</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Events you're assigned to as presidium, delegate, or other
                    role.</p>
            </div>
        </div>

        <!-- Filter tabs -->
        <div v-if="eventParticipations.length > 0"
            class="flex space-x-1 bg-white rounded-xl border border-mun-gray-200 p-1 w-fit">
            <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key" :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeFilter === f.key ? 'bg-mun-blue text-white' : 'text-mun-gray-600 hover:bg-mun-gray-50']">
                {{ f.label }} ({{ f.count }})
            </button>
        </div>

        <!-- Event cards -->
        <div v-if="filteredEvents.length > 0" class="space-y-3">
            <div v-for="ep in filteredEvents" :key="ep._id"
                class="bg-white rounded-xl border border-mun-gray-200 p-5 hover:border-mun-gray-300 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-4 min-w-0 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-mun-blue-50 flex items-center justify-center flex-shrink-0">
                            <CalendarDaysIcon class="w-6 h-6 text-mun-blue" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-base font-semibold text-mun-gray-900 truncate">{{ ep.event?.name }}</h3>
                            <p class="text-sm text-mun-gray-500 mt-0.5">{{ ep.event?.organization?.name }}</p>

                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                <!-- Role badge -->
                                <span :class="roleBadgeClass(ep.role)">{{ formatRole(ep.role) }}</span>
                                <!-- Committee -->
                                <span v-if="ep.committee"
                                    class="px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600">
                                    {{ ep.committee.acronym || ep.committee.name }}
                                </span>
                                <!-- Country -->
                                <span v-if="ep.country?.name"
                                    class="px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600">
                                    {{ ep.country.name }}
                                </span>
                                <!-- Event status -->
                                <span :class="eventStatusClass(ep.event?.status)">
                                    {{ formatEventStatus(ep.event?.status) }}
                                </span>
                            </div>

                            <!-- Dates -->
                            <div class="flex items-center gap-4 mt-2 text-xs text-mun-gray-400">
                                <span v-if="ep.event?.startDate">
                                    Start: {{ formatDate(ep.event.startDate) }}
                                </span>
                                <span v-if="ep.event?.endDate">
                                    End: {{ formatDate(ep.event.endDate) }}
                                </span>
                                <span>
                                    Joined: {{ formatDate(ep.createdAt) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <router-link :to="getEventLink(ep)"
                        class="px-4 py-2 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors flex-shrink-0 ml-4">
                        Open →
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
            <CalendarDaysIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
            <h3 class="text-lg font-semibold text-mun-gray-900">No events yet</h3>
            <p class="text-sm text-mun-gray-500 mt-1">
                You haven't been assigned to any events. Register through an event's public page or ask an organizer to
                add you.
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const PRESIDIUM_ROLES = ['presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary']

const activeFilter = ref('all')

const eventParticipations = computed(() => authStore.eventParticipations || [])

const filters = computed(() => {
    const all = eventParticipations.value
    const active = all.filter(ep => !['completed'].includes(ep.event?.status))
    const completed = all.filter(ep => ep.event?.status === 'completed')
    return [
        { key: 'all', label: 'All', count: all.length },
        { key: 'active', label: 'Active', count: active.length },
        { key: 'completed', label: 'Completed', count: completed.length },
    ]
})

const filteredEvents = computed(() => {
    const all = eventParticipations.value
    if (activeFilter.value === 'active') return all.filter(ep => !['completed'].includes(ep.event?.status))
    if (activeFilter.value === 'completed') return all.filter(ep => ep.event?.status === 'completed')
    return all
})

const formatRole = (role) => ({
    presidium_chair: 'Chair', presidium_cochair: 'Co-Chair',
    presidium_expert: 'Expert', presidium_secretary: 'Secretary',
    delegate: 'Delegate', observer: 'Observer', expert: 'Expert',
}[role] || role)

const roleBadgeClass = (role) => {
    if (PRESIDIUM_ROLES.includes(role)) return 'px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700'
    if (role === 'delegate') return 'px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700'
    return 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600'
}

const eventStatusClass = (status) => ({
    draft: 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500',
    published: 'px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700',
    registration_open: 'px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700',
    registration_closed: 'px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
    active: 'px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700',
    completed: 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500',
}[status] || 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500')

const formatEventStatus = (status) => status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getEventLink = (ep) => {
    const orgSlug = ep.event?.organization?.slug
    const eventSlug = ep.event?.slug
    const isOrgMember = authStore.allOrganizations?.some(org => org.slug === orgSlug)

    if (isOrgMember && orgSlug && eventSlug) {
        return { name: 'OrgEventDetail', params: { orgSlug, eventSlug } }
    }
    if (ep.committee?._id) {
        if (PRESIDIUM_ROLES.includes(ep.role)) {
            return { name: 'PresidiumDashboard', params: { committeeId: ep.committee._id } }
        }
        return { name: 'DelegateDashboard', params: { committeeId: ep.committee._id } }
    }
    return { name: 'DashboardEvents' }
}
</script>