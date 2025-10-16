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

    // Validate existing session
    const validateSession = async () => {
        if (!token.value) return false

        try {
            const response = await apiMethods.auth.validateSession()

            if (response.data.success && response.data.user) {
                user.value = response.data.user
                return true
            }

            return false

        } catch (error) {
            console.error('Session validation failed:', error)
            logout()
            return false
        }
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
        const timeout = 30 * 60 * 1000 // 30 minutes
        const warningTime = 5 * 60 * 1000 // 5 minutes before timeout
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

        // Actions
        adminLogin,
        qrLogin,
        bindEmail,
        emailLogin,
        validateSession,
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