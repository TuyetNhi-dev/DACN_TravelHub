/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

class ApiError extends Error {}
const format = loadTs('src/lib/format.ts');
const search = loadTs('src/lib/flight-search.ts', { '@/lib/format': format });
const deals = loadTs('src/lib/flight-deals.ts', { '@/lib/flight-search': search, '@/lib/format': format });
const decode = loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } });

const deal = {
  offerId: '10001', flightId: '10001', originCode: 'SGN', originCity: 'TP. Hồ Chí Minh', destinationCode: 'HAN',
  destinationCity: 'Hà Nội', departAt: '2026-12-08T23:05:00Z', airline: 'Vietjet Air', airlineCode: 'VJ',
  flightNumber: 'DEMO101', cabinClass: 'economy', referencePrice: 660000, isFeatured: false,
  quoteUpdatedAt: '2026-11-17T02:00:00Z', remainingSeats: 4,
};

test('only known origin chips are accepted from the URL', () => {
  assert.equal(deals.dealOrigin('HAN'), 'HAN');
  assert.equal(deals.dealOrigin('XYZ'), '');
  assert.equal(deals.dealOrigin(undefined), '');
});

test('a deal links to its route on the Vietnamese departure day', () => {
  // 23:05 UTC on 8 December is 06:05 on 9 December in Vietnam.
  const href = new URL(deals.dealSearchHref(deal), 'http://x');
  assert.equal(href.pathname, '/flights');
  assert.equal(href.searchParams.get('date'), '2026-12-09');
  assert.equal(href.searchParams.get('from'), 'SGN');
  assert.equal(href.searchParams.get('to'), 'HAN');
});

test('deals decode and the origin filter reaches the API', async () => {
  let requested = '';
  const service = loadTs('src/services/flights.ts', {
    '@/lib/api-client': { apiGet: async url => { requested = url; return { data: [deal], count: 1 }; } },
    '@/lib/decode': decode,
    '@/lib/flight-search': search,
  });
  const rows = await service.getFlightDeals('SGN');
  assert.equal(requested, '/api/flights/deals?from=SGN');
  assert.equal(rows[0].isFeatured, false);
  await service.getFlightDeals('');
  assert.equal(requested, '/api/flights/deals');
  await assert.rejects(() => loadTs('src/services/flights.ts', {
    '@/lib/api-client': { apiGet: async () => ({ data: [{ ...deal, isFeatured: 'yes' }], count: 1 }) },
    '@/lib/decode': decode,
    '@/lib/flight-search': search,
  }).getFlightDeals(''));
});

test('only deals promise seats, and a deal with too few seats explains the shortage', () => {
  assert.equal(deals.isDeal({ remainingSeats: null }), false);
  assert.equal(deals.isDeal({ remainingSeats: 0 }), true);
  assert.equal(deals.seatShortage({ remainingSeats: null }, 9), null);
  assert.equal(deals.seatShortage({ remainingSeats: 3 }, 3), null);
  assert.match(deals.seatShortage({ remainingSeats: 2 }, 3), /Chỉ còn 2 ghế/);
  assert.equal(deals.seatsLeftLabel(4), 'Còn 4 ghế giá này');
});

test('seat holds are tours and orders with a hold deadline', () => {
  const rules = loadTs('src/lib/booking-rules.ts');
  assert.equal(rules.holdsSeats({ serviceType: 'tour', holdExpiresAt: null }), true);
  assert.equal(rules.holdsSeats({ serviceType: 'flight', holdExpiresAt: '2026-11-17T08:10:00Z' }), true);
  assert.equal(rules.holdsSeats({ serviceType: 'flight', holdExpiresAt: null }), false);
  assert.equal(rules.holdsSeats({ serviceType: 'hotel', holdExpiresAt: null }), false);
});

test('a deal without a seat count is rejected by the decoder', async () => {
  const { remainingSeats, ...withoutSeats } = deal;
  assert.equal(remainingSeats, 4);
  await assert.rejects(() => loadTs('src/services/flights.ts', {
    '@/lib/api-client': { apiGet: async () => ({ data: [withoutSeats], count: 1 }) },
    '@/lib/decode': decode,
    '@/lib/flight-search': search,
  }).getFlightDeals(''));
});
