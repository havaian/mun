<template>
    <div class="flex flex-col ml-1">
        <!-- Up arrow -->
        <ChevronUpIcon :class="[
            'w-3 h-3 transition-colors',
            isActive && currentDirection === 'asc'
                ? 'text-un-blue'
                : 'text-mun-gray-400 group-hover:text-mun-gray-600'
        ]" />
        <!-- Down arrow -->
        <ChevronDownIcon :class="[
            'w-3 h-3 -mt-1 transition-colors',
            isActive && currentDirection === 'desc'
                ? 'text-un-blue'
                : 'text-mun-gray-400 group-hover:text-mun-gray-600'
        ]" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

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

// Computed
const isActive = computed(() => {
    return props.currentSort === props.column
})
</script>

<style scoped>
/* Additional hover effects for the parent button */
.group:hover .text-mun-gray-400 {
    @apply text-mun-gray-600;
}
</style>