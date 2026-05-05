const { admin } = require('../config/firebase');
const User = require('../models/User');
const redis = require('../config/redis');
const winston = require('winston');
const env = require('../config/env');

/**
 * Verifies Identity using Defense-in-Depth.
 * 1. Checks Authorization Header (Bearer) - Mobile/API fallback.
 * 2. Checks HttpOnly Cookie (token) - Primary Web method.
 * 3. Verifies Token via Firebase Admin.
 * 4. Checks Redis denylist for revoked tokens.
 * 5. Verifies user exists in DB.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Header or Cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.signedCookies?.token) {
      token = req.signedCookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // 2. Check Redis Denylist (revoked tokens)
    try {
      if (redis.status === 'ready') {
        const isRevoked = await redis.get(`revoked_token:${token}`);
        if (isRevoked) {
          winston.warn(`🚨 Revoked token attempt: ${token.substring(0, 10)}...`);
          return res.status(401).json({ success: false, error: 'Token has been revoked' });
        }
      } else {
        winston.warn(`⚠️ Redis not ready for denylist check: status=${redis.status}`);
      }
    } catch (err) {
      winston.warn(`Redis denylist check bypassed due to connection issue: ${err.message}`);
    }

    // 3. Verify Firebase Token
    // verifyIdToken returns decoded payload or throws
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 4. Attach identity to request
    // CRITICAL: This is the ONLY source of truth for userId from here on.
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    // 5. Verify user still exists in DB
    const dbUser = await User.findOne({ uid: decodedToken.uid }).select('_id uid email');
    if (!dbUser) {
      winston.warn(`🚨 Auth valid but user not in DB: ${decodedToken.uid}`);
      return res.status(401).json({ success: false, error: 'User account not found' });
    }

    next();
  } catch (error) {
    // Sanitize log to prevent sensitive data leaks
    winston.error('❌ Authentication Failure:', {
      code: error.code,
      message: error.message,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Invalid or expired session',
      code: env.NODE_ENV === 'production' ? 'auth/invalid-session' : error.code,
    });
  }
};

module.exports = { protect };
