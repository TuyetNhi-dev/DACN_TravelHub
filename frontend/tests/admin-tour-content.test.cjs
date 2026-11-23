/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const lib = loadTs('src/lib/admin-tour-content.ts');

test('itinerary rows follow the day number and save trimmed, renumbered, with empty text as null', () => {
  const rows = plain(lib.dayRowsFrom([
    { dayNumber: 2, title: 'Sa Pa', description: null },
    { dayNumber: 1, title: 'Hà Nội', description: 'Khởi hành' },
  ]));
  assert.deepEqual(rows, [{ title: 'Hà Nội', description: 'Khởi hành' }, { title: 'Sa Pa', description: '' }]);
  assert.deepEqual(plain(lib.toItinerary([{ title: ' Sa Pa ', description: '  ' }, rows[0]])), [
    { dayNumber: 1, title: 'Sa Pa', description: null },
    { dayNumber: 2, title: 'Hà Nội', description: 'Khởi hành' },
  ]);
});

test('a length warning appears only when a non-empty itinerary differs from the duration', () => {
  assert.equal(lib.itineraryWarning(0, 3), null);
  assert.equal(lib.itineraryWarning(3, 3), null);
  assert.equal(lib.itineraryWarning(2, 3), 'Tour 3 ngày nhưng lịch trình có 2 ngày.');
});

test('inclusions split by kind keep their order and join back "bao gồm" first, trimmed', () => {
  const items = [
    { serviceType: 'other', description: 'Chi phí cá nhân', isIncluded: false },
    { serviceType: 'hotel', description: 'Khách sạn 3 sao', isIncluded: true },
    { serviceType: 'meal', description: 'Ăn sáng', isIncluded: true },
  ];
  const { included, excluded } = plain(lib.splitInclusions(items));
  assert.deepEqual(included.map(row => row.description), ['Khách sạn 3 sao', 'Ăn sáng']);
  assert.deepEqual(excluded.map(row => row.description), ['Chi phí cá nhân']);
  const joined = plain(lib.joinInclusions(included, [{ serviceType: 'other', description: ' Tip ' }]));
  assert.deepEqual(joined.map(item => [item.description, item.isIncluded]),
    [['Khách sạn 3 sao', true], ['Ăn sáng', true], ['Tip', false]]);
});

test('row errors read the server key of one field of one row', () => {
  const errors = { 'items[2].description': ['Nội dung cần từ 2 đến 500 ký tự.'], 'days[0].title': ['Quá ngắn'] };
  assert.equal(lib.rowError(errors, 'items', 2, 'description'), 'Nội dung cần từ 2 đến 500 ký tự.');
  assert.equal(lib.rowError(errors, 'days', 0, 'title'), 'Quá ngắn');
  assert.equal(lib.rowError(errors, 'days', 1, 'title'), undefined);
});
