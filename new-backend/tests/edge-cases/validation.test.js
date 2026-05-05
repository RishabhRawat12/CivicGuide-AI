const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Edge Cases — Input Validation & Legacy Parity', () => {
  let token = 'mock-token';

  beforeAll(async () => {
    await User.create({ 
      uid: 'test-uid-123', 
      email: 'validation@test.com', 
      name: 'Validation User' 
    });
  });

  describe('Character Limits', () => {
    it('should reject translation text > 1000 characters', async () => {
      const longText = 'A'.repeat(1001);
      const res = await request(app)
        .post('/api/civic/translate')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: longText, targetLanguage: 'Hindi' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('1000');
    });

    it('should accept translation text <= 1000 characters', async () => {
      const okText = 'A'.repeat(1000);
      const res = await request(app)
        .post('/api/civic/translate')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: okText, targetLanguage: 'Hindi' });

      expect(res.status).toBe(200);
    });
  });

  describe('Pincode Validation', () => {
    it('should reject invalid pincode formats', async () => {
      const res = await request(app)
        .post('/api/civic/booth')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`)
        .send({ pincode: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 digits');
    });
  });

  describe('System Endpoint Logic', () => {
    it('should return operational status from /api/system/health', async () => {
      const res = await request(app).get('/api/system/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('operational');
      expect(res.body.infrastructure.database.status).toBe('connected');
    });

    it('should redirect /health to /api/system/health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('/api/system/health');
    });
  });
});
