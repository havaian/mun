<template>
    <div class="space-y-4">
        <!-- Scanner Interface -->
        <div class="relative">
            <div v-if="!isScanning" class="text-center">
                <button @click="startScanning" :disabled="loading" class="btn-secondary w-full mb-4">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ loading ? 'Loading...' : 'Scan QR Code' }}
                </button>

                <p class="text-xs text-gray-500">
                    Click to activate your camera and scan the QR code
                </p>
            </div>

            <!-- Camera View -->
            <div v-else class="relative bg-gray-900 rounded-lg overflow-hidden">
                <!-- Video Element -->
                <video ref="videoElement" class="w-full h-64 object-cover" autoplay playsinline muted></video>

                <!-- Scanning Overlay -->
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="relative">
                        <!-- Scanning Frame -->
                        <div class="w-48 h-48 border-2 border-white rounded-lg relative">
                            <!-- Corner Indicators -->
                            <div
                                class="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-400 rounded-tl-lg">
                            </div>
                            <div
                                class="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-400 rounded-tr-lg">
                            </div>
                            <div
                                class="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-400 rounded-bl-lg">
                            </div>
                            <div
                                class="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-400 rounded-br-lg">
                            </div>

                            <!-- Scanning Line -->
                            <div class="absolute inset-x-0 top-0 h-0.5 bg-blue-400 animate-pulse scanning-line"></div>
                        </div>

                        <!-- Instructions -->
                        <div class="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                            <p class="text-white text-sm font-medium mb-1">Position QR code in frame</p>
                            <p class="text-white/70 text-xs">Scanner will automatically detect the code</p>
                        </div>
                    </div>
                </div>

                <!-- Canvas for QR processing (hidden) -->
                <canvas ref="canvasElement" class="hidden"></canvas>

                <!-- Stop Button -->
                <button @click="stopScanning"
                    class="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <!-- Status Indicator -->
                <div class="absolute bottom-4 left-4 flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span class="text-white text-sm">Scanning...</span>
                </div>
            </div>
        </div>

        <!-- Error Messages -->
        <div v-if="scanError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="flex">
                <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                    <h4 class="text-sm font-medium text-red-800">Scanner Error</h4>
                    <p class="mt-1 text-sm text-red-700">{{ scanError }}</p>
                    <button v-if="isScanning" @click="stopScanning"
                        class="mt-2 text-sm text-red-600 hover:text-red-700 font-medium">
                        Stop scanner and try again
                    </button>
                </div>
            </div>
        </div>

        <!-- Browser Compatibility Notice -->
        <div v-if="!isBrowserSupported" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div class="flex">
                <svg class="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                    <h4 class="text-sm font-medium text-yellow-800">Camera Not Supported</h4>
                    <p class="mt-1 text-sm text-yellow-700">
                        Your browser doesn't support camera access. Please use the manual entry field below.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { BrowserQRCodeReader } from '@zxing/library'

const emit = defineEmits(['scanned', 'error'])
const props = defineProps({
    loading: {
        type: Boolean,
        default: false
    }
})

// Refs
const videoElement = ref(null)
const canvasElement = ref(null)

// State
const isScanning = ref(false)
const scanError = ref('')
const isBrowserSupported = ref(true)
const codeReader = ref(null)
const stream = ref(null)

// Initialize QR code reader
onMounted(() => {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        isBrowserSupported.value = false
        return
    }

    codeReader.value = new BrowserQRCodeReader()
})

// Cleanup on unmount
onUnmounted(() => {
    stopScanning()
})

async function startScanning() {
    if (!isBrowserSupported.value || props.loading) return

    scanError.value = ''
    isScanning.value = true

    try {
        // Get camera stream
        stream.value = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        })

        // Set video source
        if (videoElement.value) {
            videoElement.value.srcObject = stream.value
        }

        // Start scanning
        await startQRDetection()

    } catch (error) {
        console.error('Camera access error:', error)

        if (error.name === 'NotAllowedError') {
            scanError.value = 'Camera access denied. Please allow camera permissions and try again.'
        } else if (error.name === 'NotFoundError') {
            scanError.value = 'No camera found. Please ensure your device has a camera.'
        } else if (error.name === 'NotSupportedError') {
            scanError.value = 'Camera not supported by this browser.'
            isBrowserSupported.value = false
        } else {
            scanError.value = 'Failed to access camera. Please try again.'
        }

        isScanning.value = false
        emit('error', scanError.value)
    }
}

async function startQRDetection() {
    if (!videoElement.value || !canvasElement.value) return

    const video = videoElement.value
    const canvas = canvasElement.value
    const context = canvas.getContext('2d')

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const scanFrame = () => {
        if (!isScanning.value) return

        try {
            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Get image data
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

            // Try to decode QR code using zxing
            codeReader.value.decodeFromImageData(imageData)
                .then(result => {
                    if (result) {
                        handleQRDetected(result.text)
                    }
                })
                .catch(() => {
                    // No QR code found in this frame, continue scanning
                    requestAnimationFrame(scanFrame)
                })
        } catch (error) {
            console.error('QR detection error:', error)
            requestAnimationFrame(scanFrame)
        }
    }

    // Wait for video to be ready
    if (video.readyState >= 2) {
        scanFrame()
    } else {
        video.addEventListener('loadeddata', scanFrame, { once: true })
    }
}

function handleQRDetected(qrData) {
    console.log('QR Code detected:', qrData)

    // Validate QR data format (basic check)
    if (qrData && qrData.length > 10) {
        emit('scanned', qrData)
        stopScanning()
    } else {
        scanError.value = 'Invalid QR code format'
        emit('error', scanError.value)
    }
}

function stopScanning() {
    isScanning.value = false
    scanError.value = ''

    // Stop camera stream
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }

    // Clear video element
    if (videoElement.value) {
        videoElement.value.srcObject = null
    }
}
</script>

<style scoped>
.scanning-line {
    animation: scanning 2s linear infinite;
}

@keyframes scanning {
    0% {
        top: 0;
    }

    50% {
        top: 100%;
    }

    100% {
        top: 0;
    }
}
</style>