<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue" @click="handleBackdropClick"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                <!-- Main modal container -->
                <div ref="modalContent" @click.stop :class="[
                    'bg-white rounded-2xl shadow-2xl flex flex-col',
                    sizeClasses,
                    heightClasses
                ]">

                    <!-- Modal Header -->
                    <div :class="[
                        'flex items-center justify-between p-6 border-b border-mun-gray-200 flex-shrink-0',
                        headerClass
                    ]">
                        <div class="flex items-center space-x-3">
                            <!-- Icon slot -->
                            <div v-if="$slots.icon || icon" :class="[
                                'p-2 rounded-lg flex items-center justify-center',
                                iconBackgroundClass
                            ]">
                                <slot name="icon">
                                    <component v-if="icon" :is="icon" :class="['w-6 h-6', iconColorClass]" />
                                </slot>
                            </div>

                            <!-- Title and subtitle -->
                            <div>
                                <h2 :class="['font-bold', titleClass]">
                                    <slot name="title">{{ title }}</slot>
                                </h2>
                                <p v-if="$slots.subtitle || subtitle" :class="['text-sm mt-1', subtitleClass]">
                                    <slot name="subtitle">{{ subtitle }}</slot>
                                </p>
                            </div>
                        </div>

                        <!-- Close button -->
                        <button @click="handleClose"
                            :class="['p-2 hover:bg-mun-gray-100 rounded-lg transition-colors', closeButtonClass]">
                            <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                        </button>
                    </div>

                    <!-- Modal Content -->
                    <div :class="['flex-1', contentScrollable ? 'overflow-y-auto' : 'overflow-hidden']">
                        <div :class="['p-6', contentClass]">
                            <slot name="content">
                                <slot></slot>
                            </slot>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div v-if="$slots.footer || showDefaultFooter" :class="[
                        'flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50 rounded-b-2xl flex-shrink-0',
                        footerClass
                    ]">
                        <!-- Footer left content -->
                        <div class="text-sm text-mun-gray-500">
                            <slot name="footer-left">
                                <span v-if="footerText">{{ footerText }}</span>
                            </slot>
                        </div>

                        <!-- Footer buttons -->
                        <div class="flex space-x-3">
                            <slot name="footer-buttons">
                                <!-- Cancel/Close button -->
                                <AppButton @click="handleClose" variant="outline" :disabled="isLoading">
                                    {{ cancelText }}
                                </AppButton>

                                <!-- Primary action button (if not view-only) -->
                                <AppButton v-if="!isViewOnly" @click="handlePrimaryAction"
                                    :variant="primaryButtonVariant" :loading="isLoading" :disabled="isPrimaryDisabled">
                                    {{ primaryText }}
                                </AppButton>
                            </slot>
                        </div>
                    </div>

                </div>
            </div>
        </transition>
    </Teleport>

    <!-- Unsaved Changes Confirmation Dialog -->
    <ConfirmationDialog v-model="showUnsavedConfirm" title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirm-text="Discard Changes" cancel-text="Continue Editing" confirm-variant="danger"
        @confirm="handleConfirmClose" @cancel="showUnsavedConfirm = false" />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import AppButton from './AppButton.vue'
import ConfirmationDialog from './ConfirmationDialog.vue'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: [Object, String],
        default: null
    },
    size: {
        type: String,
        default: 'lg', // sm, md, lg, xl, full
        validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
    },
    height: {
        type: String,
        default: 'auto', // auto, full, fixed
        validator: (value) => ['auto', 'full', 'fixed'].includes(value)
    },
    variant: {
        type: String,
        default: 'default', // default, primary, success, warning, danger
        validator: (value) => ['default', 'primary', 'success', 'warning', 'danger'].includes(value)
    },
    isViewOnly: {
        type: Boolean,
        default: false
    },
    hasUnsavedChanges: {
        type: Boolean,
        default: false
    },
    closeOnBackdrop: {
        type: Boolean,
        default: true
    },
    closeOnEscape: {
        type: Boolean,
        default: true
    },
    contentScrollable: {
        type: Boolean,
        default: true
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    showDefaultFooter: {
        type: Boolean,
        default: true
    },
    footerText: {
        type: String,
        default: ''
    },
    cancelText: {
        type: String,
        default: 'Close'
    },
    primaryText: {
        type: String,
        default: 'Save'
    },
    primaryButtonVariant: {
        type: String,
        default: 'primary'
    },
    isPrimaryDisabled: {
        type: Boolean,
        default: false
    },
    // Custom classes
    headerClass: {
        type: String,
        default: ''
    },
    contentClass: {
        type: String,
        default: ''
    },
    footerClass: {
        type: String,
        default: ''
    }
})

// Emits
const emit = defineEmits([
    'update:modelValue',
    'close',
    'cancel',
    'primary-action',
    'backdrop-click',
    'escape-pressed'
])

// Refs
const modalContent = ref(null)
const showUnsavedConfirm = ref(false)

// Computed styles based on props
const sizeClasses = computed(() => {
    const sizes = {
        sm: 'w-full max-w-md',
        md: 'w-full max-w-2xl',
        lg: 'w-full max-w-4xl',
        xl: 'w-full max-w-6xl',
        full: 'w-full max-w-7xl'
    }
    return sizes[props.size] || sizes.lg
})

const heightClasses = computed(() => {
    const heights = {
        auto: 'max-h-[95vh] min-h-[300px]',
        full: 'h-[95vh]',
        'h-[600px]'
    }
    return heights[props.height] || heights.auto
})

const titleClass = computed(() => {
    // const variant = props.variant
    // if (variant === 'primary') return 'text-xl text-white'
    // if (variant === 'success') return 'text-xl text-white'
    // if (variant === 'warning') return 'text-xl text-white'
    // if (variant === 'danger') return 'text-xl text-white'
    return 'text-xl text-mun-gray-900'
})

const subtitleClass = computed(() => {
    // const variant = props.variant
    // if (variant === 'primary') return 'text-white/80'
    // if (variant === 'success') return 'text-white/80'
    // if (variant === 'warning') return 'text-white/80'
    // if (variant === 'danger') return 'text-white/80'
    return 'text-mun-gray-600'
})

const iconBackgroundClass = computed(() => {
    // const variant = props.variant
    // if (variant === 'primary') return 'bg-white/20'
    // if (variant === 'success') return 'bg-white/20'
    // if (variant === 'warning') return 'bg-white/20'
    // if (variant === 'danger') return 'bg-white/20'
    return 'bg-mun-blue-100'
})

const iconColorClass = computed(() => {
    // const variant = props.variant
    // if (variant === 'primary') return 'text-white'
    // if (variant === 'success') return 'text-white'
    // if (variant === 'warning') return 'text-white'
    // if (variant === 'danger') return 'text-white'
    return 'text-mun-blue-600'
})

const closeButtonClass = computed(() => {
    // const variant = props.variant
    // if (['primary', 'success', 'warning', 'danger'].includes(variant)) {
    //     return 'text-white/80 hover:text-white hover:bg-white/10'
    // }
    return ''
})

// Computed header class with variant styles
const computedHeaderClass = computed(() => {
    let baseClass = props.headerClass

    const variant = props.variant
    if (variant === 'primary') {
        baseClass += ' bg-gradient-to-r from-mun-blue to-mun-blue-600'
    } else if (variant === 'success') {
        baseClass += ' bg-gradient-to-r from-green-500 to-green-600'
    } else if (variant === 'warning') {
        baseClass += ' bg-gradient-to-r from-yellow-500 to-yellow-600'
    } else if (variant === 'danger') {
        baseClass += ' bg-gradient-to-r from-red-500 to-red-600'
    }

    return baseClass
})

// Methods
const handleBackdropClick = () => {
    if (!props.closeOnBackdrop) return

    emit('backdrop-click')

    if (props.hasUnsavedChanges && !props.isViewOnly) {
        showUnsavedConfirm.value = true
    } else {
        handleClose()
    }
}

const handleClose = () => {
    if (props.hasUnsavedChanges && !props.isViewOnly) {
        showUnsavedConfirm.value = true
    } else {
        emit('close')
        emit('update:modelValue', false)
    }
}

const handleCancel = () => {
    if (props.hasUnsavedChanges && !props.isViewOnly) {
        showUnsavedConfirm.value = true
    } else {
        emit('cancel')
        emit('update:modelValue', false)
    }
}

const handlePrimaryAction = () => {
    emit('primary-action')
}

const handleConfirmClose = () => {
    showUnsavedConfirm.value = false
    emit('close')
    emit('update:modelValue', false)
}

const handleEscapeKey = (event) => {
    if (event.key === 'Escape' && props.closeOnEscape && props.modelValue) {
        emit('escape-pressed')
        handleClose()
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapeKey)
})

// Watch for modal opening to focus management
watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        // Focus management could be added here
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
    }
})
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from>div,
.modal-leave-to>div {
    transform: scale(0.9) translateY(-20px);
}

/* Ensure modal stays on top */
.z-50 {
    z-index: 50;
}

/* Smooth transitions for interactive elements */
button {
    transition: all 0.2s ease;
}

/* Focus management */
button:focus {
    outline: 2px solid rgb(59 130 246);
    outline-offset: 2px;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {

    .modal-enter-active,
    .modal-leave-active {
        transition: none;
    }

    button {
        transition: none;
    }
}
</style>