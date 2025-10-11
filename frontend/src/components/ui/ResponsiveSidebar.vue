<template>
    <div>
        <!-- Desktop Sidebar -->
        <aside :class="[
            'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-mun-gray-200 transform transition-transform duration-200 ease-in-out',
            'lg:translate-x-0',
            collapsed ? '-translate-x-full' : 'translate-x-0'
        ]">
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div
                    class="flex items-center justify-between h-16 px-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue-600 to-mun-blue-700 flex-shrink-0">
                    <slot name="header">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <div
                                    class="w-10 h-10 bg-mun-blue backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <img src="/logo.svg" alt="" class="w-8 h-8 text-white">
                                </div>
                            </div>
                            <div class="text-white">
                                <h1 class="text-lg font-bold tracking-tight">{{ title }}</h1>
                                <p class="text-xs text-blue-100 opacity-90">{{ subtitle }}</p>
                            </div>
                        </div>
                    </slot>

                    <!-- Mobile close button -->
                    <button @click="$emit('toggle')"
                        class="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <XMarkIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- Scrollable Content Area -->
                <div class="flex-1 flex flex-col overflow-hidden">
                    <!-- Navigation -->
                    <nav
                        class="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <slot name="navigation" />
                    </nav>

                    <!-- Bottom sections that should always be visible -->
                    <div class="flex-shrink-0 border-t border-mun-gray-200">
                        <!-- System Status Section -->
                        <div v-if="$slots['system-status']" class="p-4 border-b border-mun-gray-200">
                            <slot name="system-status" />
                        </div>

                        <!-- User Profile Section -->
                        <div v-if="$slots['user-profile']" class="p-4">
                            <slot name="user-profile" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Mobile Overlay -->
        <transition enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
            leave-to-class="opacity-0">
            <div v-if="!collapsed" class="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden" @click="$emit('toggle')">
            </div>
        </transition>

        <!-- Main Content Wrapper -->
        <div :class="[
            'transition-all duration-200 ease-in-out',
            'lg:ml-72',
            collapsed ? 'ml-0' : 'ml-0'
        ]">
            <slot name="content" />
        </div>
    </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'

// Props
defineProps({
    collapsed: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'MUN System'
    },
    subtitle: {
        type: String,
        default: 'Control Panel'
    }
})

// Emits
defineEmits(['toggle'])
</script>

<style scoped>
/* Custom Scrollbar */
.scrollbar-thin {
    scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
    width: 6px;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 3px;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
}

.scrollbar-track-gray-100::-webkit-scrollbar-track {
    background-color: transparent;
}

/* Responsive breakpoints */
@media (max-height: 600px) {

    /* On short screens, make navigation more compact */
    nav {
        padding-top: 1rem;
        padding-bottom: 1rem;
    }
}

@media (max-height: 500px) {

    /* On very short screens, reduce spacing even more */
    nav {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }

    nav .space-y-6>*+* {
        margin-top: 1rem;
    }
}

/* Smooth transitions */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus management for accessibility */
@media (prefers-reduced-motion: reduce) {

    .transition-all,
    .transition-transform,
    .transition-opacity {
        transition: none;
    }
}
</style>