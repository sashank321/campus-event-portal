import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_CATEGORIES,
  DEPARTMENTS,
  toLocalDatetimeString,
  fromLocalDatetimeString,
  statusBadge,
  registrationAvailability,
  validateEventForm,
  organizerErrorText,
} from './organizer.js';

test('EVENT_CATEGORIES and DEPARTMENTS constants', () => {
  assert.ok(EVENT_CATEGORIES.includes('hackathon'));
  assert.ok(EVENT_CATEGORIES.includes('workshop'));
  assert.ok(DEPARTMENTS.includes('all'));
  assert.ok(DEPARTMENTS.includes('CSE'));
});

test('toLocalDatetimeString converts Dates and handles invalid inputs', () => {
  assert.equal(toLocalDatetimeString(null), '');
  assert.equal(toLocalDatetimeString(undefined), '');
  assert.equal(toLocalDatetimeString('not-a-date'), '');

  const d = new Date(2026, 8, 18, 14, 30); // local Sept 18 2026 14:30
  const str = toLocalDatetimeString(d);
  assert.equal(str, '2026-09-18T14:30');
});

test('fromLocalDatetimeString converts local string to ISO UTC', () => {
  assert.equal(fromLocalDatetimeString(''), null);
  assert.equal(fromLocalDatetimeString(null), null);
  assert.equal(fromLocalDatetimeString('invalid-str'), null);

  const iso = fromLocalDatetimeString('2026-09-18T14:30');
  assert.ok(typeof iso === 'string');
  assert.ok(iso.includes('2026-09-18'));
});

test('statusBadge returns correct labels and badge classes', () => {
  assert.deepEqual(statusBadge('approved'), { label: 'Approved', className: 'badge-approved' });
  assert.deepEqual(statusBadge('pending'), { label: 'Pending Review', className: 'badge-pending' });
  assert.deepEqual(statusBadge('rejected'), { label: 'Rejected', className: 'badge-rejected' });
  assert.deepEqual(statusBadge('cancelled'), { label: 'Cancelled', className: 'badge-cancelled' });
  assert.deepEqual(statusBadge('archived'), { label: 'archived', className: 'badge-default' });
  assert.deepEqual(statusBadge(undefined), { label: 'Unknown', className: 'badge-default' });
});

test('registrationAvailability computes availability accurately', () => {
  const now = new Date('2026-09-18T12:00:00Z').getTime();

  // Non-approved events
  assert.equal(registrationAvailability({ status: 'pending' }, now), 'Unavailable');
  assert.equal(registrationAvailability({ status: 'cancelled' }, now), 'Unavailable');

  // Past deadline
  assert.equal(
    registrationAvailability(
      {
        status: 'approved',
        registrationDeadline: '2026-09-18T11:00:00Z',
        capacity: 100,
        registeredCount: 10,
      },
      now
    ),
    'Closed (Deadline)'
  );

  // Full capacity
  assert.equal(
    registrationAvailability(
      {
        status: 'approved',
        registrationDeadline: '2026-09-18T15:00:00Z',
        capacity: 50,
        registeredCount: 50,
      },
      now
    ),
    'Full'
  );

  // Open capacity with room
  assert.equal(
    registrationAvailability(
      {
        status: 'approved',
        registrationDeadline: '2026-09-18T15:00:00Z',
        capacity: 100,
        registeredCount: 45,
      },
      now
    ),
    'Open'
  );

  // Open with unlimited capacity (capacity = null)
  assert.equal(
    registrationAvailability(
      {
        status: 'approved',
        registrationDeadline: '2026-09-18T15:00:00Z',
        capacity: null,
        registeredCount: 300,
      },
      now
    ),
    'Open'
  );
});

test('validateEventForm catches missing or invalid fields', () => {
  // Completely empty form
  const emptyErrors = validateEventForm({});
  assert.ok(emptyErrors.title);
  assert.ok(emptyErrors.description);
  assert.ok(emptyErrors.category);
  assert.ok(emptyErrors.club);
  assert.ok(emptyErrors.startAt);
  assert.ok(emptyErrors.endAt);
  assert.ok(emptyErrors.registrationDeadline);

  // Over-length title and description
  const lengthErrors = validateEventForm({
    title: 'A'.repeat(151),
    description: 'B'.repeat(5001),
    category: 'hackathon',
    club: '6aa8d62fb506f3a6c4f3ee53',
    startAt: '2026-10-01T10:00',
    endAt: '2026-10-01T18:00',
    registrationDeadline: '2026-10-01T09:00',
  });
  assert.equal(lengthErrors.title, 'Title cannot exceed 150 characters');
  assert.equal(lengthErrors.description, 'Description cannot exceed 5000 characters');

  // End time before or equal to start time
  const timeErrors = validateEventForm({
    title: 'Valid Title',
    description: 'Valid Description',
    category: 'hackathon',
    club: '6aa8d62fb506f3a6c4f3ee53',
    startAt: '2026-10-01T14:00',
    endAt: '2026-10-01T12:00',
    registrationDeadline: '2026-10-01T10:00',
  });
  assert.equal(timeErrors.endAt, 'End time must be after start time');

  // Registration deadline after start time
  const deadlineErrors = validateEventForm({
    title: 'Valid Title',
    description: 'Valid Description',
    category: 'hackathon',
    club: '6aa8d62fb506f3a6c4f3ee53',
    startAt: '2026-10-01T14:00',
    endAt: '2026-10-01T18:00',
    registrationDeadline: '2026-10-01T15:00',
  });
  assert.equal(deadlineErrors.registrationDeadline, 'Registration deadline must be on or before event start');

  // Invalid capacity
  const capErrors = validateEventForm({
    title: 'Valid Title',
    description: 'Valid Description',
    category: 'hackathon',
    club: '6aa8d62fb506f3a6c4f3ee53',
    startAt: '2026-10-01T14:00',
    endAt: '2026-10-01T18:00',
    registrationDeadline: '2026-10-01T10:00',
    capacity: '-5',
  });
  assert.equal(capErrors.capacity, 'Capacity must be a positive integer');

  // Completely valid form
  const validErrors = validateEventForm({
    title: 'Hackathon 2026',
    description: 'A flagship 24-hour campus hackathon with great prizes.',
    category: 'hackathon',
    club: '6aa8d62fb506f3a6c4f3ee53',
    venue: '6aa8d62fb506f3a6c4f3ee54',
    startAt: '2026-10-01T10:00',
    endAt: '2026-10-02T10:00',
    registrationDeadline: '2026-09-30T23:59',
    capacity: '200',
  });
  assert.deepEqual(validErrors, {});
});

test('organizerErrorText maps backend codes to user-friendly messages', () => {
  assert.equal(organizerErrorText(null), 'An unexpected error occurred.');
  assert.equal(organizerErrorText({ code: 'EVENT_NOT_FOUND' }), 'Event not found or you do not have permission to view it.');
  assert.equal(organizerErrorText({ code: 'EVENT_NOT_OWNER' }), 'You are not authorized to manage this event.');
  assert.equal(organizerErrorText({ code: 'EVENT_ALREADY_CANCELLED' }), 'This event is already cancelled and cannot be modified.');
  assert.equal(organizerErrorText({ code: 'INVALID_FILE' }), 'Please upload a supported image file (JPEG, PNG, or WebP).');
  assert.equal(organizerErrorText({ code: 'FILE_TOO_LARGE' }), 'The uploaded image exceeds the 5 MB limit.');
  assert.equal(organizerErrorText({ code: 'UNKNOWN_CODE', message: 'Custom server error' }), 'Custom server error');
});
