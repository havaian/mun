// frontend/src/stores/session.js
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { apiMethods } from '@/utils/api'
import { useWebSocketStore } from './websocket'
import { useAuthStore } from './auth'

export const useSessionStore = defineStore('session', () => {
    // State
    const currentSession = ref(null)
    const sessions = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Session details
    const sessionMode = ref('formal') // formal, moderated, unmoderated, informal, closed
    const modeSettings = reactive({
        topic: '',
        totalTime: 0,
        speechTime: 120, // 2 minutes default
        allowQuestions: false
    })

    // Speaker management
    const speakerList = ref([])
    const currentSpeaker = ref(null)
    const speakerQueue = ref([])

    // Attendance tracking
    const attendance = ref([])
    const quorum = reactive({
        required: 0,
        present: 0,
        hasQuorum: false,
        lastUpdated: null
    })

    // Timer states
    const timers = reactive({
        session: {
            totalDuration: 0,
            startedAt: null,
            pausedAt: null,
            remainingTime: 0,
            isPaused: false,
            extensions: []
        },
        speaker: {
            currentSpeaker: null,
            duration: 120,
            startedAt: null,
            pausedAt: null,
            remainingTime: 0,
            isPaused: false,
            allowExtension: true,
            extensionUsed: false
        },
        additional: []
    })

    // Session statistics
    const stats = reactive({
        totalSpeeches: 0,
        averageSpeechTime: 0,
        participationRate: 0,
        modeChanges: 0,
        totalTime: 0
    })

    // WebSocket integration
    const wsStore = useWebSocketStore()
    const authStore = useAuthStore()

    // Computed
    const isSessionActive = computed(() => {
        return currentSession.value?.status === 'active'
    })

    const canModifySession = computed(() => {
        return authStore.user?.role === 'admin' || authStore.user?.role === 'presidium'
    })

    const canJoinSpeakers = computed(() => {
        return authStore.user?.role === 'delegate' && isSessionActive.value
    })

    const isCurrentSpeaker = computed(() => {
        return currentSpeaker.value?.email === authStore.user?.email
    })

    const nextSpeaker = computed(() => {
        const queue = speakerList.value.filter(speaker => !speaker.hasSpoken && !speaker.speaking)
        return queue.length > 0 ? queue[0] : null
    })

    const remainingSpeakers = computed(() => {
        return speakerList.value.filter(speaker => !speaker.hasSpoken && !speaker.speaking).length
    })

    // Session Management Actions
    const createSession = async (committeeId, sessionData) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await apiMethods.sessions.create({
                committeeId,
                ...sessionData
            })

            if (response.data.success) {
                currentSession.value = response.data.session
                await loadSessionDetails(response.data.session._id)

                // Join WebSocket room
                wsStore.joinSession(response.data.session._id)

                return response.data.session
            }

            throw new Error(response.data.message || 'Failed to create session')

        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const loadSessions = async (committeeId) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await apiMethods.sessions.getAll(committeeId)

            if (response.data.success) {
                sessions.value = response.data.sessions || []

                // Set current active session if exists
                const activeSession = sessions.value.find(s => s.status === 'active')
                if (activeSession) {
                    currentSession.value = activeSession
                    await loadSessionDetails(activeSession._id)
                }
            }

        } catch (err) {
            error.value = err.message
            console.error('Load sessions error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const loadSessionDetails = async (sessionId) => {
        try {
            const response = await apiMethods.sessions.getById(sessionId)

            if (response.data.success) {
                const session = response.data.session

                // Update session data
                currentSession.value = session
                sessionMode.value = session.currentMode || 'formal'
                Object.assign(modeSettings, session.modeSettings || {})

                // Update speaker data
                speakerList.value = session.speakerList || []
                currentSpeaker.value = speakerList.value.find(s => s.speaking) || null

                // Update attendance
                attendance.value = session.attendance || []
                Object.assign(quorum, session.quorum || {})

                // Update timers
                Object.assign(timers, session.timers || {})

                // Update stats
                Object.assign(stats, session.statistics || {})

                // Join WebSocket room
                wsStore.joinSession(sessionId)
            }

        } catch (err) {
            error.value = err.message
            console.error('Load session details error:', err)
        }
    }

    const endSession = async (sessionId) => {
        try {
            isLoading.value = true

            const response = await apiMethods.sessions.updateStatus(sessionId, { status: 'ended' })

            if (response.data.success) {
                currentSession.value = null
                wsStore.leaveSession(sessionId)

                // Clear session data
                resetSessionData()
            }

        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Mode Management
    const changeMode = async (sessionId, newMode, settings = {}) => {
        try {
            const response = await apiMethods.sessions.changeMode(sessionId, {
                mode: newMode,
                settings
            })

            if (response.data.success) {
                sessionMode.value = newMode
                Object.assign(modeSettings, settings)
                stats.modeChanges++
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Speaker Management
    const addToSpeakerList = async (sessionId) => {
        try {
            const response = await apiMethods.sessions.addToSpeakerList(sessionId)

            if (response.data.success) {
                speakerList.value = response.data.speakerList
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const removeFromSpeakerList = async (sessionId, speakerEmail) => {
        try {
            const response = await apiMethods.sessions.removeFromSpeakerList(sessionId, {
                speakerEmail
            })

            if (response.data.success) {
                speakerList.value = response.data.speakerList
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const setCurrentSpeaker = async (sessionId, speakerEmail) => {
        try {
            const response = await apiMethods.sessions.setCurrentSpeaker(sessionId, {
                speakerEmail
            })

            if (response.data.success) {
                // Update speaker states
                speakerList.value.forEach(speaker => {
                    speaker.speaking = speaker.email === speakerEmail
                })

                currentSpeaker.value = speakerList.value.find(s => s.email === speakerEmail) || null
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const moveToEndOfList = async (sessionId) => {
        try {
            const response = await apiMethods.sessions.moveToEndOfList(sessionId)

            if (response.data.success) {
                speakerList.value = response.data.speakerList
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Attendance Management
    const updateAttendance = async (sessionId, attendanceData) => {
        try {
            const response = await apiMethods.sessions.updateAttendance(sessionId, attendanceData)

            if (response.data.success) {
                attendance.value = response.data.attendance
                Object.assign(quorum, response.data.quorum)
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const markPresent = async (sessionId, countryEmail, present = true) => {
        try {
            const attendanceUpdate = attendance.value.map(record =>
                record.email === countryEmail
                    ? { ...record, present, markedAt: new Date() }
                    : record
            )

            await updateAttendance(sessionId, { attendance: attendanceUpdate })

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Timer Management (integrates with timer store/API)
    const startSessionTimer = async (sessionId, duration) => {
        try {
            const response = await apiMethods.timers.startTimer(sessionId, 'session', { duration })

            if (response.data.success) {
                timers.session.startedAt = new Date()
                timers.session.totalDuration = duration
                timers.session.remainingTime = duration
                timers.session.isPaused = false
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const startSpeakerTimer = async (sessionId, speakerEmail, duration = 120) => {
        try {
            const response = await apiMethods.timers.startTimer(sessionId, 'speaker', {
                speakerEmail,
                duration
            })

            if (response.data.success) {
                timers.speaker.currentSpeaker = speakerEmail
                timers.speaker.startedAt = new Date()
                timers.speaker.duration = duration
                timers.speaker.remainingTime = duration
                timers.speaker.isPaused = false
                timers.speaker.extensionUsed = false
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Utility Methods
    const resetSessionData = () => {
        currentSession.value = null
        sessionMode.value = 'formal'
        Object.assign(modeSettings, {
            topic: '',
            totalTime: 0,
            speechTime: 120,
            allowQuestions: false
        })
        speakerList.value = []
        currentSpeaker.value = null
        attendance.value = []
        Object.assign(quorum, {
            required: 0,
            present: 0,
            hasQuorum: false,
            lastUpdated: null
        })
        Object.assign(stats, {
            totalSpeeches: 0,
            averageSpeechTime: 0,
            participationRate: 0,
            modeChanges: 0,
            totalTime: 0
        })
    }

    const findSpeakerByEmail = (email) => {
        return speakerList.value.find(speaker => speaker.email === email) || null
    }

    const getSpeakerPosition = (email) => {
        const index = speakerList.value.findIndex(speaker =>
            speaker.email === email && !speaker.hasSpoken && !speaker.speaking
        )
        return index >= 0 ? index + 1 : -1
    }

    // WebSocket event handlers (called by WebSocket store)
    const handleSessionUpdate = (data) => {
        if (currentSession.value?._id === data.sessionId) {
            Object.assign(currentSession.value, data)
        }
    }

    const handleSpeakerUpdate = (data) => {
        if (currentSession.value?._id === data.sessionId) {
            if (data.currentSpeaker) {
                currentSpeaker.value = findSpeakerByEmail(data.speakerEmail)
            }
            if (data.speakerList) {
                speakerList.value = data.speakerList
            }
        }
    }

    const handleTimerUpdate = (data) => {
        if (currentSession.value?._id === data.sessionId) {
            const timerKey = data.timerType
            if (timers[timerKey]) {
                Object.assign(timers[timerKey], data)
            }
        }
    }

    const handleAttendanceUpdate = (data) => {
        if (currentSession.value?._id === data.sessionId) {
            if (data.attendance) {
                attendance.value = data.attendance
            }
            if (data.quorum) {
                Object.assign(quorum, data.quorum)
            }
        }
    }

    return {
        // State
        currentSession,
        sessions,
        isLoading,
        error,

        // Session details
        sessionMode,
        modeSettings,

        // Speaker management
        speakerList,
        currentSpeaker,
        speakerQueue,

        // Attendance
        attendance,
        quorum,

        // Timers
        timers,

        // Statistics
        stats,

        // Computed
        isSessionActive,
        canModifySession,
        canJoinSpeakers,
        isCurrentSpeaker,
        nextSpeaker,
        remainingSpeakers,

        // Actions - Session Management
        createSession,
        loadSessions,
        loadSessionDetails,
        endSession,

        // Actions - Mode Management
        changeMode,

        // Actions - Speaker Management
        addToSpeakerList,
        removeFromSpeakerList,
        setCurrentSpeaker,
        moveToEndOfList,

        // Actions - Attendance
        updateAttendance,
        markPresent,

        // Actions - Timers
        startSessionTimer,
        startSpeakerTimer,

        // Utilities
        resetSessionData,
        findSpeakerByEmail,
        getSpeakerPosition,

        // WebSocket handlers
        handleSessionUpdate,
        handleSpeakerUpdate,
        handleTimerUpdate,
        handleAttendanceUpdate
    }
})