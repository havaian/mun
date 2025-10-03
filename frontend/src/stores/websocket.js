// frontend/src/stores/websocket.js
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('websocket', () => {
    const socket = ref(null)
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5
    const connectionState = ref('disconnected') // 'disconnected', 'connecting', 'connected'

    // Helper function to safely use toast
    const showToast = (type, message, options = {}) => {
        try {
            const { useToast } = require('@/plugins/toast')
            const toast = useToast()
            toast[type](message, options)
        } catch (error) {
            // Fallback to console if toast is not available
            console.log(`${type.toUpperCase()}: ${message}`)
        }
    }

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
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            try {
                isConnecting.value = true
                connectionState.value = 'connecting'

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

                // Handle connection success
                socket.value.on('connect', () => {
                    isConnected.value = true
                    isConnecting.value = false
                    connectionState.value = 'connected'
                    reconnectAttempts.value = 0
                    console.log('🔗 WebSocket connected')
                    resolve()
                })

                // Handle connection error
                socket.value.on('connect_error', (error) => {
                    isConnecting.value = false
                    connectionState.value = 'disconnected'
                    console.error('WebSocket connection error:', error)
                    reject(error)
                })

            } catch (error) {
                isConnecting.value = false
                connectionState.value = 'disconnected'
                reject(error)
            }
        })
    }

    const disconnect = () => {
        if (socket.value) {
            socket.value.disconnect()
            socket.value = null
        }
        isConnected.value = false
        isConnecting.value = false
        connectionState.value = 'disconnected'
        reconnectAttempts.value = 0
    }

    const setupEventListeners = () => {
        if (!socket.value) return

        // Connection events
        socket.value.on('connect', () => {
            isConnected.value = true
            isConnecting.value = false
            connectionState.value = 'connected'
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
            connectionState.value = 'disconnected'
            console.log('🔌 WebSocket disconnected:', reason)

            // Show notification for unexpected disconnections
            if (reason === 'io server disconnect') {
                showToast('warning', 'Server disconnected. Please refresh the page.')
            } else if (reason === 'transport close' || reason === 'transport error') {
                showToast('warning', 'Connection lost. Attempting to reconnect...')
            }
        })

        socket.value.on('connect_error', (error) => {
            isConnecting.value = false
            connectionState.value = 'disconnected'
            console.error('WebSocket connection error:', error)

            reconnectAttempts.value++

            if (reconnectAttempts.value <= maxReconnectAttempts) {
                setTimeout(() => {
                    if (reconnectAttempts.value <= maxReconnectAttempts) {
                        console.log(`Reconnection attempt ${reconnectAttempts.value}/${maxReconnectAttempts}`)
                        socket.value?.connect()
                    }
                }, Math.pow(2, reconnectAttempts.value) * 1000) // Exponential backoff
            } else {
                showToast('error', 'Unable to connect to server. Please check your connection and refresh the page.')
            }
        })

        socket.value.on('reconnect', (attemptNumber) => {
            console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts')
            showToast('success', 'Connection restored!')
        })

        // Session events
        socket.value.on('session-update', (data) => {
            sessionUpdates[data.sessionId] = data

            // Notify about important session changes
            if (data.type === 'status-change') {
                if (data.status === 'active') {
                    showToast('info', `Session "${data.sessionName}" has started`)
                } else if (data.status === 'paused') {
                    showToast('warning', `Session "${data.sessionName}" has been paused`)
                } else if (data.status === 'ended') {
                    showToast('info', `Session "${data.sessionName}" has ended`)
                }
            }
        })

        // Voting events
        socket.value.on('voting-update', (data) => {
            votingUpdates[data.votingId] = data

            if (data.type === 'voting-started') {
                showToast('info', `Voting started: ${data.topic}`, { duration: 5000 })
            } else if (data.type === 'voting-ended') {
                const result = data.result?.passed ? 'passed' : 'failed'
                showToast('info', `Voting ended: ${data.topic} - ${result}`)
            }
        })

        // Timer events
        socket.value.on('timer-update', (data) => {
            timerUpdates[`${data.sessionId}-${data.type}`] = data
        })

        socket.value.on('timer-warning', (data) => {
            if (data.timeRemaining <= 60) { // 1 minute warning
                showToast('warning', `Time warning: ${data.timeRemaining} seconds remaining`)
            }
        })

        socket.value.on('timer-expired', (data) => {
            showToast('error', 'Time expired!', { duration: 3000 })
        })

        // Speaker list events
        socket.value.on('speaker-update', (data) => {
            speakerUpdates[data.sessionId] = data

            const authStore = useAuthStore()
            if (data.type === 'speaker-added' && data.speakerEmail === authStore.user?.email) {
                showToast('success', 'You have been added to the speakers list')
            } else if (data.type === 'your-turn' && data.currentSpeakerEmail === authStore.user?.email) {
                showToast('info', 'It\'s your turn to speak!', {
                    duration: 10000,
                    important: true
                })
            }
        })

        // Attendance events
        socket.value.on('attendance-update', (data) => {
            attendanceUpdates[data.sessionId] = data
        })

        // Messaging events
        socket.value.on('new-message', (data) => {
            messageUpdates.push(data)

            const authStore = useAuthStore()
            if (data.recipientEmail === authStore.user?.email) {
                showToast('info', `New message from ${data.senderCountry}`)
            }
        })

        // Emergency/announcement events
        socket.value.on('emergency-announcement', (data) => {
            showToast('error', data.message, {
                duration: 10000,
                important: true
            })
        })

        socket.value.on('general-announcement', (data) => {
            showToast('info', data.message, {
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

    const getTimerUpdate = (sessionId, type) => {
        return timerUpdates[`${sessionId}-${type}`] || null
    }

    const getSpeakerUpdate = (sessionId) => {
        return speakerUpdates[sessionId] || null
    }

    const getAttendanceUpdate = (sessionId) => {
        return attendanceUpdates[sessionId] || null
    }

    const getRecentMessages = (limit = 10) => {
        return messageUpdates.slice(-limit)
    }

    // Clear updates
    const clearSessionUpdates = () => {
        Object.keys(sessionUpdates).forEach(key => delete sessionUpdates[key])
    }

    const clearVotingUpdates = () => {
        Object.keys(votingUpdates).forEach(key => delete votingUpdates[key])
    }

    const clearMessageUpdates = () => {
        messageUpdates.splice(0, messageUpdates.length)
    }

    return {
        // State
        socket,
        isConnected,
        isConnecting,
        connectionState,
        reconnectAttempts,

        // Data stores
        sessionUpdates,
        votingUpdates,
        timerUpdates,
        speakerUpdates,
        attendanceUpdates,
        messageUpdates,

        // Actions
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

        // Utilities
        clearSessionUpdates,
        clearVotingUpdates,
        clearMessageUpdates
    }
})