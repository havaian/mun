<template>
    <div class="w-full max-w-3xl mx-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">
                    {{ isEditMode ? 'Edit User' : 'Create New User' }}
                </h3>
                <p class="text-sm text-gray-500 mt-1">
                    {{ isEditMode ? 'Modify user information and permissions' : 'Add a new user to the system' }}
                </p>
            </div>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                <XMarkIcon class="w-6 h-6" />
            </button>
        </div>

        <!-- Loading Overlay -->
        <div v-if="isLoading"
            class="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div class="flex flex-col items-center">
                <LoadingSpinner class="w-8 h-8 text-un-blue mb-2" />
                <p class="text-sm text-gray-600">{{ loadingMessage }}</p>
            </div>
        </div>

        <!-- Form Content -->
        <div class="p-6 bg-white max-h-[75vh] overflow-y-auto">
            <div class="space-y-6">
                <!-- Basic Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Full Name -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input v-model="userData.name" type="text" placeholder="Enter full name" class="input-field"
                            :class="{ 'border-red-500': errors.name }" />
                        <p v-if="errors.name" class="text-sm text-red-600 mt-1">{{ errors.name }}</p>
                    </div>

                    <!-- Email Address -->
                    <div class="md:col-span-1">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <input v-model="userData.email" type="email" placeholder="user@example.com" class="input-field"
                            :class="{ 'border-red-500': errors.email }" :disabled="isEditMode" />
                        <p v-if="errors.email" class="text-sm text-red-600 mt-1">{{ errors.email }}</p>
                        <p v-if="isEditMode" class="text-xs text-gray-500 mt-1">Email cannot be changed after creation
                        </p>
                    </div>

                    <!-- Phone Number -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input v-model="userData.phone" type="tel" placeholder="+1 (555) 123-4567"
                            class="input-field" />
                    </div>

                    <!-- Institution -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Institution/Organization
                        </label>
                        <input v-model="userData.institution" type="text"
                            placeholder="University, School, or Organization" class="input-field" />
                    </div>
                </div>

                <!-- Role and Permissions -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h4 class="text-base font-medium text-gray-900 mb-4">Role and Permissions</h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Primary Role -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Primary Role *
                            </label>
                            <select v-model="userData.role" class="input-field"
                                :class="{ 'border-red-500': errors.role }" @change="updatePermissions">
                                <option value="">Select role...</option>
                                <option value="admin">Administrator</option>
                                <option value="chair">Chairperson</option>
                                <option value="co_chair">Co-Chair</option>
                                <option value="rapporteur">Rapporteur</option>
                                <option value="delegate">Delegate</option>
                                <option value="observer">Observer</option>
                            </select>
                            <p v-if="errors.role" class="text-sm text-red-600 mt-1">{{ errors.role }}</p>
                        </div>

                        <!-- Status -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Account Status
                            </label>
                            <select v-model="userData.status" class="input-field">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending Activation</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>

                    <!-- Role Description -->
                    <div v-if="userData.role" class="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-700">{{ getRoleDescription(userData.role) }}</p>
                    </div>

                    <!-- Custom Permissions -->
                    <div v-if="userData.role" class="mt-6">
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            Additional Permissions
                        </label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label v-for="permission in availablePermissions" :key="permission.key"
                                class="flex items-center space-x-2">
                                <input v-model="userData.permissions" type="checkbox" :value="permission.key"
                                    class="rounded border-gray-300 text-un-blue focus:ring-un-blue"
                                    :disabled="permission.required" />
                                <span class="text-sm text-gray-700">
                                    {{ permission.name }}
                                    <span v-if="permission.required" class="text-xs text-gray-500">(Required)</span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Committee Assignments -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-base font-medium text-gray-900">Committee Assignments</h4>
                        <button @click="addCommitteeAssignment"
                            class="text-sm text-un-blue hover:text-un-blue-600 font-medium">
                            + Add Assignment
                        </button>
                    </div>

                    <div v-if="userData.committeeAssignments.length === 0" class="text-center py-6">
                        <UserGroupIcon class="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p class="text-sm text-gray-500">No committee assignments</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div v-for="(assignment, index) in userData.committeeAssignments" :key="index"
                            class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <!-- Committee -->
                            <div class="flex-1">
                                <select v-model="assignment.committeeId" class="input-field text-sm"
                                    @change="updateCountriesForCommittee(assignment)">
                                    <option value="">Select committee...</option>
                                    <option v-for="committee in availableCommittees" :key="committee.id"
                                        :value="committee.id">
                                        {{ committee.name }}
                                    </option>
                                </select>
                            </div>

                            <!-- Role in Committee -->
                            <div class="flex-1">
                                <select v-model="assignment.role" class="input-field text-sm">
                                    <option value="">Select role...</option>
                                    <option value="chair">Chair</option>
                                    <option value="co_chair">Co-Chair</option>
                                    <option value="rapporteur">Rapporteur</option>
                                    <option value="delegate">Delegate</option>
                                    <option value="observer">Observer</option>
                                </select>
                            </div>

                            <!-- Country (for delegates) -->
                            <div v-if="assignment.role === 'delegate'" class="flex-1">
                                <select v-model="assignment.country" class="input-field text-sm">
                                    <option value="">Select country...</option>
                                    <option v-for="country in assignment.availableCountries || []" :key="country"
                                        :value="country">
                                        {{ country }}
                                    </option>
                                </select>
                            </div>

                            <!-- Remove Button -->
                            <button @click="removeCommitteeAssignment(index)" class="text-red-500 hover:text-red-700">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Password Settings (Create Mode Only) -->
                <div v-if="!isEditMode" class="border border-gray-200 rounded-lg p-4">
                    <h4 class="text-base font-medium text-gray-900 mb-4">Password Settings</h4>

                    <div class="space-y-4">
                        <div class="flex items-center space-x-3">
                            <input v-model="passwordOption" type="radio" value="auto" name="passwordOption"
                                class="text-un-blue focus:ring-un-blue" />
                            <label class="text-sm text-gray-700">
                                <strong>Auto-generate password</strong> and send via email
                            </label>
                        </div>

                        <div class="flex items-center space-x-3">
                            <input v-model="passwordOption" type="radio" value="manual" name="passwordOption"
                                class="text-un-blue focus:ring-un-blue" />
                            <label class="text-sm text-gray-700">
                                <strong>Set custom password</strong>
                            </label>
                        </div>

                        <!-- Manual Password Fields -->
                        <div v-if="passwordOption === 'manual'" class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input v-model="userData.password" type="password" placeholder="Enter password"
                                    class="input-field" :class="{ 'border-red-500': errors.password }" />
                                <p v-if="errors.password" class="text-sm text-red-600 mt-1">{{ errors.password }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input v-model="confirmPassword" type="password" placeholder="Confirm password"
                                    class="input-field" :class="{ 'border-red-500': errors.confirmPassword }" />
                                <p v-if="errors.confirmPassword" class="text-sm text-red-600 mt-1">{{
                                    errors.confirmPassword }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Options -->
                <div class="border border-gray-200 rounded-lg p-4">
                    <h4 class="text-base font-medium text-gray-900 mb-4">Additional Options</h4>

                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input v-model="userData.sendWelcomeEmail" type="checkbox"
                                class="rounded border-gray-300 text-un-blue focus:ring-un-blue" />
                            <span class="ml-2 text-sm text-gray-700">
                                Send welcome email with login instructions
                            </span>
                        </label>

                        <label class="flex items-center">
                            <input v-model="userData.requirePasswordChange" type="checkbox"
                                class="rounded border-gray-300 text-un-blue focus:ring-un-blue" />
                            <span class="ml-2 text-sm text-gray-700">
                                Require password change on first login
                            </span>
                        </label>

                        <label v-if="!isEditMode" class="flex items-center">
                            <input v-model="userData.enableTwoFactor" type="checkbox"
                                class="rounded border-gray-300 text-un-blue focus:ring-un-blue" />
                            <span class="ml-2 text-sm text-gray-700">
                                Enable two-factor authentication
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div class="text-sm text-gray-500">
                {{ isEditMode ? 'User will be notified of any role changes' : 'User will receive login credentials via email' }}
            </div>

            <div class="flex items-center space-x-3">
                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2"
                    :disabled="isLoading">
                    Cancel
                </button>

                <button @click="saveUser" class="btn-un-primary text-sm px-6 py-2" :disabled="!canSave || isLoading">
                    <span v-if="isLoading">{{ isEditMode ? 'Updating...' : 'Creating...' }}</span>
                    <span v-else>{{ isEditMode ? 'Update User' : 'Create User' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Icons
import {
    XMarkIcon,
    UserGroupIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
const props = defineProps({
    user: {
        type: Object,
        default: null
    },
    onSuccess: {
        type: Function,
        default: () => { }
    }
})

const emit = defineEmits(['close'])

// Composables
const toast = useToast()

// State
const isLoading = ref(false)
const loadingMessage = ref('')
const passwordOption = ref('auto')
const confirmPassword = ref('')

// Form data
const userData = reactive({
    name: '',
    email: '',
    phone: '',
    institution: '',
    role: '',
    status: 'active',
    permissions: [],
    committeeAssignments: [],
    password: '',
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    enableTwoFactor: false
})

// Validation errors
const errors = reactive({})

// Available data
const availableCommittees = ref([])
const availablePermissions = ref([])

// Computed
const isEditMode = computed(() => !!props.user?.id)

const canSave = computed(() => {
    return userData.name.trim() &&
        userData.email.trim() &&
        userData.role &&
        Object.keys(errors).length === 0
})

// Methods
const loadData = async () => {
    isLoading.value = true
    loadingMessage.value = 'Loading data...'

    try {
        // Load committees
        const committeesResponse = await apiMethods.committees.getAll()
        availableCommittees.value = committeesResponse.data

        // Load available permissions based on role
        updatePermissions()

        // If editing, populate form
        if (isEditMode.value) {
            Object.keys(userData).forEach(key => {
                if (props.user[key] !== undefined) {
                    if (key === 'committeeAssignments') {
                        userData[key] = props.user[key] || []
                    } else if (key === 'permissions') {
                        userData[key] = props.user[key] || []
                    } else {
                        userData[key] = props.user[key]
                    }
                }
            })
        }

    } catch (error) {
        console.error('Load data error:', error)
        toast.error('Failed to load data')
    } finally {
        isLoading.value = false
    }
}

const updatePermissions = () => {
    const rolePermissions = {
        admin: [
            { key: 'manage_users', name: 'Manage Users', required: true },
            { key: 'manage_events', name: 'Manage Events', required: true },
            { key: 'manage_committees', name: 'Manage Committees', required: true },
            { key: 'view_statistics', name: 'View Statistics', required: true },
            { key: 'system_settings', name: 'System Settings', required: true }
        ],
        chair: [
            { key: 'manage_sessions', name: 'Manage Sessions', required: true },
            { key: 'moderate_documents', name: 'Moderate Documents', required: true },
            { key: 'control_voting', name: 'Control Voting', required: true },
            { key: 'manage_procedures', name: 'Manage Procedures', required: true },
            { key: 'view_statistics', name: 'View Statistics', required: false }
        ],
        co_chair: [
            { key: 'assist_sessions', name: 'Assist in Sessions', required: true },
            { key: 'moderate_documents', name: 'Moderate Documents', required: false },
            { key: 'manage_speakers', name: 'Manage Speaker List', required: true },
            { key: 'view_statistics', name: 'View Statistics', required: false }
        ],
        rapporteur: [
            { key: 'manage_documents', name: 'Manage Documents', required: true },
            { key: 'record_sessions', name: 'Record Sessions', required: true },
            { key: 'generate_reports', name: 'Generate Reports', required: true }
        ],
        delegate: [
            { key: 'create_documents', name: 'Create Documents', required: true },
            { key: 'participate_voting', name: 'Participate in Voting', required: true },
            { key: 'join_coalitions', name: 'Join Coalitions', required: true },
            { key: 'send_messages', name: 'Send Messages', required: true }
        ],
        observer: [
            { key: 'view_sessions', name: 'View Sessions', required: true },
            { key: 'view_documents', name: 'View Documents', required: true }
        ]
    }

    availablePermissions.value = rolePermissions[userData.role] || []

    // Auto-select required permissions
    userData.permissions = availablePermissions.value
        .filter(p => p.required)
        .map(p => p.key)
}

const addCommitteeAssignment = () => {
    userData.committeeAssignments.push({
        committeeId: '',
        role: '',
        country: '',
        availableCountries: []
    })
}

const removeCommitteeAssignment = (index) => {
    userData.committeeAssignments.splice(index, 1)
}

const updateCountriesForCommittee = async (assignment) => {
    if (!assignment.committeeId) {
        assignment.availableCountries = []
        return
    }

    try {
        const response = await apiMethods.committees.getById(assignment.committeeId)
        assignment.availableCountries = response.data.countries?.map(c => c.name) || []
    } catch (error) {
        console.error('Load countries error:', error)
    }
}

const saveUser = async () => {
    if (!validateForm()) return

    isLoading.value = true
    loadingMessage.value = isEditMode.value ? 'Updating user...' : 'Creating user...'

    try {
        const submitData = { ...userData }

        // Handle password for new users
        if (!isEditMode.value) {
            if (passwordOption.value === 'auto') {
                delete submitData.password
                submitData.generatePassword = true
            }
        } else {
            // Don't send password for updates
            delete submitData.password
        }

        let response
        if (isEditMode.value) {
            response = await apiMethods.admin.updateUser(props.user.id, submitData)
        } else {
            response = await apiMethods.admin.createUser(submitData)
        }

        toast.success(`User ${isEditMode.value ? 'updated' : 'created'} successfully!`)
        props.onSuccess(response.data)
        emit('close')

    } catch (error) {
        console.error('Save user error:', error)
        toast.error(`Failed to ${isEditMode.value ? 'update' : 'create'} user`)
    } finally {
        isLoading.value = false
    }
}

const validateForm = () => {
    clearErrors()
    let hasErrors = false

    // Required fields
    if (!userData.name.trim()) {
        errors.name = 'Full name is required'
        hasErrors = true
    }

    if (!userData.email.trim()) {
        errors.email = 'Email address is required'
        hasErrors = true
    } else if (!isValidEmail(userData.email)) {
        errors.email = 'Please enter a valid email address'
        hasErrors = true
    }

    if (!userData.role) {
        errors.role = 'Please select a role'
        hasErrors = true
    }

    // Password validation for new users
    if (!isEditMode.value && passwordOption.value === 'manual') {
        if (!userData.password) {
            errors.password = 'Password is required'
            hasErrors = true
        } else if (userData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters'
            hasErrors = true
        }

        if (userData.password !== confirmPassword.value) {
            errors.confirmPassword = 'Passwords do not match'
            hasErrors = true
        }
    }

    return !hasErrors
}

const clearErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key])
}

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const getRoleDescription = (role) => {
    const descriptions = {
        admin: 'Full system access including user management, event creation, and system settings.',
        chair: 'Leads committee sessions, manages voting, moderates documents, and controls procedures.',
        co_chair: 'Assists the chairperson in managing sessions and maintaining order during debates.',
        rapporteur: 'Responsible for documenting sessions, managing committee records, and generating reports.',
        delegate: 'Represents a country in committee discussions, can vote, create documents, and join coalitions.',
        observer: 'Can view sessions and documents but cannot participate in voting or create content.'
    }
    return descriptions[role] || ''
}

// Lifecycle
onMounted(() => {
    loadData()
})
</script>