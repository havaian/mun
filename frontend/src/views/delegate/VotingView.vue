<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Voting</h1>
                <p class="text-mun-gray-600">Cast your votes and view voting results</p>
            </div>
            <div class="text-sm text-mun-gray-500">
                Representing: {{ userCountry?.name || 'Your Country' }}
            </div>
        </div>

        <!-- Voting Status -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <HandRaisedIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Votes Cast</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.votesCast }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Pending</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pendingVotes }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Voting Rights</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.hasVotingRights ? 'Yes' : 'No' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Voting -->
        <div v-if="activeVoting" class="mun-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-semibold text-mun-gray-900">{{ activeVoting.title }}</h2>
                    <p class="text-mun-gray-600">{{ activeVoting.description }}</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 bg-mun-green-100 text-mun-green-700 rounded-full text-sm font-medium">
                        Voting Active
                    </span>
                    <p class="text-sm text-mun-gray-500 mt-1">
                        {{ activeVoting.timeRemaining }} remaining
                    </p>
                </div>
            </div>

            <!-- Voting Options -->
            <div v-if="!activeVoting.hasVoted" class="space-y-4">
                <h3 class="font-medium text-mun-gray-900">Cast Your Vote:</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button @click="castVote('favour')" :disabled="isVoting"
                        class="p-6 border-2 border-mun-green-200 rounded-lg hover:bg-mun-green-50 hover:border-mun-green-300 transition-colors text-center">
                        <CheckCircleIcon class="w-8 h-8 text-mun-green-500 mx-auto mb-2" />
                        <div class="font-medium text-mun-green-700">In Favour</div>
                        <div class="text-sm text-mun-gray-600">Support the proposal</div>
                    </button>

                    <button @click="castVote('against')" :disabled="isVoting"
                        class="p-6 border-2 border-mun-red-200 rounded-lg hover:bg-mun-red-50 hover:border-mun-red-300 transition-colors text-center">
                        <XCircleIcon class="w-8 h-8 text-mun-red-500 mx-auto mb-2" />
                        <div class="font-medium text-mun-red-700">Against</div>
                        <div class="text-sm text-mun-gray-600">Oppose the proposal</div>
                    </button>

                    <button @click="castVote('abstain')" :disabled="isVoting"
                        class="p-6 border-2 border-mun-yellow-200 rounded-lg hover:bg-mun-yellow-50 hover:border-mun-yellow-300 transition-colors text-center">
                        <MinusCircleIcon class="w-8 h-8 text-mun-yellow-500 mx-auto mb-2" />
                        <div class="font-medium text-mun-yellow-700">Abstain</div>
                        <div class="text-sm text-mun-gray-600">No position taken</div>
                    </button>
                </div>

                <div class="mt-6 p-4 bg-mun-blue-50 rounded-lg">
                    <h4 class="font-medium text-mun-gray-900 mb-2">Voting Information:</h4>
                    <ul class="text-sm text-mun-gray-600 space-y-1">
                        <li>• Votes are final and cannot be changed once cast</li>
                        <li>• Only countries with full membership can vote</li>
                        <li>• Observers may participate in discussion but cannot vote</li>
                    </ul>
                </div>
            </div>

            <!-- Already Voted -->
            <div v-else class="text-center py-8">
                <CheckCircleIcon class="mx-auto h-12 w-12 text-mun-green-500" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">Vote Submitted</h3>
                <p class="mt-2 text-mun-gray-600">Your vote has been recorded successfully</p>
                <div class="mt-4 inline-flex items-center px-4 py-2 bg-mun-green-100 text-mun-green-700 rounded-lg">
                    <span class="font-medium">You voted: {{ formatVoteChoice(activeVoting.userVote) }}</span>
                </div>
            </div>

            <!-- Live Results (if enabled) -->
            <div v-if="activeVoting.showLiveResults" class="mt-8 pt-6 border-t border-mun-gray-200">
                <h3 class="font-medium text-mun-gray-900 mb-4">Current Results:</h3>
                <div class="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div class="text-2xl font-bold text-mun-green-500">{{ activeVoting.results.favour }}</div>
                        <div class="text-sm text-mun-gray-600">In Favour</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-mun-red-500">{{ activeVoting.results.against }}</div>
                        <div class="text-sm text-mun-gray-600">Against</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-mun-yellow-500">{{ activeVoting.results.abstain }}</div>
                        <div class="text-sm text-mun-gray-600">Abstentions</div>
                    </div>
                </div>

                <div class="mt-4 text-center text-sm text-mun-gray-500">
                    {{ activeVoting.results.total }} of {{ activeVoting.results.eligible }} votes cast
                </div>
            </div>
        </div>

        <!-- No Active Voting -->
        <div v-else class="mun-card p-6">
            <div class="text-center py-8">
                <HandRaisedIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Active Voting</h3>
                <p class="mt-2 text-mun-gray-600">There are currently no active voting sessions</p>
            </div>
        </div>

        <!-- Voting History -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Voting History</h2>
                    <div class="flex items-center space-x-3">
                        <select v-model="historyFilter" class="input-field max-w-xs">
                            <option value="">All Votes</option>
                            <option value="resolution">Resolutions</option>
                            <option value="amendment">Amendments</option>
                            <option value="procedural">Procedural</option>
                        </select>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else-if="filteredVotingHistory.length === 0" class="text-center py-12">
                <DocumentTextIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Voting History</h3>
                <p class="mt-2 text-mun-gray-600">You haven't participated in any votes yet</p>
            </div>

            <div v-else class="divide-y divide-mun-gray-200">
                <div v-for="vote in filteredVotingHistory" :key="vote.id"
                    class="p-6 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 class="text-lg font-medium text-mun-gray-900">{{ vote.title }}</h3>
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    vote.type === 'resolution' ? 'bg-purple-100 text-purple-700' :
                                        vote.type === 'amendment' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-700'
                                ]">
                                    {{ vote.type }}
                                </span>
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    vote.result === 'passed' ? 'bg-mun-green-100 text-mun-green-700' :
                                        'bg-mun-red-100 text-mun-red-700'
                                ]">
                                    {{ vote.result }}
                                </span>
                            </div>

                            <p class="text-sm text-mun-gray-600 mb-3">{{ vote.description }}</p>

                            <div class="flex items-center space-x-6 text-sm">
                                <span class="text-mun-gray-700">
                                    <strong>Your vote:</strong>
                                    <span :class="[
                                        'ml-1',
                                        vote.userVote === 'favour' ? 'text-mun-green-600' :
                                            vote.userVote === 'against' ? 'text-mun-red-600' :
                                                'text-mun-yellow-600'
                                    ]">
                                        {{ formatVoteChoice(vote.userVote) }}
                                    </span>
                                </span>
                                <span class="text-mun-gray-500">
                                    {{ formatDate(vote.completedAt) }}
                                </span>
                            </div>

                            <div class="flex items-center space-x-6 text-sm text-mun-gray-500 mt-2">
                                <span><strong>{{ vote.results.favour }}</strong> For</span>
                                <span><strong>{{ vote.results.against }}</strong> Against</span>
                                <span><strong>{{ vote.results.abstain }}</strong> Abstain</span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2 ml-4">
                            <button @click="viewVoteDetails(vote)" class="btn-un-secondary px-3 py-2">
                                <EyeIcon class="w-4 h-4 mr-1" />
                                Details
                            </button>
                        </div>
                    </div>
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
    HandRaisedIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    MinusCircleIcon,
    DocumentTextIcon,
    EyeIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isVoting = ref(false)
const historyFilter = ref('')
const userCountry = ref(null)
const activeVoting = ref(null)
const votingHistory = ref([])

const stats = reactive({
    votesCast: 0,
    pendingVotes: 0,
    hasVotingRights: true
})

// Computed
const filteredVotingHistory = computed(() => {
    if (!historyFilter.value) return votingHistory.value
    return votingHistory.value.filter(vote => vote.type === historyFilter.value)
})

// Methods
const loadVotingData = async () => {
    try {
        isLoading.value = true

        // Load user country
        userCountry.value = {
            name: authStore.user?.countryName || "United States"
        }

        // Sample active voting
        activeVoting.value = {
            id: 1,
            title: "Resolution A/1: Nuclear Disarmament Framework",
            description: "Comprehensive framework for global nuclear disarmament and non-proliferation measures",
            type: "resolution",
            timeRemaining: "15:30",
            hasVoted: false,
            userVote: null,
            showLiveResults: true,
            results: {
                favour: 15,
                against: 8,
                abstain: 4,
                total: 27,
                eligible: 48
            }
        }

        // Sample voting history
        votingHistory.value = [
            {
                id: 2,
                title: "Amendment to Resolution A/1",
                description: "Proposed changes to timeline implementation in paragraph 3",
                type: "amendment",
                result: "failed",
                userVote: "against",
                results: { favour: 18, against: 25, abstain: 5 },
                completedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 3,
                title: "Procedural Motion: Extension of Debate",
                description: "Motion to extend current debate session by 30 minutes",
                type: "procedural",
                result: "passed",
                userVote: "favour",
                results: { favour: 32, against: 12, abstain: 4 },
                completedAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: 4,
                title: "Resolution B/2: Climate Action Protocol",
                description: "International protocol for climate change mitigation",
                type: "resolution",
                result: "passed",
                userVote: "favour",
                results: { favour: 38, against: 7, abstain: 3 },
                completedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ]

        // Update stats
        stats.votesCast = votingHistory.value.length
        stats.pendingVotes = activeVoting.value ? 1 : 0
        stats.hasVotingRights = true

    } catch (error) {
        toast.error('Load voting data error:', error)
        toast.error('Failed to load voting data')
    } finally {
        isLoading.value = false
    }
}

const castVote = async (voteChoice) => {
    try {
        isVoting.value = true

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Update active voting
        activeVoting.value.hasVoted = true
        activeVoting.value.userVote = voteChoice

        // Update results
        if (voteChoice === 'favour') {
            activeVoting.value.results.favour++
        } else if (voteChoice === 'against') {
            activeVoting.value.results.against++
        } else {
            activeVoting.value.results.abstain++
        }
        activeVoting.value.results.total++

        stats.votesCast++
        stats.pendingVotes--

        toast.success(`Vote cast successfully: ${formatVoteChoice(voteChoice)}`)

    } catch (error) {
        toast.error('Cast vote error:', error)
        toast.error('Failed to cast vote')
    } finally {
        isVoting.value = false
    }
}

const viewVoteDetails = (vote) => {
    toast.log(`Viewing details for ${vote.title}`)
    // TODO: Open vote details modal
}

const formatVoteChoice = (choice) => {
    const choiceMap = {
        'favour': 'In Favour',
        'against': 'Against',
        'abstain': 'Abstention'
    }
    return choiceMap[choice] || choice
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
        return `${diffMins}m ago`
    } else if (diffHours < 24) {
        return `${diffHours}h ago`
    } else if (diffDays < 7) {
        return `${diffDays}d ago`
    } else {
        return date.toLocaleDateString()
    }
}

// Lifecycle
onMounted(() => {
    loadVotingData()
})
</script>