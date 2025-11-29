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

const logger = require('./utils/logger');
const { initializeWebSocket } = require('./websocket/socketManager');

// 🚀 INITIALIZE GLOBAL AUTH EARLY - Before importing routes
const { setupGlobalAuth } = require('./auth/globalAuth');
setupGlobalAuth();

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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io available in routes
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
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));
app.use('/upload', express.static('upload', {
  maxAge: '1d', // Cache static files for 1 day
  etag: true
}));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
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

// Health check endpoint
app.get('/api/health', (req, res) => {
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
      websocket: 'active'
    },
    services: {
      database: 'connected',
      countries: 'available',
      flags: 'cached'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
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
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal server error')
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize database and WebSocket
async function startServer() {
  try {
    // Initialize flag cache on startup
    await initializeFlagCache();
    logger.info('Flag cache initialized');
    
    // Initialize WebSocket handlers
    initializeWebSocket(io);
    logger.info('WebSocket initialized');
    
    // Initialize active timers
    try {
      const { initializeActiveTimers } = require('./timer/controller');
      await initializeActiveTimers();
      logger.info('Active timers initialized');
    } catch (error) {
      logger.warn('Timer initialization failed:', error.message);
    }
    
    // Start server
    const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

require('./seed');

startServer();

module.exports = app;