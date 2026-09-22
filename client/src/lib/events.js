export const categories = ['workshop', 'fest', 'competition', 'seminar', 'hackathon', 'sports', 'cultural', 'other'];
export const sorts = { startAt: 'Soonest first', '-startAt': 'Latest date', title: 'Title A–Z', '-title': 'Title Z–A', createdAt: 'Recently published', '-createdAt': 'Oldest published', popular: 'Most popular' };
export const titleCase = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
export function dateLabel(value, options = {}) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Date to be announced';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', ...options }).format(new Date(value));
}
// Same fallback contract as dateLabel: falsy or unparseable values never throw.
export function timeLabel(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Time to be announced';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
export const seats = (event) => event.capacity == null ? null : Math.max(0, event.capacity - (event.registeredCount || 0));
export function registrationState(event, now = Date.now()) {
  if (event.status !== 'approved') return 'Registration unavailable';
  if (new Date(event.registrationDeadline).getTime() <= now) return 'Registration closed';
  if (seats(event) === 0) return 'Event full';
  return null;
}
export function safeReturn(value) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/events';
}
export function discoveryParams(search) {
  const input = new URLSearchParams(search);
  const result = {};
  for (const key of ['search', 'category', 'club', 'department', 'venue', 'from', 'to', 'sort']) {
    const value = input.get(key)?.trim();
    if (value) result[key] = value;
  }
  result.page = String(Math.max(1, parseInt(input.get('page'), 10) || 1));
  result.limit = String(Math.min(50, Math.max(1, parseInt(input.get('limit'), 10) || 12)));
  return result;
}
