const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { initializeWebSocket } = require('./websocket/socketManager');

// Import route modules
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
const countriesRoutes = require('./countries/routes'); // New countries and flags routes

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
app.use('/api/countries', countriesRoutes); // New countries and flags endpoints

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
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected successfully');
    
    // Initialize flag cache on startup
    await initializeFlagCache();
    logger.info('✅ Flag cache initialized');
    
    // Initialize WebSocket handlers
    initializeWebSocket(io);
    logger.info('✅ WebSocket initialized');
    
    // Initialize active timers
    try {
      const { initializeActiveTimers } = require('./timer/controller');
      await initializeActiveTimers();
      logger.info('✅ Active timers initialized');
    } catch (error) {
      logger.warn('Timer initialization failed:', error.message);
    }
    
    // Start server
    const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Countries service initialized with multilingual support');
      logger.info('Flag cache initialized and ready to serve');
      
      logger.info('\n🌍 Available endpoints:');
      logger.info('  • Authentication: /api/auth');
      logger.info('  • Events: /api/events');
      logger.info('  • Committees: /api/committees');
      logger.info('  • Sessions: /api/sessions');
      logger.info('  • Documents: /api/documents');
      logger.info('  • Resolutions: /api/resolutions');
      logger.info('  • Voting: /api/voting');
      logger.info('  • Messaging: /api/messages');
      logger.info('  • Statistics: /api/statistics');
      logger.info('  • Presentation: /api/presentation');
      logger.info('  • Timers: /api/timers');
      logger.info('  • Procedures: /api/procedure');
      logger.info('  • Export: /api/export');
      logger.info('  • Countries: /api/countries (with multilingual support)');
      logger.info('  • Flags: /api/countries/flags');
      logger.info('  • Health: /api/health');
      
      logger.info('\n🔐 Authentication required for:');
      logger.info('  • Batch flags: /api/countries/flags/all/batch');
      logger.info('  • Most committee operations');
      logger.info('  • Voting and resolution management');
      logger.info('  • Administrative functions');
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

const seedDatabase = require('./scripts/seed');

// Call during startup
console.log('Seeding the database');
seedDatabase()
  .then(result => {
    if (result.success) {
      console.log(`Admin user ${result.action}:`, result.user.username);
    } else {
      console.error('Seeding failed:', result.error);
    }
  })
  .catch(err => {
    console.error('Seeding error:', err.message);
  });

startServer();

module.exports = app;