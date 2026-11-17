/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const lib = loadTs('src/lib/tour-display.ts', { '@/lib/format': format, '@/lib/media': {} });
const filters = changes => ({ ...lib.EMPTY_TOUR_FILTERS, ...changes });
const tour = (id, destination, price, days, dates = []) => ({
  id, code: id, title: 'Tour ' + destination, destination, departureFrom: 'TP. Hồ Chí Minh',
  durationDays: days, durationNights: days - 1, transport: null, basePrice: price, upcomingDepartureDates: dates,
});
const tours = [
  tour('A', 'Đà Nẵng', 5_000_000, 3, ['2026-12-01']),
  tour('B', 'Sa Pa', 7_000_000, 4),
  tour('C', 'Phú Quốc', 9_000_000, 6),
];

test('no chips without filters; sort alone is not a filter chip', () => {
  assert.deepEqual(plain(lib.activeTourFilters(filters({ sort: 'low', query: '   ' }))), []);
});

test('one chip per active filter, in panel order, with readable labels', () => {
  const chips = lib.activeTourFilters(filters({
    query: ' sapa ', destination: 'Sa Pa', date: '2026-12-01', duration: 'medium', maxPrice: '7000000',
  }));
  assert.deepEqual(plain(chips.map(chip => chip.key)), ['query', 'destination', 'date', 'duration', 'maxPrice']);
  assert.equal(chips[0].label, '“sapa”');
  assert.equal(chips[2].label, 'Khởi hành 01/12/2026');
  assert.equal(chips[3].label, '4 – 5 ngày');
  assert.match(chips[4].label, /^Đến 7\.000\.000/);
});

test('every chip key resets to the empty filter value', () => {
  for (const chip of lib.activeTourFilters(filters({ query: 'x', destination: 'y', date: '2026-12-01',
    duration: 'long', maxPrice: '1' })))
    assert.equal(typeof lib.EMPTY_TOUR_FILTERS[chip.key], 'string');
});

test('filters combine search without accents, duration, price and departure date', () => {
  const ids = changes => plain(lib.filterTours(tours, filters(changes)).map(t => t.id));
  assert.deepEqual(ids({ query: 'da nang' }), ['A']);
  assert.deepEqual(ids({ duration: 'short' }), ['A']);
  assert.deepEqual(ids({ duration: 'medium' }), ['B']);
  assert.deepEqual(ids({ duration: 'long' }), ['C']);
  assert.deepEqual(ids({ maxPrice: '7000000', sort: 'high' }), ['B', 'A']);
  assert.deepEqual(ids({ date: '2026-12-01' }), ['A']);
});
