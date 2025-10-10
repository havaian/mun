<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-mun-blue-900 to-indigo-900 relative overflow-hidden">
        <!-- Animated Background Elements -->
        <div class="absolute inset-0">
            <!-- Floating Orbs -->
            <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-mun-blue-400/20 rounded-full blur-xl animate-float-slow">
            </div>
            <div class="absolute top-3/4 right-1/4 w-48 h-48 bg-blue-400/15 rounded-full blur-2xl animate-float-slower">
            </div>
            <div class="absolute top-1/2 left-3/4 w-24 h-24 bg-cyan-400/25 rounded-full blur-lg animate-float"></div>

            <!-- UN-style Grid Pattern -->
            <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>

            <!-- Diplomatic Particles -->
            <div class="absolute inset-0">
                <div v-for="i in 30" :key="i" class="absolute w-1 h-1 bg-white/20 rounded-full animate-twinkle"
                    :style="getParticleStyle(i)">
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl w-full text-center">
                <!-- Main 404 Section -->
                <div class="mb-8 lg:mb-12">
                    <!-- Glitch Effect 404 -->
                    <div class="relative inline-block">
                        <h1
                            class="text-8xl sm:text-9xl lg:text-[12rem] xl:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-mun-blue-200 to-cyan-200 select-none leading-none animate-glitch">
                            404
                        </h1>

                        <!-- Glitch layers -->
                        <h1
                            class="absolute top-0 left-0 text-8xl sm:text-9xl lg:text-[12rem] xl:text-[14rem] font-black text-red-500/30 select-none leading-none animate-glitch-layer-1">
                            404
                        </h1>
                        <h1
                            class="absolute top-0 left-0 text-8xl sm:text-9xl lg:text-[12rem] xl:text-[14rem] font-black text-cyan-500/30 select-none leading-none animate-glitch-layer-2">
                            404
                        </h1>
                    </div>

                    <!-- UN/MUN Logo -->
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div
                            class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl animate-pulse-glow border-4 border-white/30">
                            <!-- UN-style Olive Branches and Globe -->
                            <svg class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-mun-blue-600" fill="currentColor"
                                viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5" />
                                <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1" />
                                <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="0.5" opacity="0.6" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Diplomatic Error Message -->
                <div class="mb-8 lg:mb-12 space-y-4">
                    <h2 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 animate-slide-up">
                        <span class="inline-block animate-typing overflow-hidden border-r-2 border-white/70">
                            Diplomatic Resolution Failed
                        </span>
                    </h2>

                    <div class="max-w-3xl mx-auto space-y-4 animate-fade-in-delayed">
                        <p class="text-lg sm:text-xl lg:text-2xl text-white/90 font-medium">
                            The page you seek has been vetoed by the Security Council of navigation.
                        </p>
                        <p class="text-base sm:text-lg text-white/70">
                            This territorial dispute in cyberspace requires immediate diplomatic intervention.
                            Please consider alternative routes to reach your intended destination.
                        </p>
                    </div>
                </div>

                <!-- Diplomatic Actions -->
                <div class="space-y-6 animate-slide-up-delayed">
                    <!-- Primary Diplomatic Action -->
                    <div class="flex justify-center">
                        <button @click="goToDashboard"
                            class="group relative overflow-hidden bg-gradient-to-r from-mun-blue-500 to-blue-600 hover:from-mun-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 sm:px-12 rounded-2xl text-lg sm:text-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 active:scale-95">

                            <!-- Button glow effect -->
                            <div
                                class="absolute inset-0 bg-gradient-to-r from-mun-blue-400/50 to-blue-400/50 rounded-2xl blur-xl transition-all duration-300 group-hover:blur-2xl">
                            </div>

                            <!-- Button content -->
                            <div class="relative flex items-center space-x-3">
                                <svg class="w-6 h-6 transition-transform duration-300 group-hover:rotate-12"
                                    fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                </svg>
                                <span>{{ getDashboardText() }}</span>
                                <div class="w-0 group-hover:w-6 transition-all duration-300">
                                    <ArrowRightIcon
                                        class="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" />
                                </div>
                            </div>
                        </button>
                    </div>

                    <!-- Secondary Diplomatic Actions -->
                    <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                        <!-- Return to Previous Page -->
                        <button @click="goBack"
                            class="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105">
                            <div class="flex items-center justify-center space-x-2">
                                <ArrowLeftIcon
                                    class="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
                                <span>Previous Session</span>
                            </div>
                        </button>

                        <!-- Login (if not authenticated) -->
                        <button v-if="!authStore.isAuthenticated" @click="goToLogin"
                            class="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105">
                            <div class="flex items-center justify-center space-x-2">
                                <UserIcon class="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                <span>Delegate Login</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- UN-Style Help Information -->
                <div class="mt-12 lg:mt-16 animate-fade-in-delayed-2">
                    <div
                        class="max-w-3xl mx-auto p-6 lg:p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-500 group">
                        <h3
                            class="text-xl lg:text-2xl font-bold text-white mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <svg class="w-6 h-6 lg:w-7 lg:h-7 mr-3 text-cyan-400" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Diplomatic Assistance
                        </h3>

                        <!-- Diplomatic Solutions Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
                            <div class="space-y-3">
                                <div class="flex items-start space-x-3 group/item">
                                    <div class="w-2 h-2 bg-cyan-400 rounded-full mt-2 group-hover/item:animate-ping">
                                    </div>
                                    <p class="text-sm lg:text-base">Verify your diplomatic credentials (URL)</p>
                                </div>
                                <div class="flex items-start space-x-3 group/item">
                                    <div class="w-2 h-2 bg-blue-400 rounded-full mt-2 group-hover/item:animate-ping">
                                    </div>
                                    <p class="text-sm lg:text-base">Check your committee access permissions</p>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <div class="flex items-start space-x-3 group/item">
                                    <div class="w-2 h-2 bg-purple-400 rounded-full mt-2 group-hover/item:animate-ping">
                                    </div>
                                    <p class="text-sm lg:text-base">Refresh your session or clear delegates</p>
                                </div>
                                <div class="flex items-start space-x-3 group/item">
                                    <div class="w-2 h-2 bg-indigo-400 rounded-full mt-2 group-hover/item:animate-ping">
                                    </div>
                                    <p class="text-sm lg:text-base">Contact the Secretariat for assistance</p>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Diplomatic Links -->
                        <div class="mt-8 pt-6 border-t border-white/10">
                            <p class="text-white/60 text-sm lg:text-base mb-4 font-medium">Quick Committee Access:</p>
                            <div class="flex flex-wrap gap-3 justify-center">
                                <button v-if="authStore.isAuthenticated" @click="goToProfile"
                                    class="text-sm lg:text-base text-cyan-300 hover:text-cyan-200 underline underline-offset-2 hover:underline-offset-4 transition-all duration-300">
                                    Delegate Profile
                                </button>

                                <button v-if="hasDocumentAccess" @click="goToDocuments"
                                    class="text-sm lg:text-base text-blue-300 hover:text-blue-200 underline underline-offset-2 hover:underline-offset-4 transition-all duration-300">
                                    Working Papers
                                </button>

                                <button v-if="hasVotingAccess" @click="goToVoting"
                                    class="text-sm lg:text-base text-purple-300 hover:text-purple-200 underline underline-offset-2 hover:underline-offset-4 transition-all duration-300">
                                    Assembly Voting
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="mt-12 text-center animate-fade-in-delayed-3">
                    <div class="inline-flex items-center space-x-2 text-white/40 text-sm lg:text-base font-medium">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1" />
                            <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="0.5" />
                        </svg>
                        <span>MUN.UZ • Model United Nations Platform</span>
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1" />
                            <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="0.5" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    UserIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Computed properties
const hasDocumentAccess = computed(() => {
    const role = authStore.user?.role
    return role && ['delegate', 'presidium', 'admin'].includes(role)
})

const hasVotingAccess = computed(() => {
    const role = authStore.user?.role
    return role && ['delegate', 'presidium'].includes(role)
})

// Methods
const getDashboardText = () => {
    if (!authStore.isAuthenticated) {
        return 'Return to Assembly'
    }

    switch (authStore.user?.role) {
        case 'admin':
            return 'Secretariat Dashboard'
        case 'presidium':
            return 'Committee Presidium'
        case 'delegate':
            return 'Delegate Dashboard'
        default:
            return 'Return to Assembly'
    }
}

const getParticleStyle = (index) => {
    const x = Math.random() * 100
    const y = Math.random() * 100
    const delay = Math.random() * 4
    const duration = 3 + Math.random() * 4

    return {
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
    }
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

const goToProfile = () => {
    router.push({ name: 'Profile' })
}

const goToDocuments = () => {
    const role = authStore.user?.role
    switch (role) {
        case 'delegate':
            router.push({ name: 'DelegateDocuments' })
            break
        case 'presidium':
            router.push({ name: 'PresidiumDocuments' })
            break
        case 'admin':
            router.push({ name: 'AdminEvents' })
            break
        default:
            goToDashboard()
    }
}

const goToVoting = () => {
    const role = authStore.user?.role
    switch (role) {
        case 'delegate':
            router.push({ name: 'DelegateVoting' })
            break
        case 'presidium':
            router.push({ name: 'PresidiumVoting' })
            break
        default:
            goToDashboard()
    }
}

onMounted(() => {
    // Initialize particle system
})
</script>

<style scoped>
/* Grid Pattern Background - UN Style */
.bg-grid-pattern {
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 60px 60px;
}

/* Custom Animations */
@keyframes float {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    33% {
        transform: translateY(-8px) rotate(0.5deg);
    }

    66% {
        transform: translateY(4px) rotate(-0.5deg);
    }
}

@keyframes float-slow {

    0%,
    100% {
        transform: translateY(0px) scale(1);
    }

    50% {
        transform: translateY(-15px) scale(1.02);
    }
}

@keyframes float-slower {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-25px) rotate(1deg);
    }
}

@keyframes glitch {

    0%,
    100% {
        transform: translate(0);
    }

    20% {
        transform: translate(-1px, 1px);
    }

    40% {
        transform: translate(-1px, -1px);
    }

    60% {
        transform: translate(1px, 1px);
    }

    80% {
        transform: translate(1px, -1px);
    }
}

@keyframes glitch-layer-1 {

    0%,
    100% {
        transform: translate(0);
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }

    10% {
        transform: translate(-1px, -1px);
        clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
    }

    20% {
        transform: translate(1px, 1px);
        clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
    }
}

@keyframes glitch-layer-2 {

    0%,
    100% {
        transform: translate(0);
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }

    15% {
        transform: translate(1px, -1px);
        clip-path: polygon(0 30%, 100% 30%, 100% 70%, 0 70%);
    }

    25% {
        transform: translate(-1px, 1px);
        clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
    }
}

@keyframes typing {
    from {
        width: 0;
    }

    to {
        width: 100%;
    }
}

@keyframes twinkle {

    0%,
    100% {
        opacity: 0;
        transform: scale(0);
    }

    50% {
        opacity: 0.6;
        transform: scale(1);
    }
}

@keyframes pulse-glow {

    0%,
    100% {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2);
        transform: scale(1);
    }

    50% {
        box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.4);
        transform: scale(1.03);
    }
}

@keyframes slide-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Animation Classes */
.animate-float {
    animation: float 4s ease-in-out infinite;
}

.animate-float-slow {
    animation: float-slow 5s ease-in-out infinite;
}

.animate-float-slower {
    animation: float-slower 7s ease-in-out infinite;
}

.animate-glitch {
    animation: glitch 4s infinite;
}

.animate-glitch-layer-1 {
    animation: glitch-layer-1 4s infinite;
}

.animate-glitch-layer-2 {
    animation: glitch-layer-2 4s infinite;
}

.animate-typing {
    animation: typing 2.5s steps(25, end);
}

.animate-twinkle {
    animation: twinkle 4s ease-in-out infinite;
}

.animate-pulse-glow {
    animation: pulse-glow 4s ease-in-out infinite;
}

.animate-slide-up {
    animation: slide-up 0.8s ease-out;
}

.animate-slide-up-delayed {
    animation: slide-up 0.8s ease-out 0.3s both;
}

.animate-fade-in-delayed {
    animation: fade-in 0.8s ease-out 0.6s both;
}

.animate-fade-in-delayed-2 {
    animation: fade-in 0.8s ease-out 0.9s both;
}

.animate-fade-in-delayed-3 {
    animation: fade-in 0.8s ease-out 1.2s both;
}

/* Responsive Typography */
@media (max-width: 640px) {
    .animate-typing {
        animation: none;
        border: none;
        overflow: visible;
    }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {

    .animate-float,
    .animate-float-slow,
    .animate-float-slower,
    .animate-glitch,
    .animate-glitch-layer-1,
    .animate-glitch-layer-2,
    .animate-twinkle,
    .animate-pulse-glow {
        animation: none;
    }

    .animate-typing {
        animation: none;
        border: none;
        overflow: visible;
    }
}

/* Glass morphism enhancements */
.backdrop-blur-md {
    backdrop-filter: blur(12px);
}

.backdrop-blur-sm {
    backdrop-filter: blur(6px);
}

/* Smooth transitions */
button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>