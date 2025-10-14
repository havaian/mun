<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Voting Management</h1>
                <p class="text-mun-gray-600">Create and manage voting sessions</p>
            </div>
            <button @click="createNewVoting" class="btn-un-primary">
                <PlusIcon class="w-5 h-5 mr-2" />
                Create Voting
            </button>
        </div>

        <!-- Voting Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <HandRaisedIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Active Votings</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.active }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Completed</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.completed }}</p>
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
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.pending }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <UsersIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Eligible Voters</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.eligibleVoters }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Voting -->
        <div v-if="activeVoting" class="mun-card p-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-mun-gray-900">{{ activeVoting.title }}</h2>
                    <p class="text-mun-gray-600">{{ activeVoting.description }}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="px-3 py-1 bg-mun-green-100 text-mun-green-700 rounded-full text-sm font-medium">
                        Active
                    </span>
                    <button @click="endVoting(activeVoting)"
                        class="px-4 py-2 bg-mun-red-500 hover:bg-mun-red-600 text-white rounded-lg transition-colors">
                        End Voting
                    </button>
                </div>
            </div>

            <!-- Voting Progress -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="text-center">
                    <div class="text-3xl font-bold text-mun-green-500">{{ activeVoting.results.favour }}</div>
                    <div class="text-sm text-mun-gray-600">In Favour</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-mun-red-500">{{ activeVoting.results.against }}</div>
                    <div class="text-sm text-mun-gray-600">Against</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-mun-yellow-500">{{ activeVoting.results.abstain }}</div>
                    <div class="text-sm text-mun-gray-600">Abstentions</div>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-2 mb-6">
                <div class="flex justify-between text-sm text-mun-gray-600">
                    <span>Votes Cast: {{ activeVoting.results.total }} / {{ stats.eligibleVoters }}</span>
                    <span>{{ Math.round((activeVoting.results.total / stats.eligibleVoters) * 100) }}%
                        participation</span>
                </div>
                <div class="w-full bg-mun-gray-200 rounded-full h-2">
                    <div class="bg-mun-blue h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${(activeVoting.results.total / stats.eligibleVoters) * 100}%` }"></div>
                </div>
            </div>

            <!-- Real-time Voting Display -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-medium text-mun-gray-900 mb-3">Recent Votes</h3>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        <div v-for="vote in activeVoting.recentVotes" :key="vote.id"
                            class="flex items-center justify-between p-2 bg-mun-gray-50 rounded">
                            <span class="text-sm font-medium">{{ vote.country }}</span>
                            <span :class="[
                                'px-2 py-1 rounded text-xs font-medium',
                                vote.vote === 'favour' ? 'bg-mun-green-100 text-mun-green-700' :
                                    vote.vote === 'against' ? 'bg-mun-red-100 text-mun-red-700' :
                                        'bg-mun-yellow-100 text-mun-yellow-700'
                            ]">
                                {{ vote.vote === 'favour' ? 'For' : vote.vote === 'against' ? 'Against' : 'Abstain' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="font-medium text-mun-gray-900 mb-3">Not Yet Voted</h3>
                    <div class="space-y-1 max-h-48 overflow-y-auto">
                        <div v-for="country in activeVoting.notVoted" :key="country"
                            class="text-sm text-mun-gray-600 p-2 bg-mun-gray-50 rounded">
                            {{ country }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Voting History -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Voting History</h2>
                    <div class="flex items-center space-x-3">
                        <div class="flex items-center space-x-3">
                            <SleekSelect v-model="historyFilter" :options="[
                                { label: 'All Votings', value: '' },
                                { label: 'Resolutions', value: 'resolution' },
                                { label: 'Amendments', value: 'amendment' },
                                { label: 'Procedural', value: 'procedural' }
                            ]" containerClass="max-w-xs" placeholder="Filter by type" />
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else-if="filteredVotingHistory.length === 0" class="text-center py-12">
                <HandRaisedIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Voting History</h3>
                <p class="mt-2 text-mun-gray-600">No completed votings found</p>
            </div>

            <div v-else class="divide-y divide-mun-gray-200">
                <div v-for="voting in filteredVotingHistory" :key="voting.id"
                    class="p-6 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 class="text-lg font-medium text-mun-gray-900">{{ voting.title }}</h3>
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    voting.type === 'resolution' ? 'bg-purple-100 text-purple-700' :
                                        voting.type === 'amendment' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-700'
                                ]">
                                    {{ voting.type }}
                                </span>
                                <span :class="[
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    voting.result === 'passed' ? 'bg-mun-green-100 text-mun-green-700' :
                                        'bg-mun-red-100 text-mun-red-700'
                                ]">
                                    {{ voting.result }}
                                </span>
                            </div>

                            <p class="text-sm text-mun-gray-600 mb-3">{{ voting.description }}</p>

                            <div class="flex items-center space-x-6 text-sm">
                                <span class="text-mun-green-600">
                                    <strong>{{ voting.results.favour }}</strong> For
                                </span>
                                <span class="text-mun-red-600">
                                    <strong>{{ voting.results.against }}</strong> Against
                                </span>
                                <span class="text-mun-yellow-600">
                                    <strong>{{ voting.results.abstain }}</strong> Abstain
                                </span>
                                <span class="text-mun-gray-500">
                                    {{ formatDate(voting.completedAt) }}
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2 ml-4">
                            <button @click="viewVotingDetails(voting)" class="btn-un-secondary px-3 py-2">
                                <EyeIcon class="w-4 h-4 mr-1" />
                                Details
                            </button>
                            <button @click="exportVotingResults(voting)" class="btn-un-secondary px-3 py-2">
                                <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Voting Modal would go here -->
        <!-- VotingModal -->
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    PlusIcon,
    HandRaisedIcon,
    CheckCircleIcon,
    ClockIcon,
    UsersIcon,
    EyeIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const historyFilter = ref('')
const activeVoting = ref(null)
const votingHistory = ref([])

const stats = reactive({
    active: 0,
    completed: 0,
    pending: 0,
    eligibleVoters: 0
})

// Computed
const filteredVotingHistory = computed(() => {
    if (!historyFilter.value) return votingHistory.value
    return votingHistory.value.filter(v => v.type === historyFilter.value)
})

// Methods
const loadVotingData = async () => {
    try {
        isLoading.value = true

        // Sample active voting
        activeVoting.value = {
            id: 1,
            title: "Resolution A/1: Nuclear Disarmament",
            description: "Vote on the proposed nuclear disarmament framework",
            type: "resolution",
            status: "active",
            results: {
                favour: 12,
                against: 8,
                abstain: 5,
                total: 25
            },
            recentVotes: [
                { id: 1, country: "United States", vote: "favour" },
                { id: 2, country: "Russia", vote: "against" },
                { id: 3, country: "China", vote: "abstain" },
                { id: 4, country: "France", vote: "favour" }
            ],
            notVoted: ["Germany", "United Kingdom", "Japan", "Brazil", "India"]
        }

        // Sample voting history
        votingHistory.value = [
            {
                id: 2,
                title: "Amendment to Resolution A/1",
                description: "Proposed changes to paragraph 3 regarding timeline",
                type: "amendment",
                result: "failed",
                results: { favour: 15, against: 20, abstain: 8 },
                completedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 3,
                title: "Procedural Motion: Extension of Debate",
                description: "Motion to extend debate time by 30 minutes",
                type: "procedural",
                result: "passed",
                results: { favour: 28, against: 12, abstain: 3 },
                completedAt: new Date(Date.now() - 7200000).toISOString()
            }
        ]

        // Update stats
        stats.active = activeVoting.value ? 1 : 0
        stats.completed = votingHistory.value.length
        stats.pending = 2
        stats.eligibleVoters = 48

    } catch (error) {
        toast.error('Load voting data error:', error)
        toast.error('Failed to load voting data')
    } finally {
        isLoading.value = false
    }
}

const createNewVoting = () => {
    toast.log('Create voting modal would open here')
    // TODO: Open create voting modal
}

const endVoting = async (voting) => {
    try {
        // Move to history
        votingHistory.value.unshift({
            ...voting,
            result: voting.results.favour > voting.results.against ? 'passed' : 'failed',
            completedAt: new Date().toISOString()
        })

        activeVoting.value = null
        stats.active = 0
        stats.completed = votingHistory.value.length

        toast.success('Voting ended successfully')
    } catch (error) {
        toast.error('End voting error:', error)
        toast.error('Failed to end voting')
    }
}

const viewVotingDetails = (voting) => {
    toast.log(`Viewing details for ${voting.title}`)
    // TODO: Open voting details modal
}

const exportVotingResults = (voting) => {
    toast.success(`Exporting results for ${voting.title}`)
    // TODO: Export voting results
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