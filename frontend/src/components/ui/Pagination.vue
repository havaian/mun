<template>
    <div v-if="totalPages > 1" class="pagination-container">
        <!-- Mobile Pagination (Simplified) -->
        <div class="flex items-center justify-between sm:hidden">
            <AppButton @click="goToPreviousPage" :disabled="currentPage <= 1" variant="outline" size="sm">
                <ChevronLeftIcon class="w-4 h-4 mr-1" />
                Previous
            </AppButton>

            <span class="text-sm text-mun-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
            </span>

            <AppButton @click="goToNextPage" :disabled="currentPage >= totalPages" variant="outline" size="sm">
                Next
                <ChevronRightIcon class="w-4 h-4 ml-1" />
            </AppButton>
        </div>

        <!-- Desktop Pagination (Full) -->
        <div class="hidden sm:flex sm:items-center sm:justify-between">
            <!-- Results Info -->
            <div class="text-sm text-mun-gray-700">
                Showing
                <span class="font-medium">{{ startItem }}</span>
                to
                <span class="font-medium">{{ endItem }}</span>
                of
                <span class="font-medium">{{ totalItems }}</span>
                {{ itemLabel }}
            </div>

            <!-- Pagination Controls -->
            <div class="flex items-center space-x-2">
                <!-- Items per page selector -->
                <div v-if="showPerPageSelector" class="flex items-center space-x-2 mr-4">
                    <label class="text-sm text-mun-gray-700">Show:</label>
                    <select :value="perPage" @change="changePerPage($event.target.value)"
                        class="px-3 py-1.5 text-sm border border-mun-gray-300 rounded-md focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                        <option v-for="option in perPageOptions" :key="option" :value="option">
                            {{ option }}
                        </option>
                    </select>
                </div>

                <!-- First page button -->
                <button v-if="showFirstLast && currentPage > 2" @click="goToPage(1)" class="pagination-button"
                    :class="getPaginationButtonClasses(false)" title="Go to first page">
                    <ChevronDoubleLeftIcon class="w-4 h-4" />
                </button>

                <!-- Previous page button -->
                <button @click="goToPreviousPage" :disabled="currentPage <= 1" class="pagination-button"
                    :class="getPaginationButtonClasses(false)" title="Go to previous page">
                    <ChevronLeftIcon class="w-4 h-4" />
                </button>

                <!-- Page number buttons -->
                <div class="flex items-center space-x-1">
                    <!-- Left ellipsis -->
                    <span v-if="showLeftEllipsis" class="pagination-ellipsis">
                        ...
                    </span>

                    <!-- Page numbers -->
                    <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" class="pagination-button"
                        :class="getPaginationButtonClasses(page === currentPage)" :title="`Go to page ${page}`">
                        {{ page }}
                    </button>

                    <!-- Right ellipsis -->
                    <span v-if="showRightEllipsis" class="pagination-ellipsis">
                        ...
                    </span>
                </div>

                <!-- Next page button -->
                <button @click="goToNextPage" :disabled="currentPage >= totalPages" class="pagination-button"
                    :class="getPaginationButtonClasses(false)" title="Go to next page">
                    <ChevronRightIcon class="w-4 h-4" />
                </button>

                <!-- Last page button -->
                <button v-if="showFirstLast && currentPage < totalPages - 1" @click="goToPage(totalPages)"
                    class="pagination-button" :class="getPaginationButtonClasses(false)" title="Go to last page">
                    <ChevronDoubleRightIcon class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Page Jump (Optional) -->
        <div v-if="showPageJump" class="flex items-center justify-center mt-4 space-x-3">
            <span class="text-sm text-mun-gray-700">Go to page:</span>
            <input v-model.number="jumpToPageInput" @keyup.enter="handlePageJump" type="number" :min="1"
                :max="totalPages"
                class="w-16 px-2 py-1 text-sm text-center border border-mun-gray-300 rounded-md focus:ring-2 focus:ring-mun-blue focus:border-mun-blue"
                placeholder="1" />
            <AppButton @click="handlePageJump" variant="outline" size="sm" :disabled="!isValidJumpPage">
                Go
            </AppButton>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    currentPage: {
        type: Number,
        required: true,
        default: 1
    },
    totalItems: {
        type: Number,
        required: true,
        default: 0
    },
    perPage: {
        type: Number,
        default: 10
    },
    maxVisiblePages: {
        type: Number,
        default: 7
    },
    showFirstLast: {
        type: Boolean,
        default: true
    },
    showPerPageSelector: {
        type: Boolean,
        default: true
    },
    showPageJump: {
        type: Boolean,
        default: false
    },
    perPageOptions: {
        type: Array,
        default: () => [10, 25, 50, 100]
    },
    itemLabel: {
        type: String,
        default: 'results'
    }
})

const emit = defineEmits(['page-change', 'per-page-change'])

// State
const jumpToPageInput = ref('')

// Computed properties
const totalPages = computed(() => {
    return Math.ceil(props.totalItems / props.perPage)
})

const startItem = computed(() => {
    return (props.currentPage - 1) * props.perPage + 1
})

const endItem = computed(() => {
    return Math.min(props.currentPage * props.perPage, props.totalItems)
})

const visiblePages = computed(() => {
    const total = totalPages.value
    const current = props.currentPage
    const max = props.maxVisiblePages

    if (total <= max) {
        // Show all pages if total is less than max
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const half = Math.floor(max / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(total, start + max - 1)

    // Adjust start if we're near the end
    if (end - start + 1 < max) {
        start = Math.max(1, end - max + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const showLeftEllipsis = computed(() => {
    const firstVisible = visiblePages.value[0]
    return firstVisible > 1
})

const showRightEllipsis = computed(() => {
    const lastVisible = visiblePages.value[visiblePages.value.length - 1]
    return lastVisible < totalPages.value
})

const isValidJumpPage = computed(() => {
    const page = parseInt(jumpToPageInput.value)
    return page >= 1 && page <= totalPages.value && page !== props.currentPage
})

// Methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
        emit('page-change', page)
    }
}

const goToPreviousPage = () => {
    if (props.currentPage > 1) {
        goToPage(props.currentPage - 1)
    }
}

const goToNextPage = () => {
    if (props.currentPage < totalPages.value) {
        goToPage(props.currentPage + 1)
    }
}

const changePerPage = (newPerPage) => {
    const perPageNum = parseInt(newPerPage)
    if (perPageNum !== props.perPage) {
        emit('per-page-change', perPageNum)
    }
}

const handlePageJump = () => {
    const page = parseInt(jumpToPageInput.value)
    if (isValidJumpPage.value) {
        goToPage(page)
        jumpToPageInput.value = ''
    }
}

const getPaginationButtonClasses = (isActive) => {
    const baseClasses = [
        'relative inline-flex items-center justify-center',
        'px-3 py-2 text-sm font-medium',
        'border border-mun-gray-300 rounded-md',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-mun-blue focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed'
    ]

    if (isActive) {
        baseClasses.push(
            'bg-mun-blue text-white border-mun-blue',
            'hover:bg-mun-blue-dark'
        )
    } else {
        baseClasses.push(
            'bg-white text-mun-gray-700 border-mun-gray-300',
            'hover:bg-mun-gray-50 hover:text-mun-gray-900',
            'disabled:hover:bg-white disabled:hover:text-mun-gray-700'
        )
    }

    return baseClasses
}

// Watch for current page changes to clear jump input
watch(() => props.currentPage, () => {
    jumpToPageInput.value = ''
})
</script>

<style scoped>
.pagination-container {
    @apply flex flex-col space-y-4;
}

.pagination-button {
    min-width: 2.5rem;
    height: 2.5rem;
}

.pagination-ellipsis {
    @apply inline-flex items-center justify-center px-3 py-2 text-sm text-mun-gray-500;
    min-width: 2.5rem;
    height: 2.5rem;
}

/* Ensure consistent button sizing */
.pagination-button svg {
    @apply flex-shrink-0;
}

/* Focus styles for accessibility */
.pagination-button:focus {
    @apply ring-2 ring-mun-blue ring-offset-2;
}

.pagination-button:disabled {
    @apply cursor-not-allowed;
}

/* Custom number input styling */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .pagination-button {
        min-width: 2rem;
        height: 2rem;
        padding: 0.375rem;
    }

    .pagination-ellipsis {
        min-width: 2rem;
        height: 2rem;
        padding: 0.375rem;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .pagination-button {
        @apply border-2;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .pagination-button {
        @apply transition-none;
    }

    .pagination-button:not(:disabled):hover {
        @apply transform-none;
    }
}
</style>