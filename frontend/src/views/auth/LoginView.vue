<template>
    <div class="flex items-center justify-center px-8 py-8 bg-white">
        <div class="w-full max-w-md">
            <!-- Logo and Title -->
            <div class="text-center mb-4">
                <div
                    class="mx-auto w-16 h-16 bg-un-blue rounded-full flex items-center justify-center mb-4 animate-float">
                    <img src="/logo.svg" alt="" class="w-8 h-8 text-white">
                </div>
                <h1 class="text-3xl font-bold text-mun-gray-900 mb-2">
                    MUN<span class="text-un-blue">.UZ</span>
                </h1>
                <p class="text-mun-gray-600">Model United Nations Platform</p>
            </div>

            <!-- Main Content Card -->
            <div class="mun-card">
                <transition name="slide-replace" mode="out-in">
                    <!-- Login Method Selection -->
                    <div v-if="currentView === 'selection'" key="selection">
                        <div class="space-y-4">
                            <!-- Admin Login Button -->
                            <AppButton variant="primary" size="lg" full-width :icon="UserIcon"
                                @click="currentView = 'admin'">
                                Administrator Login
                            </AppButton>

                            <!-- QR Code Login Button -->
                            <AppButton variant="secondary" size="lg" full-width :icon="QrCodeIcon" @click="goToQRLogin">
                                Scan QR Code
                            </AppButton>

                            <!-- Email Login Button -->
                            <AppButton variant="outline" size="lg" full-width :icon="EnvelopeIcon"
                                @click="currentView = 'email'">
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
                    <div v-else-if="currentView === 'admin'" key="admin">
                        <div class="flex items-center justify-center mb-4">
                            <button @click="currentView = 'selection'"
                                class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                <ArrowLongLeftIcon class="w-5 h-5" />
                            </button>
                        </div>

                        <form @submit.prevent="handleAdminLogin" class="space-y-4">
                            <div>
                                <label for="username" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                    Username
                                </label>
                                <input id="username" v-model="adminForm.username" type="text" required
                                    class="input-field" placeholder="Enter your username"
                                    :disabled="authStore.isLoading" />
                            </div>

                            <div>
                                <label for="password" class="block text-sm font-medium text-mun-gray-700 mb-2">
                                    Password
                                </label>
                                <input id="password" v-model="adminForm.password" type="password" required
                                    class="input-field" placeholder="Enter your password"
                                    :disabled="authStore.isLoading" />
                            </div>

                            <AppButton type="submit" variant="primary" size="lg" full-width
                                :loading="authStore.isLoading">
                                Sign In
                            </AppButton>
                        </form>
                    </div>

                    <!-- Email Login Form -->
                    <div v-else-if="currentView === 'email'" key="email">
                        <div class="flex items-center justify-center mb-4">
                            <button @click="currentView = 'selection'"
                                class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                <ArrowLongLeftIcon class="w-5 h-5" />
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

                            <AppButton type="submit" variant="primary" size="lg" full-width
                                :loading="authStore.isLoading">
                                Sign In
                            </AppButton>
                        </form>

                        <div class="mt-4 p-4 bg-un-blue-50 rounded-xl">
                            <p class="text-sm text-un-blue-700">
                                <InformationCircleIcon class="w-4 h-4 inline mr-1 mb-1" />Use the email you registered
                                with
                            </p>
                        </div>
                    </div>
                </transition>
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
    ArrowLongLeftIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Current view state - controls what content is shown
const currentView = ref('selection') // 'selection', 'admin', 'email'

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
/* Slide replace animation */
.slide-replace-enter-active,
.slide-replace-leave-active {
    transition: all 0.4s ease;
}

.slide-replace-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.slide-replace-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}

/* Alternative fade animation option */
.fade-replace-enter-active,
.fade-replace-leave-active {
    transition: all 0.3s ease;
}

.fade-replace-enter-from,
.fade-replace-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>