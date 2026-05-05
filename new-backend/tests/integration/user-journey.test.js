const request = require('supertest');
const app = require('../../src/app');

describe('End-to-End User Journey', () => {
  const token = 'Bearer mock-token';

  it('should complete a full user cycle', async () => {
    // 1. Login
    const login = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'mock-id-token' });
    expect(login.status).toBe(200);

    // 2. Complete Profile
    const profile = await request(app)
      .post('/api/auth/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Authorization', token)
      .send({
        age: 25,
        state: 'Maharashtra',
        pincode: '400001',
        voterStatus: 'not_registered'
      });
    expect(profile.status).toBe(200);

    // 3. Get Personalized Journey
    const journey = await request(app)
      .get('/api/civic/journey')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Authorization', token);
    expect(journey.status).toBe(200);
    expect(journey.body.data.steps.length).toBeGreaterThan(0);

    // 4. Take Quiz
    const quiz = await request(app)
      .get('/api/civic/quiz')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Authorization', token);
    expect(quiz.status).toBe(200);

    // 5. Check Readiness
    const readiness = await request(app)
      .get('/api/civic/readiness')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Authorization', token);
    expect(readiness.status).toBe(200);
    expect(readiness.body.data.score).toBeDefined();
  });
});
