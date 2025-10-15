<!-- frontend/src/components/delegate/JoinCoalitionModal.vue -->
<template>
    <Teleport to="body">
        <transition name="modal-overlay">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeModal"></div>

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <transition name="modal-content">
                        <div v-if="modelValue"
                            class="join-coalition-modal relative bg-white rounded-2xl shadow-mun-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            <!-- Header -->
                            <div
                                class="modal-header flex items-center justify-between p-6 border-b border-mun-gray-200">
                                <div class="flex items-center space-x-3">
                                    <div class="p-3 bg-mun-green-100 rounded-xl">
                                        <UserPlusIcon class="w-6 h-6 text-mun-green-700" />
                                    </div>
                                    <div>
                                        <h2 class="text-xl font-bold text-mun-gray-900">Join Coalition</h2>
                                        <p class="text-sm text-mun-gray-600">Request to join an existing coalition</p>
                                    </div>
                                </div>

                                <button @click="closeModal"
                                    class="p-2 rounded-lg hover:bg-mun-gray-100 transition-colors">
                                    <XMarkIcon class="w-5 h-5 text-mun-gray-600" />
                                </button>
                            </div>

                            <!-- Content -->
                            <div class="modal-content p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                <div class="space-y-6">
                                    <!-- Coalition Search -->
                                    <div class="search-section">
                                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Find Coalitions</h3>

                                        <div class="search-controls space-y-4">
                                            <!-- Search Input -->
                                            <div class="relative">
                                                <input v-model="searchQuery" type="text"
                                                    placeholder="Search coalitions by name, description, or country..."
                                                    class="winput-field w-full px-4 py-3 pl-10" />
                                                <MagnifyingGlassIcon
                                                    class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-mun-gray-400" />
                                            </div>

                                            <!-- Filters -->
                                            <div class="filters flex items-center space-x-4">
                                                <SleekSelect v-model="filterType" :options="[
                                                    { label: 'All Types', value: '' },
                                                    { label: 'General Coalition', value: 'general' },
                                                    { label: 'Regional Bloc', value: 'regional' },
                                                    { label: 'Thematic Group', value: 'thematic' },
                                                    { label: 'Bilateral Partnership', value: 'bilateral' }
                                                ]" size="sm" container-class="min-w-[140px]" />

                                                <SleekSelect v-model="filterStatus" :options="[
                                                    { label: 'All Status', value: '' },
                                                    { label: 'Forming', value: 'draft' },
                                                    { label: 'Active', value: 'active' }
                                                ]" size="sm" container-class="min-w-[120px]" />

                                                <label class="flex items-center text-sm text-mun-gray-700">
                                                    <input v-model="showOnlyJoinable" type="checkbox"
                                                        class="input-field" />
                                                    Only joinable
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Loading State -->
                                    <div v-if="isLoading" class="flex items-center justify-center py-8">
                                        <LoadingSpinner />
                                    </div>

                                    <!-- Coalition Results -->
                                    <div v-else-if="filteredCoalitions.length > 0" class="results-section">
                                        <div class="flex items-center justify-between mb-4">
                                            <h3 class="text-lg font-medium text-mun-gray-900">Available Coalitions</h3>
                                            <span class="text-sm text-mun-gray-500">{{ filteredCoalitions.length }}
                                                found</span>
                                        </div>

                                        <div class="coalition-list space-y-3 max-h-96 overflow-y-auto">
                                            <div v-for="coalition in filteredCoalitions" :key="coalition._id" :class="[
                                                'coalition-item p-4 border rounded-lg transition-all duration-200 cursor-pointer',
                                                selectedCoalition?._id === coalition._id
                                                    ? 'border-mun-blue bg-mun-blue/5 shadow-mun'
                                                    : 'border-mun-gray-200 hover:border-mun-blue/30 hover:shadow-sm'
                                            ]" @click="selectCoalition(coalition)">
                                                <!-- Coalition Header -->
                                                <div class="flex items-start justify-between mb-3">
                                                    <div class="flex items-start space-x-3 flex-1">
                                                        <div :class="getCoalitionIconBg(coalition)"
                                                            class="p-2 rounded-lg">
                                                            <UserGroupIcon class="w-5 h-5"
                                                                :class="getCoalitionIconColor(coalition)" />
                                                        </div>

                                                        <div class="flex-1">
                                                            <div class="flex items-center space-x-2 mb-1">
                                                                <h4 class="text-sm font-medium text-mun-gray-900">{{
                                                                    coalition.name }}</h4>
                                                                <span :class="getStatusBadgeClass(coalition)"
                                                                    class="px-2 py-1 text-xs font-medium rounded-full">
                                                                    {{ getStatusText(coalition) }}
                                                                </span>
                                                                <span :class="getTypeBadgeClass(coalition)"
                                                                    class="px-2 py-1 text-xs font-medium rounded-full">
                                                                    {{ getTypeText(coalition) }}
                                                                </span>
                                                            </div>

                                                            <p v-if="coalition.description"
                                                                class="text-xs text-mun-gray-600 line-clamp-2 mb-2">
                                                                {{ coalition.description }}
                                                            </p>

                                                            <div
                                                                class="flex items-center space-x-4 text-xs text-mun-gray-500">
                                                                <span class="flex items-center">
                                                                    <CrownIcon class="w-3 h-3 mr-1" />
                                                                    {{ coalition.headCountry }}
                                                                </span>
                                                                <span class="flex items-center">
                                                                    <UsersIcon class="w-3 h-3 mr-1" />
                                                                    {{ getAcceptedMembersCount(coalition) }} members
                                                                </span>
                                                                <span class="flex items-center">
                                                                    <ClockIcon class="w-3 h-3 mr-1" />
                                                                    {{ formatDate(coalition.createdAt) }}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Join Status -->
                                                    <div class="join-status">
                                                        <div v-if="getJoinStatus(coalition) === 'can-join'"
                                                            class="text-mun-green-600">
                                                            <PlusCircleIcon class="w-5 h-5" />
                                                        </div>
                                                        <div v-else-if="getJoinStatus(coalition) === 'pending'"
                                                            class="text-mun-yellow-600">
                                                            <ClockIcon class="w-5 h-5" />
                                                        </div>
                                                        <div v-else-if="getJoinStatus(coalition) === 'member'"
                                                            class="text-mun-blue">
                                                            <CheckCircleIcon class="w-5 h-5" />
                                                        </div>
                                                        <div v-else class="text-mun-gray-400">
                                                            <XCircleIcon class="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Members Preview -->
                                                <div class="members-preview">
                                                    <div class="flex items-center space-x-1 flex-wrap">
                                                        <!-- Head -->
                                                        <div
                                                            class="member-flag flex items-center space-x-1 px-2 py-1 bg-mun-blue/10 rounded">
                                                            <CountryFlag :country="coalition.headCountry" size="xs" />
                                                            <span class="text-xs text-mun-blue font-medium">{{
                                                                coalition.headCountry }}</span>
                                                            <CrownIcon class="w-3 h-3 text-mun-blue" />
                                                        </div>

                                                        <!-- Members -->
                                                        <div v-for="member in getVisibleMembers(coalition)"
                                                            :key="member.email"
                                                            class="member-flag flex items-center space-x-1 px-2 py-1 bg-mun-green-50 rounded">
                                                            <CountryFlag :country="member.country" size="xs" />
                                                            <span class="text-xs text-mun-green-700 font-medium">{{
                                                                member.country }}</span>
                                                        </div>

                                                        <!-- More indicator -->
                                                        <div v-if="getHiddenMembersCount(coalition) > 0"
                                                            class="px-2 py-1 bg-mun-gray-100 rounded">
                                                            <span class="text-xs text-mun-gray-600">+{{
                                                                getHiddenMembersCount(coalition) }}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Join Information -->
                                                <div v-if="getJoinStatus(coalition) !== 'can-join'"
                                                    class="join-info mt-3 p-2 rounded"
                                                    :class="getJoinInfoClass(coalition)">
                                                    <p class="text-xs" :class="getJoinInfoTextClass(coalition)">
                                                        {{ getJoinInfoText(coalition) }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Empty State -->
                                    <div v-else-if="!isLoading"
                                        class="empty-state flex flex-col items-center justify-center py-12 text-center">
                                        <div class="p-4 bg-mun-gray-100 rounded-xl mb-4">
                                            <UserGroupIcon class="w-8 h-8 text-mun-gray-400" />
                                        </div>
                                        <h3 class="text-lg font-medium text-mun-gray-900 mb-2">No coalitions found</h3>
                                        <p class="text-sm text-mun-gray-600 mb-4">
                                            {{ searchQuery ? 'Try adjusting your search terms or filters' : 'No coalitions are currently available for joining' }}
                                        </p>
                                        <button @click="clearFilters"
                                            class="px-4 py-2 text-sm font-medium text-mun-blue bg-mun-blue/10 border border-mun-blue/20 rounded-lg hover:bg-mun-blue/20 transition-colors">
                                            Clear Filters
                                        </button>
                                    </div>

                                    <!-- Selected Coalition Details -->
                                    <div v-if="selectedCoalition" class="selection-section">
                                        <h3 class="text-lg font-medium text-mun-gray-900 mb-4">Join Request</h3>

                                        <div
                                            class="selected-coalition p-4 bg-mun-blue/5 border border-mun-blue/20 rounded-lg mb-4">
                                            <div class="flex items-center space-x-3 mb-3">
                                                <div class="p-2 bg-mun-blue/10 rounded-lg">
                                                    <UserGroupIcon class="w-5 h-5 text-mun-blue" />
                                                </div>
                                                <div>
                                                    <h4 class="text-sm font-medium text-mun-gray-900">{{
                                                        selectedCoalition.name }}</h4>
                                                    <p class="text-xs text-mun-gray-600">Led by {{
                                                        selectedCoalition.headCountry }}</p>
                                                </div>
                                            </div>

                                            <p v-if="selectedCoalition.description"
                                                class="text-sm text-mun-gray-700 mb-3">
                                                {{ selectedCoalition.description }}
                                            </p>

                                            <div class="grid grid-cols-3 gap-4 text-center text-xs">
                                                <div>
                                                    <div class="font-medium text-mun-gray-900">{{
                                                        getAcceptedMembersCount(selectedCoalition) + 1 }}</div>
                                                    <div class="text-mun-gray-500">Current Members</div>
                                                </div>
                                                <div>
                                                    <div class="font-medium text-mun-gray-900">{{
                                                        selectedCoalition.minMembers || 3 }}</div>
                                                    <div class="text-mun-gray-500">Required</div>
                                                </div>
                                                <div>
                                                    <div class="font-medium text-mun-gray-900">{{
                                                        getTypeText(selectedCoalition) }}</div>
                                                    <div class="text-mun-gray-500">Type</div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Join Message -->
                                        <div class="join-message">
                                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">
                                                Message to Coalition Head (Optional)
                                            </label>
                                            <textarea v-model="joinMessage"
                                                placeholder="Introduce yourself and explain why you'd like to join this coalition..."
                                                rows="3" maxlength="300"
                                                class="w-full px-4 py-3 border border-mun-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-transparent resize-none"></textarea>
                                            <div class="flex justify-end mt-1">
                                                <span class="text-xs text-mun-gray-500">{{ joinMessage.length
                                                    }}/300</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div
                                class="modal-footer flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                                <div class="text-sm text-mun-gray-600">
                                    <InformationCircleIcon class="w-4 h-4 inline mr-1" />
                                    Request will be sent to the coalition head for approval
                                </div>

                                <div class="flex items-center space-x-3">
                                    <button @click="closeModal"
                                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-lg hover:bg-mun-gray-50 transition-colors">
                                        Cancel
                                    </button>

                                    <button @click="sendJoinRequest"
                                        :disabled="!selectedCoalition || !canJoinSelected || isSubmitting"
                                        class="px-6 py-2 text-sm font-medium text-white bg-mun-green-600 border border-mun-green-600 rounded-lg hover:bg-mun-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        <LoadingSpinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
                                        {{ isSubmitting ? 'Sending...' : 'Send Request' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
    UserPlusIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    UsersIcon,
    ClockIcon,
    PlusCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { CrownIcon } from '@heroicons/vue/24/solid'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'join-requested'])

const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isSubmitting = ref(false)
const coalitions = ref([])
const selectedCoalition = ref(null)
const joinMessage = ref('')

// Search and filters
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showOnlyJoinable = ref(true)

// Computed
const filteredCoalitions = computed(() => {
    let filtered = [...coalitions.value]

    // Search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(coalition =>
            coalition.name.toLowerCase().includes(query) ||
            coalition.description?.toLowerCase().includes(query) ||
            coalition.headCountry.toLowerCase().includes(query) ||
            coalition.members?.some(member =>
                member.country.toLowerCase().includes(query)
            )
        )
    }

    // Type filter
    if (filterType.value) {
        filtered = filtered.filter(coalition => coalition.type === filterType.value)
    }

    // Status filter
    if (filterStatus.value) {
        filtered = filtered.filter(coalition => coalition.status === filterStatus.value)
    }

    // Joinable filter
    if (showOnlyJoinable.value) {
        filtered = filtered.filter(coalition => getJoinStatus(coalition) === 'can-join')
    }

    return filtered
})

const canJoinSelected = computed(() => {
    return selectedCoalition.value && getJoinStatus(selectedCoalition.value) === 'can-join'
})

// Methods
const getAcceptedMembersCount = (coalition) => {
    return coalition.members?.filter(member => member.status === 'accepted').length || 0
}

const getVisibleMembers = (coalition) => {
    const accepted = coalition.members?.filter(member => member.status === 'accepted') || []
    return accepted.slice(0, 3)
}

const getHiddenMembersCount = (coalition) => {
    const total = getAcceptedMembersCount(coalition)
    return Math.max(0, total - 3)
}

const getJoinStatus = (coalition) => {
    const userEmail = authStore.user?.email

    // Check if user is head
    if (coalition.headEmail === userEmail) {
        return 'head'
    }

    // Check existing membership
    const membership = coalition.members?.find(member => member.email === userEmail)
    if (membership) {
        if (membership.status === 'accepted') return 'member'
        if (membership.status === 'invited') return 'pending'
        if (membership.status === 'declined') return 'declined'
    }

    // Check if can join
    if (coalition.status === 'draft' && coalition.allowDirectJoin !== false) {
        return 'can-join'
    }

    return 'cannot-join'
}

const getJoinInfoText = (coalition) => {
    const status = getJoinStatus(coalition)
    switch (status) {
        case 'head':
            return 'You are the head of this coalition'
        case 'member':
            return 'You are already a member of this coalition'
        case 'pending':
            return 'Your join request is pending approval'
        case 'declined':
            return 'Your previous request was declined'
        case 'cannot-join':
            return 'This coalition is not accepting new members'
        default:
            return ''
    }
}

const getJoinInfoClass = (coalition) => {
    const status = getJoinStatus(coalition)
    const classes = {
        head: 'bg-mun-blue/10 border border-mun-blue/20',
        member: 'bg-mun-green-50 border border-mun-green-200',
        pending: 'bg-mun-yellow-50 border border-mun-yellow-200',
        declined: 'bg-mun-red-50 border border-mun-red-200',
        'cannot-join': 'bg-mun-gray-50 border border-mun-gray-200'
    }
    return classes[status] || ''
}

const getJoinInfoTextClass = (coalition) => {
    const status = getJoinStatus(coalition)
    const classes = {
        head: 'text-mun-blue',
        member: 'text-mun-green-700',
        pending: 'text-mun-yellow-700',
        declined: 'text-mun-red-700',
        'cannot-join': 'text-mun-gray-600'
    }
    return classes[status] || ''
}

const getCoalitionIconBg = (coalition) => {
    const status = coalition.status || 'draft'
    const backgrounds = {
        draft: 'bg-mun-yellow-100',
        active: 'bg-mun-green-100',
        closed: 'bg-mun-red-100'
    }
    return backgrounds[status] || 'bg-mun-gray-100'
}

const getCoalitionIconColor = (coalition) => {
    const status = coalition.status || 'draft'
    const colors = {
        draft: 'text-mun-yellow-700',
        active: 'text-mun-green-700',
        closed: 'text-mun-red-700'
    }
    return colors[status] || 'text-mun-gray-600'
}

const getStatusBadgeClass = (coalition) => {
    const status = coalition.status || 'draft'
    const classes = {
        draft: 'bg-mun-yellow-100 text-mun-yellow-700',
        active: 'bg-mun-green-100 text-mun-green-700',
        closed: 'bg-mun-red-100 text-mun-red-700'
    }
    return classes[status] || 'bg-mun-gray-100 text-mun-gray-700'
}

const getStatusText = (coalition) => {
    const status = coalition.status || 'draft'
    const texts = {
        draft: 'Forming',
        active: 'Active',
        closed: 'Closed'
    }
    return texts[status] || 'Unknown'
}

const getTypeBadgeClass = (coalition) => {
    return 'bg-mun-gray-100 text-mun-gray-700'
}

const getTypeText = (coalition) => {
    const types = {
        general: 'General',
        regional: 'Regional',
        thematic: 'Thematic',
        bilateral: 'Bilateral'
    }
    return types[coalition.type] || 'General'
}

const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    } catch {
        return 'Unknown'
    }
}

const selectCoalition = (coalition) => {
    if (getJoinStatus(coalition) === 'can-join') {
        selectedCoalition.value = coalition
    }
}

const clearFilters = () => {
    searchQuery.value = ''
    filterType.value = ''
    filterStatus.value = ''
    showOnlyJoinable.value = true
}

const loadCoalitions = async () => {
    try {
        isLoading.value = true

        const response = await apiMethods.coalitions.getAvailableCoalitions({
            includeMembers: true
        })

        if (response.data.success) {
            coalitions.value = response.data.coalitions || []
        }

    } catch (error) {
        toast.error('Load coalitions error:', error)
        toast.error('Failed to load coalitions')
    } finally {
        isLoading.value = false
    }
}

const sendJoinRequest = async () => {
    if (!selectedCoalition.value) return

    try {
        isSubmitting.value = true

        const requestData = {
            coalitionId: selectedCoalition.value._id,
            message: joinMessage.value.trim()
        }

        const response = await apiMethods.coalitions.requestToJoin(requestData)

        if (response.data.success) {
            emit('join-requested', {
                coalition: selectedCoalition.value,
                request: response.data.request
            })

            toast.success(`Join request sent to ${selectedCoalition.value.headCountry}`)
            closeModal()
        }

    } catch (error) {
        toast.error('Send join request error:', error)
        toast.error('Failed to send join request')
    } finally {
        isSubmitting.value = false
    }
}

const closeModal = () => {
    emit('update:modelValue', false)
    resetModal()
}

const resetModal = () => {
    selectedCoalition.value = null
    joinMessage.value = ''
    searchQuery.value = ''
    filterType.value = ''
    filterStatus.value = ''
    showOnlyJoinable.value = true
}

// Lifecycle
onMounted(() => {
    if (props.modelValue) {
        loadCoalitions()
    }
})

// Watch for modal opening
watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        loadCoalitions()
    } else {
        resetModal()
    }
})
</script>

<style scoped>
/* Modal transitions */
.modal-overlay-enter-active,
.modal-overlay-leave-active {
    transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
    opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
    transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* Coalition item animations */
.coalition-item {
    transition: all 0.2s ease;
}

.coalition-item:hover {
    transform: translateY(-1px);
}

/* Member flag animations */
.member-flag {
    animation: flag-appear 0.3s ease-out;
}

@keyframes flag-appear {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Line clamp utility */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Custom scrollbar */
.coalition-list::-webkit-scrollbar {
    width: 6px;
}

.coalition-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.coalition-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.coalition-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Selected coalition highlight */
.coalition-item.border-mun-blue {
    box-shadow: 0 0 0 1px rgba(0, 158, 219, 0.2);
}

/* Status indicators */
.join-status {
    transition: all 0.2s ease;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .join-coalition-modal {
        margin: 1rem;
        max-width: calc(100vw - 2rem);
    }

    .filters {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .grid.grid-cols-3 {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .modal-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .modal-footer .flex.items-center.space-x-3 {
        justify-content: stretch;
        gap: 0.75rem;
    }

    .modal-footer button {
        flex: 1;
    }

    .coalition-item {
        padding: 1rem;
    }

    .members-preview .flex {
        flex-wrap: wrap;
        gap: 0.25rem;
    }
}

/* Loading state */
.coalition-item.loading {
    pointer-events: none;
    opacity: 0.7;
}

/* Empty state animation */
.empty-state {
    animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Search and filter transitions */
.search-controls input,
.search-controls select {
    transition: all 0.2s ease;
}

.search-controls input:focus,
.search-controls select:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 158, 219, 0.15);
}
</style>