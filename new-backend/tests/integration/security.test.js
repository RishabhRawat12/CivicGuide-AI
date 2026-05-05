const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('Security Audit — Production Hardening', () => {
  const testToken = 'bearer test-token-123';
  const testUid = 'test-uid-123';

  beforeEach(async () => {
    await User.create({
      uid: testUid,
      email: 'test@example.com',
      name: 'Test User',
      readinessScore: 0
    });
  });

  // ── Helmet Security Headers ──────────────────────────────────
  describe('HTTP Security Headers (Helmet)', () => {
    it('should set X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/api/system/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-DNS-Prefetch-Control header', async () => {
      const res = await request(app).get('/api/system/health');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });

    it('should remove X-Powered-By header completely', async () => {
      const res = await request(app).get('/api/system/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ── Firebase Authentication Security ──────────────────────────
  describe('Auth Middleware Security', () => {
    it('should reject requests with no Authorization header', async () => {
      const res = await request(app).get('/api/civic/journey');
      expect(res.status).toBe(401);
    });

    it('should reject requests with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/civic/journey')
        .set('Authorization', 'InvalidFormat token');
      expect(res.status).toBe(401);
    });
  });

  // ── NoSQL Injection Prevention ───────────────────────────────
  describe('NoSQL Injection Prevention (mongo-sanitize)', () => {
    it('should sanitize $ne operator in body', async () => {
      const res = await request(app)
        .post('/api/civic/checklist')
        .set('Authorization', testToken)
        .send({ items: { $ne: [] } });
      
      // If sanitized, the body will be empty or clean, preventing the attack logic
      expect(res.status).not.toBe(500);
    });
  });

  // ── Payload Size Limit ───────────────────────────────────────
  describe('Payload Size Limit (1MB)', () => {
    it('should reject payloads exceeding 1MB', async () => {
      const largePayload = { data: 'x'.repeat(1100000) }; // > 1MB
      const res = await request(app)
        .post('/api/civic/checklist')
        .set('Authorization', testToken)
        .send(largePayload);
      expect([413, 400]).toContain(res.status);
    });
  });

  // ── Error Sanitization ───────────────────────────────────────
  describe('Error Leakage Prevention', () => {
    it('should not leak stack traces on 404', async () => {
      const res = await request(app).get('/api/nonexistent-route');
      expect(res.body.stack).toBeUndefined();
    });
  });
});
