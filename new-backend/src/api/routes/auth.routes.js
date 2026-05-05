const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../../middlewares/validator.middleware');
const { loginSchema, completeProfileSchema, avatarSchema } = require('../../validators/auth.validator');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/profile', protect, validate(completeProfileSchema), authController.updateProfile);
router.post('/avatar', protect, validate(avatarSchema), authController.uploadAvatar);

module.exports = router;
