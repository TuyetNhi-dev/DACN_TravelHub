/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts', {}, { Intl });
const checkIn = loadTs('src/lib/check-in.ts', { '@/lib/format': format });

const passenger = (id, fullName, checkedInAt = null) =>
  ({ id, fullName, type: 'adult', checkedInAt, checkedInBy: checkedInAt ? 'Nhân viên' : null });
const bookings = [
  { bookingId: '1', code: 'SH261210AAAA', contactName: 'Trần Thị Bình', contactPhone: null,
    passengers: [passenger('11', 'Trần Thị Bình', '2026-12-10T00:30:00Z'), passenger('12', 'Lê Văn Đức')] },
  { bookingId: '2', code: 'SH261210BBBB', contactName: 'Phạm Minh', contactPhone: '0900000000',
    passengers: [passenger('21', 'Phạm Minh')] },
];

test('a ticket exists only for paid or finished tour orders', () => {
  assert.ok(checkIn.hasTicket({ serviceType: 'tour', itemStatus: 'confirmed' }));
  assert.ok(checkIn.hasTicket({ serviceType: 'tour', itemStatus: 'completed' }));
  assert.equal(checkIn.hasTicket({ serviceType: 'tour', itemStatus: 'pending' }), false);
  assert.equal(checkIn.hasTicket({ serviceType: 'tour', itemStatus: 'cancelled' }), false);
  assert.equal(checkIn.hasTicket({ serviceType: 'flight', itemStatus: 'confirmed' }), false);
});

test('ticket status and QR file name', () => {
  assert.equal(checkIn.ticketStatusLabel('confirmed'), 'Đã thanh toán');
  assert.equal(checkIn.ticketStatusLabel('completed'), 'Chuyến đi đã hoàn tất');
  assert.equal(checkIn.ticketStatusLabel('pending'), 'pending');
  assert.equal(checkIn.ticketQrFileName('7K2M9QXH4TBW'), 've-saihanh-7K2M9QXH4TBW.png');
});

test('routes are encoded', () => {
  assert.equal(checkIn.ticketHref('42'), '/bookings/42/ve');
  assert.equal(checkIn.checkInHref('7'), '/admin/departures/7/check-in');
});

test('scanned QR text is told apart from a search', () => {
  assert.ok(checkIn.isTicketPayload(' SH1.7K2M9QXH4TBW.1.abc '));
  assert.ok(checkIn.isTicketPayload('sh1.7k2m9qxh4tbw.1.abc'));
  assert.equal(checkIn.isTicketPayload('SH261210AAAA'), false);
  assert.equal(checkIn.isTicketPayload('Bình'), false);
});

test('search matches code, contact and passenger names without accents', () => {
  const codes = text => plain(checkIn.filterCheckInBookings(bookings, text)).map(b => b.code);
  assert.deepEqual(codes(''), ['SH261210AAAA', 'SH261210BBBB']);
  assert.deepEqual(codes('bbbb'), ['SH261210BBBB']);
  assert.deepEqual(codes('duc'), ['SH261210AAAA']);
  assert.deepEqual(codes('pham minh'), ['SH261210BBBB']);
  assert.deepEqual(codes('khong co'), []);
});

test('waiting passengers and progress count only those not checked in', () => {
  assert.deepEqual(plain(checkIn.waitingPassengerIds(bookings[0])), ['12']);
  assert.deepEqual(plain(checkIn.bookingProgress(bookings[0])), { checkedIn: 1, total: 2 });
  assert.deepEqual(plain(checkIn.bookingProgress(bookings[1])), { checkedIn: 0, total: 1 });
});

test('progress filter splits orders still waiting from complete ones', () => {
  const done = { ...bookings[1], passengers: [passenger('21', 'Phạm Minh', '2026-12-10T01:00:00Z')] };
  const list = [bookings[0], done];
  const ids = filter => list.filter(b => checkIn.matchesProgress(b, filter)).map(b => b.bookingId);
  assert.deepEqual(ids('all'), ['1', '2']);
  assert.deepEqual(ids('waiting'), ['1']);
  assert.deepEqual(ids('done'), ['2']);
  assert.deepEqual(plain(checkIn.PROGRESS_FILTERS).map(f => f.id), ['all', 'waiting', 'done']);
});

test('board percent is rounded and safe on an empty board', () => {
  assert.equal(checkIn.boardPercent({ passengerCount: 3, checkedInCount: 1 }), 33);
  assert.equal(checkIn.boardPercent({ passengerCount: 3, checkedInCount: 3 }), 100);
  assert.equal(checkIn.boardPercent({ passengerCount: 0, checkedInCount: 0 }), 0);
});

test('findBooking returns the board copy or null', () => {
  assert.equal(checkIn.findBooking(bookings, '2').code, 'SH261210BBBB');
  assert.equal(checkIn.findBooking(bookings, '9'), null);
  assert.equal(checkIn.findBooking(bookings, null), null);
});
