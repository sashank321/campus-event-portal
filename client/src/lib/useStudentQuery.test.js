import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const hookUrl = fileURLToPath(new URL('../features/student/useStudentQuery.js', import.meta.url));

// Render the real hook inside a probe component. useQuery and useAuth are
// replaced, so the assertions cover the hook's own options and output only.
async function loadHook() {
  const result = await build({
    entryPoints: [hookUrl], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
    logLevel: 'silent',
    plugins: [{ name: 'hook-mocks', setup(builder) {
      builder.onResolve({ filter: /AuthContext$/ }, () => ({ path: 'auth', namespace: 'hook-mocks' }));
      builder.onLoad({ filter: /^auth$/, namespace: 'hook-mocks' }, () => ({ contents: 'export const useAuth = () => globalThis.__phase7Auth;', loader: 'js' }));
      builder.onResolve({ filter: /^@tanstack\/react-query$/ }, () => ({ path: 'rq', namespace: 'hook-mocks' }));
      builder.onLoad({ filter: /^rq$/, namespace: 'hook-mocks' }, () => ({ contents: 'export const useQuery = (options) => globalThis.__phase7Query(options);', loader: 'js' }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports.default;
}

// Renders the hook once and captures both the options it passed to useQuery
// and the value it returned for the given fake query/auth state.
async function runHook({ user = { id: 'u1' }, loading = false, mock = {}, queryOptions }) {
  const useStudentQuery = await loadHook();
  let captured = null;
  let returned = null;
  globalThis.__phase7Query = (options) => { captured = options; return { data: 'PRIVATE', isPending: false, isError: false, error: null, ...mock }; };
  globalThis.__phase7Auth = { user, loading, refresh: () => {} };
  const Probe = () => { returned = useStudentQuery(queryOptions ?? { queryKey: ['own-registrations', 'list'] }); return null; };
  renderToStaticMarkup(React.createElement(Probe));
  delete globalThis.__phase7Query;
  delete globalThis.__phase7Auth;
  return { captured, returned };
}

const errorOf = (status, code) => Object.assign(new Error('x'), { status, code });

test('query is user-scoped, auth-gated, and marked authScoped', async () => {
  const { captured } = await runHook({ queryOptions: { queryKey: ['own-registrations', 'list', 'all'] } });
  assert.deepEqual(captured.queryKey, ['own-registrations', 'u1', 'list', 'all']);
  assert.equal(captured.meta.authScoped, true);
});

test('401 hides private data and reports an error without retrying', async () => {
  const error = errorOf(401, 'AUTH_EXPIRED');
  const { captured, returned } = await runHook({ mock: { error, isError: true } });
  assert.equal(captured.retry(0, error), false);
  assert.equal(returned.data, undefined);
  assert.equal(returned.isError, true);
  assert.equal(returned.isPending, false);
});

test('ACCOUNT_DISABLED hides private data and never retries', async () => {
  const error = errorOf(403, 'ACCOUNT_DISABLED');
  const { captured, returned } = await runHook({ mock: { error, isError: true } });
  assert.equal(captured.retry(0, error), false, 'disabled accounts must not be retried');
  assert.equal(returned.data, undefined, 'cached registrations must not stay visible');
  assert.equal(returned.isError, true, 'disabled state must surface as an error, not a spinner');
});

test('other errors keep the single retry and normal error surface', async () => {
  const serverError = errorOf(500);
  const { captured } = await runHook({ mock: { error: serverError, isError: true } });
  assert.equal(captured.retry(0, serverError), true);
  assert.equal(captured.retry(1, serverError), false);
});

test('signed-out or loading sessions hide data as pending, not error', async () => {
  for (const state of [{ user: null }, { loading: true }]) {
    const { returned } = await runHook({ ...state, mock: {} });
    assert.equal(returned.data, undefined);
    assert.equal(returned.isPending, true);
    assert.equal(returned.isError, false);
  }
});

test('healthy signed-in session exposes data', async () => {
  const { returned } = await runHook({ mock: {} });
  assert.equal(returned.data, 'PRIVATE');
  assert.equal(returned.isError, false);
});

test('disabled student account hides private data', async () => {
  const { returned } = await runHook({ user: { id: 'u1', isActive: false }, mock: {} });
  assert.equal(returned.data, undefined);
});
