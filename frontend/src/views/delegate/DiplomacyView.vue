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
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border',
              selectedChannel?.id === channel.id
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
            ]">
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center',
                channel.color
              ]">
                <component :is="channel.iconComponent" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ channel.name }}</div>
                <div class="text-xs text-gray-500 truncate">{{ channel.description }}</div>
              </div>
              <div v-if="channel.unreadCount > 0"
                class="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
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
            <button @click="showCreateDMModal = true" class="text-gray-400 hover:text-gray-600 transition-colors"
              title="Start new conversation">
              <PlusIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- Active DM Conversations -->
          <div v-if="dmConversations.length > 0" class="space-y-1 mb-4">
            <button v-for="conv in dmConversations" :key="conv._id" @click="selectDMConversation(conv)" :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors border',
              selectedChannel?.conversationId === conv._id
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'text-gray-700 hover:bg-gray-50 border-transparent'
            ]">
              <div class="relative flex-shrink-0">
                <CountryFlag :country-name="getOtherParticipant(conv).countryName"
                  :country-code="getOtherParticipant(conv).code" size="medium" variant="bordered" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ getOtherParticipant(conv).countryName }}</div>
                <div v-if="conv.lastMessage" class="text-xs text-gray-500 truncate">
                  {{ conv.lastMessage.content }}
                </div>
              </div>
              <div v-if="conv.unreadCount > 0"
                class="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {{ conv.unreadCount }}
              </div>
            </button>
          </div>

          <!-- Online Delegates -->
          <div v-if="filteredOnlineDelegates.length > 0" class="space-y-1">
            <div class="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">Online Now</div>
            <button v-for="delegate in filteredOnlineDelegates.slice(0, 5)" :key="delegate.email"
              @click="openDirectMessage(delegate)"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors">
              <div class="relative flex-shrink-0">
                <CountryFlag :country-name="delegate.countryName" :country-code="delegate.code" size="medium"
                  variant="bordered" />
                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full">
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ delegate.countryName }}</div>
                <div class="text-xs text-gray-500">Online</div>
              </div>
            </button>
          </div>

          <!-- No delegates state -->
          <div v-if="filteredOnlineDelegates.length === 0 && dmConversations.length === 0" class="text-center py-4">
            <div class="text-sm text-gray-500">
              {{ searchQuery ? 'No delegates found' : 'No conversations yet' }}
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
            <div v-if="selectedChannel.type === 'public'" :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center',
              selectedChannel.color
            ]">
              <component :is="selectedChannel.iconComponent" class="w-6 h-6" />
            </div>
            <div v-else class="relative">
              <CountryFlag :country-name="selectedChannel.recipient?.countryName"
                :country-code="selectedChannel.recipient?.code" size="large" variant="bordered" />
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
      <div class="flex-1 flex flex-col bg-gray-50 min-h-0">
        <!-- No channel selected -->
        <div v-if="!selectedChannel" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <ChatBubbleLeftRightIcon class="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">Welcome to Diplomacy</h3>
            <p class="text-gray-600">Select a channel or start a conversation with a delegate.</p>
          </div>
        </div>

        <!-- Messages -->
        <div v-else class="flex-1 flex flex-col min-h-0">
          <!-- Loading -->
          <div v-if="isLoadingMessages" class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p class="text-sm text-gray-600">Loading messages...</p>
            </div>
          </div>

          <!-- Message List -->
          <div v-else class="flex-1 overflow-y-auto p-6 space-y-4" ref="messagesContainer">
            <!-- No messages -->
            <div v-if="currentMessages.length === 0" class="text-center py-16">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon class="w-8 h-8 text-gray-400" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">No messages yet</h4>
              <p class="text-gray-600">Start the conversation!</p>
            </div>

            <!-- Message Items -->
            <div v-for="message in currentMessages" :key="message._id">
              <!-- General Assembly - Speech bubbles with flags -->
              <div v-if="selectedChannel.id === 'general'"
                :class="['flex', message.isCurrentUser ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-md', message.isCurrentUser ? 'items-end' : 'items-start']">
                  <div class="flex items-center gap-2 mb-1" :class="message.isCurrentUser ? 'flex-row-reverse' : ''">
                    <span class="text-xs text-gray-500">{{ formatMessageTime(message.timestamp) }}</span>

                    <!-- Flag and Country Name -->
                    <div class="flex items-center gap-2">
                      <CountryFlag :country-name="message.senderCountry"
                        :country-code="getCountryCodeForMessage(message)" size="small" variant="bordered" />
                      <span class="font-medium text-sm text-gray-700">{{ message.senderCountry }}</span>
                    </div>
                  </div>
                  <div :class="[
                    'px-4 py-2.5 rounded-2xl shadow-sm',
                    message.isCurrentUser
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                  ]">
                    {{ message.content }}
                  </div>
                </div>
              </div>

              <!-- Announcements - Yellow notification style (no changes needed) -->
              <div v-else-if="selectedChannel.id === 'announcements'" class="flex justify-center">
                <div
                  class="bg-yellow-50 border border-yellow-200 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm max-w-2xl">
                  <div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldAlert class="w-4 h-4 text-yellow-600" />
                  </div>
                  <div class="flex-1">
                    <span class="font-semibold text-yellow-800">Chairperson: </span>
                    <span class="text-yellow-700">{{ message.content }}</span>
                  </div>
                  <span class="text-xs text-yellow-600 flex-shrink-0">{{ formatMessageTime(message.timestamp) }}</span>
                </div>
              </div>

              <!-- Gossip Box - Pink anonymous messages (no changes needed) -->
              <div v-else-if="selectedChannel.id === 'gossip'">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center">
                    <SparklesIcon class="w-3 h-3 text-pink-600" />
                  </div>
                  <span class="font-semibold text-pink-600 text-sm">Anonymous</span>
                  <span class="text-xs text-gray-500">{{ formatMessageTime(message.timestamp) }}</span>
                </div>
                <div class="bg-pink-50 border border-pink-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm max-w-md">
                  <div class="text-pink-800">{{ message.content }}</div>
                </div>
              </div>

              <!-- Direct Messages with flags -->
              <div v-else-if="selectedChannel.type === 'dm'"
                :class="['flex', message.isCurrentUser ? 'justify-end' : 'justify-start']">
                <div :class="['max-w-md', message.isCurrentUser ? 'items-end' : 'items-start']">
                  <div class="flex items-center gap-2 mb-1" :class="message.isCurrentUser ? 'flex-row-reverse' : ''">
                    <span class="text-xs text-gray-500">{{ formatMessageTime(message.timestamp) }}</span>

                    <!-- Show flag and name for other user's messages -->
                    <div v-if="!message.isCurrentUser" class="flex items-center gap-2">
                      <CountryFlag :country-name="message.senderCountry"
                        :country-code="getCountryCodeForMessage(message)" size="small" variant="bordered" />
                      <span class="font-medium text-sm text-gray-700">{{ message.senderCountry }}</span>
                    </div>
                  </div>
                  <div :class="[
                    'px-4 py-2.5 rounded-2xl shadow-sm',
                    message.isCurrentUser
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                  ]">
                    {{ message.content }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="flex-shrink-0 bg-white border-t border-gray-200 p-4">
            <!-- Show input for General Assembly, Gossip Box, and DMs -->
            <div v-if="canSendMessage" class="flex gap-3">
              <input v-model="newMessage" type="text" :placeholder="getInputPlaceholder()" :class="getInputClass()"
                :disabled="isSending" @keydown.enter="sendMessage" />
              <button @click="sendMessage" :disabled="!newMessage.trim() || isSending" :class="getButtonClass()">
                <PaperAirplaneIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Read-only message for Announcements -->
            <div v-else class="text-center text-gray-500 py-3">
              Only presidium members can post announcements
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create DM Modal -->
    <ModalWrapper v-model="showCreateDMModal" title="Start Direct Message"
      subtitle="Send a private message to a delegate" :icon="ChatBubbleLeftRightIcon" size="md"
      primary-text="Start Chat" :is-primary-disabled="!selectedDMDelegate" @primary-action="startDirectMessage"
      @close="closeCreateDMModal">

      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select Delegate
            </label>
            <select v-model="selectedDMDelegate"
              class="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option :value="null">Choose a delegate...</option>
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
import { ref, computed, onMounted, nextTick, watch, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import CountryFlag from '@/components/shared/CountryFlag.vue'

// Icons
import {
  ChatBubbleLeftRightIcon, MagnifyingGlassIcon, PlusIcon,
  PaperAirplaneIcon, GlobeAltIcon, BellAlertIcon,
  ShieldExclamationIcon, SparklesIcon, ShieldCheckIcon
} from '@heroicons/vue/24/outline'
import {
  ShieldAlert,
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
const isLoadingMessages = ref(false)
const messages = ref([])
const onlineDelegates = ref([])
const committee = ref(null)
const messagesContainer = ref(null)
const conversations = ref([])
const dmConversations = ref([])

// Modal state
const showCreateDMModal = ref(false)
const selectedDMDelegate = ref(null)
const initialDMMessage = ref('')

// Public channels configuration
const publicChannels = [
  {
    id: 'general',
    name: 'General Assembly Floor',
    description: 'Visible to everyone',
    iconComponent: markRaw(GlobeAltIcon),
    color: 'bg-blue-500 text-white',
    type: 'public',
    unreadCount: 0
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official Presidium updates',
    iconComponent: markRaw(ShieldCheckIcon),
    color: 'bg-yellow-500 text-white',
    type: 'public',
    unreadCount: 0
  },
  {
    id: 'gossip',
    name: 'Gossip Box',
    description: 'Anonymous chatter',
    iconComponent: markRaw(SparklesIcon),
    color: 'bg-pink-500 text-white',
    type: 'public',
    unreadCount: 0
  }
]

// Computed
const filteredOnlineDelegates = computed(() => {
  let delegates = onlineDelegates.value

  // Filter out self
  delegates = delegates.filter(d => d.email !== authStore.user?.email)

  // Filter out delegates with existing conversations
  const conversationEmails = new Set(dmConversations.value.map(conv =>
    getOtherParticipant(conv).email
  ))
  delegates = delegates.filter(d => !conversationEmails.has(d.email))

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    delegates = delegates.filter(delegate =>
      delegate.countryName.toLowerCase().includes(query)
    )
  }

  return delegates
})

const allDelegates = computed(() => {
  if (!committee.value?.countries) return []

  return committee.value.countries
    .filter(country =>
      country.email &&
      country.email !== authStore.user?.email
    )
    .map(country => ({
      email: country.email,
      countryName: country.name,
      code: country.code
    }))
})

const currentMessages = computed(() => {
  return messagesWithUserFlag.value
})

const canSendMessage = computed(() => {
  if (!selectedChannel.value) return false

  // Announcements only for presidium
  if (selectedChannel.value.id === 'announcements') {
    return authStore.user?.role === 'presidium'
  }

  return true
})

// Methods
const loadData = async () => {
  try {
    // Get committee ID from auth context
    const committeeId = authStore.user?.committeeId
    if (!committeeId) {
      throw new Error('No committee assigned')
    }

    // Fetch full committee details to get countries
    const committeeResponse = await apiMethods.committees.getById(committeeId)
    if (!committeeResponse.data.success) {
      throw new Error('Failed to fetch committee details')
    }

    committee.value = committeeResponse.data.committee

    await Promise.all([
      loadConversations(),
      loadOnlineDelegates()
    ])

    // Select default channel
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

    isLoadingMessages.value = true

    // For public channels
    if (selectedChannel.value.type === 'public') {
      const response = await apiMethods.messages.getCommitteeConversation(
        committee.value._id || committee.value,
        selectedChannel.value.id
      )

      if (response.data.success) {
        selectedChannel.value.conversationId = response.data.conversation._id
        messages.value = response.data.conversation.messages || []
        await nextTick()
        scrollToBottom()
      }
      return
    }

    // For DM channels
    if (selectedChannel.value.type === 'dm' && selectedChannel.value.conversationId) {
      const response = await apiMethods.messages.getConversation(
        selectedChannel.value.conversationId,
        { limit: 100 }
      )

      if (response.data.success) {
        messages.value = response.data.conversation.messages || []
        await nextTick()
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error('Failed to load messages:', error)
    toast.error('Failed to load messages')
  } finally {
    isLoadingMessages.value = false
  }
}

const loadOnlineDelegates = async () => {
  try {
    // Placeholder - in real app would come from WebSocket presence
    onlineDelegates.value = committee.value?.countries
      ?.filter(country => country.email)
      ?.map(country => ({
        email: country.email,
        countryName: country.name,
        code: country.code
      })) || []
  } catch (error) {
    console.error('Failed to load online delegates:', error)
  }
}

const loadConversations = async () => {
  try {
    const response = await apiMethods.messages.getCommitteeConversations(
      committee.value._id || committee.value
    )

    if (response.data.success) {
      conversations.value = response.data.conversations || []

      // Filter DM conversations
      dmConversations.value = conversations.value.filter(conv =>
        conv.conversationType === 'bilateral'
      )
    }
  } catch (error) {
    console.error('Failed to load conversations:', error)
  }
}

const selectChannel = (channel) => {
  selectedChannel.value = channel
  messages.value = []
  loadMessages()
}

const selectDMConversation = (conversation) => {
  const otherParticipant = getOtherParticipant(conversation)

  const dmChannel = {
    id: conversation._id,
    conversationId: conversation._id,
    name: otherParticipant.countryName,
    description: 'Direct Message',
    type: 'dm',
    recipient: otherParticipant
  }

  selectChannel(dmChannel)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedChannel.value || isSending.value) {
    return
  }

  const messageContent = newMessage.value.trim()

  try {
    isSending.value = true

    // For public channels
    if (selectedChannel.value.type === 'public') {
      const response = await apiMethods.messages.sendCommitteeMessage(
        committee.value._id || committee.value,
        selectedChannel.value.id,
        { content: messageContent }
      )

      if (response.data.success) {
        // Immediately add message to local array for instant display
        const newMsg = {
          _id: response.data.message._id,
          senderEmail: authStore.user?.email,
          senderCountry: response.data.message.senderCountry || authStore.user?.countryName || 'Unknown',
          content: response.data.message.content || messageContent,
          timestamp: response.data.message.timestamp || new Date().toISOString()
        }

        // DEBUG: Remove these console.logs once working
        console.log('Adding own message:', newMsg)
        console.log('Current user email:', authStore.user?.email)

        messages.value.push(newMsg)
        newMessage.value = ''
        await nextTick()
        scrollToBottom()
      }
      return
    }

    // For DM channels
    if (selectedChannel.value.conversationId) {
      const response = await apiMethods.messages.sendMessage(
        selectedChannel.value.conversationId,
        { content: messageContent }
      )

      if (response.data.success) {
        // Immediately add message to local array for instant display
        const newMsg = {
          _id: response.data.message._id,
          senderEmail: authStore.user?.email,
          senderCountry: authStore.user?.countryName || 'Unknown',
          content: response.data.message.content || messageContent,
          timestamp: response.data.message.timestamp || new Date().toISOString()
        }

        messages.value.push(newMsg)
        newMessage.value = ''
        await nextTick()
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

const openDirectMessage = async (delegate) => {
  try {
    // Check if bilateral conversation already exists
    const existingConversation = dmConversations.value.find(conv =>
      conv.participants.some(p => p.email === delegate.email)
    )

    if (existingConversation) {
      selectDMConversation(existingConversation)
    } else {
      // Create new bilateral conversation
      const response = await apiMethods.messages.createBilateral({
        committeeId: committee.value._id || committee.value,
        targetEmail: delegate.email,
        targetCountry: delegate.countryName
      })

      if (response.data.success) {
        const conversation = response.data.conversation
        dmConversations.value.push(conversation)
        selectDMConversation(conversation)
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

const getOtherParticipant = (conversation) => {
  const other = conversation.participants?.find(p => p.email !== authStore.user?.email)
  return {
    email: other?.email || '',
    countryName: other?.countryName || 'Unknown',
    code: other?.code || ''
  }
}

/**
 * Check if a message was sent by the current user
 */
const messagesWithUserFlag = computed(() => {
  return messages.value.map(msg => ({
    ...msg,
    isCurrentUser: msg.senderEmail === authStore.user?.email
  }))
})

/**
 * Get country code for displaying flag in messages
 */
const getCountryCodeForMessage = (message) => {
  // Check if sender is Presidium (chairperson, vice-chairperson, etc.)
  if (message.senderCountry && message.senderCountry.toLowerCase().includes('presidium')) {
    return 'UN' // Use UN flag for all presidium members
  }
  
  // Find country code from committee countries
  const country = committee.value?.countries?.find(c => 
    c.name === message.senderCountry || 
    c.name.toLowerCase() === message.senderCountry.toLowerCase()
  )
  
  return country?.code || 'UN' // Fallback to UN flag if not found
}

const getInputPlaceholder = () => {
  if (!selectedChannel.value) return 'Type a message...'

  switch (selectedChannel.value.id) {
    case 'announcements':
      return 'Type official announcement...'
    case 'gossip':
      return 'Share anonymous gossip...'
    case 'general':
      return 'Message everyone...'
    default:
      return `Message ${selectedChannel.value.name}...`
  }
}

const getInputClass = () => {
  const base = "flex-1 px-4 py-3 border rounded-full focus:ring-2 focus:border-transparent transition-colors"

  if (!selectedChannel.value) {
    return `${base} border-gray-300 focus:ring-blue-500`
  }

  switch (selectedChannel.value.id) {
    case 'announcements':
      return `${base} border-yellow-300 focus:ring-yellow-500`
    case 'gossip':
      return `${base} border-pink-300 focus:ring-pink-500`
    default:
      return `${base} border-gray-300 focus:ring-blue-500`
  }
}

const getButtonClass = () => {
  const base = "w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  if (!selectedChannel.value) {
    return `${base} bg-blue-600 hover:bg-blue-700 text-white`
  }

  switch (selectedChannel.value.id) {
    case 'announcements':
      return `${base} bg-yellow-600 hover:bg-yellow-700 text-white`
    case 'gossip':
      return `${base} bg-pink-600 hover:bg-pink-700 text-white`
    default:
      return `${base} bg-blue-600 hover:bg-blue-700 text-white`
  }
}

const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
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
  wsService.on('committee-message-received', (data) => {

    // Check if message is for current channel
    const isCurrentChannel =
      (selectedChannel.value?.conversationId === data.conversationId) ||
      (selectedChannel.value?.type === 'public' && data.channelType === selectedChannel.value.id)

    if (isCurrentChannel) {
      // Check if message already exists (prevents duplicates from our own sends)
      const messageExists = messages.value.some(msg => msg._id === data.messageId)

      if (!messageExists) {
        const newMessage = {
          _id: data.messageId,
          senderEmail: data.senderEmail,
          senderCountry: data.senderCountry,
          content: data.content,
          timestamp: data.timestamp
        }

        messages.value.push(newMessage)
        scrollToBottom()
      }
    } else {
      // Update unread count for other channels
      const channel = publicChannels.find(c => c.id === data.channelType)
      if (channel) {
        channel.unreadCount++
      }
    }
  })

  wsService.on('conversation-created', () => {
    loadConversations()
  })
}

// Watchers
watch(selectedChannel, () => {
  if (selectedChannel.value) {
    selectedChannel.value.unreadCount = 0
  }
})

// Lifecycle
onMounted(async () => {
  await loadData()
  setupWebSocketListeners()
})
</script>