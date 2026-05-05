const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const redis = require('../../src/config/redis');

describe('Auth Security Integration', () => {
  const mockUid = 'auth-test-uid';
  const mockEmail = 'auth@test.com';

  beforeEach(async () => {
    await User.create({ uid: mockUid, email: mockEmail, name: 'Auth Test' });
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should set HttpOnly cookie on successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ idToken: 'valid-token' });
      
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=');
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('should return 400 if idToken is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('idToken');
    });
  });

  describe('Authentication Middleware (protect)', () => {
    it('should allow access with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/civic/journey')
        .set('Authorization', 'Bearer valid-token');
      
      expect(res.status).toBe(200);
    });

    it('should reject if token is in Redis denylist (Revocation)', async () => {
      const token = 'revoked-token';
      await redis.set(`revoked_token:${token}`, 'true');

      const res = await request(app)
        .get('/api/civic/journey')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('revoked');
    });

    it('should reject if Firebase verification fails (Tampering/Expiry)', async () => {
      global.mockFirebaseAuth.verifyIdToken.mockRejectedValueOnce(new Error('Token Expired'));

      const res = await request(app)
        .get('/api/civic/journey')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer expired-token');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('session');
    });

    it('should reject if user is valid in Firebase but missing in DB', async () => {
      // Note: In zero-data mode, we simulate missing DB user by mocking findOne to return null
      global.userMock.exec.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/civic/journey')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer valid-token');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('account not found');
    });

    it('should reject if no token is provided', async () => {
      const res = await request(app).get('/api/civic/journey');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookie and return success', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', 'Bearer valid-token');
      
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie'][0]).toContain('token=');
      expect(res.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    });
  });
});
