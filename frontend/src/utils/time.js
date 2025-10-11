const format = {
    time: (timestamp) => {
        try {
            return new Date(timestamp).toLocaleTimeString("uz-UZ", {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        } catch {
            return 'Unknown timestamp'
        }
    },
    date: (timestamp) => {
        try {
            return new Date(timestamp).toLocaleDateString("uz-UZ", {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return 'Unknown date'
        }
    },
    dateRange: (startDate, endDate) => {
        try {
            const start = new Date(startDate)
            const end = new Date(endDate)
            
            const startFormatted = start.toLocaleDateString("uz-UZ", {
                month: 'short',
                day: 'numeric'
            })
            
            const endFormatted = end.toLocaleDateString("uz-UZ", {
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            })
            
            // If same day, just return one date
            if (start.toDateString() === end.toDateString()) {
                return endFormatted
            }
            
            return `${startFormatted} - ${endFormatted}`
        } catch {
            return 'Invalid date range'
        }
    },
    timeDiff: (value) => {
        if (typeof value === 'string') {
            // It's a timestamp
            const date = new Date(value)
            const now = new Date()
            const diffMs = now - date
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)

            if (diffMins < 60) {
                return `${diffMins}m ago`
            } else if (diffHours < 24) {
                return `${diffHours}h ago`
            } else {
                return date.toLocaleDateString()
            }
        } else {
            // It's seconds for timer
            const mins = Math.floor(value / 60)
            const secs = value % 60
            return `${mins}:${secs.toString().padStart(2, '0')}`
        }
    },
    timeDiffLong: (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) {
            return `${diffMins}m`
        } else if (diffHours < 24) {
            return `${diffHours}h`
        } else if (diffDays < 7) {
            return `${diffDays}d`
        } else {
            return date.toLocaleDateString()
        }
    }
}

export default format