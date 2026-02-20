<template>
    <div class="p-6 lg:p-8 space-y-6">
        <!-- Header -->
        <div class="page-header p-6">
            <div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Organization Settings</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage your organization's profile and public page</p>
            </div>
            <div class="flex items-center space-x-3">
                <a v-if="org" :href="publicPageUrl" target="_blank"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                    <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                    Public Page
                </a>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else-if="org">
            <!-- General Info -->
            <section class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">General Information</h2>
                    <AppButton v-if="!editing.general" variant="ghost" size="sm" @click="startEdit('general')">
                        <PencilIcon class="w-4 h-4 mr-1" /> Edit
                    </AppButton>
                </div>

                <!-- Read mode -->
                <template v-if="!editing.general">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-mun-gray-500">Name</p>
                            <p class="font-medium text-mun-gray-900">{{ org.name }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Slug</p>
                            <p class="font-mono text-xs text-mun-gray-700">{{ org.slug }}</p>
                        </div>
                        <div class="sm:col-span-2">
                            <p class="text-mun-gray-500">Description</p>
                            <p class="text-mun-gray-900">{{ org.description || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Founding Date</p>
                            <p class="text-mun-gray-900">{{ org.foundingDate ? formatDate(org.foundingDate) : '—' }}</p>
                        </div>
                    </div>
                </template>

                <!-- Edit mode -->
                <template v-else>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Organization Name *</label>
                            <input v-model="form.name" type="text" required class="input-field" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                            <textarea v-model="form.description" rows="3" class="input-field"
                                placeholder="Tell people about your organization..."></textarea>
                            <p class="text-xs text-mun-gray-400 mt-1">Shown on your public organization page</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Founding Date</label>
                            <input v-model="form.foundingDate" type="date" class="input-field w-auto" />
                        </div>
                        <div class="flex justify-end gap-3 pt-1">
                            <AppButton variant="ghost" size="sm" @click="cancelEdit('general')">Cancel</AppButton>
                            <AppButton size="sm" :disabled="isSaving" @click="saveSection('general')">
                                {{ isSaving ? 'Saving...' : 'Save' }}
                            </AppButton>
                        </div>
                    </div>
                </template>
            </section>

            <!-- Logo & Photos -->
            <section class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                <h2 class="text-lg font-semibold text-mun-gray-900">Branding</h2>

                <!-- Logo -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Logo</label>
                    <div class="flex items-center gap-4">
                        <div v-if="org.logo"
                            class="w-20 h-20 rounded-xl overflow-hidden bg-mun-gray-50 border border-mun-gray-200 flex-shrink-0">
                            <img :src="mediaUrl(org.logo)" :alt="org.name" class="w-full h-full object-cover" />
                        </div>
                        <div v-else
                            class="w-20 h-20 rounded-xl bg-mun-gray-100 flex items-center justify-center flex-shrink-0 border border-mun-gray-200">
                            <span class="text-xl font-bold text-mun-gray-400">{{ orgInitials }}</span>
                        </div>
                        <div class="flex flex-col gap-2">
                            <ImageUploader :model-value="null" @update:model-value="updateField('logo', $event)" compact
                                size-classes="w-10 h-10" />
                            <button v-if="org.logo" @click="updateField('logo', null)"
                                class="text-xs text-red-500 hover:text-red-700 transition-colors text-left">
                                Remove logo
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Photos -->
                <div>
                    <label class="block text-sm font-medium text-mun-gray-700 mb-2">Photos</label>
                    <p class="text-xs text-mun-gray-400 mb-3">Showcase your organization on the public page</p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div v-for="(photo, i) in (org.photos || [])" :key="i"
                            class="relative group aspect-[4/3] rounded-xl overflow-hidden bg-mun-gray-100">
                            <img :src="mediaUrl(photo)" alt="" class="w-full h-full object-cover" />
                            <button @click="removeOrgPhoto(i)"
                                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <XMarkIcon class="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <ImageUploader :model-value="null" @update:model-value="addOrgPhoto($event)" compact
                            size-classes="w-full aspect-[4/3]" />
                    </div>
                </div>
            </section>

            <!-- Contact Info -->
            <section class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Contact Information</h2>
                    <AppButton v-if="!editing.contact" variant="ghost" size="sm" @click="startEdit('contact')">
                        <PencilIcon class="w-4 h-4 mr-1" /> Edit
                    </AppButton>
                </div>

                <!-- Read mode -->
                <template v-if="!editing.contact">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-mun-gray-500">Email</p>
                            <p class="text-mun-gray-900">{{ org.email || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Phone</p>
                            <p class="text-mun-gray-900">{{ org.phone || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Website</p>
                            <p class="text-mun-gray-900">{{ org.website || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Address</p>
                            <p class="text-mun-gray-900">{{ org.address || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">City</p>
                            <p class="text-mun-gray-900">{{ org.location?.city || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-mun-gray-500">Country</p>
                            <p class="text-mun-gray-900">{{ org.location?.country || '—' }}</p>
                        </div>
                    </div>
                </template>

                <!-- Edit mode -->
                <template v-else>
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">Email</label>
                                <input v-model="form.email" type="email" class="input-field"
                                    placeholder="contact@yourorg.com" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">Phone</label>
                                <input v-model="form.phone" type="text" class="input-field"
                                    placeholder="+998 90 123 4567" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">Website</label>
                                <input v-model="form.website" type="url" class="input-field"
                                    placeholder="https://yourorg.com" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">Address</label>
                                <input v-model="form.address" type="text" class="input-field"
                                    placeholder="123 Main St, Suite 100" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">City</label>
                                <input v-model="form.location.city" type="text" class="input-field"
                                    placeholder="Tashkent" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">Country</label>
                                <input v-model="form.location.country" type="text" class="input-field"
                                    placeholder="Uzbekistan" />
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 pt-1">
                            <AppButton variant="ghost" size="sm" @click="cancelEdit('contact')">Cancel</AppButton>
                            <AppButton size="sm" :disabled="isSaving" @click="saveSection('contact')">
                                {{ isSaving ? 'Saving...' : 'Save' }}
                            </AppButton>
                        </div>
                    </div>
                </template>
            </section>

            <!-- Social Links -->
            <section class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-5">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Social Links</h2>
                    <AppButton v-if="!editing.social" variant="ghost" size="sm" @click="startEdit('social')">
                        <PencilIcon class="w-4 h-4 mr-1" /> Edit
                    </AppButton>
                </div>

                <!-- Read mode -->
                <template v-if="!editing.social">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div v-for="(label, key) in socialLabels" :key="key">
                            <p class="text-mun-gray-500">{{ label }}</p>
                            <a v-if="org.socialLinks?.[key]" :href="org.socialLinks[key]" target="_blank"
                                class="text-mun-blue hover:underline break-all">
                                {{ org.socialLinks[key] }}
                            </a>
                            <p v-else class="text-mun-gray-400">—</p>
                        </div>
                    </div>
                </template>

                <!-- Edit mode -->
                <template v-else>
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-for="(label, key) in socialLabels" :key="key">
                                <label class="block text-sm font-medium text-mun-gray-700 mb-1">{{ label }}</label>
                                <input v-model="form.socialLinks[key]" type="url" class="input-field"
                                    :placeholder="socialPlaceholders[key]" />
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 pt-1">
                            <AppButton variant="ghost" size="sm" @click="cancelEdit('social')">Cancel</AppButton>
                            <AppButton size="sm" :disabled="isSaving" @click="saveSection('social')">
                                {{ isSaving ? 'Saving...' : 'Save' }}
                            </AppButton>
                        </div>
                    </div>
                </template>
            </section>

            <!-- Public Page Link -->
            <section class="bg-white rounded-xl border border-mun-gray-200 p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-mun-gray-700">Public Organization Page</p>
                        <p class="text-xs text-mun-gray-400 mt-0.5">Anyone can view this page</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <code
                            class="text-xs bg-mun-gray-50 text-mun-gray-600 px-3 py-1.5 rounded-lg border border-mun-gray-200 max-w-xs truncate hidden sm:block">
                {{ publicPageUrl }}
            </code>
                        <button @click="copyToClipboard"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                            <ClipboardDocumentIcon class="w-4 h-4" />
                            {{ copied ? 'Copied!' : 'Copy' }}
                        </button>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    PencilIcon, XMarkIcon, ArrowTopRightOnSquareIcon, ClipboardDocumentIcon
} from '@heroicons/vue/24/outline'
import ImageUploader from '@/components/ui/ImageUploader.vue'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgSlug = computed(() => route.params.orgSlug)
const orgId = computed(() => authStore.activeOrganization?._id)
const orgInitials = computed(() => {
    if (!org.value?.name) return ''
    return org.value.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
})

const isLoading = ref(true)
const isSaving = ref(false)
const org = ref(null)
const copied = ref(false)

const publicPageUrl = computed(() => `${window.location.origin}/org/${orgSlug.value}/public`)

// Section-based edit state
const editing = reactive({ general: false, contact: false, social: false })

// Form data
const form = reactive({
    name: '',
    description: '',
    foundingDate: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    location: { city: '', country: '' },
    socialLinks: {
        telegram: '',
        instagram: '',
        facebook: '',
        linkedin: '',
        twitter: ''
    }
})

const socialLabels = {
    telegram: 'Telegram',
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'Twitter / X'
}

const socialPlaceholders = {
    telegram: 'https://t.me/yourorg',
    instagram: 'https://instagram.com/yourorg',
    facebook: 'https://facebook.com/yourorg',
    linkedin: 'https://linkedin.com/company/yourorg',
    twitter: 'https://x.com/yourorg'
}

const mediaUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = import.meta.env.VITE_API_URL || ''
    return `${base}${path}`
}

const loadOrg = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const res = await apiMethods.organizations.getById(orgId.value)
        if (res.data.success) {
            org.value = res.data.organization
        }
    } catch (e) {
        console.error('Failed to load org:', e)
    } finally {
        isLoading.value = false
    }
}

// Populate form from org data for a specific section
const startEdit = (section) => {
    if (!org.value) return

    if (section === 'general') {
        form.name = org.value.name || ''
        form.description = org.value.description || ''
        form.foundingDate = org.value.foundingDate?.split('T')[0] || ''
    } else if (section === 'contact') {
        form.email = org.value.email || ''
        form.phone = org.value.phone || ''
        form.website = org.value.website || ''
        form.address = org.value.address || ''
        form.location.city = org.value.location?.city || ''
        form.location.country = org.value.location?.country || ''
    } else if (section === 'social') {
        form.socialLinks.telegram = org.value.socialLinks?.telegram || ''
        form.socialLinks.instagram = org.value.socialLinks?.instagram || ''
        form.socialLinks.facebook = org.value.socialLinks?.facebook || ''
        form.socialLinks.linkedin = org.value.socialLinks?.linkedin || ''
        form.socialLinks.twitter = org.value.socialLinks?.twitter || ''
    }

    editing[section] = true
}

const cancelEdit = (section) => {
    editing[section] = false
}

const saveSection = async (section) => {
    isSaving.value = true
    try {
        let data = {}

        if (section === 'general') {
            data = {
                name: form.name,
                description: form.description || null,
                foundingDate: form.foundingDate || null
            }
        } else if (section === 'contact') {
            data = {
                email: form.email || null,
                phone: form.phone || null,
                website: form.website || null,
                address: form.address || null,
                location: {
                    city: form.location.city || null,
                    country: form.location.country || null
                }
            }
        } else if (section === 'social') {
            data = {
                socialLinks: {
                    telegram: form.socialLinks.telegram || null,
                    instagram: form.socialLinks.instagram || null,
                    facebook: form.socialLinks.facebook || null,
                    linkedin: form.socialLinks.linkedin || null,
                    twitter: form.socialLinks.twitter || null
                }
            }
        }

        const res = await apiMethods.organizations.update(orgId.value, data)
        if (res.data.success) {
            org.value = res.data.organization
            editing[section] = false
            toast.success('Saved')
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save')
    } finally {
        isSaving.value = false
    }
}

// Quick-save a single field (logo, photos)
const updateField = async (field, value) => {
    try {
        const res = await apiMethods.organizations.update(orgId.value, { [field]: value })
        if (res.data.success) {
            org.value = res.data.organization
            toast.success('Updated')
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to update')
    }
}

// Photos
const addOrgPhoto = async (url) => {
    if (!url) return
    const photos = [...(org.value.photos || []), url]
    await updateField('photos', photos)
}

const removeOrgPhoto = async (index) => {
    const photos = [...(org.value.photos || [])]
    photos.splice(index, 1)
    await updateField('photos', photos)
}

// Clipboard
const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(publicPageUrl.value)
    } catch {
        const textarea = document.createElement('textarea')
        textarea.value = publicPageUrl.value
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
    }
    copied.value = true
    toast.success('Link copied!')
    setTimeout(() => { copied.value = false }, 2000)
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

onMounted(() => loadOrg())
</script>