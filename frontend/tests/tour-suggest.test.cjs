/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const lib = loadTs('src/lib/tour-suggest.ts', { '@/lib/format': format });

const suggestions = {
  destinations: [{ id: '8', name: 'Đà Lạt', tourCount: 4 }],
  tours: [{ id: '15', code: 'SH-MN-004', title: 'Đà Lạt 3N2Đ', destination: 'Đà Lạt', basePrice: 2_990_000 }],
};

test('nothing is asked for one letter or less', () => {
  assert.equal(lib.canSuggest(''), false);
  assert.equal(lib.canSuggest('  đ '), false);
  assert.equal(lib.canSuggest('đà'), true);
});

test('destinations come first, then tours, then a plain search of the typed text', () => {
  const options = plain(lib.suggestOptions(' đà lạt ', suggestions));
  assert.deepEqual(options.map(o => o.kind), ['destination', 'tour', 'search']);
  assert.equal(options[0].href, '/tours?destination=%C4%90%C3%A0+L%E1%BA%A1t');
  assert.equal(options[0].detail, '4 tour');
  assert.equal(options[1].href, '/tours/15');
  assert.match(options[1].detail, /^Đà Lạt · SH-MN-004 · Từ 2\.990\.000/);
  assert.equal(options[2].label, 'Tìm “đà lạt”');
  assert.equal(options[2].href, '/tours?q=%C4%91%C3%A0+l%E1%BA%A1t');
  assert.equal(new Set(options.map(o => o.key)).size, options.length);
});

test('while suggestions load or fail, the plain search is still offered', () => {
  assert.deepEqual(plain(lib.suggestOptions('hue', null)).map(o => o.kind), ['search']);
});

test('arrow keys wrap around the list and start from either end', () => {
  assert.equal(lib.moveActive(-1, 1, 3), 0);
  assert.equal(lib.moveActive(-1, -1, 3), 2);
  assert.equal(lib.moveActive(2, 1, 3), 0);
  assert.equal(lib.moveActive(0, -1, 3), 2);
  assert.equal(lib.moveActive(0, 1, 0), -1);
});
