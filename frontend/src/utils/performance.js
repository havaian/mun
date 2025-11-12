// frontend/src/utils/performance.js

// Advanced in-memory cache with TTL and size limits
class AdvancedCache {
    constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes default
        this.cache = new Map()
        this.maxSize = maxSize
        this.defaultTTL = defaultTTL
        this.hitCount = 0
        this.missCount = 0

        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60000)
    }

    get(key) {
        const item = this.cache.get(key)

        if (!item) {
            this.missCount++
            return null
        }

        // Check TTL
        if (Date.now() - item.timestamp > (item.ttl || this.defaultTTL)) {
            this.cache.delete(key)
            this.missCount++
            return null
        }

        this.hitCount++

        // Update access time for LRU
        item.accessTime = Date.now()

        return item.data
    }

    set(key, data, ttl = null) {
        // Remove oldest entries if at capacity
        if (this.cache.size >= this.maxSize) {
            this.evictLRU()
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            accessTime: Date.now(),
            ttl: ttl || this.defaultTTL,
            size: this.estimateSize(data)
        })
    }

    delete(key) {
        return this.cache.delete(key)
    }

    clear() {
        this.cache.clear()
        this.hitCount = 0
        this.missCount = 0
    }

    // Evict least recently used item
    evictLRU() {
        let oldestKey = null
        let oldestTime = Date.now()

        for (const [key, item] of this.cache.entries()) {
            if (item.accessTime < oldestTime) {
                oldestTime = item.accessTime
                oldestKey = key
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
        }
    }

    // Clean up expired entries
    cleanup() {
        const now = Date.now()
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > (item.ttl || this.defaultTTL)) {
                this.cache.delete(key)
            }
        }
    }

    // Estimate memory usage of cached data
    estimateSize(data) {
        try {
            return JSON.stringify(data).length * 2 // Rough estimate in bytes
        } catch {
            return 1000 // Fallback estimate
        }
    }

    // Get cache statistics
    getStats() {
        const totalSize = Array.from(this.cache.values()).reduce(
            (sum, item) => sum + (item.size || 0), 0
        )

        const hitRate = this.hitCount + this.missCount > 0
            ? (this.hitCount / (this.hitCount + this.missCount) * 100).toFixed(2)
            : 0

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            totalMemory: `${(totalSize / 1024).toFixed(2)}KB`,
            hitRate: `${hitRate}%`,
            hits: this.hitCount,
            misses: this.missCount
        }
    }

    // Set cache key with namespace
    setNamespaced(namespace, key, data, ttl) {
        this.set(`${namespace}:${key}`, data, ttl)
    }

    getNamespaced(namespace, key) {
        return this.get(`${namespace}:${key}`)
    }

    clearNamespace(namespace) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${namespace}:`)) {
                this.cache.delete(key)
            }
        }
    }
}

// Create global cache instance
export const apiCache = new AdvancedCache(150, 300000) // 150 items, 5 min TTL

// Performance monitoring utilities
export const performanceUtils = {
    // Enhanced debounce with immediate option
    debounce(func, wait, immediate = false) {
        let timeout
        return function executedFunction(...args) {
            const later = () => {
                timeout = null
                if (!immediate) func(...args)
            }

            const callNow = immediate && !timeout
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)

            if (callNow) func(...args)
        }
    },

    // Enhanced throttle with trailing option
    throttle(func, limit, trailing = true) {
        let inThrottle
        let lastFunc
        let lastRan

        return function (...args) {
            const context = this

            if (!inThrottle) {
                func.apply(context, args)
                lastRan = Date.now()
                inThrottle = true
            } else {
                clearTimeout(lastFunc)
                if (trailing) {
                    lastFunc = setTimeout(() => {
                        if (Date.now() - lastRan >= limit) {
                            func.apply(context, args)
                            lastRan = Date.now()
                        }
                    }, limit - (Date.now() - lastRan))
                }
            }
        }
    },

    // Measure function execution time
    measurePerformance(func, name = 'Function') {
        return async function (...args) {
            const start = performance.now()
            const result = await func.apply(this, args)
            const end = performance.now()

            const duration = end - start

            if (duration > 100) { // Log slow operations
                console.warn(`⏱️ Slow ${name}: ${duration.toFixed(2)}ms`)
            } else if (import.meta.env.DEV) {
                console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
            }

            return result
        }
    },

    // Intersection Observer for lazy loading
    createIntersectionObserver(callback, options = {}) {
        const defaultOptions = {
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        }

        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry)
                }
            })
        }, defaultOptions)
    },

    // Preload images
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = src
        })
    },

    // Batch DOM operations
    batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates.forEach(update => update())
                resolve()
            })
        })
    },

    // Monitor memory usage (if available)
    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            }
        }
        return null
    },

    // Local storage with error handling and size limits
    storage: {
        // Safe get with fallback
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key)
                if (item === null) return defaultValue

                const parsed = JSON.parse(item)

                // Check if item has TTL
                if (parsed && parsed._ttl && Date.now() > parsed._ttl) {
                    localStorage.removeItem(key)
                    return defaultValue
                }

                return parsed && parsed._data !== undefined ? parsed._data : parsed
            } catch (error) {
                console.warn(`Failed to get localStorage item "${key}":`, error)
                return defaultValue
            }
        },

        // Safe set with size checking
        set(key, value, ttlMs = null) {
            try {
                const data = ttlMs ? {
                    _data: value,
                    _ttl: Date.now() + ttlMs
                } : value

                const serialized = JSON.stringify(data)

                // Check size (localStorage limit is usually 5-10MB)
                if (serialized.length > 5000000) { // 5MB limit
                    console.warn(`Item "${key}" is too large for localStorage`)
                    return false
                }

                localStorage.setItem(key, serialized)
                return true
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    console.warn('localStorage quota exceeded, clearing old items')
                    this.cleanup()
                    // Try again after cleanup
                    try {
                        localStorage.setItem(key, JSON.stringify(data))
                        return true
                    } catch {
                        return false
                    }
                }
                console.warn(`Failed to set localStorage item "${key}":`, error)
                return false
            }
        },

        // Remove item
        remove(key) {
            try {
                localStorage.removeItem(key)
                return true
            } catch (error) {
                console.warn(`Failed to remove localStorage item "${key}":`, error)
                return false
            }
        },

        // Clear all items
        clear() {
            try {
                localStorage.clear()
                return true
            } catch (error) {
                console.warn('Failed to clear localStorage:', error)
                return false
            }
        },

        // Clean up expired items
        cleanup() {
            const now = Date.now()
            const keysToRemove = []

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                try {
                    const item = JSON.parse(localStorage.getItem(key))
                    if (item && item._ttl && now > item._ttl) {
                        keysToRemove.push(key)
                    }
                } catch {
                    // Skip invalid items
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key))
            console.log(`🧹 Cleaned up ${keysToRemove.length} expired localStorage items`)
        },

        // Get storage usage info
        getUsage() {
            let totalSize = 0
            let itemCount = 0

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                const value = localStorage.getItem(key)
                totalSize += key.length + value.length
                itemCount++
            }

            return {
                items: itemCount,
                size: `${(totalSize / 1024).toFixed(2)}KB`,
                sizeBytes: totalSize
            }
        }
    },

    // Resource loading utilities
    loadScript(src, id = null) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (id && document.getElementById(id)) {
                resolve()
                return
            }

            const script = document.createElement('script')
            script.src = src
            script.onload = resolve
            script.onerror = reject

            if (id) script.id = id

            document.head.appendChild(script)
        })
    },

    loadStylesheet(href, id = null) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (id && document.getElementById(id)) {
                resolve()
                return
            }

            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = href
            link.onload = resolve
            link.onerror = reject

            if (id) link.id = id

            document.head.appendChild(link)
        })
    },

    // Network performance utilities
    async checkNetworkSpeed() {
        const startTime = Date.now()
        const testSize = 100000 // 100KB test

        try {
            // Create a test request to measure speed
            const response = await fetch('/api/ping', {
                method: 'HEAD',
                cache: 'no-cache'
            })

            const endTime = Date.now()
            const duration = endTime - startTime

            // Estimate speed (this is very rough)
            const speedKbps = (testSize * 8) / duration // Kbps

            return {
                latency: duration,
                speed: speedKbps,
                quality: speedKbps > 1000 ? 'good' : speedKbps > 500 ? 'fair' : 'poor'
            }
        } catch (error) {
            return {
                latency: -1,
                speed: -1,
                quality: 'error'
            }
        }
    },

    // Animation frame utilities
    animationFrame: {
        // RAF-based timeout
        timeout(callback, delay) {
            const start = performance.now()

            function frame(now) {
                if (now - start >= delay) {
                    callback()
                } else {
                    requestAnimationFrame(frame)
                }
            }

            requestAnimationFrame(frame)
        },

        // RAF-based interval
        interval(callback, delay) {
            let lastTime = 0
            let running = true

            function frame(now) {
                if (now - lastTime >= delay) {
                    callback()
                    lastTime = now
                }

                if (running) {
                    requestAnimationFrame(frame)
                }
            }

            requestAnimationFrame(frame)

            return () => { running = false }
        }
    },

    // Component performance tracking
    trackComponentRender(componentName) {
        const start = performance.now()

        return () => {
            const end = performance.now()
            const duration = end - start

            if (duration > 50) { // Log slow renders
                console.warn(`🐌 Slow render: ${componentName} took ${duration.toFixed(2)}ms`)
            }

            return duration
        }
    },

    // Bundle analysis utilities (development only)
    analyzeBundleSize() {
        if (import.meta.env.DEV && performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource')

            const jsFiles = resources.filter(r => r.name.endsWith('.js'))
            const cssFiles = resources.filter(r => r.name.endsWith('.css'))

            const totalJSSize = jsFiles.reduce((sum, file) => sum + (file.transferSize || 0), 0)
            const totalCSSSize = cssFiles.reduce((sum, file) => sum + (file.transferSize || 0), 0)

            console.log('📊 Bundle Analysis:', {
                jsFiles: jsFiles.length,
                cssFiles: cssFiles.length,
                totalJSSize: `${(totalJSSize / 1024).toFixed(2)}KB`,
                totalCSSSize: `${(totalCSSSize / 1024).toFixed(2)}KB`,
                largestJS: jsFiles.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0]?.name
            })
        }
    }
}

// Initialize performance monitoring for development
if (import.meta.env.DEV) {
    // Clean up localStorage on app start
    performanceUtils.storage.cleanup()

    // Log performance info
    setTimeout(() => {
        performanceUtils.analyzeBundleSize()
        console.log('💾 Cache stats:', apiCache.getStats())
        console.log('💾 Storage usage:', performanceUtils.storage.getUsage())

        const memInfo = performanceUtils.getMemoryInfo()
        if (memInfo) {
            console.log('🧠 Memory usage:', memInfo)
        }
    }, 2000)
}

export default performanceUtils