<template>
    <div class="p-4 bg-white border rounded-lg">
        <h3 class="font-bold mb-4">🏳️ Flag Debug Test</h3>

        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <strong>Store Status:</strong>
                <div class="text-sm">
                    <div>Initialized: {{ flagsStore.isInitialized ? '✅' : '❌' }}</div>
                    <div>Flag Count: {{ flagsStore.flagCount }}</div>
                    <div>Loading: {{ flagsStore.isLoading ? '🔄' : '✅' }}</div>
                </div>
            </div>

            <div>
                <strong>Test Country: {{ testCountry }}</strong>
                <div class="text-sm">
                    <div>Has Flag: {{ flagsStore.hasFlag(testCountry) ? '✅' : '❌' }}</div>
                    <div>Raw SVG Length: {{ rawSvg?.length || 0 }} chars</div>
                </div>
            </div>
        </div>

        <!-- Test different approaches -->
        <div class="space-y-4">
            <div>
                <strong>1. Flag Store Data URL:</strong>
                <div class="flex items-center space-x-2">
                    <img v-if="storeUrl" :src="storeUrl" class="w-8 h-6 border" alt="Store URL" />
                    <span v-else class="text-red-500">❌ No URL</span>
                    <code class="text-xs bg-gray-100 p-1">{{ storeUrl?.substring(0, 50) }}...</code>
                </div>
            </div>

            <div>
                <strong>2. Manual Base64:</strong>
                <div class="flex items-center space-x-2">
                    <img v-if="manualBase64" :src="manualBase64" class="w-8 h-6 border" alt="Manual Base64" />
                    <span v-else class="text-red-500">❌ Failed</span>
                </div>
            </div>

            <div>
                <strong>3. URL Encode:</strong>
                <div class="flex items-center space-x-2">
                    <img v-if="urlEncoded" :src="urlEncoded" class="w-8 h-6 border" alt="URL Encoded" />
                    <span v-else class="text-red-500">❌ Failed</span>
                </div>
            </div>

            <div>
                <strong>4. Direct API:</strong>
                <div class="flex items-center space-x-2">
                    <img :src="`/api/countries/flags/${testCountry}`" class="w-8 h-6 border" alt="Direct API" />
                    <span class="text-xs text-gray-500">Should work as fallback</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <button @click="refreshTest" class="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                Refresh Test
            </button>
            <button @click="testCountry = 'fr'" class="px-3 py-1 bg-green-500 text-white rounded text-sm ml-2">
                Test France
            </button>
            <button @click="testCountry = 'us'" class="px-3 py-1 bg-red-500 text-white rounded text-sm ml-2">
                Test USA
            </button>
        </div>

        <!-- Raw SVG Preview -->
        <div v-if="rawSvg" class="mt-4">
            <strong>Raw SVG Preview:</strong>
            <div class="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {{ rawSvg.substring(0, 500) }}...
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFlagsStore } from '@/stores/flags'

const flagsStore = useFlagsStore()
const testCountry = ref('af') // Afghanistan

// Get raw SVG
const rawSvg = computed(() => flagsStore.getFlag(testCountry.value))

// Test store URL
const storeUrl = computed(() => flagsStore.getFlagUrl(testCountry.value))

// Manual base64 encoding
const manualBase64 = computed(() => {
    if (!rawSvg.value) return null

    try {
        // Try different encoding approaches
        const base64 = btoa(unescape(encodeURIComponent(rawSvg.value)))
        return `data:image/svg+xml;base64,${base64}`
    } catch (error) {
        console.error('Manual base64 error:', error)
        return null
    }
})

// URL encode approach
const urlEncoded = computed(() => {
    if (!rawSvg.value) return null

    try {
        const encoded = encodeURIComponent(rawSvg.value)
        return `data:image/svg+xml;utf8,${encoded}`
    } catch (error) {
        console.error('URL encode error:', error)
        return null
    }
})

const refreshTest = () => {
    console.log('🧪 Refreshing flag test for:', testCountry.value)
    console.log('Store initialized:', flagsStore.isInitialized)
    console.log('Has flag:', flagsStore.hasFlag(testCountry.value))
    console.log('Raw SVG length:', rawSvg.value?.length)
    console.log('Store URL:', storeUrl.value)
}

onMounted(() => {
    // Initialize flags if not done
    if (!flagsStore.isInitialized) {
        flagsStore.initializeFlags()
    }

    refreshTest()
})
</script>