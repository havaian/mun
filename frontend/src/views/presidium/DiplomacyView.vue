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
                {{ channel.icon }}
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
                <img :src="delegate.flagUrl" :alt="delegate.countryName"
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
              {{ selectedChannel.icon }}
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

// Icons
import {
  ChatBubbleLeftRightIcon, MagnifyingGlassIcon, PlusIcon,
  UserIcon, PaperAirplaneIcon
} from '@heroicons/vue/24/outline'

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

// Public channels configuration
const publicChannels = [
  {
    id: 'general',
    name: 'General Assembly',
    description: 'Global floor discussion',
    icon: '🌍',
    color: 'bg-blue-500 text-white',
    type: 'public',
    unreadCount: 0
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official Presidium updates',
    icon: '📢',
    color: 'bg-yellow-500 text-white',
    type: 'public',
    unreadCount: 0
  },
  {
    id: 'gossip',
    name: 'Gossip Box',
    description: 'Anonymous chatter',
    icon: '🗣️',
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
      flagUrl: country.flagUrl
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
    // Get committee from auth context
    committee.value = authStore.user?.committeeId
    if (!committee.value) {
      throw new Error('No committee assigned')
    }

    // Set default channel
    selectChannel(publicChannels[0])

    // Load initial messages and online delegates
    await loadMessages()
    await loadOnlineDelegates()

  } catch (error) {
    console.error('Failed to load messaging data:', error)
    toast.error('Failed to load messaging data')
  }
}

const loadMessages = async () => {
  try {
    if (!selectedChannel.value) return

    const response = await apiMethods.messages.getCommitteeMessages(committee.value._id, {
      channelId: selectedChannel.value.id,
      limit: 50
    })

    if (response.data.success) {
      messages.value = response.data.messages || []
      scrollToBottom()
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
        flagUrl: country.flagUrl,
        isOnline: Math.random() > 0.3 // Random online status for demo
      }))
      ?.filter(delegate => delegate.isOnline) || []
  } catch (error) {
    console.error('Failed to load online delegates:', error)
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

    const messageData = {
      channelId: selectedChannel.value.id,
      channelType: selectedChannel.value.type,
      content: newMessage.value.trim(),
      committeeId: committee.value._id
    }

    const response = await apiMethods.messages.sendToCommittee(messageData)

    if (response.data.success) {
      // Add message to local state immediately for better UX
      const newMsg = {
        _id: Date.now().toString(), // Temporary ID
        ...messageData,
        senderName: authStore.user?.name,
        senderRole: authStore.user?.role,
        senderCountry: authStore.user?.countryName,
        timestamp: new Date().toISOString()
      }

      messages.value.push(newMsg)
      newMessage.value = ''
      scrollToBottom()
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

const openDirectMessage = (delegate) => {
  // Create/select DM channel
  const dmChannel = {
    id: `dm-${delegate.email}`,
    name: delegate.countryName,
    description: 'Direct Message',
    icon: '💬',
    color: 'bg-gray-500 text-white',
    type: 'dm',
    recipient: delegate
  }

  selectChannel(dmChannel)
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
  return country?.flagUrl || '/api/countries/flags/default'
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
  wsService.on('new-message', (data) => {
    if (data.committeeId === committee.value?._id) {
      messages.value.push(data.message)
      scrollToBottom()
    }
  })

  wsService.on('message-deleted', (data) => {
    messages.value = messages.value.filter(m => m._id !== data.messageId)
  })

  wsService.on('user-online', (data) => {
    if (data.committeeId === committee.value?._id) {
      loadOnlineDelegates()
    }
  })

  wsService.on('user-offline', (data) => {
    if (data.committeeId === committee.value?._id) {
      loadOnlineDelegates()
    }
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