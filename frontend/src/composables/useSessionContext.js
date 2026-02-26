// frontend/src/composables/useSessionContext.js
// =============================================
// Session Context Composable
//
// Resolves the full event/org/committee context from just
// a committeeId route param. Uses the participant-scoped API
// to fetch context, then provides orgId/eventId/committeeId
// so existing views can continue using org-scoped apiMethods.
//
// Usage in layouts:
//   const ctx = useSessionContext()
//   provide('sessionContext', ctx)
//
// Usage in views:
//   const ctx = inject('sessionContext')
//   const { orgId, eventId, committeeId, committee, event } = ctx
//   // Then call: apiMethods.sessions.getAll(orgId.value, eventId.value, committeeId.value)
// =============================================

import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiMethods } from '@/utils/api'

export function useSessionContext() {
    const route = useRoute()
    const authStore = useAuthStore()

    // Core IDs
    const committeeId = computed(() => route.params.committeeId || null)
    const eventId = ref(null)
    const orgId = ref(null)

    // Resolved data
    const committee = ref(null)
    const event = ref(null)
    const participation = ref(null) // user's EventParticipant record for this committee

    // State
    const isLoading = ref(false)
    const isReady = ref(false)
    const error = ref(null)

    // Session base path for navigation links
    const basePath = computed(() => {
        if (!committeeId.value) return ''
        return `/session/${committeeId.value}`
    })

    // Resolve context when committeeId changes
    const resolveContext = async () => {
        if (!committeeId.value) {
            error.value = 'No committee ID in route'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            // Strategy 1: Check eventParticipations from auth store
            // (fastest — already loaded from /auth/me)
            const ep = (authStore.eventParticipations || []).find(p => {
                const cId = p.committee?._id || p.committee
                return cId === committeeId.value
            })

            if (ep && ep.event) {
                eventId.value = ep.event._id
                orgId.value = ep.event.organization?._id || ep.event.organization
                participation.value = ep
                committee.value = ep.committee || null
                event.value = ep.event || null
            }

            // Strategy 2: If we have eventId, fetch full details via participant API
            if (eventId.value) {
                try {
                    // Fetch committee details
                    const cRes = await apiMethods.participant.getCommittee(eventId.value, committeeId.value)
                    if (cRes.data.success) {
                        committee.value = cRes.data.committee
                    }
                } catch (e) {
                    // Non-fatal — we still have basic info from auth store
                    console.warn('Failed to fetch full committee details:', e)
                }

                try {
                    // Fetch event details
                    const eRes = await apiMethods.participant.getEvent(eventId.value)
                    if (eRes.data.success) {
                        event.value = eRes.data.event
                        // Ensure orgId is populated
                        if (!orgId.value && eRes.data.event.organization) {
                            orgId.value = eRes.data.event.organization._id || eRes.data.event.organization
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch event details:', e)
                }
            }

            // Strategy 3: Fallback — try org-scoped lookup if user is org member
            if (!eventId.value) {
                // Try to find this committee in any org the user has access to
                for (const org of (authStore.allOrganizations || [])) {
                    try {
                        // We don't know the eventId, so try a direct committee fetch
                        // This is a last resort
                        console.warn('Could not resolve event context from eventParticipations. Committee may not be properly linked.')
                        break
                    } catch (e) {
                        continue
                    }
                }
            }

            if (!eventId.value || !orgId.value) {
                error.value = 'Unable to resolve event context for this committee.'
                return
            }

            isReady.value = true
        } catch (e) {
            console.error('Session context resolution failed:', e)
            error.value = 'Failed to resolve session context'
        } finally {
            isLoading.value = false
        }
    }

    // Watch for committeeId changes (in case of route change)
    watch(committeeId, (newId) => {
        if (newId) {
            resolveContext()
        }
    }, { immediate: true })

    return {
        // Core IDs (use .value in templates / API calls)
        committeeId,
        eventId,
        orgId,

        // Resolved data
        committee,
        event,
        participation,

        // State
        isLoading,
        isReady,
        error,

        // Helpers
        basePath,
        resolveContext,
    }
}