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
        <div class="flex space-x-3">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="searchQuery" type="text" placeholder="Find alliance..."
              class="pl-10 pr-4 py-2 w-80 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Coalitions Grid -->
        <div v-if="filteredCoalitions.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div v-for="coalition in filteredCoalitions" :key="coalition._id"
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                <button @click="deleteCoalition(coalition._id)"
                  class="text-white/80 hover:text-white transition-colors">
                  <TrashIcon class="w-5 h-5" />
                </button>
              </div>
              <p class="text-white/90 text-sm mt-2">{{ coalition.description }}</p>
            </div>

            <!-- Coalition Body -->
            <div class="p-6">
              <!-- Stats -->
              <div class="flex justify-between items-center mb-4">
                <div class="text-sm text-gray-500 uppercase">
                  MEMBERS ({{ coalition.members?.length || 0 }})
                </div>
                <button @click="toggleCoalitionManagement(coalition._id)"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {{ expandedCoalition === coalition._id ? 'HIDE' : 'MANAGE' }}
                </button>
              </div>

              <!-- Member List -->
              <div class="space-y-2 mb-4">
                <div v-for="member in (coalition.members || []).slice(0, 3)" :key="member.country"
                  class="flex items-center space-x-3">
                  <CountryFlag :country-name="member.country" :country-code="member.country" size="medium"
                      variant="bordered" />
                    class="w-6 h-4 rounded border border-gray-200 object-cover" />
                  <span class="text-sm font-medium text-gray-700">{{ member.country }}</span>
                  <span :class="[
                    'text-xs px-2 py-1 rounded-full',
                    member.role === 'leader' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  ]">
                    {{ member.role === 'leader' ? 'Leader' : 'Member' }}
                  </span>
                </div>

                <!-- Show more indicator -->
                <div v-if="(coalition.members?.length || 0) > 3" class="text-sm text-gray-500 text-center py-2">
                  +{{ (coalition.members?.length || 0) - 3 }} more members
                </div>
              </div>

              <!-- Expanded Management -->
              <div v-if="expandedCoalition === coalition._id" class="border-t border-gray-200 pt-4">
                <!-- All Members List -->
                <div class="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  <div v-for="member in coalition.members || []" :key="member.country"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <img :src="getCountryFlag(member.country)" :alt="member.country"
                        class="w-6 h-4 rounded border border-gray-200 object-cover" />
                      <span class="text-sm font-medium">{{ member.country }}</span>
                      <span :class="[
                        'text-xs px-2 py-1 rounded-full',
                        member.role === 'leader' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      ]">
                        {{ member.role === 'leader' ? 'Leader' : 'Member' }}
                      </span>
                    </div>
                    <button @click="removeMemberFromCoalition(coalition._id, member.country)"
                      class="text-red-600 hover:text-red-700">
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Add Member -->
                <div class="flex space-x-2">
                  <select v-model="newMember[coalition._id]" class="flex-1 text-sm border-gray-300 rounded-lg">
                    <option value="">Select country...</option>
                    <option v-for="country in getAvailableCountries(coalition)" :key="country.name"
                      :value="country.name">
                      {{ country.name }}
                    </option>
                  </select>
                  <button @click="addMemberToCoalition(coalition._id)" :disabled="!newMember[coalition._id]"
                    class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="coalitions.length === 0 && !isLoading" class="text-center py-12">
          <ShieldCheckIcon class="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No coalitions yet</h3>
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

    <!-- Floating Action Button -->
    <div class="fixed bottom-6 right-6">
      <button @click="showCreateModal = true"
        class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
        <PlusIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- Create Coalition Modal -->
    <ModalWrapper v-model="showCreateModal" title="Create New Coalition"
      subtitle="Form a strategic alliance between countries" :icon="ShieldCheckIcon" size="lg"
      :has-unsaved-changes="hasUnsavedChanges" :is-primary-disabled="!isFormValid || isSubmitting"
      primary-text="Create Coalition" @primary-action="createCoalition" @close="closeCreateModal">

      <template #content>
        <form @submit.prevent="createCoalition" class="space-y-6">
          <!-- Coalition Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Coalition Name
            </label>
            <input v-model="newCoalition.name" type="text" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Western Alliance, G77 Plus..." />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea v-model="newCoalition.description" rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the coalition's purpose and goals..."></textarea>
          </div>

          <!-- Color Theme -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Color Theme
            </label>
            <div class="grid grid-cols-6 gap-3">
              <div v-for="color in colorOptions" :key="color.name" class="flex w-full justify-center">
                <button type="button"
                  @click="newCoalition.color = color.name" :class="[
                    'w-12 h-12 rounded-lg border-2 transition-all',
                    color.class,
                    newCoalition.color === color.name
                      ? 'border-gray-800 ring-2 ring-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                  ]">
                  <CheckIcon v-if="newCoalition.color === color.name" class="w-6 h-6 text-white mx-auto" />
                </button>
              </div>
            </div>
          </div>

          <!-- Initial Members -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Initial Members (optional)
            </label>
            <div class="space-y-2">
              <div v-for="(member, index) in newCoalition.initialMembers" :key="index"
                class="flex items-center space-x-3">
                <select v-model="member.country" class="flex-1 border-gray-300 rounded-lg text-sm">
                  <option value="">Select country...</option>
                  <option v-for="country in countries" :key="country.name" :value="country.name">
                    {{ country.name }}
                  </option>
                </select>
                <select v-model="member.role" class="border-gray-300 rounded-lg text-sm">
                  <option value="member">Member</option>
                  <option value="leader">Leader</option>
                </select>
                <button type="button" @click="removeInitialMember(index)" class="text-red-600 hover:text-red-700">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
              <button type="button" @click="addInitialMember"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add Member
              </button>
            </div>
          </div>
        </form>
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
  ShieldCheckIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon,
  PlusIcon, CheckIcon
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
const newMember = reactive({})
const newCoalition = reactive({
  name: '',
  description: '',
  color: 'blue',
  initialMembers: []
})

// Color options for coalitions
const colorOptions = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'teal', class: 'bg-teal-500' }
]

// Computed
const filteredCoalitions = computed(() => {
  if (!searchQuery.value.trim()) {
    return coalitions.value
  }

  const query = searchQuery.value.toLowerCase()
  return coalitions.value.filter(coalition =>
    coalition.name.toLowerCase().includes(query) ||
    coalition.description.toLowerCase().includes(query)
  )
})

const isFormValid = computed(() => {
  return newCoalition.name.trim().length > 0 && newCoalition.description.trim().length > 0
})

const hasUnsavedChanges = computed(() => {
  return newCoalition.name.trim() !== '' ||
    newCoalition.description.trim() !== '' ||
    newCoalition.initialMembers.length > 0
})

// Methods
const loadData = async () => {
  try {
    isLoading.value = true

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
  }
}

const createCoalition = async () => {
  try {
    isSubmitting.value = true

    const coalitionData = {
      committeeId: committee.value._id,
      name: newCoalition.name.trim(),
      description: newCoalition.description.trim(),
      color: newCoalition.color,
      initialMembers: newCoalition.initialMembers
        .filter(m => m.country)
        .map(m => {
          const country = countries.value.find(c => c.name === m.country)
          return {
            country: m.country,
            code: country?.code || m.country,
            role: m.role
          }
        })
    }

    const response = await apiMethods.resolutions.createCoalition(coalitionData)

    if (response.data.success) {
      await loadCoalitions()
      closeCreateModal()
      toast.success('Coalition created successfully')
    }
  } catch (error) {
    console.error('Failed to create coalition:', error)
    toast.error('Failed to create coalition')
  } finally {
    isSubmitting.value = false
  }
}

const deleteCoalition = async (coalitionId) => {
  if (!confirm('Are you sure you want to delete this coalition?')) return

  try {
    // Note: You'll need to implement this API method
    // await apiMethods.resolutions.deleteCoalition(coalitionId)

    coalitions.value = coalitions.value.filter(c => c._id !== coalitionId)
    toast.success('Coalition deleted successfully')
  } catch (error) {
    console.error('Failed to delete coalition:', error)
    toast.error('Failed to delete coalition')
  }
}

const addMemberToCoalition = async (coalitionId) => {
  const countryName = newMember[coalitionId]
  if (!countryName) return

  try {
    const country = countries.value.find(c => c.name === countryName)
    const code = country?.code || countryName

    // Note: You'll need to implement this API method
    // await apiMethods.resolutions.addCoalitionMember(coalitionId, { country: countryName, code, role: 'member' })

    const coalition = coalitions.value.find(c => c._id === coalitionId)
    if (coalition) {
      if (!coalition.members) coalition.members = []
      coalition.members.push({ country: countryName, code, role: 'member' })
    }

    newMember[coalitionId] = ''
    toast.success(`${countryName} added to coalition`)
  } catch (error) {
    console.error('Failed to add member:', error)
    toast.error('Failed to add member')
  }
}

const removeMemberFromCoalition = async (coalitionId, countryName) => {
  try {
    // Note: You'll need to implement this API method
    // await apiMethods.resolutions.removeCoalitionMember(coalitionId, countryName)

    const coalition = coalitions.value.find(c => c._id === coalitionId)
    if (coalition && coalition.members) {
      coalition.members = coalition.members.filter(m => m.country !== countryName)
    }

    toast.success(`${countryName} removed from coalition`)
  } catch (error) {
    console.error('Failed to remove member:', error)
    toast.error('Failed to remove member')
  }
}

const toggleCoalitionManagement = (coalitionId) => {
  expandedCoalition.value = expandedCoalition.value === coalitionId ? null : coalitionId
}

const getAvailableCountries = (coalition) => {
  const memberCountries = new Set((coalition.members || []).map(m => m.country))
  return countries.value.filter(country => !memberCountries.has(country.name))
}

const getCoalitionHeaderClass = (color) => {
  const classes = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    teal: 'bg-gradient-to-r from-teal-500 to-teal-600'
  }
  return classes[color] || classes.blue
}

const getCoalitionDotClass = (color) => {
  const classes = {
    blue: 'bg-blue-200',
    green: 'bg-green-200',
    purple: 'bg-purple-200',
    red: 'bg-red-200',
    orange: 'bg-orange-200',
    teal: 'bg-teal-200'
  }
  return classes[color] || classes.blue
}

// Modal methods
const closeCreateModal = () => {
  showCreateModal.value = false
  newCoalition.name = ''
  newCoalition.description = ''
  newCoalition.color = 'blue'
  newCoalition.initialMembers = []
}

const addInitialMember = () => {
  newCoalition.initialMembers.push({ country: '', role: 'member' })
}

const removeInitialMember = (index) => {
  newCoalition.initialMembers.splice(index, 1)
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
}

// Lifecycle
onMounted(async () => {
  await loadData()
  setupWebSocketListeners()
})
</script>