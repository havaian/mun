<!-- frontend/src/components/shared/CountryFlag.vue -->
<template>
    <div class="country-flag-container" :class="containerClasses" @click="handleClick" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <!-- Flag Image -->
        <div class="flag-wrapper" :class="flagWrapperClasses">
            <img v-if="flagUrl" :src="flagUrl" :alt="`Flag of ${displayName}`" :class="flagClasses" @load="onFlagLoad"
                @error="onFlagError" loading="lazy" />

            <!-- Fallback/Loading -->
            <div v-else :class="fallbackClasses" :title="displayName">
                <span class="flag-fallback-text">
                    {{ flagFallbackText }}
                </span>
            </div>
        </div>

        <!-- Country Name (if showName) -->
        <div v-if="showName" class="country-name" :class="nameClasses">
            <span class="country-name-text" :title="fullCountryName">
                {{ displayName }}
            </span>

            <!-- Additional info -->
            <span v-if="showCode && countryCode" class="country-code">
                ({{ countryCode.toUpperCase() }})
            </span>
        </div>

        <!-- Status indicators -->
        <div v-if="showStatus" class="status-indicators">
            <!-- Online/Presence status -->
            <div v-if="isOnline !== null" class="status-dot" :class="onlineStatusClass"
                :title="isOnline ? 'Online' : 'Offline'" />

            <!-- Voting status -->
            <div v-if="votingStatus" class="voting-status" :class="votingStatusClass" :title="votingStatusTitle">
                <CheckIcon v-if="votingStatus === 'voted'" class="w-3 h-3" />
                <ClockIcon v-else-if="votingStatus === 'pending'" class="w-3 h-3" />
                <XMarkIcon v-else-if="votingStatus === 'abstained'" class="w-3 h-3" />
            </div>

            <!-- Special roles -->
            <div v-if="specialRole" class="special-role" :class="specialRoleClass" :title="specialRoleTitle">
                {{ specialRoleIcon }}
            </div>
        </div>

        <!-- Hover card (if enabled) -->
        <div v-if="showHoverCard && isHovered" class="flag-hover-card" :class="hoverCardClasses">
            <div class="hover-card-content">
                <div class="font-semibold">{{ fullCountryName }}</div>
                <div v-if="countryCode" class="text-sm text-mun-gray-600">
                    Code: {{ countryCode.toUpperCase() }}
                </div>
                <div v-if="delegateInfo" class="text-sm text-mun-gray-600 mt-1">
                    Delegate: {{ delegateInfo }}
                </div>
                <div v-if="committeeInfo" class="text-sm text-mun-gray-600">
                    Committee: {{ committeeInfo }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { CheckIcon, ClockIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useFlagsStore } from '@/stores/flags'

// Props
const props = defineProps({
    // Country identification
    countryName: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        default: ''
    },

    // Display options
    size: {
        type: String,
        default: 'medium', // tiny, small, medium, large, xl
        validator: (value) => ['tiny', 'small', 'medium', 'large', 'xl'].includes(value)
    },
    shape: {
        type: String,
        default: 'rectangular', // rectangular, square, circular
        validator: (value) => ['rectangular', 'square', 'circular'].includes(value)
    },
    showName: {
        type: Boolean,
        default: false
    },
    showCode: {
        type: Boolean,
        default: false
    },
    namePosition: {
        type: String,
        default: 'bottom', // bottom, right, overlay
        validator: (value) => ['bottom', 'right', 'overlay'].includes(value)
    },
    maxNameLength: {
        type: Number,
        default: 20
    },

    // Status and interaction
    showStatus: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: null
    },
    votingStatus: {
        type: String,
        default: '', // voted, pending, abstained, absent
        validator: (value) => ['', 'voted', 'pending', 'abstained', 'absent'].includes(value)
    },
    specialRole: {
        type: String,
        default: '', // observer, security-council, president, etc.
    },

    // Hover functionality
    showHoverCard: {
        type: Boolean,
        default: false
    },
    delegateInfo: {
        type: String,
        default: ''
    },
    committeeInfo: {
        type: String,
        default: ''
    },

    // Styling
    variant: {
        type: String,
        default: 'default', // default, bordered, shadow, minimal
        validator: (value) => ['default', 'bordered', 'shadow', 'minimal'].includes(value)
    },
    clickable: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['click', 'flag-loaded', 'flag-error'])

// Stores
const flagsStore = useFlagsStore()

// State
const flagUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)
const isHovered = ref(false)

// Computed
const fullCountryName = computed(() => {
    return props.countryName || 'Unknown Country'
})

const displayName = computed(() => {
    const name = fullCountryName.value
    if (props.maxNameLength && name.length > props.maxNameLength) {
        return name.substring(0, props.maxNameLength - 3) + '...'
    }
    return name
})

const flagFallbackText = computed(() => {
    const words = fullCountryName.value.split(' ')
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase()
    }
    return words.map(word => word[0]).join('').substring(0, 3).toUpperCase()
})

// Style classes
const containerClasses = computed(() => {
    const base = 'country-flag-container relative'
    const layout = props.namePosition === 'right' ? 'flex items-center space-x-2' : 'inline-block'
    const clickable = props.clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''

    return `${base} ${layout} ${clickable}`
})

const flagWrapperClasses = computed(() => {
    const base = 'flag-wrapper relative overflow-hidden'
    const sizeClasses = {
        tiny: 'w-4 h-3',
        small: 'w-6 h-4',
        medium: 'w-8 h-6',
        large: 'w-12 h-8',
        xl: 'w-16 h-12'
    }

    const shapeClasses = {
        rectangular: 'rounded-sm',
        square: 'rounded-sm aspect-square',
        circular: 'rounded-full aspect-square'
    }

    const variantClasses = {
        default: '',
        bordered: 'border border-mun-gray-300',
        shadow: 'shadow-sm',
        minimal: ''
    }

    return `${base} ${sizeClasses[props.size]} ${shapeClasses[props.shape]} ${variantClasses[props.variant]}`
})

const flagClasses = computed(() => {
    const base = 'flag-image w-full h-full object-cover'
    const shape = props.shape === 'circular' ? 'rounded-full' : ''

    return `${base} ${shape}`
})

const fallbackClasses = computed(() => {
    const base = 'flag-fallback w-full h-full flex items-center justify-center bg-mun-gray-100 text-mun-gray-600'
    const shape = props.shape === 'circular' ? 'rounded-full' : 'rounded-sm'

    return `${base} ${shape}`
})

const nameClasses = computed(() => {
    const base = 'country-name'
    const sizeClasses = {
        tiny: 'text-xs',
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base',
        xl: 'text-lg'
    }

    const positionClasses = {
        bottom: 'mt-1 text-center',
        right: 'text-left',
        overlay: 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white px-1 py-0.5 text-xs'
    }

    return `${base} ${sizeClasses[props.size]} ${positionClasses[props.namePosition]}`
})

const onlineStatusClass = computed(() => {
    const base = 'w-2 h-2 rounded-full'
    return props.isOnline
        ? `${base} bg-green-400 shadow-sm`
        : `${base} bg-mun-gray-400`
})

const votingStatusClass = computed(() => {
    const statusClasses = {
        voted: 'bg-green-100 text-green-600',
        pending: 'bg-amber-100 text-amber-600',
        abstained: 'bg-mun-gray-100 text-mun-gray-600',
        absent: 'bg-red-100 text-red-600'
    }

    return `inline-flex items-center justify-center w-4 h-4 rounded-full text-xs ${statusClasses[props.votingStatus] || ''}`
})

const votingStatusTitle = computed(() => {
    const titles = {
        voted: 'Has voted',
        pending: 'Vote pending',
        abstained: 'Abstained',
        absent: 'Absent'
    }

    return titles[props.votingStatus] || ''
})

const specialRoleClass = computed(() => {
    const base = 'inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold'

    const roleClasses = {
        observer: 'bg-blue-100 text-blue-600',
        'security-council': 'bg-red-100 text-red-600',
        president: 'bg-yellow-100 text-yellow-600',
        chair: 'bg-purple-100 text-purple-600'
    }

    return `${base} ${roleClasses[props.specialRole] || 'bg-mun-gray-100 text-mun-gray-600'}`
})

const specialRoleIcon = computed(() => {
    const icons = {
        observer: 'O',
        'security-council': 'SC',
        president: 'P',
        chair: 'C'
    }

    return icons[props.specialRole] || '?'
})

const specialRoleTitle = computed(() => {
    const titles = {
        observer: 'Observer',
        'security-council': 'Security Council Member',
        president: 'President',
        chair: 'Chairperson'
    }

    return titles[props.specialRole] || props.specialRole
})

const hoverCardClasses = computed(() => {
    const base = 'flag-hover-card absolute z-50 bg-white border border-mun-gray-200 rounded-lg shadow-lg p-3 min-w-48'
    const position = 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'

    return `${base} ${position}`
})

// Methods
const loadFlag = () => {
    try {
        isLoading.value = true
        hasError.value = false

        if (props.countryCode && flagsStore.isInitialized) {
            // Try to get flag from store
            const url = flagsStore.getFlagUrl(props.countryCode)

            if (url && url.startsWith('data:')) {
                flagUrl.value = url
                isLoading.value = false
                return
            }
        }

        // Fallback to API endpoint
        const code = props.countryCode?.toLowerCase() ||
            props.countryName?.replace(/\s+/g, '-').toLowerCase()

        if (code) {
            flagUrl.value = `/api/countries/flags/${code}`
        } else {
            hasError.value = true
            console.log('❌ No country code available for:', props.countryName)
        }

    } catch (error) {
        console.warn('🚨 Flag loading error:', error)
        hasError.value = true
    } finally {
        isLoading.value = false
    }
}

const onFlagLoad = () => {
    hasError.value = false
    emit('flag-loaded', {
        countryName: props.countryName,
        countryCode: props.countryCode,
        flagUrl: flagUrl.value
    })
}

const onFlagError = () => {
    hasError.value = true
    // Don't clear flagUrl immediately to avoid flashing

    emit('flag-error', {
        countryName: props.countryName,
        countryCode: props.countryCode
    })

    // Try fallback after a short delay
    setTimeout(() => {
        if (hasError.value) {
            flagUrl.value = ''
        }
    }, 100)
}

const handleClick = () => {
    if (props.clickable) {
        emit('click', {
            countryName: props.countryName,
            countryCode: props.countryCode
        })
    }
}

const handleMouseEnter = () => {
    if (props.showHoverCard) {
        isHovered.value = true
    }
}

const handleMouseLeave = () => {
    isHovered.value = false
}

// Watch for country code changes
watch(() => props.countryCode, () => {
    loadFlag()
}, { immediate: false })

// Watch for flag store initialization
watch(() => flagsStore.isInitialized, (isInit) => {
    if (isInit && props.countryCode) {
        loadFlag()
    }
})

// Lifecycle
onMounted(() => {
    loadFlag()
})
</script>

<style scoped>
.country-flag-container {
    display: inline-block;
}

.flag-fallback-text {
    font-size: 0.6em;
    font-weight: 600;
    letter-spacing: 0.05em;
}

.status-indicators {
    position: absolute;
    top: -2px;
    right: -2px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.status-dot {
    box-shadow: 0 0 0 2px white;
}

.flag-hover-card::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid white;
}

.country-name-text {
    display: block;
    font-weight: 500;
}

.country-code {
    font-size: 0.85em;
    color: rgb(107 114 128);
    margin-left: 0.25rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .flag-hover-card {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 90vw;
    }

    .flag-hover-card::before {
        display: none;
    }
}
</style>