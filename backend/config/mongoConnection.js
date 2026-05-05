/**
 * MongoDB Connection Configuration
 * Backend: Node.js/Express
 * 
 * Handles:
 * - Connection setup with MongoDB Atlas or local
 * - Connection pooling and timeout configurations
 * - Error handling and reconnection logic
 * - Connection status monitoring
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ============================================================================
// CONNECTION CONFIGURATION
// ============================================================================

const mongoConfig = {
  // Atlas connection options
  atlas: {
    maxPoolSize: 50, // Connection pool for high concurrency
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
    readPreference: 'primary',
    retryReads: true
  },
  
  // Local MongoDB connection options
  local: {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000
  }
};

// ============================================================================
// CONNECTION FUNCTION
// ============================================================================

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-validator';
    
    // Determine if connecting to Atlas or local
    const isAtlas = mongoUri.includes('mongodb+srv');
    const connectionOptions = isAtlas ? mongoConfig.atlas : mongoConfig.local;
    
    console.log('🔄 Connecting to MongoDB...');
    
    // Mongoose connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...connectionOptions,
      
      // Automatic reconnection
      serverMonitoringMode: 'stream',
      
      // Application name for monitoring
      appName: 'AcademicAuthenticityValidator',
      
      // SSL/TLS for Atlas
      ...(isAtlas && {
        ssl: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false
      })
    };
    
    await mongoose.connect(mongoUri, options);
    
    console.log('✓ MongoDB connected successfully');
    
    // Get connection details
    const connection = mongoose.connection;
    console.log(`  Database: ${connection.db.name}`);
    console.log(`  Host: ${connection.host}`);
    console.log(`  Port: ${connection.port}`);
    
    // Set up connection event listeners
    setupConnectionListeners(connection);
    
    return connection;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Retry connection after 5 seconds
    console.log('⏳ Retrying connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return connectDatabase();
  }
}

// ============================================================================
// CONNECTION EVENT LISTENERS
// ============================================================================

function setupConnectionListeners(connection) {
  // Connection established
  connection.on('connected', () => {
    console.log('✓ Mongoose connected to MongoDB');
  });
  
  // Connection error
  connection.on('error', (error) => {
    console.error('❌ Mongoose connection error:', error.message);
  });
  
  // Connection disconnected
  connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
  });
  
  // SIGINT - Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    try {
      await connection.close();
      console.log('✓ MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing connection:', error);
      process.exit(1);
    }
  });
}

// ============================================================================
// CONNECTION POOL MONITORING
// ============================================================================

function getConnectionStats() {
  const connection = mongoose.connection;
  
  return {
    state: connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    db: connection.db?.name || 'N/A',
    host: connection.host || 'N/A',
    port: connection.port || 'N/A',
    collections: Object.keys(connection.collections).length,
    models: Object.keys(connection.models).length
  };
}

// ============================================================================
// DISCONNECT FUNCTION
// ============================================================================

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting MongoDB:', error.message);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getConnectionStats,
  mongoConfig
};
