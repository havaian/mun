<template>
    <div>
        <div class="text-center mb-8">
            <div class="w-14 h-14 bg-mun-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/logo.svg" alt="" class="w-10 h-10">
            </div>
            <h2 class="text-2xl font-bold text-mun-gray-900">Reset Password</h2>
            <p class="text-sm text-mun-gray-500 mt-1">Enter your new password</p>
        </div>

        <!-- Success -->
        <div v-if="success" class="text-center space-y-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon class="w-6 h-6 text-green-600" />
            </div>
            <p class="text-sm text-mun-gray-600">Password reset successfully.</p>
            <router-link :to="{ name: 'Login' }" class="btn-un-primary inline-block">
                Sign In
            </router-link>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-5">
            <div>
                <label for="password" class="block text-sm font-medium text-mun-gray-700 mb-1">New Password</label>
                <input id="password" v-model="password" type="password" required minlength="8" class="input-field"
                    placeholder="At least 8 characters" />
            </div>
            <div>
                <label for="confirmPassword" class="block text-sm font-medium text-mun-gray-700 mb-1">Confirm
                    Password</label>
                <input id="confirmPassword" v-model="confirmPassword" type="password" required minlength="8"
                    class="input-field" placeholder="Repeat password" />
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <button type="submit" :disabled="isLoading" class="btn-un-primary w-full flex items-center justify-center">
                <LoadingSpinner v-if="isLoading" class="w-5 h-5 mr-2" />
                {{ isLoading ? 'Resetting...' : 'Reset Password' }}
            </button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { CheckIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const toast = useToast()

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref(null)
const success = ref(false)

const handleSubmit = async () => {
    error.value = null

    if (password.value !== confirmPassword.value) {
        error.value = 'Passwords do not match'
        return
    }

    const token = route.query.token
    if (!token) {
        error.value = 'Invalid reset link. Please request a new one.'
        return
    }

    isLoading.value = true

    try {
        await apiMethods.auth.confirmPasswordReset({
            token,
            newPassword: password.value
        })
        success.value = true
    } catch (e) {
        error.value = e.response?.data?.error || 'Failed to reset password. The link may have expired.'
    } finally {
        isLoading.value = false
    }
}
</script>