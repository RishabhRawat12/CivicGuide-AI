/**
 * @fileoverview Civic Service — Orchestrates voter education logic
 */
const promptService = require('../ai/PromptService');
const aiOrchestrator = require('../ai/AIOrchestrator');
const cacheService = require('../cache/HybridCacheService');
const mapsService = require('../google/MapsService');
const analyticsService = require('./AnalyticsService');
const userRepository = require('../../repositories/UserRepository');
const checklistRepository = require('../../repositories/ChecklistRepository');
const quizRepository = require('../../repositories/QuizRepository');
const { DEFAULT_CHECKLIST_ITEMS, BOOTH_GUIDE } = require('../../config/constants/civic.constants');
const { NotFoundError } = require('../../utils/errors');

class CivicService {
  /**
   * Generates a personalized roadmap for the user
   */
  async getPersonalizedJourney(uid) {
    const user = await userRepository.findByUid(uid);
    if (!user) {throw new NotFoundError('User profile not found');}

    const config = promptService.journey(user);
    const hash = cacheService.generateHash(config.prompt, config.system);

    const cached = await cacheService.get(hash);
    if (cached) {return cached.response;}

    try {
      const response = await aiOrchestrator.generateStructured(config.prompt, config.system, config.schema);
      await cacheService.set(hash, response, 'gemini').catch(() => {});

      analyticsService.logInteraction({
        uid,
        query: 'Generate Journey',
        response: response.summary,
        provider: 'gemini',
        endpoint: 'journey',
      });

      return response;
    } catch (error) {
      log.warn(`AI Journey generation failed, returning fallback for ${uid}`);
      const fallbacks = require('../ai/content/fallbacks');
      return fallbacks.getStructured('journey') || { summary: 'Voting Journey', steps: [] };
    }




  }

  /**
   * Calculates readiness score using hybrid AI + Deterministic logic
   */
  async getReadinessScore(uid) {
    const user = await userRepository.findByUid(uid);
    if (!user) {throw new NotFoundError('User profile not found');}

    const checklist = await this.getChecklist(uid);
    const config = promptService.readiness(user, checklist.items);

    try {
      const aiResponse = await aiOrchestrator.generateStructured(config.prompt, config.system, config.schema);
      const finalScore = Math.round((aiResponse.score + (user.readinessScore || 0)) / 2);
      return { ...aiResponse, score: finalScore };
    } catch (error) {
      log.warn(`AI Readiness score failed, returning deterministic fallback for ${uid}`);
      const { getStructured } = require('../ai/content/fallbacks');
      const fallback = getStructured('readiness');
      return { ...fallback, score: user.readinessScore || 0 };
    }

  }

  /**
   * Fetches/Initializes voter readiness checklist
   */
  async getChecklist(uid) {
    const user = await userRepository.findByUid(uid);
    let checklist = await checklistRepository.findByUid(uid);

    if (!checklist) {
      const items = DEFAULT_CHECKLIST_ITEMS.map(item => {
        let completed = false;
        if (user) {
          if (item.key === 'check_eligibility' && user.age >= 18) {completed = true;}
          if (item.key === 'register' && user.voterStatus === 'registered') {completed = true;}
          if (item.key === 'get_voter_id' && user.hasVoterId) {completed = true;}
        }
        return { ...item, completed, completedAt: completed ? new Date() : null };
      });

      checklist = await checklistRepository.create(uid, items);
    }
    return checklist;
  }

  async updateChecklist(uid, items) {
    return await checklistRepository.updateItems(uid, items);
  }

  /**
   * AI-generated Quiz based on current status
   */
  async getQuiz(uid) {
    const user = await userRepository.findByUid(uid);
    const config = promptService.quiz(user);
    const hash = cacheService.generateHash(config.prompt, config.system);
    const cached = await cacheService.get(hash);
    if (cached) {return cached.response;}

    const response = await aiOrchestrator.generateStructured(config.prompt, config.system, config.schema);
    await cacheService.set(hash, response, 'gemini').catch(() => {});
    return response;
  }

  /**
   * AI-generated Timeline of key dates
   */
  async getTimeline(uid) {
    const user = await userRepository.findByUid(uid);
    if (!user) {throw new NotFoundError('User profile not found');}

    const config = promptService.timeline(user);
    const hash = cacheService.generateHash(config.prompt, config.system);
    const cached = await cacheService.get(hash);
    if (cached) {return cached.response;}

    const response = await aiOrchestrator.generateStructured(config.prompt, config.system, config.schema);
    await cacheService.set(hash, response, 'gemini').catch(() => {});
    return response;
  }

  async saveQuizResult(uid, resultData) {
    const result = await quizRepository.createResult({
      uid,
      score: resultData.score,
      totalQuestions: resultData.totalQuestions,
      correctAnswers: resultData.correctAnswers,
      category: resultData.category || 'General',
      timestamp: new Date(),
    });

    analyticsService.logInteraction({
      uid,
      query: 'Save Quiz Result',
      response: `Score: ${result.score}/${result.totalQuestions}`,
      provider: 'local',
      endpoint: 'quiz',
    });

    return result;
  }

  async getQuizResults(uid) {
    return await quizRepository.findByUid(uid);
  }

  /**
   * Combines Maps data with Educational Guidance
   */
  async getBoothGuidance(uid, pincode, location) {
    const user = await userRepository.findByUid(uid);
    const mapsData = await mapsService.findBoothAndRoute(location, pincode || user?.pincode);

    return {
      ...mapsData,
      educationalGuide: BOOTH_GUIDE,
    };
  }
}

module.exports = new CivicService();
