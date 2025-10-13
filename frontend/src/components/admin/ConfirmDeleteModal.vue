<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all" @click.stop>

                    <!-- Header -->
                    <div class="flex items-center space-x-4 p-6 border-b border-mun-gray-200">
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-mun-gray-900">
                                {{ title || 'Confirm Deletion' }}
                            </h3>
                            <p class="text-sm text-mun-gray-600">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-6">
                        <!-- Warning Message -->
                        <div class="mb-6">
                            <p class="text-mun-gray-700 leading-relaxed">
                                {{ message || getDefaultMessage() }}
                            </p>
                        </div>

                        <!-- Item Details (if provided) -->
                        <div v-if="item" class="mb-6 p-4 bg-mun-gray-50 rounded-lg border border-mun-gray-200">
                            <div class="flex items-center space-x-3">
                                <!-- Item Icon -->
                                <div
                                    class="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-mun-gray-200">
                                    <component :is="getItemIcon()" class="w-5 h-5 text-mun-gray-600" />
                                </div>

                                <!-- Item Info -->
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-medium text-mun-gray-900 truncate">
                                        {{ getItemTitle() }}
                                    </h4>
                                    <p v-if="getItemSubtitle()" class="text-xs text-mun-gray-500 truncate">
                                        {{ getItemSubtitle() }}
                                    </p>
                                </div>

                                <!-- Item Status/Type -->
                                <div v-if="getItemBadge()" class="flex-shrink-0">
                                    <span :class="[
                                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                        getItemBadgeClasses()
                                    ]">
                                        {{ getItemBadge() }}
                                    </span>
                                </div>
                            </div>

                            <!-- Additional Info -->
                            <div v-if="showItemDetails" class="mt-3 pt-3 border-t border-mun-gray-200">
                                <div class="grid grid-cols-2 gap-4 text-xs">
                                    <div v-if="item.createdAt">
                                        <span class="text-mun-gray-500">Created:</span>
                                        <div class="text-mun-gray-900 font-medium">{{ formatDate(item.createdAt) }}
                                        </div>
                                    </div>
                                    <div v-if="getItemCount()">
                                        <span class="text-mun-gray-500">{{ getItemCountLabel() }}:</span>
                                        <div class="text-mun-gray-900 font-medium">{{ getItemCount() }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Consequences Warning -->
                        <div v-if="consequences && consequences.length" class="mb-6">
                            <h4 class="text-sm font-medium text-mun-gray-900 mb-3 flex items-center">
                                <InformationCircleIcon class="w-4 h-4 mr-2 text-mun-yellow-600" />
                                What will happen:
                            </h4>
                            <ul class="space-y-2">
                                <li v-for="consequence in consequences" :key="consequence"
                                    class="flex items-start space-x-2 text-sm text-mun-gray-700">
                                    <XMarkIcon class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>{{ consequence }}</span>
                                </li>
                            </ul>
                        </div>

                        <!-- Dependencies Warning -->
                        <div v-if="dependencies && dependencies.length"
                            class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 class="text-sm font-medium text-red-900 mb-3 flex items-center">
                                <ExclamationTriangleIcon class="w-4 h-4 mr-2" />
                                Warning: Dependencies Found
                            </h4>
                            <p class="text-sm text-red-800 mb-3">
                                This {{ itemType || 'item' }} is being used by other items. Deleting it may affect:
                            </p>
                            <ul class="space-y-1">
                                <li v-for="dependency in dependencies" :key="dependency.id || dependency.name"
                                    class="flex items-center space-x-2 text-sm text-red-800">
                                    <component :is="getDependencyIcon(dependency.type)" class="w-4 h-4 flex-shrink-0" />
                                    <span>{{ dependency.name || dependency.title }}</span>
                                    <span v-if="dependency.count" class="text-xs bg-red-200 text-red-800 px-1 rounded">
                                        {{ dependency.count }}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <!-- Force Delete Option -->
                        <div v-if="allowForceDelete && (dependencies?.length || requireConfirmation)" class="mb-6">
                            <label class="flex items-start space-x-3 cursor-pointer">
                                <input v-model="forceDelete" type="checkbox"
                                    class="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500" />
                                <div class="text-sm">
                                    <div class="font-medium text-red-900">
                                        I understand the consequences
                                    </div>
                                    <div class="text-red-700">
                                        {{ forceDeleteText || 'Force delete and ignore dependencies' }}
                                    </div>
                                </div>
                            </label>
                        </div>

                        <!-- Confirmation Input -->
                        <div v-if="requireTextConfirmation" class="mb-6">
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                Type <code
                                    class="bg-mun-gray-100 px-1 rounded text-red-600 font-mono">{{ confirmationText }}</code>
                                to confirm:
                            </label>
                            <input v-model="userConfirmationInput" type="text"
                                class="w-full px-3 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                :placeholder="`Type '${confirmationText}' here`" @keyup.enter="confirmDelete" />
                        </div>
                    </div>

                    <!-- Footer -->
                    <div
                        class="flex items-center justify-end space-x-3 p-6 border-t border-mun-gray-200 bg-mun-gray-50 rounded-b-2xl">
                        <AppButton @click="closeModal" variant="outline" :disabled="isDeleting">
                            Cancel
                        </AppButton>

                        <AppButton @click="confirmDelete" variant="danger" :loading="isDeleting" :disabled="!canDelete">
                            <TrashIcon class="w-4 h-4 mr-2" />
                            {{ deleteButtonText || 'Delete' }}
                        </AppButton>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
    TrashIcon,
    CalendarDaysIcon,
    UsersIcon,
    DocumentTextIcon,
    CogIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: null
    },
    message: {
        type: String,
        default: null
    },
    item: {
        type: Object,
        default: null
    },
    itemType: {
        type: String,
        default: 'item'
    },
    consequences: {
        type: Array,
        default: () => []
    },
    dependencies: {
        type: Array,
        default: () => []
    },
    allowForceDelete: {
        type: Boolean,
        default: false
    },
    forceDeleteText: {
        type: String,
        default: null
    },
    requireTextConfirmation: {
        type: Boolean,
        default: false
    },
    confirmationText: {
        type: String,
        default: 'DELETE'
    },
    deleteButtonText: {
        type: String,
        default: null
    },
    showItemDetails: {
        type: Boolean,
        default: true
    },
    requireConfirmation: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// State
const isDeleting = ref(false)
const forceDelete = ref(false)
const userConfirmationInput = ref('')

// Computed
const canDelete = computed(() => {
    // If force delete is available and there are dependencies/confirmation required
    if (props.allowForceDelete && (props.dependencies?.length || props.requireConfirmation)) {
        if (!forceDelete.value) return false
    }

    // If text confirmation is required
    if (props.requireTextConfirmation) {
        return userConfirmationInput.value === props.confirmationText
    }

    return true
})

// Methods
const closeModal = () => {
    if (isDeleting.value) return
    resetForm()
    emit('update:modelValue', false)
    emit('cancel')
}

const resetForm = () => {
    forceDelete.value = false
    userConfirmationInput.value = ''
}

const confirmDelete = async () => {
    if (!canDelete.value || isDeleting.value) return

    try {
        isDeleting.value = true

        const deleteOptions = {
            force: forceDelete.value,
            confirmed: true
        }

        await emit('confirm', props.item, deleteOptions)

        resetForm()
        emit('update:modelValue', false)

    } catch (error) {
        toast.error('Delete failed:', error)
        // Error handling is done in parent component
    } finally {
        isDeleting.value = false
    }
}

const getDefaultMessage = () => {
    const type = props.itemType || 'item'
    return `Are you sure you want to delete this ${type}? This action cannot be undone.`
}

const getItemIcon = () => {
    if (!props.item) return DocumentTextIcon

    const iconMap = {
        'event': CalendarDaysIcon,
        'user': UsersIcon,
        'committee': BuildingOfficeIcon,
        'delegation': UserGroupIcon,
        'document': DocumentTextIcon,
        'message': ChatBubbleLeftRightIcon,
        'report': ClipboardDocumentListIcon,
        'setting': CogIcon
    }

    return iconMap[props.itemType] || iconMap[props.item.type] || DocumentTextIcon
}

const getItemTitle = () => {
    if (!props.item) return 'Unknown Item'
    return props.item.name || props.item.title || props.item.email || props.item.id || 'Unnamed Item'
}

const getItemSubtitle = () => {
    if (!props.item) return null

    // Different subtitle based on item type
    switch (props.itemType) {
        case 'event':
            return props.item.eventType ? `${props.item.eventType} • ${formatDate(props.item.startDate)}` : null
        case 'user':
            return props.item.role ? `${props.item.role} • ${props.item.email}` : props.item.email
        case 'committee':
            return props.item.acronym || null
        case 'delegation':
            return props.item.country || null
        default:
            return props.item.description || props.item.subtitle || null
    }
}

const getItemBadge = () => {
    if (!props.item) return null
    return props.item.status || props.item.type || null
}

const getItemBadgeClasses = () => {
    const status = props.item?.status?.toLowerCase()

    const classMap = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'published': 'bg-blue-100 text-blue-800',
        'draft': 'bg-gray-100 text-gray-800',
        'cancelled': 'bg-red-100 text-red-800',
        'completed': 'bg-purple-100 text-purple-800'
    }

    return classMap[status] || 'bg-gray-100 text-gray-800'
}

const getItemCount = () => {
    if (!props.item) return null

    switch (props.itemType) {
        case 'event':
            return props.item.stats?.totalRegistrations || props.item.participantCount
        case 'committee':
            return props.item.memberCount || props.item.delegateCount
        case 'delegation':
            return props.item.memberCount
        case 'user':
            return props.item.eventCount || props.item.sessionCount
        default:
            return null
    }
}

const getItemCountLabel = () => {
    switch (props.itemType) {
        case 'event':
            return 'Registrations'
        case 'committee':
            return 'Members'
        case 'delegation':
            return 'Delegates'
        case 'user':
            return 'Events'
        default:
            return 'Count'
    }
}

const getDependencyIcon = (type) => {
    const iconMap = {
        'event': CalendarDaysIcon,
        'user': UsersIcon,
        'committee': BuildingOfficeIcon,
        'delegation': UserGroupIcon,
        'document': DocumentTextIcon,
        'message': ChatBubbleLeftRightIcon,
        'registration': ClipboardDocumentListIcon
    }

    return iconMap[type] || DocumentTextIcon
}

const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

// Reset form when modal opens/closes
watch(() => props.modelValue, (newVal) => {
    if (!newVal) {
        resetForm()
    }
})
</script>

<style scoped>
/* Modal animations */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

/* Custom checkbox styling */
input[type="checkbox"]:checked {
    background-color: #dc2626;
    border-color: #dc2626;
}

input[type="checkbox"]:focus {
    ring-color: #dc2626;
}

/* Code styling */
code {
    font-size: 0.875rem;
    font-weight: 600;
}
</style>