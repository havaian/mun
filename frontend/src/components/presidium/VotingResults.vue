<!-- frontend/src/components/presidium/VotingResults.vue -->
<template>
    <div class="voting-results bg-white border border-mun-gray-200 rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
                <div :class="getResultIconBg()" class="p-2 rounded-lg">
                    <component :is="getResultIcon()" :class="getResultIconColor()" class="w-5 h-5" />
                </div>
                <div>
                    <h3 class="text-sm font-medium text-mun-gray-900">Voting Results</h3>
                    <p class="text-xs text-mun-gray-500">{{ voting.title }}</p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <!-- Export Button -->
                <button @click="exportResults" class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors"
                    title="Export results">
                    <DocumentArrowDownIcon class="w-4 h-4 text-mun-gray-600" />
                </button>

                <!-- Status Badge -->
                <span :class="getVotingStatusBadgeClass()" class="px-2 py-1 text-xs font-medium rounded-full">
                    {{ getVotingStatusText() }}
                </span>
            </div>
        </div>

        <!-- Overall Result Summary -->
        <div :class="getResultSummaryClass()" class="p-4 rounded-lg mb-4">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                    <component :is="getResultIcon()" :class="getResultIconColor()" class="w-6 h-6" />
                    <span class="text-lg font-semibold" :class="getResultTextColor()">
                        {{ getResultText() }}
                    </span>
                </div>

                <div class="text-right">
                    <p class="text-sm font-medium text-mun-gray-900">
                        {{ results.totalVotes }} / {{ results.eligibleVoters }} votes
                    </p>
                    <p class="text-xs text-mun-gray-500">
                        {{ getParticipationPercentage() }}% participation
                    </p>
                </div>
            </div>

            <!-- Vote Breakdown -->
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="vote-count-item">
                    <div class="flex items-center justify-center mb-1">
                        <div class="w-3 h-3 bg-mun-green-500 rounded-full mr-2"></div>
                        <span class="text-lg font-bold text-mun-green-700">{{ results.votesFor }}</span>
                    </div>
                    <p class="text-xs text-mun-gray-600">In Favour</p>
                </div>

                <div class="vote-count-item">
                    <div class="flex items-center justify-center mb-1">
                        <div class="w-3 h-3 bg-mun-red-500 rounded-full mr-2"></div>
                        <span class="text-lg font-bold text-mun-red-700">{{ results.votesAgainst }}</span>
                    </div>
                    <p class="text-xs text-mun-gray-600">Against</p>
                </div>

                <div class="vote-count-item">
                    <div class="flex items-center justify-center mb-1">
                        <div class="w-3 h-3 bg-mun-yellow-500 rounded-full mr-2"></div>
                        <span class="text-lg font-bold text-mun-yellow-700">{{ results.abstentions }}</span>
                    </div>
                    <p class="text-xs text-mun-gray-600">Abstentions</p>
                </div>
            </div>

            <!-- Majority Information -->
            <div class="mt-3 pt-3 border-t border-white/20">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-mun-gray-700">Required for passage:</span>
                    <span class="font-medium">{{ getMajorityRequiredText() }}</span>
                </div>
                <div v-if="voting.majorityType !== 'simple'" class="flex items-center justify-between text-sm mt-1">
                    <span class="text-mun-gray-700">Threshold:</span>
                    <span class="font-medium">{{ results.majorityThreshold }} votes</span>
                </div>
            </div>
        </div>

        <!-- Detailed Vote Breakdown (Roll Call) -->
        <div v-if="voting.votingType === 'rollCall' && detailedVotes.length > 0" class="mb-4">
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-medium text-mun-gray-900">Roll Call Results</h4>
                <button @click="showDetailedVotes = !showDetailedVotes"
                    class="text-xs text-mun-blue hover:text-mun-blue-600 flex items-center">
                    {{ showDetailedVotes ? 'Hide' : 'Show' }} Details
                    <ChevronDownIcon :class="{ 'transform rotate-180': showDetailedVotes }"
                        class="w-3 h-3 ml-1 transition-transform" />
                </button>
            </div>

            <div v-if="showDetailedVotes" class="detailed-votes-container max-h-64 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div v-for="vote in detailedVotes" :key="vote.country" :class="getVoteItemClass(vote.vote)"
                        class="vote-item flex items-center justify-between p-2 rounded border">
                        <div class="flex items-center space-x-2">
                            <CountryFlag :country="vote.country" size="xs" />
                            <span class="text-xs font-medium">{{ vote.country }}</span>
                            <span v-if="vote.isVeto" class="veto-badge">VETO</span>
                        </div>

                        <div class="flex items-center space-x-1">
                            <component :is="getVoteIcon(vote.vote)" :class="getVoteIconColor(vote.vote)"
                                class="w-3 h-3" />
                            <span :class="getVoteTextClass(vote.vote)" class="text-xs font-medium">
                                {{ getVoteDisplayText(vote.vote) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Non-voting countries -->
                <div v-if="nonVotingCountries.length > 0" class="mt-3 pt-3 border-t border-mun-gray-200">
                    <h5 class="text-xs font-medium text-mun-gray-700 mb-2">Did Not Vote</h5>
                    <div class="flex flex-wrap gap-1">
                        <span v-for="country in nonVotingCountries" :key="country"
                            class="inline-flex items-center px-2 py-1 bg-mun-gray-100 text-mun-gray-600 text-xs rounded">
                            <CountryFlag :country="country" size="xs" class="mr-1" />
                            {{ country }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Veto Information (Security Council) -->
        <div v-if="hasVetoes" class="veto-section mb-4 p-3 bg-mun-red-50 border border-mun-red-200 rounded-lg">
            <div class="flex items-center mb-2">
                <ShieldExclamationIcon class="w-4 h-4 text-mun-red-600 mr-2" />
                <span class="text-sm font-medium text-mun-red-800">Veto Cast</span>
            </div>
            <div class="space-y-1">
                <div v-for="veto in vetoes" :key="veto.country" class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <CountryFlag :country="veto.country" size="xs" />
                        <span class="text-sm font-medium text-mun-red-800">{{ veto.country }}</span>
                    </div>
                    <span class="text-xs text-mun-red-600">{{ formatTime(veto.timestamp) }}</span>
                </div>
            </div>
            <p class="text-xs text-mun-red-700 mt-2">
                Resolution fails due to Security Council veto, regardless of other votes.
            </p>
        </div>

        <!-- Voting Timeline -->
        <div v-if="voting.status === 'completed'" class="voting-timeline">
            <h4 class="text-sm font-medium text-mun-gray-900 mb-3">Voting Timeline</h4>
            <div class="timeline-container">
                <div class="timeline-item flex items-center space-x-3 text-xs text-mun-gray-600">
                    <ClockIcon class="w-3 h-3" />
                    <span>Started: {{ formatDateTime(voting.startedAt) }}</span>
                </div>

                <div v-if="voting.completedAt"
                    class="timeline-item flex items-center space-x-3 text-xs text-mun-gray-600 mt-1">
                    <CheckCircleIcon class="w-3 h-3" />
                    <span>Completed: {{ formatDateTime(voting.completedAt) }}</span>
                </div>

                <div class="timeline-item flex items-center space-x-3 text-xs text-mun-gray-600 mt-1">
                    <ClockIcon class="w-3 h-3" />
                    <span>Duration: {{ getVotingDuration() }}</span>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="voting.status === 'completed'"
            class="flex items-center justify-between pt-3 border-t border-mun-gray-200">
            <div class="flex items-center space-x-2">
                <button @click="shareResults"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded hover:bg-mun-blue/20 transition-colors">
                    <ShareIcon class="w-4 h-4 mr-1" />
                    Share Results
                </button>

                <button @click="generateReport"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-gray-700 bg-mun-gray-100 border border-mun-gray-200 rounded hover:bg-mun-gray-200 transition-colors">
                    <DocumentTextIcon class="w-4 h-4 mr-1" />
                    Generate Report
                </button>
            </div>

            <!-- Result actions for presidium -->
            <div v-if="canManageResults" class="flex items-center space-x-2">
                <button v-if="!voting.isArchived" @click="archiveVoting"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-mun-gray-700 bg-mun-gray-100 border border-mun-gray-200 rounded hover:bg-mun-gray-200 transition-colors">
                    <ArchiveBoxIcon class="w-4 h-4 mr-1" />
                    Archive
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ChevronDownIcon,
    DocumentArrowDownIcon,
    ShareIcon,
    DocumentTextIcon,
    ArchiveBoxIcon,
    ShieldExclamationIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    MinusIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    voting: {
        type: Object,
        required: true
    },
    results: {
        type: Object,
        required: true
    },
    detailedVotes: {
        type: Array,
        default: () => []
    },
    eligibleCountries: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['archive-voting', 'share-results', 'export-results'])

const authStore = useAuthStore()
const toast = useToast()

// State
const showDetailedVotes = ref(false)

// Computed
const canManageResults = computed(() => {
    return authStore.user?.role === 'presidium' || authStore.user?.role === 'admin'
})

const nonVotingCountries = computed(() => {
    const votedCountries = props.detailedVotes.map(vote => vote.country)
    return props.eligibleCountries
        .map(country => country.name || country)
        .filter(countryName => !votedCountries.includes(countryName))
})

const hasVetoes = computed(() => {
    return props.detailedVotes.some(vote => vote.isVeto)
})

const vetoes = computed(() => {
    return props.detailedVotes.filter(vote => vote.isVeto)
})

const getResultIcon = () => {
    return props.results.passed ? CheckCircleIcon : XCircleIcon
}

const getResultIconBg = () => {
    return props.results.passed ? 'bg-mun-green-100' : 'bg-mun-red-100'
}

const getResultIconColor = () => {
    return props.results.passed ? 'text-mun-green-700' : 'text-mun-red-700'
}

const getResultTextColor = () => {
    return props.results.passed ? 'text-mun-green-800' : 'text-mun-red-800'
}

const getResultSummaryClass = () => {
    return props.results.passed
        ? 'bg-mun-green-50 border border-mun-green-200'
        : 'bg-mun-red-50 border border-mun-red-200'
}

const getResultText = () => {
    if (hasVetoes.value) {
        return 'FAILED (VETO)'
    }
    return props.results.passed ? 'PASSED' : 'FAILED'
}

const getVotingStatusBadgeClass = () => {
    const classes = {
        active: 'bg-mun-yellow-100 text-mun-yellow-700',
        completed: 'bg-mun-green-100 text-mun-green-700',
        cancelled: 'bg-mun-red-100 text-mun-red-700'
    }
    return classes[props.voting.status] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getVotingStatusText = () => {
    const texts = {
        active: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
    }
    return texts[props.voting.status] || 'Unknown'
}

const getMajorityRequiredText = () => {
    const types = {
        simple: 'Simple Majority',
        qualified: 'Two-Thirds Majority',
        consensus: 'Consensus',
        unanimity: 'Unanimous Consent'
    }
    return types[props.voting.majorityRequired] || 'Majority'
}

const getParticipationPercentage = () => {
    if (props.results.eligibleVoters === 0) return 0
    return Math.round((props.results.totalVotes / props.results.eligibleVoters) * 100)
}

const getVoteItemClass = (vote) => {
    const classes = {
        for: 'bg-mun-green-50 border-mun-green-200',
        against: 'bg-mun-red-50 border-mun-red-200',
        abstain: 'bg-mun-yellow-50 border-mun-yellow-200'
    }
    return classes[vote] || 'bg-mun-gray-50 border-mun-gray-200'
}

const getVoteIcon = (vote) => {
    const icons = {
        for: HandThumbUpIcon,
        against: HandThumbDownIcon,
        abstain: MinusIcon
    }
    return icons[vote] || MinusIcon
}

const getVoteIconColor = (vote) => {
    const colors = {
        for: 'text-mun-green-600',
        against: 'text-mun-red-600',
        abstain: 'text-mun-yellow-600'
    }
    return colors[vote] || 'text-mun-gray-600'
}

const getVoteTextClass = (vote) => {
    const colors = {
        for: 'text-mun-green-700',
        against: 'text-mun-red-700',
        abstain: 'text-mun-yellow-700'
    }
    return colors[vote] || 'text-mun-gray-700'
}

const getVoteDisplayText = (vote) => {
    const texts = {
        for: 'For',
        against: 'Against',
        abstain: 'Abstain'
    }
    return texts[vote] || 'Unknown'
}

const getVotingDuration = () => {
    if (!props.voting.startedAt || !props.voting.completedAt) return 'Unknown'

    const start = new Date(props.voting.startedAt)
    const end = new Date(props.voting.completedAt)
    const diffMs = end - start

    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
}

// Methods
const formatTime = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Unknown time'
    }
}

const formatDateTime = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Unknown time'
    }
}

const exportResults = async () => {
    try {
        emit('export-results', props.voting)

        // Fallback to API call
        const response = await apiMethods.voting.exportResults(props.voting._id)

        // Create download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `voting-results-${props.voting._id}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)

        toast.success('Results exported successfully')

    } catch (error) {
        console.error('Export error:', error)
        toast.error('Failed to export results')
    }
}

const shareResults = () => {
    emit('share-results', {
        voting: props.voting,
        results: props.results
    })
}

const generateReport = async () => {
    try {
        const response = await apiMethods.voting.generateReport(props.voting._id)

        if (response.data.success) {
            toast.success('Report generated successfully')
            // Handle report display or download
        }

    } catch (error) {
        console.error('Generate report error:', error)
        toast.error('Failed to generate report')
    }
}

const archiveVoting = async () => {
    try {
        await apiMethods.voting.archive(props.voting._id)
        emit('archive-voting', props.voting)
        toast.success('Voting archived successfully')

    } catch (error) {
        console.error('Archive error:', error)
        toast.error('Failed to archive voting')
    }
}
</script>

<style scoped>
.vote-count-item {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.detailed-votes-container {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.75rem;
    background: #fafafa;
}

.vote-item {
    transition: all 0.2s ease;
}

.vote-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.veto-badge {
    @apply inline-flex items-center px-1.5 py-0.5 text-xs font-bold text-white bg-mun-red-600 rounded transform rotate-12;
}

.timeline-container {
    border-left: 2px solid #e5e7eb;
    padding-left: 1rem;
}

.timeline-item {
    position: relative;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: -1.375rem;
    top: 0.125rem;
    width: 0.5rem;
    height: 0.5rem;
    background: #009edb;
    border-radius: 50%;
}

/* Custom scrollbar */
.detailed-votes-container::-webkit-scrollbar {
    width: 4px;
}

.detailed-votes-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.detailed-votes-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.detailed-votes-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .grid.md\\:grid-cols-2.lg\\:grid-cols-3 {
        grid-template-columns: 1fr;
    }

    .grid.grid-cols-3 {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .flex.items-center.justify-between {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }
}
</style>