const mongoose = require('mongoose');
const models = require('../models');

const { createTestDatabase } = require('./testDb');
const testDb = createTestDatabase(mongoose);

const { User, Club, Venue, Event, Registration, Announcement, initModels } = models;

function futureEventData(overrides = {}) {
  const startAt = new Date('2027-03-01T10:00:00.000Z');
  return {
    title: 'Test Event',
    slug: 'test-event',
    description: 'A test event description.',
    category: 'workshop',
    startAt,
    endAt: new Date('2027-03-01T13:00:00.000Z'),
    registrationDeadline: new Date('2027-02-27T23:00:00.000Z'),
    capacity: 10,
    createdBy: new mongoose.Types.ObjectId(),
    ...overrides,
  };
}

beforeAll(async () => {
  await testDb.setup();
  await initModels();
});

afterAll(async () => {
  await testDb.teardown();
});

describe('User model', () => {
  it('accepts a valid user', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test.user@campus.edu',
      passwordHash: 'x'.repeat(60),
      role: 'student',
      profile: { rollNo: '21CSE999', department: 'CSE', year: 2 },
    });
    expect(user._id).toBeDefined();
    expect(user.email).toBe('test.user@campus.edu');
  });

  it('rejects missing required fields', async () => {
    await expect(User.create({ email: 'nofield@campus.edu', passwordHash: 'x' })).rejects.toThrow(
      /name/
    );
    await expect(
      User.create({ name: 'No Email', passwordHash: 'x' })
    ).rejects.toThrow();
    await expect(
      User.create({ name: 'No Hash', email: 'nohash@campus.edu' })
    ).rejects.toThrow();
  });

  it('rejects invalid role enum', async () => {
    await expect(
      User.create({
        name: 'Bad Role',
        email: 'bad.role@campus.edu',
        passwordHash: 'x',
        role: 'superuser',
      })
    ).rejects.toThrow(/role/i);
  });

  it('rejects an out-of-range year', async () => {
    await expect(
      User.create({
        name: 'Bad Year',
        email: 'bad.year@campus.edu',
        passwordHash: 'x',
        profile: { year: 9 },
      })
    ).rejects.toThrow();
  });

  it('normalizes and enforces unique email (case-insensitive)', async () => {
    await User.create({ name: 'Dup One', email: 'dup@campus.edu', passwordHash: 'x' });
    await expect(
      User.create({ name: 'Dup Two', email: 'DUP@CAMPUS.EDU', passwordHash: 'x' })
    ).rejects.toThrow(/duplicate key|E11000/i);
  });
});

describe('Club model', () => {
  it('accepts a valid club and enforces unique slug', async () => {
    const club = await Club.create({
      name: 'Test Club',
      slug: 'test-club',
      description: 'A test club',
    });
    expect(club._id).toBeDefined();

    await expect(
      Club.create({ name: 'Test Club 2', slug: 'test-club' })
    ).rejects.toThrow(/duplicate key|E11000/i);
  });

  it('rejects an invalid slug format', async () => {
    await expect(
      Club.create({ name: 'Bad Slug', slug: 'Bad Slug!' })
    ).rejects.toThrow();
  });
});

describe('Event model', () => {
  let club;
  let organizer;

  beforeAll(async () => {
    club = await Club.create({ name: 'Event Club', slug: 'event-club' });
    organizer = await User.create({
      name: 'Event Organizer',
      email: 'event.organizer@campus.edu',
      passwordHash: 'x',
      role: 'organizer',
    });
  });

  it('accepts a valid event', async () => {
    const event = await Event.create(
      futureEventData({ club: club._id, organizers: [organizer._id] })
    );
    expect(event._id).toBeDefined();
    expect(event.registeredCount).toBe(0);
    expect(event.status).toBe('pending');
  });

  it('rejects endAt <= startAt', async () => {
    await expect(
      Event.create(
        futureEventData({
          club: club._id,
          slug: 'bad-end',
          endAt: new Date('2027-03-01T09:00:00.000Z'),
        })
      )
    ).rejects.toThrow(/endAt must be after startAt/);
  });

  it('rejects registrationDeadline after startAt', async () => {
    await expect(
      Event.create(
        futureEventData({
          club: club._id,
          slug: 'bad-deadline',
          registrationDeadline: new Date('2027-03-02T23:00:00.000Z'),
        })
      )
    ).rejects.toThrow(/registrationDeadline must be on or before startAt/);
  });

  it('rejects non-positive capacity', async () => {
    await expect(
      Event.create(futureEventData({ club: club._id, slug: 'bad-capacity', capacity: 0 }))
    ).rejects.toThrow();
  });

  it('rejects negative registeredCount and invalid category', async () => {
    await expect(
      Event.create(
        futureEventData({ club: club._id, slug: 'bad-count', registeredCount: -1 })
      )
    ).rejects.toThrow();
    await expect(
      Event.create(
        futureEventData({ club: club._id, slug: 'bad-category', category: 'party' })
      )
    ).rejects.toThrow(/category/i);
  });

  it('enforces unique slug', async () => {
    await expect(
      Event.create(futureEventData({ club: club._id, slug: 'test-event' }))
    ).rejects.toThrow(/duplicate key|E11000/i);
  });
});

describe('Registration model', () => {
  let club;
  let student;
  let event;

  beforeAll(async () => {
    club = await Club.create({ name: 'Reg Club', slug: 'reg-club' });
    student = await User.create({
      name: 'Reg Student',
      email: 'reg.student@campus.edu',
      passwordHash: 'x',
      role: 'student',
    });
    event = await Event.create(futureEventData({ club: club._id, slug: 'reg-event' }));
  });

  it('accepts a valid registration with snapshot and attendance fields', async () => {
    const reg = await Registration.create({
      event: event._id,
      student: student._id,
      eventSnapshot: { title: event.title, startAt: event.startAt, venue: 'Seminar Hall A' },
    });
    expect(reg._id).toBeDefined();
    expect(reg.status).toBe('registered');
    expect(reg.attendedAt).toBeNull();
    expect(reg.eventSnapshot.title).toBe('Test Event');
  });

  it('blocks a duplicate active registration (partial unique index)', async () => {
    await expect(
      Registration.create({ event: event._id, student: student._id })
    ).rejects.toThrow(/duplicate key|E11000/i);
  });

  it('allows a new active registration after cancellation', async () => {
    await Registration.updateOne(
      { event: event._id, student: student._id },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    const second = await Registration.create({ event: event._id, student: student._id });
    expect(second.status).toBe('registered');

    const active = await Registration.countDocuments({
      event: event._id,
      student: student._id,
      status: 'registered',
    });
    expect(active).toBe(1);
  });

  it('rejects missing event/student references', async () => {
    await expect(Registration.create({ student: student._id })).rejects.toThrow();
    await expect(Registration.create({ event: event._id })).rejects.toThrow();
  });
});

describe('Announcement model', () => {
  let admin;

  beforeAll(async () => {
    admin = await User.create({
      name: 'Announce Admin',
      email: 'announce.admin@campus.edu',
      passwordHash: 'x',
      role: 'admin',
    });
  });

  it('accepts a global announcement', async () => {
    const ann = await Announcement.create({
      title: 'Global Notice',
      body: 'This is a global announcement.',
      scope: 'global',
      createdBy: admin._id,
    });
    expect(ann._id).toBeDefined();
  });

  it('rejects invalid scope enum', async () => {
    await expect(
      Announcement.create({
        title: 'Bad Scope',
        body: 'x',
        scope: 'campus-wide',
        createdBy: admin._id,
      })
    ).rejects.toThrow(/scope/i);
  });

  it('requires an event reference for event-scoped announcements', async () => {
    await expect(
      Announcement.create({
        title: 'Orphan Event Scope',
        body: 'x',
        scope: 'event',
        createdBy: admin._id,
      })
    ).rejects.toThrow(/event-scoped announcement requires an event reference/);
  });
});

describe('Indexes', () => {
  it('creates all planned named indexes', async () => {
    const expected = {
      User: ['email_1', 'user_role', 'user_department'],
      Club: ['name_1', 'slug_1', 'club_text_search'],
      Venue: ['name_1'],
      Event: [
        'slug_1',
        'event_status_start',
        'event_club_start',
        'event_category_start',
        'event_registration_deadline',
        'event_text_search',
      ],
      Registration: [
        'unique_active_registration',
        'registration_student_status',
        'registration_event_status',
        'registration_event_attendance',
      ],
      Announcement: ['announcement_scope', 'announcement_event'],
    };

    for (const [modelName, indexNames] of Object.entries(expected)) {
      const Model = models[modelName];
      const indexes = await Model.collection.indexInformation({ full: true });
      const names = indexes.map((i) => i.name);
      for (const expectedName of indexNames) {
        expect(names).toContain(expectedName);
      }
    }
  });

  it('creates the partial unique registration index with the registered filter', async () => {
    const indexes = await Registration.collection.indexInformation({ full: true });
    const partial = indexes.find((i) => i.name === 'unique_active_registration');
    expect(partial).toBeDefined();
    expect(partial.unique).toBe(true);
    expect(partial.partialFilterExpression).toEqual({ status: 'registered' });
  });
});
