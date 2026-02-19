<template>
    <div class="min-h-screen bg-gradient-to-b from-mun-gray-50 to-white">
        <div v-if="isLoading" class="flex justify-center py-24">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <div v-else-if="error" class="max-w-lg mx-auto px-6 py-24 text-center">
            <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">Registration Unavailable</h1>
            <p class="text-mun-gray-500 mb-6">{{ error }}</p>
            <router-link
                :to="{ name: 'PublicEvent', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                class="text-mun-blue hover:text-mun-blue-700 font-medium">← Back to event</router-link>
        </div>

        <template v-else>
            <div class="max-w-2xl mx-auto px-6 py-12">
                <!-- Back link -->
                <router-link
                    :to="{ name: 'PublicEvent', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                    class="text-sm text-mun-gray-400 hover:text-mun-gray-600 mb-6 inline-block">← Back to event</router-link>

                <h1 class="text-2xl font-bold text-mun-gray-900 mb-2">Register for {{ eventName }}</h1>
                <p class="text-mun-gray-500 mb-8">Fill out the form below to apply for this event.</p>

                <!-- Not authenticated -->
                <div v-if="!isAuthenticated" class="bg-white rounded-xl border border-mun-gray-200 p-8 text-center space-y-4">
                    <p class="text-mun-gray-600">You need an account to register for this event.</p>
                    <div class="flex items-center justify-center gap-3">
                        <router-link
                            :to="{ name: 'Login', query: { redirect: $route.fullPath } }"
                            class="px-5 py-2.5 bg-mun-blue text-white font-medium rounded-xl hover:bg-mun-blue-600 transition-colors">
                            Sign In
                        </router-link>
                        <router-link
                            :to="{ name: 'Register', query: { redirect: $route.fullPath } }"
                            class="px-5 py-2.5 bg-white text-mun-gray-700 font-medium rounded-xl border border-mun-gray-200 hover:bg-mun-gray-50 transition-colors">
                            Create Account
                        </router-link>
                    </div>
                </div>

                <!-- Registration form -->
                <div v-else class="space-y-6">
                    <!-- Committee preferences -->
                    <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                        <h2 class="text-lg font-semibold text-mun-gray-900">Committee Preferences</h2>
                        <p class="text-sm text-mun-gray-500">
                            Select up to {{ formData?.committeePreferenceCount || 3 }} committees in order of preference.
                        </p>

                        <div v-if="committees.length === 0" class="text-sm text-mun-gray-400 py-4 text-center">
                            No committees available yet.
                        </div>
                        <div v-else class="space-y-2">
                            <div v-for="(pref, i) in preferences" :key="i" class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded-full bg-mun-gray-200 flex items-center justify-center text-xs font-bold text-mun-gray-600">{{ i + 1 }}</span>
                                <select v-model="preferences[i]" class="input-field flex-1 text-sm">
                                    <option value="">Select committee...</option>
                                    <option v-for="c in committees" :key="c._id" :value="c._id"
                                        :disabled="preferences.includes(c._id) && preferences[i] !== c._id">
                                        {{ c.acronym }} — {{ c.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Custom fields -->
                    <div v-if="formData?.customFields?.length" class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                        <h2 class="text-lg font-semibold text-mun-gray-900">Additional Information</h2>
                        <div v-for="field in formData.customFields" :key="field.fieldId" class="space-y-1">
                            <label class="block text-sm font-medium text-mun-gray-700">
                                {{ field.label }}
                                <span v-if="field.required" class="text-red-500">*</span>
                            </label>
                            <input v-if="field.type === 'text'" v-model="customResponses[field.fieldId]" type="text"
                                :placeholder="field.placeholder" :required="field.required" class="input-field text-sm" />
                            <textarea v-else-if="field.type === 'textarea'" v-model="customResponses[field.fieldId]"
                                :placeholder="field.placeholder" :required="field.required" rows="3" class="input-field text-sm" />
                            <select v-else-if="field.type === 'select'" v-model="customResponses[field.fieldId]"
                                :required="field.required" class="input-field text-sm">
                                <option value="">Select...</option>
                                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                            </select>
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="flex justify-end">
                        <button @click="submitApplication" :disabled="isSubmitting"
                            class="px-6 py-3 bg-mun-blue text-white font-semibold rounded-xl hover:bg-mun-blue-600 transition-colors disabled:opacity-50">
                            {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref(null)
const eventName = ref('')
const eventId = ref(null)
const orgId = ref(null)
const formData = ref(null)
const committees = ref([])
const preferences = ref([])
const customResponses = reactive({})

const isAuthenticated = computed(() => authStore.isAuthenticated)

const loadForm = async () => {
    isLoading.value = true
    try {
        // Step 1: Load event info (always public, no auth needed)
        const eventRes = await apiMethods.events.getPublic(route.params.orgSlug, route.params.eventSlug)
        if (!eventRes.data.success) {
            error.value = 'Event not found.'
            return
        }

        const ev = eventRes.data.event
        eventName.value = ev.name
        eventId.value = ev._id
        orgId.value = ev.organization?._id

        if (ev.status !== 'registration_open') {
            error.value = 'Registration is not currently open for this event.'
            return
        }

        // Step 2: Load registration form (public endpoint, no auth needed)
        try {
            const regRes = await apiMethods.events.getPublicRegistration(route.params.orgSlug, route.params.eventSlug)
            if (regRes.data.success) {
                formData.value = regRes.data.form
                committees.value = regRes.data.committees || []

                // Initialize preference slots
                const count = formData.value.committeePreferenceCount || 3
                preferences.value = Array(count).fill('')
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

    if (committeePreferences.length === 0) {
        toast.error('Please select at least one committee preference.')
        return
    }

    isSubmitting.value = true
    try {
        const res = await apiMethods.registration.submit(orgId.value, eventId.value, {
            committeePreferences,
            customFieldResponses: customResponses,
        })
        if (res.data.success) {
            toast.success('Application submitted successfully!')
            router.push({ name: 'PublicEvent', params: { orgSlug: route.params.orgSlug, eventSlug: route.params.eventSlug } })
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to submit application')
    } finally {
        isSubmitting.value = false
    }
}

onMounted(() => loadForm())
</script>