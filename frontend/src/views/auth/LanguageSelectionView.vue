<template>
    <div class="min-h-screen flex items-center justify-center p-4 gradient-bg">
        <div class="w-full max-w-lg">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="mx-auto w-16 h-16 bg-mun-blue rounded-full flex items-center justify-center mb-4 shadow-mun">
                    <GlobeAltIcon class="w-8 h-8 text-white" />
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">
                    Select Your Language
                </h1>
                <p class="text-mun-gray-600">
                    Choose your preferred language for the MUN platform
                </p>
            </div>

            <!-- Welcome Message -->
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-mun border border-white/20 p-6 mb-6">
                <div class="text-center mb-6">
                    <CheckCircleIcon class="w-12 h-12 text-mun-green-500 mx-auto mb-3" />
                    <h2 class="text-lg font-semibold text-mun-gray-900 mb-2">
                        Welcome to MUN.UZ!
                    </h2>
                    <p class="text-sm text-mun-gray-600">
                        Registration completed successfully. Please select your preferred language to continue.
                    </p>
                </div>

                <!-- User Info Display -->
                <div v-if="authStore.user" class="bg-mun-gray-50 rounded-xl p-4 mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-mun-blue rounded-lg flex items-center justify-center">
                            <UserIcon v-if="authStore.user.role === 'delegate'" class="w-6 h-6 text-white" />
                            <ShieldCheckIcon v-else class="w-6 h-6 text-white" />
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-mun-gray-900">
                                {{ authStore.userDisplayName }}
                            </p>
                            <p class="text-sm text-mun-gray-600">
                                {{ getRoleDescription() }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Language Options -->
                <div class="space-y-4">
                    <h3 class="font-medium text-mun-gray-900 mb-3">Available Languages:</h3>

                    <div class="grid grid-cols-1 gap-3">
                        <button v-for="language in availableLanguages" :key="language.code"
                            @click="selectLanguage(language.code)" :class="[
                                'group relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
                                selectedLanguage === language.code
                                    ? 'border-mun-blue bg-mun-blue-50 shadow-mun'
                                    : 'border-mun-gray-200 hover:border-mun-blue-300 hover:bg-mun-gray-50'
                            ]" :disabled="isLoading">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <!-- Flag -->
                                    <div class="text-2xl">{{ language.flag }}</div>

                                    <!-- Language Info -->
                                    <div>
                                        <h4 class="font-medium text-mun-gray-900">
                                            {{ language.name }}
                                        </h4>
                                        <p class="text-sm text-mun-gray-500">
                                            {{ language.nativeName }}
                                        </p>
                                    </div>
                                </div>

                                <!-- Selection Indicator -->
                                <div :class="[
                                    'w-5 h-5 rounded-full border-2 transition-all duration-200',
                                    selectedLanguage === language.code
                                        ? 'border-mun-blue bg-mun-blue'
                                        : 'border-mun-gray-300 group-hover:border-mun-blue-300'
                                ]">
                                    <CheckIcon v-if="selectedLanguage === language.code"
                                        class="w-3 h-3 text-white m-0.5" />
                                </div>
                            </div>

                            <!-- Sample Text -->
                            <div v-if="language.sample" class="mt-3 pt-3 border-t border-mun-gray-200">
                                <p class="text-sm text-mun-gray-600 italic">
                                    "{{ language.sample }}"
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Language Selection Info -->
                <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div class="flex space-x-3">
                        <InformationCircleIcon class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div class="text-sm text-blue-800">
                            <p class="font-medium mb-1">Language Settings</p>
                            <p>You can change your language preference later in your profile settings. The platform will
                                remember your choice for future sessions.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-4">
                <AppButton variant="primary" size="lg" :loading="isLoading" :disabled="!selectedLanguage"
                    @click="continueWithLanguage" class="flex-1">
                    <ArrowRightIcon class="w-5 h-5 mr-2" />
                    Continue to Platform
                </AppButton>

                <AppButton variant="outline" size="lg" @click="skipLanguageSelection" :disabled="isLoading">
                    <ForwardIcon class="w-5 h-5 mr-2" />
                    Skip
                </AppButton>
            </div>

            <!-- Footer -->
            <div class="text-center mt-6">
                <p class="text-xs text-mun-gray-500">
                    Need help? Contact your presidium or event organizers.
                </p>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div class="bg-white rounded-2xl p-6 shadow-2xl">
                <LoadingSpinner size="lg" />
                <p class="mt-4 text-mun-gray-600 text-center">Setting up your preferences...</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/plugins/toast'
import {
    GlobeAltIcon,
    CheckCircleIcon,
    UserIcon,
    ShieldCheckIcon,
    CheckIcon,
    ArrowRightIcon,
    ForwardIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const toast = useToast()

// State
const isLoading = ref(false)
const selectedLanguage = ref('')

// Available languages with detailed info
const availableLanguages = ref([
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        sample: 'Welcome to the Model United Nations platform',
        rtl: false
    },
    {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        flag: '🇷🇺',
        sample: 'Добро пожаловать на платформу Модели ООН',
        rtl: false
    },
    {
        code: 'uz_lat',
        name: 'Uzbek (Latin)',
        nativeName: 'O\'zbekcha (Lotin)',
        flag: '🇺🇿',
        sample: 'Birlashgan Millatlar Tashkiloti modeliga xush kelibsiz',
        rtl: false
    },
    {
        code: 'uz_cyr',
        name: 'Uzbek (Cyrillic)',
        nativeName: 'Ўзбекча (Кирил)',
        flag: '🇺🇿',
        sample: 'Бирлашган Миллатлар Ташкилоти моделига хуш келибсиз',
        rtl: false
    }
])

// Computed
const defaultLanguage = computed(() => {
    // Try to detect user's preferred language
    const browserLang = navigator.language.toLowerCase()

    if (browserLang.startsWith('ru')) return 'ru'
    if (browserLang.startsWith('uz')) return 'uz_lat'

    return 'en' // Default to English
})

// Methods
const selectLanguage = (languageCode) => {
    selectedLanguage.value = languageCode
}

const getRoleDescription = () => {
    if (!authStore.user) return ''

    switch (authStore.user.role) {
        case 'admin':
            return 'Platform Administrator'
        case 'presidium':
            const role = authStore.user.presidiumRole
            const roleMap = {
                'chairman': 'Committee Chairman',
                'co-chairman': 'Committee Co-Chairman',
                'expert': 'Committee Expert',
                'secretary': 'Committee Secretary'
            }
            return roleMap[role] || 'Presidium Member'
        case 'delegate':
            return `Delegate representing ${authStore.user.countryName}`
        default:
            return 'Platform User'
    }
}

const continueWithLanguage = async () => {
    if (!selectedLanguage.value) {
        toast.error('Please select a language to continue')
        return
    }

    try {
        isLoading.value = true

        // Save language preference
        appStore.setLanguage(selectedLanguage.value)

        // Update user preferences on backend if needed
        try {
            await updateUserLanguagePreference(selectedLanguage.value)
        } catch (error) {
            console.warn('Failed to save language preference to backend:', error)
            // Continue anyway as language is saved locally
        }

        toast.success(`Language set to ${getLanguageName(selectedLanguage.value)}`)

        // Navigate to appropriate dashboard based on user role
        await navigateToUserDashboard()

    } catch (error) {
        console.error('Language selection error:', error)
        toast.error('Failed to set language preference')
    } finally {
        isLoading.value = false
    }
}

const skipLanguageSelection = async () => {
    try {
        isLoading.value = true

        // Use default language
        appStore.setLanguage(defaultLanguage.value)

        toast.info(`Using default language: ${getLanguageName(defaultLanguage.value)}`)

        // Navigate to appropriate dashboard
        await navigateToUserDashboard()

    } catch (error) {
        console.error('Skip language selection error:', error)
        toast.error('Navigation failed')
    } finally {
        isLoading.value = false
    }
}

const navigateToUserDashboard = async () => {
    const user = authStore.user

    if (!user) {
        router.push({ name: 'Login' })
        return
    }

    // Navigate based on user role
    switch (user.role) {
        case 'admin':
            router.push({ name: 'AdminDashboard' })
            break
        case 'presidium':
            router.push({ name: 'PresidiumDashboard' })
            break
        case 'delegate':
            router.push({ name: 'DelegateDashboard' })
            break
        default:
            router.push({ name: 'Login' })
    }
}

const updateUserLanguagePreference = async (languageCode) => {
    // This would call an API endpoint to save user's language preference
    // For now, we'll just store it locally via appStore
    return Promise.resolve()
}

const getLanguageName = (code) => {
    const language = availableLanguages.value.find(lang => lang.code === code)
    return language ? language.name : code
}

const detectUserLanguage = () => {
    // Try to detect based on user's location/browser settings
    const browserLang = navigator.language.toLowerCase()

    // Check if we support the detected language
    const supportedLang = availableLanguages.value.find(lang =>
        browserLang.startsWith(lang.code.split('_')[0])
    )

    if (supportedLang) {
        selectedLanguage.value = supportedLang.code
    } else {
        selectedLanguage.value = defaultLanguage.value
    }
}

// Lifecycle hooks
onMounted(() => {
    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
        router.push({ name: 'Login' })
        return
    }

    // Auto-detect user's preferred language
    detectUserLanguage()
})
</script>

<style scoped>
/* Gradient background */
.gradient-bg {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
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

/* Language selection animations */
.language-option {
    transition: all 0.2s ease;
}

.language-option:hover {
    transform: translateY(-1px);
}

/* Selection indicator animation */
.selection-indicator {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>