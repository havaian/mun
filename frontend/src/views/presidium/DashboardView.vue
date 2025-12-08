<template>
    <div class="h-screen flex flex-col bg-gray-50">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Presidium Console</h1>
                    <p class="text-gray-600">Manage session flow, timers, and voting.</p>
                </div>
                <div class="flex items-center space-x-4">
                    <!-- Quorum Status -->
                    <div class="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span class="text-xs text-gray-500 uppercase font-bold block">QUORUM</span>
                        <span :class="[
                            'font-mono text-lg font-bold',
                            stats.hasQuorum ? 'text-green-600' : 'text-red-600'
                        ]">
                            {{ stats.presentCount }} / {{ stats.required }}
                        </span>
                    </div>
                    <!-- Session Mode Badge -->
                    <div class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md font-medium uppercase text-sm">
                        {{ currentSessionMode }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content - Three Column Layout -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left Column: Timer & Session Controls -->
            <div class="w-80 bg-white border-r border-gray-200 p-6 space-y-6">
                <!-- Timer Section -->
                <div class="text-center">
                    <!-- Circular Timer -->
                    <div class="relative w-48 h-48 mx-auto mb-6">
                        <!-- Timer Circle -->
                        <svg class="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                            <!-- Background circle -->
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="4" />
                            <!-- Progress circle -->
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" stroke-width="4"
                                stroke-linecap="round" :stroke-dasharray="timerCircumference"
                                :stroke-dashoffset="timerDashOffset" class="transition-all duration-1000" />
                        </svg>
                        <!-- Timer Text -->
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <div class="text-3xl font-bold text-gray-900">{{ formattedTime }}</div>
                            <div class="text-sm text-gray-500 uppercase tracking-wide">SPEAKER TIME</div>
                        </div>
                    </div>

                    <!-- Timer Controls -->
                    <div class="flex justify-center space-x-4">
                        <button @click="toggleTimer" :class="[
                            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                            timerState.isRunning ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                        ]">
                            <PauseIcon v-if="timerState.isRunning" class="w-6 h-6" />
                            <PlayIcon v-else class="w-6 h-6" />
                        </button>
                        <button @click="resetTimer"
                            class="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors">
                            <ArrowPathIcon class="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <!-- Session Controls -->
                <div class="bg-gray-50 p-4 rounded-xl">
                    <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
                        <CommandLineIcon class="w-5 h-5 mr-2" />
                        Session Controls
                    </h3>

                    <div class="grid grid-cols-2 gap-3">
                        <button @click="changeSessionMode('formal')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            sessionMode === 'formal'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Formal Debate
                        </button>
                        <button @click="changeSessionMode('moderated')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            sessionMode === 'moderated'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Mod. Caucus
                        </button>
                        <button @click="changeSessionMode('unmoderated')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            sessionMode === 'unmoderated'
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Unmod. Caucus
                        </button>
                        <button @click="startQuickVote" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            activeVoting
                                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        ]">
                            {{ activeVoting ? 'End Voting' : 'Quick Vote' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Middle Column: Speakers List -->
            <div class="flex-1 bg-white border-r border-gray-200 p-6 flex flex-col">
                <div class="flex items-center mb-6">
                    <MicrophoneIcon class="w-5 h-5 text-gray-600 mr-2" />
                    <h3 class="font-semibold text-gray-800">Speakers List</h3>
                </div>

                <!-- Current Speaker -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p class="text-xs text-gray-500 uppercase mb-1">CURRENT SPEAKER</p>
                    <p class="text-2xl font-bold text-gray-700 mb-3">
                        {{ currentSpeaker || 'None' }}
                    </p>
                    <button @click="nextSpeaker"
                        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        :disabled="speakerList.length === 0">
                        Next
                    </button>
                </div>

                <!-- Speaker List -->
                <div class="flex-1 overflow-y-auto space-y-2 mb-4">
                    <div v-if="speakerList.length === 0" class="text-center text-gray-400 text-sm py-8">
                        List is empty
                    </div>
                    <div v-for="(speaker, idx) in speakerList" :key="speaker.country"
                        class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <span class="font-medium text-gray-700">{{ idx + 1 }}. {{ speaker.country }}</span>
                        <button @click="removeSpeaker(speaker.country)"
                            class="text-red-400 hover:text-red-600 transition-colors">
                            <XMarkIcon class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- Add Speaker -->
                <div class="flex space-x-2">
                    <select v-model="selectedDelegate"
                        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Delegate...</option>
                        <option v-for="country in availableCountries" :key="country" :value="country">
                            {{ country }}
                        </option>
                    </select>
                    <button @click="addSpeaker" :disabled="!selectedDelegate"
                        class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Add
                    </button>
                </div>
            </div>

            <!-- Right Column: Voting & Information -->
            <div class="w-80 bg-white p-6">
                <!-- Active Voting -->
                <div v-if="activeVoting" class="h-full flex flex-col">
                    <div class="flex items-center mb-4">
                        <CheckCircleIcon class="w-5 h-5 text-green-600 mr-2" />
                        <h3 class="font-semibold text-green-600">Active Voting</h3>
                    </div>

                    <p class="text-sm text-gray-600 mb-6">{{ activeVoting.subject }}</p>

                    <!-- Voting Results -->
                    <div class="space-y-4 flex-1">
                        <div v-for="(count, option) in votingResults" :key="option">
                            <div class="flex justify-between text-sm mb-1">
                                <span class="capitalize font-medium">{{ option }}</span>
                                <span>{{ count }}</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div :class="[
                                    'h-full transition-all duration-500',
                                    option === 'for' ? 'bg-green-500' :
                                        option === 'against' ? 'bg-red-500' : 'bg-yellow-500'
                                ]" :style="{ width: `${getVotePercentage(count)}%` }" />
                            </div>
                        </div>
                    </div>

                    <!-- Vote Count -->
                    <div class="mt-4 pt-4 border-t border-gray-100 text-center">
                        <p class="text-3xl font-bold text-gray-800">{{ totalVotes }}</p>
                        <p class="text-xs text-gray-400 uppercase">Votes Cast</p>
                    </div>
                </div>

                <!-- No Active Voting -->
                <div v-else class="h-full flex flex-col justify-center items-center text-gray-400">
                    <DocumentTextIcon class="w-12 h-12 mb-4 opacity-50" />
                    <p class="text-center mb-2">No active procedure or voting.</p>
                    <p class="text-sm text-center">Select "Quick Vote" to initiate.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    PlayIcon, PauseIcon, ArrowPathIcon, CommandLineIcon, MicrophoneIcon,
    XMarkIcon, CheckCircleIcon, DocumentTextIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Timer State
const timerState = ref({
    totalTime: 90, // 1:30 in seconds
    remainingTime: 90,
    isRunning: false
})

// Session State
const sessionMode = ref('formal')
const currentSpeaker = ref(null)
const selectedDelegate = ref('')
const activeVoting = ref(null)

// Speaker List
const speakerList = ref([
    // Example data - would come from API
])

// Available Countries (would come from API)
const availableCountries = ref([
    'United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'Brazil', 'India', 'Australia'
])

// Stats
const stats = ref({
    presentCount: 9,
    required: 50,
    hasQuorum: false
})

// Timer interval
let timerInterval = null

// Computed
const currentSessionMode = computed(() => {
    const modeMap = {
        'formal': 'FORMAL',
        'moderated': 'MOD. CAUCUS',
        'unmoderated': 'UNMOD. CAUCUS',
        'informal': 'INFORMAL'
    }
    return modeMap[sessionMode.value] || 'FORMAL'
})

const formattedTime = computed(() => {
    const minutes = Math.floor(timerState.value.remainingTime / 60)
    const seconds = timerState.value.remainingTime % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const timerCircumference = computed(() => {
    return 2 * Math.PI * 45 // radius = 45
})

const timerDashOffset = computed(() => {
    const progress = timerState.value.remainingTime / timerState.value.totalTime
    return timerCircumference.value * (1 - progress)
})

const votingResults = computed(() => {
    if (!activeVoting.value) return {}
    return activeVoting.value.results || { for: 0, against: 0, abstain: 0 }
})

const totalVotes = computed(() => {
    return Object.values(votingResults.value).reduce((sum, count) => sum + count, 0)
})

// Methods
const toggleTimer = () => {
    timerState.value.isRunning = !timerState.value.isRunning

    if (timerState.value.isRunning) {
        startTimerInterval()
    } else {
        stopTimerInterval()
    }
}

const resetTimer = () => {
    timerState.value.remainingTime = timerState.value.totalTime
    timerState.value.isRunning = false
    stopTimerInterval()
}

const startTimerInterval = () => {
    if (timerInterval) clearInterval(timerInterval)

    timerInterval = setInterval(() => {
        if (timerState.value.remainingTime > 0) {
            timerState.value.remainingTime--
        } else {
            timerState.value.isRunning = false
            stopTimerInterval()
            toast.info('Speaker time expired!')
        }
    }, 1000)
}

const stopTimerInterval = () => {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

const changeSessionMode = (mode) => {
    sessionMode.value = mode

    // Set default timer based on mode
    switch (mode) {
        case 'formal':
            timerState.value.totalTime = 90
            break
        case 'moderated':
            timerState.value.totalTime = 600
            break
        case 'unmoderated':
            timerState.value.totalTime = 1200
            break
        default:
            timerState.value.totalTime = 90
    }

    resetTimer()
    toast.success(`Session mode changed to ${currentSessionMode.value}`)
}

const nextSpeaker = () => {
    if (speakerList.value.length > 0) {
        currentSpeaker.value = speakerList.value[0].country
        speakerList.value.shift()
        resetTimer()
        toast.success(`Now speaking: ${currentSpeaker.value}`)
    }
}

const addSpeaker = () => {
    if (selectedDelegate.value && !speakerList.value.find(s => s.country === selectedDelegate.value)) {
        speakerList.value.push({
            country: selectedDelegate.value,
            email: `${selectedDelegate.value.toLowerCase()}@example.com`
        })
        selectedDelegate.value = ''
        toast.success('Speaker added to list')
    }
}

const removeSpeaker = (country) => {
    const index = speakerList.value.findIndex(s => s.country === country)
    if (index !== -1) {
        speakerList.value.splice(index, 1)
        toast.success('Speaker removed from list')
    }
}

const startQuickVote = () => {
    if (activeVoting.value) {
        // End current voting
        activeVoting.value = null
        toast.success('Voting ended')
    } else {
        // Start new voting
        activeVoting.value = {
            id: Date.now().toString(),
            subject: 'Motion to move to Moderated Caucus',
            results: { for: 0, against: 0, abstain: 0 }
        }
        toast.success('Quick vote started')
    }
}

const getVotePercentage = (count) => {
    return totalVotes.value > 0 ? (count / totalVotes.value) * 100 : 0
}

// Lifecycle
onMounted(() => {
    // Load initial data
    stats.value.hasQuorum = stats.value.presentCount >= Math.floor(stats.value.required / 2) + 1
})

onUnmounted(() => {
    stopTimerInterval()
})
</script>