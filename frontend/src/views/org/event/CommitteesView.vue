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
                                <span class="text-xs text-mun-gray-300">·</span>
                                <span class="text-xs text-mun-gray-400">{{ (committee.delegatesCount || 0) +
                                    (committee.presidiumCount || 0) }} members</span>
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
                        <AppButton v-if="canManage" variant="ghost" size="sm" @click="toggleMembers(committee._id)">
                            <UserGroupIcon class="w-4 h-4" />
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

                <!-- Expandable members section -->
                <div v-if="expandedCommittees[committee._id]" class="mt-3 pt-3 border-t border-mun-gray-100">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wide">
                            Members
                            <span v-if="committeeMembers[committee._id]?.length"
                                class="text-mun-gray-400 font-normal">({{ committeeMembers[committee._id].length
                                }})</span>
                        </h4>
                        <button v-if="canManage" @click="openAddMember(committee)"
                            class="text-xs text-mun-blue hover:text-mun-blue-700 font-medium">
                            + Add
                        </button>
                    </div>

                    <!-- Loading -->
                    <div v-if="loadingMembers[committee._id]" class="py-3 text-center">
                        <LoadingSpinner class="w-5 h-5 mx-auto" />
                    </div>

                    <!-- Empty -->
                    <p v-else-if="!committeeMembers[committee._id]?.length" class="text-xs text-mun-gray-400 py-2">
                        No members assigned yet.
                    </p>

                    <!-- Member rows -->
                    <div v-else class="space-y-1.5 max-h-60 overflow-y-auto">
                        <div v-for="m in committeeMembers[committee._id]" :key="m._id" @click="openMemberDetail(m)"
                            class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-mun-gray-50/80 cursor-pointer group">
                            <div class="flex items-center space-x-2.5 min-w-0">
                                <div :class="[
                                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                                    memberAvatarClass(m.role)
                                ]">
                                    {{ (m.user?.firstName?.[0] || '') + (m.user?.lastName?.[0] || '') }}
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-mun-gray-800 truncate">
                                        {{ m.user?.firstName }} {{ m.user?.lastName }}
                                    </p>
                                    <div class="flex items-center space-x-1.5">
                                        <span :class="memberRoleBadge(m.role)">{{ formatMemberRole(m.role) }}</span>
                                        <template v-if="m.country?.name">
                                            <span class="text-mun-gray-300">·</span>
                                            <div class="flex items-center space-x-1">
                                                <CountryFlag :country-name="m.country.name"
                                                    :country-code="m.country.code" size="small" variant="bordered" />
                                                <span class="text-xs text-mun-gray-500">{{ m.country.name }}</span>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                            <button v-if="canManage && m.status === 'active'"
                                @click.stop="confirmRemoveMember(m, committee)"
                                class="p-1 text-mun-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                                title="Remove">
                                <XMarkIcon class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
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

        <!-- Country Management Modal (full-featured, client-side search) -->
        <CountryManagementModal v-model="showCountryModal" :committee="countryManagerCommittee" :org-id="orgId"
            :event-id="eventId" @saved="handleCountrySaved" />

        <!-- =============================================
             ADD MEMBER MODAL
             ============================================= -->
        <ModalWrapper :modelValue="showAddMemberModal" @close="closeAddMember" :showDefaultFooter="false" size="lg">
            <template #title>Add Member to {{ addMemberCommittee?.acronym || addMemberCommittee?.name }}</template>
            <template #default>
                <div class="space-y-4">
                    <!-- User search -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Search User *</label>
                        <input v-model="memberSearchQuery" type="text" class="input-field"
                            placeholder="Search by name or email (min 2 chars)..." @input="debouncedMemberSearch" />
                        <!-- Search results dropdown -->
                        <div v-if="memberSearching"
                            class="mt-1 border border-mun-gray-200 rounded-lg py-3 bg-white shadow-lg text-center text-sm text-mun-gray-400">
                            Searching...
                        </div>
                        <div v-else-if="memberSearchResults.length > 0 && !selectedMemberUser"
                            class="mt-1 border border-mun-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                            <button v-for="u in memberSearchResults" :key="u._id" @click="selectMemberUser(u)"
                                class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-mun-gray-50 text-left transition-colors">
                                <div>
                                    <p class="text-sm font-medium text-mun-gray-900">{{ u.firstName }} {{ u.lastName }}
                                    </p>
                                    <p class="text-xs text-mun-gray-400">{{ u.email }}</p>
                                </div>
                                <div v-if="u.existingRoles?.length" class="flex flex-wrap gap-1 ml-3">
                                    <span v-for="r in u.existingRoles" :key="r.role + r.committeeId"
                                        class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 whitespace-nowrap">
                                        {{ formatMemberRole(r.role) }}{{ r.committeeName ? ` (${r.committeeName})` : ''
                                        }}
                                    </span>
                                </div>
                            </button>
                        </div>

                        <!-- Selected user chip -->
                        <div v-if="selectedMemberUser"
                            class="mt-2 flex items-center justify-between px-3 py-2 bg-mun-gray-50 border border-mun-gray-200 rounded-lg">
                            <div>
                                <p class="text-sm font-medium text-mun-gray-900">{{ selectedMemberUser.firstName }} {{
                                    selectedMemberUser.lastName }}</p>
                                <p class="text-xs text-mun-gray-400">{{ selectedMemberUser.email }}</p>
                            </div>
                            <button @click="selectedMemberUser = null; memberSearchQuery = ''"
                                class="p-0.5 text-mun-gray-400 hover:text-red-500 rounded transition-colors">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- Role -->
                    <div>
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Role *</label>
                        <select v-model="addMemberForm.role" class="input-field">
                            <option value="">Select role...</option>
                            <optgroup label="Delegates">
                                <option value="delegate">Delegate</option>
                                <option value="observer">Observer</option>
                                <option value="expert">Expert</option>
                            </optgroup>
                            <optgroup label="Presidium">
                                <option value="presidium_chair">Chair</option>
                                <option value="presidium_cochair">Co-Chair</option>
                                <option value="presidium_expert">Expert (Presidium)</option>
                                <option value="presidium_secretary">Secretary</option>
                            </optgroup>
                        </select>
                    </div>

                    <!-- Country (delegates only) -->
                    <div v-if="addMemberForm.role === 'delegate'">
                        <label class="block text-sm font-medium text-mun-gray-700 mb-1">Country *</label>
                        <div class="relative">
                            <input v-model="memberCountrySearch" type="text" class="input-field"
                                placeholder="Search country..." @focus="showMemberCountryDropdown = true" />
                        </div>
                        <div v-if="showMemberCountryDropdown && memberCountryLoading"
                            class="mt-1 border border-mun-gray-200 rounded-lg py-3 bg-white shadow-lg text-center text-sm text-mun-gray-400">
                            Loading countries...
                        </div>
                        <div v-else-if="showMemberCountryDropdown && filteredMemberCountries.length > 0"
                            class="mt-1 border border-mun-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg">
                            <button v-for="country in filteredMemberCountries" :key="country.code"
                                @click="selectMemberCountry(country)"
                                class="w-full flex items-center px-4 py-2 hover:bg-mun-gray-50 text-left text-sm transition-colors">
                                <CountryFlag :country-name="country.name" :country-code="country.code" size="small"
                                    variant="bordered" class="mr-2" />
                                {{ country.name }}
                            </button>
                        </div>
                        <div v-else-if="showMemberCountryDropdown && !memberCountryLoading && memberCountrySearch.trim()"
                            class="mt-1 border border-mun-gray-200 rounded-lg py-3 bg-white shadow-lg text-center text-sm text-mun-gray-400">
                            No available countries found
                        </div>
                        <!-- Selected country chip -->
                        <div v-if="addMemberForm.country?.name && !showMemberCountryDropdown"
                            class="mt-2 inline-flex items-center space-x-2 px-3 py-1.5 bg-mun-gray-50 border border-mun-gray-200 rounded-lg">
                            <CountryFlag :country-name="addMemberForm.country.name"
                                :country-code="addMemberForm.country.code" size="small" variant="bordered" />
                            <span class="text-sm font-medium text-mun-gray-800">{{ addMemberForm.country.name }}</span>
                            <button @click="addMemberForm.country = { name: '', code: '' }; memberCountrySearch = ''"
                                class="ml-1 p-0.5 text-mun-gray-400 hover:text-red-500 rounded transition-colors">
                                <XMarkIcon class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3 pt-2 border-t border-mun-gray-100">
                        <AppButton variant="ghost" @click="closeAddMember">Cancel</AppButton>
                        <AppButton @click="submitAddMember" :disabled="!canSubmitMember || isAddingMember">
                            {{ isAddingMember ? 'Adding...' : 'Add Member' }}
                        </AppButton>
                    </div>
                </div>
            </template>
        </ModalWrapper>

        <!-- =============================================
             MEMBER DETAIL MODAL
             ============================================= -->
        <ModalWrapper :modelValue="showMemberDetail" @close="showMemberDetail = false" :showDefaultFooter="false"
            size="md">
            <template #title>
                {{ detailMember?.user?.firstName }} {{ detailMember?.user?.lastName }}
            </template>
            <template #default>
                <div v-if="detailMember" class="space-y-5">
                    <!-- Status + Role banner -->
                    <div class="flex items-center justify-between">
                        <span :class="memberRoleBadge(detailMember.role)">
                            {{ formatMemberRole(detailMember.role) }}
                        </span>
                        <span :class="[
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            detailMember.status === 'active' ? 'bg-green-100 text-green-700' :
                                detailMember.status === 'removed' ? 'bg-red-50 text-red-600' :
                                    'bg-mun-gray-100 text-mun-gray-600'
                        ]">
                            {{ detailMember.status }}
                        </span>
                    </div>

                    <!-- User info -->
                    <div>
                        <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wide mb-2">Person</h4>
                        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                                <span class="text-mun-gray-400">Name</span>
                                <p class="font-medium text-mun-gray-900">{{ detailMember.user?.firstName }} {{
                                    detailMember.user?.lastName }}</p>
                            </div>
                            <div>
                                <span class="text-mun-gray-400">Email</span>
                                <p class="font-medium text-mun-gray-900">{{ detailMember.user?.email }}</p>
                            </div>
                            <div v-if="detailMember.user?.institution">
                                <span class="text-mun-gray-400">Institution</span>
                                <p class="font-medium text-mun-gray-900">{{ detailMember.user.institution }}</p>
                            </div>
                            <div v-if="detailMember.user?.phone">
                                <span class="text-mun-gray-400">Phone</span>
                                <p class="font-medium text-mun-gray-900">{{ detailMember.user.phone }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Assignment info -->
                    <div>
                        <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wide mb-2">Assignment</h4>
                        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div v-if="detailMember.committee">
                                <span class="text-mun-gray-400">Committee</span>
                                <p class="font-medium text-mun-gray-900">
                                    {{ detailMember.committee.name }}
                                    <span v-if="detailMember.committee.acronym" class="text-mun-gray-400 text-xs ml-1">
                                        ({{ detailMember.committee.acronym }})
                                    </span>
                                </p>
                            </div>
                            <div v-if="detailMember.country?.name">
                                <span class="text-mun-gray-400">Country</span>
                                <div class="flex items-center space-x-1.5 mt-0.5">
                                    <CountryFlag :country-name="detailMember.country.name"
                                        :country-code="detailMember.country.code" size="small" variant="bordered" />
                                    <span class="font-medium text-mun-gray-900">{{ detailMember.country.name }}</span>
                                </div>
                            </div>
                            <div>
                                <span class="text-mun-gray-400">Source</span>
                                <p class="font-medium text-mun-gray-900">{{ formatSource(detailMember.source) }}</p>
                            </div>
                            <div v-if="detailMember.assignedBy">
                                <span class="text-mun-gray-400">Assigned By</span>
                                <p class="font-medium text-mun-gray-900">
                                    {{ detailMember.assignedBy.firstName }} {{ detailMember.assignedBy.lastName }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Timestamps -->
                    <div>
                        <h4 class="text-xs font-semibold text-mun-gray-500 uppercase tracking-wide mb-2">Timeline</h4>
                        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                                <span class="text-mun-gray-400">Added</span>
                                <p class="font-medium text-mun-gray-900">{{ formatDateTime(detailMember.createdAt) }}
                                </p>
                            </div>
                            <div v-if="detailMember.updatedAt !== detailMember.createdAt">
                                <span class="text-mun-gray-400">Last Updated</span>
                                <p class="font-medium text-mun-gray-900">{{ formatDateTime(detailMember.updatedAt) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Actions footer -->
                    <div v-if="canManage" class="flex justify-end space-x-3 pt-3 border-t border-mun-gray-100">
                        <AppButton variant="ghost" @click="showMemberDetail = false">Close</AppButton>
                        <AppButton v-if="detailMember.status === 'active'" variant="ghost"
                            class="!text-red-600 hover:!text-red-700"
                            @click="showMemberDetail = false; confirmRemoveMember(detailMember, detailMemberCommittee)">
                            Remove Member
                        </AppButton>
                    </div>
                </div>
            </template>
        </ModalWrapper>

        <!-- Remove member confirmation -->
        <ConfirmationDialog v-model="showRemoveMemberConfirm" title="Remove Member"
            :message="`Remove ${removingMember?.user?.firstName} ${removingMember?.user?.lastName} from ${removingMemberCommittee?.acronym || removingMemberCommittee?.name}?`"
            type="danger" confirmText="Remove" @confirm="executeRemoveMember"
            @cancel="showRemoveMemberConfirm = false" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'
import { useToast } from '@/plugins/toast'
import CountryManagementModal from '@/components/admin/CountryManagementModal.vue'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import {
    PlusIcon, PencilIcon, GlobeAltIcon, ChevronDownIcon,
    RectangleGroupIcon, UserGroupIcon, XMarkIcon
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
const committees = ref([])
const eventData = ref(null)
const showFormModal = ref(false)
const editingCommittee = ref(null)
const showSettings = ref(false)

// Country management modal state
const showCountryModal = ref(false)
const countryManagerCommittee = ref(null)

const eventId = computed(() => eventData.value?._id)

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

const loadData = async () => {
    if (!orgId.value) return
    isLoading.value = true
    try {
        const eventRes = await apiMethods.events.getById(orgId.value, eventSlug.value)
        if (eventRes.data.success) {
            eventData.value = eventRes.data.event
            const committeesRes = await apiMethods.committees.getAll(orgId.value, eventData.value._id)
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
            eventId: eventId.value,
        }
        if (editingCommittee.value) {
            payload.status = form.status
            await apiMethods.committees.update(orgId.value, eventId.value, editingCommittee.value._id, payload)
        } else {
            await apiMethods.committees.create(orgId.value, eventId.value, payload)
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
    countryManagerCommittee.value = committee
    showCountryModal.value = true
}

const handleCountrySaved = () => {
    showCountryModal.value = false
    countryManagerCommittee.value = null
    loadData()
}

// =============================================
// MEMBERS EXPANSION
// =============================================
const expandedCommittees = reactive({})
const committeeMembers = reactive({})
const loadingMembers = reactive({})

const PRESIDIUM_ROLES = ['presidium_chair', 'presidium_cochair', 'presidium_expert', 'presidium_secretary']

const toggleMembers = async (committeeId) => {
    if (expandedCommittees[committeeId]) {
        expandedCommittees[committeeId] = false
        return
    }
    expandedCommittees[committeeId] = true
    await fetchMembers(committeeId)
}

const fetchMembers = async (committeeId) => {
    loadingMembers[committeeId] = true
    try {
        const res = await apiMethods.participants.getAll(orgId.value, eventId.value, { committee: committeeId, status: 'all' })
        if (res.data.success) {
            committeeMembers[committeeId] = res.data.participants || []
        }
    } catch (e) {
        console.warn('Failed to load members for committee:', e)
        committeeMembers[committeeId] = []
    } finally {
        loadingMembers[committeeId] = false
    }
}

// =============================================
// ADD MEMBER MODAL
// =============================================
const showAddMemberModal = ref(false)
const addMemberCommittee = ref(null)
const selectedMemberUser = ref(null)
const memberSearchQuery = ref('')
const memberSearchResults = ref([])
const memberSearching = ref(false)
const isAddingMember = ref(false)
const memberCountrySearch = ref('')
const showMemberCountryDropdown = ref(false)
const memberCountryLoading = ref(false)
const enrichedMemberCountries = ref([])

const addMemberForm = reactive({
    role: '',
    country: { name: '', code: '' }
})

const canSubmitMember = computed(() => {
    if (!selectedMemberUser.value || !addMemberForm.role) return false
    if (addMemberForm.role === 'delegate' && (!addMemberForm.country?.name || !addMemberForm.country?.code)) return false
    return true
})

const filteredMemberCountries = computed(() => {
    const pool = enrichedMemberCountries.value
    let filtered = pool.filter(c => !c.assignedTo)
    if (memberCountrySearch.value.trim()) {
        const q = memberCountrySearch.value.toLowerCase()
        filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    }
    return filtered.slice(0, 50)
})

const openAddMember = (committee) => {
    addMemberCommittee.value = committee
    selectedMemberUser.value = null
    memberSearchQuery.value = ''
    memberSearchResults.value = []
    addMemberForm.role = ''
    addMemberForm.country = { name: '', code: '' }
    memberCountrySearch.value = ''
    enrichedMemberCountries.value = []
    showAddMemberModal.value = true
}

const closeAddMember = () => {
    showAddMemberModal.value = false
    addMemberCommittee.value = null
}

// Load enriched countries when role changes to delegate
watch(() => addMemberForm.role, async (role) => {
    addMemberForm.country = { name: '', code: '' }
    memberCountrySearch.value = ''
    enrichedMemberCountries.value = []
    if (role !== 'delegate' || !addMemberCommittee.value) return

    memberCountryLoading.value = true
    try {
        const res = await apiMethods.committees.getCountries(orgId.value, eventId.value, addMemberCommittee.value._id)
        if (res.data.success) {
            enrichedMemberCountries.value = res.data.countries || []
        }
    } catch (e) {
        // Fallback to committee's static countries
        if (addMemberCommittee.value?.countries) {
            enrichedMemberCountries.value = addMemberCommittee.value.countries.map(c => ({ ...c, assignedTo: null }))
        }
    } finally {
        memberCountryLoading.value = false
    }
})

let memberSearchTimeout = null
const debouncedMemberSearch = () => {
    clearTimeout(memberSearchTimeout)
    if (memberSearchQuery.value.trim().length < 2) {
        memberSearchResults.value = []
        return
    }
    memberSearchTimeout = setTimeout(async () => {
        memberSearching.value = true
        try {
            const res = await apiMethods.participants.searchUsers(orgId.value, eventId.value, { q: memberSearchQuery.value.trim() })
            if (res.data.success) {
                memberSearchResults.value = res.data.users || []
            }
        } catch (e) {
            console.warn('User search failed:', e)
        } finally {
            memberSearching.value = false
        }
    }, 300)
}

const selectMemberUser = (user) => {
    selectedMemberUser.value = user
    memberSearchResults.value = []
    memberSearchQuery.value = ''
}

const selectMemberCountry = (country) => {
    addMemberForm.country = { name: country.name, code: country.code }
    memberCountrySearch.value = country.name
    showMemberCountryDropdown.value = false
}

const submitAddMember = async () => {
    if (!canSubmitMember.value || !addMemberCommittee.value) return
    isAddingMember.value = true
    const committeeId = addMemberCommittee.value._id // save before close nullifies it
    try {
        await apiMethods.participants.add(orgId.value, eventId.value, {
            userId: selectedMemberUser.value._id,
            role: addMemberForm.role,
            committeeId: committeeId,
            country: addMemberForm.role === 'delegate' ? addMemberForm.country : undefined
        })
        toast.success('Member added')
        closeAddMember()
        // Auto-expand and refresh members list for that committee
        expandedCommittees[committeeId] = true
        await fetchMembers(committeeId)
        await loadData() // refresh counts
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to add member')
    } finally {
        isAddingMember.value = false
    }
}

// =============================================
// REMOVE MEMBER
// =============================================
const showRemoveMemberConfirm = ref(false)
const removingMember = ref(null)
const removingMemberCommittee = ref(null)

const confirmRemoveMember = (member, committee) => {
    removingMember.value = member
    removingMemberCommittee.value = committee
    showRemoveMemberConfirm.value = true
}

const executeRemoveMember = async () => {
    if (!removingMember.value) return
    try {
        await apiMethods.participants.remove(orgId.value, eventId.value, removingMember.value._id)
        toast.success('Member removed')
        showRemoveMemberConfirm.value = false
        // Refresh members list
        if (removingMemberCommittee.value && expandedCommittees[removingMemberCommittee.value._id]) {
            await fetchMembers(removingMemberCommittee.value._id)
        }
        await loadData() // refresh counts
    } catch (e) {
        toast.error(e.response?.data?.error || 'Failed to remove member')
    }
}

// =============================================
// MEMBER DETAIL MODAL
// =============================================
const showMemberDetail = ref(false)
const detailMember = ref(null)
const detailMemberCommittee = ref(null)

const openMemberDetail = (member) => {
    detailMember.value = member
    // Find the committee this member belongs to
    detailMemberCommittee.value = committees.value.find(c => c._id === member.committee?._id) || null
    showMemberDetail.value = true
}

// =============================================
// MEMBER FORMATTING
// =============================================
const formatMemberRole = (role) => {
    const map = {
        delegate: 'Delegate', observer: 'Observer', expert: 'Expert',
        presidium_chair: 'Chair', presidium_cochair: 'Co-Chair',
        presidium_expert: 'Expert', presidium_secretary: 'Secretary'
    }
    return map[role] || role
}

const memberRoleBadge = (role) => {
    if (PRESIDIUM_ROLES.includes(role)) return 'px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700'
    if (role === 'delegate') return 'px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700'
    if (role === 'observer') return 'px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700'
    return 'px-1.5 py-0.5 text-[10px] font-medium rounded bg-mun-gray-100 text-mun-gray-600'
}

const memberAvatarClass = (role) => {
    if (PRESIDIUM_ROLES.includes(role)) return 'bg-purple-100 text-purple-700'
    if (role === 'delegate') return 'bg-blue-100 text-blue-700'
    if (role === 'observer') return 'bg-yellow-100 text-yellow-700'
    return 'bg-mun-gray-100 text-mun-gray-600'
}

const formatDateTime = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatSource = (source) => {
    const map = {
        direct_assignment: 'Direct Assignment',
        registration_pipeline: 'Registration Pipeline',
        invitation: 'Invitation'
    }
    return map[source] || source
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