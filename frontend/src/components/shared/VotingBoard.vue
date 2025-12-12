<template>
    <div v-if="show" class="fixed inset-0 bg-black z-50 flex items-center justify-center p-2 sm:p-4 overflow-auto"
        @click="$emit('close')">
        <div class="w-full max-w-7xl my-auto" @click.stop>
            <!-- Print Button -->
            <div class="flex justify-end mb-2 space-x-2">
                <button @click="printBoard"
                    class="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm sm:text-base">
                    <PrinterIcon class="w-4 h-4 sm:w-5 sm:h-5" />
                    <span class="hidden sm:inline">Print Results</span>
                    <span class="sm:hidden">Print</span>
                </button>
                <button @click="$emit('close')"
                    class="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base">
                    Close
                </button>
            </div>

            <!-- Voting Board -->
            <div id="voting-board-print" class="bg-black text-white border border-gray-700">
                <!-- Header Bar -->
                <div
                    class="bg-gradient-to-r from-blue-800 to-blue-600 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                    <div class="text-sm sm:text-lg lg:text-xl font-bold">Voting Started</div>
                    <div class="text-sm sm:text-lg lg:text-xl">{{ formatDate(voting.startedAt || voting.createdAt) }}
                    </div>
                    <div class="text-sm sm:text-lg lg:text-xl font-mono">{{ formatTime(voting.startedAt ||
                        voting.createdAt) }}
                    </div>
                </div>

                <!-- Title Section -->
                <div class="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b border-gray-700">
                    <div class="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{{ voting.title }}</div>
                    <div v-if="voting.description" class="text-sm sm:text-lg lg:text-xl text-gray-300">{{
                        voting.description }}
                    </div>
                </div>

                <!-- Countries Grid -->
                <div class="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
                    <div
                        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 sm:gap-x-3 lg:gap-x-4 gap-y-1 sm:gap-y-2">
                        <div v-for="voter in sortedVoters" :key="voter.country"
                            class="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm lg:text-base font-medium">
                            <!-- Vote Icon -->
                            <span class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                                <svg v-if="voter.vote === 'for'" viewBox="0 0 24 24" fill="none"
                                    class="w-4 h-4 sm:w-5 sm:h-5">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                        fill="#00FF00" />
                                </svg>
                                <svg v-else-if="voter.vote === 'against'" viewBox="0 0 24 24" fill="none"
                                    class="w-4 h-4 sm:w-5 sm:h-5">
                                    <path
                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                                        fill="#FF0000" />
                                </svg>
                                <svg v-else-if="voter.vote === 'abstain'" viewBox="0 0 24 24" fill="none"
                                    class="w-4 h-4 sm:w-5 sm:h-5">
                                    <path
                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                                        fill="#FFFF00" />
                                </svg>
                                <span v-else class="text-gray-600 text-lg">○</span>
                            </span>
                            <!-- Country Name -->
                            <span class="truncate uppercase">{{ voter.country }}</span>
                        </div>
                    </div>
                </div>

                <!-- Results Bar -->
                <div
                    class="bg-gray-900 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-t border-gray-700 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
                    <div
                        class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-wrap w-full lg:w-auto">
                        <!-- In Favour -->
                        <div class="flex items-center space-x-2 sm:space-x-3">
                            <div
                                class="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 sm:w-6 sm:h-6">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
                                </svg>
                            </div>
                            <div class="text-base sm:text-xl lg:text-2xl font-bold whitespace-nowrap">IN FAVOUR: {{
                                results.for }}
                            </div>
                        </div>

                        <!-- Against -->
                        <div class="flex items-center space-x-2 sm:space-x-3">
                            <div
                                class="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 sm:w-6 sm:h-6">
                                    <path
                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                                        fill="white" />
                                </svg>
                            </div>
                            <div class="text-base sm:text-xl lg:text-2xl font-bold whitespace-nowrap">AGAINST: {{
                                results.against }}
                            </div>
                        </div>

                        <!-- Abstention -->
                        <div class="flex items-center space-x-2 sm:space-x-3">
                            <div
                                class="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 sm:w-6 sm:h-6">
                                    <path
                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                                        fill="white" />
                                </svg>
                            </div>
                            <div class="text-base sm:text-xl lg:text-2xl font-bold whitespace-nowrap">ABSTENTION: {{
                                results.abstain }}</div>
                        </div>
                    </div>

                    <!-- UN Logo -->
                    <div class="hidden lg:block">
                        <svg class="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="45" stroke="#4A9EDA" stroke-width="2" fill="none" />
                            <path
                                d="M50 10 L50 90 M10 50 L90 50 M20 20 L80 80 M80 20 L20 80 M50 20 L50 80 M20 50 L80 50 M30 30 L70 70 M70 30 L30 70"
                                stroke="#4A9EDA" stroke-width="1.5" />
                            <circle cx="50" cy="50" r="8" fill="#4A9EDA" />
                            <text x="50" y="97" font-size="8" fill="#4A9EDA" text-anchor="middle"
                                font-weight="bold">UN</text>
                        </svg>
                    </div>
                </div>

                <!-- Final Result Banner (if completed) -->
                <div v-if="voting.status === 'completed'" :class="[
                    'px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-center text-xl sm:text-2xl lg:text-3xl font-bold border-t border-gray-700',
                    voting.results?.passed ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'
                ]">
                    {{ voting.results?.passed ? '✓ MOTION ADOPTED' : '✗ MOTION NOT ADOPTED' }}
                </div>
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
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
}
</style>