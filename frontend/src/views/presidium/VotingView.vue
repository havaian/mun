<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3 text-blue-600 mb-2">
            <HandRaisedIcon class="w-6 h-6" />
            <h1 class="text-2xl font-bold text-gray-900">Voting Chamber</h1>
          </div>
          <p class="text-gray-600">Manage motions, resolutions, and procedural votes.</p>
        </div>
        <div class="flex space-x-3">
          <button @click="showCreateVoteModal = true"
            class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon class="w-5 h-5 mr-2" />
            New Vote
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-6xl mx-auto space-y-8">

        <!-- Active Vote Section -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">


          <!-- Pending Vote -->
          <div v-if="pendingVote && !activeVote" class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span class="text-sm font-medium text-orange-600 uppercase">Pending Vote</span>
                  <span :class="[
                    'text-xs px-2 py-1 rounded-full',
                    getVoteTypeColor(pendingVote.votingType)
                  ]">
                    {{ getVoteTypeLabel(pendingVote.votingType) }}
                  </span>
                </div>
                <h3 class="text-xl font-bold text-gray-900">{{ pendingVote.title }}</h3>
                <p v-if="pendingVote.description" class="text-gray-600 mt-1">{{ pendingVote.description }}</p>
              </div>
              <button @click="startVote(pendingVote._id)"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Start Vote
              </button>
            </div>

            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div class="flex items-center">
                <ClockIcon class="w-5 h-5 text-orange-500 mr-3" />
                <div>
                  <div class="text-sm font-medium text-orange-800">Vote Ready to Start</div>
                  <div class="text-xs text-orange-600">Click "Start Vote" to begin the voting process</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Vote -->
          <div v-if="activeVote" class="space-y-6">
            <!-- Vote Header -->
            <div class="flex items-center justify-between">
              <div>
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
              <button @click="endVote(activeVote._id)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                End Vote
              </button>
            </div>

            <!-- Voting Progress -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- For Votes -->
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <div class="grid h-full justify-center items-center text-center">
                  <div class="text-2xl font-bold text-green-700">{{ activeVote.results?.for || 0 }}</div>
                  <div class="text-sm text-green-600 uppercase">For</div>
                </div>
              </div>

              <!-- Against Votes -->
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <div class="grid h-full justify-center items-center text-center">
                  <div class="text-2xl font-bold text-red-700">{{ activeVote.results?.against || 0 }}</div>
                  <div class="text-sm text-red-600 uppercase">Against</div>
                </div>
              </div>

              <!-- Abstentions -->
              <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div class="grid h-full justify-center items-center text-center">
                  <div class="text-2xl font-bold text-yellow-700">{{ activeVote.results?.abstain || 0 }}</div>
                  <div class="text-sm text-yellow-600 uppercase">Abstain</div>
                </div>
              </div>

              <!-- Total Progress -->
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div class="grid h-full justify-center items-center text-center">
                  <div class="text-2xl font-bold text-blue-700">{{ getTotalVotes(activeVote) }}</div>
                  <div class="text-sm text-blue-600 uppercase">Total Votes</div>
                  <div class="text-xs text-blue-500 mt-1">
                    {{ Math.round(getVotingProgress(activeVote)) }}% Complete
                  </div>
                </div>
              </div>
            </div>

            <!-- Voting Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{{ getTotalVotes(activeVote) }} / {{ activeVote.eligibleVoters?.length || 0 }} delegates</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  :style="{ width: `${getVotingProgress(activeVote)}%` }"></div>
              </div>
            </div>

            <!-- Roll Call Progress (if applicable) -->
            <div v-if="activeVote.votingType === 'rollCall' && activeVote.rollCallOrder"
              class="border-t border-gray-200 pt-6">
              <h4 class="font-semibold text-gray-900 mb-4">Roll Call Progress</h4>
              <div class="space-y-2">
                <div v-for="(country, index) in activeVote.rollCallOrder" :key="country" :class="[
                  'flex items-center justify-between p-3 rounded-lg border',
                  index === activeVote.currentVoterIndex ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                ]">
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium">{{ index + 1 }}.</span>
                    <img :src="getCountryFlag(country)" :alt="country"
                      class="w-6 h-4 rounded border border-gray-200 object-cover" />
                    <span class="font-medium">{{ country }}</span>
                    <span v-if="index === activeVote.currentVoterIndex"
                      class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      Current
                    </span>
                  </div>
                  <div class="text-sm">
                    <span v-if="getCountryVote(country)" :class="getVoteColor(getCountryVote(country))">
                      {{ getCountryVote(country) }}
                    </span>
                    <span v-else class="text-gray-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Limit (if applicable) -->
            <div v-if="activeVote.timeLimit" class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <ClockIcon class="w-5 h-5 text-gray-500" />
                  <span class="font-medium text-gray-700">Time Remaining</span>
                </div>
                <div class="text-lg font-mono font-bold text-gray-900">
                  {{ formatTimeRemaining(activeVote) }}
                </div>
              </div>
            </div>
          </div>

          <!-- No Active Vote -->
          <div v-else class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HandRaisedIcon class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Vote</h3>
            <p class="text-gray-600 mb-6">Wait for the Presidium to initiate a new voting session.</p>
            <button @click="showCreateVoteModal = true"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Start New Vote
            </button>
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
                <div>
                  <div class="flex items-center space-x-3">
                    <h4 class="font-semibold text-gray-900">{{ vote.title }}</h4>
                    <span :class="[
                      'text-xs px-2 py-1 rounded-full',
                      getVoteTypeColor(vote.votingType)
                    ]">
                      {{ getVoteTypeLabel(vote.votingType) }}
                    </span>
                    <span :class="[
                      'text-xs px-2 py-1 rounded-full',
                      getStatusColor(vote.status)
                    ]">
                      {{ vote.status }}
                    </span>
                  </div>
                  <p v-if="vote.description" class="text-sm text-gray-600 mt-1">{{ vote.description }}</p>
                </div>
                <div class="text-right text-sm text-gray-500">
                  {{ formatDate(vote.completedAt || vote.createdAt) }}
                </div>
              </div>

              <!-- Results Summary -->
              <div class="grid grid-cols-3 gap-4">
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
              <div class="mt-3 text-center">
                <span :class="[
                  'text-sm font-medium px-3 py-1 rounded-full',
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
            <h4 class="text-lg font-medium text-gray-900 mb-2">No voting history recorded yet.</h4>
            <p class="text-gray-600">Completed votes will appear here.</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Create Vote Modal (reuse QuickVoteModal) -->
    <QuickVoteModal v-model="showCreateVoteModal" :session="currentSession" @voting-created="handleVotingCreated" />

    <ForceCompleteModal v-model="showForceCompleteModal" :remaining-voters="forceCompleteData.remainingVoters || 0"
      :total-votes="forceCompleteData.totalVotes || 0" :eligible-voters="forceCompleteData.eligibleVoters || 0"
      @force-complete="handleForceComplete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import sessionApi from '@/utils/sessionApi'
import QuickVoteModal from '@/components/presidium/QuickVoteModal.vue'
import ForceCompleteModal from '@/components/presidium/ForceCompleteModal.vue'

// Icons
import {
  HandRaisedIcon, PlusIcon, ClockIcon,
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const activeVote = ref(null)
const votingHistory = ref([])
const currentSession = ref(null)
const committee = ref(null)
const showCreateVoteModal = ref(false)
const pendingVote = ref(null)
const showForceCompleteModal = ref(false)
const forceCompleteData = ref({})

// Methods
const loadData = async () => {
  try {
    isLoading.value = true

    // Get committee from auth context
    committee.value = authStore.user?.committeeId
    if (!committee.value) {
      throw new Error('No committee assigned')
    }

    // Load current session
    await loadCurrentSession()

    // Load voting data
    await loadVotingData()

  } catch (error) {
    console.error('Failed to load voting data:', error)
    toast.error('Failed to load voting data')
  } finally {
    isLoading.value = false
  }
}

const loadCurrentSession = async () => {
  try {
    const response = await sessionApi.sessions.getByCommittee(committee.value._id, {
      status: 'active',
      limit: 1
    })

    if (response.data.success && response.data.sessions?.length > 0) {
      currentSession.value = response.data.sessions[0]
    }
  } catch (error) {
    console.error('Failed to load current session:', error)
  }
}

const loadVotingData = async () => {
  try {
    const response = await apiMethods.voting.getByCommitteeId(committee.value._id)

    if (response.data.success) {
      const allVotes = response.data.votings || []

      // Separate pending, active, and completed votes
      pendingVote.value = allVotes.find(v => v.status === 'pending') || null
      activeVote.value = allVotes.find(v => v.status === 'active') || null
      votingHistory.value = allVotes
        .filter(v => ['completed', 'cancelled'].includes(v.status)) // Include cancelled votings
        .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt))
    }
  } catch (error) {
    console.error('Failed to load voting data:', error)
  }
}

const startVote = async (voteId) => {
  try {
    const response = await apiMethods.voting.startVoting(voteId)

    if (response.data.success) {
      await loadVotingData()
      toast.success('Vote started successfully')
    }
  } catch (error) {
    console.error('Failed to start vote:', error)
    toast.error('Failed to start vote')
  }
}

const endVote = async (voteId, forceComplete = false) => {
  if (!forceComplete && !confirm('Are you sure you want to end this vote?')) return

  try {
    const requestData = forceComplete ? { forceComplete: true } : {}
    const response = await apiMethods.voting.completeVoting(voteId, requestData)

    if (response.data.success) {
      await loadVotingData()
      toast.success('Vote ended successfully')
      showForceCompleteModal.value = false
    }
  } catch (error) {
    console.error('Failed to end vote:', error)

    // Check if it's the "not all voters voted" error
    if (error.response?.status === 400 && error.response?.data?.remainingVoters) {
      forceCompleteData.value = {
        voteId,
        remainingVoters: error.response.data.remainingVoters,
        totalVotes: getTotalVotes(activeVote.value),
        eligibleVoters: activeVote.value.eligibleVoters || 0
      }
      showForceCompleteModal.value = true
    } else {
      toast.error('Failed to end vote')
    }
  }
}

const handleVotingCreated = (voting) => {
  pendingVote.value = voting
  showCreateVoteModal.value = false
  toast.success('Vote created successfully - ready to start')
}

const handleForceComplete = async () => {
  await endVote(forceCompleteData.value.voteId, true)
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

const getStatusColor = (status) => {
  const colors = {
    'active': 'bg-green-100 text-green-700',
    'completed': 'bg-blue-100 text-blue-700',
    'cancelled': 'bg-red-100 text-red-700'
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

const getCountryFlag = (countryName) => {
  const country = committee.value?.countries?.find(c => c.name === countryName)
  return country?.flagUrl || '/api/countries/flags/default'
}

const getCountryVote = (countryName) => {
  if (!activeVote.value?.votes) return null
  const vote = activeVote.value.votes.find(v => v.country === countryName)
  return vote?.vote || null
}

const getVoteColor = (vote) => {
  const colors = {
    'for': 'text-green-600 font-medium',
    'against': 'text-red-600 font-medium',
    'abstain': 'text-yellow-600 font-medium'
  }
  return colors[vote] || 'text-gray-600'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const formatTimeRemaining = (vote) => {
  // This would need to calculate remaining time based on vote.timeLimit and createdAt
  // For now, just return a placeholder
  return '05:30'
}

// WebSocket listeners
const setupWebSocketListeners = () => {
  wsService.on('voting-created', (data) => {
    if (data.committeeId === committee.value?._id) {
      pendingVote.value = data.voting
    }
  })

  wsService.on('voting-started', (data) => {
    if (data.votingId === pendingVote.value?._id) {
      pendingVote.value = null
      activeVote.value = data.voting
    }
  })

  wsService.on('vote-cast', (data) => {
    if (data.votingId === activeVote.value?._id) {
      // Update voting results
      if (activeVote.value) {
        activeVote.value = { ...activeVote.value, ...data.voting }
      }
    }
  })

  wsService.on('voting-ended', (data) => {
    if (data.votingId === activeVote.value?._id) {
      activeVote.value = null
      loadVotingData() // Refresh to get updated history
    }
  })
}

// Lifecycle
onMounted(async () => {
  await loadData()
  setupWebSocketListeners()
})
</script>