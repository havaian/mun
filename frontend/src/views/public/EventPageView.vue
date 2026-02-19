<template>
    <div class="min-h-screen bg-white">
        <!-- Loading -->
        <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="min-h-screen flex items-center justify-center px-6">
            <div class="text-center max-w-md">
                <div class="w-16 h-16 bg-mun-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ExclamationTriangleIcon class="w-8 h-8 text-mun-gray-400" />
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">Event Not Found</h1>
                <p class="text-mun-gray-500 mb-8">{{ error }}</p>
                <router-link to="/"
                    class="inline-flex items-center text-sm font-medium text-mun-blue hover:text-mun-blue-700">
                    <ArrowLeftIcon class="w-4 h-4 mr-1.5" /> Back to home
                </router-link>
            </div>
        </div>

        <!-- Event content -->
        <template v-else-if="event">
            <!-- Hero Section -->
            <section class="relative overflow-hidden">
                <!-- Background -->
                <div class="absolute inset-0 bg-gradient-to-br from-mun-blue-900 via-mun-blue-800 to-mun-blue-950">
                </div>

                <!-- Decorative elements -->
                <div class="absolute inset-0 overflow-hidden pointer-events-none">
                    <!-- Subtle grid pattern -->
                    <div class="absolute inset-0 opacity-[0.04]"
                        style="background-image: linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px); background-size: 60px 60px;">
                    </div>
                    <!-- Gradient orbs -->
                    <div class="absolute -top-32 -right-32 w-96 h-96 bg-mun-blue-400/20 rounded-full blur-3xl"></div>
                    <div class="absolute -bottom-48 -left-24 w-80 h-80 bg-mun-blue-300/15 rounded-full blur-3xl"></div>
                    <div class="absolute top-1/2 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <!-- Decorative line -->
                    <div
                        class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent">
                    </div>
                </div>

                <div class="relative max-w-5xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
                    <!-- Org branding -->
                    <div class="flex items-center gap-4 mb-10">
                        <div v-if="displayLogo"
                            class="w-14 h-14 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex-shrink-0 shadow-lg">
                            <img :src="displayLogo" :alt="orgName" class="w-full h-full object-cover" />
                        </div>
                        <div v-else
                            class="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span class="text-lg font-bold text-white/80">{{ orgInitials }}</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-mun-blue-200 tracking-wide uppercase">{{ orgName }}</p>
                            <p class="text-xs text-white/40 mt-0.5">presents</p>
                        </div>
                    </div>

                    <!-- Event title -->
                    <h1
                        class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
                        {{ event.name }}
                    </h1>

                    <!-- Description -->
                    <p v-if="event.description"
                        class="text-lg sm:text-xl text-mun-blue-100/80 max-w-2xl leading-relaxed mb-10">
                        {{ event.description }}
                    </p>

                    <!-- Meta info -->
                    <div class="flex flex-wrap items-center gap-6 mb-12">
                        <div v-if="event.startDate" class="flex items-center gap-2.5 text-white/70">
                            <div class="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                                <CalendarIcon class="w-4.5 h-4.5 text-mun-blue-200" />
                            </div>
                            <div>
                                <p class="text-xs text-white/40 uppercase tracking-wider">Date</p>
                                <p class="text-sm font-medium text-white">
                                    {{ formatDate(event.startDate) }}
                                    <template v-if="event.endDate && event.endDate !== event.startDate">
                                        — {{ formatDate(event.endDate) }}
                                    </template>
                                </p>
                            </div>
                        </div>
                        <div v-if="event.location" class="flex items-center gap-2.5 text-white/70">
                            <div class="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                                <MapPinIcon class="w-4.5 h-4.5 text-mun-blue-200" />
                            </div>
                            <div>
                                <p class="text-xs text-white/40 uppercase tracking-wider">Location</p>
                                <p class="text-sm font-medium text-white">{{ event.location }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- CTA -->
                    <div class="flex items-center gap-4">
                        <router-link v-if="event.status === 'registration_open'"
                            :to="{ name: 'PublicRegistration', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                            class="inline-flex items-center px-8 py-4 bg-white text-mun-blue-800 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:bg-mun-gray-50 transition-all">
                            Apply Now
                            <ArrowRightIcon class="w-4 h-4 ml-2" />
                        </router-link>
                        <span v-else-if="event.status === 'registration_closed'"
                            class="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white/60 font-medium rounded-xl border border-white/10">
                            Registration Closed
                        </span>
                        <span v-else-if="event.status === 'active'"
                            class="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white/60 font-medium rounded-xl border border-white/10">
                            <span class="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                            Event In Progress
                        </span>
                        <span v-else-if="event.status === 'completed'"
                            class="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white/60 font-medium rounded-xl border border-white/10">
                            Event Completed
                        </span>
                    </div>
                </div>
            </section>

            <!-- Stats bar -->
            <section v-if="hasStats" class="relative z-10 -mt-8">
                <div class="max-w-5xl mx-auto px-6">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div v-if="event.statistics?.totalCommittees"
                            class="bg-white rounded-xl border border-mun-gray-200 shadow-lg p-5 text-center">
                            <p class="text-3xl font-extrabold text-mun-gray-900">{{ event.statistics.totalCommittees }}
                            </p>
                            <p class="text-xs font-medium text-mun-gray-500 mt-1 uppercase tracking-wider">Committees
                            </p>
                        </div>
                        <div v-if="event.statistics?.totalCountries"
                            class="bg-white rounded-xl border border-mun-gray-200 shadow-lg p-5 text-center">
                            <p class="text-3xl font-extrabold text-mun-gray-900">{{ event.statistics.totalCountries }}
                            </p>
                            <p class="text-xs font-medium text-mun-gray-500 mt-1 uppercase tracking-wider">Countries</p>
                        </div>
                        <div v-if="event.statistics?.totalParticipants"
                            class="bg-white rounded-xl border border-mun-gray-200 shadow-lg p-5 text-center">
                            <p class="text-3xl font-extrabold text-mun-gray-900">{{ event.statistics.totalParticipants
                                }}</p>
                            <p class="text-xs font-medium text-mun-gray-500 mt-1 uppercase tracking-wider">Delegates</p>
                        </div>
                        <div v-if="event.statistics?.totalApplications"
                            class="bg-white rounded-xl border border-mun-gray-200 shadow-lg p-5 text-center">
                            <p class="text-3xl font-extrabold text-mun-gray-900">{{ event.statistics.totalApplications
                                }}</p>
                            <p class="text-xs font-medium text-mun-gray-500 mt-1 uppercase tracking-wider">Applications
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Content area -->
            <section class="max-w-5xl mx-auto px-6 py-16 lg:py-24">
                <div class="text-center max-w-2xl mx-auto">
                    <p class="text-mun-gray-400 text-sm">
                        More event details — committees, schedule, and agenda — coming soon.
                    </p>
                </div>
            </section>

            <!-- Footer -->
            <footer class="border-t border-mun-gray-100">
                <div class="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
                    <p class="text-xs text-mun-gray-400">
                        Hosted by <span class="font-medium text-mun-gray-500">{{ orgName }}</span>
                    </p>
                    <p class="text-xs text-mun-gray-300">
                        Powered by MUN.UZ
                    </p>
                </div>
            </footer>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiMethods } from '@/utils/api'
import {
    CalendarIcon, MapPinIcon, ArrowRightIcon, ArrowLeftIcon, ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()

const isLoading = ref(true)
const event = ref(null)
const orgName = ref('')
const orgLogo = ref(null)
const error = ref(null)

const orgInitials = computed(() => {
    if (!orgName.value) return ''
    return orgName.value.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
})

// Event logo takes priority, fall back to org logo
const displayLogo = computed(() => event.value?.logo || orgLogo.value)

const hasStats = computed(() => {
    const s = event.value?.statistics
    return s && (s.totalCommittees || s.totalCountries || s.totalParticipants || s.totalApplications)
})

const loadEvent = async () => {
    isLoading.value = true
    try {
        const res = await apiMethods.events.getPublic(route.params.orgSlug, route.params.eventSlug)
        if (res.data.success) {
            event.value = res.data.event
            orgName.value = res.data.event.organization?.name || ''
            orgLogo.value = res.data.event.organization?.logo || null
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

const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

onMounted(() => loadEvent())
</script>