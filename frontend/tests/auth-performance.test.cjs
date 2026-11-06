/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript harness, same as the existing adapter tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, globals = {}, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, ...globals, require: name => {
    if (!(name in dependencies)) throw Error(name);
    return dependencies[name];
  } });
  return exports;
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

// Exercise provider callbacks with persistent hook state, without a browser or database writes.
function provider(authRequest) {
  const slots = []; let cursor = 0;
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState: initial => { const slot = cursor++; if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }]; },
    useRef: initial => { const slot = cursor++; return slots[slot] ||= { current: initial }; },
    useCallback: callback => callback,
    useEffect: () => {},
  };
  const { AuthProvider } = load('src/components/auth/AuthProvider.tsx', {}, {
    react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) }, '@/lib/auth': { authRequest },
  });
  return () => { cursor = 0; return AuthProvider({ children: null }).props.value; };
}

test('focus/poll refreshes share one pending session request', async () => {
  const reply = deferred(); let calls = 0;
  const render = provider(() => { calls++; return reply.promise; });
  const value = render();
  const first = value.refresh(); const second = value.refresh();
  assert.equal(first, second); assert.equal(calls, 1);
  reply.resolve(null); await first;
  assert.equal(render().loading, false);
});

test('a pending session response cannot restore a user after logout', async () => {
  const reply = deferred();
  const render = provider(path => path === 'me' ? reply.promise : Promise.resolve({}));
  const value = render(); const pending = value.refresh();
  await value.logout(); reply.resolve({ user: { id: 'old-user' } }); await pending;
  assert.equal(render().session, null);
});

test('post-login refresh ignores an older anonymous response', async () => {
  const old = deferred(); const fresh = deferred(); let calls = 0;
  const render = provider(() => (++calls === 1 ? old.promise : fresh.promise));
  const value = render(); const beforeLogin = value.refresh(); const afterLogin = value.refresh(true);
  fresh.resolve({ user: { id: 'current-user' } }); await afterLogin;
  old.resolve(null); await beforeLogin;
  assert.equal(render().session.user.id, 'current-user');
});

test('auth requests stop on the deadline instead of leaving the Header loading forever', async () => {
  const controller = new AbortController();
  const auth = load('src/lib/auth.ts', {
    AbortSignal: { timeout: ms => { assert.equal(ms, 12000); return controller.signal; } },
    fetch: (url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
    }),
  });
  const pending = auth.authRequest('me'); controller.abort(new Error('deadline'));
  await assert.rejects(pending, /deadline/);
});

test('CSRF and login share a deadline and preserve the CSRF header', async () => {
  const signal = new AbortController().signal; const requests = [];
  const auth = load('src/lib/auth.ts', {
    AbortSignal: { timeout: () => signal },
    fetch: async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ token: 'test-csrf' }) }; },
  });
  await auth.authRequest('login', { email: 'test@example.invalid' });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.signal, signal);
  assert.equal(requests[1].options.signal, signal);
  assert.equal(requests[1].options.headers['X-CSRF-Token'], 'test-csrf');
  assert.equal(requests[1].options.credentials, 'same-origin');
});

test('body read timeouts are not mistaken for a successful empty response', async () => {
  const controller = new AbortController();
  const auth = load('src/lib/auth.ts', {
    AbortSignal: { timeout: () => controller.signal },
    fetch: async () => ({ ok: true, json: async () => { controller.abort(); throw Error('body timeout'); } }),
  });
  await assert.rejects(auth.authRequest('me'), /body timeout/);
});
