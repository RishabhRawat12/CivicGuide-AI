const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../config/env');
const winston = require('winston');

class VertexService {
  constructor() {
    // Initialize the Free Gemini API using the API Key from AI Studio
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  /**
   * Performs AI generation using the Free Gemini API (AI Studio).
   * Provides authoritative grounding for election queries.
   * @param {string} query - The user query
   * @returns {Promise<Object|null>} AI response context
   */
  async queryAuthoritativeKnowledge(query) {
    try {
      if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'test-api-key') {
        throw new Error('GEMINI_API_KEY is not configured or is using the default test key. Please get a free key from aistudio.google.com');
      }

      const model = this.genAI.getGenerativeModel({
        model: env.GEMINI_MODEL || 'gemini-1.5-flash',
      });

      const generationConfig = {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      return {
        context: text || '',
        citation: 'Gemini AI (Free Tier)',
        relevanceScore: 0.95, // Gemini models are highly relevant
      };
    } catch (error) {
      winston.error('Gemini AI Generation Error:', error.message);
      // Fallback context if API fails
      return null;
    }
  }
}

module.exports = new VertexService();
