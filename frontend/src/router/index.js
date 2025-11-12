import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// Import views
const LoginView = () => import('@/views/auth/LoginView.vue')
const EmailBindingView = () => import('@/views/auth/EmailBindingView.vue')
const LanguageSelectionView = () => import('@/views/auth/LanguageSelectionView.vue')

// Admin views
const AdminDashboard = () => import(/* webpackChunkName: "admin-dashboard" */ '@/views/admin/DashboardView.vue')
const AdminEvents = () => import(/* webpackChunkName: "admin-events" */ '@/views/admin/EventsView.vue')
const AdminCommittees = () => import(/* webpackChunkName: "admin-committees" */ '@/views/admin/CommitteesView.vue')
const AdminUsers = () => import(/* webpackChunkName: "admin-users" */ '@/views/admin/UsersView.vue')
const AdminDocuments = () => import(/* webpackChunkName: "admin-documents" */ '@/views/admin/DocumentsView.vue')
const AdminReports = () => import(/* webpackChunkName: "admin-reports" */ '@/views/admin/ReportsView.vue')
const AdminLogs = () => import(/* webpackChunkName: "admin-logs" */ '@/views/admin/LogsView.vue')
const AdminSettings = () => import(/* webpackChunkName: "admin-settings" */ '@/views/admin/SettingsView.vue')

// Presidium views
const PresidiumDashboard = () => import('@/views/presidium/DashboardView.vue')
const PresidiumSessions = () => import('@/views/presidium/SessionsView.vue')
const PresidiumDocuments = () => import('@/views/presidium/DocumentsView.vue')
const PresidiumVoting = () => import('@/views/presidium/VotingView.vue')
const PresidiumAttendance = () => import('@/views/presidium/AttendanceView.vue')

// Delegate views
const DelegateDashboard = () => import('@/views/delegate/DashboardView.vue')
const DelegateDocuments = () => import('@/views/delegate/DocumentsView.vue')
const DelegateCoalitions = () => import('@/views/delegate/CoalitionsView.vue')
const DelegateMessages = () => import('@/views/delegate/MessagesView.vue')
const DelegateVoting = () => import('@/views/delegate/VotingView.vue')

// Shared views
const ProfileView = () => import('@/views/shared/ProfileView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

export const adminRoutes = {
  path: '/admin',
  component: () => import(/* webpackChunkName: "admin-layout" */ '@/layouts/AdminLayout.vue'),
  meta: { 
    requiresAuth: true, 
    roles: ['admin'],
    keepAlive: true // Keep the layout alive
  },
  children: [
    {
      path: '',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { 
        title: 'Admin Dashboard',
        keepAlive: true, // Cache this component
        transition: 'fade' // Smooth transition
      }
    },
    {
      path: 'events',
      name: 'AdminEvents', 
      component: AdminEvents,
      meta: { 
        title: 'Event Management',
        keepAlive: true,
        transition: 'fade'
      }
    },
    {
      path: 'committees',
      name: 'AdminCommittees',
      component: AdminCommittees,
      meta: { 
        title: 'Committee Management',
        keepAlive: true,
        transition: 'fade'
      }
    },
    {
      path: 'users',
      name: 'AdminUsers',
      component: AdminUsers,
      meta: { 
        title: 'User Management',
        keepAlive: true,
        transition: 'fade'
      }
    },
    {
      path: 'documents',
      name: 'AdminDocuments',
      component: AdminDocuments,
      meta: { 
        title: 'Document Management',
        keepAlive: true,
        transition: 'fade'
      }
    },
    {
      path: 'reports',
      name: 'AdminReports',
      component: AdminReports,
      meta: { 
        title: 'Reports & Analytics',
        keepAlive: true,
        transition: 'fade'
      }
    },
    {
      path: 'logs',
      name: 'AdminLogs',
      component: AdminLogs,
      meta: { 
        title: 'System Logs',
        keepAlive: false, // Don't cache logs for real-time updates
        transition: 'fade'
      }
    },
    {
      path: 'settings',
      name: 'AdminSettings',
      component: AdminSettings,
      meta: { 
        title: 'System Settings',
        keepAlive: true,
        transition: 'fade'
      }
    }
  ]
}

const routes = [
  // Authentication routes
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: LoginView,
        meta: {
          title: 'Login',
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'bind-email',
        name: 'EmailBinding',
        component: EmailBindingView,
        meta: {
          title: 'Complete Registration',
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'language',
        name: 'LanguageSelection',
        component: LanguageSelectionView,
        meta: {
          title: 'Select Language',
          requiresAuth: true,
          newUserOnly: true
        }
      }
    ]
  },

  // Admin routes
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: 'Admin Dashboard' }
      },
      {
        path: 'events',
        name: 'AdminEvents',
        component: AdminEvents,
        meta: { title: 'Event Management' }
      },
      {
        path: 'committees',
        name: 'AdminCommittees',
        component: AdminCommittees,
        meta: { title: 'Committee Management' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: { title: 'User Management' }
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: AdminReports,
        meta: { title: 'Reports & Analytics' }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: AdminLogs,
        meta: { title: 'System Logs' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
        meta: { title: 'System Settings' }
      },
      {
        path: 'documents',
        name: 'AdminDocuments',
        component: AdminDocuments,
        meta: { title: 'Documents Management' }
      }
    ]
  },

  // Presidium routes
  {
    path: '/presidium',
    component: () => import('@/layouts/PresidiumLayout.vue'),
    meta: { requiresAuth: true, roles: ['presidium'] },
    children: [
      {
        path: '',
        name: 'PresidiumDashboard',
        component: PresidiumDashboard,
        meta: { title: 'Presidium Dashboard' }
      },
      {
        path: 'sessions',
        name: 'PresidiumSessions',
        component: PresidiumSessions,
        meta: { title: 'Session Management' }
      },
      {
        path: 'documents',
        name: 'PresidiumDocuments',
        component: PresidiumDocuments,
        meta: { title: 'Document Review' }
      },
      {
        path: 'voting',
        name: 'PresidiumVoting',
        component: PresidiumVoting,
        meta: { title: 'Voting Management' }
      },
      {
        path: 'attendance',
        name: 'PresidiumAttendance',
        component: PresidiumAttendance,
        meta: { title: 'Attendance Tracking' }
      }
    ]
  },

  // Delegate routes
  {
    path: '/delegate',
    component: () => import('@/layouts/DelegateLayout.vue'),
    meta: { requiresAuth: true, roles: ['delegate'] },
    children: [
      {
        path: '',
        name: 'DelegateDashboard',
        component: DelegateDashboard,
        meta: { title: 'Delegate Dashboard' }
      },
      {
        path: 'documents',
        name: 'DelegateDocuments',
        component: DelegateDocuments,
        meta: { title: 'My Documents' }
      },
      {
        path: 'coalitions',
        name: 'DelegateCoalitions',
        component: DelegateCoalitions,
        meta: { title: 'Coalitions' }
      },
      {
        path: 'messages',
        name: 'DelegateMessages',
        component: DelegateMessages,
        meta: { title: 'Messages' }
      },
      {
        path: 'voting',
        name: 'DelegateVoting',
        component: DelegateVoting,
        meta: { title: 'Voting' }
      }
    ]
  },

  // // Delegate routes
  // {
  //   path: '/shared',
  //   component: () => import('@/layouts/SharedLayout.vue'),
  //   meta: { requiresAuth: true, roles: ['admin', 'presidium', 'delegate'] },
  //   children: [
  //     {
  //       path: '/profile',
  //       name: 'Profile',
  //       component: ProfileView,
  //       meta: {
  //         title: 'Profile',
  //         requiresAuth: true
  //       }
  //     }
  //   ]
  // },

  // Root redirect
  {
    path: '/',
    redirect: (to) => {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        return { name: 'Login' }
      }

      // Redirect based on user role
      switch (authStore.user?.role) {
        case 'admin':
          return { name: 'AdminDashboard' }
        case 'presidium':
          return { name: 'PresidiumDashboard' }
        case 'delegate':
          return { name: 'DelegateDashboard' }
        default:
          return { name: 'Login' }
      }
    }
  },

  // 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { title: 'Page Not Found' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const appStore = useAppStore()

  // Show loading for slow transitions
  appStore.setLoading(true)

  try {
    // Check if route requires authentication
    if (to.meta.requiresAuth) {
      // If we have a token but aren't authenticated yet, validate the session first
      const token = localStorage.getItem('mun_token')
      if (token && !authStore.isAuthenticated) {
        console.log('🍻 Token exists but needs revalidation. Proceeding...')

        try {
          await authStore.validateSession()
        } catch (error) {
          console.error('Session validation failed:', error)
          // Remove invalid token
          localStorage.removeItem('mun_token')
        }
      }

      // Now check authentication after validation
      if (!authStore.isAuthenticated) {
        return next({ name: 'Login', query: { redirect: to.fullPath } })
      }

      // Check role permissions
      if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
        return next({ name: 'NotFound' })
      }

      // Check for new user language selection
      if (to.meta.newUserOnly && authStore.user?.hasSelectedLanguage) {
        return next({ name: authStore.getDashboardRoute() })
      }
    }

    // Hide auth pages from authenticated users
    if (to.meta.hideForAuthenticated && authStore.isAuthenticated) {
      return next({ name: authStore.getDashboardRoute() })
    }

    next()

  } catch (error) {
    console.error('Navigation error:', error)
    next({ name: 'Login' })
  }
})

router.afterEach(() => {
  const appStore = useAppStore()
  appStore.setLoading(false)
})

export const routerConfig = {
  // Scroll behavior for smooth navigation
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  },

  // Route guards for layout optimization
  beforeEach: (to, from, next) => {
    // Preload layout if navigating to admin routes
    if (to.path.startsWith('/admin') && !from.path.startsWith('/admin')) {
      // The layout will be loaded automatically by Vue Router
    }

    // Update document title
    if (to.meta.title) {
      document.title = `${to.meta.title} - MUN.UZ`
    }

    next()
  }
}

export default router