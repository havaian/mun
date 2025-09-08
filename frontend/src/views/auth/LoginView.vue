<template>
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <!-- Logo and Title -->
            <div class="text-center mb-8">
                <div
                    class="mx-auto w-16 h-16 bg-un-blue rounded-full flex items-center justify-center mb-4 animate-float">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                </div>
                <h1 class="text-3xl font-bold text-mun-gray-900 mb-2">
                    MUN<span class="text-un-blue">.UZ</span>
                </h1>
                <p class="text-mun-gray-600">Model United Nations Platform</p>
            </div>

            <!-- Login Method Selection -->
            <div class="mun-card p-8 mb-6">
                <h2 class="text-xl font-semibold text-mun-gray-900 mb-6 text-center">
                    Choose Login Method
                </h2>

                <div class="space-y-4">
                    <!-- Admin Login Button -->
                    <AppButton variant="primary" size="lg" full-width :icon="UserIcon" @click="showAdminLogin = true">
                        Administrator Login
                    </AppButton>

                    <!-- QR Code Login Button -->
                    <AppButton variant="secondary" size="lg" full-width :icon="QrCodeIcon" @click="goToQRLogin">
                        Scan QR Code
                    </AppButton>

                    <!-- Email Login Button -->
                    <AppButton variant="outline" size="lg" full-width :icon="EnvelopeIcon"
                        @click="showEmailLogin = true">
                        Login with Email
                    </AppButton>
                </div>

                <!-- Help Text -->
                <div class="mt-6 text-center">
                    <p class="text-sm text-mun-gray-500">
                        First time? Scan your QR code to get started
                    </p>
                </div>
            </div>

            <!-- Admin Login Form -->
            <transition name="slide-up">
                <div v-if="showAdminLogin" class="mun-card p-8 mb-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900">
                            Administrator Login
                        </h3>
                        <button @click="showAdminLogin = false" class="text-mun-gray-400 hover:text-mun-gray-600">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <form @submit.prevent="handleAdminLogin" class="space-y-4">
                        <div>
                            <label for="username" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                Username
                            </label>
                            <input id="username" v-model="adminForm.username" type="text" required class="input-field"
                                placeholder="Enter your username" :disabled="authStore.isLoading" />
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                Password
                            </label>
                            <input id="password" v-model="adminForm.password" type="password" required
                                class="input-field" placeholder="Enter your password" :disabled="authStore.isLoading" />
                        </div>

                        <AppButton type="submit" variant="primary" size="lg" full-width :loading="authStore.isLoading">
                            Sign In
                        </AppButton>
                    </form>
                </div>
            </transition>

            <!-- Email Login Form -->
            <transition name="slide-up">
                <div v-if="showEmailLogin" class="mun-card p-8 mb-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900">
                            Login with Email
                        </h3>
                        <button @click="showEmailLogin = false" class="text-mun-gray-400 hover:text-mun-gray-600">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <form @submit.prevent="handleEmailLogin" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                Email Address
                            </label>
                            <input id="email" v-model="emailForm.email" type="email" required class="input-field"
                                placeholder="Enter your registered email" :disabled="authStore.isLoading" />
                        </div>

                        <AppButton type="submit" variant="primary" size="lg" full-width :loading="authStore.isLoading">
                            Sign In
                        </AppButton>
                    </form>

                    <div class="mt-4 p-4 bg-un-blue-50 rounded-xl">
                        <p class="text-sm text-un-blue-700">
                            <InformationCircleIcon class="w-4 h-4 inline mr-2" />
                            Use the email you registered with after scanning your QR code
                        </p>
                    </div>
                </div>
            </transition>

            <!-- Footer -->
            <div class="text-center">
                <p class="text-sm text-mun-gray-500">
                    &copy; 2025 MUN.UZ. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import {
    UserIcon,
    QrCodeIcon,
    EnvelopeIcon,
    XMarkIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const showAdminLogin = ref(false)
const showEmailLogin = ref(false)

const adminForm = reactive({
    username: '',
    password: ''
})

const emailForm = reactive({
    email: ''
})

// Methods
const handleAdminLogin = async () => {
    if (!adminForm.username.trim() || !adminForm.password.trim()) {
        toast.error('Please fill in all fields')
        return
    }

    const result = await authStore.adminLogin({
        username: adminForm.username.trim(),
        password: adminForm.password
    })

    if (result.success) {
        router.push({ name: authStore.getDashboardRoute() })
    }
}

const handleEmailLogin = async () => {
    if (!emailForm.email.trim()) {
        toast.error('Please enter your email address')
        return
    }

    const result = await authStore.emailLogin(emailForm.email.trim())

    if (result.success) {
        // Check if user needs to select language
        if (!authStore.user.hasSelectedLanguage) {
            router.push({ name: 'LanguageSelection' })
        } else {
            router.push({ name: authStore.getDashboardRoute() })
        }
    }
}

const goToQRLogin = () => {
    router.push({ name: 'QRLogin' })
}
</script>

<style scoped>
/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>