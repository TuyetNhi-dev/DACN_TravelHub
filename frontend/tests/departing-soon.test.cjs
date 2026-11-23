/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

class ApiError extends Error {}
const decode = loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } });
const service = get => loadTs('src/services/tours.ts', { '@/lib/api-client': { apiGet: get }, '@/lib/decode': decode });
const format = loadTs('src/lib/format.ts');
const display = loadTs('src/lib/tour-display.ts', { '@/lib/format': format, '@/lib/media': {} });

const departure = {
  departureId: '11', tourId: '5', tourCode: 'T-005', tourTitle: 'Hạ Long 2N1Đ', destination: 'Hạ Long',
  departureFrom: 'Hà Nội', departureDate: '2026-11-28', durationDays: 2, durationNights: 1,
  availableSeats: 3, adultPrice: 2_490_000, daysUntilDeparture: 5,
};

test('upcoming departures ask for the home window and decode every field', async () => {
  let requested = '';
  const value = await service(async path => { requested = path; return { data: [departure], count: 1, total: 1 }; })
    .getUpcomingDepartures();

  assert.equal(requested, '/api/tours/departures/upcoming?days=14&limit=8');
  assert.deepEqual(plain(value), [departure]);
});

test('a departure without a seat count is a contract error, not "Còn undefined chỗ"', async () => {
  const broken = { ...departure };
  delete broken.availableSeats;
  await assert.rejects(service(async () => ({ data: [broken], count: 1, total: 1 })).getUpcomingDepartures());
});

test('labels count days from the server value and link to the chosen departure', () => {
  assert.equal(display.departsInLabel(1), 'Khởi hành ngày mai');
  assert.equal(display.departsInLabel(5), 'Khởi hành sau 5 ngày');
  assert.equal(display.departureHref('5', '11'), '/tours/5?departure=11');
  assert.equal(display.isFewSeats(5), true);
  assert.equal(display.isFewSeats(6), false);
});
