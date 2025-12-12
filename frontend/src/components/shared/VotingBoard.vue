<template>
    <div v-if="show" class="fixed inset-0 bg-black z-50 flex flex-col" @click="$emit('close')">
        <!-- Print Button Overlay -->
        <div class="absolute top-4 right-4 z-10 flex space-x-2">
            <button @click="printBoard"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg">
                <PrinterIcon class="w-5 h-5" />
                <span>Print</span>
            </button>
            <button @click="$emit('close')"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-lg">
                Close
            </button>
        </div>

        <!-- Voting Board - Fullscreen -->
        <div id="voting-board-print" class="flex flex-col h-full bg-black text-white" @click.stop>
            <!-- Header Bar - Pink/Magenta -->
            <div class="bg-pink-500 px-8 py-2 flex items-center justify-between flex-shrink-0">
                <div class="text-2xl font-bold text-black">Voting Started</div>
                <div class="text-2xl font-bold text-black">{{ formatDate(voting.startedAt || voting.createdAt) }}</div>
                <div class="text-2xl font-bold font-mono text-black">{{ formatTime(voting.startedAt || voting.createdAt)
                    }}
                </div>
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
                            <svg v-if="voter.vote === 'for'" viewBox="0 0 24 24" fill="none" class="w-4 h-4">
                                <rect width="24" height="24" fill="#00FF00" />
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="black" />
                            </svg>
                            <svg v-else-if="voter.vote === 'against'" viewBox="0 0 24 24" fill="none" class="w-4 h-4">
                                <rect width="24" height="24" fill="#FF0000" />
                                <path
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                                    fill="black" />
                            </svg>
                            <svg v-else-if="voter.vote === 'abstain'" viewBox="0 0 24 24" fill="none" class="w-4 h-4">
                                <rect width="24" height="24" fill="#FFFF00" />
                                <path
                                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                                    fill="black" />
                            </svg>
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
                <div class="flex items-center space-x-3 bg-green-600 px-6 py-3">
                    <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8">
                        <rect width="24" height="24" fill="#00FF00" />
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="black" />
                    </svg>
                    <div class="text-3xl font-bold text-black">IN FAVOUR: {{ results.for }}</div>
                </div>

                <!-- Against -->
                <div class="flex items-center space-x-3 bg-red-600 px-6 py-3">
                    <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8">
                        <rect width="24" height="24" fill="#FF0000" />
                        <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                            fill="black" />
                    </svg>
                    <div class="text-3xl font-bold text-black">AGAINST:{{ results.against }}</div>
                </div>

                <!-- Abstention -->
                <div class="flex items-center space-x-3 bg-yellow-400 px-6 py-3">
                    <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8">
                        <rect width="24" height="24" fill="#FFFF00" />
                        <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                            fill="black" />
                    </svg>
                    <div class="text-3xl font-bold text-black">ABSTENTION:{{ results.abstain }}</div>
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
import { PrinterIcon } from '@heroicons/vue/24/outline'

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

const printBoard = () => {
    const printContent = document.getElementById('voting-board-print')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Voting Results - ${props.voting.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            background: black;
            color: white;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: landscape;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `)

    printWindow.document.close()
    setTimeout(() => {
        printWindow.print()
        printWindow.close()
    }, 250)
}
</script>

<style scoped>
@media print {
    body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    @page {
        size: landscape;
        margin: 0;
    }
}
</style>