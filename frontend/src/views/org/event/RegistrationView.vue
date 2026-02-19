<template>
    <div :class="embedded ? 'space-y-6' : 'p-6 lg:p-8 space-y-6'">
        <!-- Header (standalone mode) -->
        <div v-if="!embedded" class="page-header p-6">
            <div>
                <div class="flex items-center space-x-3 mb-1">
                    <router-link
                        :to="{ name: 'OrgEventDetail', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="text-sm text-mun-gray-400 hover:text-mun-gray-600">← Back to Event</router-link>
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Registration Form</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Configure the registration form and pipeline</p>
            </div>
            <div class="flex items-center space-x-3">
                <span v-if="formData" :class="formStatusClass(formData.status)">{{ formData.status }}</span>
                <AppButton @click="saveForm" :disabled="isSaving">
                    {{ isSaving ? 'Saving...' : 'Save Form' }}
                </AppButton>
            </div>
        </div>
        <!-- Compact action bar (embedded mode) -->
        <div v-else class="flex items-center justify-end space-x-3">
            <span v-if="formData" :class="formStatusClass(formData.status)">{{ formData.status }}</span>
            <AppButton @click="saveForm" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Save Form' }}
            </AppButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else>
            <!-- Registration link (shown when form is active) -->
            <div v-if="formData && formData.status === 'active'"
                class="bg-green-50 rounded-xl border border-green-200 p-5">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-green-800">Registration Page</p>
                        <p class="text-xs text-green-600 mt-0.5">Share this link for applicants to register</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <code
                            class="text-xs bg-white text-green-700 px-3 py-1.5 rounded-lg border border-green-200 max-w-xs truncate hidden sm:block">
                            {{ registrationUrl }}
                        </code>
                        <button @click="copyToClipboard(registrationUrl, 'Registration link')"
                            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                            <ClipboardDocumentIcon class="w-4 h-4" />
                            {{ copiedField === 'Registration link' ? 'Copied!' : 'Copy' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Form status & settings -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                <h2 class="text-lg font-semibold text-mun-gray-900">General Settings</h2>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Form Status</label>
                        <select v-model="form.status" class="input-field">
                            <option value="draft">Draft — not visible to applicants</option>
                            <option value="active">Active — accepting applications</option>
                            <option value="closed">Closed — no new applications</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Committee Preferences</label>
                        <select v-model.number="form.committeePreferenceCount" class="input-field">
                            <option :value="1">1 choice</option>
                            <option :value="2">2 choices</option>
                            <option :value="3">3 choices (default)</option>
                            <option :value="4">4 choices</option>
                            <option :value="5">5 choices</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Registration Deadline</label>
                        <input v-model="form.deadline" type="datetime-local" class="input-field" />
                    </div>
                </div>
            </div>

            <!-- Pipeline stages -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Pipeline Stages</h2>
                    <p class="text-xs text-mun-gray-400">Toggle stages in the application review process</p>
                </div>

                <div class="space-y-2">
                    <!-- form_review is always active -->
                    <div
                        class="flex items-center justify-between p-3 bg-mun-blue-50 rounded-lg border border-mun-blue-200">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-8 h-8 bg-mun-blue rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                1</div>
                            <div>
                                <p class="text-sm font-medium text-mun-gray-900">Form Review</p>
                                <p class="text-xs text-mun-gray-500">Review submitted application forms</p>
                            </div>
                        </div>
                        <span class="text-xs text-mun-blue font-medium">Always active</span>
                    </div>

                    <div v-for="(stage, index) in optionalStages" :key="stage.id"
                        class="flex items-center justify-between p-3 rounded-lg border transition-colors"
                        :class="stage.active ? 'bg-green-50 border-green-200' : 'bg-mun-gray-50 border-mun-gray-200'">
                        <div class="flex items-center space-x-3">
                            <div :class="[
                                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                                stage.active ? 'bg-green-600 text-white' : 'bg-mun-gray-300 text-white'
                            ]">
                                {{ getStageNumber(stage.id) }}
                            </div>
                            <div>
                                <p class="text-sm font-medium text-mun-gray-900">{{ stageLabels[stage.id] }}</p>
                                <p class="text-xs text-mun-gray-500">{{ stageDescriptions[stage.id] }}</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" v-model="stage.active" class="sr-only peer">
                            <div
                                class="w-9 h-5 bg-mun-gray-300 peer-focus:ring-2 peer-focus:ring-mun-blue-300 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full">
                            </div>
                        </label>
                    </div>

                    <!-- final_decision is always active -->
                    <div
                        class="flex items-center justify-between p-3 bg-mun-blue-50 rounded-lg border border-mun-blue-200">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-8 h-8 bg-mun-blue rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {{ activeStageCount }}
                            </div>
                            <div>
                                <p class="text-sm font-medium text-mun-gray-900">Final Decision</p>
                                <p class="text-xs text-mun-gray-500">Accept or reject applicant</p>
                            </div>
                        </div>
                        <span class="text-xs text-mun-blue font-medium">Always active</span>
                    </div>
                </div>
            </div>

            <!-- Custom fields -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-mun-gray-900">Custom Fields</h2>
                    <AppButton variant="ghost" size="sm" @click="addField">
                        <PlusIcon class="w-4 h-4 mr-1" /> Add Field
                    </AppButton>
                </div>

                <p class="text-xs text-mun-gray-400">
                    These fields appear on the registration form in addition to the standard user profile fields
                    (name, email, phone, institution).
                </p>

                <div v-if="form.customFields.length === 0" class="text-center py-6 text-mun-gray-400 text-sm">
                    No custom fields yet. Add fields to collect additional information from applicants.
                </div>

                <div v-else class="space-y-3">
                    <div v-for="(field, index) in form.customFields" :key="field.fieldId"
                        class="border border-mun-gray-200 rounded-lg p-4 space-y-3">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-2">
                                <!-- Reorder buttons -->
                                <div class="flex flex-col space-y-0.5">
                                    <button type="button" @click="moveField(index, -1)" :disabled="index === 0"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 disabled:opacity-30">
                                        <ChevronUpIcon class="w-3 h-3" />
                                    </button>
                                    <button type="button" @click="moveField(index, 1)"
                                        :disabled="index === form.customFields.length - 1"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 disabled:opacity-30">
                                        <ChevronDownIcon class="w-3 h-3" />
                                    </button>
                                </div>
                                <span class="text-xs text-mun-gray-400 font-mono">{{ field.fieldId }}</span>
                            </div>
                            <button type="button" @click="removeField(index)"
                                class="text-mun-gray-400 hover:text-red-500">
                                <TrashIcon class="w-4 h-4" />
                            </button>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs text-mun-gray-500 mb-1">Label</label>
                                <input v-model="field.label" type="text" required class="input-field text-sm"
                                    placeholder="Field label" />
                            </div>
                            <div>
                                <label class="block text-xs text-mun-gray-500 mb-1">Type</label>
                                <select v-model="field.type" class="input-field text-sm">
                                    <option value="text">Text (short)</option>
                                    <option value="textarea">Textarea (long)</option>
                                    <option value="select">Select (dropdown)</option>
                                    <option value="file">File upload</option>
                                </select>
                            </div>
                            <div class="flex items-end space-x-4">
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" v-model="field.required"
                                        class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                    <span class="text-sm text-mun-gray-700">Required</span>
                                </label>
                            </div>
                        </div>

                        <!-- Select options -->
                        <div v-if="field.type === 'select'">
                            <label class="block text-xs text-mun-gray-500 mb-1">Options (one per line)</label>
                            <textarea v-model="field.optionsText" rows="3" class="input-field text-sm"
                                placeholder="Option 1&#10;Option 2&#10;Option 3"></textarea>
                        </div>

                        <!-- Placeholder -->
                        <div v-if="field.type !== 'file'">
                            <label class="block text-xs text-mun-gray-500 mb-1">Placeholder</label>
                            <input v-model="field.placeholder" type="text" class="input-field text-sm"
                                placeholder="Optional placeholder text" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Auto-filled fields info -->
            <div class="bg-mun-blue-50 rounded-xl border border-mun-blue-200 p-4">
                <p class="text-sm font-medium text-mun-blue-800 mb-1">Auto-filled from user profile</p>
                <p class="text-xs text-mun-blue-600">
                    The following fields are automatically filled from the applicant's account:
                    First Name, Last Name, Email, Phone, Institution, Date of Birth.
                    Applicants can update these values during registration.
                </p>
            </div>
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
    PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, ClipboardDocumentIcon
} from '@heroicons/vue/24/outline'

defineProps({
    embedded: { type: Boolean, default: false }
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgSlug = computed(() => route.params.orgSlug)
const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)

const isLoading = ref(true)
const isSaving = ref(false)
const eventData = ref(null)
const formData = ref(null) // existing form from API, if any
const copiedField = ref(null)

// Public registration URL
const baseUrl = computed(() => window.location.origin)
const registrationUrl = computed(() => `${baseUrl.value}/events/${orgSlug.value}/${eventSlug.value}/register`)

const copyToClipboard = async (text, label) => {
    try {
        await navigator.clipboard.writeText(text)
        copiedField.value = label
        toast.success(`${label} copied!`)
        setTimeout(() => { copiedField.value = null }, 2000)
    } catch {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        copiedField.value = label
        toast.success(`${label} copied!`)
        setTimeout(() => { copiedField.value = null }, 2000)
    }
}

const stageLabels = {
    form_review: 'Form Review',
    interview: 'Interview',
    payment: 'Payment',
    final_decision: 'Final Decision',
}
const stageDescriptions = {
    interview: 'Schedule and conduct applicant interviews',
    payment: 'Verify participation fee payment',
}

const optionalStages = reactive([
    { id: 'interview', active: false, order: 2 },
    { id: 'payment', active: false, order: 3 },
])

const form = reactive({
    status: 'draft',
    committeePreferenceCount: 3,
    deadline: '',
    customFields: [],
})

let fieldCounter = 0

const activeStageCount = computed(() => {
    // form_review + active optional stages + final_decision
    return 2 + optionalStages.filter(s => s.active).length
})

const getStageNumber = (stageId) => {
    // form_review is always 1
    let num = 2
    for (const s of optionalStages) {
        if (s.id === stageId) return s.active ? num : '-'
        if (s.active) num++
    }
    return '-'
}

const loadForm = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        // Get event first
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (!eventRes.data.success) return
        eventData.value = eventRes.data.event

        // Try loading existing form
        try {
            const formRes = await apiMethods.registration.getForm(orgId.value, eventData.value._id)
            if (formRes.data.success && formRes.data.form) {
                formData.value = formRes.data.form
                populateFormFromData(formRes.data.form)
            }
        } catch (e) {
            // 404 = no form yet, that's fine
            if (e.response?.status !== 404) throw e
        }
    } catch (e) {
        console.error('Failed to load form:', e)
    } finally {
        isLoading.value = false
    }
}

const populateFormFromData = (data) => {
    form.status = data.status || 'draft'
    form.committeePreferenceCount = data.committeePreferenceCount || 3
    form.deadline = data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : ''

    // Pipeline stages
    const pipelineStages = data.pipelineStages || []
    for (const os of optionalStages) {
        const found = pipelineStages.find(ps => ps.stage === os.id)
        os.active = found ? found.active : false
    }

    // Custom fields
    form.customFields = (data.customFields || []).map(f => ({
        fieldId: f.fieldId,
        label: f.label,
        type: f.type,
        required: f.required || false,
        placeholder: f.placeholder || '',
        optionsText: (f.options || []).join('\n'),
    }))
    fieldCounter = form.customFields.length
}

const addField = () => {
    fieldCounter++
    form.customFields.push({
        fieldId: `custom_${fieldCounter}_${Date.now()}`,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        optionsText: '',
    })
}

const removeField = (index) => {
    form.customFields.splice(index, 1)
}

const moveField = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= form.customFields.length) return
    const temp = form.customFields[index]
    form.customFields[index] = form.customFields[newIndex]
    form.customFields[newIndex] = temp
    // Force reactivity
    form.customFields = [...form.customFields]
}

const saveForm = async () => {
    if (!eventData.value) return

    // Validate custom fields
    for (const field of form.customFields) {
        if (!field.label.trim()) {
            toast.error('All custom fields must have a label')
            return
        }
        if (field.type === 'select' && !field.optionsText.trim()) {
            toast.error(`Select field "${field.label}" needs at least one option`)
            return
        }
    }

    isSaving.value = true
    try {
        // Build pipeline stages
        const pipelineStages = [
            { stage: 'form_review', active: true, order: 1 },
            ...optionalStages.map((s, i) => ({
                stage: s.id,
                active: s.active,
                order: i + 2,
            })),
            { stage: 'final_decision', active: true, order: optionalStages.length + 2 },
        ]

        // Build custom fields
        const customFields = form.customFields.map((f, i) => ({
            fieldId: f.fieldId,
            label: f.label,
            type: f.type,
            required: f.required,
            placeholder: f.placeholder || undefined,
            options: f.type === 'select' ? f.optionsText.split('\n').map(o => o.trim()).filter(Boolean) : undefined,
            order: i + 1,
        }))

        const payload = {
            status: form.status,
            committeePreferenceCount: form.committeePreferenceCount,
            deadline: form.deadline || undefined,
            pipelineStages,
            customFields,
        }

        const res = await apiMethods.registration.upsertForm(orgId.value, eventData.value._id, payload)
        if (res.data.success) {
            formData.value = res.data.form
            toast.success('Registration form saved')
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save form')
    } finally {
        isSaving.value = false
    }
}

const formStatusClass = (status) => ({
    draft: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
    active: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
    closed: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700',
}[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600')

onMounted(() => loadForm())
</script>