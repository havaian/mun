<template>
    <div class="min-h-screen bg-mun-gray-50">
        <!-- Dynamic Layout Wrapper -->
        <component :is="layoutComponent">
            <div class="max-w-4xl mx-auto p-6">
                <!-- Page Header -->
                <div class="mb-8">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-2xl font-bold text-mun-gray-900">Profile Settings</h1>
                            <p class="text-mun-gray-600 mt-1">Manage your account settings and preferences</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-un-blue rounded-xl flex items-center justify-center">
                                <span class="text-white text-lg font-semibold">
                                    {{ getUserInitials() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Tabs -->
                <div class="mb-6">
                    <div class="border-b border-mun-gray-200">
                        <nav class="-mb-px flex space-x-8">
                            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === tab.id
                                    ? 'border-un-blue text-un-blue'
                                    : 'border-transparent text-mun-gray-500 hover:text-mun-gray-700 hover:border-mun-gray-300'
                            ]">
                                <component :is="tab.icon" class="w-5 h-5 inline mr-2" />
                                {{ tab.name }}
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="space-y-6">
                    <!-- Personal Information Tab -->
                    <div v-if="activeTab === 'personal'" class="mun-card p-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Personal Information</h3>

                        <form @submit.prevent="updatePersonalInfo" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input v-model="profileData.fullName" type="text" class="mun-input"
                                        :class="{ 'border-red-500': errors.fullName }"
                                        placeholder="Enter your full name" />
                                    <p v-if="errors.fullName" class="mt-1 text-sm text-red-600">
                                        {{ errors.fullName }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input v-model="profileData.email" type="email" class="mun-input"
                                        :class="{ 'border-red-500': errors.email }" placeholder="Enter your email" />
                                    <p v-if="errors.email" class="mt-1 text-sm text-red-600">
                                        {{ errors.email }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input v-model="profileData.phone" type="tel" class="mun-input"
                                        placeholder="Enter your phone number" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Country/Organization
                                    </label>
                                    <input v-model="profileData.country" type="text" class="mun-input"
                                        :readonly="authStore.user?.role === 'delegate'"
                                        :class="{ 'bg-mun-gray-50': authStore.user?.role === 'delegate' }"
                                        placeholder="Your country or organization" />
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Bio
                                    </label>
                                    <textarea v-model="profileData.bio" rows="4" class="mun-input"
                                        placeholder="Tell us about yourself..."></textarea>
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <AppButton type="submit" :loading="isUpdatingPersonal"
                                    class="bg-un-blue hover:bg-un-blue-600">
                                    Save Changes
                                </AppButton>
                            </div>
                        </form>
                    </div>

                    <!-- Account Settings Tab -->
                    <div v-if="activeTab === 'account'" class="mun-card p-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Account Settings</h3>

                        <form @submit.prevent="updateAccountSettings" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input v-model="accountData.username" type="text" class="mun-input"
                                        :class="{ 'border-red-500': errors.username }" placeholder="Enter username" />
                                    <p v-if="errors.username" class="mt-1 text-sm text-red-600">
                                        {{ errors.username }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Preferred Language
                                    </label>
                                    <select v-model="accountData.language" class="mun-input">
                                        <option value="en">English</option>
                                        <option value="fr">Français</option>
                                        <option value="es">Español</option>
                                        <option value="ar">العربية</option>
                                        <option value="ru">Русский</option>
                                        <option value="zh">中文</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Time Zone
                                    </label>
                                    <select v-model="accountData.timezone" class="mun-input">
                                        <option value="Asia/Tashkent">Asia/Tashkent (GMT+5)</option>
                                        <option value="UTC">UTC (GMT+0)</option>
                                        <option value="America/New_York">Eastern Time (GMT-5)</option>
                                        <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                                        <option value="Europe/London">London (GMT+0)</option>
                                        <option value="Europe/Paris">Paris (GMT+1)</option>
                                        <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Date Format
                                    </label>
                                    <select v-model="accountData.dateFormat" class="mun-input">
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <AppButton type="submit" :loading="isUpdatingAccount"
                                    class="bg-un-blue hover:bg-un-blue-600">
                                    Save Settings
                                </AppButton>
                            </div>
                        </form>
                    </div>

                    <!-- Security Tab -->
                    <div v-if="activeTab === 'security'" class="space-y-6">
                        <!-- Change Password -->
                        <div class="mun-card p-6">
                            <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Change Password</h3>

                            <form @submit.prevent="changePassword" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <input v-model="passwordData.currentPassword" type="password" class="mun-input"
                                        :class="{ 'border-red-500': errors.currentPassword }"
                                        placeholder="Enter current password" />
                                    <p v-if="errors.currentPassword" class="mt-1 text-sm text-red-600">
                                        {{ errors.currentPassword }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input v-model="passwordData.newPassword" type="password" class="mun-input"
                                        :class="{ 'border-red-500': errors.newPassword }"
                                        placeholder="Enter new password" />
                                    <p v-if="errors.newPassword" class="mt-1 text-sm text-red-600">
                                        {{ errors.newPassword }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input v-model="passwordData.confirmPassword" type="password" class="mun-input"
                                        :class="{ 'border-red-500': errors.confirmPassword }"
                                        placeholder="Confirm new password" />
                                    <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
                                        {{ errors.confirmPassword }}
                                    </p>
                                </div>

                                <div class="flex justify-end">
                                    <AppButton type="submit" :loading="isChangingPassword"
                                        class="bg-un-blue hover:bg-un-blue-600">
                                        Change Password
                                    </AppButton>
                                </div>
                            </form>
                        </div>

                        <!-- Two-Factor Authentication -->
                        <div class="mun-card p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-mun-gray-900">Two-Factor Authentication</h3>
                                    <p class="text-sm text-mun-gray-600">Add an extra layer of security to your account
                                    </p>
                                </div>
                                <div class="flex items-center">
                                    <span :class="[
                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                        accountData.twoFactorEnabled
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    ]">
                                        {{ accountData.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <AppButton @click="toggle2FA" :loading="isToggling2FA" :class="[
                                    accountData.twoFactorEnabled
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                ]">
                                    {{ accountData.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA' }}
                                </AppButton>
                            </div>
                        </div>
                    </div>

                    <!-- Notifications Tab -->
                    <div v-if="activeTab === 'notifications'" class="mun-card p-6">
                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Notification Preferences</h3>

                        <form @submit.prevent="updateNotificationSettings" class="space-y-6">
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-mun-gray-900">Email Notifications</label>
                                        <p class="text-sm text-mun-gray-500">Receive updates via email</p>
                                    </div>
                                    <input v-model="notificationData.emailEnabled" type="checkbox"
                                        class="mun-checkbox" />
                                </div>

                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-mun-gray-900">Session Updates</label>
                                        <p class="text-sm text-mun-gray-500">Get notified about session changes</p>
                                    </div>
                                    <input v-model="notificationData.sessionUpdates" type="checkbox"
                                        class="mun-checkbox" />
                                </div>

                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-mun-gray-900">Document Updates</label>
                                        <p class="text-sm text-mun-gray-500">Notifications for document submissions</p>
                                    </div>
                                    <input v-model="notificationData.documentUpdates" type="checkbox"
                                        class="mun-checkbox" />
                                </div>

                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-mun-gray-900">Voting
                                            Notifications</label>
                                        <p class="text-sm text-mun-gray-500">Alerts for voting sessions</p>
                                    </div>
                                    <input v-model="notificationData.votingNotifications" type="checkbox"
                                        class="mun-checkbox" />
                                </div>

                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="text-sm font-medium text-mun-gray-900">Message
                                            Notifications</label>
                                        <p class="text-sm text-mun-gray-500">New message alerts</p>
                                    </div>
                                    <input v-model="notificationData.messageNotifications" type="checkbox"
                                        class="mun-checkbox" />
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <AppButton type="submit" :loading="isUpdatingNotifications"
                                    class="bg-un-blue hover:bg-un-blue-600">
                                    Save Preferences
                                </AppButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </component>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    UserIcon,
    CogIcon,
    ShieldCheckIcon,
    BellIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const toast = useToast()

// State
const activeTab = ref('personal')
const isUpdatingPersonal = ref(false)
const isUpdatingAccount = ref(false)
const isChangingPassword = ref(false)
const isToggling2FA = ref(false)
const isUpdatingNotifications = ref(false)
const errors = ref({})

// Computed layout component based on user role
const layoutComponent = computed(() => {
    switch (authStore.user?.role) {
        case 'admin':
            return () => import('@/layouts/AdminLayout.vue')
        case 'presidium':
            return () => import('@/layouts/PresidiumLayout.vue')
        case 'delegate':
            return () => import('@/layouts/DelegateLayout.vue')
        default:
            return 'div' // fallback
    }
})

// Tab configuration
const tabs = [
    { id: 'personal', name: 'Personal Info', icon: UserIcon },
    { id: 'account', name: 'Account', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon }
]

// Form data
const profileData = reactive({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    bio: ''
})

const accountData = reactive({
    username: '',
    language: 'en',
    timezone: 'Asia/Tashkent',
    dateFormat: 'DD/MM/YYYY',
    twoFactorEnabled: false
})

const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const notificationData = reactive({
    emailEnabled: true,
    sessionUpdates: true,
    documentUpdates: true,
    votingNotifications: true,
    messageNotifications: true
})

// Methods
const getUserInitials = () => {
    const user = authStore.user
    if (user?.fullName) {
        return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return user?.username?.charAt(0).toUpperCase() || 'U'
}

const loadProfileData = async () => {
    try {
        // Load user profile data from API
        const response = await apiMethods.get('/user/profile')

        // Update form data
        Object.assign(profileData, response.data.profile || {})
        Object.assign(accountData, response.data.account || {})
        Object.assign(notificationData, response.data.notifications || {})

    } catch (error) {
        console.error('Failed to load profile data:', error)
        toast.error('Failed to load profile data')
    }
}

const validatePersonalInfo = () => {
    errors.value = {}

    if (!profileData.fullName.trim()) {
        errors.value.fullName = 'Full name is required'
    }

    if (!profileData.email.trim()) {
        errors.value.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(profileData.email)) {
        errors.value.email = 'Please enter a valid email address'
    }

    return Object.keys(errors.value).length === 0
}

const updatePersonalInfo = async () => {
    if (!validatePersonalInfo()) return

    try {
        isUpdatingPersonal.value = true

        await apiMethods.put('/user/profile', {
            profile: profileData
        })

        // Update auth store
        authStore.updateUser({
            fullName: profileData.fullName,
            email: profileData.email
        })

        toast.success('Profile updated successfully')

    } catch (error) {
        console.error('Failed to update profile:', error)
        toast.error('Failed to update profile')
    } finally {
        isUpdatingPersonal.value = false
    }
}

const updateAccountSettings = async () => {
    try {
        isUpdatingAccount.value = true

        await apiMethods.put('/user/account', {
            account: accountData
        })

        toast.success('Account settings updated successfully')

    } catch (error) {
        console.error('Failed to update account settings:', error)
        toast.error('Failed to update account settings')
    } finally {
        isUpdatingAccount.value = false
    }
}

const validatePassword = () => {
    errors.value = {}

    if (!passwordData.currentPassword) {
        errors.value.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
        errors.value.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
        errors.value.newPassword = 'Password must be at least 8 characters'
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
        errors.value.confirmPassword = 'Passwords do not match'
    }

    return Object.keys(errors.value).length === 0
}

const changePassword = async () => {
    if (!validatePassword()) return

    try {
        isChangingPassword.value = true

        await apiMethods.put('/user/password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        })

        // Clear form
        Object.keys(passwordData).forEach(key => {
            passwordData[key] = ''
        })

        toast.success('Password changed successfully')

    } catch (error) {
        console.error('Failed to change password:', error)
        toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
        isChangingPassword.value = false
    }
}

const toggle2FA = async () => {
    try {
        isToggling2FA.value = true

        const endpoint = accountData.twoFactorEnabled ? '/user/disable-2fa' : '/user/enable-2fa'
        await apiMethods.post(endpoint)

        accountData.twoFactorEnabled = !accountData.twoFactorEnabled

        toast.success(
            accountData.twoFactorEnabled
                ? 'Two-factor authentication enabled'
                : 'Two-factor authentication disabled'
        )

    } catch (error) {
        console.error('Failed to toggle 2FA:', error)
        toast.error('Failed to update two-factor authentication')
    } finally {
        isToggling2FA.value = false
    }
}

const updateNotificationSettings = async () => {
    try {
        isUpdatingNotifications.value = true

        await apiMethods.put('/user/notifications', {
            notifications: notificationData
        })

        toast.success('Notification preferences updated successfully')

    } catch (error) {
        console.error('Failed to update notifications:', error)
        toast.error('Failed to update notification preferences')
    } finally {
        isUpdatingNotifications.value = false
    }
}

// Initialize data on mount
onMounted(() => {
    // Set initial data from auth store
    const user = authStore.user
    if (user) {
        profileData.fullName = user.fullName || ''
        profileData.email = user.email || ''
        profileData.country = user.countryName || ''
        accountData.username = user.username || ''
        accountData.language = user.language || 'en'
    }

    // Load additional data from API
    loadProfileData()
})
</script>

<style scoped>
.mun-card {
    @apply bg-white rounded-xl shadow-sm border border-mun-gray-100;
}

.mun-input {
    @apply w-full px-4 py-3 border border-mun-gray-200 rounded-lg focus:ring-2 focus:ring-un-blue focus:border-un-blue transition-colors;
}

.mun-checkbox {
    @apply w-4 h-4 text-un-blue border-mun-gray-300 rounded focus:ring-un-blue focus:ring-2;
}
</style>