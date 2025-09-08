<template>
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <!-- Header -->
            <div class="text-center mb-8">
                <div
                    class="mx-auto w-16 h-16 bg-mun-green rounded-full flex items-center justify-center mb-4 animate-bounce-gentle">
                    <CheckCircleIcon class="w-8 h-8 text-white" />
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">
                    Complete Registration
                </h1>
                <p class="text-mun-gray-600">
                    QR code verified! Please provide your email to complete setup.
                </p>
            </div>

            <!-- Verification Success Card -->
            <div class="mun-card p-6 mb-6">
                <div class="text-center mb-6">
                    <div class="inline-flex items-center px-4 py-2 bg-mun-green-50 rounded-full">
                        <CheckCircleIcon class="w-5 h-5 text-mun-green-500 mr-2" />
                        <span class="text-sm font-medium text-mun-green-700">QR Code Verified</span>
                    </div>
                </div>

                <!-- User Information Display -->
                <div class="bg-un-blue-50 rounded-xl p-4 mb-6">
                    <h3 class="text-sm font-medium text-un-blue-800 mb-3">Verified Information:</h3>

                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-un-blue-600">Role:</span>
                            <span class="text-sm font-medium text-un-blue-800">
                                {{ formatUserType() }}
                            </span>
                        </div>

                        <div v-if="userInfo.committee" class="flex justify-between items-center">
                            <span class="text-sm text-un-blue-600">Committee:</span>
                            <span class="text-sm font-medium text-un-blue-800">
                                {{ userInfo.committee }}
                            </span>
                        </div>

                        <div v-if="userInfo.country" class="flex justify-between items-center">
                            <span class="text-sm text-un-blue-600">Country:</span>
                            <span class="text-sm font-medium text-un-blue-800">
                                {{ userInfo.country }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Email Binding Form -->
                <form @submit.prevent="handleEmailBinding" class="space-y-4">
                    <div>
                        <label for="email" class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Email Address *
                        </label>
                        <input id="email" v-model="emailForm.email" type="email" required class="input-field"
                            placeholder="Enter your email address" :disabled="authStore.isLoading"
                            autocomplete="email" />
                        <p class="mt-2 text-xs text-mun-gray-500">
                            You'll use this email for future logins
                        </p>
                    </div>

                    <div>
                        <label for="confirmEmail" class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Confirm Email Address *
                        </label>
                        <input id="confirmEmail" v-model="emailForm.confirmEmail" type="email" required
                            class="input-field" placeholder="Confirm your email address" :disabled="authStore.isLoading"
                            autocomplete="email" />
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="flex items-start space-x-3">
                        <input id="agreedToTerms" v-model="emailForm.agreedToTerms" type="checkbox" required
                            class="mt-1 h-4 w-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue"
                            :disabled="authStore.isLoading" />
                        <label for="agreedToTerms" class="text-sm text-mun-gray-600">
                            I agree to the
                            <a href="#" class="text-un-blue hover:text-un-blue-600 underline">
                                Terms of Service
                            </a>
                            and
                            <a href="#" class="text-un-blue hover:text-un-blue-600 underline">
                                Privacy Policy
                            </a>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <AppButton type="submit" variant="primary" size="lg" full-width :loading="authStore.isLoading"
                        :disabled="!isFormValid">
                        Complete Registration
                    </AppButton>
                </form>

                <!-- Security Notice -->
                <div class="mt-6 p-4 bg-mun-yellow-50 rounded-xl">
                    <div class="flex items-start">
                        <ShieldCheckIcon class="w-5 h-5 text-mun-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 class="text-sm font-medium text-mun-yellow-800">Security Notice</h4>
                            <p class="text-sm text-mun-yellow-700 mt-1">
                                Your QR code will be deactivated after email binding for security.
                                Use your email for future logins.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alternative Actions -->
            <div class="text-center">
                <AppButton variant="ghost" size="sm" :icon="ArrowLeftIcon" @click="goBack"
                    :disabled="authStore.isLoading">
                    Scan Different QR Code
                </AppButton>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import {
    CheckCircleIcon,
    ShieldCheckIcon,
    ArrowLeftIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// State
const userInfo = ref({
    token: '',
    userType: '',
    country: '',
    presidiumRole: '',
    committee: ''
})

const emailForm = reactive({
    email: '',
    confirmEmail: '',
    agreedToTerms: false
})

// Computed
const isFormValid = computed(() => {
    return emailForm.email &&
        emailForm.confirmEmail &&
        emailForm.email === emailForm.confirmEmail &&
        emailForm.agreedToTerms &&
        isValidEmail(emailForm.email)
})

// Methods
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const formatUserType = () => {
    if (userInfo.value.userType === 'delegate') {
        return 'Delegate'
    } else if (userInfo.value.userType === 'presidium') {
        const roleMap = {
            'chairman': 'Chairman',
            'co-chairman': 'Co-Chairman',
            'expert': 'Expert',
            'secretary': 'Secretary'
        }
        return roleMap[userInfo.value.presidiumRole] || 'Presidium Member'
    }
    return 'Unknown'
}

const handleEmailBinding = async () => {
    // Validate emails match
    if (emailForm.email !== emailForm.confirmEmail) {
        toast.error('Email addresses do not match')
        return
    }

    // Validate email format
    if (!isValidEmail(emailForm.email)) {
        toast.error('Please enter a valid email address')
        return
    }

    // Validate terms agreement
    if (!emailForm.agreedToTerms) {
        toast.error('Please agree to the terms and conditions')
        return
    }

    try {
        const result = await authStore.bindEmail(
            userInfo.value.token,
            emailForm.email.trim().toLowerCase()
        )

        if (result.success) {
            // Redirect to language selection or dashboard
            if (!authStore.user?.hasSelectedLanguage) {
                router.push({ name: 'LanguageSelection' })
            } else {
                router.push({ name: authStore.getDashboardRoute() })
            }
        }

    } catch (error) {
        console.error('Email binding error:', error)
        toast.error('Registration failed. Please try again.')
    }
}

const goBack = () => {
    router.push({ name: 'QRLogin' })
}

// Initialize component with route data
onMounted(() => {
    // Get user info from route query parameters
    userInfo.value = {
        token: route.query.token || '',
        userType: route.query.userType || '',
        country: route.query.country || '',
        presidiumRole: route.query.presidiumRole || '',
        committee: route.query.committee || ''
    }

    // Validate required data
    if (!userInfo.value.token) {
        toast.error('Invalid verification data. Please scan QR code again.')
        router.push({ name: 'QRLogin' })
        return
    }

    // Check if we have proper user type info
    if (!userInfo.value.userType) {
        toast.error('Missing user information. Please scan QR code again.')
        router.push({ name: 'QRLogin' })
        return
    }
})
</script>

<style scoped>
/* Fade in animation for the success state */
.animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Custom checkbox styling */
input[type="checkbox"]:checked {
    background-color: #009edb;
    border-color: #009edb;
}

input[type="checkbox"]:focus {
    ring-color: #009edb;
}
</style>