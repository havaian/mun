<template>
    <div class="h-screen flex flex-col bg-gray-50">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Presidium Console</h1>
                    <p class="text-gray-600">{{ currentSession ? `Session ${currentSession.sessionNumber}` : 'No active session' }}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <!-- Session Controls -->
                    <div v-if="!currentSession" class="flex space-x-2">
                        <button @click="showCreateSessionModal = true"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Start New Session
                        </button>
                    </div>

                    <button @click="endCurrentSession" v-if="currentSession"
                        class="px-4 py-3 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        End Session
                    </button>

                    <!-- Quorum Status -->
                    <div class="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span class="text-xs text-gray-500 uppercase font-bold block">QUORUM</span>
                        <span :class="[
                            'font-mono text-lg font-bold',
                            quorum.hasQuorum ? 'text-green-600' : 'text-red-600'
                        ]">
                            {{ quorum.presentVoting || 0 }} / {{ quorum.required || 0 }}
                        </span>
                    </div>

                    <!-- Session Mode Badge -->
                    <div v-if="currentSession" :class="[
                        'px-4 py-2 rounded-lg shadow-md font-medium uppercase text-sm',
                        modeColor
                    ]">
                        {{ formattedMode }}
                    </div>
                </div>
            </div>
        </div>

        <!-- No Session State -->
        <div v-if="!currentSession" class="flex-1 overflow-y-auto p-6">
            <div class="max-w-6xl mx-auto space-y-8">

                <!-- Session Creation Section -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDaysIcon class="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">Session Management</h2>
                        <p class="text-gray-600">Start a new session to begin committee proceedings</p>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Quick Session Start -->
                        <div class="border border-gray-200 rounded-lg p-6 hover:border-blue-200 transition-colors">
                            <div class="flex items-center mb-4">
                                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <PlayIcon class="w-5 h-5 text-green-600" />
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900">Quick Start</h3>
                            </div>
                            <p class="text-gray-600 mb-6">Start a new session with default settings immediately</p>
                            <button @click="createQuickSession" :disabled="isLoading"
                                class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                                <PlayIcon class="w-5 h-5 mx-auto" />
                            </button>
                        </div>

                        <!-- Custom Session Setup -->
                        <div class="border border-gray-200 rounded-lg p-6 hover:border-blue-200 transition-colors">
                            <div class="flex items-center mb-4">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <CogIcon class="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900">Custom Setup</h3>
                            </div>
                            <p class="text-gray-600 mb-6">Configure session settings, timers, and debate modes</p>
                            <button @click="showCreateSessionModal = true"
                                class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <CogIcon class="w-5 h-5 mx-auto" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Presentation Control -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                            <PresentationChartLineIcon class="w-5 h-5 mr-2" />
                            Presentation Control
                        </h3>
                        <span class="text-sm text-gray-500">Controls public display mode</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                        <button @click="setDisplayMode('session')" :class="[
                            'p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-3 hover:shadow-md',
                            publicDisplayMode === 'session'
                                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            <ComputerDesktopIcon class="w-8 h-8" />
                            <span class="font-medium">Session View</span>
                            <span class="text-xs text-center">Timers, speakers, voting</span>
                        </button>
                        <button @click="setDisplayMode('gossip')" :class="[
                            'p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-3 hover:shadow-md',
                            publicDisplayMode === 'gossip'
                                ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            <ChatBubbleOvalLeftEllipsisIcon class="w-8 h-8" />
                            <span class="font-medium">Gossip Box</span>
                            <span class="text-xs text-center">Anonymous messages</span>
                        </button>
                    </div>
                </div>

                <!-- Previous Sessions -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-gray-900">Previous Sessions</h3>
                        <span class="text-sm text-gray-500">{{ previousSessions.length }} session{{
                            previousSessions.length !== 1 ? 's' : '' }}</span>
                    </div>

                    <div v-if="previousSessions.length > 0" class="space-y-4">
                        <div v-for="session in previousSessions.slice(0, 5)" :key="session._id"
                            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <h4 class="font-semibold text-gray-900">Session {{ session.sessionNumber || 'N/A' }}
                                    </h4>
                                    <span :class="getSessionStatusClass(session.status)">
                                        {{ session.status }}
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                                    <div>Mode: {{ formatSessionMode(session.currentMode) }}</div>
                                    <div>Started: {{ formatSessionDate(session.startedAt) }}</div>
                                    <div v-if="session.endedAt">Ended: {{ formatSessionDate(session.endedAt) }}</div>
                                    <div>Duration: {{ formatSessionDuration(session.startedAt, session.endedAt) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8">
                        <ClockIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p class="text-gray-600">No previous sessions found</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Session Layout -->
        <div v-else class="flex-1 flex overflow-hidden">
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
                            <circle cx="50" cy="50" r="45" fill="none" :stroke="currentTimerColor" stroke-width="4"
                                stroke-linecap="round" :stroke-dasharray="timerCircumference"
                                :stroke-dashoffset="timerDashOffset" class="transition-all duration-1000" />
                        </svg>
                        <!-- Timer Text -->
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <div class="text-3xl font-bold text-gray-900">{{ formattedTimer }}</div>
                            <div class="text-sm text-gray-500 uppercase tracking-wide">{{ currentTimerName }}</div>
                        </div>
                    </div>

                    <!-- Timer Controls -->
                    <div class="flex justify-center space-x-4 mb-4">
                        <button @click="toggleTimer" :class="[
                            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                            activeSessionTimer?.isActive && !activeSessionTimer?.isPaused ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                        ]" :disabled="!activeSessionTimer">
                            <PauseIcon v-if="activeSessionTimer?.isActive && !activeSessionTimer?.isPaused" class="w-6 h-6" />
                            <PlayIcon v-else class="w-6 h-6" />
                        </button>
                        <button @click="adjustTimer(-30)"
                            class="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs font-bold"
                            :disabled="!activeSessionTimer">
                            -30s
                        </button>
                        <button @click="adjustTimer(30)"
                            class="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs font-bold"
                            :disabled="!activeSessionTimer">
                            +30s
                        </button>
                    </div>

                    <!-- Timer Selection -->
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <button @click="startSpeakerTimer" :class="[
                            'px-3 py-2 rounded-lg border transition-colors',
                            activeTimerType === 'speaker' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                        ]" :disabled="!currentSpeaker">
                            Speaker Timer
                        </button>
                        <button @click="startSessionTimer" :class="[
                            'px-3 py-2 rounded-lg border transition-colors',
                            activeTimerType === 'session' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                        ]">
                            Session Timer
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
                        <button @click="changeMode('formal')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            currentSession?.currentMode === 'formal'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Formal Debate
                        </button>
                        <button @click="changeMode('moderated')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            currentSession?.currentMode === 'moderated'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Mod. Caucus
                        </button>
                        <button @click="changeMode('unmoderated')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            currentSession?.currentMode === 'unmoderated'
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Unmod. Caucus
                        </button>
                        <button @click="createQuickVote" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            activeVoting
                                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        ]">
                            {{ activeVoting ? 'End Voting' : 'Quick Vote' }}
                        </button>
                    </div>

                    <!-- Roll Call Section -->
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Roll Call</span>
                            <span :class="[
                                'text-xs px-2 py-1 rounded-full',
                                rollCallStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            ]">
                                {{ rollCallStatus === 'active' ? 'In Progress' : 'Not Started' }}
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <button @click="startRollCall" v-if="rollCallStatus !== 'active'"
                                class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Start Roll Call
                            </button>
                            <button @click="endRollCall" v-else
                                class="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                                End Roll Call
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Presentation Control -->
                <div class="bg-gray-50 p-4 rounded-xl">
                    <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
                        <PresentationChartLineIcon class="w-5 h-5 mr-2" />
                        Presentation Control
                    </h3>

                    <div class="grid grid-cols-2 gap-3">
                        <button @click="setDisplayMode('session')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors flex flex-col items-center space-y-1',
                            publicDisplayMode === 'session'
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            <ComputerDesktopIcon class="w-5 h-5" />
                            <span>Session View</span>
                        </button>
                        <button @click="setDisplayMode('gossip')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors flex flex-col items-center space-y-1',
                            publicDisplayMode === 'gossip'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            <ChatBubbleOvalLeftEllipsisIcon class="w-5 h-5" />
                            <span>Gossip Box</span>
                        </button>
                    </div>

                    <div class="mt-3 text-xs text-gray-500 text-center">
                        Controls what delegates see on public display
                    </div>
                </div>
            </div>

            <!-- Middle Column: Speakers List -->
            <div class="flex-1 bg-white border-r border-gray-200 p-6 flex flex-col">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center">
                        <MicrophoneIcon class="w-5 h-5 text-gray-600 mr-2" />
                        <h3 class="font-semibold text-gray-800">Speakers List</h3>
                    </div>
                    <span class="text-sm text-gray-500">{{ speakerQueue.length }} in queue</span>
                </div>

                <!-- Current Speaker -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p class="text-xs text-gray-500 uppercase mb-1">CURRENT SPEAKER</p>
                    <p class="text-2xl font-bold text-gray-700 mb-3">
                        {{ currentSpeaker?.country || 'None' }}
                    </p>
                    <button @click="nextSpeaker"
                        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        :disabled="speakerQueue.length === 0">
                        Next Speaker
                    </button>
                </div>

                <!-- Speaker Queue -->
                <div class="flex-1 overflow-y-auto space-y-2 mb-4">
                    <div v-if="speakerQueue.length === 0" class="text-center text-gray-400 text-sm py-8">
                        Speaker list is empty
                    </div>
                    <div v-for="(speaker, idx) in speakerQueue" :key="speaker.country"
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
                    <select v-model="selectedCountry"
                        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select Country...</option>
                        <option v-for="country in availableCountries" :key="country.name" :value="country.name">
                            {{ country.name }}
                        </option>
                    </select>
                    <button @click="addSpeaker" :disabled="!selectedCountry"
                        class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Add
                    </button>
                </div>
            </div>

            <!-- Right Column: Voting & Information -->
            <div class="w-80 bg-white p-6">
                <!-- Active Voting -->
                <div v-if="activeVoting" class="h-full flex flex-col">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                            <CheckCircleIcon class="w-5 h-5 text-green-600 mr-2" />
                            <h3 class="font-semibold text-green-600">Active Voting</h3>
                        </div>
                        <span :class="[
                            'text-xs px-2 py-1 rounded-full',
                            'bg-green-100 text-green-700'
                        ]">
                            {{ activeVoting.votingType }}
                        </span>
                    </div>

                    <p class="text-sm text-gray-600 mb-6">{{ activeVoting.title }}</p>

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
                                    getVoteBarColor(option)
                                ]" :style="{ width: `${getVotePercentage(count)}%` }" />
                            </div>
                        </div>
                    </div>

                    <!-- Vote Progress -->
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <div class="text-center mb-4">
                            <p class="text-3xl font-bold text-gray-800">{{ totalVotes }}</p>
                            <p class="text-xs text-gray-400 uppercase">Votes Cast</p>
                        </div>

                        <div class="flex justify-between text-sm text-gray-600">
                            <span>Progress:</span>
                            <span>{{ totalVotes }} / {{ activeVoting.eligibleVoters?.length || 0 }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                :style="{ width: `${votingProgress}%` }"></div>
                        </div>

                        <button @click="endVoting"
                            class="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            End Voting
                        </button>
                    </div>
                </div>

                <!-- No Active Voting -->
                <div v-else class="h-full flex flex-col justify-center items-center text-gray-400">
                    <DocumentTextIcon class="w-12 h-12 mb-4 opacity-50" />
                    <p class="text-center mb-2">No active voting.</p>
                    <p class="text-sm text-center">Select "Quick Vote" to initiate voting.</p>
                </div>
            </div>
        </div>

        <!-- Session Create Modal -->
        <SessionCreateModal v-model="showCreateSessionModal" :committee-id="committee?._id"
            @session-created="handleSessionCreated" />

        <!-- Quick Vote Modal -->
        <QuickVoteModal v-model="showQuickVoteModal" :session="currentSession" @voting-created="handleVotingCreated" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import sessionApi from '@/utils/sessionApi'

// Icons
import {
    PlayIcon, PauseIcon, ArrowPathIcon, CommandLineIcon, MicrophoneIcon,
    XMarkIcon, CheckCircleIcon, DocumentTextIcon, CalendarDaysIcon,
    CogIcon, ClockIcon, EyeIcon, PresentationChartLineIcon, 
    ComputerDesktopIcon, ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/vue/24/outline'

// Components
import SessionCreateModal from '@/components/presidium/SessionCreateModal.vue'
import QuickVoteModal from '@/components/presidium/QuickVoteModal.vue'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const committee = ref(null)
const currentSession = ref(null)
const sessionTimers = ref({}) // Store all session timers
const activeSessionTimer = ref(null) // Currently active/displayed timer
const activeTimerType = ref(null) // 'session', 'speaker', 'debate'
const speakerQueue = ref([])
const currentSpeaker = ref(null)
const selectedCountry = ref('')
const availableCountries = ref([])
const activeVoting = ref(null)
const votingResults = ref({})
const quorum = ref({ hasQuorum: false, presentVoting: 0, required: 0 })
const rollCallStatus = ref('inactive')
const isLoading = ref(false)
const allSessions = ref([])
const publicDisplayMode = ref('session')

// Modals
const showCreateSessionModal = ref(false)
const showQuickVoteModal = ref(false)

// Timer sync interval
let timerSyncInterval = null

// Computed
const formattedMode = computed(() => {
    const modes = {
        'formal': 'FORMAL',
        'moderated': 'MOD. CAUCUS',
        'unmoderated': 'UNMOD. CAUCUS',
        'informal': 'INFORMAL'
    }
    return modes[currentSession.value?.currentMode] || 'FORMAL'
})

const modeColor = computed(() => {
    const colors = {
        'formal': 'bg-blue-600 text-white',
        'moderated': 'bg-purple-600 text-white',
        'unmoderated': 'bg-orange-600 text-white',
        'informal': 'bg-gray-600 text-white'
    }
    return colors[currentSession.value?.currentMode] || 'bg-blue-600 text-white'
})

const formattedTimer = computed(() => {
    if (!activeSessionTimer.value) return '00:00'

    const time = Math.max(0, activeSessionTimer.value.remainingTime || 0)
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const currentTimerName = computed(() => {
    if (!activeSessionTimer.value || !activeTimerType.value) return 'NO TIMER'
    
    const names = {
        'session': 'SESSION',
        'speaker': currentSpeaker.value?.country ? `${currentSpeaker.value.country}` : 'SPEAKER',
        'debate': 'DEBATE'
    }
    return names[activeTimerType.value] || 'TIMER'
})

const currentTimerColor = computed(() => {
    if (!activeSessionTimer.value) return '#e5e7eb'

    const time = activeSessionTimer.value.remainingTime || 0
    
    // Color coding based on technical specs: Green > 30s, Yellow 10-30s, Red < 10s
    if (time > 30) return '#22c55e' // green
    if (time > 10) return '#eab308' // yellow  
    return '#ef4444' // red
})

const timerCircumference = computed(() => {
    return 2 * Math.PI * 45 // radius = 45
})

const timerDashOffset = computed(() => {
    if (!activeSessionTimer.value) return timerCircumference.value

    const progress = activeSessionTimer.value.totalDuration > 0 
        ? (activeSessionTimer.value.totalDuration - activeSessionTimer.value.remainingTime) / activeSessionTimer.value.totalDuration
        : 0
    return timerCircumference.value * (1 - progress)
})

const totalVotes = computed(() => {
    return Object.values(votingResults.value).reduce((sum, count) => sum + count, 0)
})

const votingProgress = computed(() => {
    if (!activeVoting.value || !activeVoting.value.eligibleVoters) return 0
    return Math.round((totalVotes.value / activeVoting.value.eligibleVoters.length) * 100)
})

const previousSessions = computed(() => {
    return allSessions.value.filter(session => session.status !== 'active').slice(0, 5)
})

const totalCompletedSessions = computed(() => {
    return allSessions.value.filter(session => session.status === 'completed').length
})

// Methods
const loadDashboardData = async () => {
    try {
        isLoading.value = true
        committee.value = authStore.user?.committeeId

        if (!committee.value) {
            throw new Error('No committee assigned to user')
        }

        availableCountries.value = committee.value.countries || []
        await loadActiveSession()
        await loadAllSessions()
        setupWebSocketListeners()

    } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error('Failed to load dashboard data')
    } finally {
        isLoading.value = false
    }
}

const loadAllSessions = async () => {
    if (!committee.value?._id) return
    
    try {
        const response = await apiMethods.sessions.getAll(committee.value._id, {
            page: 1,
            limit: 20,
            sort: '-number'
        })

        if (response.data.success) {
            allSessions.value = response.data.sessions || []
        }
    } catch (error) {
        console.error('Failed to load all sessions:', error)
    }
}

const loadActiveSession = async () => {
    try {
        const response = await apiMethods.sessions.getAll(committee.value._id, {
            status: 'active',
            limit: 1
        })

        if (response.data.success && response.data.sessions?.length > 0) {
            currentSession.value = response.data.sessions[0]
            await loadSessionDetails()
        }
    } catch (error) {
        console.error('Failed to load active session:', error)
    }
}

const loadSessionDetails = async () => {
    if (!currentSession.value?._id) return

    try {
        // Load session details using correct route
        const sessionResponse = await apiMethods.sessions.getById(currentSession.value._id)
        if (sessionResponse.data.success) {
            const sessionData = sessionResponse.data.session
            currentSession.value = sessionData

            // Load timers from session
            if (sessionData.timers) {
                sessionTimers.value = sessionData.timers
                
                // Find active timer (priority: speaker > debate > session)
                if (sessionData.timers.speaker?.isActive) {
                    activeSessionTimer.value = sessionData.timers.speaker
                    activeTimerType.value = 'speaker'
                } else if (sessionData.timers.debate?.isActive) {
                    activeSessionTimer.value = sessionData.timers.debate
                    activeTimerType.value = 'debate'
                } else if (sessionData.timers.session?.isActive) {
                    activeSessionTimer.value = sessionData.timers.session
                    activeTimerType.value = 'session'
                } else {
                    activeSessionTimer.value = null
                    activeTimerType.value = null
                }
            }

            // Update speaker data
            speakerQueue.value = sessionData.speakerList?.queue || []
            currentSpeaker.value = sessionData.speakerList?.current || null

            // Update roll call status
            rollCallStatus.value = sessionData.rollCall?.isActive ? 'active' : 'inactive'
            quorum.value = sessionData.rollCall?.quorum || { hasQuorum: false, presentVoting: 0, required: 0 }
        }

        // Load active voting
        const votingResponse = await apiMethods.voting.getByCommitteeId(committee.value._id)
        if (votingResponse.data.success) {
            const activeVotingData = votingResponse.data.voting?.find(v => v.status === 'active')
            if (activeVotingData) {
                activeVoting.value = activeVotingData
                updateVotingResults(activeVotingData)
            }
        }

        // Join session WebSocket room
        wsService.joinSession(currentSession.value._id)
        
        // Start timer sync
        startTimerSync()

    } catch (error) {
        console.error('Failed to load session details:', error)
    }
}

const updateVotingResults = (voting) => {
    if (!voting?.votes) {
        votingResults.value = { for: 0, against: 0, abstain: 0 }
        return
    }

    const results = { for: 0, against: 0, abstain: 0 }
    voting.votes.forEach(vote => {
        if (vote.vote && results.hasOwnProperty(vote.vote)) {
            results[vote.vote]++
        }
    })

    votingResults.value = results
}

// Session Management Methods
const createQuickSession = async () => {
    try {
        isLoading.value = true

        const sessionData = {
            committeeId: committee.value._id,
            sessionNumber: allSessions.value.length + 1,
            currentMode: 'formal',
            status: 'active',
            settings: {
                defaultSpeechTime: 180,
                allowExtensions: true,
                extensionTime: 60
            }
        }

        const response = await apiMethods.sessions.create(sessionData)

        if (response.data.success) {
            currentSession.value = response.data.session
            await loadSessionDetails()
            await loadAllSessions()
            toast.success('Session started successfully')
        }
    } catch (error) {
        console.error('Failed to create quick session:', error)
        toast.error('Failed to start session')
    } finally {
        isLoading.value = false
    }
}

const endCurrentSession = async () => {
    if (!currentSession.value) return

    try {
        const response = await apiMethods.sessions.updateStatus(currentSession.value._id, {
            status: 'completed',
            reason: 'Session ended by presidium'
        })

        if (response.data.success) {
            currentSession.value = null
            stopTimerSync()
            await loadAllSessions()
            toast.success('Session ended successfully')
        }
    } catch (error) {
        console.error('Failed to end session:', error)
        toast.error('Failed to end session')
    }
}

// Timer Management - Fixed Implementation
const startSessionTimer = async () => {
    if (!currentSession.value) return

    try {
        // Use the correct session API call for creating a general session timer
        const response = await apiMethods.timers.createTimer({
            committeeId: committee.value._id,
            sessionId: currentSession.value._id,
            timerType: 'session',
            name: 'Session Timer',
            totalDuration: 3600, // 1 hour
            remainingTime: 3600
        })

        if (response.data.success) {
            // Start the created timer
            await apiMethods.timers.startTimer(response.data.timer._id)
            await loadSessionDetails()
            toast.success('Session timer started')
        }
    } catch (error) {
        console.error('Failed to start session timer:', error)
        toast.error('Failed to start session timer')
    }
}

const startSpeakerTimer = async () => {
    if (!currentSession.value || !currentSpeaker.value) {
        toast.warn('Please set a current speaker first')
        return
    }

    try {
        const defaultDuration = committee.value.settings?.speechSettings?.defaultSpeechTime || 120
        
        const response = await apiMethods.timers.createQuickSpeakerTimer({
            committeeId: committee.value._id,
            sessionId: currentSession.value._id,
            speakerCountry: currentSpeaker.value.country,
            speakerEmail: currentSpeaker.value.email,
            duration: defaultDuration,
            autoStart: true
        })

        if (response.data.success) {
            await loadSessionDetails()
            toast.success('Speaker timer started')
        }
    } catch (error) {
        console.error('Failed to start speaker timer:', error)
        toast.error('Failed to start speaker timer')
    }
}

const toggleTimer = async () => {
    if (!activeSessionTimer.value || !currentSession.value) return

    try {
        const action = activeSessionTimer.value.isActive && !activeSessionTimer.value.isPaused ? 'pause' : 'resume'
        
        // Find the actual timer ID from the session data
        const timerId = activeSessionTimer.value._id
        if (!timerId) {
            console.error('Timer ID not found')
            return
        }

        if (action === 'pause') {
            await apiMethods.timers.pauseTimer(timerId)
        } else {
            await apiMethods.timers.resumeTimer(timerId)
        }

        await loadSessionDetails()
        toast.success(`Timer ${action}d`)
    } catch (error) {
        console.error('Failed to toggle timer:', error)
        toast.error('Failed to toggle timer')
    }
}

const adjustTimer = async (seconds) => {
    if (!activeSessionTimer.value || !currentSession.value) return

    try {
        const timerId = activeSessionTimer.value._id
        if (!timerId) {
            console.error('Timer ID not found')
            return
        }

        // Extend or reduce timer time
        if (seconds > 0) {
            await apiMethods.timers.extendTimer(timerId, {
                additionalSeconds: seconds,
                reason: 'Manual adjustment by presidium'
            })
        } else {
            // For reducing time, we can't use extend, so we'll need to update remaining time directly
            const newTime = Math.max(0, activeSessionTimer.value.remainingTime + seconds)
            activeSessionTimer.value.remainingTime = newTime
        }

        toast.success(`Timer adjusted by ${seconds > 0 ? '+' : ''}${seconds}s`)
    } catch (error) {
        console.error('Failed to adjust timer:', error)
        toast.error('Failed to adjust timer')
    }
}

// Timer Sync - Local countdown for smooth display
const startTimerSync = () => {
    stopTimerSync()
    
    timerSyncInterval = setInterval(() => {
        if (activeSessionTimer.value?.isActive && !activeSessionTimer.value?.isPaused) {
            if (activeSessionTimer.value.remainingTime > 0) {
                activeSessionTimer.value.remainingTime--
                
                // Visual/audio alerts based on technical specs
                const time = activeSessionTimer.value.remainingTime
                if (time === 30) {
                    toast.warn('30 seconds remaining!')
                } else if (time === 10) {
                    toast.error('10 seconds remaining!')
                } else if (time === 0) {
                    toast.error('Timer expired!')
                    stopTimerSync()
                }
            }
        }
    }, 1000)
}

const stopTimerSync = () => {
    if (timerSyncInterval) {
        clearInterval(timerSyncInterval)
        timerSyncInterval = null
    }
}

// Session Mode Management - Fixed to use correct API pattern and provide complete backend data
const changeMode = async (newMode) => {
    if (!currentSession.value || currentSession.value.currentMode === newMode) return

    try {
        // Use direct API call with complete structure that backend expects
        const response = await apiMethods.put(`/sessions/${currentSession.value._id}/mode`, {
            mode: newMode,
            reason: `Mode changed by ${authStore.user?.name || 'presidium'}`,
            // Backend requires these fields based on the session model
            modeSettings: {
                topic: `${newMode.charAt(0).toUpperCase() + newMode.slice(1)} debate`,
                totalTime: newMode === 'moderated' ? 600 : newMode === 'unmoderated' ? 900 : 0,
                speechTime: 120,
                allowQuestions: newMode === 'moderated'
            }
        })

        if (response.data.success) {
            currentSession.value.currentMode = newMode
            toast.success(`Mode changed to ${formattedMode.value}`)
        }
    } catch (error) {
        console.error('Failed to change mode:', error)
        toast.error('Failed to change mode')
    }
}

// Roll Call Management
const startRollCall = async () => {
    if (!currentSession.value) return

    try {
        const response = await apiMethods.sessions.startRollCall(currentSession.value._id, {
            timeLimit: 10
        })

        if (response.data.success) {
            rollCallStatus.value = 'active'
            toast.success('Roll call started')
        }
    } catch (error) {
        console.error('Failed to start roll call:', error)
        toast.error('Failed to start roll call')
    }
}

const endRollCall = async () => {
    if (!currentSession.value) return

    try {
        const response = await apiMethods.sessions.endRollCall(currentSession.value._id)

        if (response.data.success) {
            rollCallStatus.value = 'completed'
            quorum.value = response.data.quorum || quorum.value
            toast.success('Roll call completed')
        }
    } catch (error) {
        console.error('Failed to end roll call:', error)
        toast.error('Failed to end roll call')
    }
}

// Speaker Management - Fixed to use correct API routes that exist in backend
const addSpeaker = async () => {
    if (!selectedCountry.value || !currentSession.value) return

    try {
        const country = availableCountries.value.find(c => c.name === selectedCountry.value)
        if (!country) return

        // Use the correct working route from your API 
        const response = await apiMethods.put(`/sessions/${currentSession.value._id}/speaker-list`, {
            action: 'add',
            country: country.name,
            email: country.email
        })

        if (response.data.success) {
            speakerQueue.value = response.data.speakerList || []
            selectedCountry.value = ''
            toast.success('Speaker added to list')
        }
    } catch (error) {
        console.error('Failed to add speaker:', error)
        toast.error('Failed to add speaker')
    }
}

const removeSpeaker = async (countryName) => {
    if (!currentSession.value) return

    try {
        // Use the correct working route from your API
        const response = await apiMethods.put(`/sessions/${currentSession.value._id}/speaker-list`, {
            action: 'remove',
            country: countryName
        })

        if (response.data.success) {
            speakerQueue.value = response.data.speakerList || []
            toast.success('Speaker removed from list')
        }
    } catch (error) {
        console.error('Failed to remove speaker:', error)
        toast.error('Failed to remove speaker')
    }
}

const nextSpeaker = async () => {
    if (!currentSession.value || speakerQueue.value.length === 0) return

    try {
        const nextSpeakerData = speakerQueue.value[0]

        // Use correct route for setting current speaker
        const response = await apiMethods.put(`/sessions/${currentSession.value._id}/current-speaker`, {
            country: nextSpeakerData.country,
            email: nextSpeakerData.email
        })

        if (response.data.success) {
            currentSpeaker.value = nextSpeakerData
            speakerQueue.value = speakerQueue.value.slice(1)
            toast.success(`Now speaking: ${nextSpeakerData.country}`)
        }
    } catch (error) {
        console.error('Failed to set next speaker:', error)
        toast.error('Failed to set next speaker')
    }
}

// Voting Management
const createQuickVote = async () => {
    if (activeVoting.value) {
        await endVoting()
    } else {
        showQuickVoteModal.value = true
    }
}

const endVoting = async () => {
    if (!activeVoting.value) return

    try {
        const response = await apiMethods.voting.endVoting(activeVoting.value._id)
        if (response.data.success) {
            activeVoting.value = null
            votingResults.value = {}
            toast.success('Voting ended')
        }
    } catch (error) {
        console.error('Failed to end voting:', error)
        toast.error('Failed to end voting')
    }
}

// Public Display Management - Enhanced with debugging and better error handling
const setDisplayMode = async (mode) => {
    if (publicDisplayMode.value === mode) return

    try {
        console.log(`🎮 Setting display mode to: ${mode} for committee: ${committee.value._id}`)
        
        // Emit WebSocket event to control public displays
        const eventData = {
            committeeId: committee.value._id,
            mode: mode
        }
        
        wsService.emit('set-public-display-mode', eventData)
        
        // Also try alternative event names in case backend uses different events
        wsService.emit('display-mode-change', eventData)
        wsService.emit('public-display-toggle', eventData)

        // Update local state immediately for UI feedback
        publicDisplayMode.value = mode
        toast.success(`Public display switched to ${mode === 'session' ? 'Session View' : 'Gossip Box'}`)

        // Debug: Log what we sent
        console.log(`📡 WebSocket events emitted:`, {
            events: ['set-public-display-mode', 'display-mode-change', 'public-display-toggle'],
            data: eventData
        })

    } catch (error) {
        console.error('Failed to set display mode:', error)
        toast.error('Failed to change display mode')
    }
}

// Utility methods
const getVotePercentage = (count) => {
    return totalVotes.value > 0 ? (count / totalVotes.value) * 100 : 0
}

const getVoteBarColor = (option) => {
    const colors = {
        for: 'bg-green-500',
        against: 'bg-red-500',
        abstain: 'bg-yellow-500'
    }
    return colors[option] || 'bg-gray-500'
}

// Formatting utility methods
const formatSessionMode = (mode) => {
    const modes = {
        'formal': 'Formal Debate',
        'moderated': 'Moderated Caucus',
        'unmoderated': 'Unmoderated Caucus',
        'informal': 'Informal Consultation'
    }
    return modes[mode] || mode || 'Unknown'
}

const formatSessionDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Invalid date'
    }
}

const formatSessionDuration = (startDate, endDate = null) => {
    if (!startDate) return '0m'

    try {
        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : new Date()
        const diffMs = end - start
        const diffMins = Math.floor(diffMs / 60000)
        const hours = Math.floor(diffMins / 60)
        const minutes = diffMins % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    } catch {
        return '0m'
    }
}

const getSessionStatusClass = (status) => {
    const classes = {
        'active': 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700',
        'paused': 'text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700',
        'completed': 'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700',
        'draft': 'text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700'
    }
    return classes[status] || classes.draft
}

// Event Handlers
const handleSessionCreated = async (session) => {
    currentSession.value = session
    showCreateSessionModal.value = false
    await loadSessionDetails()
    toast.success('Session created successfully')
}

const handleVotingCreated = (voting) => {
    activeVoting.value = voting
    updateVotingResults(voting)
    showQuickVoteModal.value = false
    toast.success('Voting started')
}

// Enhanced WebSocket Integration with comprehensive logging
const setupWebSocketListeners = () => {
    console.log('🎧 Setting up WebSocket listeners for dashboard')
    
    // Session events
    wsService.on('session-started', (data) => {
        console.log('📡 Received session-started:', data)
        if (data.sessionId === currentSession.value?._id) {
            loadSessionDetails()
        }
    })

    wsService.on('session-mode-changed', (data) => {
        console.log('📡 Received session-mode-changed:', data)
        if (data.sessionId === currentSession.value?._id) {
            currentSession.value.currentMode = data.mode
        }
    })

    // Public display mode events - Enhanced with multiple event listeners
    wsService.on('public-display-mode-changed', (data) => {
        console.log('📡 Received public-display-mode-changed:', data)
        if (data.committeeId === committee.value?._id) {
            publicDisplayMode.value = data.mode
            console.log(`✅ Display mode updated to: ${data.mode}`)
        }
    })

    // Alternative event listeners for display mode changes
    wsService.on('display-mode-changed', (data) => {
        console.log('📡 Received display-mode-changed:', data)
        if (data.committeeId === committee.value?._id) {
            publicDisplayMode.value = data.mode
        }
    })

    wsService.on('display-toggle', (data) => {
        console.log('📡 Received display-toggle:', data)
        if (data.committeeId === committee.value?._id) {
            publicDisplayMode.value = data.mode
        }
    })

    // Timer events - Enhanced
    wsService.on('timer-started', (data) => {
        console.log('📡 Received timer-started:', data)
        if (data.sessionId === currentSession.value?._id) {
            loadSessionDetails()
        }
    })

    wsService.on('timer-paused', (data) => {
        console.log('📡 Received timer-paused:', data)
        if (data.sessionId === currentSession.value?._id) {
            loadSessionDetails()
        }
    })

    wsService.on('timer-resumed', (data) => {
        console.log('📡 Received timer-resumed:', data)
        if (data.sessionId === currentSession.value?._id) {
            loadSessionDetails()
        }
    })

    wsService.on('timer-completed', (data) => {
        console.log('📡 Received timer-completed:', data)
        if (data.sessionId === currentSession.value?._id) {
            toast.error('Timer expired!')
            loadSessionDetails()
        }
    })

    // Speaker events
    wsService.on('speaker-list-updated', (data) => {
        console.log('📡 Received speaker-list-updated:', data)
        if (data.sessionId === currentSession.value?._id) {
            speakerQueue.value = data.speakerList
        }
    })

    wsService.on('current-speaker-changed', (data) => {
        console.log('📡 Received current-speaker-changed:', data)
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.speaker
        }
    })

    // Voting events
    wsService.on('voting-started', (data) => {
        console.log('📡 Received voting-started:', data)
        if (data.committeeId === committee.value?._id) {
            activeVoting.value = data.voting
            updateVotingResults(data.voting)
        }
    })

    wsService.on('vote-cast', (data) => {
        if (data.votingId === activeVoting.value?._id) {
            updateVotingResults(data.voting)
        }
    })

    wsService.on('voting-ended', (data) => {
        if (data.votingId === activeVoting.value?._id) {
            activeVoting.value = null
            votingResults.value = {}
        }
    })

    // Roll call events
    wsService.on('roll-call-started', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallStatus.value = 'active'
        }
    })

    wsService.on('roll-call-completed', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallStatus.value = 'completed'
            quorum.value = data.quorum
        }
    })

    wsService.on('attendance-updated', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            quorum.value = data.quorum
        }
    })

    console.log('✅ All WebSocket listeners set up for dashboard')
}

// Lifecycle
onMounted(async () => {
    await loadDashboardData()
})

onUnmounted(() => {
    stopTimerSync()
})

// Watch for active timer changes to restart sync
watch([activeSessionTimer, activeTimerType], () => {
    if (activeSessionTimer.value?.isActive) {
        startTimerSync()
    } else {
        stopTimerSync()
    }
}, { deep: true })
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>