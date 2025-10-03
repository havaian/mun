<template>
    <teleport to="body">
        <div v-for="modal in modals" :key="modal.id" class="modal-wrapper">
            <transition name="modal" @enter="onEnter" @leave="onLeave">
                <div v-if="modal.visible" :class="[
                    'fixed inset-0 flex items-center justify-center p-4',
                    `z-${50 + modal.zIndex}`,
                    {
                        'items-center': modal.centered !== false,
                        'items-start pt-16': modal.centered === false
                    }
                ]" @click="handleBackdropClick(modal, $event)">
                    <!-- Backdrop -->
                    <div class="fixed inset-0 bg-black transition-opacity" :class="[
                        modal.backdrop === 'dark' ? 'bg-opacity-75' : 'bg-opacity-50',
                        modal.backdrop === 'blur' ? 'backdrop-blur-sm' : '',
                        modal.backdrop === 'light' ? 'bg-opacity-25' : ''
                    ]"></div>

                    <!-- Modal -->
                    <div :class="[
                        'relative bg-white rounded-lg shadow-xl transform transition-all w-full',
                        getModalSizeClasses(modal.size),
                        modal.customClass || ''
                    ]" role="dialog" :aria-labelledby="modal.title ? `modal-title-${modal.id}` : undefined"
                        aria-modal="true">
                        <!-- Header -->
                        <div v-if="modal.title || modal.closable !== false"
                            class="flex items-center justify-between p-6 border-b border-gray-200">
                            <div class="flex items-center space-x-3">
                                <!-- Icon if provided -->
                                <div v-if="modal.icon" :class="[
                                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                                    getIconBackgroundClass(modal.type)
                                ]">
                                    <component :is="modal.icon" :class="[
                                        'w-5 h-5',
                                        getIconColorClass(modal.type)
                                    ]" />
                                </div>

                                <!-- Title -->
                                <h3 v-if="modal.title" :id="`modal-title-${modal.id}`"
                                    class="text-lg font-medium text-gray-900">
                                    {{ modal.title }}
                                </h3>
                            </div>

                            <!-- Close button -->
                            <button v-if="modal.closable !== false" @click="hideModal(modal.id)"
                                class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition-colors rounded-md p-1 hover:bg-gray-100"
                                :aria-label="modal.closeLabel || 'Close modal'">
                                <XMarkIcon class="h-6 w-6" />
                            </button>
                        </div>

                        <!-- Body -->
                        <div :class="[
                            'p-6',
                            {
                                'max-h-96 overflow-y-auto': modal.scrollable,
                                'pt-8': !modal.title && modal.closable === false
                            }
                        ]">
                            <!-- Component content -->
                            <component v-if="modal.component" :is="modal.component" v-bind="modal.props || {}"
                                @close="hideModal(modal.id)" @confirm="handleConfirm(modal)"
                                @cancel="handleCancel(modal)" />

                            <!-- HTML content -->
                            <div v-else-if="modal.content" v-html="modal.content" class="prose prose-sm max-w-none">
                            </div>

                            <!-- Text content -->
                            <div v-else-if="modal.message">
                                <p class="text-gray-600">{{ modal.message }}</p>
                            </div>

                            <!-- Fallback -->
                            <div v-else class="text-center text-gray-500">
                                <p>No content provided</p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div v-if="modal.actions || modal.showDefaultActions"
                            class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                            <!-- Custom actions -->
                            <template v-if="modal.actions">
                                <button v-for="action in modal.actions" :key="action.text"
                                    @click="handleActionClick(action, modal)" :disabled="action.loading" :class="[
                                        'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                                        action.class || getDefaultActionClass(action.variant)
                                    ]">
                                    <LoadingSpinner v-if="action.loading" size="xs" class="mr-2" />
                                    <component v-else-if="action.icon" :is="action.icon" class="w-4 h-4 mr-2" />
                                    {{ action.text }}
                                </button>
                            </template>

                            <!-- Default actions -->
                            <template v-else-if="modal.showDefaultActions">
                                <button @click="handleCancel(modal)" :disabled="modal.loading"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors">
                                    {{ modal.cancelText || 'Cancel' }}
                                </button>
                                <button @click="handleConfirm(modal)" :disabled="modal.loading" :class="[
                                    'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                                    getConfirmButtonClass(modal.type)
                                ]">
                                    <LoadingSpinner v-if="modal.loading" size="xs" color="white" class="mr-2" />
                                    {{ modal.confirmText || 'Confirm' }}
                                </button>
                            </template>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </teleport>
</template>

<script setup>
import { computed, nextTick } from 'vue'
import { useModal } from '@/plugins/modal'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from './LoadingSpinner.vue'

const { modal: modalService } = useModal()

// Access reactive modals from the service
const modals = computed(() => modalService.modals)

// Methods
const getModalSizeClasses = (size) => {
    const sizeMap = {
        xs: 'max-w-xs',
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full'
    }
    return sizeMap[size] || sizeMap.md
}

const getIconBackgroundClass = (type) => {
    const bgMap = {
        success: 'bg-green-100',
        error: 'bg-red-100',
        warning: 'bg-yellow-100',
        info: 'bg-blue-100',
        question: 'bg-gray-100'
    }
    return bgMap[type] || bgMap.info
}

const getIconColorClass = (type) => {
    const colorMap = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
        question: 'text-gray-600'
    }
    return colorMap[type] || colorMap.info
}

const getConfirmButtonClass = (type) => {
    const classMap = {
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        question: 'bg-blue hover:bg-blue-dark focus:ring-blue'
    }
    return classMap[type] || classMap.question
}

const getDefaultActionClass = (variant) => {
    const classMap = {
        primary: 'bg-blue text-white hover:bg-blue-dark focus:ring-blue',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue'
    }
    return classMap[variant] || classMap.outline
}

const handleBackdropClick = (modal, event) => {
    if (modal.backdrop !== false && event.target === event.currentTarget) {
        if (modal.static) {
            // Add shake animation for static modals
            event.currentTarget.classList.add('animate-shake')
            setTimeout(() => {
                event.currentTarget.classList.remove('animate-shake')
            }, 600)
        } else {
            hideModal(modal.id)
        }
    }
}

const hideModal = (id) => {
    modalService.hide(id)
}

const handleConfirm = (modal) => {
    if (modal.onConfirm) {
        const result = modal.onConfirm()
        // If onConfirm returns a promise, handle it
        if (result && typeof result.then === 'function') {
            modal.loading = true
            result
                .then(() => hideModal(modal.id))
                .catch(() => {
                    // Keep modal open on error
                })
                .finally(() => {
                    modal.loading = false
                })
        } else {
            hideModal(modal.id)
        }
    } else {
        hideModal(modal.id)
    }
}

const handleCancel = (modal) => {
    if (modal.onCancel) {
        modal.onCancel()
    }
    hideModal(modal.id)
}

const handleActionClick = (action, modal) => {
    if (action.handler) {
        const result = action.handler()
        // If handler returns a promise, show loading state
        if (result && typeof result.then === 'function') {
            action.loading = true
            result
                .then(() => {
                    if (action.closeOnSuccess !== false) {
                        hideModal(modal.id)
                    }
                })
                .catch(() => {
                    // Keep modal open on error
                })
                .finally(() => {
                    action.loading = false
                })
        } else {
            if (action.closeOnSuccess !== false) {
                hideModal(modal.id)
            }
        }
    } else {
        hideModal(modal.id)
    }
}

// Animation handlers
const onEnter = (el) => {
    el.style.opacity = '0'
    el.style.transform = 'scale(0.95)'
    nextTick(() => {
        el.style.transition = 'all 0.3s ease'
        el.style.opacity = '1'
        el.style.transform = 'scale(1)'
    })
}

const onLeave = (el) => {
    el.style.transition = 'all 0.3s ease'
    el.style.opacity = '0'
    el.style.transform = 'scale(0.95)'
}
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* Shake animation for static modals */
@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    10%,
    30%,
    50%,
    70%,
    90% {
        transform: translateX(-4px);
    }

    20%,
    40%,
    60%,
    80% {
        transform: translateX(4px);
    }
}

.animate-shake {
    animation: shake 0.6s ease-in-out;
}

/* Scrollbar styling for scrollable modals */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Focus management */
.modal-wrapper {
    isolation: isolate;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .relative {
        border: 2px solid;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {

    .modal-enter-active,
    .modal-leave-active {
        transition: none;
    }

    .animate-shake {
        animation: none;
    }
}
</style>