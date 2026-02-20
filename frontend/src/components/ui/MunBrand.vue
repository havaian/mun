<template>
    <!-- Top bar variant -->
    <div v-if="variant === 'top'"
        :class="[
            transparent
                ? 'absolute top-0 left-0 right-0 z-20'
                : 'bg-mun-blue-950 border-b border-white/5'
        ]">
        <div class="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between">
            <a href="https://mun.uz" target="_blank" rel="noopener"
                class="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors">
                <img src="/logo.svg" alt="" class="w-5 h-5" />
                <span class="text-xs font-bold tracking-wider">MUN.UZ</span>
            </a>
            <a href="https://mun.uz" target="_blank" rel="noopener"
                class="text-[10px] text-white/30 hover:text-white/60 transition-colors">
                Conference Management Platform
            </a>
        </div>
    </div>

    <!-- Footer variant -->
    <div v-else-if="variant === 'footer'"
        class="border-t border-mun-gray-100 bg-mun-gray-50">
        <div class="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <slot>
                <p class="text-xs text-mun-gray-400">{{ leftText }}</p>
            </slot>
            <a href="https://mun.uz" target="_blank" rel="noopener"
                class="flex items-center gap-1.5 text-xs text-mun-gray-400 hover:text-mun-blue transition-colors">
                Powered by
                <img src="/logo.svg" alt="" class="w-4 h-4" />
                <span class="font-bold text-mun-gray-500 hover:text-mun-blue">MUN.UZ</span>
            </a>
        </div>
    </div>
</template>

<script setup>
defineProps({
    variant: { type: String, default: 'footer' }, // 'top' | 'footer'
    transparent: { type: Boolean, default: false },
    leftText: { type: String, default: '' }
})
</script>