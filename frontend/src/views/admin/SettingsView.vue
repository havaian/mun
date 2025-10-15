<template>
    <div class="min-h-screen bg-mun-gray-50">
        <!-- Header -->
        <div class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-mun-gray-900">System Settings</h1>
                        <p class="mt-1 text-sm text-mun-gray-600">
                            Configure system-wide settings and preferences
                        </p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button @click="saveAllSettings" :disabled="isSaving || !hasUnsavedChanges"
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mun-blue-600 hover:bg-mun-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue disabled:opacity-50">
                            <CheckIcon class="h-4 w-4 mr-2" />
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Settings Navigation -->
                <div class="lg:col-span-1">
                    <nav class="space-y-1">
                        <button v-for="section in settingSections" :key="section.id" @click="activeSection = section.id"
                            :class="[
                                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                activeSection === section.id
                                    ? 'bg-mun-blue-600 text-white'
                                    : 'text-mun-gray-900 hover:bg-mun-gray-100'
                            ]">
                            <component :is="section.icon" class="h-5 w-5 mr-3" />
                            {{ section.name }}
                        </button>
                    </nav>
                </div>

                <!-- Settings Content -->
                <div class="lg:col-span-3">
                    <!-- General Settings -->
                    <div v-if="activeSection === 'general'" class="space-y-6">
                        <div class="mun-card bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-medium text-mun-gray-900 mb-4">General Configuration</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        System Name
                                    </label>
                                    <input v-model="settings.general.systemName" type="text"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Default Language
                                    </label>
                                    <SleekSelect v-model="settings.general.defaultLanguage" :options="[
                                        { label: 'English', value: 'en' },
                                        { label: 'Russian', value: 'ru' },
                                        { label: 'Uzbek (Latin)', value: 'uz_lat' },
                                        { label: 'Uzbek (Cyrillic)', value: 'uz_cyr' }
                                    ]" placeholder="Select language" />

                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Session Timeout (minutes)
                                    </label>
                                    <input v-model.number="settings.general.sessionTimeout" type="number" min="5"
                                        max="480"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Max File Upload Size (MB)
                                    </label>
                                    <input v-model.number="settings.general.maxFileSize" type="number" min="1" max="100"
                                        class="input-field block w-full" />
                                </div>
                            </div>

                            <div class="mt-6">
                                <label class="flex items-center">
                                    <input v-model="settings.general.maintenanceMode" type="checkbox"
                                        class="input-field" />
                                    <span class="ml-2 text-sm text-gray-700">Enable maintenance mode</span>
                                </label>
                                <p class="mt-1 text-xs text-gray-500">
                                    When enabled, only administrators can access the system
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Authentication Settings -->
                    <div v-if="activeSection === 'auth'" class="space-y-6">
                        <div class="mun-card bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Authentication Settings</h3>

                            <div class="space-y-6">
                                <div>
                                    <label class="flex items-center">
                                        <input v-model="settings.auth.requireEmailVerification" type="checkbox"
                                            class="input-field" />
                                        <span class="ml-2 text-sm text-gray-700">Require email verification</span>
                                    </label>
                                </div>

                                <div>
                                    <label class="flex items-center">
                                        <input v-model="settings.auth.enableQRLogin" type="checkbox"
                                            class="input-field" />
                                        <span class="ml-2 text-sm text-gray-700">Enable QR code login</span>
                                    </label>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        QR Token Expiry (hours)
                                    </label>
                                    <input v-model.number="settings.auth.qrTokenExpiry" type="number" min="1" max="168"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Max Login Attempts
                                    </label>
                                    <input v-model.number="settings.auth.maxLoginAttempts" type="number" min="3"
                                        max="10"
                                        class="input-field block w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Email Settings -->
                    <div v-if="activeSection === 'email'" class="space-y-6">
                        <div class="mun-card bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Email Configuration</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        SMTP Host
                                    </label>
                                    <input v-model="settings.email.smtpHost" type="text"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        SMTP Port
                                    </label>
                                    <input v-model.number="settings.email.smtpPort" type="number"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        From Email
                                    </label>
                                    <input v-model="settings.email.fromEmail" type="email"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        From Name
                                    </label>
                                    <input v-model="settings.email.fromName" type="text"
                                        class="input-field block w-full" />
                                </div>
                            </div>

                            <div class="mt-6">
                                <label class="flex items-center">
                                    <input v-model="settings.email.enableSSL" type="checkbox"
                                        class="input-field" />
                                    <span class="ml-2 text-sm text-gray-700">Enable SSL/TLS</span>
                                </label>
                            </div>

                            <div class="mt-6">
                                <button @click="testEmailSettings" :disabled="isTestingEmail"
                                    class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue disabled:opacity-50">
                                    {{ isTestingEmail ? 'Testing...' : 'Test Email Settings' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Security Settings -->
                    <div v-if="activeSection === 'security'" class="space-y-6">
                        <div class="mun-card bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Security Configuration</h3>

                            <div class="space-y-6">
                                <div>
                                    <label class="flex items-center">
                                        <input v-model="settings.security.enableTwoFactor" type="checkbox"
                                            class="input-field" />
                                        <span class="ml-2 text-sm text-gray-700">Enable two-factor authentication</span>
                                    </label>
                                </div>

                                <div>
                                    <label class="flex items-center">
                                        <input v-model="settings.security.enforceHTTPS" type="checkbox"
                                            class="input-field" />
                                        <span class="ml-2 text-sm text-gray-700">Enforce HTTPS connections</span>
                                    </label>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Password Minimum Length
                                    </label>
                                    <input v-model.number="settings.security.passwordMinLength" type="number" min="6"
                                        max="32"
                                        class="input-field block w-full" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Rate Limit (requests per minute)
                                    </label>
                                    <input v-model.number="settings.security.rateLimit" type="number" min="10"
                                        max="1000"
                                        class="input-field block w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- System Maintenance -->
                    <div v-if="activeSection === 'system'" class="space-y-6">
                        <div class="mun-card bg-white shadow rounded-lg p-6">
                            <h3 class="text-lg font-medium text-mun-gray-900 mb-4">System Maintenance</h3>

                            <div class="space-y-6">
                                <div class="border border-yellow-200 rounded-md p-4 bg-yellow-50">
                                    <div class="flex">
                                        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
                                        <div class="ml-3">
                                            <h3 class="text-sm font-medium text-yellow-800">Cache Management</h3>
                                            <div class="mt-2 text-sm text-yellow-700">
                                                <p>Clear system caches to improve performance. This action cannot be
                                                    undone.</p>
                                            </div>
                                            <div class="mt-4">
                                                <button @click="clearCaches" :disabled="isClearingCache"
                                                    class="bg-yellow-50 text-yellow-800 hover:bg-yellow-100 font-medium py-2 px-4 rounded border border-yellow-200 disabled:opacity-50">
                                                    {{ isClearingCache ? 'Clearing...' : 'Clear All Caches' }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="border border-red-200 rounded-md p-4 bg-red-50">
                                    <div class="flex">
                                        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
                                        <div class="ml-3">
                                            <h3 class="text-sm font-medium text-red-800">Database Backup</h3>
                                            <div class="mt-2 text-sm text-red-700">
                                                <p>Create a backup of the entire database. This may take several
                                                    minutes.</p>
                                            </div>
                                            <div class="mt-4">
                                                <button @click="createBackup" :disabled="isCreatingBackup"
                                                    class="bg-red-50 text-red-800 hover:bg-red-100 font-medium py-2 px-4 rounded border border-red-200 disabled:opacity-50">
                                                    {{ isCreatingBackup ? 'Creating Backup...' : 'Create Database Backup' }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    CogIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    LockClosedIcon,
    ServerIcon,
    CheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const toast = useToast()

// State
const activeSection = ref('general')
const isSaving = ref(false)
const isTestingEmail = ref(false)
const isClearingCache = ref(false)
const isCreatingBackup = ref(false)
const originalSettings = ref({})

// Settings sections
const settingSections = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'auth', name: 'Authentication', icon: ShieldCheckIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
    { id: 'system', name: 'System', icon: ServerIcon }
]

// Settings data
const settings = ref({
    general: {
        systemName: 'MUN.UZ',
        defaultLanguage: 'en',
        sessionTimeout: 30,
        maxFileSize: 10,
        maintenanceMode: false
    },
    auth: {
        requireEmailVerification: true,
        enableQRLogin: true,
        qrTokenExpiry: 24,
        maxLoginAttempts: 5
    },
    email: {
        smtpHost: '',
        smtpPort: 587,
        fromEmail: '',
        fromName: 'MUN.UZ System',
        enableSSL: true
    },
    security: {
        enableTwoFactor: false,
        enforceHTTPS: true,
        passwordMinLength: 8,
        rateLimit: 100
    }
})

// Computed
const hasUnsavedChanges = computed(() => {
    return JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value)
})

// Methods
const loadSettings = async () => {
    try {
        const response = await apiMethods.get('/admin/settings')
        if (response?.data?.success) {
            settings.value = { ...settings.value, ...response.data.settings }
            originalSettings.value = JSON.parse(JSON.stringify(settings.value))
        }
    } catch (error) {
        toast.error('Failed to load settings:', error)
        // Keep default values on error
        originalSettings.value = JSON.parse(JSON.stringify(settings.value))
    }
}

const saveAllSettings = async () => {
    isSaving.value = true
    try {
        const response = await apiMethods.put('/admin/settings', {
            settings: settings.value
        })

        if (response?.data?.success) {
            originalSettings.value = JSON.parse(JSON.stringify(settings.value))
            toast.success('Settings saved successfully')
        }
    } catch (error) {
        toast.error('Failed to save settings:', error)
        toast.error('Failed to save settings')
    } finally {
        isSaving.value = false
    }
}

const testEmailSettings = async () => {
    isTestingEmail.value = true
    try {
        const response = await apiMethods.post('/admin/settings/test-email', {
            emailSettings: settings.value.email
        })

        if (response?.data?.success) {
            toast.success('Test email sent successfully')
        }
    } catch (error) {
        toast.error('Failed to test email:', error)
        toast.error('Failed to send test email')
    } finally {
        isTestingEmail.value = false
    }
}

const clearCaches = async () => {
    isClearingCache.value = true
    try {
        const response = await apiMethods.post('/admin/system/clear-cache')

        if (response?.data?.success) {
            toast.success('System caches cleared successfully')
        }
    } catch (error) {
        toast.error('Failed to clear caches:', error)
        toast.error('Failed to clear system caches')
    } finally {
        isClearingCache.value = false
    }
}

const createBackup = async () => {
    isCreatingBackup.value = true
    try {
        const response = await apiMethods.post('/admin/maintenance/backup')

        if (response?.data?.success) {
            toast.success('Database backup initiated successfully')
        }
    } catch (error) {
        toast.error('Failed to create backup:', error)
        toast.error('Failed to create database backup')
    } finally {
        isCreatingBackup.value = false
    }
}

// Watch for unsaved changes and warn user
let hasWarned = false
watch(hasUnsavedChanges, (newValue) => {
    if (newValue && !hasWarned) {
        hasWarned = true
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges.value) {
                e.preventDefault()
                e.returnValue = ''
            }
        })
    }
})

// Lifecycle
onMounted(() => {
    loadSettings()
})
</script>

<style scoped>
/* Component is styled using Tailwind utility classes */
</style>