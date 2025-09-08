<template>
    <div class="mun-card p-6 hover-lift">
        <div class="flex items-center">
            <!-- Icon -->
            <div :class="[
                'p-3 rounded-xl',
                iconBgColor
            ]">
                <component :is="icon" :class="['w-6 h-6', iconColor]" />
            </div>

            <!-- Content -->
            <div class="ml-4 flex-1">
                <p class="text-sm font-medium text-mun-gray-600">{{ title }}</p>

                <!-- Value with loading state -->
                <div class="flex items-baseline space-x-2">
                    <p v-if="!loading" class="text-2xl font-bold text-mun-gray-900">
                        {{ formattedValue }}
                    </p>
                    <div v-else class="h-8 w-16 bg-mun-gray-200 rounded animate-pulse"></div>

                    <!-- Change indicator -->
                    <div v-if="change && !loading" :class="[
                        'flex items-center text-sm font-medium',
                        changeColor
                    ]">
                        <component :is="changeIcon" class="w-4 h-4 mr-1" />
                        {{ change }}
                    </div>
                </div>

                <!-- Additional info -->
                <p v-if="subtitle" class="text-xs text-mun-gray-500 mt-1">
                    {{ subtitle }}
                </p>
            </div>
        </div>

        <!-- Mini chart or progress bar (optional) -->
        <div v-if="showChart && chartData" class="mt-4">
            <div class="h-12 flex items-end space-x-1">
                <div v-for="(point, index) in chartData" :key="index"
                    :class="['bg-current opacity-60 w-2 rounded-t transition-all duration-300', `text-${color}-500`]"
                    :style="{ height: `${(point / Math.max(...chartData)) * 100}%` }"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import {
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    title: {
        type: String,
        required: true
    },

    value: {
        type: [Number, String],
        required: true
    },

    change: {
        type: String,
        default: null
    },

    trend: {
        type: String,
        default: 'neutral',
        validator: (value) => ['up', 'down', 'neutral'].includes(value)
    },

    icon: {
        type: Object,
        required: true
    },

    color: {
        type: String,
        default: 'blue',
        validator: (value) => ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'gray'].includes(value)
    },

    loading: {
        type: Boolean,
        default: false
    },

    subtitle: {
        type: String,
        default: null
    },

    showChart: {
        type: Boolean,
        default: false
    },

    chartData: {
        type: Array,
        default: () => []
    },

    formatType: {
        type: String,
        default: 'number',
        validator: (value) => ['number', 'currency', 'percentage', 'time'].includes(value)
    }
})

// Computed properties
const formattedValue = computed(() => {
    if (props.loading) return '...'

    const value = props.value

    switch (props.formatType) {
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(value)

        case 'percentage':
            return `${value}%`

        case 'time':
            return value

        case 'number':
        default:
            if (typeof value === 'number') {
                // Format large numbers with K, M, B suffixes
                if (value >= 1000000000) {
                    return (value / 1000000000).toFixed(1) + 'B'
                } else if (value >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M'
                } else if (value >= 1000) {
                    return (value / 1000).toFixed(1) + 'K'
                }
                return value.toLocaleString()
            }
            return value
    }
})

const iconBgColor = computed(() => {
    const colorMap = {
        blue: 'bg-un-blue-50',
        green: 'bg-mun-green-50',
        red: 'bg-mun-red-50',
        yellow: 'bg-mun-yellow-50',
        purple: 'bg-purple-50',
        orange: 'bg-orange-50',
        gray: 'bg-mun-gray-50'
    }
    return colorMap[props.color] || colorMap.blue
})

const iconColor = computed(() => {
    const colorMap = {
        blue: 'text-un-blue-600',
        green: 'text-mun-green-600',
        red: 'text-mun-red-600',
        yellow: 'text-mun-yellow-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        gray: 'text-mun-gray-600'
    }
    return colorMap[props.color] || colorMap.blue
})

const changeColor = computed(() => {
    switch (props.trend) {
        case 'up':
            return 'text-mun-green-600'
        case 'down':
            return 'text-mun-red-600'
        default:
            return 'text-mun-gray-500'
    }
})

const changeIcon = computed(() => {
    switch (props.trend) {
        case 'up':
            return ArrowUpIcon
        case 'down':
            return ArrowDownIcon
        default:
            return MinusIcon
    }
})
</script>

<style scoped>
.hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 158, 219, 0.15);
}

/* Loading animation */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Chart animation */
.chart-bar {
    animation: growUp 0.6s ease-out;
}

@keyframes growUp {
    from {
        height: 0;
    }

    to {
        height: var(--final-height);
    }
}
</style>