<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Universal Navbar for guest users -->
        <UniversalNavbar />

        <!-- Main Auth Content -->
        <div class="pt-16 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-md">
                <!-- Logo and branding -->
                <div class="flex justify-center">
                    <div
                        class="w-16 h-16 bg-gradient-to-br from-mun-blue-500 to-mun-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span class="text-white font-bold text-2xl">🏛️</span>
                    </div>
                </div>
                <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-mun-gray-900">
                    MUN Platform
                </h2>
                <p class="mt-2 text-center text-sm text-mun-gray-600">
                    Model United Nations Management System
                </p>
            </div>

            <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    class="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-white/20">
                    <!-- Dynamic route content -->
                    <router-view />
                </div>

                <!-- Footer links for auth pages -->
                <div class="mt-6 text-center">
                    <div class="flex items-center justify-center space-x-6 text-sm">
                        <router-link to="/auth/help"
                            class="text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                            Need Help?
                        </router-link>
                        <span class="text-mun-gray-300">•</span>
                        <router-link to="/auth/support"
                            class="text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                            Support
                        </router-link>
                        <span class="text-mun-gray-300">•</span>
                        <router-link to="/about" class="text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                            About
                        </router-link>
                    </div>
                </div>
            </div>
        </div>

        <!-- Background decoration -->
        <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-32 w-80 h-80 bg-mun-blue-400/20 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-40 -left-32 w-80 h-80 bg-mun-purple-400/20 rounded-full blur-3xl"></div>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Import the Universal Navbar
import UniversalNavbar from '@/components/shared/UniversalNavbar.vue'

const route = useRoute()

// Set page title based on route
onMounted(() => {
    const titleMap = {
        'Login': 'Sign In',
        'QRLogin': 'QR Code Login',
        'EmailBinding': 'Complete Registration',
        'LanguageSelection': 'Select Language'
    }

    const pageTitle = titleMap[route.name] || 'Authentication'
    document.title = `${pageTitle} | MUN Platform`
})
</script>

<style scoped>
/* Ensure proper spacing with navbar */
.pt-16 {
    padding-top: 4rem;
}

/* Glass morphism effect for auth card */
.bg-white\/80 {
    background-color: rgba(255, 255, 255, 0.8);
}

.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}

/* Gradient background */
.bg-gradient-mun {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f4ff 100%);
}

/* Transition optimizations */
.transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

/* Blur effects for background decoration */
.blur-3xl {
    filter: blur(64px);
}

/* Z-index management */
.-z-10 {
    z-index: -10;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .sm\:rounded-2xl {
        border-radius: 0;
    }

    .sm\:px-10 {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}
</style>