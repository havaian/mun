<template>
    <div class="loading-spinner" :class="sizeClasses">
        <svg class="animate-spin" :class="spinnerClasses" fill="none" viewBox="0 0 24 24">
            <!-- Background circle -->
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
            <!-- Progress arc -->
            <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
        </svg>

        <!-- Optional label -->
        <span v-if="label" class="loading-label" :class="labelClasses">
            {{ label }}
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
    label: {
        type: String,
        default: null
    },
    centered: {
        type: Boolean,
        default: false
    }
})

// Computed classes
const sizeClasses = computed(() => ({
    'flex items-center justify-center': props.centered,
    'inline-flex items-center': !props.centered && props.label,
    'inline-block': !props.centered && !props.label
}))

const spinnerClasses = computed(() => {
    const sizeMap = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    }

    const colorMap = {
        blue: 'text-mun-blue',
        white: 'text-white',
        gray: 'text-mun-gray-500',
        green: 'text-mun-green-500',
        red: 'text-mun-red-500',
        yellow: 'text-mun-yellow-500'
    }

    return [
        sizeMap[props.size],
        colorMap[props.color]
    ]
})

const labelClasses = computed(() => {
    const labelSizeMap = {
        xs: 'text-xs ml-1',
        sm: 'text-xs ml-1.5',
        md: 'text-sm ml-2',
        lg: 'text-base ml-2.5',
        xl: 'text-lg ml-3'
    }

    const labelColorMap = {
        blue: 'text-mun-blue',
        white: 'text-white',
        gray: 'text-mun-gray-600',
        green: 'text-mun-green-600',
        red: 'text-mun-red-600',
        yellow: 'text-mun-yellow-600'
    }

    return [
        labelSizeMap[props.size],
        labelColorMap[props.color],
        'font-medium'
    ]
})
</script>

<style scoped>
/* Custom spin animation with easing */
@keyframes spin-smooth {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.animate-spin {
    animation: spin-smooth 1s linear infinite;
}

/* Loading pulse effect */
.loading-spinner {
    position: relative;
}

.loading-spinner::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: radial-gradient(circle, transparent 40%, currentColor 41%, currentColor 43%, transparent 44%);
    opacity: 0.1;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.1;
        transform: scale(1);
    }

    50% {
        opacity: 0.2;
        transform: scale(1.05);
    }
}

/* Hide pulse effect for white spinners */
.text-white::after {
    display: none;
}
</style>