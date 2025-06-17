<template>
    <div class="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-md">
            <div class="text-center">
                <div class="bg-un-blue rounded-full p-3 mx-auto w-fit mb-4">
                    <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                    </svg>
                </div>
                <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Admin/Presidium Login
                </h2>
            </div>

            <!-- Login tabs -->
            <div class="mt-8">
                <div class="bg-white/50 backdrop-blur-sm rounded-lg p-1 mb-6">
                    <div class="flex">
                        <button @click="activeTab = 'credentials'" :class="[
                            'w-1/3 py-2 px-4 text-center focus:outline-none rounded-md transition-all text-sm',
                            activeTab === 'credentials'
                                ? 'bg-un-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        ]">
                            Username & Password
                        </button>
                        <button @click="activeTab = 'token'" :class="[
                            'w-1/3 py-2 px-4 text-center focus:outline-none rounded-md transition-all text-sm',
                            activeTab === 'token'
                                ? 'bg-un-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        ]">
                            Token
                        </button>
                        <button @click="activeTab = 'qrcode'" :class="[
                            'w-1/3 py-2 px-4 text-center focus:outline-none rounded-md transition-all text-sm',
                            activeTab === 'qrcode'
                                ? 'bg-un-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        ]">
                            QR Code
                        </button>
                    </div>
                </div>

                <!-- Credential login form -->
                <div v-if="activeTab === 'credentials'" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                    <form @submit.prevent="handleSubmit">
                        <div class="space-y-4">
                            <div>
                                <label for="username" class="form-label">Username</label>
                                <input id="username" v-model="form.username" type="text" required class="form-input"
                                    :disabled="loading" />
                            </div>

                            <div>
                                <label for="password" class="form-label">Password</label>
                                <input id="password" v-model="form.password" type="password" required class="form-input"
                                    :disabled="loading" />
                            </div>
                        </div>

                        <div class="mt-6">
                            <button type="submit" class="btn btn-primary w-full" :disabled="loading">
                                {{ loading ? 'Signing in...' : 'Sign in' }}
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Token input form -->
                <div v-else-if="activeTab === 'token'" class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                    <div class="space-y-4">
                        <div>
                            <label for="token" class="form-label">Access Token</label>
                            <input id="token" v-model="token" type="text" class="form-input"
                                placeholder="Enter your access token" :disabled="loading" />
                        </div>

                        <button type="button" class="btn btn-primary w-full" @click="handleTokenSubmit"
                            :disabled="!token || loading">
                            {{ loading ? 'Authenticating...' : 'Submit Token' }}
                        </button>
                    </div>
                </div>

                <!-- QR Code scanner -->
                <div v-else class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                    <div v-if="!showScanner" class="text-center">
                        <button @click="startScanner" class="btn btn-primary w-full">
                            Scan QR Code
                        </button>
                    </div>

                    <div v-else class="space-y-6">
                        <div
                            class="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-gray-100">
                            <video ref="videoElement" class="h-full w-full object-cover"></video>
                            <div class="absolute inset-0 border-2 border-un-blue rounded-lg"></div>
                        </div>

                        <button type="button" class="btn btn-outline w-full" @click="stopScanner">
                            Cancel Scan
                        </button>
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