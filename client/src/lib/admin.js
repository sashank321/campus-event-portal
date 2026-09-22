import { dateLabel, timeLabel, seats } from './events.js';

export const CAMPUS_ROLES = [
  { role: 'student', title: 'Student', description: 'Can discover approved events, register, view registration status, and cancel upcoming registrations.' },
  { role: 'organizer', title: 'Club Organizer', description: 'Can draft and propose events, manage assigned club events, view attendee rosters, and upload gallery media.' },
  { role: 'admin', title: 'Campus Administrator', description: 'Full executive privileges: approve/reject proposed events, soft-cancel events, view all platform rosters, and moderate content.' },
];

export const CONTRACT_GAPS = {
  PENDING_EVENTS_LIST: {
    title: 'Platform-wide Pending Submissions Query Gap',
    description: 'The backend GET /api/v1/events endpoint enforces a strict server-side filter { status: "approved" }. It does not accept status query parameters or return pending events. Direct moderation is accessed by event slug via GET /api/v1/events/:slug.',
  },
  USER_MANAGEMENT: {
    title: 'User Management API Contract Gap',
    description: 'The backend does not currently expose /api/v1/users routes for listing user accounts, altering roles, or deactivating accounts. User authentication and session verification are handled via /api/v1/auth/me.',
  },
  CLUB_MANAGEMENT: {
    title: 'Club CRUD API Contract Gap',
    description: 'The backend does not currently expose /api/v1/clubs creation, update, or deletion routes. Active clubs are derived from campus catalog and active event records.',
  },
  VENUE_MANAGEMENT: {
    title: 'Venue CRUD API Contract Gap',
    description: 'The backend does not currently expose /api/v1/venues creation, update, or deletion routes. Campus venues are derived from campus catalog and active event records.',
  },
  GLOBAL_REGISTRATIONS: {
    title: 'Global Registrations Query Gap',
    description: 'The backend does not expose a global /api/v1/registrations endpoint across all events. Attendee rosters are scoped per-event via GET /api/v1/events/:id/participants.',
  },
  AGGREGATE_STATS: {
    title: 'Aggregate Analytics Endpoint Gap',
    description: 'The backend does not expose /api/v1/admin/stats. Analytics are computed client-side from loaded platform event records.',
  },
};

export function isAdminUser(user) {
  return Boolean(user && user.role === 'admin' && user.isActive !== false);
}

export function adminStatusBadge(status) {
  switch (status) {
    case 'approved':
      return { label: 'Approved', className: 'badge-approved' };
    case 'pending':
      return { label: 'Pending Review', className: 'badge-pending' };
    case 'rejected':
      return { label: 'Rejected', className: 'badge-rejected' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'badge-cancelled' };
    default:
      return { label: status || 'Unknown', className: 'badge-default' };
  }
}

export function registrationStatusBadge(status) {
  switch (status) {
    case 'registered':
      return { label: 'Registered', className: 'badge-approved' };
    case 'waitlisted':
      return { label: 'Waitlisted', className: 'badge-pending' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'badge-cancelled' };
    default:
      return { label: status || 'Unknown', className: 'badge-default' };
  }
}

export function computePlatformKPIs(events = []) {
  const totalEvents = events.length;
  let totalCapacity = 0;
  let totalRegistered = 0;
  let cappedEventsCount = 0;

  const categoryCounts = {};
  const departmentCounts = {};

  for (const ev of events) {
    if (ev.capacity != null && ev.capacity > 0) {
      totalCapacity += ev.capacity;
      cappedEventsCount++;
    }
    const reg = ev.registeredCount || 0;
    totalRegistered += reg;

    const cat = ev.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const depts = ev.eligibility?.departments || ['all'];
    for (const d of depts) {
      departmentCounts[d] = (departmentCounts[d] || 0) + 1;
    }
  }

  const fillRatePercent = totalCapacity > 0
    ? Math.min(100, Math.round((totalRegistered / totalCapacity) * 100))
    : 0;

  return {
    totalEvents,
    totalCapacity,
    totalRegistered,
    cappedEventsCount,
    fillRatePercent,
    categoryCounts,
    departmentCounts,
  };
}

export function adminErrorText(error) {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code;
  switch (code) {
    case 'EVENT_NOT_FOUND':
      return 'Event could not be found. Please verify the slug or identifier.';
    case 'EVENT_ALREADY_CANCELLED':
      return 'This event is already cancelled and cannot be modified.';
    case 'INVALID_STATUS_TRANSITION':
      return 'This event cannot transition to the requested status. Only pending events can be approved or rejected.';
    case 'REGISTRATION_NOT_FOUND':
      return 'Registration not found or already cancelled.';
    case 'EVENT_PAST_CANCELLATION':
      return 'Registration cannot be cancelled after the event has started.';
    case 'AUTH_REQUIRED':
    case 'AUTH_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    case 'FORBIDDEN':
      return 'You do not have administrative privileges to perform this operation.';
    case 'VALIDATION_ERROR':
      return error.message || 'The server rejected the provided input parameters.';
    default:
      return error.message || 'The campus server was unable to complete the request.';
  }
}

export function confirmApproveText(eventTitle) {
  return `Are you sure you want to approve "${eventTitle}"? Once approved, the event will become visible in the public portal for student registrations.`;
}

export function confirmRejectText(eventTitle) {
  return `Are you sure you want to reject "${eventTitle}"? This will move the submission to rejected status and prevent it from appearing in public discovery.`;
}

export function confirmCancelEventText(eventTitle) {
  return `Are you sure you want to cancel "${eventTitle}"? This will soft-cancel the event on the campus portal.`;
}

export function confirmCancelRegistrationText(studentName, eventTitle) {
  return `Are you sure you want to cancel the registration for ${studentName || 'this student'} in "${eventTitle}"?`;
}
