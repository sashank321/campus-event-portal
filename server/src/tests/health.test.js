const request = require('supertest');
const createApp = require('../app');

describe('GET /api/health', () => {
  it('returns 200 with the standard success envelope', async () => {
    const res = await request(createApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('db');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('timestamp');
  });
});

describe('Unknown routes', () => {
  it('returns 404 with the standard error envelope', async () => {
    const res = await request(createApp()).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });
});
