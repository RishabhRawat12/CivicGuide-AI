/**
 * @fileoverview Scenario Service — handles electoral simulation scenarios
 */
const aiOrchestrator = require('../ai/AIOrchestrator');
const promptService = require('../ai/PromptService');
const cacheService = require('../cache/HybridCacheService');
const analyticsService = require('./AnalyticsService');
const userRepository = require('../../repositories/UserRepository');
const { log } = require('../../utils/logger');
const { FALLBACK_SCENARIOS } = require('../ai/content/scenarios');
const { NotFoundError } = require('../../utils/errors');

class ScenarioService {
  /**
   * Simulates an electoral scenario for a user.
   */
  async simulate(uid, type) {
    const user = await userRepository.findByUid(uid);
    if (!user) {throw new NotFoundError('User profile not found');}

    if (!FALLBACK_SCENARIOS[type]) {
      throw new NotFoundError(`Scenario type "${type}" not found`);
    }

    const config = promptService.scenario(type, user);

    const hash = cacheService.generateHash(config.prompt, config.system);

    const startTime = Date.now();
    try {
      const cached = await cacheService.get(hash);
      if (cached) {return cached.response;}

      const result = await aiOrchestrator.generateStructured(config.prompt, config.system, config.schema);
      await cacheService.set(hash, result, 'gemini').catch(() => {});

      analyticsService.logInteraction({
        uid,
        query: `Simulate: ${type}`,
        response: result.title,
        provider: 'gemini',
        endpoint: 'scenario',
        responseTimeMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {throw error;}
      log.error(`Scenario simulation failed for ${type}`, { error: error.message, uid });
      return FALLBACK_SCENARIOS[type] || FALLBACK_SCENARIOS.first_time_voter;
    }
  }

  getAvailableScenarios() {
    return Object.keys(FALLBACK_SCENARIOS).map(key => ({
      id: key,
      title: FALLBACK_SCENARIOS[key].title,
      icon: FALLBACK_SCENARIOS[key].icon,
      description: FALLBACK_SCENARIOS[key].description,
    }));
  }
}

module.exports = new ScenarioService();
