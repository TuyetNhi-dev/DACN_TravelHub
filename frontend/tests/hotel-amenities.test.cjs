/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const lib = loadTs('src/lib/hotel-amenities.ts');
const places = loadTs('src/lib/destinations.ts', { '@/lib/format': format });
const amenity = (code, category, isHighlight = false) => ({ code, name: code, category, isHighlight, isPaid: false });

test('groups follow the page order, skip empty groups and collect unknown categories last', () => {
  const groups = lib.groupAmenities([
    amenity('spa', 'wellness'), amenity('wifi', 'internet'), amenity('drone', 'future'), amenity('gym', 'wellness'),
  ]);
  assert.deepEqual(plain(groups.map(group => group.category)), ['internet', 'wellness', 'other']);
  assert.deepEqual(plain(groups[1].items.map(item => item.code)), ['spa', 'gym']);
  assert.equal(groups[2].label, 'Tiện nghi khác');
  assert.deepEqual(plain(lib.groupAmenities([])), []);
});

test('highlights keep API order and stop at the maximum', () => {
  const many = Array.from({ length: 12 }, (_, i) => amenity('a' + i, 'room', i % 2 === 0));
  const highlights = lib.amenityHighlights(many);
  assert.equal(highlights.length, 6);
  assert.equal(highlights[0].code, 'a0');
  assert.ok(lib.amenityHighlights(Array.from({ length: 20 }, (_, i) => amenity('b' + i, 'room', true))).length
    === lib.MAX_HIGHLIGHTS);
});

test('every policy code from the migration has a label; unknown codes still read well', () => {
  for (const type of ['cancellation', 'children', 'extra_bed', 'payment', 'deposit', 'pets', 'smoking'])
    assert.notEqual(lib.policyLabel(type), 'Quy định khác', type);
  assert.equal(lib.policyLabel('karaoke'), 'Quy định khác');
});

test('places match without accents or the TP. prefix', () => {
  assert.equal(places.sameCity('TP. Hồ Chí Minh', 'Hồ Chí Minh'), true);
  assert.equal(places.sameCity('Đà Nẵng', 'da nang'), true);
  assert.equal(places.sameCity('Hội An', 'Đà Nẵng'), false);
});

test('destination slugs round-trip to the API name', () => {
  assert.equal(places.destinationSlug('TP. Hồ Chí Minh'), 'tp-ho-chi-minh');
  assert.equal(places.destinationHref('Đà Lạt'), '/destinations/da-lat');
  const names = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'];
  assert.equal(places.placeName('tp-ho-chi-minh', names), 'TP. Hồ Chí Minh');
  assert.equal(places.placeName('ho-chi-minh', names), 'TP. Hồ Chí Minh');
  assert.equal(places.placeName('da-nang', names), 'Đà Nẵng');
  assert.equal(places.placeName('atlantis', names), null);
  assert.ok(places.SLUG_PATTERN.test('hoa-da-quy'));
  assert.ok(!places.SLUG_PATTERN.test('Hoa_Da Quy') && !places.SLUG_PATTERN.test('-x'));
});

test('cheapest flight per origin into the city, cheapest first', () => {
  const offer = (originCode, destinationCity, referencePrice) => ({ originCode, destinationCity, referencePrice });
  const flights = [offer('SGN', 'Đà Nẵng', 1500), offer('SGN', 'Đà Nẵng', 900), offer('HAN', 'Đà Nẵng', 1200),
    offer('HAN', 'Hà Nội', 100), offer('VCA', 'da nang', 2000)];
  const best = places.cheapestFlightsTo(flights, 'Đà Nẵng', 2);
  assert.deepEqual(plain(best.map(f => f.originCode + f.referencePrice)), ['SGN900', 'HAN1200']);
});
