/**
 * @fileoverview CivicGuide Express Application (Hardened Edition)
 * Production-grade Election Process Education Backend
 * @module app
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middlewares/error.middleware');
const { generalLimiter } = require('./middlewares/rateLimiter.middleware');
const { requestId } = require('./middlewares/requestId.middleware');
const authRoutes = require('./api/routes/auth.routes');
const chatRoutes = require('./api/routes/chat.routes');
const civicRoutes = require('./api/routes/civic.routes');
const systemRoutes = require('./api/routes/system.routes');
const env = require('./config/env');

const app = express();

// 0. Trust Proxy (Required for rate limiting and secure cookies on Cloud Run/Vercel)
app.set('trust proxy', 1);

// 1. Core Request Handling
app.use(requestId);
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: '1mb' }));

// 2. Security Middlewares (Defense-in-Depth)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.gstatic.com', 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://*.googleusercontent.com', 'https://storage.googleapis.com'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseapp.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(mongoSanitize());
app.use(generalLimiter);

// 3. CORS Configuration (Permissive for Vercel/Preview)
app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin for preview deployments and local development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  maxAge: 86400,
}));

// Handle OPTIONS preflight for all routes
app.options('*', cors());

// 4. CSRF Protection (Custom Header Enforcement)
// This is more robust for APIs than traditional token-based CSRF
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                           req.headers['x-csrf-token'] ||
                           req.headers['x-requested-by'];

    if (!hasCustomHeader) {
      winston.warn(`🚨 CSRF Block Attempt: Missing custom header on ${req.method} ${req.path}`);
      return res.status(403).json({
        success: false,
        error: 'CSRF Protection: Missing security header (e.g., X-Requested-With)',
      });
    }
  }
  next();
});

// 5. Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: message => winston.info(message.trim()) },
    skip: (req) => req.path === '/api/system/health', // Skip health checks to reduce noise
  }));
}

// 6. Static Files (Restricted access)
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// 7. API Routes (Mounted at both /api and root to handle various proxy configurations)
const mountRoutes = (base) => {
  app.use(`${base}/auth`, authRoutes);
  app.use(`${base}/chat`, chatRoutes);
  app.use(`${base}/civic`, civicRoutes);
  app.use(`${base}/system`, systemRoutes);
};

mountRoutes('/api');
mountRoutes(''); // Fallback for when /api is already stripped by Vercel/Proxy

// 8. Serve Frontend in Production
if (env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });
}

// Legacy Path for Health Check
app.get('/health', (req, res) => res.redirect('/api/system/health'));

// 9. Error Handling (must be last)
app.use(errorHandler);

module.exports = app;
