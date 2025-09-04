const mongoose = require('mongoose');
require('dotenv').config();

// Define connection function
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Graceful disconnection
async function closeConnection() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

// Handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

module.exports = {
  connectToDatabase,
  closeConnection,
  mongoose
};