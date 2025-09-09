<template>
    <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Coalitions</h1>
                <p class="text-mun-gray-600">Join or create coalitions to work on resolutions</p>
            </div>
            <button @click="showCreateModal = true" class="btn-un-primary">
                <PlusIcon class="w-5 h-5 mr-2" />
                Create Coalition
            </button>
        </div>

        <!-- Coalition Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-un-blue/10">
                        <UserGroupIcon class="w-6 h-6 text-un-blue" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">My Coalitions</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.myCoalitions }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-green-500/10">
                        <DocumentTextIcon class="w-6 h-6 text-mun-green-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Resolutions</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.resolutions }}</p>
                    </div>
                </div>
            </div>

            <div class="mun-card p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-lg bg-mun-yellow-500/10">
                        <InboxIcon class="w-6 h-6 text-mun-yellow-500" />
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-mun-gray-600">Invitations</p>
                        <p class="text-2xl font-bold text-mun-gray-900">{{ stats.invitations }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pending Invitations -->
        <div v-if="pendingInvitations.length > 0" class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">Pending Invitations</h2>
            <div class="space-y-3">
                <div v-for="invitation in pendingInvitations" :key="invitation.id"
                    class="flex items-center justify-between p-4 bg-mun-yellow-50 border border-mun-yellow-200 rounded-lg">
                    <div>
                        <h3 class="font-medium text-mun-gray-900">{{ invitation.coalitionName }}</h3>
                        <p class="text-sm text-mun-gray-600">
                            Invited by {{ invitation.invitedBy }} • {{ invitation.memberCount }} members
                        </p>
                        <p class="text-sm text-mun-gray-500">{{ invitation.description }}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button @click="acceptInvitation(invitation)" class="btn-un-primary px-3 py-2">
                            Accept
                        </button>
                        <button @click="declineInvitation(invitation)" class="btn-un-secondary px-3 py-2">
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- My Coalitions -->
        <div class="mun-card p-6">
            <h2 class="text-lg font-semibold text-mun-gray-900 mb-4">My Coalitions</h2>
            <div v-if="myCoalitions.length === 0" class="text-center py-8">
                <UserGroupIcon class="mx-auto h-12 w-12 text-mun-gray-300" />
                <h3 class="mt-4 text-lg font-medium text-mun-gray-900">No Coalitions Yet</h3>
                <p class="mt-2 text-mun-gray-600 mb-4">Create or join a coalition to start collaborating</p>
                <button @click="showCreateModal = true" class="btn-un-primary">
                    Create Your First Coalition
                </button>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div v-for="coalition in myCoalitions" :key="coalition.id"
                    class="border border-mun-gray-200 rounded-lg p-6 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-medium text-mun-gray-900">{{ coalition.name }}</h3>
                            <p class="text-sm text-mun-gray-600">{{ coalition.description }}</p>
                        </div>
                        <span :class="[
                            'px-2 py-1 rounded text-xs font-medium',
                            coalition.isHead ? 'bg-un-blue/10 text-un-blue' : 'bg-mun-gray-100 text-mun-gray-600'
                        ]">
                            {{ coalition.isHead ? 'Head' : 'Member' }}
                        </span>
                    </div>

                    <div class="space-y-3">
                        <div>
                            <p class="text-sm font-medium text-mun-gray-700 mb-2">Members ({{ coalition.members.length
                                }})</p>
                            <div class="flex flex-wrap gap-2">
                                <span v-for="member in coalition.members.slice(0, 4)" :key="member"
                                    class="px-2 py-1 bg-mun-gray-100 text-mun-gray-700 rounded text-xs">
                                    {{ member }}
                                </span>
                                <span v-if="coalition.members.length > 4"
                                    class="px-2 py-1 bg-mun-gray-100 text-mun-gray-500 rounded text-xs">
                                    +{{ coalition.members.length - 4 }}
                                </span>
                            </div>
                        </div>

                        <div v-if="coalition.resolutions.length > 0">
                            <p class="text-sm font-medium text-mun-gray-700 mb-2">Resolutions</p>
                            <div class="space-y-1">
                                <div v-for="resolution in coalition.resolutions" :key="resolution.id"
                                    class="text-sm text-mun-gray-600">
                                    {{ resolution.title }}
                                    <span :class="[
                                        'ml-2 px-1 py-0.5 rounded text-xs',
                                        resolution.status === 'draft' ? 'bg-mun-yellow-100 text-mun-yellow-700' :
                                            resolution.status === 'submitted' ? 'bg-mun-blue-100 text-mun-blue-700' :
                                                'bg-mun-green-100 text-mun-green-700'
                                    ]">
                                        {{ resolution.status }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between pt-3 border-t border-mun-gray-200">
                            <span class="text-xs text-mun-gray-500">
                                Created {{ formatDate(coalition.createdAt) }}
                            </span>
                            <div class="flex items-center space-x-2">
                                <button @click="viewCoalition(coalition)" class="btn-un-secondary px-3 py-1 text-sm">
                                    View Details
                                </button>
                                <button v-if="coalition.isHead" @click="manageCoalition(coalition)"
                                    class="btn-un-primary px-3 py-1 text-sm">
                                    Manage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Available Coalitions -->
        <div class="mun-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-mun-gray-900">Available Coalitions</h2>
                <div class="flex items-center space-x-3">
                    <input v-model="searchQuery" type="text" placeholder="Search coalitions..."
                        class="input-field max-w-xs">
                </div>
            </div>

            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>

            <div v-else class="space-y-4">
                <div v-for="coalition in filteredAvailableCoalitions" :key="coalition.id"
                    class="flex items-center justify-between p-4 border border-mun-gray-200 rounded-lg hover:bg-mun-gray-50 transition-colors">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-medium text-mun-gray-900">{{ coalition.name }}</h3>
                            <span class="px-2 py-1 bg-mun-gray-100 text-mun-gray-600 rounded text-xs">
                                {{ coalition.members.length }} members
                            </span>
                        </div>
                        <p class="text-sm text-mun-gray-600 mb-2">{{ coalition.description }}</p>
                        <p class="text-sm text-mun-gray-500">
                            Led by {{ coalition.head }} • Created {{ formatDate(coalition.createdAt) }}
                        </p>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <button @click="requestToJoin(coalition)" class="btn-un-primary px-4 py-2">
                            Request to Join
                        </button>
                    </div>
                </div>

                <div v-if="filteredAvailableCoalitions.length === 0" class="text-center py-8 text-mun-gray-500">
                    No available coalitions found
                </div>
            </div>
        </div>

        <!-- Create Coalition Modal -->
        <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
                <div class="px-6 py-4 border-b border-mun-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-mun-gray-900">Create Coalition</h2>
                        <button @click="showCreateModal = false" class="text-mun-gray-400 hover:text-mun-gray-600">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <form @submit.prevent="createCoalition" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Coalition Name</label>
                            <input v-model="createForm.name" type="text" required class="input-field"
                                placeholder="e.g., Climate Action Alliance">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Description</label>
                            <textarea v-model="createForm.description" rows="3" required class="input-field"
                                placeholder="Brief description of the coalition's goals and focus"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-2">Initial Members
                                (Optional)</label>
                            <input v-model="createForm.initialMembers" type="text" class="input-field"
                                placeholder="Country names separated by commas">
                            <p class="text-sm text-mun-gray-500 mt-1">
                                You can invite specific countries to join your coalition
                            </p>
                        </div>

                        <div class="flex items-center justify-end space-x-3 pt-4">
                            <button type="button" @click="showCreateModal = false" class="btn-un-secondary">
                                Cancel
                            </button>
                            <button type="submit" :disabled="isCreating" class="btn-un-primary">
                                <span v-if="isCreating">Creating...</span>
                                <span v-else>Create Coalition</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/plugins/toast'

// Icons
import {
    PlusIcon,
    UserGroupIcon,
    DocumentTextIcon,
    InboxIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const isLoading = ref(false)
const isCreating = ref(false)
const showCreateModal = ref(false)
const searchQuery = ref('')

const stats = reactive({
    myCoalitions: 0,
    resolutions: 0,
    invitations: 0
})

const myCoalitions = ref([])
const availableCoalitions = ref([])
const pendingInvitations = ref([])

const createForm = reactive({
    name: '',
    description: '',
    initialMembers: ''
})

// Computed
const filteredAvailableCoalitions = computed(() => {
    if (!searchQuery.value) return availableCoalitions.value

    const query = searchQuery.value.toLowerCase()
    return availableCoalitions.value.filter(coalition =>
        coalition.name.toLowerCase().includes(query) ||
        coalition.description.toLowerCase().includes(query) ||
        coalition.head.toLowerCase().includes(query)
    )
})

// Methods
const loadCoalitionsData = async () => {
    try {
        isLoading.value = true

        // Sample my coalitions
        myCoalitions.value = [
            {
                id: 1,
                name: "Climate Action Alliance",
                description: "Focused on environmental protection and sustainable development",
                isHead: false,
                members: ["France", "Germany", "United Kingdom", "Canada", "Norway"],
                resolutions: [
                    { id: 1, title: "Resolution A/1: Climate Framework", status: "submitted" }
                ],
                createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
                id: 2,
                name: "Nuclear Disarmament Coalition",
                description: "Working towards global nuclear disarmament",
                isHead: true,
                members: ["United States", "Japan", "Australia"],
                resolutions: [
                    { id: 2, title: "Draft Resolution B/1: Nuclear Treaties", status: "draft" }
                ],
                createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
        ]

        // Sample pending invitations
        pendingInvitations.value = [
            {
                id: 1,
                coalitionName: "Economic Development Group",
                invitedBy: "Brazil",
                memberCount: 8,
                description: "Focused on sustainable economic growth in developing nations"
            }
        ]

        // Sample available coalitions
        availableCoalitions.value = [
            {
                id: 3,
                name: "Human Rights Coalition",
                description: "Promoting and protecting human rights globally",
                head: "Sweden",
                members: ["Sweden", "Norway", "Denmark", "Netherlands", "Canada"],
                createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
            },
            {
                id: 4,
                name: "Technology and Innovation Alliance",
                description: "Addressing challenges and opportunities in digital transformation",
                head: "South Korea",
                members: ["South Korea", "Japan", "Singapore", "Estonia"],
                createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
            }
        ]

        // Update stats
        stats.myCoalitions = myCoalitions.value.length
        stats.resolutions = myCoalitions.value.reduce((total, coalition) => total + coalition.resolutions.length, 0)
        stats.invitations = pendingInvitations.value.length

    } catch (error) {
        console.error('Load coalitions error:', error)
        toast.error('Failed to load coalitions data')
    } finally {
        isLoading.value = false
    }
}

const acceptInvitation = async (invitation) => {
    try {
        // Move from pending to my coalitions
        const newCoalition = {
            id: Date.now(),
            name: invitation.coalitionName,
            description: invitation.description,
            isHead: false,
            members: ["United States"], // Add current user
            resolutions: [],
            createdAt: new Date().toISOString()
        }

        myCoalitions.value.push(newCoalition)
        pendingInvitations.value = pendingInvitations.value.filter(inv => inv.id !== invitation.id)

        stats.myCoalitions++
        stats.invitations--

        toast.success(`Joined ${invitation.coalitionName}`)
    } catch (error) {
        console.error('Accept invitation error:', error)
        toast.error('Failed to accept invitation')
    }
}

const declineInvitation = async (invitation) => {
    try {
        pendingInvitations.value = pendingInvitations.value.filter(inv => inv.id !== invitation.id)
        stats.invitations--
        toast.success('Invitation declined')
    } catch (error) {
        console.error('Decline invitation error:', error)
        toast.error('Failed to decline invitation')
    }
}

const requestToJoin = async (coalition) => {
    try {
        toast.success(`Join request sent to ${coalition.name}`)
        // TODO: API call to request joining
    } catch (error) {
        console.error('Request to join error:', error)
        toast.error('Failed to send join request')
    }
}

const createCoalition = async () => {
    try {
        isCreating.value = true

        const newCoalition = {
            id: Date.now(),
            name: createForm.name,
            description: createForm.description,
            isHead: true,
            members: [authStore.user?.countryName || "United States"],
            resolutions: [],
            createdAt: new Date().toISOString()
        }

        myCoalitions.value.push(newCoalition)
        stats.myCoalitions++

        // Reset form
        Object.keys(createForm).forEach(key => {
            createForm[key] = ''
        })
        showCreateModal.value = false

        toast.success('Coalition created successfully')

    } catch (error) {
        console.error('Create coalition error:', error)
        toast.error('Failed to create coalition')
    } finally {
        isCreating.value = false
    }
}

const viewCoalition = (coalition) => {
    toast.info(`Viewing details for ${coalition.name}`)
    // TODO: Open coalition details modal
}

const manageCoalition = (coalition) => {
    toast.info(`Managing ${coalition.name}`)
    // TODO: Open coalition management modal
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
        return 'Today'
    } else if (diffDays === 1) {
        return 'Yesterday'
    } else if (diffDays < 7) {
        return `${diffDays} days ago`
    } else {
        return date.toLocaleDateString()
    }
}

// Lifecycle
onMounted(() => {
    loadCoalitionsData()
})
</script>