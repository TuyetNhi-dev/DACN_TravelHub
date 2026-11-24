/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const auth = loadTs('src/lib/auth.ts');
const user = (...codes) => ({
  id: '7', fullName: 'Nguyễn Thị Phương Thảo Hoàng Anh', email: 'thao@example.com', phone: null,
  roles: codes.map(code => ({ code, scope: code === 'CUSTOMER' ? 'self' : 'global', regionId: null, branchId: null })),
});

test('avatar letters come from the first and last word, Vietnamese capitals included', () => {
  assert.equal(auth.nameInitials('Nguyễn Văn An'), 'NA');
  assert.equal(auth.nameInitials('  đỗ   ánh  '), 'ĐÁ');
  assert.equal(auth.nameInitials('Minh'), 'MI');
  assert.equal(auth.nameInitials('   '), '?');
});

test('customers get their account and bookings only', () => {
  assert.deepEqual(plain(auth.accountLinks(user('CUSTOMER')).map(link => link.href)), ['/account', '/bookings']);
});

test('staff and admins also get the back-office queues, with the new-request count on service requests', () => {
  for (const role of ['STAFF', 'ADMIN']) {
    const links = plain(auth.accountLinks(user(role)));
    assert.deepEqual(links.map(link => link.label),
      ['Tài khoản của tôi', 'Đơn của tôi', 'Quản trị đơn', 'Yêu cầu dịch vụ']);
    assert.deepEqual(links.filter(link => link.showsNewRequests).map(link => link.href), ['/admin/service-requests']);
  }
});

test('after sign-in, staff and admins start in the back office unless they came from a specific page', () => {
  for (const role of ['STAFF', 'ADMIN']) {
    const operator = user('CUSTOMER', role);
    assert.equal(auth.postLoginPath(null, operator), '/admin/bookings');
    assert.equal(auth.postLoginPath('/', operator), '/admin/bookings');
    assert.equal(auth.postLoginPath('//evil.example', operator), '/admin/bookings');
    assert.equal(auth.postLoginPath('/tours/3', operator), '/tours/3');
  }
});

test('after sign-in, customers keep the usual destination', () => {
  const customer = user('CUSTOMER');
  assert.equal(auth.postLoginPath(null, customer), '/account');
  assert.equal(auth.postLoginPath('/', customer), '/');
  assert.equal(auth.postLoginPath('/gio-hang', customer), '/gio-hang');
  assert.equal(auth.postLoginPath('https://evil.example', customer), '/account');
});
