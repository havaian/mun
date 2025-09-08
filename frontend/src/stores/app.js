import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
    // State
    const isInitialized = ref(false)
    const isLoading = ref(false)
    const loadingMessage = ref('')
    const sidebarCollapsed = ref(false)
    const currentLanguage = ref('en')
    const theme = ref('light')
    const networkStatus = ref('online')
    const notifications = ref([])
    const modals = ref([])
    const breadcrumbs = ref([])

    // Computed
    const hasNotifications = computed(() => notifications.value.length > 0)
    const unreadNotifications = computed(() =>
        notifications.value.filter(n => !n.read).length
    )
    const hasActiveModals = computed(() => modals.value.length > 0)

    // Getters
    const isOnline = computed(() => networkStatus.value === 'online')
    const isOffline = computed(() => networkStatus.value === 'offline')

    // Actions

    // App initialization
    const setInitialized = (value) => {
        isInitialized.value = value
    }

    // Loading state
    const setLoading = (loading, message = '') => {
        isLoading.value = loading
        loadingMessage.value = message
    }

    // Sidebar
    const toggleSidebar = () => {
        sidebarCollapsed.value = !sidebarCollapsed.value
        localStorage.setItem('mun_sidebar_collapsed', sidebarCollapsed.value.toString())
    }

    const setSidebarCollapsed = (collapsed) => {
        sidebarCollapsed.value = collapsed
        localStorage.setItem('mun_sidebar_collapsed', collapsed.toString())
    }

    // Language
    const setLanguage = (language) => {
        const validLanguages = ['en', 'ru', 'uz_lat', 'uz_cyr']
        if (validLanguages.includes(language)) {
            currentLanguage.value = language
            localStorage.setItem('mun_language', language)

            // Update document language
            document.documentElement.lang = language

            // Trigger language change event for components
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language }
            }))
        }
    }

    // Theme
    const setTheme = (newTheme) => {
        const validThemes = ['light', 'dark']
        if (validThemes.includes(newTheme)) {
            theme.value = newTheme
            localStorage.setItem('mun_theme', newTheme)

            // Update document class
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(newTheme)
        }
    }

    const toggleTheme = () => {
        setTheme(theme.value === 'light' ? 'dark' : 'light')
    }

    // Network status
    const setNetworkStatus = (status) => {
        const oldStatus = networkStatus.value
        networkStatus.value = status

        // Add notification for status changes
        if (oldStatus !== status) {
            if (status === 'online' && oldStatus === 'offline') {
                addNotification({
                    type: 'success',
                    title: 'Connection Restored',
                    message: 'You are back online',
                    duration: 3000
                })
            } else if (status === 'offline') {
                addNotification({
                    type: 'warning',
                    title: 'Connection Lost',
                    message: 'You are currently offline',
                    duration: 5000,
                    persistent: true
                })
            }
        }
    }

    // Notifications
    const addNotification = (notification) => {
        const id = Date.now() + Math.random()
        const newNotification = {
            id,
            type: 'info',
            title: '',
            message: '',
            duration: 4000,
            persistent: false,
            read: false,
            createdAt: new Date(),
            ...notification
        }

        notifications.value.unshift(newNotification)

        // Auto-remove non-persistent notifications
        if (!newNotification.persistent && newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id)
            }, newNotification.duration)
        }

        return id
    }

    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index > -1) {
            notifications.value.splice(index, 1)
        }
    }

    const markNotificationAsRead = (id) => {
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
            notification.read = true
        }
    }

    const clearAllNotifications = () => {
        notifications.value = []
    }

    // Modals
    const showModal = (modalConfig) => {
        const id = Date.now() + Math.random()
        const modal = {
            id,
            component: null,
            props: {},
            options: {
                closable: true,
                backdrop: true,
                size: 'md'
            },
            ...modalConfig
        }

        modals.value.push(modal)
        return id
    }

    const closeModal = (id) => {
        const index = modals.value.findIndex(m => m.id === id)
        if (index > -1) {
            modals.value.splice(index, 1)
        }
    }

    const closeAllModals = () => {
        modals.value = []
    }

    // Breadcrumbs
    const setBreadcrumbs = (crumbs) => {
        breadcrumbs.value = crumbs.map(crumb => ({
            text: '',
            to: null,
            active: false,
            ...crumb
        }))
    }

    const addBreadcrumb = (crumb) => {
        breadcrumbs.value.push({
            text: '',
            to: null,
            active: false,
            ...crumb
        })
    }

    const clearBreadcrumbs = () => {
        breadcrumbs.value = []
    }

    // Utility methods
    const showSuccessMessage = (message, title = 'Success') => {
        addNotification({
            type: 'success',
            title,
            message,
            duration: 3000
        })
    }

    const showErrorMessage = (message, title = 'Error') => {
        addNotification({
            type: 'error',
            title,
            message,
            duration: 5000
        })
    }

    const showWarningMessage = (message, title = 'Warning') => {
        addNotification({
            type: 'warning',
            title,
            message,
            duration: 4000
        })
    }

    const showInfoMessage = (message, title = 'Information') => {
        addNotification({
            type: 'info',
            title,
            message,
            duration: 4000
        })
    }

    // Confirmation dialog
    const showConfirmDialog = (options) => {
        return new Promise((resolve) => {
            const modalId = showModal({
                component: 'ConfirmDialog',
                props: {
                    title: 'Confirm Action',
                    message: 'Are you sure you want to continue?',
                    confirmText: 'Confirm',
                    cancelText: 'Cancel',
                    type: 'warning',
                    ...options,
                    onConfirm: () => {
                        closeModal(modalId)
                        resolve(true)
                    },
                    onCancel: () => {
                        closeModal(modalId)
                        resolve(false)
                    }
                },
                options: {
                    closable: false,
                    backdrop: false
                }
            })
        })
    }

    // Initialize app state from localStorage
    const initializeFromStorage = () => {
        // Sidebar state
        const savedSidebarState = localStorage.getItem('mun_sidebar_collapsed')
        if (savedSidebarState !== null) {
            sidebarCollapsed.value = savedSidebarState === 'true'
        }

        // Language
        const savedLanguage = localStorage.getItem('mun_language')
        if (savedLanguage) {
            setLanguage(savedLanguage)
        }

        // Theme
        const savedTheme = localStorage.getItem('mun_theme')
        if (savedTheme) {
            setTheme(savedTheme)
        }

        // Network status listeners
        window.addEventListener('online', () => setNetworkStatus('online'))
        window.addEventListener('offline', () => setNetworkStatus('offline'))

        // Set initial network status
        setNetworkStatus(navigator.onLine ? 'online' : 'offline')
    }

    // Performance monitoring
    const trackPerformance = (operation, duration) => {
        if (import.meta.env.DEV) {
            console.debug(`Performance: ${operation} took ${duration}ms`)
        }

        // In production, you might want to send this to analytics
        if (import.meta.env.PROD && duration > 1000) {
            console.warn(`Slow operation detected: ${operation} (${duration}ms)`)
        }
    }

    return {
        // State
        isInitialized,
        isLoading,
        loadingMessage,
        sidebarCollapsed,
        currentLanguage,
        theme,
        networkStatus,
        notifications,
        modals,
        breadcrumbs,

        // Computed
        hasNotifications,
        unreadNotifications,
        hasActiveModals,
        isOnline,
        isOffline,

        // Actions
        setInitialized,
        setLoading,
        toggleSidebar,
        setSidebarCollapsed,
        setLanguage,
        setTheme,
        toggleTheme,
        setNetworkStatus,
        addNotification,
        removeNotification,
        markNotificationAsRead,
        clearAllNotifications,
        showModal,
        closeModal,
        closeAllModals,
        setBreadcrumbs,
        addBreadcrumb,
        clearBreadcrumbs,
        showSuccessMessage,
        showErrorMessage,
        showWarningMessage,
        showInfoMessage,
        showConfirmDialog,
        initializeFromStorage,
        trackPerformance
    }
})