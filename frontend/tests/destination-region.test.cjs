/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const departure = loadTs('src/lib/departure-region.ts');
const lib = loadTs('src/lib/destination-region.ts', {
  '@/lib/departure-region': departure,
  '@/lib/format': format,
});

const tour = (id, destination, dates = ['2026-12-01']) => ({ id, destination, upcomingDepartureDates: dates });

test('seeded destinations that are towns or islands map to the region of their province', () => {
  assert.equal(lib.destinationRegion('Hạ Long'), 'north');
  assert.equal(lib.destinationRegion('Sa Pa'), 'north');
  assert.equal(lib.destinationRegion('Hội An'), 'central');
  assert.equal(lib.destinationRegion('Mũi Né'), 'central');
  assert.equal(lib.destinationRegion('Côn Đảo'), 'southeast');
});

test('province and city names reuse the departure list, including the "TP." prefix', () => {
  assert.equal(lib.destinationRegion('Hà Nội'), 'north');
  assert.equal(lib.destinationRegion('Đà Lạt'), 'highlands');
  assert.equal(lib.destinationRegion('TP. Hồ Chí Minh'), 'southeast');
  assert.equal(lib.destinationRegion('Phú Quốc'), 'southwest');
  assert.equal(lib.destinationRegion('Nơi chưa biết'), null);
});

test('tabs list "Tất cả" first and only regions that have tours', () => {
  const tabs = plain(lib.destinationTabsFor([tour('a', 'Hạ Long'), tour('b', 'Cần Thơ'), tour('c', 'Nơi lạ')]));
  assert.deepEqual(tabs.map(tab => tab.id), ['all', 'north', 'southwest']);
  assert.equal(tabs[0].label, 'Tất cả');
});

test('package tours keep only open departures in the tab region, in order, up to the limit', () => {
  const tours = [tour('closed', 'Hạ Long', []), tour('n1', 'Hạ Long'), tour('c1', 'Huế'), tour('n2', 'Sa Pa')];
  assert.deepEqual(plain(lib.packageTours(tours, 'north', 5)).map(item => item.id), ['n1', 'n2']);
  assert.deepEqual(plain(lib.packageTours(tours, 'all', 2)).map(item => item.id), ['n1', 'c1']);
  assert.deepEqual(plain(lib.packageTours(tours, 'southwest', 5)), []);
});

test('date chips show the first dates and count the rest', () => {
  const dates = ['2026-12-01', '2026-12-08', '2026-12-15'];
  assert.deepEqual(plain(lib.departureChips(dates, 2)), { shown: ['2026-12-01', '2026-12-08'], hidden: 1 });
  assert.deepEqual(plain(lib.departureChips(dates, 4)), { shown: dates, hidden: 0 });
  assert.equal(lib.shortDate('2027-01-06'), '06/01');
});
