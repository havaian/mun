<template>
    <div class="min-h-screen bg-gradient-mun">
        <!-- Simplified Sidebar -->
        <div :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-150',
            { '-translate-x-full': sidebarCollapsed }
        ]">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-sm">A</span>
                    </div>
                    <div>
                        <h2 class="font-bold">Admin</h2>
                        <p class="text-xs text-gray-500">Control Panel</p>
                    </div>
                </div>
                <button @click="toggleSidebar" class="p-2 hover:bg-gray-100 rounded lg:hidden">
                    ✕
                </button>
            </div>

            <!-- Navigation -->
            <nav class="p-4 space-y-2">
                <router-link v-for="item in navItems" :key="item.name" :to="item.to"
                    class="nav-link flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                    :class="{ 'bg-blue-100 text-blue-700': $route.name === item.name }">
                    <span class="mr-3">{{ item.icon }}</span>
                    {{ item.label }}
                </router-link>
            </nav>

            <!-- User info -->
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-sm">
                            {{ username?.[0]?.toUpperCase() || 'U' }}
                        </span>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium truncate">{{ username || 'Admin' }}</p>
                        <button @click="logout" class="text-xs text-gray-500 hover:text-red-600">
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div :class="[
            'transition-all duration-150',
            { 'lg:ml-64': !sidebarCollapsed, 'lg:ml-0': sidebarCollapsed }
        ]">
            <!-- Top Bar -->
            <header class="bg-white border-b px-6 py-3">
                <div class="flex items-center justify-between">
                    <button @click="toggleSidebar" class="p-2 hover:bg-gray-100 rounded lg:hidden">
                        ☰
                    </button>
                    <div class="flex items-center space-x-4">
                        <!-- Connection status -->
                        <div class="flex items-center space-x-2">
                            <div :class="['w-2 h-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500']"></div>
                            <span class="text-sm text-gray-600 hidden md:block">
                                {{ isOnline ? 'Online' : 'Offline' }}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <main>
                <router-view />
            </main>
        </div>

        <!-- Mobile overlay -->
        <div v-if="!sidebarCollapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            @click="toggleSidebar"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Minimal state
const sidebarCollapsed = ref(true)
const isOnline = ref(true)
const username = ref('')

// Simple nav items with emoji icons (no heavy icon components)
const navItems = [
    { name: 'AdminDashboard', label: 'Dashboard', to: '/admin', icon: '📊' },
    { name: 'AdminEvents', label: 'Events', to: '/admin/events', icon: '📅' },
    { name: 'AdminCommittees', label: 'Committees', to: '/admin/committees', icon: '👥' },
    { name: 'AdminUsers', label: 'Users', to: '/admin/users', icon: '👤' },
    { name: 'AdminReports', label: 'Reports', to: '/admin/reports', icon: '📈' }
]

// Simple methods
const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const logout = () => {
    localStorage.removeItem('mun_token')
    router.push('/auth/login')
}

// Initialize
onMounted(() => {
    // Get username from token or localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    username.value = user.username || 'Admin'

    // Check connection
    const checkConnection = () => {
        isOnline.value = navigator.onLine
    }

    checkConnection()
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)

    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 1024) {
        sidebarCollapsed.value = true
    }
})
</script>

<style scoped>
/* Remove all complex animations/transitions */
* {
    transition-duration: 0.15s !important;
}

.nav-link.router-link-active {
    background-color: #dbeafe;
    color: #1d4ed8;
}

/* Minimal responsive design */
@media (max-width: 1024px) {
    .lg\\:ml-64 {
        margin-left: 0;
    }

    .lg\\:hidden {
        display: none;
    }
}
</style>