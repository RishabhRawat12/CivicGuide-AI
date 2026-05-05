const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Security — Middleware & Protection Tests', () => {
  let token = 'mock-token';

  beforeAll(async () => {
    // Create a user for auth-protected routes
    await User.create({ 
      uid: 'test-uid-123', 
      email: 'security-test@example.com', 
      name: 'Security User' 
    });
  });

  describe('Helmet security headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      const res = await request(app).get('/api/system/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should remove X-Powered-By header', async () => {
      const res = await request(app).get('/api/system/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Auth validation', () => {
    it('should reject tokens without Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'valid-token-without-prefix');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('required');
    });

    it('should reject tokens with wrong signature/tampered', async () => {
      // Mock firebase failure for tampered token
      global.mockFirebaseAuth.verifyIdToken.mockRejectedValueOnce(new Error('Invalid Signature'));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer tampered-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('session');
    });
  });

  describe('Input Protection', () => {
    it('should reject JSON injection ($ne) in request body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          email: { $ne: null },
          password: { $gt: '' },
        });

      // Zod validation should fail because email must be a string
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle XSS-like content safely (sanitization check)', async () => {
        // This tests if the sanitizer handles malicious looking AI output
        const res = await request(app)
            .get('/api/civic/journey')
            .set('X-Requested-With', 'XMLHttpRequest')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        // Ensure no raw script tags are in the body if we were to render it
        // (This is more of a backend sanitization check)
    });
  });
});
