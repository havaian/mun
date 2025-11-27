// frontend/src/stores/flags.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

export const useFlagsStore = defineStore('flags', () => {
    const toast = useToast()

    // State
    const flags = ref(new Map()) // Map<countryCode, svgContent>
    const isLoading = ref(false)
    const isInitialized = ref(false)
    const lastFetched = ref(null)
    const error = ref(null)

    // Cache duration: 1 hour
    const CACHE_DURATION = 60 * 60 * 1000

    // Computed
    const flagCount = computed(() => flags.value.size)

    const isCacheValid = computed(() => {
        if (!lastFetched.value) return false
        return Date.now() - lastFetched.value < CACHE_DURATION
    })

    // Actions
    const initializeFlags = async (force = false) => {
        // Skip if already initialized and cache is valid, unless forced
        if (isInitialized.value && isCacheValid.value && !force) {
            return true
        }

        try {
            isLoading.value = true
            error.value = null

            console.log('Fetching flags batch...')

            const response = await apiMethods.countries.getAllFlagsBatch()

            if (response.data.success && response.data.flags) {
                // Clear existing flags
                flags.value.clear()

                // Populate flag cache
                Object.entries(response.data.flags).forEach(([countryCode, svgContent]) => {
                    flags.value.set(countryCode.toLowerCase(), svgContent)
                })

                lastFetched.value = Date.now()
                isInitialized.value = true

                console.log(`Flags initialized: ${flags.value.size} flags cached`)

                return true
            } else {
                throw new Error('Invalid response format')
            }

        } catch (err) {
            console.error('Failed to initialize flags:', err)
            error.value = err

            // Don't show toast error on initial load to avoid spamming user
            if (force) {
                toast.error('Failed to refresh flags')
            }

            return false
        } finally {
            isLoading.value = false
        }
    }

    const getFlag = (countryCode) => {
        if (!countryCode) return null

        const code = countryCode.toLowerCase()
        return flags.value.get(code) || null
    }

    const getFlagUrl = (countryCode) => {
        if (!countryCode) return null

        const code = countryCode.toLowerCase()

        // If we have the flag in cache, create data URL
        const flagSvg = flags.value.get(code)
        if (flagSvg) {
            return `data:image/svg+xml;base64,${btoa(flagSvg)}`
        }

        // Fallback to API endpoint
        return `/api/countries/flags/${code}`
    }

    const hasFlag = (countryCode) => {
        if (!countryCode) return false
        return flags.value.has(countryCode.toLowerCase())
    }

    const refreshFlags = async () => {
        return await initializeFlags(true)
    }

    const clearCache = () => {
        flags.value.clear()
        isInitialized.value = false
        lastFetched.value = null
        error.value = null
    }

    const getStats = () => {
        return {
            flagCount: flags.value.size,
            isInitialized: isInitialized.value,
            lastFetched: lastFetched.value,
            cacheValid: isCacheValid.value,
            hasError: !!error.value
        }
    }

    // Preload flags for specific countries (useful for performance)
    const preloadFlags = async (countryCodes) => {
        const missing = countryCodes.filter(code => !hasFlag(code))

        if (missing.length === 0) return true

        // If we have some missing flags and cache is not initialized, 
        // initialize the full cache instead
        if (!isInitialized.value) {
            return await initializeFlags()
        }

        // For individual missing flags, we could fetch them individually
        // but for now, we'll just use the full cache
        return true
    }

    return {
        // State
        flags: computed(() => flags.value),
        isLoading: computed(() => isLoading.value),
        isInitialized: computed(() => isInitialized.value),
        lastFetched: computed(() => lastFetched.value),
        error: computed(() => error.value),

        // Getters
        flagCount,
        isCacheValid,

        // Actions
        initializeFlags,
        getFlag,
        getFlagUrl,
        hasFlag,
        refreshFlags,
        clearCache,
        getStats,
        preloadFlags
    }
})