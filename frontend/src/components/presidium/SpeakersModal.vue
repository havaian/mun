<!-- frontend/src/components/presidium/SpeakersModal.vue -->
<template>
    <Teleport to="body">
        <transition enter-active-class="transition ease-out duration-300" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    @click="$emit('update:modelValue', false)" />

                <!-- Modal -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <div class="relative w-full max-w-5xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
                        @click.stop>
                        <!-- Header -->
                        <div class="bg-white px-6 py-4 border-b border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-mun-gray-900">
                                        Speaker Management
                                    </h3>
                                    <p class="text-sm text-mun-gray-500 mt-1">
                                        Manage the speakers list and current speaker
                                    </p>
                                </div>

                                <div class="flex items-center space-x-4">
                                    <!-- Current Speaker Info -->
                                    <div v-if="currentSpeaker" class="current-speaker-info">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                            <span class="text-sm font-medium text-green-600">
                                                Speaking: {{ currentSpeaker.countryName }}
                                            </span>
                                        </div>
                                    </div>

                                    <button @click="$emit('update:modelValue', false)"
                                        class="text-mun-gray-400 hover:text-mun-gray-600 transition-colors">
                                        <XMarkIcon class="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Content Grid -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 divide-x divide-mun-gray-200">
                            <!-- Left: Speakers Queue -->
                            <div class="speakers-queue p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-md font-medium text-mun-gray-900">
                                        Speakers Queue ({{ speakersList.length }})
                                    </h4>

                                    <div class="flex items-center space-x-2">
                                        <button @click="clearSpeakersList"
                                            :disabled="speakersList.length === 0 || isUpdating"
                                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50">
                                            <TrashIcon class="w-3 h-3 mr-1" />
                                            Clear List
                                        </button>

                                        <button @click="shuffleSpeakers"
                                            :disabled="speakersList.length < 2 || isUpdating"
                                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-mun-gray-300 text-mun-gray-700 bg-white hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                            <ArrowPathIcon class="w-3 h-3 mr-1" />
                                            Shuffle
                                        </button>
                                    </div>
                                </div>

                                <!-- Speakers List -->
                                <div class="speakers-list space-y-2 max-h-80 overflow-y-auto">
                                    <div v-for="(speaker, index) in speakersList" :key="speaker.email"
                                        class="speaker-item" :class="getSpeakerItemClasses(speaker, index)"
                                        draggable="true" @dragstart="handleDragStart(index)" @dragover.prevent
                                        @drop="handleDrop(index)">
                                        <div class="flex items-center justify-between">
                                            <!-- Speaker Info -->
                                            <div class="flex items-center space-x-3">
                                                <!-- Position number -->
                                                <div class="position-number"
                                                    :class="getPositionNumberClasses(speaker, index)">
                                                    {{ index + 1 }}
                                                </div>

                                                <!-- Flag and name -->
                                                <CountryFlag :country-name="speaker.countryName"
                                                    :country-code="speaker.countryCode" size="small"
                                                    :show-status="false" />

                                                <div>
                                                    <div class="font-medium text-mun-gray-900">
                                                        {{ speaker.countryName }}
                                                    </div>
                                                    <div class="text-xs text-mun-gray-500">
                                                        Added {{ formatRelativeTime(speaker.addedAt) }}
                                                        <span v-if="speaker.hasSpoken" class="ml-2 text-green-600">•
                                                            Spoken</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Actions -->
                                            <div class="flex items-center space-x-1">
                                                <!-- Set as current speaker -->
                                                <button v-if="!speaker.speaking && !speaker.hasSpoken"
                                                    @click="setCurrentSpeaker(speaker)" :disabled="isUpdating"
                                                    class="inline-flex items-center p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                                    title="Set as current speaker">
                                                    <PlayIcon class="w-4 h-4" />
                                                </button>

                                                <!-- Move up -->
                                                <button v-if="index > 0 && !speaker.speaking && !speaker.hasSpoken"
                                                    @click="moveSpeaker(index, index - 1)" :disabled="isUpdating"
                                                    class="inline-flex items-center p-1 text-mun-gray-400 hover:text-mun-gray-600 hover:bg-mun-gray-50 rounded transition-colors disabled:opacity-50"
                                                    title="Move up">
                                                    <ChevronUpIcon class="w-4 h-4" />
                                                </button>

                                                <!-- Move down -->
                                                <button
                                                    v-if="index < speakersList.length - 1 && !speaker.speaking && !speaker.hasSpoken"
                                                    @click="moveSpeaker(index, index + 1)" :disabled="isUpdating"
                                                    class="inline-flex items-center p-1 text-mun-gray-400 hover:text-mun-gray-600 hover:bg-mun-gray-50 rounded transition-colors disabled:opacity-50"
                                                    title="Move down">
                                                    <ChevronDownIcon class="w-4 h-4" />
                                                </button>

                                                <!-- Remove -->
                                                <button v-if="!speaker.speaking" @click="removeSpeaker(index)"
                                                    :disabled="isUpdating"
                                                    class="inline-flex items-center p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                    title="Remove from list">
                                                    <XMarkIcon class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Empty state -->
                                    <div v-if="speakersList.length === 0" class="empty-state text-center py-8">
                                        <UserGroupIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-4" />
                                        <p class="text-mun-gray-500">No speakers in queue</p>
                                        <p class="text-sm text-mun-gray-400">Countries will appear here when they
                                            request to speak</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Available Countries -->
                            <div class="available-countries p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-md font-medium text-mun-gray-900">
                                        Available Countries
                                    </h4>

                                    <!-- Search -->
                                    <div class="relative">
                                        <MagnifyingGlassIcon
                                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mun-gray-400" />
                                        <input v-model="searchQuery" type="text" placeholder="Search countries..."
                                            class="pl-10 pr-4 py-2 text-sm border border-mun-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mun-blue focus:border-mun-blue" />
                                    </div>
                                </div>

                                <!-- Countries Grid -->
                                <div class="countries-grid space-y-2 max-h-80 overflow-y-auto">
                                    <div v-for="country in availableCountries" :key="country.email"
                                        class="country-item flex items-center justify-between py-2 px-3 rounded-md border border-mun-gray-200 hover:bg-mun-gray-50 transition-colors">
                                        <div class="flex items-center space-x-3">
                                            <CountryFlag :country-name="country.countryName"
                                                :country-code="country.countryCode" size="small" :show-status="false" />

                                            <div>
                                                <div class="font-medium text-mun-gray-900">
                                                    {{ country.countryName }}
                                                </div>
                                                <div class="text-xs text-mun-gray-500">
                                                    {{ country.email }}
                                                </div>
                                            </div>
                                        </div>

                                        <button @click="addToSpeakersList(country)" :disabled="isUpdating"
                                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-mun-blue-300 text-mun-blue-700 bg-mun-blue-50 hover:bg-mun-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                            <PlusIcon class="w-3 h-3 mr-1" />
                                            Add to Queue
                                        </button>
                                    </div>

                                    <!-- Empty state -->
                                    <div v-if="availableCountries.length === 0" class="empty-state text-center py-8">
                                        <MagnifyingGlassIcon class="w-12 h-12 text-mun-gray-300 mx-auto mb-4" />
                                        <p class="text-mun-gray-500">No countries found</p>
                                        <p class="text-sm text-mun-gray-400">
                                            {{ searchQuery ? 'Try a different search term' : 'All countries are already in the speakers queue' }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Current Speaker Controls -->
                        <div v-if="currentSpeaker"
                            class="current-speaker-controls bg-green-50 border-t border-green-200 px-6 py-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <div class="flex items-center space-x-2">
                                        <div class="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                                        <span class="font-medium text-green-700">
                                            Currently Speaking: {{ currentSpeaker.countryName }}
                                        </span>
                                    </div>

                                    <TimerDisplay v-if="speakerTimer" :remaining-time="speakerTimer.remainingTime"
                                        :total-time="speakerTimer.duration" :is-running="speakerTimer.isRunning"
                                        :is-paused="speakerTimer.isPaused" size="small" variant="speaker"
                                        :show-header="false" :show-controls="false" />
                                </div>

                                <div class="flex items-center space-x-2">
                                    <button @click="finishCurrentSpeech" :disabled="isUpdating"
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50">
                                        <CheckIcon class="w-4 h-4 mr-1" />
                                        Finish Speech
                                    </button>

                                    <button @click="nextSpeaker" :disabled="isUpdating || nextSpeakerInQueue === null"
                                        class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-mun-blue hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                        <ChevronRightIcon class="w-4 h-4 mr-1" />
                                        Next Speaker
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="bg-mun-gray-50 px-6 py-4 border-t border-mun-gray-200">
                            <div class="flex items-center justify-between">
                                <!-- Statistics -->
                                <div class="flex items-center space-x-6 text-sm text-mun-gray-600">
                                    <span>{{ speakersList.length }} in queue</span>
                                    <span>{{ spokenCount }} have spoken</span>
                                    <span>{{ remainingSpeakers }} remaining</span>
                                </div>

                                <!-- Actions -->
                                <div class="flex items-center space-x-3">
                                    <button @click="$emit('update:modelValue', false)"
                                        class="px-4 py-2 text-sm font-medium text-mun-gray-700 bg-white border border-mun-gray-300 rounded-md hover:bg-mun-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors">
                                        Close
                                    </button>

                                    <button @click="saveSpeakersList" :disabled="isUpdating || !hasChanges"
                                        class="px-4 py-2 text-sm font-medium text-white bg-mun-blue border border-transparent rounded-md hover:bg-mun-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mun-blue transition-colors disabled:opacity-50">
                                        {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    ArrowPathIcon,
    PlayIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    PlusIcon,
    CheckIcon,
    ChevronRightIcon,
    UserGroupIcon
} from '@heroicons/vue/24/outline'
import CountryFlag from '@/components/shared/CountryFlag.vue'
import TimerDisplay from '@/components/shared/TimerDisplay.vue'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/plugins/toast'

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    sessionId: {
        type: String,
        required: true
    },
    countries: {
        type: Array,
        required: true
    },
    speakerTimer: {
        type: Object,
        default: null
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'speakers-updated', 'speaker-changed'])

const sessionStore = useSessionStore()
const toast = useToast()

// State
const isUpdating = ref(false)
const searchQuery = ref('')
const hasChanges = ref(false)
const draggedIndex = ref(null)

// Local speakers list copy for editing
const speakersList = ref([])

// Computed
const currentSpeaker = computed(() => {
    return speakersList.value.find(speaker => speaker.speaking) || null
})

const nextSpeakerInQueue = computed(() => {
    return speakersList.value.find(speaker => !speaker.hasSpoken && !speaker.speaking) || null
})

const spokenCount = computed(() => {
    return speakersList.value.filter(speaker => speaker.hasSpoken).length
})

const remainingSpeakers = computed(() => {
    return speakersList.value.filter(speaker => !speaker.hasSpoken && !speaker.speaking).length
})

const availableCountries = computed(() => {
    const speakerEmails = speakersList.value.map(s => s.email)
    let available = props.countries.filter(country => !speakerEmails.includes(country.email))

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        available = available.filter(country =>
            country.countryName.toLowerCase().includes(query) ||
            country.email.toLowerCase().includes(query)
        )
    }

    return available
})

// Methods
const getSpeakerItemClasses = (speaker, index) => {
    const base = 'speaker-item p-3 rounded-md border transition-colors cursor-move'

    if (speaker.speaking) {
        return `${base} border-green-300 bg-green-50`
    }

    if (speaker.hasSpoken) {
        return `${base} border-mun-gray-200 bg-mun-gray-50 opacity-75`
    }

    if (index === 0) {
        return `${base} border-mun-blue-300 bg-mun-blue-50`
    }

    return `${base} border-mun-gray-200 bg-white hover:bg-mun-gray-50`
}

const getPositionNumberClasses = (speaker, index) => {
    const base = 'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold'

    if (speaker.speaking) {
        return `${base} bg-green-500 text-white`
    }

    if (speaker.hasSpoken) {
        return `${base} bg-mun-gray-400 text-white`
    }

    if (index === 0) {
        return `${base} bg-mun-blue text-white`
    }

    return `${base} bg-mun-gray-200 text-mun-gray-600`
}

const addToSpeakersList = (country) => {
    const newSpeaker = {
        email: country.email,
        countryName: country.countryName,
        countryCode: country.countryCode,
        speaking: false,
        hasSpoken: false,
        addedAt: new Date(),
        position: speakersList.value.length + 1
    }

    speakersList.value.push(newSpeaker)
    hasChanges.value = true

    toast.success(`${country.countryName} added to speakers queue`)
}

const removeSpeaker = (index) => {
    const speaker = speakersList.value[index]
    speakersList.value.splice(index, 1)
    hasChanges.value = true

    toast.info(`${speaker.countryName} removed from speakers queue`)
}

const moveSpeaker = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= speakersList.value.length) return

    const [speaker] = speakersList.value.splice(fromIndex, 1)
    speakersList.value.splice(toIndex, 0, speaker)
    hasChanges.value = true
}

const setCurrentSpeaker = async (speaker) => {
    try {
        isUpdating.value = true

        // Clear current speaker
        speakersList.value.forEach(s => {
            s.speaking = false
        })

        // Set new current speaker
        const speakerIndex = speakersList.value.findIndex(s => s.email === speaker.email)
        if (speakerIndex >= 0) {
            speakersList.value[speakerIndex].speaking = true

            // Move to front of queue if not already
            if (speakerIndex > 0) {
                moveSpeaker(speakerIndex, 0)
            }
        }

        await sessionStore.setCurrentSpeaker(props.sessionId, speaker.email)

        emit('speaker-changed', speaker)
        toast.success(`${speaker.countryName} is now speaking`)

    } catch (error) {
        console.error('Set current speaker error:', error)
        toast.error('Failed to set current speaker')
    } finally {
        isUpdating.value = false
    }
}

const finishCurrentSpeech = async () => {
    if (!currentSpeaker.value) return

    try {
        isUpdating.value = true

        const speakerIndex = speakersList.value.findIndex(s => s.speaking)
        if (speakerIndex >= 0) {
            speakersList.value[speakerIndex].speaking = false
            speakersList.value[speakerIndex].hasSpoken = true
            speakersList.value[speakerIndex].spokeAt = new Date()
        }

        // Auto-advance to next speaker if available
        if (nextSpeakerInQueue.value) {
            await setCurrentSpeaker(nextSpeakerInQueue.value)
        } else {
            await sessionStore.setCurrentSpeaker(props.sessionId, null)
            emit('speaker-changed', null)
        }

        toast.success('Speech finished')

    } catch (error) {
        console.error('Finish speech error:', error)
        toast.error('Failed to finish speech')
    } finally {
        isUpdating.value = false
    }
}

const nextSpeaker = async () => {
    if (!nextSpeakerInQueue.value) return

    await finishCurrentSpeech()
}

const clearSpeakersList = () => {
    speakersList.value = []
    hasChanges.value = true
    toast.info('Speakers list cleared')
}

const shuffleSpeakers = () => {
    // Only shuffle speakers who haven't spoken yet
    const unspokenSpeakers = speakersList.value.filter(s => !s.hasSpoken && !s.speaking)
    const spokenSpeakers = speakersList.value.filter(s => s.hasSpoken || s.speaking)

    // Shuffle unspoken speakers
    for (let i = unspokenSpeakers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unspokenSpeakers[i], unspokenSpeakers[j]] = [unspokenSpeakers[j], unspokenSpeakers[i]]
    }

    speakersList.value = [...spokenSpeakers, ...unspokenSpeakers]
    hasChanges.value = true

    toast.success('Speakers list shuffled')
}

const saveSpeakersList = async () => {
    try {
        isUpdating.value = true

        await sessionStore.updateSpeakerList(props.sessionId, speakersList.value)

        hasChanges.value = false
        emit('speakers-updated', speakersList.value)
        toast.success('Speakers list updated')

    } catch (error) {
        console.error('Save speakers list error:', error)
        toast.error('Failed to save speakers list')
    } finally {
        isUpdating.value = false
    }
}

// Drag and drop handlers
const handleDragStart = (index) => {
    draggedIndex.value = index
}

const handleDrop = (dropIndex) => {
    if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
        moveSpeaker(draggedIndex.value, dropIndex)
    }
    draggedIndex.value = null
}

const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
}

// Initialize speakers list from store
onMounted(() => {
    speakersList.value = [...(sessionStore.speakerList || [])]
})

// Watch for external speaker list changes
watch(() => sessionStore.speakerList, (newSpeakerList) => {
    if (!hasChanges.value) {
        speakersList.value = [...(newSpeakerList || [])]
    }
}, { deep: true })
</script>

<style scoped>
.speakers-list,
.countries-grid {
    min-height: 200px;
}

.speaker-item {
    transition: transform 0.2s ease;
}

.speaker-item:hover {
    transform: translateY(-1px);
}

.position-number {
    flex-shrink: 0;
}

.current-speaker-info {
    background: rgba(34, 197, 94, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(34, 197, 94, 0.2);
}

@media (max-width: 1024px) {
    .grid.lg\\:grid-cols-2 {
        grid-template-columns: 1fr;
    }

    .divide-x {
        border-left: none;
        border-right: none;
    }

    .available-countries {
        border-top: 1px solid rgb(229 231 235);
    }
}
</style>