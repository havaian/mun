<template>
  <div class="h-screen flex bg-gray-50">
    <!-- Left Sidebar - Channels -->
    <aside class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100">
        <div class="flex items-center gap-3 text-blue-600 mb-4">
          <ChatBubbleLeftRightIcon class="w-6 h-6" />
          <h1 class="text-xl font-bold text-gray-900">Diplomacy</h1>
        </div>

        <!-- Search -->
        <div class="relative">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="searchQuery" type="text" placeholder="Search delegates..."
            class="w-full pl-10 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      <!-- Channels List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Public Channels -->
        <div class="p-4">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            PUBLIC CHANNELS
          </h3>
          <div class="space-y-1">
            <button v-for="channel in publicChannels" :key="channel.id" @click="selectChannel(channel)" :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
              selectedChannel?.id === channel.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200' // Active: Visible border
                : 'text-gray-700 hover:bg-gray-100 border border-transparent' // Inactive: Transparent border added here
            ]">
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                channel.color
              ]">
                <Globe v-if="channel.icon === 'Globe'" :size="20" class="text-white" />
                <ShieldAlert v-else-if="channel.icon === 'ShieldAlert'" :size="20" class="text-white" />
                <Ghost v-else-if="channel.icon === 'Ghost'" :size="20" class="text-white" />
                <span v-else>{{ channel.icon }}</span>
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ channel.name }}</div>
                <div class="text-xs text-gray-500">{{ channel.description }}</div>
              </div>
              <div v-if="channel.unreadCount"
                class="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {{ channel.unreadCount }}
              </div>
            </button>
          </div>
        </div>

        <!-- Direct Messages -->
        <div class="p-4 border-t border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              DIRECT MESSAGES
            </h3>
            <button @click="showCreateDMModal = true" class="text-gray-400 hover:text-gray-600 transition-colors">
              <PlusIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Online Delegates -->
          <div class="space-y-1">
            <button v-for="delegate in filteredOnlineDelegates" :key="delegate.email"
              @click="openDirectMessage(delegate)"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 transition-colors">
              <div class="relative">
                <CountryFlag :country-name="delegate.name" :country-code="delegate.code" size="medium" variant="bordered" />
                  class="w-8 h-6 rounded border border-gray-200 object-cover" />
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div class="flex-1">
                <div class="font-medium text-sm">{{ delegate.countryName }}</div>
                <div class="text-xs text-gray-500">Online</div>
              </div>
              <div v-if="getUnreadDMCount(delegate.email)"
                class="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {{ getUnreadDMCount(delegate.email) }}
              </div>
            </button>
          </div>

          <!-- No delegates online -->
          <div v-if="filteredOnlineDelegates.length === 0" class="text-center py-4">
            <div class="text-sm text-gray-500">
              {{ searchQuery ? 'No delegates found' : 'No delegates online' }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="flex-1 flex flex-col">
      <!-- Chat Header -->
      <div v-if="selectedChannel" class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
              selectedChannel.color
            ]">
              <Globe v-if="selectedChannel.icon === 'Globe'" :size="24" class="text-white" />
              <ShieldAlert v-else-if="selectedChannel.icon === 'ShieldAlert'" :size="24" class="text-white" />
              <Ghost v-else-if="selectedChannel.icon === 'Ghost'" :size="24" class="text-white" />
              <MessageSquare v-else :size="24" class="text-white" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ selectedChannel.name }}</h2>
              <p class="text-sm text-gray-600">{{ selectedChannel.description }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">
              {{ selectedChannel.type === 'public' ? 'Visible to everyone' : 'Private conversation' }}
            </span>
            <div v-if="selectedChannel.type === 'public'" class="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto bg-gray-50">
        <!-- No channel selected -->
        <div v-if="!selectedChannel" class="h-full flex items-center justify-center">
          <div class="text-center">
            <ChatBubbleLeftRightIcon class="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">Welcome to Diplomacy</h3>
            <p class="text-gray-600">Select a channel to start the conversation.</p>
          </div>
        </div>

        <!-- Messages -->
        <div v-else class="h-full flex flex-col">
          <!-- Message List -->
          <div class="flex-1 p-6 space-y-4" ref="messagesContainer">
            <!-- No messages -->
            <div v-if="currentMessages.length === 0" class="text-center py-16">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon class="w-8 h-8 text-gray-400" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">No messages yet in this channel.</h4>
              <p class="text-gray-600">Start the conversation!</p>
            </div>

            <!-- Message Items -->
            <div v-for="message in currentMessages" :key="message._id" class="flex gap-4">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <img v-if="message.senderCountry" :src="getCountryFlag(message.senderCountry)"
                  :alt="message.senderCountry" class="w-10 h-8 rounded border border-gray-200 object-cover" />
                <div v-else class="w-10 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <UserIcon class="w-5 h-5 text-blue-600" />
                </div>
              </div>

              <!-- Message Content -->
              <div class="flex-1">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="font-semibold text-gray-900">
                    {{ message.senderCountry || message.senderName || 'Anonymous' }}
                  </span>
                  <span v-if="message.senderRole === 'presidium'"
                    class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Presidium
                  </span>
                  <span class="text-sm text-gray-500">
                    {{ formatMessageTime(message.timestamp) }}
                  </span>
                </div>
                <div class="text-gray-900 break-words">
                  {{ message.content }}
                </div>

                <!-- Message actions for presidium -->
                <div v-if="authStore.user?.role === 'presidium'" class="flex gap-2 mt-2 text-xs">
                  <button @click="deleteMessage(message._id)" class="text-red-600 hover:text-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="bg-white border-t border-gray-200 p-4">
            <form @submit.prevent="sendMessage" class="flex gap-3">
              <input v-model="newMessage" type="text" :placeholder="`Message ${selectedChannel.name}...`"
                class="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="isSending" />
              <button type="submit" :disabled="!newMessage.trim() || isSending"
                class="w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                <PaperAirplaneIcon class="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>

    <!-- Create DM Modal -->
    <ModalWrapper v-model="showCreateDMModal" title="Start Direct Message"
      subtitle="Send a private message to a delegate" size="md" primary-text="Start Chat"
      @primary-action="startDirectMessage" @close="closeCreateDMModal">

      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select Delegate
            </label>
            <select v-model="selectedDMDelegate"
              class="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Choose a delegate...</option>
              <option v-for="delegate in allDelegates" :key="delegate.email" :value="delegate">
                {{ delegate.countryName }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Initial Message (optional)
            </label>
            <textarea v-model="initialDMMessage" rows="3"
              class="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message..."></textarea>
          </div>
        </div>
      </template>
    </ModalWrapper>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import ModalWrapper from '@/components/ModalWrapper.vue'
import CountryFlag from '@/components/CountryFlag.vue'

// Icons
import {
  ChatBubbleLeftRightIcon, MagnifyingGlassIcon, PlusIcon,
  UserIcon, PaperAirplaneIcon
} from '@heroicons/vue/24/outline'

import { 
  Globe, 
  ShieldAlert, 
  Ghost, 
  MessageSquare
} from 'lucide-vue-next'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const selectedChannel = ref(null)
const searchQuery = ref('')
const newMessage = ref('')
const isSending = ref(false)
const messages = ref([])
const onlineDelegates = ref([])
const committee = ref(null)
const messagesContainer = ref(null)

// Modal state
const showCreateDMModal = ref(false)
const selectedDMDelegate = ref(null)
const initialDMMessage = ref('')
const conversations = ref([])

// Public channels configuration
const publicChannels = [
  {
    id: 'general',
    name: 'General Assembly',
    description: 'Global floor discussion',
    icon: 'Globe',
    color: 'bg-blue-500 text-white',
    type: 'public',
    unreadCount: 0
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official Presidium updates',
    icon: 'ShieldAlert',
    color: 'bg-yellow-500 text-white',
    type: 'public',
    unreadCount: 0
  },
  {
    id: 'gossip',
    name: 'Gossip Box',
    description: 'Anonymous chatter',
    icon: 'Ghost',
    color: 'bg-pink-500 text-white',
    type: 'public',
    unreadCount: 0
  }
]

// Computed
const filteredOnlineDelegates = computed(() => {
  if (!searchQuery.value.trim()) {
    return onlineDelegates.value.slice(0, 10) // Limit for UI
  }

  const query = searchQuery.value.toLowerCase()
  return onlineDelegates.value.filter(delegate =>
    delegate.countryName.toLowerCase().includes(query)
  )
})

const allDelegates = computed(() => {
  if (!committee.value?.countries) return []

  return committee.value.countries
    .filter(country => country.email && country.isActive)
    .map(country => ({
      email: country.email,
      countryName: country.name,
      code: country.code
    }))
})

const currentMessages = computed(() => {
  if (!selectedChannel.value) return []

  return messages.value.filter(msg =>
    msg.channelId === selectedChannel.value.id ||
    msg.channelType === selectedChannel.value.type
  )
})

// Methods
const loadData = async () => {
  try {
    committee.value = authStore.user?.committee || authStore.user?.committeeId
    if (!committee.value) {
      throw new Error('No committee assigned')
    }

    // Load conversations instead of messages
    await loadConversations()
    await loadOnlineDelegates()

    // Set default to first public channel (simulate with empty state)
    if (publicChannels.length > 0) {
      selectChannel(publicChannels[0])
    }

  } catch (error) {
    console.error('Failed to load messaging data:', error)
    toast.error('Failed to load messaging data')
  }
}

const loadMessages = async () => {
  try {
    if (!selectedChannel.value) return

    // For public channels, we'll simulate with empty messages for now
    if (selectedChannel.value.type === 'public') {
      messages.value = []
      return
    }

    // For DM channels, load the actual conversation
    if (selectedChannel.value.type === 'dm' && selectedChannel.value.conversationId) {
      const response = await apiMethods.messages.getConversation(selectedChannel.value.conversationId, {
        limit: 50
      })

      if (response.data.success) {
        messages.value = response.data.conversation.messages || []
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error('Failed to load messages:', error)
  }
}

const loadOnlineDelegates = async () => {
  try {
    // This would typically come from WebSocket or API
    // For now, use committee data as placeholder
    onlineDelegates.value = committee.value?.countries
      ?.filter(country => country.email && country.isActive)
      ?.map(country => ({
        email: country.email,
        countryName: country.name,
        code: country.code,
        isOnline: Math.random() > 0.3 // Random online status for demo
      }))
      ?.filter(delegate => delegate.isOnline) || []
  } catch (error) {
    console.error('Failed to load online delegates:', error)
  }
}

const loadConversations = async () => {
  try {
    const response = await apiMethods.messages.getCommitteeConversations(committee.value._id || committee.value)
    
    if (response.data.success) {
      conversations.value = response.data.conversations || []
    }
  } catch (error) {
    console.error('Failed to load conversations:', error)
  }
}

const selectChannel = (channel) => {
  selectedChannel.value = channel
  messages.value = [] // Clear previous messages
  loadMessages()
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedChannel.value) return

  try {
    isSending.value = true

    // For public channels, we need to implement public messaging
    if (selectedChannel.value.type === 'public') {
      // For now, just add to local state as placeholder
      const newMsg = {
        _id: Date.now().toString(),
        senderName: authStore.user?.name || authStore.user?.countryName,
        senderRole: authStore.user?.role,
        senderCountry: authStore.user?.countryName,
        content: newMessage.value.trim(),
        timestamp: new Date().toISOString()
      }

      messages.value.push(newMsg)
      newMessage.value = ''
      scrollToBottom()
      return
    }

    // For DM channels, send to conversation
    if (selectedChannel.value.conversationId) {
      const response = await apiMethods.messages.sendMessage(selectedChannel.value.conversationId, {
        content: newMessage.value.trim()
      })

      if (response.data.success) {
        // Message will be added via WebSocket, but add locally for immediate feedback
        const newMsg = {
          _id: response.data.message._id,
          senderName: authStore.user?.name || authStore.user?.countryName,
          senderRole: authStore.user?.role,
          senderCountry: authStore.user?.countryName,
          content: newMessage.value.trim(),
          timestamp: new Date().toISOString()
        }

        messages.value.push(newMsg)
        newMessage.value = ''
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    toast.error('Failed to send message')
  } finally {
    isSending.value = false
  }
}

const deleteMessage = async (messageId) => {
  if (!confirm('Are you sure you want to delete this message?')) return

  try {
    await apiMethods.messages.deleteMessage(messageId)
    messages.value = messages.value.filter(m => m._id !== messageId)
    toast.success('Message deleted')
  } catch (error) {
    console.error('Failed to delete message:', error)
    toast.error('Failed to delete message')
  }
}

const openDirectMessage = async (delegate) => {
  try {
    // Check if bilateral conversation already exists
    const existingConversation = conversations.value.find(conv => 
      conv.conversationType === 'bilateral' && 
      conv.participants.some(p => p.email === delegate.email)
    )

    if (existingConversation) {
      // Use existing conversation
      const dmChannel = {
        id: existingConversation._id,
        conversationId: existingConversation._id,
        name: delegate.countryName,
        description: 'Direct Message',
        icon: 'MessageSquare',
        color: 'bg-gray-500 text-white',
        type: 'dm',
        recipient: delegate
      }
      selectChannel(dmChannel)
    } else {
      // Create new bilateral conversation
      const response = await apiMethods.messages.createBilateral({
        committeeId: committee.value._id || committee.value,
        targetEmail: delegate.email,
        targetCountry: delegate.countryName
      })

      if (response.data.success) {
        const conversation = response.data.conversation
        conversations.value.push(conversation)

        const dmChannel = {
          id: conversation._id,
          conversationId: conversation._id,
          name: delegate.countryName,
          description: 'Direct Message',
          icon: 'MessageSquare',
          color: 'bg-gray-500 text-white',
          type: 'dm',
          recipient: delegate
        }
        selectChannel(dmChannel)
      }
    }
  } catch (error) {
    console.error('Failed to open direct message:', error)
    toast.error('Failed to start conversation')
  }
}

const startDirectMessage = () => {
  if (selectedDMDelegate.value) {
    openDirectMessage(selectedDMDelegate.value)

    if (initialDMMessage.value.trim()) {
      newMessage.value = initialDMMessage.value.trim()
    }

    closeCreateDMModal()
  }
}

const closeCreateDMModal = () => {
  showCreateDMModal.value = false
  selectedDMDelegate.value = null
  initialDMMessage.value = ''
}

const getUnreadDMCount = (email) => {
  // Placeholder - would calculate unread messages for this DM
  return 0
}

const getCountryFlag = (countryName) => {
  const country = committee.value?.countries?.find(c => c.name === countryName)
  return country?.code || ''
}

const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// WebSocket listeners
const setupWebSocketListeners = () => {
  wsService.on('message-received', (data) => {
    if (selectedChannel.value?.conversationId === data.conversationId) {
      const newMessage = {
        _id: data.messageId,
        senderName: data.senderCountry,
        senderCountry: data.senderCountry,
        content: data.content,
        timestamp: data.timestamp
      }
      messages.value.push(newMessage)
      scrollToBottom()
    }
  })

  wsService.on('conversation-created', (data) => {
    // Refresh conversations list
    loadConversations()
  })
}

// Watchers
watch(selectedChannel, () => {
  if (selectedChannel.value) {
    // Mark channel as read
    selectedChannel.value.unreadCount = 0
  }
})

// Lifecycle
onMounted(async () => {
  await loadData()
  setupWebSocketListeners()
})
</script>