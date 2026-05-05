/**
 * @fileoverview AI Orchestrator — High-Reliability AI Gateway
 * Implements: Retries, Timeouts, Circuit Breakers, and Hybrid Caching.
 */
const geminiService = require('./GeminiService');
const mistralService = require('./MistralService');
const fallbacks = require('./content/fallbacks');
const cacheService = require('../cache/HybridCacheService');
const { sanitizeResponse } = require('../../utils/sanitizer');
const { log } = require('../../utils/logger');

class AIOrchestrator {
  constructor() {
    this.circuitBreakers = new Map(); // provider -> { failureCount, lastFailure, state: 'CLOSED'|'OPEN' }
    this.cbThreshold = 3;
    this.cbResetTimeout = 60000; // 1 min

    this.metrics = {
      mistral: [],
      gemini: [],
      maxSamples: 10,
    };

    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      mistralSuccess: 0,
      mistralFailure: 0,
      geminiSuccess: 0,
      geminiFailure: 0,
      fallbackUsed: 0,
    };
  }

  /**
   * Circuit Breaker Logic
   */
  _isCircuitOpen(provider) {
    const cb = this.circuitBreakers.get(provider);
    if (!cb || cb.state === 'CLOSED') {return false;}

    if (Date.now() - cb.lastFailure > this.cbResetTimeout) {
      log.info(`🔌 AIOrchestrator: Attempting Half-Open for ${provider}`);
      cb.state = 'HALF_OPEN';
      return false;
    }
    return true;
  }

  _recordFailure(provider, error) {
    const cb = this.circuitBreakers.get(provider) || { failureCount: 0, lastFailure: 0, state: 'CLOSED' };
    cb.failureCount++;
    cb.lastFailure = Date.now();

    if (cb.failureCount >= this.cbThreshold) {
      cb.state = 'OPEN';
      log.error(`🚨 AIOrchestrator: Circuit OPEN for ${provider} due to: ${error.message}`);
    }
    this.circuitBreakers.set(provider, cb);
  }

  _recordSuccess(provider) {
    this.circuitBreakers.set(provider, { failureCount: 0, lastFailure: 0, state: 'CLOSED' });
  }

  /**
   * Retry with Exponential Backoff
   */
  async _withRetry(fn, provider, maxRetries = 2) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000)),
        ]);
        this._recordSuccess(provider);
        return result;
      } catch (error) {
        attempt++;
        log.warn(`⚠️ AIOrchestrator: ${provider} attempt ${attempt} failed: ${error.message}`);

        if (attempt > maxRetries || error.message === 'TIMEOUT' || error.message.includes('401')) {
          this._recordFailure(provider, error);
          throw error;
        }

        // Exponential backoff: 500ms, 1000ms...
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Main Orchestration Logic
   */
  async generate(prompt, systemPrompt = '', useCache = true) {
    this.stats.totalRequests++;
    const hash = cacheService.generateHash(prompt, systemPrompt);

    if (useCache) {
      const cached = await cacheService.get(hash);
      if (cached) {
        this.stats.cacheHits++;
        return { content: sanitizeResponse(cached.response), provider: 'cache' };
      }
    }

    // Provider Selection logic (Metrics-based)
    const providers = [
      { id: 'gemini', service: geminiService },
      { id: 'mistral', service: mistralService },
    ].sort((a, b) => this._getAvgResponseTime(a.id) - this._getAvgResponseTime(b.id));

    for (const provider of providers) {
      if (provider.service.isAvailable() && !this._isCircuitOpen(provider.id)) {
        try {
          const start = Date.now();
          const response = await this._withRetry(async () => {
            if (provider.id === 'gemini') {
              return await geminiService.generateResponse(prompt, [{ role: 'system', content: systemPrompt }]);
            }
            return await mistralService.generate(prompt, systemPrompt);
          }, provider.id);

          const duration = Date.now() - start;
          this._trackMetric(provider.id, duration);
          this.stats[`${provider.id}Success`]++;

          if (useCache) {await cacheService.set(hash, response.content, provider.id).catch(() => {});}
          return { content: sanitizeResponse(response.content), provider: provider.id, responseTime: duration };
        } catch (error) {
          this.stats[`${provider.id}Failure`]++;
          // Continue to next provider
        }
      }
    }

    // Final Fallback
    this.stats.fallbackUsed++;
    log.warn('🚨 AIOrchestrator: All providers failed. Returning fallback content.');
    return {
      content: sanitizeResponse(fallbacks.get(prompt)),
      provider: 'hardcoded_fallback',
      error: 'AI services temporarily unavailable',
    };
  }

  async generateStructured(prompt, systemPrompt, schema) {
    this.stats.totalRequests++;

    if (geminiService.isAvailable() && !this._isCircuitOpen('gemini')) {
      try {
        return await this._withRetry(
          () => geminiService.generateStructuredResponse(prompt, systemPrompt, schema),
          'gemini',
        );
      } catch (error) {
        log.error('❌ Gemini Structured failed, trying Mistral fallback');
      }
    }

    // Mistral Fallback with JSON parsing
    try {
      const response = await this._withRetry(
        () => mistralService.generate(prompt, `${systemPrompt}\nIMPORTANT: Respond in strict JSON format.`),
        'mistral',
      );
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return schema.parse(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      log.warn('⚠️ Mistral Structured fallback failed');
    }

    // Deterministic fallback based on prompt keywords
    this.stats.fallbackUsed++;
    const lower = prompt.toLowerCase();
    if (lower.includes('journey')) {return fallbacks.getStructured('journey');}
    if (lower.includes('timeline')) {return fallbacks.getStructured('timeline');}
    if (lower.includes('quiz')) {return fallbacks.getStructured('quiz');}

    throw new Error('All AI providers and fallback schemas failed');
  }

  _trackMetric(provider, responseTime) {
    const samples = this.metrics[provider];
    samples.push(responseTime);
    if (samples.length > this.metrics.maxSamples) {samples.shift();}
  }

  _getAvgResponseTime(provider) {
    const samples = this.metrics[provider];
    if (!samples || samples.length === 0) {return 0;}
    return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  }

  async translate(text, targetLanguage) {
    const prompt = `Translate to ${targetLanguage}: "${text}"`;
    const system = 'You are a professional translator. Return ONLY the translated text.';
    try {
      const result = await this.generate(prompt, system, false);
      if (result.provider === 'hardcoded_fallback') {return text;}
      return sanitizeResponse(result.content);
    } catch (error) {
      return text;
    }

  }

  async getStatus() {
    return {
      status: 'active',
      providers: {
        gemini: { available: geminiService.isAvailable(), cb: this.circuitBreakers.get('gemini')?.state || 'CLOSED' },
        mistral: { available: mistralService.isAvailable(), cb: this.circuitBreakers.get('mistral')?.state || 'CLOSED' },
      },
      stats: this.stats,
    };
  }
}

module.exports = new AIOrchestrator();
