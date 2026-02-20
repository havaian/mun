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
        } else if (!error.response) {
            // Network error
            toast.error('Network error. Please check your connection.')
        } else {
            const status = error.response.status

            switch (status) {
                case 401:
                    // Token expired or invalid — clear auth
                    if (error.response.data?.code === 'TOKEN_EXPIRED' ||
                        error.response.data?.code === 'INVALID_TOKEN') {
                        localStorage.removeItem('mun_token')
                        // Only redirect if not already on auth page
                        if (!window.location.pathname.startsWith('/auth')) {
                            window.location.href = '/auth/login'
                        }
                    }
                    break
                case 403:
                    toast.error('You do not have permission to perform this action.')
                    break
                case 429:
                    toast.error('Too many requests. Please slow down.')
                    break
                case 500:
                    toast.error('Server error. Please try again later.')
                    break
                // Don't auto-toast 400/404 — let callers handle those
            }
        }

        return Promise.reject(error)
    }
)

// =============================================
// URL HELPERS
// =============================================

// Build org-scoped event base: /organizations/:orgId/events/:eventId
const eventBase = (orgId, eventId) => `/organizations/${orgId}/events/${eventId}`

// Build committee-scoped base: /organizations/:orgId/events/:eventId/committees/:committeeId
const committeeBase = (orgId, eventId, committeeId) => `${eventBase(orgId, eventId)}/committees/${committeeId}`

// =============================================
// API METHODS — organized by module
// =============================================

export const apiMethods = {

    // =============================================
    // AUTH
    // =============================================
    auth: {
        register: (data) => api.post('/auth/register', data),
        login: (credentials) => api.post('/auth/login', credentials),
        getMe: () => api.get('/auth/me'),
        updateProfile: (data) => api.put('/auth/profile', data),
        changePassword: (data) => api.put('/auth/change-password', data),
        requestPasswordReset: (email) => api.post('/auth/password-reset/request', { email }),
        confirmPasswordReset: (data) => api.post('/auth/password-reset/confirm', data),
    },

    // =============================================
    // ORGANIZATIONS (SuperAdmin)
    // =============================================
    organizations: {
        getAll: (params = {}) => api.get('/organizations', { params }),
        getById: (identifier) => api.get(`/organizations/${identifier}`),
        create: (data) => api.post('/organizations', data),
        update: (id, data) => api.put(`/organizations/${id}`, data),
        delete: (id) => api.delete(`/organizations/${id}`),
        assignAdmin: (id, data) => api.post(`/organizations/${id}/assign-admin`, data),
    },

    // =============================================
    // ORG MEMBERS — /api/organizations/:orgId/members
    // =============================================
    orgMembers: {
        getAll: (orgId, params = {}) => api.get(`/organizations/${orgId}/members`, { params }),
        add: (orgId, data) => api.post(`/organizations/${orgId}/members`, data),
        invite: (orgId, data) => api.post(`/organizations/${orgId}/members/invite`, data),
        updatePermissions: (orgId, membershipId, data) => api.put(`/organizations/${orgId}/members/${membershipId}/permissions`, data),
        remove: (orgId, membershipId) => api.delete(`/organizations/${orgId}/members/${membershipId}`),
        getInvitations: (orgId) => api.get(`/organizations/${orgId}/members/invitations`),
        cancelInvitation: (orgId, invitationId) => api.delete(`/organizations/${orgId}/members/invitations/${invitationId}`),
        getPermissionsList: (orgId) => api.get(`/organizations/${orgId}/members/permissions-list`),
    },

    // =============================================
    // INVITATIONS (user-facing)
    // =============================================
    invitations: {
        getInfo: (token) => api.get(`/invitations/${token}/info`),
        accept: (token) => api.post(`/invitations/${token}/accept`),
        getMy: () => api.get('/invitations/my'),
    },

    // =============================================
    // NOTIFICATIONS
    // =============================================
    notifications: {
        getAll: (params = {}) => api.get('/notifications', { params }),
        getUnreadCount: () => api.get('/notifications/unread-count'),
        markAsRead: (id) => api.put(`/notifications/${id}/read`),
        markAllAsRead: () => api.put('/notifications/read-all'),
    },

    // =============================================
    // EVENTS — /api/organizations/:orgId/events
    // =============================================
    events: {
        getAll: (orgId, params = {}) => api.get(`/organizations/${orgId}/events`, { params }),
        getById: (orgId, eventIdentifier) => api.get(`/organizations/${orgId}/events/${eventIdentifier}`),
        getPublic: (orgSlug, eventSlug) => api.get(`/public/events/${orgSlug}/${eventSlug}`),
        getPublicRegistration: (orgSlug, eventSlug) => api.get(`/public/events/${orgSlug}/${eventSlug}/registration`),
        create: (orgId, data) => api.post(`/organizations/${orgId}/events`, data),
        update: (orgId, eventId, data) => api.put(`/organizations/${orgId}/events/${eventId}`, data),
        updateStatus: (orgId, eventId, data) => api.put(`/organizations/${orgId}/events/${eventId}/status`, data),
        delete: (orgId, eventId) => api.delete(`/organizations/${orgId}/events/${eventId}`),
        getStatistics: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/statistics`),
    },

    // =============================================
    // MEDIA UPLOADS
    // =============================================
    media: {
        upload: (file) => {
            const formData = new FormData()
            formData.append('file', file)
            return api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        uploadMultiple: (files) => {
            const formData = new FormData()
            files.forEach(f => formData.append('files', f))
            return api.post('/media/upload-multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        delete: (filename) => api.delete(`/media/${filename}`),
    },

    // =============================================
    // PUBLIC ENDPOINTS (no auth required)
    // =============================================
    public: {
        getOrg: (orgSlug) => api.get(`/public/org/${orgSlug}`),
        getEvent: (orgSlug, eventSlug) => api.get(`/public/events/${orgSlug}/${eventSlug}`),
        getRegistration: (orgSlug, eventSlug) => api.get(`/public/events/${orgSlug}/${eventSlug}/registration`),
    },

    // =============================================
    // PARTICIPANTS — /api/organizations/:orgId/events/:eventId/participants
    // =============================================
    participants: {
        getAll: (orgId, eventId, params = {}) => api.get(`${eventBase(orgId, eventId)}/participants`, { params }),
        getById: (orgId, eventId, participantId) => api.get(`${eventBase(orgId, eventId)}/participants/${participantId}`),
        add: (orgId, eventId, data) => api.post(`${eventBase(orgId, eventId)}/participants`, data),
        update: (orgId, eventId, participantId, data) => api.put(`${eventBase(orgId, eventId)}/participants/${participantId}`, data),
        remove: (orgId, eventId, participantId) => api.delete(`${eventBase(orgId, eventId)}/participants/${participantId}`),
        getByCommittee: (orgId, eventId) => api.get(`${eventBase(orgId, eventId)}/participants/by-committee`),
        getMyParticipation: (orgId, eventId) => api.get(`${eventBase(orgId, eventId)}/participants/me`),
    },

    // =============================================
    // REGISTRATION — /api/organizations/:orgId/events/:eventId/registration
    // =============================================
    registration: {
        // Form management (moderators)
        getForm: (orgId, eventId) => api.get(`${eventBase(orgId, eventId)}/registration/form`),
        upsertForm: (orgId, eventId, data) => api.put(`${eventBase(orgId, eventId)}/registration/form`, data),
        getFormOptions: (orgId, eventId) => api.get(`${eventBase(orgId, eventId)}/registration/form/options`),

        // Public form (applicants)
        getPublicForm: (orgId, eventId) => api.get(`${eventBase(orgId, eventId)}/registration/form/public`),

        // Applications — applicant
        submit: (orgId, eventId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications`, data),
        getMyApplication: (orgId, eventId) => api.get(`${eventBase(orgId, eventId)}/registration/applications/me`),
        withdraw: (orgId, eventId) => api.post(`${eventBase(orgId, eventId)}/registration/applications/me/withdraw`),

        // Applications — moderator
        getApplications: (orgId, eventId, params = {}) => api.get(`${eventBase(orgId, eventId)}/registration/applications`, { params }),
        getApplication: (orgId, eventId, appId) => api.get(`${eventBase(orgId, eventId)}/registration/applications/${appId}`),
        moveToStage: (orgId, eventId, appId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications/${appId}/move`, data),
        returnForRevision: (orgId, eventId, appId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications/${appId}/return`, data),
        accept: (orgId, eventId, appId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications/${appId}/accept`, data),
        reject: (orgId, eventId, appId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications/${appId}/reject`, data),
        addNote: (orgId, eventId, appId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications/${appId}/notes`, data),
        updateInterview: (orgId, eventId, appId, data) => api.put(`${eventBase(orgId, eventId)}/registration/applications/${appId}/interview`, data),
        verifyPayment: (orgId, eventId, appId, data) => api.post(`${eventBase(orgId, eventId)}/registration/applications/${appId}/payment/verify`, data),
    },

    // =============================================
    // COMMITTEES — /api/organizations/:orgId/events/:eventId/committees
    // =============================================
    committees: {
        getAll: (orgId, eventId, params = {}) => api.get(`${eventBase(orgId, eventId)}/committees`, { params }),
        getById: (orgId, eventId, committeeId) => api.get(`${eventBase(orgId, eventId)}/committees/${committeeId}`),
        create: (orgId, eventId, data) => api.post(`${eventBase(orgId, eventId)}/committees`, data),
        update: (orgId, eventId, committeeId, data) => api.put(`${eventBase(orgId, eventId)}/committees/${committeeId}`, data),
        delete: (orgId, eventId, committeeId) => api.delete(`${eventBase(orgId, eventId)}/committees/${committeeId}`),

        // Country management
        getCountries: (orgId, eventId, committeeId) => api.get(`${eventBase(orgId, eventId)}/committees/${committeeId}/countries`),
        addCountries: (orgId, eventId, committeeId, data) => api.put(`${eventBase(orgId, eventId)}/committees/${committeeId}/countries`, data),
        removeCountry: (orgId, eventId, committeeId, countryName) => api.delete(`${eventBase(orgId, eventId)}/committees/${committeeId}/countries/${encodeURIComponent(countryName)}`),
        updateCountryStatus: (orgId, eventId, committeeId, countryName, data) => api.put(`${eventBase(orgId, eventId)}/committees/${committeeId}/countries/${encodeURIComponent(countryName)}/status`, data),

        // Login links
        getLoginLinks: (orgId, eventId, committeeId, params = {}) => api.get(`${eventBase(orgId, eventId)}/committees/${committeeId}/login-links`, { params }),
        regenerateLoginLinks: (orgId, eventId, committeeId, data = {}) => api.post(`${eventBase(orgId, eventId)}/committees/${committeeId}/login-links/regenerate`, data),
    },

    // =============================================
    // SESSIONS — /api/organizations/:orgId/events/:eventId/committees/:committeeId/sessions
    // =============================================
    sessions: {
        getAll: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/sessions`, { params }),
        create: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/sessions`, data),
        start: (orgId, eventId, committeeId, sessionId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/sessions/${sessionId}/start`),
        end: (orgId, eventId, committeeId, sessionId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/sessions/${sessionId}/end`),
    },

    // =============================================
    // DOCUMENTS — /api/organizations/:orgId/events/:eventId/committees/:committeeId/documents
    // =============================================
    documents: {
        getAll: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/documents`, { params }),

        // Position papers (delegates)
        uploadPositionPaper: (orgId, eventId, committeeId, formData) => api.post(`${committeeBase(orgId, eventId, committeeId)}/documents/position-papers`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        getPositionPaper: (orgId, eventId, committeeId, countryName) => api.get(`${committeeBase(orgId, eventId, committeeId)}/documents/position-papers/${encodeURIComponent(countryName)}`),

        // Public documents (presidium)
        uploadPublic: (orgId, eventId, committeeId, formData) => api.post(`${committeeBase(orgId, eventId, committeeId)}/documents/public`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        updatePublic: (orgId, eventId, committeeId, docId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/documents/public/${docId}`, data),
        deletePublic: (orgId, eventId, committeeId, docId) => api.delete(`${committeeBase(orgId, eventId, committeeId)}/documents/public/${docId}`),
    },

    // =============================================
    // RESOLUTIONS — /api/organizations/:orgId/events/:eventId/committees/:committeeId/resolutions
    // =============================================
    resolutions: {
        // Coalitions
        createCoalition: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/resolutions/coalitions`, data),
        getCoalitions: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/resolutions/coalitions`, { params }),
        getCoalition: (orgId, eventId, committeeId, coalitionId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/resolutions/coalitions/${coalitionId}`),
        respondToInvitation: (orgId, eventId, committeeId, coalitionId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/resolutions/coalitions/${coalitionId}/respond`, data),
        activateCoalition: (orgId, eventId, committeeId, coalitionId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/resolutions/coalitions/${coalitionId}/activate`),
        leaveCoalition: (orgId, eventId, committeeId, coalitionId) => api.delete(`${committeeBase(orgId, eventId, committeeId)}/resolutions/coalitions/${coalitionId}/leave`),

        // Resolutions
        submit: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/resolutions`, data),
        getAll: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/resolutions`, { params }),
        getById: (orgId, eventId, committeeId, resolutionId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/resolutions/detail/${resolutionId}`),
        review: (orgId, eventId, committeeId, resolutionId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/resolutions/${resolutionId}/review`, data),
        submitNewVersion: (orgId, eventId, committeeId, resolutionId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/resolutions/${resolutionId}/new-version`, data),
        getVersions: (orgId, eventId, committeeId, resolutionId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/resolutions/${resolutionId}/versions`),
        submitPresidiumDraft: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/resolutions/presidium-draft`, data),
    },

    // =============================================
    // VOTING — /api/organizations/:orgId/events/:eventId/committees/:committeeId/voting
    // =============================================
    voting: {
        getAll: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/voting`, { params }),
        getById: (orgId, eventId, committeeId, votingId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}`),
        create: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/voting`, data),
        start: (orgId, eventId, committeeId, votingId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/start`),
        complete: (orgId, eventId, committeeId, votingId, data = {}) => api.put(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/complete`, data),
        cancel: (orgId, eventId, committeeId, votingId, data) => api.delete(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}`, { data }),
        getStatus: (orgId, eventId, committeeId, votingId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/status`),
        getRollCallOrder: (orgId, eventId, committeeId, votingId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/roll-call-order`),
        getEligibleVoters: (orgId, eventId, committeeId, votingId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/eligible-voters`),

        // Delegate actions
        castVote: (orgId, eventId, committeeId, votingId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/vote`, data),
        skipVote: (orgId, eventId, committeeId, votingId) => api.post(`${committeeBase(orgId, eventId, committeeId)}/voting/${votingId}/skip`),
    },

    // =============================================
    // TIMERS — /api/organizations/:orgId/events/:eventId/committees/:committeeId/timers
    // =============================================
    timers: {
        getAll: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/timers`, { params }),
        getById: (orgId, eventId, committeeId, timerId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}`),
        create: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/timers`, data),
        start: (orgId, eventId, committeeId, timerId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}/start`),
        pause: (orgId, eventId, committeeId, timerId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}/pause`),
        resume: (orgId, eventId, committeeId, timerId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}/resume`),
        complete: (orgId, eventId, committeeId, timerId) => api.put(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}/complete`),
        extend: (orgId, eventId, committeeId, timerId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}/extend`, data),
        cancel: (orgId, eventId, committeeId, timerId, data = {}) => api.delete(`${committeeBase(orgId, eventId, committeeId)}/timers/${timerId}`, { data }),
    },

    // =============================================
    // PROCEDURE — /api/organizations/:orgId/events/:eventId/committees/:committeeId/procedure
    // =============================================
    procedure: {
        // Motions
        submitMotion: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/procedure/motions`, data),
        supportMotion: (orgId, eventId, committeeId, motionId) => api.post(`${committeeBase(orgId, eventId, committeeId)}/procedure/motions/${motionId}/support`),
        reviewMotion: (orgId, eventId, committeeId, motionId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/procedure/motions/${motionId}/review`, data),
        getSessionMotions: (orgId, eventId, committeeId, sessionId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/procedure/motions/session/${sessionId}`, { params }),
        getMotion: (orgId, eventId, committeeId, motionId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/procedure/motions/${motionId}`),
        getMotionQueue: (orgId, eventId, committeeId, sessionId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/procedure/motions/session/${sessionId}/queue`),

        // Questions
        submitQuestion: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/procedure/questions`, data),
        answerQuestion: (orgId, eventId, committeeId, questionId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/procedure/questions/${questionId}/answer`, data),
        getSessionQuestions: (orgId, eventId, committeeId, sessionId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/procedure/questions/session/${sessionId}`, { params }),
        bulkReviewQuestions: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/procedure/questions/bulk-review`, data),
    },

    // =============================================
    // MESSAGING — /api/organizations/:orgId/events/:eventId/committees/:committeeId/messages
    // =============================================
    messages: {
        // Conversations
        createBilateral: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/messages/bilateral`, data),
        createGroup: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/messages/group`, data),
        getUserConversations: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/messages`, { params }),

        // Committee-wide channels
        getCommitteeConversation: (orgId, eventId, committeeId, channelType) => api.get(`${committeeBase(orgId, eventId, committeeId)}/messages/channel/${channelType}`),
        sendCommitteeMessage: (orgId, eventId, committeeId, channelType, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/messages/channel/${channelType}`, data),

        // Single conversation
        getConversation: (orgId, eventId, committeeId, conversationId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}`, { params }),

        // Message operations
        sendMessage: (orgId, eventId, committeeId, conversationId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}/messages`, data),
        editMessage: (orgId, eventId, committeeId, conversationId, messageId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}/messages/${messageId}`, data),
        markAsRead: (orgId, eventId, committeeId, conversationId, data = {}) => api.post(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}/read`, data),

        // Participant management
        addParticipant: (orgId, eventId, committeeId, conversationId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}/participants`, data),
        leaveConversation: (orgId, eventId, committeeId, conversationId) => api.delete(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}/leave`),
        archiveConversation: (orgId, eventId, committeeId, conversationId, data) => api.put(`${committeeBase(orgId, eventId, committeeId)}/messages/conversation/${conversationId}/archive`, data),
    },

    // =============================================
    // STATISTICS — /api/organizations/:orgId/events/:eventId/committees/:committeeId/statistics
    // =============================================
    statistics: {
        getCommittee: (orgId, eventId, committeeId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics`),
        getDelegateStats: (orgId, eventId, committeeId, email) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/delegate/${encodeURIComponent(email)}`),
        getMyStats: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/my-stats`, { params }),
        getRankings: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/rankings`, { params }),
        getActivityFeed: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/activity`, { params }),
        recalculate: (orgId, eventId, committeeId) => api.post(`${committeeBase(orgId, eventId, committeeId)}/statistics/recalculate`),
        awardAchievement: (orgId, eventId, committeeId, email, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/statistics/delegate/${encodeURIComponent(email)}/achievement`, data),
        getAchievements: (orgId, eventId, committeeId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/achievements`),
        getParticipationAnalytics: (orgId, eventId, committeeId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/analytics/participation`),
        exportCsv: (orgId, eventId, committeeId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/statistics/export`, { responseType: 'blob' }),
    },

    // =============================================
    // PRESENTATION — /api/organizations/:orgId/events/:eventId/committees/:committeeId/presentation
    // =============================================
    presentation: {
        getDisplayData: (orgId, eventId, committeeId) => api.get(`${committeeBase(orgId, eventId, committeeId)}/presentation`),
        announce: (orgId, eventId, committeeId, data) => api.post(`${committeeBase(orgId, eventId, committeeId)}/presentation/announce`, data),
    },

    // =============================================
    // EXPORT — /api/organizations/:orgId/events/:eventId/committees/:committeeId/export
    // =============================================
    exports: {
        getDelegateLinks: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/export/delegate-links`, { params }),
        getPresidiumLinks: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/export/presidium-links`, { params }),
        getCompleteLinks: (orgId, eventId, committeeId, params = {}) => api.get(`${committeeBase(orgId, eventId, committeeId)}/export/complete-links`, { params }),
    },

    // =============================================
    // COUNTRIES (general resource — not committee-scoped)
    // =============================================
    countries: {
        getAll: (params = {}) => api.get('/countries', { params }),
        getByCode: (code, params = {}) => api.get(`/countries/${code}`, { params }),
        search: (query) => api.get('/countries/search', { params: { q: query } }),
        // Flags
        getFlag: (code) => api.get(`/countries/flags/${code}`),
        getAllFlags: () => api.get('/countries/flags/all/batch'),
        getAllFlagsBatch: () => api.get('/countries/flags/all/batch'),
        getFlagsMetaInfo: () => api.get('/countries/flags/meta/info'),
        getMetaHealth: () => api.get('/countries/meta/health'),
        refreshCache: () => api.post('/countries/admin/refresh-flags'),
    },

    // =============================================
    // ADMIN (platform-level, SuperAdmin only)
    // =============================================
    admin: {
        getDashboardStats: () => api.get('/admin/dashboard/stats'),
        getRecentActivity: (params = {}) => api.get('/admin/dashboard/activity', { params }),
        getSystemHealth: () => api.get('/admin/system/health'),
        clearCaches: () => api.post('/admin/system/clear-cache'),
        getPerformanceMetrics: () => api.get('/admin/performance/metrics'),
        getResponseTimes: (params = {}) => api.get('/admin/performance/response-times', { params }),
        exportConfig: () => api.get('/admin/export/config'),
        databaseMaintenance: (data) => api.post('/admin/maintenance/database', data),
        createBackup: (data = {}) => api.post('/admin/maintenance/backup', data),
        getUserEngagement: (params = {}) => api.get('/admin/analytics/user-engagement', { params }),
        getUsagePatterns: (params = {}) => api.get('/admin/analytics/usage-patterns', { params }),
        bulkGenerateQR: (data) => api.post('/admin/committees/bulk-qr', data),
    },
}

export default api