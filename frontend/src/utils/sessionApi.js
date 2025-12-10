import { apiMethods } from './api'

// Enhanced Session API methods that align with the new backend structure
export const enhancedSessionApi = {
    // Session Management
    sessions: {
        // Create new session
        create: (data) => apiMethods.post('/sessions', data),

        // Start session
        start: (sessionId) => apiMethods.put(`/sessions/${sessionId}/start`),

        // End session
        end: (id, data = {}) => apiMethods.put(`/sessions/${id}/end`, data),

        // Get session details
        getById: (sessionId) => apiMethods.get(`/sessions/${sessionId}`),

        // Get all session timers
        getTimers: (sessionId) => apiMethods.get(`/sessions/${sessionId}/timers`),

        // Get committee sessions
        getByCommittee: (committeeId, params = {}) => apiMethods.get(`/sessions/committee/${committeeId}`, { params }),

        // Get session statistics
        getStatistics: (sessionId) => apiMethods.get(`/sessions/${sessionId}/statistics`)
    },

    // Roll Call Management
    rollCall: {
        // Start roll call
        start: (sessionId, data = {}) => apiMethods.post(`/sessions/${sessionId}/roll-call/start`, data),

        // End roll call
        end: (sessionId) => apiMethods.post(`/sessions/${sessionId}/roll-call/end`),

        // Mark attendance
        markAttendance: (sessionId, data) => apiMethods.put(`/sessions/${sessionId}/attendance`, data),

        // Get current attendance
        getAttendance: (sessionId) => apiMethods.get(`/sessions/${sessionId}/attendance`)
    },

    // Timer Management
    timers: {
        // Start debate timer
        startDebate: (sessionId, data) => apiMethods.post(`/sessions/${sessionId}/timers/debate/start`, data),

        // Start speaker timer
        startSpeaker: (sessionId, data) => apiMethods.post(`/sessions/${sessionId}/timers/speaker/start`, data),

        // Toggle timer (pause/resume)
        toggle: (sessionId, data) => apiMethods.put(`/sessions/${sessionId}/timers/toggle`, data),

        // Adjust timer (real-time manual adjustment)
        adjust: (sessionId, data) => apiMethods.put(`/sessions/${sessionId}/timers/adjust`, data),

        // Add additional timer
        addAdditional: (sessionId, data) => apiMethods.post(`/sessions/${sessionId}/timers/additional`, data),

        // Start additional timer
        startAdditional: (sessionId, timerId) => apiMethods.put(`/sessions/${sessionId}/timers/additional/${timerId}/start`)
    },

    // Debate Mode Management
    modes: {
        // Change debate mode
        change: (sessionId, data) => apiMethods.put(`/sessions/${sessionId}/mode`, data),

        // Get current mode
        getCurrent: (sessionId) => apiMethods.get(`/sessions/${sessionId}/mode`)
    },

    // Speaker Queue Management
    speakers: {
        // Get speaker queues
        getQueues: (sessionId) => apiMethods.get(`/sessions/${sessionId}/speakers`),

        // Move to end of queue
        moveToEnd: (sessionId, data) => apiMethods.put(`/sessions/${sessionId}/speakers/move-to-end`, data),

        // Set current speaker
        setCurrent: (sessionId, data) => apiMethods.put(`/sessions/${sessionId}/speakers/current`, data)
    }
}

// Update the main apiMethods object with enhanced session methods
export const updateApiMethods = () => {
    // Replace existing session methods with enhanced ones
    apiMethods.sessions = {
        ...apiMethods.sessions,

        // Enhanced methods
        create: enhancedSessionApi.sessions.create,
        startSession: enhancedSessionApi.sessions.start,
        getById: enhancedSessionApi.sessions.getById,
        getTimers: enhancedSessionApi.sessions.getTimers,
        getAll: enhancedSessionApi.sessions.getByCommittee,
        getStatistics: enhancedSessionApi.sessions.getStatistics,
        end: enhancedSessionApi.sessions.end,

        // Roll call methods
        startRollCall: enhancedSessionApi.rollCall.start,
        endRollCall: enhancedSessionApi.rollCall.end,
        markAttendance: enhancedSessionApi.rollCall.markAttendance,
        getAttendance: enhancedSessionApi.rollCall.getAttendance,

        // Timer methods
        startDebateTimer: enhancedSessionApi.timers.startDebate,
        startSpeakerTimer: enhancedSessionApi.timers.startSpeaker,
        toggleTimer: enhancedSessionApi.timers.toggle,
        adjustTimer: enhancedSessionApi.timers.adjust,
        addAdditionalTimer: enhancedSessionApi.timers.addAdditional,
        startAdditionalTimer: enhancedSessionApi.timers.startAdditional,

        // Mode methods
        changeMode: enhancedSessionApi.modes.change,
        getCurrentMode: enhancedSessionApi.modes.getCurrent,

        // Speaker methods
        getSpeakers: enhancedSessionApi.speakers.getQueues,
        moveToEndOfQueue: enhancedSessionApi.speakers.moveToEnd,
        setCurrentSpeaker: enhancedSessionApi.speakers.setCurrent
    }

    return apiMethods
}

// Auto-update on import
const updatedSessionApi = updateApiMethods()

export default enhancedSessionApi
export { updatedSessionApi }