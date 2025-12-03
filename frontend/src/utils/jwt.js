export const decodeJWT = (token) => {
    try {
        if (!token) return null

        const parts = token.split('.')
        if (parts.length !== 3) return null

        const payload = JSON.parse(atob(parts[1]))
        return payload
    } catch (error) {
        console.error('JWT decode error:', error)
        return null
    }
}

export const getTokenExpiration = (token) => {
    const payload = decodeJWT(token)
    if (!payload || !payload.exp) return null

    return payload.exp * 1000 // Convert to milliseconds
}

export const getTokenRemainingTime = (token) => {
    const expiration = getTokenExpiration(token)
    if (!expiration) return 0

    const now = Date.now()
    return Math.max(0, expiration - now)
}

export const isTokenExpired = (token) => {
    const expiration = getTokenExpiration(token)
    if (!expiration) return true

    return Date.now() >= expiration
}