<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Welcome header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">
                    Welcome back, {{ authStore.user?.firstName || 'User' }}
                </h1>
                <p class="text-sm text-mun-gray-500 mt-1">Here's your overview across events and organizations.</p>
            </div>
        </div>

        <!-- Quick stats row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                <p class="text-sm font-medium text-mun-gray-500">Organizations</p>
                <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ authStore.allOrganizations?.length || 0 }}</p>
            </div>
            <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                <p class="text-sm font-medium text-mun-gray-500">Event Roles</p>
                <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ authStore.eventParticipations?.length || 0 }}
                </p>
            </div>
            <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                <p class="text-sm font-medium text-mun-gray-500">Pending Invitations</p>
                <p class="text-2xl font-bold text-mun-gray-900 mt-1">{{ authStore.pendingInvitations?.length || 0 }}</p>
            </div>
            <div class="bg-white rounded-xl border border-mun-gray-200 p-5">
                <p class="text-sm font-medium text-mun-gray-500">Account Status</p>
                <p class="text-2xl font-bold text-green-600 mt-1">Active</p>
            </div>
        </div>

        <!-- Upcoming events -->
        <section v-if="upcomingEvents.length > 0"
            class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-mun-gray-100 flex items-center justify-between">
                <div>
                    <h2 class="text-base font-semibold text-mun-gray-900">Upcoming Events</h2>
                    <p class="text-sm text-mun-gray-500 mt-0.5">Events you're participating in that haven't started yet.
                    </p>
                </div>
                <router-link :to="{ name: 'DashboardEvents' }"
                    class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                    View all →
                </router-link>
            </div>
            <div class="divide-y divide-mun-gray-100">
                <div v-for="ep in upcomingEvents" :key="ep._id"
                    class="px-6 py-4 flex items-center justify-between hover:bg-mun-gray-50/50 transition-colors">
                    <div class="flex items-center space-x-4 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-mun-blue-50 flex items-center justify-center flex-shrink-0">
                            <CalendarDaysIcon class="w-5 h-5 text-mun-blue" />
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-mun-gray-900 truncate">{{ ep.event?.name }}</p>
                            <div class="flex items-center space-x-2 mt-0.5">
                                <span class="text-xs text-mun-gray-500">{{ ep.event?.organization?.name }}</span>
                                <span class="text-mun-gray-300">·</span>
                                <span :class="roleBadgeClass(ep.role)">{{ formatRole(ep.role) }}</span>
                                <template v-if="ep.committee">
                                    <span class="text-mun-gray-300">·</span>
                                    <span class="text-xs text-mun-gray-500">{{ ep.committee?.name }}</span>
                                </template>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3 flex-shrink-0">
                        <span v-if="ep.event?.startDate" class="text-xs text-mun-gray-400">
                            {{ formatDate(ep.event.startDate) }}
                        </span>
                        <router-link :to="getEventLink(ep)"
                            class="px-3 py-1.5 text-xs font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                            Open
                        </router-link>
                    </div>
                </div>
            </div>
        </section>

        <!-- Organizations -->
        <section v-if="authStore.allOrganizations?.length > 0"
            class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-mun-gray-100 flex items-center justify-between">
                <div>
                    <h2 class="text-base font-semibold text-mun-gray-900">My Organizations</h2>
                    <p class="text-sm text-mun-gray-500 mt-0.5">Organizations you manage or are a member of.</p>
                </div>
                <router-link :to="{ name: 'DashboardOrganizations' }"
                    class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                    View all →
                </router-link>
            </div>
            <div class="divide-y divide-mun-gray-100">
                <router-link v-for="org in authStore.allOrganizations.slice(0, 5)" :key="org._id"
                    :to="{ name: 'OrgDashboard', params: { orgSlug: org.slug } }"
                    class="px-6 py-4 flex items-center justify-between hover:bg-mun-gray-50/50 transition-colors">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-9 h-9 rounded-lg bg-mun-gray-100 flex items-center justify-center flex-shrink-0">
                            <BuildingOffice2Icon class="w-5 h-5 text-mun-gray-400" />
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-mun-gray-900 truncate">{{ org.name }}</p>
                            <span :class="[
                                'text-xs font-medium',
                                org.accessLevel === 'admin' ? 'text-mun-blue' : 'text-mun-gray-500'
                            ]">{{ org.accessLevel === 'admin' ? 'Admin' : 'Member' }}</span>
                        </div>
                    </div>
                    <ChevronRightIcon class="w-4 h-4 text-mun-gray-300 flex-shrink-0" />
                </router-link>
            </div>
        </section>

        <!-- Pending invitations -->
        <section v-if="authStore.pendingInvitations?.length > 0"
            class="bg-white rounded-xl border border-amber-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-amber-100 bg-amber-50/50">
                <h2 class="text-base font-semibold text-amber-900">Pending Invitations</h2>
                <p class="text-sm text-amber-700 mt-0.5">You've been invited to join these organizations.</p>
            </div>
            <div class="divide-y divide-mun-gray-100">
                <div v-for="inv in authStore.pendingInvitations" :key="inv._id"
                    class="px-6 py-4 flex items-center justify-between">
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-mun-gray-900">{{ inv.organization?.name }}</p>
                        <p class="text-xs text-mun-gray-500 mt-0.5">Invited by {{ inv.invitedBy?.firstName }} {{
                            inv.invitedBy?.lastName }}</p>
                    </div>
                    <router-link :to="{ name: 'AcceptInvitation', params: { token: inv.token } }"
                        class="px-3 py-1.5 text-xs font-medium text-white bg-mun-blue rounded-lg hover:bg-mun-blue-700 transition-colors flex-shrink-0">
                        View Invitation
                    </router-link>
                </div>
            </div>
        </section>

        <!-- Empty state — no events, no orgs -->
        <section
            v-if="!authStore.allOrganizations?.length && !authStore.eventParticipations?.length && !authStore.pendingInvitations?.length"
            class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
            <div class="w-16 h-16 rounded-2xl bg-mun-blue-50 flex items-center justify-center mx-auto mb-4">
                <CalendarDaysIcon class="w-8 h-8 text-mun-blue-300" />
            </div>
            <h3 class="text-lg font-semibold text-mun-gray-900">Welcome to MUN.UZ</h3>
            <p class="text-sm text-mun-gray-500 mt-2 max-w-md mx-auto">
                You're not part of any organization or event yet. Ask an organizer to invite you, or register for an
                event
                through its public registration page.
            </p>
        </section>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { CalendarDaysIcon, BuildingOffice2Icon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const PRESIDIUM_ROLES = ['presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary']

const upcomingEvents = computed(() => {
    return (authStore.eventParticipations || []).filter(ep => {
        if (!ep.event) return false
        const status = ep.event.status
        // Show events that haven't completed
        return status !== 'completed'
    }).slice(0, 5)
})

const formatRole = (role) => {
    const map = {
        presidium_chair: 'Chair',
        presidium_cochair: 'Co-Chair',
        presidium_expert: 'Expert',
        presidium_secretary: 'Secretary',
        delegate: 'Delegate',
        observer: 'Observer',
        expert: 'Expert',
    }
    return map[role] || role
}

const roleBadgeClass = (role) => {
    if (PRESIDIUM_ROLES.includes(role)) return 'px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700'
    if (role === 'delegate') return 'px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700'
    return 'px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-mun-gray-100 text-mun-gray-600'
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getEventLink = (ep) => {
    const orgSlug = ep.event?.organization?.slug
    const eventSlug = ep.event?.slug
    const isOrgMember = authStore.allOrganizations?.some(org => org.slug === orgSlug)

    if (isOrgMember && orgSlug && eventSlug) {
        // Org member → go to org-scoped event
        return { name: 'OrgEventDetail', params: { orgSlug, eventSlug } }
    }

    // Non-org participant → go to session route
    if (ep.committee?._id) {
        if (PRESIDIUM_ROLES.includes(ep.role)) {
            return { name: 'PresidiumDashboard', params: { committeeId: ep.committee._id } }
        }
        return { name: 'DelegateDashboard', params: { committeeId: ep.committee._id } }
    }

    // Fallback
    return { name: 'DashboardEvents' }
}
</script>