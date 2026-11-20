/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const lunar = loadTs('src/lib/lunar-calendar.ts');
const holidays = loadTs('src/lib/vn-holidays.ts', { '@/lib/lunar-calendar': lunar });

const on = date => plain(holidays.holidaysOn(date));
const names = date => on(date).map(h => `${h.kind}:${h.name}`);

test('solar official holidays', () => {
  for (const date of ['2025-01-01', '2025-04-30', '2025-05-01', '2025-09-02']) {
    assert.ok(holidays.isOfficialHoliday(date), date);
    assert.equal(on(date).find(h => h.kind === 'official').calendar, 'solar');
  }
  assert.match(on('2025-09-02').find(h => h.kind === 'official').note, /1 ngày liền kề/);
  assert.equal(holidays.isOfficialHoliday('2025-03-15'), false);
});

test('Ngày Văn hóa Việt Nam 24/11 is official only from 2026', () => {
  assert.deepEqual(names('2026-11-24'), ['official:Ngày Văn hóa Việt Nam']);
  assert.match(on('2026-11-24')[0].note, /28\/2026\/QH16/);
  assert.ok(holidays.isOfficialHoliday('2027-11-24'));
  assert.equal(holidays.isOfficialHoliday('2025-11-24'), false);
  assert.ok(!names('2025-11-24').some(n => n.includes('Văn hóa')));
  assert.ok(!plain(holidays.holidaysInYear(2020)).some(h => h.name === 'Ngày Văn hóa Việt Nam'));
});

test('Tết 2026: Tất niên and mùng 1–3 are official and carry the yearly-schedule note', () => {
  assert.deepEqual(names('2026-02-16'), ['official:Tất niên (ngày cuối năm âm lịch)']);
  assert.deepEqual(names('2026-02-17'), ['official:Tết Nguyên Đán (mùng 1)']);
  assert.deepEqual(names('2026-02-19'), ['official:Tết Nguyên Đán (mùng 3)']);
  assert.equal(holidays.isOfficialHoliday('2026-02-20'), false, 'mùng 4 depends on the yearly decision');
  assert.match(on('2026-02-17')[0].note, /Thủ tướng/);
});

test('Giỗ Tổ is an official lunar holiday', () => {
  assert.deepEqual(names('2025-04-07'), ['official:Giỗ Tổ Hùng Vương']);
  assert.equal(on('2025-04-07')[0].calendar, 'lunar');
});

test('traditional festivals are marked as such, not as days off', () => {
  assert.deepEqual(names('2025-02-12'), ['traditional:Tết Nguyên Tiêu (rằm tháng Giêng)']);
  assert.deepEqual(names('2025-09-06'), ['traditional:Lễ Vu Lan (rằm tháng Bảy)']);
  assert.deepEqual(names('2025-10-06'), ['traditional:Tết Trung thu']);
  assert.deepEqual(names('2025-01-22'), ['traditional:Ông Công ông Táo']);
  assert.equal(holidays.isOfficialHoliday('2025-10-06'), false);
});

test('mùng 1 and rằm of each month, leap month included, without duplicating named days', () => {
  assert.deepEqual(names('2025-07-25'), ['lunar-day:Mùng 1 tháng 6 nhuận']);
  assert.deepEqual(names('2025-08-08'), ['lunar-day:Rằm tháng 6 nhuận']);
  assert.ok(!names('2025-01-29').some(n => n.startsWith('lunar-day')), 'mùng 1 Tết is not repeated');
  const monthly = plain(holidays.holidaysInYear(2025)).filter(h => h.kind === 'lunar-day');
  // 2025 spans 13 lunar new moons and full moons minus those taken by named holidays.
  assert.ok(monthly.length >= 18 && monthly.length <= 26, String(monthly.length));
});

const upcoming = (today, count) => plain(holidays.upcomingHolidays(today, count))
  .map(({ holiday, daysLeft }) => `${holiday.date} ${holiday.kind}:${holiday.name} +${daysLeft}`);

test('upcoming holidays skip mùng 1/rằm and count days from today', () => {
  assert.deepEqual(upcoming('2026-11-20'), [
    '2026-11-24 official:Ngày Văn hóa Việt Nam +4',
    '2027-01-01 official:Tết Dương lịch +42',
    '2027-01-30 traditional:Ông Công ông Táo +71',
  ]);
  assert.equal(upcoming('2026-11-24', 1)[0], '2026-11-24 official:Ngày Văn hóa Việt Nam +0', 'today counts');
});

test('upcoming holidays show Tết once, not Tất niên and each mùng', () => {
  assert.deepEqual(upcoming('2027-02-01'), [
    '2027-02-06 official:Tết Nguyên Đán +5',
    '2027-02-20 traditional:Tết Nguyên Tiêu (rằm tháng Giêng) +19',
    '2027-04-16 official:Giỗ Tổ Hùng Vương +74',
  ]);
  // On mùng 2 the remaining Tết days still appear once.
  assert.equal(upcoming('2027-02-07', 1)[0], '2027-02-07 official:Tết Nguyên Đán +0');
  assert.deepEqual(upcoming('20-11-2026'), []);
  assert.deepEqual(upcoming('2026-11-20', 0), []);
});

test('a year is sorted, stays inside the year and a range spans year ends', () => {
  const year = plain(holidays.holidaysInYear(2026));
  assert.ok(year.every(h => h.date.startsWith('2026-')));
  assert.deepEqual(year.map(h => h.date), [...year.map(h => h.date)].sort());
  const range = plain(holidays.holidaysBetween('2025-12-30', '2026-01-02'));
  assert.ok(range.some(h => h.date === '2026-01-01' && h.name === 'Tết Dương lịch'));
  assert.deepEqual(plain(holidays.holidaysBetween('2026-01-02', '2026-01-01')), []);
});
