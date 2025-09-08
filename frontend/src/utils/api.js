import axios from 'axios'
import { useToast } from '@/plugins/toast'

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api',
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
        })
    },

    // Voting
    voting: {
        getAll: (params = {}) => api.get('/voting', { params }),
        getById: (id) => api.get(`/voting/${id}`),
        create: (data) => api.post('/voting', data),
        castVote: (id, vote) => api.post(`/voting/${id}/vote`, vote),
        getResults: (id) => api.get(`/voting/${id}/results`),
        endVoting: (id) => api.post(`/voting/${id}/end`)
    },

    // Messages
    messages: {
        getAll: (params = {}) => api.get('/messages', { params }),
        send: (data) => api.post('/messages', data),
        markAsRead: (id) => api.put(`/messages/${id}/read`)
    },

    // Export/PDF
    export: {
        generateQRPDF: (committeeId) => api.get(`/export/qr-codes/${committeeId}`, {
            responseType: 'blob'
        }),
        getStatistics: (committeeId) => api.get(`/export/statistics/${committeeId}`),
        getVotingResults: (committeeId) => api.get(`/export/voting-results/${committeeId}`),
        getResolutions: (committeeId) => api.get(`/export/resolutions/${committeeId}`)
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
    }
}

export default api