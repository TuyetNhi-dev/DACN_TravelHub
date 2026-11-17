/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
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
  vm.runInNewContext(source, { exports, require: name => {
    if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name);
    return dependencies[name];
  } });
  return exports;
}

const format = load('src/lib/format.ts');
const library = load('src/data/photo-library.ts');
const media = load('src/lib/media.ts', { '@/data/photo-library': library, '@/lib/format': format });
const UNSPLASH = /^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?/;

test('every library photo has an id, source page, author and Vietnamese alt text', () => {
  for (const photos of Object.values(library.photoLibrary)) {
    assert.ok(photos.length >= 4);
    for (const photo of photos) {
      assert.match(photo.id, /^\d+-[0-9a-f]+$/);
      assert.ok(photo.page && photo.author && photo.alt.length > 10);
    }
  }
});

test('destinations with their own set are not labelled; others are illustrations', () => {
  const own = media.getDestinationImages('Hạ Long');
  assert.ok(own.length >= 4 && own.length <= 6);
  assert.ok(own.every(image => !image.illustrative && UNSPLASH.test(image.src)));
  assert.equal(media.getDestinationImages('TP. Hồ Chí Minh')[0].illustrative, false);
  const similar = media.getDestinationImages('Quy Nhơn');
  assert.ok(similar.every(image => image.illustrative && image.alt.includes('Quy Nhơn')));
  assert.ok(media.getDestinationImages(null).every(image => image.illustrative));
});

test('tour, hotel and room images are always labelled and stable per id', () => {
  const tour = { id: 'T1', destination: 'Hội An' };
  assert.deepEqual(media.getTourImages(tour), media.getTourImages(tour));
  assert.ok(media.getTourImages(tour).every(image => image.illustrative));
  const hotel = media.getHotelImages({ id: 'H1', city: 'Huế', name: 'KS' });
  assert.equal(hotel.length, 10);
  assert.equal(new Set(hotel.map(image => image.src)).size, 10, 'no photo repeats');
  assert.ok(hotel.every(image => image.illustrative));
  const room = media.getRoomImages({ id: 'R1', name: 'Deluxe' });
  assert.equal(room.length, 2);
});

test('tour galleries hold ten distinct photos covering every stop in the title', () => {
  const tour = { id: 'T1', destination: 'Đà Nẵng', title: 'Khám phá Đà Nẵng – Bà Nà Hills – Hội An' };
  assert.deepEqual(Array.from(media.tourPhotoSets(tour)), ['danang', 'hoian']);
  const images = media.getTourImages(tour);
  assert.equal(images.length, media.DETAIL_GALLERY_SIZE);
  assert.equal(new Set(images.map(image => image.src)).size, images.length);
  assert.match(images[0].alt, /^Đà Nẵng: /);
  assert.match(images[1].alt, /^Hội An: /, 'stops are interleaved so the first tiles differ');
  assert.ok(images.every(image => image.illustrative));
});

test('landmarks map to their photo set and words only match whole words', () => {
  assert.deepEqual(Array.from(media.tourPhotoSets({ destination: 'Ninh Bình', title: 'Tràng An – Tam Cốc' })),
    ['ninhbinh']);
  assert.deepEqual(Array.from(media.tourPhotoSets({ destination: 'Côn Đảo', title: 'Khuê Văn Các' })), []);
});

test('a destination without its own photos borrows a similar set and still fills the gallery', () => {
  const images = media.getTourImages({ id: 'T2', destination: 'Quy Nhơn', title: 'Biển Quy Nhơn' });
  assert.equal(images.length, media.DETAIL_GALLERY_SIZE);
  assert.ok(images.every(image => image.illustrative && /^[^:]+: /.test(image.alt)));
});

test('API images win when present', () => {
  const images = media.getTourImages({ id: 'T1', destination: 'Huế', imageUrls: ['https://cdn.example/a.jpg'] });
  assert.equal(images.length, 1);
  assert.equal(images[0].src, 'https://cdn.example/a.jpg');
  assert.equal(images[0].illustrative, false);
});
