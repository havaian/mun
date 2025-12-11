<template>
    <div class="public-display-container">
        <!-- Session View -->
        <div v-if="displayMode === 'session'" class="session-view">
            <!-- Header -->
            <div class="session-header">
                <div class="committee-info">
                    <h1 class="committee-name">{{ committeeName }}</h1>
                    <p class="session-topic">{{ sessionTopic || 'Global Sustainability Goals' }}</p>
                </div>
                <div class="mode-badge">{{ currentMode?.toUpperCase() || 'FORMAL' }}</div>
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
                <div class="gossip-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    GOSSIP BOX
                </div>
                <h1 class="gossip-title">{{ committeeName }}</h1>
            </div>

            <!-- Gossip Messages -->
            <div class="gossip-content">
                <div v-if="gossipMessages.length > 0" class="gossip-grid">
                    <div v-for="(message, index) in gossipMessages" :key="message._id || index" class="gossip-card"
                        :style="{ animationDelay: `${index * 0.1}s` }">
                        <div class="gossip-lock">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <p class="gossip-text">{{ message.content }}</p>
                        <div class="gossip-time">{{ formatTime(message.createdAt) }}</div>
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

        <!-- Footer -->
        <div class="display-footer">
            <p>This app was developed by another user. It may be inaccurate or unsafe. <a href="#">Report legal
                    issue</a></p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import apiMethods from '@/utils/api'
import { wsService } from '@/plugins/websocket'

const route = useRoute()

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

const loadPublicData = async () => {
    try {
        const committeeId = route.params.committeeId || route.query.committeeId

        if (!committeeId) {
            console.error('No committee ID provided')
            return
        }

        // Load committee info
        const committeeResponse = await apiMethods.committees.getById(committeeId)
        if (committeeResponse.data?.committee) {
            committeeName.value = committeeResponse.data.committee.name
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

            // Load full session details for timers
            const sessionDetail = await apiMethods.sessions.getById(session._id)
            if (sessionDetail.data?.session) {
                timers.value = sessionDetail.data.session.timers || {}
                currentSpeaker.value = sessionDetail.data.session.currentSpeaker

                // Build speaker queue
                const present = sessionDetail.data.session.speakerLists?.present || []
                speakerQueue.value = present.filter(s => !s.hasSpoken)
            }
        }

        // Load gossip messages
        const gossipResponse = await apiMethods.gossip.getMessages(committeeId, {
            limit: 20,
            isAnonymous: true
        })

        if (gossipResponse.data?.messages) {
            gossipMessages.value = gossipResponse.data.messages
        }

    } catch (error) {
        console.error('Failed to load public data:', error)
    }
}

const setupWebSocketListeners = () => {
    const committeeId = route.params.committeeId || route.query.committeeId

    if (!committeeId) return

    // Join committee room
    wsService.emit('join-committee-room', { committeeId })

    // Listen for display mode changes
    wsService.on('public-display-mode-changed', (data) => {
        if (data.committeeId === committeeId) {
            displayMode.value = data.mode
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

    // Listen for gossip messages
    wsService.on('gossip-message-created', (data) => {
        if (data.committeeId === committeeId) {
            gossipMessages.value.unshift(data.message)
            if (gossipMessages.value.length > 20) {
                gossipMessages.value = gossipMessages.value.slice(0, 20)
            }
        }
    })
}

const updateTimer = (timerType, timerData) => {
    if (timerType && timers.value) {
        timers.value[timerType] = timerData
    }
}

// Lifecycle
onMounted(async () => {
    await loadPublicData()
    setupWebSocketListeners()

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
})
</script>

<style scoped>
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

.mode-badge {
    background: #3b82f6;
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
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
    background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
    color: white;
    padding: 2rem;
}

.gossip-header {
    max-width: 1200px;
    margin: 0 auto 3rem;
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
    margin-bottom: 1rem;
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
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
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
}
</style>