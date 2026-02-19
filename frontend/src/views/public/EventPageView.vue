<template>
    <div class="min-h-screen bg-gradient-to-b from-mun-gray-50 to-white">
        <div v-if="isLoading" class="flex justify-center py-24">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <div v-else-if="error" class="max-w-lg mx-auto px-6 py-24 text-center">
            <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">Event Not Found</h1>
            <p class="text-mun-gray-500 mb-6">{{ error }}</p>
            <router-link to="/" class="text-mun-blue hover:text-mun-blue-700 font-medium">← Back to home</router-link>
        </div>

        <template v-else-if="event">
            <!-- Header -->
            <div class="bg-white border-b border-mun-gray-200">
                <div class="max-w-4xl mx-auto px-6 py-12">
                    <p class="text-sm text-mun-blue font-medium mb-2">{{ orgName }}</p>
                    <h1 class="text-3xl lg:text-4xl font-bold text-mun-gray-900 mb-3">{{ event.name }}</h1>
                    <p v-if="event.description" class="text-lg text-mun-gray-600 mb-6">{{ event.description }}</p>

                    <div class="flex flex-wrap items-center gap-4 text-sm text-mun-gray-500">
                        <span v-if="event.startDate" class="flex items-center gap-1.5">
                            <CalendarIcon class="w-4 h-4" />
                            {{ formatDate(event.startDate) }}
                            <template v-if="event.endDate"> — {{ formatDate(event.endDate) }}</template>
                        </span>
                        <span v-if="event.location" class="flex items-center gap-1.5">
                            <MapPinIcon class="w-4 h-4" />
                            {{ event.location }}
                        </span>
                    </div>

                    <!-- Register CTA -->
                    <div v-if="event.status === 'registration_open'" class="mt-8">
                        <router-link
                            :to="{ name: 'PublicRegistration', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                            class="inline-flex items-center px-6 py-3 bg-mun-blue text-white font-semibold rounded-xl hover:bg-mun-blue-600 transition-colors">
                            Apply Now
                        </router-link>
                    </div>
                    <div v-else-if="event.status === 'registration_closed'" class="mt-8">
                        <span
                            class="inline-flex items-center px-4 py-2 bg-mun-gray-100 text-mun-gray-500 font-medium rounded-xl">
                            Registration Closed
                        </span>
                    </div>
                </div>
            </div>

            <!-- Event info -->
            <div class="max-w-4xl mx-auto px-6 py-12 space-y-8">
                <!-- Stats -->
                <div v-if="event.statistics" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5 text-center">
                        <p class="text-2xl font-bold text-mun-gray-900">{{ event.statistics.totalCommittees || 0 }}</p>
                        <p class="text-sm text-mun-gray-500 mt-1">Committees</p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5 text-center">
                        <p class="text-2xl font-bold text-mun-gray-900">{{ event.statistics.totalCountries || 0 }}</p>
                        <p class="text-sm text-mun-gray-500 mt-1">Countries</p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5 text-center">
                        <p class="text-2xl font-bold text-mun-gray-900">{{ event.statistics.totalParticipants || 0 }}
                        </p>
                        <p class="text-sm text-mun-gray-500 mt-1">Participants</p>
                    </div>
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-5 text-center">
                        <p class="text-2xl font-bold text-mun-gray-900">{{ formatStatus(event.status) }}</p>
                        <p class="text-sm text-mun-gray-500 mt-1">Status</p>
                    </div>
                </div>

                <!-- Placeholder for future content -->
                <div class="bg-white rounded-xl border border-mun-gray-200 p-8 text-center text-mun-gray-400">
                    <p class="text-sm">More event details coming soon — committees, schedule, and more.</p>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiMethods } from '@/utils/api'
import { CalendarIcon, MapPinIcon } from '@heroicons/vue/24/outline'

const route = useRoute()

const isLoading = ref(true)
const event = ref(null)
const orgName = ref('')
const error = ref(null)

const loadEvent = async () => {
    isLoading.value = true
    try {
        // Use the public endpoint — getById works with slug and populates org
        const res = await apiMethods.events.getPublic(route.params.orgSlug, route.params.eventSlug)
        if (res.data.success) {
            event.value = res.data.event
            orgName.value = res.data.event.organization?.name || ''
        }
    } catch (e) {
        if (e.response?.status === 404) {
            error.value = 'This event does not exist or is not publicly available.'
        } else {
            error.value = 'Something went wrong loading this event.'
        }
        console.error('Failed to load public event:', e)
    } finally {
        isLoading.value = false
    }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''
const formatStatus = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''

onMounted(() => loadEvent())
</script>