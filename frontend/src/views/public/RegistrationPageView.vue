<template>
    <div class="min-h-screen bg-mun-gray-50">
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
                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">Registration Unavailable</h1>
                <p class="text-mun-gray-500 mb-8">{{ error }}</p>
                <router-link
                    :to="{ name: 'PublicEvent', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                    class="inline-flex items-center text-sm font-medium text-mun-blue hover:text-mun-blue-700">
                    <ArrowLeftIcon class="w-4 h-4 mr-1.5" /> Back to event
                </router-link>
            </div>
        </div>

        <template v-else>
            <!-- MUN.UZ top bar -->
            <MunBrand variant="top" />

            <!-- Header bar -->
            <header class="bg-white border-b border-mun-gray-200 sticky top-0 z-30">
                <div class="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
                    <router-link
                        :to="{ name: 'PublicEvent', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="flex items-center gap-2 text-sm text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                        <ArrowLeftIcon class="w-4 h-4" />
                        <span class="hidden sm:inline">Back to event</span>
                    </router-link>
                    <div class="flex items-center gap-2.5">
                        <img v-if="eventLogo" :src="mediaUrl(eventLogo)" :alt="eventName"
                            class="w-7 h-7 rounded-lg object-cover" />
                        <span class="text-sm font-medium text-mun-gray-900 truncate max-w-xs">{{ eventName }}</span>
                    </div>
                </div>
            </header>

            <div class="max-w-2xl mx-auto px-6 py-10 lg:py-14">
                <!-- Title -->
                <div class="mb-10">
                    <h1 class="text-3xl font-extrabold text-mun-gray-900 tracking-tight mb-2">Registration</h1>
                    <p class="text-mun-gray-500">Complete the form below to submit your application.</p>
                </div>

                <!-- Not authenticated -->
                <div v-if="!isAuthenticated"
                    class="bg-white rounded-2xl border border-mun-gray-200 shadow-sm p-10 text-center space-y-6">
                    <div class="w-14 h-14 bg-mun-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                        <UserIcon class="w-7 h-7 text-mun-blue" />
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-mun-gray-900 mb-1">Sign in to continue</p>
                        <p class="text-sm text-mun-gray-500">You need an account to register for this event.</p>
                    </div>
                    <div class="flex items-center justify-center gap-3">
                        <router-link :to="{ name: 'Login', query: { redirect: $route.fullPath } }"
                            class="px-6 py-3 bg-mun-blue text-white font-semibold rounded-xl hover:bg-mun-blue-600 transition-colors">
                            Sign In
                        </router-link>
                        <router-link :to="{ name: 'Register', query: { redirect: $route.fullPath } }"
                            class="px-6 py-3 bg-white text-mun-gray-700 font-semibold rounded-xl border border-mun-gray-200 hover:bg-mun-gray-50 transition-colors">
                            Create Account
                        </router-link>
                    </div>
                </div>

                <!-- Registration form -->
                <div v-else class="space-y-8">

                    <!-- Committee preferences -->
                    <div v-if="committees.length > 0"
                        class="bg-white rounded-2xl border border-mun-gray-200 shadow-sm overflow-hidden">
                        <div class="px-6 py-5 border-b border-mun-gray-100">
                            <h2 class="text-lg font-bold text-mun-gray-900">Committee Preferences</h2>
                            <p class="text-sm text-mun-gray-500 mt-0.5">
                                Select up to {{ formData?.committeePreferenceCount || 3 }} committees in order of
                                preference.
                            </p>
                        </div>
                        <div class="px-6 py-5 space-y-3">
                            <div v-for="(pref, i) in preferences" :key="i" class="flex items-center gap-3">
                                <span
                                    class="w-7 h-7 rounded-full bg-mun-blue-50 flex items-center justify-center text-xs font-bold text-mun-blue flex-shrink-0">
                                    {{ i + 1 }}
                                </span>
                                <SleekSelect v-model="preferences[i]" :options="getCommitteeOptions(i)"
                                    :placeholder="'Select committee...'" size="md" container-class="flex-1" />
                            </div>
                        </div>
                    </div>

                    <div v-else class="bg-white rounded-2xl border border-mun-gray-200 shadow-sm p-6 text-center">
                        <p class="text-sm text-mun-gray-400">No committees are available for selection yet.</p>
                    </div>

                    <!-- Custom fields -->
                    <div v-if="formData?.customFields?.length"
                        class="bg-white rounded-2xl border border-mun-gray-200 shadow-sm overflow-hidden">
                        <div class="px-6 py-5 border-b border-mun-gray-100">
                            <h2 class="text-lg font-bold text-mun-gray-900">Additional Information</h2>
                        </div>
                        <div class="px-6 py-5 space-y-5">
                            <div v-for="field in formData.customFields" :key="field.fieldId">
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1.5">
                                    {{ field.label }}
                                    <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
                                </label>

                                <!-- Text -->
                                <input v-if="field.type === 'text'" v-model="customResponses[field.fieldId]" type="text"
                                    :placeholder="field.placeholder" :required="field.required" class="input-field" />

                                <!-- Textarea -->
                                <textarea v-else-if="field.type === 'textarea'" v-model="customResponses[field.fieldId]"
                                    :placeholder="field.placeholder" :required="field.required" rows="4"
                                    class="input-field" />

                                <!-- Select -->
                                <SleekSelect v-else-if="field.type === 'select'"
                                    v-model="customResponses[field.fieldId]" :options="getFieldSelectOptions(field)"
                                    :placeholder="field.placeholder || 'Select...'" size="md"
                                    container-class="w-full" />

                                <!-- File -->
                                <div v-else-if="field.type === 'file'">
                                    <!-- File selected state -->
                                    <div v-if="fileUploads[field.fieldId]"
                                        class="flex items-center justify-between px-4 py-3 bg-mun-blue-50 border border-mun-blue-200 rounded-xl">
                                        <div class="flex items-center gap-3 min-w-0">
                                            <DocumentIcon class="w-5 h-5 text-mun-blue flex-shrink-0" />
                                            <div class="min-w-0">
                                                <p class="text-sm font-medium text-mun-gray-900 truncate">
                                                    {{ fileUploads[field.fieldId].name }}
                                                </p>
                                                <p class="text-xs text-mun-gray-500">
                                                    {{ formatFileSize(fileUploads[field.fieldId].size) }}
                                                </p>
                                            </div>
                                        </div>
                                        <button type="button" @click="removeFile(field.fieldId)"
                                            class="p-1 text-mun-gray-400 hover:text-red-500 transition-colors">
                                            <XMarkIcon class="w-4 h-4" />
                                        </button>
                                    </div>

                                    <!-- Drop zone -->
                                    <label v-else :class="[
                                        'flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                                        dragOver[field.fieldId]
                                            ? 'border-mun-blue bg-mun-blue-50'
                                            : 'border-mun-gray-200 hover:border-mun-gray-300 bg-mun-gray-50/50'
                                    ]" @dragover.prevent="dragOver[field.fieldId] = true"
                                        @dragleave.prevent="dragOver[field.fieldId] = false"
                                        @drop.prevent="handleFileDrop($event, field.fieldId)">
                                        <ArrowUpTrayIcon
                                            :class="['w-6 h-6 mb-2', dragOver[field.fieldId] ? 'text-mun-blue' : 'text-mun-gray-400']" />
                                        <p class="text-sm font-medium text-mun-gray-600">
                                            <span class="text-mun-blue">Upload a file</span> or drag and drop
                                        </p>
                                        <p class="text-xs text-mun-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                                        <input type="file" class="hidden" accept=".pdf,.doc,.docx,.rtf"
                                            @change="handleFileSelect($event, field.fieldId)" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="flex items-center justify-between pt-2">
                        <router-link
                            :to="{ name: 'PublicEvent', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                            class="text-sm text-mun-gray-500 hover:text-mun-gray-700 transition-colors">
                            Cancel
                        </router-link>
                        <button @click="submitApplication" :disabled="isSubmitting"
                            class="px-8 py-3.5 bg-mun-blue text-white font-bold rounded-xl hover:bg-mun-blue-600 transition-colors disabled:opacity-50 shadow-lg shadow-mun-blue/20">
                            {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <MunBrand variant="footer" :left-text="eventName" class="mt-16" />
        </template>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    ArrowLeftIcon, UserIcon, ExclamationTriangleIcon,
    DocumentIcon, XMarkIcon, ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'
import MunBrand from '@/components/ui/MunBrand.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref(null)
const eventName = ref('')
const eventLogo = ref(null)
const eventId = ref(null)
const orgId = ref(null)
const formData = ref(null)
const committees = ref([])
const preferences = ref([])
const customResponses = reactive({})
const fileUploads = reactive({})
const dragOver = reactive({})

const isAuthenticated = computed(() => authStore.isAuthenticated)

const mediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}${path}`
}

// Build committee options for SleekSelect, excluding already-selected ones
const getCommitteeOptions = (currentIndex) => {
    const selectedIds = preferences.value.filter((id, i) => id && i !== currentIndex)
    return committees.value
        .filter(c => !selectedIds.includes(c._id))
        .map(c => ({
            label: c.acronym ? `${c.acronym} — ${c.name}` : c.name,
            value: c._id
        }))
}

// Build options for custom select fields
const getFieldSelectOptions = (field) => {
    return (field.options || []).map(opt => ({
        label: opt,
        value: opt
    }))
}

// File handling
const handleFileSelect = (event, fieldId) => {
    const file = event.target.files?.[0]
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10MB')
            return
        }
        fileUploads[fieldId] = file
    }
}

const handleFileDrop = (event, fieldId) => {
    dragOver[fieldId] = false
    const file = event.dataTransfer.files?.[0]
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10MB')
            return
        }
        fileUploads[fieldId] = file
    }
}

const removeFile = (fieldId) => {
    delete fileUploads[fieldId]
}

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
}

const loadForm = async () => {
    isLoading.value = true
    try {
        // Step 1: Load event info
        const eventRes = await apiMethods.events.getPublic(route.params.orgSlug, route.params.eventSlug)
        if (!eventRes.data.success) {
            error.value = 'Event not found.'
            return
        }

        const ev = eventRes.data.event
        eventName.value = ev.name
        eventLogo.value = ev.logo || ev.organization?.logo || null
        eventId.value = ev._id
        orgId.value = ev.organization?._id

        if (ev.status !== 'registration_open') {
            error.value = 'Registration is not currently open for this event.'
            return
        }

        // Step 2: Load registration form (public endpoint)
        try {
            const regRes = await apiMethods.events.getPublicRegistration(route.params.orgSlug, route.params.eventSlug)
            if (regRes.data.success) {
                formData.value = regRes.data.form
                committees.value = regRes.data.committees || []

                // Initialize preference slots
                const count = formData.value.committeePreferenceCount || 3
                preferences.value = Array(count).fill(null)
            }
        } catch (e) {
            if (e.response?.status === 404) {
                error.value = 'Registration form is not available yet.'
            } else {
                throw e
            }
        }
    } catch (e) {
        error.value = 'Something went wrong loading registration.'
        console.error('Failed to load registration:', e)
    } finally {
        isLoading.value = false
    }
}

const submitApplication = async () => {
    if (!eventId.value || !orgId.value) return

    const committeePreferences = preferences.value
        .filter(id => id)
        .map((committeeId, index) => ({ committee: committeeId, priority: index + 1 }))

    if (committeePreferences.length === 0 && committees.value.length > 0) {
        toast.error('Please select at least one committee preference.')
        return
    }

    // Validate required custom fields
    if (formData.value?.customFields) {
        for (const field of formData.value.customFields) {
            if (!field.required) continue

            if (field.type === 'file') {
                if (!fileUploads[field.fieldId]) {
                    toast.error(`"${field.label}" is required.`)
                    return
                }
            } else {
                if (!customResponses[field.fieldId]) {
                    toast.error(`"${field.label}" is required.`)
                    return
                }
            }
        }
    }

    isSubmitting.value = true
    try {
        const hasFiles = Object.keys(fileUploads).length > 0

        let res
        if (hasFiles) {
            // Use FormData when files are present
            const fd = new FormData()
            fd.append('committeePreferences', JSON.stringify(committeePreferences))
            fd.append('customFieldResponses', JSON.stringify(customResponses))

            // Append each file with its fieldId as the key
            for (const [fieldId, file] of Object.entries(fileUploads)) {
                fd.append(`file_${fieldId}`, file)
            }

            res = await apiMethods.registration.submit(orgId.value, eventId.value, fd)
        } else {
            res = await apiMethods.registration.submit(orgId.value, eventId.value, {
                committeePreferences,
                customFieldResponses: customResponses,
            })
        }

        if (res.data.success) {
            toast.success('Application submitted successfully!')
            router.push({
                name: 'PublicEvent',
                params: { orgSlug: route.params.orgSlug, eventSlug: route.params.eventSlug }
            })
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to submit application')
    } finally {
        isSubmitting.value = false
    }
}

onMounted(() => loadForm())
</script>