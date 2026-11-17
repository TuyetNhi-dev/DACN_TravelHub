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
  vm.runInNewContext(source, { exports, require: name => dependencies[name] });
  return exports;
}

const groups = load('src/lib/tour-groups.ts', { '@/lib/format': load('src/lib/format.ts') });
const tour = (id, days, transport, open = true, destination = 'Hạ Long') => ({
  id, durationDays: days, transport, destination, upcomingDepartureDates: open ? ['2026-12-01'] : [],
});

test('duration groups have no gaps or overlaps at 3/4 and 5/6 days', () => {
  assert.equal(groups.inTourGroup(tour('a', 3, null), 'weekend'), true);
  assert.equal(groups.inTourGroup(tour('a', 4, null), 'weekend'), false);
  assert.equal(groups.inTourGroup(tour('a', 4, null), 'midweek'), true);
  assert.equal(groups.inTourGroup(tour('a', 5, null), 'midweek'), true);
  assert.equal(groups.inTourGroup(tour('a', 6, null), 'long'), true);
});

test('transport groups read the API label without accents; unknown transport matches neither', () => {
  assert.equal(groups.inTourGroup(tour('a', 3, 'Máy bay'), 'flight'), true);
  assert.equal(groups.inTourGroup(tour('a', 3, 'Ô tô'), 'road'), true);
  assert.equal(groups.inTourGroup(tour('a', 3, 'Ô tô'), 'flight'), false);
  assert.equal(groups.inTourGroup(tour('a', 3, null), 'flight'), false);
  assert.equal(groups.inTourGroup(tour('a', 3, null), 'road'), false);
});

test('bookable tours come first and the limit applies', () => {
  const list = [tour('closed', 2, null, false), tour('o1', 2, null), tour('o2', 3, null), tour('o3', 1, null)];
  // Array.from copies into this realm; arrays built inside vm have a different prototype.
  assert.deepEqual(Array.from(groups.toursInGroup(list, 'weekend', 3), item => item.id), ['o1', 'o2', 'o3']);
});

test('destination counts ignore accents and case', () => {
  const list = [tour('a', 2, null), tour('b', 2, null, true, 'Ha Long'), tour('c', 2, null, true, 'Huế')];
  assert.equal(groups.countByDestination(list, 'hạ long'), 2);
  assert.equal(groups.countByDestination(list, 'Đà Lạt'), 0);
});
