import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { transform } from 'esbuild';
import {
  registrationTabs, registrationSorts, registrationEmptyCopy, registrationParams,
  registrationQueryParams, dateBucket, canCancel, attendanceLabel, statusLabel,
  cancellationMessage, paginateRegistrations, readRegistrationPage,
  scanRegistrationDates, findOwnRegistration, findEventRegistration, idOf, MAX_PAGE, recoverServerPage,
} from './registrations.js';

// Execute the real CTA callbacks with mocked hooks, without a browser or DOM.
// esbuild is already supplied by Vite; no additional test dependency is needed.
async function ctaHarness(cancelQueries = async () => {}) {
  const source = await readFile(new URL('../features/auth/RegistrationCTA.jsx', import.meta.url), 'utf8');
  const { code } = await transform(source, { loader: 'jsx', format: 'cjs', jsx: 'automatic' });
  const effects = [];
  const refs = [];
  const invalidations = [];
  const writes = [];
  let callbacks;
  let refreshes = 0;
  const queryClient = {
    invalidateQueries: async (options) => { invalidations.push(options); },
    cancelQueries,
    setQueryData: (...args) => writes.push(args),
  };
  const modules = {
    react: {
      useEffect: (effect) => effects.push(effect),
      useRef: (current) => { const ref = { current }; refs.push(ref); return ref; },
      useState: (initial) => [initial, () => {}],
    },
    'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
    'react-router-dom': { Link: () => null, useLocation: () => ({ pathname: '/events/test', search: '', hash: '' }) },
    '@tanstack/react-query': {
      useQueryClient: () => queryClient,
      useQuery: () => ({ isPending: true }),
      useMutation: (options) => { callbacks = options; return {}; },
    },
    '../../api/client': {},
    '../../lib/events': { registrationState: () => null, safeReturn: (path) => path },
    '../../lib/registrations': await import('./registrations.js'),
    '../student/useCancelRegistration': { default: () => ({}) },
    './AuthContext': { useAuth: () => ({ user: { id: 'owner', role: 'student' }, refresh: () => { refreshes++; } }) },
    '../../components/student/CancelRegistrationDialog': { default: () => null },
  };
  const module = { exports: {} };
  runInNewContext(code, { module, URLSearchParams, exports: module.exports, require: (name) => {
    assert.ok(name in modules, `Unexpected import ${name}`);
    return { __esModule: true, ...modules[name] };
  } });
  module.exports.default({ event: { _id: 'event', startAt: '2030-01-01' } });
  const cleanups = effects.map((effect) => effect());
  return {
    callbacks, invalidations, writes, refs,
    refreshes: () => refreshes,
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
}

test('late CTA success after unmount invalidates public data only', async () => {
  const harness = await ctaHarness();
  harness.unmount();
  await harness.callbacks.onSuccess({ _id: 'registration' }, { scope: 'owner:event' });
  harness.callbacks.onError({ status: 401 }, { scope: 'owner:event' });
  assert.equal(harness.writes.length, 0);
  assert.equal(harness.refreshes(), 0);
  assert.equal(harness.invalidations.length, 1);
  assert.equal(harness.invalidations[0].predicate({ queryKey: ['event'] }), true);
  assert.equal(harness.invalidations[0].predicate({ queryKey: ['own-registration'] }), false);
});
test('CTA checks mounted state again after awaiting cache cancellation', async () => {
  let release;
  const harness = await ctaHarness(() => new Promise((resolve) => { release = resolve; }));
  const pending = harness.callbacks.onSuccess({ _id: 'registration' }, { scope: 'owner:event' });
  harness.unmount();
  release();
  await pending;
  assert.equal(harness.writes.length, 0);
  assert.equal(harness.invalidations.length, 1);
});
test('mounted CTA accepts current scope and rejects previous account scope', async () => {
  const harness = await ctaHarness();
  await harness.callbacks.onSuccess({ _id: 'registration' }, { scope: 'previous:event' });
  assert.equal(harness.writes.length, 0);
  await harness.callbacks.onSuccess({ _id: 'registration' }, { scope: 'owner:event' });
  assert.equal(harness.writes.length, 1);
  assert.equal(harness.invalidations.at(-1).predicate({ queryKey: ['own-registration'] }), true);
  harness.unmount();
});

const NOW = new Date('2026-09-17T12:00:00Z').getTime();
const iso = (days, hour = 10) => {
  const date = new Date(NOW + days * 86_400_000);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};
const reg = (overrides = {}) => ({
  _id: 'r1', event: 'e1', status: 'registered',
  eventSnapshot: { title: 'Test Event', startAt: iso(3), venue: 'Main Hall', bannerUrl: null },
  registeredAt: iso(-2), cancelledAt: null, attendedAt: null,
  ...overrides,
});

test('active registration outranks newer cancelled history across pages', async () => {
  const calls = [];
  const request = async (params) => {
    calls.push(params);
    return { data: [reg({ _id: String(params.page), status: params.page === 1 ? 'cancelled' : 'registered' })], meta: { page: params.page, totalPages: 2 } };
  };
  assert.equal((await findEventRegistration(request, 'e1')).status, 'registered');
  assert.equal(calls.length, 2);
  assert.ok(calls.every((params) => !('student' in params) && !('studentId' in params)));
});
test('event lookup returns latest history only after exhausting pages', async () => {
  const request = async () => ({ data: [reg({ status: 'cancelled' })], meta: { page: 1, totalPages: 1 } });
  assert.equal((await findEventRegistration(request, 'e1')).status, 'cancelled');
  assert.equal(await findEventRegistration(request, 'unrelated'), null);
});
test('capped event lookup cannot enable registration', async () => {
  const request = async () => ({ data: [reg({ status: 'cancelled' })], meta: { page: 1, totalPages: 2 } });
  await assert.rejects(findEventRegistration(request, 'e1', undefined, 1), /completely/);
});
test('scan rejects a repeated server page rather than double counting', async () => {
  const request = async () => ({ data: [reg()], meta: { page: 1, totalPages: 2 } });
  await assert.rejects(scanRegistrationDates(request, 'upcoming', undefined, NOW), /out of order/);
});
test('cancellation is allowed until start regardless of deadline or full capacity', () => {
  assert.equal(canCancel({ ...reg(), capacity: 1, registeredCount: 1, registrationDeadline: iso(-1) }, NOW), true);
  assert.equal(canCancel(reg(), NOW, new Date(NOW).toISOString()), false);
});

test('tab keys cover the four spec tabs', () => {
  assert.deepEqual(Object.keys(registrationTabs), ['upcoming', 'past', 'cancelled', 'all']);
});
test('sorts expose only backend-supported values', () => {
  assert.deepEqual(Object.keys(registrationSorts), ['newest', 'upcoming', 'past']);
});
test('each tab has truthful empty copy', () => {
  for (const tab of Object.keys(registrationTabs)) assert.equal(typeof registrationEmptyCopy[tab], 'string');
});
test('tab param falls back to upcoming on junk', () => {
  assert.equal(registrationParams('?tab=bogus').tab, 'upcoming');
  assert.equal(registrationParams('').tab, 'upcoming');
});
test('tab param accepts every supported tab', () => {
  for (const tab of Object.keys(registrationTabs)) assert.equal(registrationParams(`?tab=${tab}`).tab, tab);
});
test('sort param falls back to newest on junk', () => {
  assert.equal(registrationParams('?sort=weird').sort, 'newest');
});
test('page clamps to at least 1', () => {
  assert.equal(registrationParams('?page=0').page, 1);
  assert.equal(registrationParams('?page=-4').page, 1);
  assert.equal(registrationParams('?page=abc').page, 1);
});
test('page stays finite for oversized URL integers', () => {
  for (const value of ['9'.repeat(400), '10001', String(Number.MAX_SAFE_INTEGER)]) {
    assert.equal(registrationParams(`?page=${value}`).page, MAX_PAGE);
  }
  assert.equal(registrationParams('?page=42').page, 42);
});

for (const tab of ['all', 'cancelled']) {
  test(`${tab} recovers out-of-range server page with rows and accurate metadata`, async () => {
    const calls = [];
    const signal = new AbortController().signal;
    const params = registrationParams(`?tab=${tab}&page=9&sort=past&limit=12`);
    const request = async (query, receivedSignal) => {
      assert.equal(receivedSignal, signal);
      calls.push(query);
      return { data: query.page === 2 ? [reg()] : [], meta: { page: query.page, totalPages: 2, total: 13, limit: 12 } };
    };
    const body = await recoverServerPage(request, params, signal);
    assert.equal(body.data.length, 1);
    assert.equal(body.meta.page, 2);
    assert.equal(body.meta.totalPages, 2);
    assert.deepEqual(calls, [9, 2].map((page) => ({ status: tab, sort: 'past', page, limit: 12 })));
  });
}
test('server page recovery preserves genuine empty history and valid pages', async () => {
  for (const data of [[], [reg()]]) {
    let calls = 0;
    const body = { data, meta: { page: 1, totalPages: 1, total: data.length } };
    assert.equal(await recoverServerPage(async () => { calls++; return body; }, registrationParams('?tab=all')), body);
    assert.equal(calls, 1);
  }
});
test('server page recovery rejects a second shrink instead of false emptiness', async () => {
  let calls = 0;
  await assert.rejects(recoverServerPage(async ({ page }) => {
    calls++;
    return { data: [], meta: { page, totalPages: calls === 1 ? 2 : 1, total: 1 } };
  }, registrationParams('?tab=all&page=9')), /changed while loading/);
  assert.equal(calls, 2);
});
test('server page recovery propagates errors and validates recovered responses', async () => {
  for (const failure of [new Error('offline'), { data: [], meta: { page: 2, totalPages: 1 } }]) {
    let calls = 0;
    await assert.rejects(recoverServerPage(async ({ page }) => {
      if (++calls === 1) return { data: [], meta: { page, totalPages: 1 } };
      if (failure instanceof Error) throw failure;
      return failure;
    }, registrationParams('?tab=all&page=9')));
  }
});

test('limit clamps into 1..50 with default 12', () => {
  assert.equal(registrationParams('').limit, 12);
  assert.equal(registrationParams('?limit=99').limit, 50);
  assert.equal(registrationParams('?limit=0').limit, 12);
  assert.equal(registrationParams('?limit=junk').limit, 12);
});
test('upcoming tab queries registered status with past sort (scan toward today)', () => {
  const params = registrationQueryParams({ tab: 'upcoming' });
  assert.deepEqual(params, { status: 'registered', sort: 'past', page: 1, limit: 50 });
});
test('past tab queries registered status with upcoming sort', () => {
  const params = registrationQueryParams({ tab: 'past' });
  assert.deepEqual(params, { status: 'registered', sort: 'upcoming', page: 1, limit: 50 });
});
test('cancelled tab maps to cancelled status with chosen sort', () => {
  assert.deepEqual(registrationQueryParams({ tab: 'cancelled', sort: 'past', page: 2, limit: 10 }),
    { status: 'cancelled', sort: 'past', page: 2, limit: 10 });
});
test('all tab maps to all status', () => {
  assert.equal(registrationQueryParams({ tab: 'all', sort: 'newest', page: 1, limit: 12 }).status, 'all');
});
test('dateBucket splits around now and flags unknown dates', () => {
  assert.equal(dateBucket(reg(), NOW), 'upcoming');
  assert.equal(dateBucket(reg({ eventSnapshot: { startAt: iso(-3) } }), NOW), 'past');
  assert.equal(dateBucket(reg({ eventSnapshot: { startAt: NOW + 1 } }), NOW), 'upcoming');
  assert.equal(dateBucket(reg({ eventSnapshot: { startAt: undefined } }), NOW), 'unknown');
});
test('cancel eligibility requires registered status and a future start', () => {
  assert.equal(canCancel(reg(), NOW), true);
  assert.equal(canCancel(reg({ status: 'cancelled' }), NOW), false);
  assert.equal(canCancel(reg({ eventSnapshot: { startAt: iso(-1) } }), NOW), false);
  assert.equal(canCancel(reg({ eventSnapshot: { startAt: iso(1) } }), NOW), true);
  assert.equal(canCancel({ status: 'registered', eventSnapshot: {} }, NOW), false);
  // A fresh event startAt (e.g. re-fetched detail) wins over the snapshot copy.
  assert.equal(canCancel(reg({ eventSnapshot: { startAt: iso(-1) } }), NOW, iso(2)), true);
});
test('attendance is only claimed when the backend recorded it', () => {
  assert.equal(attendanceLabel(reg({ attendedAt: iso(3) })), 'Attended');
  assert.equal(attendanceLabel(reg()), 'Attendance not recorded');
  assert.equal(attendanceLabel(reg({ attendedAt: null })), 'Attendance not recorded');
});
test('status labels cover every model enum value', () => {
  assert.equal(statusLabel('registered'), 'Registered');
  assert.equal(statusLabel('cancelled'), 'Cancelled');
  assert.equal(statusLabel('waitlisted'), 'Waitlisted');
  assert.equal(statusLabel('mystery'), 'Status unavailable');
});
for (const [code, hint] of [
  ['REGISTRATION_NOT_FOUND', 'no longer available'],
  ['REGISTRATION_NOT_OWNER', 'your own'],
  ['REGISTRATION_ALREADY_CANCELLED', 'already been cancelled'],
  ['CANNOT_CANCEL_AFTER_START', 'event has started'],
  ['REGISTRATION_STATE_CONFLICT', 'Nothing was changed'],
  ['AUTH_REQUIRED', 'log in'],
  ['AUTH_EXPIRED', 'session expired'],
  ['AUTH_INVALID', 'no longer valid'],
  ['ACCOUNT_DISABLED', 'inactive'],
]) {
  test(`cancellation error ${code} maps to a human message`, () => {
    const message = cancellationMessage({ code, status: 409 });
    assert.ok(!/Mongo|E11000|transaction|session with/i.test(message), message);
    assert.ok(message.includes(hint), message);
  });
}
test('unknown cancellation codes fall back generically', () => {
  assert.match(cancellationMessage({ code: 'SOMETHING_ELSE' }), /Could not cancel/);
  assert.match(cancellationMessage({ status: 401 }), /session expired/i);
  assert.match(cancellationMessage(null), /Could not cancel/);
});
test('client pagination clamps and slices correctly', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);
  const page1 = paginateRegistrations(items, 1, 10);
  assert.deepEqual(page1.meta, { page: 1, limit: 10, total: 25, totalPages: 3 });
  assert.equal(page1.data.length, 10);
  const page3 = paginateRegistrations(items, 3, 10);
  assert.equal(page3.data.length, 5);
  const overflow = paginateRegistrations(items, 9, 10);
  assert.equal(overflow.meta.page, 3);
  assert.equal(overflow.data.length, 5);
  const empty = paginateRegistrations([], 1, 10);
  assert.deepEqual(empty.meta, { page: 1, limit: 10, total: 0, totalPages: 1 });
  assert.equal(empty.data.length, 0);
});
test('readRegistrationPage rejects malformed list envelopes', () => {
  assert.throws(() => readRegistrationPage(null));
  assert.throws(() => readRegistrationPage({ data: 'nope', meta: { page: 1, totalPages: 1 } }));
  assert.throws(() => readRegistrationPage({ data: [], meta: { page: 1, totalPages: 0 } }));
  assert.throws(() => readRegistrationPage({ data: [], meta: { page: 1, totalPages: 3 } }));
  assert.doesNotThrow(() => readRegistrationPage({ data: [], meta: { page: 1, totalPages: 1 } }));
  assert.doesNotThrow(() => readRegistrationPage({ data: [reg()], meta: { page: 2, totalPages: 3 } }));
});
test('idOf handles raw ids, documents, and nulls', () => {
  assert.equal(idOf('abc'), 'abc');
  assert.equal(idOf({ _id: 'doc1' }), 'doc1');
  assert.equal(idOf({ id: 'doc2' }), 'doc2');
  assert.equal(idOf(null), '');
});

function listResponder(pages) {
  const calls = [];
  const request = async (params) => { calls.push(params); return pages[Math.min(params.page, pages.length) - 1]; };
  return { request, calls };
}

test('upcoming scan returns future registrations in ascending order and completes early', async () => {
  const pages = [
    { data: [reg({ _id: 'f2', eventSnapshot: { title: 'Far', startAt: iso(20) } }), reg({ _id: 'f1', eventSnapshot: { title: 'Near', startAt: iso(2) } })], meta: { page: 1, limit: 50, total: 3, totalPages: 2 } },
    { data: [reg({ _id: 'p1', eventSnapshot: { title: 'Old', startAt: iso(-5) } })], meta: { page: 2, limit: 50, total: 3, totalPages: 2 } },
  ];
  const { request, calls } = listResponder(pages);
  const result = await scanRegistrationDates(request, 'upcoming', undefined, NOW);
  assert.deepEqual(result.items.map((r) => r._id), ['f1', 'f2']);
  assert.equal(result.complete, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].status, 'registered');
});
test('upcoming scan stops at the first past item (ordered prefix)', async () => {
  // Backend 'upcoming' sort is nearest-date-first, so iso(4) precedes iso(10) and iso(-2).
  const pages = [{ data: [reg({ _id: 'f2', eventSnapshot: { startAt: iso(4) } }), reg({ _id: 'f1', eventSnapshot: { startAt: iso(10) } }), reg({ _id: 'old', eventSnapshot: { startAt: iso(-2) } })], meta: { page: 1, limit: 50, total: 3, totalPages: 1 } }];
  const { request, calls } = listResponder(pages);
  const result = await scanRegistrationDates(request, 'upcoming', undefined, NOW);
  assert.deepEqual(result.items.map((r) => r._id), ['f2', 'f1']);
  assert.equal(result.complete, true);
  assert.equal(calls.length, 1);
});
test('past scan returns latest events first using ascending backend sort', async () => {
  const pages = [{ data: [reg({ _id: 'older', eventSnapshot: { startAt: iso(-30) } }), reg({ _id: 'newer', eventSnapshot: { startAt: iso(-2) } })], meta: { page: 1, limit: 50, total: 2, totalPages: 1 } }];
  const result = await scanRegistrationDates(listResponder(pages).request, 'past', undefined, NOW);
  assert.deepEqual(result.items.map((r) => r._id), ['newer', 'older']);
});
test('scan is honest when the result is truncated by the page cap', async () => {
  const data = Array.from({ length: 50 }, (_, i) => reg({ _id: `u${i}`, eventSnapshot: { startAt: iso(100 + i) } }));
  const pages = Array.from({ length: 3 }, (_, i) => ({ data, meta: { page: i + 1, limit: 50, total: 500, totalPages: 10 } }));
  const { request } = listResponder(pages);
  // The cap (3 pages) is reached while totalPages is still 10 → incomplete, clearly reported.
  const result = await scanRegistrationDates(request, 'upcoming', undefined, NOW, 3);
  assert.equal(result.items.length, 150);
  assert.equal(result.complete, false);
});
test('scan flags unknown dates instead of misclassifying them', async () => {
  const pages = [{ data: [reg({ _id: 'mystery', eventSnapshot: { startAt: undefined } })], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } }];
  const result = await scanRegistrationDates(listResponder(pages).request, 'upcoming', undefined, NOW);
  assert.equal(result.items.length, 0);
  assert.equal(result.unknownDates, true);
  assert.equal(result.complete, true);
});
test('cancelled/all scans are unnecessary and remain so', async () => {
  // Only upcoming/past tabs use scans; the mapping keeps server pagination for others.
  assert.equal(registrationQueryParams({ tab: 'cancelled', page: 3, limit: 12 }).page, 3);
  assert.equal(registrationQueryParams({ tab: 'all', page: 3, limit: 12 }).page, 3);
});
test('findOwnRegistration locates a registration by id', async () => {
  const pages = [
    { data: [reg({ _id: 'a' }), reg({ _id: 'b' })], meta: { page: 1, limit: 50, total: 3, totalPages: 2 } },
    { data: [reg({ _id: 'c' })], meta: { page: 2, limit: 50, total: 3, totalPages: 2 } },
  ];
  const { request, calls } = listResponder(pages);
  const found = await findOwnRegistration(request, 'c', undefined);
  assert.equal(found.registration._id, 'c');
  assert.equal(found.complete, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].status, 'all');
});
test('findOwnRegistration reports not-found only after exhausting the list', async () => {
  const pages = [{ data: [reg({ _id: 'a' })], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } }];
  const found = await findOwnRegistration(listResponder(pages).request, 'missing', undefined);
  assert.equal(found.registration, null);
  assert.equal(found.complete, true);
});
test('findOwnRegistration reports an incomplete scan distinctly', async () => {
  const data = Array.from({ length: 50 }, (_, i) => reg({ _id: `x${i}` }));
  const pages = Array.from({ length: 2 }, (_, i) => ({ data, meta: { page: i + 1, limit: 50, total: 400, totalPages: 8 } }));
  const { request } = listResponder(pages);
  // Cap (2) hit while totalPages is 8 → not-found must not claim a verified absence.
  const found = await findOwnRegistration(request, 'zzz', undefined, 2);
  assert.equal(found.registration, null);
  assert.equal(found.complete, false);
});
test('findOwnRegistration ignores object-shaped event ids via idOf', async () => {
  const pages = [{ data: [reg({ _id: { toString: () => 'obj' } })], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } }];
  const found = await findOwnRegistration(listResponder(pages).request, 'obj', undefined);
  assert.ok(found.registration);
});
