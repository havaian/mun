<template>
    <div class="min-h-screen gradient-bg">
        <div class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 mt-[5vh]">
            <!-- Main Content -->
            <div class="max-w-2xl w-full text-center fade-in">
                <!-- Logo Section -->
                <div class="mb-8 animate-float">
                    <div class="flex items-center justify-center mb-4">
                        <div class="bg-un-blue rounded-full p-4 shadow-lg glass-card">
                            <svg class="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                            </svg>
                        </div>
                    </div>
                    <h1 class="text-4xl sm:text-5xl font-bold glass-text mb-2">
                        MUN<span class="text-un-blue">.UZ</span>
                    </h1>
                    <p class="text-lg glass-text-light">Model United Nations Platform</p>
                </div>

                <!-- Coming Soon Message -->
                <div class="mb-12">
                    <h2 class="text-2xl sm:text-3xl font-semibold glass-text mb-4">
                        Something Amazing is Coming Soon
                    </h2>
                    <p class="text-lg glass-text-light leading-relaxed">
                        We're building the ultimate platform for organizing and conducting Model UN events.
                        A comprehensive solution for administrators, presidium members, and delegates.
                    </p>
                </div>

                <!-- Email Subscription Form -->
                <div class="glass-modal rounded-2xl shadow-xl p-8 mb-8">
                    <h3 class="text-xl font-semibold glass-text mb-4">Stay in the Loop</h3>
                    <p class="glass-text-light mb-6">Be the first to know when we launch!</p>

                    <form @submit.prevent="handleSubscription" class="space-y-4">
                        <div class="flex flex-col sm:flex-row gap-4">
                            <input 
                                type="email" 
                                v-model="email" 
                                placeholder="Enter your email address" 
                                required
                                class="flex-1 px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-un-blue focus:border-un-blue outline-none transition-colors glass-text bg-white/20 backdrop-blur-sm"
                            />
                            <button 
                                type="submit" 
                                :disabled="isSubmitting"
                                class="px-8 py-3 bg-un-blue text-white font-medium rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-un-blue focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed glass-button"
                            >
                                {{ isSubmitting ? 'Subscribing...' : 'Notify Me' }}
                            </button>
                        </div>
                        <div v-if="message" :class="['text-sm', messageType === 'success' ? 'text-green-600' : 'text-red-600']">
                            {{ message }}
                        </div>
                    </form>
                </div>

                <!-- Features Preview -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div class="glass-feature-card text-center">
                        <div class="bg-un-blue/10 rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-un-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
                                </path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Admin Dashboard</h4>
                        <p class="text-sm glass-text-light">Comprehensive event and committee management</p>
                    </div>

                    <div class="glass-feature-card text-center">
                        <div class="bg-un-blue/10 rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-un-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                </path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Digital Resolutions</h4>
                        <p class="text-sm glass-text-light">Submit and manage resolutions electronically</p>
                    </div>

                    <div class="glass-feature-card text-center">
                        <div class="bg-un-blue/10 rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-un-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z">
                                </path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Real-time Voting</h4>
                        <p class="text-sm glass-text-light">Live voting and results tracking</p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="mt-8 flex justify-center gap-x-4">
                    <router-link to="/login" class="btn btn-primary glass-button">
                        Admin/Presidium Login
                    </router-link>
                    <router-link to="/delegate/auth" class="btn btn-outline glass-button">
                        Delegate Access
                    </router-link>
                </div>
            </div>

            <!-- Footer -->
            <footer class="mt-auto py-8 text-center">
                <div class="flex items-center justify-center space-x-6 mb-4">
                    <a href="mailto:support@mun.uz" class="text-gray-500 hover:text-un-blue transition-colors glass-button p-2 rounded-full">
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z">
                            </path>
                            <path
                                d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z">
                            </path>
                        </svg>
                    </a>
                </div>
                <p class="text-sm glass-text-light">
                    &copy; {{ currentYear }} MUN.UZ. All rights reserved.
                </p>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const email = ref('')
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('')

const currentYear = computed(() => new Date().getFullYear())

async function handleSubscription() {
    if (!email.value.trim()) {
        showMessage('Please enter your email address.', 'error')
        return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value)) {
        showMessage('Please enter a valid email address.', 'error')
        return
    }

    isSubmitting.value = true

    try {
        // Simulate API call - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        showMessage('Thank you for subscribing! We\'ll notify you when we launch.', 'success')
        email.value = ''
    } catch (error) {
        console.error('Subscription error:', error)
        showMessage('Network error. Please try again.', 'error')
    } finally {
        isSubmitting.value = false
    }
}

function showMessage(msg, type) {
    message.value = msg
    messageType.value = type

    if (type === 'success') {
        setTimeout(() => {
            message.value = ''
        }, 5000)
    }
}

onMounted(() => {
    // Add parallax effect for the floating logo
    let ticking = false

    function updateFloat() {
        const scrolled = window.pageYOffset
        const parallax = document.querySelector('.animate-float')
        if (parallax) {
            const speed = scrolled * 0.5
            parallax.style.transform = `translateY(${speed}px)`
        }
        ticking = false
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateFloat)
            ticking = true
        }
    }

    window.addEventListener('scroll', requestTick)

    // Cleanup on unmount
    return () => {
        window.removeEventListener('scroll', requestTick)
    }
})
</script>
</template>