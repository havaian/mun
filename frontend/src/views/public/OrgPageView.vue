<template>
    <div class="min-h-screen bg-white">
        <!-- Loading -->
        <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="min-h-screen flex items-center justify-center px-6">
            <div class="text-center max-w-md">
                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">Organization Not Found</h1>
                <p class="text-mun-gray-500">{{ error }}</p>
            </div>
        </div>

        <template v-else-if="org">
            <!-- MUN.UZ top bar -->
            <MunBrand variant="top" />

            <!-- Hero — with optional background image -->
            <section class="relative overflow-hidden">
                <div v-if="org.heroImage" class="absolute inset-0">
                    <img :src="mediaUrl(org.heroImage)" alt="" class="w-full h-full object-cover" />
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-mun-blue-900/55 via-mun-blue-800/45 to-mun-blue-950/55">
                    </div>
                </div>
                <div v-else
                    class="absolute inset-0 bg-gradient-to-br from-mun-blue-900 via-mun-blue-800 to-mun-blue-950"></div>

                <!-- Decorative -->
                <div class="absolute inset-0 overflow-hidden pointer-events-none">
                    <div class="absolute inset-0 opacity-[0.04]"
                        style="background-image: linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px); background-size: 60px 60px;">
                    </div>
                    <div class="absolute -top-32 -right-32 w-96 h-96 bg-mun-blue-400/20 rounded-full blur-3xl"></div>
                    <div class="absolute -bottom-48 -left-24 w-80 h-80 bg-mun-blue-300/15 rounded-full blur-3xl"></div>
                    <div
                        class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent">
                    </div>
                </div>

                <div class="relative max-w-5xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
                    <div class="flex flex-col sm:flex-row items-start gap-6">
                        <!-- Logo -->
                        <div v-if="org.logo"
                            class="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl flex-shrink-0">
                            <img :src="mediaUrl(org.logo)" :alt="org.name" class="w-full h-full object-cover" />
                        </div>
                        <div v-else
                            class="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                            <span class="text-2xl font-bold text-white/80">{{ orgInitials }}</span>
                        </div>

                        <div class="flex-1">
                            <h1
                                class="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                                {{ org.name }}
                            </h1>

                            <!-- Quick info pills -->
                            <div class="flex flex-wrap items-center gap-5 mt-2">
                                <div v-if="org.foundingDate" class="flex items-center gap-2 text-white/60">
                                    <CalendarIcon class="w-4 h-4" />
                                    <span class="text-sm">Founded {{ new Date(org.foundingDate).getFullYear() }}</span>
                                </div>
                                <div v-if="org.location?.city" class="flex items-center gap-2 text-white/60">
                                    <MapPinIcon class="w-4 h-4" />
                                    <span class="text-sm">{{ [org.location.city,
                                        org.location.country].filter(Boolean).join(', ') }}</span>
                                </div>
                                <a v-if="org.website" :href="org.website" target="_blank"
                                    class="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                                    <GlobeAltIcon class="w-4 h-4" />
                                    <span class="text-sm">Website</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Main content: two-column with sticky sidebar -->
            <div class="max-w-5xl mx-auto px-6 py-12 lg:py-16">
                <div class="flex flex-col lg:flex-row gap-10 lg:gap-14">

                    <!-- LEFT: Main content -->
                    <div class="flex-1 min-w-0">
                        <!-- About / Description -->
                        <div v-if="org.description">
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-6">About</h2>
                            <RichTextContent v-if="isHtml(org.description)" :content="org.description" />
                            <p v-else class="text-mun-gray-600 leading-relaxed whitespace-pre-line">{{ org.description
                                }}</p>
                        </div>

                        <!-- Photos with lightbox -->
                        <div v-if="org.photos?.length" :class="org.description ? 'mt-12' : ''">
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-6">Gallery</h2>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <button v-for="(photo, i) in org.photos" :key="i" @click="lightboxIndex = i"
                                    class="aspect-[4/3] rounded-xl overflow-hidden bg-mun-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mun-blue focus:ring-offset-2">
                                    <img :src="mediaUrl(photo)" alt="" class="w-full h-full object-cover" />
                                </button>
                            </div>
                        </div>

                        <!-- Events -->
                        <div class="mt-12">
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-8">Events</h2>

                            <div v-if="events.length === 0" class="text-center py-12 text-mun-gray-400">
                                No published events yet.
                            </div>

                            <div v-else class="grid gap-4">
                                <router-link v-for="ev in events" :key="ev._id"
                                    :to="{ name: 'PublicEvent', params: { orgSlug: $route.params.orgSlug, eventSlug: ev.slug } }"
                                    class="group flex items-center gap-5 bg-white rounded-xl border border-mun-gray-200 p-5 hover:border-mun-blue-200 hover:shadow-md transition-all">
                                    <div v-if="ev.logo"
                                        class="w-14 h-14 rounded-xl overflow-hidden bg-mun-gray-50 flex-shrink-0">
                                        <img :src="mediaUrl(ev.logo)" :alt="ev.name"
                                            class="w-full h-full object-cover" />
                                    </div>
                                    <div v-else
                                        class="w-14 h-14 rounded-xl bg-mun-blue-50 flex items-center justify-center flex-shrink-0">
                                        <CalendarIcon class="w-6 h-6 text-mun-blue-300" />
                                    </div>

                                    <div class="flex-1 min-w-0">
                                        <h3
                                            class="text-lg font-semibold text-mun-gray-900 group-hover:text-mun-blue transition-colors truncate">
                                            {{ ev.name }}
                                        </h3>
                                        <p v-if="ev.description" class="text-sm text-mun-gray-500 mt-0.5 line-clamp-1">
                                            {{ stripHtml(ev.description) }}
                                        </p>
                                        <div class="flex items-center gap-4 mt-2">
                                            <span v-if="ev.startDate" class="text-xs text-mun-gray-400">
                                                {{ formatDate(ev.startDate) }}
                                            </span>
                                            <span :class="eventStatusClass(ev.status)"
                                                class="text-xs font-medium px-2 py-0.5 rounded-full">
                                                {{ ev.status?.replace(/_/g, ' ') }}
                                            </span>
                                        </div>
                                    </div>

                                    <ArrowRightIcon
                                        class="w-5 h-5 text-mun-gray-300 group-hover:text-mun-blue transition-colors flex-shrink-0" />
                                </router-link>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT: Sticky sidebar -->
                    <aside class="lg:w-72 flex-shrink-0">
                        <div class="lg:sticky lg:top-8 space-y-6">
                            <!-- Quick info card -->
                            <div class="bg-mun-gray-50 rounded-2xl border border-mun-gray-200 p-5 space-y-4">
                                <div v-if="org.foundingDate" class="flex items-start gap-3">
                                    <CalendarIcon class="w-5 h-5 text-mun-blue mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs text-mun-gray-400 uppercase tracking-wider font-medium">
                                            Founded</p>
                                        <p class="text-sm font-semibold text-mun-gray-900 mt-0.5">{{ new
                                            Date(org.foundingDate).getFullYear() }}</p>
                                    </div>
                                </div>
                                <div v-if="org.location?.city" class="flex items-start gap-3">
                                    <MapPinIcon class="w-5 h-5 text-mun-blue mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs text-mun-gray-400 uppercase tracking-wider font-medium">
                                            Location</p>
                                        <p class="text-sm font-semibold text-mun-gray-900 mt-0.5">{{ [org.location.city,
                                            org.location.country].filter(Boolean).join(', ') }}</p>
                                    </div>
                                </div>
                                <a v-if="org.mapUrl" :href="org.mapUrl" target="_blank"
                                    class="flex items-center gap-2 px-3 py-2 bg-white border border-mun-gray-200 rounded-xl text-sm text-mun-gray-700 hover:border-mun-blue-200 hover:text-mun-blue transition-colors w-full">
                                    <MapPinIcon class="w-4 h-4" />
                                    View on map
                                </a>
                            </div>

                            <!-- Contact card -->
                            <div v-if="hasContactInfo"
                                class="bg-mun-gray-50 rounded-2xl border border-mun-gray-200 p-5 space-y-3">
                                <p class="text-xs text-mun-gray-400 uppercase tracking-wider font-medium mb-2">Contact
                                </p>
                                <a v-if="org.email" :href="'mailto:' + org.email"
                                    class="flex items-center gap-2.5 text-sm text-mun-gray-600 hover:text-mun-blue transition-colors">
                                    <EnvelopeIcon class="w-4 h-4 flex-shrink-0" />
                                    <span class="truncate">{{ org.email }}</span>
                                </a>
                                <a v-if="org.phone" :href="'tel:' + org.phone"
                                    class="flex items-center gap-2.5 text-sm text-mun-gray-600 hover:text-mun-blue transition-colors">
                                    <PhoneIcon class="w-4 h-4 flex-shrink-0" />
                                    {{ org.phone }}
                                </a>
                                <a v-if="org.website" :href="org.website" target="_blank"
                                    class="flex items-center gap-2.5 text-sm text-mun-gray-600 hover:text-mun-blue transition-colors">
                                    <GlobeAltIcon class="w-4 h-4 flex-shrink-0" />
                                    <span class="truncate">{{ org.website.replace(/^https?:\/\//, '') }}</span>
                                </a>
                                <div v-if="org.address" class="flex items-center gap-2.5 text-sm text-mun-gray-600">
                                    <BuildingOfficeIcon class="w-4 h-4 flex-shrink-0" />
                                    <span>{{ org.address }}</span>
                                </div>
                            </div>

                            <!-- Social links -->
                            <div v-if="Object.keys(activeSocials).length" class="flex flex-wrap gap-2.5">
                                <a v-for="(url, platform) in activeSocials" :key="platform" :href="url" target="_blank"
                                    class="w-9 h-9 rounded-lg bg-mun-gray-100 hover:bg-mun-blue hover:text-white flex items-center justify-center text-mun-gray-500 transition-colors">
                                    <SocialIcon :name="platform" class="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <!-- Footer -->
            <MunBrand variant="footer" :left-text="org.name" />
        </template>

        <!-- Lightbox -->
        <PhotoLightbox v-model="lightboxIndex" :photos="lightboxPhotos" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiMethods } from '@/utils/api'
import {
    CalendarIcon, MapPinIcon, GlobeAltIcon, ArrowRightIcon,
    EnvelopeIcon, PhoneIcon, BuildingOfficeIcon
} from '@heroicons/vue/24/outline'
import SocialIcon from '@/components/ui/SocialIcon.vue'
import PhotoLightbox from '@/components/ui/PhotoLightbox.vue'
import MunBrand from '@/components/ui/MunBrand.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'

const route = useRoute()

const isLoading = ref(true)
const error = ref(null)
const org = ref(null)
const events = ref([])
const lightboxIndex = ref(null)

const orgInitials = computed(() => {
    if (!org.value?.name) return ''
    return org.value.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
})

const hasContactInfo = computed(() => {
    return org.value?.email || org.value?.phone || org.value?.address || org.value?.website
})

const activeSocials = computed(() => {
    if (!org.value?.socialLinks) return {}
    const active = {}
    Object.entries(org.value.socialLinks).forEach(([k, v]) => {
        if (v) active[k] = v
    })
    return active
})

const lightboxPhotos = computed(() => (org.value?.photos || []).map(p => mediaUrl(p)))

const mediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}${path}`
}

const isHtml = (text) => /<[a-z][\s\S]*>/i.test(text)
const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '').substring(0, 200) : ''

const loadOrg = async () => {
    isLoading.value = true
    try {
        const res = await apiMethods.public.getOrg(route.params.orgSlug)
        if (res.data.success) {
            org.value = res.data.organization
            events.value = res.data.events || []
        }
    } catch (e) {
        error.value = e.response?.status === 404
            ? 'This organization does not exist or is not publicly available.'
            : 'Something went wrong.'
    } finally {
        isLoading.value = false
    }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const eventStatusClass = (s) => {
    const map = {
        registration_open: 'bg-green-100 text-green-700',
        active: 'bg-mun-blue-100 text-mun-blue-700',
        registration_closed: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-mun-gray-100 text-mun-gray-600',
        published: 'bg-blue-100 text-blue-700',
    }
    return map[s] || 'bg-mun-gray-100 text-mun-gray-600'
}

onMounted(() => loadOrg())
</script>