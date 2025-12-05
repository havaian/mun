<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Attendance Management</h1>
                <p class="text-mun-gray-600">{{ committee?.name || 'Loading...' }}</p>
            </div>
            <div class="flex items-center space-x-3">
                <button @click="loadAttendance" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors"
                    :disabled="isLoading">
                    <ArrowPathIcon class="w-5 h-5 text-mun-gray-600" :class="{ 'animate-spin': isLoading }" />
                </button>
            </div>
        </div>

        <!-- No Active Session Warning -->
        <div v-if="!currentSession" class="mun-card p-6">
            <div class="flex items-center space-x-3 text-mun-yellow-700">
                <ExclamationTriangleIcon class="w-6 h-6 flex-shrink-0" />
                <div>
                    <h3 class="font-semibold">No Active Session</h3>
                    <p class="text-sm">You need an active session to take attendance.</p>
                </div>
            </div>
            <RouterLink to="/presidium/sessions" class="mt-4 btn-un-primary inline-block">
                Go to Sessions
            </RouterLink>
        </div>

        <template v-else>
            <!-- Quorum Status Card -->
            <div class="mun-card p-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div :class="[
                            'p-4 rounded-xl',
                            hasQuorum ? 'bg-mun-green-100' : 'bg-mun-red-100'
                        ]">
                            <CheckCircleIcon v-if="hasQuorum" class="w-8 h-8 text-mun-green-600" />
                            <XCircleIcon v-else class="w-8 h-8 text-mun-red-600" />
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-mun-gray-900">
                                {{ hasQuorum ? 'Quorum Achieved' : 'No Quorum' }}
                            </h3>
                            <p class="text-mun-gray-600">
                                {{ votingCount }} / {{ quorumRequired }} delegates voting
                            </p>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-6 text-center">
                        <div>
                            <p class="text-3xl font-bold text-mun-green-600">{{ presentVotingCount }}</p>
                            <p class="text-sm text-mun-gray-600">Present & Voting</p>
                        </div>
                        <div>
                            <p class="text-3xl font-bold text-mun-yellow-600">{{ presentCount }}</p>
                            <p class="text-sm text-mun-gray-600">Present</p>
                        </div>
                        <div>
                            <p class="text-3xl font-bold text-mun-red-600">{{ absentCount }}</p>
                            <p class="text-sm text-mun-gray-600">Absent</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bulk Actions -->
            <div class="mun-card p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-sm font-medium text-mun-gray-700">
                            {{ selectedCountries.length }} selected
                        </span>
                        <button v-if="selectedCountries.length > 0" @click="selectedCountries = []"
                            class="text-sm text-mun-blue hover:text-mun-blue-700">
                            Clear selection
                        </button>
                    </div>

                    <div class="flex items-center space-x-2">
                        <button @click="bulkMarkAll('present_voting')"
                            class="px-4 py-2 text-sm font-medium rounded-lg bg-mun-green-100 text-mun-green-700 hover:bg-mun-green-200 transition-colors"
                            :disabled="isUpdating">
                            Mark All Present & Voting
                        </button>
                        <button @click="bulkMarkAll('present')"
                            class="px-4 py-2 text-sm font-medium rounded-lg bg-mun-yellow-100 text-mun-yellow-700 hover:bg-mun-yellow-200 transition-colors"
                            :disabled="isUpdating">
                            Mark All Present
                        </button>
                        <button @click="bulkMarkAll('absent')"
                            class="px-4 py-2 text-sm font-medium rounded-lg bg-mun-red-100 text-mun-red-700 hover:bg-mun-red-200 transition-colors"
                            :disabled="isUpdating">
                            Mark All Absent
                        </button>
                        <button v-if="selectedCountries.length > 0" @click="bulkMarkSelected('present_voting')"
                            class="px-4 py-2 text-sm font-medium rounded-lg bg-mun-blue text-white hover:bg-mun-blue-600 transition-colors"
                            :disabled="isUpdating">
                            Mark Selected
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filter & Search -->
            <div class="mun-card p-4">
                <div class="flex items-center space-x-4">
                    <div class="flex-1">
                        <input v-model="searchQuery" type="text" placeholder="Search countries..."
                            class="w-full px-4 py-2 border border-mun-gray-300 rounded-lg focus:ring-2 focus:ring-mun-blue focus:border-transparent" />
                    </div>
                    <div class="flex items-center space-x-2">
                        <button v-for="filter in statusFilters" :key="filter.value"
                            @click="currentFilter = filter.value" :class="[
                                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                currentFilter === filter.value
                                    ? 'bg-mun-blue text-white'
                                    : 'bg-mun-gray-100 text-mun-gray-700 hover:bg-mun-gray-200'
                            ]">
                            {{ filter.label }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Countries List -->
            <div class="mun-card p-6">
                <div v-if="isLoading" class="flex items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-mun-blue"></div>
                </div>

                <div v-else-if="filteredCountries.length === 0" class="text-center py-12">
                    <UsersIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                    <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No countries found</h3>
                    <p class="mt-2 text-mun-gray-600">Try adjusting your filters or search query</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="country in filteredCountries" :key="country.name" :class="[
                        'p-4 border-2 rounded-lg transition-all cursor-pointer',
                        selectedCountries.includes(country.name)
                            ? 'border-mun-blue bg-mun-blue/5'
                            : 'border-mun-gray-200 hover:border-mun-gray-300'
                    ]" @click="toggleSelection(country.name)">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center space-x-3 flex-1 min-w-0">
                                <!-- Checkbox -->
                                <input type="checkbox" :checked="selectedCountries.includes(country.name)"
                                    class="w-4 h-4 text-mun-blue border-mun-gray-300 rounded focus:ring-mun-blue"
                                    @click.stop="toggleSelection(country.name)" />

                                <!-- Country Info -->
                                <div class="flex items-center space-x-2 flex-1 min-w-0">
                                    <img v-if="country.flagUrl" :src="country.flagUrl" :alt="country.name"
                                        class="w-8 h-6 object-cover rounded border border-mun-gray-200"
                                        @error="(e) => e.target.style.display = 'none'" />
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-semibold text-mun-gray-900 truncate">{{ country.name }}</h4>
                                        <p v-if="country.specialRole" class="text-xs text-mun-gray-500">
                                            {{ country.specialRole }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Current Status Badge -->
                            <span :class="getStatusBadgeClass(country.status)">
                                {{ getStatusLabel(country.status) }}
                            </span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="grid grid-cols-3 gap-2">
                            <button @click.stop="markAttendance(country.name, 'present_voting')"
                                :disabled="isUpdating || !country.canVote" :class="[
                                    'px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                                    country.status === 'present_voting'
                                        ? 'bg-mun-green-600 text-white'
                                        : 'bg-mun-green-100 text-mun-green-700 hover:bg-mun-green-200',
                                    !country.canVote && 'opacity-50 cursor-not-allowed'
                                ]">
                                Present & Voting
                            </button>
                            <button @click.stop="markAttendance(country.name, 'present')" :disabled="isUpdating" :class="[
                                'px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                                country.status === 'present'
                                    ? 'bg-mun-yellow-600 text-white'
                                    : 'bg-mun-yellow-100 text-mun-yellow-700 hover:bg-mun-yellow-200'
                            ]">
                                Present
                            </button>
                            <button @click.stop="markAttendance(country.name, 'absent')" :disabled="isUpdating" :class="[
                                'px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                                country.status === 'absent'
                                    ? 'bg-mun-red-600 text-white'
                                    : 'bg-mun-red-100 text-mun-red-700 hover:bg-mun-red-200'
                            ]">
                                Absent
                            </button>
                        </div>

                        <!-- Marked Info -->
                        <div v-if="country.markedAt" class="mt-2 pt-2 border-t border-mun-gray-100">
                            <p class="text-xs text-mun-gray-500">
                                Marked {{ formatTime(country.markedAt) }}
                                <span v-if="country.markedBy === 'presidium'" class="text-mun-blue">(by
                                    presidium)</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Changes Button -->
            <div v-if="hasChanges" class="fixed bottom-6 right-6 z-40">
                <button @click="saveAttendance"
                    class="px-6 py-3 bg-mun-blue text-white rounded-xl shadow-lg hover:bg-mun-blue-600 transition-colors flex items-center space-x-2"
                    :disabled="isUpdating">
                    <span v-if="isUpdating">Saving...</span>
                    <span v-else>Save Attendance</span>
                </button>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    UsersIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isUpdating = ref(false)
const committee = ref(null)
const currentSession = ref(null)
const countries = ref([])
const selectedCountries = ref([])
const searchQuery = ref('')
const currentFilter = ref('all')
const hasChanges = ref(false)

const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Present & Voting', value: 'present_voting' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' }
]

// Computed
const committeeId = computed(() => authStore.user?.committeeId)

const filteredCountries = computed(() => {
    let filtered = countries.value

    // Filter by status
    if (currentFilter.value !== 'all') {
        filtered = filtered.filter(c => c.status === currentFilter.value)
    }

    // Filter by search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(query)
        )
    }

    return filtered
})

const presentVotingCount = computed(() =>
    countries.value.filter(c => c.status === 'present_voting').length
)

const presentCount = computed(() =>
    countries.value.filter(c => c.status === 'present').length
)

const absentCount = computed(() =>
    countries.value.filter(c => c.status === 'absent').length
)

const votingCount = computed(() => presentVotingCount.value)

const quorumRequired = computed(() => {
    const totalVotingCountries = countries.value.filter(c => c.canVote).length
    return Math.floor(totalVotingCountries / 2) + 1
})

const hasQuorum = computed(() => votingCount.value >= quorumRequired.value)

// Methods
const loadAttendance = async () => {
    try {
        isLoading.value = true

        // Load committee
        const committeeResponse = await apiMethods.committees.getById(committeeId.value)
        if (committeeResponse.data.success) {
            committee.value = committeeResponse.data.committee

            // Initialize countries from committee
            countries.value = (committee.value.countries || []).map(country => ({
                name: country.name,
                flagUrl: country.flagUrl,
                canVote: !country.isObserver && !country.specialRole,
                specialRole: country.specialRole || null,
                status: 'absent',
                markedAt: null,
                markedBy: null
            }))
        }

        // Load active session
        const sessionsResponse = await apiMethods.sessions.getAll(committeeId.value, {
            status: 'active',
            limit: 1
        })

        if (sessionsResponse.data.success && sessionsResponse.data.sessions?.length > 0) {
            currentSession.value = sessionsResponse.data.sessions[0]

            // Load attendance for current session
            try {
                const attendanceResponse = await apiMethods.sessions.getAttendance(currentSession.value._id)

                if (attendanceResponse.data.success && attendanceResponse.data.attendance) {
                    // Update countries with attendance data
                    attendanceResponse.data.attendance.forEach(record => {
                        const country = countries.value.find(c => c.name === record.country)
                        if (country) {
                            country.status = record.status || 'absent'
                            country.markedAt = record.markedAt
                            country.markedBy = record.markedBy
                        }
                    })
                }
            } catch (err) {
                console.warn('No attendance data yet:', err)
            }
        } else {
            currentSession.value = null
        }

        hasChanges.value = false

    } catch (error) {
        console.error('Load attendance error:', error)
        toast.error('Failed to load attendance data')
    } finally {
        isLoading.value = false
    }
}

const markAttendance = (countryName, status) => {
    const country = countries.value.find(c => c.name === countryName)
    if (!country) return

    // Don't allow voting status for observers
    if (status === 'present_voting' && !country.canVote) {
        toast.warning('Observers cannot have voting status')
        return
    }

    country.status = status
    country.markedAt = new Date().toISOString()
    country.markedBy = 'presidium'
    hasChanges.value = true
}

const bulkMarkAll = (status) => {
    countries.value.forEach(country => {
        // Skip voting status for observers
        if (status === 'present_voting' && !country.canVote) {
            country.status = 'present'
        } else {
            country.status = status
        }
        country.markedAt = new Date().toISOString()
        country.markedBy = 'presidium'
    })
    hasChanges.value = true
    toast.success(`All countries marked as ${getStatusLabel(status)}`)
}

const bulkMarkSelected = (status) => {
    if (selectedCountries.value.length === 0) {
        toast.warning('No countries selected')
        return
    }

    selectedCountries.value.forEach(countryName => {
        const country = countries.value.find(c => c.name === countryName)
        if (country) {
            if (status === 'present_voting' && !country.canVote) {
                country.status = 'present'
            } else {
                country.status = status
            }
            country.markedAt = new Date().toISOString()
            country.markedBy = 'presidium'
        }
    })

    hasChanges.value = true
    selectedCountries.value = []
    toast.success(`${selectedCountries.value.length} countries updated`)
}

const toggleSelection = (countryName) => {
    const index = selectedCountries.value.indexOf(countryName)
    if (index > -1) {
        selectedCountries.value.splice(index, 1)
    } else {
        selectedCountries.value.push(countryName)
    }
}

const saveAttendance = async () => {
    if (!currentSession.value) {
        toast.error('No active session')
        return
    }

    try {
        isUpdating.value = true

        const attendanceData = {
            attendance: countries.value.map(country => ({
                country: country.name,
                status: country.status,
                markedBy: 'presidium',
                markedAt: new Date().toISOString()
            }))
        }

        const response = await apiMethods.sessions.updateAttendance(
            currentSession.value._id,
            attendanceData
        )

        if (response.data.success) {
            toast.success('Attendance saved successfully')
            hasChanges.value = false
            await loadAttendance()
        }

    } catch (error) {
        console.error('Save attendance error:', error)
        toast.error('Failed to save attendance')
    } finally {
        isUpdating.value = false
    }
}

// Formatting helpers
const getStatusLabel = (status) => {
    const labels = {
        'present_voting': 'Present & Voting',
        'present': 'Present',
        'absent': 'Absent'
    }
    return labels[status] || status
}

const getStatusBadgeClass = (status) => {
    const classes = {
        'present_voting': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-green-100 text-mun-green-700',
        'present': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-yellow-100 text-mun-yellow-700',
        'absent': 'px-2 py-1 text-xs font-medium rounded-lg bg-mun-red-100 text-mun-red-700'
    }
    return classes[status] || classes.absent
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return ''
    }
}

// Lifecycle
onMounted(() => {
    loadAttendance()
})
</script>