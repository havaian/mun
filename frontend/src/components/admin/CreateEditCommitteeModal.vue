<template>
    <ModalWrapper :model-value="modelValue" :title="mode === 'edit' ? 'Edit Committee' : 'Create New Committee'"
        :subtitle="mode === 'edit' ? 'Update committee details and settings' : 'Set up a new MUN committee'"
        :icon="BuildingOfficeIcon" size="lg" variant="default" :is-view-only="false"
        :has-unsaved-changes="hasUnsavedChanges" content-scrollable :is-loading="isSubmitting" cancel-text="Cancel"
        primary-text="Save Committee" primary-button-variant="primary" :is-primary-disabled="!isValid"
        @close="handleClose" @primary-action="handleCreateCommittee">
        <template #content>
            <div class="mt-2 space-y-2">
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
                            { label: 'General Assembly', value: 'GA' },
                            { label: 'Security Council', value: 'SC' },
                            { label: 'Other', value: 'other' }
                        ]" placeholder="Select committee type"
                            :trigger-class="errors.type ? 'border-mun-red-300' : ''" required size="md" />
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
                            ...availableEvents.map(event => ({
                                label: event.name,
                                value: event._id
                            }))
                        ]" placeholder="Select event"
                            :trigger-class="errors.eventId ? 'border-mun-red-300' : ''" searchable required size="md" />
                        <p v-if="errors.eventId" class="mt-1 text-sm text-mun-red-600">
                            {{ errors.eventId }}
                        </p>
                    </div>

                    <!-- Language -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Working Language
                        </label>
                        <SleekSelect v-model="formData.language" :options="[
                            { label: 'English', value: 'en' },
                            { label: 'Russian', value: 'ru' },
                            { label: 'Uzbek', value: 'uz' }
                        ]" size="md" />
                    </div>

                    <!-- Status -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Status
                        </label>
                        <SleekSelect v-model="formData.status" :options="[
                            { label: 'Setup', value: 'setup' },
                            { label: 'Active', value: 'active' },
                            { label: 'Completed', value: 'completed' }
                        ]" size="md" />
                    </div>

                    <!-- Description -->
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                            Description
                        </label>
                        <textarea v-model="formData.description" rows="3" class="input-field resize-none"
                            placeholder="Describe the committee's purpose and scope..."></textarea>
                    </div>
                </div>
            </div>
        </template>

        <!-- CUSTOM FOOTER BUTTONS (if you need the draft functionality) -->
        <template #footer-buttons>
            <AppButton @click="handleClose" variant="outline" :disabled="isSubmitting">
                Cancel
            </AppButton>

            <AppButton v-if="mode === 'edit'" variant="outline" @click="resetForm" :disabled="isSubmitting">
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                Reset
            </AppButton>

            <AppButton v-if="mode === 'create'" variant="outline" @click="saveDraft" :loading="isDraftSaving"
                :disabled="isSubmitting">
                <DocumentIcon class="w-4 h-4 mr-2" />
                Save as Draft
            </AppButton>

            <AppButton variant="primary" @click="handleCreateCommittee" :loading="isSubmitting" :disabled="!isValid">
                <CheckIcon class="w-4 h-4 mr-2" />
                {{ mode === 'edit' ? 'Update Committee' : 'Create Committee' }}
            </AppButton>
        </template>
    </ModalWrapper>
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
    },
    events: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'created', 'updated'])

const toast = useToast()

// State
const isSubmitting = ref(false)
const isDraftSaving = ref(false)
const errors = ref({})
const hasUnsavedChanges = ref(false)
const originalFormData = ref(null)

// Form data
const formData = reactive({
    // Basic Information - matches backend schema exactly
    name: '',
    type: '',
    eventId: '',
    description: '',
    language: 'en',
    status: 'setup'
})

// Computed
const isValid = computed(() => {
    return formData.name.trim() !== '' &&
        formData.type !== '' &&
        formData.eventId !== '' &&
        Object.keys(errors.value).length === 0
})

const availableEvents = computed(() => {
    return props.events.filter(event => event.status === 'draft')
})

// Watchers
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        initializeForm()

        // Only load events if not provided by parent
        if (props.events.length === 0) {
            loadEvents()
        } else {
            // Use events passed from parent
            availableEvents.value = props.events
        }
    }
})

watch(() => formData, (newVal) => {
    if (!originalFormData.value) return
    
    const hasChanges = Object.keys(formData).some(key => 
        formData[key] !== originalFormData.value[key]
    )
    hasUnsavedChanges.value = hasChanges
}, { deep: true })

// Methods
const loadEvents = async () => {
    try {
        const response = await apiMethods.events.getAll({
            // status: 'active,published',
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
    
    // Store original data for unsaved changes detection
    originalFormData.value = { ...formData }
    hasUnsavedChanges.value = false
}

const resetForm = () => {
    formData.name = ''
    formData.type = ''
    formData.eventId = ''
    formData.description = ''
    formData.language = 'en'
    formData.status = 'setup'
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

async function submitForm() {
    if (!validateForm()) {
        toast.error('Please fix the form errors before submitting')
        return
    }

    try {
        isSubmitting.value = true

        // Prepare data for API - matches backend exactly
        const submitData = {
            name: formData.name,
            type: formData.type,
            eventId: formData.eventId,
            description: formData.description,
            language: formData.language
        }

        // Only include status for edit mode
        if (props.mode === 'edit') {
            submitData.status = formData.status
        }

        let response
        if (props.mode === 'edit') {
            response = await apiMethods.committees.update(props.committee._id, submitData)
        } else {
            response = await apiMethods.committees.create(submitData)
        }

        if (response?.data?.success) {
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
            throw new Error(response?.data?.error || 'Failed to save committee')
        }

    } catch (error) {
        console.error('Submit committee error:', error)
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

const handleFormSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    // Do nothing - only allow explicit button clicks
}

const handleCreateCommittee = async () => {
    await submitForm()
}

const handleSaveDraft = async () => {
    await saveDraft()
}

const handleClose = () => {
    // ModalWrapper will handle unsaved changes confirmation automatically
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

<style scoped></style>