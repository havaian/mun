<template>
    <div class="min-h-screen bg-gradient-to-br from-un-blue via-mun-blue-600 to-un-blue-dark relative overflow-hidden">
        <!-- Main Content Container -->
        <div class="relative z-10 min-h-screen flex items-center justify-center">
            <!-- Authentication Forms - Centered -->
            <div class="w-full max-w-md px-6">
                <!-- Auth Form Container -->
                <div class="relative">
                    <div
                        class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                        <!-- Loading Overlay -->
                        <div v-if="authStore.isLoading"
                            class="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                            <div class="flex flex-col items-center">
                                <LoadingSpinner class="w-8 h-8 text-un-blue mb-2" />
                                <p class="text-sm text-mun-gray-600">
                                    {{ loadingMessage }}
                                </p>
                            </div>
                        </div>

                        <!-- Router View for Auth Pages -->
                        <div class="relative">
                            <RouterView />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast Container Mount Point -->
        <ToastContainer />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
    QrCodeIcon,
    UserIcon,
    EnvelopeIcon,
    LanguageIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()

// Computed properties for dynamic content based on current route
const currentPageInfo = computed(() => {
    switch (route.name) {
        case 'Login':
            return {
                title: 'Welcome Back',
                description: 'Choose your preferred login method',
                icon: UserIcon
            }
        case 'QRLogin':
            return {
                title: 'QR Code Login',
                description: 'Scan your unique access code',
                icon: QrCodeIcon
            }
        case 'EmailBinding':
            return {
                title: 'Complete Setup',
                description: 'Verify your email to finish registration',
                icon: EnvelopeIcon
            }
        case 'LanguageSelection':
            return {
                title: 'Language Preference',
                description: 'Choose your preferred language',
                icon: LanguageIcon
            }
        default:
            return {
                title: 'Authentication',
                description: 'Access your MUN platform',
                icon: InformationCircleIcon
            }
    }
})

const currentPageTitle = computed(() => currentPageInfo.value.title)
const currentPageDescription = computed(() => currentPageInfo.value.description)
const currentPageIcon = computed(() => currentPageInfo.value.icon)

// Loading message based on current authentication state
const loadingMessage = computed(() => {
    if (authStore.isLoading) {
        switch (route.name) {
            case 'Login':
                return 'Signing you in...'
            case 'QRLogin':
                return 'Processing QR code...'
            case 'EmailBinding':
                return 'Completing registration...'
            case 'LanguageSelection':
                return 'Saving preferences...'
            default:
                return 'Please wait...'
        }
    }
    return ''
})
</script>

<style scoped>
/* Custom animations */
@keyframes float-slow {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    33% {
        transform: translateY(-10px) rotate(2deg);
    }

    66% {
        transform: translateY(5px) rotate(-1deg);
    }
}

@keyframes float-delayed {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-15px) rotate(3deg);
    }
}

.animate-float-slow {
    animation: float-slow 8s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float-delayed 6s ease-in-out infinite 2s;
}

/* Background gradient animation */
.bg-gradient-to-br {
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

/* Enhanced glassmorphism effects */
.bg-white\/10 {
    background: rgba(255, 255, 255, 0.1);
}

.bg-white\/15 {
    background: rgba(255, 255, 255, 0.15);
}

.bg-white\/25 {
    background: rgba(255, 255, 255, 0.25);
}

/* Backdrop blur support fallback */
@supports not (backdrop-filter: blur(10px)) {
    .backdrop-blur-md {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .backdrop-blur-sm {
        background-color: rgba(255, 255, 255, 0.15);
    }
}
</style>
