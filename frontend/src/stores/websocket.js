import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wsService } from '@/plugins/websocket'

export const useWebSocketStore = defineStore('websocket', () => {
    // State
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const socketId = ref(null)
    const lastError = ref(null)

    // Active attendance check
    const isAttendanceActive = ref(false)
    const activeAttendanceSessionId = ref(null)

    // Active voting
    const activeVotings = ref([])
    const currentRollCallVoting = ref(null)
    const isMyTurnToVote = ref(false)

    // Session info
    const currentSessionMode = ref(null)
    const quorumStatus = ref(null)

    // Computed
    const connectionStatus = computed(() => {
        if (isConnected.value) return 'connected'
        if (isConnecting.value) return 'connecting'
        return 'disconnected'
    })

    // Actions
    const connect = (token) => {
        isConnecting.value = true
        wsService.connect(token)

        // Setup listeners
        setupListeners()
    }

    const disconnect = () => {
        wsService.disconnect()
        isConnected.value = false
        isConnecting.value = false
        socketId.value = null
    }

    const setupListeners = () => {
        // Connection status
        wsService.on('ws-connected', () => {
            isConnected.value = true
            isConnecting.value = false
            socketId.value = wsService.socket?.id
            lastError.value = null
        })

        wsService.on('ws-disconnected', (reason) => {
            isConnected.value = false
            isConnecting.value = false
            lastError.value = reason
        })

        // Attendance events
        wsService.on('attendance-started', (data) => {
            console.log('🔔 Store: Attendance started', data)
            isAttendanceActive.value = true
            activeAttendanceSessionId.value = data.sessionId
        })

        wsService.on('attendance-updated', (data) => {
            console.log('🔔 Store: Attendance updated', data)
            // Можно обновить локальные данные
        })

        wsService.on('quorum-status-changed', (data) => {
            console.log('🔔 Store: Quorum status changed', data)
            quorumStatus.value = data
        })

        // Session events
        wsService.on('session-mode-changed', (data) => {
            console.log('🔔 Store: Session mode changed', data)
            currentSessionMode.value = data.newMode
        })

        // Voting events
        wsService.on('voting-started', (data) => {
            console.log('🔔 Store: Voting started', data)
            activeVotings.value.push(data)
        })

        wsService.on('voting-completed', (data) => {
            console.log('🔔 Store: Voting completed', data)
            activeVotings.value = activeVotings.value.filter(v => v.votingId !== data.votingId)

            if (currentRollCallVoting.value?.votingId === data.votingId) {
                currentRollCallVoting.value = null
                isMyTurnToVote.value = false
            }
        })

        wsService.on('roll-call-next', (data) => {
            console.log('🔔 Store: Roll call next', data)
            currentRollCallVoting.value = data
            // isMyTurnToVote будет проверяться в компоненте
        })

        wsService.on('voting-call', (data) => {
            console.log('🔔 Store: Your turn to vote!', data)
            isMyTurnToVote.value = true
        })
    }

    // Room management
    const joinCommittee = (committeeId) => {
        if (!wsService || !committeeId) return;
        
        console.log(`🏛️ Joining committee room: ${committeeId}`);
        
        // Join multiple room formats for compatibility
        wsService.emit('join-committee-room', { committeeId });
        wsService.emit('join-room', `committee-${committeeId}`);
        wsService.emit('join-room', `public-display-${committeeId}`);
        wsService.emit('join-room', committeeId);
        
        // Store current committee for reconnection
        currentCommitteeId = committeeId;
    };

    const joinPublicDisplayRoom = (committeeId) => {
        if (!wsService || !committeeId) return;
        
        console.log(`📺 Joining public display room: ${committeeId}`);
        
        wsService.emit('join-public-display', { committeeId });
        wsService.emit('join-room', `public-display-${committeeId}`);
        wsService.emit('join-room', `display-${committeeId}`);
    };

    const leaveCommittee = (committeeId) => {
        wsService.leaveCommittee(committeeId)
    }

    const joinSession = (sessionId) => {
        wsService.joinSession(sessionId)
    }

    const leaveSession = (sessionId) => {
        wsService.leaveSession(sessionId)
    }

    // Event emission
    const send = (event, data) => {
        wsService.send(event, data)
    }

    // Clear attendance state
    const clearAttendanceState = () => {
        isAttendanceActive.value = false
        activeAttendanceSessionId.value = null
    }

    return {
        // State
        isConnected,
        isConnecting,
        socketId,
        lastError,
        isAttendanceActive,
        activeAttendanceSessionId,
        activeVotings,
        currentRollCallVoting,
        isMyTurnToVote,
        currentSessionMode,
        quorumStatus,

        // Computed
        connectionStatus,

        // Actions
        connect,
        disconnect,
        joinCommittee,
        joinPublicDisplayRoom,
        leaveCommittee,
        joinSession,
        leaveSession,
        send,
        clearAttendanceState
    }
})