import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore('websocket', () => {
    const socket = ref(null)
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5
    const connectionState = ref('disconnected')

    // Helper function to safely use auth store
    const getAuthStore = () => {
        try {
            const { useAuthStore } = require('./auth')
            return useAuthStore()
        } catch (error) {
            console.warn('Auth store not available:', error)
            return null
        }
    }

    // Helper function to safely use toast
    const showToast = (type, message, options = {}) => {
        try {
            // Use setTimeout to ensure toast is available
            setTimeout(async () => {
                try {
                    const { useToast } = await import('@/plugins/toast')
                    const toast = useToast()
                    toast[type](message, options)
                } catch (error) {
                    console.log(`${type.toUpperCase()}: ${message}`)
                }
            }, 0)
        } catch (error) {
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
        return new Promise((resolve, reject) => {
            try {
                const authStore = getAuthStore()
                
                if (!authStore?.token || socket.value?.connected) {
                    resolve()
                    return
                }

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

                socket.value.on('connect', () => {
                    isConnected.value = true
                    isConnecting.value = false
                    connectionState.value = 'connected'
                    reconnectAttempts.value = 0
                    console.log('🔗 WebSocket connected')
                    resolve()
                })

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

        socket.value.on('disconnect', (reason) => {
            isConnected.value = false
            connectionState.value = 'disconnected'
            console.log('🔌 WebSocket disconnected:', reason)

            if (reason === 'io server disconnect') {
                showToast('warning', 'Server disconnected. Please refresh the page.')
            } else if (reason === 'transport close' || reason === 'transport error') {
                showToast('warning', 'Connection lost. Attempting to reconnect...')
            }
        })

        // Add other event listeners here...
        socket.value.on('session-update', (data) => {
            sessionUpdates[data.sessionId] = data
        })

        socket.value.on('voting-update', (data) => {
            votingUpdates[data.votingId] = data
        })

        // More event listeners...
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
        leaveCommittee
    }
})