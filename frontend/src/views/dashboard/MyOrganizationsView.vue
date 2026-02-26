<template>
    <div class="p-6 lg:p-8 space-y-6">
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">My Organizations</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Organizations you manage or are a member of.</p>
            </div>
        </div>

        <!-- Org cards -->
        <div v-if="allOrgs.length > 0" class="space-y-3">
            <div v-for="org in allOrgs" :key="org._id"
                class="bg-white rounded-xl border border-mun-gray-200 p-5 hover:border-mun-gray-300 transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 min-w-0 flex-1">
                        <div v-if="org.logo" class="w-12 h-12 rounded-xl overflow-hidden bg-mun-gray-50 flex-shrink-0">
                            <img :src="mediaUrl(org.logo)" :alt="org.name" class="w-full h-full object-cover" />
                        </div>
                        <div v-else
                            class="w-12 h-12 rounded-xl bg-mun-gray-100 flex items-center justify-center flex-shrink-0">
                            <BuildingOffice2Icon class="w-6 h-6 text-mun-gray-400" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-base font-semibold text-mun-gray-900 truncate">{{ org.name }}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span :class="[
                                    'px-2 py-0.5 text-xs font-medium rounded-full',
                                    org.accessLevel === 'admin' ? 'bg-mun-blue-100 text-mun-blue' : 'bg-mun-gray-100 text-mun-gray-600'
                                ]">
                                    {{ org.accessLevel === 'admin' ? 'Admin' : 'Member' }}
                                </span>
                                <span v-if="org.permissions?.length" class="text-xs text-mun-gray-400">
                                    {{ org.permissions.length }} permission{{ org.permissions.length !== 1 ? 's' : '' }}
                                </span>
                            </div>
                            <!-- Permission chips for members -->
                            <div v-if="org.accessLevel === 'member' && org.permissions?.length"
                                class="flex flex-wrap gap-1 mt-2">
                                <span v-for="perm in org.permissions" :key="perm"
                                    class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-mun-gray-50 text-mun-gray-500">
                                    {{ formatPermission(perm) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <router-link :to="{ name: 'OrgDashboard', params: { orgSlug: org.slug } }"
                        class="px-4 py-2 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors flex-shrink-0 ml-4">
                        Open Dashboard →
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Pending invitations -->
        <section v-if="authStore.pendingInvitations?.length > 0">
            <h2 class="text-base font-semibold text-mun-gray-900 mb-3">Pending Invitations</h2>
            <div class="space-y-3">
                <div v-for="inv in authStore.pendingInvitations" :key="inv._id"
                    class="bg-white rounded-xl border border-amber-200 p-5 flex items-center justify-between">
                    <div class="min-w-0">
                        <h3 class="text-base font-semibold text-mun-gray-900">{{ inv.organization?.name }}</h3>
                        <p class="text-sm text-mun-gray-500 mt-0.5">
                            Invited by {{ inv.invitedBy?.firstName }} {{ inv.invitedBy?.lastName }}
                        </p>
                    </div>
                    <router-link :to="{ name: 'AcceptInvitation', params: { token: inv.token } }"
                        class="px-4 py-2 text-sm font-medium text-white bg-mun-blue rounded-lg hover:bg-mun-blue-700 transition-colors flex-shrink-0 ml-4">
                        View Invitation
                    </router-link>
                </div>
            </div>
        </section>

        <!-- Empty state -->
        <div v-if="allOrgs.length === 0 && !authStore.pendingInvitations?.length"
            class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
            <BuildingOffice2Icon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
            <h3 class="text-lg font-semibold text-mun-gray-900">No organizations yet</h3>
            <p class="text-sm text-mun-gray-500 mt-1">
                You're not a member of any organization. Ask an admin to invite you.
            </p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { BuildingOffice2Icon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const allOrgs = computed(() => authStore.allOrganizations || [])

const mediaUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}/media/${path}`
}

const formatPermission = (perm) => perm?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || perm
</script>