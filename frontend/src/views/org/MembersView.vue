<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Members</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage organization members and invitations</p>
            </div>
            <AppButton v-if="canManageMembers" @click="showInviteModal = true">
                <PlusIcon class="w-4 h-4 mr-2" />
                Invite Member
            </AppButton>
        </div>

        <!-- Tabs -->
        <div class="flex space-x-1 bg-white rounded-xl border border-mun-gray-200 p-1 w-fit">
            <button @click="activeTab = 'members'"
                :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', activeTab === 'members' ? 'bg-mun-blue text-white' : 'text-mun-gray-600 hover:bg-mun-gray-50']">
                Members ({{ members.length }})
            </button>
            <button @click="activeTab = 'invitations'"
                :class="['px-4 py-2 text-sm font-medium rounded-lg transition-colors', activeTab === 'invitations' ? 'bg-mun-blue text-white' : 'text-mun-gray-600 hover:bg-mun-gray-50']">
                Pending Invitations ({{ invitations.length }})
            </button>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <!-- Members tab -->
        <div v-else-if="activeTab === 'members'" class="bg-white rounded-xl border border-mun-gray-200">
            <div v-if="members.length === 0" class="text-center py-12 text-mun-gray-500">
                No members yet. Invite someone to get started.
            </div>
            <div v-else class="divide-y divide-mun-gray-100">
                <div v-for="member in members" :key="member._id" class="flex items-center justify-between p-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-mun-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-sm font-bold text-mun-blue">
                                {{ member.user?.firstName?.charAt(0) }}{{ member.user?.lastName?.charAt(0) }}
                            </span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-mun-gray-900">
                                {{ member.user?.firstName }} {{ member.user?.lastName }}
                            </p>
                            <p class="text-xs text-mun-gray-500">{{ member.user?.email }}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="flex flex-wrap gap-1">
                            <span v-for="perm in member.permissions" :key="perm"
                                class="px-2 py-0.5 text-xs font-medium rounded bg-mun-blue-50 text-mun-blue-700">
                                {{ formatPermission(perm) }}
                            </span>
                        </div>
                        <AppButton v-if="canManageMembers" variant="ghost" size="sm" @click="openEditMember(member)">
                            <PencilIcon class="w-4 h-4" />
                        </AppButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invitations tab -->
        <div v-else class="bg-white rounded-xl border border-mun-gray-200">
            <div v-if="invitations.length === 0" class="text-center py-12 text-mun-gray-500">
                No pending invitations.
            </div>
            <div v-else class="divide-y divide-mun-gray-100">
                <div v-for="inv in invitations" :key="inv._id" class="flex items-center justify-between p-4">
                    <div>
                        <p class="text-sm font-medium text-mun-gray-900">{{ inv.email }}</p>
                        <p class="text-xs text-mun-gray-500">Invited {{ formatDate(inv.createdAt) }}</p>
                    </div>
                    <AppButton v-if="canManageMembers" variant="ghost" size="sm" @click="cancelInvitation(inv._id)"
                        class="text-red-500 hover:text-red-700">
                        Cancel
                    </AppButton>
                </div>
            </div>
        </div>

        <!-- Invite Modal -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="showInviteModal" @close="showInviteModal = false">
            <template #title>Invite Member</template>
            <template #default>
                <form @submit.prevent="handleInvite" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Email Address</label>
                        <input v-model="inviteForm.email" type="email" required class="input-field"
                            placeholder="member@example.com" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-2">Permissions</label>
                        <div class="space-y-2">
                            <label v-for="perm in availablePermissions" :key="perm"
                                class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" v-model="inviteForm.permissions" :value="perm"
                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                <span class="text-sm text-mun-gray-700">{{ formatPermission(perm) }}</span>
                            </label>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" type="button" @click="showInviteModal = false">Cancel</AppButton>
                        <AppButton type="submit" :disabled="isSaving">
                            {{ isSaving ? 'Inviting...' : 'Send Invitation' }}
                        </AppButton>
                    </div>
                </form>
            </template>
        </ModalWrapper>

        <!-- Edit Member Permissions Modal -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="!!editingMember" @close="editingMember = null">
            <template #title>Edit Permissions</template>
            <template #default>
                <form @submit.prevent="handleUpdatePermissions" class="space-y-4">
                    <p class="text-sm text-mun-gray-600">
                        {{ editingMember?.user?.firstName }} {{ editingMember?.user?.lastName }}
                    </p>
                    <div class="space-y-2">
                        <label v-for="perm in availablePermissions" :key="perm"
                            class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" v-model="editPermissions" :value="perm"
                                class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                            <span class="text-sm text-mun-gray-700">{{ formatPermission(perm) }}</span>
                        </label>
                    </div>
                    <div class="flex justify-between pt-2">
                        <AppButton variant="ghost" size="sm" class="text-red-500 hover:text-red-700"
                            @click="removeMember">Remove Member</AppButton>
                        <div class="flex space-x-3">
                            <AppButton variant="ghost" type="button" @click="editingMember = null">Cancel</AppButton>
                            <AppButton type="submit" :disabled="isSaving">Save</AppButton>
                        </div>
                    </div>
                </form>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { PlusIcon, PencilIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => authStore.activeOrganization?._id)
const canManageMembers = computed(() => authStore.isOrgAdmin || authStore.hasOrgPermission('manage_members'))

const isLoading = ref(true)
const isSaving = ref(false)
const members = ref([])
const invitations = ref([])
const activeTab = ref('members')
const showInviteModal = ref(false)
const editingMember = ref(null)
const editPermissions = ref([])

const availablePermissions = [
    'manage_members', 'manage_content', 'manage_event_content', 'manage_registration', 'review_applicants'
]

const inviteForm = reactive({ email: '', permissions: [] })

const loadData = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const [membersRes, invRes] = await Promise.all([
            apiMethods.orgMembers.getAll(orgId.value),
            apiMethods.orgMembers.getInvitations(orgId.value).catch(() => ({ data: { invitations: [] } })),
        ])
        if (membersRes.data.success) members.value = membersRes.data.members || []
        invitations.value = invRes.data?.invitations || []
    } catch (e) {
        console.error('Failed to load members:', e)
    } finally {
        isLoading.value = false
    }
}

const handleInvite = async () => {
    isSaving.value = true
    try {
        await apiMethods.orgMembers.invite(orgId.value, inviteForm)
        toast.success('Invitation sent')
        showInviteModal.value = false
        inviteForm.email = ''
        inviteForm.permissions = []
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to send invitation')
    } finally {
        isSaving.value = false
    }
}

const openEditMember = (member) => {
    editingMember.value = member
    editPermissions.value = [...(member.permissions || [])]
}

const handleUpdatePermissions = async () => {
    isSaving.value = true
    try {
        await apiMethods.orgMembers.updatePermissions(orgId.value, editingMember.value._id, {
            permissions: editPermissions.value
        })
        toast.success('Permissions updated')
        editingMember.value = null
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to update permissions')
    } finally {
        isSaving.value = false
    }
}

const removeMember = async () => {
    if (!confirm('Remove this member from the organization?')) return
    isSaving.value = true
    try {
        await apiMethods.orgMembers.remove(orgId.value, editingMember.value._id)
        toast.success('Member removed')
        editingMember.value = null
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to remove member')
    } finally {
        isSaving.value = false
    }
}

const cancelInvitation = async (id) => {
    try {
        await apiMethods.orgMembers.cancelInvitation(orgId.value, id)
        toast.success('Invitation cancelled')
        await loadData()
    } catch (e) {
        toast.error('Failed to cancel invitation')
    }
}

const formatPermission = (p) => p?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

onMounted(() => loadData())
</script>