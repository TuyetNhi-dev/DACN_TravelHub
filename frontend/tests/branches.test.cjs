/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: () => ({}) });
  return exports;
}

const lib = load('src/lib/branches.ts');
const branch = (id, region, latitude = 10.7, longitude = 106.7) => ({
  id, code: id, name: id, address: null, region, latitude, longitude, phone: null, openingHours: null,
});

test('phone numbers are grouped for display and dialled without spaces', () => {
  assert.equal(lib.formatPhone('19006886'), '1900 6886');
  assert.equal(lib.formatPhone('02838123456'), '028 3812 3456');
  assert.equal(lib.formatPhone('+84 90'), '+84 90');
  assert.equal(lib.telHref('1900 6886'), 'tel:19006886');
});

test('only branches with both coordinates are pinned', () => {
  assert.equal(lib.hasLocation(branch('a', 'Miền Nam')), true);
  assert.equal(lib.hasLocation(branch('b', 'Miền Nam', null, 106.7)), false);
});

test('regions keep API order, drop blanks and duplicates; empty filter shows all', () => {
  const rows = [branch('a', 'Miền Bắc'), branch('b', null), branch('c', 'Miền Nam'), branch('d', 'Miền Bắc')];
  assert.deepEqual(Array.from(lib.regionsOf(rows)), ['Miền Bắc', 'Miền Nam']);
  assert.equal(lib.inRegion(rows[1], lib.ALL_REGIONS), true);
  assert.equal(lib.inRegion(rows[1], 'Miền Bắc'), false);
});

test('directions link encodes the destination coordinates', () => {
  assert.equal(lib.directionsUrl(branch('a', null, 10.5, 106.25)),
    'https://www.google.com/maps/dir/?api=1&destination=10.5%2C106.25');
});
