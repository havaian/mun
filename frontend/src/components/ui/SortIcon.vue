<template>
    <span class="inline-flex flex-col items-center justify-center ml-1">
        <!-- Up Arrow -->
        <svg class="w-3 h-3 transition-colors duration-200" :class="getUpArrowClass()" fill="currentColor"
            viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clip-rule="evenodd" />
        </svg>

        <!-- Down Arrow -->
        <svg class="w-3 h-3 -mt-1 transition-colors duration-200" :class="getDownArrowClass()" fill="currentColor"
            viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd" />
        </svg>
    </span>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
    column: {
        type: String,
        required: true
    },
    currentSort: {
        type: String,
        default: ''
    },
    currentDirection: {
        type: String,
        default: 'asc',
        validator: (value) => ['asc', 'desc'].includes(value)
    }
})

// Computed properties for arrow styling
const isActiveColumn = computed(() => props.currentSort === props.column)

const getUpArrowClass = () => {
    if (!isActiveColumn.value) {
        return 'text-mun-gray-400 hover:text-mun-gray-600'
    }

    return props.currentDirection === 'asc'
        ? 'text-un-blue'
        : 'text-mun-gray-400'
}

const getDownArrowClass = () => {
    if (!isActiveColumn.value) {
        return 'text-mun-gray-400 hover:text-mun-gray-600'
    }

    return props.currentDirection === 'desc'
        ? 'text-un-blue'
        : 'text-mun-gray-400'
}
</script>

<style scoped>
/* Additional styling for smooth transitions */
svg {
    transition: color 0.2s ease-in-out;
}

/* Ensure proper spacing and alignment */
span {
    line-height: 1;
}
</style>