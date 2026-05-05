/**
 * @fileoverview Analytics Service — Config-driven behavioral insights
 */
const QueryLog = require('../../models/QueryLog');
const { log } = require('../../utils/logger');

const CATEGORY_MAP = [
  { keywords: ['register', 'form 6', 'enrollment'], category: 'registration' },
  { keywords: ['voter id', 'epic', 'voter card'], category: 'voter_id' },
  { keywords: ['booth', 'polling', 'station'], category: 'booth' },
  { keywords: ['evm', 'vvpat', 'machine'], category: 'evm_vvpat' },
  { keywords: ['correction', 'mismatch', 'error'], category: 'corrections' },
  { keywords: ['nri', 'overseas', 'abroad'], category: 'nri' },
  { keywords: ['complaint', 'cvigil', 'violation'], category: 'complaints' },
  { keywords: ['aadhaar', 'link'], category: 'aadhaar' },
  { keywords: ['lost', 'duplicate', 'deleted'], category: 'lost_id' },
  { keywords: ['senior', 'disability', 'pwd'], category: 'accessibility' },
  { keywords: ['postal', 'ballot'], category: 'postal' },
];

class AnalyticsService {
  /**
   * Logs an interaction with keyword-based auto-categorization
   */
  async logInteraction({ uid, query, response, provider, endpoint, responseTimeMs, cached }) {
    try {
      const category = this._categorizeQuery(query);
      await QueryLog.create({
        uid,
        query: query.substring(0, 500),
        response: (response || '').substring(0, 500),
        provider: provider || 'gemini',
        endpoint: endpoint || 'chat',
        category,
        responseTimeMs: responseTimeMs || 0,
        cached: cached || false,
      });
    } catch (error) {
      log.error('Analytics: Failed to log interaction', { error: error.message, uid });
    }
  }

  _categorizeQuery(query) {
    const lower = (query || '').toLowerCase();
    const match = CATEGORY_MAP.find(m => m.keywords.some(k => lower.includes(k)));
    return match ? match.category : 'general';
  }

  async getUserInsights(uid) {
    try {
      const [totalQueries, topCategories, recentQueries, avgResponseTime] = await Promise.all([
        QueryLog.countDocuments({ uid }),
        QueryLog.aggregate([
          { $match: { uid } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        QueryLog.find({ uid })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('query category createdAt provider responseTimeMs')
          .lean(),
        QueryLog.aggregate([
          { $match: { uid } },
          { $group: { _id: null, avgTime: { $avg: '$responseTimeMs' } } },
        ]),
      ]);

      return {
        uid,
        totalQueries,
        topCategories: topCategories.map(c => ({ category: c._id, count: c.count })),
        recentQueries,
        avgResponseTimeMs: Math.round(avgResponseTime[0]?.avgTime || 0),
        engagementLevel: totalQueries >= 20 ? 'high' : totalQueries >= 5 ? 'medium' : 'low',
      };
    } catch (error) {
      log.error('Analytics: Failed to get user insights', { error: error.message, uid });
      return this._getDefaultInsights(uid);
    }
  }

  _getDefaultInsights(uid) {
    return { uid, totalQueries: 0, topCategories: [], recentQueries: [], avgResponseTimeMs: 0, engagementLevel: 'low' };
  }

  async getGlobalStats() {
    try {
      const [stats, topCategories, providerBreakdown] = await Promise.all([
        QueryLog.aggregate([
          {
            $group: {
              _id: null,
              totalQueries: { $sum: 1 },
              avgResponseTime: { $avg: '$responseTimeMs' },
              cacheHitRate: { $avg: { $cond: ['$cached', 1, 0] } },
            },
          },
        ]),
        QueryLog.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        QueryLog.aggregate([
          { $group: { _id: '$provider', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        totalQueries: stats[0]?.totalQueries || 0,
        avgResponseTimeMs: Math.round(stats[0]?.avgResponseTime || 0),
        cacheHitRate: (stats[0]?.cacheHitRate || 0) * 100,
        topCategories: topCategories.map(c => ({ category: c._id, count: c.count })),
        providerBreakdown: providerBreakdown.map(p => ({ provider: p._id, count: p.count })),
      };
    } catch (error) {
      log.error('Analytics: Failed to get global stats', { error: error.message });
      return { totalQueries: 0, avgResponseTimeMs: 0, cacheHitRate: 0, topCategories: [], providerBreakdown: [] };
    }
  }

  async getRecommendations(uid) {
    try {
      const insights = await this.getUserInsights(uid);
      const recommendations = [];

      if (insights.totalQueries < 5) {
        recommendations.push('Try asking about your polling booth location!');
      }

      if (!insights.topCategories.some(c => c.category === 'registration')) {
        recommendations.push('Have you checked your voter registration status?');
      }

      return recommendations;
    } catch (error) {
      log.error('Analytics: Failed to get recommendations', { error: error.message, uid });
      return ['Explore more civic features to get personalized tips!'];
    }
  }
}

module.exports = new AnalyticsService();
