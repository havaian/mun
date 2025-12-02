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

    // CHANGED: Link login (replaces qrLogin)
    const linkLogin = async (loginToken) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.linkLogin(loginToken)

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

    // CHANGED: Email binding (updated to use login tokens)
    const bindEmail = async (loginToken, email) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.bindEmail(loginToken, email)

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

    // CHANGED: Email login (updated to support login token verification)
    const emailLogin = async (email, loginToken = null) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.emailLogin(email, loginToken)

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
    const logout = async () => {
        try {
            if (token.value) {
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
        }
    }

    // Session validation with caching
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
            const response = await apiMethods.auth.validateSession()

            if (response.data.success) {
                user.value = response.data.user
                const result = { success: true, user: response.data.user }

                _lastValidation.value = now
                _validationCache.value = result

                return result
            } else {
                // Session invalid - clear auth data
                await logout()
                const result = { success: false, error: 'Session invalid' }
                _validationCache.value = result
                return result
            }

        } catch (error) {
            // Network or server error - clear auth data
            await logout()
            const result = {
                success: false,
                error: error.response?.data?.error || 'Session validation failed'
            }
            _validationCache.value = result
            return result
        }
    }

    // Initialize auth state from localStorage
    const initializeAuth = async () => {
        if (token.value) {
            const validation = await validateSession()
            if (!validation.success) {
                // Token is invalid, clear everything
                token.value = null
                user.value = null
                localStorage.removeItem('mun_token')
            }
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
        linkLogin, // CHANGED: was qrLogin
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