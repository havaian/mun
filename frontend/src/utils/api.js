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
    get: (url, config = {}) => api.get(url, config),
    post: (url, data = {}, config = {}) => api.post(url, data, config),
    put: (url, data = {}, config = {}) => api.put(url, data, config),
    delete: (url, config = {}) => api.delete(url, config),
    patch: (url, data = {}, config = {}) => api.patch(url, data, config),

    // Admin Management
    admin: {
        // ✅ IMPLEMENTED - Dashboard
        getDashboardStats: () => api.get('/admin/dashboard/stats'),
        getRecentActivity: (params = {}) => api.get('/admin/dashboard/activity', { params }),

        // ✅ IMPLEMENTED - System Health  
        getSystemHealth: () => api.get('/health'),
        getPerformanceMetrics: () => api.get('/admin/performance/metrics'), // NOT USED
        getResponseTimes: (params = {}) => api.get('/admin/performance/response-times', { params }), // NOT USED

        // ✅ IMPLEMENTED - System Management
        clearCaches: () => api.post('/admin/system/clear-cache'),

        // ✅ IMPLEMENTED - Analytics
        getUserEngagementAnalytics: (params = {}) => api.get('/admin/analytics/user-engagement', { params }), // NOT USED
        getUsagePatterns: (params = {}) => api.get('/admin/analytics/usage-patterns', { params }), // NOT USED

        // ✅ IMPLEMENTED - Bulk Operations
        bulkGenerateQR: (data) => api.post('/admin/committees/bulk-qr', data),

        // ❌ TODO - Missing Implementation
        performMaintenance: (data) => api.post('/admin/maintenance/execute', data), // TODO: Route and controller not implemented // NOT USED

        // ❌ TODO - Missing Implementation (Reports System)
        getReportFields: (dataSource) => api.get(`/admin/reports/fields/${dataSource}`), // TODO: Route and controller not implemented
        generateReportPreview: (data) => api.post('/admin/reports/preview', data), // TODO: Route and controller not implemented
        saveReportTemplate: (data) => api.post('/admin/reports/templates', data), // TODO: Route and controller not implemented
        generateReport: (data) => api.post('/admin/reports/generate', data, { responseType: 'blob' }), // TODO: Route and controller not implemented
        generateCustomReport: (data) => api.post('/admin/reports/export', data, { responseType: 'blob' }), // TODO: Route and controller not implemented

        // ❌ TODO - Missing Implementation (Settings System)
        getSettings: () => api.get('/admin/settings'), // TODO: Route and controller not implemented
        updateSettings: (settings) => api.put('/admin/settings', { settings }), // TODO: Route and controller not implemented
        testEmailSettings: (emailSettings) => api.post('/admin/settings/test-email', { emailSettings }), // TODO: Route and controller not implemented

        // ⚠️ DUPLICATE - Two different signatures for backup
        createBackup: (data) => api.post('/admin/maintenance/backup', data), // DECISION NEEDED: This has data parameter
        // createBackup: () => api.post('/admin/maintenance/backup') // DUPLICATE: This has no parameters
    },

    // ✅ FULLY IMPLEMENTED - Authentication (8/8 methods working)
    auth: {
        adminLogin: (credentials) => api.post('/auth/admin-login', credentials),
        
        // Link login replaces qrLogin
        linkLogin: (data) => api.post('/auth/link-login', data),

        refreshToken: () => api.post('/auth/refresh-token'),
        refreshToken: () => api.post('/auth/refresh-token'),
        
        // Updated to use login tokens instead of QR tokens
        bindEmail: (data) => api.post('/auth/bind-email', data),
        
        // Updated email login to support login token verification
        emailLogin: (data) => api.post('/auth/email-login', data),
        
        logout: () => api.post('/auth/logout'),
        validateSession: () => api.get('/auth/validate-session'),
        
        // Check link status replaces QR status check
        checkLinkStatus: (token) => api.get(`/auth/link-status/${token}`),
        
        // Reactivate link replaces QR reactivation
        reactivateLink: (userId) => api.post('/auth/reactivate-link', { userId }),

        // LEGACY: Deprecated QR methods (for backward compatibility warnings)
        // These will return 410 Gone responses
        qrLogin: (token) => api.post('/auth/qr-login', { token }), // DEPRECATED
        checkQrStatus: (token) => api.get(`/auth/qr-status/${token}`), // DEPRECATED
        reactivateQr: (userId) => api.post('/auth/reactivate-qr', { userId }) // DEPRECATED
    },

    // ✅ FULLY IMPLEMENTED - Events (7/7 methods working)
    events: {
        getAll: (params = {}) => api.get('/events/', { params }),
        getById: (id) => api.get(`/events/${id}`), // NOT USED
        getByIdStats: (id) => api.get(`/events/${id}/statistics`), // NOT USED
        create: (data) => api.post('/events', data),
        update: (id, data) => api.put(`/events/${id}`, data),
        updateStatusById: (id, data) => api.put(`/events/${id}/status`, data), // NOT USED
        delete: (id) => api.delete(`/events/${id}`)
    },

    // Export Management  
    exports: {
        // ✅ IMPLEMENTED - Admin Export Routes
        getSystemConfig: () => api.get('/admin/export/config'),
        getAuditLogs: (params = {}) => api.get('/admin/export/audit-logs', { params }),

        // Login Links Export Routes (replaces QR exports)
        generateDelegateLinks: (committeeId, format = 'json') => api.get(`/export/delegate-links/${committeeId}`, { 
            params: { format }
        }),
        generatePresidiumLinks: (committeeId, format = 'json') => api.get(`/export/presidium-links/${committeeId}`, { 
            params: { format }
        }),
        generateCompleteLinks: (committeeId, format = 'json') => api.get(`/export/complete-links/${committeeId}`, { 
            params: { format }
        }),

        // ✅ IMPLEMENTED - Other export routes
        exportCommitteeStats: (committeeId) => api.get(`/export/statistics/${committeeId}`, { responseType: 'blob' }),
        exportVotingResults: (committeeId) => api.get(`/export/voting-results/${committeeId}`, { responseType: 'blob' }),
        exportResolutions: (committeeId) => api.get(`/export/resolutions/${committeeId}`, { responseType: 'blob' }),
        exportCompleteReport: (committeeId) => api.get(`/export/committee-report/${committeeId}`, { responseType: 'blob' }),

        // ❌ TODO - Admin Bulk Export Routes (Missing)
        exportCommitteesBulk: (ids) => api.get('/admin/committees/export', { 
            params: { ids },
            responseType: 'blob'
        }),
        exportEvents: () => api.get('/admin/events/export', { responseType: 'blob' }),
        exportUsers: () => api.get('/admin/users/export', { responseType: 'blob' }),

        // LEGACY: Deprecated QR export methods
        generateQRPDF: (committeeId) => {
            console.warn('generateQRPDF is deprecated. Use generateDelegateLinks with format=plain instead.');
            return api.get(`/export/qr-codes/${committeeId}`, { responseType: 'blob' }); // Will return 410 Gone
        },
        generatePresidiumQRPDF: (committeeId) => {
            console.warn('generatePresidiumQRPDF is deprecated. Use generatePresidiumLinks with format=plain instead.');
            return api.get(`/export/presidium-qr-codes/${committeeId}`, { responseType: 'blob' }); // Will return 410 Gone
        },
        generateCompleteQRPDF: (committeeId) => {
            console.warn('generateCompleteQRPDF is deprecated. Use generateCompleteLinks with format=plain instead.');
            return api.get(`/export/complete-qr-codes/${committeeId}`, { responseType: 'blob' }); // Will return 410 Gone
        }
    },

    // ✅ FULLY IMPLEMENTED - Committees (17/17 methods working perfectly)
    committees: {
        getAll: (params = {}) => api.get('/committees/', { params }),
        getById: (id) => api.get(`/committees/${id}`),
        create: (data) => api.post('/committees', data),
        update: (id, data) => api.put(`/committees/${id}`, data),
        delete: (id) => api.delete(`/committees/${id}`),
        addCountry: (id, countryData) => api.post(`/committees/${id}/countries`, countryData),
        removeCountry: (id, countryName) => api.delete(`/committees/${id}/countries/${countryName}`),
        updateCountryStatus: (id, countryName, statusData) => api.put(`/committees/${id}/countries/${countryName}/status`, statusData),
        
        // Login Links management (replaces QR codes)
        generateLoginLinks: (id, params = {}) => api.get(`/committees/${id}/login-links`, { params }),
        regenerateLoginLinks: (id, reason = null) => api.post(`/committees/${id}/login-links/regenerate`, { reason }),
        regenerateCountryLoginLink: (id, countryName, reason = null) => api.post(`/committees/${id}/login-links/${countryName}/regenerate`, { reason }),
        
        // Presidium login links (replaces QR codes)  
        generatePresidiumLoginLinks: (id, params = {}) => api.post(`/committees/${id}/presidium/generate-links`, {}, { params }),
        resetPresidiumLoginLink: (id, role, reason = null) => api.post(`/committees/${id}/presidium/${role}/reset-link`, { reason }),
        
        // Status and information
        getPresidium: (id) => api.get(`/committees/${id}/presidium`),
        updatePresidium: (id, presidiumData) => api.put(`/committees/${id}/presidium`, presidiumData),
        getPresidiumStatus: (id) => api.get(`/committees/${id}/presidium/status`),
        getLoginTokens: (id) => api.get(`/committees/${id}/login-tokens`),

        // LEGACY METHODS: Deprecated QR methods with warnings
        generateQRs: (id) => {
            console.warn('generateQRs is deprecated. Use generateLoginLinks instead.');
            return api.get(`/committees/${id}/qr-codes`); // Will return 410 Gone
        },
        regenerateQRs: (id) => {
            console.warn('regenerateQRs is deprecated. Use regenerateLoginLinks instead.');
            return api.post(`/committees/${id}/qr-codes/regenerate`); // Will return 410 Gone
        },
        generatePresidiumQRs: (id, data) => {
            console.warn('generatePresidiumQRs is deprecated. Use generatePresidiumLoginLinks instead.');
            return api.post(`/committees/${id}/presidium/generate-qrs`, data); // Will return 410 Gone
        },
        resetPresidiumQRs: (id, role, data) => {
            console.warn('resetPresidiumQRs is deprecated. Use resetPresidiumLoginLink instead.');
            return api.post(`/committees/${id}/presidium/${role}/reset-qr`, data); // Will return 410 Gone
        },
        getQRTokens: (id) => {
            console.warn('getQRTokens is deprecated. Use getLoginTokens instead.');
            return api.get(`/committees/${id}/qr-tokens`); // Will return 410 Gone
        }
    },

    // ✅ IMPLEMENTED - Countries (6/7 methods working)  
    countries: {
        getAll: (params = {}) => api.get('/countries/', { params }),
        getByCode: (code, params = {}) => api.get(`/countries/${code}`, { params }), // NOT USED
        getFlag: (code) => api.get(`/countries/flags/${code}`),

        // ⚠️ MISMATCH - Route path mismatch
        getAllFlags: () => api.get('/countries/flags/all'), // MISMATCH: Backend route is '/countries/flags/all/batch' // NOT USED

        getAllFlagsBatch: () => api.get('/countries/flags/all/batch'), // NOT USED
        getFlagsMetaInfo: () => api.get('/countries/flags/meta/info'), // NOT USED
        getMetaHealth: () => api.get('/countries/meta/health'), // NOT USED
        refreshCache: () => api.post('/countries/admin/refresh-flags') // NOT USED
    },

    // ⚠️ PARTIAL IMPLEMENTATION - Documents (6/10 methods have issues)
    documents: {
        // ✅ IMPLEMENTED - Basic Document Management
        getAll: (params = {}) => api.get('/documents/', { params }),
        getById: (id) => api.get(`/documents/${id}`), // NOT USED

        // ⚠️ MISMATCH - General upload route missing
        upload: (formData) => api.post('/documents/', formData, { // MISMATCH: Backend has no general '/documents/' POST route, only specific ones // NOT USED
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

        download: (id) => api.get(`/documents/${id}/download`, {
            responseType: 'blob'
        }),
        getDocumentVersions: (id) => api.get(`/documents/${id}/versions`), // NOT USED
        preview: (id) => api.get(`/documents/${id}/preview`),

        // ❌ MISSING - General delete route
        delete: (id) => api.delete(`/documents/${id}`), // TODO: No general delete route implemented // NOT USED

        // ✅ IMPLEMENTED - Position Papers
        createPositionPapers: (data) => api.post('/documents/position-papers', data), // NOT USED

        // ⚠️ MISMATCH - Method mismatch (GET vs POST)
        getPositionPapersForCommittee: (committeeId) => api.post(`/documents/position-papers/${committeeId}`), // MISMATCH: Backend uses GET, not POST // NOT USED

        // ⚠️ MISMATCH - Route path mismatch  
        reviewPositionPapersForCommittee: (committeeId, data) => api.put(`/documents/position-papers/${committeeId}`, data), // MISMATCH: Backend route is '/documents/position-papers/:id/review' // NOT USED

        // ✅ IMPLEMENTED - Public Documents
        uploadPublicDocument: (data) => api.post('/documents/public', data), // NOT USED
        getPublicDocumentsForCommittee: (committeeId, data) => api.get(`/documents/public/${committeeId}`, data), // NOT USED

        // ❌ MISSING - Get single public document
        getPublicDocumentsById: (id, data) => api.get(`/documents/public/${id}`, data), // TODO: Route not implemented // NOT USED

        deletePublicDocumentsById: (id) => api.delete(`/documents/public/${id}`), // NOT USED
    },

    // ✅ FULLY IMPLEMENTED - Coalitions (6/6) & Resolutions (7/7), 🚨 MISSING - Amendments (11/11)
    resolutions: {
        // ✅ FULLY IMPLEMENTED - Coalitions (6/6 methods working)
        createCoalition: (data) => api.post('/resolutions/coalitions', data), // NOT USED
        getCoalitions: (committeeId, params = {}) => api.get(`/resolutions/coalitions/${committeeId}`, { params }), // NOT USED
        getCoalition: (id) => api.get(`/resolutions/coalitions/detail/${id}`), // NOT USED
        respondToInvitation: (id, response) => api.put(`/resolutions/coalitions/${id}/respond`, response), // NOT USED
        activateCoalition: (id) => api.put(`/resolutions/coalitions/${id}/activate`), // NOT USED
        leaveCoalition: (id) => api.delete(`/resolutions/coalitions/${id}/leave`), // NOT USED

        // ✅ FULLY IMPLEMENTED - Resolutions (7/7 methods working)
        submit: (data) => api.post('/resolutions', data), // NOT USED
        getAll: (committeeId, params = {}) => api.get(`/resolutions/${committeeId}`, { params }), // NOT USED
        getById: (id) => api.get(`/resolutions/detail/${id}`), //
        review: (id, reviewData) => api.put(`/resolutions/${id}/review`, reviewData), // NOT USED
        submitNewVersion: (id, formData) => api.post(`/resolutions/${id}/new-version`, formData, { // NOT USED
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        getResolutionVersions: (id) => api.get(`/resolutions/${id}/versions`), // NOT USED
        submitPresidiumDraft: (data) => api.post('/resolutions/presidium-draft', data), // NOT USED

        // ❌ MISSING - Resolution Voting (likely should be in voting module)
        createResolutionVoting: (id, votingData) => api.post(`/resolutions/${id}/voting`, votingData), // TODO: Route not found in resolutions module // NOT USED
        getResolutionVotingStatus: (id) => api.get(`/resolutions/${id}/voting-status`), // TODO: Route not found in resolutions module // NOT USED

        // 🚨 CRITICAL - ENTIRE AMENDMENT SYSTEM MISSING (11/11 methods not implemented)
        // ❌ All amendment routes missing - need to create '/amendments/*' routes + controller
        submitAmendment: (data) => api.post('/amendments', data), // CRITICAL: No amendment routes exist at all // NOT USED
        getAmendments: (resolutionId, params = {}) => api.get(`/amendments/${resolutionId}`, { params }), // CRITICAL: No amendment routes exist // NOT USED
        getAmendment: (id) => api.get(`/amendments/${id}`), // CRITICAL: No amendment routes exist //
        reviewAmendment: (id, reviewData) => api.put(`/amendments/${id}/review`, reviewData), // CRITICAL: No amendment routes exist // NOT USED
        inviteCoauthor: (id, invitationData) => api.post(`/amendments/${id}/invite-coauthor`, invitationData), // CRITICAL: No amendment routes exist // NOT USED
        respondToCoauthor: (id, responseData) => api.put(`/amendments/${id}/coauthor-response`, responseData), // CRITICAL: No amendment routes exist // NOT USED

        // Second-order amendments
        createSecondOrderAmendment: (id, data) => api.post(`/amendments/${id}/second-order`, data), // CRITICAL: No amendment routes exist // NOT USED
        voteOnSecondOrder: (id, voteData) => api.post(`/amendments/${id}/second-order/vote`, voteData), // CRITICAL: No amendment routes exist // NOT USED

        // Amendment voting
        createAmendmentVoting: (id, votingData) => api.post(`/amendments/${id}/voting`, votingData), // CRITICAL: No amendment routes exist // NOT USED
        getAmendmentVotingStatus: (id) => api.get(`/amendments/${id}/voting-status`), // CRITICAL: No amendment routes exist // NOT USED
        getAmendmentPriorityOrder: (committeeId) => api.get(`/amendments/committee/${committeeId}/priority-order`), // CRITICAL: No amendment routes exist // NOT USED
    },

    // ✅ IMPLEMENTED - Voting (8/13 methods working) ❌ MISSING - 5 routes need implementation
    voting: {
        getAll: (params = {}) => api.get('/voting', { params }),
        getById: (id) => api.get(`/voting/${id}`),
        create: (data) => api.post('/voting', data),
        castVote: (id, vote) => api.post(`/voting/${id}/vote`, vote),
        getResults: (id) => api.get(`/voting/${id}/results`), // NOT USED
        endVoting: (id) => api.post(`/voting/${id}/end`),
        getEligibleVoters: (id) => api.get(`/voting/${id}/eligible-voters`),
        getRollCallOrder: (id) => api.get(`/voting/${id}/roll-call-order`),
        setCurrentVoter: (id, voterData) => api.put(`/voting/${id}/current-voter`, voterData),
        skipVote: (id) => api.post(`/voting/${id}/skip`),
        getSkippedCountries: (id) => api.get(`/voting/${id}/skipped-countries`),
        useVeto: (id, vetoData) => api.post(`/voting/${id}/veto`, vetoData),
        cancel: (id, cancelData) => api.delete(`/voting/${id}`, { data: cancelData }),

        // ❌ MISSING - 5 routes need implementation  
        getResults: (id) => api.get(`/voting/${id}/results`), // TODO: No dedicated results endpoint // NOT USED
        endVoting: (id) => api.post(`/voting/${id}/end`), // MISMATCH: Backend has PUT /voting/:id/complete not POST /voting/:id/end
        setCurrentVoter: (id, voterData) => api.put(`/voting/${id}/current-voter`, voterData), // TODO: No route exists for manually setting current voter
        getSkippedCountries: (id) => api.get(`/voting/${id}/skipped-countries`), // TODO: Data included in getRollCallOrder, but no dedicated endpoint // NOT USED
        useVeto: (id, vetoData) => api.post(`/voting/${id}/veto`, vetoData), // TODO: Veto handled within castVote, but no separate veto endpoint
    },

    // 🚨 CRITICAL MISMATCH - Messages (0/10 methods working) - Architectural differences
    messages: {
        // ❌ MISSING - Frontend expects simple messaging, backend uses conversation-based system
        getAll: (params = {}) => api.get('/messages', { params }), // MISMATCH: Backend uses conversation-based system // NOT USED
        send: (data) => api.post('/messages', data), // MISMATCH: Backend requires conversation creation first // NOT USED
        markAsRead: (id) => api.put(`/messages/${id}/read`), // MISMATCH: Different read mechanism // NOT USED

        getCommitteeMessages: (committeeId, params = {}) => api.get(`/messages/committee/${committeeId}`, { params }), // ✅ IMPLEMENTED // NOT USED
        sendToCommittee: (data) => api.post('/messages/committee', data), // TODO: Missing route - backend uses conversation system // NOT USED
        sendDiplomaticNote: (data) => api.post('/messages/diplomatic', data), // TODO: Missing route - no diplomatic note system // NOT USED
        getDiplomaticNotes: (params = {}) => api.get('/messages/diplomatic', { params }), // TODO: Missing route - no diplomatic note system // NOT USED
        markAllAsRead: (committeeId) => api.put(`/messages/committee/${committeeId}/read-all`), // TODO: Missing route // NOT USED
        deleteMessage: (id) => api.delete(`/messages/${id}`), // TODO: Backend only has conversation management // NOT USED
    },

    // ⚠️ MISMATCH - File upload helper (general upload route missing) // NOT USED
    uploadFile: (file, onProgress) => {
        const formData = new FormData()
        formData.append('file', file)

        // MISMATCH: Backend has no general '/documents' POST route, only specific ones
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

    // ✅ FULLY IMPLEMENTED - Sessions (14/15 methods working) ⚠️ 1 minor method mismatch
    sessions: {
        getAll: (committeeId, params = {}) => api.get(`/sessions/${committeeId}`, { params }),
        getById: (id) => api.get(`/sessions/detail/${id}`), // ✅ IMPLEMENTED (note: backend uses /sessions/detail/:id)
        create: (data) => api.post('/sessions', data),
        updateStatus: (id, statusData) => api.put(`/sessions/${id}/status`, statusData),
        delete: (id) => api.delete(`/sessions/${id}`), // NOT USED

        // Mode management
        changeMode: (id, modeData) => api.put(`/sessions/${id}/mode`, modeData),
        getCurrentMode: (id) => api.get(`/sessions/${id}/current-mode`), // NOT USED
        getModeHistory: (id) => api.post(`/sessions/${id}/mode-history`), // MISMATCH: Frontend uses POST, backend uses GET // NOT USED

        // Speaker list management
        getSpeakerList: (id) => api.get(`/sessions/${id}/speaker-list`), // NOT USED
        updateSpeakerList: (id, speakerData) => api.put(`/sessions/${id}/speaker-list`, speakerData), // NOT USED
        addToSpeakerList: (id) => api.post(`/sessions/${id}/speaker-list/add`),
        removeFromSpeakerList: (id, data) => api.put(`/sessions/${id}/speaker-list/remove`, data), // ✅ WORKING (uses general speaker list update)
        moveToEndOfList: (id) => api.put(`/sessions/${id}/speaker-list/move`),
        setCurrentSpeaker: (id, speakerData) => api.put(`/sessions/${id}/current-speaker`, speakerData),

        // Attendance management
        updateAttendance: (id, attendanceData) => api.put(`/sessions/${id}/attendance`, attendanceData),
        getAttendance: (id) => api.get(`/sessions/${id}/attendance`), // NOT USED
        getQuorum: (id) => api.get(`/sessions/${id}/quorum`) // NOT USED
    },

    // 🚨 ARCHITECTURAL MISMATCH - Timer Management (0/12 methods working) - Complete mismatch
    timers: {
        // ❌ ALL ROUTES MISSING - Frontend expects session-centric, backend uses individual timer entities
        getAll: (sessionId) => api.get(`/timers/${sessionId}`), // MISMATCH: Backend has GET /timers/session/:sessionId/active // NOT USED

        // Session timer
        updateSessionTimer: (sessionId, timerData) => api.put(`/timers/${sessionId}/session`, timerData), // TODO: Route doesn't exist // NOT USED

        // Speaker timer
        updateSpeakerTimer: (sessionId, timerData) => api.put(`/timers/${sessionId}/speaker`, timerData), // TODO: Route doesn't exist // NOT USED

        // Additional timers
        createAdditionalTimer: (sessionId, timerData) => api.post(`/timers/${sessionId}/additional`, timerData), // TODO: Route doesn't exist
        updateAdditionalTimer: (sessionId, timerId, timerData) => api.put(`/timers/${sessionId}/additional/${timerId}`, timerData), // TODO: Route doesn't exist
        deleteAdditionalTimer: (sessionId, timerId) => api.delete(`/timers/${sessionId}/additional/${timerId}`), // TODO: Route doesn't exist

        // Timer operations - ALL MISSING
        startTimer: (sessionId, type, data = {}) => api.post(`/timers/${sessionId}/${type}/start`, data), // TODO: Backend uses PUT /timers/:id/start
        pauseTimer: (sessionId, type) => api.post(`/timers/${sessionId}/${type}/pause`), // TODO: Backend uses PUT /timers/:id/pause
        resumeTimer: (sessionId, type) => api.post(`/timers/${sessionId}/${type}/resume`), // TODO: Backend uses PUT /timers/:id/resume
        stopTimer: (sessionId, type) => api.post(`/timers/${sessionId}/${type}/stop`), // TODO: Backend uses PUT /timers/:id/complete
        extendTimer: (sessionId, type, extensionData) => api.put(`/timers/${sessionId}/${type}/extend`, extensionData), // TODO: Backend uses PUT /timers/:id/extend
        transferSpeakerTime: (sessionId, transferData) => api.post(`/timers/${sessionId}/speaker/transfer`, transferData), // TODO: Route doesn't exist // NOT USED

        // Settings and history
        updateSettings: (sessionId, settings) => api.put(`/timers/${sessionId}/settings`, settings), // TODO: Route doesn't exist // NOT USED
        getHistory: (sessionId) => api.get(`/timers/${sessionId}/history`) // TODO: Route doesn't exist // NOT USED
    },

    // ✅ WORKING - Statistics (5/9 methods working) ⚠️ 1 parameter mismatch, ❌ 3 admin routes missing
    statistics: {
        getCommitteeStats: (committeeId) => api.get(`/statistics/committee/${committeeId}`), // NOT USED
        getDelegateStats: (committeeId, delegateEmail) => api.get(`/statistics/committee/${committeeId}/delegate/${delegateEmail}`), // MISMATCH: Backend uses /statistics/delegate/:email?committeeId=... // NOT USED
        getLeaderboard: (committeeId, params = {}) => api.get(`/statistics/committee/${committeeId}/rankings`, { params }), // ✅ IMPLEMENTED (backend calls it "rankings") // NOT USED
        getParticipationAnalytics: (committeeId, params = {}) => api.get(`/statistics/committee/${committeeId}/analytics/participation`, { params }), // NOT USED
        exportCommitteeCSV: (committeeId) => api.get(`/statistics/committee/${committeeId}/export`, { // NOT USED
            responseType: 'blob'
        }),

        // ❌ MISSING - Delegate analytics route
        getDelegateAnalytics: (committeeId, delegateEmail) => api.get(`/statistics/committee/${committeeId}/delegate/${delegateEmail}/analytics`), // TODO: Route doesn't exist // NOT USED

        // ❌ MISSING - Admin-only routes (all missing)
        getGlobalStats: () => api.get('/statistics/global'), // TODO: Route not implemented // NOT USED
        getEventStats: (eventId) => api.get(`/statistics/event/${eventId}`), // TODO: Route not implemented // NOT USED
        exportEventCSV: (eventId) => api.get(`/statistics/event/${eventId}/export`, { // NOT USED
            responseType: 'blob'
        }) // TODO: Route not implemented
    },

    // 🚨 CRITICAL - Presentation/Display (0/12 methods working) - Entire system is placeholder
    presentation: {
        // ❌ ALL ROUTES MISSING - Only 2 placeholder routes exist
        getDisplayData: (committeeId) => api.get(`/presentation/${committeeId}`), // PLACEHOLDER: Returns "Coming soon" message // NOT USED
        getSessionStatus: (committeeId) => api.get(`/presentation/${committeeId}/session-status`), // TODO: Route doesn't exist // NOT USED
        getCurrentSpeaker: (committeeId) => api.get(`/presentation/${committeeId}/current-speaker`), // TODO: Route doesn't exist // NOT USED
        getTimers: (committeeId) => api.get(`/presentation/${committeeId}/timers`), // TODO: Route doesn't exist // NOT USED
        getVotingInfo: (committeeId) => api.get(`/presentation/${committeeId}/voting`), // TODO: Route doesn't exist // NOT USED
        getQuorumStatus: (committeeId) => api.get(`/presentation/${committeeId}/quorum`), // TODO: Route doesn't exist // NOT USED

        // Display control - ALL MISSING
        updateDisplay: (committeeId, data) => api.put(`/presentation/${committeeId}/update`, data), // TODO: Route doesn't exist // NOT USED
        makeAnnouncement: (committeeId, announcement) => api.post(`/presentation/${committeeId}/announce`, announcement), // PLACEHOLDER: Returns "Coming soon" // NOT USED
        highlightInfo: (committeeId, highlight) => api.put(`/presentation/${committeeId}/highlight`, highlight), // TODO: Route doesn't exist // NOT USED
        sendEmergency: (committeeId, emergency) => api.post(`/presentation/${committeeId}/emergency`, emergency), // TODO: Route doesn't exist // NOT USED

        // Settings - ALL MISSING
        updateSettings: (committeeId, settings) => api.put(`/presentation/${committeeId}/settings`, settings), // TODO: Route doesn't exist // NOT USED
        getSettings: (committeeId) => api.get(`/presentation/${committeeId}/settings`) // TODO: Route doesn't exist // NOT USED
    },

    // ✅ WORKING - Procedures/Motions (8/15 methods working) ⚠️ 5 route path mismatches, ❌ 2 missing features
    procedures: {
        // Procedural motions
        submitMotion: (data) => api.post('/motions', data), // MISMATCH: Backend uses /procedure/motions
        getMotions: (sessionId, params = {}) => api.get(`/motions/${sessionId}`, { params }), // MISMATCH: Backend uses /procedure/motions/session/:sessionId // NOT USED
        getMotion: (id) => api.get(`/motions/${id}`), // MISMATCH: Backend uses /procedure/motions/:id // NOT USED
        reviewMotion: (id, reviewData) => api.put(`/motions/${id}/review`, reviewData), // MISMATCH: Backend uses /procedure/motions/:id/review // NOT USED
        supportMotion: (id) => api.post(`/motions/${id}/support`), // MISMATCH: Backend uses /procedure/motions/:id/support // NOT USED
        voteOnMotion: (id, voteData) => api.post(`/motions/${id}/vote`, voteData), // TODO: No voting on motions implemented // NOT USED

        // Presidium motions
        submitPresidiumMotion: (data) => api.post('/motions/presidium', data), // MISMATCH: Backend uses /procedure/motions/presidium // NOT USED
        updateMotionPriority: (id, priorityData) => api.put(`/motions/${id}/priority`, priorityData), // TODO: No priority update route exists // NOT USED

        // History and queue
        getMotionHistory: (sessionId) => api.get(`/motions/${sessionId}/history`), // TODO: No history endpoint exists // NOT USED
        getMotionQueue: (sessionId) => api.get(`/motions/${sessionId}/queue`), // MISMATCH: Backend uses /procedure/motions/session/:sessionId/queue // NOT USED

        // Questions
        submitQuestion: (data) => api.post('/questions', data), // MISMATCH: Backend uses /procedure/questions // NOT USED
        getQuestions: (sessionId, params = {}) => api.get(`/questions/${sessionId}`, { params }), // MISMATCH: Backend uses /procedure/questions/session/:sessionId // NOT USED
        getQuestion: (id) => api.get(`/questions/${id}`), // MISMATCH: Backend uses /procedure/questions/:id (implied) // NOT USED
        answerQuestion: (id, answerData) => api.put(`/questions/${id}/answer`, answerData), // MISMATCH: Backend uses /procedure/questions/:id/answer // NOT USED
        updateQuestionPriority: (id, priorityData) => api.put(`/questions/${id}/priority`, priorityData) // TODO: No priority update route exists // NOT USED
    },

    // 🚨 CRITICAL - User Management (0/7 methods working) - Entire module missing
    user: {
        // ❌ ALL ROUTES MISSING - No user routes module registered in backend
        getProfile: () => api.get('/user/profile'), // CRITICAL: No /api/user routes exist at all
        updateProfile: (profile) => api.put('/user/profile', { profile }), // CRITICAL: User module not registered in backend
        updateAccount: (account) => api.put('/user/account', { account }), // CRITICAL: User routes, controller, all missing
        changePassword: (currentPassword, newPassword) => api.put('/user/password', { currentPassword, newPassword }), // CRITICAL: Complete gap in backend
        enable2FA: () => api.post('/user/enable-2fa'), // CRITICAL: Security features not implemented
        disable2FA: () => api.post('/user/disable-2fa'), // CRITICAL: 2FA system missing
        updateNotifications: (notifications) => api.put('/user/notifications', { notifications }) // CRITICAL: Notification preferences missing
    },

    // Health check
    health: {
        check: () => api.get('/health'),
        getSystemStatus: () => api.get('/health/system'), // NOT USED
        getDatabaseStatus: () => api.get('/health/database'), // NOT USED
        getServiceStatus: () => api.get('/health/services') // NOT USED
    }
}

export default api