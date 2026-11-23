/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const lib = loadTs('src/lib/admin-tour-images.ts');
const format = loadTs('src/lib/format.ts');
const library = loadTs('src/data/photo-library.ts');
const media = loadTs('src/lib/media.ts', { '@/data/photo-library': library, '@/lib/format': format });

const PHOTO = 'https://images.unsplash.com/photo-1643029891412-92f9a81a8c16?auto=format&fit=crop&w=1920&q=80';

test('only https Unsplash photo links pass, the same rule as the server', () => {
  assert.equal(lib.isAllowedImageUrl(PHOTO), true);
  assert.equal(lib.isAllowedImageUrl(' https://images.unsplash.com/photo-abc-123 '), true);
  assert.equal(lib.isAllowedImageUrl('http://images.unsplash.com/photo-abc'), false);
  assert.equal(lib.isAllowedImageUrl('https://example.com/photo-abc.jpg'), false);
  assert.equal(lib.isAllowedImageUrl('https://images.unsplash.com/photo-abc?x=<script>'), false);
});

test('rows save in order, trimmed, with an empty caption as null', () => {
  const rows = plain(lib.imageRowsFrom([{ url: PHOTO, altText: null }]));
  assert.deepEqual(rows, [{ url: PHOTO, altText: '' }]);
  assert.deepEqual(plain(lib.toImageInputs([{ url: ` ${PHOTO} `, altText: ' Vịnh ' }, rows[0]])), [
    { url: PHOTO, altText: 'Vịnh' }, { url: PHOTO, altText: null },
  ]);
});

test('library choices are place photos only, captioned with the place, and hide photos already on the tour', () => {
  const choices = plain(media.libraryPhotoChoices());
  assert.ok(choices.length > 0);
  assert.ok(choices.every(choice => lib.isAllowedImageUrl(choice.url)));
  assert.ok(choices.every(choice => choice.alt.startsWith(choice.place + ': ')));
  const ids = new Set([...library.photoLibrary.hotel, ...library.photoLibrary.room].map(photo => photo.id));
  assert.ok(choices.every(choice => ![...ids].some(id => choice.url.includes(id))));
  const unused = plain(lib.unusedChoices(choices, [{ url: choices[0].url, altText: '' }]));
  assert.equal(unused.length, choices.length - 1);
  const groups = plain(lib.groupByPlace(choices));
  assert.equal(groups[0][0], choices[0].place);
});
