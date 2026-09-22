import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { canCancel } from './registrations.js';

const require = createRequire(import.meta.url);
const student = { id: 'student-render-test', role: 'student', isActive: true };
const componentUrl = (name) => fileURLToPath(new URL(`../components/student/${name}.jsx`, import.meta.url));

// Compile the real JSX using the existing Vite dependency. No browser or DOM
// simulator: these checks cover markup and render branches, not mouse events.
async function loadComponent(name) {
  const result = await build({
    entryPoints: [componentUrl(name)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
    logLevel: 'silent',
    plugins: [{ name: 'render-auth', setup(builder) {
      builder.onResolve({ filter: /AuthContext$/ }, () => ({ path: 'auth', namespace: 'render-auth' }));
      builder.onLoad({ filter: /.*/, namespace: 'render-auth' }, () => ({ contents: `export const useAuth = () => ({ user: ${JSON.stringify(student)} });`, loader: 'js' }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
const { RegistrationCard, RegistrationStatus, RegistrationTabs } = await loadComponent('RegistrationCard');
const { default: CancelRegistrationDialog } = await loadComponent('CancelRegistrationDialog');
const render = (component, props) => renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(component, props)));
const row = (overrides = {}) => ({
  _id: 'registration-render-test', status: 'registered',
  registeredAt: '2026-01-01T10:00:00Z',
  eventSnapshot: { title: 'Campus workshop', startAt: '2099-01-01T10:00:00Z', venue: 'Main Hall' },
  ...overrides,
});

test('real card renders an eligible cancellation button outside every link', () => {
  const registration = row();
  assert.equal(canCancel(registration), true);
  let calls = 0;
  const html = render(RegistrationCard, { registration, onCancel: () => calls++ });
  assert.match(html, /<button[^>]*>Cancel registration<\/button>/);
  for (const link of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)) assert.doesNotMatch(link[0], /<button/);
  assert.equal(calls, 0, 'rendering never submits or opens cancellation automatically');
});
for (const status of ['cancelled', 'waitlisted']) {
  test(`real ${status} card renders truthful status with no cancellation action`, () => {
    const registration = row({ status });
    assert.equal(canCancel(registration), false);
    const html = render(RegistrationCard, { registration, onCancel: () => {} });
    assert.match(html, new RegExp(`reg-status-${status}`));
    assert.doesNotMatch(html, /<button/);
    assert.match(html, /View registration/);
  });
}
test('started-event card has no cancellation action and does not invent attendance', () => {
  const registration = row({ eventSnapshot: { title: 'Past event', startAt: '2000-01-01T10:00:00Z' } });
  assert.equal(canCancel(registration), false);
  const html = render(RegistrationCard, { registration, onCancel: () => {} });
  assert.doesNotMatch(html, /<button/);
  assert.match(html, /Attendance not recorded/);
});
test('pending card disables cancellation without removing the registration', () => {
  const html = render(RegistrationCard, { registration: row(), onCancel: () => {}, cancelPending: true });
  assert.match(html, /<button[^>]*disabled=""[^>]*>Cancelling…/);
  assert.match(html, /Campus workshop/);
});
test('card safely handles missing snapshot and invalid dates', () => {
  const missing = render(RegistrationCard, { registration: row({ eventSnapshot: undefined }) });
  assert.match(missing, /Event title unavailable/);
  const invalid = render(RegistrationCard, { registration: row({ eventSnapshot: { title: 'Undated', startAt: 'invalid' } }) });
  assert.match(invalid, /Time to be announced/);
});
test('confirmation renders the real nested registration title and explicit choices', () => {
  let calls = 0;
  const html = render(CancelRegistrationDialog, { registration: { registration: row(), onConfirm: () => calls++ }, onClose: () => {} });
  assert.match(html, /Cancel your registration for <strong>Campus workshop<\/strong>\?/);
  assert.match(html, /Yes, cancel it/);
  assert.match(html, /Keep my spot/);
  assert.match(html, /<dialog[^>]*aria-describedby=/);
  assert.equal(calls, 0);
});
test('confirmation escapes event titles and does not render when closed', () => {
  const registration = row({ eventSnapshot: { title: '<b>Campus</b>' } });
  const html = render(CancelRegistrationDialog, { registration: { registration, onConfirm: () => {} }, onClose: () => {} });
  assert.match(html, /&lt;b&gt;Campus&lt;\/b&gt;/);
  assert.equal(render(CancelRegistrationDialog, { registration: null }), '');
});
test('all four filter tabs render and only the selected tab is selected', () => {
  const html = render(RegistrationTabs, { tabs: [['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled'], ['all', 'All']], active: 'cancelled', onSelect: () => {} });
  assert.equal((html.match(/role="tab"/g) || []).length, 4);
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.match(html, /aria-selected="true"[^>]*>Cancelled/);
});
test('unknown registration status is not relabelled as registered', () => {
  assert.match(render(RegistrationStatus, { status: 'unknown' }), /Status unavailable/);
});
