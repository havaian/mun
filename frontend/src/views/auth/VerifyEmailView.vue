<template>
    <div class="text-center">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
            <div class="w-14 h-14 bg-mun-blue rounded-xl flex items-center justify-center">
                <img src="/logo.svg" alt="MUN.UZ" class="w-10 h-10" />
            </div>
        </div>

        <!-- Loading state -->
        <template v-if="isVerifying">
            <div class="w-12 h-12 mx-auto mb-4">
                <LoadingSpinner class="w-12 h-12 text-mun-blue" />
            </div>
            <h2 class="text-xl font-bold text-mun-gray-900 mb-2">Verifying your email...</h2>
            <p class="text-sm text-mun-gray-500">Please wait a moment.</p>
        </template>

        <!-- Success state -->
        <template v-else-if="isVerified">
            <div class="w-14 h-14 bg-mun-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon class="w-8 h-8 text-mun-green-600" />
            </div>
            <h2 class="text-xl font-bold text-mun-gray-900 mb-2">Email Verified!</h2>
            <p class="text-sm text-mun-gray-500 mb-6">
                Your email has been verified successfully. You can now access all features.
            </p>
            <button @click="goToDashboard" class="btn-un-primary w-full">
                Continue
            </button>
        </template>

        <!-- Error state -->
        <template v-else-if="error">
            <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationCircleIcon class="w-8 h-8 text-red-500" />
            </div>
            <h2 class="text-xl font-bold text-mun-gray-900 mb-2">Verification Failed</h2>
            <p class="text-sm text-mun-gray-500 mb-6">{{ error }}</p>

            <div class="space-y-3">
                <button v-if="canResend" @click="resendVerification" :disabled="isResending"
                    class="btn-un-primary w-full flex items-center justify-center">
                    <LoadingSpinner v-if="isResending" class="w-5 h-5 mr-2" />
                    {{ isResending ? 'Sending...' : 'Resend Verification Email' }}
                </button>

                <p v-if="resendSuccess" class="text-sm text-mun-green-600 font-medium">
                    Verification email sent! Check your inbox.
                </p>

                <router-link :to="{ name: 'Login' }"
                    class="block text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                    Back to Sign In
                </router-link>
            </div>
        </template>

        <!-- No token state -->
        <template v-else>
            <div class="w-14 h-14 bg-mun-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon class="w-8 h-8 text-mun-blue" />
            </div>
            <h2 class="text-xl font-bold text-mun-gray-900 mb-2">Check Your Email</h2>
            <p class="text-sm text-mun-gray-500 mb-6">
                We sent a verification link to your email address.
                Click the link in the email to verify your account.
            </p>

            <div class="space-y-3">
                <button v-if="isAuthenticated" @click="resendVerification" :disabled="isResending"
                    class="btn-un-primary w-full flex items-center justify-center">
                    <LoadingSpinner v-if="isResending" class="w-5 h-5 mr-2" />
                    {{ isResending ? 'Sending...' : 'Resend Verification Email' }}
                </button>

                <p v-if="resendSuccess" class="text-sm text-mun-green-600 font-medium">
                    Verification email sent! Check your inbox.
                </p>

                <router-link :to="{ name: 'Login' }" class="block text-sm text-mun-gray-500 hover:text-mun-gray-700">
                    Back to Sign In
                </router-link>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { CheckCircleIcon, ExclamationCircleIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isVerifying = ref(false)
const isVerified = ref(false)
const error = ref(null)
const isResending = ref(false)
const resendSuccess = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Can resend if user is logged in (needs auth token)
const canResend = computed(() => isAuthenticated.value)

onMounted(async () => {
    const token = route.query.token

    if (token) {
        await verifyToken(token)
    }
    // No token → show the "check your email" state
})

async function verifyToken(token) {
    isVerifying.value = true
    error.value = null

    try {
        await apiMethods.auth.verifyEmail(token)
        isVerified.value = true

        // Refresh user data if logged in so emailVerified flag updates
        if (isAuthenticated.value) {
            await authStore.validateSession()
        }
    } catch (e) {
        const msg = e.response?.data?.error
        if (msg?.includes('expired')) {
            error.value = 'This verification link has expired. Please request a new one.'
        } else if (msg?.includes('Invalid')) {
            error.value = 'This verification link is invalid or has already been used.'
        } else {
            error.value = msg || 'Failed to verify email. Please try again.'
        }
    } finally {
        isVerifying.value = false
    }
}

async function resendVerification() {
    isResending.value = true
    resendSuccess.value = false

    try {
        await apiMethods.auth.resendVerification()
        resendSuccess.value = true
    } catch (e) {
        error.value = e.response?.data?.error || 'Failed to resend verification email.'
    } finally {
        isResending.value = false
    }
}

function goToDashboard() {
    if (isAuthenticated.value) {
        router.push(authStore.getDefaultRoute())
    } else {
        router.push({ name: 'Login' })
    }
}
</script>