const app = require('../new-backend/src/app');
const connectDB = require('../new-backend/src/config/db');
const { initializeFirebase } = require('../new-backend/src/config/firebase');

// Initialize services for Serverless environment
connectDB();
initializeFirebase();

module.exports = app;
