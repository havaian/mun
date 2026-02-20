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
        getAll: (orgId, eventId, params = {}) => api.get(`/organizations/${orgId}/events/${eventId}/participants`, { params }),
        getById: (orgId, eventId, participantId) => api.get(`/organizations/${orgId}/events/${eventId}/participants/${participantId}`),
        add: (orgId, eventId, data) => api.post(`/organizations/${orgId}/events/${eventId}/participants`, data),
        update: (orgId, eventId, participantId, data) => api.put(`/organizations/${orgId}/events/${eventId}/participants/${participantId}`, data),
        remove: (orgId, eventId, participantId) => api.delete(`/organizations/${orgId}/events/${eventId}/participants/${participantId}`),
        getByCommittee: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/participants/by-committee`),
        getMyParticipation: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/participants/me`),
    },

    // =============================================
    // REGISTRATION — /api/organizations/:orgId/events/:eventId/registration
    // =============================================
    registration: {
        // Form management (moderators)
        getForm: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/registration/form`),
        upsertForm: (orgId, eventId, data) => api.put(`/organizations/${orgId}/events/${eventId}/registration/form`, data),
        getFormOptions: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/registration/form/options`),

        // Public form (applicants)
        getPublicForm: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/registration/form/public`),

        // Applications — applicant
        submit: (orgId, eventId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications`, data),
        getMyApplication: (orgId, eventId) => api.get(`/organizations/${orgId}/events/${eventId}/registration/applications/me`),
        withdraw: (orgId, eventId) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/me/withdraw`),

        // Applications — moderator
        getApplications: (orgId, eventId, params = {}) => api.get(`/organizations/${orgId}/events/${eventId}/registration/applications`, { params }),
        getApplication: (orgId, eventId, appId) => api.get(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}`),
        moveToStage: (orgId, eventId, appId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/move`, data),
        returnForRevision: (orgId, eventId, appId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/return`, data),
        accept: (orgId, eventId, appId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/accept`, data),
        reject: (orgId, eventId, appId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/reject`, data),
        addNote: (orgId, eventId, appId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/notes`, data),
        updateInterview: (orgId, eventId, appId, data) => api.put(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/interview`, data),
        verifyPayment: (orgId, eventId, appId, data) => api.post(`/organizations/${orgId}/events/${eventId}/registration/applications/${appId}/payment/verify`, data),
    },

    // =============================================
    // COMMITTEES — will be rewired to org-scoped in later phase
    // Currently still using old flat routes for session/voting/etc.
    // These are kept for presidium/delegate views that aren't migrated yet.
    // =============================================
    committees: {
        getAll: (params = {}) => api.get('/committees', { params }),
        getById: (id) => api.get(`/committees/${id}`),
        create: (data) => api.post('/committees', data),
        update: (id, data) => api.put(`/committees/${id}`, data),
        delete: (id) => api.delete(`/committees/${id}`),
    },

    // =============================================
    // SESSIONS — still flat, will migrate later
    // =============================================
    sessions: {
        getAll: (committeeId) => api.get(`/sessions/committee/${committeeId}`),
        getById: (id) => api.get(`/sessions/${id}`),
        create: (data) => api.post('/sessions', data),
        update: (id, data) => api.put(`/sessions/${id}`, data),
        updateStatus: (id, data) => api.put(`/sessions/${id}/status`, data),
    },

    // =============================================
    // VOTING — still flat, will migrate later
    // =============================================
    voting: {
        getAll: (committeeId) => api.get(`/voting/committee/${committeeId}`),
        getById: (id) => api.get(`/voting/${id}`),
        create: (data) => api.post('/voting', data),
        castVote: (id, data) => api.post(`/voting/${id}/vote`, data),
        closeVoting: (id) => api.put(`/voting/${id}/close`),
    },

    // =============================================
    // DOCUMENTS — still flat, will migrate later
    // =============================================
    documents: {
        getAll: (committeeId) => api.get(`/documents/committee/${committeeId}`),
        getById: (id) => api.get(`/documents/${id}`),
        create: (data) => api.post('/documents', data),
        update: (id, data) => api.put(`/documents/${id}`, data),
    },

    // =============================================
    // RESOLUTIONS — still flat, will migrate later
    // =============================================
    resolutions: {
        getAll: (committeeId) => api.get(`/resolutions/committee/${committeeId}`),
        getById: (id) => api.get(`/resolutions/${id}`),
        create: (data) => api.post('/resolutions', data),
        update: (id, data) => api.put(`/resolutions/${id}`, data),
    },

    // =============================================
    // MESSAGING — still flat, will migrate later
    // =============================================
    messaging: {
        getAll: (committeeId, params = {}) => api.get(`/messages/committee/${committeeId}`, { params }),
        send: (data) => api.post('/messages', data),
        updateStatus: (id, data) => api.put(`/messages/${id}/status`, data),
    },

    // =============================================
    // STATISTICS — still flat, will migrate later
    // =============================================
    statistics: {
        getCommittee: (committeeId) => api.get(`/statistics/committee/${committeeId}`),
    },

    // =============================================
    // TIMER — still flat, will migrate later
    // =============================================
    timer: {
        get: (committeeId) => api.get(`/timer/committee/${committeeId}`),
        start: (data) => api.post('/timer/start', data),
        pause: (id) => api.put(`/timer/${id}/pause`),
        resume: (id) => api.put(`/timer/${id}/resume`),
        stop: (id) => api.put(`/timer/${id}/stop`),
    },

    // =============================================
    // COUNTRIES
    // =============================================
    countries: {
        getAll: (params = {}) => api.get('/countries', { params }),
        getByCode: (code, params = {}) => api.get(`/countries/${code}`, { params }),
        search: (query) => api.get('/countries/search', { params: { q: query } }),
        // Legacy methods — used by flags store and other old components
        getFlag: (code) => api.get(`/countries/flags/${code}`),
        getAllFlags: () => api.get('/countries/flags/all/batch'),
        getAllFlagsBatch: () => api.get('/countries/flags/all/batch'),
        getFlagsMetaInfo: () => api.get('/countries/flags/meta/info'),
        getMetaHealth: () => api.get('/countries/meta/health'),
        refreshCache: () => api.post('/countries/admin/refresh-flags'),
    },

    // =============================================
    // ADMIN (old flat routes — kept for backward compat during migration)
    // =============================================
    admin: {
        getDashboardStats: () => api.get('/admin/dashboard/stats'),
        getRecentActivity: (params = {}) => api.get('/admin/dashboard/activity', { params }),
        getSystemHealth: () => api.get('/admin/system/health'),
        clearCaches: () => api.post('/admin/system/clear-cache'),
    },

    // =============================================
    // EXPORT — still flat, will migrate later
    // =============================================
    exports: {
        delegateLinks: (committeeId, params = {}) => api.get(`/export/delegate-links/${committeeId}`, { params }),
        presidiumLinks: (committeeId, params = {}) => api.get(`/export/presidium-links/${committeeId}`, { params }),
        completeLinks: (committeeId, params = {}) => api.get(`/export/complete-links/${committeeId}`, { params }),
        statistics: (committeeId) => api.get(`/export/statistics/${committeeId}`),
        votingResults: (committeeId) => api.get(`/export/voting-results/${committeeId}`),
        resolutions: (committeeId) => api.get(`/export/resolutions/${committeeId}`),
        committeeReport: (committeeId) => api.get(`/export/committee-report/${committeeId}`),
    },
}

export default api