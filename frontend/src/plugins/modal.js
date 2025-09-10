import { createApp, reactive, nextTick } from 'vue'

// Modal state
const modals = reactive([])
let modalIdCounter = 0

// Default modal options
const DEFAULT_OPTIONS = {
    closable: true,
    backdrop: true,
    keyboard: true,
    size: 'md',
    centered: false,
    static: false
}

// Modal service
class ModalService {
    constructor() {
        this.modals = modals
    }

    // Show a modal
    show(options) {
        const modal = {
            id: ++modalIdCounter,
            ...DEFAULT_OPTIONS,
            ...options,
            visible: true,
            timestamp: Date.now()
        }

        this.modals.push(modal)

        // Add body class to prevent scrolling
        document.body.classList.add('modal-open')

        return modal.id
    }

    // Hide a modal
    hide(id) {
        const modal = this.modals.find(m => m.id === id)
        if (modal) {
            modal.visible = false

            // Remove after transition
            setTimeout(() => {
                this.remove(id)
            }, 300)
        }
    }

    // Remove a modal
    remove(id) {
        const index = this.modals.findIndex(m => m.id === id)
        if (index > -1) {
            this.modals.splice(index, 1)

            // Remove body class if no modals are open
            if (this.modals.length === 0) {
                document.body.classList.remove('modal-open')
            }
        }
    }

    // Hide all modals
    hideAll() {
        this.modals.forEach(modal => {
            modal.visible = false
        })

        setTimeout(() => {
            this.modals.splice(0, this.modals.length)
            document.body.classList.remove('modal-open')
        }, 300)
    }

    // Get current modal
    getCurrent() {
        return this.modals[this.modals.length - 1] || null
    }

    // Check if any modal is open
    hasOpenModals() {
        return this.modals.length > 0
    }
}

// Create modal service instance
const modalService = new ModalService()

// Modal component template
const ModalComponent = {
    name: 'ModalContainer',
    setup() {
        const handleBackdropClick = (modal, event) => {
            if (modal.backdrop && event.target === event.currentTarget) {
                if (modal.static) {
                    // Add shake animation for static modals
                    event.currentTarget.classList.add('modal-static')
                    setTimeout(() => {
                        event.currentTarget.classList.remove('modal-static')
                    }, 150)
                } else {
                    modalService.hide(modal.id)
                }
            }
        }

        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                const currentModal = modalService.getCurrent()
                if (currentModal && currentModal.keyboard && currentModal.closable) {
                    modalService.hide(currentModal.id)
                }
            }
        }

        // Add keyboard listener
        document.addEventListener('keydown', handleKeydown)

        return {
            modals: modalService.modals,
            handleBackdropClick,
            hideModal: modalService.hide.bind(modalService)
        }
    },
    template: `
        <teleport to="body">
            <div v-for="modal in modals" :key="modal.id" class="modal-wrapper">
                <transition
                    name="modal"
                    @enter="onEnter"
                    @leave="onLeave"
                >
                    <div
                        v-if="modal.visible"
                        :class="[
                            'fixed inset-0 z-50 flex items-center justify-center p-4',
                            {
                                'items-center': modal.centered,
                                'items-start pt-16': !modal.centered
                            }
                        ]"
                        @click="handleBackdropClick(modal, $event)"
                    >
                        <!-- Backdrop -->
                        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
                        
                        <!-- Modal -->
                        <div
                            :class="[
                                'relative bg-white rounded-lg shadow-xl transform transition-all w-full',
                                {
                                    'max-w-sm': modal.size === 'sm',
                                    'max-w-md': modal.size === 'md',
                                    'max-w-lg': modal.size === 'lg',
                                    'max-w-xl': modal.size === 'xl',
                                    'max-w-2xl': modal.size === '2xl',
                                    'max-w-3xl': modal.size === '3xl',
                                    'max-w-4xl': modal.size === '4xl',
                                    'max-w-5xl': modal.size === '5xl',
                                    'max-w-6xl': modal.size === '6xl',
                                    'max-w-7xl': modal.size === '7xl',
                                    'max-w-full': modal.size === 'full'
                                }
                            ]"
                        >
                            <!-- Header -->
                            <div v-if="modal.title || modal.closable" class="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 v-if="modal.title" class="text-lg font-medium text-gray-900">
                                    {{ modal.title }}
                                </h3>
                                <button
                                    v-if="modal.closable"
                                    @click="hideModal(modal.id)"
                                    class="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                                >
                                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Body -->
                            <div class="p-6">
                                <component
                                    v-if="modal.component"
                                    :is="modal.component"
                                    v-bind="modal.props"
                                    @close="hideModal(modal.id)"
                                />
                                <div v-else-if="modal.content" v-html="modal.content"></div>
                                <div v-else>
                                    <p class="text-gray-500">{{ modal.message || 'No content provided' }}</p>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div v-if="modal.actions || modal.showDefaultActions" class="flex items-center justify-end space-x-2 p-6 border-t border-gray-200">
                                <template v-if="modal.actions">
                                    <button
                                        v-for="action in modal.actions"
                                        :key="action.text"
                                        @click="action.handler ? action.handler() : hideModal(modal.id)"
                                        :class="[
                                            'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                                            action.class || 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500'
                                        ]"
                                    >
                                        {{ action.text }}
                                    </button>
                                </template>
                                <template v-else-if="modal.showDefaultActions">
                                    <button
                                        @click="hideModal(modal.id)"
                                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        @click="modal.onConfirm ? modal.onConfirm() : hideModal(modal.id)"
                                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Confirm
                                    </button>
                                </template>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
        </teleport>
    `,
    methods: {
        onEnter(el) {
            // Animation enter
            el.style.opacity = '0'
            el.style.transform = 'scale(0.9)'
            nextTick(() => {
                el.style.transition = 'all 0.3s ease'
                el.style.opacity = '1'
                el.style.transform = 'scale(1)'
            })
        },
        onLeave(el) {
            // Animation leave
            el.style.transition = 'all 0.3s ease'
            el.style.opacity = '0'
            el.style.transform = 'scale(0.9)'
        }
    }
}

// Confirm dialog component
const ConfirmDialog = {
    name: 'ConfirmDialog',
    props: {
        title: {
            type: String,
            default: 'Confirm Action'
        },
        message: {
            type: String,
            default: 'Are you sure you want to continue?'
        },
        confirmText: {
            type: String,
            default: 'Confirm'
        },
        cancelText: {
            type: String,
            default: 'Cancel'
        },
        type: {
            type: String,
            default: 'warning',
            validator: (value) => ['info', 'warning', 'error', 'success'].includes(value)
        },
        onConfirm: Function,
        onCancel: Function
    },
    emits: ['close'],
    template: `
        <div>
            <div class="flex items-center">
                <div :class="[
                    'flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full',
                    {
                        'bg-blue-100': type === 'info',
                        'bg-yellow-100': type === 'warning',
                        'bg-red-100': type === 'error',
                        'bg-green-100': type === 'success'
                    }
                ]">
                    <!-- Info Icon -->
                    <svg v-if="type === 'info'" :class="['w-6 h-6 text-blue-600']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <!-- Warning Icon -->
                    <svg v-else-if="type === 'warning'" :class="['w-6 h-6 text-yellow-600']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <!-- Error Icon -->
                    <svg v-else-if="type === 'error'" :class="['w-6 h-6 text-red-600']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <!-- Success Icon -->
                    <svg v-else-if="type === 'success'" :class="['w-6 h-6 text-green-600']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900">
                        {{ title }}
                    </h3>
                    <p class="mt-2 text-sm text-gray-500">
                        {{ message }}
                    </p>
                </div>
            </div>
            <div class="mt-6 flex items-center justify-end space-x-2">
                <button
                    @click="handleCancel"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {{ cancelText }}
                </button>
                <button
                    @click="handleConfirm"
                    :class="[
                        'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                        {
                            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500': type === 'info',
                            'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500': type === 'warning',
                            'bg-red-600 hover:bg-red-700 focus:ring-red-500': type === 'error',
                            'bg-green-600 hover:bg-green-700 focus:ring-green-500': type === 'success'
                        }
                    ]"
                >
                    {{ confirmText }}
                </button>
            </div>
        </div>
    `,
    methods: {
        handleConfirm() {
            if (this.onConfirm) {
                this.onConfirm()
            }
            this.$emit('close')
        },
        handleCancel() {
            if (this.onCancel) {
                this.onCancel()
            }
            this.$emit('close')
        }
    }
}

// Composable for using modal
export function useModal() {
    return {
        modal: modalService,
        show: modalService.show.bind(modalService),
        hide: modalService.hide.bind(modalService),
        hideAll: modalService.hideAll.bind(modalService),
        getCurrent: modalService.getCurrent.bind(modalService),
        hasOpenModals: modalService.hasOpenModals.bind(modalService)
    }
}

// Vue plugin
export default {
    install(app) {
        // Register modal components globally
        app.component('ModalContainer', ModalComponent)
        app.component('ConfirmDialog', ConfirmDialog)

        // Provide modal service
        app.provide('modal', modalService)

        // Add global properties
        app.config.globalProperties.$modal = modalService

        // Mount modal container if not already mounted
        if (!document.querySelector('.modal-wrapper')) {
            const modalApp = createApp(ModalComponent)
            const mountPoint = document.createElement('div')
            document.body.appendChild(mountPoint)
            modalApp.mount(mountPoint)
        }
    }
}

// Export modal service
export { modalService }