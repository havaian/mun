<template>
    <Teleport to="body">
        <transition name="modal" appear>
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between p-6 border-b border-mun-gray-200">
                        <div>
                            <h2 class="text-xl font-bold text-mun-gray-900">
                                Manage Countries - {{ committee?.name }}
                            </h2>
                            <p class="text-sm text-mun-gray-600 mt-1">
                                Assign countries to this committee
                            </p>
                        </div>

                        <button @click="close" class="p-2 hover:bg-mun-gray-100 rounded-lg transition-colors">
                            <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="flex h-[calc(90vh-140px)]">
                        <!-- Country Search & Selection -->
                        <div class="w-1/2 border-r border-mun-gray-200 flex flex-col">
                            <div class="p-6 border-b border-mun-gray-200">
                                <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">
                                    Available Countries
                                </h3>

                                <!-- Search -->
                                <div class="relative mb-4">
                                    <input v-model="searchQuery" type="text" placeholder="Search countries..."
                                        class="input-field pl-10" />
                                    <MagnifyingGlassIcon
                                        class="w-5 h-5 text-mun-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                </div>

                                <!-- Quick Filters -->
                                <div class="flex flex-wrap gap-2 mb-4">
                                    <button v-for="region in regions" :key="region.code"
                                        @click="toggleRegionFilter(region.code)" :class="[
                                            'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                                            selectedRegions.includes(region.code)
                                                ? 'bg-mun-blue text-white'
                                                : 'bg-mun-gray-100 text-mun-gray-700 hover:bg-mun-gray-200'
                                        ]">
                                        {{ region.name }}
                                    </button>
                                </div>

                                <!-- Quick Actions -->
                                <div class="flex items-center space-x-2 mb-4">
                                    <AppButton variant="outline" size="sm" @click="selectAllVisible">
                                        Select All Visible
                                    </AppButton>
                                    <AppButton variant="outline" size="sm" @click="clearSelection">
                                        Clear Selection
                                    </AppButton>
                                    <AppButton v-if="committee?.type === 'SC'" variant="outline" size="sm"
                                        @click="addP5Countries">
                                        Add P5
                                    </AppButton>
                                </div>

                                <!-- Selected count -->
                                <div class="text-sm text-mun-gray-600">
                                    {{ selectedCountries.length }} selected • {{ filteredAvailableCountries.length }}
                                    available
                                </div>
                            </div>

                            <!-- Country List -->
                            <div class="flex-1 overflow-y-auto p-4">
                                <div class="space-y-2">
                                    <div v-for="country in filteredAvailableCountries" :key="country.code"
                                        @click="toggleCountrySelection(country)" :class="[
                                            'flex items-center p-3 rounded-lg cursor-pointer transition-colors border',
                                            selectedCountries.includes(country.code)
                                                ? 'bg-mun-blue-50 border-mun-blue-200'
                                                : 'hover:bg-mun-gray-50 border-transparent'
                                        ]">
                                        <!-- Selection Checkbox -->
                                        <input type="checkbox" :checked="selectedCountries.includes(country.code)"
                                            @click.stop="toggleCountrySelection(country)"
                                            class="h-4 w-4 text-mun-blue focus:ring-mun-blue border-mun-gray-300 rounded mr-3" />

                                        <!-- Flag -->
                                        <div class="w-8 h-6 rounded-sm overflow-hidden mr-3 border border-mun-gray-200">
                                            <img :src="getFlagUrl(country.code)" :alt="`${country.name} flag`"
                                                class="w-full h-full object-cover" @error="handleFlagError" />
                                        </div>

                                        <!-- Country Info -->
                                        <div class="flex-1">
                                            <div class="font-medium text-mun-gray-900">
                                                {{ country.name }}
                                            </div>
                                            <div class="text-sm text-mun-gray-500">
                                                {{ country.code }} • {{ country.region }}
                                            </div>
                                        </div>

                                        <!-- P5 Indicator -->
                                        <div v-if="isP5Country(country.code)"
                                            class="bg-mun-red-100 text-mun-red-800 px-2 py-1 rounded text-xs font-medium">
                                            P5
                                        </div>
                                    </div>
                                </div>

                                <!-- No results -->
                                <div v-if="filteredAvailableCountries.length === 0" class="text-center py-8">
                                    <GlobeAltIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                                    <p class="text-mun-gray-500">No countries found</p>
                                </div>
                            </div>
                        </div>

                        <!-- Assigned Countries -->
                        <div class="w-1/2 flex flex-col">
                            <div class="p-6 border-b border-mun-gray-200">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-mun-gray-900">
                                        Assigned Countries
                                    </h3>
                                    <div class="text-sm text-mun-gray-600">
                                        {{ assignedCountries.length }} / {{ committee?.maxCountries || '∞' }} countries
                                    </div>
                                </div>

                                <!-- Progress Bar -->
                                <div v-if="committee?.maxCountries" class="mb-4">
                                    <div class="w-full bg-mun-gray-200 rounded-full h-2">
                                        <div class="bg-mun-blue h-2 rounded-full transition-all duration-300"
                                            :style="{ width: `${getAssignmentProgress()}%` }"></div>
                                    </div>
                                    <p class="text-xs text-mun-gray-500 mt-1">
                                        {{ getAssignmentProgress() }}% capacity
                                    </p>
                                </div>

                                <!-- Bulk Actions for Assigned -->
                                <div class="flex items-center space-x-2">
                                    <AppButton variant="outline" size="sm" @click="removeAllCountries"
                                        :disabled="assignedCountries.length === 0">
                                        Remove All
                                    </AppButton>
                                    <AppButton variant="outline" size="sm" @click="regenerateAllQRs"
                                        :disabled="assignedCountries.length === 0" :loading="isRegeneratingQRs">
                                        Regenerate All QRs
                                    </AppButton>
                                </div>
                            </div>

                            <!-- Assigned Countries List -->
                            <div class="flex-1 overflow-y-auto p-4">
                                <div class="space-y-3">
                                    <div v-for="country in assignedCountries" :key="country.code"
                                        class="flex items-center p-3 bg-mun-gray-50 rounded-lg">
                                        <!-- Flag -->
                                        <div class="w-8 h-6 rounded-sm overflow-hidden mr-3 border border-mun-gray-200">
                                            <img :src="getFlagUrl(country.code)" :alt="`${country.name} flag`"
                                                class="w-full h-full object-cover" @error="handleFlagError" />
                                        </div>

                                        <!-- Country Info -->
                                        <div class="flex-1">
                                            <div class="font-medium text-mun-gray-900">
                                                {{ country.name }}
                                            </div>
                                            <div class="flex items-center space-x-2 text-sm text-mun-gray-500">
                                                <span>{{ country.code }}</span>

                                                <!-- Role Selector for SC -->
                                                <select v-if="committee?.type === 'SC'" v-model="country.role"
                                                    @change="updateCountryRole(country)"
                                                    class="text-xs border-mun-gray-300 rounded px-2 py-1">
                                                    <option value="non-permanent">Non-Permanent</option>
                                                    <option value="permanent">Permanent</option>
                                                </select>

                                                <!-- Registration Status -->
                                                <span v-if="country.email" class="text-mun-green-600">
                                                    ✓ Registered
                                                </span>
                                                <span v-else class="text-mun-gray-400">
                                                    Not registered
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Actions -->
                                        <div class="flex items-center space-x-2">
                                            <!-- QR Status -->
                                            <div v-if="country.qrToken" class="text-xs">
                                                <span v-if="country.isQrActive" class="text-mun-green-600">
                                                    QR Active
                                                </span>
                                                <span v-else class="text-mun-gray-500">
                                                    QR Used
                                                </span>
                                            </div>

                                            <!-- Regenerate QR -->
                                            <button @click="regenerateQR(country)"
                                                class="p-1 text-mun-gray-400 hover:text-mun-blue transition-colors"
                                                title="Regenerate QR Code">
                                                <ArrowPathIcon class="w-4 h-4" />
                                            </button>

                                            <!-- Remove Country -->
                                            <button @click="removeCountry(country)"
                                                class="p-1 text-mun-gray-400 hover:text-mun-red-600 transition-colors"
                                                title="Remove Country">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- No assigned countries -->
                                <div v-if="assignedCountries.length === 0" class="text-center py-8">
                                    <UserGroupIcon class="w-12 h-12 text-mun-gray-400 mx-auto mb-4" />
                                    <p class="text-mun-gray-500 mb-2">No countries assigned</p>
                                    <p class="text-sm text-mun-gray-400">
                                        Select countries from the left panel to assign them
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex items-center justify-between p-6 bg-mun-gray-50 border-t border-mun-gray-200">
                        <div class="flex items-center space-x-4">
                            <div class="text-sm text-mun-gray-600">
                                {{ assignedCountries.length }} countries assigned
                                <span v-if="committee?.maxCountries">
                                    of {{ committee.maxCountries }} maximum
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3">
                            <AppButton variant="ghost" @click="close" :disabled="isSaving">
                                Cancel
                            </AppButton>

                            <AppButton variant="outline" @click="resetChanges" :disabled="isSaving">
                                Reset
                            </AppButton>

                            <AppButton variant="primary" @click="saveCountries" :loading="isSaving">
                                <CheckIcon class="w-4 h-4 mr-2" />
                                Save Countries
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from '@/plugins/toast'
import { apiMethods } from '@/utils/api'

// Icons
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    GlobeAltIcon,
    UserGroupIcon,
    ArrowPathIcon,
    CheckIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    committee: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'saved'])

const toast = useToast()

// State
const isLoading = ref(false)
const isSaving = ref(false)
const isRegeneratingQRs = ref(false)
const searchQuery = ref('')
const selectedCountries = ref([])
const selectedRegions = ref([])

// Data
const availableCountries = ref([])
const assignedCountries = ref([])
const originalAssigned = ref([])

// Regions for filtering
const regions = [
    { code: 'africa', name: 'Africa' },
    { code: 'asia', name: 'Asia' },
    { code: 'europe', name: 'Europe' },
    { code: 'americas', name: 'Americas' },
    { code: 'oceania', name: 'Oceania' }
]

// P5 countries (Security Council permanent members)
const p5Countries = ['US', 'RU', 'CN', 'GB', 'FR']

// Computed
const filteredAvailableCountries = computed(() => {
    let filtered = availableCountries.value.filter(country =>
        !assignedCountries.value.some(assigned => assigned.code === country.code)
    )

    // Apply search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(country =>
            country.name.toLowerCase().includes(query) ||
            country.code.toLowerCase().includes(query)
        )
    }

    // Apply region filter
    if (selectedRegions.value.length > 0) {
        filtered = filtered.filter(country =>
            selectedRegions.value.includes(country.region?.toLowerCase())
        )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

const getAssignmentProgress = () => {
    if (!props.committee?.maxCountries) return 0
    return Math.round((assignedCountries.value.length / props.committee.maxCountries) * 100)
}

// Watch for modal open/close
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        loadCountries()
        initializeAssignedCountries()
    }
})

// Methods
const loadCountries = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.countries.getAll()

        if (response.data.success) {
            availableCountries.value = response.data.countries || []
        }

    } catch (error) {
        console.error('Load countries error:', error)
        toast.error('Failed to load countries')
    } finally {
        isLoading.value = false
    }
}

const initializeAssignedCountries = () => {
    if (props.committee?.countries) {
        assignedCountries.value = [...props.committee.countries.map(country => ({
            ...country,
            qrToken: country.qrToken || generateQRToken(),
            isQrActive: country.isQrActive !== false,
            role: country.role || 'non-permanent'
        }))]

        originalAssigned.value = [...assignedCountries.value]
    } else {
        assignedCountries.value = []
        originalAssigned.value = []
    }
}

const toggleRegionFilter = (regionCode) => {
    const index = selectedRegions.value.indexOf(regionCode)
    if (index > -1) {
        selectedRegions.value.splice(index, 1)
    } else {
        selectedRegions.value.push(regionCode)
    }
}

const toggleCountrySelection = (country) => {
    const index = selectedCountries.value.indexOf(country.code)
    if (index > -1) {
        selectedCountries.value.splice(index, 1)
    } else {
        selectedCountries.value.push(country.code)

        // Auto-assign if limit allows
        if (!props.committee?.maxCountries ||
            assignedCountries.value.length < props.committee.maxCountries) {
            assignCountry(country)
            selectedCountries.value = selectedCountries.value.filter(code => code !== country.code)
        }
    }
}

const assignCountry = (country) => {
    if (props.committee?.maxCountries &&
        assignedCountries.value.length >= props.committee.maxCountries) {
        toast.warning(`Maximum of ${props.committee.maxCountries} countries allowed`)
        return
    }

    const newCountry = {
        code: country.code,
        name: country.name,
        region: country.region,
        qrToken: generateQRToken(),
        isQrActive: true,
        role: isP5Country(country.code) ? 'permanent' : 'non-permanent',
        email: null,
        registeredAt: null
    }

    assignedCountries.value.push(newCountry)
    toast.success(`${country.name} assigned to committee`)
}

const removeCountry = (country) => {
    assignedCountries.value = assignedCountries.value.filter(c => c.code !== country.code)
    toast.success(`${country.name} removed from committee`)
}

const selectAllVisible = () => {
    const visibleCodes = filteredAvailableCountries.value.map(c => c.code)
    const availableSlots = props.committee?.maxCountries ?
        props.committee.maxCountries - assignedCountries.value.length :
        visibleCodes.length

    const toSelect = visibleCodes.slice(0, availableSlots)

    toSelect.forEach(code => {
        if (!selectedCountries.value.includes(code)) {
            const country = availableCountries.value.find(c => c.code === code)
            if (country) {
                assignCountry(country)
            }
        }
    })

    if (availableSlots < visibleCodes.length) {
        toast.warning(`Only ${availableSlots} slots available`)
    }
}

const clearSelection = () => {
    selectedCountries.value = []
}

const addP5Countries = () => {
    const p5ToAdd = p5Countries.filter(code =>
        !assignedCountries.value.some(assigned => assigned.code === code)
    )

    p5ToAdd.forEach(code => {
        const country = availableCountries.value.find(c => c.code === code)
        if (country) {
            assignCountry(country)
        }
    })

    if (p5ToAdd.length > 0) {
        toast.success(`Added ${p5ToAdd.length} P5 countries`)
    }
}

const removeAllCountries = () => {
    assignedCountries.value = []
    toast.success('All countries removed')
}

const updateCountryRole = (country) => {
    // Role updated directly through v-model
    toast.success(`${country.name} role updated`)
}

const regenerateQR = (country) => {
    const index = assignedCountries.value.findIndex(c => c.code === country.code)
    if (index !== -1) {
        assignedCountries.value[index] = {
            ...assignedCountries.value[index],
            qrToken: generateQRToken(),
            isQrActive: true,
            email: null,
            registeredAt: null
        }
        toast.success(`QR code regenerated for ${country.name}`)
    }
}

const regenerateAllQRs = async () => {
    try {
        isRegeneratingQRs.value = true

        assignedCountries.value.forEach(country => {
            country.qrToken = generateQRToken()
            country.isQrActive = true
            country.email = null
            country.registeredAt = null
        })

        toast.success('All QR codes regenerated')

    } catch (error) {
        console.error('Regenerate all QRs error:', error)
        toast.error('Failed to regenerate QR codes')
    } finally {
        isRegeneratingQRs.value = false
    }
}

const resetChanges = () => {
    assignedCountries.value = [...originalAssigned.value]
    selectedCountries.value = []
    toast.info('Changes reset')
}

const saveCountries = async () => {
    try {
        isSaving.value = true

        const response = await apiMethods.committees.update(props.committee._id, {
            countries: assignedCountries.value
        })

        if (response.data.success) {
            emit('saved', response.data.committee)
            close()
            toast.success('Countries saved successfully')
        }

    } catch (error) {
        console.error('Save countries error:', error)
        toast.error('Failed to save countries')
    } finally {
        isSaving.value = false
    }
}

const close = () => {
    emit('update:modelValue', false)
}

// Utility functions
const getFlagUrl = (countryCode) => {
    return `/api/countries/flags/${countryCode.toLowerCase()}`
}

const handleFlagError = (event) => {
    event.target.src = '/placeholder-flag.png'
}

const generateQRToken = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
}

const isP5Country = (countryCode) => {
    return p5Countries.includes(countryCode.toUpperCase())
}

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        loadCountries()
        initializeAssignedCountries()
    }
})
</script>

<style scoped>
/* Modal animation */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.modal-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Country selection animation */
.country-item {
    transition: all 0.2s ease;
}

.country-item:hover {
    transform: translateX(2px);
}
</style>