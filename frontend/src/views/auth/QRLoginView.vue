<template>
    <div class="text-center">
        <!-- Header -->
        <div class="mx-auto w-16 h-16 bg-mun-blue rounded-full flex items-center justify-center mb-4">
            <QrCodeIcon class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">
            Scan QR Code
        </h1>
        <p class="text-mun-gray-600 mb-8">
            Point your camera at the QR code to authenticate
        </p>

        <!-- QR Scanner -->
        <div class="mb-6">
            <!-- Camera Not Active State -->
            <div v-if="!isCameraActive && !scanResult && !error"
                class="aspect-square bg-mun-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div class="text-center">
                    <CameraIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
                    <p class="text-mun-gray-500 mb-4">Camera not active</p>
                    <AppButton variant="primary" size="sm" @click="startCamera" :loading="isStartingCamera">
                        <CameraIcon class="w-4 h-4 mr-2" />
                        Start Camera
                    </AppButton>
                </div>
            </div>

            <!-- Camera Error State -->
            <div v-else-if="error && !scanResult"
                class="aspect-square bg-mun-red-50 rounded-2xl flex items-center justify-center border-2 border-mun-red-200">
                <div class="text-center p-4">
                    <ExclamationTriangleIcon class="w-16 h-16 text-mun-red-500 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-mun-red-800 mb-2">Camera Error</h3>
                    <p class="text-sm text-mun-red-600 mb-4">{{ error }}</p>
                    <div class="space-y-2">
                        <AppButton variant="primary" size="sm" @click="startCamera" :loading="isStartingCamera">
                            <ArrowPathIcon class="w-4 h-4 mr-2" />
                            Retry
                        </AppButton>
                        <AppButton variant="outline" size="sm" @click="showManualEntry = true">
                            Enter Code Manually
                        </AppButton>
                    </div>
                </div>
            </div>

            <!-- Camera Active - Scanning -->
            <div v-else-if="isCameraActive && !scanResult" class="relative">
                <video ref="videoElement" autoplay playsinline muted
                    class="w-full aspect-square object-cover rounded-2xl">
                </video>

                <!-- Scanner Overlay -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="relative w-48 h-48">
                        <!-- Scanner Frame -->
                        <div class="absolute inset-0 border-2 border-white rounded-xl shadow-lg">
                            <!-- Corner indicators -->
                            <div class="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-mun-blue rounded-tl-xl"></div>
                            <div class="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-mun-blue rounded-tr-xl"></div>
                            <div class="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-mun-blue rounded-bl-xl"></div>
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-mun-blue rounded-br-xl"></div>
                        </div>

                        <!-- Scanning Animation -->
                        <div class="absolute inset-0 overflow-hidden rounded-xl">
                            <div class="scanning-line"></div>
                        </div>
                    </div>
                </div>

                <!-- Scanning Status -->
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div class="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-mun-blue rounded-full animate-pulse"></div>
                            <span>Scanning for QR code...</span>
                        </div>
                    </div>
                </div>

                <!-- Stop Camera Button -->
                <button @click="stopCamera"
                    class="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm">
                    <StopIcon class="w-5 h-5" />
                </button>
            </div>

            <!-- Success State -->
            <div v-else-if="scanResult && !error"
                class="aspect-square bg-mun-green-50 rounded-2xl flex items-center justify-center border-2 border-mun-green-200">
                <div class="text-center">
                    <CheckCircleIcon class="w-16 h-16 text-mun-green-500 mx-auto mb-4" />
                    <h3 class="text-lg font-semibold text-mun-green-800 mb-2">QR Code Detected!</h3>
                    <p class="text-sm text-mun-green-600 mb-4">Processing authentication...</p>
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-mun-green-600 mx-auto"></div>
                </div>
            </div>
        </div>

        <!-- Camera Controls -->
        <div v-if="isCameraActive" class="flex justify-center space-x-4 mb-6">
            <AppButton variant="outline" size="sm" @click="switchCamera" v-if="availableCameras.length > 1">
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                Switch Camera
            </AppButton>
        </div>

        <!-- Alternative Options -->
        <div class="text-center space-y-4">
            <p class="text-sm text-mun-gray-500">
                Having trouble with the camera?
            </p>
            <div class="space-y-2">
                <AppButton variant="outline" @click="showManualEntry = true" full-width>
                    <EnvelopeIcon class="w-4 h-4 mr-2" />
                    Enter Code Manually
                </AppButton>
                <AppButton variant="ghost" @click="goToLogin" full-width>
                    <ArrowLeftIcon class="w-4 h-4 mr-2" />
                    Back to Login
                </AppButton>
            </div>
        </div>

        <!-- Manual Entry Modal -->
        <div v-if="showManualEntry" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Enter QR Code</h3>
                <p class="text-sm text-mun-gray-600 mb-4">
                    Enter the code from your QR slip manually.
                </p>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">QR Code</label>
                        <input v-model="manualCode" type="text" placeholder="Enter the code from your QR slip"
                            class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-mun-blue outline-none transition-colors"
                            @keyup.enter="processManualCode" ref="manualCodeInput" />
                    </div>

                    <div class="flex space-x-3">
                        <AppButton variant="primary" @click="processManualCode" :loading="isProcessing" class="flex-1">
                            Verify Code
                        </AppButton>
                        <AppButton variant="outline" @click="closeManualEntry" class="flex-1">
                            Cancel
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue'
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
const manualCodeInput = ref(null)

// State
const isCameraActive = ref(false)
const isStartingCamera = ref(false)
const isProcessing = ref(false)
const scanResult = ref(null)
const error = ref('')
const stream = ref(null)
const animationFrame = ref(null)

// Manual entry
const showManualEntry = ref(false)
const manualCode = ref('')

// Camera features
const availableCameras = ref([])
const currentCameraIndex = ref(0)

// Scan attempt tracking
const lastScanTime = ref(0)
const scanCooldown = 2000 // 2 seconds between scans

// Methods
const startCamera = async () => {
    try {
        isStartingCamera.value = true
        error.value = ''

        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access is not supported in this browser')
        }

        // Get available cameras first
        await getAvailableCameras()

        // Use more flexible camera constraints to avoid OverconstrainedError
        const constraints = {
            video: {
                // Start with basic constraints that most cameras support
                width: { ideal: 640, min: 320 },
                height: { ideal: 640, min: 240 },
                // Only specify facingMode if we have multiple cameras
                ...(availableCameras.value.length > 1 && {
                    facingMode: 'environment'
                })
            }
        }

        // Use specific camera if available and not the first attempt
        if (availableCameras.value.length > 0 && currentCameraIndex.value < availableCameras.value.length) {
            constraints.video.deviceId = { exact: availableCameras.value[currentCameraIndex.value].deviceId }
        }

        // Request camera permission
        stream.value = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoElement.value) {
            videoElement.value.srcObject = stream.value

            // Wait for video to be ready
            await new Promise((resolve) => {
                videoElement.value.onloadedmetadata = () => {
                    isCameraActive.value = true
                    startScanning()
                    resolve()
                }
            })
        }

        toast.success('Camera started successfully')

    } catch (err) {
        console.error('Camera start error:', err)
        handleCameraError(err)
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

const handleCameraError = (err) => {
    let errorMessage = 'Failed to access camera'

    switch (err.name) {
        case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access and try again.'
            break
        case 'NotFoundError':
            errorMessage = 'No camera found on this device.'
            break
        case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application.'
            break
        case 'OverconstrainedError':
            errorMessage = 'Camera settings not supported. Trying fallback...'
            // Try with minimal constraints as fallback
            tryFallbackCamera()
            return
        case 'SecurityError':
            errorMessage = 'Camera access blocked due to security restrictions.'
            break
        default:
            if (err.message) {
                errorMessage = err.message
            }
    }

    error.value = errorMessage
    toast.error(errorMessage)
}

const tryFallbackCamera = async () => {
    try {
        // Use minimal constraints as fallback
        const constraints = {
            video: true // Let the browser choose the best settings
        }

        stream.value = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoElement.value) {
            videoElement.value.srcObject = stream.value
            await new Promise((resolve) => {
                videoElement.value.onloadedmetadata = () => {
                    isCameraActive.value = true
                    startScanning()
                    resolve()
                }
            })
        }

        toast.success('Camera started with fallback settings')
        
    } catch (fallbackErr) {
        console.error('Fallback camera error:', fallbackErr)
        error.value = 'Unable to access camera with any settings'
        toast.error('Unable to access camera')
    }
}

const getAvailableCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        availableCameras.value = devices.filter(device => device.kind === 'videoinput')
    } catch (err) {
        console.error('Failed to enumerate cameras:', err)
    }
}

const switchCamera = async () => {
    if (availableCameras.value.length <= 1) return

    currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length
    stopCamera()
    await nextTick()
    startCamera()
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

        if (canvas.width === 0 || canvas.height === 0) {
            animationFrame.value = requestAnimationFrame(scan)
            return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
            const now = Date.now()
            if (now - lastScanTime.value < scanCooldown) {
                animationFrame.value = requestAnimationFrame(scan)
                return
            }

            lastScanTime.value = now
            scanResult.value = code.data
            stopCamera()
            processQRCode(code.data)
            return
        }

        animationFrame.value = requestAnimationFrame(scan)
    }

    scan()
}

const processQRCode = async (code) => {
    try {
        isProcessing.value = true
        
        // Process the QR code with your authentication logic
        const response = await authStore.authenticateWithQRCode(code)
        
        if (response.success) {
            toast.success('Authentication successful!')
            // Redirect based on user role
            const dashboardRoute = authStore.getDashboardRoute()
            router.push({ name: dashboardRoute })
        } else {
            throw new Error(response.message || 'Authentication failed')
        }
        
    } catch (err) {
        console.error('QR processing error:', err)
        toast.error(err.message || 'Failed to process QR code')
        
        // Reset state to allow retry
        scanResult.value = null
        isProcessing.value = false
        
        // Restart scanning after a brief delay
        setTimeout(() => {
            if (!isCameraActive.value && !error.value) {
                startCamera()
            }
        }, 2000)
    }
}

const processManualCode = async () => {
    if (!manualCode.value.trim()) {
        toast.error('Please enter the QR code')
        return
    }

    try {
        await processQRCode(manualCode.value.trim())
        closeManualEntry()
    } catch (err) {
        // Error handling is done in processQRCode
    }
}

const closeManualEntry = () => {
    showManualEntry.value = false
    manualCode.value = ''
}

const goToLogin = () => {
    router.push({ name: 'Login' })
}

// Cleanup on unmount
onUnmounted(() => {
    stopCamera()
})
</script>

<style scoped>
/* Scanning animation */
@keyframes scan {
    0% {
        transform: translateY(-100%);
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
    100% {
        transform: translateY(200%);
        opacity: 0;
    }
}

.scanning-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #3B82F6, transparent);
    animation: scan 2s linear infinite;
}

/* Ensure video maintains aspect ratio */
video {
    object-fit: cover;
}
</style>