const ChatMessage = require('../../models/ChatMessage');
const aiOrchestrator = require('../ai/AIOrchestrator');
const promptService = require('../ai/PromptService');
const nlpService = require('../google/NlpService');
const User = require('../../models/User');
const pubSubService = require('../google/PubSubService');
const voiceService = require('../google/VoiceService');
const translateService = require('../google/TranslateService');
const recommendationService = require('./RecommendationService');
const analyticsService = require('./AnalyticsService');
const winston = require('winston');

class ChatService {
  /**
   * Processes a user message:
   * 1. Detects language and translates if needed.
   * 2. Calls AI Orchestrator (with failover and sanitization).
   * 3. Fetches smart recommendations.
   * 4. Optional Voice synthesis.
   * 5. Saves messages and publishes analytics.
   */
  async handleUserMessage(userId, sessionId, message, options = {}) {
    const startTime = Date.now();

    // 0. Fetch User Context (Proven server logic)
    const user = await User.findOne({ uid: userId }).lean() || {
      name: 'Voter', age: 18, state: 'India', voterStatus: 'unknown', hasVoterId: false,
    };

    // 1. Language Detection & Translation
    let processedMessage = message;
    let originalLanguage = 'en';

    try {
      const detection = await translateService.detectLanguage(message);
      originalLanguage = detection.language;
      if (originalLanguage !== 'en') {
        const translation = await translateService.translateText(message, 'en');
        processedMessage = translation.translatedText;
      }
    } catch (err) {
      winston.warn('Translation Error (continuing with original):', err.message);
    }

    // 2. Fetch context (50-message window for richer conversation memory)
    const history = await ChatMessage.find({ userId, sessionId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // 3. Generate Prompt using Ported Intelligence
    const config = promptService.chat(processedMessage, user, history.reverse());

    // 3.5. NLP Sentiment Analysis (non-blocking, parallel with AI call)
    const sentimentPromise = nlpService.analyzeSentiment(processedMessage);

    // 4. Call AI Orchestrator with proper boundaries
    const aiResult = await aiOrchestrator.generate(config.prompt, config.system);

    // 4.1. Await sentiment result (already running in parallel)
    const sentiment = await sentimentPromise;

    // 4. Translate back if needed
    let finalReply = aiResult.content;
    if (originalLanguage !== 'en') {
      try {
        const backTranslation = await translateService.translateText(finalReply, originalLanguage);
        finalReply = backTranslation.translatedText;
      } catch (err) {
        winston.warn('Back-translation Error:', err.message);
      }
    }

    // 5. Fetch Recommendations (10x Intelligence)
    const recommendations = await recommendationService.getRecommendations(userId);

    // 6. Voice Synthesis (Optional Accessibility)
    let audioUrl = null;
    if (options.wantVoice) {
      try {
        const audioBuffer = await voiceService.synthesizeSpeech(finalReply, originalLanguage);
        // In a real app, upload buffer to GCS and return signed URL
        audioUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
      } catch (err) {
        winston.error('Voice Synthesis Error:', err.message);
      }
    }

    const responseTimeMs = Date.now() - startTime;

    // 7. Save Messages
    await ChatMessage.create({
      userId,
      sessionId,
      role: 'user',
      content: message,
    });

    const assistantMsg = await ChatMessage.create({
      userId,
      sessionId,
      role: 'assistant',
      content: finalReply,
      metadata: {
        provider: aiResult.provider,
        responseTimeMs,
        language: originalLanguage,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        recommendations,
        audioUrl,
      },
    });

    // 8. Async Analytics
    analyticsService.logInteraction({
      uid: userId,
      query: message,
      response: finalReply,
      provider: aiResult.provider,
      endpoint: 'chat',
      responseTimeMs,
    });

    pubSubService.publishEvent({
      userId,
      eventType: 'chat_processed',
      payload: {
        provider: aiResult.provider,
        responseTimeMs,
        language: originalLanguage,
        hasRecommendations: recommendations.length > 0,
        hasVoice: !!audioUrl,
      },
    });

    return assistantMsg;
  }

  async getChatHistory(uid, sessionId) {
    const query = { userId: uid };
    if (sessionId) {query.sessionId = sessionId;}

    return await ChatMessage.find(query)
      .sort({ createdAt: 1 });
  }
}

module.exports = new ChatService();

