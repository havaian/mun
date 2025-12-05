<template>
    <aside :class="[
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-mun-gray-200 transform transition-all duration-300 ease-in-out flex flex-col group',
        // Width: full on mobile, responsive on desktop
        'w-72',
        sidebarCollapsed ? 'lg:w-16 lg:hover:w-24' : 'lg:w-72',
        // Position: slide on mobile, always visible on desktop
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
    ]">
        <!-- Brand Header -->
        <div :class="[
            'flex items-center h-16 px-6 border-b border-mun-gray-200 flex-shrink-0',
            `bg-gradient-to-r ${roleConfig.headerGradient}`,
            sidebarCollapsed ? 'lg:px-2 lg:justify-between lg:group-hover:justify-between' : 'justify-between'
        ]">
            <!-- Logo and Title Container -->
            <div :class="[
                'flex items-center',
                sidebarCollapsed ? 'lg:justify-center lg:group-hover:justify-start lg:group-hover:space-x-2' : 'space-x-3'
            ]">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-mun-blue backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <img src="/logo.svg" alt="" class="w-8 h-8 text-white">
                    </div>
                </div>
                <div :class="[
                    'text-white transition-opacity duration-300',
                    sidebarCollapsed ? 'lg:hidden' : ''
                ]">
                    <h1 class="text-lg font-bold tracking-tight">{{ roleConfig.title }}</h1>
                    <p class="text-xs opacity-90" :class="roleConfig.subtitleColor">{{ roleConfig.subtitle }}</p>
                </div>
            </div>

            <!-- Mobile close button -->
            <button @click="$emit('toggle-sidebar')" :class="[
                'p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors',
                sidebarCollapsed ? 'lg:hidden' : 'lg:hidden'
            ]">
                <XMarkIcon class="w-5 h-5" />
            </button>

            <!-- Desktop toggle button -->
            <button @click="$emit('toggle-sidebar')" :class="[
                'p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300',
                sidebarCollapsed ? 'hidden lg:block lg:opacity-0 lg:group-hover:opacity-100' : 'hidden lg:block'
            ]" :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
                <ArrowLeftEndOnRectangleIcon v-if="!sidebarCollapsed" class="w-5 h-5" />
                <ArrowRightStartOnRectangleIcon v-else class="w-5 h-5" />
            </button>
        </div>

        <!-- Scrollable Content Container -->
        <div class="flex-1 overflow-y-auto min-h-0">
            <!-- Navigation -->
            <nav :class="sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'" class="space-y-6">
                <!-- Primary Navigation -->
                <div class="space-y-2">
                    <router-link v-for="item in primaryNavigation" :key="item.name" :to="item.to"
                        :class="getNavLinkClass(item.name, sidebarCollapsed)"
                        :title="sidebarCollapsed ? item.label : ''">
                        <component :is="item.icon" :class="sidebarCollapsed ? 'w-6 h-6 lg:w-6 lg:h-6' : 'w-5 h-5'" />
                        <span v-if="!sidebarCollapsed">{{ item.label }}</span>
                        <div v-if="item.badge && !sidebarCollapsed" class="ml-auto">
                            <span :class="[
                                'inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full',
                                getBadgeClass(item.badgeType || 'default')
                            ]">
                                {{ item.badge > 99 ? '99+' : item.badge }}
                            </span>
                        </div>
                        <!-- Collapsed badge indicator (desktop only) -->
                        <div v-if="item.badge && sidebarCollapsed" :class="[
                            'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                            getBadgeClass(item.badgeType || 'default')
                        ]"></div>
                    </router-link>
                </div>

                <!-- Navigation Sections -->
                <div v-if="!sidebarCollapsed" v-for="section in navigationSections" :key="section.title"
                    class="space-y-2">
                    <h3 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        {{ section.title }}
                    </h3>

                    <router-link v-for="item in section.items" :key="item.name" :to="item.to"
                        :class="getNavLinkClass(item.name)">
                        <component :is="item.icon" class="w-5 h-5" />
                        <span>{{ item.label }}</span>
                        <div v-if="item.badge" class="ml-auto">
                            <span :class="[
                                'text-xs px-2 py-1 rounded-full',
                                getBadgeClass(item.badgeType || 'info')
                            ]">
                                {{ item.badge }}
                            </span>
                        </div>
                    </router-link>
                </div>

                <!-- Collapsed Navigation Sections (Icons only) -->
                <div v-if="sidebarCollapsed" class="space-y-2">
                    <template v-for="section in navigationSections" :key="section.title">
                        <router-link v-for="item in section.items" :key="item.name" :to="item.to"
                            :class="getNavLinkClass(item.name, sidebarCollapsed)" :title="item.label">
                            <component :is="item.icon" class="w-6 h-6" />
                            <div v-if="item.badge" :class="[
                                'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                                getBadgeClass(item.badgeType || 'info')
                            ]"></div>
                        </router-link>
                    </template>
                </div>

                <!-- Quick Actions (Role-specific) -->
                <div v-if="quickActions && quickActions.length > 0 && !sidebarCollapsed"
                    class="pt-4 border-t border-mun-gray-100">
                    <h4 class="px-3 text-xs font-semibold text-mun-gray-500 uppercase tracking-wider mb-3">
                        Quick Actions
                    </h4>
                    <div class="space-y-2">
                        <button v-for="action in quickActions" :key="action.name"
                            @click="$emit('quick-action', action.name)" :disabled="action.disabled" :class="[
                                'w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50',
                                getActionButtonClass(action.type || 'primary')
                            ]">
                            <component :is="action.icon" class="w-4 h-4 mr-2" />
                            {{ action.label }}
                            <span v-if="action.badge" :class="[
                                'ml-2 px-2 py-1 text-xs font-medium rounded-full',
                                action.type === 'danger' ? 'bg-white text-red-600' : 'bg-white/20 text-white'
                            ]">
                                {{ action.badge }}
                            </span>
                        </button>
                    </div>
                </div>
            </nav>

            <!-- System Status (Admin only) -->
            <div v-if="showSystemStatus && !sidebarCollapsed" class="border-t border-mun-gray-200 p-4">
                <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        System Status
                    </h4>
                    <div class="space-y-2">
                        <div class="grid text-xs text-mun-gray-500">
                            <div class="flex items-center justify-between">
                                <span>API:</span>
                                <div :class="[
                                    'w-2 h-2 rounded-full',
                                    systemStatus.api ? 'bg-green-500' : 'bg-red-500'
                                ]"></div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>DB:</span>
                                <div :class="[
                                    'w-2 h-2 rounded-full',
                                    systemStatus.database ? 'bg-green-500' : 'bg-red-500'
                                ]"></div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>Response Time:</span>
                                <span>{{ performanceMetrics.responseTime }}ms</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>Active Connections:</span>
                                <span>{{ performanceMetrics.activeConnections }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Current Status (Role-specific info) -->
            <div v-if="currentStatus && !sidebarCollapsed" class="border-t border-mun-gray-100 p-4">
                <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wider">
                        {{ currentStatus.title }}
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div v-for="item in currentStatus.items" :key="item.label"
                            class="flex items-center justify-between">
                            <span class="text-mun-gray-600">{{ item.label }}:</span>
                            <div class="flex items-center space-x-2">
                                <div v-if="item.indicator" :class="[
                                    'w-2 h-2 rounded-full',
                                    item.indicator === 'active' ? 'bg-green-500' :
                                        item.indicator === 'warning' ? 'bg-yellow-500' : 'bg-gray-400'
                                ]"></div>
                                <span :class="[
                                    'text-xs font-medium',
                                    item.indicator === 'active' ? 'text-green-600' :
                                        item.indicator === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                                ]">{{ item.value }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Status Details -->
                    <div v-if="currentStatus.details" class="text-xs text-mun-gray-500 space-y-1">
                        <div v-for="detail in currentStatus.details" :key="detail.key">
                            {{ detail.label }}: <span class="font-medium">{{ detail.value }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Profile -->
            <div class="border-t border-mun-gray-200 px-2 py-4">
                <div class="space-y-3">
                    <!-- User Info -->
                    <div :class="sidebarCollapsed ? 'flex justify-center' : 'flex items-center space-x-3'">
                        <div :class="[
                            'flex items-center justify-center rounded-xl',
                            roleConfig.userIconBackground,
                            sidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'
                        ]" :title="sidebarCollapsed ? userDisplayName : ''">
                            <UserIcon :class="sidebarCollapsed ? 'w-6 h-6 text-white' : 'w-5 h-5 text-white'" />
                        </div>
                        <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-mun-gray-900 truncate">
                                {{ userDisplayName }}
                            </p>
                            <p class="text-xs text-mun-gray-500 truncate">
                                {{ userSubtitle }}
                            </p>
                        </div>
                    </div>

                    <!-- User Actions -->
                    <div v-if="!sidebarCollapsed" class="space-y-1">
                        <router-link v-for="action in userActions" :key="action.name" :to="action.to"
                            class="flex items-center px-3 py-2 text-sm text-mun-gray-700 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <component :is="action.icon" class="w-4 h-4 mr-3" />
                            {{ action.label }}
                        </router-link>

                        <button @click="$emit('logout')"
                            class="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                            <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
                            Sign Out
                        </button>
                    </div>

                    <!-- Collapsed User Actions -->
                    <div v-if="sidebarCollapsed" class="flex justify-center">
                        <button @click="$emit('logout')"
                            class="mt-2 text-red-700 hover:bg-red-50 rounded-xl transition-colors w-10 h-10" title="Sign Out">
                            <ArrowRightOnRectangleIcon class="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Icons
import {
    XMarkIcon,
    UserIcon,
    ArrowRightOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowLeftEndOnRectangleIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    sidebarCollapsed: {
        type: Boolean,
        default: false
    },
    userRole: {
        type: String,
        required: true,
        validator: (value) => ['admin', 'presidium', 'delegate'].includes(value)
    },
    user: {
        type: Object,
        default: () => ({})
    },
    primaryNavigation: {
        type: Array,
        default: () => []
    },
    navigationSections: {
        type: Array,
        default: () => []
    },
    quickActions: {
        type: Array,
        default: () => []
    },
    currentStatus: {
        type: Object,
        default: null
    },
    systemStatus: {
        type: Object,
        default: () => ({ api: true, database: true })
    },
    performanceMetrics: {
        type: Object,
        default: () => ({ responseTime: 0, activeConnections: 0 })
    },
    userActions: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['toggle-sidebar', 'quick-action', 'logout'])

const route = useRoute()

// Role-specific configurations
const roleConfigs = {
    admin: {
        title: 'Admin Center',
        subtitle: 'System Control',
        headerGradient: 'from-mun-blue-600 to-mun-blue-700',
        logoBackground: 'bg-mun-blue',
        logoIcon: 'CogIcon',
        subtitleColor: 'text-blue-100',
        userIconBackground: 'bg-mun-blue'
    },
    presidium: {
        title: 'Presidium',
        subtitle: 'Committee Control',
        headerGradient: 'from-mun-blue-600 to-mun-blue-700',
        logoBackground: 'bg-mun-blue',
        logoIcon: 'UserGroupIcon',
        subtitleColor: 'text-blue-100',
        userIconBackground: 'bg-mun-blue'
    },
    delegate: {
        title: 'Delegate Portal',
        subtitle: 'Committee Participation',
        headerGradient: 'from-mun-blue-600 to-mun-blue-700',
        logoBackground: 'bg-mun-blue',
        logoIcon: 'HandRaisedIcon',
        subtitleColor: 'text-blue-100',
        userIconBackground: 'bg-mun-blue'
    }
}

// Computed
const roleConfig = computed(() => roleConfigs[props.userRole] || roleConfigs.admin)

const showSystemStatus = computed(() => props.userRole === 'admin')

const userDisplayName = computed(() => {
    return props.user?.fullName ||
        props.user?.username ||
        (props.userRole === 'admin' ? 'Admin User' :
            props.userRole === 'presidium' ? 'Presidium Member' : 'Delegate')
})

const userSubtitle = computed(() => {
    if (props.userRole === 'delegate') {
        return props.user?.countryName || 'Country'
    } else if (props.userRole === 'presidium') {
        return props.user?.presidiumRole || 'Member'
    } else {
        return props.user?.email || 'admin@mun.uz'
    }
})

// Methods
const getNavLinkClass = (routeName, collapsed = false) => {
    if (collapsed) {
        const baseClasses = 'relative group flex items-center justify-center p-3 text-sm font-medium rounded-xl transition-colors'
        return route.name === routeName
            ? `${baseClasses} bg-mun-blue-600 text-white shadow-lg`
            : `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-blue-600`
    }

    const baseClasses = 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors space-x-3'
    return route.name === routeName
        ? `${baseClasses} bg-mun-blue-600 text-white shadow-lg`
        : `${baseClasses} text-mun-gray-700 hover:bg-mun-gray-100 hover:text-mun-blue-600`
}

const getBadgeClass = (type) => {
    const badgeClasses = {
        default: 'bg-red-500',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        danger: 'bg-red-100 text-red-800',
        live: 'bg-red-500'
    }
    return badgeClasses[type] || badgeClasses.default
}

const getActionButtonClass = (type) => {
    const buttonClasses = {
        primary: 'text-mun-blue-700 bg-mun-blue-100 hover:bg-mun-blue-200',
        success: 'text-white bg-green-600 hover:bg-green-700',
        warning: 'text-white bg-orange-600 hover:bg-orange-700',
        danger: 'text-white bg-red-600 hover:bg-red-700 animate-pulse',
        secondary: 'text-mun-purple-700 bg-mun-purple-100 hover:bg-mun-purple-200',
        info: 'text-mun-green-700 bg-mun-green-100 hover:bg-mun-green-200'
    }
    return buttonClasses[type] || buttonClasses.primary
}
</script>

<style scoped>
/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}
</style>