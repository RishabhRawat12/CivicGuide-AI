const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const aiOrchestrator = require('../../src/services/ai/AIOrchestrator');

describe('Civic API - Edge Cases & Robustness', () => {
  const mockUid = 'test-uid-123';

  beforeEach(async () => {
    await User.create({ 
      uid: mockUid, 
      email: 'test@test.com', 
      name: 'Test User',
      age: 20,
      state: 'Delhi',
      voterStatus: 'not_registered'
    });
  });

  describe('Personalization & Fallbacks', () => {
    it('should return 200 and AI response on happy path', async () => {
      const res = await request(app)
        .get('/api/civic/journey')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token');
      
      expect(res.status).toBe(200);
      expect(res.body.data.steps).toBeDefined();



    });

    it('should handle total AI failure by returning fallback content', async () => {
      // Force AIOrchestrator to return hardcoded fallback
      jest.spyOn(aiOrchestrator, 'generateStructured').mockRejectedValue(new Error('AI Dead'));
      
      const res = await request(app)
        .get('/api/civic/journey')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token');
      
      // Should still be 200 because we have deterministic fallbacks for journey
      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();

    });
  });

  describe('Validation & Edge Cases', () => {
    it('POST /api/civic/booth should reject invalid pincodes', async () => {
      const invalidPincodes = ['123', 'ABCDEF', '11000', '1100011'];
      
      for (const pin of invalidPincodes) {
        const res = await request(app)
          .post('/api/civic/booth')
          .set('X-Requested-With', 'XMLHttpRequest')

          .set('Authorization', 'Bearer mock-token')
          .send({ pincode: pin });
        
        expect(res.status).toBe(400);
      }
    });

    it('POST /api/booth should reject request with neither pincode nor location', async () => {
      const res = await request(app)
        .post('/api/civic/booth')
        .set('X-Requested-With', 'XMLHttpRequest')

        .set('Authorization', 'Bearer mock-token')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Either pincode or location');
    });

    it('GET /api/civic/scenario/:type should reject unknown scenario types', async () => {

      const res = await request(app)
        .get('/api/civic/scenario/non_existent_problem')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('POST /api/civic/translate should reject missing target language', async () => {
        const res = await request(app)
          .post('/api/civic/translate')
          .set('X-Requested-With', 'XMLHttpRequest')
          .set('Authorization', 'Bearer mock-token')
          .send({ text: 'Hello' });
        
        expect(res.status).toBe(400);
    });
  });

  describe('Response Sanitization', () => {
    it('should return sanitized AI output (no Markdown noise)', async () => {
      jest.spyOn(aiOrchestrator, 'generate').mockResolvedValue({
        content: '```json\n{"text": "Clean response"}\n```',
        provider: 'gemini'
      });

      const res = await request(app)
        .post('/api/civic/translate')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token')
        .send({ text: 'Hello', targetLanguage: 'hi' });
      
      expect(res.status).toBe(200);
      expect(res.body.data).not.toContain('```');
    });
  });
});
