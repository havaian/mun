<template>
    <div class="min-h-screen bg-gradient-mun">
        <div class="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-mun-gray-900">Profile</h1>
                    <p class="text-sm text-mun-gray-500 mt-1">Manage your account details</p>
                </div>
                <button @click="goBack" class="text-sm text-mun-gray-500 hover:text-mun-gray-700">← Back</button>
            </div>

            <!-- Profile form -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                <h2 class="text-lg font-semibold text-mun-gray-900">Personal Information</h2>

                <form @submit.prevent="handleSaveProfile" class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">First Name</label>
                            <input v-model="profileForm.firstName" type="text" required class="input-field" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Last Name</label>
                            <input v-model="profileForm.lastName" type="text" required class="input-field" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Email</label>
                        <input :value="authStore.user?.email" type="email" disabled
                            class="input-field bg-mun-gray-50 cursor-not-allowed" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Phone</label>
                        <input v-model="profileForm.phone" type="tel" class="input-field" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Institution</label>
                        <input v-model="profileForm.institution" type="text" class="input-field" />
                    </div>

                    <div class="flex justify-end pt-2">
                        <AppButton type="submit" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </AppButton>
                    </div>
                </form>
            </div>

            <!-- Change password -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                <h2 class="text-lg font-semibold text-mun-gray-900">Change Password</h2>

                <form @submit.prevent="handleChangePassword" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Current Password</label>
                        <input v-model="passwordForm.currentPassword" type="password" required class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">New Password</label>
                        <input v-model="passwordForm.newPassword" type="password" required minlength="8"
                            class="input-field" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Confirm New Password</label>
                        <input v-model="passwordForm.confirmPassword" type="password" required minlength="8"
                            class="input-field" />
                    </div>

                    <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>

                    <div class="flex justify-end pt-2">
                        <AppButton type="submit" :disabled="isChangingPassword">
                            {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
                        </AppButton>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isSaving = ref(false)
const isChangingPassword = ref(false)
const passwordError = ref(null)

const profileForm = reactive({
    firstName: '',
    lastName: '',
    phone: '',
    institution: '',
})

const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})

onMounted(() => {
    if (authStore.user) {
        profileForm.firstName = authStore.user.firstName || ''
        profileForm.lastName = authStore.user.lastName || ''
        profileForm.phone = authStore.user.phone || ''
        profileForm.institution = authStore.user.institution || ''
    }
})

const handleSaveProfile = async () => {
    isSaving.value = true
    await authStore.updateProfile(profileForm)
    isSaving.value = false
}

const handleChangePassword = async () => {
    passwordError.value = null

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        passwordError.value = 'Passwords do not match'
        return
    }

    isChangingPassword.value = true
    const result = await authStore.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
    )

    if (result.success) {
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
    } else {
        passwordError.value = result.error
    }

    isChangingPassword.value = false
}

const goBack = () => {
    if (window.history.length > 2) {
        router.go(-1)
    } else {
        router.push(authStore.getDefaultRoute())
    }
}
</script>