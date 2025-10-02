<template>
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">Roll Call & Attendance</h2>
                    <p class="text-sm text-gray-600 mt-1">Manage committee attendance and establish quorum</p>
                </div>
                <div class="flex items-center space-x-4">
                    <!-- QR Code Status -->
                    <div v-if="qrCodeActive"
                        class="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-sm text-green-700">QR Verification Active</span>
                    </div>

                    <!-- Timer -->
                    <div v-if="rollCallTimer > 0"
                        class="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm font-mono text-blue-700">{{ formatTimer(rollCallTimer) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="p-6">
            <!-- Roll Call Controls -->
            <div class="mb-6">
                <div v-if="!rollCallActive" class="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Start Roll Call</h3>
                    <p class="text-gray-600 mb-4">
                        Begin attendance verification to establish quorum for committee proceedings
                    </p>

                    <div class="flex items-center justify-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <input id="enableQR" v-model="settings.enableQRVerification" type="checkbox"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label for="enableQR" class="text-sm text-gray-700">Enable QR verification</label>
                        </div>

                        <div class="flex items-center space-x-2">
                            <label for="timeLimit" class="text-sm text-gray-700">Time limit:</label>
                            <select id="timeLimit" v-model="settings.timeLimit" class="text-sm border-gray-300 rounded">
                                <option :value="3">3 minutes</option>
                                <option :value="5">5 minutes</option>
                                <option :value="10">10 minutes</option>
                                <option :value="0">No limit</option>
                            </select>
                        </div>
                    </div>

                    <button @click="startRollCall" class="mt-4 btn-primary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Start Roll Call
                    </button>
                </div>

                <!-- Active Roll Call -->
                <div v-else class="space-y-4">
                    <!-- Status Bar -->
                    <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                            <h3 class="font-medium text-blue-900">Roll Call in Progress</h3>
                            <p class="text-sm text-blue-700">Delegates can mark their attendance status</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button v-if="settings.enableQRVerification" @click="showQRCode"
                                class="btn-secondary text-sm">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M16 12h4.01M12 8h4.01M8 8h.01M8 12h.01M8 16h.01m.01-4h.01m.01-4h.01m.01 0h.01M8 4h.01" />
                                </svg>
                                Show QR Code
                            </button>
                            <button @click="endRollCall" class="btn-primary text-sm">
                                End Roll Call
                            </button>
                        </div>
                    </div>

                    <!-- Progress Summary -->
                    <div class="grid grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-2xl font-bold text-green-600">{{ attendanceStats.presentVoting }}</p>
                            <p class="text-sm text-green-700">Present & Voting</p>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-lg">
                            <p class="text-2xl font-bold text-yellow-600">{{ attendanceStats.present }}</p>
                            <p class="text-sm text-yellow-700">Present Only</p>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <p class="text-2xl font-bold text-gray-600">{{ attendanceStats.absent }}</p>
                            <p class="text-sm text-gray-700">Absent</p>
                        </div>
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <p class="text-2xl font-bold text-blue-600">{{ attendanceStats.total }}</p>
                            <p class="text-sm text-blue-700">Total Delegates</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delegates List -->
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Delegates</h3>
                    <div class="flex items-center space-x-3">
                        <!-- Filter -->
                        <select v-model="statusFilter" class="text-sm border-gray-300 rounded-lg px-3 py-2">
                            <option value="all">All Delegates</option>
                            <option value="present_voting">Present & Voting</option>
                            <option value="present">Present Only</option>
                            <option value="absent">Absent</option>
                        </select>

                        <!-- Search -->
                        <div class="relative">
                            <input v-model="searchQuery" type="text" placeholder="Search delegates..."
                                class="w-48 pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Delegates Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="delegate in filteredDelegates" :key="delegate.id" :class="[
                        'p-4 border rounded-lg transition-all',
                        delegate.attendanceStatus === 'present_voting' ? 'border-green-200 bg-green-50' :
                            delegate.attendanceStatus === 'present' ? 'border-yellow-200 bg-yellow-50' :
                                'border-gray-200 bg-gray-50'
                    ]">
                        <!-- Delegate Info -->
                        <div class="flex items-center space-x-3 mb-3">
                            <div
                                class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span class="text-sm font-bold text-white">
                                    {{ getCountryCode(delegate.country) }}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-medium text-gray-900 truncate">{{ delegate.country }}</h4>
                                <p class="text-xs text-gray-600 truncate">{{ delegate.name }}</p>
                            </div>

                            <!-- Online Status -->
                            <div v-if="delegate.isOnline" class="flex-shrink-0">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></div>
                            </div>
                        </div>

                        <!-- Attendance Status -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-600">Attendance Status</span>
                                <span v-if="delegate.lastUpdated" class="text-gray-500">
                                    {{ formatTime(delegate.lastUpdated) }}
                                </span>
                            </div>

                            <div class="flex space-x-2">
                                <button @click="setAttendance(delegate.id, 'present_voting')"
                                    :disabled="!rollCallActive" :class="[
                                        'flex-1 px-3 py-2 text-xs font-medium rounded transition-colors',
                                        delegate.attendanceStatus === 'present_voting'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                    ]">
                                    Present & Voting
                                </button>

                                <button @click="setAttendance(delegate.id, 'present')" :disabled="!rollCallActive"
                                    :class="[
                                        'flex-1 px-3 py-2 text-xs font-medium rounded transition-colors',
                                        delegate.attendanceStatus === 'present'
                                            ? 'bg-yellow-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                                    ]">
                                    Present
                                </button>

                                <button @click="setAttendance(delegate.id, 'absent')" :disabled="!rollCallActive"
                                    :class="[
                                        'px-3 py-2 text-xs font-medium rounded transition-colors',
                                        delegate.attendanceStatus === 'absent'
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    ]">
                                    Absent
                                </button>
                            </div>

                            <!-- QR Verification Status -->
                            <div v-if="delegate.qrVerified" class="flex items-center space-x-2 text-xs text-green-600">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd" />
                                </svg>
                                <span>QR Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="filteredDelegates.length === 0" class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No delegates found</h3>
                    <p class="mt-1 text-sm text-gray-500">
                        {{ statusFilter !== 'all' ? 'No delegates match the selected filter.' : 'No delegates in this committee.' }}
                    </p>
                </div>
            </div>

            <!-- Quorum Status -->
            <div class="mt-6 p-4 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-medium text-gray-900">Quorum Status</h4>
                        <p class="text-sm text-gray-600">
                            {{ attendanceStats.presentVoting }} present and voting delegates
                        </p>
                    </div>
                    <div class="text-right">
                        <div :class="[
                            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                            hasQuorum ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        ]">
                            <div :class="[
                                'w-2 h-2 rounded-full mr-2',
                                hasQuorum ? 'bg-green-600' : 'bg-red-600'
                            ]"></div>
                            {{ hasQuorum ? 'Quorum Present' : 'No Quorum' }}
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            Minimum {{ quorumRequired }} delegates required
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                    Last updated {{ formatTime(Date.now()) }}
                </div>
                <div class="flex space-x-3">
                    <button v-if="rollCallActive" @click="endRollCall" class="btn-primary">
                        Complete Roll Call
                    </button>
                    <button @click="$emit('close')" class="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <!-- QR Code Modal -->
        <div v-if="showingQRCode"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-strong max-w-md w-full p-6">
                <div class="text-center">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">QR Verification Code</h3>
                    <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                        <!-- QR Code would be generated here -->
                        <div
                            class="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                            <div class="text-center">
                                <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M16 12h4.01M12 8h4.01M8 8h.01M8 12h.01M8 16h.01m.01-4h.01m.01-4h.01m.01 0h.01M8 4h.01" />
                                </svg>
                                <p class="text-sm text-gray-600">QR Code</p>
                                <p class="text-xs text-gray-500 mt-1">Auto-refreshes every 2 minutes</p>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-4">
                        Delegates scan this code to verify their physical presence in the committee room
                    </p>
                    <button @click="showingQRCode = false" class="btn-primary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/socket'

const emit = defineEmits(['close', 'update'])
const props = defineProps({
    committeeId: {
        type: String,
        required: true
    }
})

const authStore = useAuthStore()
const socketStore = useSocketStore()

// State
const delegates = ref([])
const rollCallActive = ref(false)
const rollCallTimer = ref(0)
const qrCodeActive = ref(false)
const showingQRCode = ref(false)
const statusFilter = ref('all')
const searchQuery = ref('')

const settings = reactive({
    enableQRVerification: true,
    timeLimit: 5 // minutes
})

// Timer
let timerInterval = null

// Computed
const attendanceStats = computed(() => {
    const stats = {
        total: delegates.value.length,
        presentVoting: 0,
        present: 0,
        absent: 0
    }

    delegates.value.forEach(delegate => {
        if (delegate.attendanceStatus === 'present_voting') {
            stats.presentVoting++
        } else if (delegate.attendanceStatus === 'present') {
            stats.present++
        } else {
            stats.absent++
        }
    })

    return stats
})

const quorumRequired = computed(() => {
    return Math.ceil(delegates.value.filter(d => d.canVote).length / 2)
})

const hasQuorum = computed(() => {
    return attendanceStats.value.presentVoting >= quorumRequired.value
})

const filteredDelegates = computed(() => {
    let filtered = delegates.value

    // Filter by status
    if (statusFilter.value !== 'all') {
        filtered = filtered.filter(d => d.attendanceStatus === statusFilter.value)
    }

    // Filter by search
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(d =>
            d.country.toLowerCase().includes(query) ||
            d.name.toLowerCase().includes(query)
        )
    }

    return filtered.sort((a, b) => a.country.localeCompare(b.country))
})

// Methods
async function fetchDelegates() {
    try {
        const response = await authStore.apiCall(`/presidium/committee/${props.committeeId}/delegates`)
        if (response.ok) {
            const data = await response.json()
            delegates.value = data.delegates || []
        }
    } catch (error) {
        console.error('Fetch delegates error:', error)
    }
}

async function startRollCall() {
    try {
        const response = await authStore.apiCall(`/presidium/committee/${props.committeeId}/roll-call/start`, {
            method: 'POST',
            body: JSON.stringify({
                enableQRVerification: settings.enableQRVerification,
                timeLimit: settings.timeLimit
            })
        })

        if (response.ok) {
            rollCallActive.value = true
            qrCodeActive.value = settings.enableQRVerification

            if (settings.timeLimit > 0) {
                rollCallTimer.value = settings.timeLimit * 60
                startTimer()
            }

            window.showNotification({
                type: 'success',
                title: 'Roll Call Started',
                message: 'Delegates can now mark their attendance'
            })
        }
    } catch (error) {
        console.error('Start roll call error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to start roll call'
        })
    }
}

async function endRollCall() {
    try {
        const response = await authStore.apiCall(`/presidium/committee/${props.committeeId}/roll-call/end`, {
            method: 'POST'
        })

        if (response.ok) {
            rollCallActive.value = false
            qrCodeActive.value = false
            rollCallTimer.value = 0
            stopTimer()

            // Mark absent delegates as absent
            delegates.value.forEach(delegate => {
                if (!delegate.attendanceStatus) {
                    delegate.attendanceStatus = 'absent'
                }
            })

            emit('update', attendanceStats.value)

            window.showNotification({
                type: 'success',
                title: 'Roll Call Completed',
                message: `${attendanceStats.value.presentVoting} delegates present and voting. ${hasQuorum.value ? 'Quorum established.' : 'No quorum.'}`
            })
        }
    } catch (error) {
        console.error('End roll call error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to end roll call'
        })
    }
}

async function setAttendance(delegateId, status) {
    try {
        const response = await authStore.apiCall(`/presidium/delegates/${delegateId}/attendance`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        })

        if (response.ok) {
            const delegate = delegates.value.find(d => d.id === delegateId)
            if (delegate) {
                delegate.attendanceStatus = status
                delegate.lastUpdated = new Date().toISOString()
            }
        }
    } catch (error) {
        console.error('Set attendance error:', error)
        window.showNotification({
            type: 'error',
            title: 'Error',
            message: 'Failed to update attendance'
        })
    }
}

function showQRCode() {
    showingQRCode.value = true
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval)

    timerInterval = setInterval(() => {
        if (rollCallTimer.value > 0) {
            rollCallTimer.value--
        } else {
            endRollCall()
        }
    }, 1000)
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getCountryCode(country) {
    if (!country) return '??'
    return country.substring(0, 2).toUpperCase()
}

// Initialize
onMounted(() => {
    fetchDelegates()

    // Listen for real-time attendance updates
    const unsubscribe = socketStore.subscribe(`committee:${props.committeeId}:attendance`, (data) => {
        const delegate = delegates.value.find(d => d.id === data.delegateId)
        if (delegate) {
            delegate.attendanceStatus = data.status
            delegate.lastUpdated = data.timestamp
            delegate.qrVerified = data.qrVerified || false
        }
    })

    onUnmounted(() => {
        stopTimer()
        unsubscribe()
    })
})
</script>