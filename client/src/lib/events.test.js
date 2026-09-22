import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, dateLabel, timeLabel, discoveryParams, registrationState, safeReturn, seats } from './events.js';

for (const value of ['//external.invalid', '/\\external.invalid', 'https://external.invalid', '', null]) {
  test(`unsafe return path falls back: ${value}`, () => assert.equal(safeReturn(value), '/events'));
}
test('event return path retains query and fragment', () => assert.equal(safeReturn('/events/react?source=home#register'), '/events/react?source=home#register'));
test('pagination is bounded', () => assert.deepEqual(discoveryParams('?page=-8&limit=999'), { page: '1', limit: '50' }));
test('empty pagination uses API defaults', () => assert.deepEqual(discoveryParams(''), { page: '1', limit: '12' }));
test('only supported discovery filters are forwarded', () => assert.deepEqual(discoveryParams('?search=react&club=coding-club&fake=true'), { search: 'react', club: 'coding-club', page: '1', limit: '12' }));
test('all eight backend categories are represented', () => assert.equal(new Set(categories).size, 8));
test('unlimited seats remain null', () => assert.equal(seats({ capacity: null, registeredCount: 25 }), null));
test('remaining seats never become negative', () => assert.equal(seats({ capacity: 2, registeredCount: 4 }), 0));
const event = { status: 'approved', capacity: 5, registeredCount: 1, registrationDeadline: '2030-01-01' };
test('available event enables registration', () => assert.equal(registrationState(event, 0), null));
test('deadline equality closes registration', () => assert.equal(registrationState(event, Date.parse(event.registrationDeadline)), 'Registration closed'));
test('full event prevents registration', () => assert.equal(registrationState({ ...event, registeredCount: 5 }, 0), 'Event full'));
test('unapproved event prevents registration', () => assert.equal(registrationState({ ...event, status: 'pending' }, 0), 'Registration unavailable'));
test('missing date gets explicit fallback', () => assert.equal(dateLabel(null), 'Date to be announced'));
test('ticket date has only the requested day', () => assert.equal(dateLabel('2030-01-22T12:00:00Z', { day: '2-digit', month: undefined, year: undefined }), '22'));
test('missing time gets explicit fallback', () => assert.equal(timeLabel(null), 'Time to be announced'));
test('invalid snapshot time falls back instead of throwing', () => {
  // Regression: a truthy unparseable snapshot date reached Intl and threw.
  assert.equal(timeLabel('not-a-date'), 'Time to be announced');
  assert.equal(timeLabel('2030-13-45'), 'Time to be announced');
  assert.doesNotThrow(() => timeLabel(undefined));
});
