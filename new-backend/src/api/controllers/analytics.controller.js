/**
 * @fileoverview Analytics Controller — user insights, recommendations, global stats
 * @module api/controllers/analytics
 */
const analyticsService = require('../../services/business/AnalyticsService');
const { asyncHandler } = require('../../utils/asyncHandler');

/** @route GET /api/civic/analytics/insights */
const getUserInsights = asyncHandler(async (req, res) => {
  const data = await analyticsService.getUserInsights(req.user.uid);
  res.json({ success: true, data });
});

/** @route GET /api/civic/analytics/recommendations */
const getRecommendations = asyncHandler(async (req, res) => {
  const data = await analyticsService.getRecommendations(req.user.uid);
  res.json({ success: true, data });
});

/** @route GET /api/civic/analytics/stats */
const getGlobalStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getGlobalStats();
  res.json({ success: true, data });
});

module.exports = {
  getUserInsights,
  getRecommendations,
  getGlobalStats,
};
