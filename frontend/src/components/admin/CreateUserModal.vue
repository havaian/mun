<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] min-h-[400px]" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
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
                    <div class="overflow-y-auto max-h-[80vh]">
                        <form @submit.prevent="handleSubmit" class="p-6 space-y-8">
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
                                        <input v-model="formData.firstName" type="text" class="input-field"
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
                                        <input v-model="formData.lastName" type="text" class="input-field"
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
                                        <input v-model="formData.email" type="email" class="input-field"
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
                                        <input v-model="formData.username" type="text" class="input-field"
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
                                        <input v-model="formData.phone" type="tel" class="input-field"
                                            placeholder="Enter phone number" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input v-model="formData.dateOfBirth" type="date" class="input-field"
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
                                                    class="input-field sr-only" required />
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
                                        <p v-if="errors.role" class="mt-2 text-sm text-red-600">
                                            {{ errors.role }}
                                        </p>
                                    </div>

                                    <!-- Presidium Role (if applicable) -->
                                    <div v-if="formData.role === 'presidium'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Presidium Role *
                                        </label>
                                        <SleekSelect v-model="formData.presidiumRole" :options="[
                                            { label: 'Chairman', value: 'chairman' },
                                            { label: 'Co-Chairman', value: 'co-chairman' },
                                            { label: 'Expert', value: 'expert' },
                                            { label: 'Secretary', value: 'secretary' }
                                        ]" placeholder="Select presidium role" :trigger-class="errors.presidiumRole ? 'border-red-500' : ''" required
                                            size="md" />
                                        <p v-if="errors.presidiumRole" class="mt-1 text-sm text-red-600">
                                            {{ errors.presidiumRole }}
                                        </p>
                                    </div>

                                    <!-- Country/Organization (for delegates) -->
                                    <div v-if="formData.role === 'delegate'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Country/Organization *
                                        </label>
                                        <SleekSelect v-model="formData.country" :options="[
                                            ...availableCountries.map(country => ({
                                                label: country.name,
                                                value: country.code
                                            }))
                                        ]" placeholder="Select country or organization" :trigger-class="errors.country ? 'border-red-500' : ''" searchable
                                            required size="md" />
                                        <p v-if="errors.country" class="mt-1 text-sm text-red-600">
                                            {{ errors.country }}
                                        </p>
                                    </div>

                                    <!-- Committee Assignment -->
                                    <div v-if="formData.role !== 'admin'">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Assignment
                                        </label>
                                        <SleekSelect v-model="formData.committeeId" :options="[
                                            ...availableCommittees.map(committee => ({
                                                label: `${committee.name} (${committee.acronym})`,
                                                value: committee.id
                                            }))
                                        ]" placeholder="Assign the committee" :trigger-class="errors.committeeId ? 'border-red-500' : ''" searchable
                                            size="md" />
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
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Account Settings
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Password *
                                        </label>
                                        <input v-model="formData.password" type="password" class="input-field"
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
                                        <input v-model="formData.confirmPassword" type="password" class="input-field"
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
                                        <SleekSelect v-model="formData.language" :options="[
                                            { label: 'English', value: 'en' },
                                            { label: 'French', value: 'fr' },
                                            { label: 'Spanish', value: 'es' },
                                            { label: 'Arabic', value: 'ar' },
                                            { label: 'Russian', value: 'ru' },
                                            { label: 'Chinese', value: 'zh' }
                                        ]" searchable size="md" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <SleekSelect v-model="formData.timezone" :options="[
                                            { label: 'Asia/Tashkent (GMT+5)', value: 'Asia/Tashkent' },
                                            { label: 'UTC (GMT+0)', value: 'UTC' },
                                            { label: 'Eastern Time (GMT-5)', value: 'America/New_York' },
                                            { label: 'Pacific Time (GMT-8)', value: 'America/Los_Angeles' },
                                            { label: 'London (GMT+0)', value: 'Europe/London' },
                                            { label: 'Paris (GMT+1)', value: 'Europe/Paris' },
                                            { label: 'Tokyo (GMT+9)', value: 'Asia/Tokyo' }
                                        ]" searchable size="md" />
                                    </div>
                                </div>

                                <!-- Account Options -->
                                <div class="mt-6">
                                    <h4 class="text-sm font-medium text-mun-gray-700 mb-3">Account Options</h4>
                                    <div class="space-y-3">
                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.sendWelcomeEmail" type="checkbox"
                                                class="input-field" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Send Welcome Email
                                                </div>
                                                <div class="text-xs text-mun-gray-500">Send login credentials and
                                                    welcome message</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.requirePasswordChange" type="checkbox"
                                                class="input-field" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Require Password
                                                    Change</div>
                                                <div class="text-xs text-mun-gray-500">User must change password on
                                                    first login</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.accountActive" type="checkbox"
                                                class="input-field" />
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
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Additional Information
                                </h3>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Institution/Organization
                                        </label>
                                        <input v-model="formData.institution" type="text" class="input-field"
                                            placeholder="e.g., University name, Organization" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Experience Level
                                        </label>
                                        <SleekSelect v-model="formData.experienceLevel" :options="[
                                            { label: 'Beginner (0-1 conferences)', value: 'beginner' },
                                            { label: 'Intermediate (2-5 conferences)', value: 'intermediate' },
                                            { label: 'Advanced (5+ conferences)', value: 'advanced' },
                                            { label: 'Expert/Veteran', value: 'expert' }
                                        ]" placeholder="Select experience level" size="md" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Emergency Contact
                                        </label>
                                        <input v-model="formData.emergencyContact" type="text" class="input-field"
                                            placeholder="Emergency contact name and phone" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Admin Notes
                                        </label>
                                        <textarea v-model="formData.adminNotes" rows="3" class="input-field"
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
        const countriesResponse = await apiMethods.countries.getAll()
        availableCountries.value = countriesResponse.data.countries || []

        // Load committees
        const committeesResponse = await apiMethods.committees.getAll({ status: 'active' })
        availableCommittees.value = committeesResponse.data.committees || []

    } catch (error) {
        toast.error('Failed to load available data:', error)
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

        const response = await apiMethods.users.create(userData)

        emit('created', response.data.user)
        toast.success('User created successfully')
        closeModal()

    } catch (error) {
        toast.error('Failed to create user:', error)

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
</style>