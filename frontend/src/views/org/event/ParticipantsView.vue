<template>
    <div class="p-6 lg:p-8 space-y-6">
        <div class="page-header p-6">
            <div>
                <div class="flex items-center space-x-3 mb-1">
                    <router-link
                        :to="{ name: 'OrgEventDetail', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="text-sm text-mun-gray-400 hover:text-mun-gray-600">← Back to Event</router-link>
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Participants</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage event participants and their roles</p>
            </div>
            <AppButton v-if="canManage" @click="showAddModal = true">
                <PlusIcon class="w-4 h-4 mr-2" />
                Add Participant
            </AppButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <div v-else-if="participants.length === 0"
            class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center text-mun-gray-500">
            No participants yet. Add participants directly or accept registration applications.
        </div>

        <div v-else class="bg-white rounded-xl border border-mun-gray-200 divide-y divide-mun-gray-100">
            <div v-for="p in participants" :key="p._id" class="flex items-center justify-between p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-mun-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-xs font-bold text-mun-blue">
                            {{ p.user?.firstName?.charAt(0) }}{{ p.user?.lastName?.charAt(0) }}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-mun-gray-900">
                            {{ p.user?.firstName }} {{ p.user?.lastName }}
                        </p>
                        <p class="text-xs text-mun-gray-500">
                            {{ p.role }} <span v-if="p.country?.name">· {{ p.country.name }}</span>
                        </p>
                    </div>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-mun-blue-50 text-mun-blue-700">
                    {{ p.role }}
                </span>
            </div>
        </div>

        <!-- TODO: Add participant modal -->
        <ModalWrapper :show="showAddModal" @close="showAddModal = false">
            <template #title>Add Participant</template>
            <template #default>
                <p class="text-sm text-mun-gray-500">Add participant form — coming soon.</p>
                <div class="flex justify-end pt-4">
                    <AppButton variant="ghost" @click="showAddModal = false">Close</AppButton>
                </div>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { PlusIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()

const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)
const canManage = computed(() => authStore.isOrgAdmin || authStore.hasOrgPermission('manage_event_content'))

const isLoading = ref(true)
const participants = ref([])
const showAddModal = ref(false)

onMounted(async () => {
    if (!orgId.value) return
    try {
        // First get event by slug to get the ID
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (eventRes.data.success) {
            const eventId = eventRes.data.event._id
            const res = await apiMethods.participants.getAll(orgId.value, eventId)
            if (res.data.success) participants.value = res.data.participants || []
        }
    } catch (e) {
        console.error('Failed to load participants:', e)
    } finally {
        isLoading.value = false
    }
})
</script>