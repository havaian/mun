<template>
    <div :class="['relative', containerClass]" ref="selectContainer">
        <!-- Hidden Input for form submission -->
        <input v-if="inputName" :name="inputName" :value="inputValue" type="hidden" />

        <!-- Select Trigger -->
        <button ref="trigger" type="button" @click="toggleDropdown" @blur="handleBlur" @keydown="handleKeyDown" :class="[
            'sleek-select__trigger relative w-full px-4 py-3 text-left border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-mun-blue-200 focus:border-mun-blue-400 transition-all duration-200 ease-in-out',
            size === 'sm' ? 'py-2 text-sm' : size === 'lg' ? 'py-4 text-lg' : 'py-3',
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300',
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : '',
            variant === 'outlined' ? 'border-gray-300' : '',
            triggerClass
        ]" :disabled="disabled">

            <!-- Selected Value Display -->
            <span :class="[
                'block truncate flex items-center',
                selectedOption || (multiple && selectedOptions.length > 0) ? 'text-gray-900' : 'text-gray-500'
            ]">
                <!-- Multiple Selection Tags -->
                <template v-if="multiple && selectedOptions.length > 0">
                    <div class="flex flex-wrap gap-1 mr-2">
                        <span v-for="option in selectedOptions.slice(0, maxVisibleTags)" :key="option.value"
                            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-mun-blue-100 text-mun-blue-800">
                            <component v-if="option.icon" :is="option.icon" class="w-3 h-3 mr-1 flex-shrink-0" />
                            {{ option.label }}
                        </span>
                        <span v-if="selectedOptions.length > maxVisibleTags"
                            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                            +{{ selectedOptions.length - maxVisibleTags }} more
                        </span>
                    </div>
                </template>

                <!-- Single Selection Display -->
                <template v-else>
                    <component v-if="selectedOption?.icon" :is="selectedOption.icon"
                        class="w-4 h-4 mr-2 flex-shrink-0" />
                    {{ selectedOption ? selectedOption.label : placeholder }}
                </template>
            </span>

            <!-- Dropdown chevron with rotation animation -->
            <ChevronDownIcon :class="[
                'w-4 h-4 transition-transform duration-200 ease-in-out flex-shrink-0 ml-2',
                isOpen ? 'transform rotate-180 text-mun-blue-600' : 'text-gray-400'
            ]" />
        </button>

        <!-- Dropdown -->
        <Transition name="dropdown" appear>
            <div v-if="isOpen" ref="dropdown" :class="[
                'sleek-select__dropdown absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl',
                dropdownClass
            ]">
                <!-- Search Input -->
                <div v-if="searchable" class="p-3 border-b border-gray-100 bg-white">
                    <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search options..."
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue-200 focus:border-mun-blue-400" />
                </div>

                <!-- Options List -->
                <div class="max-h-60 overflow-y-auto bg-white">
                    <!-- Select All Option (for multiple) -->
                    <div v-if="multiple && showSelectAll && filteredOptions.length > 1" @click="toggleSelectAll"
                        class="sleek-select__option flex items-center px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100 bg-white">
                        <input type="checkbox" :checked="isAllSelected" :indeterminate="isPartiallySelected"
                            class="input-field mr-3 w-4 h-4" readonly />
                        <span class="font-medium">{{ isAllSelected ? 'Deselect All' : 'Select All' }}</span>
                    </div>

                    <!-- Option Items -->
                    <div v-for="(option, index) in filteredOptions" :key="option.value" @click="selectOption(option)"
                        :class="[
                            'sleek-select__option flex items-center px-4 py-3 text-sm cursor-pointer transition-colors duration-150 bg-white',
                            multiple ?
                                (isSelected(option) ? 'bg-mun-blue-50 text-mun-blue-700' : 'hover:bg-gray-50') :
                                (isSelected(option) ? 'bg-mun-blue-50 text-mun-blue-700 font-medium' :
                                    highlightedIndex === index ?
                                        'bg-gray-100' : 'hover:bg-gray-50')
                        ]">

                        <!-- Checkbox for multiple selection -->
                        <input v-if="multiple" type="checkbox" :checked="isSelected(option)"
                            class="input-field mr-3 w-4 h-4" readonly />

                        <!-- Option Icon -->
                        <component v-if="option.icon" :is="option.icon" class="w-4 h-4 mr-3 flex-shrink-0" />

                        <!-- Option Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Main Label -->
                            <div :class="[
                                'flex items-center',
                                option.description ? 'font-medium' : ''
                            ]">
                                <span class="truncate">{{ option.label }}</span>

                                <!-- Badge if provided -->
                                <span v-if="option.badge" :class="[
                                    'ml-2 px-2 py-1 text-xs rounded-full',
                                    option.badgeClass || 'bg-gray-100 text-gray-700'
                                ]">
                                    {{ option.badge }}
                                </span>
                            </div>

                            <!-- Optional Description -->
                            <div v-if="option.description" class="text-xs text-gray-500 mt-1">
                                {{ option.description }}
                            </div>
                        </div>

                        <!-- Check icon for single selection -->
                        <CheckIcon v-if="!multiple && isSelected(option)" class="w-4 h-4 text-mun-blue-600 ml-2" />
                    </div>

                    <!-- No options message -->
                    <div v-if="filteredOptions.length === 0" class="px-4 py-3 text-sm text-gray-500 bg-white">
                        {{ searchQuery ? 'No options match your search' : 'No options available' }}
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Error Message -->
        <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>

        <!-- Help Text -->
        <p v-if="helpText" class="mt-1 text-sm text-gray-500">{{ helpText }}</p>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: [String, Number, Array, Object],
        default: null
    },
    options: {
        type: Array,
        required: true
    },
    placeholder: {
        type: String,
        default: 'Select an option'
    },
    multiple: {
        type: Boolean,
        default: false
    },
    searchable: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    clearable: {
        type: Boolean,
        default: false
    },
    size: {
        type: String,
        default: 'md', // sm, md, lg
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    variant: {
        type: String,
        default: 'default', // default, outlined
        validator: (value) => ['default', 'outlined'].includes(value)
    },
    maxVisibleTags: {
        type: Number,
        default: 3
    },
    showSelectAll: {
        type: Boolean,
        default: true
    },
    containerClass: {
        type: String,
        default: ''
    },
    triggerClass: {
        type: String,
        default: ''
    },
    dropdownClass: {
        type: String,
        default: ''
    },
    inputName: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
    },
    helpText: {
        type: String,
        default: ''
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'search', 'open', 'close'])

// Refs
const selectContainer = ref(null)
const trigger = ref(null)
const dropdown = ref(null)
const searchInput = ref(null)

// State
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)

// Computed
const selectedOptions = computed(() => {
    if (!props.multiple) return []

    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    return props.options.filter(option => values.includes(option.value))
})

const selectedOption = computed(() => {
    if (props.multiple) return null
    return props.options.find(option => option.value === props.modelValue) || null
})

const filteredOptions = computed(() => {
    if (!props.searchable || !searchQuery.value) return props.options

    const query = searchQuery.value.toLowerCase()
    return props.options.filter(option =>
        option.label.toLowerCase().includes(query) ||
        (option.description && option.description.toLowerCase().includes(query))
    )
})

const inputValue = computed(() => {
    if (props.multiple) {
        return Array.isArray(props.modelValue) ? props.modelValue.join(',') : ''
    }
    return props.modelValue || ''
})

const isAllSelected = computed(() => {
    if (!props.multiple || filteredOptions.value.length === 0) return false

    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    return filteredOptions.value.every(option => values.includes(option.value))
})

const isPartiallySelected = computed(() => {
    if (!props.multiple || filteredOptions.value.length === 0) return false

    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    const selectedCount = filteredOptions.value.filter(option => values.includes(option.value)).length

    return selectedCount > 0 && selectedCount < filteredOptions.value.length
})

// Methods
const toggleDropdown = () => {
    if (props.disabled) return

    isOpen.value = !isOpen.value

    if (isOpen.value) {
        emit('open')
        nextTick(() => {
            if (props.searchable && searchInput.value) {
                searchInput.value.focus()
            }
        })
    } else {
        emit('close')
        searchQuery.value = ''
        highlightedIndex.value = -1
    }
}

const closeDropdown = () => {
    isOpen.value = false
    emit('close')
    searchQuery.value = ''
    highlightedIndex.value = -1
}

const selectOption = (option) => {
    if (props.multiple) {
        const values = Array.isArray(props.modelValue) ? [...props.modelValue] : []
        const index = values.indexOf(option.value)

        if (index > -1) {
            values.splice(index, 1)
        } else {
            values.push(option.value)
        }

        emit('update:modelValue', values)
        emit('change', values)
    } else {
        emit('update:modelValue', option.value)
        emit('change', option.value)
        closeDropdown()
    }
}

const toggleSelectAll = () => {
    if (!props.multiple) return

    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    const filteredValues = filteredOptions.value.map(option => option.value)

    if (isAllSelected.value) {
        // Deselect all filtered options
        const newValues = values.filter(value => !filteredValues.includes(value))
        emit('update:modelValue', newValues)
        emit('change', newValues)
    } else {
        // Select all filtered options
        const newValues = [...new Set([...values, ...filteredValues])]
        emit('update:modelValue', newValues)
        emit('change', newValues)
    }
}

const isSelected = (option) => {
    if (props.multiple) {
        const values = Array.isArray(props.modelValue) ? props.modelValue : []
        return values.includes(option.value)
    }
    return props.modelValue === option.value
}

const handleKeyDown = (event) => {
    if (props.disabled) return

    switch (event.key) {
        case 'Enter':
        case ' ':
            event.preventDefault()
            if (!isOpen.value) {
                toggleDropdown()
            } else if (highlightedIndex.value >= 0) {
                selectOption(filteredOptions.value[highlightedIndex.value])
            }
            break
        case 'Escape':
            closeDropdown()
            trigger.value?.focus()
            break
        case 'ArrowDown':
            event.preventDefault()
            if (!isOpen.value) {
                toggleDropdown()
            } else {
                highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
            }
            break
        case 'ArrowUp':
            event.preventDefault()
            if (isOpen.value) {
                highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
            }
            break
    }
}

const handleBlur = (event) => {
    // Only close if the blur isn't to an element within the select component
    nextTick(() => {
        if (selectContainer.value && !selectContainer.value.contains(document.activeElement)) {
            closeDropdown()
        }
    })
}

const handleClickOutside = (event) => {
    if (selectContainer.value && !selectContainer.value.contains(event.target)) {
        closeDropdown()
    }
}

// Watchers
watch(searchQuery, (newQuery) => {
    emit('search', newQuery)
    highlightedIndex.value = -1
})

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
    transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: scaleY(0.95) translateY(-4px);
}

/* Custom scrollbar for dropdown */
.sleek-select__dropdown .max-h-60::-webkit-scrollbar {
    width: 6px;
}

.sleek-select__dropdown .max-h-60::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.sleek-select__dropdown .max-h-60::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.sleek-select__dropdown .max-h-60::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Focus styles for better accessibility */
.sleek-select__option:focus {
    outline: 2px solid #93c5fd;
    outline-offset: -2px;
}

/* Ensure smooth transitions */
.sleek-select__trigger,
.sleek-select__option {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading state styles if needed */
.sleek-select--loading .sleek-select__trigger {
    cursor: wait;
}

/* Selected tags styling */
.sleek-select .inline-flex {
    max-width: 100%;
}

/* Checkbox styling */
input[type="checkbox"] {
    pointer-events: none;
}

/* CRITICAL: Ensure dropdown is always on top with maximum z-index */
.sleek-select__dropdown {
    /* Use z-[9999] to ensure maximum z-index */
    z-index: 9999 !important;
    /* Ensure solid white background with no transparency */
    background-color: rgba(255, 255, 255, 1) !important;
    /* Add backdrop to prevent see-through issues */
    backdrop-filter: none;
}

/* Ensure all dropdown children have solid backgrounds */
.sleek-select__dropdown>* {
    background-color: rgba(255, 255, 255, 1) !important;
}

/* Override any transparency issues in options */
.sleek-select__option {
    background-color: rgba(255, 255, 255, 1) !important;
}

.sleek-select__option:hover {
    background-color: rgba(249, 250, 251, 1) !important;
}

/* Ensure search input area has solid background */
.sleek-select__dropdown .border-b {
    background-color: rgba(255, 255, 255, 1) !important;
}
</style>