<template>
    <div>
        <!-- Header -->
        <div class="text-center mb-8">
            <div class="w-14 h-14 bg-mun-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/logo.svg" alt="" class="w-10 h-10">
            </div>
            <h2 class="text-2xl font-bold text-mun-gray-900">Welcome Back</h2>
            <p class="text-sm text-mun-gray-500 mt-1">Sign in to MUN.UZ</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Email -->
            <div>
                <label for="email" class="block text-sm font-medium text-mun-gray-700 mb-1">Email</label>
                <input id="email" v-model="email" type="email" required autocomplete="email" class="input-field"
                    placeholder="you@example.com" />
            </div>

            <!-- Password -->
            <div>
                <label for="password" class="block text-sm font-medium text-mun-gray-700 mb-1">Password</label>
                <input id="password" v-model="password" type="password" required autocomplete="current-password"
                    class="input-field" placeholder="Enter your password" />
            </div>

            <!-- Forgot password -->
            <div class="flex justify-end">
                <router-link :to="{ name: 'ForgotPassword' }"
                    class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                    Forgot password?
                </router-link>
            </div>

            <!-- Error -->
            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <!-- Submit -->
            <button type="submit" :disabled="isLoading" class="btn-un-primary w-full flex items-center justify-center">
                <LoadingSpinner v-if="isLoading" class="w-5 h-5 mr-2" />
                {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
        </form>

        <!-- Register link -->
        <p class="mt-6 text-center text-sm text-mun-gray-500">
            Don't have an account?
            <router-link :to="{ name: 'Register' }" class="text-mun-blue hover:text-mun-blue-700 font-medium">
                Create one
            </router-link>
        </p>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref(null)

const handleLogin = async () => {
    error.value = null
    isLoading.value = true

    const result = await authStore.login(email.value, password.value)

    isLoading.value = false

    if (result.success) {
        const redirect = route.query.redirect
        if (redirect) {
            router.push(redirect)
        } else {
            router.push(authStore.getDefaultRoute())
        }
    } else {
        error.value = result.error
    }
}
</script>