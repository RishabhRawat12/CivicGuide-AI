const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public health check
router.get('/health', systemController.getHealth);

// Protected metrics
router.get('/metrics', protect, systemController.getMetrics);

module.exports = router;
