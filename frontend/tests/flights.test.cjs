/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const lib = loadTs('src/lib/flight-search.ts', { '@/lib/format': format });
class ApiError extends Error {}
const service = get => loadTs('src/services/flights.ts', {
  '@/lib/api-client': { apiGet: get },
  '@/lib/decode': loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } }),
  '@/lib/flight-search': lib,
});

const today = '2026-11-17';
const search = { from: 'SGN', to: 'HAN', date: '2026-12-20', passengers: 2, cabin: 'economy' };
const offer = (id, airline, price, departAt, minutes) => ({
  flightId: id, offerId: id, flightNumber: id, airline, airlineCode: null, originCode: 'SGN',
  originCity: 'TP. Hồ Chí Minh', destinationCode: 'HAN', destinationCity: 'Hà Nội', departAt,
  arriveAt: departAt, durationMinutes: minutes, cabinClass: 'economy', referencePrice: price,
  baggageTerms: null, changeCancelTerms: null, quoteExpiresAt: null,
});
// UTC instants: 23:30Z is 06:30 next day in Vietnam (morning), 07:00Z is 14:00 (afternoon).
const offers = [
  offer('A', 'Vietnam Airlines', 2_000_000, '2026-12-19T23:30:00Z', 130),
  offer('B', 'Vietjet Air', 1_200_000, '2026-12-20T07:00:00Z', 125),
  offer('C', 'Vietjet Air', 1_500_000, '2026-12-20T13:00:00Z', 140),
];

test('airports resolve from codes, city names and names without accents', () => {
  for (const text of ['DAD', 'Đà Nẵng', 'da nang', 'tan son nhat', 'Hà Nội'])
    assert.ok(lib.airportCode(text), text);
  assert.equal(lib.airportCode('Tân Sơn Nhất'), 'SGN');
  assert.equal(lib.airportCode('khong ton tai'), '');
  assert.equal(lib.airportLabel('PQC'), 'Phú Quốc (PQC)');
});

test('search validation rejects same airports, past dates, bad passenger counts and cabins', () => {
  assert.equal(lib.validateFlightSearch(search, today), null);
  for (const change of [{ to: 'SGN' }, { from: 'XYZ' }, { date: '2026-11-16' }, { date: '20-12-2026' },
    { passengers: 0 }, { passengers: 10 }, { passengers: 1.5 }, { cabin: 'luxury' }])
    assert.ok(lib.validateFlightSearch({ ...search, ...change }, today), JSON.stringify(change));
});

test('URL parameters round-trip and fall back to safe defaults', () => {
  const params = lib.flightSearchParams({ ...search, from: 'Đà Nẵng' });
  assert.equal(params.get('from'), 'DAD');
  assert.deepEqual(plain(lib.parseFlightSearch(Object.fromEntries(params))), { ...search, from: 'DAD' });
  const fallback = lib.parseFlightSearch({ passengers: '1e400', cabin: 'luxury' });
  assert.equal(fallback.passengers, 1);
  assert.equal(fallback.cabin, 'economy');
});

test('filters by airline, price ceiling and Vietnam-time day period, then sorts', () => {
  const ids = filters => lib.applyFlightFilters(offers, { ...lib.EMPTY_FLIGHT_FILTERS, ...filters })
    .map(o => o.flightId);
  assert.deepEqual(plain(ids({})), ['B', 'C', 'A']);
  assert.deepEqual(plain(ids({ airline: 'Vietjet Air', sort: 'duration' })), ['B', 'C']);
  assert.deepEqual(plain(ids({ maxPrice: '1500000', sort: 'departure' })), ['B', 'C']);
  assert.deepEqual(plain(ids({ period: '1' })), ['A']);
  assert.deepEqual(plain(ids({ period: '2' })), ['B']);
  assert.equal(offers[0].flightId, 'A', 'the input list is not reordered');
});

test('totals multiply by passengers and the flight day is the Vietnam calendar day', () => {
  assert.equal(lib.flightTotal(offers[0], 3), 6_000_000);
  assert.equal(lib.flightDay(offers[0]), '2026-12-20');
});

test('the service decodes offers and rejects an unknown cabin class', async () => {
  const row = offer('A', 'Vietnam Airlines', 2_000_000, '2026-12-19T23:30:00Z', 130);
  const ok = service(async () => ({ data: [row], count: 1 }));
  assert.equal((await ok.getUpcomingFlights())[0].referencePrice, 2_000_000);
  const bad = service(async () => ({ data: [{ ...row, cabinClass: 'luxury' }], count: 1 }));
  await assert.rejects(bad.getUpcomingFlights(), /chuyến bay/);
});

test('round trips keep the return date and flexible flag in the URL, one-way searches do not', () => {
  const round = { ...search, returnDate: '2026-12-24', flexible: true };
  const params = lib.flightSearchParams(round);
  assert.equal(params.get('returnDate'), '2026-12-24');
  assert.equal(params.get('flex'), '1');
  assert.deepEqual(plain(lib.parseFlightSearch(Object.fromEntries(params))), round);
  const oneWay = lib.flightSearchParams({ ...search, flexible: true });
  assert.equal(oneWay.has('returnDate'), false);
  assert.equal(oneWay.has('flex'), false);
  assert.equal(lib.parseFlightSearch({ flex: '1' }).flexible, undefined);
});

test('a return date must be a valid day on or after departure', () => {
  assert.equal(lib.validateFlightSearch({ ...search, returnDate: search.date }, today), null);
  assert.ok(lib.validateFlightSearch({ ...search, returnDate: '2026-12-19' }, today));
  assert.ok(lib.validateFlightSearch({ ...search, returnDate: '' }, today));
});

test('the return leg flies the route the other way on the return date', () => {
  const back = lib.returnLegSearch({ ...search, returnDate: '2026-12-24', flexible: true });
  assert.deepEqual(plain(back), { from: 'HAN', to: 'SGN', date: '2026-12-24', passengers: 2, cabin: 'economy' });
});
