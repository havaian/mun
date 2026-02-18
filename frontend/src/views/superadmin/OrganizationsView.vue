<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Organizations</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage all platform organizations</p>
            </div>
            <AppButton @click="showCreateModal = true">
                <PlusIcon class="w-4 h-4 mr-2" />
                New Organization
            </AppButton>
        </div>

        <!-- List -->
        <div class="bg-white rounded-xl border border-mun-gray-200">
            <div v-if="isLoading" class="flex justify-center py-12">
                <LoadingSpinner class="w-8 h-8" />
            </div>

            <div v-else-if="organizations.length === 0" class="text-center py-12 text-mun-gray-500">
                No organizations yet. Create one to get started.
            </div>

            <div v-else class="divide-y divide-mun-gray-100">
                <div v-for="org in organizations" :key="org._id"
                    class="flex items-center justify-between p-4 hover:bg-mun-gray-50 transition-colors">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-mun-blue-100 rounded-xl flex items-center justify-center">
                            <span class="text-lg font-bold text-mun-blue">{{ org.name?.charAt(0) }}</span>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-mun-gray-900">{{ org.name }}</p>
                            <p class="text-xs text-mun-gray-500">{{ org.slug }} · Admin: {{ org.admin?.email || 'Not assigned' }}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span :class="[
                            'px-2 py-1 text-xs font-medium rounded-full',
                            org.status === 'active' ? 'bg-green-100 text-green-700' :
                                org.status === 'suspended' ? 'bg-red-100 text-red-700' :
                                    'bg-mun-gray-100 text-mun-gray-600'
                        ]">
                            {{ org.status }}
                        </span>
                        <AppButton variant="ghost" size="sm" @click="editOrg(org)">
                            <PencilIcon class="w-4 h-4" />
                        </AppButton>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.pages > 1" class="flex items-center justify-between p-4 border-t border-mun-gray-100">
                <p class="text-sm text-mun-gray-500">
                    Showing {{ organizations.length }} of {{ pagination.total }}
                </p>
                <div class="flex space-x-2">
                    <AppButton variant="ghost" size="sm" :disabled="pagination.page <= 1"
                        @click="loadOrgs(pagination.page - 1)">Previous</AppButton>
                    <AppButton variant="ghost" size="sm" :disabled="pagination.page >= pagination.pages"
                        @click="loadOrgs(pagination.page + 1)">Next</AppButton>
                </div>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="showCreateModal || !!editingOrg" @close="closeModal">
            <template #title>{{ editingOrg ? 'Edit Organization' : 'Create Organization' }}</template>
            <template #default>
                <form @submit.prevent="handleSave" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Name</label>
                        <input v-model="formData.name" type="text" required class="input-field"
                            placeholder="Organization name" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                        <textarea v-model="formData.description" rows="3" class="input-field"
                            placeholder="Brief description"></textarea>
                    </div>
                    <div v-if="!editingOrg">
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Admin Email</label>
                        <input v-model="formData.adminEmail" type="email" class="input-field"
                            placeholder="admin@example.com (optional — assign later)" />
                    </div>
                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" type="button" @click="closeModal">Cancel</AppButton>
                        <AppButton type="submit" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : (editingOrg ? 'Update' : 'Create') }}
                        </AppButton>
                    </div>
                </form>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import { PlusIcon, PencilIcon } from '@heroicons/vue/24/outline'

const toast = useToast()

const isLoading = ref(true)
const isSaving = ref(false)
const organizations = ref([])
const pagination = reactive({ page: 1, total: 0, pages: 1 })
const showCreateModal = ref(false)
const editingOrg = ref(null)

const formData = reactive({
    name: '',
    description: '',
    adminEmail: '',
})

const loadOrgs = async (page = 1) => {
    isLoading.value = true
    try {
        const response = await apiMethods.organizations.getAll({ page, limit: 20 })
        if (response.data.success) {
            organizations.value = response.data.organizations || []
            Object.assign(pagination, response.data.pagination || { page: 1, total: 0, pages: 1 })
        }
    } catch (e) {
        console.error('Failed to load organizations:', e)
    } finally {
        isLoading.value = false
    }
}

const editOrg = (org) => {
    editingOrg.value = org
    formData.name = org.name
    formData.description = org.description || ''
    formData.adminEmail = ''
}

const closeModal = () => {
    showCreateModal.value = false
    editingOrg.value = null
    formData.name = ''
    formData.description = ''
    formData.adminEmail = ''
}

const handleSave = async () => {
    isSaving.value = true
    try {
        if (editingOrg.value) {
            await apiMethods.organizations.update(editingOrg.value._id, {
                name: formData.name,
                description: formData.description,
            })
            toast.success('Organization updated')
        } else {
            const payload = {
                name: formData.name,
                description: formData.description,
            }
            if (formData.adminEmail) payload.adminEmail = formData.adminEmail

            await apiMethods.organizations.create(payload)
            toast.success('Organization created')
        }
        closeModal()
        await loadOrgs(pagination.page)
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save organization')
    } finally {
        isSaving.value = false
    }
}

onMounted(() => loadOrgs())
</script>