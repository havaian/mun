import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import layouts
import AuthLayout from '@/views/auth/AuthLayout.vue'


// Import views
import LoginView from '@/views/auth/LoginView.vue'
import QRLoginView from '@/views/auth/QRLoginView.vue'
import EmailBindingView from '@/views/auth/EmailBindingView.vue'
import LanguageSelectionView from '@/views/auth/LanguageSelectionView.vue'

import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminEvents from '@/views/admin/Events.vue'
import AdminUsers from '@/views/admin/Users.vue'
import PresidiumDashboard from '@/views/presidium/Dashboard.vue'
import DelegateHome from '@/views/delegate/Home.vue'

// Router configuration
const routes = [
  // Authentication routes
  {
    path: '/auth',
    component: AuthLayout,
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
        path: 'qr-login',
        name: 'QRLogin',
        component: QRLoginView,
        meta: {
          title: 'QR Login',
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

  // Root redirect
  {
    path: '/',
    redirect: (to) => {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        return { name: 'Login' }
      }

      // Redirect based on user role
      switch (authStore.user?.role) { }
    }
  },

  {
    path: '/admin',
    name: 'admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/events',
    name: 'admin-events',
    component: AdminEvents,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsers,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/presidium',
    name: 'presidium-dashboard',
    component: PresidiumDashboard,
    meta: { requiresAuth: true, role: 'presidium' }
  },
  {
    path: '/delegate',
    name: 'delegate-home',
    component: DelegateHome,
    meta: { requiresAuth: true, role: 'delegate' }
  },

  // 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { title: 'Page Not Found' }
  },
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

  // Check if user is authenticated
  if (!authStore.isAuthenticated && !authStore.isLoading) {
    await authStore.checkAuth()
  }

  // Handle guest-only routes
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next(authStore.getDefaultRoute())
  }

  // Handle protected routes
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next('/')
    }

    // Check role permissions
    if (to.meta.role && !authStore.hasRole(to.meta.role)) {
      return next(authStore.getDefaultRoute())
    }
  }

  next()
})

export default router