<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3 text-blue-600 mb-2">
            <CheckCircleIcon class="w-6 h-6" />
            <h1 class="text-2xl font-bold text-gray-900">Voting Chamber</h1>
          </div>
          <p class="text-gray-600">Manage motions, resolutions, and procedural votes.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading voting data...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="flex-1 overflow-y-auto p-6">
      <div class="max-w-4xl mx-auto space-y-6">

        <!-- Active Vote Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Active Vote -->
          <div v-if="activeVote" class="p-6 space-y-6">
            <!-- Vote Header -->
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-sm font-medium text-green-600 uppercase">Active Vote</span>
                  <span :class="[
                    'text-xs px-2 py-1 rounded-full',
                    getVoteTypeColor(activeVote.votingType)
                  ]">
                    {{ getVoteTypeLabel(activeVote.votingType) }}
                  </span>
                </div>
                <h3 class="text-xl font-bold text-gray-900">{{ activeVote.title }}</h3>
                <p v-if="activeVote.description" class="text-gray-600 mt-1">{{ activeVote.description }}</p>
              </div>
            </div>

            <!-- My Vote Status -->
            <div v-if="myVote" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <CheckCircleIcon class="w-6 h-6 text-blue-600" />
                  <div>
                    <div class="font-semibold text-blue-900">You have voted</div>
                    <div class="text-sm text-blue-700">
                      Your vote: <span class="font-medium capitalize">{{ myVote.vote }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-xs text-blue-600">
                  {{ formatTime(myVote.timestamp) }}
                </div>
              </div>
            </div>

            <!-- Voting Interface -->
            <div v-if="!myVote && canVote">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 class="font-semibold text-gray-900 mb-4 text-center">Cast Your Vote</h4>
                <div class="grid grid-cols-3 gap-4">
                  <!-- Vote For -->
                  <button @click="castVote('for')" :disabled="isSubmitting"
                    class="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
                    <div
                      class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                      <CheckCircleIcon class="w-7 h-7 text-green-600" />
                    </div>
                    <span class="font-semibold text-gray-900">For</span>
                    <span class="text-xs text-gray-500 mt-1">Vote in favor</span>
                  </button>

                  <!-- Vote Against -->
                  <button @click="castVote('against')" :disabled="isSubmitting"
                    class="flex flex-col items-center justify-center p-6 bg-white border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
                    <div
                      class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                      <XCircleIcon class="w-7 h-7 text-red-600" />
                    </div>
                    <span class="font-semibold text-gray-900">Against</span>
                    <span class="text-xs text-gray-500 mt-1">Vote in opposition</span>
                  </button>

                  <!-- Abstain -->
                  <button @click="castVote('abstain')" :disabled="isSubmitting"
                    class="flex flex-col items-center justify-center p-6 bg-white border-2 border-yellow-200 rounded-xl hover:bg-yellow-50 hover:border-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
                    <div
                      class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
                      <MinusCircleIcon class="w-7 h-7 text-yellow-600" />
                    </div>
                    <span class="font-semibold text-gray-900">Abstain</span>
                    <span class="text-xs text-gray-500 mt-1">Do not vote</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Waiting for turn (Roll Call) -->
            <div v-else-if="!myVote && !canVote && activeVote.votingType === 'rollCall'"
              class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-center space-x-3">
                <ClockIcon class="w-6 h-6 text-yellow-600" />
                <div>
                  <div class="font-semibold text-yellow-900">Waiting for your turn</div>
                  <div class="text-sm text-yellow-700">
                    You'll be called to vote when it's your turn in the roll call
                  </div>
                </div>
              </div>
            </div>

            <!-- Voting Progress -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- For Votes -->
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <div class="text-center">
                  <div class="text-3xl font-bold text-green-700">{{ activeVote.results?.for || 0 }}</div>
                  <div class="text-sm text-green-600 uppercase mt-1">For</div>
                </div>
              </div>

              <!-- Against Votes -->
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <div class="text-center">
                  <div class="text-3xl font-bold text-red-700">{{ activeVote.results?.against || 0 }}</div>
                  <div class="text-sm text-red-600 uppercase mt-1">Against</div>
                </div>
              </div>

              <!-- Abstentions -->
              <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div class="text-center">
                  <div class="text-3xl font-bold text-yellow-700">{{ activeVote.results?.abstain || 0 }}</div>
                  <div class="text-sm text-yellow-600 uppercase mt-1">Abstain</div>
                </div>
              </div>

              <!-- Total Progress -->
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div class="text-center">
                  <div class="text-3xl font-bold text-blue-700">{{ getTotalVotes(activeVote) }}</div>
                  <div class="text-sm text-blue-600 uppercase mt-1">Total Votes</div>
                  <div class="text-xs text-blue-500 mt-1">
                    {{ Math.round(getVotingProgress(activeVote)) }}% Complete
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between text-sm text-gray-600">
                <span>Voting Progress</span>
                <span>{{ getTotalVotes(activeVote) }} / {{ activeVote.eligibleVoters?.length || 0 }} delegates</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  :style="{ width: `${getVotingProgress(activeVote)}%` }"></div>
              </div>
            </div>

            <!-- Roll Call Order (if applicable) -->
            <div v-if="activeVote.votingType === 'rollCall' && activeVote.rollCallOrder"
              class="border-t border-gray-200 pt-6">
              <h4 class="font-semibold text-gray-900 mb-4">Roll Call Order</h4>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="(country, index) in activeVote.rollCallOrder" :key="country" :class="[
                  'flex items-center justify-between p-3 rounded-lg border',
                  country === authStore.user?.countryName && index === activeVote.currentVoterIndex
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                    : index === activeVote.currentVoterIndex
                      ? 'bg-yellow-50 border-yellow-200'
                      : country === authStore.user?.countryName
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                ]">
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium text-gray-500 w-6">{{ index + 1 }}.</span>
                    <CountryFlag :country-name="country" :country-code="getCountryCode(country)" size="medium"
                      variant="bordered" />
                    <span :class="[
                      'font-medium',
                      country === authStore.user?.countryName ? 'text-blue-900' : 'text-gray-900'
                    ]">
                      {{ country }}
                      <span v-if="country === authStore.user?.countryName" class="text-blue-600"> (You)</span>
                    </span>
                    <span v-if="index === activeVote.currentVoterIndex"
                      class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      Current Speaker
                    </span>
                  </div>
                  <div class="text-sm">
                    <span v-if="getCountryVote(country)" :class="getVoteColorClass(getCountryVote(country))">
                      {{ formatVote(getCountryVote(country)) }}
                    </span>
                    <span v-else class="text-gray-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Active Vote -->
          <div v-else class="p-6">
            <div class="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon class="w-8 h-8 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Vote</h3>
              <p class="text-gray-600">Wait for the Presidium to initiate a new voting session.</p>
            </div>
          </div>
        </div>

        <!-- Voting History Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
              <ClockIcon class="w-5 h-5 text-gray-500" />
              <h3 class="text-lg font-semibold text-gray-900">Voting History</h3>
            </div>
            <div class="text-sm text-gray-500">
              {{ votingHistory.length }} vote{{ votingHistory.length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- History List -->
          <div v-if="votingHistory.length > 0" class="space-y-4">
            <div v-for="vote in votingHistory" :key="vote._id"
              class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <h4 class="font-semibold text-gray-900">{{ vote.title }}</h4>
                    <span :class="[
                      'text-xs px-2 py-1 rounded-full',
                      getVoteTypeColor(vote.votingType)
                    ]">
                      {{ getVoteTypeLabel(vote.votingType) }}
                    </span>
                  </div>
                  <p v-if="vote.description" class="text-sm text-gray-600">{{ vote.description }}</p>
                </div>
                <div class="text-right text-sm text-gray-500">
                  {{ formatDate(vote.completedAt || vote.createdAt) }}
                </div>
              </div>

              <!-- My Vote in History -->
              <div v-if="getMyHistoricalVote(vote)" class="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="flex items-center space-x-2">
                  <CheckCircleIcon class="w-4 h-4 text-blue-600" />
                  <span class="text-sm text-blue-900">
                    You voted: <span class="font-semibold capitalize">{{ getMyHistoricalVote(vote) }}</span>
                  </span>
                </div>
              </div>

              <!-- Results Summary -->
              <div class="grid grid-cols-3 gap-4 mb-3">
                <div class="text-center">
                  <div class="text-lg font-bold text-green-600">{{ vote.results?.for || 0 }}</div>
                  <div class="text-xs text-gray-500">For</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-red-600">{{ vote.results?.against || 0 }}</div>
                  <div class="text-xs text-gray-500">Against</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-yellow-600">{{ vote.results?.abstain || 0 }}</div>
                  <div class="text-xs text-gray-500">Abstain</div>
                </div>
              </div>

              <!-- Result -->
              <div class="text-center">
                <span :class="[
                  'text-sm font-medium px-3 py-1 rounded-full inline-block',
                  vote.result === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                  {{ vote.result === 'passed' ? '✓ Motion Passed' : '✗ Motion Failed' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty History -->
          <div v-else class="text-center py-8">
            <ClockIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 class="text-sm font-medium text-gray-500 italic">No voting history recorded yet.</h4>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import CountryFlag from '@/components/shared/CountryFlag.vue'

// Icons
import {
  CheckCircleIcon, ClockIcon, XCircleIcon, MinusCircleIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isSubmitting = ref(false)
const activeVote = ref(null)
const votingHistory = ref([])
const committee = ref(null)

// Computed
const myVote = computed(() => {
  if (!activeVote.value?.votes || !authStore.user?.countryName) return null

  return activeVote.value.votes.find(v => v.country === authStore.user.countryName)
})

const canVote = computed(() => {
  if (!activeVote.value) return false
  if (myVote.value) return false // Already voted

  // For roll call, can only vote when it's your turn
  if (activeVote.value.votingType === 'rollCall') {
    const currentCountry = activeVote.value.rollCallOrder?.[activeVote.value.currentVoterIndex]
    return currentCountry === authStore.user?.countryName
  }

  // For other voting types, can vote anytime
  return true
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

    // Load voting data
    await loadVotingData()

  } catch (error) {
    console.error('Failed to load voting data:', error)
    toast.error('Failed to load voting data')
  } finally {
    isLoading.value = false
  }
}

const loadVotingData = async () => {
  try {
    const response = await apiMethods.voting.getByCommitteeId(committee.value._id)

    if (response.data.success) {
      const allVotes = response.data.votings || []

      // Find active vote
      activeVote.value = allVotes.find(v => v.status === 'active') || null

      // Get voting history
      votingHistory.value = allVotes
        .filter(v => ['completed', 'cancelled'].includes(v.status))
        .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt))
    }
  } catch (error) {
    console.error('Failed to load voting data:', error)
    toast.error('Failed to load voting data')
  }
}

const castVote = async (voteChoice) => {
  if (!activeVote.value || isSubmitting.value) return

  // Confirm vote
  const confirmMessage = `Are you sure you want to vote "${voteChoice.toUpperCase()}"? This action cannot be undone.`
  if (!confirm(confirmMessage)) return

  try {
    isSubmitting.value = true

    const response = await apiMethods.voting.castVote(activeVote.value._id, {
      vote: voteChoice
    })

    if (response.data.success) {
      // Update will come through WebSocket, but update locally too
      await loadVotingData()
      toast.success('Vote cast successfully!')
    }
  } catch (error) {
    console.error('Failed to cast vote:', error)
    const errorMsg = error.response?.data?.error || 'Failed to cast vote'
    toast.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

// Utility methods
const getTotalVotes = (vote) => {
  if (!vote?.results) return 0
  return (vote.results.for || 0) + (vote.results.against || 0) + (vote.results.abstain || 0)
}

const getVotingProgress = (vote) => {
  const totalVotes = getTotalVotes(vote)
  const eligibleVoters = vote.eligibleVoters?.length || 0
  return eligibleVoters > 0 ? (totalVotes / eligibleVoters) * 100 : 0
}

const getVoteTypeLabel = (type) => {
  const labels = {
    'simple': 'Simple Vote',
    'rollCall': 'Roll Call',
    'secretBallot': 'Secret Ballot'
  }
  return labels[type] || type
}

const getVoteTypeColor = (type) => {
  const colors = {
    'simple': 'bg-blue-100 text-blue-700',
    'rollCall': 'bg-purple-100 text-purple-700',
    'secretBallot': 'bg-green-100 text-green-700'
  }
  return colors[type] || 'bg-gray-100 text-gray-700'
}

const getCountryCode = (countryName) => {
  const country = committee.value?.countries?.find(c => c.name === countryName)
  return country?.code || ''
}

const getCountryVote = (countryName) => {
  if (!activeVote.value?.votes) return null
  const vote = activeVote.value.votes.find(v => v.country === countryName)
  return vote?.vote || null
}

const getVoteColorClass = (vote) => {
  const colors = {
    'for': 'text-green-600 font-semibold',
    'against': 'text-red-600 font-semibold',
    'abstain': 'text-yellow-600 font-semibold'
  }
  return colors[vote] || 'text-gray-600'
}

const formatVote = (vote) => {
  return vote.charAt(0).toUpperCase() + vote.slice(1)
}

const getMyHistoricalVote = (vote) => {
  if (!vote.votes || !authStore.user?.countryName) return null
  const myVote = vote.votes.find(v => v.country === authStore.user.countryName)
  return myVote?.vote || null
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// WebSocket listeners
const setupWebSocketListeners = () => {
  wsService.on('voting-started', (data) => {
    if (data.committeeId === committee.value?._id) {
      activeVote.value = data.voting
      toast.log('New vote started: ' + data.voting.title)
    }
  })

  wsService.on('vote-cast', (data) => {
    if (data.votingId === activeVote.value?._id) {
      // Update active vote with new results
      if (activeVote.value) {
        activeVote.value = { ...activeVote.value, ...data.voting }
      }
    }
  })

  wsService.on('voting-ended', (data) => {
    if (data.votingId === activeVote.value?._id) {
      toast.log('Vote ended: ' + data.voting.title)
      activeVote.value = null
      loadVotingData() // Refresh to get updated history
    }
  })

  wsService.on('current-voter-changed', (data) => {
    if (data.votingId === activeVote.value?._id) {
      // Update current voter index
      if (activeVote.value) {
        activeVote.value.currentVoterIndex = data.currentVoterIndex

        // Notify if it's user's turn
        if (data.currentCountry === authStore.user?.countryName) {
          toast.log("It's your turn to vote!")
        }
      }
    }
  })
}

// Lifecycle
onMounted(async () => {
  await loadData()
  setupWebSocketListeners()
})
</script>