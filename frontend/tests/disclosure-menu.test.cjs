/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const menu = loadTs('src/lib/disclosure-menu.ts');

test('arrow keys wrap around the items, Home/End jump to the ends', () => {
  assert.equal(menu.nextItemIndex(-1, 'ArrowDown', 5), 0, 'from the button to the first link');
  assert.equal(menu.nextItemIndex(0, 'ArrowDown', 5), 1);
  assert.equal(menu.nextItemIndex(4, 'ArrowDown', 5), 0, 'wraps to the first');
  assert.equal(menu.nextItemIndex(0, 'ArrowUp', 5), 4, 'wraps to the last');
  assert.equal(menu.nextItemIndex(-1, 'ArrowUp', 5), 4);
  assert.equal(menu.nextItemIndex(3, 'ArrowUp', 5), 2);
  assert.equal(menu.nextItemIndex(3, 'Home', 5), 0);
  assert.equal(menu.nextItemIndex(1, 'End', 5), 4);
  assert.equal(menu.nextItemIndex(1, 'Tab', 5), null, 'Tab keeps its native behaviour');
  assert.equal(menu.nextItemIndex(0, 'ArrowDown', 0), null);
});

test('keys on the menu button', () => {
  assert.equal(menu.triggerKeyAction('ArrowDown', false), 'open-first');
  assert.equal(menu.triggerKeyAction('ArrowUp', true), 'open-last');
  assert.equal(menu.triggerKeyAction('Escape', true), 'close');
  assert.equal(menu.triggerKeyAction('Escape', false), null);
  assert.equal(menu.triggerKeyAction('Enter', false), null, 'Enter/Space are native button clicks');
});

test('a click pins a hover-opened menu, a second click closes it', () => {
  assert.deepEqual(plain(menu.afterClick({ open: false, pinned: false })), { open: true, pinned: true });
  assert.deepEqual(plain(menu.afterClick({ open: true, pinned: false })), { open: true, pinned: true });
  assert.deepEqual(plain(menu.afterClick({ open: true, pinned: true })), { open: false, pinned: false });
  assert.ok(menu.CLOSE_DELAY_MS > 0 && menu.CLOSE_DELAY_MS <= 500);
});

test('current page detection does not match a longer sibling slug', () => {
  assert.ok(menu.isCurrentPath('/dich-vu/visa', '/dich-vu/visa'));
  assert.ok(menu.isCurrentPath('/dich-vu/visa/chi-tiet', '/dich-vu/visa'));
  assert.equal(menu.isCurrentPath('/dich-vu/visa-nhat', '/dich-vu/visa'), false);
  assert.equal(menu.isCurrentPath('/', '/dich-vu/visa'), false);
});
