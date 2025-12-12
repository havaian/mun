<template>
    <div v-if="show" class="fixed inset-0 bg-black z-50 flex flex-col" @click="$emit('close')">
        <!-- Voting Board - Fullscreen -->
        <div id="voting-board-print" class="flex flex-col h-full bg-black text-white" @click.stop>
            <!-- Header Bar - Pink/Magenta -->
            <div class="bg-pink-500 px-8 py-2 flex items-center justify-between flex-shrink-0">
                <div class="text-2xl font-bold text-black">Voting Started</div>
                <div class="text-2xl font-bold text-black">{{ formatDate(voting.startedAt || voting.createdAt) }}</div>
                <div class="text-2xl font-bold font-mono text-black">{{ formatTime(voting.startedAt || voting.createdAt)
                    }}
                </div>
                <button @click="$emit('close')"
                    class="ml-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Close
                </button>
            </div>

            <!-- Title Section -->
            <div class="px-8 py-3 border-b border-gray-700 flex-shrink-0">
                <div class="text-xl font-bold mb-1">{{ voting.subjectType?.toUpperCase() || 'ITEM' }} - {{ voting.title
                    }}</div>
                <div v-if="voting.description" class="text-lg text-gray-300">{{ voting.description }}</div>
            </div>

            <!-- Countries Grid - Takes remaining space -->
            <div class="flex-1 px-8 py-4 overflow-hidden">
                <div class="h-full grid grid-cols-6 gap-x-3 gap-y-1 content-start">
                    <div v-for="voter in sortedVoters" :key="voter.country" class="flex items-center space-x-2 text-sm">
                        <!-- Vote Icon -->
                        <span class="w-4 h-4 flex-shrink-0">
                            <!-- In Favour -->
                            <div v-if="voter.vote === 'for'"  class="w-4 h-4 flex items-center space-x-3 bg-[#00ff00]">
                                <PlusIcon class="w-4 h-4 text-white stroke-[3]" />
                            </div>
                            <!-- Against -->
                            <div v-else-if="voter.vote === 'against'"  class="w-4 h-4 flex items-center space-x-3 bg-[#ff0000]">
                                <MinusIcon class="w-4 h-4 text-white stroke-[3]" />
                            </div>
                            <!-- Abstention -->
                            <div v-else-if="voter.vote === 'abstain'"  class="w-4 h-4 flex items-center space-x-3 bg-[#ffff00]">
                                <XMarkIcon class="w-4 h-4 text-black stroke-[3]" />
                            </div>
                            <span v-else class="text-gray-600 text-lg">○</span>
                        </span>
                        <!-- Country Name -->
                        <span class="truncate uppercase font-medium">{{ voter.country }}</span>
                    </div>
                </div>
            </div>

            <!-- Results Bar - Fixed height -->
            <div class="bg-gray-900 px-8 py-4 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
                <!-- In Favour -->
                <div class="flex items-center space-x-3 px-6 py-3">
                    <div class="p-1  bg-[#00ff00]">
                        <PlusIcon class="w-8 h-8 text-white stroke-[3]" />
                    </div>
                    <div class="p-1 text-3xl bg-[#00ff00] font-bold text-black">IN FAVOUR: {{ results.for }}</div>
                </div>

                <!-- Against -->
                <div class="flex items-center space-x-3 px-6 py-3">
                    <div class="p-1  bg-[#ff0000]">
                        <MinusIcon class="w-8 h-8 text-white stroke-[3]" />
                    </div>
                    <div class="p-1 text-3xl bg-[#ff0000] font-bold text-black">AGAINST:{{ results.against }}</div>
                </div>

                <!-- Abstention -->
                <div class="flex items-center space-x-3 px-6 py-3">
                    <div class="p-1  bg-[#ffff00]">
                        <XMarkIcon class="w-8 h-8 text-black stroke-[3]" />
                    </div>
                    <div class="p-1 text-3xl bg-[#ffff00] font-bold text-black">ABSTENTION:{{ results.abstain }}</div>
                </div>

                <!-- UN Logo -->
                <img src="/un-logo.svg" alt="UN" class="h-24 w-24 ml-8" />
            </div>

            <!-- Final Result Banner (if completed) -->
            <div v-if="voting.status === 'completed'" :class="[
                'px-8 py-4 text-center text-3xl font-bold flex-shrink-0',
                voting.results?.passed ? 'bg-green-600 text-black' : 'bg-red-600 text-black'
            ]">
                {{ voting.results?.passed ? '✓ MOTION ADOPTED' : '✗ MOTION NOT ADOPTED' }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, XMarkIcon, MinusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    voting: {
        type: Object,
        required: true
    }
})

defineEmits(['close'])

const results = computed(() => {
    if (props.voting.status === 'completed' && props.voting.results) {
        return {
            for: props.voting.results.votesFor || 0,
            against: props.voting.results.votesAgainst || 0,
            abstain: props.voting.results.abstentions || 0
        }
    }
    return {
        for: props.voting.results?.for || 0,
        against: props.voting.results?.against || 0,
        abstain: props.voting.results?.abstain || 0
    }
})

const sortedVoters = computed(() => {
    const eligibleVoters = Array.isArray(props.voting.eligibleVoters)
        ? props.voting.eligibleVoters
        : []

    const voters = eligibleVoters.map(voter => {
        const vote = props.voting.votes?.find(v => v.country === voter.country)
        return {
            country: voter.country,
            vote: vote?.vote || null
        }
    })

    return voters.sort((a, b) => a.country.localeCompare(b.country))
})

const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    })
}
</script>