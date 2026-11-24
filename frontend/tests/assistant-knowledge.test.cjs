/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { buildKnowledge, serialize, OUTPUT } = require('../scripts/assistant-knowledge.cjs');

test('backend knowledge file matches the site content (run npm run export:assistant-knowledge)', () => {
  assert.equal(readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n'), serialize(buildKnowledge()));
});

test('every entry has a unique id, a site link and some text', () => {
  const { entries } = buildKnowledge();
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  for (const entry of entries) {
    assert.match(entry.url, /^\/[a-z0-9/-]*#[a-z0-9-]+$/, entry.id);
    assert.ok(entry.title && entry.text.length > 0, entry.id);
  }
  assert.ok(entries.some(e => e.url === '/huy-va-hoan-tien#tu-huy'), 'cancellation policy is included');
});
