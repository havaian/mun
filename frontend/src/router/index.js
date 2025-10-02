import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// Import layouts
const AuthLayout = () => import('@/views/auth/AuthLayout.vue')

// Import views
const LoginView = () => import('@/views/auth/LoginView.vue')
const QRLoginView = () => import('@/views/auth/QRLoginView.vue')
const EmailBindingView = () => import('@/views/auth/EmailBindingView.vue')
const LanguageSelectionView = () => import('@/views/auth/LanguageSelectionView.vue')

// Shared views
const NotFoundView = () => import('@/views/NotFoundView.vue')

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
            switch (authStore.user?.role) {}
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

export default router