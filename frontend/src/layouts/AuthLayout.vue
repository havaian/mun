<template>
    <div class="min-h-screen bg-gradient-to-br from-un-blue via-mun-blue-600 to-un-blue-dark relative overflow-hidden">
        <!-- Animated Background Elements -->
        <div class="absolute inset-0 overflow-hidden">
            <!-- Floating UN Logo Background -->
            <div class="absolute top-16 right-12 opacity-8 animate-float-slow">
                <svg class="w-28 h-28 text-white" fill="currentColor" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="2" fill="none" />
                    <circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="1" fill="none" />
                    <path d="M25 35 L75 35 M25 45 L75 45 M25 55 L75 55 M25 65 L75 65" stroke="currentColor"
                        stroke-width="1" />
                    <path d="M35 25 L35 75 M45 25 L45 75 M55 25 L55 75 M65 25 L65 75" stroke="currentColor"
                        stroke-width="1" />
                </svg>
            </div>

            <!-- Floating Elements -->
            <div class="absolute bottom-24 right-8 opacity-6 animate-float-delayed">
                <svg class="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>

            <div class="absolute top-32 left-8 opacity-7 animate-pulse">
                <svg class="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
            </div>

            <!-- Additional floating element for balance -->
            <div class="absolute bottom-8 left-16 opacity-4 animate-float-slow" style="animation-delay: 1s;">
                <svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
            </div>

            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        </div>

        <!-- Main Content Container -->
        <div class="relative z-10 min-h-screen flex max-w-6xl mx-auto">
            <!-- Left Side - Branding & Information -->
            <div class="hidden lg:flex lg:w-1/2 flex-col justify-center px-8 py-16">
                <!-- Glassmorphism Background Container -->
                <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
                    <div class="max-w-sm mx-auto">
                        <!-- Logo and Branding -->
                        <div class="text-center mb-10">
                            <div
                                class="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl mb-6 shadow-lg border border-white/30">
                                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h1 class="text-3xl font-bold text-white mb-2">
                                MUN Platform
                            </h1>
                            <p class="text-lg text-white/90">
                                Model United Nations Management System
                            </p>
                        </div>

                        <!-- Feature Highlights -->
                        <div class="space-y-5">
                            <div class="flex items-start space-x-4">
                                <div class="flex-shrink-0 w-8 h-8 bg-white/25 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-white mb-1">Secure Access</h3>
                                    <p class="text-white/80 text-sm">
                                        QR-based authentication with role-based permissions
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div class="flex-shrink-0 w-8 h-8 bg-white/25 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-white mb-1">Multi-Role Support</h3>
                                    <p class="text-white/80 text-sm">
                                        Delegates, Presidium, and Administrators
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div class="flex-shrink-0 w-8 h-8 bg-white/25 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-white mb-1">Real-time Management</h3>
                                    <p class="text-white/80 text-sm">
                                        Live session tracking, voting, and document management
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Current Page Indicator -->
                        <div class="mt-8 p-4 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg">
                            <div class="flex items-center space-x-3">
                                <component :is="currentPageIcon" class="w-5 h-5 text-slate-100" />
                                <div>
                                    <p class="text-sm font-medium text-slate-100">
                                        {{ currentPageTitle }}
                                    </p>
                                    <p class="text-xs text-slate-300">
                                        {{ currentPageDescription }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Side - Authentication Forms -->
            <div class="flex-1 lg:w-1/2 flex items-center justify-center px-6 py-12">
                <div class="w-full max-w-md">
                    <!-- Mobile Logo (shown only on small screens) -->
                    <div class="lg:hidden text-center mb-8">
                        <div
                            class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl mb-4 border border-white/20">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 class="text-2xl font-bold text-white mb-1">
                            MUN Platform
                        </h1>
                        <p class="text-white/80 text-sm">
                            Model United Nations Management
                        </p>
                    </div>

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