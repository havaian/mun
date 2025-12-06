<template>
    <ModalWrapper :model-value="modelValue" :title="committee?.name || 'Committee Details'"
        :subtitle="getCommitteeSubtitle()" :icon="BuildingOfficeIcon" size="xl" variant="primary" is-view-only
        content-scrollable cancel-text="Close" :footer-text="getFooterText()" @close="closeModal">
        <template #content>
            <div class="space-y-8">
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

                            <div v-if="committee.countries && committee.countries.length > 0" class="space-y-4">

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
                                <AppButton @click="manageCountries" variant="outline" size="sm" class="mt-3">
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

                            <div v-if="committee.presidium && committee.presidium.length > 0" class="space-y-3">
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
                                <AppButton @click="managePresidium" variant="outline" size="sm" class="mt-3">
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

                                <div class="grid" v-if="committee.settings?.speechSettings?.allowExtensions">
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
                                        <label class="text-xs font-medium text-mun-gray-600">Resolutions</label>
                                        <p class="text-sm text-mun-gray-900">{{
                                            formatDate(committee.settings.documentDeadlines.resolutions) }}
                                        </p>
                                    </div>
                                    <div v-if="committee.settings.documentDeadlines.amendments">
                                        <label class="text-xs font-medium text-mun-gray-600">Amendments</label>
                                        <p class="text-sm text-mun-gray-900">{{
                                            formatDate(committee.settings.documentDeadlines.amendments) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics & Actions Sidebar -->
                    <div class="mt-2 space-y-2">
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
                                <AppButton @click="editCommittee" variant="primary" size="sm" class="w-full">
                                    <PencilIcon class="w-4 h-4 mr-2" />
                                    Edit Committee
                                </AppButton>

                                <AppButton @click="manageCountries" variant="outline" size="sm" class="w-full">
                                    <GlobeAltIcon class="w-4 h-4 mr-2" />
                                    Manage Countries
                                </AppButton>

                                <!-- Login Links button (was Generate QR Codes) -->
                                <AppButton @click="generateLoginLinks" variant="outline" size="sm" class="w-full">
                                    <LinkIcon class="w-4 h-4 mr-2" />
                                    Login Links
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
        </template>

        <template #footer-buttons>
            <AppButton @click="closeModal" variant="outline">
                Close
            </AppButton>
            <!-- You can add quick action buttons here if needed -->
            <AppButton @click="editCommittee" variant="primary" size="sm">
                <PencilIcon class="w-4 h-4 mr-2" />
                Edit Committee
            </AppButton>
        </template>
    </ModalWrapper>
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
    LinkIcon // LinkIcon replaces QrCodeIcon
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

// Updated emit events to use login links instead of QR
const emit = defineEmits(['update:modelValue', 'edit', 'manage-countries', 'generate-login-links', 'view-sessions'])

// Methods
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

const closeModal = () => {
    emit('update:modelValue', false)
}

const editCommittee = () => {
    emit('edit', props.committee)
    closeModal()
}

const manageCountries = () => {
    emit('manage-countries', props.committee)
    closeModal()
}

// Generate login links instead of QR codes
const generateLoginLinks = () => {
    emit('generate-login-links', props.committee)
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

const getCommitteeSubtitle = () => {
    const parts = []
    if (props.committee?.type) {
        parts.push(formatCommitteeType(props.committee.type))
    }
    if (props.committee?.eventId?.name) {
        parts.push(props.committee.eventId.name)
    }
    return parts.join(' • ')
}

const getFooterText = () => {
    if (!props.committee?.createdAt) return ''
    return `Created ${formatDate(props.committee.createdAt)} • Last updated ${formatDate(props.committee.updatedAt)}`
}
</script>