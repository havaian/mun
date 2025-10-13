// frontend/src/stores/websocket.js
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useWebSocketStore = defineStore('websocket', () => {
    const socket = ref(null)
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5
    const connectionState = ref('disconnected') // 'disconnected', 'connecting', 'connected'

    // Real-time data stores
    const sessionUpdates = reactive({})
    const votingUpdates = reactive({})
    const timerUpdates = reactive({})
    const speakerUpdates = reactive({})
    const attendanceUpdates = reactive({})
    const messageUpdates = reactive([])

    // Connection management
    const connect = async () => {
        const authStore = useAuthStore()

        if (!authStore.token) {
            console.warn('❌ Cannot connect WebSocket: No authentication token')
            return Promise.reject(new Error('No authentication token'))
        }

        if (socket.value?.connected) {
            console.log('ℹ️ WebSocket already connected')
            return Promise.resolve()
        }

        // Prevent multiple connection attempts
        if (isConnecting.value) {
            console.log('ℹ️ WebSocket connection already in progress')
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            try {
                isConnecting.value = true
                connectionState.value = 'connecting'

                // Disconnect existing socket if any
                if (socket.value) {
                    socket.value.disconnect()
                    socket.value = null
                }

                // Use current host - nginx handles the WebSocket proxying to backend
                const wsUrl = window.location.origin
                console.log('🔌 Connecting to WebSocket:', wsUrl)

                socket.value = io(wsUrl, {
                    auth: {
                        token: authStore.token
                    },
                    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
                    upgrade: true,
                    rememberUpgrade: true,
                    timeout: 10000,
                    reconnection: false, // We'll handle reconnection manually
                    forceNew: true,
                    autoConnect: true
                })

                setupEventListeners()

                // Set up connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (!isConnected.value) {
                        console.error('❌ WebSocket connection timeout')
                        cleanup()
                        reject(new Error('Connection timeout'))
                    }
                }, 15000) // 15 second timeout

                // Resolve promise on successful connection
                socket.value.once('connect', () => {
                    clearTimeout(connectionTimeout)
                    resolve()
                })

                // Reject promise on connection error
                socket.value.once('connect_error', (error) => {
                    clearTimeout(connectionTimeout)
                    cleanup()
                    reject(error)
                })

            } catch (error) {
                cleanup()
                reject(error)
            }
        })
    }

    const disconnect = () => {
        console.log('🔌 Disconnecting WebSocket')
        
        if (socket.value) {
            socket.value.disconnect()
            socket.value = null
        }
        
        cleanup()
    }

    const cleanup = () => {
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
            console.log('🔗 WebSocket connected successfully')

            // Join user-specific rooms
            const authStore = useAuthStore()
            if (authStore.user?.committeeId) {
                socket.value.emit('join-committee', authStore.user.committeeId)
                console.log('📝 Joined committee room:', authStore.user.committeeId)
            }

            // Send user info for room assignment
            socket.value.emit('user-info', {
                userId: authStore.user?.id,
                email: authStore.user?.email,
                role: authStore.user?.role,
                committeeId: authStore.user?.committeeId
            })
        })

        socket.value.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason)
            
            isConnected.value = false
            isConnecting.value = false
            connectionState.value = 'disconnected'

            // Only attempt reconnection for certain disconnect reasons
            if (reason === 'io server disconnect' || reason === 'transport close') {
                scheduleReconnect()
            } else if (reason === 'io client disconnect') {
                // Client initiated disconnect - don't reconnect
                console.log('ℹ️ Client initiated disconnect - not reconnecting')
            }
        })

        socket.value.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error)
            isConnected.value = false
            isConnecting.value = false
            connectionState.value = 'disconnected'
            
            scheduleReconnect()
        })

        socket.value.on('reconnect_error', (error) => {
            console.error('❌ WebSocket reconnection error:', error)
        })

        // Server confirmation of connection
        socket.value.on('connected', (data) => {
            console.log('✅ WebSocket connection confirmed by server:', data.message)
        })

        // Session events
        socket.value.on('session-started', (data) => {
            sessionUpdates[data.sessionId] = {
                ...data,
                status: 'active',
                timestamp: Date.now()
            }
            // Note: Removed toast here to avoid notification spam
            console.log('📅 Session started:', data.mode)
        })

        socket.value.on('session-ended', (data) => {
            sessionUpdates[data.sessionId] = {
                ...data,
                status: 'ended',
                timestamp: Date.now()
            }
            console.log('📅 Session ended')
        })

        socket.value.on('session-mode-changed', (data) => {
            sessionUpdates[data.sessionId] = {
                ...sessionUpdates[data.sessionId],
                ...data,
                timestamp: Date.now()
            }
            console.log('📅 Debate mode changed to:', data.newMode)
        })

        // Speaker events
        socket.value.on('speaker-changed', (data) => {
            speakerUpdates[data.sessionId] = {
                currentSpeaker: data.country,
                speakerEmail: data.email,
                timestamp: Date.now()
            }
            console.log('🎤 Speaker changed:', data.country)
        })

        // Voting events
        socket.value.on('voting-started', (data) => {
            votingUpdates[data.votingId] = {
                ...data,
                status: 'active',
                timestamp: Date.now()
            }
            console.log('🗳️ Voting started:', data.title)
        })

        socket.value.on('voting-ended', (data) => {
            votingUpdates[data.votingId] = {
                ...data,
                status: 'ended',
                timestamp: Date.now()
            }
            console.log('🗳️ Voting ended:', data.title)
        })

        socket.value.on('vote-cast', (data) => {
            if (votingUpdates[data.votingId]) {
                votingUpdates[data.votingId].currentResults = data.currentResults
                votingUpdates[data.votingId].timestamp = Date.now()
            }
        })

        // Timer events
        socket.value.on('timer-started', (data) => {
            const key = `${data.sessionId}-${data.timerType}`
            timerUpdates[key] = {
                ...data,
                status: 'running',
                timestamp: Date.now()
            }
        })

        socket.value.on('timer-paused', (data) => {
            const key = `${data.sessionId}-${data.timerType}`
            if (timerUpdates[key]) {
                timerUpdates[key].status = 'paused'
                timerUpdates[key].pausedAt = data.pausedAt
                timerUpdates[key].timestamp = Date.now()
            }
        })

        socket.value.on('timer-stopped', (data) => {
            const key = `${data.sessionId}-${data.timerType}`
            if (timerUpdates[key]) {
                timerUpdates[key].status = 'stopped'
                timerUpdates[key].timestamp = Date.now()
            }
        })

        // Attendance events
        socket.value.on('attendance-updated', (data) => {
            attendanceUpdates[data.sessionId] = {
                ...data,
                timestamp: Date.now()
            }
        })

        // Message events
        socket.value.on('message-received', (data) => {
            messageUpdates.push({
                ...data,
                timestamp: Date.now()
            })

            // Keep only last 100 messages
            if (messageUpdates.length > 100) {
                messageUpdates.splice(0, messageUpdates.length - 100)
            }
        })

        // Emergency/announcement events
        socket.value.on('emergency-announcement', (data) => {
            // Use window.toast if available, fallback to console
            if (window.toast) {
                window.toast.error(data.message, { duration: 10000 })
            } else {
                console.error('🚨 Emergency:', data.message)
            }
        })

        socket.value.on('general-announcement', (data) => {
            if (window.toast) {
                window.toast.log(data.message, { duration: 5000 })
            } else {
                console.log('📢 Announcement:', data.message)
            }
        })
    }

    const scheduleReconnect = () => {
        if (reconnectAttempts.value >= maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached')
            return
        }

        const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.value), 30000) // Exponential backoff, max 30s
        console.log(`🔄 Scheduling reconnect attempt ${reconnectAttempts.value + 1} in ${delay}ms`)

        setTimeout(() => {
            if (!isConnected.value && !isConnecting.value) {
                reconnectAttempts.value++
                connect().catch(error => {
                    console.error('❌ Reconnection failed:', error)
                })
            }
        }, delay)
    }

    // Emit events
    const joinCommittee = (committeeId) => {
        if (socket.value?.connected) {
            socket.value.emit('join-committee', committeeId)
            console.log('📝 Joining committee room:', committeeId)
        }
    }

    const leaveCommittee = (committeeId) => {
        if (socket.value?.connected) {
            socket.value.emit('leave-committee', committeeId)
            console.log('📝 Leaving committee room:', committeeId)
        }
    }

    const joinSession = (sessionId) => {
        if (socket.value?.connected) {
            socket.value.emit('join-session', sessionId)
            console.log('📅 Joining session room:', sessionId)
        }
    }

    const leaveSession = (sessionId) => {
        if (socket.value?.connected) {
            socket.value.emit('leave-session', sessionId)
            console.log('📅 Leaving session room:', sessionId)
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