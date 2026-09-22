import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAdminUser,
  adminStatusBadge,
  registrationStatusBadge,
  computePlatformKPIs,
  adminErrorText,
  confirmApproveText,
  confirmRejectText,
  confirmCancelEventText,
  confirmCancelRegistrationText,
  CONTRACT_GAPS,
  CAMPUS_ROLES,
} from './admin.js';

test('isAdminUser correctly guards administrative privileges', () => {
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser(undefined), false);
  assert.equal(isAdminUser({ role: 'student', isActive: true }), false);
  assert.equal(isAdminUser({ role: 'organizer', isActive: true }), false);
  assert.equal(isAdminUser({ role: 'admin', isActive: false }), false);
  assert.equal(isAdminUser({ role: 'admin', isActive: true }), true);
  assert.equal(isAdminUser({ role: 'admin' }), true);
});

test('adminStatusBadge produces correct labels and styling classes', () => {
  assert.deepEqual(adminStatusBadge('approved'), { label: 'Approved', className: 'badge-approved' });
  assert.deepEqual(adminStatusBadge('pending'), { label: 'Pending Review', className: 'badge-pending' });
  assert.deepEqual(adminStatusBadge('rejected'), { label: 'Rejected', className: 'badge-rejected' });
  assert.deepEqual(adminStatusBadge('cancelled'), { label: 'Cancelled', className: 'badge-cancelled' });
  assert.deepEqual(adminStatusBadge('custom'), { label: 'custom', className: 'badge-default' });
  assert.deepEqual(adminStatusBadge(null), { label: 'Unknown', className: 'badge-default' });
});

test('registrationStatusBadge maps attendee statuses accurately', () => {
  assert.deepEqual(registrationStatusBadge('registered'), { label: 'Registered', className: 'badge-approved' });
  assert.deepEqual(registrationStatusBadge('waitlisted'), { label: 'Waitlisted', className: 'badge-pending' });
  assert.deepEqual(registrationStatusBadge('cancelled'), { label: 'Cancelled', className: 'badge-cancelled' });
  assert.deepEqual(registrationStatusBadge('other'), { label: 'other', className: 'badge-default' });
  assert.deepEqual(registrationStatusBadge(undefined), { label: 'Unknown', className: 'badge-default' });
});

test('computePlatformKPIs accurately derives bounded platform aggregates', () => {
  const events = [
    {
      capacity: 100,
      registeredCount: 80,
      category: 'hackathon',
      eligibility: { departments: ['CSE', 'IT'] },
    },
    {
      capacity: 50,
      registeredCount: 20,
      category: 'workshop',
      eligibility: { departments: ['all'] },
    },
    {
      capacity: null,
      registeredCount: 15,
      category: 'cultural',
      eligibility: { departments: ['ECE'] },
    },
  ];

  const kpis = computePlatformKPIs(events);
  assert.equal(kpis.totalEvents, 3);
  assert.equal(kpis.totalCapacity, 150);
  assert.equal(kpis.totalRegistered, 115);
  assert.equal(kpis.cappedEventsCount, 2);
  // Fill rate for capped capacity: (100 registered on capped? wait, 115 / 150 = 76.67% -> 77%)
  assert.equal(kpis.fillRatePercent, 77);
  assert.equal(kpis.categoryCounts.hackathon, 1);
  assert.equal(kpis.categoryCounts.workshop, 1);
  assert.equal(kpis.categoryCounts.cultural, 1);
  assert.equal(kpis.departmentCounts.CSE, 1);
  assert.equal(kpis.departmentCounts.all, 1);

  // Empty events array
  const emptyKpis = computePlatformKPIs([]);
  assert.equal(emptyKpis.totalEvents, 0);
  assert.equal(emptyKpis.totalCapacity, 0);
  assert.equal(emptyKpis.totalRegistered, 0);
  assert.equal(emptyKpis.fillRatePercent, 0);
});

test('adminErrorText maps backend error codes to user-friendly messages', () => {
  assert.equal(adminErrorText(null), 'An unexpected error occurred.');
  assert.equal(adminErrorText({ code: 'EVENT_NOT_FOUND' }), 'Event could not be found. Please verify the slug or identifier.');
  assert.equal(adminErrorText({ code: 'EVENT_ALREADY_CANCELLED' }), 'This event is already cancelled and cannot be modified.');
  assert.equal(adminErrorText({ code: 'INVALID_STATUS_TRANSITION' }), 'This event cannot transition to the requested status. Only pending events can be approved or rejected.');
  assert.equal(adminErrorText({ code: 'REGISTRATION_NOT_FOUND' }), 'Registration not found or already cancelled.');
  assert.equal(adminErrorText({ code: 'EVENT_PAST_CANCELLATION' }), 'Registration cannot be cancelled after the event has started.');
  assert.equal(adminErrorText({ code: 'FORBIDDEN' }), 'You do not have administrative privileges to perform this operation.');
  assert.equal(adminErrorText({ code: 'UNKNOWN_CODE', message: 'Custom failure' }), 'Custom failure');
});

test('confirmation text builders format clear action confirmation prompts', () => {
  assert.ok(confirmApproveText('AI Summit 2026').includes('AI Summit 2026'));
  assert.ok(confirmRejectText('AI Summit 2026').includes('AI Summit 2026'));
  assert.ok(confirmCancelEventText('AI Summit 2026').includes('AI Summit 2026'));
  assert.ok(confirmCancelRegistrationText('John Doe', 'AI Summit 2026').includes('John Doe'));
});

test('CONTRACT_GAPS and CAMPUS_ROLES are properly declared', () => {
  assert.ok(CONTRACT_GAPS.PENDING_EVENTS_LIST.title);
  assert.ok(CONTRACT_GAPS.USER_MANAGEMENT.title);
  assert.ok(CAMPUS_ROLES.length === 3);
});
