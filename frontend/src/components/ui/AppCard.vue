<template>
    <div :class="[
        'mun-card',
        {
            'hover-lift': hoverable,
            'cursor-pointer': clickable,
            'ring-2 ring-un-blue ring-opacity-50': selected
        },
        customClass
    ]" @click="handleClick">
        <!-- Card Header -->
        <div v-if="title || $slots.header || $slots['header-action']" class="px-6 py-4 border-b border-mun-gray-100">
            <div class="flex items-center justify-between">
                <!-- Title Section -->
                <div v-if="title || $slots.header" class="flex items-center space-x-3">
                    <!-- Icon -->
                    <div v-if="icon" :class="['p-2 rounded-lg', iconBgClass]">
                        <component :is="icon" :class="['w-5 h-5', iconColorClass]" />
                    </div>

                    <!-- Title and Subtitle -->
                    <div>
                        <h3 v-if="title" class="text-lg font-semibold text-mun-gray-900">
                            {{ title }}
                        </h3>
                        <slot name="header" />
                        <p v-if="subtitle" class="text-sm text-mun-gray-500 mt-1">
                            {{ subtitle }}
                        </p>
                    </div>
                </div>

                <!-- Header Actions -->
                <div v-if="$slots['header-action']" class="flex items-center space-x-2">
                    <slot name="header-action" />
                </div>
            </div>
        </div>

        <!-- Card Body -->
        <div :class="[
            'px-6 py-4',
            {
                'pt-6': !title && !$slots.header,
                'pb-6': !$slots.footer
            }
        ]">
            <!-- Loading State -->
            <div v-if="loading" class="space-y-4">
                <div v-for="i in loadingRows" :key="i" class="loading-shimmer h-4 rounded"></div>
            </div>

            <!-- Content -->
            <div v-else>
                <slot />
            </div>
        </div>

        <!-- Card Footer -->
        <div v-if="$slots.footer" class="px-6 py-4 bg-mun-gray-50/50 border-t border-mun-gray-100 rounded-b-2xl">
            <slot name="footer" />
        </div>

        <!-- Loading Overlay -->
        <transition name="fade">
            <div v-if="processing"
                class="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div class="text-center">
                    <LoadingSpinner size="lg" />
                    <p class="mt-3 text-sm text-mun-gray-600">{{ processingMessage }}</p>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
    title: {
        type: String,
        default: null
    },

    subtitle: {
        type: String,
        default: null
    },

    icon: {
        type: Object,
        default: null
    },

    iconColor: {
        type: String,
        default: 'blue',
        validator: (value) => ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'gray'].includes(value)
    },

    hoverable: {
        type: Boolean,
        default: false
    },

    clickable: {
        type: Boolean,
        default: false
    },

    selected: {
        type: Boolean,
        default: false
    },

    loading: {
        type: Boolean,
        default: false
    },

    loadingRows: {
        type: Number,
        default: 3
    },

    processing: {
        type: Boolean,
        default: false
    },

    processingMessage: {
        type: String,
        default: 'Processing...'
    },

    customClass: {
        type: [String, Array, Object],
        default: ''
    }
})

const emit = defineEmits(['click'])

// Computed properties
const iconBgClass = computed(() => {
    const colorMap = {
        blue: 'bg-un-blue-50',
        green: 'bg-mun-green-50',
        red: 'bg-mun-red-50',
        yellow: 'bg-mun-yellow-50',
        purple: 'bg-purple-50',
        orange: 'bg-orange-50',
        gray: 'bg-mun-gray-50'
    }
    return colorMap[props.iconColor] || colorMap.blue
})

const iconColorClass = computed(() => {
    const colorMap = {
        blue: 'text-un-blue-600',
        green: 'text-mun-green-600',
        red: 'text-mun-red-600',
        yellow: 'text-mun-yellow-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        gray: 'text-mun-gray-600'
    }
    return colorMap[props.iconColor] || colorMap.blue
})

// Methods
const handleClick = (event) => {
    if (props.clickable) {
        emit('click', event)
    }
}
</script>

<style scoped>
/* Hover effects */
.hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 158, 219, 0.12);
}

/* Selected state */
.ring-2 {
    box-shadow: 0 0 0 2px rgba(0, 158, 219, 0.5);
}

/* Loading shimmer animation */
.loading-shimmer {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Card entrance animation */
.mun-card {
    animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>