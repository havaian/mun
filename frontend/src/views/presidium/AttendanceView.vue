<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Attendance Tracking</h1>
                <p class="text-mun-gray-600">Monitor delegate attendance and quorum status</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="takeAttendance" class="btn-un-primary">
                    <QrCodeIcon class="w-5 h-5 mr-2" />
                    Take Attendance
                </button>
                <button @click="refreshAttendance" :disabled="isLoading" class="btn-un-secondary">
                    <ArrowPathIcon class="w-5 h-5" />
                </button>
            </div>
        </div>

        <!-- Attendance Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <CheckCircleIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Present</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.present }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-red-500/10">
                        <XCircleIcon class="w-6 h-6 text-mun-red-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Absent</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.absent }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <ClockIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Late Arrivals</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.late }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-blue/10">
                        <UsersIcon class="w-6 h-6 text-mun-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Total Countries</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.total }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quorum Status -->
        <div class="mun-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-mun-gray-900">Quorum Status</h2>
                <span :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    quorumStatus.hasQuorum ? 'bg-mun-green-100 text-mun-green-700' : 'bg-mun-red-100 text-mun-red-700'
                ]">
                    {{ quorumStatus.hasQuorum ? 'Quorum Present' : 'No Quorum' }}
                </span>
            </div>

            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-mun-gray-600">Required for quorum:</span>
                    <span class="font-medium text-mun-gray-900">{{ quorumStatus.required }} delegates</span>
                </div>

                <div class="w-full bg-mun-gray-200 rounded-full h-3">
                    <div :class="[
                        'h-3 rounded-full transition-all duration-300',
                        quorumStatus.hasQuorum ? 'bg-mun-green-500' : 'bg-mun-red-500'
                    ]" :style="{ width: `${(stats.present / quorumStatus.required) * 100}%` }"></div>
                </div>

                <div class="flex justify-between text-sm text-mun-gray-600">
                    <span>{{ stats.present }} present</span>
                    <span>{{ Math.round((stats.present / quorumStatus.required) * 100) }}% of required</span>
                </div>
            </div>
        </div>

        <!-- Attendance List -->
        <div class="mun-card">
            <div class="px-6 py-4 border-b border-mun-gray-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Delegate Attendance</h2>
                    <div class="flex items-center space-x-3">
                        <select v-model="statusFilter" class="input-field max-w-xs">
                            <option value="">All Status</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                        <input v-model="searchQuery" type="text" placeholder="Search countries..."
                            class="input-field max-w-xs">
                    </div>
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else class="divide-y divide-mun-gray-200">
                <div v-for="delegate in filteredDelegates" :key="delegate.id"
                    class="p-4 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <!-- Country Flag placeholder -->
                            <div
                                class="w-8 h-6 bg-mun-gray-200 rounded border border-mun-gray-300 flex items-center justify-center">
                                <span class="text-xs text-mun-gray-600">{{ delegate.country.substring(0, 2) }}</span>
                            </div>

                            <div>
                                <h3 class="font-medium text-mun-gray-900">{{ delegate.country }}</h3>
                                <p v-if="delegate.email" class="text-sm text-mun-gray-600">{{ delegate.email }}</p>
                                <p v-if="delegate.specialRole" class="text-xs text-mun-yellow-600">({{
                                    delegate.specialRole }})</p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-4">
                            <div v-if="delegate.status === 'present'" class="text-sm text-mun-gray-500">
                                Arrived {{ formatTime(delegate.arrivedAt) }}
                            </div>

                            <span :class="[
                                'px-3 py-1 rounded-full text-sm font-medium',
                                delegate.status === 'present' ? 'bg-mun-green-100 text-mun-green-700' :
                                    delegate.status === 'late' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                        'bg-mun-red-100 text-mun-red-700'
                            ]">
                                {{ delegate.status === 'present' ? 'Present' :
                                    delegate.status === 'late' ? 'Late' : 'Absent' }}
                            </span>

                            <div class="flex items-center space-x-2">
                                <button @click="markPresent(delegate)" :disabled="delegate.status === 'present'"
                                    class="btn-un-secondary px-3 py-1 text-sm">
                                    <CheckIcon class="w-4 h-4" />
                                </button>

                                <button @click="markAbsent(delegate)" :disabled="delegate.status === 'absent'"
                                    class="px-3 py-1 bg-mun-red-500 hover:bg-mun-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors">
                                    <XMarkIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Attendance History -->
        <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Recent Attendance Changes</h2>
            <div class="space-y-3">
                <div v-for="change in attendanceHistory" :key="change.id"
                    class="flex items-center justify-between p-3 bg-mun-gray-50 rounded-lg">
                    <div>
                        <p class="text-sm font-medium text-mun-gray-900">
                            {{ change.country }} marked as {{ change.status }}
                        </p>
                        <p class="text-xs text-mun-gray-500">
                            by {{ change.markedBy }} • {{ formatTime(change.timestamp) }}
                        </p>
                    </div>
                    <span :class="[
                        'w-2 h-2 rounded-full',
                        change.status === 'present' ? 'bg-mun-green-500' :
                            change.status === 'late' ? 'bg-mun-yellow-500' :
                                'bg-mun-red-500'
                    ]"></span>
                </div>

                <div v-if="attendanceHistory.length === 0" class="text-center py-4 text-mun-gray-500">
                    No recent attendance changes
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    QrCodeIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UsersIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const delegates = ref([])
const attendanceHistory = ref([])

const stats = reactive({
    present: 0,
    absent: 0,
    late: 0,
    total: 0
})

const quorumStatus = reactive({
    hasQuorum: false,
    required: 24 // 50% + 1
})

// Computed
const filteredDelegates = computed(() => {
    let filtered = delegates.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(delegate =>
            delegate.country.toLowerCase().includes(query) ||
            delegate.email?.toLowerCase().includes(query)
        )
    }

    if (statusFilter.value) {
        filtered = filtered.filter(delegate => delegate.status === statusFilter.value)
    }

    return filtered.sort((a, b) => a.country.localeCompare(b.country))
})

// Methods
const loadAttendanceData = async () => {
    try {
        isLoading.value = true

        // Sample delegates data
        delegates.value = [
            {
                id: 1,
                country: "United States",
                email: "usa@example.com",
                status: "present",
                arrivedAt: new Date(Date.now() - 1800000).toISOString()
            },
            {
                id: 2,
                country: "United Kingdom",
                email: "uk@example.com",
                status: "present",
                arrivedAt: new Date(Date.now() - 1200000).toISOString()
            },
            {
                id: 3,
                country: "France",
                email: "france@example.com",
                status: "late",
                arrivedAt: new Date(Date.now() - 600000).toISOString()
            },
            {
                id: 4,
                country: "Germany",
                email: "germany@example.com",
                status: "absent"
            },
            {
                id: 5,
                country: "Russian Federation",
                email: "russia@example.com",
                status: "present",
                arrivedAt: new Date(Date.now() - 2400000).toISOString()
            }
        ]

        // Sample attendance history
        attendanceHistory.value = [
            {
                id: 1,
                country: "France",
                status: "late",
                markedBy: "Chairman",
                timestamp: new Date(Date.now() - 600000).toISOString()
            },
            {
                id: 2,
                country: "United Kingdom",
                status: "present",
                markedBy: "Secretary",
                timestamp: new Date(Date.now() - 1200000).toISOString()
            }
        ]

        updateStats()

    } catch (error) {
        toast.error('Load attendance error:', error)
        toast.error('Failed to load attendance data')
    } finally {
        isLoading.value = false
    }
}

const updateStats = () => {
    stats.present = delegates.value.filter(d => d.status === 'present').length
    stats.absent = delegates.value.filter(d => d.status === 'absent').length
    stats.late = delegates.value.filter(d => d.status === 'late').length
    stats.total = delegates.value.length

    quorumStatus.hasQuorum = stats.present >= quorumStatus.required
}

const markPresent = async (delegate) => {
    try {
        const oldStatus = delegate.status
        delegate.status = 'present'
        delegate.arrivedAt = new Date().toISOString()

        updateStats()
        addAttendanceChange(delegate.country, 'present')

        toast.success(`${delegate.country} marked as present`)
    } catch (error) {
        toast.error('Mark present error:', error)
        toast.error('Failed to mark delegate as present')
    }
}

const markAbsent = async (delegate) => {
    try {
        delegate.status = 'absent'
        delegate.arrivedAt = null

        updateStats()
        addAttendanceChange(delegate.country, 'absent')

        toast.success(`${delegate.country} marked as absent`)
    } catch (error) {
        toast.error('Mark absent error:', error)
        toast.error('Failed to mark delegate as absent')
    }
}

const takeAttendance = () => {
    toast.log('QR-based attendance taking would start here')
    // TODO: Open QR scanner or attendance modal
}

const refreshAttendance = async () => {
    await loadAttendanceData()
    toast.success('Attendance data refreshed')
}

const addAttendanceChange = (country, status) => {
    attendanceHistory.value.unshift({
        id: Date.now(),
        country,
        status,
        markedBy: authStore.user?.presidiumRole || 'Presidium',
        timestamp: new Date().toISOString()
    })

    // Keep only last 10 changes
    if (attendanceHistory.value.length > 10) {
        attendanceHistory.value = attendanceHistory.value.slice(0, 10)
    }
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) {
        return `${diffMins}m ago`
    } else if (diffHours < 24) {
        return `${diffHours}h ago`
    } else {
        return date.toLocaleDateString()
    }
}

// Lifecycle
onMounted(() => {
    loadAttendanceData()
})
</script>