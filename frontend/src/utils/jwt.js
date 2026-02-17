/**
 * Client-side JWT utilities
 * These do NOT verify signatures — they only decode and check expiry.
 * Actual verification happens server-side.
 */

/**
 * Decode a JWT token payload without verification
 */
export const decodeJWT = (token) => {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const payload = parts[1]
        // Base64url decode
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decoded)
    } catch (e) {
        return null
    }
}

/**
 * Get remaining time until token expires (in milliseconds)
 * Returns negative number if already expired
 */
export const getTokenRemainingTime = (token) => {
    const payload = decodeJWT(token)
    if (!payload || !payload.exp) return -1

    const expiresAt = payload.exp * 1000 // Convert to milliseconds
    return expiresAt - Date.now()
}

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token) => {
    return getTokenRemainingTime(token) <= 0
}

/**
 * Get token expiration date
 */
export const getTokenExpirationDate = (token) => {
    const payload = decodeJWT(token)
    if (!payload || !payload.exp) return null
    return new Date(payload.exp * 1000)
}