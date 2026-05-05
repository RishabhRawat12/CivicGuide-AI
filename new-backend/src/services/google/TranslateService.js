const winston = require('winston');
const aiOrchestrator = require('../ai/AIOrchestrator');
const { z } = require('zod');

class TranslateService {
  constructor() {
    winston.info('🌐 TranslateService initialized in Zero-Cost (AI-only) mode');
  }

  isAvailable() {
    return true; // Orchestrator handles availability
  }

  /**
   * Detects language using AI Orchestrator (Zero-Cost)
   */
  async detectLanguage(text) {
    try {
      const schema = z.object({
        language: z.string().describe('ISO 639-1 language code'),
        confidence: z.number().min(0).max(1),
      });

      return await aiOrchestrator.generateStructured(
        `Detect the language of this text: "${text}"`,
        'You are a language detection expert. Return only the ISO code and confidence score in JSON.',
        schema,
      );
    } catch (error) {
      winston.warn('AI Language detection failed, defaulting to English:', error.message);
      return { language: 'en', confidence: 1.0 };
    }
  }

  /**
   * Translates text using AI Orchestrator (Zero-Cost)
   */
  async translateText(text, targetLanguage, targetLanguageName = 'the target language') {
    try {
      // Use the robust translate method we just refined in AIOrchestrator
      return await aiOrchestrator.translate(text, targetLanguageName || targetLanguage);
    } catch (error) {
      winston.error(`❌ Zero-Cost Translation failed for ${targetLanguage}:`, error.message);
      return text; // Return original on total failure
    }
  }
}

module.exports = new TranslateService();
