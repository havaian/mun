<template>
    <div :class="[
        'inline-flex items-center justify-center',
        sizeClasses
    ]">
        <!-- Spinner SVG -->
        <svg :class="[
            'animate-spin',
            spinnerSizeClasses,
            colorClasses
        ]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
        </svg>

        <!-- Loading text (optional) -->
        <span v-if="text" :class="[
            'ml-2 font-medium',
            textSizeClasses,
            colorClasses
        ]">
            {{ text }}
        </span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },

    color: {
        type: String,
        default: 'blue',
        validator: (value) => ['blue', 'white', 'gray', 'green', 'red', 'yellow'].includes(value)
    },

    text: {
        type: String,
        default: null
    }
})

// Computed classes
const sizeClasses = computed(() => {
    const sizeMap = {
        xs: 'w-4 h-4',
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-10 h-10'
    }
    return sizeMap[props.size]
})

const spinnerSizeClasses = computed(() => {
    const sizeMap = {
        xs: 'w-4 h-4',
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-10 h-10'
    }
    return sizeMap[props.size]
})

const textSizeClasses = computed(() => {
    const sizeMap = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
    }
    return sizeMap[props.size]
})

const colorClasses = computed(() => {
    const colorMap = {
        blue: 'text-un-blue',
        white: 'text-white',
        gray: 'text-mun-gray-600',
        green: 'text-mun-green',
        red: 'text-mun-red',
        yellow: 'text-mun-yellow'
    }
    return colorMap[props.color]
})
</script>

<style scoped>
/* Custom spin animation with smooth easing */
@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

/* Pulsing animation for text */
.loading-text {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}
</style>