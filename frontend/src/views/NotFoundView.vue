<template>
    <div class="min-h-screen bg-gradient-to-br from-mun-blue to-mun-blue-600 flex items-center justify-center px-4">
        <div class="max-w-lg w-full text-center">
            <!-- 404 Animation -->
            <div class="mb-8">
                <div class="relative">
                    <!-- Main 404 Text -->
                    <h1 class="text-9xl font-bold text-white/20 select-none">
                        404
                    </h1>

                    <!-- Floating UN Logo -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div
                            class="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl animate-bounce">
                            <svg class="w-12 h-12 text-mun-blue" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Message -->
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-white mb-4">
                    Page Not Found
                </h2>
                <p class="text-xl text-white/80 mb-2">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <p class="text-white/60">
                    This might happen if you're trying to access a restricted area or if the URL is incorrect.
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-4">
                <!-- Primary Action - Go to Dashboard -->
                <div>
                    <AppButton @click="goToDashboard"
                        class="bg-white text-mun-blue hover:bg-mun-gray-50 font-semibold px-8 py-3 text-lg">
                        <HomeIcon class="w-5 h-5 mr-2" />
                        {{ getDashboardText() }}
                    </AppButton>
                </div>

                <!-- Secondary Actions -->
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <AppButton @click="goBack" variant="outline" class="border-white/30 text-white hover:bg-white/10">
                        <ArrowLeftIcon class="w-4 h-4 mr-2" />
                        Go Back
                    </AppButton>

                    <AppButton v-if="!authStore.isAuthenticated" @click="goToLogin" variant="outline"
                        class="border-white/30 text-white hover:bg-white/10">
                        <UserIcon class="w-4 h-4 mr-2" />
                        Login
                    </AppButton>

                    <AppButton @click="reportIssue" variant="outline"
                        class="border-white/30 text-white hover:bg-white/10">
                        <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
                        Report Issue
                    </AppButton>
                </div>
            </div>

            <!-- Help Information -->
            <div class="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <h3 class="text-lg font-semibold text-white mb-3 flex items-center justify-center">
                    <InformationCircleIcon class="w-5 h-5 mr-2" />
                    Need Help?
                </h3>

                <div class="text-white/80 text-sm space-y-2">
                    <p>• Check the URL for any typos</p>
                    <p>• Make sure you have the correct permissions</p>
                    <p>• Try refreshing the page</p>
                    <p>• Contact your system administrator if the problem persists</p>
                </div>

                <!-- Quick Links -->
                <div class="mt-4 pt-4 border-t border-white/20">
                    <p class="text-white/60 text-xs mb-2">Quick Links:</p>
                    <div class="flex flex-wrap gap-2 justify-center">
                        <button v-if="authStore.isAuthenticated" @click="goToProfile"
                            class="text-xs text-white/80 hover:text-white underline">
                            Profile
                        </button>
                        <span v-if="authStore.isAuthenticated" class="text-white/40">•</span>

                        <button v-if="hasDocumentAccess" @click="goToDocuments"
                            class="text-xs text-white/80 hover:text-white underline">
                            Documents
                        </button>
                        <span v-if="hasDocumentAccess" class="text-white/40">•</span>

                        <button v-if="hasVotingAccess" @click="goToVoting"
                            class="text-xs text-white/80 hover:text-white underline">
                            Voting
                        </button>
                        <span v-if="hasVotingAccess" class="text-white/40">•</span>

                        <button @click="goToHelp" class="text-xs text-white/80 hover:text-white underline">
                            Help Center
                        </button>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-8 text-center">
                <p class="text-white/40 text-sm">
                    MUN Management System • Error 404
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    HomeIcon,
    ArrowLeftIcon,
    UserIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
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
        return 'Go to Login'
    }

    switch (authStore.user?.role) {
        case 'admin':
            return 'Admin Dashboard'
        case 'presidium':
            return 'Presidium Dashboard'
        case 'delegate':
            return 'Delegate Dashboard'
        default:
            return 'Dashboard'
    }
}

const goToDashboard = () => {
    if (!authStore.isAuthenticated) {
        router.push({ name: 'Login' })
        return
    }

    // Use the auth store method to get the correct dashboard route
    const dashboardRoute = authStore.getDashboardRoute()
    router.push({ name: dashboardRoute })
}

const goBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 2) {
        router.go(-1)
    } else {
        // Fallback to dashboard
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
            router.push({ name: 'AdminEvents' }) // Admin doesn't have direct documents view
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

const goToHelp = () => {
    // In a real app, this might open a help center or documentation
    toast.info('Help center will be available soon. Please contact your administrator for assistance.')
}

const reportIssue = () => {
    // In a real app, this might open a bug report form or ticket system
    toast.info('Issue reporting will be available soon. Please contact your administrator.')
}
</script>

<style scoped>
/* Custom animations */
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

/* Background pattern overlay */
.min-h-screen::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
    pointer-events: none;
}
</style>