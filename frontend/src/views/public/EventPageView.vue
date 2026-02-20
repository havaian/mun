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
            <!-- MUN.UZ top bar -->
            <MunBrand variant="top" />

            <!-- Hero Section -->
            <section class="relative overflow-hidden">
                <!-- Background: hero image with REDUCED overlay -->
                <div v-if="event.heroImage" class="absolute inset-0">
                    <img :src="mediaUrl(event.heroImage)" alt="" class="w-full h-full object-cover" />
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
                    <!-- Org branding -->
                    <div class="flex items-center gap-4 mb-10">
                        <div v-if="displayLogo"
                            class="w-14 h-14 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex-shrink-0 shadow-lg">
                            <img :src="mediaUrl(displayLogo)" :alt="orgName" class="w-full h-full object-cover" />
                        </div>
                        <div v-else
                            class="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span class="text-lg font-bold text-white/80">{{ orgInitials }}</span>
                        </div>
                        <div>
                            <router-link :to="{ name: 'PublicOrg', params: { orgSlug: $route.params.orgSlug } }"
                                class="text-sm font-medium text-mun-blue-200 tracking-wide uppercase hover:text-white transition-colors">
                                {{ orgName }}
                            </router-link>
                            <p class="text-xs text-white/40 mt-0.5">presents</p>
                        </div>
                    </div>

                    <!-- Event title -->
                    <h1
                        class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-8">
                        {{ event.name }}
                    </h1>

                    <!-- CTA -->
                    <div class="flex items-center gap-4 mb-10">
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

                    <!-- Sponsor logos in hero -->
                    <div v-if="event.sponsors?.length" class="flex flex-wrap items-center gap-3">
                        <span class="text-xs text-white/30 uppercase tracking-wider mr-1">Supported by</span>
                        <a v-for="(sponsor, i) in event.sponsors" :key="i" :href="sponsor.website || undefined"
                            :target="sponsor.website ? '_blank' : undefined"
                            :class="['flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10', sponsor.website ? 'hover:bg-white/20 cursor-pointer' : 'cursor-default']"
                            :title="sponsor.name">
                            <img v-if="sponsor.logo" :src="mediaUrl(sponsor.logo)" :alt="sponsor.name"
                                class="h-5 w-auto object-contain" />
                            <span class="text-xs text-white/70 font-medium">{{ sponsor.name }}</span>
                        </a>
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

            <!-- Main content: two-column with sticky sidebar -->
            <div class="max-w-5xl mx-auto px-6 py-12 lg:py-16">
                <div class="flex flex-col lg:flex-row gap-10 lg:gap-14">

                    <!-- LEFT: Blog / main content -->
                    <div class="flex-1 min-w-0">
                        <!-- Description / About -->
                        <div v-if="event.description">
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-6">About</h2>
                            <RichTextContent v-if="isHtml(event.description)" :content="event.description" />
                            <p v-else class="text-mun-gray-600 leading-relaxed whitespace-pre-line">{{ event.description
                                }}</p>
                        </div>

                        <!-- Photos gallery with lightbox -->
                        <div v-if="event.photos?.length" :class="event.description ? 'mt-12' : ''">
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-6">Gallery</h2>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <button v-for="(photo, i) in event.photos" :key="i" @click="lightboxIndex = i"
                                    class="aspect-[4/3] rounded-xl overflow-hidden bg-mun-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mun-blue focus:ring-offset-2">
                                    <img :src="mediaUrl(photo)" alt="" class="w-full h-full object-cover" />
                                </button>
                            </div>
                        </div>

                        <!-- Sponsors section -->
                        <div v-if="event.sponsors?.length" class="mt-12">
                            <h2 class="text-2xl font-bold text-mun-gray-900 mb-8">Our Sponsors</h2>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                <a v-for="(sponsor, i) in event.sponsors" :key="i" :href="sponsor.website || undefined"
                                    :target="sponsor.website ? '_blank' : undefined" :class="[
                                        'flex flex-col items-center p-5 rounded-2xl border border-mun-gray-200 transition-all',
                                        sponsor.website ? 'hover:border-mun-blue-200 hover:shadow-lg cursor-pointer' : ''
                                    ]">
                                    <div v-if="sponsor.logo"
                                        class="w-16 h-16 rounded-xl overflow-hidden bg-mun-gray-50 mb-3 flex items-center justify-center">
                                        <img :src="mediaUrl(sponsor.logo)" :alt="sponsor.name"
                                            class="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div v-else
                                        class="w-16 h-16 rounded-xl bg-mun-gray-100 flex items-center justify-center mb-3">
                                        <span class="text-lg font-bold text-mun-gray-400">{{ sponsor.name?.charAt(0)
                                            }}</span>
                                    </div>
                                    <p class="text-sm font-semibold text-mun-gray-900 text-center">{{ sponsor.name }}
                                    </p>
                                    <p v-if="sponsor.website" class="text-xs text-mun-blue mt-1">Visit website →</p>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT: Sticky sidebar -->
                    <aside class="lg:w-72 flex-shrink-0">
                        <div class="lg:sticky lg:top-8 space-y-6">
                            <!-- Date & Location card -->
                            <div class="bg-mun-gray-50 rounded-2xl border border-mun-gray-200 p-5 space-y-4">
                                <div v-if="event.startDate" class="flex items-start gap-3">
                                    <CalendarIcon class="w-5 h-5 text-mun-blue mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs text-mun-gray-400 uppercase tracking-wider font-medium">Date
                                        </p>
                                        <p class="text-sm font-semibold text-mun-gray-900 mt-0.5">
                                            {{ formatDate(event.startDate) }}
                                            <template
                                                v-if="event.endDate && formatDate(event.endDate) !== formatDate(event.startDate)">
                                                <br />— {{ formatDate(event.endDate) }}
                                            </template>
                                        </p>
                                    </div>
                                </div>
                                <div v-if="event.location" class="flex items-start gap-3">
                                    <MapPinIcon class="w-5 h-5 text-mun-blue mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p class="text-xs text-mun-gray-400 uppercase tracking-wider font-medium">
                                            Location</p>
                                        <p class="text-sm font-semibold text-mun-gray-900 mt-0.5">{{ event.location }}
                                        </p>
                                    </div>
                                </div>
                                <a v-if="event.mapUrl" :href="event.mapUrl" target="_blank"
                                    class="flex items-center gap-2 px-3 py-2 bg-white border border-mun-gray-200 rounded-xl text-sm text-mun-gray-700 hover:border-mun-blue-200 hover:text-mun-blue transition-colors w-full">
                                    <MapPinIcon class="w-4 h-4" />
                                    View on map
                                </a>
                            </div>

                            <!-- CTA (mobile duplicate / always visible) -->
                            <router-link v-if="event.status === 'registration_open'"
                                :to="{ name: 'PublicRegistration', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                                class="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-mun-blue text-white font-bold rounded-xl shadow-lg shadow-mun-blue/20 hover:bg-mun-blue-600 transition-colors">
                                Apply Now
                                <ArrowRightIcon class="w-4 h-4" />
                            </router-link>

                            <!-- Contact card -->
                            <div v-if="hasOrgContacts"
                                class="bg-mun-gray-50 rounded-2xl border border-mun-gray-200 p-5 space-y-3">
                                <p class="text-xs text-mun-gray-400 uppercase tracking-wider font-medium mb-2">Contact
                                </p>
                                <a v-if="orgData.email" :href="'mailto:' + orgData.email"
                                    class="flex items-center gap-2.5 text-sm text-mun-gray-600 hover:text-mun-blue transition-colors">
                                    <EnvelopeIcon class="w-4 h-4 flex-shrink-0" />
                                    <span class="truncate">{{ orgData.email }}</span>
                                </a>
                                <a v-if="orgData.phone" :href="'tel:' + orgData.phone"
                                    class="flex items-center gap-2.5 text-sm text-mun-gray-600 hover:text-mun-blue transition-colors">
                                    <PhoneIcon class="w-4 h-4 flex-shrink-0" />
                                    {{ orgData.phone }}
                                </a>
                                <a v-if="orgData.website" :href="orgData.website" target="_blank"
                                    class="flex items-center gap-2.5 text-sm text-mun-gray-600 hover:text-mun-blue transition-colors">
                                    <GlobeAltIcon class="w-4 h-4 flex-shrink-0" />
                                    <span class="truncate">{{ orgData.website.replace(/^https?:\/\//, '') }}</span>
                                </a>
                                <div v-if="orgData.address" class="flex items-center gap-2.5 text-sm text-mun-gray-600">
                                    <MapPinIcon class="w-4 h-4 flex-shrink-0" />
                                    <span>{{ orgData.address }}</span>
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
            <MunBrand variant="footer">
                <p class="text-xs text-mun-gray-400">
                    Hosted by
                    <router-link :to="{ name: 'PublicOrg', params: { orgSlug: $route.params.orgSlug } }"
                        class="font-medium text-mun-gray-500 hover:text-mun-blue transition-colors">
                        {{ orgName }}
                    </router-link>
                </p>
            </MunBrand>
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
    CalendarIcon, MapPinIcon, ArrowRightIcon, ArrowLeftIcon, ExclamationTriangleIcon,
    EnvelopeIcon, PhoneIcon, GlobeAltIcon
} from '@heroicons/vue/24/outline'
import SocialIcon from '@/components/ui/SocialIcon.vue'
import PhotoLightbox from '@/components/ui/PhotoLightbox.vue'
import MunBrand from '@/components/ui/MunBrand.vue'
import RichTextContent from '@/components/ui/RichTextContent.vue'

const route = useRoute()

const isLoading = ref(true)
const event = ref(null)
const orgName = ref('')
const orgLogo = ref(null)
const orgData = ref({})
const error = ref(null)
const lightboxIndex = ref(null)

const orgInitials = computed(() => {
    if (!orgName.value) return ''
    return orgName.value.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
})

const displayLogo = computed(() => event.value?.logo || orgLogo.value)

const hasStats = computed(() => {
    const s = event.value?.statistics
    return s && (s.totalCommittees || s.totalCountries || s.totalParticipants || s.totalApplications)
})

const hasOrgContacts = computed(() => {
    const o = orgData.value
    return o.email || o.phone || o.website || o.address
})

const activeSocials = computed(() => {
    if (!orgData.value?.socialLinks) return {}
    const active = {}
    Object.entries(orgData.value.socialLinks).forEach(([k, v]) => {
        if (v) active[k] = v
    })
    return active
})

const lightboxPhotos = computed(() => (event.value?.photos || []).map(p => mediaUrl(p)))

const mediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}${path}`
}

const isHtml = (text) => /<[a-z][\s\S]*>/i.test(text)

const loadEvent = async () => {
    isLoading.value = true
    try {
        const res = await apiMethods.public.getEvent(route.params.orgSlug, route.params.eventSlug)
        if (res.data.success) {
            event.value = res.data.event
            orgName.value = res.data.event.organization?.name || ''
            orgLogo.value = res.data.event.organization?.logo || null
            orgData.value = res.data.event.organization || {}
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