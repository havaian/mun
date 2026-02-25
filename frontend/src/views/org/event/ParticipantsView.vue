<template>
    <div :class="embedded ? 'space-y-6' : 'p-6 lg:p-8 space-y-6'">
        <!-- Header (standalone mode) -->
        <div v-if="!embedded" class="page-header p-6">
            <div>
                <div class="flex items-center space-x-3 mb-1">
                    <router-link
                        :to="{ name: 'OrgEventDetail', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="text-sm text-mun-gray-400 hover:text-mun-gray-600">← Back to Event</router-link>
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Participants</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage event participants and their roles</p>
            </div>
            <AppButton v-if="canManage" @click="openAddModal">
                <PlusIcon class="w-4 h-4 mr-2" />
                Add Participant
            </AppButton>
        </div>
        <!-- Compact action bar (embedded mode) -->
        <div v-else-if="canManage" class="flex justify-end">
            <AppButton @click="openAddModal">
                <PlusIcon class="w-4 h-4 mr-2" />
                Add Participant
            </AppButton>
        </div>

        <!-- Filters -->
        <div v-if="!isLoading && participants.length > 0" class="flex flex-wrap items-center gap-3">
            <!-- Role filter -->
            <select v-model="filterRole" class="input-field text-sm !w-auto !py-1.5 !pl-3 !pr-8">
                <option value="">All Roles</option>
                <option value="delegate">Delegates</option>
                <option value="observer">Observers</option>
                <option value="expert">Experts</option>
                <option value="presidium_chair">Chair</option>
                <option value="presidium_cochair">Co-Chair</option>
                <option value="presidium_expert">Presidium Expert</option>
                <option value="presidium_secretary">Secretary</option>
            </select>

            <!-- Committee filter -->
            <select v-model="filterCommittee" class="input-field text-sm !w-auto !py-1.5 !pl-3 !pr-8">
                <option value="">All Committees</option>
                <option v-for="c in committeeOptions" :key="c._id" :value="c._id">
                    {{ c.acronym || c.name }}
                </option>
            </select>

            <!-- Status filter -->
            <select v-model="filterStatus" class="input-field text-sm !w-auto !py-1.5 !pl-3 !pr-8">
                <option value="active">Active</option>
                <option value="all">All</option>
                <option value="removed">Removed</option>
            </select>

            <!-- Count -->
            <span class="text-sm text-mun-gray-400 ml-auto">
                {{ filteredParticipants.length }} participant{{ filteredParticipants.length !== 1 ? 's' : '' }}
            </span>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <!-- Empty -->
        <div v-else-if="participants.length === 0"
            class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
            <UserGroupIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
            <p class="text-mun-gray-500">No participants yet.</p>
            <p class="text-sm text-mun-gray-400 mt-1">Add participants directly or accept registration applications.</p>
        </div>

        <!-- Participant list -->
        <div v-else class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden">
            <!-- Table header -->
            <div
                class="grid grid-cols-12 gap-4 px-5 py-3 bg-mun-gray-50 border-b border-mun-gray-200 text-xs font-semibold text-mun-gray-500 uppercase tracking-wide">
                <div class="col-span-4">Participant</div>
                <div class="col-span-2">Role</div>
                <div class="col-span-2">Committee</div>
                <div class="col-span-2">Country</div>
                <div class="col-span-2 text-right">Actions</div>
            </div>

            <!-- Rows -->
            <div v-for="p in filteredParticipants" :key="p._id"
                class="grid grid-cols-12 gap-4 px-5 py-3.5 items-center border-b border-mun-gray-100 last:border-b-0 hover:bg-mun-gray-50/50 transition-colors">
                <!-- Participant info -->
                <div class="col-span-4 flex items-center space-x-3 min-w-0">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        :class="roleAvatarClass(p.role)">
                        <span class="text-xs font-bold">
                            {{ (p.user?.firstName?.charAt(0) || '') + (p.user?.lastName?.charAt(0) || '') }}
                        </span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-mun-gray-900 truncate">
                            {{ p.user?.firstName }} {{ p.user?.lastName }}
                        </p>
                        <p class="text-xs text-mun-gray-400 truncate">{{ p.user?.email }}</p>
                    </div>
                </div>

                <!-- Role -->
                <div class="col-span-2">
                    <span :class="roleBadgeClass(p.role)">
                        {{ formatRole(p.role) }}
                    </span>
                </div>

                <!-- Committee -->
                <div class="col-span-2">
                    <span v-if="p.committee" class="text-sm text-mun-gray-700 font-medium">
                        {{ p.committee.acronym || p.committee.name }}
                    </span>
                    <span v-else class="text-xs text-mun-gray-400">—</span>
                </div>

                <!-- Country -->
                <div class="col-span-2">
                    <div v-if="p.country?.name" class="flex items-center space-x-1.5">
                        <CountryFlag :country-name="p.country.name" :country-code="p.country.code" size="small"
                            variant="bordered" />
                        <span class="text-sm text-mun-gray-700">{{ p.country.name }}</span>
                    </div>
                    <span v-else class="text-xs text-mun-gray-400">—</span>
                </div>

                <!-- Actions -->
                <div class="col-span-2 flex items-center justify-end space-x-1">
                    <button v-if="canManage && p.status === 'active'" @click="confirmRemove(p)"
                        class="p-1.5 text-mun-gray-400 hover:text-red-600 transition-colors rounded"
                        title="Remove participant">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                    <span v-if="p.status === 'removed'"
                        class="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                        Removed
                    </span>
                </div>
            </div>
        </div>

        <!-- =============================================
             ADD PARTICIPANT MODAL
             ============================================= -->
        <ModalWrapper :modelValue="showAddModal" @close="closeAddModal" :showDefaultFooter="false" size="lg">
            <template #title>Add Participant</template>
            <template #default>
                <div class="space-y-5">
                    <!-- User search -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Search User *</label>
                        <div class="relative">
                            <input v-model="userSearchQuery" type="text" class="input-field pl-10"
                                placeholder="Search by email, name, or institution..." @input="debouncedSearchUsers" />
                            <MagnifyingGlassIcon
                                class="w-5 h-5 text-mun-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <LoadingSpinner v-if="isSearching" size="sm"
                                class="absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>

                        <!-- Search results dropdown -->
                        <div v-if="searchResults.length > 0 && !selectedUser"
                            class="mt-1 border border-mun-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                            <button v-for="user in searchResults" :key="user._id" @click="selectUser(user)"
                                class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-mun-gray-50 text-left transition-colors">
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-mun-gray-900 truncate">
                                        {{ user.firstName }} {{ user.lastName }}
                                    </p>
                                    <p class="text-xs text-mun-gray-500 truncate">{{ user.email }}</p>
                                    <p v-if="user.institution" class="text-xs text-mun-gray-400 truncate">{{
                                        user.institution }}</p>
                                </div>
                                <div v-if="user.existingRoles?.length" class="flex-shrink-0 ml-3">
                                    <span v-for="(er, i) in user.existingRoles" :key="i"
                                        class="text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded">
                                        {{ er.role }}<span v-if="er.committee"> ({{ er.committee }})</span>
                                    </span>
                                </div>
                            </button>
                        </div>

                        <!-- No results -->
                        <p v-if="userSearchQuery.length >= 2 && searchResults.length === 0 && !isSearching && !selectedUser"
                            class="text-xs text-mun-gray-400 mt-1">
                            No users found matching "{{ userSearchQuery }}"
                        </p>

                        <!-- Selected user chip -->
                        <div v-if="selectedUser"
                            class="mt-2 flex items-center justify-between bg-mun-blue-50 border border-mun-blue-200 rounded-lg px-4 py-2.5">
                            <div>
                                <p class="text-sm font-medium text-mun-gray-900">
                                    {{ selectedUser.firstName }} {{ selectedUser.lastName }}
                                </p>
                                <p class="text-xs text-mun-gray-500">{{ selectedUser.email }}</p>
                                <p v-if="selectedUser.institution" class="text-xs text-mun-gray-400">{{
                                    selectedUser.institution }}</p>
                                <p v-if="selectedUser.phone" class="text-xs text-mun-gray-400">{{ selectedUser.phone }}
                                </p>
                            </div>
                            <button @click="clearSelectedUser" class="p-1 text-mun-gray-400 hover:text-mun-gray-600">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- Role -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Role *</label>
                        <select v-model="addForm.role" class="input-field">
                            <option value="">Select role...</option>
                            <optgroup label="Delegates">
                                <option value="delegate">Delegate</option>
                                <option value="observer">Observer</option>
                                <option value="expert">Expert</option>
                            </optgroup>
                            <optgroup label="Presidium">
                                <option value="presidium_chair">Chair</option>
                                <option value="presidium_cochair">Co-Chair</option>
                                <option value="presidium_expert">Presidium Expert</option>
                                <option value="presidium_secretary">Secretary</option>
                            </optgroup>
                        </select>
                    </div>

                    <!-- Committee -->
                    <div v-if="requiresCommittee">
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Committee *</label>
                        <select v-model="addForm.committeeId" class="input-field">
                            <option value="">Select committee...</option>
                            <option v-for="c in committees" :key="c._id" :value="c._id">
                                {{ c.acronym || c.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Country (delegates only) -->
                    <div v-if="addForm.role === 'delegate' && addForm.committeeId">
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Country *</label>
                        <div class="relative">
                            <input v-model="countrySearch" type="text" class="input-field"
                                placeholder="Search country..." @focus="showCountryDropdown = true" />
                        </div>
                        <div v-if="showCountryDropdown && filteredCountries.length > 0"
                            class="mt-1 border border-mun-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg">
                            <button v-for="country in filteredCountries" :key="country.code"
                                @click="selectCountry(country)"
                                class="w-full flex items-center px-4 py-2 hover:bg-mun-gray-50 text-left text-sm transition-colors">
                                <CountryFlag :country-name="country.name" :country-code="country.code" size="small"
                                    variant="bordered" class="mr-2" />
                                {{ country.name }}
                            </button>
                        </div>
                        <!-- Selected country -->
                        <div v-if="addForm.country?.name && !showCountryDropdown"
                            class="mt-1 flex items-center space-x-2 text-sm text-mun-gray-700">
                            <CountryFlag :country-name="addForm.country.name" :country-code="addForm.country.code"
                                size="small" variant="bordered" />
                            <span>{{ addForm.country.name }}</span>
                            <button @click="addForm.country = { name: '', code: '' }; countrySearch = ''"
                                class="text-mun-gray-400 hover:text-mun-gray-600">
                                <XMarkIcon class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3 pt-2 border-t border-mun-gray-100">
                        <AppButton variant="ghost" @click="closeAddModal">Cancel</AppButton>
                        <AppButton @click="addParticipant" :disabled="!canSubmitAdd || isAdding">
                            {{ isAdding ? 'Adding...' : 'Add Participant' }}
                        </AppButton>
                    </div>
                </div>
            </template>
        </ModalWrapper>

        <!-- Remove confirmation -->
        <ConfirmationDialog v-model="showRemoveConfirm" title="Remove Participant?"
            :message="`Remove ${removingParticipant?.user?.firstName} ${removingParticipant?.user?.lastName} from this event? They will lose access to their committee.`"
            type="danger" confirm-variant="danger" confirm-text="Remove" @confirm="removeParticipant" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    PlusIcon, XMarkIcon, MagnifyingGlassIcon, UserGroupIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'

defineProps({
    embedded: { type: Boolean, default: false }
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)
const canManage = computed(() => authStore.isOrgAdmin || authStore.hasOrgPermission('manage_event_content'))

// =============================================
// LIST STATE
// =============================================
const isLoading = ref(true)
const participants = ref([])
const committees = ref([])
const eventId = ref(null)

const filterRole = ref('')
const filterCommittee = ref('')
const filterStatus = ref('active')

const committeeOptions = computed(() => {
    // Derive unique committees from loaded participants + loaded committees
    const map = new Map()
    committees.value.forEach(c => map.set(c._id, c))
    participants.value.forEach(p => {
        if (p.committee?._id && !map.has(p.committee._id)) {
            map.set(p.committee._id, p.committee)
        }
    })
    return Array.from(map.values()).sort((a, b) => (a.acronym || a.name).localeCompare(b.acronym || b.name))
})

const filteredParticipants = computed(() => {
    return participants.value.filter(p => {
        if (filterRole.value && p.role !== filterRole.value) return false
        if (filterCommittee.value && p.committee?._id !== filterCommittee.value) return false
        if (filterStatus.value !== 'all' && p.status !== filterStatus.value) return false
        return true
    })
})

// =============================================
// ADD PARTICIPANT STATE
// =============================================
const showAddModal = ref(false)
const isAdding = ref(false)
const isSearching = ref(false)
const userSearchQuery = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const countrySearch = ref('')
const showCountryDropdown = ref(false)
const allCountries = ref([])

const addForm = reactive({
    role: '',
    committeeId: '',
    country: { name: '', code: '' }
})

const PRESIDIUM_ROLES = ['presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary']

const requiresCommittee = computed(() => {
    return addForm.role === 'delegate' || PRESIDIUM_ROLES.includes(addForm.role)
})

const canSubmitAdd = computed(() => {
    if (!selectedUser.value || !addForm.role) return false
    if (requiresCommittee.value && !addForm.committeeId) return false
    if (addForm.role === 'delegate' && (!addForm.country?.name || !addForm.country?.code)) return false
    return true
})

const filteredCountries = computed(() => {
    // Get committee's assigned countries if available
    const committee = committees.value.find(c => c._id === addForm.committeeId)
    const pool = committee?.countries?.length ? committee.countries : allCountries.value

    if (!countrySearch.value.trim()) return pool.slice(0, 50)
    const q = countrySearch.value.toLowerCase()
    return pool.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 50)
})

// =============================================
// REMOVE STATE
// =============================================
const showRemoveConfirm = ref(false)
const removingParticipant = ref(null)

// =============================================
// LOAD DATA
// =============================================
const loadData = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (!eventRes.data.success) return

        eventId.value = eventRes.data.event._id

        const [pRes, cRes] = await Promise.all([
            apiMethods.participants.getAll(orgId.value, eventId.value, { status: 'all' }),
            apiMethods.committees.getAll(orgId.value, eventId.value)
        ])

        if (pRes.data.success) participants.value = pRes.data.participants || []
        if (cRes.data.success) committees.value = cRes.data.committees || []
    } catch (e) {
        console.error('Failed to load participants:', e)
    } finally {
        isLoading.value = false
    }
}

// =============================================
// USER SEARCH
// =============================================
let searchTimeout = null

const debouncedSearchUsers = () => {
    clearTimeout(searchTimeout)
    if (userSearchQuery.value.trim().length < 2) {
        searchResults.value = []
        return
    }
    searchTimeout = setTimeout(async () => {
        isSearching.value = true
        try {
            const res = await apiMethods.participants.searchUsers(orgId.value, eventId.value, { q: userSearchQuery.value.trim() })
            if (res.data.success) {
                searchResults.value = res.data.users || []
            }
        } catch (e) {
            console.error('User search failed:', e)
            searchResults.value = []
        } finally {
            isSearching.value = false
        }
    }, 300)
}

const selectUser = (user) => {
    selectedUser.value = user
    userSearchQuery.value = ''
    searchResults.value = []
}

const clearSelectedUser = () => {
    selectedUser.value = null
    userSearchQuery.value = ''
    searchResults.value = []
}

const selectCountry = (country) => {
    addForm.country = { name: country.name, code: country.code }
    countrySearch.value = country.name
    showCountryDropdown.value = false
}

// Close country dropdown on outside click
const handleClickOutside = () => {
    showCountryDropdown.value = false
}

// =============================================
// ADD PARTICIPANT
// =============================================
const openAddModal = async () => {
    // Reset form
    selectedUser.value = null
    userSearchQuery.value = ''
    searchResults.value = []
    addForm.role = ''
    addForm.committeeId = ''
    addForm.country = { name: '', code: '' }
    countrySearch.value = ''
    showCountryDropdown.value = false

    // Load countries if not loaded
    if (allCountries.value.length === 0) {
        try {
            const res = await apiMethods.countries.getAll()
            if (res.data.success) allCountries.value = res.data.countries || []
        } catch (e) { /* non-fatal */ }
    }

    showAddModal.value = true
}

const closeAddModal = () => {
    showAddModal.value = false
}

const addParticipant = async () => {
    if (!canSubmitAdd.value) return
    isAdding.value = true
    try {
        const payload = {
            userId: selectedUser.value._id,
            role: addForm.role,
            committeeId: addForm.committeeId || undefined,
            country: addForm.role === 'delegate'
                ? { name: addForm.country.name, code: addForm.country.code }
                : undefined
        }

        await apiMethods.participants.add(orgId.value, eventId.value, payload)
        toast.success(`${selectedUser.value.firstName} ${selectedUser.value.lastName} added as ${formatRole(addForm.role)}`)
        closeAddModal()
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to add participant')
    } finally {
        isAdding.value = false
    }
}

// =============================================
// REMOVE PARTICIPANT
// =============================================
const confirmRemove = (participant) => {
    removingParticipant.value = participant
    showRemoveConfirm.value = true
}

const removeParticipant = async () => {
    if (!removingParticipant.value) return
    try {
        await apiMethods.participants.remove(orgId.value, eventId.value, removingParticipant.value._id)
        toast.success('Participant removed')
        removingParticipant.value = null
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to remove participant')
    }
}

// =============================================
// FORMATTING
// =============================================
const formatRole = (role) => {
    const map = {
        delegate: 'Delegate',
        observer: 'Observer',
        expert: 'Expert',
        presidium_chair: 'Chair',
        presidium_cochair: 'Co-Chair',
        presidium_expert: 'Pres. Expert',
        presidium_secretary: 'Secretary'
    }
    return map[role] || role
}

const roleBadgeClass = (role) => {
    if (PRESIDIUM_ROLES.includes(role)) return 'px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700'
    if (role === 'delegate') return 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-blue-50 text-mun-blue-700'
    if (role === 'observer') return 'px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700'
    return 'px-2 py-0.5 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600'
}

const roleAvatarClass = (role) => {
    if (PRESIDIUM_ROLES.includes(role)) return 'bg-purple-100 text-purple-700'
    if (role === 'delegate') return 'bg-mun-blue-100 text-mun-blue-700'
    if (role === 'observer') return 'bg-yellow-100 text-yellow-700'
    return 'bg-mun-gray-100 text-mun-gray-600'
}

// =============================================
// LIFECYCLE
// =============================================
onMounted(() => loadData())
</script>