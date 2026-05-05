const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { validate } = require('../../middlewares/validator.middleware');
const { sendMessageSchema } = require('../../validators/chat.validator');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

router.post('/', protect, authLimiter, validate(sendMessageSchema), chatController.sendMessage);
router.get('/history', protect, chatController.getHistory); // General history
router.get('/history/:sessionId', protect, chatController.getHistory); // Specific session history

module.exports = router;
