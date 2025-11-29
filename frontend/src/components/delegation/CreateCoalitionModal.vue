<!-- frontend/src/components/delegate/CreateCoalitionModal.vue -->
<template>
    <Teleport to="body">
        <transition name="modal-overlay">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeModal"></div>

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <transition name="modal-content">
                        <div v-if="modelValue"
                            class="create-coalition-modal relative bg-white rounded-2xl shadow-mun-lg max-w-2xl w-full flex flex-col max-h-[95vh] min-h-[400px]">
                            <!-- Header -->
                            <div
                                class="modal-header flex items-center justify-between p-6 border-b border-mun-gray-200">
                                <div class="flex items-center space-x-3">
                                    <div class="p-3 bg-mun-blue/10 rounded-xl">
                                        <UserGroupIcon class="w-6 h-6 text-mun-blue" />
                                    </div>
                                    <div>
                                        <h2 class="text-xl font-bold text-mun-gray-900">Create Coalition</h2>
                                        <p class="text-sm text-mun-gray-600">Form a new coalition to work on resolutions
                                        </p>
                                    </div>
                                </div>

                                <button @click="closeModal"
                                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-5 h-5 text-mun-gray-600" />
                                </button>
                            </div>

                            <!-- Content -->
                            <div class="modal-content p-6 flex flex-col max-h-[95vh] min-h-[400px]">
                                <div class="space-y-6">
                                    <!-- Basic Information -->
                                    <div class="basic-info-section">
                                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Basic Information</h3>

                                        <div class="space-y-4">
                                            <!-- Coalition Name -->
                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Coalition Name <span class="text-red-500">*</span>
                                                </label>
                                                <input v-model="formData.name" type="text"
                                                    placeholder="Enter coalition name..." maxlength="100"
                                                    class="input-field w-full px-4 py-3"
                                                    :class="{ 'border-red-300': errors.name }" />
                                                <div class="flex items-center justify-between mt-1">
                                                    <p v-if="errors.name" class="text-sm text-red-600">{{ errors.name }}
                                                    </p>
                                                    <span class="text-xs text-mun-gray-500 ml-auto">{{
                                                        formData.name.length }}/100</span>
                                                </div>
                                            </div>

                                            <!-- Description -->
                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Description
                                                </label>
                                                <textarea v-model="formData.description"
                                                    placeholder="Describe the coalition's purpose and goals..." rows="3"
                                                    maxlength="500"
                                                    class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"
                                                    :class="{ 'border-red-300': errors.description }"></textarea>
                                                <div class="flex items-center justify-between mt-1">
                                                    <p v-if="errors.description" class="text-sm text-red-600">{{
                                                        errors.description }}</p>
                                                    <span class="text-xs text-mun-gray-500 ml-auto">{{
                                                        formData.description.length }}/500</span>
                                                </div>
                                            </div>

                                            <!-- Coalition Type -->
                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Coalition Type
                                                </label>
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div v-for="type in coalitionTypes" :key="type.value"
                                                        @click="formData.type = type.value" :class="[
                                                            'type-option p-4 border-2 rounded-lg cursor-pointer transition-all duration-200',
                                                            formData.type === type.value
                                                                ? 'border-mun-blue bg-mun-blue/5'
                                                                : 'border-mun-gray-200 hover:border-mun-blue/30'
                                                        ]">
                                                        <div class="flex items-center space-x-3">
                                                            <div :class="[
                                                                'p-2 rounded-lg',
                                                                formData.type === type.value ? type.activeBg : type.inactiveBg
                                                            ]">
                                                                <component :is="type.icon" :class="[
                                                                    'w-5 h-5',
                                                                    formData.type === type.value ? type.activeColor : type.inactiveColor
                                                                ]" />
                                                            </div>
                                                            <div>
                                                                <h4 :class="[
                                                                    'text-sm font-medium',
                                                                    formData.type === type.value ? 'text-mun-blue' : 'text-mun-gray-900'
                                                                ]">
                                                                    {{ type.name }}
                                                                </h4>
                                                                <p class="text-xs text-mun-gray-600">{{ type.description
                                                                }}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Initial Members -->
                                    <div class="members-section">
                                        <div class="flex items-center justify-between mb-4">
                                            <h3 class="text-lg font-medium text-mun-gray-900">Initial Members</h3>
                                            <span class="text-sm text-mun-gray-500">Optional - invite later</span>
                                        </div>

                                        <!-- Available Countries -->
                                        <div class="mb-4">
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Search Countries
                                            </label>
                                            <div class="relative">
                                                <input v-model="countrySearch" type="text"
                                                    placeholder="Search for countries to invite..."
                                                    class="input-field w-full px-4 py-3 pl-10" />
                                                <MagnifyingGlassIcon
                                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mun-gray-400" />
                                            </div>
                                        </div>

                                        <!-- Country Selection -->
                                        <div v-if="filteredCountries.length > 0" class="country-selection mb-4">
                                            <div class="max-h-32 overflow-y-auto border border-mun-gray-200 rounded-lg">
                                                <div v-for="country in filteredCountries.slice(0, 10)"
                                                    :key="country.email" @click="toggleCountrySelection(country)"
                                                    :class="[
                                                        'country-option flex items-center justify-between p-3 cursor-pointer border-b border-mun-gray-100 transition-colors',
                                                        isCountrySelected(country.email)
                                                            ? 'bg-mun-blue/5 hover:bg-mun-blue/10'
                                                            : 'hover:bg-mun-gray-50'
                                                    ]">
                                                    <div class="flex items-center space-x-3">
                                                        <CountryFlag :country="country.name" size="sm" />
                                                        <div>
                                                            <span class="text-sm font-medium text-mun-gray-900">{{
                                                                country.name }}</span>
                                                            <p class="text-xs text-mun-gray-600">{{ country.email }}</p>
                                                        </div>
                                                    </div>

                                                    <div v-if="isCountrySelected(country.email)" class="text-mun-blue">
                                                        <CheckIcon class="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Selected Members -->
                                        <div v-if="formData.selectedMembers.length > 0" class="selected-members">
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Selected Members ({{ formData.selectedMembers.length }})
                                            </label>
                                            <div class="flex flex-wrap gap-2">
                                                <div v-for="member in formData.selectedMembers" :key="member.email"
                                                    class="member-tag flex items-center space-x-2 px-3 py-2 bg-mun-blue/10 border border-mun-blue/20 rounded-lg">
                                                    <CountryFlag :country="member.name" size="xs" />
                                                    <span class="text-sm font-medium text-mun-blue">{{ member.name
                                                    }}</span>
                                                    <button @click="removeSelectedMember(member.email)"
                                                        class="text-mun-blue hover:text-mun-blue-600 transition-colors">
                                                        <XMarkIcon class="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Coalition Settings -->
                                    <div class="settings-section">
                                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Coalition Settings</h3>

                                        <div class="space-y-4">
                                            <!-- Minimum Members -->
                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Minimum Members Required
                                                </label>
                                                <SleekSelect
    v-model="formData.minMembers"
    :options="[
        { label: '3 members (minimum)', value: '3' },
        { label: '4 members', value: '4' },
        { label: '5 members', value: '5' },
        { label: '6 members', value: '6' },
        { label: '7 members', value: '7' },
        { label: '8 members or more', value: '8' }
    ]"
    size="md"
/>
                                                <p class="text-xs text-mun-gray-600 mt-1">
                                                    Coalition will be activated once this many members accept
                                                    invitations
                                                </p>
                                            </div>

                                            <!-- Privacy Settings -->
                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Privacy Settings
                                                </label>
                                                <div class="space-y-3">
                                                    <label class="flex items-center">
                                                        <input v-model="formData.isPublic" type="checkbox"
                                                            class="input-field" />
                                                        <span class="ml-3 text-sm text-mun-gray-700">
                                                            Make coalition publicly visible
                                                        </span>
                                                    </label>

                                                    <label class="flex items-center">
                                                        <input v-model="formData.allowDirectJoin" type="checkbox"
                                                            class="input-field" />
                                                        <span class="ml-3 text-sm text-mun-gray-700">
                                                            Allow delegates to request to join
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Preview -->
                                    <div class="preview-section">
                                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Preview</h3>

                                        <div
                                            class="preview-card p-4 border-2 border-dashed border-mun-gray-300 rounded-lg bg-mun-gray-50">
                                            <div class="flex items-start space-x-3">
                                                <div class="p-2 bg-mun-yellow-100 rounded-lg">
                                                    <UserGroupIcon class="w-5 h-5 text-mun-yellow-700" />
                                                </div>
                                                <div class="flex-1">
                                                    <h4 class="text-sm font-medium text-mun-gray-900">
                                                        {{ formData.name || 'Coalition Name' }}
                                                    </h4>
                                                    <p class="text-xs text-mun-gray-600 mt-1">
                                                        {{ formData.description || 'Coalition description will appear here...' }}
                                                    </p>
                                                    <div
                                                        class="flex items-center space-x-4 mt-2 text-xs text-mun-gray-500">
                                                        <span>Head: {{ userCountry }}</span>
                                                        <span>Type: {{ getSelectedTypeText() }}</span>
                                                        <span>Min: {{ formData.minMembers }} members</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div
                                class="modal-footer flex items-center justify-between rounded-b-2xl p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                                <div class="text-sm text-mun-gray-600">
                                    <InformationCircleIcon class="w-4 h-4 inline mr-1" />
                                    You will become the coalition head
                                </div>

                                <div class="flex items-center space-x-3">
                                    <button @click="closeModal"
                                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-lg hover:bg-mun-gray-50 transition-colors">
                                        Cancel
                                    </button>

                                    <button @click="createCoalition" :disabled="!isFormValid || isSubmitting"
                                        class="px-6 py-2 text-sm font-medium text-white bg-mun-blue border border-mun-blue rounded-lg hover:bg-mun-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <LoadingSpinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
                                        {{ isSubmitting ? 'Creating...' : 'Create Coalition' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
    UserGroupIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckIcon,
    InformationCircleIcon,
    DocumentTextIcon,
    HandshakeIcon,
    GlobeAltIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    availableCountries: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'coalition-created'])

const authStore = useAuthStore()
const toast = useToast()

// State
const isSubmitting = ref(false)
const countrySearch = ref('')
const errors = ref({})

// Form data
const formData = reactive({
    name: '',
    description: '',
    type: 'general',
    selectedMembers: [],
    minMembers: 3,
    isPublic: true,
    allowDirectJoin: true
})

// Coalition types
const coalitionTypes = [
    {
        value: 'general',
        name: 'General Coalition',
        description: 'Standard coalition for resolution drafting',
        icon: UserGroupIcon,
        activeBg: 'bg-mun-blue/10',
        inactiveBg: 'bg-mun-gray-100',
        activeColor: 'text-mun-blue',
        inactiveColor: 'text-mun-gray-600'
    },
    {
        value: 'regional',
        name: 'Regional Bloc',
        description: 'Coalition based on regional interests',
        icon: GlobeAltIcon,
        activeBg: 'bg-mun-green-100',
        inactiveBg: 'bg-mun-gray-100',
        activeColor: 'text-mun-green-700',
        inactiveColor: 'text-mun-gray-600'
    },
    {
        value: 'thematic',
        name: 'Thematic Group',
        description: 'Coalition focused on specific topics',
        icon: DocumentTextIcon,
        activeBg: 'bg-mun-yellow-100',
        inactiveBg: 'bg-mun-gray-100',
        activeColor: 'text-mun-yellow-700',
        inactiveColor: 'text-mun-gray-600'
    },
    {
        value: 'bilateral',
        name: 'Bilateral Partnership',
        description: 'Two-country partnership coalition',
        icon: HandshakeIcon,
        activeBg: 'bg-purple-100',
        inactiveBg: 'bg-mun-gray-100',
        activeColor: 'text-purple-700',
        inactiveColor: 'text-mun-gray-600'
    }
]

// Computed
const userCountry = computed(() => {
    return authStore.user?.countryName || 'Your Country'
})

const filteredCountries = computed(() => {
    if (!countrySearch.value.trim()) return []

    const query = countrySearch.value.toLowerCase()
    return props.availableCountries
        .filter(country =>
            country.name.toLowerCase().includes(query) ||
            country.email.toLowerCase().includes(query)
        )
        .filter(country =>
            country.email !== authStore.user?.email && // Exclude self
            !isCountrySelected(country.email) // Exclude already selected
        )
})

const isFormValid = computed(() => {
    return formData.name.trim().length >= 3 && !Object.keys(errors.value).length
})

const getSelectedTypeText = () => {
    const type = coalitionTypes.find(t => t.value === formData.type)
    return type?.name || 'General Coalition'
}

// Methods
const isCountrySelected = (email) => {
    return formData.selectedMembers.some(member => member.email === email)
}

const toggleCountrySelection = (country) => {
    if (isCountrySelected(country.email)) {
        removeSelectedMember(country.email)
    } else {
        formData.selectedMembers.push(country)
    }
}

const removeSelectedMember = (email) => {
    const index = formData.selectedMembers.findIndex(member => member.email === email)
    if (index > -1) {
        formData.selectedMembers.splice(index, 1)
    }
}

const validateForm = () => {
    errors.value = {}

    // Validate name
    if (!formData.name.trim()) {
        errors.value.name = 'Coalition name is required'
    } else if (formData.name.trim().length < 3) {
        errors.value.name = 'Coalition name must be at least 3 characters'
    }

    // Validate description
    if (formData.description.length > 500) {
        errors.value.description = 'Description cannot exceed 500 characters'
    }

    return Object.keys(errors.value).length === 0
}

const createCoalition = async () => {
    if (!validateForm()) return

    try {
        isSubmitting.value = true

        const coalitionData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            type: formData.type,
            minMembers: formData.minMembers,
            isPublic: formData.isPublic,
            allowDirectJoin: formData.allowDirectJoin,
            initialMembers: formData.selectedMembers.map(member => ({
                email: member.email,
                country: member.name
            }))
        }

        const response = await apiMethods.coalitions.createCoalition(coalitionData)

        if (response.data.success) {
            emit('coalition-created', {
                coalition: response.data.coalition,
                invitationsSent: response.data.invitationsSent || 0
            })

            toast.success(`Coalition "${formData.name}" created successfully`)
            closeModal()
        }

    } catch (error) {
        toast.error('Create coalition error:', error)
        toast.error('Failed to create coalition')
    } finally {
        isSubmitting.value = false
    }
}

const closeModal = () => {
    emit('update:modelValue', false)
}

const resetForm = () => {
    formData.name = ''
    formData.description = ''
    formData.type = 'general'
    formData.selectedMembers = []
    formData.minMembers = 3
    formData.isPublic = true
    formData.allowDirectJoin = true
    countrySearch.value = ''
    errors.value = {}
}

// Watchers
watch(() => formData.name, validateForm)
watch(() => formData.description, validateForm)

// Lifecycle
onMounted(() => {
    resetForm()
})
</script>

<style scoped>
/* Modal transitions */
.modal-overlay-enter-active,
.modal-overlay-leave-active {
    transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
    opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
    transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* Type option animations */
.type-option {
    transition: all 0.2s ease;
}

.type-option:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Country option animations */
.country-option {
    transition: all 0.2s ease;
}

.country-option:hover {
    transform: translateX(2px);
}

/* Member tag animations */
.member-tag {
    animation: tag-appear 0.3s ease-out;
}

@keyframes tag-appear {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Custom scrollbar */
.country-selection .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.country-selection .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.country-selection .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.country-selection .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Preview card */
.preview-card {
    transition: all 0.2s ease;
}

.preview-card:hover {
    border-color: #009edb;
    background-color: rgba(0, 158, 219, 0.05);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .create-coalition-modal {
        margin: 1rem;
        max-width: calc(100vw - 2rem);
    }

    .grid.md\\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .modal-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .modal-footer .flex.items-center.space-x-3 {
        justify-content: stretch;
        gap: 0.75rem;
    }

    .modal-footer button {
        flex: 1;
    }
}
</style>