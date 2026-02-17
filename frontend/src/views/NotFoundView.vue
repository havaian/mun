<template>
    <div
        class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div class="text-center">
            <!-- 404 number -->
            <div class="relative mb-8">
                <h1 class="text-[10rem] sm:text-[14rem] font-black text-white/5 leading-none select-none">404</h1>
                <div class="absolute inset-0 flex items-center justify-center">
                    <p class="text-3xl sm:text-5xl font-bold text-white">Page Not Found</p>
                </div>
            </div>

            <p class="text-lg text-slate-400 mb-8 max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved.
            </p>

            <!-- Actions -->
            <div class="flex items-center justify-center space-x-4">
                <button @click="goBack"
                    class="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors">
                    Go Back
                </button>
                <button @click="goHome"
                    class="px-6 py-3 bg-mun-blue text-white rounded-xl font-medium hover:bg-mun-blue-600 transition-colors">
                    {{ authStore.isAuthenticated ? 'Dashboard' : 'Login' }}
                </button>
            </div>

            <!-- Logo -->
            <div class="mt-16 flex flex-col items-center">
                <div class="w-16 h-16 bg-mun-blue rounded-full flex items-center justify-center mb-4">
                    <img src="/logo.svg" alt="" class="w-8 h-8 text-white">
                </div>
                <div class="text-white/40 text-sm font-medium">MUN.UZ</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const goHome = () => {
    if (!authStore.isAuthenticated) {
        router.push({ name: 'Login' })
        return
    }
    router.push(authStore.getDefaultRoute())
}

const goBack = () => {
    if (window.history.length > 2) {
        router.go(-1)
    } else {
        goHome()
    }
}
</script>