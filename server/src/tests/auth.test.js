const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');

const createApp = require('../app');
const { User } = require('../models');
const { COOKIE_NAME } = require('../utils/cookies');
const { makeAuthCookieOptions } = require('../utils/cookies');
const { createAuthLimiter } = require('../middleware/rateLimiter');
const { env } = require('../config/env');

const { createTestDatabase } = require('./testDb');
const testDb = createTestDatabase(mongoose);

const GENERIC_CREDENTIALS_MESSAGE = 'Invalid email or password';
const suffix = Date.now();

function registrationBody(overrides = {}) {
  return {
    name: 'Auth Test Student',
    email: `authtest.${suffix}@campus.edu`,
    password: 'Password@123',
    profile: { rollNo: '23CSE777', department: 'CSE', year: 2 },
    ...overrides,
  };
}

async function getCookieToken(app, body) {
  const res = await request(app).post('/api/v1/auth/login').send(body);
  const setCookie = res.headers['set-cookie'][0];
  return { res, cookie: setCookie.split(';')[0], token: setCookie.split(';')[0].split('=')[1] };
}

beforeAll(async () => {
  await testDb.setup();
  await Promise.all([User.init()]);
});

afterAll(async () => {
  await testDb.teardown();
});

describe('POST /api/v1/auth/register', () => {
  it('creates a student account and returns a safe user', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/register')
      .send(registrationBody());

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(`authtest.${suffix}@campus.edu`);
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.name).toBe('Auth Test Student');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('hashes the password with bcrypt cost 12', async () => {
    await request(createApp()).post('/api/v1/auth/register').send(registrationBody());
    const user = await User.findOne({ email: `authtest.${suffix}@campus.edu` }).select(
      '+passwordHash'
    );
    expect(user.passwordHash.startsWith('$2b$12$')).toBe(true);
  });

  it('never returns passwordHash in the response', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/register')
      .send(registrationBody({ email: `nohash.${suffix}@campus.edu` }));
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
  });

  it('rejects duplicate email with a specific code', async () => {
    await request(createApp()).post('/api/v1/auth/register').send(registrationBody());
    const res = await request(createApp())
      .post('/api/v1/auth/register')
      .send(registrationBody({ name: 'Duplicate' }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('rejects invalid input with VALIDATION_ERROR', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid profile department and year', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/register')
      .send(
        registrationBody({
          email: `badprofile.${suffix}@campus.edu`,
          profile: { department: 'Underwater Basket Weaving', year: 9 },
        })
      );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('department');
    expect(res.body.error.message).toContain('year');
  });

  it('does not allow public registration as organizer or admin', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/register')
      .send(registrationBody({ email: `rolehack.${suffix}@campus.edu`, role: 'admin' }));

    expect(res.status).toBe(201);
    const user = await User.findOne({ email: `rolehack.${suffix}@campus.edu` });
    expect(user.role).toBe('student');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeAll(async () => {
    await User.updateOne(
      { email: `authtest.${suffix}@campus.edu` },
      { $setOnInsert: { name: 'Login Seed', email: `authtest.${suffix}@campus.edu`, role: 'student', passwordHash: await bcrypt.hash('Password@123', 12) } },
      { upsert: true }
    );
  });

  it('succeeds with valid credentials and sets an httpOnly cookie', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `authtest.${suffix}@campus.edu`, password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(`authtest.${suffix}@campus.edu`);

    const setCookie = res.headers['set-cookie'][0];
    expect(setCookie).toContain(`${COOKIE_NAME}=`);
    expect(/HttpOnly/i.test(setCookie)).toBe(true);
    expect(/SameSite=Lax/i.test(setCookie)).toBe(true);
  });

  it('never exposes the JWT in the JSON response', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/login')
      .send({ email: `authtest.${suffix}@campus.edu`, password: 'Password@123' });

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('token');
    expect(body).not.toContain('eyJ');
  });

  it('sets a cookie with maxAge of approximately 30 minutes', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/login')
      .send({ email: `authtest.${suffix}@campus.edu`, password: 'Password@123' });

    const setCookie = res.headers['set-cookie'][0];
    const maxAgeMatch = setCookie.match(/Max-Age=(\d+)/i);
    expect(maxAgeMatch).not.toBeNull();
    const seconds = parseInt(maxAgeMatch[1], 10);
    expect(seconds).toBeGreaterThanOrEqual(1799);
    expect(seconds).toBeLessThanOrEqual(1801);
  });

  it('fails with wrong password using a generic error', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/login')
      .send({ email: `authtest.${suffix}@campus.edu`, password: 'WrongPassword@123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe(GENERIC_CREDENTIALS_MESSAGE);
  });

  it('fails with a nonexistent account using the same generic error (no enumeration)', async () => {
    const res = await request(createApp())
      .post('/api/v1/auth/login')
      .send({ email: `ghost.${suffix}@campus.edu`, password: 'Password@123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe(GENERIC_CREDENTIALS_MESSAGE);
  });
});

describe('GET /api/v1/auth/me', () => {
  let app;
  let cookie;

  beforeAll(async () => {
    app = createApp();
    const result = await getCookieToken(app, {
      email: `authtest.${suffix}@campus.edu`,
      password: 'Password@123',
    });
    cookie = result.cookie;
  });

  it('returns the current user for a valid cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(`authtest.${suffix}@campus.edu`);
    expect(res.body.data.user.role).toBe('student');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('rejects an invalid/tampered token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `${COOKIE_NAME}=not.a.real.jwt`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });

  it('rejects an expired token with AUTH_EXPIRED', async () => {
    const user = await User.findOne({ email: `authtest.${suffix}@campus.edu` });
    const expired = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
      expiresIn: '1ms',
    });
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `${COOKIE_NAME}=${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_EXPIRED');
  });

  it('rejects an inactive user with ACCOUNT_DISABLED', async () => {
    const inactive = await User.create({
      name: 'Inactive User',
      email: `inactive.${suffix}@campus.edu`,
      passwordHash: await bcrypt.hash('Password@123', 12),
      role: 'student',
      isActive: false,
    });
    const token = jwt.sign({ sub: inactive._id.toString(), role: inactive.role }, env.jwtSecret, {
      expiresIn: '30m',
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `${COOKIE_NAME}=${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the cookie and the client session is gone afterwards', async () => {
    const app = createApp();
    const { cookie } = await getCookieToken(app, {
      email: `authtest.${suffix}@campus.edu`,
      password: 'Password@123',
    });

    const logoutRes = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    const setCookie = logoutRes.headers['set-cookie'][0];
    expect(/Expires=Thu, 01 Jan 1970/i.test(setCookie)).toBe(true);

    // The client updates its cookie jar from the logout response, so the
    // next request carries no token (JWTs are stateless - no server-side blocklist)
    const clearedCookie = setCookie.split(';')[0];
    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', clearedCookie);
    expect(meRes.status).toBe(401);
    expect(meRes.body.error.code).toBe('AUTH_REQUIRED');
  });
});

describe('Authorization middleware', () => {
  function buildRoleApp() {
    const { protect, authorize } = require('../middleware/auth.middleware');
    const { notFound, errorHandler } = require('../middleware/errorHandler');
    const app = express();
    app.use(express.json());
    app.use(cookieParserHelper());
    app.get('/admin-only', protect, authorize('admin'), (req, res) => res.json({ ok: true }));
    app.get('/organizer-area', protect, authorize('organizer', 'admin'), (req, res) =>
      res.json({ ok: true })
    );
    app.use(notFound);
    app.use(errorHandler);
    return app;
  }

  function cookieParserHelper() {
    return require('cookie-parser')();
  }

  let studentCookie;
  beforeAll(async () => {
    const app = createApp();
    const result = await getCookieToken(app, {
      email: `authtest.${suffix}@campus.edu`,
      password: 'Password@123',
    });
    studentCookie = result.cookie;
  });

  it('returns 403 when a student accesses an organizer/admin area', async () => {
    const res = await request(buildRoleApp())
      .get('/organizer-area')
      .set('Cookie', studentCookie);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for a wrong role', async () => {
    const res = await request(buildRoleApp())
      .get('/admin-only')
      .set('Cookie', studentCookie);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns an auth error when unauthenticated', async () => {
    const res = await request(buildRoleApp()).get('/admin-only');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('allows an admin through authorize(organizer, admin)', async () => {
    const admin = await User.create({
      name: 'Role Admin',
      email: `roleadmin.${suffix}@campus.edu`,
      passwordHash: await bcrypt.hash('Password@123', 12),
      role: 'admin',
    });
    const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, env.jwtSecret, {
      expiresIn: '30m',
    });
    const res = await request(buildRoleApp())
      .get('/organizer-area')
      .set('Cookie', `${COOKIE_NAME}=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Security configuration', () => {
  it('configures a secure cookie in production', () => {
    const options = makeAuthCookieOptions(true);
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
  });

  it('uses a non-secure cookie in development', () => {
    const options = makeAuthCookieOptions(false);
    expect(options.secure).toBe(false);
  });

  it('rate limiter returns 429 with the standard envelope when exhausted', async () => {
    const app = express();
    app.use(express.json());
    app.use('/limited', createAuthLimiter({ windowMs: 60000, limit: 2 }));
    app.post('/limited/x', (req, res) => res.json({ ok: true }));

    await request(app).post('/limited/x').send({});
    await request(app).post('/limited/x').send({});
    const res = await request(app).post('/limited/x').send({});

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
