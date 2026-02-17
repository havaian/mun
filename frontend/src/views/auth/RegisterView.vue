<template>
    <div>
        <!-- Header -->
        <div class="text-center mb-8">
            <div class="w-14 h-14 bg-mun-blue rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/logo.svg" alt="" class="w-10 h-10">
            </div>
            <h2 class="text-2xl font-bold text-mun-gray-900">Create Account</h2>
            <p class="text-sm text-mun-gray-500 mt-1">Join the MUN.UZ platform</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- Name row -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label for="firstName" class="block text-sm font-medium text-mun-gray-700 mb-1">First Name</label>
                    <input id="firstName" v-model="form.firstName" type="text" required class="input-field"
                        placeholder="John" />
                </div>
                <div>
                    <label for="lastName" class="block text-sm font-medium text-mun-gray-700 mb-1">Last Name</label>
                    <input id="lastName" v-model="form.lastName" type="text" required class="input-field"
                        placeholder="Doe" />
                </div>
            </div>

            <!-- Email -->
            <div>
                <label for="email" class="block text-sm font-medium text-mun-gray-700 mb-1">Email</label>
                <input id="email" v-model="form.email" type="email" required autocomplete="email" class="input-field"
                    placeholder="you@example.com" />
            </div>

            <!-- Password -->
            <div>
                <label for="password" class="block text-sm font-medium text-mun-gray-700 mb-1">Password</label>
                <input id="password" v-model="form.password" type="password" required autocomplete="new-password"
                    minlength="8" class="input-field" placeholder="At least 8 characters" />
            </div>

            <!-- Confirm Password -->
            <div>
                <label for="confirmPassword" class="block text-sm font-medium text-mun-gray-700 mb-1">Confirm
                    Password</label>
                <input id="confirmPassword" v-model="form.confirmPassword" type="password" required
                    autocomplete="new-password" minlength="8" class="input-field" placeholder="Repeat password" />
            </div>

            <!-- Optional fields toggle -->
            <button type="button" @click="showOptional = !showOptional"
                class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                {{ showOptional ? 'Hide' : 'Show' }} optional fields
            </button>

            <!-- Optional fields -->
            <div v-if="showOptional" class="space-y-4 pt-2">
                <div>
                    <label for="phone" class="block text-sm font-medium text-mun-gray-700 mb-1">Phone</label>
                    <input id="phone" v-model="form.phone" type="tel" class="input-field"
                        placeholder="+998 90 123 45 67" />
                </div>
                <div>
                    <label for="institution"
                        class="block text-sm font-medium text-mun-gray-700 mb-1">Institution</label>
                    <input id="institution" v-model="form.institution" type="text" class="input-field"
                        placeholder="University or organization" />
                </div>
                <div>
                    <label for="dateOfBirth" class="block text-sm font-medium text-mun-gray-700 mb-1">Date of
                        Birth</label>
                    <input id="dateOfBirth" v-model="form.dateOfBirth" type="date" class="input-field" />
                </div>
            </div>

            <!-- Error -->
            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

            <!-- Submit -->
            <button type="submit" :disabled="isLoading" class="btn-un-primary w-full flex items-center justify-center">
                <LoadingSpinner v-if="isLoading" class="w-5 h-5 mr-2" />
                {{ isLoading ? 'Creating account...' : 'Create Account' }}
            </button>
        </form>

        <!-- Login link -->
        <p class="mt-6 text-center text-sm text-mun-gray-500">
            Already have an account?
            <router-link :to="{ name: 'Login' }" class="text-mun-blue hover:text-mun-blue-700 font-medium">
                Sign in
            </router-link>
        </p>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)
const error = ref(null)
const showOptional = ref(false)

const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    institution: '',
    dateOfBirth: '',
})

const handleRegister = async () => {
    error.value = null

    if (form.password !== form.confirmPassword) {
        error.value = 'Passwords do not match'
        return
    }

    if (form.password.length < 8) {
        error.value = 'Password must be at least 8 characters'
        return
    }

    isLoading.value = true

    const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
    }

    // Add optional fields if filled
    if (form.phone) payload.phone = form.phone
    if (form.institution) payload.institution = form.institution
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth

    const result = await authStore.register(payload)

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