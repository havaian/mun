const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
require('./db');

// Set up global logger
const { setupGlobalLogger } = require('./logger/globalLogger');
setupGlobalLogger();

const { initializeWebSocket } = require('./websocket/socketManager');

// 🚀 INITIALIZE GLOBAL AUTH — must be before importing routes
const { setupGlobalAuth } = require('./auth/globalAuth');
setupGlobalAuth();

// Import event automation service
const { eventAutomationService } = require('./event/automationService');

const emailService = require('./email/service');
emailService.init();

// // Import global event protection middleware
// const { middleware: eventProtectionMiddleware, clearCache: clearEventCache, getCacheStats } = require('./auth/globalEventProtection');

// ============================================
// Import route modules
// ============================================

// --- Phase 1: Auth & Org ---
const authRoutes = require('./auth/routes');
const organizationRoutes = require('./organization/routes');

// --- Phase 2: Org management ---
const orgMembershipRoutes = require('./org-membership/routes');
const invitationRoutes = require('./invitation/routes');
const notificationRoutes = require('./notification/routes');

// --- Phase 3: Org-scoped events and participants ---
const eventRoutes = require('./event/routes');
const participantRoutes = require('./participant/routes');

// --- Phase 4: Registration pipeline ---
const registrationRoutes = require('./registration/routes');

// --- Public routes (no auth) ---
const publicRoutes = require('./public/routes');

// --- Media routes ---
const mediaRoutes = require('./media/routes');

// --- MUN committee-scoped modules (org → event → committee) ---
const committeeRoutes = require('./committee/routes');
const sessionRoutes = require('./session/routes');
const documentRoutes = require('./document/routes');
const resolutionRoutes = require('./resolution/routes');
const votingRoutes = require('./voting/routes');
const messagingRoutes = require('./messaging/routes');
const statisticsRoutes = require('./statistics/routes');
const presentationRoutes = require('./presentation/routes');
const timerRoutes = require('./timer/routes');
const procedureRoutes = require('./procedure/routes');
const exportRoutes = require('./export/routes');

// --- Platform admin (SuperAdmin) ---
const adminRoutes = require('./admin/routes');

// --- General resources ---
const countriesRoutes = require('./countries/routes');

// --- Participant-scoped routes (no orgId in URL) ---
const participantScopedRoutes = require('./participant-routes');

// Import countries cache initialization
const { initializeFlagCache } = require('./countries/controller');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.PROJECT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io available globally for event automation service
global.io = io;
app.locals.io = io;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for file uploads
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(cors({
  origin: process.env.PROJECT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => global.logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads/documents', express.static('uploads/documents'));
app.use('/uploads', express.static('uploads'));
app.use('/upload', express.static('upload', {
  maxAge: '1d',
  etag: true
}));

// ============================================
// API Routes
// ============================================

// --- Phase 1: Auth & Org ---
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);

// --- Phase 2: Org management ---
app.use('/api/organizations/:orgId/members', orgMembershipRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);

// --- Phase 3: Org-scoped events and participants ---
app.use('/api/organizations/:orgId/events', eventRoutes);
app.use('/api/organizations/:orgId/events/:eventId/participants', participantRoutes);

// --- Phase 4: Registration pipeline ---
app.use('/api/organizations/:orgId/events/:eventId/registration', registrationRoutes);

// --- Public routes (no auth) ---
app.use('/api/public', publicRoutes);

// --- Media routes ---
app.use('/api/media', mediaRoutes);

// --- MUN: Committee CRUD (org → event scoped) ---
app.use('/api/organizations/:orgId/events/:eventId/committees', committeeRoutes);

// --- MUN: Committee-scoped modules (org → event → committee) ---
const committeeBase = '/api/organizations/:orgId/events/:eventId/committees/:committeeId';
app.use(`${committeeBase}/sessions`, sessionRoutes);
app.use(`${committeeBase}/documents`, documentRoutes);
app.use(`${committeeBase}/resolutions`, resolutionRoutes);
app.use(`${committeeBase}/voting`, votingRoutes);
app.use(`${committeeBase}/messages`, messagingRoutes);
app.use(`${committeeBase}/statistics`, statisticsRoutes);
app.use(`${committeeBase}/presentation`, presentationRoutes);
app.use(`${committeeBase}/timers`, timerRoutes);
app.use(`${committeeBase}/procedure`, procedureRoutes);
app.use(`${committeeBase}/export`, exportRoutes);

// --- Participant-scoped routes (access via EventParticipant, no org context needed in URL) ---
app.use('/api/p', participantScopedRoutes);

// --- Platform admin (SuperAdmin only) ---
app.use('/api/admin', adminRoutes);

// --- General resources ---
app.use('/api/countries', countriesRoutes);

// // Event Automation Control Routes (Admin only)
// app.get('/api/admin/automation/status',
//   global.auth.token,
//   global.auth.admin,
//   (req, res) => {
//     try {
//       const status = eventAutomationService.getStatus();
//       res.json({
//         success: true,
//         automation: status
//       });
//     } catch (error) {
//       global.logger.error('Get automation status error:', error);
//       res.status(500).json({ error: 'Failed to get automation status' });
//     }
//   }
// );

// Error handling middleware
app.use((err, req, res, next) => {
  global.logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found'
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  global.logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop event automation service
  eventAutomationService.stop();

  // // Clear event protection cache
  // clearEventCache();

  server.close((err) => {
    if (err) {
      global.logger.error('Error during server shutdown:', err);
      process.exit(1);
    }

    global.logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    global.logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize flag cache
    await initializeFlagCache();

    // Initialize WebSocket
    initializeWebSocket(io);

    // Start event automation service
    eventAutomationService.start();

    server.listen(PORT, () => {
      global.logger.info(`🚀 Server running on port ${PORT}`);
      global.logger.info(`🔗 API: http://localhost:${PORT}/api`);
      global.logger.info(`🏢 Organizations: /api/organizations`);
      global.logger.info(`👥 Members: /api/organizations/:orgId/members`);
      global.logger.info(`📅 Events: /api/organizations/:orgId/events`);
      global.logger.info(`🎭 Participants: /api/organizations/:orgId/events/:eventId/participants`);
      global.logger.info(`📝 Registration: /api/organizations/:orgId/events/:eventId/registration`);
      global.logger.info(`🏛️ Committees: /api/organizations/:orgId/events/:eventId/committees`);
      global.logger.info(`📋 Sessions/Docs/Voting/etc: .../committees/:committeeId/*`);
      global.logger.info('🎯 Participant routes: /api/p/events/:eventId/...');
      global.logger.info(`📨 Invitations: /api/invitations`);
      global.logger.info(`🔔 Notifications: /api/notifications`);
      global.logger.info(`🔧 Admin: /api/admin (SuperAdmin)`);
      global.logger.info(`🌍 Countries: /api/countries`);
      global.logger.info(`⚡ Event automation: ${eventAutomationService.getStatus().isRunning ? 'ACTIVE' : 'INACTIVE'}`);
    });
  } catch (error) {
    global.logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  global.logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  global.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

module.exports = app;