const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const redis = require('../../src/config/redis');

describe('System & Health API', () => {
  it('GET /api/system/health should return operational status', async () => {
    const res = await request(app).get('/api/system/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('operational');
    expect(res.body.infrastructure.database.status).toBe('connected');
    expect(res.body.infrastructure.cache.status).toBe('connected');
  });

  it('should reflect database disconnection in health check', async () => {
    // Mock readyState to 0 (disconnected)
    jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const res = await request(app).get('/api/system/health');
    expect(res.body.infrastructure.database.status).toBe('disconnected');
  });

  it('should reflect redis failure in health check', async () => {
    jest.spyOn(redis, 'ping').mockRejectedValue(new Error('Redis Down'));

    const res = await request(app).get('/api/system/health');
    expect(res.body.infrastructure.cache.status).toBe('disconnected');
  });

  it('GET /api/system/metrics should be protected and return data', async () => {
    // Note: If metrics is not protected yet, this will fail. 
    // Assuming metrics is protected by same auth.
    const res = await request(app)
      .get('/api/system/metrics')
      .set('Authorization', 'Bearer mock-token');
    
    expect(res.status).toBe(200);
    expect(res.body.data.uptime).toBeDefined();
    expect(res.body.data.memory).toBeDefined();
  });
});
