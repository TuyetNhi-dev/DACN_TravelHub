/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness compiles isolated TypeScript domain modules and stubs only HTTP. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, dependencies = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, AbortController,
    require: name => { if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name); return dependencies[name]; } });
  return exports;
}
const stayLib = load('src/lib/hotel-stay.ts');
const format = load('src/lib/format.ts');
const apiError = class extends Error { constructor(message, status) { super(message); this.status = status; } };
const service = (get = async () => { throw Error('offline'); }) => load('src/services/hotels.ts', {
  '@/lib/api-client': { apiGet: get, ApiError: apiError },
});
const demo = load('src/data/hotels-demo.ts').demoHotelDetails;
const hotel = { hotelId: 'H01', tenKhachSan: 'Khách sạn', thanhPho: 'Huế', diaChi: null,
  hangSaoDemo: 4, giaTuVndDem: null, tienNghi: null, ghiChu: null, nguonThamKhao: null };
const room = { roomId: 'R01', hotelId: 'H01', loaiPhong: 'Deluxe', sucChua: 2, giaVndDem: 1000000, soPhongCon: 2, loaiDuLieu: 'Demo' };
const stay = { checkIn: '2026-10-25', checkOut: '2026-10-28', guests: 3, rooms: 2 };
const today = '2026-10-19';

test('stay dates cross year and leap day correctly; invalid calendar days are rejected', () => {
  assert.equal(stayLib.stayNights({ checkIn: '2026-12-31', checkOut: '2027-01-02' }), 2);
  assert.equal(stayLib.stayNights({ checkIn: '2028-02-28', checkOut: '2028-03-01' }), 2);
  assert.equal(stayLib.stayNights({ checkIn: '2027-02-29', checkOut: '2027-03-02' }), 0);
  assert.equal(stayLib.stayNights({ checkIn: '2026-04-31', checkOut: '2026-05-02' }), 0);
});
test('today uses Vietnam day at a UTC year boundary', () => {
  assert.equal(stayLib.vietnamToday(new Date('2026-12-31T18:00:00Z')), '2027-01-01');
});
test('rejects missing/partial, same-day, reversed, past and over-30-night bookings', () => {
  for (const dates of [ { checkIn: '', checkOut: '' }, { checkIn: '2026-10-25', checkOut: '' },
    { checkIn: '2026-10-25', checkOut: '2026-10-25' }, { checkIn: '2026-10-28', checkOut: '2026-10-25' },
    { checkIn: '2026-10-18', checkOut: '2026-10-21' }, { checkIn: '2026-10-25', checkOut: '2026-11-25' }]) {
    assert.ok(stayLib.validateStay({ ...stay, ...dates }, today));
  }
  assert.equal(stayLib.validateStay({ ...stay, checkIn: '', checkOut: '' }, today, false), null);
  assert.ok(stayLib.validateStay({ ...stay, checkOut: '' }, today, false));
});
test('validates counts, capacity and catalogue stock; null stock remains unknown', () => {
  assert.equal(stayLib.roomBookingIssue(room, stay, today), null);
  for (const update of [{ guests: 5 }, { guests: 1 }, { rooms: 0 }, { rooms: 3 }, { rooms: 1.5 }, { guests: NaN }, { guests: 21 }]) {
    assert.ok(stayLib.roomBookingIssue(room, { ...stay, ...update }, today));
  }
  assert.ok(stayLib.roomBookingIssue({ ...room, soPhongCon: 0 }, stay, today));
  assert.ok(stayLib.roomBookingIssue({ ...room, sucChua: null }, stay, today));
  assert.equal(stayLib.roomBookingIssue({ ...room, soPhongCon: null }, stay, today), null);
});
test('quote is price × nights × rooms; unknown prices and unsafe totals cannot be booked', () => {
  assert.equal(stayLib.stayTotal(room, stay), 6000000);
  assert.equal(stayLib.stayTotal({ ...room, giaVndDem: 0 }, stay), 0);
  assert.equal(stayLib.stayTotal({ ...room, giaVndDem: null }, stay), null);
  assert.ok(stayLib.roomBookingIssue({ ...room, giaVndDem: null }, stay, today));
  assert.equal(stayLib.stayTotal({ ...room, giaVndDem: Number.MAX_SAFE_INTEGER }, stay), null);
  assert.ok(stayLib.roomBookingIssue({ ...room, giaVndDem: Number.MAX_SAFE_INTEGER }, stay, today));
});
test('query round trip preserves the stay/source without contact details', () => {
  const params = stayLib.stayParams(stay, 'demo');
  assert.equal(params.get('source'), 'demo');
  const parsed = stayLib.parseStay(Object.fromEntries(params));
  assert.equal(JSON.stringify(parsed), JSON.stringify(stay));
  assert.equal(stayLib.parseStay({ guests: 'Infinity', rooms: 'abc' }).guests, 0);
  assert.equal(stayLib.parseStay({ guests: ['2', '3'] }).guests, 2);
  assert.equal([...params.keys()].some(k => /email|phone|name/i.test(k)), false);
});
test('contact validation rejects whitespace names and invalid email/phone', () => {
  assert.equal(stayLib.validateContact('Khách demo', 'khach@example.com', '0900 000 000'), null);
  assert.ok(stayLib.validateContact('  ', 'khach@example.com', '0900000000'));
  assert.ok(stayLib.validateContact('Khách demo', 'invalid', '0900000000'));
  assert.ok(stayLib.validateContact('Khách demo', 'khach@example.com', 'abc0900'));
});

test('shared search normalization handles Vietnamese accents, case and combining characters', () => {
  assert.equal(format.normalizeSearch('  ĐÀ NẴNG  '), 'da nang');
  assert.equal(format.normalizeSearch('Hội An'), format.normalizeSearch('hoi an'));
  assert.equal(format.normalizeSearch('Đắk Lắk'.normalize('NFD')), 'dak lak');
  assert.equal(format.formatCurrency(null), 'Chưa có giá');
  assert.match(format.formatCurrency(0), /^0\s*₫$/);
});

test('cleared search URL drops q while preserving the applied stay and data source', () => {
  const searched = stayLib.stayParams(stay, 'demo', '  Hội An  ');
  assert.equal(searched.get('q'), 'Hội An');
  const cleared = stayLib.stayParams(stay, 'demo');
  assert.equal(cleared.has('q'), false);
  assert.equal(cleared.get('source'), 'demo');
  assert.equal(JSON.stringify(stayLib.parseStay(Object.fromEntries(cleared))), JSON.stringify(stay));
  assert.equal(stayLib.stayParams(stay, 'api', '   ').has('q'), false);
});

test('amenities handle every supported separator, whitespace and missing values consistently', () => {
  assert.equal(stayLib.splitAmenities(null).length, 0);
  assert.equal(JSON.stringify(stayLib.splitAmenities(' Wi-Fi ; ; Hồ bơi, Bữa sáng| Gym\nĐỗ xe ')),
    JSON.stringify(['Wi-Fi', 'Hồ bơi', 'Bữa sáng', 'Gym', 'Đỗ xe']));
});
test('API list/details retain nulls, zero prices and exact room ownership', () => {
  const api = service();
  assert.equal(api.decodeHotels({ data: [hotel], count: 1 })[0].giaTuVndDem, null);
  assert.equal(api.decodeHotels({ data: [], count: 0 }).length, 0);
  const detail = api.decodeHotel({ data: { hotel, rooms: [{ ...room, giaVndDem: 0, soPhongCon: null }] } }, 'H01');
  assert.equal(detail.rooms[0].giaVndDem, 0);
  assert.equal(detail.rooms[0].soPhongCon, null);
});
test('rejects malformed lists, duplicates and negative or fractional prices', () => {
  for (const response of [null, { data: [hotel], count: 2 }, { data: [hotel, hotel], count: 2 },
    { data: [{ ...hotel, giaTuVndDem: -1 }], count: 1 }, { data: [{ ...hotel, giaTuVndDem: 1.5 }], count: 1 },
    { data: [{ ...hotel, hangSaoDemo: 6 }], count: 1 }, { data: [{ hotelId: 'H01' }], count: 1 }]) {
    assert.throws(() => service().decodeHotels(response));
  }
});
test('rejects mismatched hotel/room IDs and duplicate rooms', () => {
  for (const details of [ { hotel: { ...hotel, hotelId: 'H02' }, rooms: [room] },
    { hotel, rooms: [{ ...room, hotelId: 'H02' }] }, { hotel, rooms: [room, room] },
    { hotel, rooms: [{ ...room, sucChua: -1 }] }]) {
    assert.throws(() => service().decodeHotel({ data: details }, 'H01'));
  }
});
test('HTTP uses existing GET paths, encodes ID and forwards cancellation', async () => {
  const controller = new AbortController();
  const calls = [];
  const api = service(async (path, signal) => { calls.push([path, signal]); return path === '/api/hotels' ? { data: [hotel], count: 1 } : { data: { hotel: { ...hotel, hotelId: 'H 01' }, rooms: [] } }; });
  await api.getHotels(controller.signal);
  await api.getHotel('H 01', controller.signal);
  assert.equal(calls[0][0], '/api/hotels');
  assert.equal(calls[1][0], '/api/hotels/H%2001');
  assert.equal(calls[1][1], controller.signal);
});
test('API errors propagate without replacing them with demo data', async () => {
  await assert.rejects(service().getHotels(), /offline/);
  await assert.rejects(service().getHotel('H01'), /offline/);
  await assert.rejects(service().getHotel('this-id-is-too-long'), e => e.status === 404);
});
test('demo fixtures satisfy the real contract and include both bookable and sold-out rooms', () => {
  const api = service();
  assert.equal(api.decodeHotels({ data: demo.map(d => d.hotel), count: demo.length }).length, 4);
  for (const detail of demo) api.decodeHotel({ data: detail }, detail.hotel.hotelId);
  assert.ok(demo.some(d => d.rooms.some(r => r.soPhongCon === 0)));
  assert.ok(demo.some(d => d.rooms.some(r => !stayLib.roomBookingIssue(r, { ...stay, guests: 2, rooms: 1 }, today))));
});
