<!-- frontend/src/components/presidium/VotingModal.vue -->
<template>
    <Teleport to="body">
        <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal" />

                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative w-full max-w-6xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
                        @click.stop>

                        <!-- Header -->
                        <div class="bg-gradient-to-r from-mun-blue to-mun-blue-600 px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-xl font-bold text-white">
                                        {{ currentView === 'create' ? 'Create New Voting' : 'Voting Management' }}
                                    </h3>
                                    <p class="text-mun-blue-100 text-sm mt-1">
                                        {{ currentView === 'create' ? 'Set up a new voting session' : 'Manage active voting and view results' }}
                                    </p>
                                </div>

                                <div class="flex items-center space-x-4">
                                    <div v-if="activeVoting && currentView === 'manage'" class="voting-status">
                                        <div
                                            class="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                                            <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                            <span class="text-white text-sm font-medium">Voting Active</span>
                                        </div>
                                    </div>

                                    <button @click="closeModal"
                                        class="text-white hover:text-mun-blue-200 transition-colors">
                                        <XMarkIcon class="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Navigation -->
                        <div class="border-b border-mun-gray-200">
                            <nav class="flex space-x-8 px-6">
                                <button @click="currentView = 'create'"
                                    :class="currentView === 'create' ? 'border-mun-blue text-mun-blue' : 'border-transparent text-mun-gray-500 hover:text-mun-gray-700'"
                                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
                                    <PlusIcon class="w-5 h-5 inline mr-2" />
                                    Create Voting
                                </button>

                                <button @click="currentView = 'manage'"
                                    :class="currentView === 'manage' ? 'border-mun-blue text-mun-blue' : 'border-transparent text-mun-gray-500 hover:text-mun-gray-700'"
                                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
                                    <ChartBarIcon class="w-5 h-5 inline mr-2" />
                                    Manage Voting
                                    <span v-if="activeVoting"
                                        class="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                        Active
                                    </span>
                                </button>

                                <button @click="currentView = 'history'"
                                    :class="currentView === 'history' ? 'border-mun-blue text-mun-blue' : 'border-transparent text-mun-gray-500 hover:text-mun-gray-700'"
                                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
                                    <ClockIcon class="w-5 h-5 inline mr-2" />
                                    History
                                </button>
                            </nav>
                        </div>

                        <!-- Content -->
                        <div class="p-6">

                            <!-- Create Voting View -->
                            <div v-if="currentView === 'create'" class="create-voting-view">
                                <div class="max-w-4xl mx-auto">
                                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                        <!-- Left: Basic Settings -->
                                        <div class="space-y-6">
                                            <div>
                                                <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">Basic
                                                    Information</h4>

                                                <div class="space-y-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-2">Voting
                                                            Subject *</label>
                                                        <input v-model="votingForm.subject" type="text" required
                                                            class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue"
                                                            placeholder="e.g., Resolution A/77/1 on Climate Change" />
                                                    </div>

                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-2">Description</label>
                                                        <textarea v-model="votingForm.description" rows="4"
                                                            class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue"
                                                            placeholder="Optional description..." />
                                                    </div>

                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-2">Voting
                                                            Type *</label>
                                                        <div class="space-y-2">
                                                            <label v-for="type in votingTypes" :key="type.value"
                                                                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-mun-gray-50"
                                                                :class="votingForm.votingType === type.value ? 'border-mun-blue bg-mun-blue-50' : 'border-mun-gray-300'">
                                                                <input v-model="votingForm.votingType" type="radio"
                                                                    :value="type.value" class="sr-only" />
                                                                <component :is="type.icon"
                                                                    class="w-5 h-5 mr-3 text-mun-blue" />
                                                                <div>
                                                                    <div class="font-medium text-sm">{{ type.name }}
                                                                    </div>
                                                                    <div class="text-xs text-mun-gray-500">{{
                                                                        type.description }}</div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-2">Majority
                                                            Required *</label>
                                                        <select v-model="votingForm.majorityType"
                                                            class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue">
                                                            <option value="simple">Simple Majority (50% + 1)</option>
                                                            <option value="two-thirds">Two-Thirds Majority</option>
                                                            <option value="consensus">Consensus Required</option>
                                                            <option value="unanimity">Unanimous Consent</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Right: Options & Participants -->
                                        <div class="space-y-6">
                                            <div>
                                                <h4 class="text-lg font-semibold text-mun-gray-900 mb-4">Settings &
                                                    Participants</h4>

                                                <div class="space-y-4">
                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-3">Time
                                                            Limit</label>
                                                        <div class="flex items-center space-x-3">
                                                            <input v-model="votingForm.hasTimeLimit" type="checkbox"
                                                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                            <span class="text-sm">Set time limit</span>
                                                            <input v-if="votingForm.hasTimeLimit"
                                                                v-model.number="votingForm.timeLimit" type="number"
                                                                min="1" max="120"
                                                                class="w-20 px-2 py-1 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mun-blue" />
                                                            <span v-if="votingForm.hasTimeLimit"
                                                                class="text-sm text-mun-gray-500">minutes</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-3">Voting
                                                            Options</label>
                                                        <div class="space-y-2">
                                                            <label class="flex items-center">
                                                                <input v-model="votingForm.allowAbstention"
                                                                    type="checkbox"
                                                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                                <span class="ml-3 text-sm">Allow Abstentions</span>
                                                            </label>
                                                            <label class="flex items-center">
                                                                <input v-model="votingForm.allowLatecomer"
                                                                    type="checkbox"
                                                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                                <span class="ml-3 text-sm">Allow Late Votes</span>
                                                            </label>
                                                            <label class="flex items-center">
                                                                <input v-model="votingForm.showResults" type="checkbox"
                                                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                                <span class="ml-3 text-sm">Show Real-time Results</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label
                                                            class="block text-sm font-medium text-mun-gray-700 mb-3">Eligible
                                                            Voters</label>
                                                        <div
                                                            class="border border-mun-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                                            <div class="space-y-2">
                                                                <label class="flex items-center font-medium">
                                                                    <input v-model="selectAllVoters" type="checkbox"
                                                                        @change="toggleAllVoters"
                                                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                                    <span class="ml-3 text-sm">Select All
                                                                        Countries</span>
                                                                </label>

                                                                <hr class="my-3" />

                                                                <div v-for="country in eligibleCountries"
                                                                    :key="country.email" class="flex items-center">
                                                                    <input v-model="votingForm.eligibleVoters"
                                                                        type="checkbox" :value="country.email"
                                                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                                    <CountryFlag :country-name="country.countryName"
                                                                        :country-code="country.countryCode" size="tiny"
                                                                        class="ml-3" />
                                                                    <span class="ml-2 text-sm">{{ country.countryName
                                                                    }}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p class="text-xs text-mun-gray-500 mt-2">
                                                            {{ votingForm.eligibleVoters.length }} of {{
                                                                eligibleCountries.length }} countries selected
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Manage Voting View -->
                            <div v-else-if="currentView === 'manage'" class="manage-voting-view">
                                <div v-if="activeVoting" class="space-y-6">

                                    <!-- Voting Info Header -->
                                    <div class="bg-mun-blue-50 border border-mun-blue-200 rounded-lg p-6">
                                        <div class="flex items-start justify-between">
                                            <div>
                                                <h4 class="text-xl font-bold text-mun-blue-900">{{ activeVoting.subject
                                                }}</h4>
                                                <p class="text-mun-blue-700 mt-1">{{ activeVoting.description }}</p>
                                                <div class="flex items-center space-x-4 mt-3 text-sm text-mun-blue-600">
                                                    <span class="flex items-center">
                                                        <component :is="getVotingTypeIcon()" class="w-4 h-4 mr-1" />
                                                        {{ getVotingTypeDisplay() }}
                                                    </span>
                                                    <span>{{ getMajorityDisplay() }}</span>
                                                    <span v-if="activeVoting.timeLimit">{{ activeVoting.timeLimit }}min
                                                        limit</span>
                                                </div>
                                            </div>

                                            <div class="text-right">
                                                <div class="text-3xl font-bold text-mun-blue-900">{{ progressPercentage
                                                }}%</div>
                                                <div class="text-sm text-mun-blue-700">{{ votesReceived }}/{{ totalVoters
                                                }} votes</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Voting Controls -->
                                    <div
                                        class="flex items-center justify-between bg-white border border-mun-gray-200 rounded-lg p-4">
                                        <div class="flex items-center space-x-4">
                                            <!-- Timer if applicable -->
                                            <div v-if="votingTimer" class="voting-timer">
                                                <TimerDisplay :remaining-time="votingTimer.remainingTime"
                                                    :total-time="votingTimer.duration"
                                                    :is-running="votingTimer.isRunning"
                                                    :is-paused="votingTimer.isPaused" size="small" variant="voting"
                                                    :show-header="false" :show-controls="false" />
                                            </div>

                                            <!-- Roll call info -->
                                            <div v-if="isRollCall && currentVoter" class="current-voter-info">
                                                <span class="text-sm text-mun-gray-600">Current voter:</span>
                                                <span class="ml-2 font-medium text-mun-blue">{{ currentVoterCountry
                                                }}</span>
                                            </div>
                                        </div>

                                        <div class="flex items-center space-x-3">
                                            <button v-if="isRollCall && currentVoter" @click="nextRollCallVoter"
                                                :disabled="isUpdating"
                                                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-mun-blue-700 bg-mun-blue-100 hover:bg-mun-blue-200 focus:outline-none focus:ring-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                                <ChevronRightIcon class="w-4 h-4 mr-1" />
                                                Next Voter
                                            </button>

                                            <button @click="pauseVoting" :disabled="isUpdating"
                                                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors disabled:opacity-50">
                                                <PauseIcon class="w-4 h-4 mr-1" />
                                                Pause
                                            </button>

                                            <button @click="endVoting" :disabled="isUpdating"
                                                class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50">
                                                <StopIcon class="w-4 h-4 mr-1" />
                                                End Voting
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Voting Board -->
                                    <div class="voting-board-wrapper">
                                        <VotingBoard :voting="activeVoting" :countries="eligibleVotersWithVotes"
                                            :votes="currentVotes" size="large" layout="grid" sort-by="vote-status"
                                            :show-footer="false" :interactive="false" :highlight-current="isRollCall"
                                            :current-voter="currentVoter" :real-time-updates="true" />
                                    </div>

                                </div>

                                <!-- No Active Voting -->
                                <div v-else class="no-active-voting text-center py-16">
                                    <ChartBarIcon class="w-20 h-20 text-mun-gray-300 mx-auto mb-6" />
                                    <h4 class="text-xl font-semibold text-mun-gray-900 mb-2">No Active Voting</h4>
                                    <p class="text-mun-gray-500 mb-8 max-w-md mx-auto">
                                        There is currently no voting session in progress. Create a new voting to get
                                        started.
                                    </p>

                                    <button @click="currentView = 'create'"
                                        class="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-white bg-mun-blue hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                        <PlusIcon class="w-5 h-5 mr-2" />
                                        Create New Voting
                                    </button>
                                </div>
                            </div>

                            <!-- History View -->
                            <div v-else-if="currentView === 'history'" class="history-view">
                                <div class="space-y-4">
                                    <h4 class="text-lg font-semibold text-mun-gray-900">Voting History</h4>

                                    <div v-if="votingHistory.length > 0" class="space-y-3">
                                        <div v-for="voting in votingHistory" :key="voting._id"
                                            class="bg-white border border-mun-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div class="flex items-start justify-between">
                                                <div>
                                                    <h5 class="font-medium text-mun-gray-900">{{ voting.subject }}</h5>
                                                    <p class="text-sm text-mun-gray-500 mt-1">{{ voting.description }}
                                                    </p>
                                                    <div
                                                        class="flex items-center space-x-4 mt-2 text-xs text-mun-gray-400">
                                                        <span>{{ formatDate(voting.completedAt) }}</span>
                                                        <span>{{ getVotingTypeDisplayFromType(voting.votingType)
                                                        }}</span>
                                                        <span>{{ voting.votes?.length || 0 }} votes</span>
                                                    </div>
                                                </div>

                                                <div class="text-right">
                                                    <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                                        :class="voting.results?.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                                        {{ voting.results?.passed ? 'PASSED' : 'FAILED' }}
                                                    </div>
                                                    <div class="text-xs text-mun-gray-500 mt-1">
                                                        {{ voting.results?.favour || 0 }} for, {{
                                                            voting.results?.against || 0 }} against
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="text-center py-12">
                                        <ClockIcon class="w-16 h-16 text-mun-gray-300 mx-auto mb-4" />
                                        <p class="text-mun-gray-500">No voting history available</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Footer -->
                        <div class="bg-mun-gray-50 px-6 py-4 border-t border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <div class="text-sm text-mun-gray-600">
                                    <span v-if="currentView === 'create'">{{ votingForm.eligibleVoters.length }} voters
                                        selected</span>
                                    <span v-else-if="currentView === 'manage' && activeVoting">{{ totalVoters }}
                                        eligible voters • {{ votesReceived }} votes received</span>
                                    <span v-else-if="currentView === 'history'">{{ votingHistory.length }} voting
                                        sessions</span>
                                </div>

                                <div class="flex items-center space-x-3">
                                    <button @click="closeModal"
                                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                        Close
                                    </button>

                                    <button v-if="currentView === 'create'" @click="createVoting"
                                        :disabled="isUpdating || !canCreateVoting"
                                        class="px-4 py-2 text-sm font-medium text-white bg-mun-blue border border-transparent rounded-md hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                        {{ isUpdating ? 'Creating...' : 'Start Voting' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
    XMarkIcon,
    PlusIcon,
    ChartBarIcon,
    ClockIcon,
    ChevronRightIcon,
    PauseIcon,
    StopIcon,
    CheckCircleIcon,
    UserGroupIcon,
    EyeSlashIcon,
    ShieldCheckIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import TimerDisplay from '@/components/shared/TimerDisplay.vue'
import VotingBoard from '@/components/shared/VotingBoard.vue'
import { useVotingStore } from '@/stores/voting'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    sessionId: { type: String, required: true },
    countries: { type: Array, required: true },
    votingTimer: { type: Object, default: null }
})

// Emits
const emit = defineEmits(['update:modelValue', 'voting-created', 'voting-ended'])

const votingStore = useVotingStore()
const sessionStore = useSessionStore()
const toast = useToast()

// State
const isUpdating = ref(false)
const currentView = ref('create')
const selectAllVoters = ref(true)

// Voting form
const votingForm = reactive({
    subject: '',
    description: '',
    votingType: 'simple',
    majorityType: 'simple',
    hasTimeLimit: false,
    timeLimit: 5,
    allowAbstention: true,
    allowLatecomer: false,
    showResults: true,
    eligibleVoters: []
})

// Voting types configuration
const votingTypes = [
    { value: 'simple', name: 'Simple Vote', description: 'Standard voting procedure', icon: CheckCircleIcon },
    { value: 'roll-call', name: 'Roll Call Vote', description: 'Countries called alphabetically', icon: UserGroupIcon },
    { value: 'secret', name: 'Secret Ballot', description: 'Anonymous voting', icon: EyeSlashIcon },
    { value: 'veto-enabled', name: 'Security Council', description: 'With veto powers', icon: ShieldCheckIcon }
]

// Computed
const activeVoting = computed(() => votingStore.activeVoting)
const currentVotes = computed(() => votingStore.votes)
const currentVoter = computed(() => votingStore.currentVoter)
const votingHistory = computed(() => votingStore.votingHistory)

const eligibleCountries = computed(() => props.countries.filter(c => c.specialRole !== 'observer'))

const eligibleVotersWithVotes = computed(() => {
    return eligibleCountries.value.map(country => {
        const vote = currentVotes.value.find(v => v.voterEmail === country.email)
        return {
            ...country,
            vote: vote?.choice || null,
            isEligible: (activeVoting.value?.eligibleVoters || []).includes(country.email)
        }
    })
})

const isRollCall = computed(() => activeVoting.value?.votingType === 'roll-call')
const totalVoters = computed(() => activeVoting.value?.eligibleVoters?.length || 0)
const votesReceived = computed(() => currentVotes.value.length)
const progressPercentage = computed(() => totalVoters.value === 0 ? 0 : Math.round((votesReceived.value / totalVoters.value) * 100))
const currentVoterCountry = computed(() => {
    if (!currentVoter.value) return null
    const country = props.countries.find(c => c.email === currentVoter.value)
    return country?.countryName || null
})

const canCreateVoting = computed(() => {
    return votingForm.subject.trim() && votingForm.votingType && votingForm.majorityType && votingForm.eligibleVoters.length > 0
})

// Methods
const closeModal = () => emit('update:modelValue', false)

const toggleAllVoters = () => {
    if (selectAllVoters.value) {
        votingForm.eligibleVoters = eligibleCountries.value.map(c => c.email)
    } else {
        votingForm.eligibleVoters = []
    }
}

const createVoting = async () => {
    try {
        isUpdating.value = true

        const votingData = {
            sessionId: props.sessionId,
            subject: votingForm.subject.trim(),
            description: votingForm.description.trim(),
            votingType: votingForm.votingType,
            majorityType: votingForm.majorityType,
            timeLimit: votingForm.hasTimeLimit ? votingForm.timeLimit : null,
            allowAbstention: votingForm.allowAbstention,
            allowLatecomer: votingForm.allowLatecomer,
            showResults: votingForm.showResults,
            eligibleVoters: votingForm.eligibleVoters
        }

        const voting = await votingStore.createVoting(votingData)

        currentView.value = 'manage'
        resetForm()

        emit('voting-created', voting)
        toast.success('Voting created and started')

    } catch (error) {
        toast.error('Create voting error:', error)
        toast.error('Failed to create voting')
    } finally {
        isUpdating.value = false
    }
}

const pauseVoting = async () => {
    try {
        isUpdating.value = true
        // Implementation for pausing voting
        toast.log('Voting paused')
    } catch (error) {
        toast.error('Pause voting error:', error)
        toast.error('Failed to pause voting')
    } finally {
        isUpdating.value = false
    }
}

const endVoting = async () => {
    if (!activeVoting.value) return

    try {
        isUpdating.value = true

        const results = await votingStore.endVoting(activeVoting.value._id)

        emit('voting-ended', results)
        toast.success(`Voting ended - ${results.passed ? 'PASSED' : 'FAILED'}`)

    } catch (error) {
        toast.error('End voting error:', error)
        toast.error('Failed to end voting')
    } finally {
        isUpdating.value = false
    }
}

const nextRollCallVoter = async () => {
    if (!activeVoting.value || !currentVoter.value) return

    try {
        isUpdating.value = true
        await votingStore.skipRollCallVote(activeVoting.value._id)
    } catch (error) {
        toast.error('Next roll call voter error:', error)
        toast.error('Failed to advance to next voter')
    } finally {
        isUpdating.value = false
    }
}

const resetForm = () => {
    Object.assign(votingForm, {
        subject: '',
        description: '',
        votingType: 'simple',
        majorityType: 'simple',
        hasTimeLimit: false,
        timeLimit: 5,
        allowAbstention: true,
        allowLatecomer: false,
        showResults: true,
        eligibleVoters: []
    })
    selectAllVoters.value = true
}

const getVotingTypeIcon = () => {
    const type = votingTypes.find(t => t.value === activeVoting.value?.votingType)
    return type?.icon || CheckCircleIcon
}

const getVotingTypeDisplay = () => {
    const type = votingTypes.find(t => t.value === activeVoting.value?.votingType)
    return type?.name || 'Voting'
}

const getVotingTypeDisplayFromType = (votingType) => {
    const type = votingTypes.find(t => t.value === votingType)
    return type?.name || 'Voting'
}

const getMajorityDisplay = () => {
    const types = {
        'simple': 'Simple Majority',
        'two-thirds': 'Two-Thirds Majority',
        'consensus': 'Consensus Required',
        'unanimity': 'Unanimous Consent'
    }
    return types[activeVoting.value?.majorityType] || 'Majority Required'
}

const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString()
    } catch {
        return 'Unknown date'
    }
}

// Watch for eligible voters changes
const updateSelectAllStatus = () => {
    selectAllVoters.value = votingForm.eligibleVoters.length === eligibleCountries.value.length
}

// Initialize
onMounted(async () => {
    if (props.sessionId) {
        await votingStore.loadVotingHistory(sessionStore.currentSession?.committeeId)
    }

    // Pre-select all eligible countries
    votingForm.eligibleVoters = eligibleCountries.value.map(c => c.email)

    // Switch to manage view if there's an active voting
    if (activeVoting.value) {
        currentView.value = 'manage'
    }
})
</script>

<style scoped>
.voting-board-wrapper {
    max-height: 70vh;
    overflow-y: auto;
}

.form-section {
    background: rgba(249, 250, 251, 0.5);
    border: 1px solid rgb(229, 231, 235);
    border-radius: 0.5rem;
    padding: 1.5rem;
}

/* Radio button styling */
input[type="radio"]:checked+div {
    color: rgb(29, 78, 216);
}

/* Custom scrollbar */
.voting-board-wrapper::-webkit-scrollbar,
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.voting-board-wrapper::-webkit-scrollbar-track,
.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.voting-board-wrapper::-webkit-scrollbar-thumb,
.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.voting-board-wrapper::-webkit-scrollbar-thumb:hover,
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

@media (max-width: 1024px) {
    .grid.lg\\:grid-cols-2 {
        grid-template-columns: 1fr;
    }
}
</style>