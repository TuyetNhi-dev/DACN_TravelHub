/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const flightCalendar = loadTs('src/lib/flight-calendar.ts');
const lunar = loadTs('src/lib/lunar-calendar.ts');
const holidays = loadTs('src/lib/vn-holidays.ts', { '@/lib/lunar-calendar': lunar });
const cal = loadTs('src/lib/month-calendar.ts', {
  '@/lib/flight-calendar': flightCalendar,
  '@/lib/lunar-calendar': lunar,
  '@/lib/vn-holidays': holidays,
});

const cellOf = (weeks, date) => weeks.flat().find(cell => cell && cell.date === date);

test('weeks start on Monday and pad days of the neighbouring months', () => {
  assert.deepEqual(plain(cal.WEEK_HEADINGS), ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  // 1 November 2026 is a Sunday: six leading pads, the 1st sits in the Sunday column.
  const november = cal.calendarMonth('2026-11', '2026-11-20');
  assert.deepEqual(plain(november[0].slice(0, 6)), [null, null, null, null, null, null]);
  assert.equal(november[0][6].date, '2026-11-01');
  assert.equal(november[0][6].isSunday, true);
  assert.ok(november.every(week => week.length === 7));
  assert.equal(november.flat().filter(Boolean).length, 30);
  // 1 June 2026 is a Monday: no leading pad.
  assert.equal(cal.calendarMonth('2026-06', '2026-11-20')[0][0].date, '2026-06-01');
  // February 2027 (28 days) starts on a Monday and fills exactly four weeks.
  assert.equal(cal.calendarMonth('2027-02', '2026-11-20').length, 4);
});

test('cells carry the lunar date, holidays, today and Sunday flags', () => {
  const weeks = cal.calendarMonth('2026-02', '2026-02-10');
  const tet = cellOf(weeks, '2026-02-17');
  assert.equal(tet.day, 17);
  assert.equal(tet.lunarLabel, '1/1');
  assert.deepEqual(plain(tet.labelled.map(h => h.kind)), ['official']);
  assert.equal(cellOf(weeks, '2026-02-10').isToday, true);
  assert.equal(cellOf(weeks, '2026-02-11').isToday, false);
  assert.equal(cellOf(weeks, '2026-02-15').isSunday, true);
  assert.equal(cellOf(weeks, '2026-02-16').isSunday, false);
  // Mùng 1 and rằm stay in `holidays` but are not labelled, the lunar label already shows them.
  const julyLeap = cellOf(cal.calendarMonth('2025-07', '2026-01-01'), '2025-07-25');
  assert.equal(julyLeap.lunarLabel, '1/6N');
  assert.equal(julyLeap.labelled.length, 0);
  assert.equal(julyLeap.holidays[0].kind, 'lunar-day');
});

test('lunar labels write the month only on mùng 1', () => {
  assert.equal(cal.lunarCellLabel({ day: 1, month: 2, year: 2026, leap: false }), '1/2');
  assert.equal(cal.lunarCellLabel({ day: 1, month: 6, year: 2025, leap: true }), '1/6N');
  assert.equal(cal.lunarCellLabel({ day: 15, month: 8, year: 2026, leap: false }), '15');
  assert.equal(cal.lunarCellLabel(null), '');
});

test('visible months and keeping a date on screen', () => {
  assert.deepEqual(plain(cal.visibleMonths('2026-12', 2)), ['2026-12', '2027-01']);
  assert.equal(cal.monthShowing('2027-01-05', '2026-12', 2), '2026-12');
  assert.equal(cal.monthShowing('2027-02-05', '2026-12', 2), '2027-01');
  assert.equal(cal.monthShowing('2026-10-05', '2026-12', 2), '2026-10');
  assert.equal(cal.monthShowing('2027-01-05', '2026-12', 1), '2027-01');
});

test('keyboard movement follows the date-picker pattern', () => {
  assert.equal(cal.moveDate('2026-11-30', 'ArrowRight'), '2026-12-01');
  assert.equal(cal.moveDate('2026-12-01', 'ArrowLeft'), '2026-11-30');
  assert.equal(cal.moveDate('2026-11-26', 'ArrowDown'), '2026-12-03');
  assert.equal(cal.moveDate('2026-11-05', 'ArrowUp'), '2026-10-29');
  // Thursday 2026-11-26 → Monday 23, Sunday 29.
  assert.equal(cal.moveDate('2026-11-26', 'Home'), '2026-11-23');
  assert.equal(cal.moveDate('2026-11-26', 'End'), '2026-11-29');
  assert.equal(cal.moveDate('2027-01-31', 'PageDown'), '2027-02-28');
  assert.equal(cal.moveDate('2026-03-31', 'PageUp'), '2026-02-28');
  assert.equal(cal.moveDate('2026-11-26', 'Enter'), null);
  assert.equal(cal.weekdayColumn('2026-11-29'), 6);
});

test('range selection counts nights and restarts on an earlier day', () => {
  let range = cal.EMPTY_RANGE;
  range = cal.pickRange(range, '2026-12-30');
  assert.deepEqual(plain(range), { start: '2026-12-30', end: null });
  assert.equal(cal.nightsOf(range), null);
  range = cal.pickRange(range, '2027-01-02');
  assert.deepEqual(plain(range), { start: '2026-12-30', end: '2027-01-02' });
  assert.equal(cal.nightsOf(range), 3);
  assert.equal(cal.rangePosition('2026-12-31', range), 'middle');
  assert.equal(cal.rangePosition('2026-12-30', range), 'start');
  assert.equal(cal.rangePosition('2027-01-02', range), 'end');
  assert.equal(cal.rangePosition('2027-01-03', range), null);
  assert.deepEqual(plain(cal.pickRange(range, '2027-01-05')), { start: '2027-01-05', end: null });
  assert.deepEqual(plain(cal.pickRange({ start: '2027-01-05', end: null }, '2027-01-05')),
    { start: '2027-01-05', end: null }, 'same day cannot be zero nights');
  assert.deepEqual(plain(cal.pickRange({ start: '2027-01-05', end: null }, '2027-01-01')),
    { start: '2027-01-01', end: null });
});

