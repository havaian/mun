<template>
    <div>
        <!-- Header -->
        <div class="text-center mb-8">
            <div class="w-14 h-14 bg-mun-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/logo.svg" alt="" class="w-10 h-10">
            </div>
            <h2 class="text-2xl font-bold text-mun-gray-900">Forgot Password</h2>
            <p class="text-sm text-mun-gray-500 mt-1">We'll send you a reset link</p>
        </div>

        <!-- Success state -->
        <div v-if="sent" class="text-center space-y-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon class="w-6 h-6 text-green-600" />
            </div>
            <p class="text-sm text-mun-gray-600">
                If an account exists for <strong>{{ email }}</strong>, you'll receive a password reset email shortly.
            </p>
            <router-link :to="{ name: 'Login' }" class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                Back to login
            </router-link>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-5">
            <div>
                <label for="email" class="block text-sm font-medium text-mun-gray-700 mb-1">Email</label>
                <input id="email" v-model="email" type="email" required autocomplete="email" class="input-field"
                    placeholder="you@example.com" />
            </div>

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <button type="submit" :disabled="isLoading" class="btn-un-primary w-full flex items-center justify-center">
                <LoadingSpinner v-if="isLoading" class="w-5 h-5 mr-2" />
                {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>

            <p class="text-center">
                <router-link :to="{ name: 'Login' }" class="text-sm text-mun-gray-500 hover:text-mun-gray-700">
                    Back to login
                </router-link>
            </p>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiMethods } from '@/utils/api'
import { CheckIcon } from '@heroicons/vue/24/outline'

const email = ref('')
const isLoading = ref(false)
const error = ref(null)
const sent = ref(false)

const handleSubmit = async () => {
    error.value = null
    isLoading.value = true

    try {
        await apiMethods.auth.requestPasswordReset(email.value)
        sent.value = true
    } catch (e) {
        // Always show success to prevent email enumeration
        sent.value = true
    } finally {
        isLoading.value = false
    }
}
</script>