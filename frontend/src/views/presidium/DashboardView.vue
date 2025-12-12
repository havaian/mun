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
                            {{ quorum.present || 0 }} / {{ quorum.required || 0 }}
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
            <div class="max-w-2xl mx-auto">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDaysIcon class="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">Session Management</h2>
                        <p class="text-gray-600">Start a new session to begin committee proceedings</p>
                    </div>

                    <button @click="showCreateSessionModal = true"
                        class="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium">
                        Create New Session
                    </button>
                </div>
            </div>
        </div>

        <!-- Active Session Layout -->
        <div v-else class="flex-1 flex overflow-hidden">
            <!-- Left Column: Timer & Session Controls -->
            <div class="w-80 bg-white border-r border-gray-200 p-6 space-y-6 overflow-y-auto">
                <!-- Timer Section -->
                <div class="text-center">
                    <!-- Circular Timer (clickable) -->
                    <div @click="openTimerAdjustModal()" class="cursor-pointer hover:scale-105 transition-transform">
                        <div class="relative w-48 h-48 mx-auto mb-6">
                            <svg class="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="4" />
                                <circle cx="50" cy="50" r="45" fill="none" :stroke="currentTimerColor" stroke-width="4"
                                    stroke-linecap="round" :stroke-dasharray="timerCircumference"
                                    :stroke-dashoffset="timerDashOffset" class="transition-all duration-1000" />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <div class="text-3xl font-bold text-gray-900">{{ formattedTimer }}</div>
                                <div class="text-sm text-gray-500 uppercase tracking-wide">{{ currentTimerName }}</div>
                                <div class="text-xs text-gray-400 mt-1">Click to adjust</div>
                            </div>
                        </div>
                    </div>

                    <!-- Timer Controls -->
                    <div class="flex justify-center space-x-4 mb-4">
                        <button @click="toggleTimer" :class="[
                            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                            activeTimer?.isActive && !activeTimer?.isPaused ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                        ]" :disabled="!activeTimer">
                            <PauseIcon v-if="activeTimer?.isActive && !activeTimer?.isPaused" class="w-6 h-6" />
                            <PlayIcon v-else class="w-6 h-6" />
                        </button>
                        <button @click="adjustTimerQuick(-30)"
                            class="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs font-bold"
                            :disabled="!activeTimer">
                            -30s
                        </button>
                        <button @click="adjustTimerQuick(30)"
                            class="w-12 h-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs font-bold"
                            :disabled="!activeTimer">
                            +30s
                        </button>
                    </div>

                    <!-- Timer Tiles -->
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <!-- Session/Debate Timer -->
                        <div @click="switchToTimer('session')" :class="[
                            'p-3 rounded-lg border-2 cursor-pointer transition-all',
                            activeTimerType === 'session'
                                ? 'bg-purple-50 border-purple-300 shadow-md'
                                : 'bg-white border-gray-200 hover:border-purple-200'
                        ]">
                            <div class="text-xs text-gray-500 uppercase">
                                {{ currentSession?.currentMode === 'moderated' || currentSession?.currentMode ===
                                    'unmoderated' ? 'Debate' : 'Session' }}
                            </div>
                            <div class="text-lg font-bold font-mono">
                                {{ formatTimerDisplay(sessionTimers.session) }}
                            </div>
                            <div class="text-xs"
                                :class="sessionTimers.session?.isActive ? 'text-green-600' : 'text-gray-400'">
                                {{ sessionTimers.session?.isActive ? '● Active' : 'Inactive' }}
                            </div>
                        </div>

                        <!-- Speaker Presentation Timer -->
                        <div v-if="hasSpeakerPresentationTimer" @click="switchToTimer('speaker')" :class="[
                            'p-3 rounded-lg border-2 cursor-pointer transition-all',
                            activeTimerType === 'speaker'
                                ? 'bg-blue-50 border-blue-300 shadow-md'
                                : 'bg-white border-gray-200 hover:border-blue-200'
                        ]">
                            <div class="text-xs text-gray-500 uppercase">Presentation</div>
                            <div class="text-lg font-bold font-mono">
                                {{ formatTimerDisplay(sessionTimers.speaker) }}
                            </div>
                            <div class="text-xs"
                                :class="sessionTimers.speaker?.isActive ? 'text-green-600' : 'text-gray-400'">
                                {{ sessionTimers.speaker?.country || 'No Speaker' }}
                            </div>
                        </div>

                        <!-- Speaker Q&A Timer -->
                        <div v-if="hasSpeakerQATimer" @click="switchToTimer('qa')" :class="[
                            'p-3 rounded-lg border-2 cursor-pointer transition-all',
                            activeTimerType === 'qa'
                                ? 'bg-green-50 border-green-300 shadow-md'
                                : 'bg-white border-gray-200 hover:border-green-200'
                        ]">
                            <div class="text-xs text-gray-500 uppercase">Q&A</div>
                            <div class="text-lg font-mono font-bold">
                                {{ formatTimerDisplay(sessionTimers.qa) }}
                            </div>
                            <div class="text-xs"
                                :class="sessionTimers.qa?.isActive ? 'text-green-600' : 'text-gray-400'">
                                {{ sessionTimers.qa?.isActive ? '● Active' : 'Waiting' }}
                            </div>
                        </div>

                        <!-- Additional Timers -->
                        <div v-for="timer in sessionTimers.additional" :key="timer._id"
                            @click="switchToTimer('additional', timer._id)" :class="[
                                'p-3 rounded-lg border-2 cursor-pointer transition-all',
                                activeTimerType === 'additional' && activeTimerId === timer._id
                                    ? 'bg-orange-50 border-orange-300 shadow-md'
                                    : 'bg-white border-gray-200 hover:border-orange-200'
                            ]">
                            <div class="text-xs text-gray-500 uppercase truncate">{{ timer.name }}</div>
                            <div class="text-lg font-bold font-mono">
                                {{ formatTimerDisplay(timer) }}
                            </div>
                            <div class="text-xs" :class="timer.isActive ? 'text-green-600' : 'text-gray-400'">
                                {{ timer.isActive ? '● Active' : 'Inactive' }}
                            </div>
                        </div>

                        <!-- Add Timer Button -->
                        <div @click="showAddTimerModal = true"
                            class="p-3 rounded-lg border-2 border-dashed border-gray-300 
                            cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center">
                            <div class="text-center text-gray-500">
                                <PlusIcon class="w-6 h-6 mx-auto mb-1" />
                                <div class="text-xs">Add Timer</div>
                            </div>
                        </div>
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
                            Formal
                        </button>
                        <button @click="changeMode('moderated')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            currentSession?.currentMode === 'moderated'
                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Moderated
                        </button>
                        <button @click="changeMode('unmoderated')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            currentSession?.currentMode === 'unmoderated'
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Unmoderated
                        </button>
                        <button @click="changeMode('informal')" :class="[
                            'p-3 text-sm font-medium rounded-lg border transition-colors',
                            currentSession?.currentMode === 'informal'
                                ? 'bg-gray-50 border-gray-200 text-gray-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        ]">
                            Informal
                        </button>
                    </div>

                    <!-- Roll Call Section -->
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Roll Call</span>
                            <span :class="[
                                'text-xs px-2 py-1 rounded-full',
                                rollCallStatus === 'active' ? 'bg-green-100 text-green-700' :
                                    rollCallStatus === 'completed' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                            ]">
                                {{ rollCallStatus === 'active' ? 'In Progress' :
                                    rollCallStatus === 'completed' ? 'Completed' : 'Not Started' }}
                            </span>
                        </div>

                        <div v-if="rollCallStatus === 'inactive'" class="space-y-2">
                            <button @click="startRollCall"
                                class="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Start Roll Call
                            </button>
                            <p class="text-xs text-gray-500 text-center">
                                Delegates will mark attendance
                            </p>
                        </div>

                        <div v-else-if="rollCallStatus === 'active'" class="space-y-2">
                            <button @click="endRollCall"
                                class="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                                End Roll Call
                            </button>
                            <p class="text-xs text-gray-500 text-center">
                                This will initialize speaker lists
                            </p>
                        </div>

                        <div v-else class="text-xs text-center text-green-600">
                            ✓ Roll call completed
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
                            <Ghost class="w-5 h-5" />
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
                    <span class="text-sm text-gray-500">
                        {{ speakerLists.present.length }} present
                    </span>
                </div>

                <!-- Current Speaker -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p class="text-xs text-gray-500 uppercase mb-1">CURRENT SPEAKER</p>
                    <p class="text-2xl font-bold text-gray-700 mb-3">
                        {{ currentSpeaker?.country || 'None' }}
                    </p>
                    <button @click="nextSpeaker"
                        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        :disabled="!rollCallCompleted || speakerLists.present.length === 0">
                        {{ currentSpeaker ? 'Next Speaker' : 'Start Speaking' }}
                    </button>
                </div>

                <!-- Roll Call Warning -->
                <div v-if="!rollCallCompleted" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-sm text-yellow-800">
                        ⚠️ Complete roll call first to initialize speaker lists
                    </p>
                </div>

                <!-- Present Speakers Queue -->
                <div class="flex-1 overflow-y-auto space-y-2 mb-4">
                    <div class="text-xs text-gray-500 uppercase mb-2 font-semibold">
                        Present Delegates ({{ speakerLists.present.length }})
                    </div>

                    <div v-if="speakerLists.present.length === 0" class="text-center text-gray-400 text-sm py-8">
                        No speakers yet - complete roll call first
                    </div>

                    <div v-for="(speaker, idx) in speakerLists.present" :key="speaker.country"
                        class="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm" :class="{
                            'border-blue-200 bg-blue-50': currentSpeaker?.country === speaker.country,
                            'border-gray-100': currentSpeaker?.country !== speaker.country,
                            'opacity-50': speaker.hasSpoken
                        }">
                        <div class="flex items-center space-x-3">
                            <span class="font-semibold text-gray-600 w-6">{{ speaker.position }}.</span>
                            <span class="font-medium text-gray-700">
                                {{ speaker.country }}
                            </span>

                            <!-- Indicators -->
                            <span v-if="speaker.hasMovedToEnd"
                                class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded" title="Moved to end">
                                ↓
                            </span>
                            <span v-if="speaker.hasSpoken"
                                class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ Spoke
                            </span>
                            <span v-if="speaker.arrivedLate" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                title="Arrived late">
                                Late
                            </span>
                        </div>

                        <button v-if="!speaker.hasSpoken && !speaker.hasMovedToEnd"
                            @click="moveSpeakerToEnd(speaker.country)" class="text-xs text-blue-600 hover:text-blue-800"
                            title="Move to end (once only)">
                            Move to End
                        </button>
                    </div>
                </div>

                <!-- Absent Speakers (Collapsible) -->
                <div v-if="speakerLists.absent.length > 0" class="border-t pt-3">
                    <details class="text-sm">
                        <summary class="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                            Absent Delegates ({{ speakerLists.absent.length }})
                        </summary>
                        <div class="mt-2 space-y-1">
                            <div v-for="speaker in speakerLists.absent" :key="speaker.country"
                                class="text-sm text-gray-500 pl-4">
                                • {{ speaker.country }}
                            </div>
                        </div>
                    </details>
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

        <!-- Timer Adjustment Modal -->
        <TransitionRoot :show="showTimerAdjustModal" as="template">
            <Dialog @close="showTimerAdjustModal = false">
                <div class="fixed inset-0 bg-black/30 z-50" />
                <div class="fixed inset-0 overflow-y-auto z-50">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <DialogPanel class="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                            <DialogTitle class="text-lg font-bold mb-4">
                                Adjust Timer Duration
                            </DialogTitle>

                            <div class="mb-6">
                                <label class="text-sm text-gray-600 block mb-2">Duration</label>
                                <div class="flex items-center justify-center space-x-2">
                                    <input v-model="timerMinutes" type="number" min="0" max="99"
                                        class="w-24 text-center text-3xl font-mono border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                    <span class="text-3xl font-bold text-gray-400">:</span>
                                    <input v-model="timerSeconds" type="number" min="0" max="59"
                                        class="w-24 text-center text-3xl font-mono border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div class="text-xs text-gray-500 text-center mt-2">
                                    Maximum: 99:59
                                </div>
                            </div>

                            <div class="mb-6">
                                <label class="text-sm text-gray-600 block mb-2">Quick Presets</label>
                                <div class="grid grid-cols-4 gap-2">
                                    <button @click="setPreset(1)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                                        1 min
                                    </button>
                                    <button @click="setPreset(2)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                                        2 min
                                    </button>
                                    <button @click="setPreset(5)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                                        5 min
                                    </button>
                                    <button @click="setPreset(10)"
                                        class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                                        10 min
                                    </button>
                                </div>
                            </div>

                            <div class="flex space-x-3">
                                <button @click="showTimerAdjustModal = false"
                                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                                    Cancel
                                </button>
                                <button @click="applyTimerDuration"
                                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                                    Apply
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Add Timer Modal -->
        <TransitionRoot :show="showAddTimerModal" as="template">
            <Dialog @close="showAddTimerModal = false">
                <div class="fixed inset-0 bg-black/30 z-50" />
                <div class="fixed inset-0 overflow-y-auto z-50">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <DialogPanel class="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                            <DialogTitle class="text-lg font-bold mb-4">
                                Create Additional Timer
                            </DialogTitle>

                            <div class="mb-4">
                                <label class="text-sm text-gray-600 block mb-2">Timer Name</label>
                                <input v-model="newTimerName" type="text" placeholder="e.g., Break, Discussion"
                                    class="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>

                            <div class="mb-6">
                                <label class="text-sm text-gray-600 block mb-2">Duration (minutes)</label>
                                <input v-model="newTimerMinutes" type="number" min="1" max="99"
                                    class="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>

                            <div class="flex space-x-3">
                                <button @click="showAddTimerModal = false"
                                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                                    Cancel
                                </button>
                                <button @click="createAdditionalTimer"
                                    class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                                    Create
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
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
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'

// Icons
import {
    PlayIcon, PauseIcon, CommandLineIcon, MicrophoneIcon,
    XMarkIcon, CheckCircleIcon, DocumentTextIcon, CalendarDaysIcon,
    CogIcon, ClockIcon, PresentationChartLineIcon,
    ComputerDesktopIcon, ChatBubbleOvalLeftEllipsisIcon, PlusIcon
} from '@heroicons/vue/24/outline'

import { Ghost, LaptopMinimal } from 'lucide-vue-next'

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
const sessionTimers = ref({
    session: null,
    speaker: null,
    debate: null,
    qa: null,
    additional: []
})
const activeTimer = ref(null)
const activeTimerType = ref('session')
const activeTimerId = ref(null)
const speakerLists = ref({ present: [], absent: [] })
const currentSpeaker = ref(null)
const selectedCountry = ref('')
const availableCountries = ref([])
const activeVoting = ref(null)
const votingResults = ref({})
const quorum = ref({ hasQuorum: false, present: 0, required: 0 })
const rollCallStatus = ref('inactive')
const rollCallCompleted = ref(false)
const isLoading = ref(false)
const allSessions = ref([])
const publicDisplayMode = ref('session')

// Timer adjustment modals
const showTimerAdjustModal = ref(false)
const timerMinutes = ref(0)
const timerSeconds = ref(0)
const showAddTimerModal = ref(false)
const newTimerName = ref('')
const newTimerMinutes = ref(5)

// Modals
const showCreateSessionModal = ref(false)
const showQuickVoteModal = ref(false)

// Display update interval
let displayUpdateInterval = null

// Helper: Calculate real-time remaining from timestamp
const getRealTimeRemaining = (timer) => {
    if (!timer) return 0
    if (!timer.isActive) return timer.remainingTime || timer.totalDuration || 0
    if (timer.isPaused) return timer.remainingTime || 0

    const startedAt = new Date(timer.startedAt)
    const now = new Date()
    const elapsed = Math.floor((now - startedAt) / 1000)
    const pauseTime = timer.accumulatedPause || 0
    const actualElapsed = elapsed - pauseTime
    const remaining = Math.max(0, timer.totalDuration - actualElapsed)

    return remaining
}

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
    if (!activeTimer.value) return '00:00'

    const time = getRealTimeRemaining(activeTimer.value)
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const currentTimerName = computed(() => {
    if (!activeTimer.value) return 'NO TIMER'

    if (activeTimerType.value === 'speaker') {
        return activeTimer.value.country || 'SPEAKER'
    } else if (activeTimerType.value === 'debate') {
        return 'DEBATE'
    } else if (activeTimerType.value === 'session') {
        return 'SESSION'
    } else if (activeTimerType.value === 'qa') {
        return 'Q&A'
    } else if (activeTimerType.value === 'additional') {
        return activeTimer.value.name || 'TIMER'
    }

    return 'TIMER'
})

const currentTimerColor = computed(() => {
    if (!activeTimer.value) return '#e5e7eb'

    const time = getRealTimeRemaining(activeTimer.value)

    if (time > 30) return '#22c55e' // green
    if (time > 10) return '#eab308' // yellow  
    return '#ef4444' // red
})

const timerCircumference = computed(() => {
    return 2 * Math.PI * 45
})

const timerDashOffset = computed(() => {
    if (!activeTimer.value) return timerCircumference.value

    const remaining = getRealTimeRemaining(activeTimer.value)
    const total = activeTimer.value.totalDuration || 1
    const progress = (total - remaining) / total
    return timerCircumference.value * (1 - progress)
})

const hasSpeakerPresentationTimer = computed(() => {
    const mode = currentSession.value?.currentMode
    return mode === 'formal' || mode === 'moderated' || mode === 'informal'
})

const hasSpeakerQATimer = computed(() => {
    const mode = currentSession.value?.currentMode
    return mode === 'formal' || mode === 'informal'
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

// Timer Methods
const formatTimerDisplay = (timer) => {
    if (!timer) return '--:--'

    const time = getRealTimeRemaining(timer)
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const switchToTimer = (type, id = null) => {
    activeTimerType.value = type
    activeTimerId.value = id

    if (type === 'additional') {
        activeTimer.value = sessionTimers.value.additional?.find(t => t._id === id)
    } else {
        activeTimer.value = sessionTimers.value[type]
    }
}

const openTimerAdjustModal = () => {
    if (!activeTimer.value) return

    const duration = getRealTimeRemaining(activeTimer.value)
    timerMinutes.value = Math.floor(duration / 60)
    timerSeconds.value = duration % 60

    showTimerAdjustModal.value = true
}

const setPreset = (minutes) => {
    timerMinutes.value = minutes
    timerSeconds.value = 0
}

const applyTimerDuration = async () => {
    const totalSeconds = (parseInt(timerMinutes.value) || 0) * 60 + (parseInt(timerSeconds.value) || 0)

    if (totalSeconds === 0 || totalSeconds > 5999) {
        toast.error('Invalid duration. Must be between 00:01 and 99:59')
        return
    }

    try {
        const response = await apiMethods.sessions.adjustTimer(currentSession.value._id, {
            timerType: activeTimerType.value,
            timerId: activeTimerId.value,
            newTime: totalSeconds
        })

        if (response.data.success) {
            if (activeTimerType.value === 'additional') {
                const idx = sessionTimers.value.additional.findIndex(t => t._id === activeTimerId.value)
                if (idx !== -1) {
                    sessionTimers.value.additional[idx] = response.data.timer
                }
            } else {
                sessionTimers.value[activeTimerType.value] = response.data.timer
            }

            activeTimer.value = response.data.timer
            toast.success('Timer duration updated')
            showTimerAdjustModal.value = false
        }
    } catch (error) {
        console.error('Failed to adjust timer:', error)
        toast.error('Failed to update timer duration')
    }
}

const createAdditionalTimer = async () => {
    if (!newTimerName.value.trim()) {
        toast.error('Please enter a timer name')
        return
    }

    try {
        const response = await apiMethods.sessions.addAdditionalTimer(currentSession.value._id, {
            name: newTimerName.value.trim(),
            duration: (parseInt(newTimerMinutes.value) || 5) * 60
        })

        if (response.data.success) {
            sessionTimers.value = response.data.timers
            toast.success('Timer created')
            showAddTimerModal.value = false
            newTimerName.value = ''
            newTimerMinutes.value = 5
        }
    } catch (error) {
        console.error('Failed to create timer:', error)
        toast.error('Failed to create timer')
    }
}

const toggleTimer = async () => {
    if (!activeTimer.value || !currentSession.value) return

    try {
        const response = await apiMethods.sessions.toggleTimer(currentSession.value._id, {
            timerType: activeTimerType.value,
            timerId: activeTimerId.value
        })

        if (response.data.success) {
            if (activeTimerType.value === 'additional') {
                const idx = sessionTimers.value.additional.findIndex(t => t._id === activeTimerId.value)
                if (idx !== -1) {
                    sessionTimers.value.additional[idx] = response.data.timer
                }
            } else {
                sessionTimers.value[activeTimerType.value] = response.data.timer
            }

            activeTimer.value = response.data.timer
            toast.success(`Timer ${response.data.timer.isPaused ? 'paused' : 'resumed'}`)
        }
    } catch (error) {
        console.error('Failed to toggle timer:', error)
        toast.error('Failed to toggle timer')
    }
}

const adjustTimerQuick = async (seconds) => {
    if (!activeTimer.value || !currentSession.value) return

    try {
        const currentTime = getRealTimeRemaining(activeTimer.value)
        const newTime = Math.max(0, currentTime + seconds)

        const response = await apiMethods.sessions.adjustTimer(currentSession.value._id, {
            timerType: activeTimerType.value,
            timerId: activeTimerId.value,
            newTime: newTime
        })

        if (response.data.success) {
            if (activeTimerType.value === 'additional') {
                const idx = sessionTimers.value.additional.findIndex(t => t._id === activeTimerId.value)
                if (idx !== -1) {
                    sessionTimers.value.additional[idx] = response.data.timer
                }
            } else {
                sessionTimers.value[activeTimerType.value] = response.data.timer
            }

            activeTimer.value = response.data.timer
            toast.success(`Timer adjusted by ${seconds > 0 ? '+' : ''}${seconds}s`)
        }
    } catch (error) {
        console.error('Failed to adjust timer:', error)
        // Optimistic update
        const currentTime = getRealTimeRemaining(activeTimer.value)
        activeTimer.value.remainingTime = Math.max(0, currentTime + seconds)
    }
}

// Data Loading Methods
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
            sort: '-sessionNumber'
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
        const sessionResponse = await apiMethods.sessions.getById(currentSession.value._id)
        if (sessionResponse.data.success) {
            const sessionData = sessionResponse.data.session
            currentSession.value = sessionData

            // Load timers
            if (sessionData.timers) {
                sessionTimers.value = sessionData.timers

                // Set active timer (priority: speaker > debate > session)
                if (sessionData.timers.speaker?.isActive) {
                    activeTimer.value = sessionData.timers.speaker
                    activeTimerType.value = 'speaker'
                } else if (sessionData.timers.debate?.isActive) {
                    activeTimer.value = sessionData.timers.debate
                    activeTimerType.value = 'debate'
                } else if (sessionData.timers.session?.isActive) {
                    activeTimer.value = sessionData.timers.session
                    activeTimerType.value = 'session'
                } else if (sessionData.timers.qa?.isActive) {
                    activeTimer.value = sessionData.timers.qa
                    activeTimerType.value = 'qa'
                } else {
                    activeTimer.value = sessionData.timers.session
                    activeTimerType.value = 'session'
                }
            }

            // Load speaker lists
            speakerLists.value = sessionData.speakerLists || { present: [], absent: [] }
            currentSpeaker.value = sessionData.currentSpeaker || null

            // Roll call status
            rollCallStatus.value = sessionData.rollCall?.isActive ? 'active' :
                sessionData.rollCall?.endedAt ? 'completed' : 'inactive'
            rollCallCompleted.value = !!sessionData.rollCall?.endedAt

            quorum.value = sessionData.quorum || { hasQuorum: false, present: 0, required: 0 }
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

        wsService.joinSession(currentSession.value._id)

    } catch (error) {
        console.error('Failed to load session details:', error)
        toast.error('Failed to load session details')
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

// Session Management
const createQuickSession = async () => {
    try {
        isLoading.value = true

        const sessionData = {
            committeeId: committee.value._id,
            sessionNumber: allSessions.value.length + 1,
            currentMode: 'formal',
            modeSettings: {
                speechTime: 180,
                questionsAllowed: true
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
        const response = await sessionApi.sessions.end(currentSession.value._id)

        if (response.data.success) {
            currentSession.value = null
            await loadAllSessions()
            toast.success('Session ended successfully')
        }
    } catch (error) {
        console.error('Failed to end session:', error)
        toast.error('Failed to end session')
    }
}

// Roll Call
const startRollCall = async () => {
    if (!currentSession.value) return

    try {
        const response = await apiMethods.sessions.startRollCall(currentSession.value._id, {
            timeLimit: 10
        })

        if (response.data.success) {
            rollCallStatus.value = 'active'
            toast.success('Roll call started - Delegates can now mark attendance')
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
            rollCallCompleted.value = true

            speakerLists.value = response.data.speakerLists || { present: [], absent: [] }
            quorum.value = response.data.quorum

            toast.success(`Roll call completed! ${speakerLists.value.present.length} present, ${speakerLists.value.absent.length} absent`)
        }
    } catch (error) {
        console.error('Failed to end roll call:', error)
        toast.error('Failed to end roll call')
    }
}

// Speaker Management
const nextSpeaker = async () => {
    if (!currentSession.value || speakerLists.value.present.length === 0) {
        toast.warn('No speakers in queue')
        return
    }

    try {
        const nextSpeakerData = speakerLists.value.present.find(s => !s.hasSpoken)

        if (!nextSpeakerData) {
            toast.log('All speakers have spoken')
            return
        }

        const response = await apiMethods.sessions.setCurrentSpeaker(currentSession.value._id, {
            country: nextSpeakerData.country
        })

        if (response.data.success) {
            currentSpeaker.value = response.data.currentSpeaker
            speakerLists.value = response.data.speakerLists

            // Speaker timer auto-started by backend
            if (response.data.speakerTimer) {
                sessionTimers.value.speaker = response.data.speakerTimer
                activeTimer.value = response.data.speakerTimer
                activeTimerType.value = 'speaker'
            }

            toast.success(`Now speaking: ${nextSpeakerData.country}`)
        }
    } catch (error) {
        console.error('Failed to set next speaker:', error)
        toast.error('Failed to set next speaker')
    }
}

const moveSpeakerToEnd = async (country) => {
    if (!currentSession.value) return

    try {
        const response = await apiMethods.sessions.moveToEnd(currentSession.value._id, {
            country: country
        })

        if (response.data.success) {
            speakerLists.value = response.data.speakerLists
            toast.success(`${country} moved to end of queue`)
        }
    } catch (error) {
        console.error('Failed to move speaker:', error)
        toast.error(error.response?.data?.error || 'Failed to move speaker')
    }
}

// Mode Management
const changeMode = async (newMode) => {
    if (!currentSession.value || currentSession.value.currentMode === newMode) return

    try {
        let settings = {}

        if (newMode === 'moderated') {
            settings = {
                speechTime: 90,
                totalTime: 600,
                topic: 'Discussion Topic',
                questionsAllowed: false
            }
        } else if (newMode === 'unmoderated') {
            settings = {
                totalTime: 600
            }
        } else if (newMode === 'formal') {
            settings = {
                speechTime: 180,
                questionsAllowed: true
            }
        } else if (newMode === 'informal') {
            settings = {
                speechTime: 120,
                allowPassToNext: true
            }
        }

        const response = await apiMethods.sessions.changeMode(currentSession.value._id, {
            mode: newMode,
            settings: settings
        })

        if (response.data.success) {
            currentSession.value.currentMode = response.data.currentMode
            sessionTimers.value = response.data.timers || sessionTimers.value

            toast.success(`Mode changed to ${formattedMode.value}`)
        }
    } catch (error) {
        console.error('Failed to change mode:', error)
        toast.error('Failed to change mode')
    }
}

// Voting
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

// Display Mode
const setDisplayMode = async (mode) => {
    if (!['session', 'gossip'].includes(mode)) {
        console.error('Invalid display mode:', mode)
        return
    }
    
    if (!committee.value?._id) {
        toast.error('Committee not loaded')
        return
    }
    
    try {
        console.log('🎮 Setting display mode to:', mode)
        
        // UPDATE DATABASE via API
        const response = await apiMethods.committees.setDisplayMode(
            committee.value._id, 
            mode
        )
        
        if (response.data?.success) {
            publicDisplayMode.value = mode
            
            const modeLabel = mode === 'session' ? 'Session View' : 'Gossip Box'
            toast.success(`Public display: ${modeLabel}`)
        }
    } catch (error) {
        console.error('Failed to set display mode:', error)
        toast.error('Failed to change display mode')
    }
}

// Utility Methods
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

// WebSocket
const setupWebSocketListeners = () => {
    console.log('🎧 Setting up WebSocket listeners')

    if (committee.value?._id) {
        wsService.emit('join-committee-room', {
            committeeId: committee.value._id
        })
    }

    // Timer state sync
    wsService.on('timer-state-sync', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            sessionTimers.value = data.timers

            // Update active timer
            if (activeTimerType.value === 'additional') {
                activeTimer.value = data.timers.additional?.find(t => t._id === activeTimerId.value)
            } else if (activeTimerType.value && data.timers[activeTimerType.value]) {
                activeTimer.value = data.timers[activeTimerType.value]
            }
        }
    })

    // Display mode
    wsService.on('public-display-mode-changed', (data) => {
        console.log('🎬 Display mode changed:', data)
        if (data.committeeId === committee.value?._id) {
            publicDisplayMode.value = data.mode
            const modeLabel = data.mode === 'session' ? 'Session View' : 'Gossip Box'
            toast.log(`Display switched to ${modeLabel}`)
        }
    })

    // Roll call
    wsService.on('roll-call-started', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallStatus.value = 'active'
            toast.log('Roll call started')
        }
    })

    wsService.on('roll-call-ended', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallStatus.value = 'completed'
            rollCallCompleted.value = true
            
            // Update speaker lists from response
            speakerLists.value = data.speakerLists || { present: [], absent: [] }
            quorum.value = data.quorum
            
            toast.success(`Roll call completed! ${speakerLists.value.present.length} present`)
        }
    })

    wsService.on('late-arrival-marked', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            console.log('Late arrival marked:', data.country)
            
            // Update speaker lists - delegate added to END
            if (data.speakerLists) {
                speakerLists.value = data.speakerLists
            }
            
            // Update quorum if changed
            if (data.quorum) {
                quorum.value = data.quorum
            }
            
            toast.log(`${data.country} arrived late and added to end of speaker list`)
        }
    })

    // Attendance
    wsService.on('attendance-updated', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            if (data.quorum) {
                quorum.value = data.quorum
            }
            
            // Handle speaker list updates (for late arrivals during session)
            if (data.speakerLists) {
                speakerLists.value = data.speakerLists
            }
        }
    })

    // Speakers
    wsService.on('current-speaker-set', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.currentSpeaker
            speakerLists.value = data.speakerLists
            if (data.speakerTimer) {
                sessionTimers.value.speaker = data.speakerTimer
                activeTimer.value = data.speakerTimer
                activeTimerType.value = 'speaker'
            }
        }
    })

    wsService.on('speaker-moved', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            speakerLists.value = data.speakerLists
        }
    })

    // Timers
    wsService.on('timer-started', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            loadSessionDetails()
        }
    })

    wsService.on('timer-toggled', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            if (data.timerType === 'additional') {
                const idx = sessionTimers.value.additional?.findIndex(t => t._id === data.timer._id)
                if (idx !== -1) {
                    sessionTimers.value.additional[idx] = data.timer
                }
            } else {
                sessionTimers.value[data.timerType] = data.timer
            }

            if (activeTimerType.value === data.timerType) {
                activeTimer.value = data.timer
            }
        }
    })

    wsService.on('timer-adjusted', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            if (data.timerType === 'additional') {
                const idx = sessionTimers.value.additional?.findIndex(t => t._id === data.timer._id)
                if (idx !== -1) {
                    sessionTimers.value.additional[idx] = data.timer
                }
            } else {
                sessionTimers.value[data.timerType] = data.timer
            }

            if (activeTimerType.value === data.timerType) {
                activeTimer.value = data.timer
            }
        }
    })

    // Mode
    wsService.on('mode-changed', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentSession.value.currentMode = data.mode
            if (data.timers) {
                sessionTimers.value = data.timers
            }
            toast.log(`Mode changed to ${data.mode}`)
        }
    })

    // Voting
    wsService.on('voting-started', (data) => {
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

    console.log('✅ WebSocket listeners ready')
}

// Lifecycle
onMounted(async () => {
    await loadDashboardData()

    // Update display every second
    displayUpdateInterval = setInterval(() => {
        if (activeTimer.value?.isActive && !activeTimer.value?.isPaused) {
            // Trigger reactive update
            activeTimer.value = { ...activeTimer.value }
        }
    }, 1000)
})

onUnmounted(() => {
    if (displayUpdateInterval) {
        clearInterval(displayUpdateInterval)
    }
})
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