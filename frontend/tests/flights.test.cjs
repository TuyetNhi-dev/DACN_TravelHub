/* eslint-disable @typescript-eslint/no-require-imports -- Same isolated TypeScript harness as the existing module tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; } });
  return exports;
}
const format = load('src/lib/format.ts');
const stay = load('src/lib/hotel-stay.ts');
const lib = load('src/lib/flight-search.ts', { '@/lib/format': format, '@/lib/hotel-stay': stay });
const demo = load('src/data/flights-demo.ts', { '@/lib/flight-search': lib });
const search = { from: 'SGN', to: 'HAN', departure: '2099-12-20', returning: '2099-12-22', roundTrip: true, passengers: 2, cabin: 'Phổ thông' };
const rows = demo.demoFlights(search);
const service = (get = async () => { throw Error('offline'); }) => load('src/services/flights.ts', { '@/lib/api-client': { apiGet: get, ApiError: class extends Error {} } });

test('resolves Vietnamese names with accents, without accents and airport codes', () => {
  for (const name of ['Đà Nẵng', 'da nang', 'DAD', 'Nha Trang (CXR)', 'tan son nhat']) assert.ok(lib.airportCode(name));
  assert.equal(lib.airportCode('quoc te khong ton tai'), '');
});
test('rejects invalid calendar dates, past departures, reversed returns and bad passenger counts', () => {
  for (const changes of [{ departure: '2099-02-29' }, { departure: '2020-01-01' }, { returning: '2099-12-19' }, { passengers: 0 }, { passengers: 10 }, { passengers: 1.5 }, { from: 'HAN' }, { cabin: 'unknown' }]) assert.ok(lib.validateFlightSearch({ ...search, ...changes }));
  assert.equal(lib.validateFlightSearch(search), null);
  assert.equal(lib.validFlightDay('2100-02-29'), false);
  assert.equal(lib.validFlightDay('2096-02-29'), true);
});
test('matches exact date, route, cabin and reverse leg without modifying API records', () => {
  assert.equal(lib.matchesFlight(rows[0], search), true);
  assert.equal(lib.matchesFlight(rows[4], search, true), true);
  assert.equal(lib.matchesFlight({ ...rows[0], ngayBay: '2099-12-19' }, search), false);
  assert.equal(lib.matchesFlight({ ...rows[0], hangVe: null }, search), false);
});
test('quote includes both legs and all passengers; unknown/unsafe values cannot produce totals', () => {
  assert.equal(lib.flightTotal([rows[0], rows[4]], 2), 4200000);
  assert.equal(lib.flightTotal([{ ...rows[0], giaVnd: null }], 1), null);
  assert.equal(lib.flightTotal([{ ...rows[0], giaVnd: Number.MAX_SAFE_INTEGER }], 2), null);
  assert.equal(lib.flightTotal([{ ...rows[0], giaVnd: 0 }], 1), 0);
  assert.equal(lib.flightTotal([], 1), null);
});
test('booking requires exact legs, sufficient catalogue stock and valid return chronology', () => {
  assert.equal(lib.flightBookingIssue([rows[0], rows[4]], search), null);
  assert.ok(lib.flightBookingIssue([rows[0]], search));
  assert.ok(lib.flightBookingIssue([rows[0], rows[3]], search));
  assert.ok(lib.flightBookingIssue([rows[3], rows[4]], search));
  const sameDay = { ...search, returning: search.departure };
  assert.ok(lib.flightBookingIssue([rows[0], { ...rows[4], ngayBay: search.departure }], sameDay));
  assert.equal(lib.flightBookingIssue([rows[0], { ...rows[5], ngayBay: search.departure }], sameDay), null);
});
test('demo is separated, explicitly labelled, supports cabin and both selected dates', () => {
  assert.equal(rows.length, 8);
  assert.ok(rows.every(f => /demo/.test(f.nguonThamKhao)));
  assert.equal(demo.demoFlights({ ...search, roundTrip: false }).length, 4);
  assert.equal(demo.demoFlights({ ...search, cabin: 'Thương gia' })[0].hangVe, 'Thương gia');
  assert.equal(service().decodeFlights({ data: rows, count: rows.length }).length, 8);
});
test('API decoding preserves unknowns and rejects malformed, duplicate and negative data', () => {
  const api = service();
  const unknown = { ...rows[0], giaVnd: null, soGheCon: null };
  assert.equal(api.decodeFlights({ data: [unknown], count: 1 })[0].giaVnd, null);
  for (const payload of [null, { data: rows, count: 1 }, { data: [rows[0], rows[0]], count: 2 }, { data: [{ ...rows[0], giaVnd: -1 }], count: 1 }, { data: [{ flightId: 'X' }], count: 1 }]) assert.throws(() => api.decodeFlights(payload));
});
test('uses only GET /api/flights and forwards cancellation; errors never return synthetic rows', async () => {
  const marker = {};
  await service(async (path, signal) => { assert.equal(path, '/api/flights'); assert.equal(signal, marker); return { data: [], count: 0 }; }).getFlights(marker);
  await assert.rejects(service().getFlights(), /offline/);
});
test('passenger/contact values never use storage, URLs or backend mutations', () => {
  const ui = readFileSync('src/components/flights/FlightPage.tsx', 'utf8');
  assert.doesNotMatch(ui, /localStorage\.(setItem|getItem)|sessionStorage\.|method:\s*["']POST/);
  const urlBody = ui.slice(ui.indexOf('function url('), ui.indexOf('function submitSearch('));
  assert.doesNotMatch(urlBody, /contact|names|email|phone/);
});
