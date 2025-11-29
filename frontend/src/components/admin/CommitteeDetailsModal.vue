<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                @click="closeModal">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] min-h-[400px]" @click.stop>

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between p-6 border-b border-mun-gray-200 bg-gradient-to-r from-mun-blue to-mun-blue-600">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <BuildingOfficeIcon class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">
                                    {{ committee?.name || 'Committee Details' }}
                                </h2>
                                <p class="text-white/80 text-sm flex items-center space-x-2">
                                    <span v-if="committee?.type" class="px-2 py-0.5 bg-white/20 rounded text-xs">
                                        {{ formatCommitteeType(committee.type) }}
                                    </span>
                                    <span v-if="committee?.eventId?.name"
                                        class="px-2 py-0.5 bg-white/20 rounded text-xs">
                                        {{ committee.eventId.name }}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button @click="closeModal"
                            class="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>

                    <!-- Content -->
                    <div class="overflow-y-auto max-h-[80vh]">
                        <div v-if="!committee" class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-mun-blue"></div>
                        </div>

                        <div v-else class="p-6 space-y-8">
                            <!-- Committee Overview -->
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Main Information -->
                                <div class="lg:col-span-2 space-y-6">
                                    <!-- Basic Information -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <InformationCircleIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Committee Information
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Committee
                                                    Name</label>
                                                <p class="text-mun-gray-900 font-medium">{{ committee.name }}</p>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Type</label>
                                                <p class="text-mun-gray-900">{{ formatCommitteeType(committee.type) }}
                                                </p>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Status</label>
                                                <span :class="[
                                                    'w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                    getStatusClasses(committee.status)
                                                ]">
                                                    {{ formatStatus(committee.status) }}
                                                </span>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Working
                                                    Language</label>
                                                <p class="text-mun-gray-900">{{ getLanguageName(committee.language) }}
                                                </p>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Event</label>
                                                <p class="text-mun-gray-900">{{ committee.eventId?.name || 'Not assigned' }}</p>
                                            </div>
                                        </div>

                                        <div class="grid mt-4" v-if="committee.description">
                                            <label class="text-sm font-medium text-mun-gray-600">Description</label>
                                            <p class="text-mun-gray-900 mt-1">{{ committee.description }}</p>
                                        </div>
                                    </div>

                                    <!-- Countries & Participants -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <GlobeAltIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Countries & Participants
                                        </h3>

                                        <div v-if="committee.countries && committee.countries.length > 0"
                                            class="space-y-4">

                                            <!-- Countries Header with Manage Button -->
                                            <div class="flex items-center justify-between">
                                                <div class="text-sm text-mun-gray-600">
                                                    {{ committee.countries.length }} countries assigned
                                                </div>
                                                <AppButton @click="manageCountries" variant="outline" size="sm">
                                                    <PencilIcon class="w-4 h-4 mr-1" />
                                                    Manage Countries
                                                </AppButton>
                                            </div>

                                            <!-- Countries Grid -->
                                            <div class="max-h-60 overflow-y-auto border border-mun-gray-200 rounded-lg">
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                                                    <div v-for="country in committee.countries" :key="country.name"
                                                        class="p-3 bg-mun-gray-50 rounded-lg flex items-center justify-between">
                                                        <div class="flex items-center space-x-3">
                                                            <div class="flex-1">
                                                                <p class="font-medium text-mun-gray-900 text-sm">{{
                                                                    country.name }}</p>
                                                                <div class="flex items-center space-x-2 mt-1">
                                                                    <span v-if="country.isPermanentMember"
                                                                        class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                                                        Permanent
                                                                    </span>
                                                                    <span v-if="country.hasVetoRight"
                                                                        class="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                                                        Veto
                                                                    </span>
                                                                    <span v-if="country.isObserver"
                                                                        class="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                                                                        Observer
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div :class="[
                                                                'w-3 h-3 rounded-full',
                                                                country.email ? 'bg-green-500' : 'bg-transparent'
                                                            ]" :title="country.email ? 'Registered' : 'Not registered'">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-else class="text-center py-8 text-mun-gray-500">
                                            <GlobeAltIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p>No countries assigned yet</p>
                                            <AppButton @click="manageCountries" variant="outline" size="sm"
                                                class="mt-3">
                                                Add Countries
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Presidium -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <UsersIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Presidium
                                        </h3>

                                        <div v-if="committee.presidium && committee.presidium.length > 0"
                                            class="space-y-3">
                                            <div v-for="member in committee.presidium" :key="member.userId"
                                                class="flex items-center space-x-4 p-4 bg-mun-gray-50 rounded-lg">
                                                <div :class="[
                                                    'w-10 h-10 rounded-full flex items-center justify-center text-white',
                                                    getPresidiumRoleColor(member.role)
                                                ]">
                                                    <UserIcon class="w-5 h-5" />
                                                </div>
                                                <div class="flex-1">
                                                    <h4 class="font-medium text-mun-gray-900">{{
                                                        formatPresidiumRole(member.role) }}</h4>
                                                    <p class="text-sm text-mun-gray-600">{{ member.userId?.username ||
                                                        member.userId || 'User ID: ' + member.userId }}</p>
                                                    <p class="text-xs text-mun-gray-500">Appointed {{
                                                        formatDate(member.appointedAt) }}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-else class="text-center py-8 text-mun-gray-500">
                                            <UsersIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p>No presidium members assigned</p>
                                            <AppButton @click="managePresidium" variant="outline" size="sm"
                                                class="mt-3">
                                                Assign Presidium
                                            </AppButton>
                                        </div>
                                    </div>

                                    <!-- Committee Settings -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <CogIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Committee Settings
                                        </h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Min Coalition
                                                    Size</label>
                                                <p class="text-mun-gray-900">{{ committee.settings?.minCoalitionSize ||
                                                    3 }}</p>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Default Speech
                                                    Time</label>
                                                <p class="text-mun-gray-900">{{
                                                    committee.settings?.speechSettings?.defaultSpeechTime || 90 }}
                                                    seconds</p>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Default
                                                    Majority</label>
                                                <p class="text-mun-gray-900">{{
                                                    formatMajorityType(committee.settings?.votingRules?.defaultMajority)
                                                }}</p>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Allow
                                                    Consensus</label>
                                                <span :class="[
                                                    committee.settings?.votingRules?.allowConsensus ? 'text-green-600' : 'text-red-600'
                                                ]">
                                                    {{ committee.settings?.votingRules?.allowConsensus ? 'Yes' : 'No' }}
                                                </span>
                                            </div>

                                            <div class="grid">
                                                <label class="text-sm font-medium text-mun-gray-600">Speech
                                                    Extensions</label>
                                                <span :class="[
                                                    committee.settings?.speechSettings?.allowExtensions ? 'text-green-600' : 'text-red-600'
                                                ]">
                                                    {{ committee.settings?.speechSettings?.allowExtensions ? 'Allowed' :
                                                        'Not allowed' }}
                                                </span>
                                            </div>

                                            <div class="grid"
                                                v-if="committee.settings?.speechSettings?.allowExtensions">
                                                <label class="text-sm font-medium text-mun-gray-600">Extension
                                                    Time</label>
                                                <p class="text-mun-gray-900">{{
                                                    committee.settings?.speechSettings?.extensionTime || 30 }} seconds
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Document Deadlines -->
                                        <div v-if="committee.settings?.documentDeadlines" class="mt-6">
                                            <h4 class="font-medium text-mun-gray-900 mb-3">Document Deadlines</h4>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div v-if="committee.settings.documentDeadlines.positionPapers">
                                                    <label class="text-xs font-medium text-mun-gray-600">Position
                                                        Papers</label>
                                                    <p class="text-sm text-mun-gray-900">{{
                                                        formatDate(committee.settings.documentDeadlines.positionPapers)
                                                    }}</p>
                                                </div>
                                                <div v-if="committee.settings.documentDeadlines.resolutions">
                                                    <label
                                                        class="text-xs font-medium text-mun-gray-600">Resolutions</label>
                                                    <p class="text-sm text-mun-gray-900">{{
                                                        formatDate(committee.settings.documentDeadlines.resolutions) }}
                                                    </p>
                                                </div>
                                                <div v-if="committee.settings.documentDeadlines.amendments">
                                                    <label
                                                        class="text-xs font-medium text-mun-gray-600">Amendments</label>
                                                    <p class="text-sm text-mun-gray-900">{{
                                                        formatDate(committee.settings.documentDeadlines.amendments) }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Statistics & Actions Sidebar -->
                                <div class="space-y-6">
                                    <!-- Quick Stats -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4 flex items-center">
                                            <ChartBarIcon class="w-5 h-5 mr-2 text-mun-blue" />
                                            Statistics
                                        </h3>

                                        <div class="space-y-4">
                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Countries</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    committee.countries?.length || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Registered Participants</span>
                                                <span class="font-semibold text-mun-gray-900">{{ getRegisteredCount()
                                                }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Sessions</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    committee.statistics?.totalSessions || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Total Votings</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    committee.statistics?.totalVotings || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Resolutions Passed</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    committee.statistics?.resolutionsPassed || 0 }}</span>
                                            </div>

                                            <div class="flex justify-between items-center">
                                                <span class="text-sm text-mun-gray-600">Amendments Passed</span>
                                                <span class="font-semibold text-mun-gray-900">{{
                                                    committee.statistics?.amendmentsPassed || 0 }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quick Actions -->
                                    <div class="mun-card p-6">
                                        <h3 class="text-lg font-semibold text-mun-gray-900 mb-4">Quick Actions</h3>

                                        <div class="space-y-3">
                                            <AppButton @click="editCommittee" variant="primary" size="sm"
                                                class="w-full">
                                                <PencilIcon class="w-4 h-4 mr-2" />
                                                Edit Committee
                                            </AppButton>

                                            <AppButton @click="manageCountries" variant="outline" size="sm"
                                                class="w-full">
                                                <GlobeAltIcon class="w-4 h-4 mr-2" />
                                                Manage Countries
                                            </AppButton>

                                            <AppButton @click="generateQR" variant="outline" size="sm" class="w-full">
                                                <QrCodeIcon class="w-4 h-4 mr-2" />
                                                Generate QR Codes
                                            </AppButton>

                                            <AppButton @click="viewSessions" variant="outline" size="sm" class="w-full">
                                                <ClockIcon class="w-4 h-4 mr-2" />
                                                View Sessions
                                            </AppButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between p-6 border-t border-mun-gray-200 bg-mun-gray-50">
                        <div class="text-sm text-mun-gray-500">
                            Created {{ formatDate(committee?.createdAt) }} • Last updated {{
                                formatDate(committee?.updatedAt) }}
                        </div>

                        <div class="flex space-x-3">
                            <AppButton @click="closeModal" variant="outline">
                                Close
                            </AppButton>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import {
    XMarkIcon,
    BuildingOfficeIcon,
    InformationCircleIcon,
    UsersIcon,
    CogIcon,
    ChartBarIcon,
    PencilIcon,
    ClockIcon,
    UserIcon,
    GlobeAltIcon,
    QrCodeIcon
} from '@heroicons/vue/24/outline'

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

const emit = defineEmits(['update:modelValue', 'edit', 'manage-countries', 'generate-qr', 'view-sessions'])

// Methods
const closeModal = () => {
    emit('update:modelValue', false)
}

const formatCommitteeType = (type) => {
    const typeMap = {
        'GA': 'General Assembly',
        'SC': 'Security Council',
        'other': 'Other Committee'
    }
    return typeMap[type] || type
}

const formatStatus = (status) => {
    const statusMap = {
        'setup': 'Setup',
        'active': 'Active',
        'completed': 'Completed'
    }
    return statusMap[status] || status
}

const getStatusClasses = (status) => {
    const classMap = {
        'setup': 'bg-yellow-100 text-yellow-800',
        'active': 'bg-green-100 text-green-800',
        'completed': 'bg-blue-100 text-blue-800'
    }
    return classMap[status] || 'bg-gray-100 text-gray-800'
}

const getLanguageName = (code) => {
    const languageMap = {
        'english': 'English',
        'russian': 'Russian',
        'uzbek': 'Uzbek'
    }
    return languageMap[code] || code || 'Not set'
}

const formatPresidiumRole = (role) => {
    const roleMap = {
        'chairman': 'Chairman',
        'co-chairman': 'Co-Chairman',
        'expert': 'Expert',
        'secretary': 'Secretary'
    }
    return roleMap[role] || role
}

const getPresidiumRoleColor = (role) => {
    const colorMap = {
        'chairman': 'bg-blue-600',
        'co-chairman': 'bg-green-600',
        'expert': 'bg-purple-600',
        'secretary': 'bg-orange-600'
    }
    return colorMap[role] || 'bg-mun-gray-600'
}

const formatMajorityType = (type) => {
    const typeMap = {
        'simple': 'Simple Majority',
        'qualified': 'Qualified Majority'
    }
    return typeMap[type] || type || 'Simple'
}

const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const getRegisteredCount = () => {
    if (!props.committee?.countries) return 0
    return props.committee.countries.filter(country => country.email).length
}

const editCommittee = () => {
    emit('edit', props.committee)
    closeModal()
}

const manageCountries = () => {
    emit('manage-countries', props.committee)
    closeModal()
}

const generateQR = () => {
    emit('generate-qr', props.committee)
    closeModal()
}

const managePresidium = () => {
    // Could emit a manage-presidium event or redirect to presidium management
    console.log('Manage presidium for', props.committee.name)
}

const viewSessions = () => {
    emit('view-sessions', props.committee)
    closeModal()
}
</script>