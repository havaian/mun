<template>
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="mx-auto w-16 h-16 bg-un-blue rounded-full flex items-center justify-center mb-4">
                    <QrCodeIcon class="w-8 h-8 text-white" />
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">
                    Scan QR Code
                </h1>
                <p class="text-mun-gray-600">
                    Point your camera at the QR code to authenticate
                </p>
            </div>

            <!-- QR Scanner Card -->
            <div class="mun-card p-6 mb-6">
                <!-- Camera View -->
                <div class="relative mb-6">
                    <div v-if="!isCameraActive && !scanResult"
                        class="aspect-square bg-mun-gray-100 rounded-2xl flex items-center justify-center">
                        <div class="text-center">
                            <CameraIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
                            <p class="text-mun-gray-500">Camera not active</p>
                        </div>
                    </div>

                    <!-- Camera Video Element -->
                    <video v-show="isCameraActive && !scanResult" ref="videoElement" autoplay playsinline
                        class="w-full aspect-square object-cover rounded-2xl qr-scanner"></video>

                    <!-- Scanner Overlay -->
                    <div v-if="isCameraActive && !scanResult"
                        class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div class="w-48 h-48 border-2 border-un-blue rounded-2xl relative">
                            <!-- Corner indicators -->
                            <div class="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg">
                            </div>
                            <div
                                class="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg">
                            </div>
                            <div
                                class="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg">
                            </div>
                            <div
                                class="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg">
                            </div>

                            <!-- Scanning line animation -->
                            <div class="absolute inset-0 overflow-hidden rounded-2xl">
                                <div class="scanning-line"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Success Result -->
                    <div v-if="scanResult"
                        class="aspect-square bg-mun-green-50 rounded-2xl flex items-center justify-center border-2 border-mun-green-200">
                        <div class="text-center">
                            <CheckCircleIcon class="w-16 h-16 text-mun-green-500 mx-auto mb-4 animate-bounce-gentle" />
                            <p class="text-mun-green-700 font-medium">QR Code Detected!</p>
                        </div>
                    </div>

                    <!-- Loading Overlay -->
                    <transition name="fade">
                        <div v-if="isProcessing"
                            class="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <div class="bg-white rounded-xl p-6 text-center">
                                <LoadingSpinner size="lg" />
                                <p class="mt-4 text-mun-gray-600">Verifying QR code...</p>
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Camera Controls -->
                <div class="flex gap-4">
                    <AppButton v-if="!isCameraActive" variant="primary" size="lg" full-width :icon="CameraIcon"
                        @click="startCamera" :loading="isStartingCamera">
                        Start Camera
                    </AppButton>

                    <template v-else>
                        <AppButton variant="outline" size="lg" :icon="ArrowPathIcon" @click="resetScanner"
                            :disabled="isProcessing">
                            Reset
                        </AppButton>

                        <AppButton variant="secondary" size="lg" full-width :icon="StopIcon" @click="stopCamera"
                            :disabled="isProcessing">
                            Stop Camera
                        </AppButton>
                    </template>
                </div>

                <!-- Error Display -->
                <div v-if="error" class="mt-4 p-4 bg-mun-red-50 rounded-xl">
                    <div class="flex items-start">
                        <ExclamationTriangleIcon class="w-5 h-5 text-mun-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 class="text-sm font-medium text-mun-red-800">Error</h4>
                            <p class="text-sm text-mun-red-700 mt-1">{{ error }}</p>
                        </div>
                    </div>
                </div>

                <!-- Instructions -->
                <div class="mt-6 p-4 bg-un-blue-50 rounded-xl">
                    <h4 class="text-sm font-medium text-un-blue-800 mb-2">Instructions:</h4>
                    <ul class="text-sm text-un-blue-700 space-y-1">
                        <li>• Hold your QR code steady in the camera view</li>
                        <li>• Ensure good lighting for best results</li>
                        <li>• The QR code should fill most of the scanning area</li>
                    </ul>
                </div>
            </div>

            <!-- Alternative Options -->
            <div class="text-center space-y-4">
                <p class="text-sm text-mun-gray-500">
                    Don't have a QR code?
                </p>

                <div class="flex gap-4">
                    <AppButton variant="ghost" size="sm" :icon="EnvelopeIcon" @click="goToEmailLogin">
                        Use Email
                    </AppButton>

                    <AppButton variant="ghost" size="sm" :icon="ArrowLeftIcon" @click="goBack">
                        Back to Login
                    </AppButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import jsQR from 'jsqr'
import {
    QrCodeIcon,
    CameraIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    StopIcon,
    EnvelopeIcon,
    ArrowLeftIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Refs
const videoElement = ref(null)
const canvasElement = ref(null)

// State
const isCameraActive = ref(false)
const isStartingCamera = ref(false)
const isProcessing = ref(false)
const scanResult = ref(null)
const error = ref('')
const stream = ref(null)
const animationFrame = ref(null)

// Methods
const startCamera = async () => {
    try {
        isStartingCamera.value = true
        error.value = ''

        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access is not supported in this browser')
        }

        // Request camera permission
        stream.value = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Use back camera if available
                width: { ideal: 640 },
                height: { ideal: 640 }
            }
        })

        if (videoElement.value) {
            videoElement.value.srcObject = stream.value
            videoElement.value.onloadedmetadata = () => {
                isCameraActive.value = true
                startScanning()
            }
        }

    } catch (err) {
        console.error('Camera start error:', err)

        let errorMessage = 'Failed to access camera'

        if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access and try again.'
        } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.'
        } else if (err.name === 'NotReadableError') {
            errorMessage = 'Camera is already in use by another application.'
        }

        error.value = errorMessage
        toast.error(errorMessage)
    } finally {
        isStartingCamera.value = false
    }
}

const stopCamera = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }

    if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value)
        animationFrame.value = null
    }

    isCameraActive.value = false
    scanResult.value = null
    error.value = ''
}

const startScanning = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const scan = () => {
        if (!isCameraActive.value || !videoElement.value || scanResult.value) {
            return
        }

        const video = videoElement.value
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
            handleQRDetected(code.data)
        } else {
            animationFrame.value = requestAnimationFrame(scan)
        }
    }

    animationFrame.value = requestAnimationFrame(scan)
}

const handleQRDetected = async (qrData) => {
    try {
        scanResult.value = qrData
        isProcessing.value = true

        // Extract token from QR code
        let qrToken = qrData

        // If QR contains full URL, extract token
        if (qrData.includes('/auth/qr/')) {
            qrToken = qrData.split('/auth/qr/')[1]
        }

        // Validate QR login
        const result = await authStore.qrLogin(qrToken)

        if (result.success) {
            toast.success('QR code verified successfully!')

            // Navigate to email binding with QR data
            router.push({
                name: 'EmailBinding',
                query: {
                    token: result.data.qrToken,
                    userType: result.data.userType,
                    country: result.data.country,
                    presidiumRole: result.data.presidiumRole,
                    committee: result.data.committee
                }
            })
        } else {
            throw new Error(result.error || 'QR verification failed')
        }

    } catch (err) {
        console.error('QR processing error:', err)
        error.value = err.message || 'Failed to process QR code'
        toast.error(error.value)
        resetScanner()
    } finally {
        isProcessing.value = false
    }
}

const resetScanner = () => {
    scanResult.value = null
    error.value = ''

    if (isCameraActive.value) {
        startScanning()
    }
}

const goToEmailLogin = () => {
    stopCamera()
    router.push({ name: 'Login' })
}

const goBack = () => {
    stopCamera()
    router.push({ name: 'Login' })
}

// Lifecycle hooks
onMounted(() => {
    // Auto-start camera if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        startCamera()
    }
})

onUnmounted(() => {
    stopCamera()
})
</script>

<style scoped>
/* Scanning line animation */
.scanning-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #009edb, transparent);
    animation: scan 2s linear infinite;
}

@keyframes scan {
    0% {
        transform: translateY(0);
    }

    100% {
        transform: translateY(192px);
        /* Height of scanner area */
    }
}

/* QR Scanner pulse effect */
.qr-scanner::after {
    content: '';
    position: absolute;
    inset: -2px;
    border: 2px solid #009edb;
    border-radius: 1rem;
    animation: qr-pulse 2s ease-in-out infinite;
}

@keyframes qr-pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(1.02);
    }
}
</style>