/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const assistant = loadTs('src/lib/assistant.ts');

const line = (id, role, text) => ({ id, role, text, tours: [], sources: [] });

test('a question must have text and fit the server limit', () => {
  assert.equal(assistant.canSend(''), false);
  assert.equal(assistant.canSend('   '), false);
  assert.ok(assistant.canSend('Tour Đà Lạt'));
  assert.ok(assistant.canSend('a'.repeat(500)));
  assert.equal(assistant.canSend('a'.repeat(501)), false);
});

test('history keeps the last six lines and clips long answers', () => {
  const lines = Array.from({ length: 9 }, (_, i) => line(i, i % 2 ? 'assistant' : 'user', 'Dòng ' + i));
  lines.push(line(9, 'assistant', 'x'.repeat(2000)));
  const history = plain(assistant.buildHistory(lines));
  assert.equal(history.length, assistant.MAX_HISTORY_ITEMS);
  assert.deepEqual(history[0], { role: 'user', text: 'Dòng 4' });
  assert.equal(history.at(-1).text.length, 1500);
  assert.ok(history.every(item => !('tours' in item)), 'cards are never sent back');
});

test('fallback search link carries the question', () => {
  assert.equal(assistant.searchHref('Đi Đà Lạt tháng 12'), '/tours?q=%C4%90i+%C4%90%C3%A0+L%E1%BA%A1t+th%C3%A1ng+12');
  assert.equal(assistant.searchHref('  '), '/tours');
});

test('length hint appears near the limit', () => {
  assert.equal(assistant.lengthHint('a'.repeat(100)), null);
  assert.equal(assistant.lengthHint('a'.repeat(450)), '450/500');
});

test('the three suggested questions', () => {
  assert.deepEqual([...assistant.ASSISTANT_SUGGESTIONS], [
    'Tour Tết 3 ngày từ Sài Gòn dưới 5 triệu', 'Chính sách hủy tour', 'Đi Đà Lạt tháng 12',
  ]);
});
