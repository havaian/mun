<template>
    <div :class="[
        'bg-white backdrop-blur-sm rounded-xl border border-white/20 p-4 transition-all duration-300',
        'hover:bg-white/90 hover:shadow-mun hover:transform'
    ]">
        <!-- Card Header -->
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
                <img v-if="flagUrl" :src="flagUrl" :alt="title" class="w-5 h-3 rounded-sm object-cover"
                    @error="handleFlagError" />
                <div v-else :class="[
                    'w-5 h-3 rounded-sm flex items-center justify-center',
                    color === 'red' ? 'bg-red-500' : 'bg-mun-blue'
                ]">
                    <component :is="color === 'red' ? ShieldCheckIcon : FlagIcon" class="w-3 h-3 text-white" />
                </div>

                <div>
                    <h4 class="text-sm font-semibold text-mun-gray-900 truncate">{{ title }}</h4>
                    <p class="text-xs text-mun-gray-500">{{ subtitle }}</p>
                </div>
            </div>

            <button @click="$emit('regenerate')" class="p-1 rounded-lg hover:bg-mun-gray-100 transition-colors"
                title="Regenerate QR Code">
                <ArrowPathIcon class="w-4 h-4 text-mun-gray-500" />
            </button>
        </div>

        <!-- QR Code Display -->
        <div class="flex justify-center mb-3">
            <div :class="[
                'w-24 h-24 rounded-lg border-2 flex items-center justify-center',
                qrData
                    ? 'border-mun-green-200 bg-mun-green-50'
                    : 'border-mun-gray-200 bg-mun-gray-50'
            ]">
                <div v-if="qrData" ref="qrContainer" class="w-20 h-20"></div>
                <div v-else class="text-center">
                    <QrCodeIcon class="w-8 h-8 text-mun-gray-400 mx-auto mb-1" />
                    <span class="text-xs text-mun-gray-500">No QR</span>
                </div>
            </div>
        </div>

        <!-- Status Indicator -->
        <div class="flex items-center justify-center space-x-2">
            <div :class="[
                'w-2 h-2 rounded-full',
                qrData ? 'bg-mun-green animate-pulse' : 'bg-mun-gray-400'
            ]"></div>
            <span :class="[
                'text-xs font-medium',
                qrData ? 'text-mun-green-700' : 'text-mun-gray-500'
            ]">
                {{ qrData ? 'Generated' : 'Not Generated' }}
            </span>
        </div>

        <!-- Token Info (for debugging) -->
        <div v-if="showTokenInfo && qrData" class="mt-2 p-2 bg-mun-gray-50 rounded-lg">
            <p class="text-xs text-mun-gray-600 font-mono truncate">
                {{ qrData.substring(0, 16) }}...
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import {
    QrCodeIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
    FlagIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    title: {
        type: String,
        required: true
    },

    subtitle: {
        type: String,
        required: true
    },

    qrData: {
        type: String,
        default: null
    },

    color: {
        type: String,
        default: 'blue',
        validator: (value) => ['red', 'blue', 'green'].includes(value)
    },

    flagUrl: {
        type: String,
        default: null
    },

    showTokenInfo: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['regenerate'])

// Refs
const qrContainer = ref(null)

// Methods
const generateQRCode = async () => {
    if (!props.qrData || !qrContainer.value) return

    try {
        // Clear previous QR code
        qrContainer.value.innerHTML = ''

        // Generate QR code as SVG
        const qrCodeDataURL = await QRCode.toDataURL(props.qrData, {
            width: 80,
            height: 80,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        })

        // Create image element
        const img = document.createElement('img')
        img.src = qrCodeDataURL
        img.alt = `QR Code for ${props.title}`
        img.className = 'w-full h-full rounded'

        qrContainer.value.appendChild(img)

    } catch (error) {
        console.error('QR code generation error:', error)

        // Show error state
        qrContainer.value.innerHTML = `
      <div class="text-center">
        <div class="text-xs text-mun-red-500">Error</div>
      </div>
    `
    }
}

const handleFlagError = (event) => {
    event.target.style.display = 'none'
}

// Watchers
watch(() => props.qrData, async () => {
    await nextTick()
    generateQRCode()
})

// Initialize
onMounted(() => {
    generateQRCode()
})
</script>

<style scoped>
/* Card hover animation */
.qr-preview-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.qr-preview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 158, 219, 0.15);
}

/* QR container animation */
.qr-container {
    animation: fadeIn 0.5s ease-in-out;
}

/* Status indicator animation */
.status-indicator {
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>