<!-- frontend/src/components/presidium/AttendanceTracker.vue -->
<template>
    <div class="attendance-tracker bg-white border border-mun-gray-200 rounded-lg p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-un-blue/10 rounded-lg">
                    <UserGroupIcon class="w-5 h-5 text-un-blue" />
                </div>
                <div>
                    <h3 class="text-sm font-medium text-mun-gray-900">Attendance Tracker</h3>
                    <p class="text-xs text-mun-gray-500">Real-time attendance monitoring</p>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <!-- QR Scanner Button -->
                <button @click="showQRScanner = true" class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors"
                    title="QR Check-in">
                    <QrCodeIcon class="w-4 h-4 text-mun-gray-600" />
                </button>

                <!-- Refresh Button -->
                <button @click="refreshAttendance" :disabled="isLoading"
                    class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors" title="Refresh attendance">
                    <ArrowPathIcon class="w-4 h-4 text-mun-gray-600" />
                </button>

                <!-- Export Button -->
                <button @click="exportAttendance" class="p-1.5 rounded hover:bg-mun-gray-100 transition-colors"
                    title="Export attendance">
                    <DocumentArrowDownIcon class="w-4 h-4 text-mun-gray-600" />
                </button>
            </div>
        </div>

        <!-- Attendance Summary -->
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center p-3 bg-mun-green-50 rounded-lg">
                <div class="flex items-center justify-center mb-1">
                    <div class="w-3 h-3 bg-mun-green-500 rounded-full mr-2"></div>
                    <span class="text-lg font-bold text-mun-green-700">{{ attendanceStats.present }}</span>
                </div>
                <p class="text-xs text-mun-gray-600">Present</p>
            </div>

            <div class="text-center p-3 bg-mun-red-50 rounded-lg">
                <div class="flex items-center justify-center mb-1">
                    <div class="w-3 h-3 bg-mun-red-500 rounded-full mr-2"></div>
                    <span class="text-lg font-bold text-mun-red-700">{{ attendanceStats.absent }}</span>
                </div>
                <p class="text-xs text-mun-gray-600">Absent</p>
            </div>

            <div class="text-center p-3 bg-mun-gray-50 rounded-lg">
                <div class="flex items-center justify-center mb-1">
                    <div class="w-3 h-3 bg-mun-gray-400 rounded-full mr-2"></div>
                    <span class="text-lg font-bold text-mun-gray-700">{{ attendanceStats.unmarked }}</span>
                </div>
                <p class="text-xs text-mun-gray-600">Unmarked</p>
            </div>
        </div>

        <!-- Quorum Status -->
        <QuorumIndicator :present="attendanceStats.present" :total="totalCountries" :required="quorumRequired"
            class="mb-4" />

        <!-- Search and Filter -->
        <div class="flex items-center space-x-3 mb-4">
            <div class="flex-1">
                <input v-model="searchQuery" type="text" placeholder="Search countries..."
                    class="w-full px-3 py-2 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-un-blue" />
            </div>

            <select v-model="filterStatus"
                class="px-3 py-2 text-sm border border-mun-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-un-blue">
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="unmarked">Unmarked</option>
            </select>

            <button @click="markAllPresent" :disabled="isUpdating"
                class="px-3 py-2 text-sm font-medium text-white bg-mun-green-600 rounded hover:bg-mun-green-700 transition-colors disabled:opacity-50">
                Mark All Present
            </button>
        </div>

        <!-- Attendance List -->
        <div class="attendance-list">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>

            <!-- Country List -->
            <div v-else class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="country in filteredCountries" :key="country.email" :class="getCountryRowClass(country)"
                    class="country-row flex items-center justify-between p-3 rounded-lg border transition-all duration-200">
                    <!-- Country Info -->
                    <div class="flex items-center space-x-3 flex-1">
                        <CountryFlag :country="country.name" size="sm" />

                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="text-sm font-medium text-mun-gray-900">{{ country.name }}</span>
                                <span v-if="country.specialRole" :class="getSpecialRoleBadgeClass(country.specialRole)"
                                    class="px-2 py-0.5 text-xs font-medium rounded-full">
                                    {{ getSpecialRoleText(country.specialRole) }}
                                </span>
                            </div>

                            <div class="flex items-center space-x-4 text-xs text-mun-gray-500">
                                <span>{{ country.email }}</span>
                                <span v-if="getAttendanceRecord(country.email)?.lastMarked" class="flex items-center">
                                    <ClockIcon class="w-3 h-3 mr-1" />
                                    {{ formatTime(getAttendanceRecord(country.email).lastMarked) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Status -->
                    <div class="flex items-center space-x-3">
                        <!-- Status Indicator -->
                        <div class="flex items-center space-x-2">
                            <div :class="getStatusDotClass(country.email)" class="w-3 h-3 rounded-full"></div>
                            <span :class="getStatusTextClass(country.email)" class="text-sm font-medium">
                                {{ getAttendanceStatusText(country.email) }}
                            </span>
                        </div>

                        <!-- Quick Actions -->
                        <div class="flex items-center space-x-1">
                            <button @click="markAttendance(country.email, true)" :disabled="isUpdating"
                                :class="getPresentButtonClass(country.email)"
                                class="px-2 py-1 text-xs font-medium border rounded transition-colors disabled:opacity-50">
                                <CheckIcon class="w-3 h-3" />
                            </button>

                            <button @click="markAttendance(country.email, false)" :disabled="isUpdating"
                                :class="getAbsentButtonClass(country.email)"
                                class="px-2 py-1 text-xs font-medium border rounded transition-colors disabled:opacity-50">
                                <XMarkIcon class="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!isLoading && filteredCountries.length === 0"
                class="flex flex-col items-center justify-center py-8 text-center">
                <div class="p-3 bg-mun-gray-100 rounded-lg mb-3">
                    <UserGroupIcon class="w-6 h-6 text-mun-gray-400" />
                </div>
                <p class="text-sm font-medium text-mun-gray-900 mb-1">No countries found</p>
                <p class="text-xs text-mun-gray-500">Try adjusting your search or filters</p>
            </div>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedCountries.length > 0" class="bulk-actions mt-4 pt-3 border-t border-mun-gray-200">
            <div class="flex items-center justify-between">
                <span class="text-sm text-mun-gray-600">
                    {{ selectedCountries.length }} countries selected
                </span>

                <div class="flex items-center space-x-2">
                    <button @click="bulkMarkAttendance(true)" :disabled="isUpdating"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-mun-green-600 rounded hover:bg-mun-green-700 transition-colors disabled:opacity-50">
                        Mark Present
                    </button>

                    <button @click="bulkMarkAttendance(false)" :disabled="isUpdating"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-mun-red-600 rounded hover:bg-mun-red-700 transition-colors disabled:opacity-50">
                        Mark Absent
                    </button>

                    <button @click="clearSelection"
                        class="px-3 py-1.5 text-sm font-medium text-mun-gray-700 bg-mun-gray-100 rounded hover:bg-mun-gray-200 transition-colors">
                        Clear
                    </button>
                </div>
            </div>
        </div>

        <!-- QR Scanner Modal -->
        <QRScannerModal v-if="showQRScanner" v-model="showQRScanner" @qr-scanned="handleQRScan" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
    UserGroupIcon,
    QrCodeIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
    ClockIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import QuorumIndicator from './QuorumIndicator.vue'
import QRScannerModal from '@/components/shared/QRScannerModal.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useSessionStore } from '@/stores/session'
import { useWebSocketStore } from '@/stores/websocket'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    sessionId: {
        type: String,
        required: true
    },
    countries: {
        type: Array,
        default: () => []
    },
    autoRefresh: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits(['attendance-updated', 'quorum-changed'])

const sessionStore = useSessionStore()
const wsStore = useWebSocketStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isUpdating = ref(false)
const showQRScanner = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const selectedCountries = ref([])
const attendance = ref([])
const refreshInterval = ref(null)

// Configuration
const quorumRequired = computed(() => {
    // Default quorum is 50% + 1, but can be configured per committee
    return Math.floor(totalCountries.value / 2) + 1
})

const totalCountries = computed(() => {
    return props.countries.length
})

// Computed
const attendanceStats = computed(() => {
    const stats = {
        present: 0,
        absent: 0,
        unmarked: 0,
        total: totalCountries.value
    }

    props.countries.forEach(country => {
        const record = getAttendanceRecord(country.email)
        if (record?.present === true) {
            stats.present++
        } else if (record?.present === false) {
            stats.absent++
        } else {
            stats.unmarked++
        }
    })

    return stats
})

const filteredCountries = computed(() => {
    let filtered = [...props.countries]

    // Search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(country =>
            country.name.toLowerCase().includes(query) ||
            country.email.toLowerCase().includes(query)
        )
    }

    // Status filter
    if (filterStatus.value) {
        filtered = filtered.filter(country => {
            const record = getAttendanceRecord(country.email)
            switch (filterStatus.value) {
                case 'present':
                    return record?.present === true
                case 'absent':
                    return record?.present === false
                case 'unmarked':
                    return record?.present == null
                default:
                    return true
            }
        })
    }

    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Methods
const getAttendanceRecord = (email) => {
    return attendance.value.find(record => record.email === email)
}

const getCountryRowClass = (country) => {
    const record = getAttendanceRecord(country.email)

    if (record?.present === true) {
        return 'bg-mun-green-50 border-mun-green-200'
    } else if (record?.present === false) {
        return 'bg-mun-red-50 border-mun-red-200'
    }

    return 'bg-white border-mun-gray-200 hover:bg-mun-gray-50'
}

const getStatusDotClass = (email) => {
    const record = getAttendanceRecord(email)

    if (record?.present === true) return 'bg-mun-green-500'
    if (record?.present === false) return 'bg-mun-red-500'
    return 'bg-mun-gray-400'
}

const getStatusTextClass = (email) => {
    const record = getAttendanceRecord(email)

    if (record?.present === true) return 'text-mun-green-700'
    if (record?.present === false) return 'text-mun-red-700'
    return 'text-mun-gray-500'
}

const getAttendanceStatusText = (email) => {
    const record = getAttendanceRecord(email)

    if (record?.present === true) return 'Present'
    if (record?.present === false) return 'Absent'
    return 'Unmarked'
}

const getPresentButtonClass = (email) => {
    const record = getAttendanceRecord(email)
    const isPresent = record?.present === true

    return isPresent
        ? 'text-white bg-mun-green-600 border-mun-green-600'
        : 'text-mun-green-700 bg-mun-green-100 border-mun-green-200 hover:bg-mun-green-200'
}

const getAbsentButtonClass = (email) => {
    const record = getAttendanceRecord(email)
    const isAbsent = record?.present === false

    return isAbsent
        ? 'text-white bg-mun-red-600 border-mun-red-600'
        : 'text-mun-red-700 bg-mun-red-100 border-mun-red-200 hover:bg-mun-red-200'
}

const getSpecialRoleBadgeClass = (role) => {
    const classes = {
        'security-council': 'bg-mun-red-100 text-mun-red-800',
        'observer': 'bg-mun-blue-100 text-mun-blue-800',
        'president': 'bg-mun-yellow-100 text-mun-yellow-800'
    }
    return classes[role] || 'bg-mun-gray-100 text-mun-gray-800'
}

const getSpecialRoleText = (role) => {
    const texts = {
        'security-council': 'Security Council',
        'observer': 'Observer',
        'president': 'President'
    }
    return texts[role] || role
}

const formatTime = (timestamp) => {
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return 'Unknown'
    }
}

const markAttendance = async (email, present) => {
    try {
        isUpdating.value = true

        const attendanceData = {
            email,
            present,
            sessionId: props.sessionId
        }

        const response = await apiMethods.sessions.markAttendance(props.sessionId, attendanceData)

        if (response.data.success) {
            // Update local attendance record
            const existingIndex = attendance.value.findIndex(record => record.email === email)
            const newRecord = {
                email,
                present,
                lastMarked: new Date(),
                markedBy: 'presidium'
            }

            if (existingIndex >= 0) {
                attendance.value[existingIndex] = newRecord
            } else {
                attendance.value.push(newRecord)
            }

            emit('attendance-updated', {
                email,
                present,
                stats: attendanceStats.value
            })

            // Check quorum change
            const hasQuorum = attendanceStats.value.present >= quorumRequired.value
            emit('quorum-changed', hasQuorum)

            toast.success(`Marked ${present ? 'present' : 'absent'}`)
        }

    } catch (error) {
        console.error('Mark attendance error:', error)
        toast.error('Failed to update attendance')
    } finally {
        isUpdating.value = false
    }
}

const markAllPresent = async () => {
    try {
        isUpdating.value = true

        const updates = props.countries.map(country => ({
            email: country.email,
            present: true
        }))

        const response = await apiMethods.sessions.bulkMarkAttendance(props.sessionId, {
            updates
        })

        if (response.data.success) {
            // Update all local records
            attendance.value = props.countries.map(country => ({
                email: country.email,
                present: true,
                lastMarked: new Date(),
                markedBy: 'presidium'
            }))

            emit('attendance-updated', {
                bulk: true,
                stats: attendanceStats.value
            })

            emit('quorum-changed', true) // All present means quorum achieved

            toast.success('All delegates marked present')
        }

    } catch (error) {
        console.error('Mark all present error:', error)
        toast.error('Failed to mark all present')
    } finally {
        isUpdating.value = false
    }
}

const bulkMarkAttendance = async (present) => {
    try {
        isUpdating.value = true

        const updates = selectedCountries.value.map(email => ({
            email,
            present
        }))

        const response = await apiMethods.sessions.bulkMarkAttendance(props.sessionId, {
            updates
        })

        if (response.data.success) {
            // Update local records
            selectedCountries.value.forEach(email => {
                const existingIndex = attendance.value.findIndex(record => record.email === email)
                const newRecord = {
                    email,
                    present,
                    lastMarked: new Date(),
                    markedBy: 'presidium'
                }

                if (existingIndex >= 0) {
                    attendance.value[existingIndex] = newRecord
                } else {
                    attendance.value.push(newRecord)
                }
            })

            emit('attendance-updated', {
                bulk: true,
                count: selectedCountries.value.length,
                stats: attendanceStats.value
            })

            const hasQuorum = attendanceStats.value.present >= quorumRequired.value
            emit('quorum-changed', hasQuorum)

            clearSelection()
            toast.success(`${selectedCountries.value.length} delegates marked ${present ? 'present' : 'absent'}`)
        }

    } catch (error) {
        console.error('Bulk mark attendance error:', error)
        toast.error('Failed to update attendance')
    } finally {
        isUpdating.value = false
    }
}

const clearSelection = () => {
    selectedCountries.value = []
}

const refreshAttendance = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.sessions.getSessionAttendance(props.sessionId)

        if (response.data.success) {
            attendance.value = response.data.attendance || []
        }

    } catch (error) {
        console.error('Refresh attendance error:', error)
        toast.error('Failed to refresh attendance')
    } finally {
        isLoading.value = false
    }
}

const exportAttendance = async () => {
    try {
        const response = await apiMethods.sessions.exportAttendance(props.sessionId)

        // Create download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `attendance-${props.sessionId}.csv`
        link.click()
        window.URL.revokeObjectURL(url)

        toast.success('Attendance exported successfully')

    } catch (error) {
        console.error('Export attendance error:', error)
        toast.error('Failed to export attendance')
    }
}

const handleQRScan = async (qrData) => {
    try {
        // Parse QR data to extract country/delegate info
        const response = await apiMethods.auth.verifyQRToken(qrData)

        if (response.data.success && response.data.delegate) {
            const email = response.data.delegate.email
            await markAttendance(email, true)

            toast.success(`${response.data.delegate.country} checked in via QR`)
        } else {
            toast.error('Invalid QR code')
        }

    } catch (error) {
        console.error('QR scan error:', error)
        toast.error('Failed to process QR check-in')
    }
}

const setupAutoRefresh = () => {
    if (props.autoRefresh && !refreshInterval.value) {
        refreshInterval.value = setInterval(refreshAttendance, 60000) // Refresh every minute
    }
}

const clearAutoRefresh = () => {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
    }
}

// WebSocket listeners
const handleAttendanceUpdate = (data) => {
    // Update local attendance when received via WebSocket
    const existingIndex = attendance.value.findIndex(record => record.email === data.email)

    if (existingIndex >= 0) {
        attendance.value[existingIndex] = data
    } else {
        attendance.value.push(data)
    }

    emit('attendance-updated', {
        email: data.email,
        present: data.present,
        stats: attendanceStats.value
    })
}

// Lifecycle
onMounted(async () => {
    await refreshAttendance()
    setupAutoRefresh()

    // Listen for real-time attendance updates
    if (wsStore.isConnected) {
        wsStore.on('attendance-updated', handleAttendanceUpdate)
    }
})

onUnmounted(() => {
    clearAutoRefresh()

    if (wsStore.isConnected) {
        wsStore.off('attendance-updated', handleAttendanceUpdate)
    }
})

// Watch for WebSocket connection changes
watch(() => wsStore.isConnected, (connected) => {
    if (connected) {
        wsStore.on('attendance-updated', handleAttendanceUpdate)
    } else {
        wsStore.off('attendance-updated', handleAttendanceUpdate)
    }
})
</script>

<style scoped>
.attendance-list {
    min-height: 200px;
}

.country-row {
    transition: all 0.2s ease;
}

.country-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Custom scrollbar */
.attendance-list .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.attendance-list .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.attendance-list .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.attendance-list .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .grid.grid-cols-3 {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .flex.items-center.justify-between {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .country-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }
}
</style>