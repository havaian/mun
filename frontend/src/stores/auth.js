import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { useWebSocketStore } from '@/stores/websocket'
import { decodeJWT, getTokenRemainingTime, isTokenExpired } from '@/utils/jwt'

export const useAuthStore = defineStore('auth', () => {
    const toast = useToast()

    // =============================================
    // STATE
    // =============================================
    const token = ref(localStorage.getItem('mun_token') || null)
    const user = ref(null)
    const isLoading = ref(false)

    // Organizations the user belongs to
    const organizations = ref({
        admin: [],   // orgs where user is admin
        member: []   // orgs where user is a member (with permissions)
    })

    // Pending org invitations
    const pendingInvitations = ref([])

    // Event participations (events the user is assigned to — presidium, delegate, etc.)
    const eventParticipations = ref([])

    // Currently selected/active context
    const activeOrgId = ref(localStorage.getItem('mun_active_org') || null)

    // Session validation cache
    const lastActivity = ref(Date.now())
    const sessionWarningShown = ref(false)
    const _lastValidation = ref(0)
    const _validationCache = ref(null)
    const _validationPromise = ref(null)
    const VALIDATION_CACHE_DURATION = 30000 // 30 seconds

    // Retry configuration for network errors
    const RETRY_CONFIG = {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
    }

    // =============================================
    // COMPUTED
    // =============================================
    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const isSuperAdmin = computed(() => user.value?.isSuperAdmin || false)

    // All organizations the user has access to (admin + member)
    const allOrganizations = computed(() => {
        const adminOrgs = (organizations.value.admin || []).map(org => ({
            ...org,
            accessLevel: 'admin'
        }))
        const memberOrgs = (organizations.value.member || []).map(org => ({
            ...org,
            accessLevel: 'member'
        }))
        return [...adminOrgs, ...memberOrgs]
    })

    // Currently active organization (from localStorage selection or first available)
    const activeOrganization = computed(() => {
        if (!allOrganizations.value.length) return null

        if (activeOrgId.value) {
            const found = allOrganizations.value.find(
                org => org._id === activeOrgId.value || org.slug === activeOrgId.value
            )
            if (found) return found
        }

        // Default to first org
        return allOrganizations.value[0]
    })

    // Is the user an admin of the active org?
    const isOrgAdmin = computed(() => {
        if (isSuperAdmin.value) return true
        if (!activeOrganization.value) return false
        return activeOrganization.value.accessLevel === 'admin'
    })

    // Permissions in the active org (for members)
    const orgPermissions = computed(() => {
        if (isSuperAdmin.value || isOrgAdmin.value) return ['all']
        if (!activeOrganization.value) return []
        return activeOrganization.value.permissions || []
    })

    // Check if user has a specific org permission
    const hasOrgPermission = (permission) => {
        if (isSuperAdmin.value || isOrgAdmin.value) return true
        return orgPermissions.value.includes(permission)
    }

    // Does this user have any org at all?
    const hasOrganization = computed(() => allOrganizations.value.length > 0)

    // User display name
    const displayName = computed(() => {
        if (!user.value) return ''
        return `${user.value.firstName} ${user.value.lastName}`
    })
    
    // Events where the user is a presidium member
    const presidiumEvents = computed(() =>
        eventParticipations.value.filter(ep =>
            ['presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary'].includes(ep.role)
        )
    )

    // Events where the user is a delegate
    const delegateEvents = computed(() =>
        eventParticipations.value.filter(ep => ep.role === 'delegate')
    )

    // Check if user has any role in a specific event
    const hasEventAccess = (eventId) =>
        eventParticipations.value.some(ep => ep.event?._id === eventId)

    // Check if user is org member (admin or member) for a given org
    const isOrgMember = (orgId) =>
        allOrganizations.value.some(org => org._id === orgId)

    // =============================================
    // LEGACY COMPAT — old stores (session, voting, admin) 
    // and old components reference these properties.
    // They map the old role-based model onto the new one.
    // =============================================
    const isAdmin = computed(() => user.value?.isSuperAdmin || false)
    const isPresidium = computed(() => user.value?.role === 'presidium' || false)
    const isDelegate = computed(() => user.value?.role === 'delegate' || false)
    const userRole = computed(() => {
        if (user.value?.isSuperAdmin) return 'admin'
        return user.value?.role || null
    })
    const committeeId = computed(() => user.value?.committeeId || null)
    const formatPresidiumRole = (role) => {
        const map = { chairman: 'Chairman', 'co-chairman': 'Co-Chairman', expert: 'Expert', secretary: 'Secretary' }
        return map[role] || role
    }

    // =============================================
    // HELPER FUNCTIONS
    // =============================================
    const _clearValidationCache = () => {
        _lastValidation.value = 0
        _validationCache.value = null
        _validationPromise.value = null
    }

    // Determine if error should clear token
    const shouldClearTokenOnError = (error) => {
        if (!error.response) {
            console.warn('Network error during validation, retaining token')
            return false
        }

        const status = error.response.status
        const errorCode = error.response.data?.code

        if (status === 401) {
            if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
                return true
            }
            // Generic 401 — also clear
            return true
        }

        // 403 = authenticated but not authorized — don't clear token
        return false
    }

    // Retry wrapper for network errors
    const retryOperation = async (operation, retries = RETRY_CONFIG.maxRetries) => {
        let lastError
        let delay = RETRY_CONFIG.retryDelay

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation()
            } catch (error) {
                lastError = error

                // Don't retry auth errors
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw error
                }

                // Don't retry on last attempt
                if (attempt === retries) break

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay))
                delay *= RETRY_CONFIG.backoffMultiplier
            }
        }

        throw lastError
    }

    // =============================================
    // ACTIONS
    // =============================================

    // Set auth data (used by login and register)
    const setAuthData = async (newToken, userData) => {
        token.value = newToken
        localStorage.setItem('mun_token', newToken)
        _clearValidationCache()

        // If we got user data directly, set it
        if (userData) {
            user.value = userData
        }

        // Fetch full profile with org data
        await fetchProfile()

        // Initialize WebSocket
        initializeWebSocket()
    }

    // Fetch profile + org data from /auth/me
    const fetchProfile = async () => {
        try {
            const response = await apiMethods.auth.getMe()

            if (response.data.success) {
                user.value = response.data.user
                organizations.value = response.data.organizations || { admin: [], member: [] }
                pendingInvitations.value = response.data.pendingInvitations || []
                eventParticipations.value = response.data.eventParticipations || []

                // Auto-select first org if none selected
                if (!activeOrgId.value && allOrganizations.value.length > 0) {
                    setActiveOrg(allOrganizations.value[0]._id)
                }

                return true
            }

            return false
        } catch (error) {
            console.error('Fetch profile error:', error)
            return false
        }
    }

    // Register
    const register = async (data) => {
        try {
            isLoading.value = true

            const response = await apiMethods.auth.register(data)

            if (response.data.success) {
                await setAuthData(response.data.token, response.data.user)
                toast.success(`Welcome, ${user.value.firstName}!`)
                return { success: true }
            }

            return { success: false, error: 'Registration failed' }
        } catch (error) {
            const message = error.response?.data?.error || 'Registration failed'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // Login
    const login = async (email, password) => {
        try {
            isLoading.value = true

            const response = await retryOperation(() =>
                apiMethods.auth.login({ email, password })
            )

            if (response.data.success) {
                await setAuthData(response.data.token, response.data.user)
                toast.success(`Welcome back, ${user.value.firstName}!`)
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

    // Logout
    const logout = async (showMessage = true) => {
        try {
            // Disconnect WebSocket
            disconnectWebSocket()
        } catch (error) {
            console.warn('Logout cleanup failed:', error)
        } finally {
            // Always clear local state
            token.value = null
            user.value = null
            organizations.value = { admin: [], member: [] }
            pendingInvitations.value = []
            eventParticipations.value = []
            activeOrgId.value = null

            localStorage.removeItem('mun_token')
            localStorage.removeItem('mun_active_org')
            _clearValidationCache()

            if (showMessage) {
                toast.success('Logged out successfully')
            }
        }
    }

    // Set active organization context
    const setActiveOrg = (orgId) => {
        activeOrgId.value = orgId
        localStorage.setItem('mun_active_org', orgId)
    }

    // Session validation with caching
    const validateSession = async () => {
        const now = Date.now()

        // Check token expiry client-side first
        if (token.value && isTokenExpired(token.value)) {
            console.warn('Token expired client-side, logging out')
            await logout(false)
            return { success: false, error: 'Token expired' }
        }

        // Return cached result if still valid
        if (now - _lastValidation.value < VALIDATION_CACHE_DURATION && _validationCache.value !== null) {
            return _validationCache.value
        }

        if (!token.value) {
            const result = { success: false, error: 'No token' }
            _validationCache.value = result
            return result
        }

        // If validation is already in progress, wait for it
        if (_validationPromise.value) {
            return await _validationPromise.value
        }

        // Create and cache the validation promise
        _validationPromise.value = performValidation()

        try {
            const result = await _validationPromise.value
            return result
        } finally {
            _validationPromise.value = null
        }
    }

    const performValidation = async () => {
        try {
            const response = await retryOperation(() =>
                apiMethods.auth.getMe()
            )

            if (response.data.success) {
                user.value = response.data.user
                organizations.value = response.data.organizations || { admin: [], member: [] }
                pendingInvitations.value = response.data.pendingInvitations || []
                eventParticipations.value = response.data.eventParticipations || []

                // Auto-select org if needed
                if (!activeOrgId.value && allOrganizations.value.length > 0) {
                    setActiveOrg(allOrganizations.value[0]._id)
                }

                const result = { success: true, user: response.data.user }
                _lastValidation.value = Date.now()
                _validationCache.value = result
                return result
            } else {
                await logout(false)
                const result = { success: false, error: 'Session invalid' }
                _validationCache.value = result
                return result
            }
        } catch (error) {
            console.error('Session validation error:', error)

            if (shouldClearTokenOnError(error)) {
                await logout(false)
                const result = {
                    success: false,
                    error: error.response?.data?.error || 'Session validation failed'
                }
                _validationCache.value = result
                return result
            } else {
                // Network/server error — keep token but return failure
                return {
                    success: false,
                    error: 'Temporary validation error',
                    retainToken: true
                }
            }
        }
    }

    // Update user activity
    const updateActivity = () => {
        lastActivity.value = Date.now()
        sessionWarningShown.value = false
    }

    // Initialize auth state
    const initializeAuth = async () => {
        if (!token.value) {
            return false
        }

        try {
            const validation = await validateSession()

            if (validation.success) {
                initializeWebSocket()
                return true
            }

            if (validation.retainToken) {
                console.warn('Auth initialization failed temporarily, will retry later')
                return true
            }

            return false
        } catch (error) {
            console.error('Auth initialization error:', error)
            return false
        }
    }

    // Determine where to route after login
    const getDefaultRoute = () => {
        // All users land on the universal dashboard
        return { name: 'DashboardHome' }
    }

    // =============================================
    // WEBSOCKET
    // =============================================
    const initializeWebSocket = () => {
        if (!token.value) {
            console.warn('Cannot initialize WebSocket: no token')
            return
        }

        try {
            const wsStore = useWebSocketStore()
            wsStore.connect(token.value)
            console.log('✅ WebSocket initialized')
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error)
        }
    }

    const disconnectWebSocket = () => {
        try {
            const wsStore = useWebSocketStore()
            wsStore.disconnect()
            console.log('🔌 WebSocket disconnected')
        } catch (error) {
            console.error('Failed to disconnect WebSocket:', error)
        }
    }

    // =============================================
    // PROFILE UPDATES
    // =============================================
    const updateProfile = async (data) => {
        try {
            isLoading.value = true
            const response = await apiMethods.auth.updateProfile(data)

            if (response.data.success) {
                user.value = response.data.user
                toast.success('Profile updated')
                return { success: true }
            }

            return { success: false, error: 'Update failed' }
        } catch (error) {
            const message = error.response?.data?.error || 'Failed to update profile'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    const changePassword = async (currentPassword, newPassword) => {
        try {
            isLoading.value = true
            const response = await apiMethods.auth.changePassword({ currentPassword, newPassword })

            if (response.data.success) {
                toast.success('Password changed')
                return { success: true }
            }

            return { success: false, error: 'Password change failed' }
        } catch (error) {
            const message = error.response?.data?.error || 'Failed to change password'
            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // =============================================
    // RETURN
    // =============================================
    return {
        // State
        token,
        user,
        isLoading,
        organizations,
        pendingInvitations,
        activeOrgId,

        // Computed
        isAuthenticated,
        isSuperAdmin,
        allOrganizations,
        activeOrganization,
        isOrgAdmin,
        orgPermissions,
        hasOrganization,
        displayName,
        eventParticipations,
        presidiumEvents,
        delegateEvents,
        hasEventAccess,
        isOrgMember,

        // Legacy compat computeds — used by old stores/components
        isAdmin,
        isPresidium,
        isDelegate,
        userRole,
        committeeId,
        formatPresidiumRole,

        // Methods
        hasOrgPermission,
        register,
        login,
        logout,
        setActiveOrg,
        validateSession,
        updateActivity,
        initializeAuth,
        getDefaultRoute,
        fetchProfile,
        updateProfile,
        changePassword,
        initializeWebSocket,
        disconnectWebSocket,
    }
})