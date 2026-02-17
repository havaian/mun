<template>
    <div class="min-h-screen bg-gradient-mun flex items-center justify-center p-6">
        <div class="max-w-md w-full">
            <div class="bg-white rounded-2xl border border-mun-gray-200 p-8">
                <div v-if="isLoading" class="flex justify-center py-8">
                    <LoadingSpinner class="w-8 h-8" />
                </div>

                <!-- Invitation info -->
                <template v-else-if="invitation">
                    <div class="text-center mb-6">
                        <div class="w-14 h-14 bg-mun-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span class="text-xl font-bold text-mun-blue">{{ invitation.organization?.name?.charAt(0)
                                }}</span>
                        </div>
                        <h2 class="text-xl font-bold text-mun-gray-900">You're Invited</h2>
                        <p class="text-sm text-mun-gray-500 mt-2">
                            <strong>{{ invitation.organization?.name }}</strong> has invited you to join their
                            organization.
                        </p>
                    </div>

                    <!-- Not logged in -->
                    <div v-if="!authStore.isAuthenticated" class="space-y-3">
                        <p class="text-sm text-mun-gray-600 text-center">
                            Sign in or create an account to accept this invitation.
                        </p>
                        <router-link :to="{ name: 'Login', query: { redirect: $route.fullPath } }"
                            class="btn-un-primary w-full block text-center">Sign In</router-link>
                        <router-link :to="{ name: 'Register', query: { redirect: $route.fullPath } }"
                            class="btn-un-secondary w-full block text-center">Create Account</router-link>
                    </div>

                    <!-- Logged in -->
                    <div v-else class="space-y-4">
                        <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>
                        <p v-if="accepted" class="text-sm text-green-600 text-center">
                            Invitation accepted! Redirecting...
                        </p>
                        <button v-else @click="acceptInvitation" :disabled="isAccepting"
                            class="btn-un-primary w-full flex items-center justify-center">
                            <LoadingSpinner v-if="isAccepting" class="w-5 h-5 mr-2" />
                            {{ isAccepting ? 'Accepting...' : 'Accept Invitation' }}
                        </button>
                    </div>
                </template>

                <!-- Invalid/expired -->
                <div v-else class="text-center space-y-4">
                    <p class="text-mun-gray-500">This invitation is invalid or has expired.</p>
                    <router-link :to="{ name: 'Login' }"
                        class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                        Go to Login
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const isAccepting = ref(false)
const invitation = ref(null)
const error = ref(null)
const accepted = ref(false)

onMounted(async () => {
    try {
        const res = await apiMethods.invitations.getInfo(route.params.token)
        if (res.data.success) {
            invitation.value = res.data.invitation
        }
    } catch (e) {
        // Invalid invitation
    } finally {
        isLoading.value = false
    }
})

const acceptInvitation = async () => {
    isAccepting.value = true
    error.value = null

    try {
        await apiMethods.invitations.accept(route.params.token)
        accepted.value = true

        // Refresh user profile to get updated org list
        await authStore.fetchProfile()

        // Redirect to the org
        setTimeout(() => {
            if (invitation.value?.organization?.slug) {
                router.push({ name: 'OrgDashboard', params: { orgSlug: invitation.value.organization.slug } })
            } else {
                router.push({ name: 'UserHome' })
            }
        }, 1500)
    } catch (e) {
        error.value = e.response?.data?.error || 'Failed to accept invitation'
    } finally {
        isAccepting.value = false
    }
}
</script>