const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    // Connect with options
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected successfully to: ${mongoose.connection.name}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    
    // Log more details about the error for debugging
    if (err.name === 'MongooseServerSelectionError') {
      console.error('Failed to connect to MongoDB server. Please check:');
      console.error('1. MongoDB URI is correct');
      console.error('2. Network connectivity to MongoDB server');
      console.error('3. MongoDB server is running');
      console.error('4. IP allowlist in MongoDB Atlas (if applicable)');
    }
    
    // Only exit in production, allow development to continue
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting due to database connection failure');
      process.exit(1);
    } else {
      console.warn('Continuing without database connection (development mode)');
    }
  }
}

module.exports = connectDB;