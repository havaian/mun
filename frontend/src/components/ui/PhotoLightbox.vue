<template>
    <Teleport to="body">
        <Transition name="lightbox">
            <div v-if="modelValue !== null" class="fixed inset-0 z-[9999] flex items-center justify-center"
                @click.self="close" @keydown.esc="close" @keydown.left="prev" @keydown.right="next" tabindex="0"
                ref="lightboxRef">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>

                <!-- Close button -->
                <button @click="close"
                    class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <XMarkIcon class="w-5 h-5" />
                </button>

                <!-- Counter -->
                <div v-if="photos.length > 1"
                    class="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
                    {{ currentIndex + 1 }} / {{ photos.length }}
                </div>

                <!-- Previous -->
                <button v-if="photos.length > 1" @click.stop="prev"
                    class="absolute left-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <ChevronLeftIcon class="w-5 h-5" />
                </button>

                <!-- Image -->
                <div class="relative z-[1] max-w-[90vw] max-h-[85vh] flex items-center justify-center" @click.stop>
                    <img :src="currentPhoto" alt=""
                        class="max-w-full max-h-[85vh] object-contain rounded-lg select-none" draggable="false" />
                </div>

                <!-- Next -->
                <button v-if="photos.length > 1" @click.stop="next"
                    class="absolute right-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <ChevronRightIcon class="w-5 h-5" />
                </button>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    modelValue: { type: Number, default: null }, // null = closed, number = active index
    photos: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const lightboxRef = ref(null)
const currentIndex = computed(() => props.modelValue ?? 0)
const currentPhoto = computed(() => props.photos[currentIndex.value] || '')

const close = () => emit('update:modelValue', null)

const prev = () => {
    if (props.photos.length <= 1) return
    const idx = currentIndex.value <= 0 ? props.photos.length - 1 : currentIndex.value - 1
    emit('update:modelValue', idx)
}

const next = () => {
    if (props.photos.length <= 1) return
    const idx = currentIndex.value >= props.photos.length - 1 ? 0 : currentIndex.value + 1
    emit('update:modelValue', idx)
}

// Auto-focus for keyboard events
watch(() => props.modelValue, (v) => {
    if (v !== null) {
        nextTick(() => lightboxRef.value?.focus())
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
    }
})
</script>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
    transition: opacity 0.2s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
    opacity: 0;
}
</style>