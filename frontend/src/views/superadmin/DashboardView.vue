<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Platform Administration</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage organizations and platform settings</p>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6">
                <p class="text-sm font-medium text-mun-gray-500">Total Organizations</p>
                <p class="text-3xl font-bold text-mun-gray-900 mt-1">{{ stats.totalOrganizations }}</p>
            </div>
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6">
                <p class="text-sm font-medium text-mun-gray-500">Active Organizations</p>
                <p class="text-3xl font-bold text-mun-blue mt-1">{{ stats.activeOrganizations }}</p>
            </div>
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6">
                <p class="text-sm font-medium text-mun-gray-500">Total Users</p>
                <p class="text-3xl font-bold text-mun-gray-900 mt-1">{{ stats.totalUsers }}</p>
            </div>
        </div>

        <!-- Recent Organizations -->
        <div class="bg-white rounded-xl border border-mun-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-mun-gray-900">Recent Organizations</h2>
                <router-link :to="{ name: 'SuperAdminOrganizations' }"
                    class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                    View all
                </router-link>
            </div>

            <div v-if="isLoading" class="flex justify-center py-8">
                <LoadingSpinner class="w-8 h-8" />
            </div>

            <div v-else-if="recentOrgs.length === 0" class="text-center py-8 text-mun-gray-500">
                No organizations yet.
            </div>

            <div v-else class="divide-y divide-mun-gray-100">
                <div v-for="org in recentOrgs" :key="org._id" class="flex items-center justify-between py-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-mun-blue-100 rounded-lg flex items-center justify-center">
                            <span class="text-sm font-bold text-mun-blue">{{ org.name?.charAt(0) }}</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-mun-gray-900">{{ org.name }}</p>
                            <p class="text-xs text-mun-gray-500">{{ org.slug }}</p>
                        </div>
                    </div>
                    <span :class="[
                        'px-2 py-1 text-xs font-medium rounded-full',
                        org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-mun-gray-100 text-mun-gray-600'
                    ]">
                        {{ org.status }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { apiMethods } from '@/utils/api'

const isLoading = ref(true)
const recentOrgs = ref([])

const stats = reactive({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
})

onMounted(async () => {
    try {
        const response = await apiMethods.organizations.getAll({ limit: 5, sort: '-createdAt' })
        if (response.data.success) {
            recentOrgs.value = response.data.organizations || []
            stats.totalOrganizations = response.data.pagination?.total || recentOrgs.value.length
            stats.activeOrganizations = recentOrgs.value.filter(o => o.status === 'active').length
        }
    } catch (e) {
        console.error('Failed to load dashboard:', e)
    } finally {
        isLoading.value = false
    }
})
</script>   