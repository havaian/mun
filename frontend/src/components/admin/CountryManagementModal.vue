<template>
    <TransitionRoot appear :show="modelValue" as="template">
        <Dialog as="div" @close="close" class="relative z-50">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/25 backdrop-blur-sm" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel
                            class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl transition-all">
                            <!-- Modal Header -->
                            <div class="flex items-center justify-between p-6 border-b border-mun-gray-100">
                                <div>
                                    <DialogTitle as="h3" class="text-2xl font-bold text-mun-gray-900">
                                        Manage Countries
                                    </DialogTitle>
                                    <p class="text-mun-gray-600 mt-1">
                                        {{ committee?.name }} - Add and configure country assignments
                                    </p>
                                </div>

                                <button @click="close" class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-6 h-6 text-mun-gray-500" />
                                </button>
                            </div>

                            <!-- Country Addition Section -->
                            <div class="p-6 border-b border-mun-gray-100 bg-mun-gray-50/50">
                                <div class="flex flex-col lg:flex-row gap-4">
                                    <!-- Country Search -->
                                    <div class="flex-1">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Add Country
                                        </label>
                                        <div class="relative">
                                            <MagnifyingGlassIcon
                                                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mun-gray-400" />
                                            <input v-model="countrySearch" type="text" placeholder="Search countries..."
                                                class="pl-10 pr-4 py-3 w-full border border-mun-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-un-blue focus:border-un-blue transition-all"
                                                @input="searchCountries" />

                                            <!-- Search Results Dropdown -->
                                            <div v-if="showSearchResults && searchResults.length > 0"
                                                class="absolute top-full left-0 right-0 mt-1 bg-white border border-mun-gray-200 rounded-xl shadow-mun-lg max-h-60 overflow-y-auto z-10">
                                                <button v-for="country in searchResults" :key="country.code"
                                                    @click="selectCountry(country)"
                                                    class="w-full flex items-center px-4 py-3 hover:bg-mun-gray-50 transition-colors">
                                                    <img :src="getFlagUrl(country.code)" :alt="country.name"
                                                        class="w-6 h-4 rounded-sm mr-3 object-cover"
                                                        @error="handleFlagError" />
                                                    <span class="font-medium">{{ country.name }}</span>
                                                    <span class="ml-auto text-sm text-mun-gray-500">{{
                                                        country.code.toUpperCase() }}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Special Role Selection -->
                                    <div class="lg:w-48">
                                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                            Special Role
                                        </label>
                                        <select v-model="selectedSpecialRole"
                                            class="w-full px-4 py-3 border border-mun-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-un-blue focus:border-un-blue">
                                            <option value="">Regular Member</option>
                                            <option value="observer">Observer</option>
                                            <option value="special">Special Role</option>
                                            <option v-if="committee?.type === 'SC'" value="permanent">Permanent Member
                                            </option>
                                        </select>
                                    </div>

                                    <!-- Add Button -->
                                    <div class="lg:w-32 flex items-end">
                                        <AppButton variant="primary" size="lg" :icon="PlusIcon"
                                            @click="addSelectedCountry" :disabled="!selectedCountry" class="w-full">
                                            Add
                                        </AppButton>
                                    </div>
                                </div>

                                <!-- Quick Add Buttons -->
                                <div class="mt-4 flex flex-wrap gap-2">
                                    <span class="text-sm font-medium text-mun-gray-700 mr-2">Quick Add:</span>
                                    <button v-for="preset in quickAddPresets" :key="preset.id"
                                        @click="addPresetCountries(preset)"
                                        class="px-3 py-1 text-xs font-medium bg-un-blue-50 text-un-blue-700 rounded-lg hover:bg-un-blue-100 transition-colors">
                                        {{ preset.name }}
                                    </button>
                                </div>
                            </div>

                            <!-- Countries List -->
                            <div class="p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-semibold text-mun-gray-900">
                                        Assigned Countries ({{ assignedCountries.length }})
                                    </h4>

                                    <div class="flex items-center space-x-4">
                                        <!-- Filter -->
                                        <select v-model="countryFilter"
                                            class="px-3 py-2 text-sm border border-mun-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-un-blue focus:border-un-blue">
                                            <option value="">All Countries</option>
                                            <option value="registered">Registered</option>
                                            <option value="unregistered">Unregistered</option>
                                            <option value="observer">Observers</option>
                                            <option value="special">Special Roles</option>
                                        </select>

                                        <!-- Actions -->
                                        <AppButton variant="outline" size="sm" :icon="ArrowPathIcon"
                                            @click="generateAllQRCodes" :disabled="assignedCountries.length === 0">
                                            Generate QR Codes
                                        </AppButton>
                                    </div>
                                </div>

                                <!-- Empty State -->
                                <div v-if="filteredCountries.length === 0" class="text-center py-12">
                                    <FlagIcon class="w-16 h-16 text-mun-gray-400 mx-auto mb-4" />
                                    <h3 class="text-lg font-medium text-mun-gray-900 mb-2">No countries assigned</h3>
                                    <p class="text-mun-gray-500 mb-6">
                                        Start by searching and adding countries to this committee.
                                    </p>
                                </div>

                                <!-- Countries Grid -->
                                <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <CountryItem v-for="country in filteredCountries" :key="country.name"
                                        :country="country" @remove="removeCountry" @toggle-role="toggleCountryRole"
                                        @regenerate-qr="regenerateQR" />
                                </div>
                            </div>

                            <!-- Modal Footer -->
                            <div
                                class="flex justify-between items-center p-6 border-t border-mun-gray-100 bg-mun-gray-50/50">
                                <div class="text-sm text-mun-gray-600">
                                    {{ assignedCountries.length }} countries assigned •
                                    {{ registeredCount }} registered •
                                    {{ qrGeneratedCount }} QR codes generated
                                </div>

                                <div class="flex space-x-4">
                                    <AppButton variant="outline" @click="close">
                                        Cancel
                                    </AppButton>

                                    <AppButton variant="primary" @click="saveCountries" :loading="isSaving">
                                        Save Changes
                                    </AppButton>
                                </div>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionRoot,
    TransitionChild
} from '@headlessui/vue'
import { useAppStore } from '@/stores/app'
import { apiMethods } from '@/utils/api'
import { debounce } from 'lodash-es'
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    FlagIcon,
    ArrowPathIcon
} from '@heroicons/vue/24/outline'
import CountryItem from './CountryItem.vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },

    committee: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'saved', 'close'])

const appStore = useAppStore()

// State
const countrySearch = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const selectedCountry = ref(null)
const selectedSpecialRole = ref('')
const countryFilter = ref('')
const assignedCountries = ref([])
const allCountries = ref([])
const isSaving = ref(false)

// Quick add presets
const quickAddPresets = ref([
    { id: 'p5', name: 'P5 (Security Council)', countries: ['US', 'GB', 'FR', 'RU', 'CN'] },
    { id: 'g7', name: 'G7', countries: ['US', 'GB', 'FR', 'DE', 'IT', 'CA', 'JP'] },
    { id: 'brics', name: 'BRICS', countries: ['BR', 'RU', 'IN', 'CN', 'ZA'] },
    { id: 'asean', name: 'ASEAN Core', countries: ['ID', 'TH', 'PH', 'MY', 'SG', 'VN'] }
])

// Computed
const filteredCountries = computed(() => {
    let filtered = [...assignedCountries.value]

    switch (countryFilter.value) {
        case 'registered':
            filtered = filtered.filter(c => c.email)
            break
        case 'unregistered':
            filtered = filtered.filter(c => !c.email)
            break
        case 'observer':
            filtered = filtered.filter(c => c.isObserver)
            break
        case 'special':
            filtered = filtered.filter(c => c.specialRole)
            break
    }

    return filtered
})

const registeredCount = computed(() => {
    return assignedCountries.value.filter(c => c.email).length
})

const qrGeneratedCount = computed(() => {
    return assignedCountries.value.filter(c => c.qrToken).length
})

// Methods
const loadCountries = async () => {
    try {
        const response = await apiMethods.countries.getAll({ lang: 'en' })
        allCountries.value = response.data.countries || []
    } catch (error) {
        console.error('Load countries error:', error)
        appStore.showErrorMessage('Failed to load countries list')
    }
}

const searchCountries = debounce(() => {
    if (!countrySearch.value.trim()) {
        showSearchResults.value = false
        return
    }

    const query = countrySearch.value.toLowerCase()
    searchResults.value = allCountries.value
        .filter(country =>
            country.name.toLowerCase().includes(query) ||
            country.code.toLowerCase().includes(query)
        )
        .filter(country =>
            !assignedCountries.value.some(assigned => assigned.name === country.name)
        )
        .slice(0, 10)

    showSearchResults.value = searchResults.value.length > 0
}, 300)

const selectCountry = (country) => {
    selectedCountry.value = country
    countrySearch.value = country.name
    showSearchResults.value = false
}

const addSelectedCountry = () => {
    if (!selectedCountry.value) return

    const countryData = {
        name: selectedCountry.value.name,
        code: selectedCountry.value.code,
        flagUrl: getFlagUrl(selectedCountry.value.code),
        isObserver: selectedSpecialRole.value === 'observer',
        specialRole: selectedSpecialRole.value || null,
        isPermanentMember: selectedSpecialRole.value === 'permanent',
        hasVetoRight: selectedSpecialRole.value === 'permanent' && props.committee?.type === 'SC',
        qrToken: generateQRToken(),
        isQrActive: true,
        email: null,
        registeredAt: null
    }

    assignedCountries.value.push(countryData)

    // Reset form
    countrySearch.value = ''
    selectedCountry.value = null
    selectedSpecialRole.value = ''

    appStore.showSuccessMessage(`${countryData.name} added to committee`)
}

const addPresetCountries = async (preset) => {
    try {
        const countriesToAdd = preset.countries
            .map(code => allCountries.value.find(c => c.code.toUpperCase() === code.toUpperCase()))
            .filter(country =>
                country && !assignedCountries.value.some(assigned => assigned.name === country.name)
            )

        countriesToAdd.forEach(country => {
            const countryData = {
                name: country.name,
                code: country.code,
                flagUrl: getFlagUrl(country.code),
                isObserver: false,
                specialRole: null,
                isPermanentMember: preset.id === 'p5' && props.committee?.type === 'SC',
                hasVetoRight: preset.id === 'p5' && props.committee?.type === 'SC',
                qrToken: generateQRToken(),
                isQrActive: true,
                email: null,
                registeredAt: null
            }

            assignedCountries.value.push(countryData)
        })

        appStore.showSuccessMessage(`${countriesToAdd.length} countries from ${preset.name} added`)

    } catch (error) {
        console.error('Add preset countries error:', error)
        appStore.showErrorMessage('Failed to add preset countries')
    }
}

const removeCountry = async (country) => {
    const confirmed = await appStore.showConfirmDialog({
        title: 'Remove Country',
        message: `Are you sure you want to remove ${country.name} from this committee?`,
        confirmText: 'Remove',
        type: 'warning'
    })

    if (confirmed) {
        assignedCountries.value = assignedCountries.value.filter(c => c.name !== country.name)
        appStore.showSuccessMessage(`${country.name} removed from committee`)
    }
}

const toggleCountryRole = (country, newRole) => {
    const index = assignedCountries.value.findIndex(c => c.name === country.name)
    if (index !== -1) {
        assignedCountries.value[index] = {
            ...assignedCountries.value[index],
            isObserver: newRole === 'observer',
            specialRole: newRole === 'regular' ? null : newRole,
            isPermanentMember: newRole === 'permanent',
            hasVetoRight: newRole === 'permanent' && props.committee?.type === 'SC'
        }
    }
}

const regenerateQR = (country) => {
    const index = assignedCountries.value.findIndex(c => c.name === country.name)
    if (index !== -1) {
        assignedCountries.value[index] = {
            ...assignedCountries.value[index],
            qrToken: generateQRToken(),
            isQrActive: true,
            email: null,
            registeredAt: null
        }
        appStore.showSuccessMessage(`QR code regenerated for ${country.name}`)
    }
}

const generateAllQRCodes = async () => {
    try {
        const response = await apiMethods.committees.generateQRs(props.committee._id)

        if (response.data.success) {
            // Update local data with new QR codes
            assignedCountries.value.forEach(country => {
                if (!country.qrToken) {
                    country.qrToken = generateQRToken()
                    country.isQrActive = true
                }
            })

            appStore.showSuccessMessage('QR codes generated for all countries')
        }
    } catch (error) {
        console.error('Generate QR codes error:', error)
        appStore.showErrorMessage('Failed to generate QR codes')
    }
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
        }

    } catch (error) {
        console.error('Save countries error:', error)
        appStore.showErrorMessage('Failed to save countries')
    } finally {
        isSaving.value = false
    }
}

const close = () => {
    emit('update:modelValue', false)
    emit('close')
}

// Utility functions
const getFlagUrl = (countryCode) => {
    return `/api/countries/flags/${countryCode.toLowerCase()}`
}

const handleFlagError = (event) => {
    event.target.src = '/placeholder-flag.svg' // Fallback flag
}

const generateQRToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
    if (newValue && props.committee) {
        assignedCountries.value = [...(props.committee.countries || [])]
    }
})

watch(() => props.committee, (newCommittee) => {
    if (props.modelValue && newCommittee) {
        assignedCountries.value = [...(newCommittee.countries || [])]
    }
})

// Initialize
onMounted(() => {
    loadCountries()
})
</script>

<style scoped>
/* Search dropdown animation */
.search-dropdown {
    animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Country grid animation */
.country-item {
    animation: slideInUp 0.3s ease-out;
}

.country-item:nth-child(1) {
    animation-delay: 0.1s;
}

.country-item:nth-child(2) {
    animation-delay: 0.2s;
}

.country-item:nth-child(3) {
    animation-delay: 0.3s;
}

.country-item:nth-child(4) {
    animation-delay: 0.4s;
}
</style>