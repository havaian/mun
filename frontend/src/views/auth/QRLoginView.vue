<template>
    <div class="min-h-screen flex items-center justify-center p-4 gradient-bg">
        <div class="w-full max-w-md">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="mx-auto w-16 h-16 bg-un-blue rounded-full flex items-center justify-center mb-4 shadow-mun">
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
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-mun border border-white/20 p-6 mb-6">
                <!-- Camera View -->
                <div class="relative mb-6">
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
                                <AppButton variant="danger" size="sm" @click="startCamera" :loading="isStartingCamera">
                                    <ArrowPathIcon class="w-4 h-4 mr-2" />
                                    Retry
                                </AppButton>
                                <AppButton variant="outline" size="sm" @click="showCameraTroubleshooting = true">
                                    Troubleshoot
                                </AppButton>
                            </div>
                        </div>
                    </div>

                    <!-- Camera Active - Scanning -->
                    <div v-else-if="isCameraActive && !scanResult" class="relative">
                        <video ref="videoElement" autoplay playsinline muted
                            class="w-full aspect-square object-cover rounded-2xl qr-scanner">
                        </video>

                        <!-- Scanner Overlay -->
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div class="relative w-48 h-48">
                                <!-- Scanner Frame -->
                                <div class="absolute inset-0 border-2 border-white rounded-xl shadow-lg">
                                    <!-- Corner indicators -->
                                    <div
                                        class="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-un-blue rounded-tl-xl">
                                    </div>
                                    <div
                                        class="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-un-blue rounded-tr-xl">
                                    </div>
                                    <div
                                        class="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-un-blue rounded-bl-xl">
                                    </div>
                                    <div
                                        class="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-un-blue rounded-br-xl">
                                    </div>
                                </div>

                                <!-- Scanning Animation -->
                                <div class="absolute inset-0 overflow-hidden rounded-xl">
                                    <div class="scanning-line"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Scanning Status -->
                        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <div
                                class="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                                <div class="flex items-center space-x-2">
                                    <div class="w-2 h-2 bg-un-blue rounded-full animate-pulse"></div>
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
                            <LoadingSpinner size="sm" class="mx-auto" />
                        </div>
                    </div>
                </div>

                <!-- Camera Controls -->
                <div v-if="isCameraActive" class="flex justify-center space-x-4 mb-4">
                    <AppButton variant="outline" size="sm" @click="toggleTorch" v-if="supportsTorch">
                        <span class="w-4 h-4 mr-2">💡</span>
                        {{ torchEnabled ? 'Turn Off' : 'Turn On' }} Flash
                    </AppButton>

                    <AppButton variant="outline" size="sm" @click="switchCamera" v-if="availableCameras.length > 1">
                        <ArrowPathIcon class="w-4 h-4 mr-2" />
                        Switch Camera
                    </AppButton>
                </div>

                <!-- Processing State -->
                <div v-if="isProcessing" class="text-center mb-4">
                    <LoadingSpinner size="sm" class="mx-auto mb-2" />
                    <p class="text-sm text-mun-gray-600">Verifying QR code...</p>
                </div>
            </div>

            <!-- Alternative Options -->
            <div class="text-center space-y-4">
                <p class="text-sm text-mun-gray-500">
                    Having trouble with the camera?
                </p>

                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <AppButton variant="ghost" size="sm" @click="goToEmailLogin">
                        <EnvelopeIcon class="w-4 h-4 mr-2" />
                        Use Email Instead
                    </AppButton>

                    <AppButton variant="ghost" size="sm" @click="showManualEntry = true">
                        <span class="w-4 h-4 mr-2">🔤</span>
                        Enter Code Manually
                    </AppButton>

                    <AppButton variant="ghost" size="sm" @click="goBack">
                        <ArrowLeftIcon class="w-4 h-4 mr-2" />
                        Back to Login
                    </AppButton>
                </div>
            </div>
        </div>

        <!-- Manual QR Code Entry Modal -->
        <div v-if="showManualEntry"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Enter QR Code Manually</h3>
                <p class="text-sm text-mun-gray-600 mb-4">
                    Enter the code from your QR slip if camera scanning isn't working.
                </p>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">QR Code</label>
                        <input v-model="manualCode" type="text" placeholder="Enter the code from your QR slip"
                            class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-un-blue focus:border-un-blue outline-none transition-colors"
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

        <!-- Camera Troubleshooting Modal -->
        <div v-if="showCameraTroubleshooting"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Camera Troubleshooting</h3>

                <div class="space-y-4 text-sm text-mun-gray-600">
                    <div>
                        <h4 class="font-medium text-mun-gray-900 mb-2">If camera access was denied:</h4>
                        <ul class="list-disc list-inside space-y-1 ml-4">
                            <li>Click the camera icon in your browser's address bar</li>
                            <li>Select "Allow" and refresh the page</li>
                            <li>On mobile, check app permissions in Settings</li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="font-medium text-mun-gray-900 mb-2">If camera is in use:</h4>
                        <ul class="list-disc list-inside space-y-1 ml-4">
                            <li>Close other tabs or apps using the camera</li>
                            <li>Restart your browser</li>
                            <li>Try using a different browser</li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="font-medium text-mun-gray-900 mb-2">Alternative options:</h4>
                        <ul class="list-disc list-inside space-y-1 ml-4">
                            <li>Use email login if you've already registered</li>
                            <li>Enter your QR code manually</li>
                            <li>Ask presidium to regenerate your QR code</li>
                        </ul>
                    </div>
                </div>

                <div class="flex space-x-3 mt-6">
                    <AppButton variant="primary" @click="startCamera" :loading="isStartingCamera" class="flex-1">
                        Try Again
                    </AppButton>
                    <AppButton variant="outline" @click="showCameraTroubleshooting = false" class="flex-1">
                        Close
                    </AppButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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

// Troubleshooting
const showCameraTroubleshooting = ref(false)

// Camera features
const supportsTorch = ref(false)
const torchEnabled = ref(false)
const availableCameras = ref([])
const currentCameraIndex = ref(0)

// Scan attempt tracking
const scanAttempts = ref(0)
const maxScanAttempts = 3
const lastScanTime = ref(0)
const scanCooldown = 2000 // 2 seconds between scans

// Methods
const startCamera = async () => {
    try {
        isStartingCamera.value = true
        error.value = ''
        scanAttempts.value = 0

        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access is not supported in this browser')
        }

        // Get available cameras first
        await getAvailableCameras()

        // Camera constraints
        const constraints = {
            video: {
                facingMode: availableCameras.value.length > 1 ? 'environment' : 'user',
                width: { ideal: 640 },
                height: { ideal: 640 }
            }
        }

        // Use specific camera if available
        if (availableCameras.value.length > 0) {
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
                    checkTorchSupport()
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
    supportsTorch.value = false
    torchEnabled.value = false
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
            errorMessage = 'Camera does not support the required settings.'
            break
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

const checkTorchSupport = () => {
    if (stream.value) {
        const track = stream.value.getVideoTracks()[0]
        const capabilities = track.getCapabilities()
        supportsTorch.value = 'torch' in capabilities
    }
}

const toggleTorch = async () => {
    if (!supportsTorch.value || !stream.value) return

    try {
        const track = stream.value.getVideoTracks()[0]
        await track.applyConstraints({
            advanced: [{ torch: !torchEnabled.value }]
        })
        torchEnabled.value = !torchEnabled.value
    } catch (err) {
        console.error('Failed to toggle torch:', err)
        toast.error('Failed to toggle flashlight')
    }
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
            if (now - lastScanTime.value > scanCooldown) {
                lastScanTime.value = now
                handleQRDetected(code.data)
            }
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
        scanAttempts.value++

        // Extract token from QR code
        let qrToken = qrData.trim()

        // If QR contains full URL, extract token
        if (qrData.includes('/auth/qr/')) {
            qrToken = qrData.split('/auth/qr/')[1]
        } else if (qrData.includes('qr=')) {
            qrToken = qrData.split('qr=')[1].split('&')[0]
        }

        // Validate token format (basic check)
        if (!qrToken || qrToken.length < 10) {
            throw new Error('Invalid QR code format')
        }

        // Process QR login
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
                    committee: result.data.committee?.name
                }
            })
        } else {
            throw new Error(result.error || 'QR verification failed')
        }

    } catch (err) {
        console.error('QR processing error:', err)

        // Handle retry logic
        if (scanAttempts.value < maxScanAttempts) {
            error.value = `${err.message} (Attempt ${scanAttempts.value}/${maxScanAttempts})`
            toast.warning(`${err.message}. Retrying...`)

            // Reset and continue scanning
            setTimeout(() => {
                scanResult.value = null
                error.value = ''
                if (isCameraActive.value) {
                    startScanning()
                }
            }, 2000)
        } else {
            error.value = `${err.message}. Please try again or use manual entry.`
            toast.error(error.value)
            stopCamera()
        }
    } finally {
        isProcessing.value = false
    }
}

const processManualCode = async () => {
    if (!manualCode.value.trim()) {
        toast.error('Please enter a QR code')
        return
    }

    try {
        isProcessing.value = true
        await handleQRDetected(manualCode.value.trim())
    } catch (err) {
        // Error already handled in handleQRDetected
    } finally {
        isProcessing.value = false
    }
}

const closeManualEntry = () => {
    showManualEntry.value = false
    manualCode.value = ''
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
onMounted(async () => {
    // Auto-start camera if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await startCamera()
    }

    // Focus manual input when modal opens
    if (showManualEntry.value) {
        await nextTick()
        manualCodeInput.value?.focus()
    }
})

onUnmounted(() => {
    stopCamera()
})

// Watch for manual entry modal
watch(() => showManualEntry.value, async (newVal) => {
    if (newVal) {
        await nextTick()
        manualCodeInput.value?.focus()
    }
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
.qr-scanner {
    position: relative;
}

.qr-scanner::after {
    content: '';
    position: absolute;
    inset: -2px;
    border: 2px solid #009edb;
    border-radius: 1rem;
    animation: qr-pulse 2s ease-in-out infinite;
    pointer-events: none;
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

/* Gradient background */
.gradient-bg {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}
</style>