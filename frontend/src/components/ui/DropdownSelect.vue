<template>
    <div class="relative" ref="dropdownRef">
        <!-- Trigger Button -->
        <button type="button" @click="toggleDropdown" :disabled="disabled" :class="[
            'relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-mun-blue focus:border-mun-blue transition-colors',
            disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400',
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '',
            size === 'sm' ? 'py-1.5 text-sm' : size === 'lg' ? 'py-3 text-base' : 'py-2 text-sm'
        ]" :aria-haspopup="true" :aria-expanded="isOpen">
            <!-- Selected Value Display -->
            <span class="block truncate pr-2">
                <slot name="selected" :selectedOption="selectedOption" :placeholder="placeholder">
                    {{ selectedOption ? selectedOption[labelKey] : placeholder }}
                </slot>
            </span>

            <!-- Chevron Icon - Fixed positioning to prevent overlap -->
            <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon :class="[
                    'w-5 h-5 text-gray-400 transition-transform duration-200',
                    isOpen ? 'transform rotate-180' : ''
                ]" />
            </span>
        </button>

        <!-- Error Message -->
        <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>

        <!-- Dropdown Menu -->
        <transition enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0">
            <div v-if="isOpen"
                class="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
                :class="dropdownPosition === 'up' ? 'bottom-full mb-1' : 'top-full'">
                <!-- Search Input -->
                <div v-if="searchable" class="sticky top-0 bg-white border-b border-gray-200 px-3 py-2">
                    <input v-model="searchQuery" type="text"
                        class="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-mun-blue focus:border-mun-blue"
                        :placeholder="searchPlaceholder" @click.stop />
                </div>

                <!-- Empty State -->
                <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-sm text-gray-500 text-center">
                    {{ searchQuery ? 'No results found' : 'No options available' }}
                </div>

                <!-- Options List -->
                <div v-else>
                    <button v-for="option in filteredOptions" :key="option[valueKey]" type="button"
                        @click="selectOption(option)" :class="[
                            'w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors',
                            isSelected(option) ? 'bg-mun-blue-50 text-mun-blue-600 font-medium' : 'text-gray-900'
                        ]">
                        <slot name="option" :option="option" :isSelected="isSelected(option)">
                            {{ option[labelKey] }}
                        </slot>
                    </button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: [String, Number, Object],
        default: null
    },
    options: {
        type: Array,
        required: true
    },
    labelKey: {
        type: String,
        default: 'label'
    },
    valueKey: {
        type: String,
        default: 'value'
    },
    placeholder: {
        type: String,
        default: 'Select an option'
    },
    disabled: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: ''
    },
    searchable: {
        type: Boolean,
        default: false
    },
    searchPlaceholder: {
        type: String,
        default: 'Search...'
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    dropdownPosition: {
        type: String,
        default: 'down',
        validator: (value) => ['up', 'down', 'auto'].includes(value)
    },
    returnObject: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'open', 'close'])

// State
const isOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)

// Computed
const selectedOption = computed(() => {
    if (!props.modelValue) return null

    if (props.returnObject) {
        return props.modelValue
    }

    return props.options.find(option => option[props.valueKey] === props.modelValue)
})

const filteredOptions = computed(() => {
    if (!props.searchable || !searchQuery.value) {
        return props.options
    }

    const query = searchQuery.value.toLowerCase()
    return props.options.filter(option =>
        option[props.labelKey].toLowerCase().includes(query)
    )
})

// Methods
const toggleDropdown = () => {
    if (props.disabled) return

    isOpen.value = !isOpen.value

    if (isOpen.value) {
        emit('open')
        // Reset search when opening
        searchQuery.value = ''
    } else {
        emit('close')
    }
}

const selectOption = (option) => {
    const value = props.returnObject ? option : option[props.valueKey]

    emit('update:modelValue', value)
    emit('change', value, option)

    isOpen.value = false
    emit('close')
}

const isSelected = (option) => {
    if (!props.modelValue) return false

    if (props.returnObject) {
        return props.modelValue[props.valueKey] === option[props.valueKey]
    }

    return props.modelValue === option[props.valueKey]
}

const closeDropdown = () => {
    isOpen.value = false
    emit('close')
}

// Click outside handler
const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        closeDropdown()
    }
}

// Keyboard navigation
const handleKeydown = (event) => {
    if (!isOpen.value) return

    if (event.key === 'Escape') {
        closeDropdown()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        // TODO: Add keyboard navigation between options
    } else if (event.key === 'Enter') {
        event.preventDefault()
        // TODO: Select highlighted option
    }
}

// Watchers
watch(isOpen, (newVal) => {
    if (newVal) {
        document.addEventListener('click', handleClickOutside)
        document.addEventListener('keydown', handleKeydown)
    } else {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('keydown', handleKeydown)
    }
})

// Lifecycle
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Custom scrollbar for dropdown */
.overflow-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Ensure proper text truncation */
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Focus styles */
button:focus {
    outline: none;
}

/* High contrast support */
@media (prefers-contrast: high) {
    .ring-1 {
        ring-width: 2px;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .transition {
        transition: none;
    }

    .transform {
        transform: none;
    }
}
</style>