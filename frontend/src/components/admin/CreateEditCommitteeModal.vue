<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between p-6 border-b border-mun-gray-200">
                        <div>
                            <h2 class="text-xl font-bold text-mun-gray-900">
                                {{ mode === 'edit' ? 'Edit Committee' : 'Create New Committee' }}
                            </h2>
                            <p class="text-sm text-mun-gray-600 mt-1">
                                {{ mode === 'edit' ? 'Update committee details and settings' : 'Set up a new MUN committee' }}
                            </p>
                        </div>

                        <button @click="close" class="p-2 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div class="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <form @submit.prevent="submitForm" class="p-6 space-y-8">
                            <!-- Basic Information -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Basic Information
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Committee Name -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Name *
                                        </label>
                                        <input v-model="formData.name" type="text" required class="input-field"
                                            placeholder="e.g., United Nations General Assembly"
                                            :class="{ 'border-mun-red-300': errors.name }" />
                                        <p v-if="errors.name" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.name }}
                                        </p>
                                    </div>

                                    <!-- Committee Type -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Type *
                                        </label>
                                        <SleekSelect v-model="formData.type" :options="[
                                            { label: 'Select committee type', value: '' },
                                            { label: 'General Assembly', value: 'GA' },
                                            { label: 'Security Council', value: 'SC' },
                                            { label: 'Economic and Social Council', value: 'ECOSOC' },
                                            { label: 'Human Rights Council', value: 'HRC' },
                                            { label: 'Legal Committee', value: 'LEGAL' },
                                            { label: 'Disarmament Committee', value: 'DISEC' },
                                            { label: 'Special Political Committee', value: 'SPECPOL' },
                                            { label: 'Other', value: 'OTHER' }
                                        ]" placeholder="Select committee type" :trigger-class="errors.type ? 'border-mun-red-300' : ''"
                                            @change="handleTypeChange" required size="md" />
                                        <p v-if="errors.type" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.type }}
                                        </p>
                                    </div>

                                    <!-- Event -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Event *
                                        </label>
                                        <SleekSelect v-model="formData.eventId" :options="[
                                            { label: 'Select event', value: '' },
                                            ...availableEvents.map(event => ({
                                                label: event.name,
                                                value: event._id
                                            }))
                                        ]" placeholder="Select event" :trigger-class="errors.eventId ? 'border-mun-red-300' : ''" searchable required
                                            size="md" />
                                        <p v-if="errors.eventId" class="mt-1 text-sm text-mun-red-600">
                                            {{ errors.eventId }}
                                        </p>
                                    </div>

                                    <!-- Status -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Status
                                        </label>
                                        <SleekSelect v-model="formData.status" :options="[
                                            { label: 'Draft', value: 'draft' },
                                            { label: 'Setup', value: 'setup' },
                                            { label: 'Active', value: 'active' },
                                            { label: 'Paused', value: 'paused' },
                                            { label: 'Completed', value: 'completed' }
                                        ]" size="md" />
                                    </div>

                                    <!-- Abbreviation -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Abbreviation
                                        </label>
                                        <input v-model="formData.abbreviation" type="text" class="input-field"
                                            placeholder="e.g., UNGA" maxlength="10" />
                                    </div>

                                    <!-- Description -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea v-model="formData.description" rows="3"
                                            class="input-field resize-none"
                                            placeholder="Describe the committee's purpose and scope..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Committee Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Committee Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Topic -->
                                    <div class="lg:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Topic
                                        </label>
                                        <input v-model="formData.topic" type="text" class="input-field"
                                            placeholder="e.g., Addressing Climate Change and Sustainable Development" />
                                    </div>

                                    <!-- Language -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Working Language
                                        </label>
                                        <SleekSelect v-model="formData.language" :options="[
                                            { label: 'English', value: 'en' },
                                            { label: 'Russian', value: 'ru' },
                                            { label: 'Uzbek (Latin)', value: 'uz_lat' },
                                            { label: 'Uzbek (Cyrillic)', value: 'uz_cyr' }
                                        ]" size="md" />
                                    </div>

                                    <!-- Max Countries -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Maximum Countries
                                        </label>
                                        <input v-model.number="formData.maxCountries" type="number" min="1" max="200"
                                            class="input-field" :placeholder="getRecommendedMaxCountries()" />
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Recommended for {{ formatCommitteeType(formData.type) }}: {{
                                                getRecommendedMaxCountries() }}
                                        </p>
                                    </div>

                                    <!-- Session Duration -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Session Duration (hours)
                                        </label>
                                        <input v-model.number="formData.sessionDuration" type="number" min="1" max="24"
                                            class="input-field" placeholder="8" />
                                    </div>

                                    <!-- Time Zone -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <SleekSelect v-model="formData.timeZone" :options="[
                                            { label: 'Asia/Tashkent (UTC+5)', value: 'Asia/Tashkent' },
                                            { label: 'UTC (UTC+0)', value: 'UTC' },
                                            { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
                                            { label: 'Europe/London (UTC+0)', value: 'Europe/London' },
                                            { label: 'Asia/Dubai (UTC+4)', value: 'Asia/Dubai' }
                                        ]" size="md" />
                                    </div>
                                </div>

                                <!-- Committee Features -->
                                <div class="space-y-4">
                                    <h4 class="font-medium text-mun-gray-900">Committee Features</h4>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="flex items-center">
                                            <input id="allowObservers" v-model="formData.allowObservers" type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="allowObservers" class="ml-2 text-sm text-mun-gray-700">
                                                Allow observers
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input id="enableVoting" v-model="formData.enableVoting" type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="enableVoting" class="ml-2 text-sm text-mun-gray-700">
                                                Enable voting
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input id="allowAmendments" v-model="formData.allowAmendments"
                                                type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="allowAmendments" class="ml-2 text-sm text-mun-gray-700">
                                                Allow amendments
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input id="requirePositionPapers" v-model="formData.requirePositionPapers"
                                                type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="requirePositionPapers" class="ml-2 text-sm text-mun-gray-700">
                                                Require position papers
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Security Council Specific Settings -->
                            <div v-if="formData.type === 'SC'" class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <ShieldCheckIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Security Council Settings
                                </h3>

                                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div class="flex items-center mb-3">
                                        <InformationCircleIcon class="w-5 h-5 text-blue-600 mr-2" />
                                        <h4 class="font-medium text-blue-900">Permanent Members Configuration</h4>
                                    </div>

                                    <div class="space-y-3">
                                        <div class="flex items-center">
                                            <input id="enableVetoPower" v-model="formData.scSettings.enableVetoPower"
                                                type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="enableVetoPower" class="ml-2 text-sm text-blue-800">
                                                Enable veto power for permanent members
                                            </label>
                                        </div>

                                        <div class="flex items-center">
                                            <input id="requireUnanimity" v-model="formData.scSettings.requireUnanimity"
                                                type="checkbox"
                                                class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded" />
                                            <label for="requireUnanimity" class="ml-2 text-sm text-blue-800">
                                                Require unanimity for procedural votes
                                            </label>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-blue-800 mb-2">
                                                Voting Threshold (non-procedural)
                                            </label>
                                            <SleekSelect v-model="formData.scSettings.votingThreshold" :options="[
                                                { label: 'Simple Majority', value: 'simple' },
                                                { label: 'Qualified Majority (9/15)', value: 'qualified' },
                                                { label: 'Two-Thirds Majority', value: 'two-thirds' }
                                            ]" trigger-class="!border-blue-300 focus:!border-blue-500" size="md" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Presidium Setup -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <UsersIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Presidium Setup
                                </h3>

                                <div class="space-y-4">
                                    <div v-for="(member, index) in formData.presidium" :key="index"
                                        class="bg-mun-gray-50 rounded-xl p-4">
                                        <div class="flex items-center justify-between mb-3">
                                            <h4 class="font-medium text-mun-gray-900">
                                                {{ formatPresidiumRole(member.role) }}
                                            </h4>
                                            <button v-if="formData.presidium.length > 1" type="button"
                                                @click="removePresidiumMember(index)"
                                                class="text-mun-red-600 hover:text-mun-red-800">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Role
                                                </label>
                                                <SleekSelect v-model="member.role" :options="[
                                                    { label: 'Chairman', value: 'chairman' },
                                                    { label: 'Co-Chairman', value: 'co-chairman' },
                                                    { label: 'Expert', value: 'expert' },
                                                    { label: 'Secretary', value: 'secretary' }
                                                ]" size="md" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Email (Optional)
                                                </label>
                                                <input v-model="member.email" type="email" class="input-field"
                                                    placeholder="presidium@munuz.org" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Name (Optional)
                                                </label>
                                                <input v-model="member.name" type="text" class="input-field"
                                                    placeholder="Full name" />
                                            </div>

                                            <div>
                                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                    Institution (Optional)
                                                </label>
                                                <input v-model="member.institution" type="text" class="input-field"
                                                    placeholder="University or organization" />
                                            </div>
                                        </div>
                                    </div>

                                    <AppButton type="button" variant="outline" size="sm" @click="addPresidiumMember"
                                        :disabled="formData.presidium.length >= 6">
                                        <PlusIcon class="w-4 h-4 mr-2" />
                                        Add Presidium Member
                                    </AppButton>
                                </div>
                            </div>

                            <!-- Advanced Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 flex items-center">
                                    <AdjustmentsHorizontalIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Advanced Settings
                                </h3>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Speaking Time -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Default Speaking Time (seconds)
                                        </label>
                                        <input v-model.number="formData.speakingTime" type="number" min="30" max="600"
                                            class="input-field" placeholder="120" />
                                    </div>

                                    <!-- Debate Format -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Debate Format
                                        </label>
                                        <SleekSelect v-model="formData.debateFormat" :options="[
                                            { label: 'Formal Debate', value: 'formal' },
                                            { label: 'Informal Consultation', value: 'informal' },
                                            { label: 'Mixed Format', value: 'mixed' }
                                        ]" size="md" />
                                    </div>

                                    <!-- Roll Call Voting -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Voting Method
                                        </label>
                                        <SleekSelect v-model="formData.votingMethod" :options="[
                                            { label: 'Placard Voting', value: 'placard' },
                                            { label: 'Roll Call', value: 'roll-call' },
                                            { label: 'Electronic Voting', value: 'electronic' }
                                        ]" size="md" />
                                    </div>

                                    <!-- Document Deadline -->
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Document Submission Deadline
                                        </label>
                                        <input v-model="formData.documentDeadline" type="datetime-local"
                                            class="input-field" />
                                    </div>
                                </div>

                                <!-- Additional Notes -->
                                <div>
                                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea v-model="formData.notes" rows="3" class="input-field resize-none"
                                        placeholder="Any additional notes or special instructions for this committee..."></textarea>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex items-center justify-between p-6 bg-mun-gray-50 border-t border-mun-gray-200">
                        <div class="flex items-center space-x-4">
                            <AppButton variant="ghost" @click="close" :disabled="isSubmitting">
                                Cancel
                            </AppButton>

                            <AppButton v-if="mode === 'edit'" variant="outline" @click="resetForm"
                                :disabled="isSubmitting">
                                <ArrowPathIcon class="w-4 h-4 mr-2" />
                                Reset
                            </AppButton>
                        </div>

                        <div class="flex items-center space-x-3">
                            <AppButton v-if="mode === 'create'" variant="outline" @click="saveDraft"
                                :loading="isDraftSaving" :disabled="isSubmitting">
                                <DocumentIcon class="w-4 h-4 mr-2" />
                                Save as Draft
                            </AppButton>

                            <AppButton variant="primary" @click="submitForm" :loading="isSubmitting">
                                <CheckIcon class="w-4 h-4 mr-2" />
                                {{ mode === 'edit' ? 'Update Committee' : 'Create Committee' }}
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    XMarkIcon,
    InformationCircleIcon,
    CogIcon,
    ShieldCheckIcon,
    UsersIcon,
    AdjustmentsHorizontalIcon,
    PlusIcon,
    ArrowPathIcon,
    DocumentIcon,
    CheckIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    committee: {
        type: Object,
        default: null
    },
    mode: {
        type: String,
        default: 'create',
        validator: (value) => ['create', 'edit'].includes(value)
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'created', 'updated'])

const toast = useToast()

// State
const isSubmitting = ref(false)
const isDraftSaving = ref(false)
const errors = ref({})
const availableEvents = ref([])

// Form data
const formData = reactive({
    // Basic Information
    name: '',
    type: '',
    eventId: '',
    status: 'draft',
    abbreviation: '',
    description: '',

    // Committee Settings
    topic: '',
    language: 'en',
    maxCountries: null,
    sessionDuration: 8,
    timeZone: 'Asia/Tashkent',
    allowObservers: false,
    enableVoting: true,
    allowAmendments: true,
    requirePositionPapers: true,

    // Security Council Specific
    scSettings: {
        enableVetoPower: true,
        requireUnanimity: false,
        votingThreshold: 'qualified'
    },

    // Presidium
    presidium: [
        { role: 'chairman', email: '', name: '', institution: '' }
    ],

    // Advanced Settings
    speakingTime: 120,
    debateFormat: 'formal',
    votingMethod: 'placard',
    documentDeadline: '',
    notes: ''
})

// Computed
const isValid = computed(() => {
    return formData.name.trim() !== '' &&
        formData.type !== '' &&
        formData.eventId !== '' &&
        Object.keys(errors.value).length === 0
})

// Watchers
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        initializeForm()
        loadEvents()
    }
})

watch(() => formData.name, () => {
    if (errors.value.name) {
        delete errors.value.name
    }
})

// Methods
const loadEvents = async () => {
    try {
        const response = await apiMethods.events.getAll({
            status: 'active,published',
            limit: 100
        })

        if (response.data.success) {
            availableEvents.value = response.data.events || []
        }

    } catch (error) {
        toast.error('Load events error:', error)
    }
}

const initializeForm = () => {
    errors.value = {}

    if (props.mode === 'edit' && props.committee) {
        // Populate form with existing committee data
        Object.keys(formData).forEach(key => {
            if (props.committee[key] !== undefined) {
                if (key === 'documentDeadline' && props.committee[key]) {
                    formData[key] = new Date(props.committee[key]).toISOString().slice(0, 16)
                } else {
                    formData[key] = props.committee[key]
                }
            }
        })

        // Handle presidium array
        if (props.committee.presidium && props.committee.presidium.length > 0) {
            formData.presidium = [...props.committee.presidium]
        }

        // Handle SC settings
        if (props.committee.scSettings) {
            formData.scSettings = { ...formData.scSettings, ...props.committee.scSettings }
        }
    } else {
        resetForm()
    }
}

const resetForm = () => {
    Object.keys(formData).forEach(key => {
        if (key === 'presidium') {
            formData[key] = [{ role: 'chairman', email: '', name: '', institution: '' }]
        } else if (key === 'scSettings') {
            formData[key] = {
                enableVetoPower: true,
                requireUnanimity: false,
                votingThreshold: 'qualified'
            }
        } else if (typeof formData[key] === 'boolean') {
            formData[key] = ['enableVoting', 'allowAmendments', 'requirePositionPapers'].includes(key)
        } else if (typeof formData[key] === 'number') {
            formData[key] = key === 'sessionDuration' ? 8 : key === 'speakingTime' ? 120 : null
        } else if (key === 'status') {
            formData[key] = 'draft'
        } else if (key === 'language') {
            formData[key] = 'en'
        } else if (key === 'timeZone') {
            formData[key] = 'Asia/Tashkent'
        } else if (key === 'debateFormat') {
            formData[key] = 'formal'
        } else if (key === 'votingMethod') {
            formData[key] = 'placard'
        } else {
            formData[key] = ''
        }
    })
    errors.value = {}
}

const handleTypeChange = () => {
    // Set recommended max countries based on committee type
    const recommendations = {
        'SC': 15,
        'GA': 193,
        'ECOSOC': 54,
        'HRC': 47,
        'LEGAL': 50,
        'DISEC': 50,
        'SPECPOL': 50,
        'OTHER': 30
    }

    if (!formData.maxCountries) {
        formData.maxCountries = recommendations[formData.type] || 30
    }
}

const formatCommitteeType = (type) => {
    const typeMap = {
        'GA': 'General Assembly',
        'SC': 'Security Council',
        'ECOSOC': 'Economic and Social Council',
        'HRC': 'Human Rights Council',
        'LEGAL': 'Legal Committee',
        'DISEC': 'Disarmament Committee',
        'SPECPOL': 'Special Political Committee',
        'OTHER': 'Other'
    }
    return typeMap[type] || type
}

const getRecommendedMaxCountries = () => {
    const recommendations = {
        'SC': '15',
        'GA': '193',
        'ECOSOC': '54',
        'HRC': '47',
        'LEGAL': '50',
        'DISEC': '50',
        'SPECPOL': '50',
        'OTHER': '30'
    }
    return recommendations[formData.type] || '30'
}

const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role
}

const addPresidiumMember = () => {
    if (formData.presidium.length < 6) {
        formData.presidium.push({
            role: 'co-chairman',
            email: '',
            name: '',
            institution: ''
        })
    }
}

const removePresidiumMember = (index) => {
    if (formData.presidium.length > 1) {
        formData.presidium.splice(index, 1)
    }
}

const validateForm = () => {
    errors.value = {}

    // Required fields
    if (!formData.name.trim()) {
        errors.value.name = 'Committee name is required'
    }

    if (!formData.type) {
        errors.value.type = 'Committee type is required'
    }

    if (!formData.eventId) {
        errors.value.eventId = 'Event selection is required'
    }

    return Object.keys(errors.value).length === 0
}

const submitForm = async () => {
    if (!validateForm()) {
        toast.error('Please fix the form errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        // Prepare data for API
        const submitData = { ...formData }

        // Convert datetime-local string to ISO string
        if (submitData.documentDeadline) {
            submitData.documentDeadline = new Date(submitData.documentDeadline).toISOString()
        }

        // Clean up presidium data
        submitData.presidium = submitData.presidium.filter(member =>
            member.role && (member.email || member.name)
        )

        let response
        if (props.mode === 'edit') {
            response = await apiMethods.committees.update(props.committee._id, submitData)
        } else {
            response = await apiMethods.committees.create(submitData)
        }

        if (response.data.success) {
            const committee = response.data.committee

            if (props.mode === 'edit') {
                emit('updated', committee)
                toast.success('Committee updated successfully')
            } else {
                emit('created', committee)
                toast.success('Committee created successfully')
            }

            close()
        } else {
            throw new Error(response.data.error || 'Failed to save committee')
        }

    } catch (error) {
        toast.error('Submit committee error:', error)
        toast.error(error.message || 'Failed to save committee')
    } finally {
        isSubmitting.value = false
    }
}

const saveDraft = async () => {
    try {
        isDraftSaving.value = true

        const draftData = { ...formData, status: 'draft' }

        if (draftData.documentDeadline) {
            draftData.documentDeadline = new Date(draftData.documentDeadline).toISOString()
        }

        draftData.presidium = draftData.presidium.filter(member =>
            member.role && (member.email || member.name)
        )

        const response = await apiMethods.committees.create(draftData)

        if (response.data.success) {
            emit('created', response.data.committee)
            toast.success('Committee saved as draft')
            close()
        }

    } catch (error) {
        toast.error('Save draft error:', error)
        toast.error('Failed to save draft')
    } finally {
        isDraftSaving.value = false
    }
}

const close = () => {
    emit('update:modelValue', false)
}

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        initializeForm()
        loadEvents()
    }
})
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.modal-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>