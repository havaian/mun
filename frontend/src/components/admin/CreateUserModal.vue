<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-un-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <UserPlusIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    Create New User
                                </h2>
                                <p class="text-white/80 text-sm">
                                    Add a new user to the MUN platform
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
                            <!-- Basic Information -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <InformationCircleIcon class="w-5 h-5 mr-2 text-un-blue" />
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
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Username must be unique and contain only letters, numbers, and underscores
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
                                    <ShieldCheckIcon class="w-5 h-5 mr-2 text-un-blue" />
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
                                                        ? 'border-un-blue bg-un-blue/5'
                                                        : 'border-mun-gray-200 hover:border-mun-gray-300'
                                                ]">
                                                    <div class="flex items-start space-x-3">
                                                        <component :is="role.icon" :class="[
                                                            'w-6 h-6 mt-0.5',
                                                            formData.role === role.value
                                                                ? 'text-un-blue'
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
                                        <p v-if="errors.role" class="mt-2 text-sm text-red-600">
                                            {{ errors.role }}
                                        </p>
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
                                        <select v-model="formData.committeeId" class="mun-input"
                                            :class="{ 'border-red-500': errors.committeeId }">
                                            <option value="">No committee assigned</option>
                                            <option v-for="committee in availableCommittees" :key="committee.id"
                                                :value="committee.id">
                                                {{ committee.name }} ({{ committee.acronym }})
                                            </option>
                                        </select>
                                        <p v-if="errors.committeeId" class="mt-1 text-sm text-red-600">
                                            {{ errors.committeeId }}
                                        </p>
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Committee can be assigned later if not selected now
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Account Settings -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-un-blue" />
                                    Account Settings
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Password *
                                        </label>
                                        <input v-model="formData.password" type="password" class="mun-input"
                                            :class="{ 'border-red-500': errors.password }" placeholder="Enter password"
                                            minlength="8" required />
                                        <p v-if="errors.password" class="mt-1 text-sm text-red-600">
                                            {{ errors.password }}
                                        </p>
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Password must be at least 8 characters long
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Confirm Password *
                                        </label>
                                        <input v-model="formData.confirmPassword" type="password" class="mun-input"
                                            :class="{ 'border-red-500': errors.confirmPassword }"
                                            placeholder="Confirm password" required />
                                        <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
                                            {{ errors.confirmPassword }}
                                        </p>
                                    </div>

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

                                <!-- Account Options -->
                                <div class="mt-6">
                                    <h4 class="text-sm font-medium text-mun-gray-700 mb-3">Account Options</h4>
                                    <div class="space-y-3">
                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.sendWelcomeEmail" type="checkbox"
                                                class="mun-checkbox" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Send Welcome Email
                                                </div>
                                                <div class="text-xs text-mun-gray-500">Send login credentials and
                                                    welcome message</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.requirePasswordChange" type="checkbox"
                                                class="mun-checkbox" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Require Password
                                                    Change</div>
                                                <div class="text-xs text-mun-gray-500">User must change password on
                                                    first login</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.accountActive" type="checkbox"
                                                class="mun-checkbox" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Account Active</div>
                                                <div class="text-xs text-mun-gray-500">User can log in immediately</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Information -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-un-blue" />
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
                            User will be able to log in immediately if account is active
                        </div>

                        <div class="flex space-x-3">
                            <AppButton @click="closeModal" variant="outline" :disabled="isSubmitting">
                                Cancel
                            </AppButton>

                            <AppButton @click="handleSubmit" variant="primary" :loading="isSubmitting"
                                :disabled="!isFormValid">
                                <UserPlusIcon class="w-4 h-4 mr-2" />
                                Create User
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    UserPlusIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    CogIcon,
    DocumentTextIcon,
    UserIcon,
    UsersIcon,
    ShieldExclamationIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()

// State
const isSubmitting = ref(false)
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
    password: '',
    confirmPassword: '',
    language: 'en',
    timezone: 'Asia/Tashkent',
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    accountActive: true,
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
        formData.password &&
        formData.confirmPassword &&
        formData.password === formData.confirmPassword &&
        Object.keys(errors.value).length === 0
})

// Methods
const closeModal = () => {
    if (isSubmitting.value) return
    resetForm()
    emit('update:modelValue', false)
}

const resetForm = () => {
    Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'boolean') {
            const defaults = {
                sendWelcomeEmail: true,
                requirePasswordChange: true,
                accountActive: true
            }
            formData[key] = defaults[key] || false
        } else {
            const defaults = {
                language: 'en',
                timezone: 'Asia/Tashkent'
            }
            formData[key] = defaults[key] || ''
        }
    })
    errors.value = {}
}

const getMaxBirthDate = () => {
    // 13 years ago (minimum age)
    const date = new Date()
    date.setFullYear(date.getFullYear() - 13)
    return date.toISOString().split('T')[0]
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

    if (!formData.password) {
        errors.value.password = 'Password is required'
    } else if (formData.password.length < 8) {
        errors.value.password = 'Password must be at least 8 characters long'
    }

    if (formData.password !== formData.confirmPassword) {
        errors.value.confirmPassword = 'Passwords do not match'
    }

    return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
    if (!validateForm()) {
        toast.error('Please fix the errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        // Prepare user data
        const userData = { ...formData }
        delete userData.confirmPassword // Remove confirm password field

        const response = await apiMethods.post('/admin/users', userData)

        emit('created', response.data.user)
        toast.success('User created successfully')
        closeModal()

    } catch (error) {
        console.error('Failed to create user:', error)

        if (error.response?.data?.errors) {
            errors.value = error.response.data.errors
        }

        toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
        isSubmitting.value = false
    }
}

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        loadAvailableData()
    }
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

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(0.95);
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