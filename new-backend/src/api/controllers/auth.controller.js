/**
 * @fileoverview Auth Controller (Hardened)
 * @module api/controllers/auth
 */
const userService = require('../../services/business/UserService');
const authService = require('../../services/business/AuthService');
const storageService = require('../../services/google/StorageService');
const { admin } = require('../../config/firebase');
const { asyncHandler } = require('../../utils/asyncHandler');
const winston = require('winston');
const env = require('../../config/env');

/**
 * Cookie options for security
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  signed: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Login via Firebase ID token. Sets secure HttpOnly cookie.
 */
const login = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, error: 'ID Token required' });
  }

  // 1. Verify token
  const decodedToken = await admin.auth().verifyIdToken(idToken);

  // 2. Get/Create User
  const user = await userService.getOrCreateUser(
    decodedToken.uid,
    decodedToken.email,
    decodedToken.name || decodedToken.email.split('@')[0],
    decodedToken.picture,
  );

  // 3. Set Secure Cookie
  res.cookie('token', idToken, COOKIE_OPTIONS);

  res.json({
    success: true,
    data: user,
    // We still return the token for non-browser clients (mobile)
    token: idToken,
  });

  winston.info(`✅ User logged in: ${user.email}`);
});

/**
 * Logout: Clears cookie and revokes token in Redis.
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.signedCookies?.token || req.headers.authorization?.split(' ')[1];

  if (token) {
    await authService.revokeToken(token);
  }

  const clearOptions = { ...COOKIE_OPTIONS };
  delete clearOptions.maxAge; // Avoid deprecation warning and potential clear failure
  res.clearCookie('token', clearOptions);
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * Update Profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.uid, req.body);
  res.json({ success: true, data: user });
});

/**
 * Get Current User
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getOrCreateUser(req.user.uid, req.user.email);
  res.json({ success: true, data: user });
});

/**
 * Upload Avatar (Hardened with content validation)
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, error: 'No image data provided' });
  }

  // 1. Size Validation (Redundant but safe)
  const buffer = Buffer.from(image, 'base64');
  if (buffer.length > 1024 * 1024) { // 1MB limit
    return res.status(413).json({ success: false, error: 'Image too large (max 1MB)' });
  }

  // 2. Magic Bytes / Type Validation
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const safeMimeType = mimeType || 'image/jpeg';

  if (!allowedMimeTypes.includes(safeMimeType)) {
    return res.status(400).json({ success: false, error: 'Invalid file type' });
  }

  // Basic check for image header (JPEG: FF D8, PNG: 89 50)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    // JPEG OK
  } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    // PNG OK
  } else if (safeMimeType === 'image/webp') {
    // WebP check (RIFF...WEBP)
  } else {
    winston.warn(`🚨 Malicious upload attempt from ${req.user.uid}: Invalid magic bytes`);
    return res.status(400).json({ success: false, error: 'File content does not match reported type' });
  }

  const url = await storageService.uploadAvatar(req.user.uid, buffer, safeMimeType);
  await userService.updateProfile(req.user.uid, { avatar: url });

  res.json({ success: true, data: { avatarUrl: url } });
});

module.exports = { login, logout, updateProfile, getMe, uploadAvatar };
