/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const lunar = loadTs('src/lib/lunar-calendar.ts');
const holidays = loadTs('src/lib/vn-holidays.ts', { '@/lib/lunar-calendar': lunar });
const display = loadTs('src/lib/tour-display.ts', {
  '@/lib/format': format, '@/lib/media': {}, '@/lib/vn-holidays': holidays,
});
const search = loadTs('src/lib/tour-search.ts', { '@/lib/tour-display': display });

const params = (filters = {}, region = 'all', page = 1, destinationId = null) => Object.fromEntries(
  search.tourSearchParams({ filters: { ...display.EMPTY_TOUR_FILTERS, ...filters }, region, page, destinationId }));

test('an empty search only asks for the first page', () => {
  assert.deepEqual(params(), { page: '1', pageSize: '9' });
});

test('each filter becomes the parameter GET /api/tours understands', () => {
  assert.deepEqual(params({ query: '  Đà Lạt ', date: '2026-12-16', maxPrice: '5000000', sort: 'low' }, 'north', 3,
    '29'), {
    q: 'Đà Lạt', destinationId: '29', dateFrom: '2026-12-16', dateTo: '2026-12-16', maxPrice: '5000000',
    sort: 'price_asc', departureRegion: 'north', page: '3', pageSize: '9',
  });
  assert.equal(params({ sort: 'high' }).sort, 'price_desc');
});

test('durations map to the same day ranges as the in-page filter', () => {
  assert.deepEqual(params({ duration: 'short' }), { maxDays: '3', page: '1', pageSize: '9' });
  assert.deepEqual(params({ duration: 'medium' }), { minDays: '4', maxDays: '5', page: '1', pageSize: '9' });
  assert.deepEqual(params({ duration: 'long' }), { minDays: '6', page: '1', pageSize: '9' });
  const tours = [3, 4, 5, 6].map(days => ({
    id: String(days), title: '', destination: '', departureFrom: '', code: '', basePrice: 1, durationDays: days,
    upcomingDepartureDates: [],
  }));
  const kept = duration => display.filterTours(tours, { ...display.EMPTY_TOUR_FILTERS, duration }).map(t => t.id);
  assert.deepEqual(kept('medium'), ['4', '5']);
  assert.deepEqual(kept('long'), ['6']);
});

test('text longer than the API accepts is cut, and pages never go below one', () => {
  assert.equal(params({ query: 'a'.repeat(150) }).q.length, search.MAX_QUERY_LENGTH);
  assert.equal(params({}, 'all', 0).page, '1');
  assert.equal(search.tourPageCount(0), 1);
  assert.equal(search.tourPageCount(10), 2);
});

test('the date calendar asks for a month under every list filter except the day, the sort and the page', () => {
  const request = {
    filters: { ...display.EMPTY_TOUR_FILTERS, query: 'hue', date: '2026-12-16', sort: 'high', duration: 'short' },
    region: 'central', destinationId: '8',
  };
  assert.deepEqual(Object.fromEntries(search.departureDayParams(request, '2026-12')), {
    q: 'hue', destinationId: '8', maxDays: '3', departureRegion: 'central', month: '2026-12',
  });
});

test('a collection counts its tours per bookable departure day of the month', () => {
  const tours = [
    { upcomingDepartureDates: ['2026-12-03', '2026-12-03', '2026-12-16', '2027-01-02'] },
    { upcomingDepartureDates: ['2026-12-03'] },
  ];
  assert.deepEqual(plain([...search.countByDepartureDay(tours, '2026-12')]), [['2026-12-03', 2], ['2026-12-16', 1]]);
  assert.equal(search.countByDepartureDay(tours, '2027-02').size, 0);
});
