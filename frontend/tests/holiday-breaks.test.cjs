/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const lunar = loadTs('src/lib/lunar-calendar.ts');
const holidays = loadTs('src/lib/vn-holidays.ts', { '@/lib/lunar-calendar': lunar });
const calendar = loadTs('src/lib/flight-calendar.ts');
const breaks = loadTs('src/lib/holiday-breaks.ts', {
  '@/lib/flight-calendar': calendar, '@/lib/vn-holidays': holidays,
});

const breaksFrom = today => plain(breaks.holidayBreaks(today));
const breakAt = (today, start) => breaksFrom(today).find(item => item.start === start);

const tour = (id, durationDays, dates, basePrice = 1_000_000) => ({
  id, code: id, title: id, destination: 'Đà Lạt', departureFrom: 'Hồ Chí Minh', durationDays,
  durationNights: durationDays - 1, transport: null, basePrice, description: null, upcomingDepartureDates: dates,
});

test('horizon ends the day before the same date next year, 29/2 included', () => {
  assert.equal(breaks.horizonEnd('2026-11-24'), '2027-11-23');
  assert.equal(breaks.horizonEnd('2028-02-29'), '2029-02-28');
  assert.equal(breaks.horizonEnd('2026-03-01'), '2027-02-28');
});

test('30/4 and 1/5 2027 (Fri, Sat) join the Sunday into one break', () => {
  const item = breakAt('2027-01-10', '2027-04-30');
  assert.equal(item.end, '2027-05-02');
  assert.equal(item.days, 3);
  assert.deepEqual(item.holidayNames, [
    'Ngày Giải phóng miền Nam, thống nhất đất nước', 'Ngày Quốc tế Lao động',
  ]);
  assert.equal(item.scheduleNote, null);
});

test('a Tuesday holiday suggests Monday as the bridge day', () => {
  // 24/11/2026 is a Tuesday.
  const item = breakAt('2026-11-01', '2026-11-24');
  assert.equal(item.days, 1);
  assert.deepEqual(item.bridge, { leaveDate: '2026-11-23', start: '2026-11-21', end: '2026-11-24', days: 4 });
});

test('a bridge day already in the past is not offered', () => {
  const item = breakAt('2026-11-24', '2026-11-24');
  assert.equal(item.bridge, null, 'today is the holiday; Monday 23/11 has passed');
});

test('Tết collapses to one name and carries the yearly schedule note', () => {
  // Tất niên 2027 is Fri 5/2, mùng 1–3 are Sat 6/2 – Mon 8/2.
  const item = breakAt('2026-12-01', '2027-02-05');
  assert.equal(item.end, '2027-02-08');
  assert.deepEqual(item.holidayNames, ['Tết Nguyên Đán']);
  assert.match(item.scheduleNote, /Thủ tướng/);
});

test('Quốc khánh carries the adjacent-day note; traditional festivals never make a break', () => {
  const list = breaksFrom('2026-11-24');
  assert.match(list.find(item => item.holidayNames.includes('Quốc khánh')).scheduleNote, /1 ngày liền kề/);
  assert.ok(!list.some(item => item.holidayNames.some(name => /Trung thu|Vu Lan|ông Táo/.test(name))));
});

test('breaks run from today to the horizon, in date order, one per stretch', () => {
  const list = breaksFrom('2026-11-24');
  assert.equal(list[0].start, '2026-11-24', 'a break running today is listed');
  assert.ok(list.every(item => item.end >= '2026-11-24' && item.start <= '2027-11-23'));
  assert.ok(list.every((item, i) => i === 0 || item.start > list[i - 1].end));
  assert.equal(list.at(-1).start, '2027-09-02');
});

test('tours fit only when the whole trip lies inside the break', () => {
  const item = breakAt('2027-01-10', '2027-04-30');
  const matches = plain(breaks.toursForBreak([
    tour('fits', 3, ['2027-04-30']),
    tour('too-long', 4, ['2027-04-30']),
    tour('late', 2, ['2027-05-02']),
    tour('second-date', 2, ['2027-04-20', '2027-05-01']),
  ], item));
  assert.deepEqual(matches.map(m => [m.tour.id, m.departureDate, m.returnDate, m.needsBridge]), [
    ['fits', '2027-04-30', '2027-05-02', false],
    ['second-date', '2027-05-01', '2027-05-02', false],
  ]);
});

test('the day strip marks holidays, weekends and the bridge day', () => {
  // 2/9/2027 is a Thursday: Friday 3/9 is the bridge to the weekend.
  const strip = plain(breaks.breakStrip(breakAt('2027-01-10', '2027-09-02')));
  assert.deepEqual(strip.map(d => [d.date, d.weekday, d.kind, d.inBreak]), [
    ['2027-09-02', 'T5', 'holiday', true],
    ['2027-09-03', 'T6', 'leave', false],
    ['2027-09-04', 'T7', 'weekend', false],
    ['2027-09-05', 'CN', 'weekend', false],
  ]);
  const tet = plain(breaks.breakStrip(breakAt('2026-12-01', '2027-02-05')));
  assert.deepEqual(tet.map(d => d.kind), ['holiday', 'holiday', 'holiday', 'holiday']);
  assert.equal(tet[0].day, 5);
});

test('countdown is counted from today and says when a break is running', () => {
  const item = { start: '2026-12-01' };
  assert.equal(breaks.startsInLabel('2026-11-24', item), 'Còn 7 ngày');
  assert.equal(breaks.startsInLabel('2026-11-30', item), 'Bắt đầu ngày mai');
  assert.equal(breaks.startsInLabel('2026-12-01', item), 'Đang diễn ra');
  assert.equal(breaks.startsInLabel('2026-12-02', item), 'Đang diễn ra');
});

test('summary picks the next, the longest and the longest reachable with one day of leave', () => {
  const summary = plain(breaks.summarizeBreaks(breaks.holidayBreaks('2026-11-24')));
  assert.equal(summary.next.start, '2026-11-24');
  assert.equal(summary.longest.start, '2027-02-05', 'Tết is the longest plain break (4 days)');
  assert.equal(summary.longestWithLeave, null, 'no one-day bridge beats 4 days in this window');
  // Tết 2028: Tất niên Tue 25/1 to Sunday 30/1 is 6 days; leave on Monday 24/1 reaches back to Saturday 22/1.
  const fromMarch = plain(breaks.summarizeBreaks(breaks.holidayBreaks('2027-03-01')));
  assert.deepEqual([fromMarch.longest.start, fromMarch.longest.days], ['2028-01-25', 6]);
  assert.deepEqual([fromMarch.longestWithLeave.item.start, fromMarch.longestWithLeave.days], ['2028-01-25', 9]);
  assert.equal(breaks.summarizeBreaks([]), null);
  const fake = (start, days, bridgeDays) => ({ start, days, bridge: bridgeDays ? { days: bridgeDays } : null });
  const picked = breaks.summarizeBreaks([fake('a', 3, null), fake('b', 1, 4), fake('c', 2, 5)]);
  assert.deepEqual([picked.longest.start, picked.longestWithLeave.item.start, picked.longestWithLeave.days],
    ['a', 'c', 5]);
});

test('range labels name the weekday and end with the year', () => {
  assert.equal(breaks.rangeLabel('2026-11-21', '2026-11-24'), 'Thứ Bảy 21/11 – Thứ Ba 24/11/2026');
  assert.equal(breaks.rangeLabel('2027-09-02', '2027-09-02'), 'Thứ Năm 02/09/2027');
  assert.equal(breaks.breakAnchor({ id: '2027-09-02' }), 'ky-nghi-2027-09-02');
});

test('trips that need the bridge day come after those that do not', () => {
  const item = breakAt('2026-11-01', '2026-11-24');
  const matches = plain(breaks.toursForBreak([
    tour('bridge', 3, ['2026-11-21']),
    tour('plain', 1, ['2026-11-24']),
  ], item));
  assert.deepEqual(matches.map(m => [m.tour.id, m.needsBridge]), [['plain', false], ['bridge', true]]);
  assert.deepEqual(plain(breaks.toursForBreak([tour('none', 2, [])], item)), []);
});
