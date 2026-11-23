/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const forms = loadTs('src/lib/admin-forms.ts');
const lib = loadTs('src/lib/admin-departures.ts', { '@/lib/admin-forms': forms, '@/lib/format': format });

const departure = (changes = {}) => ({
  id: '11', tourId: '5', tourCode: 'SH-MB-003', tourTitle: 'Hạ Long', branchId: '1', branchName: 'Hà Nội',
  departureLocationId: '8', departureFrom: 'Hà Nội', departureDate: '2026-12-05', returnDate: '2026-12-06',
  capacity: 20, reservedSeats: 4, minGuests: 6, adultPrice: 4590000, childPrice: null, status: 'open', canEdit: true,
  ...changes,
});

test('status toggle mirrors the server: close open, reopen only a future closed one, never a cancelled one', () => {
  const today = '2026-11-30';
  assert.equal(lib.statusToggleFor(departure(), today).status, 'closed');
  assert.equal(lib.statusToggleFor(departure({ status: 'closed' }), today).status, 'open');
  assert.equal(lib.statusToggleFor(departure({ status: 'closed', departureDate: '2026-11-30' }), today), null);
  assert.equal(lib.statusToggleFor(departure({ status: 'cancelled' }), today), null);
});

test('seat summary flags a group still below its minimum size', () => {
  assert.deepEqual(plain(lib.seatSummary(departure())), { text: '4 / 20 chỗ đã đặt', belowMinimum: true });
  assert.equal(lib.seatSummary(departure({ reservedSeats: 6 })).belowMinimum, false);
});

test('edit form round-trips a departure and the update leaves out the departure point', () => {
  const form = lib.termsFormFrom(departure());
  assert.equal(form.childPrice, '');
  assert.deepEqual(plain(lib.toUpdateTerms({ ...form, capacity: '25', childPrice: '3.440.000' })), {
    operatingBranchId: '1', capacity: 25, minGuests: 6, adultPrice: 4590000, childPrice: 3440000,
  });
});

test('a new departure starts from the tour branch and base price', () => {
  const form = plain(lib.newTermsForm({ branchId: '3', basePrice: 2390000 }));
  assert.equal(form.operatingBranchId, '3');
  assert.equal(form.adultPrice, '2390000');
  assert.equal(form.departureLocationId, '');
});

test('manifest summary counts guests and explains seats held outside the listed orders', () => {
  const booking = { adults: 2, children: 1, passengers: [] };
  const manifest = { departure: departure({ reservedSeats: 7, minGuests: 6 }), bookings: [booking], totalGuests: 3 };
  assert.deepEqual(plain(lib.manifestSummary(manifest)),
    { guests: 3, bookings: 1, belowMinimum: false, heldOutsideList: 4 });
  const empty = { departure: departure({ reservedSeats: 0 }), bookings: [], totalGuests: 0 };
  assert.deepEqual(plain(lib.manifestSummary(empty)),
    { guests: 0, bookings: 0, belowMinimum: true, heldOutsideList: 0 });
  assert.equal(lib.manifestHref('11'), '/admin/departures/11/manifest');
});

test('passenger types read in Vietnamese, unknown codes stay visible', () => {
  assert.equal(lib.passengerTypeLabel('adult'), 'Người lớn');
  assert.equal(lib.passengerTypeLabel('infant'), 'Em bé');
  assert.equal(lib.passengerTypeLabel('senior'), 'senior');
});

test('bulk result names the skipped dates in Vietnamese format', () => {
  assert.equal(lib.bulkResultMessage({ created: 5, skippedDates: [] }), 'Đã tạo 5 lịch khởi hành.');
  assert.equal(lib.bulkResultMessage({ created: 3, skippedDates: ['2026-12-05', '2026-12-12'] }),
    'Đã tạo 3 lịch khởi hành. Bỏ qua 2 ngày đã có lịch: 05/12/2026, 12/12/2026.');
  assert.equal(lib.departuresOfTourHref('5'), '/admin/departures?tourId=5');
});
