import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
    const router = useRouter()

    // State
    const user = ref(null)
    const token = ref(localStorage.getItem('mun_token'))
    const isLoading = ref(false)
    const lastActivity = ref(Date.now())
    const sessionWarningShown = ref(false)

    // Helper function to safely use toast
    const showToast = (type, message) => {
        try {
            // Use dynamic import to avoid initialization issues
            import('@/plugins/toast').then(toastModule => {
                const { useToast } = toastModule
                const toast = useToast()
                toast[type](message)
            }).catch(() => {
                console.log(`${type.toUpperCase()}: ${message}`)
            })
        } catch (error) {
            // Fallback to console if toast is not available
            console.log(`${type.toUpperCase()}: ${message}`)
        }
    }

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

            const response = await api.post('/auth/admin-login', credentials)

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                showToast('success', 'Welcome back, Administrator!')

                // Navigate to dashboard
                router.push({ name: 'AdminDashboard' })

                return { success: true }
            } else {
                throw new Error(response.data.message || 'Login failed')
            }

        } catch (error) {
            console.error('Admin login error:', error)

            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Login failed. Please check your credentials.'

            showToast('error', errorMessage)

            return {
                success: false,
                message: errorMessage
            }
        } finally {
            isLoading.value = false
        }
    }

    // Presidium login
    const presidiumLogin = async (credentials) => {
        try {
            isLoading.value = true

            const response = await api.post('/auth/presidium-login', credentials)

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                showToast('success', `Welcome, ${formatPresidiumRole(user.value.presidiumRole)}!`)

                router.push({ name: 'PresidiumDashboard' })

                return { success: true }
            } else {
                throw new Error(response.data.message || 'Login failed')
            }

        } catch (error) {
            console.error('Presidium login error:', error)

            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Login failed. Please check your credentials.'

            showToast('error', errorMessage)

            return {
                success: false,
                message: errorMessage
            }
        } finally {
            isLoading.value = false
        }
    }

    // QR Code login
    const qrLogin = async (qrCode) => {
        try {
            isLoading.value = true

            const response = await api.post('/auth/qr-login', { qrCode })

            if (response.data.success) {
                token.value = response.data.token
                user.value = response.data.user

                localStorage.setItem('mun_token', token.value)

                const welcomeMessage = user.value.role === 'delegate'
                    ? `Welcome, ${user.value.countryName}!`
                    : `Welcome to MUN.UZ!`

                showToast('success', welcomeMessage)

                // Navigate based on role
                const dashboardRoute = getDashboardRoute()
                router.push({ name: dashboardRoute })

                return { success: true }
            } else {
                throw new Error(response.data.message || 'Invalid QR code')
            }

        } catch (error) {
            console.error('QR login error:', error)

            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Invalid QR code. Please try again.'

            showToast('error', errorMessage)

            return {
                success: false,
                message: errorMessage
            }
        } finally {
            isLoading.value = false
        }
    }

    // Validate existing session
    const validateSession = async () => {
        try {
            if (!token.value) {
                return false
            }

            const response = await api.get('/auth/validate')

            if (response.data.success && response.data.user) {
                user.value = response.data.user
                updateActivity()
                return true
            } else {
                throw new Error('Session validation failed')
            }

        } catch (error) {
            console.warn('Session validation failed:', error)

            // Clear invalid session
            logout(false)
            return false
        }
    }

    // Logout
    const logout = async (showMessage = true) => {
        try {
            if (token.value) {
                await api.post('/auth/logout')
            }
        } catch (error) {
            console.warn('Logout API call failed:', error)
        } finally {
            // Clear local state regardless of API response
            user.value = null
            token.value = null
            localStorage.removeItem('mun_token')

            if (showMessage) {
                showToast('info', 'You have been logged out successfully')
            }

            // Navigate to login
            router.push({ name: 'Login' })
        }
    }

    // Update last activity
    const updateActivity = () => {
        lastActivity.value = Date.now()
    }

    // Session monitoring
    const startSessionMonitoring = () => {
        // Check session every 5 minutes
        setInterval(() => {
            if (isAuthenticated.value) {
                validateSession()
            }
        }, 5 * 60 * 1000)

        // Update activity on user interactions
        const events = ['click', 'keydown', 'mousemove', 'scroll']
        events.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true })
        })
    }

    // Get appropriate dashboard route based on user role
    const getDashboardRoute = () => {
        if (!user.value) return 'Login'

        switch (user.value.role) {
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

        // Admins have all permissions
        if (user.value.role === 'admin') return true

        // Check user's specific permissions
        return user.value.permissions?.includes(permission) || false
    }

    // Check if user can access committee
    const canAccessCommittee = (committeeId) => {
        if (!user.value) return false

        // Admins can access all committees
        if (user.value.role === 'admin') return true

        // Check if user belongs to this committee
        return user.value.committeeId === committeeId ||
            user.value.committeeId?._id === committeeId
    }

    // Check authentication status
    const checkAuth = async () => {
        if (!token.value) {
            return false
        }

        try {
            const response = await api.get('/auth/verify-token')

            if (response.data.success) {
                user.value = response.data.user
                return true
            } else {
                // Invalid token, clear it
                logout()
                return false
            }
        } catch (error) {
            console.error('Token verification failed:', error)
            logout()
            return false
        }
    }

    // Get default route based on user role
    const getDefaultRoute = () => {
        if (!user.value) return '/'

        switch (user.value.role) {
            case 'admin':
                return '/admin/dashboard'
            case 'presidium':
                return '/presidium'
            case 'delegate':
                return '/delegate'
            default:
                return '/'
        }
    }

    // Check if user has specific role
    const hasRole = (role) => {
        return user.value?.role === role
    }

    // Return all methods and computed properties
    return {
        // State
        user,
        token,
        isLoading,
        lastActivity,
        sessionWarningShown,

        // Computed
        isAuthenticated,
        userRole,
        userDisplayName,
        committeeInfo,

        // Actions
        adminLogin,
        presidiumLogin,
        qrLogin,
        checkAuth,
        getDefaultRoute,
        hasRole,
        logout
    }
})