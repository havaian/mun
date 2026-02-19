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
                <h1 class="text-2xl font-bold text-mun-gray-900">Committees</h1>
                <p class="text-sm text-mun-gray-500 mt-1">Manage committees for this event</p>
            </div>
            <AppButton v-if="canManage" @click="openCreate">
                <PlusIcon class="w-4 h-4 mr-2" />
                New Committee
            </AppButton>
        </div>
        <!-- Compact action bar (embedded mode) -->
        <div v-else-if="canManage" class="flex justify-end">
            <AppButton @click="openCreate">
                <PlusIcon class="w-4 h-4 mr-2" />
                New Committee
            </AppButton>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <LoadingSpinner class="w-8 h-8" />
        </div>

        <!-- Empty -->
        <div v-else-if="committees.length === 0"
            class="bg-white rounded-xl border border-mun-gray-200 p-12 text-center">
            <RectangleGroupIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-3" />
            <p class="text-mun-gray-500">No committees yet. Create your first committee to get started.</p>
        </div>

        <!-- Committee cards -->
        <div v-else class="grid gap-4">
            <div v-for="committee in committees" :key="committee._id"
                class="bg-white rounded-xl border border-mun-gray-200 p-5 hover:border-mun-blue-200 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-4">
                        <div :class="[
                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold',
                            typeBadgeClass(committee.type)
                        ]">
                            {{ committee.acronym }}
                        </div>
                        <div class="space-y-1">
                            <h3 class="text-base font-semibold text-mun-gray-900">{{ committee.name }}</h3>
                            <p v-if="committee.topic" class="text-sm text-mun-gray-500">{{ committee.topic }}</p>
                            <div class="flex items-center flex-wrap gap-2 pt-1">
                                <span class="text-xs text-mun-gray-400">{{ committee.type }}</span>
                                <span class="text-xs text-mun-gray-300">·</span>
                                <span class="text-xs text-mun-gray-400">{{ committee.language?.toUpperCase() }}</span>
                                <span class="text-xs text-mun-gray-300">·</span>
                                <span class="text-xs text-mun-gray-400">{{ committee.countries?.length || 0 }}
                                    countries</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span :class="statusClass(committee.status)">{{ committee.status }}</span>
                        <AppButton v-if="canManage" variant="ghost" size="sm" @click="openEdit(committee)">
                            <PencilIcon class="w-4 h-4" />
                        </AppButton>
                        <AppButton v-if="canManage" variant="ghost" size="sm" @click="openCountryManager(committee)">
                            <GlobeAltIcon class="w-4 h-4" />
                        </AppButton>
                    </div>
                </div>

                <!-- Country chips preview -->
                <div v-if="committee.countries?.length" class="mt-3 flex flex-wrap gap-1">
                    <span v-for="country in committee.countries.slice(0, 10)" :key="country.code" :class="[
                        'inline-flex items-center px-2 py-0.5 text-xs rounded-full',
                        country.hasVetoRight ? 'bg-red-50 text-red-700 border border-red-200' :
                            country.isObserver ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                'bg-mun-gray-100 text-mun-gray-600'
                    ]">
                        {{ country.name }}
                    </span>
                    <span v-if="committee.countries.length > 10" class="text-xs text-mun-gray-400 self-center ml-1">
                        +{{ committee.countries.length - 10 }} more
                    </span>
                </div>

                <!-- Session link -->
                <div v-if="committee.status === 'active'" class="mt-3 pt-3 border-t border-mun-gray-100">
                    <router-link :to="{ name: 'PresidiumDashboard', params: { committeeId: committee._id } }"
                        class="text-sm text-mun-blue hover:text-mun-blue-700 font-medium">
                        Open Presidium Session →
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="showFormModal" @close="closeFormModal">
            <template #title>{{ editingCommittee ? 'Edit Committee' : 'Create Committee' }}</template>
            <template #default>
                <form @submit.prevent="handleSave" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Name</label>
                        <input v-model="form.name" type="text" required class="input-field"
                            placeholder="e.g. United Nations Security Council" />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Acronym</label>
                            <input v-model="form.acronym" type="text" required maxlength="20" class="input-field"
                                placeholder="e.g. UNSC" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Type</label>
                            <select v-model="form.type" required class="input-field">
                                <option value="GA">General Assembly (GA)</option>
                                <option value="SC">Security Council (SC)</option>
                                <option value="ECOSOC">ECOSOC</option>
                                <option value="HRC">Human Rights Council (HRC)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Topic</label>
                        <input v-model="form.topic" type="text" class="input-field"
                            placeholder="Committee discussion topic" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Description</label>
                        <textarea v-model="form.description" rows="3" class="input-field"
                            placeholder="Brief description of the committee"></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Language</label>
                            <select v-model="form.language" class="input-field">
                                <option value="en">English</option>
                                <option value="ru">Russian</option>
                                <option value="uz">Uzbek</option>
                            </select>
                        </div>
                        <div v-if="editingCommittee">
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Status</label>
                            <select v-model="form.status" class="input-field">
                                <option value="setup">Setup</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <!-- Settings accordion -->
                    <div class="border border-mun-gray-200 rounded-lg">
                        <button type="button" @click="showSettings = !showSettings"
                            class="w-full flex items-center justify-between p-3 text-sm font-medium text-mun-gray-700 hover:bg-mun-gray-50">
                            Advanced Settings
                            <ChevronDownIcon
                                :class="['w-4 h-4 transition-transform', showSettings ? 'rotate-180' : '']" />
                        </button>
                        <div v-if="showSettings" class="p-4 border-t border-mun-gray-200 space-y-4">
                            <div>
                                <p class="text-xs font-semibold text-mun-gray-500 uppercase mb-2">Voting</p>
                                <div class="space-y-2">
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" v-model="form.settings.votingSettings.requireMajority"
                                            class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                        <span class="text-sm text-mun-gray-700">Require majority</span>
                                    </label>
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" v-model="form.settings.votingSettings.allowAbstentions"
                                            class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                        <span class="text-sm text-mun-gray-700">Allow abstentions</span>
                                    </label>
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" v-model="form.settings.votingSettings.vetoEnabled"
                                            class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                        <span class="text-sm text-mun-gray-700">Enable veto</span>
                                    </label>
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" v-model="form.settings.votingSettings.secretBallot"
                                            class="rounded border-mun-gray-300 text-mun-blue focus:ring-mun-blue" />
                                        <span class="text-sm text-mun-gray-700">Secret ballot</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-mun-gray-500 uppercase mb-2">Speech</p>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs text-mun-gray-500 mb-1">Default time (sec)</label>
                                        <input type="number"
                                            v-model.number="form.settings.speechSettings.defaultSpeechTime" min="30"
                                            max="300" class="input-field text-sm" />
                                    </div>
                                    <div>
                                        <label class="block text-xs text-mun-gray-500 mb-1">Extension time (sec)</label>
                                        <input type="number" v-model.number="form.settings.speechSettings.extensionTime"
                                            min="15" max="120" class="input-field text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" type="button" @click="closeFormModal">Cancel</AppButton>
                        <AppButton type="submit" :disabled="isSaving">
                            {{ isSaving ? 'Saving...' : (editingCommittee ? 'Update' : 'Create') }}
                        </AppButton>
                    </div>
                </form>
            </template>
        </ModalWrapper>

        <!-- Country Manager Modal -->
        <ModalWrapper :showDefaultFooter="false" :modelValue="!!countryManagerCommittee"
            @close="countryManagerCommittee = null" size="lg">
            <template #title>Manage Countries — {{ countryManagerCommittee?.acronym }}</template>
            <template #default>
                <div class="space-y-4">
                    <div class="flex items-end space-x-3">
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-mun-gray-700 mb-1">Add Country</label>
                            <input v-model="countrySearch" type="text" class="input-field"
                                placeholder="Search country name..." @input="searchCountries" />
                        </div>
                    </div>

                    <div v-if="countrySearchResults.length > 0"
                        class="border border-mun-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-mun-gray-100">
                        <button v-for="country in countrySearchResults" :key="country.code" type="button"
                            @click="addCountryToCommittee(country)" :disabled="isCountryInCommittee(country.code)"
                            class="w-full flex items-center justify-between p-2 text-sm hover:bg-mun-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                            <span>{{ country.name }}</span>
                            <span v-if="isCountryInCommittee(country.code)" class="text-xs text-mun-gray-400">Already
                                added</span>
                            <PlusIcon v-else class="w-4 h-4 text-mun-blue" />
                        </button>
                    </div>

                    <div v-if="countryManagerCommittee?.type === 'SC'" class="flex space-x-2">
                        <AppButton variant="ghost" size="sm" @click="addP5Countries">Add P5 (with veto)</AppButton>
                    </div>

                    <div>
                        <p class="text-sm font-medium text-mun-gray-700 mb-2">
                            Current Countries ({{ countryManagerCommittee?.countries?.length || 0 }})
                        </p>
                        <div v-if="!countryManagerCommittee?.countries?.length"
                            class="text-sm text-mun-gray-400 py-4 text-center">No countries added yet.</div>
                        <div v-else
                            class="max-h-60 overflow-y-auto divide-y divide-mun-gray-100 border border-mun-gray-200 rounded-lg">
                            <div v-for="country in countryManagerCommittee.countries" :key="country.code"
                                class="flex items-center justify-between p-2">
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm text-mun-gray-900">{{ country.name }}</span>
                                    <span v-if="country.hasVetoRight"
                                        class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">VETO</span>
                                    <span v-if="country.isPermanentMember"
                                        class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700">P5</span>
                                    <span v-if="country.isObserver"
                                        class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-yellow-100 text-yellow-700">Observer</span>
                                </div>
                                <button type="button" @click="removeCountryFromCommittee(country.code)"
                                    class="text-mun-gray-400 hover:text-red-500 transition-colors">
                                    <XMarkIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-2">
                        <AppButton variant="ghost" @click="countryManagerCommittee = null">Close</AppButton>
                        <AppButton @click="saveCountries" :disabled="isSavingCountries">
                            {{ isSavingCountries ? 'Saving...' : 'Save Countries' }}
                        </AppButton>
                    </div>
                </div>
            </template>
        </ModalWrapper>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import {
    PlusIcon, PencilIcon, GlobeAltIcon, ChevronDownIcon,
    XMarkIcon, RectangleGroupIcon
} from '@heroicons/vue/24/outline'

defineProps({
    embedded: { type: Boolean, default: false }
})

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => authStore.activeOrganization?._id)
const eventSlug = computed(() => route.params.eventSlug)
const canManage = computed(() => authStore.isOrgAdmin || authStore.hasOrgPermission('manage_event_content'))

const isLoading = ref(true)
const isSaving = ref(false)
const isSavingCountries = ref(false)
const committees = ref([])
const eventData = ref(null)
const showFormModal = ref(false)
const editingCommittee = ref(null)
const showSettings = ref(false)

const countryManagerCommittee = ref(null)
const countrySearch = ref('')
const countrySearchResults = ref([])

const defaultSettings = () => ({
    votingSettings: { requireMajority: true, allowAbstentions: true, vetoEnabled: false, secretBallot: false },
    debateSettings: { speakersList: true, pointsOfOrder: true, rightOfReply: true },
    speechSettings: { defaultSpeechTime: 90, allowExtensions: true, maxExtensions: 1, extensionTime: 30 },
    coalitionSettings: { minCoalitionMembers: 3, resolutionDeadline: null },
    positionPaperDeadline: null,
})

const form = reactive({
    name: '', acronym: '', type: 'GA', topic: '', description: '',
    language: 'en', status: 'setup',
    settings: defaultSettings(),
})

const P5_COUNTRIES = [
    { name: 'United States', code: 'us', isPermanentMember: true, hasVetoRight: true },
    { name: 'United Kingdom', code: 'gb', isPermanentMember: true, hasVetoRight: true },
    { name: 'France', code: 'fr', isPermanentMember: true, hasVetoRight: true },
    { name: 'Russia', code: 'ru', isPermanentMember: true, hasVetoRight: true },
    { name: 'China', code: 'cn', isPermanentMember: true, hasVetoRight: true },
]

const loadData = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (eventRes.data.success) {
            eventData.value = eventRes.data.event
            const committeesRes = await apiMethods.committees.getAll({ eventId: eventData.value._id })
            if (committeesRes.data.success) {
                committees.value = committeesRes.data.committees || []
            }
        }
    } catch (e) {
        console.error('Failed to load committees:', e)
    } finally {
        isLoading.value = false
    }
}

const openCreate = () => {
    editingCommittee.value = null
    Object.assign(form, { name: '', acronym: '', type: 'GA', topic: '', description: '', language: 'en', status: 'setup' })
    form.settings = defaultSettings()
    showSettings.value = false
    showFormModal.value = true
}

const openEdit = (committee) => {
    editingCommittee.value = committee
    form.name = committee.name
    form.acronym = committee.acronym
    form.type = committee.type
    form.topic = committee.topic || ''
    form.description = committee.description || ''
    form.language = committee.language || 'en'
    form.status = committee.status || 'setup'
    form.settings = {
        ...defaultSettings(),
        ...(committee.settings || {}),
        votingSettings: { ...defaultSettings().votingSettings, ...(committee.settings?.votingSettings || {}) },
        speechSettings: { ...defaultSettings().speechSettings, ...(committee.settings?.speechSettings || {}) },
    }
    showSettings.value = false
    showFormModal.value = true
}

const closeFormModal = () => {
    showFormModal.value = false
    editingCommittee.value = null
}

const handleSave = async () => {
    isSaving.value = true
    try {
        const payload = {
            name: form.name, acronym: form.acronym, type: form.type,
            topic: form.topic || undefined, description: form.description || undefined,
            language: form.language, settings: form.settings,
        }
        if (editingCommittee.value) {
            payload.status = form.status
            await apiMethods.committees.update(editingCommittee.value._id, payload)
            toast.success('Committee updated')
        } else {
            payload.event = eventData.value._id
            await apiMethods.committees.create(payload)
            toast.success('Committee created')
        }
        closeFormModal()
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save committee')
    } finally {
        isSaving.value = false
    }
}

const openCountryManager = (committee) => {
    countryManagerCommittee.value = {
        ...committee,
        countries: JSON.parse(JSON.stringify(committee.countries || []))
    }
    countrySearch.value = ''
    countrySearchResults.value = []
}

const searchCountries = async () => {
    if (countrySearch.value.length < 2) { countrySearchResults.value = []; return }
    try {
        const res = await apiMethods.countries.search(countrySearch.value)
        countrySearchResults.value = res.data?.countries || res.data || []
    } catch (e) { countrySearchResults.value = [] }
}

const isCountryInCommittee = (code) => countryManagerCommittee.value?.countries?.some(c => c.code === code)

const addCountryToCommittee = (country) => {
    if (isCountryInCommittee(country.code)) return
    countryManagerCommittee.value.countries.push({
        name: country.name, code: country.code, flagUrl: country.flagUrl || null,
        isPermanentMember: false, hasVetoRight: false, isObserver: false, specialRole: null,
    })
    countrySearch.value = ''
    countrySearchResults.value = []
}

const addP5Countries = () => {
    for (const p5 of P5_COUNTRIES) {
        if (!isCountryInCommittee(p5.code)) {
            countryManagerCommittee.value.countries.push({ ...p5, flagUrl: null, isObserver: false, specialRole: null })
        }
    }
}

const removeCountryFromCommittee = (code) => {
    countryManagerCommittee.value.countries = countryManagerCommittee.value.countries.filter(c => c.code !== code)
}

const saveCountries = async () => {
    isSavingCountries.value = true
    try {
        await apiMethods.committees.update(countryManagerCommittee.value._id, { countries: countryManagerCommittee.value.countries })
        toast.success('Countries updated')
        countryManagerCommittee.value = null
        await loadData()
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to save countries')
    } finally {
        isSavingCountries.value = false
    }
}

const typeBadgeClass = (type) => ({
    GA: 'bg-blue-100 text-blue-700', SC: 'bg-red-100 text-red-700',
    ECOSOC: 'bg-green-100 text-green-700', HRC: 'bg-purple-100 text-purple-700',
    other: 'bg-mun-gray-100 text-mun-gray-700',
}[type] || 'bg-mun-gray-100 text-mun-gray-700')

const statusClass = (status) => ({
    setup: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600',
    active: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700',
    suspended: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700',
    completed: 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-500',
}[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-mun-gray-100 text-mun-gray-600')

onMounted(() => loadData())
</script>