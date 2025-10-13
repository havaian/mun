<!-- frontend/src/components/delegate/MessageComposer.vue -->
<template>
    <div class="message-composer bg-white border border-mun-gray-200 rounded-lg">
        <!-- Header -->
        <div class="composer-header flex items-center justify-between p-4 border-b border-mun-gray-200">
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-mun-blue/10 rounded-lg">
                    <PencilSquareIcon class="w-5 h-5 text-mun-blue" />
                </div>
                <div>
                    <h3 class="text-sm font-medium text-mun-gray-900">Compose Message</h3>
                    <p class="text-xs text-mun-gray-600">Send diplomatic notes and committee messages</p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <!-- Message Type Toggle -->
                <div class="message-type-toggle flex bg-mun-gray-100 rounded-lg p-1">
                    <button v-for="type in messageTypes" :key="type.value" @click="messageType = type.value" :class="[
                        'px-3 py-1 text-xs font-medium rounded transition-all duration-200',
                        messageType === type.value
                            ? 'bg-white text-mun-blue shadow-sm'
                            : 'text-mun-gray-600 hover:text-mun-gray-900'
                    ]">
                        {{ type.name }}
                    </button>
                </div>

                <!-- Minimize/Expand -->
                <button @click="isMinimized = !isMinimized"
                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                    <component :is="isMinimized ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4 text-mun-gray-600" />
                </button>
            </div>
        </div>

        <!-- Composer Body -->
        <div v-if="!isMinimized" class="composer-body p-4 space-y-4">
            <!-- Recipients Section -->
            <div class="recipients-section">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    {{ messageType === 'diplomatic' ? 'To Country' : 'Recipients' }}
                    <span class="text-red-500">*</span>
                </label>

                <!-- Diplomatic Note - Single Country -->
                <div v-if="messageType === 'diplomatic'" class="diplomatic-recipient">
                    <div class="relative">
                        <input v-model="recipientSearch" @input="filterRecipients" @focus="showRecipientDropdown = true"
                            type="text" placeholder="Search for a country..."
                            class="w-full px-4 py-3 pl-10 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-transparent"
                            :class="{ 'border-red-300': errors.recipients }" />
                        <MagnifyingGlassIcon
                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mun-gray-400" />
                    </div>

                    <!-- Selected Recipient -->
                    <div v-if="selectedRecipient"
                        class="selected-recipient mt-2 p-3 bg-mun-blue/5 border border-mun-blue/20 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <CountryFlag :country="selectedRecipient.name" size="sm" />
                                <div>
                                    <span class="text-sm font-medium text-mun-gray-900">{{ selectedRecipient.name
                                        }}</span>
                                    <p class="text-xs text-mun-gray-600">{{ selectedRecipient.email }}</p>
                                </div>
                            </div>
                            <button @click="clearRecipient"
                                class="p-1 text-mun-gray-400 hover:text-red-600 transition-colors">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- Recipients Dropdown -->
                    <div v-if="showRecipientDropdown && filteredRecipients.length > 0"
                        class="recipients-dropdown absolute z-10 w-full mt-1 bg-white border border-mun-gray-200 rounded-lg shadow-mun max-h-48 overflow-y-auto">
                        <div v-for="recipient in filteredRecipients.slice(0, 10)" :key="recipient.email"
                            @click="selectRecipient(recipient)"
                            class="recipient-option flex items-center space-x-3 p-3 cursor-pointer hover:bg-mun-gray-50 transition-colors">
                            <CountryFlag :country="recipient.name" size="sm" />
                            <div>
                                <span class="text-sm font-medium text-mun-gray-900">{{ recipient.name }}</span>
                                <p class="text-xs text-mun-gray-600">{{ recipient.email }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Committee Message - Multiple Recipients -->
                <div v-else class="committee-recipients">
                    <div class="recipient-options grid grid-cols-1 md:grid-cols-2 gap-3">
                        <!-- All Committee -->
                        <div @click="toggleCommitteeRecipient('all')" :class="[
                            'recipient-card p-3 border-2 rounded-lg cursor-pointer transition-all duration-200',
                            recipients.includes('all')
                                ? 'border-mun-blue bg-mun-blue/5'
                                : 'border-mun-gray-200 hover:border-mun-blue/30'
                        ]">
                            <div class="flex items-center space-x-3">
                                <UserGroupIcon class="w-5 h-5 text-mun-gray-600" />
                                <div>
                                    <span class="text-sm font-medium text-mun-gray-900">All Committee</span>
                                    <p class="text-xs text-mun-gray-600">Send to entire committee</p>
                                </div>
                            </div>
                        </div>

                        <!-- Presidium Only -->
                        <div @click="toggleCommitteeRecipient('presidium')" :class="[
                            'recipient-card p-3 border-2 rounded-lg cursor-pointer transition-all duration-200',
                            recipients.includes('presidium')
                                ? 'border-mun-blue bg-mun-blue/5'
                                : 'border-mun-gray-200 hover:border-mun-blue/30'
                        ]">
                            <div class="flex items-center space-x-3">
                                <CrownIcon class="w-5 h-5 text-mun-gray-600" />
                                <div>
                                    <span class="text-sm font-medium text-mun-gray-900">Presidium</span>
                                    <p class="text-xs text-mun-gray-600">Send to presidium members</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Recipients -->
                    <div class="custom-recipients mt-3">
                        <button @click="showCustomRecipients = !showCustomRecipients"
                            class="flex items-center space-x-2 text-sm text-mun-blue hover:text-mun-blue-600 transition-colors">
                            <PlusIcon class="w-4 h-4" />
                            <span>Select specific countries</span>
                        </button>

                        <div v-if="showCustomRecipients"
                            class="custom-recipients-list mt-3 p-3 bg-mun-gray-50 rounded-lg">
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                <label v-for="country in availableCountries" :key="country.email"
                                    class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" :value="country.email" v-model="customRecipients"
                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                    <CountryFlag :country="country.name" size="xs" />
                                    <span>{{ country.name }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <p v-if="errors.recipients" class="text-sm text-red-600 mt-1">{{ errors.recipients }}</p>
            </div>

            <!-- Subject -->
            <div class="subject-section">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Subject <span class="text-red-500">*</span>
                </label>
                <input v-model="messageSubject" type="text" placeholder="Enter message subject..." maxlength="200"
                    class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-transparent"
                    :class="{ 'border-red-300': errors.subject }" />
                <div class="flex items-center justify-between mt-1">
                    <p v-if="errors.subject" class="text-sm text-red-600">{{ errors.subject }}</p>
                    <span class="text-xs text-mun-gray-500 ml-auto">{{ messageSubject.length }}/200</span>
                </div>
            </div>

            <!-- Priority -->
            <div class="priority-section">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Priority
                </label>
                <div class="priority-options flex space-x-3">
                    <button v-for="priority in priorityLevels" :key="priority.value"
                        @click="messagePriority = priority.value" :class="[
                            'priority-btn flex items-center space-x-2 px-3 py-2 border rounded-lg transition-all duration-200',
                            messagePriority === priority.value
                                ? `${priority.activeBg} ${priority.activeBorder} ${priority.activeText}`
                                : 'bg-white border-mun-gray-200 text-mun-gray-700 hover:bg-mun-gray-50'
                        ]">
                        <component :is="priority.icon" class="w-4 h-4" />
                        <span class="text-sm font-medium">{{ priority.name }}</span>
                    </button>
                </div>
            </div>

            <!-- Message Body -->
            <div class="message-body-section">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Message <span class="text-red-500">*</span>
                </label>
                <textarea v-model="messageContent" placeholder="Type your message here..." rows="6" maxlength="2000"
                    class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"
                    :class="{ 'border-red-300': errors.content }"></textarea>
                <div class="flex items-center justify-between mt-1">
                    <p v-if="errors.content" class="text-sm text-red-600">{{ errors.content }}</p>
                    <span class="text-xs text-mun-gray-500 ml-auto">{{ messageContent.length }}/2000</span>
                </div>
            </div>

            <!-- Quick Templates -->
            <div class="templates-section">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Quick Templates
                </label>
                <div class="template-buttons flex flex-wrap gap-2">
                    <button v-for="template in messageTemplates" :key="template.name" @click="applyTemplate(template)"
                        class="template-btn px-3 py-1 text-xs font-medium text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded hover:bg-mun-blue/20 transition-colors">
                        {{ template.name }}
                    </button>
                </div>
            </div>

            <!-- Attachments -->
            <div class="attachments-section">
                <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                    Attachments (Optional)
                </label>
                <div class="attachment-upload">
                    <input ref="attachmentInput" type="file" @change="handleAttachmentSelect"
                        accept=".pdf,.doc,.docx,.txt" multiple class="hidden" />
                    <button @click="$refs.attachmentInput.click()"
                        class="attachment-btn flex items-center space-x-2 px-4 py-2 text-sm font-medium text-mun-gray-700 bg-mun-gray-50 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-100 transition-colors">
                        <PaperClipIcon class="w-4 h-4" />
                        <span>Attach Files</span>
                    </button>
                </div>

                <!-- Attached Files -->
                <div v-if="attachments.length > 0" class="attached-files mt-3 space-y-2">
                    <div v-for="(file, index) in attachments" :key="index"
                        class="attached-file flex items-center justify-between p-2 bg-mun-gray-50 rounded">
                        <div class="flex items-center space-x-2">
                            <DocumentTextIcon class="w-4 h-4 text-mun-gray-600" />
                            <span class="text-sm text-mun-gray-900">{{ file.name }}</span>
                            <span class="text-xs text-mun-gray-500">({{ formatFileSize(file.size) }})</span>
                        </div>
                        <button @click="removeAttachment(index)"
                            class="text-red-600 hover:text-red-700 transition-colors">
                            <XMarkIcon class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="composer-footer flex items-center justify-between p-4 border-t border-mun-gray-200 bg-mun-gray-50">
            <div class="message-info text-sm text-mun-gray-600">
                <InformationCircleIcon class="w-4 h-4 inline mr-1" />
                {{ getMessageInfoText() }}
            </div>

            <div class="action-buttons flex items-center space-x-3">
                <button @click="saveDraft" :disabled="isSending"
                    class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-lg hover:bg-mun-gray-50 transition-colors disabled:opacity-50">
                    Save Draft
                </button>

                <button @click="sendMessage" :disabled="!canSend || isSending"
                    class="px-6 py-2 text-sm font-medium text-white bg-mun-blue border border-mun-blue rounded-lg hover:bg-mun-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <LoadingSpinner v-if="isSending" class="w-4 h-4 mr-2" />
                    {{ isSending ? 'Sending...' : 'Send Message' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
    PencilSquareIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    UserGroupIcon,
    PlusIcon,
    PaperClipIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    FlagIcon,
    ClockIcon
} from '@heroicons/vue/24/outline'
import { CrownIcon } from '@heroicons/vue/24/solid'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    availableCountries: {
        type: Array,
        default: () => []
    },
    defaultType: {
        type: String,
        default: 'committee'
    },
    replyTo: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['message-sent', 'draft-saved'])

const authStore = useAuthStore()
const toast = useToast()

// State
const isMinimized = ref(false)
const isSending = ref(false)
const messageType = ref(props.defaultType)
const messageSubject = ref('')
const messageContent = ref('')
const messagePriority = ref('normal')
const recipients = ref([])
const customRecipients = ref([])
const selectedRecipient = ref(null)
const recipientSearch = ref('')
const filteredRecipients = ref([])
const showRecipientDropdown = ref(false)
const showCustomRecipients = ref(false)
const attachments = ref([])
const errors = ref({})

// Message types
const messageTypes = [
    { value: 'committee', name: 'Committee' },
    { value: 'diplomatic', name: 'Diplomatic' }
]

// Priority levels
const priorityLevels = [
    {
        value: 'normal',
        name: 'Normal',
        icon: ClockIcon,
        activeBg: 'bg-mun-gray-100',
        activeBorder: 'border-mun-gray-300',
        activeText: 'text-mun-gray-700'
    },
    {
        value: 'high',
        name: 'High',
        icon: ExclamationTriangleIcon,
        activeBg: 'bg-mun-yellow-100',
        activeBorder: 'border-mun-yellow-300',
        activeText: 'text-mun-yellow-700'
    },
    {
        value: 'urgent',
        name: 'Urgent',
        icon: FlagIcon,
        activeBg: 'bg-mun-red-100',
        activeBorder: 'border-mun-red-300',
        activeText: 'text-mun-red-700'
    }
]

// Message templates
const messageTemplates = [
    {
        name: 'Introduction',
        subject: 'Introduction from {country}',
        content: 'Honorable delegates,\n\nI am writing to introduce myself as the representative of {country} in this committee. We look forward to productive discussions and constructive cooperation.\n\nBest regards,\n{country} Delegation'
    },
    {
        name: 'Coalition Invitation',
        subject: 'Invitation to Join Coalition',
        content: 'Dear {recipient},\n\nWe would like to invite your delegation to join our coalition working on [topic]. We believe your country\'s expertise would be valuable to our efforts.\n\nPlease let us know if you are interested.\n\nBest regards,\n{country} Delegation'
    },
    {
        name: 'Position Clarification',
        subject: 'Clarification on Position',
        content: 'Dear colleagues,\n\nI would like to clarify our delegation\'s position on [topic] following today\'s discussions.\n\n[Please elaborate on your position]\n\nThank you for your attention.\n\nBest regards,\n{country} Delegation'
    }
]

// Computed
const canSend = computed(() => {
    return messageSubject.value.trim() &&
        messageContent.value.trim() &&
        (messageType.value === 'diplomatic' ? selectedRecipient.value : recipients.value.length > 0 || customRecipients.value.length > 0) &&
        !Object.keys(errors.value).length
})

// Methods
const filterRecipients = () => {
    if (!recipientSearch.value.trim()) {
        filteredRecipients.value = []
        return
    }

    const query = recipientSearch.value.toLowerCase()
    filteredRecipients.value = props.availableCountries
        .filter(country =>
            country.name.toLowerCase().includes(query) &&
            country.email !== authStore.user?.email // Exclude self
        )
}

const selectRecipient = (recipient) => {
    selectedRecipient.value = recipient
    recipientSearch.value = recipient.name
    showRecipientDropdown.value = false
}

const clearRecipient = () => {
    selectedRecipient.value = null
    recipientSearch.value = ''
}

const toggleCommitteeRecipient = (type) => {
    const index = recipients.value.indexOf(type)
    if (index > -1) {
        recipients.value.splice(index, 1)
    } else {
        recipients.value.push(type)
    }
}

const applyTemplate = (template) => {
    const userCountry = authStore.user?.countryName || 'Your Country'

    messageSubject.value = template.subject.replace('{country}', userCountry)
    messageContent.value = template.content
        .replace(/{country}/g, userCountry)
        .replace('{recipient}', selectedRecipient.value?.name || 'Honorable Delegate')
}

const handleAttachmentSelect = (event) => {
    const files = Array.from(event.target.files)

    // Check file size limit (5MB per file)
    const maxSize = 5 * 1024 * 1024
    const validFiles = files.filter(file => {
        if (file.size > maxSize) {
            toast.error(`${file.name} is too large. Maximum size is 5MB.`)
            return false
        }
        return true
    })

    attachments.value.push(...validFiles)
}

const removeAttachment = (index) => {
    attachments.value.splice(index, 1)
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const validateForm = () => {
    errors.value = {}

    if (!messageSubject.value.trim()) {
        errors.value.subject = 'Subject is required'
    }

    if (!messageContent.value.trim()) {
        errors.value.content = 'Message content is required'
    }

    if (messageType.value === 'diplomatic' && !selectedRecipient.value) {
        errors.value.recipients = 'Please select a recipient country'
    } else if (messageType.value === 'committee' && recipients.value.length === 0 && customRecipients.value.length === 0) {
        errors.value.recipients = 'Please select at least one recipient'
    }

    return Object.keys(errors.value).length === 0
}

const getMessageInfoText = () => {
    if (messageType.value === 'diplomatic') {
        return 'Diplomatic notes are formal communications between delegations'
    } else {
        return 'Committee messages are visible to selected recipients'
    }
}

const sendMessage = async () => {
    if (!validateForm()) return

    try {
        isSending.value = true

        const messageData = {
            type: messageType.value,
            subject: messageSubject.value.trim(),
            content: messageContent.value.trim(),
            priority: messagePriority.value,
            recipients: messageType.value === 'diplomatic'
                ? [selectedRecipient.value.email]
                : [...recipients.value, ...customRecipients.value],
            attachments: attachments.value
        }

        const response = await apiMethods.messages.sendMessage(messageData)

        if (response.data.success) {
            emit('message-sent', {
                message: response.data.message
            })

            toast.success('Message sent successfully')
            clearForm()
        }

    } catch (error) {
        toast.error('Send message error:', error)
        toast.error('Failed to send message')
    } finally {
        isSending.value = false
    }
}

const saveDraft = async () => {
    try {
        const draftData = {
            type: messageType.value,
            subject: messageSubject.value.trim(),
            content: messageContent.value.trim(),
            priority: messagePriority.value,
            recipients: messageType.value === 'diplomatic'
                ? [selectedRecipient.value?.email].filter(Boolean)
                : [...recipients.value, ...customRecipients.value],
            attachments: attachments.value
        }

        const response = await apiMethods.messages.saveDraft(draftData)

        if (response.data.success) {
            emit('draft-saved', {
                draft: response.data.draft
            })

            toast.success('Draft saved')
        }

    } catch (error) {
        toast.error('Save draft error:', error)
        toast.error('Failed to save draft')
    }
}

const clearForm = () => {
    messageSubject.value = ''
    messageContent.value = ''
    messagePriority.value = 'normal'
    recipients.value = []
    customRecipients.value = []
    selectedRecipient.value = null
    recipientSearch.value = ''
    attachments.value = []
    errors.value = {}
    showCustomRecipients.value = false
}

// Click outside handler
const handleClickOutside = (event) => {
    if (!event.target.closest('.recipients-dropdown')) {
        showRecipientDropdown.value = false
    }
}

// Initialize reply if provided
const initializeReply = () => {
    if (props.replyTo) {
        messageType.value = props.replyTo.type
        messageSubject.value = props.replyTo.subject.startsWith('Re: ')
            ? props.replyTo.subject
            : `Re: ${props.replyTo.subject}`

        if (props.replyTo.type === 'diplomatic') {
            selectedRecipient.value = props.availableCountries.find(
                country => country.email === props.replyTo.senderEmail
            )
            recipientSearch.value = selectedRecipient.value?.name || ''
        }

        const replyContent = `\n\n--- Original Message ---\nFrom: ${props.replyTo.senderCountry}\nSubject: ${props.replyTo.subject}\nDate: ${new Date(props.replyTo.timestamp).toLocaleString()}\n\n${props.replyTo.content}`
        messageContent.value = replyContent
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    initializeReply()
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Composer transitions */
.composer-body {
    animation: expand 0.3s ease-out;
}

@keyframes expand {
    from {
        opacity: 0;
        max-height: 0;
    }

    to {
        opacity: 1;
        max-height: 100vh;
    }
}

/* Recipient card animations */
.recipient-card {
    transition: all 0.2s ease;
}

.recipient-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Recipients dropdown */
.recipients-dropdown {
    animation: dropdown-enter 0.2s ease-out;
}

@keyframes dropdown-enter {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Priority button transitions */
.priority-btn {
    transition: all 0.2s ease;
}

.priority-btn:hover {
    transform: translateY(-1px);
}

/* Template button hover effects */
.template-btn {
    transition: all 0.2s ease;
}

/* Attachment animations */
.attached-file {
    animation: file-appear 0.3s ease-out;
}

@keyframes file-appear {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Message type toggle */
.message-type-toggle button {
    transition: all 0.2s ease;
}

/* Custom scrollbar */
.recipients-dropdown::-webkit-scrollbar,
.custom-recipients-list::-webkit-scrollbar {
    width: 4px;
}

.recipients-dropdown::-webkit-scrollbar-track,
.custom-recipients-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.recipients-dropdown::-webkit-scrollbar-thumb,
.custom-recipients-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.recipients-dropdown::-webkit-scrollbar-thumb:hover,
.custom-recipients-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Selected recipient highlight */
.selected-recipient {
    animation: recipient-select 0.3s ease-out;
}

@keyframes recipient-select {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Form validation errors */
.border-red-300 {
    animation: error-shake 0.5s ease-in-out;
}

@keyframes error-shake {

    0%,
    100% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(-5px);
    }

    75% {
        transform: translateX(5px);
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .composer-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .message-type-toggle {
        align-self: center;
    }

    .recipient-options {
        grid-template-columns: 1fr;
    }

    .priority-options {
        flex-direction: column;
        gap: 0.5rem;
    }

    .priority-btn {
        justify-content: center;
    }

    .template-buttons {
        flex-direction: column;
        align-items: stretch;
    }

    .template-btn {
        text-align: center;
    }

    .composer-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .action-buttons {
        justify-content: stretch;
        gap: 0.75rem;
    }

    .action-buttons button {
        flex: 1;
    }

    .custom-recipients-list .grid {
        grid-template-columns: 1fr;
    }
}

/* Loading state */
.composer-body.loading {
    pointer-events: none;
    opacity: 0.7;
}

/* Focus states */
input:focus,
textarea:focus {
    box-shadow: 0 0 0 3px rgba(0, 158, 219, 0.1);
}

/* Minimized state */
.message-composer.minimized .composer-body {
    display: none;
}

.message-composer.minimized .composer-footer {
    display: none;
}
</style>