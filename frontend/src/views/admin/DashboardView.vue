<template>
    <div class="admin-dashboard">
        <!-- Instant Load Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Events</h3>
                <div class="stat-number">{{ stats.events || '...' }}</div>
            </div>
            <div class="stat-card">
                <h3>Committees</h3>
                <div class="stat-number">{{ stats.committees || '...' }}</div>
            </div>
            <div class="stat-card">
                <h3>Users</h3>
                <div class="stat-number">{{ stats.users || '...' }}</div>
            </div>
            <div class="stat-card">
                <h3>Documents</h3>
                <div class="stat-number">{{ stats.documents || '...' }}</div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="actions">
            <button @click="refresh" :disabled="loading" class="btn-primary">
                {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
            <button @click="goToEvents" class="btn-secondary">Events</button>
            <button @click="goToCommittees" class="btn-secondary">Committees</button>
            <button @click="goToUsers" class="btn-secondary">Users</button>
        </div>

        <!-- System Status -->
        <div class="status-section">
            <h3>System Status</h3>
            <div class="status-item">
                API: <span :class="health.api">{{ health.api || 'checking...' }}</span>
            </div>
            <div class="status-item">
                DB: <span :class="health.db">{{ health.db || 'checking...' }}</span>
            </div>
        </div>

        <!-- Events List -->
        <div v-if="events.length" class="events-section">
            <h3>Recent Events</h3>
            <div class="event-list">
                <div v-for="event in events.slice(0, 3)" :key="event.id" class="event-item">
                    <span class="event-name">{{ event.name }}</span>
                    <span class="event-date">{{ formatDate(event.startDate) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AdminDashboard',
    data() {
        return {
            stats: {
                events: null,
                committees: null,
                users: null,
                documents: null
            },
            health: {
                api: null,
                db: null
            },
            events: [],
            loading: false
        }
    },

    async mounted() {
        // Load data immediately - no delays
        this.loadData()
    },

    methods: {
        async loadData() {
            this.loading = true

            // Load stats first (most important)
            this.loadStats()

            // Load health check in parallel
            this.loadHealth()

            // Load events last
            setTimeout(() => this.loadEvents(), 100)

            this.loading = false
        },

        async loadStats() {
            try {
                const response = await fetch('/api/admin/dashboard/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    this.stats = {
                        events: data.stats?.totalEvents || 0,
                        committees: data.stats?.activeCommittees || 0,
                        users: data.stats?.registeredUsers || 0,
                        documents: data.stats?.documentsUploaded || 0
                    }
                } else {
                    // Fallback data
                    this.stats = { events: 0, committees: 0, users: 0, documents: 0 }
                }
            } catch (error) {
                console.error('Stats error:', error)
                this.stats = { events: 0, committees: 0, users: 0, documents: 0 }
            }
        },

        async loadHealth() {
            try {
                const response = await fetch('/api/health')

                if (response.ok) {
                    const data = await response.json()
                    this.health = {
                        api: data.status === 'healthy' ? 'healthy' : 'unhealthy',
                        db: data.services?.database === 'connected' ? 'healthy' : 'unhealthy'
                    }
                } else {
                    this.health = { api: 'unhealthy', db: 'unknown' }
                }
            } catch (error) {
                console.error('Health error:', error)
                this.health = { api: 'unhealthy', db: 'unknown' }
            }
        },

        async loadEvents() {
            try {
                const response = await fetch('/api/events', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('mun_token')}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    this.events = Array.isArray(data) ? data : []
                }
            } catch (error) {
                console.error('Events error:', error)
                this.events = []
            }
        },

        refresh() {
            this.loadData()
        },

        goToEvents() {
            this.$router.push('/admin/events')
        },

        goToCommittees() {
            this.$router.push('/admin/committees')
        },

        goToUsers() {
            this.$router.push('/admin/users')
        },

        formatDate(date) {
            if (!date) return ''
            return new Date(date).toLocaleDateString()
        }
    }
}
</script>

<style scoped>
.admin-dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.stat-card h3 {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
    font-weight: 500;
}

.stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #333;
}

.actions {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #0056b3;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;
}

.btn-secondary:hover {
    background: #e9ecef;
}

.status-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
}

.status-section h3 {
    margin: 0 0 15px 0;
    color: #333;
}

.status-item {
    margin-bottom: 8px;
    font-family: monospace;
}

.healthy {
    color: #28a745;
    font-weight: bold;
}

.unhealthy {
    color: #dc3545;
    font-weight: bold;
}

.events-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.events-section h3 {
    margin: 0 0 15px 0;
    color: #333;
}

.event-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
}

.event-name {
    font-weight: 500;
    color: #333;
}

.event-date {
    color: #666;
    font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
    .admin-dashboard {
        padding: 15px;
    }

    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
    }

    .stat-number {
        font-size: 24px;
    }

    .actions {
        flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
    }
}
</style>