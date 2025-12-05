import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

class WebSocketService {
    constructor() {
        this.socket = null
        this.isConnected = false
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.listeners = new Map()
        this.authStore = null
        this.toast = null
    }

    connect(token) {
        if (this.socket && this.isConnected) {
            console.log('WebSocket already connected')
            return
        }

        if (this.isConnecting) {
            console.log('WebSocket connection in progress')
            return
        }

        this.isConnecting = true
        this.authStore = useAuthStore()
        this.toast = useToast()

        const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin

        this.socket = io(wsUrl, {
            auth: {
                token: token || localStorage.getItem('mun_token')
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts
        })

        this.setupEventHandlers()
    }

    setupEventHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket.id)
            this.isConnected = true
            this.isConnecting = false
            this.reconnectAttempts = 0

            // Join committee room if user has committeeId
            if (this.authStore?.user?.committeeId) {
                this.joinCommittee(this.authStore.user.committeeId)
            }

            // Emit custom event
            this.emit('ws-connected')
        })

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason)
            this.isConnected = false
            this.isConnecting = false
            this.emit('ws-disconnected', reason)
        })

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error)
            this.isConnecting = false
            this.reconnectAttempts++

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached')
                this.toast?.error('Failed to connect to real-time updates')
            }
        })

        // Authentication events
        this.socket.on('unauthorized', (error) => {
            console.error('WebSocket unauthorized:', error)
            this.disconnect()
            this.toast?.error('WebSocket authentication failed')
        })

        // Critical events
        this.setupCriticalEvents()

        // Presidium events
        this.setupPresidiumEvents()

        // Delegate events
        this.setupDelegateEvents()
    }

    setupCriticalEvents() {
        // Session events
        this.socket.on('session-started', (data) => {
            console.log('🎬 Session started:', data)
            this.emit('session-started', data)
            this.toast?.success('Session has started')
        })

        this.socket.on('session-ended', (data) => {
            console.log('🛑 Session ended:', data)
            this.emit('session-ended', data)
            this.toast?.info('Session has ended')
        })

        this.socket.on('session-mode-changed', (data) => {
            console.log('🔄 Session mode changed:', data)
            this.emit('session-mode-changed', data)
            this.toast?.info(`Debate mode changed to ${data.newMode}`)
        })

        // Attendance events
        this.socket.on('attendance-started', (data) => {
            console.log('📋 Roll call started:', data)
            this.emit('attendance-started', data)
        })

        this.socket.on('attendance-updated', (data) => {
            console.log('📋 Attendance updated:', data)
            this.emit('attendance-updated', data)
        })

        this.socket.on('quorum-status-changed', (data) => {
            console.log('⚖️ Quorum status changed:', data)
            this.emit('quorum-status-changed', data)

            if (data.hasQuorum) {
                this.toast?.success('Quorum achieved!')
            } else {
                this.toast?.warning('Quorum lost')
            }
        })

        // Voting events
        this.socket.on('voting-started', (data) => {
            console.log('🗳️ Voting started:', data)
            this.emit('voting-started', data)
            this.toast?.info(`Voting started: ${data.subject}`)
        })

        this.socket.on('voting-completed', (data) => {
            console.log('✅ Voting completed:', data)
            this.emit('voting-completed', data)

            const result = data.passed ? 'passed' : 'failed'
            this.toast?.info(`Voting ${result}`)
        })

        this.socket.on('vote-cast', (data) => {
            console.log('🗳️ Vote cast:', data)
            this.emit('vote-cast', data)
        })

        this.socket.on('voting-progress', (data) => {
            console.log('📊 Voting progress:', data)
            this.emit('voting-progress', data)
        })

        // Roll call voting specific
        this.socket.on('roll-call-next', (data) => {
            console.log('📢 Roll call - next country:', data)
            this.emit('roll-call-next', data)

            // If it's your turn
            if (data.country === this.authStore?.user?.countryName) {
                this.toast?.info('It\'s your turn to vote!', {
                    duration: 0 // Don't auto-dismiss
                })
            }
        })

        this.socket.on('roll-call-skip', (data) => {
            console.log('⏭️ Roll call - country skipped:', data)
            this.emit('roll-call-skip', data)
        })
    }

    setupPresidiumEvents() {
        // Document submissions
        this.socket.on('document-submitted', (data) => {
            console.log('📄 Document submitted:', data)
            this.emit('document-submitted', data)

            if (this.authStore?.user?.role === 'presidium') {
                this.toast?.info(`New ${data.documentType} submitted by ${data.author}`)
            }
        })

        // Coalition events
        this.socket.on('coalition-formed', (data) => {
            console.log('🤝 Coalition formed:', data)
            this.emit('coalition-formed', data)
        })

        this.socket.on('resolution-submitted', (data) => {
            console.log('📜 Resolution submitted:', data)
            this.emit('resolution-submitted', data)

            if (this.authStore?.user?.role === 'presidium') {
                this.toast?.info(`New resolution submitted: ${data.title}`)
            }
        })

        // Amendment events
        this.socket.on('amendment-submitted', (data) => {
            console.log('✏️ Amendment submitted:', data)
            this.emit('amendment-submitted', data)
        })

        // Procedural events
        this.socket.on('procedural-motion-submitted', (data) => {
            console.log('📋 Procedural motion submitted:', data)
            this.emit('procedural-motion-submitted', data)

            if (this.authStore?.user?.role === 'presidium') {
                this.toast?.info(`New procedural motion: ${data.motionType}`)
            }
        })

        this.socket.on('question-submitted', (data) => {
            console.log('❓ Question submitted:', data)
            this.emit('question-submitted', data)
        })
    }

    setupDelegateEvents() {
        // Invitations
        this.socket.on('coalition-invitation', (data) => {
            console.log('📨 Coalition invitation:', data)
            this.emit('coalition-invitation', data)
            this.toast?.info(`You've been invited to join ${data.coalitionName}`)
        })

        this.socket.on('coauthor-invitation', (data) => {
            console.log('📨 Coauthor invitation:', data)
            this.emit('coauthor-invitation', data)
            this.toast?.info(`You've been invited as a coauthor`)
        })

        // Messages
        this.socket.on('message-received', (data) => {
            console.log('💬 Message received:', data)
            this.emit('message-received', data)
        })

        this.socket.on('official-message', (data) => {
            console.log('📢 Official message:', data)
            this.emit('official-message', data)
            this.toast?.info(data.subject)
        })

        // Document review results
        this.socket.on('document-review-completed', (data) => {
            console.log('✅ Document review completed:', data)
            this.emit('document-review-completed', data)

            if (data.decision === 'approved') {
                this.toast?.success('Your document has been approved!')
            } else if (data.decision === 'rejected') {
                this.toast?.error('Your document has been rejected')
            }
        })

        this.socket.on('resolution-review-completed', (data) => {
            console.log('✅ Resolution review completed:', data)
            this.emit('resolution-review-completed', data)
        })

        // Voting reminders
        this.socket.on('voting-reminder', (data) => {
            console.log('⏰ Voting reminder:', data)
            this.emit('voting-reminder', data)

            if (!data.hasVoted) {
                this.toast?.warning(`Reminder: Vote on ${data.subject}`)
            }
        })

        this.socket.on('voting-call', (data) => {
            console.log('📢 Voting call - your turn:', data)
            this.emit('voting-call', data)
            this.toast?.info('It\'s your turn to vote!', {
                duration: 0 // Don't auto-dismiss
            })
        })
    }

    // Room management
    joinCommittee(committeeId) {
        if (!this.socket || !this.isConnected) {
            console.warn('Cannot join committee: socket not connected')
            return
        }

        console.log('🏛️ Joining committee room:', committeeId)
        this.socket.emit('join-committee', { committeeId })
    }

    leaveCommittee(committeeId) {
        if (!this.socket || !this.isConnected) return

        console.log('👋 Leaving committee room:', committeeId)
        this.socket.emit('leave-committee', { committeeId })
    }

    joinSession(sessionId) {
        if (!this.socket || !this.isConnected) return

        console.log('🎬 Joining session room:', sessionId)
        this.socket.emit('join-session', { sessionId })
    }

    leaveSession(sessionId) {
        if (!this.socket || !this.isConnected) return

        console.log('👋 Leaving session room:', sessionId)
        this.socket.emit('leave-session', { sessionId })
    }

    // Event listener management
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event).push(callback)

        // If socket exists, also add listener to it
        if (this.socket) {
            this.socket.on(event, callback)
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event)
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }

        if (this.socket) {
            this.socket.off(event, callback)
        }
    }

    emit(event, data) {
        // Emit to internal listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in listener for ${event}:`, error)
                }
            })
        }
    }

    // Send events to server
    send(event, data) {
        if (!this.socket || !this.isConnected) {
            console.warn(`Cannot send ${event}: socket not connected`)
            return
        }

        this.socket.emit(event, data)
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
        this.isConnected = false
        this.isConnecting = false
        this.listeners.clear()
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            socketId: this.socket?.id
        }
    }
}

// Create singleton instance
const wsService = new WebSocketService()

// Vue plugin
export default {
    install(app) {
        app.config.globalProperties.$ws = wsService
        app.provide('ws', wsService)
    }
}

export { wsService }