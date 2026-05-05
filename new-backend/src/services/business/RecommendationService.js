/**
 * @fileoverview Recommendation Service — generates personalized voter suggestions
 * Logic: Analyzes category coverage from chat history and profile.
 * @module services/business/RecommendationService
 */
const ChatMessage = require('../../models/ChatMessage');
const winston = require('winston');

class RecommendationService {
  /**
   * Generates smart recommendations based on user's chat history and profile.
   * Logic: Analyzes category coverage and engagement levels.
   * @param {string} userId - User UID
   * @returns {Promise<Array<Object>>} List of personalized recommendations
   */
  async getRecommendations(userId) {
    try {
      // 1. Fetch user's recent message categories
      // Note: In a production app, we would use an aggregation pipeline or
      // a dedicated user_stats collection. For now, we analyze recent messages.
      const recentMessages = await ChatMessage.find({ userId, role: 'assistant' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      const exploredCategories = new Set();
      recentMessages.forEach(msg => {
        if (msg.metadata?.category) {exploredCategories.add(msg.metadata.category);}
      });

      const recommendations = [];
      const coreCategories = [
        { id: 'registration', label: '📝 Voter Registration', suggestion: 'Apply for a new Voter ID (Form 6)' },
        { id: 'corrections', label: '✏️ Name Correction', suggestion: 'Fix errors in your Voter ID (Form 8)' },
        { id: 'booth', label: '📍 Find My Booth', suggestion: 'Locate your polling station online' },
        { id: 'evm_vvpat', label: '🖥️ EVM Awareness', suggestion: 'Learn how to use an EVM & VVPAT machine' },
      ];

      // Suggest what hasn't been explored
      for (const cat of coreCategories) {
        if (!exploredCategories.has(cat.id)) {
          recommendations.push({
            type: 'explore',
            category: cat.id,
            label: cat.label,
            suggestion: cat.suggestion,
            reason: 'Essential step for every voter',
          });
        }
      }

      // Add high-level education recommendation if they are just starting
      if (recentMessages.length < 5) {
        recommendations.unshift({
          type: 'education',
          label: '🧪 Knowledge Quiz',
          suggestion: 'Take our 2-minute quiz to test your election knowledge',
          reason: 'Boost your civic readiness score',
        });
      }

      return recommendations.slice(0, 3);
    } catch (error) {
      winston.error('Recommendation Error:', error.message);
      return [];
    }
  }
}

module.exports = new RecommendationService();
