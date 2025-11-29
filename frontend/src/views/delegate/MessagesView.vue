<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Messages</h1>
                <p class="text-mun-gray-600">Diplomatic correspondence and committee communications</p>
            </div>
            <button @click="showComposeModal = true" class="btn-un-primary">
                <PencilIcon class="w-5 h-5 mr-2" />
                Compose Message
            </button>
        </div>

        <!-- Message Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <InboxIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Inbox</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.inbox }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ExclamationTriangleIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Unread</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.unread }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <PaperAirplaneIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Sent</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.sent }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <UserGroupIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Group Chats</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.groupChats }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Categories -->
        <div class="mun-card p-6">
            <div class="flex items-center space-x-6">
                <button v-for="category in messageCategories" :key="category.id" @click="selectedCategory = category.id"
                    :class="[
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        selectedCategory === category.id
                            ? 'bg-mun-blue text-white'
                            : 'bg-mun-gray-100 text-mun-gray-700 hover:bg-mun-gray-200'
                    ]">
                    {{ category.name }}
                    <span v-if="category.count > 0" class="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                        {{ category.count }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Messages List -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Message List -->
            <div class="lg:col-span-1">
                <div class="mun-card h-[600px] flex flex-col">
                    <div class="px-4 py-3 border-b border-mun-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="font-medium text-mun-gray-900">
                                {{ getCategoryName(selectedCategory) }}
                            </h3>
                            <input v-model="searchQuery" type="text" placeholder="Search..."
                                class="input-field text-sm w-32">
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto">
                        <div v-if="isLoading" class="flex items-center justify-center py-12">
                            <LoadingSpinner />
                        </div>

                        <div v-else-if="filteredMessages.length === 0" class="text-center py-8">
                            <InboxIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                            <p class="mt-2 text-mun-gray-500">No messages found</p>
                        </div>

                        <div v-else class="divide-y divide-mun-gray-200">
                            <div v-for="message in filteredMessages" :key="message.id" @click="selectMessage(message)"
                                :class="[
                                    'p-4 cursor-pointer hover:bg-mun-gray-50 transition-colors',
                                    selectedMessage?.id === message.id ? 'bg-mun-blue/5 border-r-2 border-mun-blue' : '',
                                    !message.isRead ? 'bg-mun-yellow-50' : ''
                                ]">
                                <div class="flex items-start space-x-3">
                                    <div :class="[
                                        'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                                        !message.isRead ? 'bg-mun-blue' : 'bg-mun-gray-300'
                                    ]"></div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between mb-1">
                                            <p :class="[
                                                'text-sm font-medium truncate',
                                                !message.isRead ? 'text-mun-gray-900' : 'text-mun-gray-700'
                                            ]">
                                                {{ message.sender }}
                                            </p>
                                            <span class="text-xs text-mun-gray-500">
                                                {{ formatTime(message.timestamp) }}
                                            </span>
                                        </div>
                                        <p :class="[
                                            'text-sm truncate',
                                            !message.isRead ? 'text-mun-gray-900' : 'text-mun-gray-600'
                                        ]">
                                            {{ message.subject }}
                                        </p>
                                        <p class="text-xs text-mun-gray-500 truncate mt-1">
                                            {{ message.preview }}
                                        </p>
                                        <div class="flex items-center space-x-2 mt-2">
                                            <span :class="[
                                                'px-2 py-1 rounded text-xs font-medium',
                                                message.type === 'diplomatic' ? 'bg-blue-100 text-blue-700' :
                                                    message.type === 'official' ? 'bg-purple-100 text-purple-700' :
                                                        message.type === 'coalition' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                            ]">
                                                {{ formatMessageType(message.type) }}
                                            </span>
                                            <span v-if="message.priority === 'high'"
                                                class="px-2 py-1 bg-mun-red-100 text-mun-red-700 rounded text-xs font-medium">
                                                High Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Message Content -->
            <div class="lg:col-span-2">
                <div class="mun-card h-[600px] flex flex-col">
                    <div v-if="!selectedMessage" class="flex items-center justify-center h-full">
                        <div class="text-center">
                            <ChatBubbleLeftIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                            <h3 class="mt-4 text-lg font-medium text-mun-gray-900">Select a Message</h3>
                            <p class="mt-2 text-mun-gray-600">Choose a message from the list to view its content</p>
                        </div>
                    </div>

                    <div v-else class="flex flex-col h-full">
                        <!-- Message Header -->
                        <div class="px-6 py-4 border-b border-mun-gray-200">
                            <div class="flex items-start justify-between">
                                <div>
                                    <h3 class="text-lg font-medium text-mun-gray-900">{{ selectedMessage.subject }}</h3>
                                    <div class="flex items-center space-x-4 mt-2 text-sm text-mun-gray-600">
                                        <span><strong>From:</strong> {{ selectedMessage.sender }}</span>
                                        <span><strong>To:</strong> {{ selectedMessage.recipient }}</span>
                                        <span>{{ formatFullDate(selectedMessage.timestamp) }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button @click="replyToMessage" class="btn-un-secondary px-3 py-2">
                                        <ArrowUturnLeftIcon class="w-4 h-4 mr-1" />
                                        Reply
                                    </button>
                                    <button @click="forwardMessage" class="btn-un-secondary px-3 py-2">
                                        <ArrowRightIcon class="w-4 h-4 mr-1" />
                                        Forward
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Message Content -->
                        <div class="flex-1 p-6 overflow-y-auto">
                            <div class="prose max-w-none">
                                <div v-html="selectedMessage.content"></div>
                            </div>

                            <!-- Attachments -->
                            <div v-if="selectedMessage.attachments && selectedMessage.attachments.length > 0"
                                class="mt-6 pt-6 border-t border-mun-gray-200">
                                <h4 class="font-medium text-mun-gray-900 mb-3">Attachments</h4>
                                <div class="space-y-2">
                                    <div v-for="attachment in selectedMessage.attachments" :key="attachment.id"
                                        class="flex items-center space-x-3 p-3 bg-mun-gray-50 rounded-lg">
                                        <DocumentIcon class="w-5 h-5 text-mun-gray-400" />
                                        <span class="flex-1 text-sm text-mun-gray-900">{{ attachment.name }}</span>
                                        <span class="text-xs text-mun-gray-500">{{ attachment.size }}</span>
                                        <button class="text-mun-blue hover:text-mun-blue-600 text-sm">Download</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Compose Message Modal -->
        <div v-if="showComposeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 flex flex-col max-h-[95vh] min-h-[400px]">
                <div class="px-6 py-4 border-b border-mun-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-mun-gray-900">Compose Message</h2>
                        <button @click="showComposeModal = false" class="text-mun-gray-400 hover:text-mun-gray-600">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div class="flex-1 p-6 overflow-y-auto">
                    <form @submit.prevent="sendMessage" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">To</label>
                                <SleekSelect v-model="composeForm.recipient" :options="[
                                    { label: 'Presidium', value: 'presidium' },
                                    { label: 'All Delegates', value: 'all-delegates' },
                                    ...availableCountries.map(country => ({
                                        label: country,
                                        value: country
                                    }))
                                ]" placeholder="Select recipient" searchable />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-2">Type</label>
                                <SleekSelect v-model="composeForm.type" :options="[
                                    { label: 'Diplomatic Note', value: 'diplomatic' },
                                    { label: 'Coalition Message', value: 'coalition' },
                                    { label: 'Procedural Inquiry', value: 'procedural' },
                                    { label: 'General Communication', value: 'general' }
                                ]" placeholder="Select message type" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Subject</label>
                            <input v-model="composeForm.subject" type="text" required class="input-field"
                                placeholder="Message subject">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Priority</label>
                            <SleekSelect v-model="composeForm.priority" :options="[
                                { label: 'Normal', value: 'normal' },
                                { label: 'High Priority', value: 'high' }
                            ]" containerClass="max-w-xs" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Message</label>
                            <textarea v-model="composeForm.content" rows="8" required class="input-field"
                                placeholder="Type your message here..."></textarea>
                        </div>

                        <div class="flex items-center justify-end space-x-3 pt-4">
                            <button type="button" @click="showComposeModal = false" class="btn-un-secondary">
                                Cancel
                            </button>
                            <button type="submit" :disabled="isSending" class="btn-un-primary">
                                <span v-if="isSending">Sending...</span>
                                <span v-else>Send Message</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    PencilIcon,
    InboxIcon,
    ExclamationTriangleIcon,
    PaperAirplaneIcon,
    UserGroupIcon,
    ChatBubbleLeftIcon,
    ArrowUturnLeftIcon,
    ArrowRightIcon,
    DocumentIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isSending = ref(false)
const showComposeModal = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('inbox')
const selectedMessage = ref(null)

const stats = reactive({
    inbox: 0,
    unread: 0,
    sent: 0,
    groupChats: 0
})

const messageCategories = [
    { id: 'inbox', name: 'Inbox', count: 0 },
    { id: 'sent', name: 'Sent', count: 0 },
    { id: 'drafts', name: 'Drafts', count: 0 },
    { id: 'coalition', name: 'Coalition', count: 0 }
]

const messages = ref([])
const availableCountries = ref([])

const composeForm = reactive({
    recipient: '',
    type: 'diplomatic',
    subject: '',
    content: '',
    priority: 'normal'
})

// Computed
const filteredMessages = computed(() => {
    let filtered = messages.value.filter(message => {
        if (selectedCategory.value === 'inbox') return message.type !== 'sent'
        if (selectedCategory.value === 'sent') return message.type === 'sent'
        if (selectedCategory.value === 'coalition') return message.type === 'coalition'
        return true
    })

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(message =>
            message.sender.toLowerCase().includes(query) ||
            message.subject.toLowerCase().includes(query) ||
            message.content.toLowerCase().includes(query)
        )
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// Methods
const loadMessagesData = async () => {
    try {
        isLoading.value = true

        // Sample messages
        messages.value = [
            {
                id: 1,
                sender: "France",
                recipient: "United States",
                subject: "Coalition Proposal: Climate Action",
                content: "<p>Dear delegate,</p><p>We would like to invite your country to join our Climate Action Coalition. Our goal is to create a comprehensive framework for global environmental protection.</p><p>We believe your country's expertise would be invaluable to our efforts.</p><p>Best regards,<br>French Delegation</p>",
                preview: "We would like to invite your country to join our Climate Action Coalition...",
                type: "diplomatic",
                priority: "normal",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                isRead: false
            },
            {
                id: 2,
                sender: "Presidium",
                recipient: "All Delegates",
                subject: "Session Schedule Update",
                content: "<p>Dear delegates,</p><p>Please note that tomorrow's session will begin at 14:00 instead of the originally scheduled 13:00.</p><p>Thank you for your attention.</p>",
                preview: "Please note that tomorrow's session will begin at 14:00...",
                type: "official",
                priority: "high",
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                isRead: true
            },
            {
                id: 3,
                sender: "United Kingdom",
                recipient: "United States",
                subject: "Amendment Discussion",
                content: "<p>Dear colleague,</p><p>We would like to discuss potential amendments to Resolution A/1. Could we schedule a bilateral meeting?</p>",
                preview: "We would like to discuss potential amendments to Resolution A/1...",
                type: "diplomatic",
                priority: "normal",
                timestamp: new Date(Date.now() - 14400000).toISOString(),
                isRead: true,
                attachments: [
                    { id: 1, name: "Amendment_Draft.pdf", size: "245 KB" }
                ]
            }
        ]

        // Available countries for messaging
        availableCountries.value = [
            "United Kingdom", "France", "Germany", "Canada", "Japan", "Australia", "Brazil", "India", "South Africa"
        ]

        // Update stats
        stats.inbox = messages.value.filter(m => m.type !== 'sent').length
        stats.unread = messages.value.filter(m => !m.isRead && m.type !== 'sent').length
        stats.sent = messages.value.filter(m => m.type === 'sent').length
        stats.groupChats = 2

        // Update category counts
        messageCategories[0].count = stats.unread
        messageCategories[3].count = messages.value.filter(m => m.type === 'coalition').length

    } catch (error) {
        toast.error('Load messages error:', error)
        toast.error('Failed to load messages')
    } finally {
        isLoading.value = false
    }
}

const selectMessage = async (message) => {
    selectedMessage.value = message

    // Mark as read
    if (!message.isRead) {
        message.isRead = true
        stats.unread--
        messageCategories[0].count--
    }
}

const sendMessage = async () => {
    try {
        isSending.value = true

        const newMessage = {
            id: Date.now(),
            sender: authStore.user?.countryName || "United States",
            recipient: composeForm.recipient,
            subject: composeForm.subject,
            content: composeForm.content.replace(/\n/g, '<br>'),
            preview: composeForm.content.substring(0, 100) + '...',
            type: 'sent',
            priority: composeForm.priority,
            timestamp: new Date().toISOString(),
            isRead: true
        }

        messages.value.unshift(newMessage)
        stats.sent++

        // Reset form
        Object.keys(composeForm).forEach(key => {
            composeForm[key] = key === 'type' ? 'diplomatic' : key === 'priority' ? 'normal' : ''
        })
        showComposeModal.value = false

        toast.success('Message sent successfully')

    } catch (error) {
        toast.error('Send message error:', error)
        toast.error('Failed to send message')
    } finally {
        isSending.value = false
    }
}

const replyToMessage = () => {
    composeForm.recipient = selectedMessage.value.sender
    composeForm.subject = `Re: ${selectedMessage.value.subject}`
    composeForm.content = `\n\n--- Original Message ---\nFrom: ${selectedMessage.value.sender}\nSubject: ${selectedMessage.value.subject}\n\n${selectedMessage.value.content.replace(/<[^>]*>/g, '')}`
    showComposeModal.value = true
}

const forwardMessage = () => {
    composeForm.subject = `Fwd: ${selectedMessage.value.subject}`
    composeForm.content = `\n\n--- Forwarded Message ---\nFrom: ${selectedMessage.value.sender}\nTo: ${selectedMessage.value.recipient}\nSubject: ${selectedMessage.value.subject}\n\n${selectedMessage.value.content.replace(/<[^>]*>/g, '')}`
    showComposeModal.value = true
}

const getCategoryName = (categoryId) => {
    const category = messageCategories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Messages'
}

const formatMessageType = (type) => {
    const typeMap = {
        'diplomatic': 'Diplomatic',
        'official': 'Official',
        'coalition': 'Coalition',
        'procedural': 'Procedural',
        'general': 'General'
    }
    return typeMap[type] || type
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
        return `${diffMins}m`
    } else if (diffHours < 24) {
        return `${diffHours}h`
    } else if (diffDays < 7) {
        return `${diffDays}d`
    } else {
        return date.toLocaleDateString()
    }
}

const formatFullDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
}

// Lifecycle
onMounted(() => {
    loadMessagesData()
})
</script>