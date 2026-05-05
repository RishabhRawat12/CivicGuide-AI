const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Chat API', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({ 
      uid: 'test-uid-123', 
      email: 'test@test.com', 
      name: 'Test User' 
    });
  });

  describe('POST /api/chat', () => {
    it('should return AI response for valid message', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token')
        .send({ message: 'How to register to vote?', sessionId: 'sess-1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
      expect(res.body.data.sentiment).toBeDefined();
    });

    it('should reject empty message', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token')
        .send({ message: '', sessionId: 'sess-1' });

      expect(res.status).toBe(400);
    });

    it('should reject missing auth', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ message: 'hello', sessionId: 'sess-1' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/chat/history/:sessionId', () => {
    it('should return empty array for new session', async () => {
      const res = await request(app)
        .get('/api/chat/history/new-session')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
