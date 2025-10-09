<!-- frontend/src/components/presidium/AttendanceModal.vue -->
<template>
    <Teleport to="body">
        <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    @click="$emit('update:modelValue', false)" />

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
                        @click.stop>
                        <!-- Header -->
                        <div class="bg-white px-6 py-4 border-b border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-mun-gray-900">
                                        Attendance Management
                                    </h3>
                                    <p class="text-sm text-mun-gray-500 mt-1">
                                        Mark delegate attendance and manage quorum status
                                    </p>
                                </div>

                                <div class="flex items-center space-x-4">
                                    <!-- Quorum Status -->
                                    <div class="flex items-center space-x-2">
                                        <div class="quorum-indicator" :class="quorumIndicatorClass">
                                            <div class="w-3 h-3 rounded-full" :class="quorumStatusColor"></div>
                                        </div>
                                        <span class="text-sm font-medium" :class="quorumTextColor">
                                            {{ quorumStatus }}
                                        </span>
                                    </div>

                                    <button @click="$emit('update:modelValue', false)"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                        <XMarkIcon class="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Controls -->
                        <div class="bg-mun-gray-50 px-6 py-3 border-b border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <!-- Search -->
                                    <div class="relative">
                                        <MagnifyingGlassIcon
                                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mun-gray-400" />
                                        <input v-model="searchQuery" type="text" placeholder="Search countries..."
                                            class="pl-10 pr-4 py-2 text-sm border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue" />
                                    </div>

                                    <!-- Filter -->
                                    <select v-model="statusFilter"
                                        class="text-sm border border-mun-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue">
                                        <option value="">All Countries</option>
                                        <option value="present">Present Only</option>
                                        <option value="absent">Absent Only</option>
                                        <option value="unmarked">Unmarked Only</option>
                                    </select>
                                </div>

                                <div class="flex items-center space-x-2">
                                    <!-- Bulk Actions -->
                                    <button @click="markAllPresent" :disabled="isUpdating"
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50">
                                        <CheckIcon class="w-4 h-4 mr-1" />
                                        Mark All Present
                                    </button>

                                    <button @click="markAllAbsent" :disabled="isUpdating"
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50">
                                        <XMarkIcon class="w-4 h-4 mr-1" />
                                        Mark All Absent
                                    </button>

                                    <!-- Auto-detect (QR scanning placeholder) -->
                                    <button @click="startQRDetection" :disabled="isScanning"
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-mun-blue-700 bg-mun-blue-100 hover:bg-mun-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                        <QrCodeIcon class="w-4 h-4 mr-1" />
                                        {{ isScanning ? 'Scanning...' : 'QR Scan' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Attendance List -->
                        <div class="max-h-96 overflow-y-auto">
                            <div class="attendance-grid">
                                <div v-for="country in filteredCountries" :key="country.email"
                                    class="attendance-row grid grid-cols-12 items-center py-3 px-6 border-b border-mun-gray-100 hover:bg-mun-gray-50 transition-colors"
                                    :class="getRowClasses(country)">
                                    <!-- Country Info -->
                                    <div class="col-span-6">
                                        <div class="flex items-center space-x-3">
                                            <CountryFlag :country-name="country.countryName"
                                                :country-code="country.countryCode" size="small" :show-status="false" />

                                            <div>
                                                <div class="font-medium text-mun-gray-900">
                                                    {{ country.countryName }}
                                                </div>
                                                <div class="text-xs text-mun-gray-500">
                                                    {{ country.email }}
                                                </div>
                                            </div>

                                            <!-- Special role badge -->
                                            <div v-if="country.specialRole" class="special-role-badge"
                                                :class="getSpecialRoleBadgeClass(country.specialRole)">
                                                {{ getSpecialRoleText(country.specialRole) }}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Attendance Status -->
                                    <div class="col-span-3">
                                        <div class="flex items-center justify-center space-x-2">
                                            <!-- Status indicator -->
                                            <div class="status-dot w-3 h-3 rounded-full"
                                                :class="getStatusDotClass(country)"></div>

                                            <!-- Status text -->
                                            <span class="text-sm font-medium" :class="getStatusTextClass(country)">
                                                {{ getAttendanceStatusText(country) }}
                                            </span>

                                            <!-- Last updated -->
                                            <span v-if="country.lastMarked" class="text-xs text-mun-gray-400">
                                                {{ formatTime(country.lastMarked) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Actions -->
                                    <div class="col-span-3">
                                        <div class="flex items-center justify-end space-x-2">
                                            <!-- Present button -->
                                            <button @click="markAttendance(country, true)" :disabled="isUpdating"
                                                :class="getPresentButtonClass(country)"
                                                class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50">
                                                <CheckIcon class="w-3 h-3 mr-1" />
                                                Present
                                            </button>

                                            <!-- Absent button -->
                                            <button @click="markAttendance(country, false)" :disabled="isUpdating"
                                                :class="getAbsentButtonClass(country)"
                                                class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50">
                                                <XMarkIcon class="w-3 h-3 mr-1" />
                                                Absent
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="bg-mun-gray-50 px-6 py-4 border-t border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <!-- Statistics -->
                                <div class="flex items-center space-x-6 text-sm">
                                    <div class="flex items-center space-x-2">
                                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span class="text-mun-gray-600">Present: </span>
                                        <span class="font-semibold text-green-600">{{ presentCount }}</span>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span class="text-mun-gray-600">Absent: </span>
                                        <span class="font-semibold text-red-600">{{ absentCount }}</span>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <div class="w-3 h-3 bg-mun-gray-400 rounded-full"></div>
                                        <span class="text-mun-gray-600">Unmarked: </span>
                                        <span class="font-semibold text-mun-gray-500">{{ unmarkedCount }}</span>
                                    </div>

                                    <div class="flex items-center space-x-2">
                                        <span class="text-mun-gray-600">Quorum: </span>
                                        <span class="font-semibold" :class="quorumTextColor">
                                            {{ presentCount }}/{{ quorumRequired }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="flex items-center space-x-3">
                                    <button @click="$emit('update:modelValue', false)"
                                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                        Close
                                    </button>

                                    <button @click="saveAttendance" :disabled="isUpdating || !hasChanges"
                                        class="px-4 py-2 text-sm font-medium text-white bg-mun-blue border border-transparent rounded-md hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                        {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckIcon,
    QrCodeIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    sessionId: {
        type: String,
        required: true
    },
    countries: {
        type: Array,
        required: true
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'attendance-updated'])

const sessionStore = useSessionStore()
const toast = useToast()

// State
const isUpdating = ref(false)
const isScanning = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const hasChanges = ref(false)

// Local attendance copy for editing
const localAttendance = ref({})

// Computed
const filteredCountries = computed(() => {
    let filtered = props.countries

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(country =>
            country.countryName.toLowerCase().includes(query) ||
            country.email.toLowerCase().includes(query)
        )
    }

    // Status filter
    if (statusFilter.value) {
        filtered = filtered.filter(country => {
            const attendance = getCountryAttendance(country)
            switch (statusFilter.value) {
                case 'present':
                    return attendance.present === true
                case 'absent':
                    return attendance.present === false
                case 'unmarked':
                    return attendance.present === null
                default:
                    return true
            }
        })
    }

    return filtered
})

const presentCount = computed(() => {
    return props.countries.filter(c => getCountryAttendance(c).present === true).length
})

const absentCount = computed(() => {
    return props.countries.filter(c => getCountryAttendance(c).present === false).length
})

const unmarkedCount = computed(() => {
    return props.countries.filter(c => getCountryAttendance(c).present === null).length
})

const quorumRequired = computed(() => {
    return sessionStore.quorum.required || Math.ceil(props.countries.length * 0.5)
})

const hasQuorum = computed(() => {
    return presentCount.value >= quorumRequired.value
})

const quorumStatus = computed(() => {
    return hasQuorum.value ? 'Quorum Achieved' : 'No Quorum'
})

const quorumIndicatorClass = computed(() => {
    return 'flex items-center'
})

const quorumStatusColor = computed(() => {
    return hasQuorum.value ? 'bg-green-500' : 'bg-red-500'
})

const quorumTextColor = computed(() => {
    return hasQuorum.value ? 'text-green-600' : 'text-red-600'
})

// Methods
const getCountryAttendance = (country) => {
    const local = localAttendance.value[country.email]
    if (local !== undefined) {
        return { present: local, lastMarked: new Date() }
    }

    const existing = sessionStore.attendance.find(a => a.email === country.email)
    return existing || { present: null, lastMarked: null }
}

const getRowClasses = (country) => {
    const attendance = getCountryAttendance(country)
    if (attendance.present === true) return 'bg-green-50'
    if (attendance.present === false) return 'bg-red-50'
    return ''
}

const getStatusDotClass = (country) => {
    const attendance = getCountryAttendance(country)
    if (attendance.present === true) return 'bg-green-500'
    if (attendance.present === false) return 'bg-red-500'
    return 'bg-mun-gray-400'
}

const getStatusTextClass = (country) => {
    const attendance = getCountryAttendance(country)
    if (attendance.present === true) return 'text-green-600'
    if (attendance.present === false) return 'text-red-600'
    return 'text-mun-gray-500'
}

const getAttendanceStatusText = (country) => {
    const attendance = getCountryAttendance(country)
    if (attendance.present === true) return 'Present'
    if (attendance.present === false) return 'Absent'
    return 'Unmarked'
}

const getPresentButtonClass = (country) => {
    const attendance = getCountryAttendance(country)
    const isPresent = attendance.present === true

    if (isPresent) {
        return 'text-white bg-green-600 border-green-600 focus:ring-green-500'
    }
    return 'text-green-700 bg-green-100 border-green-200 hover:bg-green-200 focus:ring-green-500'
}

const getAbsentButtonClass = (country) => {
    const attendance = getCountryAttendance(country)
    const isAbsent = attendance.present === false

    if (isAbsent) {
        return 'text-white bg-red-600 border-red-600 focus:ring-red-500'
    }
    return 'text-red-700 bg-red-100 border-red-200 hover:bg-red-200 focus:ring-red-500'
}

const getSpecialRoleBadgeClass = (role) => {
    const base = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full'

    const roleClasses = {
        'security-council': 'bg-red-100 text-red-800',
        'observer': 'bg-blue-100 text-blue-800',
        'president': 'bg-yellow-100 text-yellow-800'
    }

    return `${base} ${roleClasses[role] || 'bg-mun-gray-100 text-mun-gray-800'}`
}

const getSpecialRoleText = (role) => {
    const texts = {
        'security-council': 'Security Council',
        'observer': 'Observer',
        'president': 'President'
    }

    return texts[role] || role
}

const markAttendance = (country, present) => {
    localAttendance.value[country.email] = present
    hasChanges.value = true
}

const markAllPresent = () => {
    props.countries.forEach(country => {
        localAttendance.value[country.email] = true
    })
    hasChanges.value = true
}

const markAllAbsent = () => {
    props.countries.forEach(country => {
        localAttendance.value[country.email] = false
    })
    hasChanges.value = true
}

const startQRDetection = () => {
    isScanning.value = true

    // Simulate QR scanning
    setTimeout(() => {
        isScanning.value = false
        toast.info('QR scanning functionality would be implemented here')
    }, 2000)
}

const saveAttendance = async () => {
    try {
        isUpdating.value = true

        // Prepare attendance data
        const attendanceData = props.countries.map(country => ({
            email: country.email,
            countryName: country.countryName,
            present: localAttendance.value[country.email] ?? null,
            markedAt: new Date(),
            markedBy: 'current-user' // Would come from auth store
        }))

        await sessionStore.updateAttendance(props.sessionId, { attendance: attendanceData })

        hasChanges.value = false
        localAttendance.value = {}

        emit('attendance-updated', attendanceData)
        toast.success('Attendance updated successfully')

    } catch (error) {
        console.error('Save attendance error:', error)
        toast.error('Failed to save attendance')
    } finally {
        isUpdating.value = false
    }
}

const formatTime = (dateString) => {
    try {
        const date = new Date(dateString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
        return ''
    }
}

// Initialize local attendance from store
onMounted(() => {
    sessionStore.attendance.forEach(record => {
        if (record.present !== null) {
            localAttendance.value[record.email] = record.present
        }
    })
})

// Watch for external attendance changes
watch(() => sessionStore.attendance, (newAttendance) => {
    // Only update if we don't have local changes
    if (!hasChanges.value) {
        localAttendance.value = {}
        newAttendance.forEach(record => {
            if (record.present !== null) {
                localAttendance.value[record.email] = record.present
            }
        })
    }
}, { deep: true })
</script>

<style scoped>
.attendance-grid {
    min-height: 200px;
}

.attendance-row:last-child {
    border-bottom: none;
}

.status-dot {
    flex-shrink: 0;
}

.special-role-badge {
    flex-shrink: 0;
}

@media (max-width: 768px) {
    .attendance-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .attendance-row>div {
        grid-column: span 1;
    }
}
</style>