<template>
    <div>
        <!-- Current image preview -->
        <div v-if="modelValue" class="flex items-center gap-3 mb-2">
            <div :class="[
                'overflow-hidden bg-mun-gray-50 border border-mun-gray-200 flex-shrink-0',
                shape === 'circle' ? 'rounded-full' : 'rounded-xl',
                sizeClasses
            ]">
                <img :src="modelValue" alt="Uploaded image" class="w-full h-full object-cover" />
            </div>
            <button type="button" @click="removeImage"
                class="text-xs text-red-500 hover:text-red-700 transition-colors">
                Remove
            </button>
        </div>

        <!-- Upload zone -->
        <label v-if="!modelValue" :class="[
            'flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-colors',
            isDragOver
                ? 'border-mun-blue bg-mun-blue-50'
                : 'border-mun-gray-200 hover:border-mun-gray-300 bg-mun-gray-50/50',
            compact ? 'px-4 py-4' : 'px-6 py-6'
        ]" @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false" @drop.prevent="handleDrop">
            <ArrowUpTrayIcon v-if="!isUploading"
                :class="['mb-1.5', isDragOver ? 'text-mun-blue' : 'text-mun-gray-400', compact ? 'w-5 h-5' : 'w-6 h-6']" />
            <LoadingSpinner v-else class="w-5 h-5 mb-1.5" />
            <p :class="['font-medium', compact ? 'text-xs' : 'text-sm']">
                <span class="text-mun-blue">{{ isUploading ? 'Uploading...' : 'Upload image' }}</span>
                <span v-if="!isUploading && !compact" class="text-mun-gray-500"> or drag and drop</span>
            </p>
            <p v-if="!compact" class="text-xs text-mun-gray-400 mt-0.5">JPEG, PNG, WebP up to 5MB</p>
            <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp,image/gif"
                @change="handleFileSelect" :disabled="isUploading" />
        </label>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import { apiMethods } from '@/utils/api'

const props = defineProps({
    modelValue: { type: String, default: null },
    shape: { type: String, default: 'square' }, // 'square' | 'circle'
    compact: { type: Boolean, default: false },
    sizeClasses: { type: String, default: 'w-16 h-16' }
})

const emit = defineEmits(['update:modelValue'])

const isUploading = ref(false)
const isDragOver = ref(false)

const upload = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
        window.toast?.error('Image must be under 5MB')
        return
    }
    if (!file.type.startsWith('image/')) {
        window.toast?.error('Only image files are allowed')
        return
    }

    isUploading.value = true
    try {
        const res = await apiMethods.media.upload(file)
        if (res.data.success) {
            emit('update:modelValue', res.data.url)
        }
    } catch (e) {
        window.toast?.error('Failed to upload image')
        console.error('Upload error:', e)
    } finally {
        isUploading.value = false
    }
}

const handleFileSelect = (event) => {
    upload(event.target.files?.[0])
}

const handleDrop = (event) => {
    isDragOver.value = false
    upload(event.dataTransfer.files?.[0])
}

const removeImage = () => {
    emit('update:modelValue', null)
}
</script>