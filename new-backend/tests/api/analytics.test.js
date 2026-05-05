const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Analytics API', () => {
  beforeEach(async () => {
    await User.create({ uid: 'test-uid-123', email: 'test@test.com', name: 'Test' });
  });

  it('GET /api/civic/analytics/insights should return user stats', async () => {
    const res = await request(app)
      .get('/api/civic/analytics/insights')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
    expect(res.body.data.totalQueries).toBeDefined();
  });

  it('GET /api/civic/analytics/recommendations should return suggestions', async () => {
    const res = await request(app)
      .get('/api/civic/analytics/recommendations')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/civic/analytics/stats should return global data', async () => {
    const res = await request(app)
      .get('/api/civic/analytics/stats')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
    expect(res.body.data.totalQueries).toBeDefined();
  });
});
