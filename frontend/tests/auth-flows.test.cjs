/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const strength = loadTs('src/lib/password-strength.ts');
const phone = loadTs('src/lib/phone-vn.ts');
const decode = loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } });
const authService = api => loadTs('src/services/auth.ts', {
  '@/lib/api-client': { ApiError, ...api }, '@/lib/decode': decode,
});

const user = { id: '7', fullName: 'An', email: 'an@example.com', phone: null, roles: [] };

test('password hint follows the server rule: 12–128 characters and a matching confirmation', () => {
  assert.equal(strength.checkPassword('', '').level, 'empty');
  assert.equal(strength.checkPassword('ngan', '').level, 'too-short');
  const ok = strength.checkPassword('matkhaududai', 'matkhaududai');
  assert.equal(ok.level, 'ok');
  assert.equal(ok.lengthOk, true);
  assert.equal(ok.matches, true);
  assert.ok(ok.tips.length > 0, 'a plain 12-letter password gets advice');
  assert.equal(strength.checkPassword('Mat-Khau-Rat-Manh-2026', '').level, 'strong');
  assert.equal(strength.checkPassword('x'.repeat(129), '').lengthOk, false);
  assert.equal(strength.checkPassword('matkhaududai', 'matkhaukhac1').matches, false);
});

test('Vietnamese phone numbers mirror the server rule and normalise to 0…', () => {
  for (const [input, expected] of [['0912 345 678', '0912345678'], ['+84 912-345-678', '0912345678'],
    ['84912345678', '0912345678'], ['028.3812.3456', '02838123456'], ['(028) 3812 3456', '02838123456']])
    assert.equal(phone.normalizeVietnamesePhone(input), expected, input);
  for (const input of ['0112345678', '091234567', '+1 415 555 0100', 'abc'])
    assert.equal(phone.normalizeVietnamesePhone(input), null, input);
});

test('the session says whether the user has agreed; an older answer without the flag is a contract error', async () => {
  const signedIn = authService({ apiGet: async () => ({ user, expiresAt: null, termsAccepted: false }) });
  assert.equal((await signedIn.getSession()).termsAccepted, false);
  const old = authService({ apiGet: async () => ({ user, expiresAt: null }) });
  await assert.rejects(old.getSession(), ApiError);
});

test('accepting the terms, requesting and confirming a reset call the right endpoints', async () => {
  const calls = [];
  const service = authService({
    apiGet: async () => null,
    apiPost: async (path, body) => {
      calls.push([path, body]);
      return path === '/api/auth/accept-terms'
        ? { user, expiresAt: '2026-11-21T11:00:00Z', termsAccepted: true }
        : { message: 'ok' };
    },
  });
  assert.equal((await service.acceptTerms()).termsAccepted, true);
  assert.equal(await service.requestPasswordReset('an@example.com'), 'ok');
  await service.confirmPasswordReset({ email: 'an@example.com', code: '123456', newPassword: 'matkhaumoi12',
    confirmPassword: 'matkhaumoi12' });
  assert.deepEqual(plain(calls.map(([path]) => path)),
    ['/api/auth/accept-terms', '/api/auth/password-reset/request', '/api/auth/password-reset/confirm']);
  assert.deepEqual(plain(calls[0][1]), { accept: true });
  assert.equal(calls[2][1].code, '123456');
});

test('sign-up sends the optional phone with the form', async () => {
  let sent;
  const service = authService({
    apiPost: async (path, body) => { sent = body; return { message: 'ok', emailSent: true }; },
  });
  await service.register({ fullName: 'An', email: 'an@example.com', password: 'matkhaududai',
    confirmPassword: 'matkhaududai', acceptTerms: true, phone: '0912345678' });
  assert.equal(sent.phone, '0912345678');
  assert.equal(sent.acceptTerms, true);
});
