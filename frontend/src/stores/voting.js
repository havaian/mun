// frontend/src/stores/voting.js
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { apiMethods } from '@/utils/api'
import { useWebSocketStore } from './websocket'
import { useAuthStore } from './auth'

export const useVotingStore = defineStore('voting', () => {
    // State
    const activeVoting = ref(null)
    const votingHistory = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // Voting details
    const votingType = ref('simple') // simple, roll-call, secret, veto-enabled
    const majorityType = ref('simple') // simple, two-thirds, consensus, unanimity
    const eligibleVoters = ref([])
    const votes = ref([])
    const rollCallOrder = ref([])
    const currentVoter = ref(null)

    // Real-time progress
    const progress = reactive({
        totalVoters: 0,
        votesReceived: 0,
        votesFor: 0,
        votesAgainst: 0,
        abstentions: 0,
        skipped: 0,
        percentage: 0
    })

    // Results
    const results = reactive({
        passed: false,
        finalCount: {
            favour: 0,
            against: 0,
            abstention: 0,
            absent: 0
        },
        majorityReached: false,
        vetoUsed: false,
        vetoCountry: null,
        completedAt: null
    })

    // Statistics
    const stats = reactive({
        totalVotings: 0,
        averageParticipation: 0,
        mostActiveVoter: null,
        quickestVoting: null,
        longestVoting: null
    })

    // WebSocket and Auth integration
    const wsStore = useWebSocketStore()
    const authStore = useAuthStore()

    // Computed
    const canVote = computed(() => {
        return authStore.user?.role === 'delegate' &&
            authStore.user?.specialRole !== 'observer' &&
            eligibleVoters.value.some(voter => voter.email === authStore.user?.email)
    })

    const canManageVoting = computed(() => {
        return authStore.user?.role === 'admin' || authStore.user?.role === 'presidium'
    })

    const hasVoted = computed(() => {
        return votes.value.some(vote => vote.voterEmail === authStore.user?.email)
    })

    const myVote = computed(() => {
        return votes.value.find(vote => vote.voterEmail === authStore.user?.email) || null
    })

    const isVotingActive = computed(() => {
        return activeVoting.value?.status === 'active'
    })

    const isRollCall = computed(() => {
        return votingType.value === 'roll-call'
    })

    const canUseVeto = computed(() => {
        // Only for Security Council or committees with veto powers
        return votingType.value === 'veto-enabled' &&
            authStore.user?.role === 'delegate' &&
            authStore.user?.specialRole === 'security-council'
    })

    const progressPercentage = computed(() => {
        if (progress.totalVoters === 0) return 0
        return Math.round((progress.votesReceived / progress.totalVoters) * 100)
    })

    const requiredMajority = computed(() => {
        const total = progress.totalVoters
        switch (majorityType.value) {
            case 'simple':
                return Math.floor(total / 2) + 1
            case 'two-thirds':
                return Math.ceil(total * 2 / 3)
            case 'consensus':
                return total // All must agree or abstain
            case 'unanimity':
                return total // All must vote yes
            default:
                return Math.floor(total / 2) + 1
        }
    })

    // Voting Management Actions
    const createVoting = async (votingData) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await apiMethods.voting.create(votingData)

            if (response.data.success) {
                activeVoting.value = response.data.voting
                votingType.value = votingData.votingType || 'simple'
                majorityType.value = votingData.majorityType || 'simple'

                // Load eligible voters
                await loadEligibleVoters(response.data.voting._id)

                // Initialize progress
                progress.totalVoters = eligibleVoters.value.length
                progress.votesReceived = 0
                progress.votesFor = 0
                progress.votesAgainst = 0
                progress.abstentions = 0
                progress.percentage = 0

                // Setup roll call if needed
                if (votingType.value === 'roll-call') {
                    await setupRollCall(response.data.voting._id)
                }

                return response.data.voting
            }

            throw new Error(response.data.message || 'Failed to create voting')

        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const loadVotingHistory = async (committeeId) => {
        try {
            isLoading.value = true

            const response = await apiMethods.voting.getAll({ committeeId })

            if (response.data.success) {
                votingHistory.value = response.data.votings || []

                // Find active voting
                const active = votingHistory.value.find(v => v.status === 'active')
                if (active) {
                    activeVoting.value = active
                    await loadVotingDetails(active._id)
                }

                // Update stats
                updateVotingStats()
            }

        } catch (err) {
            error.value = err.message
            console.error('Load voting history error:', err)
        } finally {
            isLoading.value = false
        }
    }

    const loadVotingDetails = async (votingId) => {
        try {
            const response = await apiMethods.voting.getById(votingId)

            if (response.data.success) {
                const voting = response.data.voting

                activeVoting.value = voting
                votingType.value = voting.votingType || 'simple'
                majorityType.value = voting.majorityType || 'simple'
                eligibleVoters.value = voting.eligibleVoters || []
                votes.value = voting.votes || []

                // Update progress
                updateProgress()

                // Load results if completed
                if (voting.status === 'completed') {
                    Object.assign(results, voting.results || {})
                }

                // Setup roll call data if needed
                if (voting.votingType === 'roll-call') {
                    rollCallOrder.value = voting.rollCallOrder || []
                    currentVoter.value = voting.currentVoter || null
                }
            }

        } catch (err) {
            error.value = err.message
            console.error('Load voting details error:', err)
        }
    }

    const loadEligibleVoters = async (votingId) => {
        try {
            const response = await apiMethods.voting.getEligibleVoters(votingId)

            if (response.data.success) {
                eligibleVoters.value = response.data.eligibleVoters || []
            }

        } catch (err) {
            console.error('Load eligible voters error:', err)
        }
    }

    // Vote Casting
    const castVote = async (votingId, voteChoice, justification = '') => {
        try {
            const voteData = {
                choice: voteChoice, // 'favour', 'against', 'abstention'
                justification
            }

            const response = await apiMethods.voting.castVote(votingId, voteData)

            if (response.data.success) {
                // Update local votes
                const existingVoteIndex = votes.value.findIndex(v => v.voterEmail === authStore.user?.email)
                if (existingVoteIndex >= 0) {
                    votes.value[existingVoteIndex] = response.data.vote
                } else {
                    votes.value.push(response.data.vote)
                }

                // Update progress
                updateProgress()

                return response.data.vote
            }

            throw new Error(response.data.message || 'Failed to cast vote')

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const useVeto = async (votingId, justification = '') => {
        try {
            const response = await apiMethods.voting.useVeto(votingId, { justification })

            if (response.data.success) {
                results.vetoUsed = true
                results.vetoCountry = authStore.user?.countryName
                results.passed = false

                return response.data
            }

            throw new Error(response.data.message || 'Failed to use veto')

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Roll Call Management
    const setupRollCall = async (votingId) => {
        try {
            const response = await apiMethods.voting.getRollCallOrder(votingId)

            if (response.data.success) {
                rollCallOrder.value = response.data.rollCallOrder || []
                currentVoter.value = rollCallOrder.value[0] || null
            }

        } catch (err) {
            console.error('Setup roll call error:', err)
        }
    }

    const skipRollCallVote = async (votingId) => {
        try {
            const response = await apiMethods.voting.skipVote(votingId)

            if (response.data.success) {
                currentVoter.value = response.data.nextVoter || null
                progress.skipped++
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const setCurrentVoter = async (votingId, voterEmail) => {
        try {
            const response = await apiMethods.voting.setCurrentVoter(votingId, { voterEmail })

            if (response.data.success) {
                currentVoter.value = eligibleVoters.value.find(v => v.email === voterEmail) || null
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Voting Control
    const endVoting = async (votingId) => {
        try {
            isLoading.value = true

            const response = await apiMethods.voting.endVoting(votingId)

            if (response.data.success) {
                activeVoting.value = null
                Object.assign(results, response.data.results)

                // Add to history
                const completedVoting = {
                    ...activeVoting.value,
                    status: 'completed',
                    results: response.data.results,
                    completedAt: new Date()
                }

                votingHistory.value.push(completedVoting)

                // Update stats
                updateVotingStats()

                return response.data.results
            }

            throw new Error(response.data.message || 'Failed to end voting')

        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const cancelVoting = async (votingId, reason = '') => {
        try {
            const response = await apiMethods.voting.cancel(votingId, { reason })

            if (response.data.success) {
                activeVoting.value = null
                resetVotingData()
            }

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    // Utility Methods
    const updateProgress = () => {
        progress.votesReceived = votes.value.length
        progress.votesFor = votes.value.filter(v => v.choice === 'favour').length
        progress.votesAgainst = votes.value.filter(v => v.choice === 'against').length
        progress.abstentions = votes.value.filter(v => v.choice === 'abstention').length
        progress.percentage = progressPercentage.value
    }

    const updateVotingStats = () => {
        stats.totalVotings = votingHistory.value.length

        if (votingHistory.value.length > 0) {
            const completedVotings = votingHistory.value.filter(v => v.status === 'completed')

            if (completedVotings.length > 0) {
                // Calculate average participation
                const totalParticipation = completedVotings.reduce((sum, voting) => {
                    const participation = (voting.votes?.length || 0) / (voting.eligibleVoters?.length || 1)
                    return sum + participation
                }, 0)

                stats.averageParticipation = Math.round((totalParticipation / completedVotings.length) * 100)

                // Find quickest and longest votings
                const sortedByDuration = completedVotings
                    .filter(v => v.startedAt && v.completedAt)
                    .map(v => ({
                        ...v,
                        duration: new Date(v.completedAt) - new Date(v.startedAt)
                    }))
                    .sort((a, b) => a.duration - b.duration)

                if (sortedByDuration.length > 0) {
                    stats.quickestVoting = sortedByDuration[0]
                    stats.longestVoting = sortedByDuration[sortedByDuration.length - 1]
                }
            }
        }
    }

    const resetVotingData = () => {
        activeVoting.value = null
        votingType.value = 'simple'
        majorityType.value = 'simple'
        eligibleVoters.value = []
        votes.value = []
        rollCallOrder.value = []
        currentVoter.value = null

        Object.assign(progress, {
            totalVoters: 0,
            votesReceived: 0,
            votesFor: 0,
            votesAgainst: 0,
            abstentions: 0,
            skipped: 0,
            percentage: 0
        })

        Object.assign(results, {
            passed: false,
            finalCount: {
                favour: 0,
                against: 0,
                abstention: 0,
                absent: 0
            },
            majorityReached: false,
            vetoUsed: false,
            vetoCountry: null,
            completedAt: null
        })
    }

    const getVoteByCountry = (countryName) => {
        return votes.value.find(vote => vote.voterCountry === countryName) || null
    }

    const getVotingDuration = (voting) => {
        if (!voting.startedAt || !voting.completedAt) return null

        const start = new Date(voting.startedAt)
        const end = new Date(voting.completedAt)
        const durationMs = end - start

        const minutes = Math.floor(durationMs / 60000)
        const seconds = Math.floor((durationMs % 60000) / 1000)

        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // WebSocket event handlers
    const handleVotingUpdate = (data) => {
        if (activeVoting.value?._id === data.votingId) {
            Object.assign(activeVoting.value, data)

            if (data.votes) {
                votes.value = data.votes
                updateProgress()
            }

            if (data.currentVoter) {
                currentVoter.value = data.currentVoter
            }

            if (data.results) {
                Object.assign(results, data.results)
            }
        }
    }

    const handleVotecast = (data) => {
        if (activeVoting.value?._id === data.votingId) {
            // Update progress without revealing vote details
            progress.votesReceived = data.votesCount || progress.votesReceived + 1
            progress.percentage = progressPercentage.value
        }
    }

    return {
        // State
        activeVoting,
        votingHistory,
        isLoading,
        error,

        // Voting details
        votingType,
        majorityType,
        eligibleVoters,
        votes,
        rollCallOrder,
        currentVoter,

        // Progress and results
        progress,
        results,
        stats,

        // Computed
        canVote,
        canManageVoting,
        hasVoted,
        myVote,
        isVotingActive,
        isRollCall,
        canUseVeto,
        progressPercentage,
        requiredMajority,

        // Actions - Voting Management
        createVoting,
        loadVotingHistory,
        loadVotingDetails,
        loadEligibleVoters,

        // Actions - Vote Casting
        castVote,
        useVeto,

        // Actions - Roll Call
        setupRollCall,
        skipRollCallVote,
        setCurrentVoter,

        // Actions - Control
        endVoting,
        cancelVoting,

        // Utilities
        updateProgress,
        updateVotingStats,
        resetVotingData,
        getVoteByCountry,
        getVotingDuration,

        // WebSocket handlers
        handleVotingUpdate,
        handleVotecast
    }
})