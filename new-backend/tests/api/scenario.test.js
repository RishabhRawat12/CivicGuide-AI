const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Scenario API — /api/civic', () => {
  let token = 'mock-token';

  beforeAll(async () => {
    // Ensure user exists for auth middleware
    await User.create({ 
      uid: 'test-uid-123', 
      email: 'scenario@test.com', 
      name: 'Scenario User' 
    });
  });

  describe('GET /api/civic/scenarios', () => {
    it('should return list of available scenarios with icons', async () => {
      const res = await request(app)
        .get('/api/civic/scenarios')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      const scenario = res.body.data[0];
      expect(scenario).toHaveProperty('id');
      expect(scenario).toHaveProperty('title');
      expect(scenario).toHaveProperty('icon'); 
      expect(scenario).toHaveProperty('description');
    });
  });

  describe('GET /api/civic/scenario/:type', () => {
    it('should run a scenario successfully', async () => {
      const res = await request(app)
        .get('/api/civic/scenario/first_time_voter')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.steps).toBeDefined();
    });

    it('should reject invalid scenario type', async () => {
      const res = await request(app)
        .get('/api/civic/scenario/invalid_type')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Authorization', `Bearer ${token}`);

      // Should be 404 based on controller logic if scenario not found
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
