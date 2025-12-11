<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3 text-blue-600 mb-2">
            <ShieldCheckIcon class="w-6 h-6" />
            <h1 class="text-2xl font-bold text-gray-900">Strategic Alliances</h1>
          </div>
          <p class="text-gray-600">Form coalitions to consolidate voting power and draft resolutions together.</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="searchQuery" type="text" placeholder="Find alliance..."
              class="pl-10 pr-4 py-2 w-80 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <button @click="showCreateModal = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
            <PlusIcon class="w-5 h-5" />
            <span>Form New Coalition</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading alliances...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <!-- My Coalition Status Banner -->
        <div v-if="myCoalition" class="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <ShieldCheckIcon class="w-6 h-6 text-blue-600" />
              <div>
                <p class="text-sm font-medium text-blue-900">You are part of</p>
                <p class="text-lg font-bold text-blue-700">{{ myCoalition.name }}</p>
              </div>
            </div>
            <button @click="confirmLeaveCoalition(myCoalition._id)"
              class="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
              Leave Alliance
            </button>
          </div>
        </div>

        <!-- Pending Invitations -->
        <div v-if="pendingInvitations.length > 0" class="mb-6 space-y-3">
          <h2 class="text-lg font-semibold text-gray-900">Pending Invitations</h2>
          <div v-for="invitation in pendingInvitations" :key="invitation._id"
            class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{{ invitation.name }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ invitation.description }}</p>
                <div class="flex items-center space-x-4 mt-2">
                  <span class="text-xs text-gray-500">
                    Head: {{ invitation.headCountry }}
                  </span>
                  <span class="text-xs text-gray-500">
                    Members: {{ invitation.acceptedMembers?.length || 0 }}
                  </span>
                </div>
              </div>
              <div class="flex space-x-2 ml-4">
                <button @click="respondToInvitation(invitation._id, 'accepted')" :disabled="isSubmitting"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Accept
                </button>
                <button @click="respondToInvitation(invitation._id, 'declined')" :disabled="isSubmitting"
                  class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coalitions Grid -->
        <div v-if="filteredCoalitions.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">All Alliances</h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div v-for="coalition in filteredCoalitions" :key="coalition._id"
              class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <!-- Coalition Header -->
              <div :class="[
                'px-6 py-4 border-b border-gray-200',
                getCoalitionHeaderClass(coalition.color || 'blue')
              ]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div :class="[
                      'w-3 h-3 rounded-full mr-3',
                      getCoalitionDotClass(coalition.color || 'blue')
                    ]"></div>
                    <h3 class="text-lg font-bold text-white">{{ coalition.name }}</h3>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span v-if="coalition.isActive"
                      class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                    <span v-else class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      Forming
                    </span>
                  </div>
                </div>
                <p class="text-white/90 text-sm mt-2">{{ coalition.description }}</p>
              </div>

              <!-- Coalition Body -->
              <div class="p-6">
                <!-- Coalition Head -->
                <div class="mb-4 pb-4 border-b border-gray-200">
                  <div class="flex items-center space-x-3">
                    <img :src="getCountryFlag(coalition.headCountry)" :alt="coalition.headCountry"
                      class="w-8 h-6 rounded border border-gray-200 object-cover" />
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Alliance Head</p>
                      <p class="text-sm font-semibold text-gray-900">{{ coalition.headCountry }}</p>
                    </div>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex justify-between items-center mb-4">
                  <div class="text-sm text-gray-500 uppercase">
                    MEMBERS ({{ coalition.acceptedMembers?.length || 0 }})
                  </div>
                  <button v-if="coalition.acceptedMembers?.length > 3" @click="toggleCoalitionDetails(coalition._id)"
                    class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    {{ expandedCoalition === coalition._id ? 'HIDE' : 'VIEW ALL' }}
                  </button>
                </div>

                <!-- Member List (Preview or Full) -->
                <div class="space-y-2 mb-4">
                  <div v-for="member in getDisplayedMembers(coalition)" :key="member.country"
                    class="flex items-center space-x-3">
                    <img :src="getCountryFlag(member.country)" :alt="member.country"
                      class="w-6 h-4 rounded border border-gray-200 object-cover" />
                    <span class="text-sm font-medium text-gray-700 flex-1">{{ member.country }}</span>
                    <span v-if="member.status === 'invited'"
                      class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  </div>

                  <!-- Show more indicator -->
                  <div v-if="!isExpanded(coalition._id) && (coalition.members?.length || 0) > 3"
                    class="text-sm text-gray-500 text-center py-2">
                    +{{ (coalition.members?.length || 0) - 3 }} more members
                  </div>
                </div>

                <!-- Action Button -->
                <div v-if="canInteractWithCoalition(coalition)">
                  <button @click="handleCoalitionAction(coalition)" :disabled="isSubmitting"
                    :class="getActionButtonClass(coalition)"
                    class="w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <div class="flex items-center justify-center space-x-2">
                      <component :is="getActionIcon(coalition)" class="w-5 h-5" />
                      <span>{{ getActionText(coalition) }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="coalitions.length === 0 && !searchQuery" class="text-center py-12">
          <ShieldCheckIcon class="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No alliances yet</h3>
          <p class="text-gray-600 mb-6 max-w-md mx-auto">
            Strategic alliances help countries coordinate their positions and strengthen their voting power.
          </p>
          <button @click="showCreateModal = true"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create First Coalition
          </button>
        </div>

        <!-- No Search Results -->
        <div v-else-if="searchQuery && filteredCoalitions.length === 0" class="text-center py-12">
          <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No alliances found</h3>
          <p class="text-gray-600">Try adjusting your search terms.</p>
        </div>
      </div>
    </div>

    <!-- Create Coalition Modal -->
    <ModalWrapper v-model="showCreateModal" title="Create New Coalition"
      subtitle="Form a strategic alliance with other countries" :icon="ShieldCheckIcon" size="lg"
      :has-unsaved-changes="hasUnsavedChanges" :is-primary-disabled="!isFormValid || isSubmitting"
      primary-text="Create Coalition" @primary-action="createCoalition" @close="closeCreateModal">

      <template #content>
        <div class="space-y-6">
          <!-- Coalition Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Coalition Name *
            </label>
            <input v-model="newCoalition.name" type="text" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Western Alliance, G77 Plus..." />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea v-model="newCoalition.description" rows="3" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the coalition's purpose and goals..."></textarea>
          </div>

          <!-- Initial Members -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Invite Countries (optional)
            </label>
            <p class="text-xs text-gray-500 mb-3">Select countries to invite to your coalition. They will receive an
              invitation to join.</p>

            <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              <div v-for="country in availableCountries" :key="country.name"
                class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                <input type="checkbox" :id="`country-${country.name}`" :value="country.name"
                  v-model="newCoalition.invitedCountries" :disabled="!country.email"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label :for="`country-${country.name}`" :class="[
                  'flex items-center space-x-3 flex-1 cursor-pointer',
                  !country.email && 'opacity-50 cursor-not-allowed'
                ]">
                  <img :src="getCountryFlag(country.name)" :alt="country.name"
                    class="w-6 h-4 rounded border border-gray-200 object-cover" />
                  <span class="text-sm">{{ country.name }}</span>
                  <span v-if="!country.email" class="text-xs text-gray-400">(No delegate)</span>
                </label>
              </div>
            </div>

            <p v-if="newCoalition.invitedCountries.length > 0" class="text-xs text-blue-600 mt-2">
              {{ newCoalition.invitedCountries.length }} {{ newCoalition.invitedCountries.length === 1 ? 'country' :
              'countries' }} selected
            </p>
          </div>
        </div>
      </template>
    </ModalWrapper>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'

// Icons
import {
  ShieldCheckIcon, MagnifyingGlassIcon, PlusIcon,
  UserGroupIcon, ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isSubmitting = ref(false)
const coalitions = ref([])
const countries = ref([])
const committee = ref(null)
const searchQuery = ref('')
const expandedCoalition = ref(null)
const showCreateModal = ref(false)

// Form state
const newCoalition = reactive({
  name: '',
  description: '',
  invitedCountries: []
})

// Color options for coalitions (for display purposes)
const colorOptions = {
  blue: { header: 'bg-gradient-to-r from-blue-500 to-blue-600', dot: 'bg-blue-200' },
  green: { header: 'bg-gradient-to-r from-green-500 to-green-600', dot: 'bg-green-200' },
  purple: { header: 'bg-gradient-to-r from-purple-500 to-purple-600', dot: 'bg-purple-200' },
  red: { header: 'bg-gradient-to-r from-red-500 to-red-600', dot: 'bg-red-200' },
  orange: { header: 'bg-gradient-to-r from-orange-500 to-orange-600', dot: 'bg-orange-200' },
  teal: { header: 'bg-gradient-to-r from-teal-500 to-teal-600', dot: 'bg-teal-200' }
}

// Computed
const myCoalition = computed(() => {
  return coalitions.value.find(c =>
    c.acceptedMembers?.some(m => m.email === authStore.user?.email) ||
    c.headEmail === authStore.user?.email
  )
})

const pendingInvitations = computed(() => {
  return coalitions.value.filter(c =>
    c.members?.some(m => m.email === authStore.user?.email && m.status === 'invited')
  )
})

const filteredCoalitions = computed(() => {
  let filtered = coalitions.value

  // Filter out coalitions with pending invitations (shown separately)
  filtered = filtered.filter(c =>
    !c.members?.some(m => m.email === authStore.user?.email && m.status === 'invited')
  )

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(coalition =>
      coalition.name.toLowerCase().includes(query) ||
      coalition.description?.toLowerCase().includes(query) ||
      coalition.headCountry.toLowerCase().includes(query)
    )
  }

  return filtered
})

const availableCountries = computed(() => {
  return countries.value.filter(country =>
    country.name !== authStore.user?.countryName
  )
})

const isFormValid = computed(() => {
  return newCoalition.name.trim().length > 0 &&
    newCoalition.description.trim().length > 0
})

const hasUnsavedChanges = computed(() => {
  return newCoalition.name.trim() !== '' ||
    newCoalition.description.trim() !== '' ||
    newCoalition.invitedCountries.length > 0
})

// Methods
const loadData = async () => {
  try {
    isLoading.value = true

    // Get committee from auth context
    committee.value = authStore.user?.committeeId
    if (!committee.value) {
      throw new Error('No committee assigned')
    }

    // Set countries from committee
    countries.value = committee.value.countries || []

    // Load coalitions
    await loadCoalitions()

  } catch (error) {
    console.error('Failed to load coalitions data:', error)
    toast.error('Failed to load coalitions data')
  } finally {
    isLoading.value = false
  }
}

const loadCoalitions = async () => {
  try {
    const response = await apiMethods.resolutions.getCoalitions(committee.value._id)

    if (response.data.success) {
      coalitions.value = response.data.coalitions || []
    }
  } catch (error) {
    console.error('Failed to load coalitions:', error)
    toast.error('Failed to load coalitions')
  }
}

const createCoalition = async () => {
  try {
    isSubmitting.value = true

    const coalitionData = {
      committeeId: committee.value._id,
      name: newCoalition.name.trim(),
      description: newCoalition.description.trim(),
      invitedCountries: newCoalition.invitedCountries
    }

    const response = await apiMethods.resolutions.createCoalition(coalitionData)

    if (response.data.success) {
      await loadCoalitions()
      closeCreateModal()
      toast.success('Coalition created successfully!')
    }
  } catch (error) {
    console.error('Failed to create coalition:', error)
    const errorMsg = error.response?.data?.error || 'Failed to create coalition'
    toast.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

const respondToInvitation = async (coalitionId, response) => {
  try {
    isSubmitting.value = true

    const result = await apiMethods.resolutions.respondToInvitation(coalitionId, { response })

    if (result.data.success) {
      await loadCoalitions()

      if (response === 'accepted') {
        toast.success('Invitation accepted! You are now part of the coalition.')
      } else {
        toast.success('Invitation declined.')
      }
    }
  } catch (error) {
    console.error('Failed to respond to invitation:', error)
    const errorMsg = error.response?.data?.error || 'Failed to respond to invitation'
    toast.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

const confirmLeaveCoalition = async (coalitionId) => {
  if (!confirm('Are you sure you want to leave this coalition? This action cannot be undone.')) {
    return
  }

  try {
    isSubmitting.value = true

    await apiMethods.resolutions.leaveCoalition(coalitionId)
    await loadCoalitions()

    toast.success('You have left the coalition')
  } catch (error) {
    console.error('Failed to leave coalition:', error)
    const errorMsg = error.response?.data?.error || 'Failed to leave coalition'
    toast.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

const canInteractWithCoalition = (coalition) => {
  const userEmail = authStore.user?.email

  // Can't interact if already in another coalition
  if (myCoalition.value && myCoalition.value._id !== coalition._id) {
    return false
  }

  // Can leave if part of this coalition
  if (coalition.headEmail === userEmail ||
    coalition.acceptedMembers?.some(m => m.email === userEmail)) {
    return true
  }

  return false
}

const handleCoalitionAction = (coalition) => {
  const userEmail = authStore.user?.email

  // If user is part of this coalition, they can leave
  if (coalition.headEmail === userEmail ||
    coalition.acceptedMembers?.some(m => m.email === userEmail)) {
    confirmLeaveCoalition(coalition._id)
  }
}

const getActionText = (coalition) => {
  const userEmail = authStore.user?.email

  if (coalition.headEmail === userEmail ||
    coalition.acceptedMembers?.some(m => m.email === userEmail)) {
    return 'Leave Alliance'
  }

  return 'View Details'
}

const getActionIcon = (coalition) => {
  const userEmail = authStore.user?.email

  if (coalition.headEmail === userEmail ||
    coalition.acceptedMembers?.some(m => m.email === userEmail)) {
    return ArrowRightOnRectangleIcon
  }

  return UserGroupIcon
}

const getActionButtonClass = (coalition) => {
  const userEmail = authStore.user?.email

  if (coalition.headEmail === userEmail ||
    coalition.acceptedMembers?.some(m => m.email === userEmail)) {
    return 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
  }

  return 'bg-blue-600 text-white hover:bg-blue-700'
}

const toggleCoalitionDetails = (coalitionId) => {
  expandedCoalition.value = expandedCoalition.value === coalitionId ? null : coalitionId
}

const isExpanded = (coalitionId) => {
  return expandedCoalition.value === coalitionId
}

const getDisplayedMembers = (coalition) => {
  if (!coalition.members) return []

  // Filter out head (shown separately) and only accepted members
  const acceptedMembers = coalition.members.filter(m =>
    m.country !== coalition.headCountry && m.status === 'accepted'
  )

  if (isExpanded(coalition._id)) {
    return acceptedMembers
  }

  return acceptedMembers.slice(0, 3)
}

const getCountryFlag = (countryName) => {
  const country = countries.value.find(c => c.name === countryName)
  return country?.flagUrl || '/api/countries/flags/default'
}

const getCoalitionHeaderClass = (color) => {
  return colorOptions[color]?.header || colorOptions.blue.header
}

const getCoalitionDotClass = (color) => {
  return colorOptions[color]?.dot || colorOptions.blue.dot
}

// Modal methods
const closeCreateModal = () => {
  showCreateModal.value = false
  newCoalition.name = ''
  newCoalition.description = ''
  newCoalition.invitedCountries = []
}

// WebSocket listeners
const setupWebSocketListeners = () => {
  wsService.on('coalition-created', (data) => {
    if (data.committeeId === committee.value?._id) {
      loadCoalitions()
    }
  })

  wsService.on('coalition-updated', (data) => {
    if (data.committeeId === committee.value?._id) {
      loadCoalitions()
    }
  })

  wsService.on('coalition-invitation', (data) => {
    if (data.invitedEmail === authStore.user?.email) {
      loadCoalitions()
      toast.log(`You've been invited to join "${data.coalitionName}"`)
    }
  })
}

// Lifecycle
onMounted(async () => {
  await loadData()
  setupWebSocketListeners()
})
</script>