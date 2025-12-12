<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
        @click="$emit('close')">
        <div class="max-w-7xl w-full bg-gray-900 rounded-lg overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span class="text-blue-900 text-2xl">🗳️</span>
                    </div>
                    <div class="text-white">
                        <h2 class="text-2xl font-bold">{{ voting.title }}</h2>
                        <p class="text-blue-200 text-sm">{{ getVoteTypeLabel(voting.votingType) }}</p>
                    </div>
                </div>
                <button @click="$emit('close')"
                    class="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>

            <!-- Countries Grid -->
            <div class="bg-black p-6 max-h-[70vh] overflow-y-auto">
                <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 text-white">
                    <div v-for="voter in sortedVoters" :key="voter.country" :class="[
                        'px-3 py-2 rounded text-sm font-medium flex items-center space-x-2 border-2',
                        getVoteBackgroundClass(voter.vote),
                        getVoteBorderClass(voter.vote)
                    ]">
                        <component :is="getVoteIcon(voter.vote)" class="w-4 h-4 flex-shrink-0" />
                        <span class="truncate">{{ voter.country }}</span>
                    </div>
                </div>
            </div>

            <!-- Results Bar -->
            <div class="bg-gray-900 px-6 py-4 border-t border-gray-700">
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <!-- For -->
                    <div class="bg-green-900 bg-opacity-50 border-2 border-green-500 rounded-lg p-4 text-center">
                        <div class="flex items-center justify-center space-x-2 mb-2">
                            <CheckCircleIcon class="w-5 h-5 text-green-400" />
                            <span class="text-green-400 text-sm font-medium uppercase">In Favour</span>
                        </div>
                        <div class="text-4xl font-bold text-white">{{ results.for || 0 }}</div>
                    </div>

                    <!-- Against -->
                    <div class="bg-red-900 bg-opacity-50 border-2 border-red-500 rounded-lg p-4 text-center">
                        <div class="flex items-center justify-center space-x-2 mb-2">
                            <XCircleIcon class="w-5 h-5 text-red-400" />
                            <span class="text-red-400 text-sm font-medium uppercase">Against</span>
                        </div>
                        <div class="text-4xl font-bold text-white">{{ results.against || 0 }}</div>
                    </div>

                    <!-- Abstain -->
                    <div class="bg-yellow-900 bg-opacity-50 border-2 border-yellow-500 rounded-lg p-4 text-center">
                        <div class="flex items-center justify-center space-x-2 mb-2">
                            <MinusCircleIcon class="w-5 h-5 text-yellow-400" />
                            <span class="text-yellow-400 text-sm font-medium uppercase">Abstention</span>
                        </div>
                        <div class="text-4xl font-bold text-white">{{ results.abstain || 0 }}</div>
                    </div>
                </div>

                <!-- Final Result -->
                <div v-if="voting.status === 'completed'" class="text-center pt-4 border-t border-gray-700">
                    <div :class="[
                        'inline-flex items-center space-x-3 px-6 py-3 rounded-lg text-xl font-bold',
                        voting.results?.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    ]">
                        <component :is="voting.results?.passed ? CheckCircleIcon : XCircleIcon" class="w-8 h-8" />
                        <span>{{ voting.results?.passed ? 'MOTION PASSED' : 'MOTION FAILED' }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircleIcon, XCircleIcon, MinusCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

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
    return props.voting.results || { for: 0, against: 0, abstain: 0 }
})

const sortedVoters = computed(() => {
    const voters = props.voting.eligibleVoters?.map(voter => {
        const vote = props.voting.votes?.find(v => v.country === voter.country)
        return {
            country: voter.country,
            vote: vote?.vote || null
        }
    }) || []

    return voters.sort((a, b) => a.country.localeCompare(b.country))
})

const getVoteBackgroundClass = (vote) => {
    if (!vote) return 'bg-gray-700 bg-opacity-50'
    switch (vote) {
        case 'for': return 'bg-green-600 bg-opacity-80'
        case 'against': return 'bg-red-600 bg-opacity-80'
        case 'abstain': return 'bg-yellow-600 bg-opacity-80'
        default: return 'bg-gray-700 bg-opacity-50'
    }
}

const getVoteBorderClass = (vote) => {
    if (!vote) return 'border-gray-600'
    switch (vote) {
        case 'for': return 'border-green-400'
        case 'against': return 'border-red-400'
        case 'abstain': return 'border-yellow-400'
        default: return 'border-gray-600'
    }
}

const getVoteIcon = (vote) => {
    switch (vote) {
        case 'for': return CheckCircleIcon
        case 'against': return XCircleIcon
        case 'abstain': return MinusCircleIcon
        default: return MinusCircleIcon
    }
}

const getVoteTypeLabel = (type) => {
    const labels = {
        'simple': 'Simple Majority Vote',
        'rollCall': 'Roll Call Vote',
        'secretBallot': 'Secret Ballot'
    }
    return labels[type] || type
}
</script>