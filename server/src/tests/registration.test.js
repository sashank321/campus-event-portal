const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const request = require('supertest');

const createApp = require('../app');
const { User, Club, Venue, Event, Registration } = require('../models');
const { env } = require('../config/env');

const { createTestDatabase } = require('./testDb');
const testDb = createTestDatabase(mongoose);
const suffix = Date.now();

function authCookie(user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: '30m',
  });
  return `token=${token}`;
}

function future(days, hour = 10) {
  const d = new Date('2027-07-01T10:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

async function makeStudents(count, prefix = 'regstud') {
  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      User.create({
        name: `${prefix} ${i + 1}`,
        email: `${prefix}.${suffix}.${i + 1}@campus.edu`,
        passwordHash: 'x',
        role: 'student',
      })
    )
  );
}

async function makeEvent(overrides = {}) {
  const admin = await User.findOne({ email: `regadmin.${suffix}@campus.edu` });
  const club = await Club.findOne({ slug: `reg-club-${suffix}` });
  const startAt = overrides.startAt || future(7);
  return Event.create({
    title: `Reg Event ${Date.now()} ${suffix}`,
    slug: `reg-event-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    description: 'A registration test event.',
    category: 'workshop',
    club: club._id,
    createdBy: admin._id,
    organizers: [admin._id],
    status: 'approved',
    startAt,
    endAt: new Date(startAt.getTime() + 4 * 3600000),
    registrationDeadline: new Date(startAt.getTime() - 2 * 86400000),
    capacity: null,
    ...overrides,
  });
}

function registerRequest(app, event, user) {
  return request(app)
    .post(`/api/v1/events/${event._id}/register`)
    .set('Cookie', authCookie(user))
    .send({});
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
  await User.create({ name: 'Reg Admin', email: `regadmin.${suffix}@campus.edu`, passwordHash: await bcrypt.hash('x', 12), role: 'admin' });
  await Club.create({ name: `Reg Club ${suffix}`, slug: `reg-club-${suffix}` });
});

afterAll(async () => {
  await testDb.teardown();
});

describe('POST /api/v1/events/:id/register', () => {
  let app;
  let student;
  let organizer;
  let event;

  beforeAll(async () => {
    app = createApp();
    [student] = await makeStudents(1, 'regone');
    organizer = await User.create({ name: 'Reg Organizer', email: `regorg.${suffix}@campus.edu`, passwordHash: 'x', role: 'organizer' });
    event = await makeEvent({ capacity: 10 });
  });

  it('registers a student successfully with a snapshot', async () => {
    const res = await registerRequest(app, event, student);
    expect(res.status).toBe(201);
    expect(res.body.data.registration.status).toBe('registered');
    expect(res.body.data.registration.eventSnapshot.title).toBe(event.title);
    expect(res.body.data.registration.eventSnapshot.startAt).toBeDefined();

    const updated = await Event.findById(event._id);
    expect(updated.registeredCount).toBe(1);
  });

  it('rejects a duplicate active registration (ALREADY_REGISTERED)', async () => {
    const res = await registerRequest(app, event, student);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_REGISTERED');

    const updated = await Event.findById(event._id);
    expect(updated.registeredCount).toBe(1);
  });

  it('returns ALREADY_REGISTERED for an active registration when the event is full', async () => {
    const fullEvent = await makeEvent({ capacity: 1 });
    expect((await registerRequest(app, fullEvent, student)).status).toBe(201);

    const duplicate = await registerRequest(app, fullEvent, student);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('ALREADY_REGISTERED');
    expect((await Event.findById(fullEvent._id)).registeredCount).toBe(1);
    expect(await Registration.countDocuments({ event: fullEvent._id, status: 'registered' })).toBe(1);
  });

  it('allows re-registration after cancellation', async () => {
    const reg = await Registration.findOne({ event: event._id, student: student._id });
    await registrationServiceCancel(app, student, reg);

    const res = await registerRequest(app, event, student);
    expect(res.status).toBe(201);

    const updated = await Event.findById(event._id);
    expect(updated.registeredCount).toBe(1);

    const active = await Registration.countDocuments({ event: event._id, student: student._id, status: 'registered' });
    expect(active).toBe(1);
  });

  it('rejects pending/rejected/cancelled events (EVENT_NOT_REGISTERABLE)', async () => {
    for (const status of ['pending', 'rejected', 'cancelled']) {
      const e = await makeEvent({ status });
      const [s] = await makeStudents(1, `bad${status.slice(0, 3)}`);
      const attempt = await registerRequest(app, e, s);
      expect(attempt.status).toBe(409);
      expect(attempt.body.error.code).toBe('EVENT_NOT_REGISTERABLE');
    }
  });

  it('rejects when the deadline has passed (REGISTRATION_CLOSED)', async () => {
    const e = await makeEvent({
      registrationDeadline: new Date(Date.now() - 3600000),
    });
    const [s] = await makeStudents(1, 'deadline');
    const res = await registerRequest(app, e, s);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
  });

  it('rejects when full (EVENT_FULL)', async () => {
    const e = await makeEvent({ capacity: 1 });
    const [s1] = await makeStudents(1, 'full1');
    const [s2] = await makeStudents(1, 'full2');
    await registerRequest(app, e, s1);
    const res = await registerRequest(app, e, s2);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EVENT_FULL');
  });

  it('supports unlimited capacity (null)', async () => {
    const e = await makeEvent({ capacity: null });
    const students = await makeStudents(5, 'unlim');
    const results = await Promise.all(students.map((s) => registerRequest(app, e, s)));
    for (const r of results) expect(r.status).toBe(201);
    const updated = await Event.findById(e._id);
    expect(updated.registeredCount).toBe(5);
  });

  it('rejects organizer/admin roles and unauthenticated requests', async () => {
    const e = await makeEvent({ capacity: 50 });
    const orgRes = await request(app)
      .post(`/api/v1/events/${e._id}/register`)
      .set('Cookie', authCookie(organizer))
      .send({});
    expect(orgRes.status).toBe(403);
    expect(orgRes.body.error.code).toBe('FORBIDDEN');
    const admin = await User.findOne({ email: `regadmin.${suffix}@campus.edu` });
    expect((await registerRequest(app, e, admin)).status).toBe(403);

    const unauth = await request(app).post(`/api/v1/events/${e._id}/register`).send({});
    expect(unauth.status).toBe(401);
    expect(unauth.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('rolls back a failed insert and hides transaction internals from clients', async () => {
    const e = await makeEvent();
    const failure = Object.assign(new Error('Transaction 42 session private-session on internal-host failed'), {
      name: 'MongoServerError', code: 251,
    });
    const insert = jest.spyOn(Registration, 'create').mockRejectedValueOnce(failure);
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await registerRequest(app, e, student);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
      expect((await Event.findById(e._id)).registeredCount).toBe(0);
      expect(await Registration.countDocuments({ event: e._id })).toBe(0);
    } finally {
      insert.mockRestore();
      log.mockRestore();
    }
  });

  it('stores all snapshot fields without changing them after event edits', async () => {
    const venue = await Venue.create({ name: `Snapshot venue ${suffix}` });
    const e = await makeEvent({ venue: venue._id, bannerUrl: '/uploads/original.png' });
    const res = await registerRequest(app, e, student);
    expect(res.status).toBe(201);
    const snapshot = { title: e.title, startAt: e.startAt.toISOString(), venue: venue.name, bannerUrl: e.bannerUrl };
    expect(res.body.data.registration.eventSnapshot).toEqual(snapshot);
    await Event.updateOne({ _id: e._id }, { $set: { title: 'Changed title', startAt: future(30), bannerUrl: '/uploads/new.png' } });
    await Venue.updateOne({ _id: venue._id }, { $set: { name: `Changed venue ${suffix}` } });
    const mine = await request(app).get('/api/v1/my/registrations').set('Cookie', authCookie(student));
    expect(mine.body.data.find((r) => r._id === res.body.data.registration._id).eventSnapshot).toEqual(snapshot);
  });

  it('unique index still aborts a duplicate insert when the early check misses', async () => {
    const e = await makeEvent({ capacity: 10 });
    expect((await registerRequest(app, e, student)).status).toBe(201);
    const precheck = jest.spyOn(Registration, 'exists').mockReturnValueOnce({ session: async () => null });
    try {
      const duplicate = await registerRequest(app, e, student);
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.code).toBe('ALREADY_REGISTERED');
      expect((await Event.findById(e._id)).registeredCount).toBe(1);
      expect(await Registration.countDocuments({ event: e._id, status: 'registered' })).toBe(1);
    } finally { precheck.mockRestore(); }
  });

  it('returns 404 for a nonexistent event', async () => {
    const fake = new mongoose.Types.ObjectId();
    const res = await registerRequest(app, { _id: fake }, student);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('EVENT_NOT_FOUND');
  });

  async function registrationServiceCancel(app, user, reg) {
    return request(app).delete(`/api/v1/registrations/${reg._id}`).set('Cookie', authCookie(user)).send({});
  }
});

describe('DELETE /api/v1/registrations/:id', () => {
  let app;
  let owner;
  let other;
  let admin;
  let event;

  beforeAll(async () => {
    app = createApp();
    [owner, other] = await makeStudents(2, 'cancel');
    admin = await User.create({ name: 'Cancel Admin', email: `canceladmin.${suffix}@campus.edu`, passwordHash: 'x', role: 'admin' });
    event = await makeEvent({ capacity: 10 });
  });

  it('owning student cancels; counter decrements exactly once', async () => {
    await registerRequest(app, event, owner);
    expect((await Event.findById(event._id)).registeredCount).toBe(1);

    const reg = await Registration.findOne({ event: event._id, student: owner._id });
    const res = await request(app)
      .delete(`/api/v1/registrations/${reg._id}`)
      .set('Cookie', authCookie(owner))
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.registration.status).toBe('cancelled');
    expect(res.body.data.registration.cancelledAt).toBeDefined();

    expect((await Event.findById(event._id)).registeredCount).toBe(0);

    const again = await request(app)
      .delete(`/api/v1/registrations/${reg._id}`)
      .set('Cookie', authCookie(owner))
      .send({});
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('REGISTRATION_ALREADY_CANCELLED');
  });

  it('admin can cancel a registration', async () => {
    await registerRequest(app, event, owner);
    const reg = await Registration.findOne({ event: event._id, student: owner._id, status: 'registered' });
    const res = await request(app)
      .delete(`/api/v1/registrations/${reg._id}`)
      .set('Cookie', authCookie(admin))
      .send({});
    expect(res.status).toBe(200);
  });

  it('another student is rejected (REGISTRATION_NOT_OWNER)', async () => {
    await registerRequest(app, event, owner);
    const reg = await Registration.findOne({ event: event._id, student: owner._id, status: 'registered' });
    const res = await request(app)
      .delete(`/api/v1/registrations/${reg._id}`)
      .set('Cookie', authCookie(other))
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REGISTRATION_NOT_OWNER');
  });

  it('rejects cancellation after event start (CANNOT_CANCEL_AFTER_START)', async () => {
    const started = await makeEvent({
      startAt: new Date(Date.now() - 3600000),
      endAt: new Date(Date.now() + 3600000),
      registrationDeadline: new Date(Date.now() - 7200000),
    });
    // Deadline already passed, so registration via API is closed - seed the
    // registration directly, then attempt cancellation
    await Registration.create({
      event: started._id,
      student: owner._id,
      eventSnapshot: { title: started.title, startAt: started.startAt },
    });
    const reg = await Registration.findOne({ event: started._id, student: owner._id });
    const res = await request(app)
      .delete(`/api/v1/registrations/${reg._id}`)
      .set('Cookie', authCookie(owner))
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CANNOT_CANCEL_AFTER_START');
  });

  it.each(['missing', 'zero'])('rolls back cancellation when the event counter is %s', async (condition) => {
    const e = await makeEvent();
    const registered = await registerRequest(app, e, owner);
    expect(registered.status).toBe(201);
    const id = registered.body.data.registration._id;
    if (condition === 'missing') await Event.deleteOne({ _id: e._id });
    else await Event.updateOne({ _id: e._id }, { $set: { registeredCount: 0 } });

    const res = await request(app).delete(`/api/v1/registrations/${id}`).set('Cookie', authCookie(owner));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REGISTRATION_STATE_CONFLICT');
    const stored = await Registration.findById(id);
    expect(stored.status).toBe('registered');
    expect(stored.cancelledAt).toBeFalsy();
    if (condition === 'zero') expect((await Event.findById(e._id)).registeredCount).toBe(0);
  });

  it('parallel owner/admin cancellations decrement exactly once', async () => {
    const e = await makeEvent({ capacity: 1 });
    const created = await registerRequest(app, e, owner);
    expect(created.status).toBe(201);
    const id = created.body.data.registration._id;
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) =>
      request(app).delete(`/api/v1/registrations/${id}`).set('Cookie', authCookie(i % 2 ? admin : owner))
    ));
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    for (const failed of results.filter((r) => r.status !== 200)) {
      expect(failed.status).toBe(409);
      expect(failed.body.error.code).toBe('REGISTRATION_ALREADY_CANCELLED');
    }
    expect((await Event.findById(e._id)).registeredCount).toBe(0);
    expect(await Registration.countDocuments({ event: e._id, status: 'registered' })).toBe(0);
    const cancelled = await Registration.findById(id);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeInstanceOf(Date);
  });

  it('returns 404 for unknown registration', async () => {
    const res = await request(app)
      .delete(`/api/v1/registrations/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', authCookie(owner))
      .send({});
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('REGISTRATION_NOT_FOUND');
  });
});

describe('GET /api/v1/my/registrations', () => {
  let app;
  let student;
  let otherStudent;
  let e1;
  let e2;

  beforeAll(async () => {
    app = createApp();
    [student, otherStudent] = await makeStudents(2, 'myreg');
    e1 = await makeEvent({ title: `MyReg Event One ${suffix}`, startAt: future(3), registrationDeadline: future(1), capacity: 20 });
    e2 = await makeEvent({ title: `MyReg Event Two ${suffix}`, startAt: future(10), registrationDeadline: future(8), capacity: 20 });
    await registerRequest(app, e2, student);
    await registerRequest(app, e1, student);
    const cancelledEvent = await makeEvent({ title: `MyReg Event Cancelled ${suffix}`, startAt: future(15), registrationDeadline: future(12), capacity: 20 });
    await registerRequest(app, cancelledEvent, student);
    const reg = await Registration.findOne({ event: cancelledEvent._id, student: student._id });
    await request(app)
      .delete(`/api/v1/registrations/${reg._id}`)
      .set('Cookie', authCookie(student))
      .send({});
    await registerRequest(app, e1, otherStudent);
  });

  it('returns only the current user registrations with snapshots', async () => {
    const res = await request(app)
      .get('/api/v1/my/registrations')
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);
    for (const item of res.body.data) {
      expect(item.eventSnapshot).toBeDefined();
      expect(item.eventSnapshot.title).toBeDefined();
    }
    const expected = await Registration.find({ student: student._id }).distinct('_id');
    expect(res.body.data.map((r) => r._id).sort()).toEqual(expected.map(String).sort());
  });

  it('never exposes another student registrations', async () => {
    const mine = await request(app)
      .get('/api/v1/my/registrations')
      .set('Cookie', authCookie(otherStudent));
    expect(mine.body.meta.total).toBe(1);
  });

  it('filters by status (cancelled remain visible when requested)', async () => {
    const res = await request(app)
      .get('/api/v1/my/registrations')
      .set('Cookie', authCookie(student))
      .query({ status: 'cancelled' });
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].status).toBe('cancelled');
    expect(res.body.data[0].cancelledAt).toBeDefined();
  });

  it('paginates', async () => {
    const res = await request(app)
      .get('/api/v1/my/registrations')
      .set('Cookie', authCookie(student))
      .query({ limit: 2, page: 2 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('sorts upcoming by snapshot startAt ascending', async () => {
    const res = await request(app)
      .get('/api/v1/my/registrations')
      .set('Cookie', authCookie(student))
      .query({ sort: 'upcoming', status: 'registered' });
    const starts = res.body.data.map((r) => new Date(r.eventSnapshot.startAt).getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(res.body.data[0].eventSnapshot.title).toContain('One');
  });

  it.each(['past', 'newest'])('sorts %s descending', async (sort) => {
    const res = await request(app).get('/api/v1/my/registrations').set('Cookie', authCookie(student)).query({ sort });
    expect(res.status).toBe(200);
    const times = res.body.data.map((r) => new Date(sort === 'past' ? r.eventSnapshot.startAt : r.registeredAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/my/registrations');
    expect(res.status).toBe(401);
  });
});

describe('CRITICAL: parallel capacity race', () => {
  it('admits exactly N of M parallel requests (N < M), no drift, no duplicates', async () => {
    const app = createApp();
    const N = 5;
    const M = 15;
    const raceEvent = await makeEvent({ capacity: N });
    const students = await makeStudents(M, 'race');

    const results = await Promise.all(students.map((s) => registerRequest(app, raceEvent, s)));

    const succeeded = results.filter((r) => r.status === 201);
    const failed = results.filter((r) => r.status !== 201);

    expect(succeeded).toHaveLength(N);
    expect(failed).toHaveLength(M - N);
    for (const r of failed) {
      expect(r.body.error.code).toBe('EVENT_FULL');
    }

    const updated = await Event.findById(raceEvent._id);
    expect(updated.registeredCount).toBe(N);

    const active = await Registration.countDocuments({ event: raceEvent._id, status: 'registered' });
    expect(active).toBe(N);

    const distinctStudents = new Set(
      (await Registration.find({ event: raceEvent._id, status: 'registered' })).map((r) => r.student.toString())
    );
    expect(distinctStudents.size).toBe(N);
  });

  it.each([1, 10])('parallel duplicate attempts from the SAME student yield exactly one active registration at capacity %i', async (capacity) => {
    const app = createApp();
    const event = await makeEvent({ capacity });
    const [student] = await makeStudents(1, `duprace${capacity}`);

    const attempts = await Promise.all(
      Array.from({ length: 6 }, () => registerRequest(app, event, student))
    );

    const succeeded = attempts.filter((r) => r.status === 201);
    expect(succeeded).toHaveLength(1);
    for (const failed of attempts.filter((r) => r.status !== 201)) {
      expect(failed.status).toBe(409);
      expect(failed.body.error.code).toBe('ALREADY_REGISTERED');
    }

    const updated = await Event.findById(event._id);
    expect(updated.registeredCount).toBe(1);

    const active = await Registration.countDocuments({ event: event._id, student: student._id, status: 'registered' });
    expect(active).toBe(1);
  });
});