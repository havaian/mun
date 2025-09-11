const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./utils/logger');

// MongoDB connection configuration
const mongooseOptions = {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
};

// Define connection function
async function connectToDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mun-uz';

        await mongoose.connect(mongoUri, mongooseOptions);

        logger.info('🔗 Connected to MongoDB successfully');
        logger.info(`📍 Database: ${mongoose.connection.name}`);

        return mongoose.connection;
    } catch (error) {
        logger.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}

// Graceful disconnection
async function closeConnection() {
    try {
        await mongoose.connection.close();
        logger.info('🔌 MongoDB connection closed successfully');
    } catch (error) {
        logger.error('❌ Error closing MongoDB connection:', error);
        throw error;
    }
}

// Handle connection events
mongoose.connection.on('error', (err) => {
    logger.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        logger.info('🔌 MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error closing MongoDB on app termination:', error);
        process.exit(1);
    }
});

module.exports = {
    connectToDatabase,
    closeConnection,
    mongoose
};