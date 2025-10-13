<template>
    <div class="sleek-select relative" :class="containerClass">
        <button ref="trigger" @click="toggleDropdown" @blur="handleBlur" @keydown="handleKeydown" :class="[
            'sleek-select__trigger w-full flex items-center justify-between px-4 py-2.5 text-left border rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-mun-blue-400',
            isOpen ? 'border-mun-blue-500 ring-2 ring-mun-blue-200 shadow-md' : 'border-gray-300',
            triggerClass,
            sizeClasses
        ]" :disabled="disabled" :aria-expanded="isOpen" :aria-haspopup="true" role="combobox">
            <span :class="[
                'flex items-center transition-colors duration-150',
                selectedOption ? 'text-gray-900' : 'text-gray-500'
            ]">
                <!-- Icon if provided -->
                <component v-if="selectedOption?.icon" :is="selectedOption.icon" class="w-4 h-4 mr-2 flex-shrink-0" />
                <!-- Selected value or placeholder -->
                {{ selectedOption ? selectedOption.label : placeholder }}
            </span>

            <!-- Dropdown chevron with rotation animation -->
            <ChevronDownIcon :class="[
                'w-4 h-4 transition-transform duration-200 ease-in-out flex-shrink-0 ml-2',
                isOpen ? 'rotate-180' : 'rotate-0'
            ]" />
        </button>

        <!-- Dropdown Panel with smooth animations -->
        <Transition enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-1">
            <div v-show="isOpen" ref="dropdown" :class="[
                'sleek-select__dropdown absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden',
                dropdownClass
            ]" role="listbox">
                <!-- Search Input (if searchable) -->
                <div v-if="searchable" class="p-2 border-b border-gray-100">
                    <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Search options..."
                        class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-mun-blue-300 focus:border-mun-blue-400"
                        @keydown.stop />
                </div>

                <!-- Options List -->
                <div class="max-h-60 overflow-y-auto">
                    <div v-for="(option, index) in filteredOptions" :key="option.value || option"
                        @click="selectOption(option)" @mouseenter="highlightedIndex = index" :class="[
                            'sleek-select__option flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 text-sm',
                            isSelected(option)
                                ? 'bg-mun-blue-50 text-mun-blue-700 font-medium'
                                : highlightedIndex === index
                                    ? 'bg-gray-50 text-gray-900'
                                    : 'text-gray-700 hover:bg-gray-50'
                        ]" role="option" :aria-selected="isSelected(option)">
                        <!-- Option Icon -->
                        <component v-if="option.icon" :is="option.icon" class="w-4 h-4 mr-3 flex-shrink-0" />

                        <!-- Option Label -->
                        <span class="flex-1">{{ getOptionLabel(option) }}</span>

                        <!-- Selected Checkmark -->
                        <CheckIcon v-if="isSelected(option)" class="w-4 h-4 text-mun-blue-600 flex-shrink-0 ml-2" />
                    </div>

                    <!-- No options found state -->
                    <div v-if="filteredOptions.length === 0" class="px-4 py-6 text-center text-gray-500 text-sm">
                        {{ searchQuery ? 'No options found' : 'No options available' }}
                    </div>
                </div>

                <!-- Custom footer slot -->
                <div v-if="$slots.footer" class="border-t border-gray-100 p-2">
                    <slot name="footer"></slot>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: [String, Number, Object, Array],
        default: null
    },
    options: {
        type: Array,
        default: () => []
    },
    placeholder: {
        type: String,
        default: 'Select an option'
    },
    labelKey: {
        type: String,
        default: 'label'
    },
    valueKey: {
        type: String,
        default: 'value'
    },
    searchable: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
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
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'open', 'close'])

// Refs
const trigger = ref(null)
const dropdown = ref(null)
const searchInput = ref(null)

// State
const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)

// Computed
const sizeClasses = computed(() => {
    const sizes = {
        sm: 'text-sm py-2 px-3',
        md: 'text-sm py-2.5 px-4',
        lg: 'text-base py-3 px-4'
    }
    return sizes[props.size]
})

const normalizedOptions = computed(() => {
    return props.options.map(option => {
        if (typeof option === 'string' || typeof option === 'number') {
            return { label: option, value: option }
        }
        return {
            label: option[props.labelKey] || option.label,
            value: option[props.valueKey] || option.value,
            icon: option.icon,
            ...option
        }
    })
})

const filteredOptions = computed(() => {
    if (!searchQuery.value) return normalizedOptions.value

    const query = searchQuery.value.toLowerCase()
    return normalizedOptions.value.filter(option =>
        option.label.toLowerCase().includes(query)
    )
})

const selectedOption = computed(() => {
    if (!props.modelValue) return null

    return normalizedOptions.value.find(option => {
        if (typeof props.modelValue === 'object') {
            return option.value === props.modelValue[props.valueKey]
        }
        return option.value === props.modelValue
    })
})

// Methods
const toggleDropdown = () => {
    if (props.disabled) return

    if (isOpen.value) {
        closeDropdown()
    } else {
        openDropdown()
    }
}

const openDropdown = async () => {
    isOpen.value = true
    highlightedIndex.value = -1
    searchQuery.value = ''

    await nextTick()

    if (props.searchable && searchInput.value) {
        searchInput.value.focus()
    }

    emit('open')
}

const closeDropdown = () => {
    isOpen.value = false
    highlightedIndex.value = -1
    emit('close')
}

const selectOption = (option) => {
    const value = typeof props.modelValue === 'object' ? option : option.value

    emit('update:modelValue', value)
    emit('change', value)

    closeDropdown()
    trigger.value?.focus()
}

const isSelected = (option) => {
    if (!props.modelValue) return false

    if (typeof props.modelValue === 'object') {
        return option.value === props.modelValue[props.valueKey]
    }

    return option.value === props.modelValue
}

const getOptionLabel = (option) => {
    return option.label || option[props.labelKey] || option.value
}

const handleBlur = (event) => {
    // Don't close if focus moves to dropdown or search input
    if (dropdown.value?.contains(event.relatedTarget)) {
        return
    }

    setTimeout(() => {
        closeDropdown()
    }, 150)
}

const handleKeydown = (event) => {
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            if (!isOpen.value) {
                openDropdown()
            } else {
                highlightedIndex.value = Math.min(
                    highlightedIndex.value + 1,
                    filteredOptions.value.length - 1
                )
            }
            break

        case 'ArrowUp':
            event.preventDefault()
            if (isOpen.value) {
                highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
            }
            break

        case 'Enter':
        case ' ':
            event.preventDefault()
            if (!isOpen.value) {
                openDropdown()
            } else if (highlightedIndex.value >= 0) {
                selectOption(filteredOptions.value[highlightedIndex.value])
            }
            break

        case 'Escape':
            event.preventDefault()
            closeDropdown()
            break
    }
}

// Click outside to close
const handleClickOutside = (event) => {
    if (
        trigger.value &&
        !trigger.value.contains(event.target) &&
        dropdown.value &&
        !dropdown.value.contains(event.target)
    ) {
        closeDropdown()
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

// Watch for external value changes
watch(() => props.modelValue, () => {
    if (isOpen.value) {
        highlightedIndex.value = -1
    }
})
</script>

<style scoped>
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
    outline: 2px solid theme('colors.mun.blue.300');
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
</style>