/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

const REQUEST_TIMEOUT_MS = 12000;

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

/** api-client with a controllable deadline signal and a fake fetch. */
function client(fetch, deadline = new AbortController()) {
  const AbortSignal = { timeout: ms => { assert.equal(ms, REQUEST_TIMEOUT_MS); return deadline.signal; } };
  return loadTs('src/lib/api-client.ts', {}, { fetch, AbortSignal });
}

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

test('requests stop at the deadline instead of leaving the page loading forever', async () => {
  const deadline = new AbortController();
  const api = client((url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
  }), deadline);
  const pending = api.apiGet('/api/auth/me');
  deadline.abort(new Error('deadline'));
  await assert.rejects(pending, { name: 'ApiError', message: /Không thể kết nối/ });
});

test('CSRF and the POST share one deadline and the POST carries the CSRF header', async () => {
  const deadline = new AbortController();
  const requests = [];
  const api = client(async (url, options) => {
    requests.push({ url, options });
    return json(url === '/api/auth/csrf' ? { token: 'test-csrf' } : { ok: true });
  }, deadline);
  await api.apiPost('/api/auth/login', { email: 'test@example.invalid' });
  assert.deepEqual(requests.map(request => request.url), ['/api/auth/csrf', '/api/auth/login']);
  assert.equal(requests[0].options.signal, deadline.signal);
  assert.equal(requests[1].options.signal, deadline.signal);
  assert.equal(requests[1].options.headers['X-CSRF-Token'], 'test-csrf');
  assert.equal(requests[1].options.credentials, 'same-origin');
});

test('DELETE fetches a CSRF token first, sends it, and has no JSON body', async () => {
  const requests = [];
  const api = client(async (url, options) => {
    requests.push({ url, options });
    return json(url === '/api/auth/csrf' ? { token: 'test-csrf' } : { data: { items: [] } });
  });
  const value = await api.apiDelete('/api/cart/items/12');
  assert.deepEqual(requests.map(request => request.url), ['/api/auth/csrf', '/api/cart/items/12']);
  const { method, headers, body, credentials } = requests[1].options;
  assert.equal(method, 'DELETE');
  assert.equal(headers['X-CSRF-Token'], 'test-csrf');
  assert.equal(headers['Content-Type'], undefined);
  assert.equal(body, undefined);
  assert.equal(credentials, 'same-origin');
  assert.deepEqual(JSON.parse(JSON.stringify(value)), { data: { items: [] } });
});

test('a failed DELETE is reported like any other request', async () => {
  const api = client(async url => (url === '/api/auth/csrf'
    ? json({ token: 't' })
    : json({ detail: 'Món này không còn trong giỏ hàng.' }, 404)));
  await assert.rejects(api.apiDelete('/api/cart/items/9'),
    { name: 'ApiError', status: 404, message: 'Món này không còn trong giỏ hàng.' });
});

test('a body cut off by the deadline is an error, not a successful empty response', async () => {
  const deadline = new AbortController();
  const api = client(async () => ({
    ok: true, status: 200, json: async () => { deadline.abort(); throw Error('body timeout'); },
  }), deadline);
  await assert.rejects(api.apiGet('/api/tours'), { name: 'ApiError', message: /quá lâu/ });
});

test('an empty body on success still reads as null', async () => {
  const api = client(async () => ({ ok: true, status: 204, json: async () => { throw SyntaxError('empty'); } }));
  assert.equal(await api.apiGet('/api/auth/logout'), null);
});

test('problem JSON keeps status, code and the first field error; 5xx details are hidden', async () => {
  const problem = { detail: 'Email chưa được xác nhận.', code: 'email_not_verified' };
  const forbidden = client(async () => json(problem, 403));
  await assert.rejects(forbidden.apiGet('/api/x'),
    { status: 403, code: 'email_not_verified', message: problem.detail });
  const invalid = client(async () => json({ detail: 'x', errors: { phone: ['Số điện thoại sai.'] } }, 400));
  await assert.rejects(invalid.apiGet('/api/x'), { status: 400, message: 'Số điện thoại sai.' });
  const broken = client(async () => json({ detail: 'MySqlException at line 42' }, 500));
  await assert.rejects(broken.apiGet('/api/x'), { status: 500, message: /gián đoạn/ });
});

/** Renders AuthProvider with persistent hook slots, so callbacks can be driven without a browser. */
function provider(services) {
  const slots = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState: initial => {
      const slot = cursor++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
    },
    useRef: initial => { const slot = cursor++; return slots[slot] ||= { current: initial }; },
    useCallback: callback => callback,
    useContext: () => null,
    useEffect: () => {},
  };
  const { AuthProvider } = loadTs('src/components/auth/AuthProvider.tsx', {
    react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) }, '@/services/auth': services,
  });
  return () => { cursor = 0; return AuthProvider({ children: null }).props.value; };
}

test('a pending session response cannot restore a user after logout', async () => {
  const reply = deferred();
  const render = provider({ getSession: () => reply.promise, logout: async () => {} });
  const pending = render().refresh();
  await render().logout();
  reply.resolve({ user: { id: 'old-user' } });
  await pending;
  assert.equal(render().session, null);
});

test('a newer refresh wins over an older, slower one', async () => {
  const old = deferred();
  const fresh = deferred();
  let calls = 0;
  const render = provider({ getSession: () => (++calls === 1 ? old.promise : fresh.promise), logout: async () => {} });
  const beforeLogin = render().refresh();
  const afterLogin = render().refresh();
  fresh.resolve({ user: { id: 'current-user' } });
  await afterLogin;
  old.resolve(null);
  await beforeLogin;
  assert.equal(render().session.user.id, 'current-user');
  assert.equal(render().loading, false);
});

test('a failed refresh reports an error and stops loading without signing the user out', async () => {
  let fail = false;
  const render = provider({
    getSession: async () => { if (fail) throw Error('offline'); return { user: { id: 'u1' } }; },
    logout: async () => {},
  });
  await render().refresh();
  fail = true;
  await render().refresh();
  assert.equal(render().session.user.id, 'u1');
  assert.match(render().error, /phiên đăng nhập/);
  assert.equal(render().loading, false);
});
