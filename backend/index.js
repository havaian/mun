const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectToDatabase } = require('./src/database/connection');
const logger = require('./src/utils/logger');
const { initializeWebSocket } = require('./src/websocket/socketManager');

// Import route modules
const authRoutes = require('./src/auth/routes');
const eventRoutes = require('./src/event/routes');
const committeeRoutes = require('./src/committee/routes');
const sessionRoutes = require('./src/session/routes');
const documentRoutes = require('./src/document/routes');
const resolutionRoutes = require('./src/resolution/routes');
const votingRoutes = require('./src/voting/routes');
const messagingRoutes = require('./src/messaging/routes');
const statisticsRoutes = require('./src/statistics/routes');
const presentationRoutes = require('./src/presentation/routes');
const timerRoutes = require('./src/timer/routes');
const procedureRoutes = require('./src/procedure/routes');
const exportRoutes = require('./src/export/routes');

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
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    modules: {
      auth: 'active',
      voting: 'active',
      messaging: 'active',
      statistics: 'active',
      timers: 'active',
      procedures: 'active',
      export: 'active',
      websocket: 'active'
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
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and WebSocket
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info('✅ Database connected successfully');
    
    // Initialize WebSocket handlers
    initializeWebSocket(io);
    logger.info('✅ WebSocket initialized');
    
    // Initialize active timers
    const { initializeActiveTimers } = require('./src/timer/controller');
    await initializeActiveTimers();
    logger.info('✅ Active timers initialized');
    
    // Start server
    const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🔌 WebSocket ready for connections`);
      logger.info(`📈 Statistics system active`);
      logger.info(`⏱️  Timer system active`);
      logger.info(`💬 Messaging system active`);
      logger.info(`🗳️  Voting system active`);
      logger.info(`📝 Procedure system active`);
      logger.info(`📤 Export system active`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🔄 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    try {
      // Cleanup WebSocket connections
      const { cleanup } = require('./src/websocket/socketManager');
      cleanup();
      
      // Close database connection
      const { closeConnection } = require('./src/database/connection');
      await closeConnection();
      
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();