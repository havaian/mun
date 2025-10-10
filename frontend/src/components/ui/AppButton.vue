<template>
    <component :is="tag" :type="buttonType" :disabled="disabled || loading" :class="buttonClasses" v-bind="linkProps"
        @click="handleClick">
        <!-- Loading spinner -->
        <LoadingSpinner v-if="loading" :size="size === 'sm' ? 'sm' : 'md'" class="mr-2" />

        <!-- Icon (left) -->
        <component v-if="icon && !iconRight && !loading" :is="icon" :class="iconClasses" />

        <!-- Content -->
        <span v-if="$slots.default" :class="{ 'opacity-0': loading }">
            <slot />
        </span>

        <!-- Icon (right) -->
        <component v-if="icon && iconRight && !loading" :is="icon" :class="iconClasses" />
    </component>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
    // Variants
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'].includes(value)
    },

    // Sizes
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },

    // States
    disabled: {
        type: Boolean,
        default: false
    },

    loading: {
        type: Boolean,
        default: false
    },

    // Icon
    icon: {
        type: Object,
        default: null
    },

    iconRight: {
        type: Boolean,
        default: false
    },

    // Link behavior
    to: {
        type: [String, Object],
        default: null
    },

    href: {
        type: String,
        default: null
    },

    external: {
        type: Boolean,
        default: false
    },

    // Button behavior
    type: {
        type: String,
        default: 'button',
        validator: (value) => ['button', 'submit', 'reset'].includes(value)
    },

    // Styling
    rounded: {
        type: Boolean,
        default: true
    },

    fullWidth: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

// Computed properties
const tag = computed(() => {
    if (props.to) return 'router-link'
    if (props.href) return 'a'
    return 'button'
})

const buttonType = computed(() => {
    return tag.value === 'button' ? props.type : undefined
})

const linkProps = computed(() => {
    if (props.to) {
        return { to: props.to }
    }
    if (props.href) {
        return {
            href: props.href,
            target: props.external ? '_blank' : undefined,
            rel: props.external ? 'noopener noreferrer' : undefined
        }
    }
    return {}
})

const buttonClasses = computed(() => {
    const classes = [
        // Base classes
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Size classes
        {
            'px-2 py-1 text-xs': props.size === 'xs',
            'px-3 py-1.5 text-sm': props.size === 'sm',
            'px-4 py-2 text-sm': props.size === 'md',
            'px-6 py-3 text-base': props.size === 'lg',
            'px-8 py-4 text-lg': props.size === 'xl'
        },

        // Rounded classes
        {
            'rounded-md': props.rounded && props.size === 'xs',
            'rounded-lg': props.rounded && ['sm', 'md'].includes(props.size),
            'rounded-xl': props.rounded && ['lg', 'xl'].includes(props.size),
            'rounded-none': !props.rounded
        },

        // Width classes
        {
            'w-full': props.fullWidth
        },

        // Variant classes
        {
            // Primary
            'bg-mun-blue text-white hover:bg-mun-blue-600 focus:ring-mun-blue shadow-mun hover:shadow-mun-lg transform':
                props.variant === 'primary',

            // Secondary  
            'bg-white text-mun-blue border border-mun-blue/20 hover:bg-mun-blue-50 hover:border-mun-blue/40 focus:ring-mun-blue shadow-mun':
                props.variant === 'secondary',

            // Outline
            'border border-mun-gray-300 text-mun-gray-700 hover:bg-mun-gray-50 focus:ring-mun-gray-500':
                props.variant === 'outline',

            // Ghost
            'text-mun-gray-700 hover:bg-mun-gray-100 focus:ring-mun-gray-500':
                props.variant === 'ghost',

            // Danger
            'bg-mun-red text-white hover:bg-mun-red-600 focus:ring-mun-red shadow-mun hover:shadow-lg transform':
                props.variant === 'danger',

            // Success
            'bg-mun-green text-white hover:bg-mun-green-600 focus:ring-mun-green shadow-mun hover:shadow-lg transform':
                props.variant === 'success'
        },

        // Disabled state overrides
        {
            'transform-none hover:scale-100 hover:shadow-mun': props.disabled || props.loading
        }
    ]

    return classes
})

const iconClasses = computed(() => {
    const classes = [
        'flex-shrink-0',
        {
            'w-3 h-3': props.size === 'xs',
            'w-4 h-4': props.size === 'sm',
            'w-5 h-5': ['md', 'lg'].includes(props.size),
            'w-6 h-6': props.size === 'xl'
        }
    ]

    // Add margin classes based on icon position and slot content
    if (props.icon && !props.iconRight) {
        classes.push('mr-2')
    } else if (props.icon && props.iconRight) {
        classes.push('ml-2')
    }

    return classes
})

// Event handlers
const handleClick = (event) => {
    if (!props.disabled && !props.loading) {
        emit('click', event)
    }
}
</script>

<style scoped>
/* Custom focus styles for router-link and anchor tags */
a:focus-visible {
    @apply ring-2 ring-mun-blue ring-opacity-50 ring-offset-2;
}
</style>