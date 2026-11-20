/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { loadTs, plain } = require('./load-ts.cjs');

const SOURCE = 'src/lib/lunar-calendar.ts';
const lunar = loadTs(SOURCE);
const L = (day, month, year, leap = false) => ({ day, month, year, leap });

test('Tết Nguyên Đán matches the published Vietnamese calendar', () => {
  assert.equal(lunar.tetDate(2023), '2023-01-22');
  assert.equal(lunar.tetDate(2024), '2024-02-10');
  assert.equal(lunar.tetDate(2025), '2025-01-29');
  assert.equal(lunar.tetDate(2026), '2026-02-17');
  assert.equal(lunar.tetDate(2027), '2027-02-06');
});

test('UTC+7 gives the Vietnamese Tết where it differs from the Chinese calendar', () => {
  // China (UTC+8) celebrated on 1985-02-20 and 2007-02-18.
  assert.equal(lunar.tetDate(1985), '1985-01-21');
  assert.equal(lunar.tetDate(2007), '2007-02-17');
});

test('leap months', () => {
  assert.equal(lunar.leapMonthOf(2020), 4);
  assert.equal(lunar.leapMonthOf(2023), 2);
  assert.equal(lunar.leapMonthOf(2024), null);
  assert.equal(lunar.leapMonthOf(2025), 6);
  // Tháng 6 nhuận Ất Tỵ starts 2025-07-25, right after the regular tháng 6.
  assert.equal(lunar.lunarToSolar(L(1, 6, 2025, true)), '2025-07-25');
  assert.deepEqual(plain(lunar.solarToLunar('2025-07-25')), L(1, 6, 2025, true));
  assert.deepEqual(plain(lunar.solarToLunar('2025-07-24')), L(30, 6, 2025, false));
  assert.equal(lunar.lunarToSolar(L(1, 5, 2025, true)), null, 'tháng 5 nhuận does not exist in 2025');
  assert.equal(lunar.lunarToSolar(L(1, 6, 2024, true)), null, '2024 has no leap month');
});

test('lunar festivals of recent years', () => {
  // Giỗ Tổ Hùng Vương 10/3 âm
  assert.equal(lunar.lunarToSolar(L(10, 3, 2023)), '2023-04-29');
  assert.equal(lunar.lunarToSolar(L(10, 3, 2024)), '2024-04-18');
  assert.equal(lunar.lunarToSolar(L(10, 3, 2025)), '2025-04-07');
  // Trung thu 15/8 âm
  assert.equal(lunar.lunarToSolar(L(15, 8, 2023)), '2023-09-29');
  assert.equal(lunar.lunarToSolar(L(15, 8, 2024)), '2024-09-17');
  assert.equal(lunar.lunarToSolar(L(15, 8, 2025)), '2025-10-06');
  // Vu Lan 15/7 âm
  assert.equal(lunar.lunarToSolar(L(15, 7, 2024)), '2024-08-18');
  assert.equal(lunar.lunarToSolar(L(15, 7, 2025)), '2025-09-06');
  // Ông Công ông Táo 23 tháng Chạp Giáp Thìn
  assert.equal(lunar.lunarToSolar(L(23, 12, 2024)), '2025-01-22');
});

test('dates before Tết belong to the previous lunar year', () => {
  assert.deepEqual(plain(lunar.solarToLunar('2025-01-28')), L(29, 12, 2024));
  assert.deepEqual(plain(lunar.solarToLunar('2025-01-29')), L(1, 1, 2025));
  assert.equal(lunar.lunarMonthLength(2024, 12), 29);
});

test('can chi of the lunar year', () => {
  assert.equal(lunar.yearCanChi(1984), 'Giáp Tý');
  assert.equal(lunar.yearCanChi(2024), 'Giáp Thìn');
  assert.equal(lunar.yearCanChi(2025), 'Ất Tỵ');
  assert.equal(lunar.yearCanChi(2026), 'Bính Ngọ');
  assert.equal(lunar.yearCanChi(2027), 'Đinh Mùi');
});

test('solar → lunar → solar round-trips and months are 29 or 30 days, 1900–2100', () => {
  const start = lunar.jdFromDate(1, 1, 1900);
  const end = lunar.jdFromDate(31, 12, 2100);
  for (let jd = start; jd <= end; jd += 3) {
    const [d, m, y] = lunar.jdToDate(jd);
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const date = lunar.solarToLunar(iso);
    assert.equal(lunar.lunarToSolar(date), iso, `round trip ${iso}`);
  }
  for (let year = 1900; year <= 2100; year++) {
    const tet = lunar.tetDate(year);
    assert.ok(tet >= `${year}-01-21` && tet <= `${year}-02-20`, `Tết ${year} = ${tet}`);
    for (let month = 1; month <= 12; month++) {
      assert.ok([29, 30].includes(lunar.lunarMonthLength(year, month)), `${month}/${year}`);
    }
  }
});

test('rejects invalid and non-existent dates', () => {
  assert.equal(lunar.solarToLunar('2025-02-29'), null);
  assert.equal(lunar.solarToLunar('2025-1-29'), null);
  assert.equal(lunar.solarToLunar('not a date'), null);
  assert.equal(lunar.lunarToSolar(L(30, 12, 2024)), null, 'tháng Chạp Giáp Thìn has 29 days');
  assert.equal(lunar.lunarToSolar(L(0, 1, 2025)), null);
  assert.equal(lunar.lunarToSolar(L(1, 13, 2025)), null);
});

test('never reads the machine clock or timezone', () => {
  assert.doesNotMatch(readFileSync(SOURCE, 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''), /\bDate\b|Intl\b|toLocale/);
  assert.equal(lunar.formatLunar(L(1, 6, 2025, true)), '1/6 nhuận');
});
