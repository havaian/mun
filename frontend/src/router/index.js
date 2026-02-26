import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// =============================================
// AUTH VIEWS
// =============================================
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('@/views/auth/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@/views/auth/ResetPasswordView.vue')

// =============================================
// SUPERADMIN VIEWS
// =============================================
const SuperAdminDashboard = () => import('@/views/superadmin/DashboardView.vue')
const SuperAdminOrganizations = () => import('@/views/superadmin/OrganizationsView.vue')

// =============================================
// ORG ADMIN/MEMBER VIEWS
// =============================================
const OrgDashboard = () => import('@/views/org/DashboardView.vue')
const OrgEvents = () => import('@/views/org/EventsView.vue')
const OrgEventDetail = () => import('@/views/org/EventDetailView.vue')
const OrgMembers = () => import('@/views/org/MembersView.vue')
const OrgSettings = () => import('@/views/org/SettingsView.vue')

// =============================================
// EVENT MANAGEMENT VIEWS
// =============================================
const EventRegistration = () => import('@/views/org/event/RegistrationView.vue')
const EventApplications = () => import('@/views/org/event/ApplicationsView.vue')
const EventCommittees = () => import('@/views/org/event/CommitteesView.vue')

// =============================================
// PRESIDIUM VIEWS (existing — will be rewired later)
// =============================================
const PresidiumDashboard = () => import('@/views/presidium/DashboardView.vue')
const PresidiumAttendance = () => import('@/views/presidium/AttendanceView.vue')
const PresidiumCoalitions = () => import('@/views/presidium/CoalitionsView.vue')
const PresidiumDiplomacy = () => import('@/views/presidium/DiplomacyView.vue')
const PresidiumVoting = () => import('@/views/presidium/VotingView.vue')
const PresidiumPublicDisplay = () => import('@/views/presidium/PublicDisplayView.vue')
const PresidiumApplications = () => import('@/views/presidium/ApplicationsView.vue')

// =============================================
// DELEGATE VIEWS (existing — will be rewired later)
// =============================================
const DelegateDashboard = () => import('@/views/delegate/DashboardView.vue')
const DelegateCoalitions = () => import('@/views/delegate/CoalitionsView.vue')
const DelegateDiplomacy = () => import('@/views/delegate/DiplomacyView.vue')
const DelegateVoting = () => import('@/views/delegate/VotingView.vue')

// =============================================
// SHARED VIEWS
// =============================================
const ProfileView = () => import('@/views/shared/ProfileView.vue')
const UserHomeView = () => import('@/views/shared/UserHomeView.vue')
const AcceptInvitationView = () => import('@/views/shared/AcceptInvitationView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

// =============================================
// PUBLIC VIEWS
// =============================================
const PublicEventPage = () => import('@/views/public/EventPageView.vue')
const PublicOrgPage = () => import('@/views/public/OrgPageView.vue')
const PublicRegistrationPage = () => import('@/views/public/RegistrationPageView.vue')
const MyApplicationView = () => import('@/views/public/MyApplicationView.vue')

// =============================================
// DASHBOARD VIEWS (universal home)
// =============================================
const DashboardHomeView = () => import('@/views/dashboard/DashboardHomeView.vue')
const MyEventsView = () => import('@/views/dashboard/MyEventsView.vue')
const MyOrganizationsView = () => import('@/views/dashboard/MyOrganizationsView.vue')

// =============================================
// ROUTES
// =============================================
const routes = [
  // Redirects
  {
    path: '/login',
    redirect: { name: 'Login' }
  },

  // =============================================
  // AUTH ROUTES (public)
  // =============================================
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
        path: 'register',
        name: 'Register',
        component: RegisterView,
        meta: {
          title: 'Create Account',
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: ForgotPasswordView,
        meta: {
          title: 'Forgot Password',
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'reset-password',
        name: 'ResetPassword',
        component: ResetPasswordView,
        meta: {
          title: 'Reset Password',
          requiresAuth: false,
          hideForAuthenticated: true
        }
      },
      {
        path: 'verify-email',
        name: 'VerifyEmail',
        component: () => import('@/views/auth/VerifyEmailView.vue'),
        meta: {
          title: 'Verify Email',
          requiresAuth: false
        }
      }
    ]
  },

  // =============================================
  // INVITATION ACCEPT (authenticated)
  // =============================================
  {
    path: '/invite/:token',
    name: 'AcceptInvitation',
    component: AcceptInvitationView,
    meta: {
      title: 'Accept Invitation',
      requiresAuth: false // Can view info without auth, but needs auth to accept
    }
  },

  // =============================================
  // SUPERADMIN ROUTES
  // =============================================
  {
    path: '/superadmin',
    component: () => import('@/layouts/SuperAdminLayout.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'SuperAdminDashboard',
        component: SuperAdminDashboard,
        meta: { title: 'Platform Administration' }
      },
      {
        path: 'organizations',
        name: 'SuperAdminOrganizations',
        component: SuperAdminOrganizations,
        meta: { title: 'Organizations' }
      }
    ]
  },

  // =============================================
  // DASHBOARD ROUTES — /dashboard (universal home for all users)
  // =============================================
  {
    path: '/dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: DashboardHomeView,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'events',
        name: 'DashboardEvents',
        component: MyEventsView,
        meta: { title: 'My Events' }
      },
      {
        path: 'organizations',
        name: 'DashboardOrganizations',
        component: MyOrganizationsView,
        meta: { title: 'My Organizations' }
      },
      {
        path: 'profile',
        name: 'DashboardProfile',
        component: ProfileView,
        meta: { title: 'My Profile' }
      },
    ]
  },

  // =============================================
  // ORG ROUTES — /org/:orgSlug
  // =============================================
  {
    path: '/org/:orgSlug',
    component: () => import('@/layouts/OrgLayout.vue'),
    meta: { requiresAuth: true, requiresOrgAccess: true },
    children: [
      {
        path: '',
        name: 'OrgDashboard',
        component: OrgDashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'events',
        name: 'OrgEvents',
        component: OrgEvents,
        meta: { title: 'Events' }
      },
      {
        path: 'events/:eventSlug',
        name: 'OrgEventDetail',
        component: OrgEventDetail,
        meta: { title: 'Event Details' }
      },
      {
        path: 'events/:eventSlug/registration',
        name: 'EventRegistration',
        component: EventRegistration,
        meta: { title: 'Registration Form' }
      },
      {
        path: 'events/:eventSlug/applications',
        name: 'EventApplications',
        component: EventApplications,
        meta: { title: 'Applications' }
      },
      {
        path: 'events/:eventSlug/committees',
        name: 'EventCommittees',
        component: EventCommittees,
        meta: { title: 'Committees' }
      },
      {
        path: 'members',
        name: 'OrgMembers',
        component: OrgMembers,
        meta: { title: 'Members' }
      },
      {
        path: 'settings',
        name: 'OrgSettings',
        component: OrgSettings,
        meta: { title: 'Settings' }
      }
    ]
  },

  // =============================================
  // PRESIDIUM ROUTES — existing MUN views
  // Now accessed as /session/:committeeId/presidium/...
  // The committeeId resolves to event → org context
  // =============================================
  {
    path: '/session/:committeeId/presidium',
    component: () => import('@/layouts/PresidiumLayout.vue'),
    meta: { requiresAuth: true, requiresPresidium: true },
    children: [
      {
        path: '',
        name: 'PresidiumDashboard',
        component: PresidiumDashboard,
        meta: { title: 'Presidium Dashboard' }
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
      },
      {
        path: 'messaging',
        name: 'PresidiumMessaging',
        component: PresidiumDiplomacy,
        meta: { title: 'Diplomacy' }
      },
      {
        path: 'coalitions',
        name: 'PresidiumCoalitions',
        component: PresidiumCoalitions,
        meta: { title: 'Coalitions' }
      },
      {
        path: 'public-display',
        name: 'PresidiumPublicDisplay',
        component: PresidiumPublicDisplay,
        meta: { title: 'Public Display' }
      },
      {
        path: 'applications',
        name: 'PresidiumApplications',
        component: PresidiumApplications,
        meta: { title: 'Application Review' }
      },
    ]
  },

  // =============================================
  // DELEGATE ROUTES — existing MUN views
  // Now accessed as /session/:committeeId/delegate/...
  // =============================================
  {
    path: '/session/:committeeId/delegate',
    component: () => import('@/layouts/DelegateLayout.vue'),
    meta: { requiresAuth: true, requiresDelegate: true },
    children: [
      {
        path: '',
        name: 'DelegateDashboard',
        component: DelegateDashboard,
        meta: { title: 'Delegate Dashboard' }
      },
      {
        path: 'coalitions',
        name: 'DelegateCoalitions',
        component: DelegateCoalitions,
        meta: { title: 'Coalitions' }
      },
      {
        path: 'messaging',
        name: 'DelegateMessaging',
        component: DelegateDiplomacy,
        meta: { title: 'Diplomacy' }
      },
      {
        path: 'voting',
        name: 'DelegateVoting',
        component: DelegateVoting,
        meta: { title: 'Voting' }
      }
    ]
  },

  // =============================================
  // SHARED ROUTES
  // =============================================
  {
    path: '/profile',
    redirect: { name: 'DashboardProfile' }
  },
  {
    path: '/home',
    redirect: { name: 'DashboardHome' }
  },

  // =============================================
  // ROOT REDIRECT
  // =============================================
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        return { name: 'Login' }
      }
      return { name: 'DashboardHome' }
    }
  },

  // =============================================
  // LEGACY REDIRECTS (old routes → new locations)
  // =============================================
  {
    path: '/admin',
    redirect: () => {
      const authStore = useAuthStore()
      if (authStore.isSuperAdmin) {
        return { name: 'SuperAdminDashboard' }
      }
      return { name: 'DashboardHome' }
    }
  },
  // Old presidium/delegate routes redirect to login (user needs to enter via session URL now)
  {
    path: '/presidium',
    redirect: { name: 'DashboardEvents' }
  },
  {
    path: '/delegate',
    redirect: { name: 'DashboardEvents' }
  },

  // =============================================
  // PUBLIC PAGES (no auth)
  // =============================================
  {
    path: '/org/:orgSlug/public',
    name: 'PublicOrg',
    component: PublicOrgPage,
    meta: { title: 'Organization', requiresAuth: false }
  },
  {
    path: '/events/:orgSlug/:eventSlug',
    name: 'PublicEvent',
    component: PublicEventPage,
    meta: { title: 'Event', requiresAuth: false }
  },
  {
    path: '/events/:orgSlug/:eventSlug/register',
    name: 'PublicRegistration',
    component: PublicRegistrationPage,
    meta: { title: 'Registration', requiresAuth: false }
  },
  {
    path: '/events/:orgSlug/:eventSlug/my-application',
    name: 'MyApplication',
    component: MyApplicationView,
    meta: {
        title: 'My Application',
        requiresAuth: true
    }
  },

  // =============================================
  // 404
  // =============================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { title: 'Page Not Found' }
  }
]

// =============================================
// CREATE ROUTER
// =============================================
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

// =============================================
// NAVIGATION GUARD
// =============================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const appStore = useAppStore()

  appStore.setLoading(true)

  try {
    // ---- Auth required? ----
    if (to.meta.requiresAuth) {
      const token = localStorage.getItem('mun_token')

      if (token && !authStore.isAuthenticated) {
        // Token exists but not validated yet — validate now
        await authStore.validateSession()
      }

      if (!authStore.isAuthenticated) {
        return next({ name: 'Login', query: { redirect: to.fullPath } })
      }

      // ---- SuperAdmin check ----
      if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
        return next({ name: 'NotFound' })
      }

      // ---- Org access check ----
      if (to.meta.requiresOrgAccess) {
        const orgSlug = to.params.orgSlug
        const hasAccess = authStore.isSuperAdmin ||
          authStore.allOrganizations.some(org => org.slug === orgSlug)

        if (!hasAccess) {
          return next({ name: 'NotFound' })
        }

        // Set active org from URL
        const org = authStore.allOrganizations.find(o => o.slug === orgSlug)
        if (org) {
          authStore.setActiveOrg(org._id)
        }
      }

      // ---- Presidium/Delegate checks (session views) ----
      if (to.meta.requiresPresidium || to.meta.requiresDelegate) {
        const committeeId = to.params.committeeId
        if (!committeeId) {
          return next({ name: 'DashboardHome' })
        }

        // Check eventParticipations for a matching committee + role
        const PRESIDIUM_ROLES = ['presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary']
        const participations = authStore.eventParticipations || []

        const match = participations.find(p => {
          const cId = p.committee?._id || p.committee
          return cId === committeeId
        })

        if (!match) {
          // SuperAdmin and org admins can access any committee
          const isSuperAdmin = authStore.isSuperAdmin
          if (!isSuperAdmin) {
            // Check if user is org admin for any org (they may have implicit access)
            const isOrgAdmin = authStore.allOrganizations?.some(org => org.accessLevel === 'admin')
            if (!isOrgAdmin) {
              return next({ name: 'DashboardHome' })
            }
          }
        } else {
          // Verify role matches route requirement
          if (to.meta.requiresPresidium && !PRESIDIUM_ROLES.includes(match.role)) {
            // User is participant but not presidium — redirect to delegate view
            return next({
              name: 'DelegateDashboard',
              params: { committeeId }
            })
          }
          if (to.meta.requiresDelegate && PRESIDIUM_ROLES.includes(match.role)) {
            // User is presidium trying to access delegate view — allow it
            // (presidium can also view delegate interfaces)
          }
        }
      }
    }

    // ---- Hide auth pages from authenticated users ----
    if (to.meta.hideForAuthenticated && authStore.isAuthenticated) {
      return next(authStore.getDefaultRoute())
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

export default router