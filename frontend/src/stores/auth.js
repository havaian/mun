import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()
    const toast = useToast()

    // State
    const user = ref(null)
    const token = ref(localStorage.getItem('mun_token'))
    const isLoading = ref(false)
    const lastActivity = ref(Date.now())
    const sessionWarningShown = ref(false)
    const _isValidating = ref(false)

    // Validation caching
    const _validationPromise = ref(null)
    const _validationCache = ref(null)
    const _cacheExpiry = ref(0)

    // Cache duration (60 minutes)
    const CACHE_DURATION = 60 * 60 * 1000

    // Computed
    const isAuthenticated = computed(() => !!token.value && !!user.value)

    const userRole = computed(() => user.value?.role)

    const userDisplayName = computed(() => {
        if (!user.value) return ''

        switch (user.value.role) {
            case 'admin':
                return user.value.username
            case 'presidium':
                return `${formatPresidiumRole(user.value.presidiumRole)}`
            case 'delegate':
                return user.value.countryName
            default:
                return user.value.email
        }
    })

    const committeeInfo = computed(() => {
        if (!user.value?.committeeId) return null
        return {
            id: user.value.committeeId._id || user.value.committeeId,
            name: user.value.committeeId.name || 'Unknown Committee'
        }
    })

    // Helper function to format presidium roles
    const formatPresidiumRole = (role) => {
        const roleMap = {
            'chairman': 'Chairman',
            'co-chairman': 'Co-Chairman',
            'expert': 'Expert',
            'secretary': 'Secretary'
        }
        return roleMap[role] || role
    }

    // Helper function to clear validation cache
    const _clearValidationCache = () => {
        _validationPromise.value = null
        _validationCache.value = null
        _cacheExpiry.value = 0
        _isValidating.value = false
    }

    // Helper function to check if cache is valid
    const _isCacheValid = () => {
        return _validationCache.value !== null && Date.now() < _cacheExpiry.value
    }

    // Actions

    // Admin login
    const adminLogin = async (credentials) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.adminLogin(credentials)

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                // Clear validation cache since we have new auth data
                _clearValidationCache()

                toast.success('Welcome back, Administrator!')

                return { success: true }
            }

            return { success: false, error: 'Login failed' }

        } catch (error) {
            const message = error.response?.data?.error || 'Login failed'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // QR login (first step for presidium/delegates)
    const qrLogin = async (qrToken) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.qrLogin(qrToken)

            if (response.data.success) {
                return {
                    success: true,
                    data: {
                        userType: response.data.userType,
                        country: response.data.country,
                        presidiumRole: response.data.presidiumRole,
                        committee: response.data.committee,
                        qrToken: response.data.qrToken,
                        message: response.data.message
                    }
                }
            }

            return { success: false, error: 'QR code verification failed' }

        } catch (error) {
            const message = error.response?.data?.error || 'QR verification failed'
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // Email binding (second step for presidium/delegates)
    const bindEmail = async (qrToken, email) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.bindEmail(qrToken, email)

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                // Clear validation cache since we have new auth data
                _clearValidationCache()

                const userType = user.value.role === 'delegate' ? user.value.countryName : formatPresidiumRole(user.value.presidiumRole)
                toast.success(`Welcome, ${userType}! Registration completed.`)

                return { success: true }
            }

            return { success: false, error: 'Email binding failed' }

        } catch (error) {
            const message = error.response?.data?.error || 'Email binding failed'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // Email login (for users who have already bound email)
    const emailLogin = async (email) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.emailLogin(email)

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                // Clear validation cache since we have new auth data
                _clearValidationCache()

                const userType = user.value.role === 'delegate' ? user.value.countryName : formatPresidiumRole(user.value.presidiumRole)
                toast.success(`Welcome back, ${userType}!`)

                return { success: true }
            }

            return { success: false, error: 'Login failed' }

        } catch (error) {
            const message = error.response?.data?.error || 'Login failed'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // Validate existing session with caching
    const validateSession = async (forceRefresh = false) => {
        // If no token, return false immediately
        if (!token.value) {
            _clearValidationCache()
            return false
        }

        // Check cache first (unless forced refresh)
        if (!forceRefresh && _isCacheValid()) {
            console.log('🚀 Using cached session validation result')
            return _validationCache.value
        }

        // If validation is already in progress, return the existing promise
        if (_validationPromise.value) {
            console.log('⏳ Session validation already in progress, waiting for result...')
            return _validationPromise.value
        }

        // Start new validation
        console.log('🔍 Starting fresh session validation...')
        _isValidating.value = true

        _validationPromise.value = (async () => {
            try {
                const response = await apiMethods.auth.validateSession()

                if (response.data.success && response.data.user) {
                    user.value = response.data.user

                    // Cache successful validation
                    _validationCache.value = true
                    _cacheExpiry.value = Date.now() + CACHE_DURATION

                    console.log('✅ Session validation successful')
                    return true
                } else {
                    // Invalid session
                    _validationCache.value = false
                    _cacheExpiry.value = Date.now() + (30 * 1000) // Cache failure for 30 seconds

                    console.log('❌ Session validation failed - invalid response')
                    return false
                }

            } catch (error) {
                console.error('💥 Session validation error:', error)

                // Cache failure result briefly to avoid immediate retry
                _validationCache.value = false
                _cacheExpiry.value = Date.now() + (10 * 1000) // Cache failure for 10 seconds

                // Clear auth state on error
                logout(false)
                return false
            } finally {
                // Reset validation state
                _isValidating.value = false
                _validationPromise.value = null
            }
        })()

        return _validationPromise.value
    }

    // Check QR token status
    const checkQrStatus = async (qrToken) => {
        try {
            const response = await apiMethods.auth.checkQrStatus(qrToken)
            return response.data
        } catch (error) {
            console.error('QR status check failed:', error)
            throw error
        }
    }

    // Reactivate QR token (admin only)
    const reactivateQr = async (userId) => {
        try {
            const response = await apiMethods.auth.reactivateQr(userId)
            return response.data
        } catch (error) {
            console.error('QR reactivation failed:', error)
            throw error
        }
    }

    // Logout
    const logout = async (showMessage = true) => {
        try {
            if (token.value) {
                await apiMethods.auth.logout()
            }
        } catch (error) {
            console.error('Logout API error:', error)
        } finally {
            // Clear state regardless of API success
            token.value = null
            user.value = null
            sessionWarningShown.value = false

            // Clear validation cache
            _clearValidationCache()

            localStorage.removeItem('mun_token')

            if (showMessage) {
                toast.log('You have been logged out')
            }

            router.push({ name: 'Login' })
        }
    }

    // Update user activity
    const updateActivity = () => {
        lastActivity.value = Date.now()
        sessionWarningShown.value = false
    }

    // Check for session timeout
    const checkSessionTimeout = () => {
        const timeout = 24 * 60 * 60 * 1000 // 24 hours
        const warningTime = 24 * 60 * 60 * 1000 // 24 hours before timeout
        const now = Date.now()
        const timeSinceActivity = now - lastActivity.value

        if (timeSinceActivity > timeout) {
            logout(false)
            toast.warn('Session expired due to inactivity')
            return 'expired'
        }

        if (timeSinceActivity > timeout - warningTime && !sessionWarningShown.value) {
            sessionWarningShown.value = true
            return 'warning'
        }

        return 'active'
    }

    // Get dashboard route based on user role
    const getDashboardRoute = () => {
        switch (user.value?.role) {
            case 'admin':
                return 'AdminDashboard'
            case 'presidium':
                return 'PresidiumDashboard'
            case 'delegate':
                return 'DelegateDashboard'
            default:
                return 'Login'
        }
    }

    // Check if user has specific permission
    const hasPermission = (permission) => {
        if (!user.value) return false

        const rolePermissions = {
            admin: ['*'], // Admin has all permissions
            presidium: [
                'manage_sessions',
                'review_documents',
                'manage_voting',
                'track_attendance',
                'view_committee_stats'
            ],
            delegate: [
                'submit_documents',
                'join_coalitions',
                'send_messages',
                'cast_votes',
                'view_session_info'
            ]
        }

        const userPermissions = rolePermissions[user.value.role] || []
        return userPermissions.includes('*') || userPermissions.includes(permission)
    }

    // Start session monitoring
    const startSessionMonitoring = () => {
        // Check session every minute
        setInterval(() => {
            if (isAuthenticated.value) {
                const status = checkSessionTimeout()

                if (status === 'warning') {
                    // Show warning modal (handled in App.vue)
                    // This could trigger a global event or state change
                }
            }
        }, 60000) // 1 minute

        // Track user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

        const handleActivity = () => {
            updateActivity()
        }

        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, true)
        })
    }

    // Force refresh session data (bypass cache)
    const refreshSession = async () => {
        return await validateSession(true)
    }

    // Check if session validation is in progress
    const isValidatingSession = computed(() => _isValidating.value)

    return {
        // State
        user,
        token,
        isLoading,
        lastActivity,
        sessionWarningShown,
        _isValidating,

        // Computed
        isAuthenticated,
        userRole,
        userDisplayName,
        committeeInfo,
        isValidatingSession,

        // Actions
        adminLogin,
        qrLogin,
        bindEmail,
        emailLogin,
        validateSession,
        refreshSession,
        checkQrStatus,
        reactivateQr,
        logout,
        updateActivity,
        checkSessionTimeout,
        getDashboardRoute,
        hasPermission,
        startSessionMonitoring
    }
})