export const registrationTabs = { upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled', all: 'All' };
export const registrationSorts = { newest: 'Recently registered', upcoming: 'Event date: oldest first', past: 'Event date: newest first' };
export const registrationEmptyCopy = {
  upcoming: "You don't have any upcoming events.", past: 'No past events yet.',
  cancelled: 'No cancelled registrations.', all: 'No registrations yet.',
};
export const privateRegistrationQuery = (query) => ['own-registration', 'own-registrations', 'my-registrations', 'registrations'].includes(query.queryKey[0]);
export const publicEventQuery = (query) => ['event', 'events', 'event-detail'].includes(query.queryKey[0]);
export const idOf = (value) => String(value && typeof value === 'object' ? value._id || value.id || '' : value || '');
export const SCAN_PAGE_LIMIT = 10;
// Far below any real history, but keeps ?page=…(hundreds of digits) finite.
export const MAX_PAGE = 10_000;

export function registrationParams(search) {
  const input = new URLSearchParams(search);
  const tab = Object.hasOwn(registrationTabs, input.get('tab')) ? input.get('tab') : 'upcoming';
  const sort = Object.hasOwn(registrationSorts, input.get('sort')) ? input.get('sort') : 'newest';
  // parseInt overflows to Infinity on huge inputs; clamp to a finite range.
  const page = Math.min(MAX_PAGE, Math.max(1, parseInt(input.get('page'), 10) || 1));
  const limit = Math.min(50, Math.max(1, parseInt(input.get('limit'), 10) || 12));
  return { tab, sort, page, limit };
}

export function registrationQueryParams({ tab, sort, page, limit }) {
  if (tab === 'upcoming' || tab === 'past') {
    // Reverse the scan: matching dates form a prefix, so crossing today ends it.
    return { status: 'registered', sort: tab === 'upcoming' ? 'past' : 'upcoming', page: 1, limit: 50 };
  }
  return { status: tab === 'cancelled' ? 'cancelled' : 'all', sort, page, limit };
}

export function dateBucket(registration, now = Date.now()) {
  const value = registration.eventSnapshot?.startAt;
  const time = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(time)) return 'unknown';
  return time > now ? 'upcoming' : 'past';
}

export function canCancel(registration, now = Date.now(), currentStartAt) {
  const start = currentStartAt ?? registration?.eventSnapshot?.startAt;
  return registration?.status === 'registered' && Boolean(start) && new Date(start).getTime() > now;
}

export const attendanceLabel = (registration) => registration.attendedAt ? 'Attended' : 'Attendance not recorded';
export const statusLabel = (status) => ({ registered: 'Registered', cancelled: 'Cancelled', waitlisted: 'Waitlisted' })[status] || 'Status unavailable';

const cancellationMessages = {
  REGISTRATION_NOT_FOUND: 'This registration is no longer available.',
  REGISTRATION_NOT_OWNER: 'You can only cancel your own registrations.',
  REGISTRATION_ALREADY_CANCELLED: 'This registration has already been cancelled.',
  CANNOT_CANCEL_AFTER_START: 'Registration can no longer be cancelled because this event has started.',
  REGISTRATION_STATE_CONFLICT: 'The server could not safely cancel this registration. Nothing was changed. Please try again or contact campus support.',
  AUTH_REQUIRED: 'Please log in again to manage your registrations.',
  AUTH_EXPIRED: 'Your session expired. Please log in again.',
  AUTH_INVALID: 'Your session is no longer valid. Please log in again.',
  ACCOUNT_DISABLED: 'This account is inactive. Please contact campus support.',
};
export function cancellationMessage(error) {
  return cancellationMessages[error?.code] || (error?.status === 401 ? cancellationMessages.AUTH_EXPIRED : 'Could not cancel your registration. Please try again.');
}

export function paginateRegistrations(items, page, limit) {
  const totalPages = Math.max(1, Math.ceil(items.length / limit));
  const current = Math.min(page, totalPages);
  return { data: items.slice((current - 1) * limit, current * limit), meta: { page: current, limit, total: items.length, totalPages } };
}

export function readRegistrationPage(body, expectedPage) {
  if (!Array.isArray(body?.data) || !Number.isInteger(body.meta?.totalPages) || body.meta.totalPages < 1 || !Number.isInteger(body.meta.page) || body.meta.page < 1) {
    throw new Error('The server returned an incomplete registration list. Please try again.');
  }
  if (Number.isInteger(expectedPage) && body.meta.page !== expectedPage) throw new Error('The registration list fell out of order. Please try again.');
  if (!body.data.length && body.meta.page < body.meta.totalPages) throw new Error('The registration list is incomplete. Please try again.');
  return body;
}

// The server serves an empty body for an out-of-range page (no clamping), so
// refetch its last real page; the list must not claim an empty history.
export async function recoverServerPage(request, params, signal) {
  const base = registrationQueryParams(params);
  let body = readRegistrationPage(await request(base, signal), params.page);
  if (body.meta.page > body.meta.totalPages) {
    const page = body.meta.totalPages;
    body = readRegistrationPage(await request({ ...base, page }, signal), page);
  }
  // A second concurrent shrink or inconsistent empty response is an error,
  // not an empty history. Recovery is bounded to one additional request.
  if (body.meta.page > body.meta.totalPages || (!body.data.length && body.meta.total > 0)) {
    throw new Error('Your registration list changed while loading. Please try again.');
  }
  return body;
}

// Fetch only an ordered prefix, capped at 500 rows; never invent a filtered total.
export async function scanRegistrationDates(request, tab, signal, now = Date.now(), maxPages = SCAN_PAGE_LIMIT) {
  const params = registrationQueryParams({ tab });
  const matches = [];
  let complete = false;
  let unknownDates = false;
  for (let page = 1; page <= maxPages; page += 1) {
    const body = readRegistrationPage(await request({ ...params, page }, signal), page);
    let crossedBoundary = false;
    for (const item of body.data) {
      const bucket = dateBucket(item, now);
      if (bucket === 'unknown') unknownDates = true;
      else if (bucket === tab && item.status === 'registered') matches.push(item);
      else if (bucket !== tab) crossedBoundary = true;
    }
    if (crossedBoundary || page >= body.meta.totalPages) { complete = true; break; }
  }
  matches.sort((a, b) => (new Date(a.eventSnapshot.startAt) - new Date(b.eventSnapshot.startAt)) * (tab === 'past' ? -1 : 1));
  return { items: matches, complete, unknownDates };
}

// An active registration outranks newer historical rows for the same event.
// Capped lookups throw rather than enabling a contradictory Register action.
export async function findEventRegistration(request, eventId, signal, maxPages = SCAN_PAGE_LIMIT) {
  let history = null;
  for (let page = 1; page <= maxPages; page += 1) {
    const body = readRegistrationPage(await request({ status: 'all', sort: 'newest', limit: 50, page }, signal), page);
    for (const item of body.data) {
      if (idOf(item.event) !== eventId) continue;
      if (item.status === 'registered') return item;
      if (!history) history = item;
    }
    if (page >= body.meta.totalPages) return history;
  }
  throw new Error('Your registration history could not be checked completely. Open My Events to review it.');
}

export async function findOwnRegistration(request, registrationId, signal, maxPages = SCAN_PAGE_LIMIT) {
  for (let page = 1; page <= maxPages; page += 1) {
    const body = readRegistrationPage(await request({ status: 'all', sort: 'newest', limit: 50, page }, signal), page);
    const registration = body.data.find((item) => idOf(item) === registrationId);
    if (registration) return { registration, complete: true };
    if (page >= body.meta.totalPages) return { registration: null, complete: true };
  }
  return { registration: null, complete: false };
}
