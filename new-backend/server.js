const winston = require('winston');

// 1. Setup Logging (Console only for local development to avoid Google Cloud costs)
// Configure this FIRST so that imports below can use it immediately without "no transports" warning.
winston.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
}));

const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const { initializeFirebase } = require('./src/config/firebase');
const pubSubService = require('./src/services/google/PubSubService');


// 2. Initialize Services
const startServer = async () => {
  try {
    // Database
    await connectDB();

    // Firebase
    initializeFirebase();

    // Pub/Sub Subscriber (Non-blocking)
    pubSubService.initializeSubscriber().catch(err => {
      winston.error('Failed to initialize Pub/Sub subscriber:', err.message);
    });

    // Start Express with port auto-increment
    const startOnPort = (port) => {
      const server = app.listen(port, () => {
        winston.info(`\ud83d\ude80 Server running in ${env.NODE_ENV} mode on port ${port}`);
        winston.info(`\ud83d\udce1 Health check: http://localhost:${port}/api/system/health`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          winston.warn(`\u26a0\ufe0f Port ${port} is busy, trying ${port + 1}...`);
          startOnPort(port + 1);
        } else {
          throw err;
        }
      });

      // Graceful Shutdown
      process.on('SIGTERM', () => {
        winston.info('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
          winston.info('Process terminated.');
          process.exit(0);
        });
      });

      return server;
    };

    startOnPort(Number(env.PORT));

  } catch (error) {
    winston.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
