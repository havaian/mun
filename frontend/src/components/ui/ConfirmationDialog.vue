<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue"
                class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                @click="handleBackdropClick">

                <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                    <!-- Header -->
                    <div class="p-6 pb-4">
                        <div class="flex items-center space-x-3">
                            <div :class="[
                                'p-2 rounded-lg flex items-center justify-center',
                                iconBackgroundClass
                            ]">
                                <component :is="iconComponent" :class="['w-6 h-6', iconColorClass]" />
                            </div>
                            <h2 class="text-lg font-semibold text-mun-gray-900">
                                {{ title }}
                            </h2>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="px-6 pb-6">
                        <p class="text-mun-gray-600">
                            {{ message }}
                        </p>
                        <div v-if="$slots.default" class="mt-4">
                            <slot></slot>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="flex items-center justify-end space-x-3 p-6 pt-4 border-t border-mun-gray-200 bg-mun-gray-50 rounded-b-2xl">
                        <AppButton @click="handleCancel" variant="outline" :disabled="isLoading">
                            {{ cancelText }}
                        </AppButton>

                        <AppButton @click="handleConfirm" :variant="confirmVariant" :loading="isLoading">
                            {{ confirmText }}
                        </AppButton>
                    </div>

                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'
import AppButton from './AppButton.vue'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'Confirm Action'
    },
    message: {
        type: String,
        required: true
    },
    confirmText: {
        type: String,
        default: 'Confirm'
    },
    cancelText: {
        type: String,
        default: 'Cancel'
    },
    confirmVariant: {
        type: String,
        default: 'primary', // primary, danger, success, warning
        validator: (value) => ['primary', 'danger', 'success', 'warning'].includes(value)
    },
    type: {
        type: String,
        default: 'warning', // warning, info, success, danger, question
        validator: (value) => ['warning', 'info', 'success', 'danger', 'question'].includes(value)
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    closeOnBackdrop: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// Computed
const iconComponent = computed(() => {
    const icons = {
        warning: ExclamationTriangleIcon,
        info: InformationCircleIcon,
        success: CheckCircleIcon,
        danger: XCircleIcon,
        question: QuestionMarkCircleIcon
    }
    return icons[props.type] || icons.warning
})

const iconBackgroundClass = computed(() => {
    const classes = {
        warning: 'bg-yellow-100',
        info: 'bg-blue-100',
        success: 'bg-green-100',
        danger: 'bg-red-100',
        question: 'bg-mun-gray-100'
    }
    return classes[props.type] || classes.warning
})

const iconColorClass = computed(() => {
    const classes = {
        warning: 'text-yellow-600',
        info: 'text-blue-600',
        success: 'text-green-600',
        danger: 'text-red-600',
        question: 'text-mun-gray-600'
    }
    return classes[props.type] || classes.warning
})

// Methods
const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
        handleCancel()
    }
}

const handleConfirm = () => {
    emit('confirm')
    emit('update:modelValue', false)
}

const handleCancel = () => {
    emit('cancel')
    emit('update:modelValue', false)
}
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from>div,
.modal-leave-to>div {
    transform: scale(0.95) translateY(-10px);
}

/* Higher z-index than main modals */
.z-\[60\] {
    z-index: 60;
}
</style>