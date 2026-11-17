/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const stayLib = loadTs('src/lib/hotel-stay.ts', { '@/lib/format': format });
const filters = loadTs('src/lib/hotel-filters.ts', { '@/lib/format': format });
class ApiError extends Error {}
const service = get => loadTs('src/services/hotels.ts', {
  '@/lib/api-client': { apiGet: get },
  '@/lib/decode': loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } }),
});

const today = '2026-11-17';
const stay = { checkIn: '2026-12-30', checkOut: '2027-01-02', guests: 3, rooms: 2 };
const room = { id: 'R1', name: 'Deluxe', maxGuests: 2, description: null, referencePricePerNight: 1_000_000,
  offerTerms: null };
const hotel = (id, name, city, price, stars) => ({
  id, name, city, address: null, starRating: stars, description: null, referencePricePerNight: price,
});
const hotels = [
  hotel('1', 'Sea Breeze', 'Nha Trang', 900_000, 3),
  hotel('2', 'Old Town Inn', 'Hội An', null, 4),
  hotel('3', 'River Palace', 'Đà Nẵng', 2_500_000, 5),
];

test('nights cross the new year and leap days; impossible calendar days count as zero', () => {
  assert.equal(stayLib.stayNights(stay), 3);
  assert.equal(stayLib.stayNights({ checkIn: '2028-02-28', checkOut: '2028-03-01' }), 2);
  assert.equal(stayLib.stayNights({ checkIn: '2027-02-29', checkOut: '2027-03-01' }), 0);
  assert.equal(stayLib.stayNights({ checkIn: '2026-12-30', checkOut: '2026-12-30' }), 0);
  assert.equal(stayLib.addDays('2026-12-31', 1), '2027-01-01');
});

test('stay validation mirrors the server rules', () => {
  assert.equal(stayLib.validateStay(stay, today), null);
  for (const change of [{ checkIn: '2026-11-16' }, { checkOut: '2026-12-30' }, { checkOut: '2027-02-01' },
    { rooms: 0 }, { rooms: 11 }, { guests: 1 }, { guests: 41, rooms: 2 }, { guests: 2.5 }])
    assert.ok(stayLib.validateStay({ ...stay, ...change }, today), JSON.stringify(change));
});

test('a room type needs enough capacity and a partner price; the estimate covers nights × rooms', () => {
  assert.equal(stayLib.roomIssue(room, stay, today), null);
  assert.match(stayLib.roomIssue(room, { ...stay, guests: 5 }, today), /tối đa 2 khách/);
  assert.match(stayLib.roomIssue({ ...room, referencePricePerNight: null }, stay, today), /chưa có giá/);
  assert.equal(stayLib.stayEstimate(room, stay), 6_000_000);
  assert.equal(stayLib.stayEstimate({ ...room, referencePricePerNight: null }, stay), null);
});

test('URL parameters fall back to tomorrow for one night when missing or invalid', () => {
  assert.deepEqual(plain(stayLib.parseStay({}, today)),
    { checkIn: '2026-11-18', checkOut: '2026-11-19', guests: 2, rooms: 1 });
  const parsed = stayLib.parseStay({ checkIn: '2026-12-30', guests: '-1', rooms: ['2'] }, today);
  assert.equal(parsed.checkIn, '2026-12-30');
  assert.equal(parsed.guests, 2);
  assert.equal(parsed.rooms, 1);
  assert.equal(stayLib.stayParams(stay).toString(), 'checkIn=2026-12-30&checkOut=2027-01-02&guests=3&rooms=2');
});

test('filters search without accents, keep unpriced hotels last and never mutate the input', () => {
  const ids = change => filters.filterHotels(hotels, { ...filters.EMPTY_HOTEL_FILTERS, ...change }).map(h => h.id);
  assert.deepEqual(plain(ids({ query: 'hoi an' })), ['2']);
  assert.deepEqual(plain(ids({ sort: 'low' })), ['1', '3', '2']);
  assert.deepEqual(plain(ids({ sort: 'high' })), ['3', '1', '2']);
  assert.deepEqual(plain(ids({ sort: 'stars' })), ['3', '2', '1']);
  assert.deepEqual(plain(ids({ maxPrice: '1000000' })), ['1']);
  assert.deepEqual(plain(ids({ stars: '4' })), ['2']);
  assert.equal(hotels[0].id, '1');
});

test('amenities are read from the seed description format', () => {
  assert.deepEqual(plain(filters.amenitiesOf('Gần biển. Tiện nghi: Hồ bơi, Wi-Fi , Gym.')),
    ['Hồ bơi', 'Wi-Fi', 'Gym']);
  assert.deepEqual(plain(filters.amenitiesOf(null)), []);
});

test('the service decodes hotel detail and rejects a malformed envelope', async () => {
  const amenity = { code: 'pool', name: 'Hồ bơi ngoài trời', category: 'wellness', isHighlight: true, isPaid: false };
  const houseRules = { checkInFrom: '14:00', checkOutUntil: null, policies: [{ type: 'pets', content: 'Không.' }] };
  const detail = { hotel: hotels[0], roomTypes: [room], amenities: [amenity], houseRules };
  const ok = service(async path => { assert.equal(path, '/api/hotels/a%2Fb'); return { data: detail }; });
  const decoded = await ok.getHotel('a/b');
  assert.equal(decoded.roomTypes[0].maxGuests, 2);
  assert.equal(decoded.amenities[0].isHighlight, true);
  assert.equal(decoded.houseRules.checkOutUntil, null);
  const noRules = service(async () => ({ data: { ...detail, houseRules: null } }));
  await assert.rejects(noRules.getHotel('1'), /khách sạn/);
  const badFlag = service(async () => ({ data: { ...detail, amenities: [{ ...amenity, isPaid: 'no' }] } }));
  await assert.rejects(badFlag.getHotel('1'), /khách sạn/);
  const bad = service(async () => ({ data: { hotel: null, roomTypes: [] } }));
  await assert.rejects(bad.getHotel('1'), /khách sạn/);
  const list = service(async () => ({ data: hotels, count: 2 }));
  await assert.rejects(list.getHotels(), /khách sạn/);
});
