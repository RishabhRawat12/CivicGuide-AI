let app;

try {
  app = require('../new-backend/src/app');
  const connectDB = require('../new-backend/src/config/db');
  const { initializeFirebase } = require('../new-backend/src/config/firebase');

  // Initialize services for Serverless environment
  connectDB().catch(err => console.error('DB connection deferred:', err.message));
  initializeFirebase();
} catch (err) {
  console.error('❌ Serverless function init error:', err.message);
  
  // Fallback: return a minimal express app that reports the error
  const express = require('express');
  app = express();
  app.use(express.json());
  app.all('*', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Backend initialization failed. Check server logs.',
      detail: err.message,
    });
  });
}

module.exports = app;
