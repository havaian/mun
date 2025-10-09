// frontend/src/stores/websocket.js
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { useToast } from '@/plugins/toast'

export const useWebSocketStore = defineStore('websocket', () => {
    const socket = ref(null)
    const isConnected = ref(false)
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5
    const toast = useToast()

    // Real-time data stores
    const sessionUpdates = reactive({})
    const votingUpdates = reactive({})
    const timerUpdates = reactive({})
    const speakerUpdates = reactive({})
    const attendanceUpdates = reactive({})
    const messageUpdates = reactive([])

    // Connection management
    const connect = () => {
        const authStore = useAuthStore()

        if (!authStore.token || socket.value?.connected) {
            return
        }

        const wsUrl = '/'

        socket.value = io(wsUrl, {
            auth: {
                token: authStore.token
            },
            transports: ['websocket', 'polling'],
            timeout: 10000,
            forceNew: true
        })

        setupEventListeners()
    }

    const disconnect = () => {
        if (socket.value) {
            socket.value.disconnect()
            socket.value = null
        }
        isConnected.value = false
        reconnectAttempts.value = 0
    }

    const setupEventListeners = () => {
        if (!socket.value) return

        // Connection events
        socket.value.on('connect', () => {
            isConnected.value = true
            reconnectAttempts.value = 0
            console.log('🔗 WebSocket connected')

            // Join user-specific rooms
            const authStore = useAuthStore()
            if (authStore.user?.committeeId) {
                socket.value.emit('join-committee', authStore.user.committeeId)
            }
        })

        socket.value.on('disconnect', (reason) => {
            isConnected.value = false
            console.log('❌ WebSocket disconnected:', reason)

            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                setTimeout(() => {
                    if (reconnectAttempts.value < maxReconnectAttempts) {
                        reconnectAttempts.value++
                        connect()
                    }
                }, 2000 * reconnectAttempts.value)
            }
        })

        socket.value.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error)
            isConnected.value = false
        })

        // Session events
        socket.value.on('session-started', (data) => {
            sessionUpdates[data.sessionId] = {
                ...data,
                status: 'active',
                timestamp: Date.now()
            }
            toast.success(`Session started: ${data.mode} mode`)
        })

        socket.value.on('session-ended', (data) => {
            sessionUpdates[data.sessionId] = {
                ...data,
                status: 'ended',
                timestamp: Date.now()
            }
            toast.info('Session ended')
        })

        socket.value.on('session-mode-changed', (data) => {
            sessionUpdates[data.sessionId] = {
                ...sessionUpdates[data.sessionId],
                ...data,
                timestamp: Date.now()
            }
            toast.info(`Debate mode changed to: ${data.newMode}`)
        })

        // Speaker events
        socket.value.on('speaker-changed', (data) => {
            speakerUpdates[data.sessionId] = {
                currentSpeaker: data.country,
                speakerEmail: data.email,
                timestamp: Date.now()
            }
        })

        socket.value.on('speaker-list-updated', (data) => {
            speakerUpdates[data.sessionId] = {
                ...speakerUpdates[data.sessionId],
                speakerList: data.speakerList,
                timestamp: Date.now()
            }
        })

        // Timer events
        socket.value.on('timer-started', (data) => {
            timerUpdates[`${data.sessionId}-${data.timerType}`] = {
                ...data,
                status: 'running',
                timestamp: Date.now()
            }
        })

        socket.value.on('timer-paused', (data) => {
            timerUpdates[`${data.sessionId}-${data.timerType}`] = {
                ...data,
                status: 'paused',
                timestamp: Date.now()
            }
        })

        socket.value.on('timer-stopped', (data) => {
            timerUpdates[`${data.sessionId}-${data.timerType}`] = {
                ...data,
                status: 'stopped',
                timestamp: Date.now()
            }
        })

        socket.value.on('timer-tick', (data) => {
            timerUpdates[`${data.sessionId}-${data.timerType}`] = {
                ...timerUpdates[`${data.sessionId}-${data.timerType}`],
                remainingTime: data.remainingTime,
                timestamp: Date.now()
            }
        })

        // Voting events
        socket.value.on('voting-started', (data) => {
            votingUpdates[data.votingId] = {
                ...data,
                status: 'active',
                timestamp: Date.now()
            }
            toast.success(`New voting: ${data.subject}`)
        })

        socket.value.on('voting-completed', (data) => {
            votingUpdates[data.votingId] = {
                ...data,
                status: 'completed',
                timestamp: Date.now()
            }
            toast.success(`Voting completed: ${data.passed ? 'PASSED' : 'FAILED'}`)
        })

        socket.value.on('vote-cast', (data) => {
            // Update voting progress without revealing individual votes
            if (votingUpdates[data.votingId]) {
                votingUpdates[data.votingId].votesCount = data.votesCount
                votingUpdates[data.votingId].timestamp = Date.now()
            }
        })

        socket.value.on('voting-progress', (data) => {
            votingUpdates[data.votingId] = {
                ...votingUpdates[data.votingId],
                ...data,
                timestamp: Date.now()
            }
        })

        // Attendance events
        socket.value.on('attendance-updated', (data) => {
            attendanceUpdates[data.sessionId] = {
                attendance: data.attendance,
                quorum: data.quorum,
                timestamp: Date.now()
            }
        })

        socket.value.on('quorum-status-changed', (data) => {
            attendanceUpdates[data.sessionId] = {
                ...attendanceUpdates[data.sessionId],
                quorum: data.quorum,
                timestamp: Date.now()
            }

            if (data.quorum.hasQuorum) {
                toast.success('Quorum achieved')
            } else {
                toast.warning('Quorum lost')
            }
        })

        // Message events
        socket.value.on('new-message', (data) => {
            messageUpdates.push({
                ...data,
                timestamp: Date.now()
            })

            const authStore = useAuthStore()
            if (data.recipientEmail === authStore.user?.email) {
                toast.info(`New message from ${data.senderCountry}`)
            }
        })

        // Emergency/announcement events
        socket.value.on('emergency-announcement', (data) => {
            toast.error(data.message, {
                duration: 10000,
                important: true
            })
        })

        socket.value.on('general-announcement', (data) => {
            toast.info(data.message, {
                duration: 5000
            })
        })
    }

    // Emit events
    const joinCommittee = (committeeId) => {
        if (socket.value?.connected) {
            socket.value.emit('join-committee', committeeId)
        }
    }

    const leaveCommittee = (committeeId) => {
        if (socket.value?.connected) {
            socket.value.emit('leave-committee', committeeId)
        }
    }

    const joinSession = (sessionId) => {
        if (socket.value?.connected) {
            socket.value.emit('join-session', sessionId)
        }
    }

    const leaveSession = (sessionId) => {
        if (socket.value?.connected) {
            socket.value.emit('leave-session', sessionId)
        }
    }

    // Getters
    const getSessionUpdate = (sessionId) => {
        return sessionUpdates[sessionId] || null
    }

    const getVotingUpdate = (votingId) => {
        return votingUpdates[votingId] || null
    }

    const getTimerUpdate = (sessionId, timerType) => {
        return timerUpdates[`${sessionId}-${timerType}`] || null
    }

    const getSpeakerUpdate = (sessionId) => {
        return speakerUpdates[sessionId] || null
    }

    const getAttendanceUpdate = (sessionId) => {
        return attendanceUpdates[sessionId] || null
    }

    const getRecentMessages = (limit = 50) => {
        return messageUpdates.slice(-limit)
    }

    // Cleanup
    const clearUpdates = () => {
        Object.keys(sessionUpdates).forEach(key => delete sessionUpdates[key])
        Object.keys(votingUpdates).forEach(key => delete votingUpdates[key])
        Object.keys(timerUpdates).forEach(key => delete timerUpdates[key])
        Object.keys(speakerUpdates).forEach(key => delete speakerUpdates[key])
        Object.keys(attendanceUpdates).forEach(key => delete attendanceUpdates[key])
        messageUpdates.splice(0, messageUpdates.length)
    }

    return {
        // State
        socket,
        isConnected,
        reconnectAttempts,

        // Data stores
        sessionUpdates,
        votingUpdates,
        timerUpdates,
        speakerUpdates,
        attendanceUpdates,
        messageUpdates,

        // Methods
        connect,
        disconnect,
        joinCommittee,
        leaveCommittee,
        joinSession,
        leaveSession,

        // Getters
        getSessionUpdate,
        getVotingUpdate,
        getTimerUpdate,
        getSpeakerUpdate,
        getAttendanceUpdate,
        getRecentMessages,
        clearUpdates
    }
})