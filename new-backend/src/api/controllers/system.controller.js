/**
 * @fileoverview System Controller — deep health monitoring for all services
 * @module api/controllers/system
 */
const healthService = require('../../services/business/HealthService');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * Returns comprehensive health status of all subsystems.
 * @route GET /api/system/health
 */
const getHealth = asyncHandler(async (req, res) => {
  const healthData = await healthService.getFullStatus();
  res.json(healthData);
});

/**
 * Returns system performance metrics (protected).
 * @route GET /api/system/metrics
 */
const getMetrics = asyncHandler(async (req, res) => {
  const healthData = await healthService.getFullStatus();
  res.json({
    success: true,
    data: {
      uptime: healthData.metrics.uptime,
      memory: healthData.metrics.memory,
      timestamp: healthData.timestamp,
      aiStats: healthData.ai.stats
    }
  });
});

module.exports = { 
  getHealth,
  getMetrics
};
