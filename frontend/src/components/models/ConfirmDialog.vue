<template>
    <div class="max-w-md mx-auto">
        <div class="p-6">
            <!-- Icon -->
            <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full" :class="iconClasses">
                <component :is="icon" class="w-8 h-8" />
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
                {{ title }}
            </h3>

            <!-- Message -->
            <p class="text-sm text-gray-600 text-center mb-6">
                {{ message }}
            </p>

            <!-- Additional Details -->
            <div v-if="details" class="mb-6 p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-700">{{ details }}</p>
            </div>

            <!-- Actions -->
            <div class="flex space-x-3">
                <button @click="handleCancel" :disabled="isLoading" class="btn-secondary flex-1">
                    {{ cancelText }}
                </button>
                <button @click="handleConfirm" :disabled="isLoading" :class="[
                    'flex-1',
                    confirmType === 'danger' ? 'btn-danger' : 'btn-primary'
                ]">
                    <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    {{ isLoading ? 'Processing...' : confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['confirm', 'cancel'])
const props = defineProps({
    title: {
        type: String,
        default: 'Confirm Action'
    },
    message: {
        type: String,
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    confirmText: {
        type: String,
        default: 'Confirm'
    },
    cancelText: {
        type: String,
        default: 'Cancel'
    },
    confirmType: {
        type: String,
        default: 'primary',
        validator: value => ['primary', 'danger'].includes(value)
    },
    asyncAction: {
        type: Boolean,
        default: false
    }
})

const isLoading = ref(false)

const icon = computed(() => {
    if (props.confirmType === 'danger') {
        return {
            template: `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      `
        }
    }

    return {
        template: `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    `
    }
})

const iconClasses = computed(() => {
    if (props.confirmType === 'danger') {
        return 'bg-red-100 text-red-600'
    }
    return 'bg-blue-100 text-blue-600'
})

async function handleConfirm() {
    if (props.asyncAction) {
        isLoading.value = true
        try {
            await emit('confirm')
        } finally {
            isLoading.value = false
        }
    } else {
        emit('confirm')
    }
}

function handleCancel() {
    if (isLoading.value) return
    emit('cancel')
}

// Handle escape key
function handleKeydown(event) {
    if (event.key === 'Escape' && !isLoading.value) {
        handleCancel()
    } else if (event.key === 'Enter' && !isLoading.value) {
        handleConfirm()
    }
}

// Add event listener for keyboard shortcuts
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
})
</script>