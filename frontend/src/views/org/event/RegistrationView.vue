<template>
    <div :class="embedded ? 'space-y-6' : 'p-6 lg:p-8 space-y-6'">
        <!-- Header -->
        <div v-if="!embedded" class="page-header p-6">
            <div>
                <div class="flex items-center space-x-3 mb-1">
                    <router-link
                        :to="{ name: 'OrgEventDetail', params: { orgSlug: $route.params.orgSlug, eventSlug: $route.params.eventSlug } }"
                        class="text-sm text-mun-gray-400 hover:text-mun-gray-600">← Back to Event</router-link>
                </div>
                <h1 class="text-2xl font-bold text-mun-gray-900">Registration Form</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Configure the registration form and review pipeline</p>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <template v-else>
            <!-- Public link bar -->
            <div v-if="publicUrl"
                class="bg-white rounded-xl border border-mun-gray-200 p-4 flex items-center justify-between">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-mun-blue-50 flex items-center justify-center flex-shrink-0">
                        <LinkIcon class="w-4 h-4 text-mun-blue" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs text-mun-gray-500">Public registration page</p>
                        <p class="text-sm text-mun-gray-900 font-medium truncate">{{ publicUrl }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button @click="copyPublicUrl"
                        class="px-3 py-1.5 text-xs font-medium text-mun-gray-600 bg-mun-gray-100 rounded-lg hover:bg-mun-gray-200 transition-colors">
                        {{ copied ? 'Copied!' : 'Copy' }}
                    </button>
                    <a :href="publicUrl" target="_blank"
                        class="px-3 py-1.5 text-xs font-medium text-mun-blue bg-mun-blue-50 rounded-lg hover:bg-mun-blue-100 transition-colors">
                        Open ↗
                    </a>
                </div>
            </div>

            <!-- Status + Save bar -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-sm text-mun-gray-500">Form status:</span>
                    <select v-model="form.status" class="input-field text-sm !w-auto !py-1.5 !px-3">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>
                    <span :class="[
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        form.status === 'active' ? 'bg-green-100 text-green-700' :
                            form.status === 'closed' ? 'bg-red-100 text-red-700' :
                                'bg-mun-gray-100 text-mun-gray-600'
                    ]">
                        {{ form.status === 'active' ? 'Accepting applications' : form.status === 'closed' ? 'Closed' :
                        'Not visible to applicants' }}
                    </span>
                </div>
                <AppButton size="sm" @click="saveForm" :disabled="isSaving">
                    {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </AppButton>
            </div>

            <!-- Pipeline stages -->
            <div class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-mun-gray-100">
                    <h2 class="text-base font-semibold text-mun-gray-900">Review Pipeline</h2>
                    <p class="text-sm text-mun-gray-500 mt-0.5">Toggle which stages applications go through before a
                        final decision.</p>
                </div>
                <div class="px-6 py-4 space-y-2">
                    <div v-for="stage in form.pipelineStages" :key="stage.stage"
                        class="flex items-center justify-between py-2.5 px-4 rounded-lg"
                        :class="stage.isActive ? 'bg-mun-blue-50/50' : 'bg-mun-gray-50'">
                        <div class="flex items-center gap-3">
                            <span :class="[
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                stage.isActive ? 'bg-mun-blue text-white' : 'bg-mun-gray-200 text-mun-gray-400'
                            ]">
                                {{ stage.order }}
                            </span>
                            <div>
                                <p
                                    :class="['text-sm font-medium', stage.isActive ? 'text-mun-gray-900' : 'text-mun-gray-400']">
                                    {{ formatStage(stage.stage) }}
                                </p>
                                <p class="text-xs text-mun-gray-400">{{ stageDescriptions[stage.stage] }}</p>
                            </div>
                        </div>
                        <!-- form_review and final_decision are always on -->
                        <label v-if="!['form_review', 'final_decision'].includes(stage.stage)"
                            class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" v-model="stage.isActive" class="sr-only peer"
                                @change="reorderStages" />
                            <div
                                class="w-9 h-5 bg-mun-gray-200 peer-focus:ring-2 peer-focus:ring-mun-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-mun-blue after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all">
                            </div>
                        </label>
                        <span v-else class="text-xs text-mun-gray-400 italic">Required</span>
                    </div>
                </div>
            </div>

            <!-- Committee preference count -->
            <div class="bg-white rounded-xl border border-mun-gray-200 p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-base font-semibold text-mun-gray-900">Committee Preferences</h2>
                        <p class="text-sm text-mun-gray-500 mt-0.5">How many committee choices should applicants rank?
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="form.committeePreferenceCount = Math.max(1, form.committeePreferenceCount - 1)"
                            class="w-8 h-8 rounded-lg border border-mun-gray-200 flex items-center justify-center text-mun-gray-500 hover:bg-mun-gray-50 transition-colors">
                            <MinusIcon class="w-4 h-4" />
                        </button>
                        <span class="w-8 text-center text-lg font-bold text-mun-gray-900">{{
                            form.committeePreferenceCount }}</span>
                        <button @click="form.committeePreferenceCount = Math.min(5, form.committeePreferenceCount + 1)"
                            class="w-8 h-8 rounded-lg border border-mun-gray-200 flex items-center justify-center text-mun-gray-500 hover:bg-mun-gray-50 transition-colors">
                            <PlusIcon class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Custom fields -->
            <div class="bg-white rounded-xl border border-mun-gray-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-mun-gray-100 flex items-center justify-between">
                    <div>
                        <h2 class="text-base font-semibold text-mun-gray-900">Custom Questions</h2>
                        <p class="text-sm text-mun-gray-500 mt-0.5">
                            {{ form.customFields.length === 0 ? 'No custom questions yet.' :
                                `${form.customFields.length} question${form.customFields.length !== 1 ? 's' : ''}` }}
                        </p>
                    </div>
                    <AppButton size="sm" variant="ghost" @click="addField">
                        <PlusIcon class="w-4 h-4 mr-1" /> Add Question
                    </AppButton>
                </div>

                <div v-if="form.customFields.length" class="divide-y divide-mun-gray-100">
                    <div v-for="(field, idx) in form.customFields" :key="field.fieldId"
                        class="px-6 py-4 hover:bg-mun-gray-50/50 transition-colors">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-start gap-3 flex-1 min-w-0">
                                <!-- Order handle -->
                                <div class="flex flex-col items-center gap-0.5 pt-1">
                                    <button @click="moveField(idx, -1)" :disabled="idx === 0"
                                        class="text-mun-gray-300 hover:text-mun-gray-500 disabled:opacity-30 transition-colors">
                                        <ChevronUpIcon class="w-4 h-4" />
                                    </button>
                                    <span class="text-xs font-mono text-mun-gray-400">{{ idx + 1 }}</span>
                                    <button @click="moveField(idx, 1)" :disabled="idx === form.customFields.length - 1"
                                        class="text-mun-gray-300 hover:text-mun-gray-500 disabled:opacity-30 transition-colors">
                                        <ChevronDownIcon class="w-4 h-4" />
                                    </button>
                                </div>

                                <!-- Field content -->
                                <div v-if="editingFieldId !== field.fieldId" class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <p class="text-sm font-medium text-mun-gray-900">{{ field.label }}</p>
                                        <span v-if="field.required"
                                            class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-600">Required</span>
                                    </div>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span
                                            class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-mun-gray-100 text-mun-gray-500 uppercase">{{
                                            field.type }}</span>
                                        <span v-if="field.placeholder" class="text-xs text-mun-gray-400">{{
                                            field.placeholder }}</span>
                                    </div>
                                    <div v-if="field.type === 'select' && field.options?.length"
                                        class="flex flex-wrap gap-1 mt-1.5">
                                        <span v-for="opt in field.options" :key="opt"
                                            class="px-2 py-0.5 text-xs bg-mun-gray-100 text-mun-gray-600 rounded">{{ opt
                                            }}</span>
                                    </div>
                                </div>

                                <!-- Edit mode -->
                                <div v-else class="flex-1 space-y-3">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-xs text-mun-gray-500 mb-1">Label</label>
                                            <input v-model="editingField.label" type="text" class="input-field text-sm"
                                                placeholder="Question label..." />
                                        </div>
                                        <div>
                                            <label class="block text-xs text-mun-gray-500 mb-1">Type</label>
                                            <select v-model="editingField.type" class="input-field text-sm">
                                                <option value="text">Short Text</option>
                                                <option value="textarea">Long Text</option>
                                                <option value="select">Dropdown</option>
                                                <option value="file">File Upload</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="block text-xs text-mun-gray-500 mb-1">Placeholder</label>
                                            <input v-model="editingField.placeholder" type="text"
                                                class="input-field text-sm" placeholder="Placeholder text..." />
                                        </div>
                                        <div class="flex items-end">
                                            <label class="flex items-center gap-2 cursor-pointer py-2">
                                                <input type="checkbox" v-model="editingField.required"
                                                    class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                                <span class="text-sm text-mun-gray-700">Required</span>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- Select options -->
                                    <div v-if="editingField.type === 'select'" class="space-y-2">
                                        <label class="block text-xs text-mun-gray-500">Options</label>
                                        <div v-for="(opt, optIdx) in editingField.options" :key="optIdx"
                                            class="flex items-center gap-2">
                                            <input v-model="editingField.options[optIdx]" type="text"
                                                class="input-field text-sm flex-1"
                                                :placeholder="`Option ${optIdx + 1}`" />
                                            <button @click="editingField.options.splice(optIdx, 1)"
                                                class="p-1 text-mun-gray-400 hover:text-red-500 transition-colors">
                                                <XMarkIcon class="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button @click="editingField.options.push('')"
                                            class="text-xs text-mun-blue hover:text-mun-blue-700 font-medium">+ Add
                                            option</button>
                                    </div>

                                    <div class="flex gap-2">
                                        <AppButton size="sm" @click="saveField">Save</AppButton>
                                        <AppButton size="sm" variant="ghost" @click="cancelEditField">Cancel</AppButton>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div v-if="editingFieldId !== field.fieldId" class="flex items-center gap-1 flex-shrink-0">
                                <button @click="startEditField(field)"
                                    class="p-1.5 text-mun-gray-400 hover:text-mun-blue transition-colors rounded-lg hover:bg-mun-blue-50">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                                <button @click="removeField(idx)"
                                    class="p-1.5 text-mun-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="px-6 py-10 text-center">
                    <DocumentPlusIcon class="w-10 h-10 text-mun-gray-300 mx-auto mb-2" />
                    <p class="text-sm text-mun-gray-400">Add questions that applicants must answer.</p>
                </div>
            </div>

            <!-- Bottom save bar -->
            <div class="flex items-center justify-end gap-3 pt-2">
                <AppButton size="md" @click="saveForm" :disabled="isSaving">
                    {{ isSaving ? 'Saving...' : 'Save All Changes' }}
                </AppButton>
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
    LinkIcon, PlusIcon, MinusIcon, PencilIcon, TrashIcon,
    XMarkIcon, ChevronUpIcon, ChevronDownIcon, DocumentPlusIcon
} from '@heroicons/vue/24/outline'

defineProps({
    embedded: { type: Boolean, default: false }
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)

const isLoading = ref(true)
const isSaving = ref(false)
const copied = ref(false)
const eventData = ref(null)
const editingFieldId = ref(null)
const editingField = reactive({ label: '', type: 'text', placeholder: '', required: false, options: [] })

// Default pipeline stages (all possible stages)
const ALL_STAGES = [
    { stage: 'form_review', order: 1, isActive: true },
    { stage: 'interview', order: 2, isActive: false },
    { stage: 'payment', order: 3, isActive: false },
    { stage: 'final_decision', order: 4, isActive: true },
]

const stageDescriptions = {
    form_review: 'Moderators review submitted applications',
    interview: 'Schedule and conduct interviews with applicants',
    payment: 'Verify participation fee payment',
    final_decision: 'Make final accept or reject decision',
}

const form = reactive({
    status: 'draft',
    committeePreferenceCount: 3,
    pipelineStages: [],
    customFields: [],
})

const publicUrl = computed(() => {
    if (!route.params.orgSlug || !route.params.eventSlug) return null
    const base = window.location.origin
    return `${base}/${route.params.orgSlug}/${route.params.eventSlug}/register`
})

const formatStage = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''

const copyPublicUrl = async () => {
    try {
        await navigator.clipboard.writeText(publicUrl.value)
        copied.value = true
        setTimeout(() => copied.value = false, 2000)
    } catch { /* ignore */ }
}

// Reorder stages: active ones get sequential order numbers
const reorderStages = () => {
    let order = 1
    for (const stage of form.pipelineStages) {
        if (stage.isActive) {
            stage.order = order++
        }
    }
}

// Custom field management
const addField = () => {
    const id = `custom_${form.customFields.length + 1}_${Date.now()}`
    form.customFields.push({
        fieldId: id,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: [],
        order: form.customFields.length + 1,
    })
    startEditField(form.customFields[form.customFields.length - 1])
}

const startEditField = (field) => {
    editingFieldId.value = field.fieldId
    Object.assign(editingField, {
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || '',
        required: field.required,
        options: field.type === 'select' ? [...(field.options || [])] : [],
    })
}

const saveField = () => {
    if (!editingField.label.trim()) {
        toast.error('Question label is required')
        return
    }
    if (editingField.type === 'select') {
        const validOptions = editingField.options.filter(o => o.trim())
        if (validOptions.length < 2) {
            toast.error('Dropdown needs at least 2 options')
            return
        }
        editingField.options = validOptions
    }

    const idx = form.customFields.findIndex(f => f.fieldId === editingFieldId.value)
    if (idx !== -1) {
        form.customFields[idx].label = editingField.label.trim()
        form.customFields[idx].type = editingField.type
        form.customFields[idx].placeholder = editingField.placeholder.trim()
        form.customFields[idx].required = editingField.required
        form.customFields[idx].options = editingField.type === 'select' ? [...editingField.options] : []
    }
    editingFieldId.value = null
}

const cancelEditField = () => {
    // If it's a new empty field, remove it
    const idx = form.customFields.findIndex(f => f.fieldId === editingFieldId.value)
    if (idx !== -1 && !form.customFields[idx].label.trim()) {
        form.customFields.splice(idx, 1)
    }
    editingFieldId.value = null
}

const removeField = (idx) => {
    form.customFields.splice(idx, 1)
    // Update order
    form.customFields.forEach((f, i) => f.order = i + 1)
}

const moveField = (idx, direction) => {
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= form.customFields.length) return
    const temp = form.customFields[idx]
    form.customFields[idx] = form.customFields[newIdx]
    form.customFields[newIdx] = temp
    // Update order
    form.customFields.forEach((f, i) => f.order = i + 1)
}

// Load
const loadForm = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        // Load event first
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (!eventRes.data.success) return
        eventData.value = eventRes.data.event

        // Try loading existing form
        try {
            const res = await apiMethods.registration.getForm(orgId.value, eventData.value._id)
            if (res.data.success && res.data.form) {
                const f = res.data.form
                form.status = f.status || 'draft'
                form.committeePreferenceCount = f.committeePreferenceCount || 3
                form.customFields = f.customFields || []

                // Merge saved pipeline stages with ALL_STAGES to ensure all options show
                form.pipelineStages = ALL_STAGES.map(def => {
                    const saved = f.pipelineStages?.find(s => s.stage === def.stage)
                    return saved ? { ...def, ...saved } : { ...def }
                })
                return
            }
        } catch (e) {
            if (e.response?.status !== 404) throw e
        }

        // No existing form — use defaults
        form.pipelineStages = ALL_STAGES.map(s => ({ ...s }))
    } catch (e) {
        console.error('Failed to load form:', e)
        toast.error('Failed to load registration form')
    } finally {
        isLoading.value = false
    }
}

// Save
const saveForm = async () => {
    if (!eventData.value) return
    isSaving.value = true
    try {
        // Validate custom fields before sending
        for (const field of form.customFields) {
            if (!field.label.trim()) {
                toast.error('All questions must have a label')
                return
            }
        }

        reorderStages()

        const res = await apiMethods.registration.upsertForm(orgId.value, eventData.value._id, {
            status: form.status,
            committeePreferenceCount: form.committeePreferenceCount,
            pipelineStages: form.pipelineStages,
            customFields: form.customFields,
        })

        if (res.data.success) {
            toast.success(res.data.message || 'Form saved')
        }
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save form')
    } finally {
        isSaving.value = false
    }
}

onMounted(() => loadForm())
</script>