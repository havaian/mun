import axios from 'axios'
import { useToast } from '@/plugins/toast'

// Create axios instance
const api = axios.create({
    baseURL: '/api',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('mun_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => {
        // Calculate request duration for debugging
        if (response.config.metadata) {
            const duration = new Date() - response.config.metadata.startTime
            console.debug(`API ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`)
        }

        return response
    },
    (error) => {
        const toast = useToast()

        // Handle different error types
        if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout. Please check your connection.')
        } else if (error.response) {
            // Server responded with error status
            const { status, data } = error.response

            switch (status) {
                case 400:
                    // Bad request - usually validation errors
                    if (data.details && Array.isArray(data.details)) {
                        // Handle validation errors
                        const validationErrors = data.details.map(err => err.msg).join(', ')
                        console.error('Validation errors:', validationErrors)
                    }
                    break

                case 401:
                    // Unauthorized - invalid or expired token
                    console.warn('Unauthorized request - clearing auth data')
                    localStorage.removeItem('mun_token')

                    // Redirect to login if not already there
                    if (!window.location.pathname.includes('/auth')) {
                        window.location.href = '/auth/login'
                    }
                    break

                case 403:
                    // Forbidden - insufficient permissions
                    toast.error('You do not have permission to perform this action')
                    break

                case 404:
                    // Not found
                    console.warn('Resource not found:', error.config.url)
                    break

                case 409:
                    // Conflict - usually duplicate data
                    console.warn('Conflict error:', data.error)
                    break

                case 429:
                    // Rate limited
                    toast.error('Too many requests. Please wait a moment and try again.')
                    break

                case 500:
                case 502:
                case 503:
                case 504:
                    // Server errors
                    toast.error('Server error. Please try again later.')
                    console.error('Server error:', error.response)
                    break

                default:
                    toast.error('An unexpected error occurred')
                    console.error('Unexpected error:', error.response)
            }
        } else if (error.request) {
            // Network error
            console.error('Network error:', error.request)
            toast.error('Network error. Please check your connection.')
        } else {
            // Other error
            console.error('Request error:', error.message)
            toast.error('An error occurred while making the request')
        }

        return Promise.reject(error)
    }
)

// API methods with proper error handling
export const apiMethods = {
    // Admin Management
    admin: {
        // Dashboard
        getDashboardStats: () => api.get('/admin/dashboard/stats'),
        getRecentActivity: (params = {}) => api.get('/admin/dashboard/activity', { params }),

        // System Health  
        getSystemHealth: () => api.get('/admin/system/health'),
        getPerformanceMetrics: () => api.get('/admin/performance/metrics'),
        getResponseTimes: (params = {}) => api.get('/admin/performance/response-times', { params }),

        // System Management
        clearCaches: () => api.post('/admin/system/clear-cache'),

        // Analytics
        getUserEngagementAnalytics: (params = {}) => api.get('/admin/analytics/user-engagement', { params }),
        getUsagePatterns: (params = {}) => api.get('/admin/analytics/usage-patterns', { params }),

        // Bulk Operations
        bulkGenerateQR: (data) => api.post('/admin/committees/bulk-qr', data),

        // Maintenance
        performMaintenance: (data) => api.post('/admin/maintenance/execute', data),
        createBackup: (data) => api.post('/admin/maintenance/backup', data)
    },

    // Authentication
    auth: {
        adminLogin: (credentials) => api.post('/auth/admin-login', credentials),
        qrLogin: (token) => api.post('/auth/qr-login', { token }),
        bindEmail: (token, email) => api.post('/auth/bind-email', { token, email }),
        emailLogin: (email) => api.post('/auth/email-login', { email }),
        logout: () => api.post('/auth/logout'),
        validateSession: () => api.get('/auth/validate-session'),
        checkQrStatus: (token) => api.get(`/auth/qr-status/${token}`),
        reactivateQr: (userId) => api.post('/auth/reactivate-qr', { userId })
    },

    // Events
    events: {
        getAll: (params = {}) => api.get('/events', { params }),
        getById: (id) => api.get(`/events/${id}`),
        create: (data) => api.post('/events', data),
        update: (id, data) => api.put(`/events/${id}`, data),
        delete: (id) => api.delete(`/events/${id}`)
    },

    // Export Management  
    exports: {
        getSystemConfig: () => api.get('/admin/export/config'),
        getAuditLogs: (params = {}) => api.get('/admin/export/audit-logs', { params }),
        generateQRPDF: (committeeId) => api.get(`/export/qr-codes/${committeeId}`, { responseType: 'blob' }),
        exportCommitteeStats: (committeeId) => api.get(`/export/statistics/${committeeId}`, { responseType: 'blob' }),
        exportVotingResults: (committeeId) => api.get(`/export/voting-results/${committeeId}`, { responseType: 'blob' }),
        exportResolutions: (committeeId) => api.get(`/export/resolutions/${committeeId}`, { responseType: 'blob' }),
        exportCompleteReport: (committeeId) => api.get(`/export/committee-report/${committeeId}`, { responseType: 'blob' })
    },

    // Committees
    committees: {
        getAll: (params = {}) => api.get('/committees', { params }),
        getById: (id) => api.get(`/committees/${id}`),
        create: (data) => api.post('/committees', data),
        update: (id, data) => api.put(`/committees/${id}`, data),
        delete: (id) => api.delete(`/committees/${id}`),
        addCountry: (id, countryData) => api.post(`/committees/${id}/countries`, countryData),
        removeCountry: (id, countryName) => api.delete(`/committees/${id}/countries/${countryName}`),
        generateQRs: (id) => api.post(`/committees/${id}/generate-qrs`),
        generatePresidiumQRs: (id) => api.post(`/committees/${id}/presidium/generate-qrs`),
        getPresidiumStatus: (id) => api.get(`/committees/${id}/presidium/status`),
        resetPresidiumQR: (id, role) => api.post(`/committees/${id}/presidium/${role}/reset-qr`),
        getQRTokens: (id) => api.get(`/committees/${id}/qr-tokens`)
    },

    // Countries
    countries: {
        getAll: (params = {}) => api.get('/countries', { params }),
        getByCode: (code, params = {}) => api.get(`/countries/${code}`, { params }),
        getFlag: (code) => api.get(`/countries/flags/${code}`),
        getAllFlags: () => api.get('/countries/flags/all'),
        refreshCache: () => api.post('/countries/flags/refresh')
    },

    // Documents
    documents: {
        getAll: (params = {}) => api.get('/documents', { params }),
        getById: (id) => api.get(`/documents/${id}`),
        upload: (formData) => api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        download: (id) => api.get(`/documents/${id}/download`, {
            responseType: 'blob'
        }),
        preview: (id) => api.get(`/documents/${id}/preview`),
        delete: (id) => api.delete(`/documents/${id}`)
    },

    // Coalitions & Resolutions
    resolutions: {
        // Coalitions
        createCoalition: (data) => api.post('/resolutions/coalitions', data),
        getCoalitions: (committeeId, params = {}) => api.get(`/resolutions/coalitions/${committeeId}`, { params }),
        getCoalition: (id) => api.get(`/resolutions/coalitions/detail/${id}`),
        respondToInvitation: (id, response) => api.put(`/resolutions/coalitions/${id}/respond`, response),
        activateCoalition: (id) => api.put(`/resolutions/coalitions/${id}/activate`),
        leaveCoalition: (id) => api.delete(`/resolutions/coalitions/${id}/leave`),

        // Resolutions
        submit: (data) => api.post('/resolutions', data),
        getAll: (committeeId, params = {}) => api.get(`/resolutions/${committeeId}`, { params }),
        getById: (id) => api.get(`/resolutions/detail/${id}`),
        review: (id, reviewData) => api.put(`/resolutions/${id}/review`, reviewData),
        submitNewVersion: (id, formData) => api.post(`/resolutions/${id}/new-version`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        // Amendments
        submitAmendment: (data) => api.post('/amendments', data),
        getAmendments: (resolutionId, params = {}) => api.get(`/amendments/${resolutionId}`, { params }),
        getAmendment: (id) => api.get(`/amendments/${id}`),
        reviewAmendment: (id, reviewData) => api.put(`/amendments/${id}/review`, reviewData),
        inviteCoauthor: (id, invitationData) => api.post(`/amendments/${id}/invite-coauthor`, invitationData),
        respondToCoauthor: (id, responseData) => api.put(`/amendments/${id}/coauthor-response`, responseData),

        // Second-order amendments
        createSecondOrderAmendment: (id, data) => api.post(`/amendments/${id}/second-order`, data),
        voteOnSecondOrder: (id, voteData) => api.post(`/amendments/${id}/second-order/vote`, voteData),

        // Amendment voting
        createAmendmentVoting: (id, votingData) => api.post(`/amendments/${id}/voting`, votingData),
        getAmendmentVotingStatus: (id) => api.get(`/amendments/${id}/voting-status`),
        getAmendmentPriorityOrder: (committeeId) => api.get(`/amendments/committee/${committeeId}/priority-order`),

        // Resolution versions and review
        getResolutionVersions: (id) => api.get(`/resolutions/${id}/versions`),
        createResolutionVoting: (id, votingData) => api.post(`/resolutions/${id}/voting`, votingData),
        getResolutionVotingStatus: (id) => api.get(`/resolutions/${id}/voting-status`),
        submitPresidiumDraft: (data) => api.post('/resolutions/presidium-draft', data),
    },

    // Voting
    voting: {
        getAll: (params = {}) => api.get('/voting', { params }),
        getById: (id) => api.get(`/voting/${id}`),
        create: (data) => api.post('/voting', data),
        castVote: (id, vote) => api.post(`/voting/${id}/vote`, vote),
        getResults: (id) => api.get(`/voting/${id}/results`),
        endVoting: (id) => api.post(`/voting/${id}/end`),
        getEligibleVoters: (id) => api.get(`/voting/${id}/eligible-voters`),
        getRollCallOrder: (id) => api.get(`/voting/${id}/roll-call-order`),
        setCurrentVoter: (id, voterData) => api.put(`/voting/${id}/current-voter`, voterData),
        skipVote: (id) => api.post(`/voting/${id}/skip`),
        getSkippedCountries: (id) => api.get(`/voting/${id}/skipped-countries`),
        useVeto: (id, vetoData) => api.post(`/voting/${id}/veto`, vetoData),
        cancel: (id, cancelData) => api.delete(`/voting/${id}`, { data: cancelData }),
    },

    // Messages
    messages: {
        getAll: (params = {}) => api.get('/messages', { params }),
        send: (data) => api.post('/messages', data),
        markAsRead: (id) => api.put(`/messages/${id}/read`),

        getCommitteeMessages: (committeeId, params = {}) => api.get(`/messages/committee/${committeeId}`, { params }),
        sendToCommittee: (data) => api.post('/messages/committee', data),
        sendDiplomaticNote: (data) => api.post('/messages/diplomatic', data),
        getDiplomaticNotes: (params = {}) => api.get('/messages/diplomatic', { params }),
        markAllAsRead: (committeeId) => api.put(`/messages/committee/${committeeId}/read-all`),
        deleteMessage: (id) => api.delete(`/messages/${id}`),
    },

    // Export/PDF
    export: {
        generateQRPDF: (committeeId) => api.get(`/export/qr-codes/${committeeId}`, {
            responseType: 'blob'
        }),
        getStatistics: (committeeId) => api.get(`/export/statistics/${committeeId}`),
        getVotingResults: (committeeId) => api.get(`/export/voting-results/${committeeId}`),
        getResolutions: (committeeId) => api.get(`/export/resolutions/${committeeId}`),

        getEventCSV: (eventId) => api.get(`/export/event/${eventId}/csv`, { responseType: 'blob' }),
        getEventFullReport: (eventId) => api.get(`/export/event/${eventId}/full-report`, { responseType: 'blob' }),
        getCommitteeCSV: (committeeId) => api.get(`/export/committee/${committeeId}/csv`, { responseType: 'blob' }),
        getCommitteeStatistics: (committeeId) => api.get(`/export/committee/${committeeId}/statistics`, { responseType: 'blob' }),
        getResolutionsExport: (committeeId) => api.get(`/export/committee/${committeeId}/resolutions`, { responseType: 'blob' }),
        getVotingRecords: (committeeId) => api.get(`/export/committee/${committeeId}/voting-records`, { responseType: 'blob' }),
        getAttendanceExport: (committeeId) => api.get(`/export/committee/${committeeId}/attendance`, { responseType: 'blob' }),
        getMessagingStats: (committeeId) => api.get(`/export/committee/${committeeId}/messaging-stats`, { responseType: 'blob' }),

        getPDFExport: (type, id) => api.get(`/export/${type}/${id}/pdf`, { responseType: 'blob' }),
        getExcelExport: (type, id) => api.get(`/export/${type}/${id}/excel`, { responseType: 'blob' }),
        getJSONExport: (type, id) => api.get(`/export/${type}/${id}/json`),
    },

    // File upload helper
    uploadFile: (file, onProgress) => {
        const formData = new FormData()
        formData.append('file', file)

        return api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    onProgress(percentCompleted)
                }
            }
        })
    },


    // Sessions Management
    sessions: {
        getAll: (committeeId, params = {}) => api.get(`/sessions/${committeeId}`, { params }),
        getById: (id) => api.get(`/sessions/${id}`),
        create: (data) => api.post('/sessions', data),
        updateStatus: (id, statusData) => api.put(`/sessions/${id}/status`, statusData),
        delete: (id) => api.delete(`/sessions/${id}`),

        // Mode management
        changeMode: (id, modeData) => api.put(`/sessions/${id}/mode`, modeData),
        getCurrentMode: (id) => api.get(`/sessions/${id}/current-mode`),
        getModeHistory: (id) => api.post(`/sessions/${id}/mode-history`),

        // Speaker list management
        getSpeakerList: (id) => api.get(`/sessions/${id}/speaker-list`),
        updateSpeakerList: (id, speakerData) => api.put(`/sessions/${id}/speaker-list`, speakerData),
        addToSpeakerList: (id) => api.post(`/sessions/${id}/speaker-list/add`),
        removeFromSpeakerList: (id, data) => api.put(`/sessions/${id}/speaker-list/remove`, data),
        moveToEndOfList: (id) => api.put(`/sessions/${id}/speaker-list/move`),
        setCurrentSpeaker: (id, speakerData) => api.put(`/sessions/${id}/current-speaker`, speakerData),

        // Attendance management
        updateAttendance: (id, attendanceData) => api.put(`/sessions/${id}/attendance`, attendanceData),
        getAttendance: (id) => api.get(`/sessions/${id}/attendance`),
        getQuorum: (id) => api.get(`/sessions/${id}/quorum`)
    },

    // Timer Management
    timers: {
        getAll: (sessionId) => api.get(`/timers/${sessionId}`),

        // Session timer
        updateSessionTimer: (sessionId, timerData) => api.put(`/timers/${sessionId}/session`, timerData),

        // Speaker timer
        updateSpeakerTimer: (sessionId, timerData) => api.put(`/timers/${sessionId}/speaker`, timerData),

        // Additional timers
        createAdditionalTimer: (sessionId, timerData) => api.post(`/timers/${sessionId}/additional`, timerData),
        updateAdditionalTimer: (sessionId, timerId, timerData) => api.put(`/timers/${sessionId}/additional/${timerId}`, timerData),
        deleteAdditionalTimer: (sessionId, timerId) => api.delete(`/timers/${sessionId}/additional/${timerId}`),

        // Timer operations
        startTimer: (sessionId, type, data = {}) => api.post(`/timers/${sessionId}/${type}/start`, data),
        pauseTimer: (sessionId, type) => api.post(`/timers/${sessionId}/${type}/pause`),
        resumeTimer: (sessionId, type) => api.post(`/timers/${sessionId}/${type}/resume`),
        stopTimer: (sessionId, type) => api.post(`/timers/${sessionId}/${type}/stop`),
        extendTimer: (sessionId, type, extensionData) => api.put(`/timers/${sessionId}/${type}/extend`, extensionData),
        transferSpeakerTime: (sessionId, transferData) => api.post(`/timers/${sessionId}/speaker/transfer`, transferData),

        // Settings and history
        updateSettings: (sessionId, settings) => api.put(`/timers/${sessionId}/settings`, settings),
        getHistory: (sessionId) => api.get(`/timers/${sessionId}/history`)
    },


    // Statistics
    statistics: {
        getCommitteeStats: (committeeId) => api.get(`/statistics/committee/${committeeId}`),
        getDelegateStats: (committeeId, delegateEmail) => api.get(`/statistics/committee/${committeeId}/delegate/${delegateEmail}`),
        getLeaderboard: (committeeId, params = {}) => api.get(`/statistics/committee/${committeeId}/leaderboard`, { params }),
        getParticipationAnalytics: (committeeId, params = {}) => api.get(`/statistics/committee/${committeeId}/participation`, { params }),
        getDelegateAnalytics: (committeeId, delegateEmail) => api.get(`/statistics/committee/${committeeId}/delegate/${delegateEmail}/analytics`),
        exportCommitteeCSV: (committeeId) => api.get(`/statistics/committee/${committeeId}/export`, {
            responseType: 'blob'
        }),

        // Global statistics (admin only)
        getGlobalStats: () => api.get('/statistics/global'),
        getEventStats: (eventId) => api.get(`/statistics/event/${eventId}`),
        exportEventCSV: (eventId) => api.get(`/statistics/event/${eventId}/export`, {
            responseType: 'blob'
        })
    },

    // Presentation/Display
    presentation: {
        getDisplayData: (committeeId) => api.get(`/presentation/${committeeId}`),
        getSessionStatus: (committeeId) => api.get(`/presentation/${committeeId}/session-status`),
        getCurrentSpeaker: (committeeId) => api.get(`/presentation/${committeeId}/current-speaker`),
        getTimers: (committeeId) => api.get(`/presentation/${committeeId}/timers`),
        getVotingInfo: (committeeId) => api.get(`/presentation/${committeeId}/voting`),
        getQuorumStatus: (committeeId) => api.get(`/presentation/${committeeId}/quorum`),

        // Display control
        updateDisplay: (committeeId, data) => api.put(`/presentation/${committeeId}/update`, data),
        makeAnnouncement: (committeeId, announcement) => api.post(`/presentation/${committeeId}/announce`, announcement),
        highlightInfo: (committeeId, highlight) => api.put(`/presentation/${committeeId}/highlight`, highlight),
        sendEmergency: (committeeId, emergency) => api.post(`/presentation/${committeeId}/emergency`, emergency),

        // Settings
        updateSettings: (committeeId, settings) => api.put(`/presentation/${committeeId}/settings`, settings),
        getSettings: (committeeId) => api.get(`/presentation/${committeeId}/settings`)
    },
    // Procedures/Motions
    procedures: {
        // Procedural motions
        submitMotion: (data) => api.post('/motions', data),
        getMotions: (sessionId, params = {}) => api.get(`/motions/${sessionId}`, { params }),
        getMotion: (id) => api.get(`/motions/${id}`),
        reviewMotion: (id, reviewData) => api.put(`/motions/${id}/review`, reviewData),
        supportMotion: (id) => api.post(`/motions/${id}/support`),
        voteOnMotion: (id, voteData) => api.post(`/motions/${id}/vote`, voteData),

        // Presidium motions
        submitPresidiumMotion: (data) => api.post('/motions/presidium', data),
        updateMotionPriority: (id, priorityData) => api.put(`/motions/${id}/priority`, priorityData),

        // History and queue
        getMotionHistory: (sessionId) => api.get(`/motions/${sessionId}/history`),
        getMotionQueue: (sessionId) => api.get(`/motions/${sessionId}/queue`),

        // Questions
        submitQuestion: (data) => api.post('/questions', data),
        getQuestions: (sessionId, params = {}) => api.get(`/questions/${sessionId}`, { params }),
        getQuestion: (id) => api.get(`/questions/${id}`),
        answerQuestion: (id, answerData) => api.put(`/questions/${id}/answer`, answerData),
        updateQuestionPriority: (id, priorityData) => api.put(`/questions/${id}/priority`, priorityData)
    },
    // Health check
    health: {
        check: () => api.get('/health'),
        getSystemStatus: () => api.get('/health/system'),
        getDatabaseStatus: () => api.get('/health/database'),
        getServiceStatus: () => api.get('/health/services')
    }
}

export default api