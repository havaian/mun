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
                                <BuildingOfficeIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    {{ mode === 'edit' ? 'Edit Committee' : 'Create New Committee' }}
                                </h2>
                                <p class="text-white/80 text-sm">
                                    {{ mode === 'edit' ? 'Update committee information and settings' : 'Set up a new committee for your MUN event' }}
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
                                    <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Basic Information
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Name *
                                        </label>
                                        <input v-model="formData.name" type="text" class="input-field"
                                            :class="{ 'border-red-500': errors.name }"
                                            placeholder="e.g., United Nations Security Council" maxlength="100"
                                            required />
                                        <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                                            {{ errors.name }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Acronym *
                                        </label>
                                        <input v-model="formData.acronym" type="text" class="input-field"
                                            :class="{ 'border-red-500': errors.acronym }" placeholder="e.g., UNSC"
                                            maxlength="10" style="text-transform: uppercase;" required />
                                        <p v-if="errors.acronym" class="mt-1 text-sm text-red-600">
                                            {{ errors.acronym }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Committee Type *
                                        </label>
                                        <SleekSelect v-model="formData.type" :options="committeeTypes"
                                            placeholder="Select committee type" size="md"
                                            :trigger-class="errors.type ? 'border-red-500' : ''" required />
                                        <p v-if="errors.type" class="mt-1 text-sm text-red-600">
                                            {{ errors.type }}
                                        </p>
                                    </div>

                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea v-model="formData.description" rows="4" class="input-field"
                                            placeholder="Brief description of the committee's purpose and scope..."
                                            maxlength="500"></textarea>
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            {{ formData.description?.length || 0 }}/500 characters
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Committee Settings -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Committee Settings
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Maximum Delegates
                                        </label>
                                        <input v-model.number="formData.maxDelegates" type="number" class="input-field"
                                            :class="{ 'border-red-500': errors.maxDelegates }" placeholder="e.g., 20"
                                            min="1" max="200" />
                                        <p v-if="errors.maxDelegates" class="mt-1 text-sm text-red-600">
                                            {{ errors.maxDelegates }}
                                        </p>
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Leave empty for unlimited delegates
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Working Language *
                                        </label>
                                        <SleekSelect v-model="formData.language" :options="[
                                            { label: 'Select language', value: '' },
                                            { label: 'English', value: 'en' },
                                            { label: 'French', value: 'fr' },
                                            { label: 'Spanish', value: 'es' },
                                            { label: 'Arabic', value: 'ar' },
                                            { label: 'Russian', value: 'ru' },
                                            { label: 'Chinese', value: 'zh' }
                                        ]" placeholder="Select language" size="md" :trigger-class="errors.language ? 'border-red-500' : ''" required />
                                        <p v-if="errors.language" class="mt-1 text-sm text-red-600">
                                            {{ errors.language }}
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Session Duration (minutes)
                                        </label>
                                        <input v-model.number="formData.sessionDuration" type="number" class="input-field"
                                            placeholder="e.g., 180" min="30" max="480" />
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Default session length for this committee
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Status
                                        </label>
                                        <SleekSelect v-model="formData.status" :options="[
                                            { label: 'Active', value: 'active' },
                                            { label: 'Inactive', value: 'inactive' },
                                            { label: 'Draft', value: 'draft' }
                                        ]" size="md" />
                                    </div>
                                </div>

                                <!-- Committee Features -->
                                <div class="mt-6">
                                    <h4 class="text-sm font-medium text-mun-gray-700 mb-3">Committee Features</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.allowGuestSpeakers" type="checkbox"
                                                class="input-field" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Guest Speakers</div>
                                                <div class="text-xs text-mun-gray-500">Allow non-delegate speakers</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.enableVoting" type="checkbox"
                                                class="input-field" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Voting System</div>
                                                <div class="text-xs text-mun-gray-500">Enable electronic voting</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.enableDocumentSharing" type="checkbox"
                                                class="input-field" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Document Sharing
                                                </div>
                                                <div class="text-xs text-mun-gray-500">Allow delegates to share
                                                    documents</div>
                                            </div>
                                        </label>

                                        <label class="flex items-center space-x-3 cursor-pointer">
                                            <input v-model="formData.enablePrivateMessaging" type="checkbox"
                                                class="input-field" />
                                            <div>
                                                <div class="text-sm font-medium text-mun-gray-900">Private Messaging
                                                </div>
                                                <div class="text-xs text-mun-gray-500">Allow delegate-to-delegate
                                                    messages</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Agenda Topics -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <DocumentTextIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Agenda Topics
                                </h3>

                                <div class="space-y-4">
                                    <div v-for="(topic, index) in formData.agendaTopics" :key="index"
                                        class="flex items-start space-x-3 p-4 bg-mun-gray-50 rounded-lg">
                                        <div class="flex-1 space-y-3">
                                            <input v-model="topic.title" type="text" class="input-field"
                                                placeholder="Topic title" maxlength="200" />
                                            <textarea v-model="topic.description" rows="2" class="input-field"
                                                placeholder="Topic description (optional)" maxlength="300"></textarea>
                                        </div>

                                        <button type="button" @click="removeAgendaTopic(index)"
                                            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove topic">
                                            <TrashIcon class="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button type="button" @click="addAgendaTopic"
                                        class="w-full p-3 border-2 border-dashed border-mun-gray-300 rounded-lg text-mun-gray-600 hover:border-mun-blue hover:text-mun-blue transition-colors">
                                        <PlusIcon class="w-5 h-5 mx-auto mb-1" />
                                        Add Agenda Topic
                                    </button>
                                </div>
                            </div>

                            <!-- Presidium Assignment -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <UsersIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Presidium Assignment
                                </h3>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Chairman
                                        </label>
                                        <SleekSelect v-model="formData.chairman" :options="[
                                            { label: 'Select chairman', value: '' },
                                            ...availablePresidium.map(user => ({
                                                label: `${user.name} (${user.email})`,
                                                value: user.id
                                            }))
                                        ]" placeholder="Select chairman" searchable size="md" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Co-Chairman
                                        </label>
                                        <SleekSelect v-model="formData.coChairman" :options="[
                                            { label: 'Select co-chairman', value: '' },
                                            ...availablePresidium.map(user => ({
                                                label: `${user.name} (${user.email})`,
                                                value: user.id
                                            }))
                                        ]" placeholder="Select co-chairman" searchable size="md" />
                                    </div>

                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Additional Presidium Members
                                        </label>
                                        <div class="space-y-2">
                                            <div v-for="(member, index) in formData.presidiumMembers" :key="index"
                                                class="flex items-center space-x-3">
                                                <SleekSelect v-model="member.userId" :options="[
                                                    { label: 'Select member', value: '' },
                                                    ...availablePresidium.map(user => ({
                                                        label: `${user.name} (${user.email})`,
                                                        value: user.id
                                                    }))
                                                ]" placeholder="Select member" searchable size="md" container-class="flex-1" />

                                                <SleekSelect v-model="member.role" :options="[
                                                    { label: 'Expert', value: 'expert' },
                                                    { label: 'Secretary', value: 'secretary' }
                                                ]" size="md" container-class="w-32" />

                                                <button type="button" @click="removePresidiumMember(index)"
                                                    class="p-2 text-red-500 hover:text-red-700 rounded-lg">
                                                    <TrashIcon class="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button type="button" @click="addPresidiumMember"
                                                class="w-full p-2 border border-dashed border-mun-gray-300 rounded-lg text-mun-gray-600 hover:border-mun-blue hover:text-mun-blue transition-colors text-sm">
                                                + Add Presidium Member
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Settings -->
                            <div class="mun-card p-6">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                    <AdjustmentsHorizontalIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                    Additional Settings
                                </h3>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Background Guide URL
                                        </label>
                                        <input v-model="formData.backgroundGuideUrl" type="url" class="input-field"
                                            placeholder="https://example.com/background-guide.pdf" />
                                        <p class="mt-1 text-xs text-mun-gray-500">
                                            Link to the committee's background guide document
                                        </p>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Meeting Room/Location
                                        </label>
                                        <input v-model="formData.meetingRoom" type="text" class="input-field"
                                            placeholder="e.g., Conference Room A, Virtual Room 1" />
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Internal Notes
                                        </label>
                                        <textarea v-model="formData.internalNotes" rows="3" class="input-field"
                                            placeholder="Internal notes for administrators (not visible to delegates)"></textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                        <div class="text-sm text-mun-gray-500">
                            {{ mode === 'edit' ? 'Changes will be saved immediately' : 'Committee will be created in draft status' }}
                        </div>

                        <div class="flex space-x-3">
                            <AppButton @click="closeModal" variant="outline" :disabled="isSubmitting">
                                Cancel
                            </AppButton>

                            <AppButton @click="saveDraft" variant="outline" :loading="isDraftSaving"
                                :disabled="isSubmitting" v-if="mode === 'create'">
                                Save as Draft
                            </AppButton>

                            <AppButton @click="handleSubmit" variant="primary" :loading="isSubmitting">
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'
import {
    XMarkIcon,
    BuildingOfficeIcon,
    InformationCircleIcon,
    CogIcon,
    DocumentTextIcon,
    UsersIcon,
    AdjustmentsHorizontalIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/vue/24/outline'

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
        default: 'create', // 'create' or 'edit'
        validator: (value) => ['create', 'edit'].includes(value)
    }
})

const emit = defineEmits(['update:modelValue', 'created', 'updated'])

const toast = useToast()

// State
const isSubmitting = ref(false)
const isDraftSaving = ref(false)
const errors = ref({})
const availablePresidium = ref([])

// Committee types
const committeeTypes = [
    { value: 'ga', label: 'General Assembly' },
    { value: 'sc', label: 'Security Council' },
    { value: 'ecosoc', label: 'Economic and Social Council' },
    { value: 'tc', label: 'Trusteeship Council' },
    { value: 'icj', label: 'International Court of Justice' },
    { value: 'specialized', label: 'Specialized Agency' },
    { value: 'regional', label: 'Regional Organization' },
    { value: 'crisis', label: 'Crisis Committee' },
    { value: 'joint', label: 'Joint Committee' },
    { value: 'historical', label: 'Historical Committee' }
]

// Form data
const formData = reactive({
    name: '',
    acronym: '',
    type: '',
    description: '',
    maxDelegates: null,
    language: 'en',
    sessionDuration: 180,
    status: 'active',
    allowGuestSpeakers: false,
    enableVoting: true,
    enableDocumentSharing: true,
    enablePrivateMessaging: true,
    agendaTopics: [{ title: '', description: '' }],
    chairman: '',
    coChairman: '',
    presidiumMembers: [],
    backgroundGuideUrl: '',
    meetingRoom: '',
    internalNotes: ''
})

// Computed
const isValid = computed(() => {
    return formData.name &&
        formData.acronym &&
        formData.type &&
        formData.language &&
        Object.keys(errors.value).length === 0
})

// Methods
const closeModal = () => {
    if (isSubmitting.value || isDraftSaving.value) return
    resetForm()
    emit('update:modelValue', false)
}

const resetForm = () => {
    Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
            if (key === 'agendaTopics') {
                formData[key] = [{ title: '', description: '' }]
            } else {
                formData[key] = []
            }
        } else if (typeof formData[key] === 'boolean') {
            const defaults = {
                allowGuestSpeakers: false,
                enableVoting: true,
                enableDocumentSharing: true,
                enablePrivateMessaging: true
            }
            formData[key] = defaults[key] || false
        } else if (typeof formData[key] === 'number') {
            const defaults = {
                sessionDuration: 180
            }
            formData[key] = defaults[key] || null
        } else {
            const defaults = {
                language: 'en',
                status: 'active'
            }
            formData[key] = defaults[key] || ''
        }
    })
    errors.value = {}
}

const loadCommitteeData = () => {
    if (props.committee && props.mode === 'edit') {
        Object.keys(formData).forEach(key => {
            if (props.committee[key] !== undefined) {
                formData[key] = props.committee[key]
            }
        })
    }
}

const loadAvailablePresidium = async () => {
    try {
        const response = await apiMethods.get('/admin/users', {
            params: { role: 'presidium', status: 'active' }
        })
        availablePresidium.value = response.data.users || []
    } catch (error) {
        toast.error('Failed to load presidium members:', error)
        toast.error('Failed to load available presidium members')
    }
}

const validateForm = () => {
    errors.value = {}

    if (!formData.name.trim()) {
        errors.value.name = 'Committee name is required'
    }

    if (!formData.acronym.trim()) {
        errors.value.acronym = 'Acronym is required'
    } else if (formData.acronym.length > 10) {
        errors.value.acronym = 'Acronym must be 10 characters or less'
    }

    if (!formData.type) {
        errors.value.type = 'Committee type is required'
    }

    if (!formData.language) {
        errors.value.language = 'Working language is required'
    }

    if (formData.maxDelegates && (formData.maxDelegates < 1 || formData.maxDelegates > 200)) {
        errors.value.maxDelegates = 'Maximum delegates must be between 1 and 200'
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

        // Clean up agenda topics
        formData.agendaTopics = formData.agendaTopics.filter(topic => topic.title.trim())

        // Clean up presidium members
        formData.presidiumMembers = formData.presidiumMembers.filter(member => member.userId)

        let response
        if (props.mode === 'edit') {
            response = await apiMethods.put(`/admin/committees/${props.committee.id}`, formData)
            emit('updated', response.data.committee)
            toast.success('Committee updated successfully')
        } else {
            response = await apiMethods.post('/admin/committees', formData)
            emit('created', response.data.committee)
            toast.success('Committee created successfully')
        }

        closeModal()

    } catch (error) {
        toast.error('Failed to save committee:', error)

        if (error.response?.data?.errors) {
            errors.value = error.response.data.errors
        }

        toast.error(error.response?.data?.message || 'Failed to save committee')
    } finally {
        isSubmitting.value = false
    }
}

const saveDraft = async () => {
    try {
        isDraftSaving.value = true

        const draftData = { ...formData, status: 'draft' }
        draftData.agendaTopics = draftData.agendaTopics.filter(topic => topic.title.trim())
        draftData.presidiumMembers = draftData.presidiumMembers.filter(member => member.userId)

        const response = await apiMethods.post('/admin/committees', draftData)

        emit('created', response.data.committee)
        toast.success('Committee saved as draft')
        closeModal()

    } catch (error) {
        toast.error('Failed to save draft:', error)
        toast.error('Failed to save draft')
    } finally {
        isDraftSaving.value = false
    }
}

const addAgendaTopic = () => {
    formData.agendaTopics.push({ title: '', description: '' })
}

const removeAgendaTopic = (index) => {
    if (formData.agendaTopics.length > 1) {
        formData.agendaTopics.splice(index, 1)
    }
}

const addPresidiumMember = () => {
    formData.presidiumMembers.push({ userId: '', role: 'expert' })
}

const removePresidiumMember = (index) => {
    formData.presidiumMembers.splice(index, 1)
}

// Watchers
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        loadCommitteeData()
        loadAvailablePresidium()
    }
})

watch(() => formData.acronym, (newVal) => {
    formData.acronym = newVal.toUpperCase()
})

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        loadCommitteeData()
        loadAvailablePresidium()
    }
})
</script>

<style scoped>
</style>