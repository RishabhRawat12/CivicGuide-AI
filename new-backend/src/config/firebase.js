const admin = require('firebase-admin');
const env = require('./env');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

let firebaseInitialized = false;

/**
 * Initializes Firebase Admin SDK with defense-in-depth.
 * Prioritizes environment variables over file-based secrets.
 */
const initializeFirebase = () => {
  try {
    let serviceAccount;

    // 1. Check for JSON string in environment variable (Most secure for Cloud Run/K8s)
    if (env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        winston.error('❌ FIREBASE_SERVICE_ACCOUNT env var is not valid JSON');
      }
    }

    // 2. Restricted File Search (Fallback for local dev)
    if (!serviceAccount && env.NODE_ENV !== 'production') {
      const configDir = __dirname;
      const files = fs.readdirSync(configDir);

      // Strict matching for filename to prevent loading arbitrary JSON
      const serviceAccountFile = files.find(f =>
        f.startsWith('firebase-adminsdk') &&
        f.endsWith('.json') &&
        !f.includes('..'), // Path traversal check
      );

      if (serviceAccountFile) {
        const filePath = path.join(configDir, serviceAccountFile);
        const stats = fs.statSync(filePath);

        // Basic permission check (optional, but good practice)
        if (stats.size > 10000) {
          winston.warn('⚠️ Firebase config file unusually large, skipping for safety.');
        } else {
          serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          winston.info(`📂 Loaded Firebase from file: ${serviceAccountFile}`);
        }
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      winston.info('✅ Firebase Admin initialized via Service Account');
    } else {
      // 3. Final Fallback: ADC (Application Default Credentials)
      // Used when running on GCP (Compute Engine, Cloud Run) without explicit keys
      admin.initializeApp();
      firebaseInitialized = true;
      winston.info('✅ Firebase Admin initialized via Application Default Credentials');
    }
  } catch (error) {
    winston.error('❌ Firebase initialization failed:', { error: error.message });
    if (env.NODE_ENV === 'production') {
      // Critical failure in production should stop the app
      process.exit(1);
    }
  }
};

module.exports = {
  admin,
  initializeFirebase,
  get firebaseInitialized() { return firebaseInitialized; },
};
