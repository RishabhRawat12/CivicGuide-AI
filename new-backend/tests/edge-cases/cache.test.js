const hybridCache = require('../../src/services/cache/HybridCacheService');
const redis = require('../../src/config/redis');
const ResponseCache = require('../../src/models/ResponseCache');

describe('Hybrid Cache Service - Tiered Validation', () => {
  const testKey = 'test_hash';
  const testResponse = 'Validated AI Response';
  const provider = 'gemini';

  beforeEach(async () => {
    await hybridCache.clear();
    jest.clearAllMocks();
    ResponseCache.exec.mockReset();
    ResponseCache.exec.mockResolvedValue(null);
  });

  it('should store and retrieve from L0 (In-Memory) first', async () => {
    await hybridCache.set(testKey, testResponse, provider);
    
    // Retrieval should be instantaneous from L0
    const cached = await hybridCache.get(testKey);
    expect(cached.response).toBe(testResponse);
    expect(cached.source).toBe('L0');
  });

  it('should fall back to L1 (Redis) if L0 is cleared', async () => {
    await hybridCache.set(testKey, testResponse, provider);
    
    // Clear only L0
    hybridCache.l0Cache.clear();

    const cached = await hybridCache.get(testKey);
    expect(cached.response).toBe(testResponse);
    expect(cached.source).toBe('L1');
    
    // Verify L0 was repopulated
    expect(hybridCache.l0Cache.has(testKey)).toBe(true);
  });

  it('should recover from L2 (MongoDB) if L0 and L1 are missing', async () => {
    // 1. Clear L0 and L1
    await hybridCache.clear();
    
    const prefix = hybridCache._getPrefix();
    // Mock L2 response - Two calls: one for 'set' in beforeEach (if any) or here, 
    // and one for 'get'
    ResponseCache.exec.mockResolvedValueOnce({ response: testResponse, provider });
    ResponseCache.exec.mockResolvedValueOnce({ response: testResponse, provider });

    // 2. Retrieval should hit L2
    const cached = await hybridCache.get(testKey);
    expect(cached.response).toBe(testResponse);
    expect(cached.source).toBe('L2');

    // 3. Verify L1 and L0 are repopulated for next time
    const l1Cached = await redis.get(`${prefix}:${testKey}`);
    expect(JSON.parse(l1Cached).response).toBe(testResponse);
    expect(hybridCache.l0Cache.has(testKey)).toBe(true);
  });

  it('should reject invalid or too-short responses from caching', async () => {
    const invalidResponses = [
      '',
      'error',
      'AI service unavailable',
      'abc', // Too short (< 5 chars)
      null
    ];

    for (const res of invalidResponses) {
      await hybridCache.set('bad_key', res, provider);
      const cached = await hybridCache.get('bad_key');
      expect(cached).toBeNull();
    }
  });

  it('should respect L0 cache size limits', async () => {
    const limit = hybridCache.l0Limit;
    
    // Fill beyond limit
    for (let i = 0; i <= limit; i++) {
      await hybridCache.set(`key_${i}`, `response_${i}`, provider);
    }

    // First item should have been evicted
    expect(hybridCache.l0Cache.has('key_0')).toBe(false);
    expect(hybridCache.l0Cache.size).toBe(limit);
  });

  it('should handle Redis failures gracefully (L0 -> L2 fallback)', async () => {
    await hybridCache.clear();
    
    // Force Redis error
    jest.spyOn(redis, 'get').mockRejectedValue(new Error('Redis Connection Lost'));
    
    // Mock L2 response
    ResponseCache.exec.mockResolvedValueOnce({ response: testResponse, provider });

    const cached = await hybridCache.get(testKey);
    // Should skip L1 and go to L2
    expect(cached.response).toBe(testResponse);
    expect(cached.source).toBe('L2');
  });
});
