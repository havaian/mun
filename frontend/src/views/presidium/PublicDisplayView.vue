<template>
    <div class="public-display-container" ref="displayContainer">
        <!-- Session View -->
        <div v-if="displayMode === 'session'" class="session-view">
            <!-- Header -->
            <div class="session-header">
                <div class="committee-info">
                    <h1 class="committee-name">{{ committeeName }}</h1>
                    <p class="session-topic">{{ sessionTopic || 'Global Sustainability Goals' }}</p>
                </div>
                <div class="header-actions">
                    <div class="mode-badge">{{ currentMode?.toUpperCase() || 'FORMAL' }}</div>
                    <button @click="toggleFullscreen" class="fullscreen-btn"
                        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'">
                        <svg v-if="!isFullscreen" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="content-grid">
                <!-- Left Column - Timer & Speaker -->
                <div class="left-column">
                    <!-- Timer Card -->
                    <div class="timer-card">
                        <div class="timer-label">
                            <svg class="timer-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                                <path d="M12 6v6l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <span>{{ timerLabel }}</span>
                        </div>
                        <div class="timer-display">{{ formattedTime }}</div>
                    </div>

                    <!-- Current Speaker Card -->
                    <div class="speaker-card">
                        <div class="speaker-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="currentColor"
                                    stroke-width="2" />
                                <circle cx="11" cy="7" r="4" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                        <div class="speaker-label">CURRENT SPEAKER</div>
                        <div class="speaker-name">{{ currentSpeakerName || 'Floor Open' }}</div>
                    </div>
                </div>

                <!-- Right Column - Speakers Queue -->
                <div class="right-column">
                    <div class="queue-card">
                        <h3 class="queue-title">Speakers Queue</h3>
                        <div v-if="speakerQueue.length > 0" class="queue-list">
                            <div v-for="(speaker, index) in speakerQueue.slice(0, 10)" :key="index" class="queue-item">
                                <div class="queue-position">{{ index + 1 }}</div>
                                <div class="queue-country">{{ speaker.country }}</div>
                            </div>
                        </div>
                        <div v-else class="queue-empty">
                            <p>No speakers queued.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gossip Box View -->
        <div v-else class="gossip-view">
            <!-- Header -->
            <div class="gossip-header">
                <div class="gossip-header-top">
                    <div class="gossip-badge">
                        <VenetianMask class="w-10 h-10" />
                        GOSSIP BOX
                    </div>
                    <button @click="toggleFullscreen" class="fullscreen-btn gossip-fullscreen-btn"
                        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'">
                        <svg v-if="!isFullscreen" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
                <h1 class="gossip-title">{{ committeeName }}</h1>
            </div>

            <!-- Gossip Messages -->
            <div class="gossip-content">
                <div v-if="gossipMessages.length > 0" class="gossip-grid">
                    <div v-for="(message, index) in gossipMessages" :key="message._id || index" class="gossip-card"
                        :style="{ animationDelay: `${index * 0.1}s` }">
                        <div class="gossip-lock">
                            <Ghost class="w-5 h-5" />
                        </div>
                        <p class="gossip-text">{{ message.content }}</p>
                        <div class="gossip-time">{{ formatTime(message.timestamp) }}</div>
                    </div>
                </div>
                <div v-else class="gossip-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                            stroke-width="2" />
                    </svg>
                    <p>No gossip messages yet</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiMethods } from '@/utils/api'
import { wsService } from '@/plugins/websocket'
import { useAuthStore } from '@/stores/auth'

import { Ghost, VenetianMask } from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

// Refs
const committeeName = ref('UN General Assembly')
const sessionTopic = ref('')
const currentMode = ref('formal')
const displayMode = ref('session') // 'session' or 'gossip'
const currentSession = ref(null)
const timers = ref({})
const activeTimerType = ref('session')
const currentSpeaker = ref(null)
const speakerQueue = ref([])
const gossipMessages = ref([])
const displayUpdateInterval = ref(null)
const committee = ref(null)
const displayContainer = ref(null)
const isFullscreen = ref(false)

// Computed
const timerLabel = computed(() => {
    const labels = {
        session: 'SESSION TIME',
        debate: 'DEBATE TIME',
        speaker: 'SPEAKER TIME',
        qa: 'Q&A TIME'
    }
    return labels[activeTimerType.value] || 'TIMER'
})

const activeTimer = computed(() => {
    return timers.value[activeTimerType.value]
})

const currentSpeakerName = computed(() => {
    if (!currentSpeaker.value?.country) return 'Floor Open'
    return currentSpeaker.value.country
})

const formattedTime = computed(() => {
    const timer = activeTimer.value
    if (!timer) return '00:00'

    const remaining = getRealTimeRemaining(timer)
    const minutes = Math.floor(remaining / 60)
    const seconds = Math.floor(remaining % 60)

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// Methods
const getRealTimeRemaining = (timer) => {
    if (!timer) return 0
    if (!timer.isActive) return timer.totalDuration || 0
    if (timer.isPaused) return timer.remainingTime || 0

    const now = Date.now()
    const startTime = new Date(timer.startedAt).getTime()
    const elapsed = Math.floor((now - startTime) / 1000)
    const pauseDuration = timer.accumulatedPause || 0
    const actualElapsed = elapsed - pauseDuration

    return Math.max(0, (timer.totalDuration || 0) - actualElapsed)
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

const toggleFullscreen = async () => {
    try {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            await displayContainer.value?.requestFullscreen()
        } else {
            // Exit fullscreen
            await document.exitFullscreen()
        }
    } catch (error) {
        console.error('Error toggling fullscreen:', error)
    }
}

const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
}

const loadGossipMessages = async () => {
    try {
        const committeeId = committee.value?._id
        if (!committeeId) return

        console.log('📨 Loading gossip messages for committee:', committeeId)

        // Fetch gossip channel conversation
        const response = await apiMethods.messages.getCommitteeConversation(
            committeeId,
            'gossip'
        )

        if (response.data?.success && response.data.conversation) {
            const messages = response.data.conversation.messages || []
            // Sort by timestamp descending (newest first) and take last 20
            gossipMessages.value = messages
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20)

            console.log('✅ Loaded', gossipMessages.value.length, 'gossip messages')
        }
    } catch (error) {
        console.error('Failed to load gossip messages:', error)
        gossipMessages.value = []
    }
}

const loadPublicData = async () => {
    try {
        committee.value = authStore.user?.committee || authStore.user?.committeeId
        if (!committee.value) {
            throw new Error('No committee assigned')
        }

        const committeeId = committee.value._id
        if (!committeeId) {
            console.error('No committee ID provided')
            return
        }

        console.log('📊 Loading public data for committee:', committeeId)

        // LOAD COMMITTEE INFO AND DISPLAY MODE
        const committeeResponse = await apiMethods.committees.getById(committeeId)
        if (committeeResponse.data?.committee) {
            committeeName.value = committeeResponse.data.committee.name

            // FETCH CURRENT DISPLAY MODE FROM DATABASE
            try {
                const modeResponse = await apiMethods.committees.getDisplayMode(committeeId)
                if (modeResponse.data?.displayMode) {
                    displayMode.value = modeResponse.data.displayMode
                    console.log('✅ Loaded display mode:', displayMode.value)
                }
            } catch (err) {
                console.warn('Could not load display mode, using default:', err)
                displayMode.value = 'session'
            }
        }

        // Load active session
        const sessionsResponse = await apiMethods.sessions.getAll(committeeId, {
            status: 'active',
            limit: 1
        })

        if (sessionsResponse.data?.sessions?.length > 0) {
            const session = sessionsResponse.data.sessions[0]
            currentSession.value = session
            currentMode.value = session.currentMode
            sessionTopic.value = session.modeSettings?.topic || ''

            // Load full session details
            const sessionDetail = await apiMethods.sessions.getById(session._id)
            if (sessionDetail.data?.session) {
                timers.value = sessionDetail.data.session.timers || {}
                currentSpeaker.value = sessionDetail.data.session.currentSpeaker

                const present = sessionDetail.data.session.speakerLists?.present || []
                speakerQueue.value = present.filter(s => !s.hasSpoken)
            }
        }

        // Load gossip messages
        await loadGossipMessages()

        console.log('✅ Public data loaded successfully')

    } catch (error) {
        console.error('Failed to load public data:', error)
    }
}

const setupWebSocketListeners = () => {
    const committeeId = committee.value?._id

    if (!committeeId) return

    console.log('🔧 Setting up WebSocket listeners for committee:', committeeId)

    // Join committee room
    wsService.emit('join-committee-room', { committeeId })

    // Listen for display mode changes
    wsService.on('public-display-mode-changed', (data) => {
        console.log('🎬 Display mode changed:', data)
        if (data.committeeId === committeeId) {
            displayMode.value = data.mode
            console.log('✅ Display mode updated to:', displayMode.value)
        }
    })

    // Listen for timer updates
    wsService.on('timer-toggled', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            updateTimer(data.timerType, data.timer)
        }
    })

    wsService.on('timer-adjusted', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            updateTimer(data.timerType, data.timer)
        }
    })

    // Listen for speaker changes
    wsService.on('current-speaker-set', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentSpeaker.value = data.currentSpeaker
            if (data.speakerLists?.present) {
                speakerQueue.value = data.speakerLists.present.filter(s => !s.hasSpoken)
            }
        }
    })

    wsService.on('speaker-moved', (data) => {
        if (data.sessionId === currentSession.value?._id && data.speakerLists?.present) {
            speakerQueue.value = data.speakerLists.present.filter(s => !s.hasSpoken)
        }
    })

    // Listen for mode changes
    wsService.on('mode-changed', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            currentMode.value = data.mode
            if (data.timers) {
                timers.value = data.timers
            }
        }
    })

    // Listen for new gossip messages (committee-wide messages)
    wsService.on('committee-message-received', (data) => {
        console.log('📨 Committee message received:', data)
        if (data.committeeId === committeeId && data.channelType === 'gossip') {
            // Add new message to the beginning (newest first)
            const newMessage = {
                _id: data.messageId,
                senderCountry: data.senderCountry,
                content: data.content,
                timestamp: data.timestamp,
                messageType: data.messageType
            }

            gossipMessages.value.unshift(newMessage)

            // Keep only last 20 messages
            if (gossipMessages.value.length > 20) {
                gossipMessages.value = gossipMessages.value.slice(0, 20)
            }

            console.log('✅ Gossip message added, total:', gossipMessages.value.length)
        }
    })

    console.log('✅ WebSocket listeners ready')
}

const updateTimer = (timerType, timerData) => {
    if (timerType && timers.value) {
        timers.value[timerType] = timerData
    }
}

// Watch for display mode changes to reload gossip messages
watch(displayMode, async (newMode, oldMode) => {
    console.log('🔄 Display mode changed from', oldMode, 'to', newMode)
    if (newMode === 'gossip' && oldMode !== 'gossip') {
        // Reload gossip messages when switching to gossip view
        await loadGossipMessages()
    }
})

// Lifecycle
onMounted(async () => {
    console.log('🚀 Public Display mounted')
    await loadPublicData()
    setupWebSocketListeners()

    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // Update display every second for smooth countdown
    displayUpdateInterval.value = setInterval(() => {
        // Trigger reactivity
        if (activeTimer.value?.isActive && !activeTimer.value?.isPaused) {
            timers.value = { ...timers.value }
        }
    }, 1000)
})

onUnmounted(() => {
    if (displayUpdateInterval.value) {
        clearInterval(displayUpdateInterval.value)
    }
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
/* ... (styles remain exactly the same) ... */
.public-display-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* ==================== SESSION VIEW ==================== */
.session-view {
    flex: 1;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: white;
    padding: 2rem;
}

.session-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 3rem;
}

.committee-info h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: white;
}

.committee-info p {
    font-size: 1rem;
    color: #94a3b8;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.mode-badge {
    background: #3b82f6;
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
}

.fullscreen-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 44px;
    height: 44px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.fullscreen-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.fullscreen-btn:active {
    transform: scale(0.95);
}

.content-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    max-width: 1600px;
    margin: 0 auto;
}

.left-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.timer-card {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    border-radius: 1.5rem;
    padding: 3rem;
    text-align: center;
}

.timer-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    margin-bottom: 2rem;
    text-transform: uppercase;
}

.timer-icon {
    color: #94a3b8;
}

.timer-display {
    font-size: 8rem;
    font-weight: 700;
    line-height: 1;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    letter-spacing: -0.05em;
    color: white;
}

.speaker-card {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    border-radius: 1.5rem;
    padding: 3rem;
    text-align: center;
}

.speaker-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(148, 163, 184, 0.1);
    border-radius: 50%;
    color: #94a3b8;
}

.speaker-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin-bottom: 1rem;
    text-transform: uppercase;
}

.speaker-name {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
}

.right-column {
    display: flex;
    flex-direction: column;
}

.queue-card {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    border-radius: 1.5rem;
    padding: 2rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.queue-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
    color: white;
}

.queue-list {
    flex: 1;
    overflow-y: auto;
}

.queue-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
    background: rgba(148, 163, 184, 0.05);
    transition: background 0.2s;
}

.queue-item:hover {
    background: rgba(148, 163, 184, 0.1);
}

.queue-position {
    width: 32px;
    height: 32px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #3b82f6;
    flex-shrink: 0;
}

.queue-country {
    font-size: 1rem;
    color: white;
    font-weight: 500;
}

.queue-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-style: italic;
}

/* ==================== GOSSIP VIEW ==================== */
.gossip-view {
    flex: 1;
    background: linear-gradient(135deg, #330b78 0%, #07266b 100%);
    color: white;
    padding: 2rem;
}

.gossip-header {
    max-width: 1200px;
    margin: 0 auto 3rem;
}

.gossip-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.gossip-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
}

.gossip-fullscreen-btn {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
}

.gossip-fullscreen-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.gossip-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 0;
    color: white;
    text-align: center;
}

.gossip-content {
    max-width: 1200px;
    margin: 0 auto;
}

.gossip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
}

.gossip-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.3s;
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.gossip-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.gossip-lock {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    color: white;
}

.gossip-text {
    font-size: 1rem;
    line-height: 1.6;
    color: white;
    margin: 0 0 1rem 0;
    min-height: 60px;
}

.gossip-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.gossip-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: rgba(255, 255, 255, 0.6);
}

.gossip-empty svg {
    margin-bottom: 1rem;
    stroke: rgba(255, 255, 255, 0.4);
}

.gossip-empty p {
    font-size: 1.25rem;
    font-style: italic;
}

/* ==================== FOOTER ==================== */
.display-footer {
    background: #0f172a;
    padding: 1rem;
    text-align: center;
    color: #64748b;
    font-size: 0.875rem;
}

.display-footer a {
    color: #3b82f6;
    text-decoration: none;
}

.display-footer a:hover {
    text-decoration: underline;
}

/* ==================== FULLSCREEN MODE ==================== */
.public-display-container:fullscreen {
    background: #0f172a;
}

.public-display-container:fullscreen .session-view,
.public-display-container:fullscreen .gossip-view {
    min-height: 100vh;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1200px) {
    .content-grid {
        grid-template-columns: 1fr;
    }

    .right-column {
        max-height: 400px;
    }
}

@media (max-width: 768px) {

    .session-view,
    .gossip-view {
        padding: 1rem;
    }

    .session-header {
        flex-direction: column;
        gap: 1rem;
    }

    .header-actions {
        width: 100%;
        justify-content: space-between;
    }

    .committee-info h1 {
        font-size: 1.5rem;
    }

    .gossip-title {
        font-size: 2rem;
    }

    .timer-display {
        font-size: 4rem;
    }

    .speaker-name {
        font-size: 1.5rem;
    }

    .gossip-grid {
        grid-template-columns: 1fr;
    }

    .queue-card {
        max-height: 300px;
    }
}

@media (max-width: 480px) {

    .timer-card,
    .speaker-card,
    .queue-card {
        padding: 1.5rem;
    }

    .timer-display {
        font-size: 3rem;
    }

    .speaker-icon {
        width: 60px;
        height: 60px;
    }

    .gossip-title {
        font-size: 1.5rem;
    }

    .fullscreen-btn {
        width: 40px;
        height: 40px;
    }
}
</style>