const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const request = require('supertest');

const createApp = require('../app');
const { User, Club, Venue, Event, Registration } = require('../models');
const { env } = require('../config/env');
const { uploadDirPath } = require('../utils/uploads');

const { createTestDatabase } = require('./testDb');
const testDb = createTestDatabase(mongoose);
const suffix = Date.now();
const uploadedFiles = [];

function authCookie(user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: '30m',
  });
  return `token=${token}`;
}

function eventBody(overrides = {}) {
  return {
    title: `Phase4 Event ${suffix}`,
    description: 'A phase 4 event description.',
    category: 'workshop',
    startAt: '2027-05-10T10:00:00.000Z',
    endAt: '2027-05-10T13:00:00.000Z',
    registrationDeadline: '2027-05-08T23:00:00.000Z',
    capacity: 10,
    tags: ['workshop', 'phase4'],
    rules: ['Bring your own laptop'],
    ...overrides,
  };
}

function future(days) {
  const d = new Date('2027-06-01T10:00:00.000Z');
  d.setDate(d.getDate() + days);
  return d;
}

function futureEnd(days) {
  return new Date(future(days).getTime() + 4 * 60 * 60 * 1000);
}

async function registerParticipants(event, students, { cancelled = false } = {}) {
  return Promise.all(
    students.map((s, i) =>
      Registration.create({
        event: event._id,
        student: s._id,
        status: cancelled ? 'cancelled' : 'registered',
        eventSnapshot: { title: event.title, startAt: event.startAt },
      })
    )
  );
}

beforeAll(async () => {
  await testDb.setup();
  await Promise.all([
    User.init(),
    Club.init(),
    Venue.init(),
    Event.init(),
    Registration.init(),
  ]);
});

afterAll(async () => {
  try {
    for (const file of uploadedFiles) {
      const p = path.join(uploadDirPath, path.basename(file));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } finally {
    await testDb.teardown();
  }
});

describe('Event CRUD', () => {
  let admin;
  let owner;
  let other;
  let student;
  let club;
  let venue;
  let app;

  beforeAll(async () => {
    app = createApp();
    admin = await User.create({ name: 'Admin', email: `evadmin.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'admin' });
    owner = await User.create({ name: 'Owner', email: `evowner.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'organizer' });
    other = await User.create({ name: 'Other', email: `evother.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'organizer' });
    student = await User.create({ name: 'Student', email: `evstud.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'student' });
    club = await Club.create({ name: `Events Club ${suffix}`, slug: `events-club-${suffix}` });
    venue = await Venue.create({ name: `Events Hall ${suffix}`, capacity: 200 });
  });

  it('organizer creates an event that starts pending, with trusted createdBy/organizers', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(owner))
      .send(eventBody({ title: `Owner Event ${suffix}`, club: club._id.toString() }));

    expect(res.status).toBe(201);
    expect(res.body.data.event.status).toBe('pending');
    expect(res.body.data.event.createdBy.toString()).toBe(owner._id.toString());
    expect(res.body.data.event.organizers).toHaveLength(1);
    expect(res.body.data.event.organizers[0].toString()).toBe(owner._id.toString());
    expect(res.body.data.event.registeredCount).toBe(0);
  });

  it('ignores client-supplied createdBy/role (always pending for organizer)', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(owner))
      .send(eventBody({ title: `Spoof Event ${suffix}`, club: club._id.toString(), createdBy: admin._id.toString(), role: 'admin' }));

    expect(res.status).toBe(201);
    expect(res.body.data.event.status).toBe('pending');
    expect(res.body.data.event.createdBy.toString()).toBe(owner._id.toString());
  });

  it('admin creates an event directly as approved', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(admin))
      .send(eventBody({ title: `Admin Event ${suffix}`, club: club._id.toString() }));

    expect(res.status).toBe(201);
    expect(res.body.data.event.status).toBe('approved');
    expect(res.body.data.event.createdBy.toString()).toBe(admin._id.toString());
  });

  it('returns 401 for unauthenticated and 403 for a student create', async () => {
    const unauth = await request(app).post('/api/v1/events').send(eventBody());
    expect(unauth.status).toBe(401);

    const studentCreate = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(student))
      .send(eventBody({ title: `Student Event ${suffix}` }));
    expect(studentCreate.status).toBe(403);
    expect(studentCreate.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects invalid input with VALIDATION_ERROR', async () => {
    const badCategory = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(owner))
      .send(eventBody({ title: `Bad Cat ${suffix}`, category: 'party' }));
    expect(badCategory.status).toBe(400);
    expect(badCategory.body.error.code).toBe('VALIDATION_ERROR');

    const badClub = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(owner))
      .send(eventBody({ title: `Bad Club ${suffix}`, club: new mongoose.Types.ObjectId().toString() }));
    expect(badClub.status).toBe(400);
    expect(badClub.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('assigns unique slugs for duplicate titles', async () => {
    const first = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(owner))
      .send(eventBody({ title: `Duplicate Title ${suffix}`, club: club._id.toString() }));
    const second = await request(app)
      .post('/api/v1/events')
      .set('Cookie', authCookie(owner))
      .send(eventBody({ title: `Duplicate Title ${suffix}`, club: club._id.toString() }));

    expect(first.body.data.event.slug).not.toBe(second.body.data.event.slug);
  });

  describe('ownership & updates', () => {
    let owned;

    beforeEach(async () => {
      owned = await Event.create({
        ...eventBody({ title: `Owned Event ${suffix}`, slug: `owned-event-${suffix}-${Date.now()}-${Math.floor(Math.random() * 1000)}` }),
        club: club._id,
        venue: venue._id,
        createdBy: owner._id,
        organizers: [owner._id],
        status: 'approved',
      });
    });

    it('owner can update; editing an approved event returns it to pending', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${owned._id}`)
        .set('Cookie', authCookie(owner))
        .send({ title: `Owned Event Updated ${suffix}` });

      expect(res.status).toBe(200);
      expect(res.body.data.event.title).toBe(`Owned Event Updated ${suffix}`);
      expect(res.body.data.event.status).toBe('pending');
    });

    it('non-owner organizer gets 403 EVENT_NOT_OWNER', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${owned._id}`)
        .set('Cookie', authCookie(other))
        .send({ title: 'Hijack attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('EVENT_NOT_OWNER');
    });

    it('admin can update any event and the status is preserved', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${owned._id}`)
        .set('Cookie', authCookie(admin))
        .send({ capacity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data.event.capacity).toBe(5);
      expect(res.body.data.event.status).toBe('approved');
    });

    it('owner can soft-cancel an event; second cancel returns 409', async () => {
      const del = await request(app)
        .delete(`/api/v1/events/${owned._id}`)
        .set('Cookie', authCookie(owner));
      expect(del.status).toBe(200);
      expect(del.body.data.event.status).toBe('cancelled');

      const again = await request(app)
        .delete(`/api/v1/events/${owned._id}`)
        .set('Cookie', authCookie(owner));
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('EVENT_ALREADY_CANCELLED');
    });
  });
});

describe('Event approval workflow', () => {
  let admin;
  let owner;
  let club;
  let app;

  beforeAll(async () => {
    app = createApp();
    admin = await User.create({ name: 'Admin2', email: `evadmin2.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'admin' });
    owner = await User.create({ name: 'Owner2', email: `evowner2.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'organizer' });
    club = await Club.create({ name: `Approval Club ${suffix}`, slug: `approval-club-${suffix}` });
  });

  async function makeEvent(status = 'pending', slugPostfix = '') {
    return Event.create({
      ...eventBody({ title: `Approval ${slugPostfix} ${suffix}`, slug: `approval-${slugPostfix || Date.now()}-${suffix}` }),
      club: club._id,
      createdBy: owner._id,
      organizers: [owner._id],
      status,
    });
  }

  it('admin approves a pending event', async () => {
    const e = await makeEvent('pending', 'ok');
    const res = await request(app)
      .patch(`/api/v1/events/${e._id}/approve`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe('approved');
  });

  it('admin rejects a pending event', async () => {
    const e = await makeEvent('pending', 'rej');
    const res = await request(app)
      .patch(`/api/v1/events/${e._id}/reject`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.event.status).toBe('rejected');
  });

  it('organizer cannot approve their own event', async () => {
    const e = await makeEvent('pending', 'org');
    const res = await request(app)
      .patch(`/api/v1/events/${e._id}/approve`)
      .set('Cookie', authCookie(owner));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects invalid transitions', async () => {
    const approved = await makeEvent('approved', 'bad1');
    const res1 = await request(app)
      .patch(`/api/v1/events/${approved._id}/approve`)
      .set('Cookie', authCookie(admin));
    expect(res1.status).toBe(409);
    expect(res1.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    const cancelled = await makeEvent('cancelled', 'bad2');
    const res2 = await request(app)
      .patch(`/api/v1/events/${cancelled._id}/approve`)
      .set('Cookie', authCookie(admin));
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('EVENT_ALREADY_CANCELLED');
  });
});

describe('Event discovery', () => {
  let app;
  let clubA;
  let clubB;
  let venueX;
  let venueY;

  beforeAll(async () => {
    app = createApp();
    clubA = await Club.create({ name: `Discover A ${suffix}`, slug: `discover-a-${suffix}` });
    clubB = await Club.create({ name: `Discover B ${suffix}`, slug: `discover-b-${suffix}` });
    venueX = await Venue.create({ name: `Discover Hall X ${suffix}`, capacity: 100 });
    venueY = await Venue.create({ name: `Discover Hall Y ${suffix}`, capacity: 50 });
    const admin = await User.findOne({ email: `evadmin2.${suffix}@campus.edu` }) || await User.create({ name: 'Admin3', email: `evadmin3.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'admin' });

    const base = (overrides) => ({
      title: `Discovery Event ${suffix}`,
      description: 'A discovery seed event.',
      club: clubA._id,
      venue: venueX._id,
      createdBy: admin._id,
      organizers: [admin._id],
      status: 'approved',
      ...overrides,
    });

    await Event.insertMany([
      base({ title: `Hackathon Central ${suffix}`, slug: `disc-hack-${suffix}`, category: 'hackathon', department: 'CSE', startAt: future(3), endAt: futureEnd(3), registrationDeadline: future(2), capacity: 50, registeredCount: 30 }),
      base({ title: `Soccer Cup ${suffix}`, slug: `disc-soccer-${suffix}`, category: 'sports', department: 'MECH', startAt: future(1), endAt: futureEnd(1), registrationDeadline: future(0), capacity: 30, registeredCount: 5, club: clubB._id, venue: venueY._id }),
      base({ title: `Art Show ${suffix}`, slug: `disc-art-${suffix}`, category: 'cultural', department: 'all', startAt: future(10), endAt: futureEnd(10), registrationDeadline: future(8), capacity: 20, registeredCount: 2, venue: venueY._id }),
      base({ title: `Music Fest ${suffix}`, slug: `disc-music-${suffix}`, category: 'fest', department: 'all', startAt: future(20), endAt: futureEnd(20), registrationDeadline: future(15), capacity: 500, registeredCount: 400 }),
      base({ title: `Pending Event ${suffix}`, slug: `disc-pending-${suffix}`, category: 'workshop', status: 'pending', startAt: future(5), endAt: futureEnd(5), registrationDeadline: future(3) }),
      base({ title: `Cancelled Event ${suffix}`, slug: `disc-cancel-${suffix}`, category: 'workshop', status: 'cancelled', startAt: future(6), endAt: futureEnd(6), registrationDeadline: future(4) }),
      base({ title: `Rejected Event ${suffix}`, slug: `disc-reject-${suffix}`, category: 'workshop', status: 'rejected', startAt: future(7), endAt: futureEnd(7), registrationDeadline: future(5) }),
    ]);
  });

  it('returns only approved events (hides pending/cancelled/rejected)', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.status).toBe(200);
    const slugs = res.body.data.map((e) => e.slug);
    expect(slugs).not.toContain(`disc-pending-${suffix}`);
    expect(slugs).not.toContain(`disc-cancel-${suffix}`);
    expect(slugs).not.toContain(`disc-reject-${suffix}`);
    expect(slugs).toContain(`disc-hack-${suffix}`);
    expect(slugs).toContain(`disc-soccer-${suffix}`);
    expect(slugs).toContain(`disc-art-${suffix}`);
    expect(slugs).toContain(`disc-music-${suffix}`);
    // Scoped to this describe's seeded events (other suites share the test DB)
    expect(slugs.filter((s) => s.startsWith('disc-'))).toHaveLength(4);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/v1/events').query({ category: 'sports' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('sports');
  });

  it('filters by club slug', async () => {
    const res = await request(app).get('/api/v1/events').query({ club: `discover-b-${suffix}` });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe(`disc-soccer-${suffix}`);
  });

  it('filters by department', async () => {
    const res = await request(app).get('/api/v1/events').query({ department: 'CSE' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].department).toBe('CSE');
  });

  it('filters by venue', async () => {
    const res = await request(app).get('/api/v1/events').query({ venue: venueY.name });
    expect(res.body.data).toHaveLength(2);
  });

  it('filters by date range', async () => {
    const res = await request(app).get('/api/v1/events').query({
      from: future(9).toISOString(),
      to: future(30).toISOString(),
    });
    const slugs = res.body.data.map((e) => e.slug);
    expect(slugs).toContain(`disc-music-${suffix}`);
    expect(slugs).not.toContain(`disc-soccer-${suffix}`);
  });

  it('performs text search', async () => {
    const res = await request(app).get('/api/v1/events').query({ search: 'hackathon' });
    expect(res.status).toBe(200);
    const slugs = res.body.data.map((e) => e.slug);
    expect(slugs).toContain(`disc-hack-${suffix}`);
  });

  it('paginates and returns metadata', async () => {
    // Scoped to clubA (3 seeded events) since other suites share the test DB
    const res = await request(app)
      .get('/api/v1/events')
      .query({ limit: 2, page: 2, club: `discover-a-${suffix}` });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.limit).toBe(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('sorts by popularity (registeredCount descending)', async () => {
    const res = await request(app).get('/api/v1/events').query({ sort: 'popular' });
    const counts = res.body.data.map((e) => e.registeredCount);
    expect(counts[0]).toBe(400);
    expect(counts[1]).toBe(30);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });
});

describe('Event detail', () => {
  let app;
  let owner;
  let club;
  let venue;

  beforeAll(async () => {
    app = createApp();
    owner = await User.findOne({ email: `evowner.${suffix}@campus.edu` });
    club = await Club.create({ name: `Detail Club ${suffix}`, slug: `detail-club-${suffix}` });
    venue = await Venue.create({ name: `Detail Hall ${suffix}`, capacity: 150 });
  });

  async function makeEvent(overrides = {}) {
    return Event.create({
      ...eventBody({ title: `Detail ${Date.now()} ${suffix}`, slug: `detail-${Date.now()}-${suffix}` }),
      club: club._id,
      venue: venue._id,
      createdBy: owner._id,
      organizers: [owner._id],
      status: 'approved',
      ...overrides,
    });
  }

  it('returns full detail with populated club/venue and seatsRemaining', async () => {
    const e = await makeEvent({ capacity: 10, registeredCount: 3 });
    const res = await request(app).get(`/api/v1/events/${e.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.event.club.name).toBe(`Detail Club ${suffix}`);
    expect(res.body.data.event.venue.name).toBe(`Detail Hall ${suffix}`);
    expect(res.body.data.event.seatsRemaining).toBe(7);
    expect(res.body.data.event.capacity).toBe(10);
    expect(res.body.data.event.registeredCount).toBe(3);
  });

  it('handles unlimited capacity (seatsRemaining null)', async () => {
    const e = await makeEvent({ capacity: null });
    const res = await request(app).get(`/api/v1/events/${e.slug}`);
    expect(res.body.data.event.seatsRemaining).toBeNull();
  });

  it('never returns a negative seatsRemaining', async () => {
    const e = await makeEvent({ capacity: 10, registeredCount: 15 });
    const res = await request(app).get(`/api/v1/events/${e.slug}`);
    expect(res.body.data.event.seatsRemaining).toBe(0);
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/v1/events/does-not-exist-slug');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('EVENT_NOT_FOUND');
  });

  it('hides pending events publicly but exposes them to their owner', async () => {
    const e = await makeEvent({ status: 'pending' });

    const anonymous = await request(app).get(`/api/v1/events/${e.slug}`);
    expect(anonymous.status).toBe(404);

    const ownerView = await request(app)
      .get(`/api/v1/events/${e.slug}`)
      .set('Cookie', authCookie(owner));
    expect(ownerView.status).toBe(200);
    expect(ownerView.body.data.event.status).toBe('pending');
  });
});

describe('Event participants', () => {
  let app;
  let owner;
  let other;
  let admin;
  let student;
  let club;
  let event;
  let students;

  beforeAll(async () => {
    app = createApp();
    owner = await User.findOne({ email: `evowner.${suffix}@campus.edu` });
    other = await User.findOne({ email: `evother.${suffix}@campus.edu` });
    admin = await User.findOne({ email: `evadmin.${suffix}@campus.edu` });
    club = await Club.create({ name: `Part Club ${suffix}`, slug: `part-club-${suffix}` });
    event = await Event.create({
      ...eventBody({ title: `Part Event ${suffix}`, slug: `part-event-${suffix}` }),
      club: club._id,
      createdBy: owner._id,
      organizers: [owner._id],
      status: 'approved',
      capacity: 50,
    });
    students = await Promise.all(
      [1, 2, 3].map((i) =>
        User.create({
          name: `Part Student ${i}`,
          email: `partstud${i}.${suffix}@campus.edu`,
          passwordHash: 'x',
          role: 'student',
          profile: { rollNo: `P${i}`, department: 'CSE', year: 2 },
        })
      )
    );
    student = students[0];
    await registerParticipants(event, students.slice(0, 3));
    await registerParticipants(event, [students[0]], { cancelled: true });
  });

  it('owner can read participants with safe fields', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(owner));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
    expect(res.body.data[0].student.name).toBeDefined();
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(owner))
      .query({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].status).toBe('cancelled');
  });

  it('paginates participants', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(owner))
      .query({ limit: 2, page: 2 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('denies a non-owner organizer', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(other));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EVENT_NOT_OWNER');
  });

  it('allows admin to read participants', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
  });

  it('denies students', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(403);
  });

  it('exports participants as CSV without sensitive fields', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${event._id}/participants`)
      .set('Cookie', authCookie(owner))
      .query({ format: 'csv' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Name,Email,Roll No,Department,Year');
    expect(res.text).toContain('Part Student 1');
    expect(res.text).not.toContain('passwordHash');
    expect(res.text).not.toContain('$2b$');
  });
});

describe('Event gallery', () => {
  let app;
  let owner;
  let other;
  let admin;
  let club;
  let event;
  let galleryEvent;

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

  beforeAll(async () => {
    app = createApp();
    owner = await User.findOne({ email: `evowner.${suffix}@campus.edu` });
    other = await User.findOne({ email: `evother.${suffix}@campus.edu` });
    admin = await User.findOne({ email: `evadmin.${suffix}@campus.edu` });
    club = await Club.create({ name: `Gal Club ${suffix}`, slug: `gal-club-${suffix}` });
    event = await Event.create({
      ...eventBody({ title: `Gal Event ${suffix}`, slug: `gal-event-${suffix}` }),
      club: club._id,
      createdBy: owner._id,
      organizers: [owner._id],
      status: 'approved',
    });
  });

  it('owner uploads an image and stores a safe URL', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/gallery`)
      .set('Cookie', authCookie(owner))
      .attach('image', png, 'photo.png')
      .field('caption', 'Opening');

    expect(res.status).toBe(201);
    expect(res.body.data.event.gallery).toHaveLength(1);
    const url = res.body.data.event.gallery[0].url;
    expect(url).toMatch(/^\/uploads\//);
    expect(url).not.toContain('..');
    uploadedFiles.push(url);
  });

  it('rejects an unsupported file type with INVALID_FILE', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/gallery`)
      .set('Cookie', authCookie(owner))
      .attach('image', Buffer.from('plain text'), 'notes.txt');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE');
  });

  it('rejects an oversized file with FILE_TOO_LARGE', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024 + 1, 1);
    const res = await request(app)
      .post(`/api/v1/events/${event._id}/gallery`)
      .set('Cookie', authCookie(owner))
      .attach('image', big, 'big.png');

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('denies a non-owner organizer and unauthenticated uploads', async () => {
    const denied = await request(app)
      .post(`/api/v1/events/${event._id}/gallery`)
      .set('Cookie', authCookie(other))
      .attach('image', png, 'x.png');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('EVENT_NOT_OWNER');

    const unauth = await request(app)
      .post(`/api/v1/events/${event._id}/gallery`)
      .attach('image', png, 'y.png');
    expect(unauth.status).toBe(401);
  });

  it('enforces the gallery bound of 10 images', async () => {
    galleryEvent = await Event.create({
      ...eventBody({ title: `Full Gal ${suffix}`, slug: `full-gal-${suffix}` }),
      club: club._id,
      createdBy: owner._id,
      organizers: [owner._id],
      status: 'approved',
      gallery: Array.from({ length: 10 }, (_, i) => ({ url: `/uploads/${i}.jpg` })),
    });

    const res = await request(app)
      .post(`/api/v1/events/${galleryEvent._id}/gallery`)
      .set('Cookie', authCookie(owner))
      .attach('image', png, 'too-many.png');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('10');
  });
});
