const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Auth API — /api/auth', () => {
  // Note: Registration is handled via Login (Firebase check + Upsert)
  
  describe('POST /api/auth/login', () => {
    it('should login/register with valid idToken', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          idToken: 'mock-valid-id-token'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with missing idToken', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      // Setup: Two mocks (one for 'protect' middleware, one for 'getMe' controller)
      userMock.exec.mockResolvedValueOnce({ uid: 'test-uid-123', email: 'me@test.com', name: 'Me' });
      userMock.exec.mockResolvedValueOnce({ uid: 'test-uid-123', email: 'me@test.com', name: 'Me' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('me@test.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookie and return success', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie'][0]).toContain('token=');
      expect(res.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    });
  });
});
