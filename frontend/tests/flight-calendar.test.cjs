/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const cal = loadTs('src/lib/flight-calendar.ts');

test('day arithmetic crosses month and year ends', () => {
  assert.equal(cal.addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(cal.addDays('2027-03-01', -1), '2027-02-28');
  assert.equal(cal.shiftMonth('2026-12', 1), '2027-01');
  assert.equal(cal.shiftMonth('2027-01', -1), '2026-12');
});

test('day window is centred but never starts before today', () => {
  assert.deepEqual(plain(cal.dayWindow('2026-12-10', '2026-11-17')),
    ['2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12', '2026-12-13']);
  assert.equal(cal.dayWindow('2026-11-18', '2026-11-17')[0], '2026-11-17');
  assert.deepEqual(plain(cal.monthsCovering(cal.dayWindow('2026-11-29', '2026-11-17'))), ['2026-11', '2026-12']);
});

test('month grid starts on Monday and pads both ends', () => {
  const weeks = cal.monthGrid('2026-12');
  // 1 December 2026 is a Tuesday.
  assert.deepEqual(plain(weeks[0].slice(0, 2)), [null, '2026-12-01']);
  assert.ok(weeks.every(week => week.length === 7));
  assert.equal(weeks.flat().filter(Boolean).length, 31);
  assert.equal(cal.weekdayLabel('2026-12-01'), 'T3');
});

test('bookable months run from this month to eleven months ahead', () => {
  assert.equal(cal.isBookableMonth('2026-10', '2026-11-17'), false);
  assert.equal(cal.isBookableMonth('2026-11', '2026-11-17'), true);
  assert.equal(cal.isBookableMonth('2027-10', '2026-11-17'), true);
  assert.equal(cal.isBookableMonth('2027-11', '2026-11-17'), false);
});

test('prices are compact and the lowest ignores days without quotes', () => {
  assert.equal(cal.compactPrice(1_650_000), '1,65tr');
  assert.equal(cal.compactPrice(2_000_000), '2tr');
  assert.equal(cal.compactPrice(890_000), '890K');
  assert.equal(cal.lowestOf([null, 900_000, 650_000]), 650_000);
  assert.equal(cal.lowestOf([null, null]), null);
});

test('the lowest-quote wording never claims the cheapest market fare', () => {
  assert.doesNotMatch(cal.LOWEST_QUOTE_NOTE, /rẻ nhất thị trường/i);
  assert.match(cal.LOWEST_QUOTE_NOTE, /tham khảo/);
});

test('flexible fares decode outbound days, return days and round-trip totals', async () => {
  class ApiError extends Error {}
  const decode = loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } });
  const format = loadTs('src/lib/format.ts');
  const search = loadTs('src/lib/flight-search.ts', { '@/lib/format': format });
  let requested = '';
  const service = loadTs('src/services/flights.ts', {
    '@/lib/api-client': { apiGet: async url => { requested = url; return { data: {
      from: 'SGN', to: 'HAN', cabin: 'economy', date: '2026-12-10', returnDate: '2026-12-12',
      outboundDays: [{ date: '2026-12-10', lowestPrice: 900000, offerCount: 2, isCheapest: true }],
      returnDays: [{ date: '2026-12-12', lowestPrice: null, offerCount: 0, isCheapest: false }],
      roundTrips: [{ departDate: '2026-12-10', returnDate: '2026-12-12', total: null, isCheapest: false }],
      cheapestTotal: null,
    } }; } },
    '@/lib/decode': decode,
    '@/lib/flight-search': search,
  });
  const route = { from: 'SGN', to: 'HAN', cabin: 'economy' };
  const fares = await service.getFlexibleFares(route, '2026-12-10', '2026-12-12');
  assert.match(requested, /^\/api\/flights\/flexible\?/);
  assert.match(requested, /returnDate=2026-12-12/);
  assert.equal(fares.roundTrips[0].total, null);
  assert.equal(fares.outboundDays[0].isCheapest, true);
});
