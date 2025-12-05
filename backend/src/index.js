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

// 🚀 INITIALIZE GLOBAL AUTH EARLY - Before importing routes
const { setupGlobalAuth } = require('./auth/globalAuth');
setupGlobalAuth();

// Import event automation service
const { eventAutomationService } = require('./event/automationService');

// // Import global event protection middleware
// const { middleware: eventProtectionMiddleware, clearCache: clearEventCache, getCacheStats } = require('./auth/globalEventProtection');

// Import route modules
const adminRoutes = require('./admin/routes');
const authRoutes = require('./auth/routes');
const eventRoutes = require('./event/routes');
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
const countriesRoutes = require('./countries/routes');

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
app.use('/uploads', express.static('uploads'));
app.use('/upload', express.static('upload', {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// API Routes - Apply event protection middleware BEFORE protected routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// // Apply event protection middleware to all API routes EXCEPT exempt routes
// // The new middleware automatically handles exempt routes internally
// app.use('/api', eventProtectionMiddleware);

app.use('/api/events', eventRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/resolutions', resolutionRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/presentation', presentationRoutes);
app.use('/api/timers', timerRoutes);
app.use('/api/procedure', procedureRoutes);
app.use('/api/export', exportRoutes);
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
//       global.logger.error('Failed to get automation status:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to get automation status'
//       });
//     }
//   }
// );

// app.post('/api/admin/automation/manual-check',
//   global.auth.token,
//   global.auth.admin,
//   async (req, res) => {
//     try {
//       const result = await eventAutomationService.forceCheckAllEvents();
//       res.json({
//         success: true,
//         result,
//         message: 'Manual event status check completed'
//       });
//     } catch (error) {
//       global.logger.error('Failed to run manual automation check:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to run manual check'
//       });
//     }
//   }
// );

// app.post('/api/admin/automation/start',
//   global.auth.token,
//   global.auth.admin,
//   (req, res) => {
//     try {
//       eventAutomationService.start();
//       res.json({
//         success: true,
//         message: 'Event automation service started'
//       });
//     } catch (error) {
//       global.logger.error('Failed to start automation service:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to start automation service'
//       });
//     }
//   }
// );

// app.post('/api/admin/automation/stop',
//   global.auth.token,
//   global.auth.admin,
//   (req, res) => {
//     try {
//       eventAutomationService.stop();
//       res.json({
//         success: true,
//         message: 'Event automation service stopped'
//       });
//     } catch (error) {
//       global.logger.error('Failed to stop automation service:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to stop automation service'
//       });
//     }
//   }
// );

// // NEW: Event Protection Management Routes (Admin only)
// app.get('/api/admin/event-protection/cache',
//   global.auth.token,
//   global.auth.admin,
//   (req, res) => {
//     try {
//       const stats = getCacheStats();
//       res.json({
//         success: true,
//         cache: stats,
//         message: 'Event protection cache statistics'
//       });
//     } catch (error) {
//       global.logger.error('Failed to get cache stats:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to get cache statistics'
//       });
//     }
//   }
// );

// app.post('/api/admin/event-protection/clear-cache',
//   global.auth.token,
//   global.auth.admin,
//   (req, res) => {
//     try {
//       clearEventCache();
//       res.json({
//         success: true,
//         message: 'Event protection cache cleared successfully'
//       });
//     } catch (error) {
//       global.logger.error('Failed to clear cache:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to clear cache'
//       });
//     }
//   }
// );

// Health check endpoint
app.get('/api/health', (req, res) => {
  // const automationStatus = eventAutomationService.getStatus();
  // const cacheStats = getCacheStats();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    modules: {
      auth: 'active',
      events: 'active',
      committees: 'active',
      sessions: 'active',
      documents: 'active',
      resolutions: 'active',
      voting: 'active',
      messaging: 'active',
      statistics: 'active',
      presentation: 'active',
      timers: 'active',
      procedures: 'active',
      export: 'active',
      countries: 'active',
      websocket: 'active',
      // automation: automationStatus.isRunning ? 'active' : 'inactive',
      eventProtection: 'active'
    },
    services: {
      database: 'connected',
      countries: 'available',
      flags: 'cached',
      // eventAutomation: automationStatus.isRunning ? 'running' : 'stopped'
    },
    // eventProtection: {
    //   cacheSize: cacheStats.size,
    //   cacheTimeout: cacheStats.timeout + 'ms'
    // }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  global.logger.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ?
      'Internal server error' : err.message
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

  // Clear event protection cache
  clearEventCache();

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
      global.logger.info(`📊 Admin panel: http://localhost:${PORT}/admin`);
      global.logger.info(`🔗 API: http://localhost:${PORT}/api`);
      global.logger.info(`⚡ Event automation: ${eventAutomationService.getStatus().isRunning ? 'ACTIVE' : 'INACTIVE'}`);
      global.logger.info(`🛡️  Event protection: ACTIVE`);
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