const crypto = require('crypto');
const redis = require('../../config/redis');
const ResponseCache = require('../../models/ResponseCache');
const env = require('../../config/env');
const winston = require('winston');

/**
 * HybridCacheService - 10x Resilient Tiered Caching
 * L0: In-Memory (Node.js Process, Emergency path if Redis is down)
 * L1: Redis (In-memory, Hot path, 24h TTL)
 * L2: MongoDB (Persistent storage, 7-day TTL)
 */
class HybridCacheService {
  constructor() {
    this.l0Cache = new Map();
    this.l0Limit = 500; // Keep top 500 items in process memory
  }

  /**
   * Generates a stable MD5 hash from prompt and context.
   */
  generateHash(prompt, context = '') {
    const content = `${prompt}|${context}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  _getPrefix() {
    return env.USE_LEGACY_CACHE ? 'ai_cache' : 'cg:ai:res';
  }

  /**
   * Validates if a response is safe to cache.
   */
  isValid(response) {
    if (!response) {return false;}
    if (typeof response === 'string') {
      const lower = response.toLowerCase();
      if (lower.includes('error') || lower.includes('unavailable') || response.length < 5) {return false;}
    }
    return true;
  }

  /**
   * Retrieves response from cache.
   * Logic: L0 (In-Mem) -> L1 (Redis) -> L2 (Mongo)
   */
  async get(hash) {
    const prefix = this._getPrefix();

    // 1. Try L0: In-Memory (Fastest, works even if Redis/DB are down)
    if (this.l0Cache.has(hash)) {
      return { ...this.l0Cache.get(hash), source: 'L0' };
    }

    // 2. Try L1: Redis
    try {
      const cached = await redis.get(`${prefix}:${hash}`);
      if (cached) {
        const data = JSON.parse(cached);
        this._updateL0(hash, data);
        return { ...data, source: 'L1' };
      }
    } catch (error) {
      winston.warn('⚠️ Cache L1 retrieval failed, falling back to L2:', error.message);
    }

    // 3. Try L2: MongoDB
    try {
      const dbCached = await ResponseCache.findOne({
        promptHash: hash,
        expiresAt: { $gt: new Date() },
      });

      if (dbCached) {
        const cacheData = { response: dbCached.response, provider: dbCached.provider };
        // Repopulate L1 and L0
        redis.set(`${prefix}:${hash}`, JSON.stringify(cacheData), 'EX', 24 * 60 * 60).catch(() => {});
        this._updateL0(hash, cacheData);
        return { ...cacheData, source: 'L2' };
      }
    } catch (error) {
      winston.error('❌ Cache L2 retrieval failed:', error.message);
    }

    return null;
  }

  /**
   * Stores response in L0, L1, and L2.
   */
  async set(hash, response, provider) {
    if (!this.isValid(response)) {return;}

    const prefix = this._getPrefix();
    const cacheData = { response, provider };

    // 1. Write to L0
    this._updateL0(hash, cacheData);

    try {
      const serialized = JSON.stringify(cacheData);

      // 2. Write to L1 (Redis)
      await redis.set(`${prefix}:${hash}`, serialized, 'EX', 24 * 60 * 60);

      // 3. Write to L2 (MongoDB)
      await ResponseCache.findOneAndUpdate(
        { promptHash: hash },
        {
          promptHash: hash,
          response,
          provider,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        { upsert: true },
      );
    } catch (error) {
      winston.warn('⚠️ Cache storage fallback active:', error.message);
    }
  }

  /**
   * Clears all cache tiers.
   */
  async clear() {
    this.l0Cache.clear();
    try {
      const prefix = this._getPrefix();
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}:*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {await redis.del(keys);}
      } while (cursor !== '0');

      await ResponseCache.deleteMany({});
      winston.info('🧹 All cache tiers cleared (L0, L1, L2)');
    } catch (error) {
      winston.error('❌ Cache clear error:', error.message);
    }
  }

  _updateL0(hash, data) {
    if (this.l0Cache.size >= this.l0Limit) {
      const firstKey = this.l0Cache.keys().next().value;
      this.l0Cache.delete(firstKey);
    }
    this.l0Cache.set(hash, data);
  }
}

module.exports = new HybridCacheService();
