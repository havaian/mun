<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-mun-blue-900 to-indigo-900 relative overflow-hidden">
        <!-- Subtle Background Elements -->
        <div class="absolute inset-0">
            <!-- Clean floating orbs -->
            <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-mun-blue-400/10 rounded-full blur-xl animate-float-slow">
            </div>
            <div class="absolute top-3/4 right-1/4 w-48 h-48 bg-blue-400/8 rounded-full blur-2xl animate-float-slower">
            </div>
            <div class="absolute top-1/2 left-3/4 w-24 h-24 bg-cyan-400/12 rounded-full blur-lg animate-float"></div>

            <!-- Minimal grid -->
            <div class="absolute inset-0 bg-grid-pattern opacity-3"></div>
        </div>

        <!-- Main Content -->
        <div class="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div class="max-w-2xl w-full text-center">
                <!-- 404 Display -->
                <div class="mb-12">
                    <div class="relative inline-block">
                        <h1
                            class="text-8xl sm:text-9xl lg:text-[10rem] font-black text-white/90 select-none leading-none">
                            404
                        </h1>
                    </div>
                </div>

                <!-- Simple message -->
                <div class="mb-12 space-y-4">
                    <h2 class="text-3xl sm:text-4xl font-bold text-white">
                        Page Not Found
                    </h2>

                    <p class="text-lg sm:text-xl text-white/80 max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <!-- Clean actions -->
                <div class="space-y-4">
                    <!-- Primary button -->
                    <div class="flex justify-center">
                        <button @click="goBack"
                            class="bg-mun-blue-600 hover:bg-mun-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg">
                            ← Go Back
                        </button>
                    </div>

                    <!-- Secondary actions -->
                    <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                        <button @click="goToDashboard"
                            class="bg-mun-blue-600 hover:bg-mun-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg">
                            {{ getDashboardText() }}
                        </button>
                    </div>
                </div>

                <!-- Footer -->
                <div class="mt-16 text-center">
                    <div
                        class="mx-auto w-16 h-16 bg-mun-blue rounded-full flex items-center justify-center mb-4 animate-float">
                        <img src="/logo.svg" alt="" class="w-8 h-8 text-white">
                    </div>
                    <div class="text-white/40 text-sm font-medium">
                        MUN.UZ
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Methods
const getDashboardText = () => {
    if (!authStore.isAuthenticated) {
        return 'Login'
    }

    return 'Dashboard'
}

const goToDashboard = () => {
    if (!authStore.isAuthenticated) {
        router.push({ name: 'Login' })
        return
    }

    const dashboardRoute = authStore.getDashboardRoute()
    router.push({ name: dashboardRoute })
}

const goBack = () => {
    if (window.history.length > 2) {
        router.go(-1)
    } else {
        goToDashboard()
    }
}

const goToLogin = () => {
    router.push({ name: 'Login' })
}
</script>

<style scoped>
/* Grid Pattern Background */
.bg-grid-pattern {
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
}

/* Simple animations */
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }
}

@keyframes float-slow {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-15px);
    }
}

@keyframes float-slower {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-20px);
    }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}

.animate-float-slow {
    animation: float-slow 8s ease-in-out infinite;
}

.animate-float-slower {
    animation: float-slower 10s ease-in-out infinite;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {

    .animate-float,
    .animate-float-slow,
    .animate-float-slower {
        animation: none;
    }
}
</style>