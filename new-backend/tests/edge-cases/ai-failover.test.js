const AIOrchestrator = require('../../src/services/ai/AIOrchestrator');
const mistralService = require('../../src/services/ai/MistralService');
const geminiService = require('../../src/services/ai/GeminiService');

describe('AI Failover & Circuit Breaker', () => {
  beforeEach(() => {
    // Reset orchestrator state between tests
    AIOrchestrator.circuitBreakers.clear();
    AIOrchestrator.stats = {
      totalRequests: 0,
      cacheHits: 0,
      mistralSuccess: 0,
      mistralFailure: 0,
      geminiSuccess: 0,
      geminiFailure: 0,
      fallbackUsed: 0,
    };
    jest.restoreAllMocks();
  });

  it('should fall back to Gemini when Mistral is unavailable', async () => {
    jest.spyOn(mistralService, 'isAvailable').mockReturnValue(false);
    jest.spyOn(geminiService, 'isAvailable').mockReturnValue(true);

    const result = await AIOrchestrator.generate('test prompt', 'system');
    expect(result.provider).toBe('gemini');
    expect(AIOrchestrator.stats.mistralSuccess).toBe(0);
  });

  it('should open circuit breaker after repeated failures', async () => {
    jest.spyOn(mistralService, 'isAvailable').mockReturnValue(true);
    const spy = jest.spyOn(mistralService, 'generate').mockRejectedValue(new Error('API Down'));
    // Force gemini to be unavailable so we reach Mistral and can test its circuit
    jest.spyOn(geminiService, 'isAvailable').mockReturnValue(false);

    // 1st failure
    await AIOrchestrator.generate('test', 'system');
    // 2nd failure
    await AIOrchestrator.generate('test', 'system');
    // 3rd failure - should OPEN circuit (5 failures total)
    await AIOrchestrator.generate('test', 'system');

    expect(AIOrchestrator.circuitBreakers.get('mistral').state).toBe('OPEN');
    expect(AIOrchestrator.stats.mistralFailure).toBe(3); // 3 requests, but 9 internal retries

    // 4th call - should SKIP mistral entirely without calling it
    spy.mockClear();
    await AIOrchestrator.generate('test', 'system');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const provider = 'mistral';
    AIOrchestrator.circuitBreakers.set(provider, { 
      failureCount: 3, 
      lastFailure: Date.now() - 70000, // Older than 60s timeout
      state: 'OPEN' 
    });

    const isOpen = AIOrchestrator._isCircuitOpen(provider);
    expect(isOpen).toBe(false); // Should return false to allow a test call
    expect(AIOrchestrator.circuitBreakers.get(provider).state).toBe('HALF_OPEN');
  });

  it('should reset circuit on success after HALF_OPEN', async () => {
    const provider = 'mistral';
    AIOrchestrator.circuitBreakers.set(provider, { 
      failureCount: 3, 
      lastFailure: Date.now() - 70000, 
      state: 'OPEN' 
    });

    jest.spyOn(geminiService, 'isAvailable').mockReturnValue(false);
    jest.spyOn(mistralService, 'generate').mockResolvedValue({ content: 'Back online' });
    
    await AIOrchestrator.generate('test', 'system');
    expect(AIOrchestrator.circuitBreakers.get(provider).state).toBe('CLOSED');
    expect(AIOrchestrator.circuitBreakers.get(provider).failureCount).toBe(0);
  });

  it('should use hardcoded fallback when all AI providers fail', async () => {
    jest.spyOn(mistralService, 'isAvailable').mockReturnValue(false);
    jest.spyOn(geminiService, 'isAvailable').mockReturnValue(false);

    const result = await AIOrchestrator.generate('voter registration', 'system');
    expect(result.provider).toBe('hardcoded_fallback');
    expect(result.content).toContain('registered');
  });

  it('should handle structured response failover', async () => {
    jest.spyOn(geminiService, 'isAvailable').mockReturnValue(true);
    jest.spyOn(geminiService, 'generateStructuredResponse').mockRejectedValue(new Error('Structured Failed'));
    
    // Should fallback to Mistral with JSON instruction
    const mistralSpy = jest.spyOn(mistralService, 'generate').mockResolvedValue({ 
      content: '{"steps": ["A"], "score": 90}' 
    });

    const schema = { parse: jest.fn(x => x) };
    const result = await AIOrchestrator.generateStructured('test prompt', 'system', schema);
    
    expect(mistralSpy).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('strict JSON'));
    expect(result.score).toBe(90);
  });
});
