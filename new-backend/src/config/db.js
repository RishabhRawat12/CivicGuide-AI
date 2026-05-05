const mongoose = require('mongoose');
const env = require('./env');
const winston = require('winston');

const connectDB = async (retryCount = 5) => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      family: 4, // Force IPv4 resolution (fixes IPv6 whitelist issues)
    });
    winston.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    winston.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retryCount > 0) {
      winston.info(`🔄 Retrying connection in 5 seconds... (${retryCount} retries left)`);
      setTimeout(() => connectDB(retryCount - 1), 5000);
    } else {
      winston.error('🛑 Max retries reached. Please check your MongoDB Atlas IP whitelist and credentials.');
      // Don't process.exit(1) here to keep the server alive (though DB-dependent routes will fail)
    }
  }
};

module.exports = connectDB;

