<template>
    <div class="min-h-screen bg-gradient-mun flex items-center justify-center p-6">
        <div class="max-w-lg w-full space-y-6">
            <!-- Welcome card -->
            <div class="bg-white rounded-2xl border border-mun-gray-200 p-8 text-center">
                <div class="w-16 h-16 bg-mun-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                    <img src="/logo.svg" alt="" class="w-12 h-12">
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Welcome, {{ authStore.displayName }}</h1>
                <p class="text-sm text-mun-gray-500 mt-2">Choose where you'd like to go</p>
            </div>

            <!-- Organizations -->
            <div v-if="authStore.allOrganizations.length > 0" class="space-y-3">
                <h2 class="text-sm font-semibold text-mun-gray-500 uppercase tracking-wider px-1">
                    Your Organizations
                </h2>
                <router-link v-for="org in authStore.allOrganizations" :key="org._id"
                    :to="{ name: 'OrgDashboard', params: { orgSlug: org.slug } }"
                    class="flex items-center space-x-4 bg-white rounded-xl border border-mun-gray-200 p-4 hover:border-mun-blue-200 transition-colors">
                    <div class="w-12 h-12 bg-mun-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span class="text-lg font-bold text-mun-blue">{{ org.name?.charAt(0) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-mun-gray-900 truncate">{{ org.name }}</p>
                        <p class="text-xs text-mun-gray-500">{{ org.accessLevel === 'admin' ? 'Admin' : 'Member' }}</p>
                    </div>
                    <ChevronRightIcon class="w-5 h-5 text-mun-gray-400" />
                </router-link>
            </div>

            <!-- SuperAdmin link -->
            <router-link v-if="authStore.isSuperAdmin" :to="{ name: 'SuperAdminDashboard' }"
                class="flex items-center space-x-4 bg-white rounded-xl border border-mun-gray-200 p-4 hover:border-mun-blue-200 transition-colors">
                <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon class="w-6 h-6 text-red-600" />
                </div>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-mun-gray-900">Platform Administration</p>
                    <p class="text-xs text-mun-gray-500">SuperAdmin panel</p>
                </div>
                <ChevronRightIcon class="w-5 h-5 text-mun-gray-400" />
            </router-link>

            <!-- Pending invitations -->
            <div v-if="authStore.pendingInvitations.length > 0" class="space-y-3">
                <h2 class="text-sm font-semibold text-mun-gray-500 uppercase tracking-wider px-1">
                    Pending Invitations
                </h2>
                <div v-for="inv in authStore.pendingInvitations" :key="inv._id"
                    class="flex items-center justify-between bg-white rounded-xl border border-mun-yellow-200 p-4">
                    <div>
                        <p class="text-sm font-medium text-mun-gray-900">{{ inv.organization?.name }}</p>
                        <p class="text-xs text-mun-gray-500">You've been invited to join</p>
                    </div>
                    <router-link :to="{ name: 'AcceptInvitation', params: { token: inv.token } }"
                        class="text-sm font-medium text-mun-blue hover:text-mun-blue-700">
                        View
                    </router-link>
                </div>
            </div>

            <!-- No orgs state -->
            <div v-if="authStore.allOrganizations.length === 0 && !authStore.isSuperAdmin && authStore.pendingInvitations.length === 0"
                class="bg-white rounded-xl border border-mun-gray-200 p-6 text-center">
                <p class="text-sm text-mun-gray-500">
                    You're not part of any organization yet. Ask an admin to invite you, or check back later.
                </p>
            </div>

            <!-- Profile & logout -->
            <div class="flex items-center justify-center space-x-4 pt-2">
                <router-link :to="{ name: 'Profile' }" class="text-sm text-mun-gray-500 hover:text-mun-gray-700">
                    Profile
                </router-link>
                <span class="text-mun-gray-300">·</span>
                <button @click="handleLogout" class="text-sm text-mun-gray-500 hover:text-mun-gray-700">
                    Sign Out
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ChevronRightIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
    await authStore.logout()
    router.push({ name: 'Login' })
}
</script>