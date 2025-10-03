<template>
    <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Add New User</h2>
            <p class="text-sm text-gray-600 mt-1">Create a new delegate, presidium member, or administrator</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
            <!-- Basic Information -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Basic Information</h3>

                <!-- Name -->
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                    </label>
                    <input id="name" v-model="form.name" type="text" placeholder="e.g., John Doe" class="input"
                        :class="{ 'input-error': errors.name }" required />
                    <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                </div>

                <!-- Email -->
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input id="email" v-model="form.email" type="email" placeholder="john.doe@example.com" class="input"
                        :class="{ 'input-error': errors.email }" required />
                    <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
                </div>

                <!-- Username (for admin only) -->
                <div v-if="form.role === 'admin'">
                    <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                    </label>
                    <input id="username" v-model="form.username" type="text" placeholder="admin_username" class="input"
                        :class="{ 'input-error': errors.username }" />
                    <p v-if="errors.username" class="mt-1 text-sm text-red-600">{{ errors.username }}</p>
                </div>

                <!-- Password (for admin only) -->
                <div v-if="form.role === 'admin'">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                    </label>
                    <input id="password" v-model="form.password" type="password" placeholder="Secure password"
                        class="input" :class="{ 'input-error': errors.password }" />
                    <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
                    <p class="mt-1 text-xs text-gray-500">Minimum 8 characters with uppercase, lowercase, and numbers
                    </p>
                </div>
            </div>

            <!-- Role Selection -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Role Assignment</h3>

                <!-- Primary Role -->
                <div>
                    <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
                        Primary Role *
                    </label>
                    <select id="role" v-model="form.role" class="input" :class="{ 'input-error': errors.role }"
                        @change="handleRoleChange" required>
                        <option value="">Select a role</option>
                        <option value="admin">Administrator</option>
                        <option value="presidium">Presidium Member</option>
                        <option value="delegate">Delegate</option>
                        <option value="observer">Observer</option>
                    </select>
                    <p v-if="errors.role" class="mt-1 text-sm text-red-600">{{ errors.role }}</p>
                </div>

                <!-- Presidium Role (if presidium selected) -->
                <div v-if="form.role === 'presidium'">
                    <label for="presidiumRole" class="block text-sm font-medium text-gray-700 mb-2">
                        Presidium Position *
                    </label>
                    <select id="presidiumRole" v-model="form.presidiumRole" class="input"
                        :class="{ 'input-error': errors.presidiumRole }" required>
                        <option value="">Select position</option>
                        <option value="chair">Chair</option>
                        <option value="vice-chair">Vice Chair</option>
                        <option value="rapporteur">Rapporteur</option>
                        <option value="moderator">Moderator</option>
                    </select>
                    <p v-if="errors.presidiumRole" class="mt-1 text-sm text-red-600">{{ errors.presidiumRole }}</p>
                </div>

                <!-- Delegate Type (if delegate selected) -->
                <div v-if="form.role === 'delegate'">
                    <label for="delegationType" class="block text-sm font-medium text-gray-700 mb-2">
                        Delegation Type
                    </label>
                    <select id="delegationType" v-model="form.delegationType" class="input"
                        :class="{ 'input-error': errors.delegationType }">
                        <option value="member">Member State</option>
                        <option value="observer">Observer State</option>
                        <option value="ngo">NGO Representative</option>
                    </select>
                    <p v-if="errors.delegationType" class="mt-1 text-sm text-red-600">{{ errors.delegationType }}</p>
                </div>
            </div>

            <!-- Assignment -->
            <div v-if="form.role !== 'admin'" class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Committee Assignment</h3>

                <!-- Event Selection -->
                <div>
                    <label for="eventId" class="block text-sm font-medium text-gray-700 mb-2">
                        Event *
                    </label>
                    <select id="eventId" v-model="form.eventId" class="input" :class="{ 'input-error': errors.eventId }"
                        @change="loadCommittees" required>
                        <option value="">Select an event</option>
                        <option v-for="event in events" :key="event.id" :value="event.id">
                            {{ event.name }}
                        </option>
                    </select>
                    <p v-if="errors.eventId" class="mt-1 text-sm text-red-600">{{ errors.eventId }}</p>
                </div>

                <!-- Committee Selection -->
                <div v-if="form.eventId">
                    <label for="committeeId" class="block text-sm font-medium text-gray-700 mb-2">
                        Committee *
                    </label>
                    <select id="committeeId" v-model="form.committeeId" class="input"
                        :class="{ 'input-error': errors.committeeId }" @change="loadCountries" required>
                        <option value="">Select a committee</option>
                        <option v-for="committee in availableCommittees" :key="committee.id" :value="committee.id">
                            {{ committee.name }} ({{ committee.type }})
                        </option>
                    </select>
                    <p v-if="errors.committeeId" class="mt-1 text-sm text-red-600">{{ errors.committeeId }}</p>
                </div>

                <!-- Country Assignment (for delegates) -->
                <div v-if="form.role === 'delegate' && form.committeeId">
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-2">
                        Country Assignment *
                    </label>
                    <select id="country" v-model="form.country" class="input" :class="{ 'input-error': errors.country }"
                        required>
                        <option value="">Select a country</option>
                        <option v-for="country in availableCountries" :key="country.code" :value="country.name">
                            {{ country.name }}
                        </option>
                    </select>
                    <p v-if="errors.country" class="mt-1 text-sm text-red-600">{{ errors.country }}</p>
                </div>
            </div>

            <!-- Additional Settings -->
            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Settings</h3>

                <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                        <input id="isActive" v-model="form.isActive" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="isActive" class="text-sm font-medium text-gray-700">
                            User is active (can log in)
                        </label>
                    </div>

                    <div v-if="form.role !== 'admin'" class="flex items-center space-x-3">
                        <input id="generateQR" v-model="form.generateQR" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="generateQR" class="text-sm font-medium text-gray-700">
                            Generate QR code for authentication
                        </label>
                    </div>

                    <div class="flex items-center space-x-3">
                        <input id="sendWelcomeEmail" v-model="form.sendWelcomeEmail" type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label for="sendWelcomeEmail" class="text-sm font-medium text-gray-700">
                            Send welcome email with login instructions
                        </label>
                    </div>
                </div>
            </div>

            <!-- Error Display -->
            <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error creating user</h3>
                        <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
                    </div>
                </div>
            </div>
        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button type="button" @click="$emit('close')" :disabled="isSubmitting" class="btn-secondary">
                Cancel
            </button>
            <button @click="handleSubmit" :disabled="isSubmitting || !isFormValid" class="btn-primary">
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                {{ isSubmitting ? 'Creating User...' : 'Create User' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const emit = defineEmits(['close', 'success'])
const props = defineProps({
    events: {
        type: Array,
        default: () => []
    }
})

const authStore = useAuthStore()

// Form state
const form = reactive({
    name: '',
    email: '',
    username: '',
    password: '',
    role: '',
    presidiumRole: '',
    delegationType: 'member',
    eventId: '',
    committeeId: '',
    country: '',
    isActive: true,
    generateQR: true,
    sendWelcomeEmail: true
})

const errors = reactive({})
const isSubmitting = ref(false)
const submitError = ref('')
const availableCommittees = ref([])
const availableCountries = ref([])

// Computed
const isFormValid = computed(() => {
    const baseValid = form.name.trim() && form.email.trim() && form.role

    if (form.role === 'admin') {
        return baseValid && form.username.trim() && form.password
    }

    if (form.role === 'presidium') {
        return baseValid && form.presidiumRole && form.eventId && form.committeeId
    }

    if (form.role === 'delegate') {
        return baseValid && form.eventId && form.committeeId && form.country
    }

    return baseValid && form.eventId && form.committeeId
})

// Methods
function handleRoleChange() {
    // Reset role-specific fields when role changes
    form.presidiumRole = ''
    form.delegationType = 'member'
    form.username = ''
    form.password = ''
    form.eventId = ''
    form.committeeId = ''
    form.country = ''

    // Clear errors
    Object.keys(errors).forEach(key => delete errors[key])
}

async function loadCommittees() {
    if (!form.eventId) {
        availableCommittees.value = []
        return
    }

    try {
        const response = await authStore.apiCall(`/admin/events/${form.eventId}/committees`)
        if (response.ok) {
            const data = await response.json()
            availableCommittees.value = data.committees || []
        }
    } catch (error) {
        console.error('Load committees error:', error)
    }
}

async function loadCountries() {
    if (!form.committeeId) {
        availableCountries.value = []
        return
    }

    try {
        const response = await authStore.apiCall(`/admin/committees/${form.committeeId}/countries`)
        if (response.ok) {
            const data = await response.json()
            availableCountries.value = data.countries || []
        }
    } catch (error) {
        console.error('Load countries error:', error)
    }
}

function validateForm() {
    // Clear previous errors
    Object.keys(errors).forEach(key => delete errors[key])

    // Name validation
    if (!form.name.trim()) {
        errors.name = 'Full name is required'
    } else if (form.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!form.email.trim()) {
        errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Please enter a valid email address'
    }

    // Role validation
    if (!form.role) {
        errors.role = 'Role selection is required'
    }

    // Admin-specific validation
    if (form.role === 'admin') {
        if (!form.username.trim()) {
            errors.username = 'Username is required for administrators'
        } else if (form.username.length < 3) {
            errors.username = 'Username must be at least 3 characters'
        }

        if (!form.password) {
            errors.password = 'Password is required for administrators'
        } else if (form.password.length < 8) {
            errors.password = 'Password must be at least 8 characters'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
            errors.password = 'Password must contain uppercase, lowercase, and numbers'
        }
    }

    // Presidium-specific validation
    if (form.role === 'presidium' && !form.presidiumRole) {
        errors.presidiumRole = 'Presidium position is required'
    }

    // Event and committee validation (for non-admin roles)
    if (form.role !== 'admin') {
        if (!form.eventId) {
            errors.eventId = 'Event selection is required'
        }

        if (!form.committeeId) {
            errors.committeeId = 'Committee selection is required'
        }

        // Country validation for delegates
        if (form.role === 'delegate' && !form.country) {
            errors.country = 'Country assignment is required for delegates'
        }
    }

    return Object.keys(errors).length === 0
}

async function handleSubmit() {
    if (!validateForm()) {
        return
    }

    isSubmitting.value = true
    submitError.value = ''

    try {
        // Prepare user data
        const userData = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            isActive: form.isActive,
            generateQR: form.generateQR,
            sendWelcomeEmail: form.sendWelcomeEmail
        }

        // Add role-specific data
        if (form.role === 'admin') {
            userData.username = form.username.trim()
            userData.password = form.password
        } else {
            userData.eventId = form.eventId
            userData.committeeId = form.committeeId

            if (form.role === 'presidium') {
                userData.presidiumRole = form.presidiumRole
            }

            if (form.role === 'delegate') {
                userData.country = form.country
                userData.delegationType = form.delegationType
            }
        }

        const response = await authStore.apiCall('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        })

        if (response.ok) {
            const data = await response.json()
            emit('success', data.user)
            emit('close')
        } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to create user')
        }
    } catch (error) {
        console.error('Create user error:', error)
        submitError.value = error.message || 'An unexpected error occurred'
    } finally {
        isSubmitting.value = false
    }
}
</script>