<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <PencilIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    Edit User
                                </h2>
                                <p class="text-white/80 text-sm">
                                    Update user information and settings
                                </p>
                            </div>
                        </div>

                        <button @click="closeModal"
                            class="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="overflow-y-auto max-h-[calc(90vh-200px)]">
                        <form @submit.prevent="handleSubmit" class="p-6 space-y-8">
                            <!-- User Overview -->
                            <div v-if="user" class="mun-card p-6 bg-gradient-to-r from-mun-gray-50 to-white">
                                <div class="flex items-center space-x-4">
                                    <div class="w-16 h-16 bg-mun-blue rounded-xl flex items-center justify-center">
                                        <span class="text-white text-xl font-semibold">
                                            {{ getUserInitials() }}
                                        </span>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-mun-gray-900">
                                            {{ user.fullName || `${user.firstName} ${user.lastName}` }}
                                        </h3>
                                        <p class="text-mun-gray-600">{{ user.email }}</p>
                                        <div class="flex items-center space-x-2 mt-1">
                                            <span :class="[
                                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                                getRoleClasses(user.role)
                                            ]">
                                                {{ formatRole(user.role) }}
                                            </span>
                                            <span :class="[
                                                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                                getStatusClasses(user.status)
                                            ]">
                                                {{ formatStatus(user.status) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-right text-sm text-mun-gray-500">
                                        <p>Member since {{ formatDate(user.createdAt) }}</p>
                                        <p>Last login {{ formatDate(user.lastLoginAt) }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Basic Information -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Basic Information
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <input v-model="formData.firstName" type="text" class="mun-input"
                                            :class="{ 'border-red-500': errors.firstName }"
                                            placeholder="Enter first name" maxlength="50" required />
                                        <p v-if="errors.firstName" class="mt-1 text-sm text-red-600">
                                            {{ errors.firstName }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <input v-model="formData.lastName" type="text" class="mun-input"
                                            :class="{ 'border-red-500': errors.lastName }" placeholder="Enter last name"
                                            maxlength="50" required />
                                        <p v-if="errors.lastName" class="mt-1 text-sm text-red-600">
                                            {{ errors.lastName }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input v-model="formData.email" type="email" class="mun-input"
                                            :class="{ 'border-red-500': errors.email }"
                                            placeholder="Enter email address" required />
                                        <p v-if="errors.email" class="mt-1 text-sm text-red-600">
                                            {{ errors.email }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Username *
                                        </label>
                                        <input v-model="formData.username" type="text" class="mun-input"
                                            :class="{ 'border-red-500': errors.username }" placeholder="Enter username"
                                            maxlength="30" required />
                                        <p v-if="errors.username" class="mt-1 text-sm text-red-600">
                                            {{ errors.username }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input v-model="formData.phone" type="tel" class="mun-input"
                                            placeholder="Enter phone number" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input v-model="formData.dateOfBirth" type="date" class="mun-input"
                                            :max="getMaxBirthDate()" />
                                    </div>
                                </div>
                            </div>

                            <!-- Role & Permissions -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <ShieldCheckIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Role & Permissions
                                </h3>

                                <div class="space-y-6">
                                    <!-- Role Selection -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-3">
                                            User Role *
                                        </label>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <label v-for="role in availableRoles" :key="role.value"
                                                class="relative cursor-pointer">
                                                <input v-model="formData.role" type="radio" :value="role.value"
                                                    class="sr-only" required />
                                                <div :class="[
                                                    'p-4 border-2 rounded-xl transition-all duration-200',
                                                    formData.role === role.value
                                                        ? 'border-mun-blue bg-mun-blue/5'
                                                        : 'border-mun-gray-200 hover:border-mun-gray-300'
                                                ]">
                                                    <div class="flex items-start space-x-3">
                                                        <component :is="role.icon" :class="[
                                                            'w-6 h-6 mt-0.5',
                                                            formData.role === role.value
                                                                ? 'text-mun-blue'
                                                                : 'text-mun-gray-500'
                                                        ]" />
                                                        <div class="flex-1">
                                                            <h4 class="font-medium text-mun-gray-900">{{ role.label }}
                                                            </h4>
                                                            <p class="text-sm text-mun-gray-600 mt-1">{{
                                                                role.description }}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- Presidium Role (if applicable) -->
                                    <div v-if="formData.role === 'presidium'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Presidium Role *
                                        </label>
                                        <select v-model="formData.presidiumRole" class="mun-input"
                                            :class="{ 'border-red-500': errors.presidiumRole }" required>
                                            <option value="">Select presidium role</option>
                                            <option value="chairman">Chairman</option>
                                            <option value="co-chairman">Co-Chairman</option>
                                            <option value="expert">Expert</option>
                                            <option value="secretary">Secretary</option>
                                        </select>
                                        <p v-if="errors.presidiumRole" class="mt-1 text-sm text-red-600">
                                            {{ errors.presidiumRole }}
                                        </p>
                                    </div>

                                    <!-- Country/Organization (for delegates) -->
                                    <div v-if="formData.role === 'delegate'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Country/Organization *
                                        </label>
                                        <select v-model="formData.country" class="mun-input"
                                            :class="{ 'border-red-500': errors.country }" required>
                                            <option value="">Select country or organization</option>
                                            <option v-for="country in availableCountries" :key="country.code"
                                                :value="country.code">
                                                {{ country.name }}
                                            </option>
                                        </select>
                                        <p v-if="errors.country" class="mt-1 text-sm text-red-600">
                                            {{ errors.country }}
                                        </p>
                                    </div>

                                    <!-- Committee Assignment -->
                                    <div v-if="formData.role !== 'admin'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Assignment
                                        </label>
                                        <select v-model="formData.committeeId" class="mun-input">
                                            <option value="">No committee assigned</option>
                                            <option v-for="committee in availableCommittees" :key="committee.id"
                                                :value="committee.id">
                                                {{ committee.name }} ({{ committee.acronym }})
                                            </option>
                                        </select>
                                    </div>

                                    <!-- Account Status -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Account Status
                                        </label>
                                        <select v-model="formData.status" class="mun-input">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Password Reset -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <KeyIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Password Management
                                </h3>

                                <div class="space-y-4">
                                    <div class="flex items-center justify-between p-4 bg-mun-gray-50 rounded-lg">
                                        <div>
                                            <h4 class="font-medium text-mun-gray-900">Reset Password</h4>
                                            <p class="text-sm text-mun-gray-600">Send password reset email to user</p>
                                        </div>
                                        <AppButton @click="sendPasswordReset" variant="outline" size="sm"
                                            :loading="isSendingReset">
                                            Send Reset Email
                                        </AppButton>
                                    </div>

                                    <div class="flex items-center justify-between p-4 bg-mun-gray-50 rounded-lg">
                                        <div>
                                            <h4 class="font-medium text-mun-gray-900">Force Password Change</h4>
                                            <p class="text-sm text-mun-gray-600">User must change password on next login
                                            </p>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input v-model="formData.requirePasswordChange" type="checkbox"
                                                class="sr-only peer" />
                                            <div
                                                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Account Settings -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Account Settings
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Preferred Language
                                        </label>
                                        <select v-model="formData.language" class="mun-input">
                                            <option value="en">English</option>
                                            <option value="fr">French</option>
                                            <option value="es">Spanish</option>
                                            <option value="ar">Arabic</option>
                                            <option value="ru">Russian</option>
                                            <option value="zh">Chinese</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <select v-model="formData.timezone" class="mun-input">
                                            <option value="Asia/Tashkent">Asia/Tashkent (GMT+5)</option>
                                            <option value="UTC">UTC (GMT+0)</option>
                                            <option value="America/New_York">Eastern Time (GMT-5)</option>
                                            <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                                            <option value="Europe/London">London (GMT+0)</option>
                                            <option value="Europe/Paris">Paris (GMT+1)</option>
                                            <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Information -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Additional Information
                                </h3>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Institution/Organization
                                        </label>
                                        <input v-model="formData.institution" type="text" class="mun-input"
                                            placeholder="e.g., University name, Organization" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Experience Level
                                        </label>
                                        <select v-model="formData.experienceLevel" class="mun-input">
                                            <option value="">Select experience level</option>
                                            <option value="beginner">Beginner (0-1 conferences)</option>
                                            <option value="intermediate">Intermediate (2-5 conferences)</option>
                                            <option value="advanced">Advanced (5+ conferences)</option>
                                            <option value="expert">Expert/Veteran</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Emergency Contact
                                        </label>
                                        <input v-model="formData.emergencyContact" type="text" class="mun-input"
                                            placeholder="Emergency contact name and phone" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Admin Notes
                                        </label>
                                        <textarea v-model="formData.adminNotes" rows="3" class="mun-input"
                                            placeholder="Internal notes for administrators (not visible to user)"></textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                        <div class="text-sm text-mun-gray-500">
                            Changes will be saved immediately and user will be notified
                        </div>

                        <div class="flex space-x-3">
                            <AppButton @click="closeModal" variant="outline" :disabled="isSubmitting">
                                Cancel
                            </AppButton>

                            <AppButton @click="handleSubmit" variant="primary" :loading="isSubmitting"
                                :disabled="!isFormValid">
                                <CheckIcon class="w-4 h-4 mr-2" />
                                Update User
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    PencilIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    KeyIcon,
    CogIcon,
    DocumentTextIcon,
    CheckIcon,
    UserIcon,
    UsersIcon,
    ShieldExclamationIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    user: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()

// State
const isSubmitting = ref(false)
const isSendingReset = ref(false)
const errors = ref({})
const availableCountries = ref([])
const availableCommittees = ref([])

// Available roles
const availableRoles = [
    {
        value: 'admin',
        label: 'Administrator',
        description: 'Full system access and management capabilities',
        icon: ShieldExclamationIcon
    },
    {
        value: 'presidium',
        label: 'Presidium Member',
        description: 'Committee leadership and session management',
        icon: UsersIcon
    },
    {
        value: 'delegate',
        label: 'Delegate',
        description: 'Participate in committee sessions and voting',
        icon: UserIcon
    }
]

// Form data
const formData = reactive({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    dateOfBirth: '',
    role: '',
    presidiumRole: '',
    country: '',
    committeeId: '',
    status: 'active',
    language: 'en',
    timezone: 'Asia/Tashkent',
    requirePasswordChange: false,
    institution: '',
    experienceLevel: '',
    emergencyContact: '',
    adminNotes: ''
})

// Computed
const isFormValid = computed(() => {
    return formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.username &&
        formData.role &&
        Object.keys(errors.value).length === 0
})

// Methods
const closeModal = () => {
    if (isSubmitting.value) return
    emit('update:modelValue', false)
}

const loadUserData = () => {
    if (props.user) {
        Object.keys(formData).forEach(key => {
            if (props.user[key] !== undefined) {
                formData[key] = props.user[key]
            }
        })
    }
}

const loadAvailableData = async () => {
    try {
        // Load countries
        const countriesResponse = await apiMethods.get('/admin/countries')
        availableCountries.value = countriesResponse.data.countries || []

        // Load committees
        const committeesResponse = await apiMethods.get('/admin/committees', {
            params: { status: 'active' }
        })
        availableCommittees.value = committeesResponse.data.committees || []

    } catch (error) {
        console.error('Failed to load available data:', error)
        toast.error('Failed to load form options')
    }
}

const getUserInitials = () => {
    if (props.user?.firstName && props.user?.lastName) {
        return `${props.user.firstName[0]}${props.user.lastName[0]}`.toUpperCase()
    }
    return props.user?.username?.charAt(0).toUpperCase() || 'U'
}

const formatRole = (role) => {
    const roleMap = {
        'admin': 'Administrator',
        'presidium': 'Presidium Member',
        'delegate': 'Delegate'
    }
    return roleMap[role] || role
}

const formatStatus = (status) => {
    const statusMap = {
        'active': 'Active',
        'inactive': 'Inactive',
        'suspended': 'Suspended',
        'pending': 'Pending'
    }
    return statusMap[status] || status
}

const getRoleClasses = (role) => {
    const classMap = {
        'admin': 'bg-red-100 text-red-800',
        'presidium': 'bg-blue-100 text-blue-800',
        'delegate': 'bg-green-100 text-green-800'
    }
    return classMap[role] || 'bg-gray-100 text-gray-800'
}

const getStatusClasses = (status) => {
    const classMap = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'suspended': 'bg-red-100 text-red-800',
        'pending': 'bg-yellow-100 text-yellow-800'
    }
    return classMap[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const getMaxBirthDate = () => {
    // 13 years ago (minimum age)
    const date = new Date()
    date.setFullYear(date.getFullYear() - 13)
    return date.toISOString().split('T')[0]
}

const validateForm = () => {
    errors.value = {}

    if (!formData.firstName.trim()) {
        errors.value.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
        errors.value.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
        errors.value.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.value.email = 'Please enter a valid email address'
    }

    if (!formData.username.trim()) {
        errors.value.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.value.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (!formData.role) {
        errors.value.role = 'User role is required'
    }

    if (formData.role === 'presidium' && !formData.presidiumRole) {
        errors.value.presidiumRole = 'Presidium role is required'
    }

    if (formData.role === 'delegate' && !formData.country) {
        errors.value.country = 'Country is required for delegates'
    }

    return Object.keys(errors.value).length === 0
}

const sendPasswordReset = async () => {
    try {
        isSendingReset.value = true

        await apiMethods.post(`/admin/users/${props.user.id}/reset-password`)

        toast.success('Password reset email sent successfully')

    } catch (error) {
        console.error('Failed to send password reset:', error)
        toast.error('Failed to send password reset email')
    } finally {
        isSendingReset.value = false
    }
}

const handleSubmit = async () => {
    if (!validateForm()) {
        toast.error('Please fix the errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        const response = await apiMethods.put(`/admin/users/${props.user.id}`, formData)

        emit('updated', response.data.user)
        toast.success('User updated successfully')
        closeModal()

    } catch (error) {
        console.error('Failed to update user:', error)

        if (error.response?.data?.errors) {
            errors.value = error.response.data.errors
        }

        toast.error(error.response?.data?.message || 'Failed to update user')
    } finally {
        isSubmitting.value = false
    }
}

// Watchers
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        loadUserData()
        loadAvailableData()
    }
})

watch(() => props.user, () => {
    loadUserData()
})

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        loadUserData()
        loadAvailableData()
    }
})
</script>

<style scoped>
.mun-card {
    @apply bg-white rounded-xl shadow-sm border border-mun-gray-100;
}

.mun-input {
    @apply w-full px-4 py-3 border border-mun-gray-200 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue transition-colors;
}

.mun-checkbox {
    @apply w-4 h-4 text-mun-blue border-mun-gray-300 rounded focus:ring-mun-blue focus:ring-2;
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>