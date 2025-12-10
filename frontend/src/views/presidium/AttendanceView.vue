<template>
    <div class="h-screen flex flex-col bg-gray-50">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-3 text-blue-600 mb-2">
                        <UsersIcon class="w-6 h-6" />
                        <h1 class="text-2xl font-bold text-gray-900">Official Roll Call</h1>
                    </div>
                    <p class="text-gray-600">Manage delegate attendance and quorum.</p>
                </div>
                <div class="flex space-x-3">
                    <button @click="resetRollCall" :disabled="isLoading"
                        class="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <ArrowPathIcon class="w-4 h-4 mr-2" />
                        Reset
                    </button>
                    <button @click="toggleRollCall" :disabled="isLoading" :class="[
                        'flex items-center px-6 py-2 rounded-lg transition-colors',
                        rollCallActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                    ]">
                        <PlayIcon v-if="!rollCallActive" class="w-4 h-4 mr-2" />
                        <StopIcon v-else class="w-4 h-4 mr-2" />
                        {{ rollCallActive ? 'End Roll Call' : 'Start Roll Call' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Quorum Status Cards -->
        <div class="bg-white border-b border-gray-200 px-6 py-6">
            <div class="grid grid-cols-4 gap-6">
                <!-- Quorum Status -->
                <div class="text-center">
                    <div class="text-sm text-gray-500 uppercase mb-2">QUORUM STATUS</div>
                    <div :class="[
                        'text-2xl font-bold mb-1',
                        quorumData.hasQuorum ? 'text-green-600' : 'text-red-600'
                    ]">
                        {{ quorumData.hasQuorum ? 'QUORUM' : 'NO QUORUM' }}
                    </div>
                    <div class="text-sm text-gray-500">
                        Required: {{ quorumData.required }} / Present: {{ quorumData.presentVoting }}
                    </div>
                </div>

                <!-- Present -->
                <div class="text-center">
                    <div class="text-sm text-gray-500 uppercase mb-2">PRESENT</div>
                    <div class="flex items-center justify-center mb-1">
                        <CheckIcon class="w-6 h-6 text-blue-600 mr-2" />
                        <span class="text-3xl font-bold text-gray-900">{{ attendanceCounts.present }}</span>
                    </div>
                    <div class="text-sm text-gray-500">Non-voting attendance</div>
                </div>

                <!-- Present & Voting -->
                <div class="text-center">
                    <div class="text-sm text-gray-500 uppercase mb-2">PRESENT & VOTING</div>
                    <div class="flex items-center justify-center mb-1">
                        <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                            <CheckIcon class="w-4 h-4 text-white" />
                        </div>
                        <span class="text-3xl font-bold text-green-600">{{ attendanceCounts.presentVoting }}</span>
                    </div>
                    <div class="text-sm text-gray-500">Eligible to vote</div>
                </div>

                <!-- Absent -->
                <div class="text-center">
                    <div class="text-sm text-gray-500 uppercase mb-2">ABSENT</div>
                    <div class="flex items-center justify-center mb-1">
                        <XMarkIcon class="w-6 h-6 text-red-600 mr-2" />
                        <span class="text-3xl font-bold text-red-600">{{ attendanceCounts.absent }}</span>
                    </div>
                    <div class="text-sm text-gray-500">Not participating</div>
                </div>
            </div>
        </div>

        <!-- Member States List -->
        <div class="flex-1 overflow-hidden">
            <div class="h-full flex flex-col">
                <!-- List Header -->
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-gray-900">
                            Member States ({{ countries.length }})
                        </h3>
                        <div class="flex items-center space-x-4">
                            <select v-model="statusFilter" class="text-sm border-gray-300 rounded-lg">
                                <option value="all">All Countries</option>
                                <option value="present_and_voting">Present & Voting</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                            </select>
                            <div class="relative">
                                <MagnifyingGlassIcon
                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input v-model="searchQuery" type="text" placeholder="Search countries..."
                                    class="pl-10 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Countries List -->
                <div class="flex-1 overflow-y-auto">
                    <div class="divide-y divide-gray-200">
                        <div v-for="country in filteredCountries" :key="country.name"
                            class="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                            <!-- Country Info -->
                            <div class="flex items-center space-x-4">
                                <CountryFlag :country-name="country.name" :country-code="country.code" size="medium"
                                        variant="bordered" />
                                <div>
                                    <div class="font-medium text-gray-900">{{ country.name }}</div>
                                    <div class="text-sm text-gray-500">
                                        Status: <span :class="getStatusColor(country.attendanceStatus)">
                                            {{ getStatusLabel(country.attendanceStatus) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex space-x-2">
                                <button @click="updateAttendance(country.name, 'present')" :class="[
                                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                                    country.attendanceStatus === 'present'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                ]">
                                    Present
                                </button>
                                <button @click="updateAttendance(country.name, 'present_and_voting')" :class="[
                                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                                    country.attendanceStatus === 'present_and_voting'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                ]">
                                    Present & Voting
                                </button>
                                <button @click="updateAttendance(country.name, 'absent')" :class="[
                                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                                    country.attendanceStatus === 'absent'
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                ]">
                                    Absent
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-if="filteredCountries.length === 0" class="text-center py-12">
                        <UsersIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No countries found</h3>
                        <p class="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { wsService } from '@/plugins/websocket'
import { apiMethods } from '@/utils/api'
import sessionApi from '@/utils/sessionApi'
import { updatedApiMethods } from '@/utils/sessionApi'
import CountryFlag from '@/components/shared/CountryFlag.vue'

// Icons
import {
    UsersIcon, PlayIcon, StopIcon, ArrowPathIcon, CheckIcon,
    XMarkIcon, MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

// Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const rollCallActive = ref(false)
const countries = ref([])
const attendanceData = ref([])
const quorumData = ref({
    hasQuorum: false,
    required: 0,
    presentVoting: 0
})

// Filters
const statusFilter = ref('all')
const searchQuery = ref('')

// Current session
const currentSession = ref(null)
const committee = ref(null)

// Computed
const attendanceCounts = computed(() => {
    const counts = {
        present: 0,
        presentVoting: 0,
        absent: 0
    }

    countries.value.forEach(country => {
        const status = country.attendanceStatus || 'absent'
        if (status === 'present') {
            counts.present++
        } else if (status === 'present_and_voting') {
            counts.presentVoting++
        } else {
            counts.absent++
        }
    })

    return counts
})

const filteredCountries = computed(() => {
    let filtered = countries.value

    // Apply status filter
    if (statusFilter.value !== 'all') {
        filtered = filtered.filter(country =>
            (country.attendanceStatus || 'absent') === statusFilter.value
        )
    }

    // Apply search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(country =>
            country.name.toLowerCase().includes(query)
        )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

// Methods
const loadData = async () => {
    try {
        isLoading.value = true

        // Get committee from auth context
        committee.value = authStore.user?.committeeId
        if (!committee.value) {
            throw new Error('No committee assigned')
        }

        // Set countries from committee
        countries.value = committee.value.countries.map(country => ({
            ...country,
            attendanceStatus: 'absent' // Default status
        }))

        // Load active session and attendance data
        await loadActiveSession()

    } catch (error) {
        console.error('Failed to load attendance data:', error)
        toast.error('Failed to load attendance data')
    } finally {
        isLoading.value = false
    }
}

const loadActiveSession = async () => {
    try {
        const response = await sessionApi.sessions.getByCommittee(committee.value._id, {
            status: 'active',
            limit: 1
        })

        if (response.data.success && response.data.sessions?.length > 0) {
            currentSession.value = response.data.sessions[0]

            // Load session attendance data
            await loadAttendanceData()
        }
    } catch (error) {
        console.error('Failed to load active session:', error)
    }
}

const loadAttendanceData = async () => {
    if (!currentSession.value?._id) return

    try {
        // Get session details instead of attendance endpoint
        const response = await sessionApi.sessions.getById(currentSession.value._id)

        if (response.data.success) {
            const sessionData = response.data.session
            rollCallActive.value = sessionData.rollCall?.isActive || false
            
            // Update quorum data from session
            if (sessionData.quorum) {
                quorumData.value = sessionData.quorum
            } else {
                quorumData.value = {
                    hasQuorum: false,
                    required: Math.floor(countries.value.length / 2) + 1,
                    presentVoting: 0
                }
            }

            // Update country attendance status from session attendance data
            if (sessionData.attendance && sessionData.attendance.length > 0) {
                sessionData.attendance.forEach(attendanceRecord => {
                    const countryIndex = countries.value.findIndex(c => c.name === attendanceRecord.country)
                    if (countryIndex !== -1) {
                        countries.value[countryIndex].attendanceStatus = attendanceRecord.status
                    }
                })
            }
        }
    } catch (error) {
        console.error('Failed to load attendance data:', error)
    }
}

const toggleRollCall = async () => {
    if (!currentSession.value?._id) {
        toast.error('No active session found')
        return
    }

    try {
        isLoading.value = true

        if (rollCallActive.value) {
            // End roll call
            const response = await sessionApi.rollCall.end(currentSession.value._id)
            if (response.data.success) {
                rollCallActive.value = false
                quorumData.value = response.data.quorum
                toast.success('Roll call ended')
            }
        } else {
            // Start roll call
            const response = await sessionApi.rollCall.start(currentSession.value._id, {
                timeLimit: 10 // 10 minutes default
            })
            if (response.data.success) {
                rollCallActive.value = true
                toast.success('Roll call started')
            }
        }
    } catch (error) {
        console.error('Failed to toggle roll call:', error)
        toast.error('Failed to toggle roll call')
    } finally {
        isLoading.value = false
    }
}

const resetRollCall = async () => {
    try {
        isLoading.value = true

        // Reset all attendance to absent
        countries.value.forEach(country => {
            country.attendanceStatus = 'absent'
        })

        quorumData.value = {
            hasQuorum: false,
            required: Math.floor(countries.value.length / 2) + 1,
            presentVoting: 0
        }

        toast.success('Roll call reset')
    } catch (error) {
        console.error('Failed to reset roll call:', error)
        toast.error('Failed to reset roll call')
    } finally {
        isLoading.value = false
    }
}

const updateAttendance = async (countryName, status) => {
    if (!currentSession.value?._id) {
        toast.error('No active session found')
        return
    }

    try {
        const response = await sessionApi.rollCall.markAttendance(currentSession.value._id, {
            country: countryName,
            status: status,
            email: countries.value.find(c => c.name === countryName)?.email
        })

        if (response.data.success) {
            // Update local state
            const countryIndex = countries.value.findIndex(c => c.name === countryName)
            if (countryIndex !== -1) {
                countries.value[countryIndex].attendanceStatus = status
            }

            // Update quorum data from response
            if (response.data.quorum) {
                quorumData.value = response.data.quorum
            }

            toast.success(`${countryName} marked as ${getStatusLabel(status)}`)
        }
    } catch (error) {
        console.error('Failed to update attendance:', error)
        toast.error('Failed to update attendance')
    }
}

// Utility methods
const getStatusLabel = (status) => {
    const labels = {
        'present_and_voting': 'Present & Voting',
        'present': 'Present',
        'absent': 'Absent'
    }
    return labels[status] || 'Absent'
}

const getStatusColor = (status) => {
    const colors = {
        'present_and_voting': 'text-green-600 font-medium',
        'present': 'text-blue-600 font-medium',
        'absent': 'text-red-600 font-medium'
    }
    return colors[status] || 'text-red-600 font-medium'
}

// WebSocket listeners
const setupWebSocketListeners = () => {
    wsService.on('roll-call-started', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallActive.value = true
        }
    })

    wsService.on('roll-call-ended', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            rollCallActive.value = false
            quorumData.value = data.quorum
        }
    })

    wsService.on('attendance-updated', (data) => {
        if (data.sessionId === currentSession.value?._id) {
            quorumData.value = data.quorum
        }
    })
}

// Watchers
watch(attendanceCounts, (newCounts) => {
    quorumData.value.presentVoting = newCounts.presentVoting
    quorumData.value.required = Math.floor(countries.value.length / 2) + 1
    quorumData.value.hasQuorum = newCounts.presentVoting >= quorumData.value.required
}, { deep: true })

// Lifecycle
onMounted(async () => {
    await loadData()
    setupWebSocketListeners()
})
</script>