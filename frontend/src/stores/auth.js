import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

export const useAuthStore = defineStore('auth', () => {
    const toast = useToast()

    // State
    const token = ref(localStorage.getItem('mun_token') || null)
    const user = ref(null)
    const isLoading = ref(false)

    // Session validation cache
    const _lastValidation = ref(0)
    const _validationCache = ref(null)
    const VALIDATION_CACHE_DURATION = 30000 // 30 seconds

    // ENHANCED: Retry configuration for network errors
    const RETRY_CONFIG = {
        maxRetries: 3,
        retryDelay: 1000, // 1 second
        backoffMultiplier: 2
    }

    // Computed
    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isPresidium = computed(() => user.value?.role === 'presidium')
    const isDelegate = computed(() => user.value?.role === 'delegate')
    const userRole = computed(() => user.value?.role || null)
    const committeeId = computed(() => user.value?.committeeId || null)

    // Helper function to clear validation cache
    const _clearValidationCache = () => {
        _lastValidation.value = 0
        _validationCache.value = null
    }

    // Helper function to format presidium role
    const formatPresidiumRole = (role) => {
        const roleMap = {
            'chairman': 'Chairman',
            'co-chairman': 'Co-Chairman',
            'expert': 'Expert',
            'secretary': 'Secretary'
        }
        return roleMap[role] || role
    }

    // ENHANCED: Determine if error should clear token
    const shouldClearTokenOnError = (error) => {
        // Only clear token for actual auth failures, not network errors
        if (!error.response) {
            // Network error (no response) - don't clear token
            console.warn('Network error during validation, retaining token')
            return false
        }

        const status = error.response.status
        const errorCode = error.response.data?.code

        // Clear token for actual authentication failures
        if (status === 401) {
            if (errorCode === 'TOKEN_EXPIRED') {
                console.warn('Token expired, clearing auth state')
                return true
            }
            if (errorCode === 'INVALID_TOKEN') {
                console.warn('Invalid token, clearing auth state')
                return true
            }
            if (errorCode === 'VERIFICATION_FAILED') {
                console.warn('Token verification failed, clearing auth state')
                return true
            }
            // Generic 401
            console.warn('Authentication failed, clearing auth state')
            return true
        }

        // Don't clear token for server errors (5xx) or other non-auth issues
        if (status >= 500) {
            console.warn('Server error during validation, retaining token')
            return false
        }

        // For other errors (4xx), clear token
        return true
    }

    // ENHANCED: Retry logic for network operations
    const retryOperation = async (operation, retries = RETRY_CONFIG.maxRetries) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation()
            } catch (error) {
                // If this is the last attempt, throw the error
                if (attempt === retries) {
                    throw error
                }

                // Only retry on network errors or 5xx server errors
                if (!error.response || error.response.status >= 500) {
                    const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt)
                    console.warn(`Operation failed (attempt ${attempt + 1}), retrying in ${delay}ms...`)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    continue
                }

                // Don't retry auth errors (4xx)
                throw error
            }
        }
    }

    // Admin login
    const adminLogin = async (credentials) => {
        try {
            isLoading.value = true

            const response = await retryOperation(() =>
                apiMethods.auth.adminLogin(credentials)
            )

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                // Clear validation cache since we have new auth data
                _clearValidationCache()

                toast.success(`Welcome, ${user.value.username}!`)

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

    // ENHANCED: Link login with retry
    const linkLogin = async (loginToken) => {
        try {
            isLoading.value = true

            const response = await retryOperation(() =>
                apiMethods.auth.linkLogin(loginToken)
            )

            if (response.data.success) {
                return {
                    success: true,
                    data: {
                        userType: response.data.userType,
                        country: response.data.countryName,
                        presidiumRole: response.data.presidiumRole,
                        committee: response.data.committee,
                        loginToken: response.data.loginToken,
                        firstTime: response.data.firstTime,
                        message: response.data.message
                    }
                }
            }

            return { success: false, error: 'Login link verification failed' }

        } catch (error) {
            const message = error.response?.data?.error || 'Link verification failed'
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // ENHANCED: Email binding with retry
    const bindEmail = async (loginToken, email) => {
        try {
            isLoading.value = true

            const response = await retryOperation(() =>
                apiMethods.auth.bindEmail(loginToken, email)
            )

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                // Clear validation cache since we have new auth data
                _clearValidationCache()

                const userType = user.value.role === 'delegate' ?
                    user.value.countryName :
                    formatPresidiumRole(user.value.presidiumRole)

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

    // ENHANCED: Email login with retry
    const emailLogin = async (email, loginToken = null) => {
        try {
            isLoading.value = true

            const response = await retryOperation(() =>
                apiMethods.auth.emailLogin(email, loginToken)
            )

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                // Clear validation cache since we have new auth data
                _clearValidationCache()

                const userType = user.value.role === 'delegate' ?
                    user.value.countryName :
                    formatPresidiumRole(user.value.presidiumRole)

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

    // Logout function
    const logout = async (showMessage = true) => {
        try {
            if (token.value) {
                // Don't retry logout - if it fails, still clear local state
                await apiMethods.auth.logout()
            }
        } catch (error) {
            console.warn('Logout API call failed:', error)
        } finally {
            // Always clear local state regardless of API success
            token.value = null
            user.value = null
            localStorage.removeItem('mun_token')
            _clearValidationCache()

            if (showMessage) {
                toast.success('Logged out successfully')
            }
        }
    }

    // FIXED: Session validation with smart error handling
    const validateSession = async () => {
        // Return cached result if still valid
        const now = Date.now()
        if (now - _lastValidation.value < VALIDATION_CACHE_DURATION && _validationCache.value !== null) {
            return _validationCache.value
        }

        if (!token.value) {
            const result = { success: false, error: 'No token' }
            _validationCache.value = result
            return result
        }

        try {
            const response = await retryOperation(() =>
                apiMethods.auth.validateSession()
            )

            if (response.data.success) {
                user.value = response.data.user
                const result = { success: true, user: response.data.user }

                _lastValidation.value = now
                _validationCache.value = result

                return result
            } else {
                // Session invalid according to server - clear auth data
                console.warn('Session validation failed - server says invalid')
                await logout(false)
                const result = { success: false, error: 'Session invalid' }
                _validationCache.value = result
                return result
            }

        } catch (error) {
            console.error('Session validation error:', error)

            // FIXED: Only clear token for actual auth failures
            if (shouldClearTokenOnError(error)) {
                await logout(false)
                const result = {
                    success: false,
                    error: error.response?.data?.error || 'Session validation failed'
                }
                _validationCache.value = result
                return result
            } else {
                // Network/server error - keep token but return failure
                const result = {
                    success: false,
                    error: 'Temporary validation error',
                    retainToken: true
                }
                // Don't cache network errors, but don't throw either
                return result
            }
        }
    }

    // ENHANCED: Initialize auth state with better error handling
    const initializeAuth = async () => {
        if (!token.value) {
            return false
        }

        try {
            const validation = await validateSession()

            if (validation.success) {
                return true
            }

            // If validation failed but we should retain token, that's ok
            if (validation.retainToken) {
                console.warn('Auth initialization failed temporarily, will retry later')
                return true // Allow app to continue
            }

            // Token is actually invalid
            return false

        } catch (error) {
            console.error('Auth initialization error:', error)
            // Don't clear token on initialization errors
            return true // Allow app to continue, validation will retry later
        }
    }

    // Get dashboard route based on user role
    const getDashboardRoute = () => {
        if (isAdmin.value) return 'AdminDashboard'
        if (isPresidium.value) return 'PresidiumDashboard'
        if (isDelegate.value) return 'DelegateDashboard'
        return 'Login'
    }

    // Check if user has specific permission
    const hasPermission = (permission) => {
        if (isAdmin.value) return true // Admin has all permissions

        const permissions = {
            'manage_committee': isPresidium.value,
            'view_documents': isAuthenticated.value,
            'create_motions': isDelegate.value,
            'vote': isDelegate.value && user.value?.specialRole !== 'observer',
            'manage_sessions': isPresidium.value,
            'manage_users': isAdmin.value
        }

        return permissions[permission] || false
    }

    // LEGACY METHODS: Keep for backward compatibility during transition
    const qrLogin = async (qrToken) => {
        console.warn('qrLogin is deprecated, use linkLogin instead')
        return linkLogin(qrToken)
    }

    return {
        // State
        token: computed(() => token.value),
        user: computed(() => user.value),
        isLoading: computed(() => isLoading.value),

        // Computed
        isAuthenticated,
        isAdmin,
        isPresidium,
        isDelegate,
        userRole,
        committeeId,

        // Actions
        adminLogin,
        linkLogin,
        bindEmail,
        emailLogin,
        logout,
        validateSession,
        initializeAuth,
        getDashboardRoute,
        hasPermission,

        // LEGACY: Deprecated methods
        qrLogin // Will show deprecation warning
    }
})