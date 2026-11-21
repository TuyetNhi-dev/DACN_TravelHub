/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

class ApiError extends Error {}
const decode = loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } });
const service = get => loadTs('src/services/tours.ts', { '@/lib/api-client': { apiGet: get }, '@/lib/decode': decode });
const format = loadTs('src/lib/format.ts');
const library = loadTs('src/data/photo-library.ts');
const media = loadTs('src/lib/media.ts', { '@/data/photo-library': library, '@/lib/format': format });

const PHOTO = 'https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&fit=crop&w=1920&q=80';
const tour = {
  id: '1', code: 'TOUR001', title: 'Khám phá Đà Nẵng', destination: 'Đà Nẵng', departureFrom: null, durationDays: 3,
  durationNights: 2, transport: 'Máy bay', basePrice: 2_960_000, description: null, upcomingDepartureDates: [],
};
const detail = (extra = {}) => ({
  tour, itinerary: [], departures: [],
  images: [{ url: PHOTO, alt: 'Đà Nẵng: Cầu Vàng' }, { url: PHOTO + '&b', alt: null }],
  inclusions: { included: ['Xe đưa đón', 'Khách sạn 3 sao'], excluded: ['Thuế VAT'] },
  ...extra,
});

test('tour detail keeps photos in API order (cover first) and both inclusion lists', async () => {
  const value = await service(async () => ({ data: detail() })).getTour('1');

  assert.deepEqual(plain(value.images), [{ url: PHOTO, alt: 'Đà Nẵng: Cầu Vàng' }, { url: PHOTO + '&b', alt: null }]);
  assert.deepEqual(plain(value.inclusions), { included: ['Xe đưa đón', 'Khách sạn 3 sao'], excluded: ['Thuế VAT'] });
});

test('a tour without photos or inclusion lines decodes to empty lists', async () => {
  const empty = detail({ images: [], inclusions: { included: [], excluded: [] } });
  const value = await service(async () => ({ data: empty })).getTour('1');

  assert.equal(value.images.length, 0);
  assert.equal(value.inclusions.included.length + value.inclusions.excluded.length, 0);
});

test('a malformed photo or inclusion list is a contract error, not undefined on the page', async () => {
  const broken = [
    { images: [{ url: 42 }] },
    { images: null },
    { inclusions: { included: ['ok', 7], excluded: [] } },
    { inclusions: { included: [] } },
    { inclusions: null },
  ];
  for (const change of broken) {
    const pending = service(async () => ({ data: detail(change) })).getTour('1');
    await assert.rejects(pending, ApiError, JSON.stringify(change));
  }
});

test('the tour\'s own photos replace the illustrations and keep the library credit', () => {
  const images = media.getTourImages(tour, [{ url: PHOTO, alt: 'Cầu Vàng' }, { url: PHOTO + '&b', alt: null }]);

  assert.equal(images.length, 2);
  assert.ok(images.every(image => !image.illustrative));
  assert.equal(images[0].alt, 'Cầu Vàng');
  assert.equal(images[1].alt, 'Ảnh tour Đà Nẵng 2');
  assert.equal(images[0].author, 'jet dela cruz');
  assert.match(images[0].sourceUrl, /^https:\/\/unsplash\.com\/photos\//);
});

test('photos next/image cannot load are skipped; with none left the labelled illustrations come back', () => {
  const images = media.getTourImages(tour, [{ url: 'https://example.com/a.jpg', alt: 'x' }]);

  assert.ok(images.length >= 4);
  assert.ok(images.every(image => image.illustrative));
  assert.deepEqual(plain(media.getTourImages(tour, [])), plain(media.getTourImages(tour)));
});
