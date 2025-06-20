<template>
    <div class="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
            <div class="text-center">
                <img src="/logo.svg" alt="UN Logo" class="mx-auto h-12 w-auto" />
                <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Admin/Presidium Login
                </h2>
            </div>

            <!-- Login tabs -->
            <div class="mt-8">
                <div class="flex glass-container rounded-lg p-1">
                    <button @click="activeTab = 'credentials'" :class="[
                        'w-1/3 py-2 px-4 text-center focus:outline-none rounded-md transition-all',
                        activeTab === 'credentials'
                            ? 'glass-primary text-un-blue font-medium'
                            : 'glass-text hover:bg-white/10'
                    ]">
                        Username & Password
                    </button>
                    <button @click="activeTab = 'token'" :class="[
                        'w-1/3 py-2 px-4 text-center focus:outline-none rounded-md transition-all',
                        activeTab === 'token'
                            ? 'glass-primary text-un-blue font-medium'
                            : 'glass-text hover:bg-white/10'
                    ]">
                        Token
                    </button>
                    <button @click="activeTab = 'qrcode'" :class="[
                        'w-1/3 py-2 px-4 text-center focus:outline-none rounded-md transition-all',
                        activeTab === 'qrcode'
                            ? 'glass-primary text-un-blue font-medium'
                            : 'glass-text hover:bg-white/10'
                    ]">
                        QR Code
                    </button>
                </div>

                <!-- Credential login form -->
                <div v-if="activeTab === 'credentials'" class="mt-8 space-y-6">
                    <div class="glass-card">
                        <form @submit.prevent="handleSubmit">
                            <div class="space-y-4">
                                <div>
                                    <label for="username" class="form-label glass-text">Username</label>
                                    <input id="username" v-model="form.username" type="text" required class="form-input"
                                        :disabled="loading" />
                                </div>

                                <div>
                                    <label for="password" class="form-label glass-text">Password</label>
                                    <input id="password" v-model="form.password" type="password" required class="form-input"
                                        :disabled="loading" />
                                </div>
                            </div>

                            <div class="mt-6">
                                <button type="submit" class="btn btn-primary glass-button w-full" :disabled="loading">
                                    {{ loading ? 'Signing in...' : 'Sign in' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Token input form -->
                <div v-else-if="activeTab === 'token'" class="mt-8 space-y-6">
                    <div class="glass-card">
                        <div>
                            <label for="token" class="form-label glass-text">Access Token</label>
                            <input id="token" v-model="token" type="text" class="form-input"
                                placeholder="Enter your access token" :disabled="loading" />
                        </div>

                        <div class="flex flex-col space-y-4 mt-6">
                            <button type="button" class="btn btn-primary glass-button w-full" @click="handleTokenSubmit"
                                :disabled="!token || loading">
                                {{ loading ? 'Authenticating...' : 'Submit Token' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- QR Code scanner -->
                <div v-else class="mt-8 space-y-6">
                    <div class="glass-card">
                        <div v-if="!showScanner" class="text-center">
                            <button @click="startScanner" class="btn btn-primary glass-button">
                                Scan QR Code
                            </button>
                        </div>

                        <div v-else class="space-y-6">
                            <div
                                class="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg glass-container">
                                <video ref="videoElement" class="h-full w-full object-cover"></video>
                                <div class="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
                            </div>

                            <button type="button" class="btn btn-outline glass-button w-full" @click="stopScanner">
                                Cancel Scan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { toast } from 'vue3-toastify'
import jsQR from 'jsqr'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('credentials')
const loading = ref(false)
const form = ref({
    username: '',
    password: ''
})
const token = ref('')

// QR Code scanner
const showScanner = ref(false)
const videoElement = ref(null)
const stream = ref(null)
const scanInterval = ref(null)

async function handleSubmit() {
    loading.value = true
    try {
        await authStore.login(form.value)
        router.push(authStore.getDefaultRoute)
    } finally {
        loading.value = false
    }
}

async function handleTokenSubmit() {
    if (!token.value) {
        toast.error('Please enter a token')
        return
    }

    loading.value = true
    try {
        await authStore.login({ token: token.value })
        router.push(authStore.getDefaultRoute)
    } catch (error) {
        toast.error('Invalid token')
    } finally {
        loading.value = false
    }
}

async function startScanner() {
    try {
        showScanner.value = true
        await initializeCamera()
        startQRScanning()
    } catch (error) {
        toast.error('Unable to access camera. Please check permissions.')
        stopScanner()
    }
}

function stopScanner() {
    if (scanInterval.value) {
        clearInterval(scanInterval.value)
        scanInterval.value = null
    }

    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }

    showScanner.value = false
}

async function initializeCamera() {
    try {
        stream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        })

        if (videoElement.value) {
            videoElement.value.srcObject = stream.value
            videoElement.value.play()
        }
    } catch (error) {
        console.error('Camera access error:', error)
        toast.error('Cannot access camera. Please check permissions or use token input instead.')
        throw error
    }
}

function startQRScanning() {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    scanInterval.value = setInterval(() => {
        if (videoElement.value && videoElement.value.readyState === videoElement.value.HAVE_ENOUGH_DATA) {
            canvas.height = videoElement.value.videoHeight
            canvas.width = videoElement.value.videoWidth

            context.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height)
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

            const code = jsQR(imageData.data, imageData.width, imageData.height)
            if (code) {
                stopScanner()
                handleQRCode(code.data)
            }
        }
    }, 100)
}

async function handleQRCode(scannedToken) {
    token.value = scannedToken // Store the token in case authentication fails and user needs to see it
    loading.value = true
    try {
        await authStore.login({ token: scannedToken })
        router.push(authStore.getDefaultRoute)
    } catch (error) {
        toast.error('Invalid QR code')
        activeTab.value = 'token' // Switch to token tab so user can see the scanned token
    } finally {
        loading.value = false
    }
}

onBeforeUnmount(() => {
    stopScanner()
})
</script>