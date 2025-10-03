<template>
    <div class="w-full max-w-4xl mx-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div>
                <h3 class="text-lg font-semibold text-gray-900">Manage Coalition</h3>
                <p class="text-sm text-gray-500 mt-1">
                    {{ coalition?.name }} - Manage members and settings
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

        <!-- Content -->
        <div class="p-6 bg-white max-h-[75vh] overflow-y-auto">
            <!-- Tab Navigation -->
            <div class="border-b border-gray-200 mb-6">
                <nav class="flex space-x-8">
                    <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                        'py-2 text-sm font-medium border-b-2 transition-colors',
                        activeTab === tab.id
                            ? 'border-un-blue text-un-blue'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]">
                        {{ tab.name }}
                    </button>
                </nav>
            </div>

            <!-- Members Tab -->
            <div v-if="activeTab === 'members'" class="space-y-6">
                <!-- Current Members -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-base font-medium text-gray-900">
                            Current Members ({{ members.length }})
                        </h4>
                        <button @click="showInviteModal = true" class="btn-un-primary text-sm px-4 py-2">
                            + Invite Countries
                        </button>
                    </div>

                    <div class="space-y-3">
                        <div v-for="member in members" :key="member.id"
                            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center space-x-4">
                                <img :src="member.flagUrl" :alt="member.country" class="w-8 h-6 rounded-sm" />
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ member.country }}</p>
                                    <p class="text-xs text-gray-500">{{ member.delegateName }}</p>
                                </div>
                                <span v-if="member.isHead"
                                    class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                    <CrownIcon class="w-3 h-3 mr-1" />
                                    Coalition Head
                                </span>
                            </div>

                            <div class="flex items-center space-x-3">
                                <span :class="[
                                    'text-xs px-2 py-1 rounded-full',
                                    getMemberStatusColor(member.status)
                                ]">
                                    {{ member.status }}
                                </span>

                                <span class="text-xs text-gray-400">
                                    Joined {{ formatRelativeTime(member.joinedAt) }}
                                </span>

                                <!-- Member Actions -->
                                <div v-if="!member.isHead" class="flex items-center space-x-1">
                                    <button @click="transferLeadership(member)"
                                        class="text-blue-500 hover:text-blue-700 text-xs font-medium"
                                        title="Transfer leadership">
                                        Make Head
                                    </button>

                                    <span class="text-gray-300">•</span>

                                    <button @click="removeMember(member)"
                                        class="text-red-500 hover:text-red-700 text-xs font-medium"
                                        title="Remove member">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pending Invitations -->
                <div v-if="pendingInvitations.length > 0">
                    <h4 class="text-base font-medium text-gray-900 mb-4">
                        Pending Invitations ({{ pendingInvitations.length }})
                    </h4>

                    <div class="space-y-2">
                        <div v-for="invitation in pendingInvitations" :key="invitation.id"
                            class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <img :src="invitation.flagUrl" :alt="invitation.country" class="w-6 h-4 rounded-sm" />
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ invitation.country }}</p>
                                    <p class="text-xs text-gray-500">
                                        Invited {{ formatRelativeTime(invitation.sentAt) }}
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-center space-x-2">
                                <button @click="resendInvitation(invitation)"
                                    class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    Resend
                                </button>

                                <button @click="cancelInvitation(invitation)"
                                    class="text-xs text-red-600 hover:text-red-700 font-medium">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings Tab -->
            <div v-if="activeTab === 'settings'" class="space-y-6">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-base font-medium text-gray-900 mb-4">Coalition Settings</h4>

                    <div class="space-y-4">
                        <!-- Coalition Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Coalition Name
                            </label>
                            <input v-model="coalitionSettings.name" type="text" class="input-field"
                                :class="{ 'border-red-500': errors.name }" />
                            <p v-if="errors.name" class="text-sm text-red-600 mt-1">{{ errors.name }}</p>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea v-model="coalitionSettings.description" rows="3" class="input-field resize-none"
                                placeholder="Update the coalition description..."></textarea>
                        </div>

                        <!-- Focus Area -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Focus Area
                            </label>
                            <select v-model="coalitionSettings.focusArea" class="input-field">
                                <option v-for="area in focusAreas" :key="area.value" :value="area.value">
                                    {{ area.label }}
                                </option>
                            </select>
                        </div>

                        <!-- Coalition Rules -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Coalition Rules
                            </label>
                            <div class="space-y-2">
                                <div v-for="(rule, index) in coalitionSettings.rules" :key="index"
                                    class="flex items-center space-x-2">
                                    <input v-model="coalitionSettings.rules[index]" type="text"
                                        class="flex-1 input-field text-sm" :placeholder="`Rule ${index + 1}`" />
                                    <button @click="removeRule(index)" class="text-red-500 hover:text-red-700">
                                        <XMarkIcon class="w-4 h-4" />
                                    </button>
                                </div>

                                <button @click="addRule"
                                    class="text-sm text-un-blue hover:text-un-blue-600 font-medium">
                                    + Add Rule
                                </button>
                            </div>
                        </div>

                        <!-- Privacy Settings -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                Privacy Settings
                            </label>
                            <div class="space-y-3">
                                <label class="flex items-center">
                                    <input v-model="coalitionSettings.isPublic" type="checkbox"
                                        class="rounded border-gray-300 text-un-blue focus:ring-un-blue" />
                                    <span class="ml-2 text-sm text-gray-700">
                                        Make coalition visible to other delegates
                                    </span>
                                </label>

                                <label class="flex items-center">
                                    <input v-model="coalitionSettings.allowObservers" type="checkbox"
                                        class="rounded border-gray-300 text-un-blue focus:ring-un-blue" />
                                    <span class="ml-2 text-sm text-gray-700">
                                        Allow observers to view coalition documents
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Save Settings -->
                <div class="flex justify-end">
                    <button @click="saveSettings" :disabled="isSaving"
                        class="btn-un-primary text-sm px-6 py-2 disabled:opacity-50">
                        <span v-if="isSaving">Saving...</span>
                        <span v-else>Save Changes</span>
                    </button>
                </div>
            </div>

            <!-- Documents Tab -->
            <div v-if="activeTab === 'documents'" class="space-y-6">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-base font-medium text-gray-900">
                        Coalition Documents ({{ coalitionDocuments.length }})
                    </h4>
                    <button @click="createDocument" class="btn-un-primary text-sm px-4 py-2">
                        + Create Document
                    </button>
                </div>

                <div v-if="coalitionDocuments.length === 0" class="text-center py-12">
                    <DocumentIcon class="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p class="text-gray-500 mb-4">No documents created yet</p>
                    <button @click="createDocument" class="btn-un-secondary text-sm px-4 py-2">
                        Create First Document
                    </button>
                </div>

                <div v-else class="space-y-3">
                    <div v-for="document in coalitionDocuments" :key="document.id"
                        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-4">
                            <div :class="['p-2 rounded-lg', getDocumentTypeColor(document.type)]">
                                <DocumentIcon class="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-900">{{ document.title }}</p>
                                <p class="text-xs text-gray-500">
                                    {{ document.type }} • {{ document.author }} • {{
                                    formatRelativeTime(document.createdAt) }}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <span :class="[
                                'text-xs px-2 py-1 rounded-full',
                                getDocumentStatusColor(document.status)
                            ]">
                                {{ document.status.replace('_', ' ').toUpperCase() }}
                            </span>

                            <div class="flex items-center space-x-1">
                                <button @click="viewDocument(document)" class="text-gray-400 hover:text-gray-600"
                                    title="View document">
                                    <EyeIcon class="w-4 h-4" />
                                </button>

                                <button v-if="document.status === 'draft'" @click="editDocument(document)"
                                    class="text-gray-400 hover:text-gray-600" title="Edit document">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invite Countries Modal -->
        <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-900">Invite Countries</h4>
                </div>

                <div class="p-6 overflow-y-auto max-h-96">
                    <!-- Search -->
                    <div class="mb-4">
                        <input v-model="inviteSearch" type="text" placeholder="Search countries..."
                            class="input-field" />
                    </div>

                    <!-- Available Countries -->
                    <div class="space-y-2">
                        <label v-for="country in filteredAvailableCountries" :key="country.id"
                            class="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input v-model="selectedCountries" type="checkbox" :value="country.id"
                                class="rounded border-gray-300 text-un-blue focus:ring-un-blue" />
                            <img :src="country.flagUrl" :alt="country.name" class="w-6 h-4 rounded-sm ml-3 mr-3" />
                            <span class="text-sm text-gray-900">{{ country.name }}</span>
                        </label>
                    </div>
                </div>

                <div class="p-6 border-t border-gray-200 flex items-center justify-between">
                    <p class="text-sm text-gray-500">
                        {{ selectedCountries.length }} countries selected
                    </p>

                    <div class="flex items-center space-x-3">
                        <button @click="showInviteModal = false"
                            class="text-gray-500 hover:text-gray-700 font-medium px-4 py-2">
                            Cancel
                        </button>

                        <button @click="sendInvitations" :disabled="selectedCountries.length === 0 || isSendingInvites"
                            class="btn-un-primary text-sm px-4 py-2 disabled:opacity-50">
                            <span v-if="isSendingInvites">Sending...</span>
                            <span v-else>Send Invitations</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Icons
import {
    XMarkIcon,
    DocumentIcon,
    EyeIcon,
    PencilIcon,
    UserPlusIcon
} from '@heroicons/vue/24/outline'

// Custom Crown Icon component
const CrownIcon = {
    template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5 4 4-7 4 7 5-4-2 11H5z"/>
    </svg>
  `
}

// Props & Emits
const props = defineProps({
    coalitionId: {
        type: String,
        required: true
    },
    onUpdate: {
        type: Function,
        default: () => { }
    }
})

const emit = defineEmits(['close'])

// Composables
const toast = useToast()
const authStore = useAuthStore()

// State
const isLoading = ref(true)
const loadingMessage = ref('')
const isSaving = ref(false)
const isSendingInvites = ref(false)
const activeTab = ref('members')
const showInviteModal = ref(false)
const inviteSearch = ref('')
const selectedCountries = ref([])

// Data
const coalition = ref(null)
const members = ref([])
const pendingInvitations = ref([])
const coalitionDocuments = ref([])
const availableCountries = ref([])

// Form data
const coalitionSettings = reactive({
    name: '',
    description: '',
    focusArea: '',
    rules: [],
    isPublic: true,
    allowObservers: false
})

// Validation errors
const errors = reactive({})

// Tab configuration
const tabs = ref([
    { id: 'members', name: 'Members' },
    { id: 'settings', name: 'Settings' },
    { id: 'documents', name: 'Documents' }
])

// Focus areas
const focusAreas = ref([
    { value: 'political_security', label: 'Political & Security' },
    { value: 'economic_social', label: 'Economic & Social' },
    { value: 'humanitarian', label: 'Humanitarian Affairs' },
    { value: 'environment', label: 'Environmental Issues' },
    { value: 'legal', label: 'Legal Affairs' },
    { value: 'disarmament', label: 'Disarmament' },
    { value: 'human_rights', label: 'Human Rights' },
    { value: 'development', label: 'Sustainable Development' }
])

// Computed
const filteredAvailableCountries = computed(() => {
    if (!inviteSearch.value.trim()) return availableCountries.value

    const search = inviteSearch.value.toLowerCase()
    return availableCountries.value.filter(country =>
        country.name.toLowerCase().includes(search)
    )
})

// Methods
const loadCoalitionData = async () => {
    isLoading.value = true
    loadingMessage.value = 'Loading coalition data...'

    try {
        // Load coalition details
        const coalitionResponse = await apiMethods.coalitions.getById(props.coalitionId)
        coalition.value = coalitionResponse.data

        // Populate settings form
        Object.keys(coalitionSettings).forEach(key => {
            if (coalition.value[key] !== undefined) {
                coalitionSettings[key] = coalition.value[key]
            }
        })

        // Load members
        const membersResponse = await apiMethods.coalitions.getMembers(props.coalitionId)
        members.value = membersResponse.data

        // Load pending invitations
        pendingInvitations.value = coalition.value.pendingInvitations || []

        // Load coalition documents
        coalitionDocuments.value = coalition.value.documents || []

        // Load available countries for invitations
        const countriesResponse = await apiMethods.coalitions.getAvailableCountries(coalition.value.committeeId)
        availableCountries.value = countriesResponse.data

    } catch (error) {
        console.error('Load coalition data error:', error)
        toast.error('Failed to load coalition data')
    } finally {
        isLoading.value = false
    }
}

const transferLeadership = async (member) => {
    if (!confirm(`Are you sure you want to transfer coalition leadership to ${member.country}? This action cannot be undone.`)) {
        return
    }

    try {
        await apiMethods.coalitions.transferLeadership(props.coalitionId, member.userId)
        toast.success(`Leadership transferred to ${member.country}`)
        loadCoalitionData() // Reload data
    } catch (error) {
        console.error('Transfer leadership error:', error)
        toast.error('Failed to transfer leadership')
    }
}

const removeMember = async (member) => {
    if (!confirm(`Are you sure you want to remove ${member.country} from the coalition?`)) {
        return
    }

    try {
        await apiMethods.coalitions.removeMember(props.coalitionId, member.id)
        toast.success(`${member.country} removed from coalition`)
        loadCoalitionData() // Reload data
    } catch (error) {
        console.error('Remove member error:', error)
        toast.error('Failed to remove member')
    }
}

const resendInvitation = async (invitation) => {
    try {
        await apiMethods.coalitions.sendInvitations(props.coalitionId, {
            countries: [invitation.countryId],
            message: 'Invitation resent'
        })
        toast.success(`Invitation resent to ${invitation.country}`)
    } catch (error) {
        console.error('Resend invitation error:', error)
        toast.error('Failed to resend invitation')
    }
}

const cancelInvitation = async (invitation) => {
    try {
        // This would be an API call to cancel the invitation
        toast.success(`Invitation to ${invitation.country} cancelled`)
        loadCoalitionData() // Reload data
    } catch (error) {
        console.error('Cancel invitation error:', error)
        toast.error('Failed to cancel invitation')
    }
}

const sendInvitations = async () => {
    if (selectedCountries.value.length === 0) return

    isSendingInvites.value = true

    try {
        await apiMethods.coalitions.sendInvitations(props.coalitionId, {
            countries: selectedCountries.value,
            message: 'You are invited to join our coalition'
        })

        toast.success(`Invitations sent to ${selectedCountries.value.length} countries`)
        showInviteModal.value = false
        selectedCountries.value = []
        loadCoalitionData() // Reload data

    } catch (error) {
        console.error('Send invitations error:', error)
        toast.error('Failed to send invitations')
    } finally {
        isSendingInvites.value = false
    }
}

const saveSettings = async () => {
    if (!validateSettings()) return

    isSaving.value = true

    try {
        await apiMethods.coalitions.update(props.coalitionId, coalitionSettings)
        toast.success('Coalition settings updated successfully')
        props.onUpdate(coalitionSettings)
    } catch (error) {
        console.error('Save settings error:', error)
        toast.error('Failed to save settings')
    } finally {
        isSaving.value = false
    }
}

const validateSettings = () => {
    clearErrors()
    let hasErrors = false

    if (!coalitionSettings.name.trim()) {
        errors.name = 'Coalition name is required'
        hasErrors = true
    }

    return !hasErrors
}

const clearErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key])
}

const addRule = () => {
    coalitionSettings.rules.push('')
}

const removeRule = (index) => {
    coalitionSettings.rules.splice(index, 1)
}

const createDocument = () => {
    // This would open the document creation modal
    toast.info('Document creation modal would open here')
}

const viewDocument = (document) => {
    // This would open the document view modal
    console.log('View document:', document.id)
}

const editDocument = (document) => {
    // This would open the document edit modal
    console.log('Edit document:', document.id)
}

// Helper functions
const getMemberStatusColor = (status) => {
    const colors = {
        active: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        invited: 'bg-blue-100 text-blue-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const getDocumentTypeColor = (type) => {
    const colors = {
        resolution: 'bg-blue-500',
        amendment: 'bg-purple-500',
        position_paper: 'bg-green-500',
        working_paper: 'bg-orange-500'
    }
    return colors[type] || 'bg-gray-500'
}

const getDocumentStatusColor = (status) => {
    const colors = {
        draft: 'bg-gray-100 text-gray-700',
        under_review: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
}

const formatRelativeTime = (date) => {
    if (!date) return 'Unknown'

    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

// Lifecycle
onMounted(() => {
    loadCoalitionData()
})
</script>